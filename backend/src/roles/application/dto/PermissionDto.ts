export class PermissionDto {
    id: string;
    resource: string;
    action: string;
    description: string;
    createdAt: Date;
    parentPermissions: string[];
}
