import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface StudentStatsAttributes {
    user_id: string;
    solved_count: number;
    total_submissions: number;
    accuracy_rate: number;
    streak_days: number;
    last_check_in?: Date;
    rank_score: number;
}

class StudentStats extends Model<StudentStatsAttributes> implements StudentStatsAttributes {
    public user_id!: string;
    public solved_count!: number;
    public total_submissions!: number;
    public accuracy_rate!: number;
    public streak_days!: number;
    public last_check_in!: Date;
    public rank_score!: number;
}

StudentStats.init(
    {
        user_id: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false
        },
        solved_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        total_submissions: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        accuracy_rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0
        },
        streak_days: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        last_check_in: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rank_score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        sequelize,
        tableName: 'student_stats',
        timestamps: false
    }
);

export default StudentStats;
