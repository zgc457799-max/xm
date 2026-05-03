import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface ContestProblemAttributes {
    contest_id: string;
    problem_id: string;
    score_weight?: number;
    display_order?: number;
}

class ContestProblem extends Model<ContestProblemAttributes> implements ContestProblemAttributes {
    public contest_id!: string;
    public problem_id!: string;
    public score_weight!: number;
    public display_order!: number;
}

ContestProblem.init(
    {
        contest_id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        problem_id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        score_weight: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        sequelize,
        tableName: 'contest_problems',
        timestamps: false
    }
);

export default ContestProblem;
