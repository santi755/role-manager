import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

/**
 * Custom validator to ensure target_id and scope are mutually exclusive
 */
function IsMutuallyExclusive(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isMutuallyExclusive',
      validator: {
        validate(value, args) {
          const object = args.object as CreatePermissionDto;
          const hasTargetId =
            object.target_id !== undefined && object.target_id !== null;
          const hasScope = object.scope !== undefined && object.scope !== null;

          // Both cannot be defined
          if (hasTargetId && hasScope) {
            return false;
          }

          // At least one must be defined
          if (!hasTargetId && !hasScope) {
            return false;
          }

          return true;
        },
        defaultMessage() {
          return 'target_id and scope are mutually exclusive. Provide exactly one.';
        },
      },
    },
    validationOptions,
  );
}

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  resource_type: string;

  @IsOptional()
  @IsString()
  @IsMutuallyExclusive()
  target_id?: string | null; // "project:123", "*", or null

  @IsOptional()
  @IsEnum(['own', 'team', 'org', 'global'])
  scope?: 'own' | 'team' | 'org' | 'global' | null;

  @IsString()
  description: string;
}
