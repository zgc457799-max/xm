import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface ContestRegistrationAttributes {
    contest_id: string;
    user_id: string;
    registered_at?: Date;
    is_submitted?: boolean;
    submitted_at?: Date;
}

class ContestRegistration extends Model<ContestRegistrationAttributes> implements ContestRegistrationAttributes {
    public contest_id!: string;
    public user_id!: string;
    public readonly registered_at!: Date;
    public is_submitted!: boolean;
    public submitted_at!: Date;
}

ContestRegistration.init(
    {
        contest_id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        user_id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        registered_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        is_submitted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'contest_registrations',
        timestamps: false
    }
);

export default ContestRegistration;
