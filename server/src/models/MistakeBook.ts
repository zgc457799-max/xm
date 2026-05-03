import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface MistakeBookAttributes {
    user_id: string;
    problem_id: string;
    added_at?: Date;
}

class MistakeBook extends Model<MistakeBookAttributes> implements MistakeBookAttributes {
    public user_id!: string;
    public problem_id!: string;
    public readonly added_at!: Date;
}

MistakeBook.init(
    {
        user_id: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        problem_id: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        added_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'mistake_book',
        timestamps: false
    }
);

export default MistakeBook;
