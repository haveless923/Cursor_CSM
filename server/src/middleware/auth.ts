import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      // 只在开发环境或特定情况下才详细记录过期错误
      if (err.name === 'TokenExpiredError') {
        console.warn('JWT token已过期:', err.expiredAt);
        return res.status(403).json({ error: '令牌已过期，请重新登录' });
      } else if (err.name === 'JsonWebTokenError') {
        console.error('JWT token格式错误:', err.message);
        return res.status(403).json({ error: '令牌无效，请重新登录' });
      } else {
        console.error('JWT验证失败:', err.message);
        return res.status(403).json({ error: '令牌验证失败，请重新登录' });
      }
    }
    // 只在开发环境记录成功日志
    if (process.env.NODE_ENV === 'development') {
      console.log('JWT验证成功 - userId:', decoded.userId);
    }
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}




