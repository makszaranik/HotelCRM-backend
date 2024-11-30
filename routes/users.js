import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

let users = [];

const initUsers = async () => {
  users = [
    { id: 1, username: "Max", password: await bcrypt.hash("123", 10) },
    { id: 2, username: "Andrew", password: await bcrypt.hash("123", 10) },
    { id: 3, username: "Lena", password: await bcrypt.hash("123", 10) }
  ];
};

initUsers();

router.post('/registration', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((user) => user.username === username);
  if(user){
    return res.status(409).json({ message: "User exists" });
  }
  let maxId = 0;
  users.forEach(user => ((user.id > maxId) ? maxId = user.id : maxId));
  const hasedPassword = await bcrypt.hash(password, 10);
  users.push({ id: maxId + 1, username: username, password: hasedPassword });
  res.status(200).json({ message: "Registration successfully" });
});




router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(401).json({ message: "Authentication failed" });
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if(!passwordMatch){
    return res.status(401).json({ message: "Authentication failed" });
  }
  const token = jwt.sign({ userId: user.id, username: user.username }, 'your-secret-key', { expiresIn: '1h' });
  res.status(200).json(token);
});

router.get('/:id', (req, res) => {
  let id = parseInt(req.params.id);
  let user = users.filter((user) => user.id === id);
  if (user.length === 0) {
    res.status(404).json({ message: "User not found" });
  } else {
    res.status(200).json(user);
  }
});


export default router;
