/**
 * Migration script to clean up old permission structure data
 * Run this to remove old permissions from MongoDB before using the new model
 * 
 * Usage: node cleanup-permissions-v2.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/role-manager';

async function migrate() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();
    const permissionsCollection = db.collection('permissions');

    // Count existing permissions
    const count = await permissionsCollection.countDocuments();
    console.log(`\nFound ${count} existing permissions`);

    if (count === 0) {
      console.log('✓ No permissions to migrate');
      return;
    }

    // Show sample of old structure
    const sample = await permissionsCollection.findOne();
    console.log('\nSample old permission structure:');
    console.log(JSON.stringify(sample, null, 2));

    // Ask for confirmation
    console.log('\n⚠️  This will DELETE all existing permissions!');
    console.log('   The new model is incompatible with the old structure.');
    console.log('   You will need to recreate permissions using the new API.');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete all permissions
    const result = await permissionsCollection.deleteMany({});
    console.log(`\n✓ Deleted ${result.deletedCount} permissions`);

    // Drop old indexes
    await permissionsCollection.dropIndexes();
    console.log('✓ Dropped old indexes');

    console.log('\n✅ Migration complete!');
    console.log('\nNew permission structure:');
    console.log('  - action: string (any value, e.g., "read", "write", "share")');
    console.log('  - resource_type: string (e.g., "project", "document", "user")');
    console.log('  - target_id: string | null (e.g., "project:123", "*", or null)');
    console.log('  - scope: string | null (e.g., "own", "team", "org", "global", or null)');
    console.log('\nNote: target_id and scope are mutually exclusive');
    console.log('   - Use target_id for specific resources or wildcards');
    console.log('   - Use scope for dynamic, runtime-resolved permissions');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

migrate().catch(console.error);
