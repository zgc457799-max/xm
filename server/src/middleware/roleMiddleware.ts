import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request | any, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: '未授权，请先登录' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `权限不足：该操作仅限 ${roles.join(' 或 ')} 角色执行`
            });
        }

        next();
    };
};
