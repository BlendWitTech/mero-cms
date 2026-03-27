import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessControlService {
    constructor(private prisma: PrismaService) { }

    /**
     * Checks if the actor has a superior or equal role level compared to the target role.
     * Lower number means more superior (Super Admin = 0).
     * @param actorLevel Level of the user performing the action
     * @param targetLevel Level of the role/user being acted upon
     * @param allowEqual If true, allows action if levels are equal (sharing the same role level)
     */
    isSuperior(actorLevel: number, targetLevel: number, allowEqual = false): boolean {
        if (allowEqual) {
            return actorLevel <= targetLevel;
        }
        return actorLevel < targetLevel;
    }

    /**
     * Validates that an actor can perform an action on a target user based on hierarchy.
     */
    async validateHierarchy(actorId: string, targetUserId: string) {
        const [actor, target] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: actorId },
                include: { role: true }
            }),
            this.prisma.user.findUnique({
                where: { id: targetUserId },
                include: { role: true }
            })
        ]);

        if (!actor || !target) return;

        // Prevent self-action (cannot deactivate or delete yourself)
        if (actorId === targetUserId) {
            throw new ForbiddenException('You cannot perform administrative actions on your own account.');
        }

        // Super Admin (level 0 or role name) can do everything to lower-privilege users
        if (actor.role.level === 0 || actor.role.name === 'Super Admin') return;

        if (!this.isSuperior(actor.role.level, target.role.level)) {
            throw new ForbiddenException('You do not have enough superiority to perform this action on this user.');
        }
    }

    /**
     * Validates that an actor can assign/invite a role based on hierarchy.
     */
    async validateRoleAssignment(actorId: string, targetRoleId: string) {
        const [actor, targetRole] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: actorId },
                include: { role: true }
            }),
            this.prisma.role.findUnique({
                where: { id: targetRoleId }
            })
        ]);

        if (!actor || !targetRole) return;

        // Super Admin (level 0 or role name) can assign any role EXCEPT creating another Super Admin
        const isSuperAdmin = actor.role.level === 0 || actor.role.name === 'Super Admin';
        if (isSuperAdmin) {
            // Check if they are trying to assign Super Admin and if one already exists
            const isAssigningSuperAdmin = targetRole.level === 0 || targetRole.name === 'Super Admin';
            if (isAssigningSuperAdmin) {
                const superAdminCount = await this.prisma.user.count({
                    where: { role: { name: 'Super Admin' } }
                });
                if (superAdminCount > 0) {
                    throw new ForbiddenException('Only one Super Admin can exist in the system.');
                }
            }
            return;
        }

        // Others can only invite to roles with level > their own
        if (!this.isSuperior(actor.role.level, targetRole.level)) {
            throw new ForbiddenException('You cannot assign a role that is equal to or more superior than your own.');
        }
    }
}
