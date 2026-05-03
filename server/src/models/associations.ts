import Problem from './Problem';
import TestCase from './TestCase';
import User from './User';
import KnowledgeNode from './KnowledgeNode';
import StudentMastery from './StudentMastery';
import SystemSetting from './SystemSetting';

export const setupAssociations = () => {
    // Problem - TestCase
    Problem.hasMany(TestCase, { foreignKey: 'problem_id', as: 'testCases' });
    TestCase.belongsTo(Problem, { foreignKey: 'problem_id', as: 'problem' });

    // Knowledge Graph Associations
    User.hasMany(StudentMastery, { foreignKey: 'user_id', as: 'mastery' });
    StudentMastery.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    KnowledgeNode.hasMany(StudentMastery, { foreignKey: 'node_id', as: 'studentStats' });
    StudentMastery.belongsTo(KnowledgeNode, { foreignKey: 'node_id', as: 'node' });
};
