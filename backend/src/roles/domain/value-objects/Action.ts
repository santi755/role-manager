/**
 * Common action types - can be extended with any string
 */
export const COMMON_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXECUTE: 'execute',
  MANAGE: 'manage',
  SHARE: 'share',
} as const;

/**
 * Action represents an operation that can be performed on a resource.
 * Unlike the previous implementation, this is now flexible and accepts any string.
 */
export class Action {
  private readonly value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Action value cannot be empty');
    }
    this.value = value.toLowerCase();
  }

  static create(value: string): Action {
    return new Action(value);
  }

  static fromString(value: string): Action {
    return new Action(value);
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Action): boolean {
    return this.value === other.value;
  }

  /**
   * Check if this action implies another action.
   * The 'manage' action implies all other actions.
   * Custom implication logic can be added based on action hierarchies.
   */
  implies(other: Action): boolean {
    if (this.value === COMMON_ACTIONS.MANAGE) {
      return true; // MANAGE implies all actions
    }
    return this.equals(other);
  }
}
