import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface TestCaseAttributes {
    id: number;
    problem_id: string;
    input_data: string;
    output_data: string;
    is_hidden?: boolean;
}

interface TestCaseCreationAttributes extends Optional<TestCaseAttributes, 'id' | 'is_hidden'> { }

class TestCase extends Model<TestCaseAttributes, TestCaseCreationAttributes> implements TestCaseAttributes {
    public id!: number;
    public problem_id!: string;
    public input_data!: string;
    public output_data!: string;
    public is_hidden!: boolean;
}

TestCase.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        problem_id: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        input_data: {
            type: DataTypes.TEXT('long'),
            allowNull: false
        },
        output_data: {
            type: DataTypes.TEXT('long'),
            allowNull: false
        },
        is_hidden: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        sequelize,
        tableName: 'test_cases',
        timestamps: false
    }
);

export default TestCase;
