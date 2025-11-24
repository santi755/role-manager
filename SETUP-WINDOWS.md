# Configuración de MongoDB en Windows - Resumen

## ✅ Estado Actual

### MongoDB
- **Estado del servicio**: ✅ Running
- **Puerto**: 27017
- **Base de datos**: role-manager
- **Conexión**: mongodb://localhost:27017/role-manager

### Colecciones Creadas
- **roles**: 3 documentos
- **users**: 3 documentos  
- **permissions**: 5 documentos

## 📋 Configuración Realizada

### 1. Archivo de Entorno
Se creó el archivo `.env` con la configuración de MongoDB local:

```env
MONGODB_URI=mongodb://localhost:27017/role-manager
NODE_ENV=development
PORT=3000
```

### 2. Script de Verificación
Se creó `scripts/check-mongodb.ts` para verificar la conexión y visualizar los datos.

**Uso:**
```powershell
npm run check-db
```

### 3. Documentación Actualizada

#### MONGODB.md
- ✅ Añadida sección completa para Windows
- ✅ Instrucciones de verificación del servicio
- ✅ Comandos PowerShell específicos
- ✅ Solución de problemas comunes
- ✅ Opciones para visualizar datos (Compass y mongosh)

#### README.md
- ✅ Actualizada sección de MongoDB
- ✅ Instrucciones separadas para Windows y Docker
- ✅ Añadido script `check-db` a la documentación

#### package.json
- ✅ Añadido script `check-db`

## 🚀 Comandos Disponibles

### Verificar MongoDB
```powershell
# Ver estado del servicio
Get-Service -Name "MongoDB"

# Verificar puerto
Test-NetConnection -ComputerName localhost -Port 27017
```

### Ejecutar el Proyecto
```powershell
# Ejecutar demo (crea datos de ejemplo)
npm run demo

# Verificar datos en MongoDB
npm run check-db

# Iniciar servidor de desarrollo
npm run start:dev
```

## 📊 Datos de Ejemplo

El demo crea la siguiente estructura:

### Roles (con jerarquía)
```
Admin → Editor → Viewer
```

### Usuarios
- **Alice** (alice@example.com) - Rol: Viewer
- **Bob** (bob@example.com) - Rol: Editor
- **Charlie** (charlie@example.com) - Rol: Admin

### Permisos
- users:view
- users:edit
- users:delete
- posts:view
- posts:edit

## 🔧 Herramientas para Visualizar Datos

### Opción 1: MongoDB Compass (Recomendado)
1. Descargar desde: https://www.mongodb.com/try/download/compass
2. Conectar a: `mongodb://localhost:27017`
3. Seleccionar base de datos: `role-manager`

### Opción 2: Script check-db
```powershell
npm run check-db
```

### Opción 3: mongosh (si está instalado)
```powershell
mongosh mongodb://localhost:27017/role-manager
```

## 📝 Notas Importantes

1. **No se requiere Docker**: El proyecto está configurado para usar MongoDB local de Windows
2. **Servicio automático**: MongoDB se inicia automáticamente con Windows
3. **Datos persistentes**: Los datos se mantienen entre ejecuciones
4. **Arquitectura hexagonal**: Fácil cambiar entre MongoDB e in-memory repositories

## 🎯 Próximos Pasos

Para continuar desarrollando:

1. **Iniciar servidor de desarrollo**:
   ```powershell
   npm run start:dev
   ```

2. **Crear endpoints REST** (opcional):
   - Crear controladores en `src/roles/infrastructure/http/`
   - Crear controladores en `src/users/infrastructure/http/`

3. **Añadir tests**:
   ```powershell
   npm test
   ```

## 🐛 Solución de Problemas

### MongoDB no conecta
```powershell
# Verificar servicio
Get-Service -Name "MongoDB"

# Si no está corriendo, iniciarlo
Start-Service -Name "MongoDB"
```

### Error de conexión
```powershell
# Verificar que el puerto está abierto
Test-NetConnection -ComputerName localhost -Port 27017
```

### Ver logs de MongoDB
```powershell
# Ubicación típica de logs
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50
```

## ✅ Verificación Final

Ejecuta estos comandos para verificar que todo funciona:

```powershell
# 1. Verificar MongoDB
Get-Service -Name "MongoDB"

# 2. Ejecutar demo
npm run demo

# 3. Verificar datos
npm run check-db
```

Si todos los comandos se ejecutan correctamente, ¡la configuración está completa! 🎉
