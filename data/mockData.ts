
import { User, UserRole, Problem, Difficulty, Contest, ProblemBank, ContestType } from '../types';

export const MOCK_USER_STUDENT: User = {
  id: 's123',
  name: '李明',
  role: UserRole.STUDENT,
  college: '计算机科学与工程学院',
  major: '软件工程',
  className: '软工2301',
  stats: { solved: 42, rank: 15, accuracy: 88 }
};

export const MOCK_USER_TEACHER: User = {
  id: 't999',
  name: '张教授',
  role: UserRole.TEACHER,
  college: '计算机科学与工程学院'
};

export const MOCK_STUDENTS_LIST: User[] = [
  { id: 's101', name: '张伟', role: UserRole.STUDENT, college: '计算机学院', major: '计算机科学', className: '计科2301', stats: { solved: 45, accuracy: 92, rank: 1 } },
  { id: 's102', name: '王芳', role: UserRole.STUDENT, college: '计算机学院', major: '计算机科学', className: '计科2301', stats: { solved: 38, accuracy: 85, rank: 2 } },
  { id: 's103', name: '李娜', role: UserRole.STUDENT, college: '计算机学院', major: '信息安全', className: '信安2302', stats: { solved: 50, accuracy: 95, rank: 3 } },
  { id: 's104', name: '刘强', role: UserRole.STUDENT, college: '软件学院', major: '软件工程', className: '软工2301', stats: { solved: 20, accuracy: 60, rank: 10 } },
  { id: 's105', name: '陈杰', role: UserRole.STUDENT, college: '软件学院', major: '软件工程', className: '软工2301', stats: { solved: 33, accuracy: 78, rank: 5 } },
  { id: 's123', name: '李明', role: UserRole.STUDENT, college: '计算机学院', major: '软件工程', className: '软工2301', stats: { solved: 42, accuracy: 88, rank: 4 } },
];

export const MOCK_BANKS: ProblemBank[] = [
  { id: 'b1', title: 'C语言基础练习', description: '面向初学者的C语言基础语法练习题' },
  { id: 'b2', title: 'C语言进阶练习', description: 'C语言进阶知识与算法练习' },
  { id: 'b3', title: 'Java基础练习', description: 'Java面向对象基础语法练习题' },
  { id: 'b4', title: 'Java进阶练习', description: 'Java高级特性与企业级开发练习' },
  { id: 'b5', title: 'Python基础练习', description: 'Python入门语法与基础数据结构' },
  { id: 'b6', title: 'Python进阶练习', description: 'Python高级编程与常用库练习' },
  { id: 'b7', title: 'C++基础练习', description: 'C++基础语法与面向对象编程' },
  { id: 'b8', title: 'C++进阶练习', description: 'C++ STL与高级特性强化训练' },
  { id: 'b9', title: 'JavaScript基础练习', description: 'JavaScript核心语法与DOM操作' },
  { id: 'b10', title: 'Go语言基础练习', description: 'Go语言基础语法与并发编程入门' },
  { id: 'b11', title: '数据结构专项', description: '线性表、树、图等核心数据结构练习' },
  { id: 'b12', title: '算法专项', description: '排序、查找、动态规划等经典算法练习' },
];

