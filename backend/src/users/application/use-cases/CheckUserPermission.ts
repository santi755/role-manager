import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import type { PermissionRepository } from '../../../roles/domain/repositories/PermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { Action } from '../../../roles/domain/value-objects/Action';
import { Resource } from '../../../roles/domain/value-objects/Resource';
import { RoleGraphService } from '../../../roles/domain/services/RoleGraphService';
import { PermissionGraphService } from '../../../roles/domain/services/PermissionGraphService';

export interface CheckUserPermissionQuery {
  userId: string;
  resource: string;
  action: string;
}

export interface CheckUserPermissionResult {
  hasPermission: boolean;
  reason: string;
}

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
  ) {}

  async execute(
    query: CheckUserPermissionQuery,
  ): Promise<CheckUserPermissionResult> {
    const userId = UserId.fromString(query.userId);
    const requestedAction = Action.fromString(query.action);
    const requestedResource = Resource.create(query.resource);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with id ${query.userId} not found`);
    }

    // Check for direct permission denial (highest priority)
    const allPermissions = await this.permissionRepository.findAll();
    const permissionsMap = new Map(
      allPermissions.map((p) => [p.getId().toString(), p]),
    );

    for (const permission of allPermissions) {
      if (
        permission.getAction().equals(requestedAction) &&
        permission.getResource().equals(requestedResource)
      ) {
        if (user.hasDirectPermissionDenial(permission.getId())) {
          return {
            hasPermission: false,
            reason: 'Direct permission denial',
          };
        }
      }
    }

    // Check for direct permission grant
    for (const permission of allPermissions) {
      if (
        permission.getAction().equals(requestedAction) &&
        permission.getResource().equals(requestedResource)
      ) {
        if (user.hasDirectPermissionGrant(permission.getId())) {
          return {
            hasPermission: true,
            reason: 'Direct permission grant',
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

    // Check if any effective permission matches the requested resource:action
    for (const permissionId of effectivePermissions) {
      const permission = permissionsMap.get(permissionId.toString());
      if (
        permission &&
        permission.getAction().equals(requestedAction) &&
        permission.getResource().equals(requestedResource)
      ) {
        return {
          hasPermission: true,
          reason: 'Permission granted through role assignment',
        };
      }

      // Check for wildcard matches on resource
      if (
        permission &&
        permission.getAction().equals(requestedAction) &&
        requestedResource.matches(permission.getResource())
      ) {
        return {
          hasPermission: true,
          reason: 'Permission granted through wildcard role assignment',
        };
      }
    }

    return {
      hasPermission: false,
      reason: 'No matching permission found',
    };
  }
}
