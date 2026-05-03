import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttributes {
    id: string;
    password_hash: string;
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    college?: string;
    major?: string;
    class_name?: string;
    avatar_url?: string;
    created_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'created_at' | 'college' | 'major' | 'class_name' | 'avatar_url'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public password_hash!: string;
    public name!: string;
    public role!: 'STUDENT' | 'TEACHER' | 'ADMIN';
    public college!: string;
    public major!: string;
    public class_name!: string;
    public avatar_url!: string;
    public readonly created_at!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            comment: '学号或工号'
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('STUDENT', 'TEACHER', 'ADMIN'),
            allowNull: false
        },
        college: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        major: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        class_name: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        avatar_url: {
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
        tableName: 'users',
        timestamps: false // We manage created_at manually or via default
    }
);

export default User;
