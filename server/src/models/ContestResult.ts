import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface ContestResultAttributes {
    contest_id: string;
    user_id: string;
    rank: number;
    score: number;
    award_name?: string | null;
    certificate_code?: string | null;
    is_published: boolean;
    created_at?: Date;
}

class ContestResult extends Model<ContestResultAttributes> implements ContestResultAttributes {
    public contest_id!: string;
    public user_id!: string;
    public rank!: number;
    public score!: number;
    public award_name!: string | null;
    public certificate_code!: string | null;
    public is_published!: boolean;
    public readonly created_at!: Date;
}

ContestResult.init(
    {
        contest_id: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        user_id: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        rank: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        award_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        certificate_code: {
            type: DataTypes.STRING(64),
            allowNull: true,
            unique: true
        },
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'contest_results',
        timestamps: false
    }
);

export default ContestResult;
