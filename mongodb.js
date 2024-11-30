import mongoose from "mongoose";

const getConnection = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect('mongodb://localhost:27017', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};
export default getConnection;