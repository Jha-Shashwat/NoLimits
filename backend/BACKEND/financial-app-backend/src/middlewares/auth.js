const admin = require('../config/firebase');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Check if user exists in our database
    const userResult = await db.query('SELECT * FROM users WHERE firebase_uid = $1', [uid]);
    
    if (userResult.rows.length === 0) {
      // Create a new user in our database if they don't exist
      const newUser = await db.query(
        'INSERT INTO users (firebase_uid, email, name) VALUES ($1, $2, $3) RETURNING *',
        [uid, decodedToken.email || '', decodedToken.name || '']
      );
      req.user = newUser.rows[0];
    } else {
      req.user = userResult.rows[0];
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware;