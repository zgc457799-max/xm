import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProblemAttributes {
    id: string;
    bank_id?: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    input_example?: string;
    output_example?: string;
    tags?: any;
    pass_rate?: number;
    reference_code?: string;
    created_at?: Date;
}

interface ProblemCreationAttributes extends Optional<ProblemAttributes, 'created_at' | 'bank_id' | 'input_example' | 'output_example' | 'tags' | 'pass_rate' | 'reference_code'> { }

class Problem extends Model<ProblemAttributes, ProblemCreationAttributes> implements ProblemAttributes {
    public id!: string;
    public bank_id!: string;
    public title!: string;
    public difficulty!: 'Easy' | 'Medium' | 'Hard';
    public description!: string;
    public input_example!: string;
    public output_example!: string;
    public tags!: any;
    public pass_rate!: number;
    public reference_code!: string;
    public readonly created_at!: Date;
}

Problem.init(
    {
        id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        bank_id: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        difficulty: {
            type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT('long'), // LONGTEXT
            allowNull: false
        },
        input_example: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        output_example: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true
        },
        pass_rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0
        },
        reference_code: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'problems',
        timestamps: false
    }
);

export default Problem;
