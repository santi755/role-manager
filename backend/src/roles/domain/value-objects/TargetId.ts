export type TargetIdType = 'specific' | 'wildcard' | 'none';

/**
 * TargetId represents the three mutually exclusive ways to define a permission scope:
 * 1. Specific: targets a specific resource (e.g., "project:123", "doc:abc")
 * 2. Wildcard: targets all resources of a type (e.g., "*")
 * 3. None: no specific target (scope will be resolved dynamically at runtime)
 */
export class TargetId {
  private readonly type: TargetIdType;
  private readonly value?: string;

  private constructor(type: TargetIdType, value?: string) {
    if (type === 'specific' && !value) {
      throw new Error('Value is required when target type is "specific"');
    }
    if (type !== 'specific' && value) {
      throw new Error(
        'Value should only be provided when target type is "specific"',
      );
    }
    this.type = type;
    this.value = value;
  }

  /**
   * Creates a specific target (e.g., "project:123", "doc:abc")
   */
  static specific(value: string): TargetId {
    if (!value || value.trim().length === 0) {
      throw new Error('Target value cannot be empty for specific target');
    }
    return new TargetId('specific', value);
  }

  /**
   * Creates a wildcard target ("*") - applies to all resources of the type
   */
  static wildcard(): TargetId {
    return new TargetId('wildcard');
  }

  /**
   * Creates a null/none target - scope will be resolved dynamically
   */
  static none(): TargetId {
    return new TargetId('none');
  }

  /**
   * Creates from string representation
   */
  static fromString(value: string | null | undefined): TargetId {
    if (!value || value === 'null') {
      return TargetId.none();
    }
    if (value === '*') {
      return TargetId.wildcard();
    }
    return TargetId.specific(value);
  }

  isSpecific(): boolean {
    return this.type === 'specific';
  }

  isWildcard(): boolean {
    return this.type === 'wildcard';
  }

  isNone(): boolean {
    return this.type === 'none';
  }

  getType(): TargetIdType {
    return this.type;
  }

  getValue(): string | undefined {
    return this.value;
  }

  toString(): string {
    if (this.type === 'wildcard') {
      return '*';
    }
    if (this.type === 'none') {
      return 'null';
    }
    return this.value!;
  }

  toJSON(): string | null {
    if (this.type === 'none') {
      return null;
    }
    if (this.type === 'wildcard') {
      return '*';
    }
    return this.value as string;
  }

  equals(other: TargetId): boolean {
    return this.type === other.type && this.value === other.value;
  }

  /**
   * Check if this target matches another target.
   * Wildcard matches everything, specific matches only exact values.
   */
  matches(other: TargetId): boolean {
    if (this.isWildcard() || other.isWildcard()) {
      return true;
    }
    return this.equals(other);
  }
}
