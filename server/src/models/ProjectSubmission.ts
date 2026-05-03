import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectSubmissionAttributes {
    id: number;
    contest_id: string;
    user_id: string;
    code_url?: string;
    doc_url?: string;
    video_url?: string;
    score?: number;
    feedback?: string;
    submitted_at?: Date;
}

interface ProjectSubmissionCreationAttributes extends Optional<ProjectSubmissionAttributes, 'id' | 'code_url' | 'doc_url' | 'video_url' | 'score' | 'feedback' | 'submitted_at'> { }

class ProjectSubmission extends Model<ProjectSubmissionAttributes, ProjectSubmissionCreationAttributes> implements ProjectSubmissionAttributes {
    public id!: number;
    public contest_id!: string;
    public user_id!: string;
    public code_url!: string;
    public doc_url!: string;
    public video_url!: string;
    public score!: number;
    public feedback!: string;
    public readonly submitted_at!: Date;
}

ProjectSubmission.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        contest_id: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        user_id: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        code_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        doc_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        video_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true
        },
        feedback: {
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
        tableName: 'project_submissions',
        timestamps: false
    }
);

export default ProjectSubmission;
