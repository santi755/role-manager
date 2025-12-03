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

export interface SeedDataResult {
  rolesCreated: number;
  permissionsCreated: number;
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

    return {
      rolesCreated: Object.keys(roles).length,
      permissionsCreated: Object.keys(permissions).length,
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
      // User Management
      { resource: 'users', action: 'create', description: 'Create new users' },
      { resource: 'users', action: 'read', description: 'View user details' },
      { resource: 'users', action: 'update', description: 'Update user information' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      { resource: 'users', action: 'list', description: 'List all users' },

      // Project Management
      { resource: 'projects', action: 'create', description: 'Create new projects' },
      { resource: 'projects', action: 'read', description: 'View project details' },
      { resource: 'projects', action: 'update', description: 'Update project information' },
      { resource: 'projects', action: 'delete', description: 'Delete projects' },
      { resource: 'projects', action: 'list', description: 'List all projects' },
      { resource: 'projects', action: 'assign', description: 'Assign team members to projects' },

      // Code Repository
      { resource: 'repositories', action: 'create', description: 'Create new repositories' },
      { resource: 'repositories', action: 'read', description: 'View repository code' },
      { resource: 'repositories', action: 'write', description: 'Push code to repositories' },
      { resource: 'repositories', action: 'delete', description: 'Delete repositories' },
      { resource: 'repositories', action: 'merge', description: 'Merge pull requests' },
      { resource: 'repositories', action: 'review', description: 'Review code changes' },

      // Deployment
      { resource: 'deployments', action: 'create', description: 'Create deployments' },
      { resource: 'deployments', action: 'read', description: 'View deployment status' },
      { resource: 'deployments', action: 'production', description: 'Deploy to production' },
      { resource: 'deployments', action: 'staging', description: 'Deploy to staging' },
      { resource: 'deployments', action: 'rollback', description: 'Rollback deployments' },

      // Infrastructure
      { resource: 'infrastructure', action: 'read', description: 'View infrastructure' },
      { resource: 'infrastructure', action: 'manage', description: 'Manage infrastructure' },
      { resource: 'infrastructure', action: 'configure', description: 'Configure servers and services' },

      // Design Assets
      { resource: 'designs', action: 'create', description: 'Create design assets' },
      { resource: 'designs', action: 'read', description: 'View design assets' },
      { resource: 'designs', action: 'update', description: 'Update design assets' },
      { resource: 'designs', action: 'delete', description: 'Delete design assets' },
      { resource: 'designs', action: 'approve', description: 'Approve design changes' },

      // Analytics & Reports
      { resource: 'analytics', action: 'read', description: 'View analytics' },
      { resource: 'analytics', action: 'export', description: 'Export analytics data' },
      { resource: 'reports', action: 'create', description: 'Create reports' },
      { resource: 'reports', action: 'read', description: 'View reports' },

      // Billing & Finance
      { resource: 'billing', action: 'read', description: 'View billing information' },
      { resource: 'billing', action: 'manage', description: 'Manage billing and payments' },

      // Settings & Configuration
      { resource: 'settings', action: 'read', description: 'View system settings' },
      { resource: 'settings', action: 'update', description: 'Update system settings' },

      // Roles & Permissions
      { resource: 'roles', action: 'create', description: 'Create new roles' },
      { resource: 'roles', action: 'read', description: 'View roles' },
      { resource: 'roles', action: 'update', description: 'Update roles' },
      { resource: 'roles', action: 'delete', description: 'Delete roles' },
      { resource: 'permissions', action: 'manage', description: 'Manage permissions' },
    ];

    const permissions: Record<string, Permission> = {};

    for (const def of permissionDefinitions) {
      const permission = await this.createPermission.execute({
        resource: def.resource,
        action: def.action,
        description: def.description,
      });
      const key = `${def.resource}:${def.action}`;
      permissions[key] = permission;
    }

    return permissions;
  }

