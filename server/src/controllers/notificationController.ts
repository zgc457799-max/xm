import { Request, Response } from 'express';
import Notification from '../models/Notification';
import socketService from '../services/socketService';

export const getNotifications = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const markAsRead = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({ where: { id, user_id: userId } });
        if (notification) {
            await notification.update({ is_read: true });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const markAllAsRead = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user.id;
        await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Internal Helper to send notification
export const sendNotification = async (userId: string, title: string, content: string, type: 'system' | 'contest' | 'judge' = 'system') => {
    try {
        const notification = await Notification.create({
            user_id: userId,
            title,
            content,
            type
        });

        // Real-time Push
        socketService.emitToUser(userId, 'new_notification', notification);

    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};
