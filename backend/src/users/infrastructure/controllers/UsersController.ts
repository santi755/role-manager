import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateUser } from '../../application/use-cases/CreateUser';
import { GetAllUsers } from '../../application/use-cases/GetAllUsers';
import { GetUserById } from '../../application/use-cases/GetUserById';
import { GetUserRoles } from '../../application/use-cases/GetUserRoles';
import { GetUserPermissions } from '../../application/use-cases/GetUserPermissions';
import { AssignRoleToUser } from '../../application/use-cases/AssignRoleToUser';
import { UnassignRoleFromUser } from '../../application/use-cases/UnassignRoleFromUser';
import { CheckUserPermission } from '../../application/use-cases/CheckUserPermission';
import { CreateUserDto } from '../../application/dto/CreateUserDto';
import { AssignRoleDto } from '../../application/dto/AssignRoleDto';
import { CheckPermissionDto } from '../../application/dto/CheckPermissionDto';
import { UserDto } from '../../application/dto/UserDto';
import { RoleDto } from '../../../roles/application/dto/RoleDto';
import { PermissionDto } from '../../../roles/application/dto/PermissionDto';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUser,
    private readonly getAllUsers: GetAllUsers,
    private readonly getUserById: GetUserById,
    private readonly getUserRoles: GetUserRoles,
    private readonly getUserPermissions: GetUserPermissions,
    private readonly assignRoleToUser: AssignRoleToUser,
    private readonly unassignRoleFromUser: UnassignRoleFromUser,
    private readonly checkUserPermission: CheckUserPermission,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserDto> {
    const user = await this.createUser.execute(dto);
    return {
      id: user.getId().toString(),
      name: user.getName(),
      email: user.getEmail().toString(),
      createdAt: user.getCreatedAt(),
      assignedRoles: Array.from(user.getAssignedRoles()).map((r) =>
        r.toString(),
      ),
    };
  }

  @Get()
  async findAll(): Promise<UserDto[]> {
    return this.getAllUsers.execute();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDto> {
    return this.getUserById.execute({ userId: id });
  }

  @Get(':id/roles')
  async getRoles(@Param('id') id: string): Promise<RoleDto[]> {
    return this.getUserRoles.execute({ userId: id });
  }

  @Post(':id/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ): Promise<void> {
    await this.assignRoleToUser.execute({
      userId: id,
      roleId: dto.roleId,
    });
  }

  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ): Promise<void> {
    await this.unassignRoleFromUser.execute({
      userId: id,
      roleId,
    });
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string): Promise<PermissionDto[]> {
    return this.getUserPermissions.execute({ userId: id });
  }

  @Post(':id/permissions/check')
  async checkPermission(
    @Param('id') id: string,
    @Body() dto: CheckPermissionDto,
  ) {
    return this.checkUserPermission.execute({
      userId: id,
      resource: dto.resource,
      action: dto.action,
    });
  }
}
