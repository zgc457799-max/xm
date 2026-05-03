import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface KnowledgeNodeAttributes {
    id: string; // e.g. "py_loops", "algo_bfs"
    name: string;
    category: string;
    description?: string;
    prerequisites?: any; // JSON array of IDs: ["id1", "id2"]
    created_at?: Date;
}

interface KnowledgeNodeCreationAttributes extends Optional<KnowledgeNodeAttributes, 'description' | 'prerequisites' | 'created_at'> { }

class KnowledgeNode extends Model<KnowledgeNodeAttributes, KnowledgeNodeCreationAttributes> implements KnowledgeNodeAttributes {
    public id!: string;
    public name!: string;
    public category!: string;
    public description!: string;
    public prerequisites!: any;
    public readonly created_at!: Date;
}

KnowledgeNode.init(
    {
        id: {
            type: DataTypes.STRING(64),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        prerequisites: {
            type: DataTypes.JSON, // Stores array of definition IDs
            allowNull: true,
            defaultValue: []
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'knowledge_nodes',
        timestamps: false
    }
);

export default KnowledgeNode;
