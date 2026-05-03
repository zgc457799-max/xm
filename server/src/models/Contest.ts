import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ContestAttributes {
    id: string;
    title: string;
    type: 'CODING' | 'PROJECT';
    description?: string;
    start_time: Date;
    end_time: Date;
    is_leaderboard_open?: boolean;
    certificate_config?: any;
    created_at?: Date;
}

interface ContestCreationAttributes extends Optional<ContestAttributes, 'created_at' | 'description' | 'is_leaderboard_open' | 'certificate_config'> { }

class Contest extends Model<ContestAttributes, ContestCreationAttributes> implements ContestAttributes {
    public id!: string;
    public title!: string;
    public type!: 'CODING' | 'PROJECT';
    public description!: string;
    public start_time!: Date;
    public end_time!: Date;
    public is_leaderboard_open!: boolean;
    public certificate_config!: any;
    public readonly created_at!: Date;
}

Contest.init(
    {
        id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('CODING', 'PROJECT'),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        is_leaderboard_open: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        certificate_config: {
            type: DataTypes.JSON,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'contests',
        timestamps: false
    }
);

export default Contest;
