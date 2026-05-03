import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const login = async (req: Request, res: Response) => {
    try {
        const { id, password = '' } = req.body;

        // Find user
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        console.log(`[Login Debug] User: ${user.id}, Input Pwd: ${password}, Hash in DB: ${user.password_hash}, Match: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({ message: '密码错误' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { id, password, name, role } = req.body;

        const existing = await User.findByPk(id);
        if (existing) {
            return res.status(400).json({ message: '用户已存在' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await User.create({
            id,
            password_hash,
            name,
            role,
            college: '',
            major: '',
            class_name: '',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
        });

        res.status(201).json({ message: '注册成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '注册失败' });
    }
};

export const getMe = async (req: Request | any, res: Response) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return res.status(404).json({ message: '用户不存在' });

        const raw = user.toJSON() as any;
        raw.className = raw.class_name;

        res.json(raw);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const students = await User.findAll({
            where: { role: 'STUDENT' },
            attributes: { exclude: ['password_hash'] }
        });

        const mappedStudents = students.map(s => {
            const raw = s.toJSON() as any;
            raw.className = raw.class_name;
            return raw;
        });

        res.json(mappedStudents);
    } catch (error) {
        console.error("Get All Students Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const changePassword = async (req: Request | any, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: '用户不存在' });

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: '旧密码错误' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // Update
        await user.update({ password_hash: newHash });

        res.json({ message: '密码修改成功' });


    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: '修改密码失败' });
    }
};

// Admin/Teacher: Create a new student manually
export const createStudent = async (req: Request, res: Response) => {
    try {
        const { id, name, college, major, class_name } = req.body;

        // Check if exists
        const existing = await User.findByPk(id);
        if (existing) {
            return res.status(400).json({ message: '用户ID已存在' });
        }

        // Default password for manually created students: 123456
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('123456', salt);

        const newStudent = await User.create({
            id,
            name,
            password_hash,
            role: 'STUDENT',
            college: college || '',
            major: major || '',
            class_name: class_name || req.body.className || '',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
        });

        const raw = newStudent.toJSON() as any;
        raw.className = raw.class_name;

        res.status(201).json(raw);
    } catch (error) {
        console.error("Create Student Error:", error);
        res.status(500).json({ message: '创建学生失败' });
    }
};

// Admin/Teacher: Update student info
export const updateStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, college, major, class_name, password } = req.body;

        const student = await User.findByPk(id);
        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        const updateData: any = {
            name,
            college,
            major,
            class_name: class_name || req.body.className
        };

        // If password is provided, update it
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(password, salt);
        }

        await student.update(updateData);

        res.json({ message: '更新成功', student });
    } catch (error) {
        console.error("Update Student Error:", error);
        res.status(500).json({ message: '更新学生失败' });
    }
};

// Admin/Teacher: Delete student
export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const student = await User.findByPk(id);

        if (!student) {
            return res.status(404).json({ message: '学生不存在' });
        }

        await student.destroy();
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error("Delete Student Error:", error);
        res.status(500).json({ message: '删除学生失败' });
    }
};
