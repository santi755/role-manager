# Graph-Based RBAC System

Sistema de control de acceso basado en roles (RBAC) implementado con teoría de grafos en arquitectura hexagonal.

## 📚 Documentación

> **¿No entiendes grafos, DDD o arquitectura hexagonal?** 👉 Lee **[CONCEPTOS.md](CONCEPTOS.md)** primero
> 
> Esta guía completa explica TODOS los conceptos desde cero con diagramas visuales y ejemplos prácticos.

### Documentos Disponibles

- 📖 **[CONCEPTOS.md](CONCEPTOS.md)** - Guía completa de conceptos (⭐ **EMPIEZA AQUÍ** si eres nuevo)
- 📘 **[README.md](README.md)** - Documentación técnica del proyecto (este archivo)
- 🗄️ **[MONGODB.md](MONGODB.md)** - Guía de integración con MongoDB
- 📂 **[docs/](docs/)** - Carpeta con diagramas e índice de documentación

## 🎯 Características

- **Arquitectura Hexagonal**: Separación clara entre dominio, aplicación e infraestructura
- **Teoría de Grafos**: 
  - Jerarquía de roles como DAG (Directed Acyclic Graph)
  - Herencia de permisos a través de grafos
  - Prevención de dependencias circulares
  - Algoritmos BFS/DFS para traversal de grafos
- **Domain-Driven Design**: Entidades ricas, value objects, servicios de dominio
- **Type-Safe**: TypeScript con validación estricta

## 📐 Estructura del Proyecto

```
src/
├── roles/                          # Bounded Context: Roles y Permisos
│   ├── domain/
│   │   ├── Role.ts                # Entidad Role con relaciones de grafo
│   │   ├── Permission.ts          # Entidad Permission con dependencias
│   │   ├── value-objects/
│   │   │   ├── RoleId.ts
│   │   │   ├── PermissionId.ts
│   │   │   └── ResourceAction.ts  # resource:action (ej: "users:read")
│   │   ├── services/
│   │   │   ├── RoleGraphService.ts      # Algoritmos de grafo para roles
│   │   │   └── PermissionGraphService.ts # Algoritmos de grafo para permisos
│   │   ├── repositories/
│   │   │   ├── RoleRepository.ts
│   │   │   └── PermissionRepository.ts
│   │   └── events/
│   │       ├── RolePermissionGranted.ts
│   │       └── RoleHierarchyChanged.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── CreateRole.ts
│   │       ├── SetRoleParent.ts         # Con validación de ciclos
│   │       ├── CreatePermission.ts
│   │       └── GrantPermissionToRole.ts
│   └── infrastructure/
│       └── repositories/
│           ├── InMemoryRoleRepository.ts
│           └── InMemoryPermissionRepository.ts
│
├── users/                          # Bounded Context: Usuarios
│   ├── domain/
│   │   ├── User.ts                # Entidad User con roles asignados
│   │   ├── value-objects/
│   │   │   ├── UserId.ts
│   │   │   └── Email.ts
│   │   ├── repositories/
│   │   │   └── UserRepository.ts
│   │   └── events/
│   │       └── UserRoleAssigned.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── CreateUser.ts
│   │       ├── AssignRoleToUser.ts
│   │       └── CheckUserPermission.ts   # Traversal de grafo
│   └── infrastructure/
│       └── repositories/
│           └── InMemoryUserRepository.ts
│
└── demo.ts                         # Script de demostración
```

## 🔄 Modelo de Grafo

### Jerarquía de Roles (DAG)

```
    Admin
      ↓
   Editor
      ↓
   Viewer
```

- **Admin** hereda todos los permisos de **Editor**
- **Editor** hereda todos los permisos de **Viewer**
- Se previenen ciclos (ej: Viewer → Admin está bloqueado)

### Algoritmos de Grafo

#### RoleGraphService
- `detectCircularDependency()`: DFS para detectar ciclos
- `getAllAncestorRoles()`: BFS para obtener roles ancestros
- `calculateEffectivePermissions()`: Calcula permisos incluyendo herencia
- `wouldCreateCycle()`: Valida antes de agregar relación padre

#### PermissionGraphService
- `resolvePermissionDependencies()`: DFS para resolver dependencias
- `implies()`: Verifica si un permiso implica otro
- `detectCircularDependency()`: Previene ciclos en dependencias

## 🗄️ Persistencia con MongoDB

El proyecto utiliza **MongoDB** con **Mongoose** para la persistencia de datos.

### Inicio Rápido (Windows)

```powershell
# 1. Verificar que MongoDB está corriendo
Get-Service -Name "MongoDB"

# 2. Copiar archivo de configuración
Copy-Item .env.example .env

# 3. Ejecutar el demo
npm run demo

# 4. Verificar los datos en MongoDB
npm run check-db
```

### Inicio Rápido (Docker)

```bash
# 1. Iniciar MongoDB con Docker
docker-compose up -d

# 2. Ejecutar el demo
npm run demo

# 3. Ver datos en Mongo Express (Web UI)
# Abrir http://localhost:8081
```

### Características de MongoDB

