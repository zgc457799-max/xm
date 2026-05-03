
import { sequelize } from '../config/database';
import KnowledgeNode from '../models/KnowledgeNode';

const nodes = [
    // --- 基础语法 (Syntax) ---
    {
        id: 'syntax_variable',
        name: '变量与数据类型',
        category: '基础语法',
        description: '理解整型、浮点型、布尔型等基本数据类型及变量定义。',
        prerequisites: []
    },
    {
        id: 'syntax_io',
        name: '输入输出',
        category: '基础语法',
        description: '掌握标准输入(cin/scanf)和输出(cout/printf)。',
        prerequisites: ['syntax_variable']
    },
    {
        id: 'syntax_condition',
        name: '分支结构 (If-Else)',
        category: '基础语法',
        description: '逻辑判断与条件分支控制。',
        prerequisites: ['syntax_variable']
    },
    {
        id: 'syntax_loop',
        name: '循环结构',
        category: '基础语法',
        description: 'For 循环与 While 循环的使用。',
        prerequisites: ['syntax_condition']
    },
    {
        id: 'syntax_array',
        name: '一维数组',
        category: '基础语法',
        description: '数组的定义、索引访问与遍历。',
        prerequisites: ['syntax_loop']
    },
    {
        id: 'syntax_string',
        name: '字符串处理',
        category: '基础语法',
        description: '字符串的基本操作、拼接与查找。',
        prerequisites: ['syntax_array']
    },
    {
        id: 'syntax_function',
        name: '函数定义',
        category: '基础语法',
        description: '函数的声明、参数传递与返回值。',
        prerequisites: ['syntax_loop']
    },

    // --- 数据结构 (Data Structure) ---
    {
        id: 'ds_stack',
        name: '栈 (Stack)',
        category: '数据结构',
        description: '先进后出(LIFO)特性的线性表。',
        prerequisites: ['syntax_array']
    },
    {
        id: 'ds_queue',
        name: '队列 (Queue)',
        category: '数据结构',
        description: '先进先出(FIFO)特性的线性表。',
        prerequisites: ['syntax_array']
    },
    {
        id: 'ds_linkedlist',
        name: '链表',
        category: '数据结构',
        description: '节点指针链接的线性结构。',
        prerequisites: ['syntax_variable'] // complex pointers
    },
    {
        id: 'ds_tree',
        name: '二叉树基础',
        category: '数据结构',
        description: '二叉树的性质、存储与遍历。',
        prerequisites: ['ds_linkedlist', 'algo_recursion']
    },

    // --- 算法 (Algorithm) ---
    {
        id: 'algo_recursion',
        name: '递归',
        category: '算法',
        description: '函数自我调用解决子问题。',
        prerequisites: ['syntax_function']
    },
    {
        id: 'algo_sort',
        name: '排序算法',
        category: '算法',
        description: '冒泡、选择、插入及快速排序。',
        prerequisites: ['syntax_array', 'syntax_loop']
    },
    {
        id: 'algo_search',
        name: '二分查找',
        category: '算法',
        description: '有序数组中的对数级查找算法。',
        prerequisites: ['algo_sort']
    },
    {
        id: 'algo_dfs_bfs',
        name: '搜索 (DFS/BFS)',
        category: '算法',
        description: '深度优先与广度优先搜索策略。',
        prerequisites: ['ds_queue', 'ds_stack', 'algo_recursion']
    },
    {
        id: 'algo_dp',
        name: '动态规划 (DP)',
        category: '算法',
        description: '把原问题分解为相对简单的子问题的方式求解复杂问题。',
        prerequisites: ['algo_recursion']
    }
];

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Option 1: Sync (careful not to wipe other tables if using force: true globally)
        // Here we just use bulkCreate with updateOnDuplicate

        console.log(`Seeding ${nodes.length} knowledge nodes...`);

        for (const node of nodes) {
            await KnowledgeNode.upsert(node);
        }

        console.log('Knowledge Nodes seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
