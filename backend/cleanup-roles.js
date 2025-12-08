// Script to clean up roles collection
const mongoose = require('mongoose');

async function cleanRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/role-manager');
    console.log('Connected to MongoDB');
    
    const result = await mongoose.connection.db.collection('roles').drop();
    console.log('Roles collection dropped:', result);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanRoles();
