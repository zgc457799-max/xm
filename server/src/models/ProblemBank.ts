import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProblemBankAttributes {
    id: string;
    title: string;
    description?: string;
    cover_url?: string;
    created_at?: Date;
}

interface ProblemBankCreationAttributes extends Optional<ProblemBankAttributes, 'created_at' | 'description' | 'cover_url'> { }

class ProblemBank extends Model<ProblemBankAttributes, ProblemBankCreationAttributes> implements ProblemBankAttributes {
    public id!: string;
    public title!: string;
    public description!: string;
    public cover_url!: string;
    public readonly created_at!: Date;
}

ProblemBank.init(
    {
        id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        cover_url: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'problem_banks',
        timestamps: false
    }
);

export default ProblemBank;
