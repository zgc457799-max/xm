import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CommentAttributes {
    id: number;
    user_id: string;
    problem_id: string;
    content: string;
    parent_id?: number; // For replies (optional, maybe Phase 4)
    likes: number;
    created_at?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'parent_id' | 'likes' | 'created_at'> { }

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
    public id!: number;
    public user_id!: string;
    public problem_id!: string;
    public content!: string;
    public parent_id!: number;
    public likes!: number;
    public readonly created_at!: Date;
}

Comment.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        problem_id: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        parent_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        likes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'comments',
        timestamps: false
    }
);

class CommentLike extends Model {
    public id!: number;
    public user_id!: string;
    public comment_id!: number;
}

CommentLike.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        comment_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'comment_likes',
        timestamps: false
    }
);

export { Comment, CommentLike };
export default Comment;
