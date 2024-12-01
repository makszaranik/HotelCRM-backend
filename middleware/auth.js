import jwt from 'jsonwebtoken';
import { getConnection } from '../mongodb.js';

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  try {
    const database = getConnection();
    const tokenCollection = database.collection('token_dead_list');
    
    const tokenInDeadList = await tokenCollection.findOne({ token });

    if (tokenInDeadList) {
      return res.status(401).json({ message: "Access Denied: Token Revoked" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token Expired" });
    }
    return res.status(403).json({ message: "Invalid Token" });
  }
};

export default authMiddleware;

