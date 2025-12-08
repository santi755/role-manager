export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage';

export class Action {
  private readonly type: ActionType;

  private constructor(type: ActionType) {
    this.type = type;
  }

  static create(type: ActionType): Action {
    return new Action(type);
  }

  static fromString(value: string): Action {
    const validActions: ActionType[] = ['create', 'read', 'update', 'delete', 'execute', 'manage'];
    const type = value.toLowerCase() as ActionType;
    
    if (!validActions.includes(type)) {
      throw new Error(`Invalid action type: ${value}. Must be one of: ${validActions.join(', ')}`);
    }
    
    return new Action(type);
  }

  getType(): ActionType {
    return this.type;
  }

  toString(): string {
    return this.type;
  }

  equals(other: Action): boolean {
    return this.type === other.type;
  }

  /**
   * Check if this action implies another action.
   * The 'manage' action implies all other actions.
   */
  implies(other: Action): boolean {
    if (this.type === 'manage') {
      return true; // MANAGE implies all actions
    }
    return this.equals(other);
  }
}
