import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import type { PermissionRepository } from '../../../roles/domain/repositories/PermissionRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { CreateRole } from '../../../roles/application/use-cases/CreateRole';
import { CreatePermission } from '../../../roles/application/use-cases/CreatePermission';
import { SetRoleParent } from '../../../roles/application/use-cases/SetRoleParent';
import { GrantPermissionToRole } from '../../../roles/application/use-cases/GrantPermissionToRole';
import { Role } from '../../../roles/domain/Role';
import { Permission } from '../../../roles/domain/Permission';
import { CreateUser } from './CreateUser';
import { AssignRoleToUser } from './AssignRoleToUser';

export interface SeedDataResult {
  rolesCreated: number;
  permissionsCreated: number;
  usersCreated: number;
  message: string;
}

@Injectable()
export class SeedDatabase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly createRole: CreateRole,
    private readonly createPermission: CreatePermission,
    private readonly setRoleParent: SetRoleParent,
    private readonly grantPermissionToRole: GrantPermissionToRole,
    private readonly createUser: CreateUser,
    private readonly assignRoleToUser: AssignRoleToUser,
  ) {}

  async execute(): Promise<SeedDataResult> {
    // 1. Clear all existing data
    await this.clearAllData();

    // 2. Create permissions
    const permissions = await this.createPermissions();

    // 3. Create roles
    const roles = await this.createRoles();

    // 4. Set up role hierarchy
    await this.setupRoleHierarchy(roles);

    // 5. Grant permissions to roles
    await this.grantPermissionsToRoles(roles, permissions);

    // 6. Create users and assign roles
    const usersCreated = await this.createUsers(roles);

    return {
      rolesCreated: Object.keys(roles).length,
      permissionsCreated: Object.keys(permissions).length,
      usersCreated,
      message: 'Database seeded successfully with tech enterprise roles and permissions',
    };
  }

  private async clearAllData(): Promise<void> {
    // Delete all users
    const users = await this.userRepository.findAll();
    for (const user of users) {
      await this.userRepository.delete(user.getId());
    }

    // Delete all roles
    const roles = await this.roleRepository.findAll();
    for (const role of roles) {
      await this.roleRepository.delete(role.getId());
    }

    // Delete all permissions
    const permissions = await this.permissionRepository.findAll();
    for (const permission of permissions) {
      await this.permissionRepository.delete(permission.getId());
    }
  }

  private async createPermissions(): Promise<Record<string, Permission>> {
    const permissionDefinitions = [
      // User Management - Global scope
      {
        action: 'create',
        scope: 'global',
        resource_type: 'user',
        description: 'Create new users',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'user',
        description: 'View user details',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'user',
        description: 'Update user information',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'user',
        description: 'Delete users',
      },

      // Project Management - Global scope
      {
        action: 'create',
        scope: 'global',
        resource_type: 'project',
        description: 'Create new projects',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'project',
        description: 'View project details',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'project',
        description: 'Update project information',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'project',
        description: 'Delete projects',
      },

      // Code Repository - Global scope
      {
        action: 'create',
        scope: 'global',
        resource_type: 'repository',
        description: 'Create new repositories',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'repository',
        description: 'View repository code',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'repository',
        description: 'Push code to repositories',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'repository',
        description: 'Delete repositories',
      },

      // Deployment - Global scope
      {
        action: 'create',
        scope: 'global',
        resource_type: 'deployment',
        description: 'Create deployments',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'deployment',
        description: 'View deployment status',
      },
      {
        action: 'execute',
        scope: 'global',
        resource_type: 'deployment',
        description: 'Execute deployments',
      },

      // Infrastructure - Global scope
      {
        action: 'read',
        scope: 'global',
        resource_type: 'infrastructure',
        description: 'View infrastructure',
      },
      {
        action: 'manage',
        scope: 'global',
        resource_type: 'infrastructure',
        description: 'Manage infrastructure',
      },

      // Design Assets - Global scope
      {
        action: 'create',
        scope: 'global',
        resource_type: 'design',
        description: 'Create design assets',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'design',
        description: 'View design assets',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'design',
        description: 'Update design assets',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'design',
        description: 'Delete design assets',
      },

      // Analytics & Reports - Global scope
      {
        action: 'read',
        scope: 'global',
        resource_type: 'analytics',
        description: 'View analytics',
      },
      {
        action: 'create',
        scope: 'global',
        resource_type: 'report',
        description: 'Create reports',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'report',
        description: 'View reports',
      },

      // Billing & Finance - Global scope
      {
        action: 'read',
        scope: 'global',
        resource_type: 'billing',
        description: 'View billing information',
      },
      {
        action: 'manage',
        scope: 'global',
        resource_type: 'billing',
        description: 'Manage billing and payments',
      },

      // Settings & Configuration - Global scope
      {
        action: 'read',
        scope: 'global',
        resource_type: 'settings',
        description: 'View system settings',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'settings',
        description: 'Update system settings',
      },

      // Roles & Permissions - Global scope
      {
        action: 'create',
        scope: 'global',
        resource_type: 'role',
        description: 'Create new roles',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'role',
        description: 'View roles',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'role',
        description: 'Update roles',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'role',
        description: 'Delete roles',
      },
      {
        action: 'manage',
        scope: 'global',
        resource_type: 'permission',
        description: 'Manage permissions',
      },
    ];

    const permissions: Record<string, Permission> = {};

    for (const def of permissionDefinitions) {
      const permission = await this.createPermission.execute({
        action: def.action,
        scope: def.scope,
        resource_type: def.resource_type,
        description: def.description,
      });
      const key = `${def.resource_type}:${def.action}:${def.scope}`;
      permissions[key] = permission;
    }

    return permissions;
  }

  private async createRoles(): Promise<Record<string, Role>> {
    const roleDefinitions = [
      {
        name: 'CTO',
        description: 'Chief Technology Officer - Full system access',
      },
      {
        name: 'Engineering Manager',
        description: 'Manages engineering teams and projects',
      },
      {
        name: 'Project Manager',
        description: 'Manages projects and team coordination',
      },
      {
        name: 'Tech Lead',
        description: 'Technical leadership and code review',
      },
      {
        name: 'Senior Developer',
        description: 'Experienced developer with deployment rights',
      },
      { name: 'Developer', description: 'Software developer' },
      { name: 'Junior Developer', description: 'Entry-level developer' },
      {
        name: 'DevOps Engineer',
        description: 'Infrastructure and deployment specialist',
      },
      {
        name: 'Design Lead',
        description: 'Leads design team and approves designs',
      },
      { name: 'Designer', description: 'Creates and updates design assets' },
      { name: 'QA Engineer', description: 'Quality assurance and testing' },
      { name: 'Viewer', description: 'Read-only access to most resources' },
    ];

    const roles: Record<string, Role> = {};

    for (const def of roleDefinitions) {
      const role = await this.createRole.execute({
        name: def.name,
        description: def.description,
      });
      roles[def.name] = role;
    }

    return roles;
  }

  private async setupRoleHierarchy(roles: Record<string, Role>): Promise<void> {
    // CTO inherits from Engineering Manager
    await this.setRoleParent.execute({
      roleId: roles['CTO'].getId().toString(),
      parentRoleId: roles['Engineering Manager'].getId().toString(),
    });

    // Engineering Manager inherits from Tech Lead
    await this.setRoleParent.execute({
      roleId: roles['Engineering Manager'].getId().toString(),
      parentRoleId: roles['Tech Lead'].getId().toString(),
    });

    // Tech Lead inherits from Senior Developer
    await this.setRoleParent.execute({
      roleId: roles['Tech Lead'].getId().toString(),
      parentRoleId: roles['Senior Developer'].getId().toString(),
    });

    // Senior Developer inherits from Developer
    await this.setRoleParent.execute({
      roleId: roles['Senior Developer'].getId().toString(),
      parentRoleId: roles['Developer'].getId().toString(),
    });

    // Developer inherits from Junior Developer
    await this.setRoleParent.execute({
      roleId: roles['Developer'].getId().toString(),
      parentRoleId: roles['Junior Developer'].getId().toString(),
    });

    // Junior Developer inherits from Viewer
    await this.setRoleParent.execute({
      roleId: roles['Junior Developer'].getId().toString(),
      parentRoleId: roles['Viewer'].getId().toString(),
    });

    // Project Manager inherits from Viewer
    await this.setRoleParent.execute({
      roleId: roles['Project Manager'].getId().toString(),
      parentRoleId: roles['Viewer'].getId().toString(),
    });

    // DevOps Engineer inherits from Senior Developer
    await this.setRoleParent.execute({
      roleId: roles['DevOps Engineer'].getId().toString(),
      parentRoleId: roles['Senior Developer'].getId().toString(),
    });

    // Design Lead inherits from Designer
    await this.setRoleParent.execute({
      roleId: roles['Design Lead'].getId().toString(),
      parentRoleId: roles['Designer'].getId().toString(),
    });

    // Designer inherits from Viewer
    await this.setRoleParent.execute({
      roleId: roles['Designer'].getId().toString(),
      parentRoleId: roles['Viewer'].getId().toString(),
    });

    // QA Engineer inherits from Viewer
    await this.setRoleParent.execute({
      roleId: roles['QA Engineer'].getId().toString(),
      parentRoleId: roles['Viewer'].getId().toString(),
    });
  }

  private async grantPermissionsToRoles(
    roles: Record<string, Role>,
    permissions: Record<string, Permission>,
  ): Promise<void> {
    // Helper function to grant permission
    const grant = async (roleName: string, permissionKey: string) => {
      if (permissions[permissionKey]) {
        await this.grantPermissionToRole.execute({
          roleId: roles[roleName].getId().toString(),
          permissionId: permissions[permissionKey].getId().toString(),
        });
      }
    };

    // Viewer - Read-only access
    await grant('Viewer', 'project:read:global');
    await grant('Viewer', 'repository:read:global');
    await grant('Viewer', 'deployment:read:global');
    await grant('Viewer', 'design:read:global');
    await grant('Viewer', 'analytics:read:global');
    await grant('Viewer', 'report:read:global');
    await grant('Viewer', 'user:read:global');

    // Junior Developer - Basic development permissions
    await grant('Junior Developer', 'repository:update:global');
    await grant('Junior Developer', 'deployment:execute:global');

    // Developer - Full development permissions
    await grant('Developer', 'project:update:global');

    // Senior Developer - Advanced development + deployment
    await grant('Senior Developer', 'repository:create:global');
    await grant('Senior Developer', 'deployment:create:global');

    // Tech Lead - Code review + project management
    await grant('Tech Lead', 'project:create:global');
    await grant('Tech Lead', 'repository:delete:global');
    await grant('Tech Lead', 'user:update:global');

    // Engineering Manager - Team and resource management
    await grant('Engineering Manager', 'user:create:global');
    await grant('Engineering Manager', 'project:delete:global');
    await grant('Engineering Manager', 'report:create:global');

    // CTO - Full access
    await grant('CTO', 'user:delete:global');
    await grant('CTO', 'infrastructure:read:global');
    await grant('CTO', 'infrastructure:manage:global');
    await grant('CTO', 'billing:read:global');
    await grant('CTO', 'billing:manage:global');
    await grant('CTO', 'settings:read:global');
    await grant('CTO', 'settings:update:global');
    await grant('CTO', 'role:create:global');
    await grant('CTO', 'role:read:global');
    await grant('CTO', 'role:update:global');
    await grant('CTO', 'role:delete:global');
    await grant('CTO', 'permission:manage:global');
    await grant('CTO', 'deployment:execute:global');

    // DevOps Engineer - Infrastructure and deployment
    await grant('DevOps Engineer', 'infrastructure:read:global');
    await grant('DevOps Engineer', 'infrastructure:manage:global');
    await grant('DevOps Engineer', 'deployment:execute:global');

    // Designer - Design assets
    await grant('Designer', 'design:create:global');
    await grant('Designer', 'design:update:global');

    // Design Lead - Design management
    await grant('Design Lead', 'design:delete:global');

    // Project Manager - Project coordination
    await grant('Project Manager', 'project:create:global');
    await grant('Project Manager', 'project:update:global');
    await grant('Project Manager', 'report:create:global');

    // QA Engineer - Testing and staging
    await grant('QA Engineer', 'repository:read:global');
  }

  private async createUsers(roles: Record<string, Role>): Promise<number> {
    let count = 0;
    const roleNames = Object.keys(roles);

    for (const roleName of roleNames) {
      const email = `${roleName.toLowerCase().replace(/ /g, '.')}@example.com`;
      const name = `${roleName} User`;

      // Create user
      const user = await this.createUser.execute({
        name,
        email,
      });

      // Assign role
      await this.assignRoleToUser.execute({
        userId: user.getId().toString(),
        roleId: roles[roleName].getId().toString(),
      });

      count++;
    }

    return count;
  }
}
