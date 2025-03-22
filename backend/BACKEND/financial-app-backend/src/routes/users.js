const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

// Get user profile (protected route)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // User data is already available from the auth middleware
    const user = req.user;
    
    // Don't send sensitive information
    delete user.firebase_uid;
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    
    const result = await db.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [name, req.user.id]
    );
    
    const updatedUser = result.rows[0];
    delete updatedUser.firebase_uid;
    
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;