import express from 'express';
import users from './routes/users.js';
import hotels from './routes/hotels.js';
import cors from 'cors';
import { connectDatabase } from './mongodb.js';

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


connectDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}).catch(err => {
  console.error('Error starting the server:', err);
});
