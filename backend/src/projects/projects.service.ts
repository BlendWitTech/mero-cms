import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeoMetaService } from '../seo-meta/seo-meta.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
    constructor(
        private prisma: PrismaService,
        private seoMetaService: SeoMetaService,
        private notificationsService: NotificationsService
    ) { }

    async create(createProjectDto: any) {
        const { seoMeta, ...projectData } = createProjectDto;

        // Clean up date fields
        if (projectData.completionDate === '') {
            projectData.completionDate = null;
        } else if (projectData.completionDate && typeof projectData.completionDate === 'string') {
            projectData.completionDate = new Date(projectData.completionDate).toISOString();
        }

        // Clean up SEO keywords
        const formattedSeoMeta = seoMeta ? {
            ...seoMeta,
            keywords: Array.isArray(seoMeta.keywords)
                ? seoMeta.keywords
                : typeof seoMeta.keywords === 'string' && seoMeta.keywords.trim() !== ''
                    ? seoMeta.keywords.split(',').map((k: string) => k.trim())
                    : [],
            pageType: 'project'
        } : undefined;

        // Status Rule: Cannot be COMPLETED if date is in future
        if (projectData.status === 'COMPLETED' && projectData.completionDate) {
            const completionDate = new Date(projectData.completionDate);
            if (completionDate > new Date()) {
                projectData.status = 'IN_PROGRESS';
            }
        }

        const project = await (this.prisma as any).project.create({
            data: {
                ...projectData,
                seoMeta: formattedSeoMeta ? { create: formattedSeoMeta } : undefined
            },
            include: { category: true, seoMeta: true }
        });

        await this.notificationsService.create({
            type: 'SUCCESS',
            title: 'New Project',
            message: `Project "${project.title}" was created.`,
            link: `/dashboard/projects?edit=${project.id}`,
            targetRole: 'Admin'
        });

        return project;
    }

    async findAll(status?: string, category?: string, featured?: boolean) {
        const where: any = {};
        if (status) where.status = status;
        if (category) where.category = { slug: category };
        if (featured !== undefined) where.featured = featured;

        return this.prisma.project.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { category: true, seoMeta: true }
        });
    }

    async findOne(slug: string) {
        return this.prisma.project.findUnique({
            where: { slug },
            include: { category: true, seoMeta: true }
        });
    }

    async findById(id: string) {
        return this.prisma.project.findUnique({
            where: { id },
            include: { category: true, seoMeta: true }
        });
    }

    async update(id: string, updateProjectDto: any) {
        const { seoMeta, ...projectData } = updateProjectDto;

        // Clean up date fields
        if (projectData.completionDate === '') {
            projectData.completionDate = null;
        } else if (projectData.completionDate && typeof projectData.completionDate === 'string') {
            projectData.completionDate = new Date(projectData.completionDate).toISOString();
        }

        if (seoMeta) {
            const formattedSeoMeta = {
                ...seoMeta,
                keywords: Array.isArray(seoMeta.keywords)
                    ? seoMeta.keywords
                    : typeof seoMeta.keywords === 'string' && seoMeta.keywords.trim() !== ''
                        ? seoMeta.keywords.split(',').map((k: string) => k.trim())
                        : [],
                pageType: 'project'
            };

            await (this.prisma as any).seoMeta.upsert({
                where: { projectId: id },
                create: { ...formattedSeoMeta, projectId: id },
                update: formattedSeoMeta
            });
        }

        // Status Rule: Cannot be COMPLETED if date is in future
        if (projectData.status === 'COMPLETED' && projectData.completionDate) {
            const completionDate = new Date(projectData.completionDate);
            if (completionDate > new Date()) {
                projectData.status = 'IN_PROGRESS';
            }
        }

        const project = await (this.prisma as any).project.update({
            where: { id },
            data: projectData,
            include: { category: true, seoMeta: true }
        });

        await this.notificationsService.create({
            type: 'INFO',
            title: 'Project Updated',
            message: `Project "${project.title}" was updated.`,
            link: `/dashboard/projects?edit=${project.id}`,
            targetRole: 'Admin'
        });

        return project;
    }

    async remove(id: string) {
        const project = await (this.prisma as any).project.findUnique({ where: { id } });
        if (project) {
            await this.seoMetaService.deleteByPage('project', id);
            await this.notificationsService.create({
                type: 'DANGER',
                title: 'Project Deleted',
                message: `Project "${project.title}" was deleted.`,
                targetRole: 'Admin'
            });
        }
        return (this.prisma as any).project.delete({
            where: { id },
        });
    }

    // Public methods — visible to unauthenticated theme visitors
    async findPublished(page: number = 1, limit: number = 10, category?: string) {
        const skip = (page - 1) * limit;
        // Exclude only hidden / draft-style statuses; all others are public
        const where: any = { NOT: { status: 'CONCEPT' } };
        if (category) where.category = { slug: category };

        const [projects, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { category: true },
            }),
            this.prisma.project.count({ where }),
        ]);

        return {
            data: projects.map((p: any) => ({ ...p, featuredImageUrl: p.coverImage || null, images: p.gallery || [] })),
            total,
            page,
            limit,
        };
    }

    async findFeatured() {
        const projects = await this.prisma.project.findMany({
            where: { featured: true, NOT: { status: 'CONCEPT' } },
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: { category: true },
        });
        return projects.map((p: any) => ({ ...p, featuredImageUrl: p.coverImage || null, images: p.gallery || [] }));
    }
}
