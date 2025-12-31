import { describe, it, expect } from 'vitest';
import { User, UserRole } from './User';

describe('User', () => {
  describe('User interface', () => {
    it('should create a valid User object with required fields', () => {
      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      expect(user.id).toBe('1');
      expect(user.email).toBe('user@example.com');
      expect(user.role).toBe('user');
    });

    it('should create User with optional fields', () => {
      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'admin',
        name: 'John Doe',
        vipLevel: 5,
      };

      expect(user.name).toBe('John Doe');
      expect(user.vipLevel).toBe(5);
    });

    it('should support different UserRole types', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
      };

      const regularUser: User = {
        id: '2',
        email: 'user@example.com',
        role: 'user',
      };

      const guestUser: User = {
        id: '3',
        email: 'guest@example.com',
        role: 'guest',
      };

      const customRoleUser: User = {
        id: '4',
        email: 'custom@example.com',
        role: 'custom-role',
      };

      expect(adminUser.role).toBe('admin');
      expect(regularUser.role).toBe('user');
      expect(guestUser.role).toBe('guest');
      expect(customRoleUser.role).toBe('custom-role');
    });

    it('should support extended properties', () => {
      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
        department: 'Engineering',
        team: 'Frontend',
        permissions: ['read', 'write'],
      };

      expect(user.department).toBe('Engineering');
      expect(user.team).toBe('Frontend');
      expect(user.permissions).toEqual(['read', 'write']);
    });

    it('should handle UserRole type correctly', () => {
      const role1: UserRole = 'admin';
      const role2: UserRole = 'user';
      const role3: UserRole = 'guest';
      const role4: UserRole = 'custom-role';

      expect(role1).toBe('admin');
      expect(role2).toBe('user');
      expect(role3).toBe('guest');
      expect(role4).toBe('custom-role');
    });
  });
});
