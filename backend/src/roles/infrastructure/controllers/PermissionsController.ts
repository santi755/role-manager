import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
} from '@nestjs/common';
import { CreatePermission } from '../../application/use-cases/CreatePermission';
import { GetAllPermissions } from '../../application/use-cases/GetAllPermissions';
import { GetPermissionById } from '../../application/use-cases/GetPermissionById';
import { CreatePermissionDto } from '../../application/dto/CreatePermissionDto';
import { PermissionDto } from '../../application/dto/PermissionDto';

@Controller('api/permissions')
export class PermissionsController {
    constructor(
        private readonly createPermission: CreatePermission,
        private readonly getAllPermissions: GetAllPermissions,
        private readonly getPermissionById: GetPermissionById,
    ) { }

    @Post()
    async create(@Body() dto: CreatePermissionDto): Promise<PermissionDto> {
        const permission = await this.createPermission.execute(dto);
        return {
            id: permission.getId().toString(),
            resource: permission.getResourceAction().getResource(),
            action: permission.getResourceAction().getAction(),
            description: permission.getDescription(),
            createdAt: permission.getCreatedAt(),
        };
    }

    @Get()
    async findAll(
        @Query('resource') resource?: string,
    ): Promise<PermissionDto[]> {
        return this.getAllPermissions.execute({ resource });
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<PermissionDto> {
        return this.getPermissionById.execute({ permissionId: id });
    }
}
