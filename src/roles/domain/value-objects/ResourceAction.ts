export class ResourceAction {
    private readonly resource: string;
    private readonly action: string;

    private constructor(resource: string, action: string) {
        this.resource = resource;
        this.action = action;
    }

    static create(resource: string, action: string): ResourceAction {
        if (!resource || resource.trim().length === 0) {
            throw new Error('Resource cannot be empty');
        }
        if (!action || action.trim().length === 0) {
            throw new Error('Action cannot be empty');
        }
        return new ResourceAction(resource.toLowerCase(), action.toLowerCase());
    }

    static fromString(value: string): ResourceAction {
        const parts = value.split(':');
        if (parts.length !== 2) {
            throw new Error(
                `Invalid ResourceAction format: ${value}. Expected format: resource:action`,
            );
        }
        return ResourceAction.create(parts[0], parts[1]);
    }

    toString(): string {
        return `${this.resource}:${this.action}`;
    }

    getResource(): string {
        return this.resource;
    }

    getAction(): string {
        return this.action;
    }

    equals(other: ResourceAction): boolean {
        return this.resource === other.resource && this.action === other.action;
    }

    matches(pattern: ResourceAction): boolean {
        const resourceMatches =
            pattern.resource === '*' || this.resource === pattern.resource;
        const actionMatches =
            pattern.action === '*' || this.action === pattern.action;
        return resourceMatches && actionMatches;
    }
}
