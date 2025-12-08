export class Resource {
  private readonly name: string;

  private constructor(name: string) {
    this.name = name;
  }

  static create(name: string): Resource {
    if (!name || name.trim().length === 0) {
      throw new Error('Resource name cannot be empty');
    }
    return new Resource(name.toLowerCase());
  }

  getName(): string {
    return this.name;
  }

  toString(): string {
    return this.name;
  }

  equals(other: Resource): boolean {
    return this.name === other.name;
  }

  /**
   * Check if this resource matches a pattern.
   * Supports wildcard matching with '*'.
   */
  matches(pattern: Resource): boolean {
    if (pattern.name === '*') {
      return true;
    }
    return this.equals(pattern);
  }
}
