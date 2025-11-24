# MongoDB Setup Instructions

## 🪟 Windows Setup (Without Docker)

### Prerequisites

MongoDB debe estar instalado y corriendo en Windows. Si ya tienes MongoDB instalado, sigue estos pasos:

### 1. Verificar que MongoDB está corriendo

```powershell
# Verificar el servicio de MongoDB
Get-Service -Name "MongoDB"

# Debería mostrar: Status: Running
```

Si el servicio no está corriendo, inícialo:

```powershell
# Iniciar el servicio de MongoDB (requiere permisos de administrador)
Start-Service -Name "MongoDB"
```

### 2. Verificar la conexión

```powershell
# Verificar que el puerto 27017 está abierto
Test-NetConnection -ComputerName localhost -Port 27017

# Debería mostrar: TcpTestSucceeded : True
```

### 3. Configurar el proyecto

El archivo `.env` ya está configurado para conectarse a MongoDB local:

```env
MONGODB_URI=mongodb://localhost:27017/role-manager
NODE_ENV=development
PORT=3000
```

### 4. Ejecutar el demo

```powershell
# Instalar dependencias (si no lo has hecho)
npm install

# Ejecutar el demo
npm run demo
```

### 5. Verificar los datos

Puedes usar MongoDB Compass (interfaz gráfica) o mongosh (línea de comandos) para ver los datos:

**Opción A: MongoDB Compass**
1. Abre MongoDB Compass
2. Conecta a: `mongodb://localhost:27017`
3. Selecciona la base de datos `role-manager`

**Opción B: mongosh (si está instalado)**
```powershell
# Conectar a MongoDB
mongosh mongodb://localhost:27017/role-manager

# Ver colecciones
show collections

# Ver usuarios
db.users.find().pretty()

# Ver roles
db.roles.find().pretty()

# Ver permisos
db.permissions.find().pretty()
```

### Solución de problemas

**MongoDB no está instalado:**
1. Descarga MongoDB Community Server desde: https://www.mongodb.com/try/download/community
2. Ejecuta el instalador
3. Durante la instalación, asegúrate de seleccionar "Install MongoDB as a Service"
4. Reinicia el servicio después de la instalación

**El servicio no inicia:**
```powershell
# Ver el estado detallado del servicio
Get-Service -Name "MongoDB" | Format-List *

# Ver logs de MongoDB (ubicación típica)
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50
```

**Puerto 27017 ocupado:**
```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr :27017
```

---

## 🚀 Quick Start with Docker

### 1. Start MongoDB

```bash
# Start MongoDB and Mongo Express (Web UI)
docker-compose up -d

# Check if containers are running
docker-compose ps
```

MongoDB will be available at: `mongodb://localhost:27017/role-manager`
Mongo Express (Web UI) will be available at: `http://localhost:8081`

### 2. Run the Demo

```bash
# Run the demo (will use MongoDB)
npm run demo
```

### 3. View Data in Mongo Express

Open your browser and go to `http://localhost:8081` to see the data stored in MongoDB.

## 📊 Collections Created

The application will create the following collections:

- **users** - User documents with role assignments
- **roles** - Role documents with hierarchy (graph)
- **permissions** - Permission documents with dependencies

## 🛑 Stop MongoDB

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (delete all data)
docker-compose down -v
```

## 🔧 Manual MongoDB Installation

If you prefer to install MongoDB manually:

1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Update `.env` file with your MongoDB URI if different from default

## 📝 Environment Variables

Create a `.env` file (or copy from `.env.example`):

```env
MONGODB_URI=mongodb://localhost:27017/role-manager
NODE_ENV=development
PORT=3000
```

## 🗄️ Database Schema

### Users Collection
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string (unique)",
  "createdAt": "Date",
  "assignedRoles": ["roleId1", "roleId2"],
  "directPermissionGrants": ["permissionId1"],
  "directPermissionDenials": ["permissionId2"]
}
```

### Roles Collection
```json
{
  "id": "uuid",
  "name": "string (unique)",
  "description": "string",
  "createdAt": "Date",
  "parentRoles": ["roleId1", "roleId2"],
  "permissions": ["permissionId1", "permissionId2"]
}
```

### Permissions Collection
```json
{
  "id": "uuid",
  "resource": "string",
  "action": "string",
  "description": "string",
  "createdAt": "Date",
  "parentPermissions": ["permissionId1"]
}
```

## 🔍 Querying Data

### Using MongoDB Shell

```bash
# Connect to MongoDB
docker exec -it role-manager-mongodb mongosh

# Switch to database
use role-manager

# View all users
db.users.find().pretty()

# View all roles
db.roles.find().pretty()

# View all permissions
db.permissions.find().pretty()

# Find user by email
db.users.findOne({ email: "alice@example.com" })

# Find role by name
db.roles.findOne({ name: "Admin" })
```

## 🔄 Switching Between In-Memory and MongoDB

The project supports both in-memory and MongoDB repositories:

### Use MongoDB (Current Configuration)
Already configured in `roles.module.ts` and `users.module.ts`

### Use In-Memory (For Testing)
Replace in the module files:
```typescript
// Change from:
{
  provide: 'UserRepository',
  useClass: MongoUserRepository,
}

// To:
{
  provide: 'UserRepository',
  useClass: InMemoryUserRepository,
}
```

## 🧪 Testing with MongoDB

```bash
# Make sure MongoDB is running
docker-compose up -d

# Run the demo
npm run demo

# Check data in Mongo Express
# Open http://localhost:8081
```

## 📈 Performance Considerations

- **Indexes**: Unique indexes are created on `email` (users), `name` (roles), and `resource+action` (permissions)
- **Graph Queries**: Role hierarchy traversal is done in-memory after loading from DB
- **Caching**: Consider implementing caching for frequently accessed permission checks

## 🔐 Production Recommendations

1. **Authentication**: Add MongoDB authentication
2. **Connection Pooling**: Configure Mongoose connection pool size
3. **Replica Sets**: Use MongoDB replica sets for high availability
4. **Monitoring**: Set up MongoDB monitoring and alerts
5. **Backups**: Implement regular database backups
