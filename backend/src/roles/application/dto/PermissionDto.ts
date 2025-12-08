export class PermissionDto {
  id: string;
  action: string;
  scope: {
    level: string;
    target?: string;
  };
  resource: string;
  description: string;
  createdAt: Date;
  parentPermissions: string[];
}
