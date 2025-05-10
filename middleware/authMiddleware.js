// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import FacultyModel from '../models/FacultyModel.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No token, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find faculty
    const faculty = await FacultyModel.findById(decoded.id).select('-password');
    if (!faculty) {
      return res.status(401).json({ 
        success: false,
        error: 'Faculty not found' 
      });
    }

    // Attach faculty to request
    req.user = faculty;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

export default authMiddleware;