import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    PayloadTooLargeException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ThemesService } from '../themes/themes.service';

/**
 * ThemeEditorService — safely exposes the active theme's source directory to
 * the admin's Code Editor. All paths are resolved against the active theme's
 * directory and validated to prevent traversal. Only a whitelist of extensions
 * is readable/writable; node_modules, build output, and env files are always
 * blocked regardless of extension.
 *
 * Gated via PackageLimit.THEME_CODE_EDIT at the controller level.
 */
@Injectable()
export class ThemeEditorService {
    private readonly MAX_READ_BYTES = 1_000_000; // 1 MB
    private readonly MAX_WRITE_BYTES = 500_000; // 500 KB
    private readonly MAX_TREE_ENTRIES = 5_000;

    /** File extensions editors are allowed to open and save. */
    private readonly ALLOWED_EXTENSIONS = new Set<string>([
        '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
        '.css', '.scss', '.sass', '.less',
        '.html', '.htm', '.xml', '.svg',
        '.json', '.md', '.mdx', '.txt', '.yml', '.yaml',
        '.env.example', // allow reading the example, not real .env
    ]);

    /** Absolute-or-relative paths that are always blocked. */
    private readonly BLOCKED_PATHS = [
        'node_modules',
        '.next',
        '.git',
        'dist',
        'build',
        'out',
        '.turbo',
        '.vercel',
    ];

    /** Individual file names that are always blocked regardless of location. */
    private readonly BLOCKED_FILES = new Set<string>([
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
        '.env.development.local',
        '.env.production.local',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.DS_Store',
    ]);

    constructor(private readonly themesService: ThemesService) {}

    /** Return the absolute path to the active theme, or throw if none is set. */
    private async getActiveThemeRoot(): Promise<string> {
        const activeThemeName = await this.themesService.getActiveTheme();
        if (!activeThemeName) {
            throw new NotFoundException('No active theme is set. Activate a theme first.');
        }
        const themePath = this.themesService.findThemePath(activeThemeName);
        if (!themePath || !fs.existsSync(themePath)) {
            throw new NotFoundException(`Active theme "${activeThemeName}" directory not found.`);
        }
        return path.resolve(themePath);
    }

    /**
     * Resolve a user-supplied relative path against the active theme root and
     * ensure the result stays inside that root. Any attempt at `..` escapes or
     * absolute paths is rejected with 403.
     */
    private async resolveSafe(relativePath: string | undefined): Promise<{ root: string; abs: string; rel: string }> {
        if (relativePath === undefined || relativePath === null) {
            throw new BadRequestException('Missing "path" query parameter.');
        }
        // Normalize separators
        const normalized = relativePath.replace(/\\/g, '/').trim();
        if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
            throw new ForbiddenException('Absolute paths are not allowed.');
        }

        const root = await this.getActiveThemeRoot();
        const abs = path.resolve(root, normalized);

