export interface Permission {
  id: string
  action: string
  resource_type: string
  target_id?: string | null
  scope?: string | null
  description: string
  createdAt: Date
  parentPermissions: string[]
}

export type TargetScopeMode = 'specific' | 'wildcard' | 'scope'

export type ScopeLevel = 'own' | 'team' | 'org' | 'global'

export interface CreatePermissionDto {
  action: string
  resource_type: string
  target_id?: string | null
  scope?: string | null
  description: string
}
