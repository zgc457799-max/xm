import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Notification extends Model {
    public id!: number;
    public user_id!: string;
    public title!: string;
    public content!: string;
    public type!: 'system' | 'contest' | 'judge';
    public is_read!: boolean;
    public readonly created_at!: Date;
}

Notification.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('system', 'contest', 'judge'),
        defaultValue: 'system'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

export default Notification;
