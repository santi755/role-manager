export class UpdatePermissionDto {
  action?: string;
  resource_type?: string;
  description?: string;
  target_id?: string | null;
  scope?: string | null;
}
