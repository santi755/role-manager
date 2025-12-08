import { Permission } from '../../../src/roles/domain/Permission';
import { PermissionId } from '../../../src/roles/domain/value-objects/PermissionId';
import { Action } from '../../../src/roles/domain/value-objects/Action';
import { Scope } from '../../../src/roles/domain/value-objects/Scope';
import { Resource } from '../../../src/roles/domain/value-objects/Resource';

describe('Permission Entity - Critical Bug Fixes', () => {
  describe('addParentPermission', () => {
    it('should prevent adding the same parent permission twice', () => {
      // Arrange
      const permission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );
      const parentPermission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'View users',
      );
      const parentId = parentPermission.getId();

      // Act
      permission.addParentPermission(parentId);
      const initialParentCount = permission.getParentPermissions().size;
      
      permission.addParentPermission(parentId); // Try to add again
      const finalParentCount = permission.getParentPermissions().size;

      // Assert
      expect(initialParentCount).toBe(1);
      expect(finalParentCount).toBe(1); // Should still be 1, not 2
      expect(permission.hasParentPermission(parentId)).toBe(true);
    });

    it('should prevent permission from being its own parent', () => {
      // Arrange
      const permission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );

      // Act & Assert
      expect(() => {
        permission.addParentPermission(permission.getId());
      }).toThrow('Permission cannot be its own parent');
    });

    it('should allow adding different parent permissions', () => {
      // Arrange
      const permission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );
      const parent1 = Permission.create(
        Action.fromString('update'),
        Scope.global(),
        Resource.create('users'),
        'View users',
      );
      const parent2 = Permission.create(
        Action.fromString('delete'),
        Scope.global(),
        Resource.create('users'),
        'List users',
      );

      // Act
      permission.addParentPermission(parent1.getId());
      permission.addParentPermission(parent2.getId());

      // Assert
      expect(permission.getParentPermissions().size).toBe(2);
      expect(permission.hasParentPermission(parent1.getId())).toBe(true);
      expect(permission.hasParentPermission(parent2.getId())).toBe(true);
    });
  });

  describe('removeParentPermission', () => {
    it('should successfully remove a parent permission using value equality', () => {
      // Arrange
      const permission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );
      const parentPermission = Permission.create(
        Action.fromString('update'),
        Scope.global(),
        Resource.create('users'),
        'View users',
      );
      const parentId = parentPermission.getId();

      permission.addParentPermission(parentId);
      expect(permission.hasParentPermission(parentId)).toBe(true);

      // Act - Create a NEW PermissionId with the same value
      const sameValueId = PermissionId.fromString(parentId.toString());
      permission.removeParentPermission(sameValueId);

      // Assert - Should be removed even though it's a different object instance
      expect(permission.hasParentPermission(parentId)).toBe(false);
      expect(permission.getParentPermissions().size).toBe(0);
    });

    it('should handle removing non-existent parent gracefully', () => {
      // Arrange
      const permission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );
      const nonExistentId = PermissionId.create();

      // Act & Assert - Should not throw
      expect(() => {
        permission.removeParentPermission(nonExistentId);
      }).not.toThrow();
      expect(permission.getParentPermissions().size).toBe(0);
    });

    it('should remove only the specified parent when multiple exist', () => {
      // Arrange
      const permission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );
      const parent1 = Permission.create(
        Action.fromString('update'),
        Scope.global(),
        Resource.create('users'),
        'View users',
      );
      const parent2 = Permission.create(
        Action.fromString('delete'),
        Scope.global(),
        Resource.create('users'),
        'List users',
      );

      permission.addParentPermission(parent1.getId());
      permission.addParentPermission(parent2.getId());
      expect(permission.getParentPermissions().size).toBe(2);

      // Act
      permission.removeParentPermission(parent1.getId());

      // Assert
      expect(permission.getParentPermissions().size).toBe(1);
      expect(permission.hasParentPermission(parent1.getId())).toBe(false);
      expect(permission.hasParentPermission(parent2.getId())).toBe(true);
    });
  });

  describe('reconstitute - ensure fixes work with persisted data', () => {
    it('should not add duplicate parents after reconstitution', () => {
      // Arrange - Simulate loading from database
      const permissionId = PermissionId.create();
      const parentId = PermissionId.create();
      const existingParents = new Set([parentId]);

      const permission = Permission.reconstitute(
        permissionId,
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
        new Date(),
        existingParents,
      );

      // Act - Try to add the same parent again
      const sameParentId = PermissionId.fromString(parentId.toString());
      permission.addParentPermission(sameParentId);

      // Assert
      expect(permission.getParentPermissions().size).toBe(1);
    });
  });

  describe('implies - permission hierarchy', () => {
    it('should return true when manage action implies read action', () => {
      // Arrange
      const managePermission = Permission.create(
        Action.fromString('manage'),
        Scope.global(),
        Resource.create('users'),
        'Manage users',
      );
      const readPermission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );

      // Act & Assert
      expect(managePermission.implies(readPermission)).toBe(true);
    });

    it('should return true when global scope implies org scope', () => {
      // Arrange
      const globalPermission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read all users',
      );
      const orgPermission = Permission.create(
        Action.fromString('read'),
        Scope.org(),
        Resource.create('users'),
        'Read org users',
      );

      // Act & Assert
      expect(globalPermission.implies(orgPermission)).toBe(true);
    });

    it('should return false when resources are different', () => {
      // Arrange
      const usersPermission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('users'),
        'Read users',
      );
      const projectsPermission = Permission.create(
        Action.fromString('read'),
        Scope.global(),
        Resource.create('projects'),
        'Read projects',
      );

      // Act & Assert
      expect(usersPermission.implies(projectsPermission)).toBe(false);
    });
  });
});
