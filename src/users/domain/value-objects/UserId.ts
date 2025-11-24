import { randomUUID } from 'crypto';

export class UserId {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(): UserId {
        return new UserId(randomUUID());
    }

    static fromString(value: string): UserId {
        if (!this.isValidUUID(value)) {
            throw new Error(`Invalid UserId: ${value}`);
        }
        return new UserId(value);
    }

    private static isValidUUID(value: string): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: UserId): boolean {
        return this.value === other.value;
    }
}
