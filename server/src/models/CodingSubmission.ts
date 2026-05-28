import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CodingSubmissionAttributes {
    id: number;
    user_id: string;
    problem_id: string;
    contest_id?: string;
    language: string;
    code_content: string;
    status: 'AC' | 'WA' | 'TLE' | 'CE' | 'RE' | 'PENDING';
    score?: number;
    time_used?: number;
    memory_used?: number;
    error_message?: string;
    submitted_at?: Date;
}

interface CodingSubmissionCreationAttributes extends Optional<CodingSubmissionAttributes, 'id' | 'contest_id' | 'status' | 'score' | 'time_used' | 'memory_used' | 'submitted_at'> { }

class CodingSubmission extends Model<CodingSubmissionAttributes, CodingSubmissionCreationAttributes> implements CodingSubmissionAttributes {
    public id!: number;
    public user_id!: string;
    public problem_id!: string;
    public contest_id!: string;
    public language!: string;
    public code_content!: string;
    public status!: 'AC' | 'WA' | 'TLE' | 'CE' | 'RE' | 'PENDING';
    public score!: number;
    public time_used!: number;
    public memory_used!: number;
    public error_message?: string;
    public readonly submitted_at!: Date;
}

CodingSubmission.init(
    {
        id: {
            type: DataTypes.INTEGER,
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
        contest_id: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        language: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        code_content: {
            type: DataTypes.TEXT('long'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('AC', 'WA', 'TLE', 'CE', 'RE', 'PENDING'),
            defaultValue: 'PENDING'
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        time_used: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        memory_used: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        submitted_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'coding_submissions',
        timestamps: false
    }
);

export default CodingSubmission;