  private async createRoles(): Promise<Record<string, Role>> {
    const roleDefinitions = [
      { name: 'CTO', description: 'Chief Technology Officer - Full system access' },
      { name: 'Engineering Manager', description: 'Manages engineering teams and projects' },
      { name: 'Project Manager', description: 'Manages projects and team coordination' },
      { name: 'Tech Lead', description: 'Technical leadership and code review' },
      { name: 'Senior Developer', description: 'Experienced developer with deployment rights' },
      { name: 'Developer', description: 'Software developer' },
      { name: 'Junior Developer', description: 'Entry-level developer' },
      { name: 'DevOps Engineer', description: 'Infrastructure and deployment specialist' },
      { name: 'Design Lead', description: 'Leads design team and approves designs' },
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
    await grant('Viewer', 'projects:read');
    await grant('Viewer', 'projects:list');
    await grant('Viewer', 'repositories:read');
    await grant('Viewer', 'deployments:read');
    await grant('Viewer', 'designs:read');
    await grant('Viewer', 'analytics:read');
    await grant('Viewer', 'reports:read');
    await grant('Viewer', 'users:read');
    await grant('Viewer', 'users:list');

    // Junior Developer - Basic development permissions
    await grant('Junior Developer', 'repositories:write');
    await grant('Junior Developer', 'deployments:staging');

    // Developer - Full development permissions
    await grant('Developer', 'repositories:review');
    await grant('Developer', 'projects:update');

    // Senior Developer - Advanced development + deployment
    await grant('Senior Developer', 'repositories:merge');
    await grant('Senior Developer', 'repositories:create');
    await grant('Senior Developer', 'deployments:create');
    await grant('Senior Developer', 'deployments:rollback');

    // Tech Lead - Code review + project management
    await grant('Tech Lead', 'projects:create');
    await grant('Tech Lead', 'projects:assign');
    await grant('Tech Lead', 'repositories:delete');
    await grant('Tech Lead', 'users:update');

    // Engineering Manager - Team and resource management
    await grant('Engineering Manager', 'users:create');
    await grant('Engineering Manager', 'projects:delete');
    await grant('Engineering Manager', 'analytics:export');
    await grant('Engineering Manager', 'reports:create');

    // CTO - Full access
    await grant('CTO', 'users:delete');
    await grant('CTO', 'infrastructure:read');
    await grant('CTO', 'infrastructure:manage');
    await grant('CTO', 'infrastructure:configure');
    await grant('CTO', 'billing:read');
    await grant('CTO', 'billing:manage');
    await grant('CTO', 'settings:read');
    await grant('CTO', 'settings:update');
    await grant('CTO', 'roles:create');
    await grant('CTO', 'roles:read');
    await grant('CTO', 'roles:update');
    await grant('CTO', 'roles:delete');
    await grant('CTO', 'permissions:manage');
    await grant('CTO', 'deployments:production');

    // DevOps Engineer - Infrastructure and deployment
    await grant('DevOps Engineer', 'infrastructure:read');
    await grant('DevOps Engineer', 'infrastructure:manage');
    await grant('DevOps Engineer', 'infrastructure:configure');
    await grant('DevOps Engineer', 'deployments:production');

    // Designer - Design assets
    await grant('Designer', 'designs:create');
    await grant('Designer', 'designs:update');

    // Design Lead - Design management
    await grant('Design Lead', 'designs:delete');
    await grant('Design Lead', 'designs:approve');

    // Project Manager - Project coordination
    await grant('Project Manager', 'projects:create');
    await grant('Project Manager', 'projects:update');
    await grant('Project Manager', 'projects:assign');
    await grant('Project Manager', 'reports:create');
    await grant('Project Manager', 'analytics:export');

    // QA Engineer - Testing and staging
    await grant('QA Engineer', 'deployments:staging');
    await grant('QA Engineer', 'repositories:read');
    await grant('QA Engineer', 'repositories:review');
  }
}
