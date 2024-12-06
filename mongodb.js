import { MongoClient } from 'mongodb';

const url = process.env.MONGO_URL;
const databaseName = 'hotelDB';

let database;

const connectDatabase = async () => {
  const client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
  try {
    await client.connect();
    database = client.db(databaseName);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const getConnection = () => {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
};

export { connectDatabase, getConnection };
