import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import type { PermissionRepository } from '../../../roles/domain/repositories/PermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { Action } from '../../../roles/domain/value-objects/Action';
import { ResourceType } from '../../../roles/domain/value-objects/ResourceType';
import { RoleGraphService } from '../../../roles/domain/services/RoleGraphService';
import { PermissionGraphService } from '../../../roles/domain/services/PermissionGraphService';
import { PermissionEvaluator } from '../../../roles/domain/services/PermissionEvaluator';
import { PermissionContext } from '../../../roles/domain/value-objects/PermissionContext';

export interface CheckUserPermissionQuery {
  userId: string;
  resource: string;
  action: string;
  // Context parameters for scope evaluation
  resourceOwnerId?: string;
  teamId?: string;
  organizationId?: string;
  resourceId?: string;
}

export interface CheckUserPermissionResult {
  hasPermission: boolean;
  reason: string;
  grantedBy?: string;
}

/**
 * CheckUserPermission evaluates whether a user has permission to perform
 * an action on a resource in a specific context.
 *
 * This use case now uses PermissionEvaluator for context-aware evaluation,
 * supporting dynamic scopes (own/team/org/global) and specific targets.
 */
@Injectable()
export class CheckUserPermission {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
    private readonly roleGraphService: RoleGraphService,
    private readonly permissionGraphService: PermissionGraphService,
    private readonly permissionEvaluator: PermissionEvaluator,
  ) {}

  async execute(
    query: CheckUserPermissionQuery,
  ): Promise<CheckUserPermissionResult> {
    const userId = UserId.fromString(query.userId);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with id ${query.userId} not found`);
    }

    // Build permission context for evaluation
    const context: PermissionContext = {
      userId: query.userId,
      action: Action.fromString(query.action),
      resource: ResourceType.create(query.resource),
      resourceOwnerId: query.resourceOwnerId,
      teamId: query.teamId,
      organizationId: query.organizationId,
      resourceId: query.resourceId,
    };

    // Load all permissions for mapping
    const allPermissions = await this.permissionRepository.findAll();
    const permissionsMap = new Map(
      allPermissions.map((p) => [p.getId().toString(), p]),
    );

    // Check for direct permission denial (highest priority)
    for (const permission of allPermissions) {
      if (user.hasDirectPermissionDenial(permission.getId())) {
        // Evaluate if this denial applies in the current context
        if (this.permissionEvaluator.evaluate(permission, context)) {
          return {
            hasPermission: false,
            reason: 'Direct permission denial',
          };
        }
      }
    }

    // Check for direct permission grant
    for (const permission of allPermissions) {
      if (user.hasDirectPermissionGrant(permission.getId())) {
        // Evaluate if this grant applies in the current context
        if (this.permissionEvaluator.evaluate(permission, context)) {
          return {
            hasPermission: true,
            reason: 'Direct permission grant',
            grantedBy: permission.getId().toString(),
          };
        }
      }
    }

    // Get all user roles
    const userRoles = await this.roleRepository.findByIds(
      Array.from(user.getAssignedRoles()),
    );

    if (userRoles.length === 0) {
      return {
        hasPermission: false,
        reason: 'User has no roles assigned',
      };
    }

    // Get all roles (for graph traversal)
    const allRoles = await this.roleRepository.findAll();
    const rolesMap = new Map(allRoles.map((r) => [r.getId().toString(), r]));

    // Calculate effective permissions from roles (including inherited)
    const effectivePermissions =
      this.roleGraphService.calculateEffectivePermissions(
        new Set(userRoles),
        rolesMap,
      );

    // Evaluate each effective permission in the current context
    for (const permissionId of effectivePermissions) {
      const permission = permissionsMap.get(permissionId.toString());

      if (
        permission &&
        this.permissionEvaluator.evaluate(permission, context)
      ) {
        return {
          hasPermission: true,
          reason: 'Permission granted through role assignment',
          grantedBy: permission.getId().toString(),
        };
      }
    }

    return {
      hasPermission: false,
      reason: 'No matching permission found',
    };
  }
}
