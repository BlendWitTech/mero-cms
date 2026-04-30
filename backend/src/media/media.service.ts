import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as ffmpeg from 'fluent-ffmpeg';
import * as process from 'process';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Handle ffmpeg paths defensively
try {
    const ffmpegInstaller = require('ffmpeg-static');
    const ffprobeInstaller = require('ffprobe-static');
    ffmpeg.setFfmpegPath(ffmpegInstaller);
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
} catch (e) {
    console.warn('FFmpeg static binaries not found, video processing might fail.', e);
}

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);
    private s3Client: S3Client | null = null;

    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService
    ) { }

    private async configureCloudinary() {
        const settings = await this.settingsService.findAll();
        const cloudName = settings['cloudinary_cloud_name'] || process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = settings['cloudinary_api_key'] || process.env.CLOUDINARY_API_KEY;
        const apiSecret = settings['cloudinary_api_secret'] || process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
            });
            return true;
        }
        return false;
    }

    private async uploadToCloud(filePath: string, folder: string = 'cms_uploads', resourceType: 'image' | 'video' | 'raw' = 'image') {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                folder,
                resource_type: resourceType,
            });
            return result.secure_url;
        } catch (error) {
            this.logger.error(`Cloudinary upload failed for ${filePath}`, error);
            throw error;
        }
    }

    private async configureS3() {
        const settings = await this.settingsService.findAll();
        const accessKey = settings['s3_access_key'] || process.env.S3_ACCESS_KEY;
        const secretKey = settings['s3_secret_key'] || process.env.S3_SECRET_KEY;
        const bucket = settings['s3_bucket'] || process.env.S3_BUCKET;
        const region = settings['s3_region'] || process.env.S3_REGION || 'auto';
        const endpoint = settings['s3_endpoint'] || process.env.S3_ENDPOINT;

        if (accessKey && secretKey && bucket) {
            this.s3Client = new S3Client({
                region,
                endpoint,
                credentials: {
                    accessKeyId: accessKey,
                    secretAccessKey: secretKey,
                },
                forcePathStyle: !!endpoint, // Usually needed for non-AWS S3 (R2/Minio)
            });
            return { bucket, endpoint };
        }
        return null;
    }

    /**
     * Validate provided S3-compatible credentials without persisting them.
     *
     * Used by the setup wizard's "Test connection" button so customers
     * can verify their S3 / R2 / Minio credentials before saving. We
     * test the values the customer just typed in (not the saved
     * settings) and only do a `HeadBucket` — that's the smallest
     * possible call that proves all four things we care about:
     *   - access key is valid
     *   - secret matches the access key
     *   - bucket exists and is reachable from the configured endpoint
     *   - region/endpoint combo is right
     *
     * No object is read or written. Bucket policy errors (e.g. region
     * mismatch on AWS, missing bucket on R2) bubble up as the SDK error
     * message, sliced to 200 chars.
     */
    async testS3Connection(opts: {
        accessKey?: string;
        secretKey?: string;
        bucket?: string;
        region?: string;
        endpoint?: string;
    }): Promise<{ success: boolean; error?: string }> {
        const accessKey = opts.accessKey?.trim();
        const secretKey = opts.secretKey?.trim();
        const bucket = opts.bucket?.trim();
        if (!accessKey || !secretKey || !bucket) {
            return {
                success: false,
                error: 'Access key, secret key, and bucket are required.',
            };
        }

        try {
            const client = new S3Client({
                region: opts.region?.trim() || 'auto',
                endpoint: opts.endpoint?.trim() || undefined,
                credentials: {
                    accessKeyId: accessKey,
                    secretAccessKey: secretKey,
                },
                // Path-style is required for most non-AWS S3 services
                // (R2, Minio, Wasabi). Safe on AWS too — just slightly
                // older URL shape.
                forcePathStyle: !!opts.endpoint?.trim(),
            });
            await client.send(new HeadBucketCommand({ Bucket: bucket }));
            return { success: true };
        } catch (err: any) {
            const code = err?.Code || err?.name;
            const msg = err?.message || 'S3 verification failed.';
            return {
                success: false,
                error: `${code ? `[${code}] ` : ''}${msg}`.slice(0, 200),
            };
        }
    }

    private async uploadToS3(filePath: string, filename: string, mimeType: string) {
        const s3Config = await this.configureS3();
        if (!s3Config || !this.s3Client) throw new Error('S3 not configured');

        const fileStream = fs.createReadStream(filePath);
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: s3Config.bucket,
                Key: `uploads/${filename}`,
                Body: fileStream,
                ContentType: mimeType,
                ACL: 'public-read',
            },
        });

        await upload.done();

        if (s3Config.endpoint) {
            // R2/Custom S3 usually uses a custom domain or the endpoint URL
            // This is a simplification; in production, you'd likely have a CD_URL setting
            return `${s3Config.endpoint.replace('https://', `https://${s3Config.bucket}.`)}/uploads/${filename}`;
        }
        return `https://${s3Config.bucket}.s3.amazonaws.com/uploads/${filename}`;
    }

    /**
     * Read the first 12 bytes of an uploaded file and compare against known
     * magic-byte signatures to catch MIME-type spoofing (e.g. a .php file
     * renamed to .jpg and uploaded with image/jpeg content-type).
     */
    private validateMagicBytes(filePath: string, declaredMime: string): void {
        const buf = Buffer.alloc(12);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buf, 0, 12, 0);
        fs.closeSync(fd);

        const hex = buf.toString('hex');

        const SIGNATURES: Array<{ mime: string | RegExp; magic: string; offset?: number }> = [
            { mime: 'image/jpeg', magic: 'ffd8ff' },
            { mime: 'image/png',  magic: '89504e47' },
            { mime: 'image/gif',  magic: '474946' },
            { mime: 'image/webp', magic: '52494646' },      // RIFF…WEBP
            { mime: 'image/avif', magic: '0000' },          // ftyp-based; skip deep check
            { mime: 'application/pdf', magic: '25504446' }, // %PDF
            { mime: /^video\/mp4/, magic: '0000' },         // ftyp-based; skip deep check
        ];

        for (const sig of SIGNATURES) {
            const mimeMatches = typeof sig.mime === 'string'
                ? declaredMime === sig.mime
                : sig.mime.test(declaredMime);

            if (!mimeMatches) continue;

            // Skip trivial signatures we can't validate cheaply
            if (sig.magic === '0000') return;

            if (!hex.startsWith(sig.magic)) {
                fs.unlinkSync(filePath); // remove unsafe file
                throw new BadRequestException(
                    `Uploaded file content does not match declared type "${declaredMime}"`,
                );
            }
            return; // signature matched
        }
        // No signature rule for this mime type — pass through (e.g. SVG, GLB)
    }

    async create(file: Express.Multer.File) {
        // Validate magic bytes against the browser-declared MIME type
        if (fs.existsSync(file.path)) {
            this.validateMagicBytes(file.path, file.mimetype);
        }

        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        const filename = path.parse(file.filename).name;
        const uploadDir = './uploads';

        // Ensure upload dir exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Paths
        let finalFilename = file.filename; // Default to local
        let finalUrl = ""; // Will be determined (local or cloud)
        let finalMimeType = file.mimetype;
        let metadata: any = {};
        let width: number | null = null;
        let height: number | null = null;
        let duration: number | null = null;

        const useCloudinary = await this.configureCloudinary();
        const s3Config = await this.configureS3();

        if (isImage) {
            const webpFilename = `${filename}.webp`;
            const webpPath = path.join(uploadDir, webpFilename);

            const image = sharp(file.path);
            const info = await image.metadata();
            width = info.width || null;
            height = info.height || null;

            // Convert original to WebP
            await image.ensureAlpha().webp({ quality: 80 }).toFile(webpPath);
            finalFilename = webpFilename;
            finalMimeType = 'image/webp';

            // Generate versions
            const versions = {
                small: 400,
                medium: 800,
                large: 1200,
            };

            const versionPaths: any = {};

            // Process versions locally first
            for (const [key, size] of Object.entries(versions)) {
                const vFilename = `${filename}-${key}.webp`;
                const vPath = path.join(uploadDir, vFilename);
                await sharp(file.path)
                    .ensureAlpha()
                    .resize(size, null, { withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(vPath);

                if (useCloudinary) {
                    versionPaths[key] = await this.uploadToCloud(vPath);
                    // Delete local version after upload
                    try { fs.unlinkSync(vPath); } catch (e) { }
                } else if (s3Config) {
                    versionPaths[key] = await this.uploadToS3(vPath, `${filename}-${key}.webp`, 'image/webp');
                    try { fs.unlinkSync(vPath); } catch (e) { }
                } else {
                    versionPaths[key] = `/uploads/${vFilename}`;
                }
            }

            metadata.versions = versionPaths;

            if (useCloudinary) {
                // Upload main image
                finalUrl = await this.uploadToCloud(webpPath);
                // Delete local webp
                try { fs.unlinkSync(webpPath); } catch (e) { }
            } else if (s3Config) {
                finalUrl = await this.uploadToS3(webpPath, finalFilename, 'image/webp');
                try { fs.unlinkSync(webpPath); } catch (e) { }
            } else {
                finalUrl = `/uploads/${finalFilename}`;
            }

            // Remove original uploaded file
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error('Failed to delete original file:', err);
            }
        } else if (isVideo) {
            // Video Processing
            finalFilename = file.filename;

            // Generate Thumbnail
            const thumbnailFilename = `${filename}-poster.webp`;
            const thumbnailPath = path.join(uploadDir, thumbnailFilename);

            await new Promise((resolve, reject) => {
                ffmpeg(file.path)
                    .screenshots({
                        count: 1,
                        folder: uploadDir,
                        filename: thumbnailFilename,
                        size: '800x?'
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Get Metadata
            await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(file.path, (err, data) => {
                    if (err) return reject(err);
                    const stream = data.streams.find(s => s.codec_type === 'video');
                    if (stream) {
                        width = stream.width || null;
                        height = stream.height || null;
                        duration = data.format.duration || null;
                    }
                    resolve(null);
                });
            });

            if (useCloudinary) {
                const videoUrl = await this.uploadToCloud(file.path, 'cms_uploads', 'video');
                const posterUrl = await this.uploadToCloud(thumbnailPath);

                finalUrl = videoUrl;
                metadata = {
                    poster: posterUrl,
                    duration: duration,
                    isCloudinary: true
                };

                // Cleanup
                try { fs.unlinkSync(file.path); } catch (e) { }
                try { fs.unlinkSync(thumbnailPath); } catch (e) { }

            } else {
                finalUrl = `/uploads/${finalFilename}`;
                metadata = {
                    poster: `/uploads/${thumbnailFilename}`,
                    duration: duration
                };
            }
        } else {
            // Default handler for raw files (3D models, docs, etc.)
            finalFilename = file.filename;
            finalUrl = `/uploads/${finalFilename}`;

            if (useCloudinary) {
                finalUrl = await this.uploadToCloud(file.path, 'cms_uploads', 'raw');
                try { fs.unlinkSync(file.path); } catch (e) { }
            } else if (s3Config) {
                finalUrl = await this.uploadToS3(file.path, finalFilename, file.mimetype);
                try { fs.unlinkSync(file.path); } catch (e) { }
            }
        }

        return (this.prisma as any).media.create({
            data: {
                filename: finalFilename,
                url: finalUrl,
                mimetype: finalMimeType,
                size: file.size,
                width,
                height,
                metadata,
            },
        });
    }

    async findAll() {
        return (this.prisma as any).media.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Mint a signed URL for a PRIVATE media asset. PUBLIC assets don't need
     * this — their /uploads/* paths are already world-readable. PRIVATE
     * assets live under /uploads/private/ and the static handler (see
     * main.ts) refuses unsigned requests.
     *
     * Signature payload: `{basename}.{expiryEpochSeconds}` HMAC-SHA256 with
     * WEBHOOK_SECRET_KEY (any stable server-side secret works — we reuse this
     * one because it's already in scope). Returned URL includes both `exp`
     * and `sig` query params.
     */
    async signPrivateUrl(mediaId: string, ttlSeconds: number) {
        const media = await (this.prisma as any).media.findUnique({ where: { id: mediaId } });
        if (!media) throw new NotFoundException(`Media ${mediaId} not found`);
        if (media.visibility !== 'PRIVATE') {
            // Public assets return their URL unchanged — callers don't need
            // a signed URL and asking for one should be a quiet no-op.
            return { url: media.url, signed: false };
        }

        const key = process.env.WEBHOOK_SECRET_KEY!; // guaranteed by assertRequiredSecrets()
        const basename = path.basename(media.url);
        const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
        const sig = crypto
            .createHmac('sha256', key)
            .update(`${basename}.${exp}`)
            .digest('hex');
        const base = process.env.APP_URL || '';
        const url = `${base}/uploads/private/${basename}?exp=${exp}&sig=${sig}`;
        return { url, signed: true, expiresAt: new Date(exp * 1000) };
    }

    /** Verify a signed-URL request. Called from the /uploads/private middleware. */
    static verifyPrivateSignature(basename: string, exp: string | undefined, sig: string | undefined): boolean {
        if (!exp || !sig) return false;
        const expNum = parseInt(exp, 10);
        if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
        const key = process.env.WEBHOOK_SECRET_KEY;
        if (!key) return false;
        const expected = crypto.createHmac('sha256', key).update(`${basename}.${expNum}`).digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
        } catch {
            return false;
        }
    }

    async update(id: string, data: { altText?: string, folder?: string }) {
        return (this.prisma as any).media.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        const item = await (this.prisma as any).media.findUnique({ where: { id } });
        if (item) {
            const isCloudinary = item.url.startsWith('http');

            if (!isCloudinary && item.url) {
                const uploadDir = './uploads';
                const filename = path.basename(item.url);
                if (filename) {
                    const mainPath = path.join(uploadDir, filename);
                    if (fs.existsSync(mainPath) && fs.lstatSync(mainPath).isFile()) {
                        fs.unlinkSync(mainPath);
                    }

                    if (item.metadata && (item.metadata as any).versions) {
                        const versions = (item.metadata as any).versions;
                        for (const vUrl of Object.values(versions)) {
                            const vFilename = path.basename(vUrl as string);
                            if (vFilename) {
                                const vPath = path.join(uploadDir, vFilename);
                                if (fs.existsSync(vPath) && fs.lstatSync(vPath).isFile()) {
                                    fs.unlinkSync(vPath);
                                }
                            }
                        }
                    }

                    if (item.metadata && (item.metadata as any).poster) {
                        const pFilename = path.basename((item.metadata as any).poster);
                        if (pFilename) {
                            const pPath = path.join(uploadDir, pFilename);
                            if (fs.existsSync(pPath) && fs.lstatSync(pPath).isFile()) {
                                fs.unlinkSync(pPath);
                            }
                        }
                    }
                }
            }
        }
        return (this.prisma as any).media.delete({
            where: { id },
        });
    }

    async listFolders(): Promise<string[]> {
        const items = await (this.prisma as any).media.findMany({ select: { folder: true }, distinct: ['folder'] });
        return items.map((i: any) => i.folder).filter(Boolean).sort();
    }

    async renameFolder(oldName: string, newName: string) {
        return (this.prisma as any).media.updateMany({
            where: { folder: oldName },
            data: { folder: newName },
        });
    }

    async deleteFolder(name: string) {
        return (this.prisma as any).media.updateMany({
            where: { folder: name },
            data: { folder: 'root' },
        });
    }

    async migrateLocalToCloud() {
        const useCloudinary = await this.configureCloudinary();
        if (!useCloudinary) {
            throw new Error('Cloudinary is not configured. Please add credentials in Settings.');
        }

        const allMedia = await (this.prisma as any).media.findMany();
        const localMedia = allMedia.filter((item: any) => item.url.startsWith('/uploads/'));

        const results = {
            total: localMedia.length,
            migrated: 0,
            errors: [] as string[],
        };

        for (const item of localMedia) {
            try {
                const uploadDir = './uploads';
                const mainPath = path.join(uploadDir, path.basename(item.url));

                if (!fs.existsSync(mainPath)) {
                    results.errors.push(`File not found: ${item.filename}`);
                    continue;
                }

                // Upload main file
                const cloudUrl = await this.uploadToCloud(mainPath, 'cms_uploads', item.mimetype.startsWith('video/') ? 'video' : 'image');

                // Handle versions if they exist
                const updatedMetadata = { ...item.metadata };
                if (item.metadata && (item.metadata as any).versions) {
                    const versions = (item.metadata as any).versions;
                    const newVersions: any = {};

                    for (const [key, vUrl] of Object.entries(versions)) {
                        const vPath = path.join(uploadDir, path.basename(vUrl as string));
                        if (fs.existsSync(vPath)) {
                            newVersions[key] = await this.uploadToCloud(vPath);
                            try { fs.unlinkSync(vPath); } catch (e) { }
                        }
                    }
                    updatedMetadata.versions = newVersions;
                }

                // Update database
                await (this.prisma as any).media.update({
                    where: { id: item.id },
                    data: {
                        url: cloudUrl,
                        metadata: updatedMetadata,
                    },
                });

                // Delete local main file
                try { fs.unlinkSync(mainPath); } catch (e) { }

                // Handle poster if video
                if (item.metadata && (item.metadata as any).poster) {
                    const posterPath = path.join(uploadDir, path.basename((item.metadata as any).poster));
                    if (fs.existsSync(posterPath)) {
                        const posterUrl = await this.uploadToCloud(posterPath);
                        updatedMetadata.poster = posterUrl;
                        await (this.prisma as any).media.update({
                            where: { id: item.id },
                            data: { metadata: updatedMetadata },
                        });
                        try { fs.unlinkSync(posterPath); } catch (e) { }
                    }
                }

                results.migrated++;
                this.logger.log(`Migrated: ${item.filename}`);
            } catch (error) {
                this.logger.error(`Failed to migrate ${item.filename}`, error);
                results.errors.push(`${item.filename}: ${error.message}`);
            }
        }

        return results;
    }
}
