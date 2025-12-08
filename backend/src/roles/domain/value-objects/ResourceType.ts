/**
 * ResourceType represents the type of resource a permission applies to.
 * Examples: "project", "document", "user", "org", "folder", etc.
 */
export class ResourceType {
  private readonly type: string;

  private constructor(type: string) {
    if (!type || type.trim().length === 0) {
      throw new Error('Resource type cannot be empty');
    }
    this.type = type.toLowerCase();
  }

  static create(type: string): ResourceType {
    return new ResourceType(type);
  }

  getType(): string {
    return this.type;
  }

  toString(): string {
    return this.type;
  }

  toJSON(): string {
    return this.type;
  }

  equals(other: ResourceType): boolean {
    return this.type === other.type;
  }

  /**
   * Check if this resource type matches a pattern.
   * Supports wildcard matching with '*'.
   */
  matches(pattern: ResourceType): boolean {
    if (pattern.type === '*') {
      return true;
    }
    return this.equals(pattern);
  }
}
