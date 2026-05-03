import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Comment, CommentLike } from '../models/Comment';
import User from '../models/User';

export const getComments = async (req: Request, res: Response) => {
    try {
        const { problemId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        // @ts-ignore
        const currentUserId = req.user?.id;

        const { count, rows: comments } = await Comment.findAndCountAll({
            where: { problem_id: problemId },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        // Manual join for user info
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const users = await User.findAll({
            where: { id: userIds },
            attributes: ['id', 'name', 'avatar_url', 'role']
        });

        // Check likes for current user if logged in
        let userLikes: any[] = [];
        if (currentUserId) {
            userLikes = await CommentLike.findAll({
                where: {
                    user_id: currentUserId,
                    comment_id: comments.map(c => c.id)
                }
            });
        }
        const likedCommentIds = new Set(userLikes.map(l => l.comment_id.toString()));

        const userMap = new Map();
        users.forEach(u => userMap.set(u.id, u));

        const result = comments.map(c => {
            const u = userMap.get(c.user_id);
            return {
                id: c.id,
                user_id: c.user_id,
                user_name: u ? u.name : 'Unknown',
                user_avatar: u ? u.avatar_url : null,
                user_role: u ? u.role : 'student',
                content: c.content,
                likes: c.likes,
                is_liked: likedCommentIds.has(c.id.toString()),
                created_at: c.created_at
            };
        });

        res.json({
            total: count,
            page,
            limit,
            comments: result
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userRole = req.user.role;
        const { problemId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Content is required' });
        }

        // Daily limit: 5 comments for students
        if (userRole && userRole.toLowerCase() === 'student') {
            const { isVerified } = req.body;

            // If they already passed the captcha (isVerified), we allow them to proceed
            if (!isVerified) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const count = await Comment.count({
                    where: {
                        user_id: userId,
                        created_at: {
                            [Op.gte]: today
                        }
                    }
                });

                if (count >= 5) {
                    return res.status(403).json({
                        message: 'Daily limit reached',
                        code: 'LIMIT_EXCEEDED',
                        suggestion: '您今天已发布5条评论，请通过验证码以继续。'
                    });
                }
            }
        }

        const comment = await Comment.create({
            user_id: userId,
            problem_id: problemId,
            content: content.trim()
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const toggleCommentLike = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { id } = req.params;

        const comment = await Comment.findByPk(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const existingLike = await CommentLike.findOne({
            where: { user_id: userId, comment_id: id }
        });

        if (existingLike) {
            await existingLike.destroy();
            await comment.decrement('likes');
            res.json({ liked: false, likes: comment.likes - 1 });
        } else {
            await CommentLike.create({ user_id: userId, comment_id: id });
            await comment.increment('likes');
            res.json({ liked: true, likes: comment.likes + 1 });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userRole = req.user.role;
        const { id } = req.params;

        const comment = await Comment.findByPk(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only author or teacher/admin can delete
        if (comment.user_id !== userId && userRole !== 'teacher' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }

        await comment.destroy();
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
