export class RoleDto {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  parentRoles: string[];
  permissions: string[];
}
