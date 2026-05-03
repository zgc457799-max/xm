import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SystemSettingAttributes {
    key: string;
    value: string;
    description: string;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'description'> { }

class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes> implements SystemSettingAttributes {
    public key!: string;
    public value!: string;
    public description!: string;
}

SystemSetting.init(
    {
        key: {
            type: DataTypes.STRING(128),
            primaryKey: true,
            comment: 'Setting Key'
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'system_settings',
        timestamps: false
    }
);

export default SystemSetting;
