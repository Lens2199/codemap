import { Request , Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request type to include userID
declare global {
    namespace Express {
        interface Request {
            userId? : number;
        }
    }
}

export function requireAuth(req: Request , res: Response, next:NextFunction){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({ error: 'No token provided'});
    }

    if (!authHeader.startsWith('Bearer ')){
        return res.status(401).json({ error: 'Token must be Bearer format'});
    }

    const token = authHeader.substring(7); // Remove "Bearer"

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number};
        req.userId = decoded.userId;
        next()
    } catch (err) {
        return res.status(401).json({error: 'Invalid or expired token'});
    }
}