- ✅ **Repositorios MongoDB** implementados para User, Role y Permission
- ✅ **Schemas Mongoose** con validaciones y índices únicos
- ✅ **Soporte Windows** - MongoDB local sin Docker
- ✅ **Docker Compose** para fácil setup de MongoDB + Mongo Express
- ✅ **Índices optimizados** para búsquedas rápidas
- ✅ **Arquitectura Hexagonal** - Fácil cambiar entre in-memory y MongoDB
- ✅ **Script de verificación** - `npm run check-db` para ver el contenido de la BD

📖 **Documentación completa**: Ver [MONGODB.md](./MONGODB.md)

## 🚀 Uso

### Ejecutar Demo

```bash
npm run start:dev
```

Luego ejecuta el script de demostración:

```bash
npx ts-node src/demo.ts
```

### Ejemplo de Código

```typescript
// 1. Crear permisos
const viewPermission = await createPermission.execute({
  resource: 'users',
  action: 'view',
  description: 'View users'
});

// 2. Crear roles
const adminRole = await createRole.execute({
  name: 'Admin',
  description: 'Administrator'
});

const userRole = await createRole.execute({
  name: 'User',
  description: 'Regular user'
});

// 3. Establecer jerarquía (Admin hereda de User)
await setRoleParent.execute({
  roleId: adminRole.getId().toString(),
  parentRoleId: userRole.getId().toString()
});

// 4. Otorgar permisos
await grantPermissionToRole.execute({
  roleId: userRole.getId().toString(),
  permissionId: viewPermission.getId().toString()
});

// 5. Crear usuario y asignar rol
const user = await createUser.execute({
  name: 'Alice',
  email: 'alice@example.com'
});

await assignRoleToUser.execute({
  userId: user.getId().toString(),
  roleId: adminRole.getId().toString()
});

// 6. Verificar permisos (con herencia)
const result = await checkUserPermission.execute({
  userId: user.getId().toString(),
  resource: 'users',
  action: 'view'
});

console.log(result.hasPermission); // true (heredado de User role)
console.log(result.reason); // "Permission granted through role assignment"
```

## 🎨 Patrones de Diseño

### Domain Layer
- **Entities**: `User`, `Role`, `Permission`
- **Value Objects**: `UserId`, `RoleId`, `PermissionId`, `Email`, `ResourceAction`
- **Domain Services**: `RoleGraphService`, `PermissionGraphService`
- **Repository Interfaces**: Puertos para persistencia
- **Domain Events**: Para comunicación entre bounded contexts

### Application Layer
- **Use Cases**: Orquestación de lógica de negocio
- **Command/Query Objects**: DTOs para entrada/salida

### Infrastructure Layer
- **Repository Implementations**: Adaptadores (actualmente in-memory)
- **NestJS Modules**: Configuración de inyección de dependencias

## 🔒 Características de Seguridad

1. **Prevención de Ciclos**: Imposible crear jerarquías circulares
2. **Validación de UUID**: Todos los IDs son UUIDs válidos
3. **Email Validation**: Validación de formato de email
4. **Type Safety**: TypeScript estricto en todo el código
5. **Immutability**: Value objects inmutables
6. **Direct Permission Overrides**: 
   - Usuarios pueden tener grants directos (mayor prioridad que roles)
   - Usuarios pueden tener denials directos (máxima prioridad)

## 📊 Complejidad de Algoritmos

- **Detección de Ciclos**: O(V + E) donde V = roles, E = relaciones
- **Cálculo de Permisos Efectivos**: O(V + E + P) donde P = permisos
- **Verificación de Permisos**: O(R * P) donde R = roles del usuario

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:cov
```

## 📝 Decisiones de Diseño

### ¿Por qué Grafos?

1. **Herencia Natural**: Los roles forman naturalmente una jerarquía
2. **Escalabilidad**: Fácil agregar nuevos roles sin modificar existentes
3. **Flexibilidad**: Soporta jerarquías complejas (no solo árbol)
4. **Prevención de Errores**: Detección automática de ciclos

### ¿Por qué Arquitectura Hexagonal?

1. **Testabilidad**: Lógica de dominio independiente de infraestructura
2. **Mantenibilidad**: Cambios en BD no afectan lógica de negocio
3. **Claridad**: Separación clara de responsabilidades
4. **Portabilidad**: Fácil cambiar de NestJS a otro framework

### ¿Por qué In-Memory Repositories?

- Simplicidad para demostración
- Fácil testing
- Sin dependencias externas
- Implementación de BD real es trivial (mismo interfaz)

## 🔮 Próximos Pasos

- [ ] Implementar repositorios con PostgreSQL/MongoDB
- [ ] Agregar caching de permisos calculados
- [ ] API REST con controladores NestJS
- [ ] Tests unitarios completos
- [ ] Tests de integración
- [ ] GraphQL API
- [ ] Audit log de cambios de permisos
- [ ] Permisos basados en atributos (ABAC)

## 📚 Referencias

- [Graph Theory](https://en.wikipedia.org/wiki/Graph_theory)
- [RBAC](https://en.wikipedia.org/wiki/Role-based_access_control)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
