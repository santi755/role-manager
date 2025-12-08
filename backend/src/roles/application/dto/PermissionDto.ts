export class PermissionDto {
  id: string;
  action: string;
  resource_type: string;
  target_id?: string | null;
  scope?: string | null;
  description: string;
  createdAt: Date;
  parentPermissions: string[];
}
