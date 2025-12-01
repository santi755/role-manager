import { PermissionDto } from './PermissionDto';

export class PermissionHierarchyDto {
    permission: PermissionDto;
    ancestors: PermissionDto[];
    descendants: PermissionDto[];
}   