import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CreateUser } from './users/application/use-cases/CreateUser';
import { CreateRole } from './roles/application/use-cases/CreateRole';
import { CreatePermission } from './roles/application/use-cases/CreatePermission';
import { GrantPermissionToRole } from './roles/application/use-cases/GrantPermissionToRole';
import { SetRoleParent } from './roles/application/use-cases/SetRoleParent';
import { AssignRoleToUser } from './users/application/use-cases/AssignRoleToUser';
import { CheckUserPermission } from './users/application/use-cases/CheckUserPermission';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('🚀 Graph-Based RBAC System Demo\n');
  console.log('='.repeat(60));

  try {
    // Get use cases
    const createUser = app.get(CreateUser);
    const createRole = app.get(CreateRole);
    const createPermission = app.get(CreatePermission);
    const grantPermissionToRole = app.get(GrantPermissionToRole);
    const setRoleParent = app.get(SetRoleParent);
    const assignRoleToUser = app.get(AssignRoleToUser);
    const checkUserPermission = app.get(CheckUserPermission);

    // 1. Create Permissions
    console.log('\n📝 Creating Permissions...');
    const viewUsersPermission = await createPermission.execute({
      resource: 'users',
      action: 'view',
      description: 'View users',
    });
    console.log(`  ✓ Created: users:view`);

    const editUsersPermission = await createPermission.execute({
      resource: 'users',
      action: 'edit',
      description: 'Edit users',
    });
    console.log(`  ✓ Created: users:edit`);

    const deleteUsersPermission = await createPermission.execute({
      resource: 'users',
      action: 'delete',
      description: 'Delete users',
    });
    console.log(`  ✓ Created: users:delete`);

    const viewPostsPermission = await createPermission.execute({
      resource: 'posts',
      action: 'view',
      description: 'View posts',
    });
    console.log(`  ✓ Created: posts:view`);

    const editPostsPermission = await createPermission.execute({
      resource: 'posts',
      action: 'edit',
      description: 'Edit posts',
    });
    console.log(`  ✓ Created: posts:edit`);

    // 2. Create Roles
    console.log('\n👥 Creating Roles...');
    const viewerRole = await createRole.execute({
      name: 'Viewer',
      description: 'Can only view content',
    });
    console.log(`  ✓ Created: Viewer`);

    const editorRole = await createRole.execute({
      name: 'Editor',
      description: 'Can view and edit content',
    });
    console.log(`  ✓ Created: Editor`);

    const adminRole = await createRole.execute({
      name: 'Admin',
      description: 'Full access',
    });
    console.log(`  ✓ Created: Admin`);

    // 3. Grant Permissions to Roles
    console.log('\n🔑 Granting Permissions to Roles...');

    // Viewer: can view users and posts
    await grantPermissionToRole.execute({
      roleId: viewerRole.getId().toString(),
      permissionId: viewUsersPermission.getId().toString(),
    });
    await grantPermissionToRole.execute({
      roleId: viewerRole.getId().toString(),
      permissionId: viewPostsPermission.getId().toString(),
    });
    console.log(`  ✓ Viewer: users:view, posts:view`);

    // Editor: can edit users and posts
    await grantPermissionToRole.execute({
      roleId: editorRole.getId().toString(),
      permissionId: editUsersPermission.getId().toString(),
    });
    await grantPermissionToRole.execute({
      roleId: editorRole.getId().toString(),
      permissionId: editPostsPermission.getId().toString(),
    });
    console.log(`  ✓ Editor: users:edit, posts:edit`);

    // Admin: can delete users
    await grantPermissionToRole.execute({
      roleId: adminRole.getId().toString(),
      permissionId: deleteUsersPermission.getId().toString(),
    });
    console.log(`  ✓ Admin: users:delete`);

    // 4. Create Role Hierarchy (Graph)
    console.log('\n🌳 Creating Role Hierarchy (Graph)...');

    // Editor inherits from Viewer
    await setRoleParent.execute({
      roleId: editorRole.getId().toString(),
      parentRoleId: viewerRole.getId().toString(),
    });
    console.log(`  ✓ Editor → Viewer (Editor inherits Viewer permissions)`);

    // Admin inherits from Editor
    await setRoleParent.execute({
      roleId: adminRole.getId().toString(),
      parentRoleId: editorRole.getId().toString(),
    });
    console.log(`  ✓ Admin → Editor (Admin inherits Editor permissions)`);
    console.log(`\n  Hierarchy: Admin → Editor → Viewer`);

    // 5. Create Users
    console.log('\n👤 Creating Users...');
    const alice = await createUser.execute({
      name: 'Alice',
      email: 'alice@example.com',
    });
    console.log(`  ✓ Created: Alice (alice@example.com)`);

    const bob = await createUser.execute({
      name: 'Bob',
      email: 'bob@example.com',
    });
    console.log(`  ✓ Created: Bob (bob@example.com)`);

    const charlie = await createUser.execute({
      name: 'Charlie',
      email: 'charlie@example.com',
    });
    console.log(`  ✓ Created: Charlie (charlie@example.com)`);

    // 6. Assign Roles to Users
    console.log('\n🎭 Assigning Roles to Users...');
    await assignRoleToUser.execute({
      userId: alice.getId().toString(),
      roleId: viewerRole.getId().toString(),
    });
    console.log(`  ✓ Alice → Viewer`);

    await assignRoleToUser.execute({
      userId: bob.getId().toString(),
      roleId: editorRole.getId().toString(),
    });
    console.log(`  ✓ Bob → Editor`);

    await assignRoleToUser.execute({
      userId: charlie.getId().toString(),
      roleId: adminRole.getId().toString(),
    });
    console.log(`  ✓ Charlie → Admin`);

    // 7. Test Permissions (Graph Traversal)
    console.log('\n🔍 Testing Permissions (Graph Traversal)...\n');

    // Alice (Viewer)
    console.log('Alice (Viewer):');
    let result = await checkUserPermission.execute({
      userId: alice.getId().toString(),
      resource: 'users',
      action: 'view',
    });
    console.log(
      `  users:view → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    result = await checkUserPermission.execute({
      userId: alice.getId().toString(),
      resource: 'users',
      action: 'edit',
    });
    console.log(
      `  users:edit → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    // Bob (Editor inherits from Viewer)
    console.log('\nBob (Editor → Viewer):');
    result = await checkUserPermission.execute({
      userId: bob.getId().toString(),
      resource: 'users',
      action: 'view',
    });
    console.log(
      `  users:view → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    result = await checkUserPermission.execute({
      userId: bob.getId().toString(),
      resource: 'users',
      action: 'edit',
    });
    console.log(
      `  users:edit → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    result = await checkUserPermission.execute({
      userId: bob.getId().toString(),
      resource: 'users',
      action: 'delete',
    });
    console.log(
      `  users:delete → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    // Charlie (Admin inherits from Editor → Viewer)
    console.log('\nCharlie (Admin → Editor → Viewer):');
    result = await checkUserPermission.execute({
      userId: charlie.getId().toString(),
      resource: 'users',
      action: 'view',
    });
    console.log(
      `  users:view → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    result = await checkUserPermission.execute({
      userId: charlie.getId().toString(),
      resource: 'users',
      action: 'edit',
    });
    console.log(
      `  users:edit → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    result = await checkUserPermission.execute({
      userId: charlie.getId().toString(),
      resource: 'users',
      action: 'delete',
    });
    console.log(
      `  users:delete → ${result.hasPermission ? '✓ GRANTED' : '✗ DENIED'} (${result.reason})`,
    );

    // 8. Test Circular Dependency Prevention
    console.log('\n🛡️  Testing Circular Dependency Prevention...');
    try {
      await setRoleParent.execute({
        roleId: viewerRole.getId().toString(),
        parentRoleId: adminRole.getId().toString(),
      });
      console.log('  ✗ ERROR: Circular dependency was not prevented!');
    } catch (error) {
      console.log(`  ✓ Circular dependency prevented: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Demo completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error during demo:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();
