import { randomUUID } from 'crypto';

export class RoleId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): RoleId {
    return new RoleId(randomUUID());
  }

  static fromString(value: string): RoleId {
    if (!this.isValidUUID(value)) {
      throw new Error(`Invalid RoleId: ${value}`);
    }
    return new RoleId(value);
  }

  private static isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: RoleId): boolean {
    return this.value === other.value;
  }
}
