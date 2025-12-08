/**
 * ScopeLevel represents dynamic scope levels that are resolved at runtime.
 * These are used when target_id is null/none.
 */
export type ScopeLevel = 'own' | 'team' | 'org' | 'global';

/**
 * Scope represents a dynamic permission scope that is resolved at runtime.
 * This is only used when TargetId is none (null).
 * Scope hierarchy: global > org > team > own
 */
export class Scope {
  private readonly level: ScopeLevel;

  private constructor(level: ScopeLevel) {
    this.level = level;
  }

  static own(): Scope {
    return new Scope('own');
  }

  static team(): Scope {
    return new Scope('team');
  }

  static org(): Scope {
    return new Scope('org');
  }

  static global(): Scope {
    return new Scope('global');
  }

  static fromString(value: string): Scope {
    const validLevels: ScopeLevel[] = ['own', 'team', 'org', 'global'];
    const level = value.toLowerCase() as ScopeLevel;

    if (!validLevels.includes(level)) {
      throw new Error(
        `Invalid scope level: ${value}. Must be one of: ${validLevels.join(', ')}`,
      );
    }

    return new Scope(level);
  }

  getLevel(): ScopeLevel {
    return this.level;
  }

  toString(): string {
    return this.level;
  }

  toJSON(): string {
    return this.level;
  }

  equals(other: Scope): boolean {
    return this.level === other.level;
  }

  /**
   * Check if this scope implies another scope.
   * Scope hierarchy: global > org > team > own
   * Higher scopes imply lower scopes.
   */
  implies(other: Scope): boolean {
    const hierarchy: ScopeLevel[] = ['global', 'org', 'team', 'own'];

    const thisIndex = hierarchy.indexOf(this.level);
    const otherIndex = hierarchy.indexOf(other.level);

    // Higher scope implies lower scope
    return thisIndex <= otherIndex;
  }
}
