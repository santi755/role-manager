# 📚 Documentación del Sistema RBAC

Esta carpeta contiene toda la documentación necesaria para entender y trabajar con el sistema RBAC basado en grafos.

## 📖 Documentos Disponibles

### [CONCEPTOS.md](../CONCEPTOS.md) ⭐ **EMPIEZA AQUÍ**

**Guía completa de conceptos** que explica TODO desde cero:

- ✅ **Teoría de Grafos** explicada de forma simple
- ✅ **RBAC** (Control de Acceso Basado en Roles)
- ✅ **Domain-Driven Design (DDD)**
- ✅ **Arquitectura Hexagonal**
- ✅ **Componentes del Sistema** con código comentado
- ✅ **Flujos completos** paso a paso
- ✅ **Algoritmos de grafos** (DFS, BFS)
- ✅ **Ejemplos prácticos** completos
- ✅ **Diagramas visuales** para cada concepto

**Perfecto para:** Personas que no entienden grafos, DDD, o arquitectura hexagonal.

---

### [README.md](../README.md)

**Documentación técnica del proyecto:**

- Características del sistema
- Estructura del proyecto
- Modelo de grafo
- Persistencia con MongoDB
- Instrucciones de uso
- Decisiones de diseño

**Perfecto para:** Desarrolladores que ya conocen los conceptos básicos.

---

### [MONGODB.md](../MONGODB.md)

**Guía de integración con MongoDB:**

- Setup de MongoDB en Windows
- Setup con Docker
- Schemas de Mongoose
- Repositorios MongoDB
- Verificación de datos

**Perfecto para:** Configurar la base de datos.

---

## 🎯 Ruta de Aprendizaje Recomendada

### Si NO entiendes nada (empezar desde cero):

1. **Lee [CONCEPTOS.md](../CONCEPTOS.md)** completo
   - Empieza por la sección 1 (Conceptos Fundamentales)
   - Continúa con la sección 2 (Teoría de Grafos)
   - No te saltes las secciones, están ordenadas por dificultad

2. **Ejecuta el demo**
   ```bash
   npm run demo
   ```

3. **Experimenta con el código**
   - Modifica `src/demo.ts`
   - Crea tus propios roles y permisos
   - Observa cómo funciona la herencia

4. **Lee el código fuente** en este orden:
   - `src/roles/domain/value-objects/ResourceAction.ts`
   - `src/roles/domain/Permission.ts`
   - `src/roles/domain/Role.ts`
   - `src/roles/domain/services/RoleGraphService.ts`

### Si ya conoces los conceptos básicos:

1. **Lee [README.md](../README.md)** para entender la estructura
2. **Configura MongoDB** con [MONGODB.md](../MONGODB.md)
3. **Ejecuta el demo** y explora el código

---

## 🖼️ Diagramas Visuales

Todos los diagramas están en la carpeta `docs/images/`:

- `graph_theory_basics.png` - Conceptos de teoría de grafos
- `rbac_hierarchy_example.png` - Ejemplo de jerarquía de roles
- `hexagonal_architecture.png` - Arquitectura del sistema
- `complete_flow_diagram.png` - Flujo completo de verificación de permisos

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar MongoDB (elegir una opción)

# Opción A: MongoDB local en Windows
# Ver MONGODB.md para instrucciones de instalación

# Opción B: MongoDB con Docker
docker-compose up -d

# 3. Configurar variables de entorno
Copy-Item .env.example .env

# 4. Ejecutar el demo
npm run demo

# 5. Verificar datos en MongoDB
npm run check-db
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué usar grafos para RBAC?

Los roles forman jerarquías naturales. Los grafos permiten:
- Herencia de permisos automática
- Prevención de ciclos (evita errores)
- Escalabilidad (agregar roles sin modificar existentes)

### ¿Qué es un DAG?

**DAG** = Directed Acyclic Graph (Grafo Dirigido Acíclico)

- **Dirigido**: Las relaciones tienen dirección (Admin → Editor)
- **Acíclico**: No hay ciclos (no puedes volver al punto de partida)

### ¿Qué es un Value Object?

Un objeto **inmutable** que se compara por **valor**, no por identidad.

Ejemplo: `ResourceAction("users:edit")` siempre será igual a otro `ResourceAction("users:edit")`.

### ¿Por qué Arquitectura Hexagonal?

Separa el dominio (lógica de negocio) de la infraestructura (base de datos, APIs).

**Ventaja**: Puedes cambiar de MongoDB a PostgreSQL sin tocar la lógica de negocio.

---

## 📞 Soporte

Si tienes dudas:

1. **Lee [CONCEPTOS.md](../CONCEPTOS.md)** - Probablemente tu respuesta esté ahí
2. **Ejecuta el demo** - Ver el sistema en acción ayuda mucho
3. **Revisa los ejemplos** - Hay ejemplos completos en CONCEPTOS.md sección 9

---

## 🎓 Recursos Adicionales

- [Graph Theory - Wikipedia](https://en.wikipedia.org/wiki/Graph_theory)
- [RBAC - Wikipedia](https://en.wikipedia.org/wiki/Role-based_access_control)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
