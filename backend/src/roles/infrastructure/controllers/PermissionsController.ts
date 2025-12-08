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
import { CreatePermission } from '../../application/use-cases/CreatePermission';
import { GetAllPermissions } from '../../application/use-cases/GetAllPermissions';
import { GetPermissionById } from '../../application/use-cases/GetPermissionById';
import { SetPermissionParent } from '../../application/use-cases/SetPermissionParent';
import { RemovePermissionParent } from '../../application/use-cases/RemovePermissionParent';
import { GetPermissionHierarchy } from '../../application/use-cases/GetPermissionHierarchy';
import { CreatePermissionDto } from '../../application/dto/CreatePermissionDto';
import { SetPermissionParentDto } from '../../application/dto/SetPermissionParentDto';
import { PermissionDto } from '../../application/dto/PermissionDto';
import { PermissionHierarchyDto } from '../../application/dto/PermissionHierarchyDto';
import { COMMON_ACTIONS } from '../../domain/value-objects/Action';
import { COMMON_RESOURCE_TYPES } from '../../domain/value-objects/ResourceType';

@Controller('api/permissions')
// Trigger rebuild
export class PermissionsController {
  constructor(
    private readonly createPermission: CreatePermission,
    private readonly getAllPermissions: GetAllPermissions,
    private readonly getPermissionById: GetPermissionById,
    private readonly setPermissionParent: SetPermissionParent,
    private readonly removePermissionParent: RemovePermissionParent,
    private readonly getPermissionHierarchy: GetPermissionHierarchy,
  ) {}

  @Get('options')
  async getOptions(): Promise<{ actions: string[]; resourceTypes: string[] }> {
    return {
      actions: Object.values(COMMON_ACTIONS),
      resourceTypes: Object.values(COMMON_RESOURCE_TYPES),
    };
  }

  @Post()
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionDto> {
    const permission = await this.createPermission.execute(dto);
    return {
      id: permission.getId().toString(),
      action: permission.getAction().toString(),
      resource_type: permission.getResourceType().toString(),
      target_id: permission.getTargetId().toJSON(),
      scope: permission.getScope()?.toString() ?? null,
      description: permission.getDescription(),
      createdAt: permission.getCreatedAt(),
      parentPermissions: Array.from(permission.getParentPermissions()).map(
        (id) => id.toString(),
      ),
    };
  }

  @Get()
  async findAll(
    @Query('resource') resource?: string,
    @Query('action') action?: string,
    @Query('scope') scope?: string,
    @Query('target_type') targetType?: 'specific' | 'wildcard' | 'none',
  ): Promise<PermissionDto[]> {
    return this.getAllPermissions.execute({
      resource_type: resource,
      action,
      scope,
      target_type: targetType,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PermissionDto> {
    return this.getPermissionById.execute({ permissionId: id });
  }

  @Get(':id/hierarchy')
  async getHierarchy(@Param('id') id: string): Promise<PermissionHierarchyDto> {
    return this.getPermissionHierarchy.execute({ permissionId: id });
  }

  @Post(':id/parent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setParent(
    @Param('id') id: string,
    @Body() dto: SetPermissionParentDto,
  ): Promise<void> {
    await this.setPermissionParent.execute({
      permissionId: id,
      parentPermissionId: dto.parentPermissionId,
    });
  }

  @Delete(':id/parent/:parentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeParent(
    @Param('id') id: string,
    @Param('parentId') parentId: string,
  ): Promise<void> {
    await this.removePermissionParent.execute({
      permissionId: id,
      parentPermissionId: parentId,
    });
  }
}
