const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', async () => {
  console.log('Connected to MongoDB');
  try {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      await mongoose.connection.collections[collectionName].drop();
      console.log(`Dropped collection: ${collectionName}`);
    }
    console.log('All collections dropped');
  } catch (error) {
    console.error('Error dropping collections:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});
