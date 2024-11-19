import express from 'express';
import database from '../database.js';
import connection from '../database.js';

const router = express.Router();

let users = [
  { id: 1, email: "zaranik.maxim@lll.kpi.ua", password: "123" },
  { id: 2, email: "Andrew", password: "123" },
  { id: 3, email: "Lena", password: "123" }
];


//use database instead

router.post('/registration', (req, res) => {
  const { password, email } = req.body;
  const user = users.find((user) => user.email === email);
  if(user){
    return res.status(402).json({ message: "User exists"});
  }
  let maxId = 0;
  users.forEach(user => ((user.id > maxId) ? maxId = user.id : maxId));
  users.push({ id: maxId + 1, email: email, password: password} );
  res.status(200).json( {message: "Registration successfully"} );
});

router.post('/authorization', (req, res) => {
  const { password, email } = req.body;
  const user = users.find((user) => user.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Incorrect password" });
  }
  res.status(200).json({ message: "Authorized successfully" });
})




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
