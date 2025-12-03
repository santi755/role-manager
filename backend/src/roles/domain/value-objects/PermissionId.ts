import { randomUUID } from 'crypto';

export class PermissionId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): PermissionId {
    return new PermissionId(randomUUID());
  }

  static fromString(value: string): PermissionId {
    if (!this.isValidUUID(value)) {
      throw new Error(`Invalid PermissionId: ${value}`);
    }
    return new PermissionId(value);
  }

  private static isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PermissionId): boolean {
    return this.value === other.value;
  }
}
