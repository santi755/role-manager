// Script to clean up permissions collection
const mongoose = require('mongoose');

async function cleanPermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/role-manager');
    console.log('Connected to MongoDB');
    
    const result = await mongoose.connection.db.collection('permissions').drop();
    console.log('Permissions collection dropped:', result);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanPermissions();
