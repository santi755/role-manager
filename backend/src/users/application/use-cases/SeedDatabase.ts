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

/**
 * SeedDatabase Use Case
 *
 * Initializes the database with a comprehensive RBAC system featuring:
 *
 * PERMISSIONS (65+):
 * - Scope-based: own, team, org, global (dynamic hierarchy)
 * - Target-specific: project:backend, repo:main, db:production, * (wildcard)
 * - Actions: create, read, update, delete, execute, manage
 * - Resources: user, project, repository, deployment, infrastructure, document,
 *              design, analytics, report, billing, settings, role, permission
 *
 * ROLE HIERARCHY (12 roles):
 *              CTO
 *              ├── Engineering Manager
 *              │   ├── Tech Lead
 *              │   │   └── Senior Developer
 *              │   │       └── Developer
 *              │   │           └── Junior Developer
 *              │   │               └── Viewer
 *              │   └── Project Manager
 *              │       └── Viewer
 *              ├── DevOps Engineer
 *              │   └── Senior Developer
 *              ├── Design Lead
 *              │   └── Designer
 *              │       └── Viewer
 *              ├── HR Manager
 *              │   └── Viewer
 *              └── QA Engineer
 *                  └── Viewer
 *
 * USERS (12 realistic personas):
 * - Each role has a dedicated test user with meaningful name and email
 * - Enables comprehensive testing of permission hierarchies
 * - Supports role inheritance validation
 *
 * KEY FEATURES:
 * ✓ Mutual exclusivity: targetId and scope cannot coexist
 * ✓ Action hierarchy: 'manage' implies all other actions
 * ✓ Scope hierarchy: global > org > team > own
 * ✓ Wildcard support: targetId: '*' implies all specific targets
 * ✓ Semantic permission keys: resource:action:target|scope
 *
 * USAGE:
 * POST /api/seed → Clears all data and reinitializes the database
 * Useful for testing and development environments
 *
 * CAUTION: This operation is destructive and clears all existing data
 */
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
      // ========== USER MANAGEMENT ==========
      {
        action: 'create',
        scope: 'global',
        resource_type: 'user',
        target_id: null,
        description: 'Create new users (global admin)',
      },
      {
        action: 'read',
        scope: 'global',
        resource_type: 'user',
        target_id: null,
        description: 'View any user details',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'user',
        target_id: null,
        description: 'View all users in organization',
      },
      {
        action: 'read',
        scope: 'team',
        resource_type: 'user',
        target_id: null,
        description: 'View team members',
      },
      {
        action: 'read',
        scope: 'own',
        resource_type: 'user',
        target_id: null,
        description: 'View own user profile',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'user',
        target_id: null,
        description: 'Update any user information',
      },
      {
        action: 'update',
        scope: 'team',
        resource_type: 'user',
        target_id: null,
        description: 'Update team member information',
      },
      {
        action: 'update',
        scope: 'own',
        resource_type: 'user',
        target_id: null,
        description: 'Update own profile',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'user',
        target_id: null,
        description: 'Delete users',
      },

      // ========== PROJECT MANAGEMENT ==========
      {
        action: 'create',
        scope: 'own',
        resource_type: 'project',
        target_id: null,
        description: 'Create personal projects',
      },
      {
        action: 'create',
        scope: 'team',
        resource_type: 'project',
        target_id: null,
        description: 'Create team projects',
      },
      {
        action: 'create',
        scope: 'global',
        resource_type: 'project',
        target_id: null,
        description: 'Create projects globally',
      },
      {
        action: 'read',
        scope: 'own',
        resource_type: 'project',
        target_id: null,
        description: 'View own projects',
      },
      {
        action: 'read',
        scope: 'team',
        resource_type: 'project',
        target_id: null,
        description: 'View team projects',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'project',
        target_id: null,
        description: 'View all organization projects',
      },
      {
        action: 'update',
        scope: 'own',
        resource_type: 'project',
        target_id: null,
        description: 'Update own projects',
      },
      {
        action: 'update',
        scope: 'team',
        resource_type: 'project',
        target_id: null,
        description: 'Update team projects',
      },
      {
        action: 'update',
        scope: null,
        resource_type: 'project',
        target_id: 'project:backend',
        description: 'Update Backend project',
      },
      {
        action: 'update',
        scope: null,
        resource_type: 'project',
        target_id: 'project:frontend',
        description: 'Update Frontend project',
      },
      {
        action: 'update',
        scope: null,
        resource_type: 'project',
        target_id: 'project:devops',
        description: 'Update DevOps project',
      },
      {
        action: 'update',
        scope: null,
        resource_type: 'project',
        target_id: '*',
        description: 'Update any project',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'project',
        target_id: null,
        description: 'Delete projects',
      },
      {
        action: 'manage',
        scope: null,
        resource_type: 'project',
        target_id: '*',
        description: 'Manage all projects',
      },

      // ========== CODE REPOSITORY ==========
      {
        action: 'read',
        scope: 'org',
        resource_type: 'repository',
        target_id: null,
        description: 'Read all organization repositories',
      },
      {
        action: 'read',
        scope: 'team',
        resource_type: 'repository',
        target_id: null,
        description: 'Read team repositories',
      },
      {
        action: 'create',
        scope: 'team',
        resource_type: 'repository',
        target_id: null,
        description: 'Create team repositories',
      },
      {
        action: 'update',
        scope: null,
        resource_type: 'repository',
        target_id: '*',
        description: 'Push code to any repository',
      },
      {
        action: 'update',
        scope: null,
        resource_type: 'repository',
        target_id: 'repo:main',
        description: 'Push to main branch',
      },
      {
        action: 'update',
        scope: null,
        resource_type: 'repository',
        target_id: 'repo:staging',
        description: 'Push to staging branch',
      },
      {
        action: 'delete',
        scope: null,
        resource_type: 'repository',
        target_id: 'repo:staging',
        description: 'Delete staging branch',
      },
      {
        action: 'delete',
        scope: null,
        resource_type: 'repository',
        target_id: '*',
        description: 'Delete any repository',
      },
      {
        action: 'manage',
        scope: null,
        resource_type: 'repository',
        target_id: '*',
        description: 'Manage all repositories',
      },

      // ========== DEPLOYMENT & CI/CD ==========
      {
        action: 'execute',
        scope: 'own',
        resource_type: 'deployment',
        target_id: null,
        description: 'Deploy personal dev environment',
      },
      {
        action: 'execute',
        scope: 'team',
        resource_type: 'deployment',
        target_id: null,
        description: 'Deploy to staging environment',
      },
      {
        action: 'execute',
        scope: 'global',
        resource_type: 'deployment',
        target_id: null,
        description: 'Deploy to production',
      },
      {
        action: 'read',
        scope: 'team',
        resource_type: 'deployment',
        target_id: null,
        description: 'View team deployment status',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'deployment',
        target_id: null,
        description: 'View organization deployment status',
      },

      // ========== INFRASTRUCTURE ==========
      {
        action: 'read',
        scope: 'org',
        resource_type: 'infrastructure',
        target_id: null,
        description: 'View organization infrastructure',
      },
      {
        action: 'manage',
        scope: null,
        resource_type: 'infrastructure',
        target_id: 'db:production',
        description: 'Manage production database',
      },
      {
        action: 'manage',
        scope: null,
        resource_type: 'infrastructure',
        target_id: 'db:staging',
        description: 'Manage staging database',
      },
      {
        action: 'manage',
        scope: null,
        resource_type: 'infrastructure',
        target_id: '*',
        description: 'Manage all infrastructure',
      },

      // ========== DOCUMENTS & KNOWLEDGE BASE ==========
      {
        action: 'create',
        scope: 'own',
        resource_type: 'document',
        target_id: null,
        description: 'Create personal documents',
      },
      {
        action: 'create',
        scope: 'team',
        resource_type: 'document',
        target_id: null,
        description: 'Create team documents',
      },
      {
        action: 'read',
        scope: 'own',
        resource_type: 'document',
        target_id: null,
        description: 'Read own documents',
      },
      {
        action: 'read',
        scope: 'team',
        resource_type: 'document',
        target_id: null,
        description: 'Read team documents',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'document',
        target_id: null,
        description: 'Read organization documents',
      },
      {
        action: 'update',
        scope: 'own',
        resource_type: 'document',
        target_id: null,
        description: 'Edit personal documents',
      },
      {
        action: 'update',
        scope: 'team',
        resource_type: 'document',
        target_id: null,
        description: 'Edit team documents',
      },
      {
        action: 'delete',
        scope: null,
        resource_type: 'document',
        target_id: '*',
        description: 'Delete documents',
      },

      // ========== DESIGN ASSETS ==========
      {
        action: 'create',
        scope: 'own',
        resource_type: 'design',
        target_id: null,
        description: 'Create personal design assets',
      },
      {
        action: 'create',
        scope: 'team',
        resource_type: 'design',
        target_id: null,
        description: 'Create team design assets',
      },
      {
        action: 'read',
        scope: 'team',
        resource_type: 'design',
        target_id: null,
        description: 'View team design assets',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'design',
        target_id: null,
        description: 'View organization design assets',
      },
      {
        action: 'update',
        scope: 'own',
        resource_type: 'design',
        target_id: null,
        description: 'Edit personal design assets',
      },
      {
        action: 'update',
        scope: 'team',
        resource_type: 'design',
        target_id: null,
        description: 'Edit team design assets',
      },
      {
        action: 'delete',
        scope: null,
        resource_type: 'design',
        target_id: '*',
        description: 'Delete design assets',
      },

      // ========== ANALYTICS & REPORTS ==========
      {
        action: 'read',
        scope: 'team',
        resource_type: 'analytics',
        target_id: null,
        description: 'View team analytics',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'analytics',
        target_id: null,
        description: 'View organization analytics',
      },
      {
        action: 'create',
        scope: 'team',
        resource_type: 'report',
        target_id: null,
        description: 'Create team reports',
      },
      {
        action: 'create',
        scope: 'org',
        resource_type: 'report',
        target_id: null,
        description: 'Create organization reports',
      },
      {
        action: 'read',
        scope: 'team',
        resource_type: 'report',
        target_id: null,
        description: 'View team reports',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'report',
        target_id: null,
        description: 'View organization reports',
      },

      // ========== BILLING & FINANCE ==========
      {
        action: 'read',
        scope: 'team',
        resource_type: 'billing',
        target_id: null,
        description: 'View team billing',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'billing',
        target_id: null,
        description: 'View organization billing',
      },
      {
        action: 'manage',
        scope: 'global',
        resource_type: 'billing',
        target_id: null,
        description: 'Manage all billing and payments',
      },

      // ========== SETTINGS & CONFIGURATION ==========
      {
        action: 'read',
        scope: 'team',
        resource_type: 'settings',
        target_id: null,
        description: 'View team settings',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'settings',
        target_id: null,
        description: 'View organization settings',
      },
      {
        action: 'update',
        scope: 'team',
        resource_type: 'settings',
        target_id: null,
        description: 'Update team settings',
      },
      {
        action: 'manage',
        scope: 'global',
        resource_type: 'settings',
        target_id: null,
        description: 'Manage all system settings',
      },

      // ========== ROLES & PERMISSIONS MANAGEMENT ==========
      {
        action: 'read',
        scope: 'org',
        resource_type: 'role',
        target_id: null,
        description: 'View all roles',
      },
      {
        action: 'create',
        scope: 'global',
        resource_type: 'role',
        target_id: null,
        description: 'Create new roles',
      },
      {
        action: 'update',
        scope: 'global',
        resource_type: 'role',
        target_id: null,
        description: 'Update roles',
      },
      {
        action: 'delete',
        scope: 'global',
        resource_type: 'role',
        target_id: null,
        description: 'Delete roles',
      },
      {
        action: 'manage',
        scope: 'global',
        resource_type: 'role',
        target_id: null,
        description: 'Manage all roles',
      },
      {
        action: 'read',
        scope: 'org',
        resource_type: 'permission',
        target_id: null,
        description: 'View all permissions',
      },
      {
        action: 'manage',
        scope: 'global',
        resource_type: 'permission',
        target_id: null,
        description: 'Manage all permissions',
      },
    ];

    const permissions: Record<string, Permission> = {};

    for (const def of permissionDefinitions) {
      const permission = await this.createPermission.execute({
        action: def.action,
        scope: def.scope || null,
        target_id: def.target_id || null,
        resource_type: def.resource_type,
        description: def.description,
      });

      // Create consistent semantic key
      const key = def.target_id
        ? `${def.resource_type}:${def.action}:${def.target_id}`
        : `${def.resource_type}:${def.action}:${def.scope}`;

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
    // Helper function to grant permission by semantic key
    const grant = async (roleName: string, permissionKey: string) => {
      const permission = permissions[permissionKey];
      
      if (!permission) {
        console.warn(
          `⚠️  Permission not found: "${permissionKey}" for role "${roleName}". Available keys:`,
          Object.keys(permissions).filter(k => k.includes(permissionKey.split(':')[0])).slice(0, 5),
        );
        return;
      }

      try {
        await this.grantPermissionToRole.execute({
          roleId: roles[roleName].getId().toString(),
          permissionId: permission.getId().toString(),
        });
      } catch (error) {
        console.error(
          `❌ Failed to grant "${permissionKey}" to role "${roleName}":`,
          error instanceof Error ? error.message : error,
        );
      }
    };

    // ========== VIEWER: Base read-only role ==========
    await grant('Viewer', 'user:read:org');
    await grant('Viewer', 'user:read:team');
    await grant('Viewer', 'project:read:team');
    await grant('Viewer', 'project:read:org');
    await grant('Viewer', 'repository:read:org');
    await grant('Viewer', 'deployment:read:team');
    await grant('Viewer', 'deployment:read:org');
    await grant('Viewer', 'document:read:team');
    await grant('Viewer', 'document:read:org');
    await grant('Viewer', 'design:read:team');
    await grant('Viewer', 'design:read:org');
    await grant('Viewer', 'analytics:read:team');
    await grant('Viewer', 'analytics:read:org');
    await grant('Viewer', 'report:read:team');
    await grant('Viewer', 'report:read:org');
    await grant('Viewer', 'role:read:org');
    await grant('Viewer', 'permission:read:org');

    // ========== JUNIOR DEVELOPER ==========
    await grant('Junior Developer', 'user:update:own');
    await grant('Junior Developer', 'project:create:own');
    await grant('Junior Developer', 'project:update:own');
    await grant('Junior Developer', 'document:create:own');
    await grant('Junior Developer', 'document:update:own');

    // ========== DEVELOPER ==========
    await grant('Developer', 'user:read:team');
    await grant('Developer', 'user:update:team');
    await grant('Developer', 'repository:update:*');
    await grant('Developer', 'deployment:execute:own');
    await grant('Developer', 'document:create:team');
    await grant('Developer', 'document:update:team');

    // ========== SENIOR DEVELOPER ==========
    await grant('Senior Developer', 'repository:create:team');
    await grant('Senior Developer', 'deployment:execute:team');
    await grant('Senior Developer', 'infrastructure:read:org');
    await grant('Senior Developer', 'infrastructure:manage:db:staging');

    // ========== TECH LEAD ==========
    await grant('Tech Lead', 'user:update:team');
    await grant('Tech Lead', 'project:update:project:backend');
    await grant('Tech Lead', 'repository:update:repo:main');
    await grant('Tech Lead', 'repository:delete:repo:staging');
    await grant('Tech Lead', 'settings:read:org');

    // ========== ENGINEERING MANAGER ==========
    await grant('Engineering Manager', 'user:create:global');
    await grant('Engineering Manager', 'user:update:team');
    await grant('Engineering Manager', 'project:update:*');
    await grant('Engineering Manager', 'deployment:execute:team');
    await grant('Engineering Manager', 'billing:read:team');
    await grant('Engineering Manager', 'settings:update:team');

    // ========== CTO ==========
    await grant('CTO', 'user:delete:global');
    await grant('CTO', 'project:manage:*');
    await grant('CTO', 'repository:manage:*');
    await grant('CTO', 'deployment:execute:global');
    await grant('CTO', 'infrastructure:manage:*');
    await grant('CTO', 'billing:manage:global');
    await grant('CTO', 'settings:manage:global');
    await grant('CTO', 'role:manage:global');
    await grant('CTO', 'permission:manage:global');

    // ========== QA ENGINEER ==========
    await grant('QA Engineer', 'user:read:team');
    await grant('QA Engineer', 'repository:read:org');
    await grant('QA Engineer', 'deployment:execute:team');
    await grant('QA Engineer', 'infrastructure:manage:db:staging');
    await grant('QA Engineer', 'report:create:team');

    // ========== DESIGNER ==========
    await grant('Designer', 'user:read:team');
    await grant('Designer', 'design:create:own');
    await grant('Designer', 'design:update:own');
    await grant('Designer', 'design:create:team');
    await grant('Designer', 'design:update:team');
    await grant('Designer', 'document:create:own');
    await grant('Designer', 'document:update:own');
    await grant('Designer', 'document:create:team');
    await grant('Designer', 'document:update:team');

    // ========== DESIGN LEAD ==========
    await grant('Design Lead', 'design:delete:*');
    await grant('Design Lead', 'document:delete:*');

    // ========== PROJECT MANAGER ==========
    await grant('Project Manager', 'user:read:team');
    await grant('Project Manager', 'project:update:project:backend');
    await grant('Project Manager', 'project:update:project:frontend');
    await grant('Project Manager', 'project:update:project:devops');
    await grant('Project Manager', 'report:create:org');
    await grant('Project Manager', 'report:read:org');
    await grant('Project Manager', 'billing:read:org');
    await grant('Project Manager', 'document:read:team');
    await grant('Project Manager', 'document:create:team');
    await grant('Project Manager', 'document:update:team');

    // ========== DEVOPS ENGINEER ==========
    await grant('DevOps Engineer', 'infrastructure:manage:db:production');
    await grant('DevOps Engineer', 'infrastructure:manage:db:staging');
    await grant('DevOps Engineer', 'deployment:execute:global');
    await grant('DevOps Engineer', 'settings:update:team');

    // ========== HR MANAGER ==========
    await grant('HR Manager', 'user:create:global');
    await grant('HR Manager', 'user:read:org');
    await grant('HR Manager', 'user:update:team');
    await grant('HR Manager', 'analytics:read:org');
    await grant('HR Manager', 'settings:read:org');
  }

  private async createUsers(roles: Record<string, Role>): Promise<number> {
    /**
     * Creates realistic test users with varied roles
     * for comprehensive testing of permission hierarchies
     */
    const usersToCreate = [
      {
        name: 'Juan García',
        email: 'juan.garcia@company.com',
        role: 'Developer',
        description: 'Backend developer working on core services',
      },
      {
        name: 'María López',
        email: 'maria.lopez@company.com',
        role: 'Tech Lead',
        description: 'Technical lead overseeing the backend team',
      },
      {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@company.com',
        role: 'CTO',
        description: 'Chief Technology Officer',
      },
      {
        name: 'Ana Martínez',
        email: 'ana.martinez@company.com',
        role: 'Project Manager',
        description: 'Project manager coordinating teams',
      },
      {
        name: 'Luis Fernández',
        email: 'luis.fernandez@company.com',
        role: 'QA Engineer',
        description: 'QA engineer ensuring product quality',
      },
      {
        name: 'Sofía González',
        email: 'sofia.gonzalez@company.com',
        role: 'Senior Developer',
        description: 'Senior developer with deployment rights',
      },
      {
        name: 'Pedro Jiménez',
        email: 'pedro.jimenez@company.com',
        role: 'DevOps Engineer',
        description: 'DevOps engineer managing infrastructure',
      },
      {
        name: 'Laura Sánchez',
        email: 'laura.sanchez@company.com',
        role: 'Designer',
        description: 'UI/UX designer creating design assets',
      },
      {
        name: 'Roberto Díaz',
        email: 'roberto.diaz@company.com',
        role: 'Junior Developer',
        description: 'Junior developer learning the ropes',
      },
      {
        name: 'Elena Moreno',
        email: 'elena.moreno@company.com',
        role: 'Engineering Manager',
        description: 'Engineering manager overseeing multiple teams',
      },
      {
        name: 'Miguel Ruiz',
        email: 'miguel.ruiz@company.com',
        role: 'HR Manager',
        description: 'HR manager handling recruitment and personnel',
      },
      {
        name: 'Isabel Vargas',
        email: 'isabel.vargas@company.com',
        role: 'Viewer',
        description: 'Stakeholder with read-only access',
      },
    ];

    let count = 0;

    for (const userDef of usersToCreate) {
      // Create user
      const user = await this.createUser.execute({
        name: userDef.name,
        email: userDef.email,
      });

      // Assign role
      const role = roles[userDef.role];
      if (role) {
        await this.assignRoleToUser.execute({
          userId: user.getId().toString(),
          roleId: role.getId().toString(),
        });
        count++;
      }
    }

    return count;
  }
}
