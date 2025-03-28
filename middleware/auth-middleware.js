import jwt from 'jsonwebtoken';
import Adjudicator from '../models/Adjudicator.js';
import AssociateUser from '../models/AssociateUser.js';
import InstituteAdmin from '../models/Admin.js';

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Determine user type and find user
        let user = null;

        if (decoded.adjudicatorId) {
            user = await Adjudicator.findById(decoded.adjudicatorId).select('-password');
            if (user) req.user = { ...decoded, role: 'adjudicator' };
        }
        else if (decoded.userId) {
            user = await AssociateUser.findById(decoded.userId).select('-password');
            if (user) req.user = { ...decoded, role: 'associate' };
        }
        else if (decoded.adminId) {
            user = await InstituteAdmin.findById(decoded.adminId).select('-password');
            if (user) req.user = { ...decoded, role: 'institute' };
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not found'
            });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};

export default authMiddleware;