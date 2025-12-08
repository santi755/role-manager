import { Action } from './Action';
import { ResourceType } from './ResourceType';

/**
 * PermissionContext represents the runtime context for permission evaluation.
 * It contains all the information needed to evaluate whether a permission
 * should grant access to a specific resource in a specific situation.
 */
export interface PermissionContext {
  /**
   * The user attempting to perform the action
   */
  userId: string;

  /**
   * The action being attempted (e.g., 'read', 'update', 'delete')
   */
  action: Action;

  /**
   * The type of resource being accessed (e.g., 'users', 'posts', 'projects')
   */
  resource: ResourceType;

  /**
   * The ID of the user who owns the resource (for 'own' scope evaluation)
   */
  resourceOwnerId?: string;

  /**
   * The team ID associated with the resource (for 'team' scope evaluation)
   */
  teamId?: string;

  /**
   * The organization ID associated with the resource (for 'org' scope evaluation)
   */
  organizationId?: string;

  /**
   * The specific ID of the resource being accessed (for 'specific' target evaluation)
   */
  resourceId?: string;
}
