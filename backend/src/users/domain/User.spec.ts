import { User } from '../../../src/users/domain/User';
import { UserId } from '../../../src/users/domain/value-objects/UserId';
import { Email } from '../../../src/users/domain/value-objects/Email';
import { RoleId } from '../../../src/roles/domain/value-objects/RoleId';

describe('User Entity - Critical Bug Fixes', () => {
  describe('assignRole', () => {
    it('should prevent assigning the same role twice', () => {
      // Arrange
      const user = User.create('John Doe', Email.create('john@example.com'));
      const roleId = RoleId.create();

      // Act
      user.assignRole(roleId);
      const initialRoleCount = user.getAssignedRoles().size;
      
      user.assignRole(roleId); // Try to assign again
      const finalRoleCount = user.getAssignedRoles().size;

      // Assert
      expect(initialRoleCount).toBe(1);
      expect(finalRoleCount).toBe(1); // Should still be 1, not 2
      expect(user.hasRole(roleId)).toBe(true);
    });

    it('should allow assigning different roles', () => {
      // Arrange
      const user = User.create('John Doe', Email.create('john@example.com'));
      const role1 = RoleId.create();
      const role2 = RoleId.create();

      // Act
      user.assignRole(role1);
      user.assignRole(role2);

      // Assert
      expect(user.getAssignedRoles().size).toBe(2);
      expect(user.hasRole(role1)).toBe(true);
      expect(user.hasRole(role2)).toBe(true);
    });

    it('should handle assigning role with same value but different instance', () => {
      // Arrange
      const user = User.create('John Doe', Email.create('john@example.com'));
      const roleId = RoleId.create();
      user.assignRole(roleId);

      // Act - Create a NEW RoleId with the same value
      const sameValueRoleId = RoleId.fromString(roleId.toString());
      user.assignRole(sameValueRoleId);

      // Assert - Should not add duplicate
      expect(user.getAssignedRoles().size).toBe(1);
      expect(user.hasRole(roleId)).toBe(true);
      expect(user.hasRole(sameValueRoleId)).toBe(true);
    });
  });

  describe('unassignRole', () => {
    it('should successfully remove an assigned role', () => {
      // Arrange
      const user = User.create('John Doe', Email.create('john@example.com'));
      const roleId = RoleId.create();
      user.assignRole(roleId);
      expect(user.hasRole(roleId)).toBe(true);

      // Act
      user.unassignRole(roleId);

      // Assert
      expect(user.hasRole(roleId)).toBe(false);
      expect(user.getAssignedRoles().size).toBe(0);
    });

    it('should handle unassigning non-existent role gracefully', () => {
      // Arrange
      const user = User.create('John Doe', Email.create('john@example.com'));
      const nonExistentRole = RoleId.create();

      // Act & Assert - Should not throw
      expect(() => {
        user.unassignRole(nonExistentRole);
      }).not.toThrow();
      expect(user.getAssignedRoles().size).toBe(0);
    });

    it('should remove only the specified role when multiple exist', () => {
      // Arrange
      const user = User.create('John Doe', Email.create('john@example.com'));
      const role1 = RoleId.create();
      const role2 = RoleId.create();
      user.assignRole(role1);
      user.assignRole(role2);

      // Act
      user.unassignRole(role1);

      // Assert
      expect(user.getAssignedRoles().size).toBe(1);
      expect(user.hasRole(role1)).toBe(false);
      expect(user.hasRole(role2)).toBe(true);
    });
  });

  describe('reconstitute - ensure fixes work with persisted data', () => {
    it('should not add duplicate roles after reconstitution', () => {
      // Arrange - Simulate loading from database
      const userId = UserId.create();
      const roleId = RoleId.create();
      const existingRoles = new Set([roleId]);

      const user = User.reconstitute(
        userId,
        'John Doe',
        Email.create('john@example.com'),
        new Date(),
        existingRoles,
        new Set(),
        new Set(),
      );

      // Act - Try to assign the same role again
      const sameRoleId = RoleId.fromString(roleId.toString());
      user.assignRole(sameRoleId);

      // Assert
      expect(user.getAssignedRoles().size).toBe(1);
    });
  });

  describe('integration with role assignment workflow', () => {
    it('should handle assign -> unassign -> assign workflow correctly', () => {
      // Arrange
      const user = User.create('John Doe', Email.create('john@example.com'));
      const roleId = RoleId.create();

      // Act
      user.assignRole(roleId);
      expect(user.hasRole(roleId)).toBe(true);

      user.unassignRole(roleId);
      expect(user.hasRole(roleId)).toBe(false);

      user.assignRole(roleId);
      expect(user.hasRole(roleId)).toBe(true);

      // Assert
      expect(user.getAssignedRoles().size).toBe(1);
    });
  });
});
