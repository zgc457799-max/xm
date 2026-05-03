import { Request, Response } from 'express';
import SystemSetting from '../models/SystemSetting';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await SystemSetting.findAll();
        const settingsMap: Record<string, string> = {};
        for (const s of settings) {
            settingsMap[s.key] = s.value;
        }

        // Return sensitive info like keys? Yes, to ADMIN/TEACHER if authorized, but we should be careful.
        // Assuming this endpoint is protected by requireRole('TEACHER', 'ADMIN')
        res.status(200).json(settingsMap);
    } catch (error) {
        console.error('Failed to get settings:', error);
        res.status(500).json({ message: '获取设置失败' });
    }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const updates: Record<string, string> = req.body;
        for (const [key, value] of Object.entries(updates)) {
            await SystemSetting.upsert({ key, value });
        }
        res.status(200).json({ message: '设置保存成功' });
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ message: '保存设置失败' });
    }
};
