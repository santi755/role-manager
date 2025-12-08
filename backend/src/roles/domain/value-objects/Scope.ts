export type ScopeLevel = 'own' | 'team' | 'org' | 'global' | 'specific';

export interface ScopeData {
  level: ScopeLevel;
  target?: string;
}

export class Scope {
  private readonly level: ScopeLevel;
  private readonly target?: string;

  private constructor(level: ScopeLevel, target?: string) {
    if (level === 'specific' && !target) {
      throw new Error('Target is required when scope level is "specific"');
    }
    if (level !== 'specific' && target) {
      throw new Error('Target should only be provided when scope level is "specific"');
    }
    this.level = level;
    this.target = target;
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

  static specific(target: string): Scope {
    if (!target || target.trim().length === 0) {
      throw new Error('Target cannot be empty for specific scope');
    }
    return new Scope('specific', target);
  }

  static fromData(data: ScopeData): Scope {
    return new Scope(data.level, data.target);
  }

  static fromString(value: string): Scope {
    // Parse "specific:project:123" format
    if (value.startsWith('specific:')) {
      const target = value.substring(9); // Remove "specific:"
      return Scope.specific(target);
    }

    // Parse simple level
    const validLevels: ScopeLevel[] = ['own', 'team', 'org', 'global', 'specific'];
    const level = value.toLowerCase() as ScopeLevel;
    
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid scope level: ${value}. Must be one of: ${validLevels.join(', ')}`);
    }

    return new Scope(level);
  }

  getLevel(): ScopeLevel {
    return this.level;
  }

  getTarget(): string | undefined {
    return this.target;
  }

  toData(): ScopeData {
    const data: ScopeData = { level: this.level };
    if (this.target) {
      data.target = this.target;
    }
    return data;
  }

  toString(): string {
    if (this.level === 'specific' && this.target) {
      return `specific:${this.target}`;
    }
    return this.level;
  }

  equals(other: Scope): boolean {
    return this.level === other.level && this.target === other.target;
  }

  /**
   * Check if this scope implies another scope.
   * Scope hierarchy: global > org > team > own
   * Specific scopes only match exactly.
   */
  implies(other: Scope): boolean {
    const hierarchy: ScopeLevel[] = ['global', 'org', 'team', 'own'];

    const thisIndex = hierarchy.indexOf(this.level);
    const otherIndex = hierarchy.indexOf(other.level);

    // Higher scope implies lower scope
    if (thisIndex !== -1 && otherIndex !== -1) {
      return thisIndex <= otherIndex;
    }

    // Specific scopes only match exactly
    if (this.level === 'specific' || other.level === 'specific') {
      return this.equals(other);
    }

    return false;
  }
}
