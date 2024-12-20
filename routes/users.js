import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getConnection } from '../mongodb.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/registration', async (req, res) => {
  const { username, password } = req.body;
  const database = getConnection();
  const userCollection = database.collection('users');

  try {
    const user = await userCollection.findOne({ username: username });
    if (user) {
      return res.status(409).json({ message: "User exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username: username,
      password: hashedPassword
    };
    await userCollection.insertOne(newUser);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const database = getConnection();
  const userCollection = database.collection('users');
  
  try {
    const user = await userCollection.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1y' });
      res.status(200).json(token);
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ error: 'Token is missing' });
    }

    const database = getConnection();
    const tokenCollection = database.collection('token_dead_list');

    await tokenCollection.insertOne({ token });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