export const MOCK_PROBLEMS: Problem[] = [
  // ================= C 语言基础 (10道) =================
  { id: '1001', bankId: 'b1', title: '变量与数据类型入门', difficulty: Difficulty.EASY, passRate: 85.3, tags: ['C语言', '基础语法'], description: '掌握基本数据类型的声明与赋值。' },
  { id: '1002', bankId: 'b1', title: '简单的算术运算', difficulty: Difficulty.EASY, passRate: 91.2, tags: ['C语言', '数学'], description: '实现加减乘除四则基本运算。' },
  { id: '1003', bankId: 'b1', title: '判断数字正负', difficulty: Difficulty.EASY, passRate: 88.5, tags: ['C语言', '条件判断'], description: '使用if-else语句判断一个整数是正数、负数还是零。' },
  { id: '1004', bankId: 'b1', title: '打印乘法口诀表', difficulty: Difficulty.EASY, passRate: 75.6, tags: ['C语言', '循环'], description: '利用双重循环打印9x9乘法表。' },
  { id: '1005', bankId: 'b1', title: '字符与ASCII码转换', difficulty: Difficulty.EASY, passRate: 82.4, tags: ['C语言', '字符操作'], description: '读取字符并输出其对应的ASCII码值。' },
  { id: '1006', bankId: 'b1', title: '摄氏度转华氏度', difficulty: Difficulty.EASY, passRate: 89.1, tags: ['C语言', '数学', '浮点数'], description: '根据公式将摄氏温度转换为华氏温度。' },
  { id: '1007', bankId: 'b1', title: '求三个数的最大值', difficulty: Difficulty.EASY, passRate: 80.0, tags: ['C语言', '条件判断'], description: '输入三个数，输出其中的最大值。' },
  { id: '1008', bankId: 'b1', title: '奇偶数判断', difficulty: Difficulty.EASY, passRate: 94.2, tags: ['C语言', '条件判断', '位运算'], description: '判断给定的整数是奇数还是偶数。' },
  { id: '1009', bankId: 'b1', title: '基础循环：打印星号', difficulty: Difficulty.EASY, passRate: 78.9, tags: ['C语言', '循环'], description: '根据输入的层数打印对应高度的直角三角形星号。' },
  { id: '1010', bankId: 'b1', title: '计算数组元素之和', difficulty: Difficulty.EASY, passRate: 76.5, tags: ['C语言', '数组'], description: '遍历数组并计算所有元素的总和。' },

  // ================= C 语言进阶 (5道) =================
  { id: '1011', bankId: 'b2', title: '指针基础操作', difficulty: Difficulty.MEDIUM, passRate: 62.3, tags: ['C语言', '指针'], description: '通过指针交换两个变量的值。' },
  { id: '1012', bankId: 'b2', title: '动态内存分配', difficulty: Difficulty.MEDIUM, passRate: 58.7, tags: ['C语言', '内存管理'], description: '使用malloc和free实现动态数组的创建与销毁。' },
  { id: '1013', bankId: 'b2', title: '结构体与联合体', difficulty: Difficulty.MEDIUM, passRate: 65.4, tags: ['C语言', '结构体'], description: '定义学生结构体并实现按成绩排序的功能。' },
  { id: '1014', bankId: 'b2', title: '宏定义与预处理', difficulty: Difficulty.MEDIUM, passRate: 70.1, tags: ['C语言', '预处理'], description: '编写带参数的宏，实现求最大值和最小值的操作。' },
  { id: '1015', bankId: 'b2', title: '文件读写基础', difficulty: Difficulty.MEDIUM, passRate: 55.9, tags: ['C语言', '文件操作'], description: '读取文本文件内容并统计其中的单词数量。' },

  // ================= Java 基础 (10道) =================
  { id: '1016', bankId: 'b3', title: 'Hello World', difficulty: Difficulty.EASY, passRate: 95.0, tags: ['Java', '基础语法'], description: '编写第一个Java程序，输出Hello World。' },
  { id: '1017', bankId: 'b3', title: '类与对象基础', difficulty: Difficulty.EASY, passRate: 85.2, tags: ['Java', '面向对象'], description: '创建一个简单的Person类并实例化。' },
  { id: '1018', bankId: 'b3', title: '方法重载与重写', difficulty: Difficulty.EASY, passRate: 78.4, tags: ['Java', '面向对象'], description: '实现多个同名方法，理解方法重载的规则。' },
  { id: '1019', bankId: 'b3', title: '封装与访问控制', difficulty: Difficulty.EASY, passRate: 82.7, tags: ['Java', '面向对象'], description: '使用private修饰符并提供getter/setter方法。' },
  { id: '1020', bankId: 'b3', title: '继承的基本概念', difficulty: Difficulty.EASY, passRate: 79.5, tags: ['Java', '面向对象'], description: '通过extends关键字实现类的继承。' },
  { id: '1021', bankId: 'b3', title: '接口与多态', difficulty: Difficulty.MEDIUM, passRate: 66.8, tags: ['Java', '面向对象'], description: '定义接口并通过不同的实现类展示多态特性。' },
  { id: '1022', bankId: 'b3', title: '异常处理入门', difficulty: Difficulty.MEDIUM, passRate: 64.3, tags: ['Java', '异常'], description: '使用try-catch-finally捕获并处理算术异常。' },
  { id: '1023', bankId: 'b3', title: '常用String方法', difficulty: Difficulty.EASY, passRate: 88.1, tags: ['Java', '字符串'], description: '练习字符串的截取、拼接、替换等常用操作。' },
  { id: '1024', bankId: 'b3', title: '集合框架：ArrayList基础', difficulty: Difficulty.MEDIUM, passRate: 72.5, tags: ['Java', '集合'], description: '使用ArrayList进行元素的增删改查操作。' },
  { id: '1025', bankId: 'b3', title: 'Java包装类与拆装箱', difficulty: Difficulty.EASY, passRate: 81.9, tags: ['Java', '基础类型'], description: '理解Integer等包装类的自动装箱与拆箱机制。' },

  // ================= Python 基础 (10道) =================
  { id: '1026', bankId: 'b5', title: 'Python基本输入输出', difficulty: Difficulty.EASY, passRate: 93.5, tags: ['Python', '基础语法'], description: '使用print和input函数完成基本交互。' },
  { id: '1027', bankId: 'b5', title: '列表与元组切片', difficulty: Difficulty.EASY, passRate: 86.4, tags: ['Python', '数据结构'], description: '掌握列表和元组的索引及切片操作。' },
  { id: '1028', bankId: 'b5', title: '字典与集合的基本操作', difficulty: Difficulty.EASY, passRate: 83.2, tags: ['Python', '数据结构'], description: '练习字典的键值对操作和集合的去重功能。' },
  { id: '1029', bankId: 'b5', title: '循环与列表推导式', difficulty: Difficulty.EASY, passRate: 77.8, tags: ['Python', '循环'], description: '使用列表推导式快速生成特定规则的列表。' },
  { id: '1030', bankId: 'b5', title: '函数与默认参数', difficulty: Difficulty.EASY, passRate: 85.9, tags: ['Python', '函数'], description: '定义函数并理解默认参数、可变参数的使用。' },
  { id: '1031', bankId: 'b5', title: '模块的导入与使用', difficulty: Difficulty.EASY, passRate: 89.0, tags: ['Python', '模块'], description: '导入math模块并使用其中的数学函数。' },
  { id: '1032', bankId: 'b5', title: '面向对象：类的定义', difficulty: Difficulty.EASY, passRate: 79.4, tags: ['Python', '面向对象'], description: '在Python中定义类并创建实例对象。' },
  { id: '1033', bankId: 'b5', title: '文件读写与上下文管理', difficulty: Difficulty.MEDIUM, passRate: 68.5, tags: ['Python', '文件操作'], description: '使用with open语句安全地读取和写入文件。' },
  { id: '1034', bankId: 'b5', title: '异常捕获与处理', difficulty: Difficulty.MEDIUM, passRate: 71.2, tags: ['Python', '异常'], description: '使用try-except块处理可能出现的运行时错误。' },
  { id: '1035', bankId: 'b5', title: 'Python装饰器初探', difficulty: Difficulty.HARD, passRate: 51.6, tags: ['Python', '高级特性'], description: '编写一个计算函数运行时间的装饰器。' },

  // ================= 数据结构专项 (10道) =================
  { id: '1036', bankId: 'b11', title: '单链表反转', difficulty: Difficulty.MEDIUM, passRate: 65.8, tags: ['数据结构', '链表'], description: '将一个单链表原地反转。' },
  { id: '1037', bankId: 'b11', title: '栈的数组实现', difficulty: Difficulty.MEDIUM, passRate: 70.3, tags: ['数据结构', '栈'], description: '利用数组实现一个具有push和pop操作的栈。' },
  { id: '1038', bankId: 'b11', title: '队列的链表实现', difficulty: Difficulty.MEDIUM, passRate: 68.9, tags: ['数据结构', '队列'], description: '使用链表实现一个先进先出的队列。' },
  { id: '1039', bankId: 'b11', title: '循环队列设计', difficulty: Difficulty.MEDIUM, passRate: 59.4, tags: ['数据结构', '队列'], description: '设计一个支持并发操作的循环队列。' },
  { id: '1040', bankId: 'b11', title: '二叉树的前序遍历', difficulty: Difficulty.MEDIUM, passRate: 74.1, tags: ['数据结构', '树'], description: '使用递归或迭代实现二叉树的前序遍历。' },
  { id: '1041', bankId: 'b11', title: '二叉搜索树的插入', difficulty: Difficulty.MEDIUM, passRate: 66.5, tags: ['数据结构', '树'], description: '在二叉搜索树中插入一个新的节点并保持性质。' },
  { id: '1042', bankId: 'b11', title: '判断平衡二叉树', difficulty: Difficulty.MEDIUM, passRate: 61.2, tags: ['数据结构', '树'], description: '检查一棵二叉树是否为高度平衡的二叉树。' },
  { id: '1043', bankId: 'b11', title: '最小堆的实现', difficulty: Difficulty.HARD, passRate: 53.7, tags: ['数据结构', '堆'], description: '实现一个最小堆，包含插入和提取最小元素的功能。' },
  { id: '1044', bankId: 'b11', title: '图的深度优先搜索', difficulty: Difficulty.MEDIUM, passRate: 58.9, tags: ['数据结构', '图'], description: '对给定的无向图进行深度优先遍历。' },
  { id: '1045', bankId: 'b11', title: '图的广度优先搜索', difficulty: Difficulty.MEDIUM, passRate: 60.4, tags: ['数据结构', '图'], description: '对给定的无向图进行广度优先遍历，求最短层数。' },

  // ================= 算法专项 (10道) =================
  { id: '1046', bankId: 'b12', title: '冒泡排序与优化', difficulty: Difficulty.EASY, passRate: 82.5, tags: ['算法', '排序'], description: '实现冒泡排序并加入提前终止的优化逻辑。' },
  { id: '1047', bankId: 'b12', title: '快速排序实现', difficulty: Difficulty.MEDIUM, passRate: 55.3, tags: ['算法', '排序', '分治'], description: '实现经典的快速排序算法。' },
  { id: '1048', bankId: 'b12', title: '二分查找', difficulty: Difficulty.EASY, passRate: 79.8, tags: ['算法', '查找'], description: '在有序数组中使用二分查找定位目标值。' },
  { id: '1049', bankId: 'b12', title: '斐波那契数列（动态规划）', difficulty: Difficulty.EASY, passRate: 76.2, tags: ['算法', '动态规划'], description: '使用动态规划求解第N个斐波那契数。' },
  { id: '1050', bankId: 'b12', title: '零钱兑换', difficulty: Difficulty.MEDIUM, passRate: 52.1, tags: ['算法', '动态规划'], description: '计算凑成总金额所需的最少硬币个数。' },
  { id: '1051', bankId: 'b12', title: '最长递增子序列', difficulty: Difficulty.MEDIUM, passRate: 50.8, tags: ['算法', '动态规划'], description: '找出给定数组中最长严格递增子序列的长度。' },
  { id: '1052', bankId: 'b12', title: '最小生成树（Kruskal）', difficulty: Difficulty.HARD, passRate: 52.6, tags: ['算法', '图论', '贪心'], description: '使用Kruskal算法求解连通图的最小生成树。' },
  { id: '1053', bankId: 'b12', title: '最短路径（Dijkstra）', difficulty: Difficulty.HARD, passRate: 51.4, tags: ['算法', '图论'], description: '求解带权有向图中单源最短路径。' },
  { id: '1054', bankId: 'b12', title: 'N皇后问题（回溯法）', difficulty: Difficulty.HARD, passRate: 54.2, tags: ['算法', '回溯'], description: '在NxN的棋盘上放置N个皇后，使其不能互相攻击。' },
  { id: '1055', bankId: 'b12', title: '字符串匹配（KMP算法）', difficulty: Difficulty.HARD, passRate: 50.1, tags: ['算法', '字符串'], description: '使用KMP算法在线性时间内完成字符串模式匹配。' }
];

