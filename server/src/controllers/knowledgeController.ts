import { Request, Response } from 'express';
import KnowledgeNode from '../models/KnowledgeNode';
import StudentMastery from '../models/StudentMastery';
import { v4 as uuidv4 } from 'uuid';

// 获取所有知识点 (图谱结构)
export const getKnowledgeGraph = async (req: Request, res: Response): Promise<void> => {
    try {
        const nodes = await KnowledgeNode.findAll();
        res.json(nodes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching knowledge graph nodes', error });
    }
};

// 获取学生的掌握情况
export const getStudentMastery = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id; // Assuming auth middleware adds user to req
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const mastery = await StudentMastery.findAll({
            where: { user_id: userId },
            include: [{ model: KnowledgeNode, as: 'node' }]
        });
        res.json(mastery);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student mastery', error });
    }
};

// 创建知识点 (Admin Only - simplified for now)
export const createKnowledgeNode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, name, category, description, prerequisites } = req.body;
        // id can be manual or auto-generated. Let's allow manual if provided, else uuid
        const nodeId = id || uuidv4();

        const newNode = await KnowledgeNode.create({
            id: nodeId,
            name,
            category,
            description,
            prerequisites: prerequisites || []
        });
        res.status(201).json(newNode);
    } catch (error) {
        res.status(500).json({ message: 'Error creating knowledge node', error });
    }
};

// (Internal Helper) Update mastery score
// logic: score = (correct_count / total_attempts) * 100 ? Or more complex decay?
// For now: Simple additive for correct, maybe cap at 100.
export const updateMastery = async (userId: string, tags: string[], isCorrect: boolean) => {
    if (!tags || tags.length === 0) return;

    for (const tagId of tags) {
        try {
            // Check if node exists first? Or assume tags match node ids
            const node = await KnowledgeNode.findByPk(tagId);
            if (!node) continue;

            let mastery = await StudentMastery.findOne({
                where: { user_id: userId, node_id: tagId }
            });

            if (!mastery) {
                mastery = await StudentMastery.create({
                    user_id: userId,
                    node_id: tagId,
                    mastery_score: 0,
                    total_attempts: 0,
                    correct_count: 0
                });
            }

            mastery.total_attempts += 1;
            if (isCorrect) {
                mastery.correct_count += 1;
                // Simple logic: +5 for correct, -1 for wrong? 
                // Let's do: Logarithmic growth or simple step.
                // Step: +5 points per correct answer, max 100.
                mastery.mastery_score = Math.min(100, mastery.mastery_score + 5);
            } else {
                // penalty? maybe -2, min 0
                mastery.mastery_score = Math.max(0, mastery.mastery_score - 2);
            }
            mastery.changed('last_updated', true); // Force update timestamp
            await mastery.save();

        } catch (err) {
            console.error(`Failed to update mastery for user ${userId} node ${tagId}`, err);
        }
    }
};
