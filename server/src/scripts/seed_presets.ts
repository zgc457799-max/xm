import { sequelize } from '../config/database';
import Problem from '../models/Problem';
import TestCase from '../models/TestCase';
import ProblemBank from '../models/ProblemBank';

const curatedProblems = [
    // ================= 1. 基础入门题库 (C / C++ / Java / Python) =================
    // C语言基础练习 (b1)
    {
        bankId: 'b1',
        title: 'A + B Problem (C语言版)',
        difficulty: 'Easy' as const,
        tags: ['C语言', '基础语法', '顺序结构'],
        description: '### 题目描述\n输入两个整数 **a** 和 **b**，计算它们的和并输出。\n\n### 输入格式\n一行内输入两个以空格分隔的整数 **a** 和 **b**。\n\n### 输出格式\n输出一个整数，即 **a + b** 的值。\n\n### 约束条件\n- $-10^9 \\le a, b \\le 10^9$',
        inputExample: '12 34',
        outputExample: '46',
        testCases: [
            { input: '12 34', output: '46' },
            { input: '0 0', output: '0' },
            { input: '-10 20', output: '10' },
            { input: '100000 200000', output: '300000' },
            { input: '-999 -1', output: '-1000' }
        ]
    },
    {
        bankId: 'b1',
        title: '闰年判断 (C语言版)',
        difficulty: 'Easy' as const,
        tags: ['C语言', '基础语法', '条件分支'],
        description: '### 题目描述\n给定一个公元年份 **year**，判定该年份是否是闰年。\n\n**判定条件**：\n1. 能被 **4** 整除但不能被 **100** 整除。\n2. 或者能被 **400** 整除。\n\n### 输入格式\n输入一个正整数 **year**。\n\n### 输出格式\n若是闰年输出 `YES`，否则输出 `NO`。',
        inputExample: '2024',
        outputExample: 'YES',
        testCases: [
            { input: '2024', output: 'YES' },
            { input: '1900', output: 'NO' },
            { input: '2000', output: 'YES' },
            { input: '2023', output: 'NO' }
        ]
    },
    {
        bankId: 'b1',
        title: '打印乘法口诀表 (C语言版)',
        difficulty: 'Easy' as const,
        tags: ['C语言', '基础语法', '嵌套循环'],
        description: '### 题目描述\n读入一个正整数 **n**，输出前 **n** 行的九九乘法表。格式如下：\n`1*1=1`\n`1*2=2 2*2=4`\n每行的乘法公式之间用一个空格分隔。\n\n### 输入格式\n输入一个正整数 **n**。\n\n### 输出格式\n输出前 **n** 行乘法表，每行末尾不要有余留的空格。\n\n### 约束条件\n- $1 \\le n \\le 9$',
        inputExample: '3',
        outputExample: '1*1=1\n1*2=2 2*2=4\n1*3=3 2*3=6 3*3=9',
        testCases: [
            { input: '1', output: '1*1=1' },
            { input: '3', output: '1*1=1\n1*2=2 2*2=4\n1*3=3 2*3=6 3*3=9' }
        ]
    },

    // C++基础练习 (b7)
    {
        bankId: 'b7',
        title: 'A + B Problem (C++版)',
        difficulty: 'Easy' as const,
        tags: ['C++', '基础语法', '顺序结构'],
        description: '### 题目描述\n输入两个整数 **a** 和 **b**，计算它们的和并输出。推荐使用 `std::cin` 与 `std::cout`。\n\n### 输入格式\n一行内输入两个以空格分隔的整数 **a** 和 **b**。\n\n### 输出格式\n输出一个整数，即 **a + b** 的值。',
        inputExample: '5 7',
        outputExample: '12',
        testCases: [
            { input: '5 7', output: '12' },
            { input: '-10 10', output: '0' }
        ]
    },
    {
        bankId: 'b7',
        title: '素数判定 (C++版)',
        difficulty: 'Easy' as const,
        tags: ['C++', '基础语法', '循环结构'],
        description: '### 题目描述\n读入一个正整数 **n**，使用 C++ 循环语句判定它是否是素数（质数）。\n\n### 输入格式\n输入一个正整数 **n**。\n\n### 输出格式\n如果是素数输出 `YES`，否则输出 `NO`。',
        inputExample: '7',
        outputExample: 'YES',
        testCases: [
            { input: '7', output: 'YES' },
            { input: '4', output: 'NO' },
            { input: '2', output: 'YES' },
            { input: '1', output: 'NO' }
        ]
    },

    // Java基础练习 (b3)
    {
        bankId: 'b3',
        title: 'A + B Problem (Java版)',
        difficulty: 'Easy' as const,
        tags: ['Java', '基础语法', '顺序结构'],
        description: '### 题目描述\n使用 Java 读取两个整数 **a** 和 **b**，输出它们的和。注意主类名必须为 `Main`。\n\n### 输入格式\n一行内输入两个以空格分隔的整数 **a** 和 **b**。\n\n### 输出格式\n输出一个整数，即 **a + b** 的值。',
        inputExample: '100 200',
        outputExample: '300',
        testCases: [
            { input: '100 200', output: '300' },
            { input: '-50 30', output: '-20' }
        ]
    },
    {
        bankId: 'b3',
        title: 'Java 类的继承与封装',
        difficulty: 'Easy' as const,
        tags: ['Java', '面向对象', '基础语法'],
        description: '### 题目描述\n在 Java 中，设计一个 `Person` 基类与一个 `Student` 子类。\n- `Person` 类包含私有属性 `name` (String) 和 `age` (int)，提供带参构造方法及 `display()` 方法输出 `"Name: [name], Age: [age]"`。\n- `Student` 类继承自 `Person`，新增私有属性 `score` (double)，重写 `display()` 方法，输出 `"Name: [name], Age: [age], Score: [score]"`（保留一位小数）。\n\n测试框架会读入姓名、年龄、成绩，实例化 `Student` 并调用 `display()`。\n\n### 输入格式\n第一行输入姓名。\n第二行输入年龄。\n第三行输入成绩。\n\n### 输出格式\n输出该学生的信息。\n\n### 样例输入\n`Alice`\n`18`\n`92.5`\n\n### 样例输出\n`Name: Alice, Age: 18, Score: 92.5`',
        inputExample: 'Alice\n18\n92.5',
        outputExample: 'Name: Alice, Age: 18, Score: 92.5',
        testCases: [
            { input: 'Alice\n18\n92.5', output: 'Name: Alice, Age: 18, Score: 92.5' },
            { input: 'Bob\n20\n88.0', output: 'Name: Bob, Age: 20, Score: 88.0' }
        ]
    },

    // Python基础练习 (b5)
    {
        bankId: 'b5',
        title: 'A + B Problem (Python版)',
        difficulty: 'Easy' as const,
        tags: ['Python', '基础语法', '顺序结构'],
        description: '### 题目描述\n使用 Python 读取一行输入中的两个整数 **a** 和 **b**，计算它们的和并输出。推荐使用 `map(int, input().split())`。\n\n### 输入格式\n一行内输入两个以空格分隔的整数 **a** 和 **b**。\n\n### 输出格式\n输出一个整数，即 **a + b** 的值。',
        inputExample: '9 9',
        outputExample: '18',
        testCases: [
            { input: '9 9', output: '18' },
            { input: '0 -1', output: '-1' }
        ]
    },
    {
        bankId: 'b5',
        title: 'Python 列表切片与高级推导',
        difficulty: 'Easy' as const,
        tags: ['Python', '切片操作', '数据结构'],
        description: '### 题目描述\n输入一个包含多个整数的列表，输出满足以下两个条件的新列表：\n1. 仅保留下标为**偶数**的元素。\n2. 对这些保留的元素进行**平方**操作。\n请使用 Python 列表切片 (Slicing) 与列表推导式 (List Comprehension) 优雅实现。\n\n### 输入格式\n输入一行以空格分隔的若干整数。\n\n### 输出格式\n输出新列表的元素，以空格分隔。\n\n### 约束条件\n- 元素个数在 $1$ 到 $1000$ 之间',
        inputExample: '1 2 3 4 5 6',
        outputExample: '1 9 25',
        testCases: [
            { input: '1 2 3 4 5 6', output: '1 9 25' },
            { input: '10', output: '100' },
            { input: '-1 3 -2 4', output: '1 4' }
        ]
    },

    // ================= 2. 语言进阶题库 (C / C++ / Java / Python) =================
    // C语言进阶练习 (b2)
    {
        bankId: 'b2',
        title: '指针基本操作：交换数值',
        difficulty: 'Easy' as const,
        tags: ['C语言', '指针', '内存管理'],
        description: '### 题目描述\n在 C 语言中，定义一个函数 `swap(int *a, int *b)`，通过指针参数交换调用函数中两个外部变量的值。\n\n### 输入格式\n输入一行两个整数 **x** 和 **y**。\n\n### 输出格式\n输出交换后的两个整数 **x** 和 **y**，以空格分隔。\n\n### 约束条件\n- $-10^6 \\le x, y \\le 10^6$',
        inputExample: '12 88',
        outputExample: '88 12',
        testCases: [
            { input: '12 88', output: '88 12' },
            { input: '0 -5', output: '-5 0' }
        ]
    },

    // ================= 3. 核心数据结构专项 (b11) =================
    {
        bankId: 'b11',
        title: '单链表反转',
        difficulty: 'Medium' as const,
        tags: ['数据结构', '链表', '指针'],
        description: '### 题目描述\n输入一个单链表，将其原地反转，并输出反转后的链表。\n\n### 输入格式\n第一行包含一个整数 **n**，代表链表节点个数。\n第二行包含 **n** 个整数，代表链表中各节点的值。\n\n### 输出格式\n输出反转后的链表节点值，以空格分隔。',
        inputExample: '5\n1 2 3 4 5',
        outputExample: '5 4 3 2 1',
        testCases: [
            { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
            { input: '1\n99', output: '99' },
            { input: '0\n', output: '' }
        ]
    },
    {
        bankId: 'b11',
        title: '有效的括号匹配',
        difficulty: 'Easy' as const,
        tags: ['数据结构', '栈', '字符串'],
        description: '### 题目描述\n给定一个只包括 `(\`，`)\`，`{\`，`}\`，`[\`，`]\` 的字符串，判断字符串是否有效。\n\n有效字符串需满足：\n1. 左括号必须用相同类型的右括号闭合。\n2. 左括号必须以正确的顺序闭合。\n\n### 输入格式\n输入一个括号字符串。\n\n### 输出格式\n如果有效输出 `true`，否则输出 `false`。',
        inputExample: '{[()]}',
        outputExample: 'true',
        testCases: [
            { input: '{[()]}', output: 'true' },
            { input: '()[]{}', output: 'true' },
            { input: '([)]', output: 'false' },
            { input: '(', output: 'false' }
        ]
    },

    // ================= 4. 算法专项 (b12) =================
    {
        bankId: 'b12',
        title: '快速排序算法',
        difficulty: 'Medium' as const,
        tags: ['算法', '排序', '分治'],
        description: '### 题目描述\n利用分治思想实现经典的快速排序 (Quick Sort) 算法，对给定的无序数组按从小到大排序。\n\n### 输入格式\n第一行包含一个整数 **n**，代表数组大小。\n第二行包含 **n** 个以空格分隔的整数，代表数组元素。\n\n### 输出格式\n输出一行排好序的元素，以空格分隔。\n\n### 约束条件\n- $1 \\le n \\le 10^5$',
        inputExample: '6\n3 5 1 6 2 4',
        outputExample: '1 2 3 4 5 6',
        testCases: [
            { input: '6\n3 5 1 6 2 4', output: '1 2 3 4 5 6' },
            { input: '5\n5 4 3 2 1', output: '1 2 3 4 5' },
            { input: '3\n1 1 1', output: '1 1 1' }
        ]
    },
    {
        bankId: 'b12',
        title: '0/1 背包问题',
        difficulty: 'Hard' as const,
        tags: ['算法', '动态规划', '背包问题'],
        description: '### 题目描述\n有 **N** 件物品和一个容量为 **V** 的背包。第 **i** 件物品的体积是 $v_i$，价值是 $w_i$。求解将哪些物品装入背包可使这些物品的总体积不超过背包容量，且价值总和最大。输出最大价值。\n\n### 输入格式\n第一行包含两个整数 **N** 和 **V**，分别表示物品数量和背包容量。\n接下来 **N** 行，每行包含两个整数 $v_i$ 和 $w_i$，分别表示第 **i** 件物品的体积和价值。\n\n### 输出格式\n输出一个整数，表示背包能容纳的最大价值。\n\n### 约束条件\n- $1 \\le N, V \\le 1000$\n- $1 \\le v_i, w_i \\le 1000$',
        inputExample: '4 5\n1 2\n2 4\n3 4\n4 7',
        outputExample: '9',
        testCases: [
            { input: '4 5\n1 2\n2 4\n3 4\n4 7', output: '9' },
            { input: '3 10\n4 3\n5 4\n6 6', output: '10' }
        ]
    }
];

const seedPresetsToDb = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // 1. Check & Seed Banks
        const presetBanks = [
            { id: 'b1', title: 'C语言基础练习', description: '面向初学者的C语言基础语法练习题' },
            { id: 'b2', title: 'C语言进阶练习', description: 'C语言进阶知识与算法练习' },
            { id: 'b3', title: 'Java基础练习', description: 'Java面向对象基础语法练习题' },
            { id: 'b4', title: 'Java进阶练习', description: 'Java高级特性与企业级开发练习' },
            { id: 'b5', title: 'Python基础练习', description: 'Python入门语法与基础数据结构' },
            { id: 'b6', title: 'Python进阶练习', description: 'Python高级编程与常用库练习' },
            { id: 'b7', title: 'C++基础练习', description: 'C++基础语法与面向对象编程' },
            { id: 'b8', title: 'C++进阶练习', description: 'C++ STL与高级特性强化训练' },
            { id: 'b11', title: '数据结构专项', description: '线性表、树、图等核心数据结构练习' },
            { id: 'b12', title: '算法专项', description: '排序、查找、动态规划等经典算法练习' }
        ];

        for (const bank of presetBanks) {
            const [b, created] = await ProblemBank.findOrCreate({
                where: { id: bank.id },
                defaults: bank
            });
            if (created) {
                console.log(`[Seed Bank] Created Bank: ${bank.title} (${bank.id})`);
            } else {
                console.log(`[Seed Bank] Bank already exists: ${bank.title} (${bank.id})`);
            }
        }

        // 2. Clear old custom mock/presets if they exist to avoid duplication
        console.log('Clearing old populated presets to prevent duplicates...');
        const presetTitles = curatedProblems.map(p => p.title);
        const oldProblems = await Problem.findAll({
            where: { title: presetTitles }
        });
        
        for (const oldProb of oldProblems) {
            await TestCase.destroy({ where: { problem_id: oldProb.id } });
            await oldProb.destroy();
        }
        console.log('Old duplicates cleared.');

        // 3. Inject Curated Problems
        let problemCount = 0;
        let caseCount = 0;

        for (const p of curatedProblems) {
            const problemId = `p_seed_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

            const problem = await Problem.create({
                id: problemId,
                bank_id: p.bankId,
                title: p.title,
                difficulty: p.difficulty,
                description: p.description,
                input_example: p.inputExample,
                output_example: p.outputExample,
                tags: p.tags,
                pass_rate: 0
            });
            problemCount++;

            if (p.testCases && p.testCases.length > 0) {
                const cases = p.testCases.map(tc => ({
                    problem_id: problemId,
                    input_data: tc.input,
                    output_data: tc.output,
                    is_hidden: true
                }));
                await TestCase.bulkCreate(cases);
                caseCount += cases.length;
            }
        }

        console.log(`[Success] Population complete! Injected ${problemCount} problems and ${caseCount} associated test cases into your active database.`);
        process.exit(0);
    } catch (error) {
        console.error('Population Failed:', error);
        process.exit(1);
    }
};

seedPresetsToDb();
