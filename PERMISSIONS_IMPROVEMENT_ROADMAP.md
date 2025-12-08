# 🚀 RBAC System Improvement Roadmap

## Separating Permissions into Action + Scope Architecture

> **Goal**: Transform the current simple `resource:action` permission model into a high-level, enterprise-grade system with orthogonal **Action** and **Scope** dimensions.

---

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target Architecture](#target-architecture)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Steps](#detailed-steps)
5. [Migration Strategy](#migration-strategy)
6. [Testing Strategy](#testing-strategy)
7. [Success Metrics](#success-metrics)

---

## 🔍 Current State Analysis

### What We Have Now

The current system uses a simple **ResourceAction** model:

- Format: `resource:action` (e.g., `users:read`, `posts:edit`)
- Single-dimensional permissions
- No concept of scope or context
- Limited granularity

**Example Current Permission:**

```typescript
ResourceAction.create("users", "read"); // Can read ALL users
```

### Limitations

❌ Cannot restrict permissions to specific scopes (own data, team data, org data)  
❌ No support for hierarchical resource access  
❌ Cannot express "read own posts" vs "read all posts"  
❌ Difficult to implement multi-tenancy  
❌ No support for attribute-based conditions

---

## 🎯 Target Architecture

### Two Orthogonal Axes

```
Permission = Action × Scope × Resource
```

#### 1. **Action** (What can be done)

- `create` - Create new resources
- `read` - View/retrieve resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `execute` - Run operations/commands
- `manage` - Full control (implies all actions)

#### 2. **Scope** (Where/to whom it applies)

Scope is an object with two properties:

- `level`: The scope level (required)
  - `own` - Only resources owned by the user
  - `team` - Resources within user's team
  - `org` - All resources in the organization
  - `global` - System-wide access (admin level)
  - `specific` - Specific resource instance
- `target`: Resource identifier (required only when level === 'specific')

#### 3. **Resource** (What entity)

- `users`, `posts`, `comments`, `projects`, etc.

### Example New Permissions

```typescript
// Read only own posts
{
  action: "read",
  resource: "posts",
  scope: {
    level: "own"
  }
}

// Update all users in organization
{
  action: "update",
  resource: "users",
  scope: {
    level: "org"
  }
}

// Delete specific project
{
  action: "delete",
  resource: "project",
  scope: {
    level: "specific",
    target: "project:123"
  }
}
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Design new domain model
- [ ] Create new value objects
- [ ] Update entity models
- [ ] Write comprehensive tests

### Phase 2: Core Implementation (Week 3-4)

- [ ] Implement permission evaluation engine
- [ ] Add scope resolution logic
- [ ] Update graph services
- [ ] Migrate repositories

### Phase 3: API & Integration (Week 5-6)

- [ ] Update REST API endpoints
- [ ] Modify DTOs and mappers
- [ ] Update frontend integration
- [ ] Add API documentation

### Phase 4: Migration & Testing (Week 7-8)

- [ ] Create migration scripts
- [ ] Backward compatibility layer
- [ ] End-to-end testing
- [ ] Performance optimization

---

## 🛠️ Detailed Steps

### Step 1: Create New Value Objects

#### 1.1 Create `Action` Value Object

**File**: `backend/src/roles/domain/value-objects/Action.ts`

```typescript
export enum ActionType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  EXECUTE = "execute",
  MANAGE = "manage",
}

export class Action {
  private readonly type: ActionType;

  private constructor(type: ActionType) {
    this.type = type;
  }

  static create(type: ActionType): Action {
    return new Action(type);
  }

  static fromString(value: string): Action {
    const type = Object.values(ActionType).find(
      (t) => t === value.toLowerCase()
    );
    if (!type) {
      throw new Error(`Invalid action type: ${value}`);
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

  // Action hierarchy: manage > all other actions
  implies(other: Action): boolean {
    if (this.type === ActionType.MANAGE) {
      return true; // MANAGE implies all actions
    }
    return this.equals(other);
  }
}
```

#### 1.2 Create `Scope` Value Object

**File**: `backend/src/roles/domain/value-objects/Scope.ts`

```typescript
export type ScopeLevel = "own" | "team" | "org" | "global" | "specific";

export interface ScopeData {
  level: ScopeLevel;
  target?: string; // Solo requerido cuando level === 'specific'
}

export class Scope {
  private readonly level: ScopeLevel;
  private readonly target?: string;

  private constructor(level: ScopeLevel, target?: string) {
    if (level === "specific" && !target) {
      throw new Error('Target is required when scope level is "specific"');
    }
    if (level !== "specific" && target) {
      throw new Error(
        'Target should only be provided when scope level is "specific"'
      );
    }
    this.level = level;
    this.target = target;
  }

  static own(): Scope {
    return new Scope("own");
  }

  static team(): Scope {
    return new Scope("team");
  }

  static org(): Scope {
    return new Scope("org");
  }

  static global(): Scope {
    return new Scope("global");
  }

  static specific(target: string): Scope {
    if (!target || target.trim().length === 0) {
      throw new Error("Target cannot be empty for specific scope");
    }
    return new Scope("specific", target);
  }

  static fromData(data: ScopeData): Scope {
    return new Scope(data.level, data.target);
  }

  static fromString(value: string): Scope {
    // Parse "specific:project:123" format
    if (value.startsWith("specific:")) {
      const target = value.substring(9); // Remove "specific:"
      return Scope.specific(target);
    }

    // Parse simple level
    const validLevels: ScopeLevel[] = [
      "own",
      "team",
      "org",
      "global",
      "specific",
    ];
    const level = value.toLowerCase() as ScopeLevel;

    if (!validLevels.includes(level)) {
      throw new Error(`Invalid scope level: ${value}`);
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
    if (this.level === "specific" && this.target) {
      return `specific:${this.target}`;
    }
    return this.level;
  }

  equals(other: Scope): boolean {
    return this.level === other.level && this.target === other.target;
  }

  // Scope hierarchy: global > org > team > own
  // specific scopes only match exactly
  implies(other: Scope): boolean {
    const hierarchy: ScopeLevel[] = ["global", "org", "team", "own"];

    const thisIndex = hierarchy.indexOf(this.level);
    const otherIndex = hierarchy.indexOf(other.level);

    // Higher scope implies lower scope
    if (thisIndex !== -1 && otherIndex !== -1) {
      return thisIndex <= otherIndex;
    }

    // Specific scopes only match exactly
    if (this.level === "specific" || other.level === "specific") {
      return this.equals(other);
    }

    return false;
  }
}
```

#### 1.3 Create `Resource` Value Object

**File**: `backend/src/roles/domain/value-objects/Resource.ts`

```typescript
export class Resource {
  private readonly name: string;

  private constructor(name: string) {
    this.name = name;
  }

  static create(name: string): Resource {
    if (!name || name.trim().length === 0) {
      throw new Error("Resource name cannot be empty");
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

  // Support wildcard matching
  matches(pattern: Resource): boolean {
    if (pattern.name === "*") {
      return true;
    }
    return this.equals(pattern);
  }
}
```

---

### Step 2: Update Permission Entity

#### 2.1 Refactor Permission Class

**File**: `backend/src/roles/domain/Permission.ts`

**Changes:**

- Replace `ResourceAction` with separate `Action`, `Scope`, and `Resource`
- Add permission evaluation logic
- Support permission implication (hierarchy)

```typescript
import { PermissionId } from "./value-objects/PermissionId";
import { Action } from "./value-objects/Action";
import { Scope } from "./value-objects/Scope";
import { Resource } from "./value-objects/Resource";

export class Permission {
  private readonly id: PermissionId;
  private readonly action: Action;
  private readonly scope: Scope;
  private readonly resource: Resource;
  private readonly description: string;
  private readonly createdAt: Date;
  private readonly parentPermissions: Set<PermissionId>;

  // ... constructor and factory methods

  // New method: Check if this permission implies another
  implies(other: Permission): boolean {
    return (
      this.action.implies(other.action) &&
      this.scope.implies(other.scope) &&
      this.resource.equals(other.resource)
    );
  }

  // New method: Check if permission applies to a specific context
  appliesTo(context: PermissionContext): boolean {
    if (!this.resource.equals(context.resource)) {
      return false;
    }

    if (!this.action.equals(context.action)) {
      return false;
    }

    return this.scope.matchesContext(context);
  }
}
```

---

### Step 3: Create Permission Evaluation Engine

#### 3.1 Create PermissionContext

**File**: `backend/src/roles/domain/value-objects/PermissionContext.ts`

```typescript
export interface PermissionContext {
  userId: string;
  action: Action;
  resource: Resource;
  resourceOwnerId?: string;
  teamId?: string;
  organizationId?: string;
  resourceId?: string;
}
```

#### 3.2 Create PermissionEvaluator Service

**File**: `backend/src/roles/domain/services/PermissionEvaluator.ts`

```typescript
export class PermissionEvaluator {
  /**
   * Evaluates if a permission grants access in a given context
   */
  evaluate(permission: Permission, context: PermissionContext): boolean {
    // Check resource match
    if (!permission.getResource().equals(context.resource)) {
      return false;
    }

    // Check action match (with hierarchy)
    if (!permission.getAction().implies(context.action)) {
      return false;
    }

    // Check scope match (with context)
    return this.evaluateScope(permission.getScope(), context);
  }

  private evaluateScope(scope: Scope, context: PermissionContext): boolean {
    switch (scope.getLevel()) {
      case "global":
        return true;

      case "org":
        return context.organizationId !== undefined;

      case "team":
        return context.teamId !== undefined;

      case "own":
        return context.resourceOwnerId === context.userId;

      case "specific":
        // Match specific resource by target (e.g., "project:123")
        return scope.getTarget() === context.resourceId;

      default:
        return false;
    }
  }
}
```

---

### Step 4: Update Use Cases

#### 4.1 Update CreatePermission Use Case

**File**: `backend/src/roles/application/use-cases/CreatePermission.ts`

**Changes:**

- Accept `action`, `scope`, and `resource` instead of `resourceAction`
- Validate new permission structure

#### 4.2 Update CheckUserPermission Use Case

**File**: `backend/src/users/application/use-cases/CheckUserPermission.ts`

**Changes:**

- Build `PermissionContext` from request
- Use `PermissionEvaluator` for evaluation
- Support scope-based checks

```typescript
export class CheckUserPermission {
  async execute(request: {
    userId: string;
    action: string;
    resource: string;
    resourceOwnerId?: string;
    teamId?: string;
    organizationId?: string;
    resourceId?: string;
  }): Promise<PermissionCheckResult> {
    const user = await this.userRepository.findById(
      UserId.fromString(request.userId)
    );

    const context: PermissionContext = {
      userId: request.userId,
      action: Action.fromString(request.action),
      resource: Resource.create(request.resource),
      resourceOwnerId: request.resourceOwnerId,
      teamId: request.teamId,
      organizationId: request.organizationId,
      resourceId: request.resourceId,
    };

    // Get all user permissions (from roles + direct grants)
    const permissions = await this.getUserEffectivePermissions(user);

    // Evaluate each permission
    for (const permission of permissions) {
      if (this.permissionEvaluator.evaluate(permission, context)) {
        return {
          hasPermission: true,
          reason: "Permission granted",
          grantedBy: permission.getId().toString(),
        };
      }
    }

    return {
      hasPermission: false,
      reason: "No matching permission found",
    };
  }
}
```

---

### Step 5: Update Database Schema

#### 5.1 Update Permission Schema

**File**: `backend/src/roles/infrastructure/persistence/schemas/PermissionSchema.ts`

**Changes:**

```typescript
export const PermissionSchema = new Schema({
  _id: { type: String, required: true },
  // OLD: resourceAction: { type: String, required: true },
  // NEW:
  action: {
    type: String,
    required: true,
    enum: ["create", "read", "update", "delete", "execute", "manage"],
  },
  scope: {
    level: {
      type: String,
      required: true,
      enum: ["own", "team", "org", "global", "specific"],
    },
    target: {
      type: String,
      required: false, // Solo requerido cuando level === 'specific'
    },
  },
  resource: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, required: true },
  parentPermissions: [{ type: String }],
});

// Add compound index for efficient queries
PermissionSchema.index({ action: 1, "scope.level": 1, resource: 1 });
PermissionSchema.index({ "scope.target": 1 }); // For specific scope queries
```

---

### Step 6: Update REST API

#### 6.1 Update Permission DTOs

**File**: `backend/src/roles/infrastructure/dtos/PermissionDto.ts`

```typescript
class ScopeDto {
  @IsEnum(["own", "team", "org", "global", "specific"])
  level: "own" | "team" | "org" | "global" | "specific";

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.level === "specific")
  @IsNotEmpty({ message: 'Target is required when scope level is "specific"' })
  target?: string;
}

export class CreatePermissionDto {
  @IsEnum(["create", "read", "update", "delete", "execute", "manage"])
  action: string;

  @ValidateNested()
  @Type(() => ScopeDto)
  scope: ScopeDto;

  @IsString()
  resource: string;

  @IsString()
  description: string;
}

export class PermissionResponseDto {
  id: string;
  action: string;
  scope: {
    level: string;
    target?: string;
  };
  resource: string;
  description: string;
  createdAt: string;
  parentPermissions: string[];
}
```

#### 6.2 Update Permission Controller

**File**: `backend/src/roles/infrastructure/controllers/PermissionController.ts`

**Changes:**

- Update endpoints to accept new permission structure
- Add scope-based filtering endpoints

---

### Step 7: Update Frontend

#### 7.1 Update Permission Creation UI

**File**: `frontend/src/components/PermissionForm.vue`

**Changes:**

- Add separate dropdowns for Action, Scope, and Resource
- Show permission preview (e.g., "read:own:posts")
- Add scope context help text

#### 7.2 Update Permission Display

**File**: `frontend/src/components/PermissionList.vue`

**Changes:**

- Display permissions in new format
- Add visual indicators for scope levels
- Color-code by action type

---

### Step 8: Create Migration Scripts

#### 8.1 Data Migration Script

**File**: `backend/src/migrations/migrate-permissions-to-action-scope.ts`

```typescript
/**
 * Migrates existing resource:action permissions to action+scope+resource
 *
 * Migration strategy:
 * - users:read -> { action: "read", scope: { level: "global" }, resource: "users" }
 * - posts:edit -> { action: "update", scope: { level: "global" }, resource: "posts" }
 * - All existing permissions default to 'global' scope level
 */
export async function migratePermissions() {
  const permissions = await PermissionModel.find({});

  for (const permission of permissions) {
    const [resource, action] = permission.resourceAction.split(":");

    await PermissionModel.updateOne(
      { _id: permission._id },
      {
        $set: {
          action: mapOldActionToNew(action),
          scope: {
            level: "global", // Default to global for backward compatibility
          },
          resource: resource,
        },
        $unset: {
          resourceAction: 1,
        },
      }
    );
  }
}

// Helper function to map old actions to new standard actions
function mapOldActionToNew(oldAction: string): string {
  const mapping: Record<string, string> = {
    view: "read",
    edit: "update",
    remove: "delete",
    add: "create",
  };
  return mapping[oldAction] || oldAction;
}
```

---

## 🔄 Migration Strategy

### Backward Compatibility

1. **Dual Format Support (Transition Period)**

   - Support both old and new permission formats
   - Automatically convert old format to new format
   - Deprecation warnings in logs

2. **Gradual Migration**

   - Phase 1: Add new fields alongside old fields
   - Phase 2: Migrate data in background
   - Phase 3: Update application code
   - Phase 4: Remove old fields

3. **Rollback Plan**
   - Keep old schema fields during transition
   - Maintain reverse migration script
   - Feature flags for new permission system

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Test `Action` value object and hierarchy
- [ ] Test `Scope` value object and implication logic
- [ ] Test `Resource` value object and wildcard matching
- [ ] Test `Permission.implies()` method
- [ ] Test `PermissionEvaluator.evaluate()` with various contexts

### Integration Tests

- [ ] Test permission creation with new format
- [ ] Test permission evaluation in use cases
- [ ] Test scope resolution with user context
- [ ] Test migration scripts

### End-to-End Tests

- [ ] Test complete permission check flow
- [ ] Test role hierarchy with scoped permissions
- [ ] Test UI for creating scoped permissions
- [ ] Test API endpoints with new permission format

### Performance Tests

- [ ] Benchmark permission evaluation speed
- [ ] Test with 1000+ permissions
- [ ] Test with complex role hierarchies
- [ ] Optimize database queries

---

## 📊 Success Metrics

### Functional Metrics

- ✅ Support for all scope levels (own, team, org, global, specific)
- ✅ Backward compatibility with existing permissions
- ✅ Zero downtime migration
- ✅ 100% test coverage for new components

### Performance Metrics

- ✅ Permission evaluation < 10ms (p95)
- ✅ API response time < 100ms (p95)
- ✅ Support 10,000+ permissions without degradation

### Quality Metrics

- ✅ All existing tests pass
- ✅ No breaking changes to public API
- ✅ Documentation updated
- ✅ Frontend UI supports new features

---

## 🎯 Example Use Cases

### Use Case 1: Multi-Tenant SaaS

```typescript
// User can only read their own organization's data
{
  action: "read",
  resource: "customers",
  scope: {
    level: "org"
  }
}
```

### Use Case 2: Team Collaboration

```typescript
// User can edit posts within their team
{
  action: "update",
  resource: "posts",
  scope: {
    level: "team"
  }
}
```

### Use Case 3: Self-Service

```typescript
// User can only update their own profile
{
  action: "update",
  resource: "profile",
  scope: {
    level: "own"
  }
}
```

### Use Case 4: Admin Override

```typescript
// Admin can manage everything globally
{
  action: "manage",
  resource: "*",
  scope: {
    level: "global"
  }
}
```

### Use Case 5: Specific Resource Access

```typescript
// User can delete a specific project
{
  action: "delete",
  resource: "project",
  scope: {
    level: "specific",
    target: "project:123"
  }
}
```

---

## 📚 Additional Enhancements

### Future Improvements (Post-Implementation)

1. **Attribute-Based Access Control (ABAC)**

   - Add conditions based on resource attributes
   - Time-based permissions
   - Location-based permissions

2. **Dynamic Scopes**

   - User-defined scope hierarchies
   - Custom scope types per resource

3. **Permission Templates**

   - Pre-defined permission sets
   - Role templates with scoped permissions

4. **Audit & Compliance**

   - Permission usage tracking
   - Access logs with scope information
   - Compliance reports

5. **Performance Optimizations**
   - Permission caching with scope awareness
   - Materialized permission views
   - Redis-based permission cache

---

## 🚦 Getting Started

### Prerequisites

- Current RBAC system running
- MongoDB instance
- Node.js 18+
- TypeScript 5+

### Quick Start

1. **Review this roadmap** with the team
2. **Create feature branch**: `feature/action-scope-permissions`
3. **Start with Phase 1**: Implement value objects
4. **Write tests first**: TDD approach recommended
5. **Incremental deployment**: Use feature flags

---

## 📞 Support & Questions

For questions or clarifications about this roadmap:

1. Review the current codebase in `backend/src/roles/domain`
2. Check existing tests for patterns
3. Consult DDD and RBAC best practices

---

**Last Updated**: 2025-12-07  
**Status**: 📋 Planning Phase  
**Next Review**: After Phase 1 completion
