import { RoleDto } from './RoleDto';

export class RoleHierarchyDto {
  role: RoleDto;
  ancestors: RoleDto[];
  descendants: RoleDto[];
}
