import express from 'express';
import mongoose from 'mongoose';
import users from './routes/users.js';
import hotels from './routes/hotels.js';
import cors from 'cors';
import mongodb from './mongodb.js';
import getConnection from './mongodb.js';

const app = express();
const port = 8000;

var corsOptions = {
  origin: 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use('/api/users', users);
app.use('/api/hotels', hotels);



getConnection()
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