const NOW = Date.now();
// Default Certificate Configuration
const DEFAULT_BG = "https://placehold.co/800x600/fffbf0/e2e8f0.png?text=Certificate+Background"; 
const DEFAULT_SEAL = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Seal_of_the_University_of_Chicago.svg/480px-Seal_of_the_University_of_Chicago.svg.png"; 

const MOCK_CERT_CONFIG = {
    bgUrl: DEFAULT_BG,
    sealUrl: DEFAULT_SEAL,
    items: [
        { id: 'title', type: 'static-text', text: '荣誉证书', x: 400, y: 120, fontSize: 48, color: '#333333', fontFamily: 'serif', fontWeight: 'bold' },
        { id: 'subtitle', type: 'variable-text', field: 'contestName', x: 400, y: 180, fontSize: 24, color: '#555555', fontFamily: 'serif' },
        { id: 'body1', type: 'static-text', text: '特此表彰', x: 400, y: 240, fontSize: 18, color: '#666666', fontFamily: 'sans-serif' },
        { id: 'name', type: 'variable-text', field: 'name', x: 400, y: 300, fontSize: 56, color: '#1e3a8a', fontFamily: 'serif', fontWeight: 'bold' },
        { id: 'body2', type: 'static-text', text: '在本次比赛中表现优异，荣获', x: 400, y: 380, fontSize: 18, color: '#666666', fontFamily: 'sans-serif' },
        { id: 'award', type: 'variable-text', field: 'award', x: 400, y: 440, fontSize: 32, color: '#b45309', fontFamily: 'serif', fontWeight: 'bold' },
        { id: 'date', type: 'variable-text', field: 'date', x: 600, y: 500, fontSize: 14, color: '#888888', fontFamily: 'sans-serif' },
    ]
} as any;

