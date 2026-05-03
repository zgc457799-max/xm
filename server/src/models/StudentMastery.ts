import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface StudentMasteryAttributes {
    user_id: string;
    node_id: string;
    mastery_score: number; // 0-100
    total_attempts: number;
    correct_count: number;
    last_updated?: Date;
}

interface StudentMasteryCreationAttributes extends Optional<StudentMasteryAttributes, 'mastery_score' | 'total_attempts' | 'correct_count' | 'last_updated'> { }

class StudentMastery extends Model<StudentMasteryAttributes, StudentMasteryCreationAttributes> implements StudentMasteryAttributes {
    public user_id!: string;
    public node_id!: string;
    public mastery_score!: number;
    public total_attempts!: number;
    public correct_count!: number;
    public readonly last_updated!: Date;
}

StudentMastery.init(
    {
        user_id: {
            type: DataTypes.STRING(64),
            primaryKey: true, // Composite PK
            allowNull: false
        },
        node_id: {
            type: DataTypes.STRING(64),
            primaryKey: true, // Composite PK
            allowNull: false
        },
        mastery_score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        total_attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        correct_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        last_updated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'student_mastery',
        timestamps: false
    }
);

export default StudentMastery;
