const { MongoClient } = require('mongodb');

async function fetchData() {
  const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('school');
    const result = await db.collection('students').find().toArray();
    console.log('Data from MongoDB:', result);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

fetchData();
