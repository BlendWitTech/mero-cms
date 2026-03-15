import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) { }

    async create(createTeamMemberDto: any) {
        const siteSettings = await (this.prisma as any).setting.findMany({
            where: { key: 'active_theme' }
        });
        const activeTheme = siteSettings[0]?.value;

        return (this.prisma as any).teamMember.create({
            data: {
                ...createTeamMemberDto,
                theme: activeTheme
            },
        });
    }

    async findAll() {
        return (this.prisma as any).teamMember.findMany({
            orderBy: { order: 'asc' },
        });
    }

    async findOne(id: string) {
        return (this.prisma as any).teamMember.findUnique({
            where: { id },
        });
    }

    async update(id: string, updateTeamMemberDto: any) {
        return (this.prisma as any).teamMember.update({
            where: { id },
            data: updateTeamMemberDto,
        });
    }

    async remove(id: string) {
        return (this.prisma as any).teamMember.delete({
            where: { id },
        });
    }

    async reorder(updates: Array<{ id: string; order: number }>) {
        const promises = updates.map(({ id, order }) =>
            (this.prisma as any).teamMember.update({
                where: { id },
                data: { order },
            })
        );
        return Promise.all(promises);
    }
}