        // Strict containment check: abs must be root or a descendant.
        const rel = path.relative(root, abs);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
            throw new ForbiddenException('Path traversal attempt blocked.');
        }

        // Enforce blocklists on every segment.
        const segments = rel.split(path.sep).filter(Boolean);
        for (const seg of segments) {
            if (this.BLOCKED_PATHS.includes(seg)) {
                throw new ForbiddenException(`Access to "${seg}" is blocked.`);
            }
            if (this.BLOCKED_FILES.has(seg)) {
                throw new ForbiddenException(`Access to "${seg}" is blocked.`);
            }
        }

        return { root, abs, rel: rel || '.' };
    }

    private isExtensionAllowed(filePath: string): boolean {
        const name = path.basename(filePath);
        // Allow .env.example as a literal match
        if (name === '.env.example') return true;
        // Block any .env* file just in case
        if (name.startsWith('.env')) return false;
        const ext = path.extname(name).toLowerCase();
        return this.ALLOWED_EXTENSIONS.has(ext);
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Build a recursive tree of the active theme. Excludes blocked dirs/files. */
    async getTree(): Promise<any> {
        const root = await this.getActiveThemeRoot();
        let entryCount = 0;

        const walk = (dir: string, relDir: string): any => {
            if (entryCount > this.MAX_TREE_ENTRIES) return null;
            const entries: any[] = [];
            let dirents: fs.Dirent[];
            try {
                dirents = fs.readdirSync(dir, { withFileTypes: true });
            } catch {
                return { name: path.basename(dir), path: relDir, type: 'dir', children: [] };
            }
            for (const d of dirents) {
                const name = d.name;
                if (this.BLOCKED_FILES.has(name)) continue;
                if (d.isDirectory() && this.BLOCKED_PATHS.includes(name)) continue;
                if (name.startsWith('.') && name !== '.env.example') {
                    // Skip hidden dotfiles (but allow .env.example)
                    continue;
                }

                const absChild = path.join(dir, name);
                const relChild = path.join(relDir, name).replace(/\\/g, '/');

                if (d.isDirectory()) {
                    entryCount++;
                    entries.push({
                        name,
                        path: relChild,
                        type: 'dir',
                        children: walk(absChild, relChild)?.children ?? [],
                    });
                } else if (d.isFile()) {
                    entryCount++;
                    const editable = this.isExtensionAllowed(absChild);
                    let size = 0;
                    try { size = fs.statSync(absChild).size; } catch { }
                    entries.push({
                        name,
                        path: relChild,
                        type: 'file',
                        size,
                        editable,
                        language: this.detectLanguage(name),
                    });
                }
            }
            // Directories first, alphabetical; then files alphabetical
            entries.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            return { name: path.basename(dir), path: relDir, type: 'dir', children: entries };
        };

        return walk(root, '');
    }

    /** Read a file's text contents. */
    async readFile(relPath: string): Promise<{ path: string; content: string; size: number; language: string }> {
        const { abs, rel } = await this.resolveSafe(relPath);
        if (!fs.existsSync(abs)) throw new NotFoundException(`File not found: ${rel}`);
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) throw new BadRequestException('Path is a directory.');
        if (stat.size > this.MAX_READ_BYTES) {
            throw new PayloadTooLargeException(
                `File is too large to open in the editor (${stat.size} bytes, max ${this.MAX_READ_BYTES}).`,
            );
        }
        if (!this.isExtensionAllowed(abs)) {
            throw new ForbiddenException('This file type cannot be edited from the admin.');
        }
        const content = fs.readFileSync(abs, 'utf8');
        return {
            path: rel,
            content,
            size: stat.size,
            language: this.detectLanguage(abs),
        };
    }

    /** Write a file (must already exist OR use createFile to create). */
    async writeFile(relPath: string, content: string): Promise<{ path: string; size: number }> {
        const { abs, rel } = await this.resolveSafe(relPath);
        if (!fs.existsSync(abs)) {
            throw new NotFoundException(`File not found: ${rel}. Use create endpoint to make a new file.`);
        }
        if (fs.statSync(abs).isDirectory()) throw new BadRequestException('Path is a directory.');
        if (!this.isExtensionAllowed(abs)) {
            throw new ForbiddenException('This file type cannot be edited from the admin.');
        }
        if (typeof content !== 'string') throw new BadRequestException('content must be a string.');
        const byteLength = Buffer.byteLength(content, 'utf8');
        if (byteLength > this.MAX_WRITE_BYTES) {
            throw new PayloadTooLargeException(
                `File is too large to save (${byteLength} bytes, max ${this.MAX_WRITE_BYTES}).`,
            );
        }

        fs.writeFileSync(abs, content, 'utf8');
        return { path: rel, size: byteLength };
    }

    /** Create a new file at a relative path. Refuses if already exists. */
    async createFile(relPath: string, content: string = ''): Promise<{ path: string; size: number }> {
        const { abs, rel } = await this.resolveSafe(relPath);
        if (fs.existsSync(abs)) {
            throw new BadRequestException(`File already exists: ${rel}`);
        }
        if (!this.isExtensionAllowed(abs)) {
            throw new ForbiddenException('This file type cannot be created from the admin.');
        }
        const byteLength = Buffer.byteLength(content, 'utf8');
        if (byteLength > this.MAX_WRITE_BYTES) {
            throw new PayloadTooLargeException(
                `File is too large (${byteLength} bytes, max ${this.MAX_WRITE_BYTES}).`,
            );
        }

        // Ensure parent dir exists (within the theme)
        const parent = path.dirname(abs);
        if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });

        fs.writeFileSync(abs, content, 'utf8');
        return { path: rel, size: byteLength };
    }

    /** Delete a file (not a directory). */
    async deleteFile(relPath: string): Promise<{ path: string; deleted: true }> {
        const { abs, rel } = await this.resolveSafe(relPath);
        if (!fs.existsSync(abs)) throw new NotFoundException(`File not found: ${rel}`);
        if (fs.statSync(abs).isDirectory()) {
            throw new BadRequestException('Directory deletion is not supported from the admin.');
        }
        if (!this.isExtensionAllowed(abs)) {
            throw new ForbiddenException('This file type cannot be deleted from the admin.');
        }
        fs.unlinkSync(abs);
        return { path: rel, deleted: true };
    }

    /** Map a filename to a Monaco-compatible language id for the UI. */
    private detectLanguage(filePath: string): string {
        const name = path.basename(filePath);
        const ext = path.extname(name).toLowerCase();
        switch (ext) {
            case '.ts': case '.tsx': return 'typescript';
            case '.js': case '.jsx': case '.mjs': case '.cjs': return 'javascript';
            case '.css': return 'css';
            case '.scss': case '.sass': return 'scss';
            case '.less': return 'less';
            case '.html': case '.htm': return 'html';
            case '.xml': case '.svg': return 'xml';
            case '.json': return 'json';
            case '.md': case '.mdx': return 'markdown';
            case '.yml': case '.yaml': return 'yaml';
            default: return 'plaintext';
        }
    }

    /**
     * Ask the theme to revalidate. Best-effort — failures are swallowed so a
     * successful file save is not rolled back if the theme is down.
     */
    async pingRevalidate(): Promise<{ revalidated: boolean; message?: string }> {
        try {
            const config = await this.themesService.getActiveThemeConfig().catch(() => null as any);
            const themeUrl = process.env.THEME_URL || config?.deployedUrl || 'http://localhost:3003';
            const secret = process.env.REVALIDATE_SECRET;
            if (!secret) return { revalidated: false, message: 'No REVALIDATE_SECRET configured.' };

            const url = `${themeUrl.replace(/\/$/, '')}/api/revalidate?secret=${encodeURIComponent(secret)}&path=/`;
            const res = await fetch(url, { method: 'POST' });
            return { revalidated: res.ok, message: res.ok ? undefined : `Theme responded with ${res.status}` };
        } catch (err: any) {
            return { revalidated: false, message: err?.message ?? 'unknown error' };
        }
    }
}
