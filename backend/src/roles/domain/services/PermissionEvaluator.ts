import { Injectable } from '@nestjs/common';
import { Permission } from '../Permission';
import { PermissionContext } from '../value-objects/PermissionContext';
import { TargetId } from '../value-objects/TargetId';
import { Scope } from '../value-objects/Scope';

/**
 * PermissionEvaluator is responsible for evaluating whether a permission
 * grants access in a given runtime context.
 *
 * This service handles:
 * - Action hierarchy (manage implies all actions)
 * - Resource matching (exact match + wildcard)
 * - Scope evaluation (own/team/org/global)
 * - Target matching (specific/wildcard/none)
 */
@Injectable()
export class PermissionEvaluator {
  /**
   * Evaluates if a permission grants access in a given context
   *
   * @param permission The permission to evaluate
   * @param context The runtime context (user, action, resource, etc.)
   * @returns true if the permission grants access, false otherwise
   */
  evaluate(permission: Permission, context: PermissionContext): boolean {
    // 1. Check if resource matches (exact match or wildcard)
    if (!permission.getResourceType().matches(context.resource)) {
      return false;
    }

    // 2. Check if action matches (with hierarchy - manage implies all)
    if (!permission.getAction().implies(context.action)) {
      return false;
    }

    // 3. Check target and scope matching
    return this.evaluateTargetAndScope(
      permission.getTargetId(),
      permission.getScope(),
      context,
    );
  }

  /**
   * Evaluates target_id and scope together.
   * They are mutually exclusive:
   * - If target_id is 'specific' or 'wildcard', scope is ignored
   * - If target_id is 'none', scope must be evaluated
   */
  private evaluateTargetAndScope(
    targetId: TargetId,
    scope: Scope | undefined,
    context: PermissionContext,
  ): boolean {
    // Case 1: Wildcard target - matches everything
    if (targetId.isWildcard()) {
      return true;
    }

    // Case 2: Specific target - must match exact resource ID
    if (targetId.isSpecific()) {
      return this.evaluateSpecificTarget(targetId, context);
    }

    // Case 3: None target - evaluate dynamic scope
    if (targetId.isNone() && scope) {
      return this.evaluateScope(scope, context);
    }

    // Invalid state: target is none but no scope provided
    return false;
  }

  /**
   * Evaluates a specific target ID against the context
   */
  private evaluateSpecificTarget(
    targetId: TargetId,
    context: PermissionContext,
  ): boolean {
    const targetValue = targetId.getValue();

    // The target value should match the resourceId in the context
    // For example: target "project:123" should match resourceId "project:123"
    return targetValue === context.resourceId;
  }

  /**
   * Evaluates a dynamic scope against the context
   *
   * Scope hierarchy: global > org > team > own
   * - global: Always grants access
   * - org: Grants access if resource belongs to user's organization
   * - team: Grants access if resource belongs to user's team
   * - own: Grants access if resource belongs to the user
   */
  private evaluateScope(scope: Scope, context: PermissionContext): boolean {
    const level = scope.getLevel();

    switch (level) {
      case 'global':
        // Global scope always grants access
        return true;

      case 'org':
        // Organization scope: both user and resource must be in the same org
        return (
          context.organizationId !== undefined &&
          context.organizationId !== null &&
          context.organizationId.length > 0
        );

      case 'team':
        // Team scope: both user and resource must be in the same team
        return (
          context.teamId !== undefined &&
          context.teamId !== null &&
          context.teamId.length > 0
        );

      case 'own':
        // Own scope: resource must be owned by the user
        return (
          context.resourceOwnerId !== undefined &&
          context.resourceOwnerId === context.userId
        );

      default:
        return false;
    }
  }

  /**
   * Evaluates if any permission in a list grants access in the given context
   *
   * @param permissions List of permissions to evaluate
   * @param context The runtime context
   * @returns The first permission that grants access, or undefined if none do
   */
  evaluateAny(
    permissions: Permission[],
    context: PermissionContext,
  ): Permission | undefined {
    return permissions.find((permission) => this.evaluate(permission, context));
  }

  /**
   * Evaluates if any permission in a list grants access in the given context
   *
   * @param permissions List of permissions to evaluate
   * @param context The runtime context
   * @returns true if at least one permission grants access
   */
  hasPermission(
    permissions: Permission[],
    context: PermissionContext,
  ): boolean {
    return this.evaluateAny(permissions, context) !== undefined;
  }
}
