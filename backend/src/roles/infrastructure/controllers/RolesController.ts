import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CreateRole } from '../../application/use-cases/CreateRole';
import { GetAllRoles } from '../../application/use-cases/GetAllRoles';
import { GetRoleById } from '../../application/use-cases/GetRoleById';
import { GetRolePermissions } from '../../application/use-cases/GetRolePermissions';
import { GetRoleHierarchy } from '../../application/use-cases/GetRoleHierarchy';
import { GrantPermissionToRole } from '../../application/use-cases/GrantPermissionToRole';
import { RevokePermissionFromRole } from '../../application/use-cases/RevokePermissionFromRole';
import { SetRoleParent } from '../../application/use-cases/SetRoleParent';
import { RemoveRoleParent } from '../../application/use-cases/RemoveRoleParent';
import { DeleteRole } from '../../application/use-cases/DeleteRole';
import { CreateRoleDto } from '../../application/dto/CreateRoleDto';
import { GrantPermissionDto } from '../../application/dto/GrantPermissionDto';
import { SetRoleParentDto } from '../../application/dto/SetRoleParentDto';
import { RoleDto } from '../../application/dto/RoleDto';
import { PermissionDto } from '../../application/dto/PermissionDto';
import { RoleHierarchyDto } from '../../application/dto/RoleHierarchyDto';

@Controller('api/roles')
export class RolesController {
    constructor(
        private readonly createRole: CreateRole,
        private readonly getAllRoles: GetAllRoles,
        private readonly getRoleById: GetRoleById,
        private readonly getRolePermissions: GetRolePermissions,
        private readonly getRoleHierarchy: GetRoleHierarchy,
        private readonly grantPermissionToRole: GrantPermissionToRole,
        private readonly revokePermissionFromRole: RevokePermissionFromRole,
        private readonly setRoleParent: SetRoleParent,
        private readonly removeRoleParent: RemoveRoleParent,
        private readonly deleteRole: DeleteRole,
    ) { }

    @Post()
    async create(@Body() dto: CreateRoleDto): Promise<RoleDto> {
        const role = await this.createRole.execute(dto);
        return {
            id: role.getId().toString(),
            name: role.getName(),
            description: role.getDescription(),
            createdAt: role.getCreatedAt(),
            parentRoles: Array.from(role.getParentRoles()).map((r) =>
                r.toString(),
            ),
            permissions: Array.from(role.getPermissions()).map((p) =>
                p.toString(),
            ),
        };
    }

    @Get()
    async findAll(): Promise<RoleDto[]> {
        return this.getAllRoles.execute();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<RoleDto> {
        return this.getRoleById.execute({ roleId: id });
    }

    @Get(':id/permissions')
    async getPermissions(@Param('id') id: string): Promise<PermissionDto[]> {
        return this.getRolePermissions.execute({ roleId: id });
    }

    @Post(':id/permissions')
    @HttpCode(HttpStatus.NO_CONTENT)
    async grantPermission(
        @Param('id') id: string,
        @Body() dto: GrantPermissionDto,
    ): Promise<void> {
        await this.grantPermissionToRole.execute({
            roleId: id,
            permissionId: dto.permissionId,
        });
    }

    @Delete(':id/permissions/:permissionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async revokePermission(
        @Param('id') id: string,
        @Param('permissionId') permissionId: string,
    ): Promise<void> {
        await this.revokePermissionFromRole.execute({
            roleId: id,
            permissionId,
        });
    }

    @Get(':id/hierarchy')
    async getHierarchy(@Param('id') id: string): Promise<RoleHierarchyDto> {
        return this.getRoleHierarchy.execute({ roleId: id });
    }

    @Post(':id/parent')
    @HttpCode(HttpStatus.NO_CONTENT)
    async setParent(
        @Param('id') id: string,
        @Body() dto: SetRoleParentDto,
    ): Promise<void> {
        await this.setRoleParent.execute({
            roleId: id,
            parentRoleId: dto.parentRoleId,
        });
    }

    @Delete(':id/parent/:parentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeParent(
        @Param('id') id: string,
        @Param('parentId') parentId: string,
    ): Promise<void> {
        await this.removeRoleParent.execute({
            roleId: id,
            parentRoleId: parentId,
        });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        await this.deleteRole.execute({ roleId: id });
    }
}