export const INITIAL_CONTESTS: Contest[] = [
  {
    id: 'c1',
    type: ContestType.CODING,
    title: '传智杯校内选拔赛',
    startTime: new Date(NOW - 3600 * 1000).toISOString(), 
    endTime: new Date(NOW + 3600 * 1000 * 2).toISOString(), 
    status: 'LIVE',
    participantCount: 234,
    registeredStudentIds: ['s101', 's102', 's123'],
    isRegistered: true,
    isSubmitted: false,
    isLeaderboardOpen: true,
    description: '本校年度最重要的算法赛事，选拔优秀选手参加省赛。',
    problemIds: ['1001', '1002']
  },
  {
    id: 'c2',
    type: ContestType.CODING,
    title: '第十五届蓝桥杯模拟赛 (II)',
    startTime: new Date(NOW + 86400 * 1000).toISOString(),
    endTime: new Date(NOW + 86400 * 1000 + 7200 * 1000).toISOString(),
    status: 'UPCOMING',
    participantCount: 56,
    registeredStudentIds: ['s101'],
    isRegistered: false,
    isSubmitted: false,
    isLeaderboardOpen: false,
    description: '蓝桥杯赛前模拟，完全模拟真实考试环境。',
    problemIds: ['1003']
  },
  {
    id: 'c3',
    type: ContestType.CODING,
    title: '2023秋季学期期末算法考核',
    startTime: new Date(NOW - 86400 * 1000 * 2).toISOString(),
    endTime: new Date(NOW - 86400 * 1000).toISOString(),
    status: 'ENDED',
    participantCount: 110,
    registeredStudentIds: ['s101', 's102', 's103', 's104', 's123'],
    isRegistered: true,
    isSubmitted: true,
    isLeaderboardOpen: false, 
    description: '期末考试，请大家认真对待。',
    problemIds: ['1001', '1004'],
    // Mock Result for Certificate
    certificateConfig: MOCK_CERT_CONFIG,
    results: [
        { userId: 's123', userName: '李明', score: 95, awardName: '一等奖', isPublished: true },
        { userId: 's101', userName: '张伟', score: 88, awardName: '二等奖', isPublished: true }
    ]
  },
  {
    id: 'c4',
    type: ContestType.PROJECT,
    title: '“未来杯”创意编程作品赛',
    startTime: new Date(NOW - 3600 * 1000 * 24 * 5).toISOString(),
    endTime: new Date(NOW + 3600 * 1000 * 24 * 10).toISOString(),
    status: 'LIVE',
    participantCount: 45,
    registeredStudentIds: ['s101', 's102', 's103', 's123'],
    isRegistered: true,
    isSubmitted: false,
    isLeaderboardOpen: false, // Teacher hasn't published yet
    description: '请提交你的期末大作业作品。要求包含：源代码(zip)、项目文档(pdf)及演示视频链接。',
    projectSubmissions: [
      {
         userId: 's101',
         userName: '张伟',
         codeUrl: 'mock_code.zip',
         docUrl: 'mock_doc.pdf',
         videoUrl: 'https://bilibili.com/video/BV123456',
         submittedAt: new Date(NOW - 3600 * 1000 * 24).toISOString(),
         score: 92,
         feedback: '项目创意很好，完成度很高。'
      },
      {
         userId: 's102',
         userName: '王芳',
         codeUrl: 'mock_code.zip',
         docUrl: 'mock_doc.pdf',
         videoUrl: 'https://bilibili.com/video/BV654321',
         submittedAt: new Date(NOW - 3600 * 1000 * 2).toISOString(),
         score: 85
      }
    ]
  }
];

export const MOCK_RANKINGS = [
  { rank: 1, name: '张三', solved: 5, time: '01:23:45', isMe: false },
  { rank: 2, name: '李明', solved: 4, time: '01:45:12', isMe: true }, 
  { rank: 3, name: '王五', solved: 4, time: '02:10:00', isMe: false },
  { rank: 4, name: '赵六', solved: 3, time: '01:15:30', isMe: false },
  { rank: 5, name: '孙七', solved: 2, time: '00:45:00', isMe: false },
];
