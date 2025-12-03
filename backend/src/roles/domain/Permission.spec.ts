import { Permission } from '../../../src/roles/domain/Permission';
import { PermissionId } from '../../../src/roles/domain/value-objects/PermissionId';
import { ResourceAction } from '../../../src/roles/domain/value-objects/ResourceAction';

describe('Permission Entity - Critical Bug Fixes', () => {
  describe('addParentPermission', () => {
    it('should prevent adding the same parent permission twice', () => {
      // Arrange
      const permission = Permission.create(
        ResourceAction.create('users', 'read'),
        'Read users',
      );
      const parentPermission = Permission.create(
        ResourceAction.create('users', 'view'),
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
        ResourceAction.create('users', 'read'),
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
        ResourceAction.create('users', 'read'),
        'Read users',
      );
      const parent1 = Permission.create(
        ResourceAction.create('users', 'view'),
        'View users',
      );
      const parent2 = Permission.create(
        ResourceAction.create('users', 'list'),
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
        ResourceAction.create('users', 'read'),
        'Read users',
      );
      const parentPermission = Permission.create(
        ResourceAction.create('users', 'view'),
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
        ResourceAction.create('users', 'read'),
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
        ResourceAction.create('users', 'read'),
        'Read users',
      );
      const parent1 = Permission.create(
        ResourceAction.create('users', 'view'),
        'View users',
      );
      const parent2 = Permission.create(
        ResourceAction.create('users', 'list'),
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
        ResourceAction.create('users', 'read'),
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
});
