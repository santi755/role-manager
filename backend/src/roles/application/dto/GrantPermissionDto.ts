import { IsNotEmpty, IsString } from 'class-validator';

export class GrantPermissionDto {
    @IsNotEmpty()
    @IsString()
    permissionId: string;
}
