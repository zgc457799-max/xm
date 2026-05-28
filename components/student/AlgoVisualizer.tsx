import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, RotateCcw, ArrowRight, ChevronRight, HelpCircle, 
    ArrowLeft, Settings, Cpu, Bot, Sparkles, Code2, Pause, BookOpen, Send, Loader2
} from 'lucide-react';
import { Card, Button } from '../UiComponents';
import { getAIHint } from '../../services/api';

interface VisualizerLesson {
    id: string;
    title: string;
    lang: 'C' | 'C++' | 'Java' | 'Python';
    filename: string;
    code: string;
    steps: {
        line: number;
        vars: Record<string, any>;
        explanation: string;
        highlightVars?: string[];
    }[];
}

// ----------------------------------------------------
// Core High-Fidelity Pre-compiled Lessons (5 items)
// ----------------------------------------------------
const CORE_LESSONS: VisualizerLesson[] = [
    {
        id: 'c_1',
        title: '顺序结构：变量与数据类型 (C)',
        lang: 'C',
        filename: 'main.c',
        code: `// C语言：变量与数据类型 (C)演示
#include <stdio.h>

int main() {
    int test_val = 42; // 声明并初始化整型变量 test_val 为 42
    printf("执行完毕\\n"); // 调用 printf 打印提示信息
    return 0; // 主函数返回 0，程序正常退出
}`,
        steps: [
            { line: 5, vars: { test_val: '未初始化' }, explanation: '程序开始执行，在内存中分配整型变量空间。' },
            { line: 5, vars: { test_val: 42 }, explanation: '变量 test_val 被赋值为 42。', highlightVars: ['test_val'] },
            { line: 6, vars: { test_val: 42, output: '"执行完毕"' }, explanation: '执行打印操作，向控制台输出文本。', highlightVars: ['output'] },
            { line: 7, vars: { test_val: 42, output: '"执行完毕"', status: '正常退出' }, explanation: '程序执行结束。' }
        ]
    },
    {
        id: 'c_ifelse',
        title: '条件判断 if/else (C)',
        lang: 'C',
        filename: 'main.c',
        code: `// C语言：条件结构演示
#include <stdio.h>

int main() {
    int score = 85; // 初始化分数变量 score 为 85
    if (score >= 90) { // 判断 score 是否大于或等于 90
        printf("优秀\\n"); // 条件成立时打印"优秀"
    } else if (score >= 60) { // 否则判断是否大于或等于 60
        printf("及格\\n"); // 条件成立时打印"及格"
    } else {
        printf("不及格\\n"); // 所有条件都不成立时打印"不及格"
    }
    return 0; // 程序完美结束
}`,
        steps: [
            { line: 5, vars: { score: '未初始化' }, explanation: '程序开始执行，在主线程栈内存中分配整型变量 `score` 空间。' },
            { line: 5, vars: { score: 85 }, explanation: '变量 `score` 被赋予数值 `85`。', highlightVars: ['score'] },
            { line: 6, vars: { score: 85 }, explanation: '进入 `if (score >= 90)` 判断。由于 `85 >= 90` 结果为【假 (false)】，程序将跳过该分支。' },
            { line: 8, vars: { score: 85 }, explanation: '跳转并评估 `else if (score >= 60)`。由于 `85 >= 60` 结果为【真 (true)】，程序决定进入该分支！', highlightVars: ['score'] },
            { line: 9, vars: { score: 85, output: '"及格"' }, explanation: '执行打印操作，向控制台屏幕输出字符串 “及格”。', highlightVars: ['output'] },
            { line: 13, vars: { score: 85, output: '"及格"', status: '正常退出' }, explanation: '主程序返回 0，释放栈空间，程序完美结束。' }
        ]
    },
    {
        id: 'cpp_for',
        title: '基础循环 for (C++)',
        lang: 'C++',
        filename: 'main.cpp',
        code: `// C++: 基础循环演示
#include <iostream>
using namespace std;

int main() {
    int sum = 0; // 初始化累加器变量 sum
    for (int i = 1; i <= 3; i++) { // 设置循环变量 i 从 1 到 3
        sum += i; // 每次循环将 i 的值累加到 sum 中
    }
    cout << sum << endl; // 循环结束后输出最终的 sum
    return 0; // 程序完美结束
}`,
        steps: [
            { line: 6, vars: { sum: 0 }, explanation: '在内存中定义并初始化累加变量 `sum = 0`。' },
            { line: 7, vars: { sum: 0, i: 1 }, explanation: '循环初始化：声明循环变量 `i` 并赋予初始值 1。', highlightVars: ['i'] },
            { line: 7, vars: { sum: 0, i: 1 }, explanation: '循环条件评估：`i <= 3` (1 <= 3) 结果为【真】，程序获准进入循环体。' },
            { line: 8, vars: { sum: 1, i: 1 }, explanation: '执行累加：`sum = sum + i`，即 `0 + 1 = 1`。变量 `sum` 更新。', highlightVars: ['sum'] },
            { line: 7, vars: { sum: 1, i: 2 }, explanation: '执行单步迭代：计数器自增 `i++`。变量 `i` 变为 2。', highlightVars: ['i'] },
            { line: 7, vars: { sum: 1, i: 2 }, explanation: '条件再次评估：`2 <= 3` 为【真】，继续向下执行循环。' },
            { line: 8, vars: { sum: 3, i: 2 }, explanation: '执行累加：`sum = 1 + 2 = 3`。累加值更新。', highlightVars: ['sum'] },
            { line: 7, vars: { sum: 3, i: 3 }, explanation: '计数器自增：`i++`。`i` 变为 3。', highlightVars: ['i'] },
            { line: 7, vars: { sum: 3, i: 3 }, explanation: '条件评估：`3 <= 3` 依然为【真】，继续循环体.。' },
            { line: 8, vars: { sum: 6, i: 3 }, explanation: '执行累加：`sum = 3 + 3 = 6`。累加值更新。', highlightVars: ['sum'] },
            { line: 7, vars: { sum: 6, i: 4 }, explanation: '计数器自增：`i++`。`i` 变为 4。', highlightVars: ['i'] },
            { line: 7, vars: { sum: 6, i: 4 }, explanation: '条件评估：`4 <= 3` 结果为【假】！循环迭代结束，跳出循环。' },
            { line: 10, vars: { sum: 6, output: '6' }, explanation: '执行标准输出：打印最终的累加和 `6`。', highlightVars: ['output'] },
            { line: 11, vars: { sum: 6, output: '6', status: '正常结束' }, explanation: '返回 0，退出主程序。' }
        ]
    },
    {
        id: 'c_scope',
        title: '变量与作用域 (C)',
        lang: 'C',
        filename: 'main.c',
        code: `// C语言：局部与全局作用域
#include <stdio.h>
int g_val = 100; // 全局变量，在整个程序中均可访问

int main() {
    int local = 5; // 声明 main 函数的外层局部变量 local
    {
        int local = 10; // 声明内层块级局部变量 local，暂时屏蔽外层
        printf("%d\\n", local); // 采用就近原则，打印内层的 10
    }
    printf("%d\\n", local); // 内层作用域结束，恢复外层 local，打印 5
    return 0; // 程序结束
}`,
        steps: [
            { line: 3, vars: { g_val: 100 }, explanation: '全局段加载全局变量 `g_val = 100`，所有局部函数均可读写。' },
            { line: 6, vars: { g_val: 100, local: 5 }, explanation: '在 main 栈帧下声明第一个局部变量 `local = 5`。' },
            { line: 8, vars: { g_val: 100, 'local(外层)': 5, 'local(内层)': 10 }, explanation: '进入花括号局部作用域，声明了同名变量 `local = 10`。此时内层变量暂时屏蔽外层同名变量。', highlightVars: ['local(内层)'] },
            { line: 9, vars: { g_val: 100, 'local(外层)': 5, 'local(内层)': 10, output: '10' }, explanation: '执行打印，采用近邻原则访问作用域，输出内层的 10。', highlightVars: ['output'] },
            { line: 10, vars: { g_val: 100, local: 5 }, explanation: '跳出花括号。内层 `local` 生命周期终结并被析构。内存中仅存外层 `local = 5`。' },
            { line: 11, vars: { g_val: 100, local: 5, output: '5' }, explanation: '再次打印，此时处于外层作用域下，输出外层的值 5。', highlightVars: ['output'] }
        ]
    },
    {
        id: 'java_basic',
        title: 'Java 输入输出与基础 (Java)',
        lang: 'Java',
        filename: 'Main.java',
        code: `// Java: 基础输入输出示范
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int x = 10; // 初始化整型变量 x
        int y = x * 2; // 使用表达式计算出 y 的值
        System.out.println("Result: " + y); // 打印拼接好的字符串
    }
}`,
        steps: [
            { line: 6, vars: { x: 10 }, explanation: 'Java 虚拟机栈声明并为整型变量 `x` 赋值为 10。' },
            { line: 7, vars: { x: 10, y: 20 }, explanation: '计算表达式 `x * 2`，结果值 20 被装入栈中的局部变量 `y`。', highlightVars: ['y'] },
            { line: 8, vars: { x: 10, y: 20, output: '"Result: 20"' }, explanation: '调用 System.out 打印流，向标准设备控制台输出拼接字符串：Result: 20。', highlightVars: ['output'] }
        ]
    },
    {
        id: 'py_slice',
        title: 'Python 列表与切片 (Python)',
        lang: 'Python',
        filename: 'main.py',
        code: `# Python: 列表切片与推导
nums = [10, 20, 30, 40, 50] # 初始化包含 5 个元素的列表
subset = nums[1:4] # 截取索引 1 到 3 的子序列作为新列表
print(subset) # 打印子序列
`,
        steps: [
            { line: 2, vars: { nums: '[10, 20, 30, 40, 50]' }, explanation: 'Python 堆区创建 List 对象，并将变量 `nums` 的指针指向该内存空间。' },
            { line: 3, vars: { nums: '[10, 20, 30, 40, 50]', subset: '[20, 30, 40]' }, explanation: '使用切片语法 `nums[1:4]`，截取索引 1 至索引 3 的子序列元素，产生新列表。', highlightVars: ['subset'] },
            { line: 4, vars: { nums: '[10, 20, 30, 40, 50]', subset: '[20, 30, 40]', output: '[20, 30, 40]' }, explanation: '执行 `print()` 语句，输出该子序列。', highlightVars: ['output'] }
        ]
    }
];

// ----------------------------------------------------
// Structured Syllabus Matrix Metadata (80 items total)
// ----------------------------------------------------
interface SyllabusItem {
    id: string;
    title: string;
    lang: 'C' | 'C++' | 'Java' | 'Python';
    filename: string;
    category: string;
}

const SYLLABUS_ITEMS: SyllabusItem[] = [
    // === C Language (20 Items) ===
    { id: 'c_1', title: '顺序结构：变量与数据类型 (C)', lang: 'C', filename: 'main.c', category: '顺序结构' },
    { id: 'c_ifelse', title: '条件判断 if/else (C)', lang: 'C', filename: 'main.c', category: '条件分支' },
    { id: 'c_3', title: '分支选择 switch/case (C)', lang: 'C', filename: 'main.c', category: '条件分支' },
    { id: 'c_4', title: '循环控制 while 循环 (C)', lang: 'C', filename: 'main.c', category: '循环结构' },
    { id: 'c_5', title: '循环控制 do-while 循环 (C)', lang: 'C', filename: 'main.c', category: '循环结构' },
    { id: 'c_6', title: '循环控制 for 循环 (C)', lang: 'C', filename: 'main.c', category: '循环结构' },
    { id: 'c_7', title: '嵌套循环：乘法表 (C)', lang: 'C', filename: 'main.c', category: '循环结构' },
    { id: 'c_8', title: '跳转控制 break/continue (C)', lang: 'C', filename: 'main.c', category: '循环结构' },
    { id: 'c_9', title: '一维数组声明与初始化 (C)', lang: 'C', filename: 'main.c', category: '数组/字符串' },
    { id: 'c_10', title: '一维数组遍历求和 (C)', lang: 'C', filename: 'main.c', category: '数组/字符串' },
    { id: 'c_11', title: '二维数组及矩阵转置 (C)', lang: 'C', filename: 'main.c', category: '数组/字符串' },
    { id: 'c_12', title: '字符数组与字符串基础 (C)', lang: 'C', filename: 'main.c', category: '数组/字符串' },
    { id: 'c_13', title: '自定义函数声明与调用 (C)', lang: 'C', filename: 'main.c', category: '函数结构' },
    { id: 'c_14', title: '函数参数传递值传递 (C)', lang: 'C', filename: 'main.c', category: '函数结构' },
    { id: 'c_15', title: '函数参数传递地址传递 (C)', lang: 'C', filename: 'main.c', category: '函数结构' },
    { id: 'c_scope', title: '变量与作用域 (C)', lang: 'C', filename: 'main.c', category: '内存结构' },
    { id: 'c_17', title: '指针变量基础概念 (C)', lang: 'C', filename: 'main.c', category: '内存结构' },
    { id: 'c_18', title: '指针与数组互操作 (C)', lang: 'C', filename: 'main.c', category: '内存结构' },
    { id: 'c_19', title: '结构体 struct 定义 (C)', lang: 'C', filename: 'main.c', category: '内存结构' },
    { id: 'c_20', title: '动态内存分配 malloc (C)', lang: 'C', filename: 'main.c', category: '内存结构' },

    // === C++ Language (20 Items) ===
    { id: 'cpp_1', title: '命名空间 namespace (C++)', lang: 'C++', filename: 'main.cpp', category: '语言基础' },
    { id: 'cpp_2', title: '标准输入输出 cin/cout (C++)', lang: 'C++', filename: 'main.cpp', category: '语言基础' },
    { id: 'cpp_3', title: '引用类型 & 变量 (C++)', lang: 'C++', filename: 'main.cpp', category: '语言基础' },
    { id: 'cpp_for', title: '基础循环 for (C++)', lang: 'C++', filename: 'main.cpp', category: '循环结构' },
    { id: 'cpp_5', title: '函数重载 Overloading (C++)', lang: 'C++', filename: 'main.cpp', category: '函数进阶' },
    { id: 'cpp_6', title: '类与对象 Class/Object (C++)', lang: 'C++', filename: 'main.cpp', category: '面向对象' },
    { id: 'cpp_7', title: '构造函数与析构函数 (C++)', lang: 'C++', filename: 'main.cpp', category: '面向对象' },
    { id: 'cpp_8', title: '类成员封装 public/private (C++)', lang: 'C++', filename: 'main.cpp', category: '面向对象' },
    { id: 'cpp_9', title: '类的继承 Inheritance (C++)', lang: 'C++', filename: 'main.cpp', category: '面向对象' },
    { id: 'cpp_10', title: '多态与虚函数 virtual (C++)', lang: 'C++', filename: 'main.cpp', category: '面向对象' },
    { id: 'cpp_11', title: '运算符重载 operator (C++)', lang: 'C++', filename: 'main.cpp', category: '面向对象' },
    { id: 'cpp_12', title: 'STL vector 动态数组 (C++)', lang: 'C++', filename: 'main.cpp', category: 'STL模板' },
    { id: 'cpp_13', title: 'STL string 字符串操作 (C++)', lang: 'C++', filename: 'main.cpp', category: 'STL模板' },
    { id: 'cpp_14', title: 'STL map 键值映射 (C++)', lang: 'C++', filename: 'main.cpp', category: 'STL模板' },
    { id: 'cpp_15', title: '双指针算法 Two Pointers (C++)', lang: 'C++', filename: 'main.cpp', category: '算法专项' },
    { id: 'cpp_16', title: '二分查找 Binary Search (C++)', lang: 'C++', filename: 'main.cpp', category: '算法专项' },
    { id: 'cpp_17', title: '快速排序 Quick Sort (C++)', lang: 'C++', filename: 'main.cpp', category: '算法专项' },
    { id: 'cpp_18', title: '广度优先搜索 BFS (C++)', lang: 'C++', filename: 'main.cpp', category: '算法专项' },
    { id: 'cpp_19', title: '深度优先搜索 DFS (C++)', lang: 'C++', filename: 'main.cpp', category: '算法专项' },
    { id: 'cpp_20', title: '迪杰斯特拉最短路径 (C++)', lang: 'C++', filename: 'main.cpp', category: '算法专项' },

    // === Java Language (20 Items) ===
    { id: 'java_basic', title: 'Java 输入输出与基础 (Java)', lang: 'Java', filename: 'Main.java', category: '语言基础' },
    { id: 'java_2', title: 'Java 数据类型与运算 (Java)', lang: 'Java', filename: 'Main.java', category: '语言基础' },
    { id: 'java_3', title: '条件分支控制 if/else (Java)', lang: 'Java', filename: 'Main.java', category: '控制流' },
    { id: 'java_4', title: '循环控制 while 与 for (Java)', lang: 'Java', filename: 'Main.java', category: '控制流' },
    { id: 'java_5', title: '一维数组声明与操作 (Java)', lang: 'Java', filename: 'Main.java', category: '数据结构' },
    { id: 'java_6', title: '类的封装与 getter/setter (Java)', lang: 'Java', filename: 'Main.java', category: '面向对象' },
    { id: 'java_7', title: '类的构造方法与重载 (Java)', lang: 'Java', filename: 'Main.java', category: '面向对象' },
    { id: 'java_8', title: '类的继承 extends (Java)', lang: 'Java', filename: 'Main.java', category: '面向对象' },
    { id: 'java_9', title: '接口 Interface 与实现 (Java)', lang: 'Java', filename: 'Main.java', category: '面向对象' },
    { id: 'java_10', title: '抽象类 Abstract Class (Java)', lang: 'Java', filename: 'Main.java', category: '面向对象' },
    { id: 'java_11', title: '多态 Polymorphism 表现 (Java)', lang: 'Java', filename: 'Main.java', category: '面向对象' },
    { id: 'java_12', title: '异常处理 try/catch/finally (Java)', lang: 'Java', filename: 'Main.java', category: '进阶机制' },
    { id: 'java_13', title: '字符串 String 常用操作 (Java)', lang: 'Java', filename: 'Main.java', category: '进阶机制' },
    { id: 'java_14', title: '集合框架 ArrayList 使用 (Java)', lang: 'Java', filename: 'Main.java', category: '集合容器' },
    { id: 'java_15', title: '集合框架 HashMap 使用 (Java)', lang: 'Java', filename: 'Main.java', category: '集合容器' },
    { id: 'java_16', title: '包装类与自动装箱拆箱 (Java)', lang: 'Java', filename: 'Main.java', category: '进阶机制' },
    { id: 'java_17', title: '多线程 Thread 创建 (Java)', lang: 'Java', filename: 'Main.java', category: '进阶机制' },
    { id: 'java_18', title: '网络编程 Socket 通信 (Java)', lang: 'Java', filename: 'Main.java', category: '进阶机制' },
    { id: 'java_19', title: '数据库 JDBC 连接操作 (Java)', lang: 'Java', filename: 'Main.java', category: '进阶机制' },
    { id: 'java_20', title: '设计模式：单例模式 (Java)', lang: 'Java', filename: 'Main.java', category: '进阶机制' },

    // === Python Language (20 Items) ===
    { id: 'py_1', title: 'Python 输入与输出 print (Python)', lang: 'Python', filename: 'main.py', category: '语言基础' },
    { id: 'py_2', title: '基本变量与算术运算 (Python)', lang: 'Python', filename: 'main.py', category: '语言基础' },
    { id: 'py_3', title: '条件分支 if-elif-else (Python)', lang: 'Python', filename: 'main.py', category: '控制流' },
    { id: 'py_4', title: '循环结构 while/for (Python)', lang: 'Python', filename: 'main.py', category: '控制流' },
    { id: 'py_slice', title: 'Python 列表与切片 (Python)', lang: 'Python', filename: 'main.py', category: '数据结构' },
    { id: 'py_6', title: '元组 Tuple 的不变性 (Python)', lang: 'Python', filename: 'main.py', category: '数据结构' },
    { id: 'py_7', title: '字典 Dictionary 键值操作 (Python)', lang: 'Python', filename: 'main.py', category: '数据结构' },
    { id: 'py_8', title: '集合 Set 的去重与运算 (Python)', lang: 'Python', filename: 'main.py', category: '数据结构' },
    { id: 'py_9', title: '列表推导式 Comprehension (Python)', lang: 'Python', filename: 'main.py', category: '高效编程' },
    { id: 'py_10', title: '函数定义与参数传递 (Python)', lang: 'Python', filename: 'main.py', category: '函数结构' },
    { id: 'py_11', title: '函数默认参数与可变参数 (Python)', lang: 'Python', filename: 'main.py', category: '函数结构' },
    { id: 'py_12', title: '全局变量与 global 关键字 (Python)', lang: 'Python', filename: 'main.py', category: '变量进阶' },
    { id: 'py_13', title: '模块导入 import math (Python)', lang: 'Python', filename: 'main.py', category: '高效编程' },
    { id: 'py_14', title: '面向对象：类与实例化 (Python)', lang: 'Python', filename: 'main.py', category: '面向对象' },
    { id: 'py_15', title: '面向对象：构造方法 __init__ (Python)', lang: 'Python', filename: 'main.py', category: '面向对象' },
    { id: 'py_16', title: '面向对象：类的继承 (Python)', lang: 'Python', filename: 'main.py', category: '面向对象' },
    { id: 'py_17', title: '文件读写 open & close (Python)', lang: 'Python', filename: 'main.py', category: '系统操作' },
    { id: 'py_18', title: '上下文管理器 with 语句 (Python)', lang: 'Python', filename: 'main.py', category: '系统操作' },
    { id: 'py_19', title: '异常捕获 try-except (Python)', lang: 'Python', filename: 'main.py', category: '系统操作' },
    { id: 'py_20', title: '高阶函数 map/filter/lambda (Python)', lang: 'Python', filename: 'main.py', category: '高效编程' }
];

// ----------------------------------------------------
// Deterministic Real-time Trace Simulator Generator
// ----------------------------------------------------
const generateDynamicLesson = (item: SyllabusItem): VisualizerLesson => {
    // Return CORE precompiled lessons immediately if matched
    const core = CORE_LESSONS.find(c => c.id === item.id);
    if (core) return core;

    // Otherwise, generate structured simulation values programmatically!
    const cleanTitle = item.title.split('：').pop() || item.title;

    if (item.lang === 'C') {
        return {
            id: item.id,
            title: item.title,
            lang: 'C',
            filename: 'main.c',
            code: `// C语言：${cleanTitle}演示
#include <stdio.h>

int main() {
    int test_val = 42;
    printf("执行完毕\\n");
    return 0;
}`,
            steps: [
                { line: 5, vars: { test_val: '未初始化' }, explanation: `进入 C 语言运行栈。开始声明并分配变量 \`test_val\` 内存空间。` },
                { line: 5, vars: { test_val: 42 }, explanation: `在栈中写入数值：变量 \`test_val\` 被成功赋值为 \`42\`。`, highlightVars: ['test_val'] },
                { line: 6, vars: { test_val: 42, output: '"执行完毕"' }, explanation: `调用 \`printf\` 标准库输出方法，控制台缓存区写入对应字符串。`, highlightVars: ['output'] },
                { line: 7, vars: { test_val: 42, output: '"执行完毕"', status: '正常结束' }, explanation: `执行主入口 \`return 0\` 逻辑，主栈空间回收，程序顺利执行完毕。` }
            ]
        };
    } else if (item.lang === 'C++') {
        return {
            id: item.id,
            title: item.title,
            lang: 'C++',
            filename: 'main.cpp',
            code: `// C++: ${cleanTitle}演示
#include <iostream>
using namespace std;

int main() {
    int cpp_data = 99;
    cout << cpp_data << endl;
    return 0;
}`,
            steps: [
                { line: 6, vars: { cpp_data: '未初始化' }, explanation: `分配并建立 C++ 栈内整型空间。` },
                { line: 6, vars: { cpp_data: 99 }, explanation: `变量 \`cpp_data\` 完成赋值写入，内存中更新为 \`99\`。`, highlightVars: ['cpp_data'] },
                { line: 7, vars: { cpp_data: 99, output: '99' }, explanation: `使用 std::cout 打印流输出对象，将变量 \`99\` 打在屏幕上。`, highlightVars: ['output'] },
                { line: 8, vars: { cpp_data: 99, output: '99', status: '正常退出' }, explanation: `程序正常退出，释放全部栈帧。` }
            ]
        };
    } else if (item.lang === 'Java') {
        return {
            id: item.id,
            title: item.title,
            lang: 'Java',
            filename: 'Main.java',
            code: `// Java: ${cleanTitle}演示
public class Main {
    public static void main(String[] args) {
        int val = 100;
        System.out.println("Java: " + val);
    }
}`,
            steps: [
                { line: 4, vars: { val: '未初始化' }, explanation: `JVM 虚拟机启动并初始化 Main 主类方法，加载局部变量 \`val\`。` },
                { line: 4, vars: { val: 100 }, explanation: `局部变量表写入值：\`val = 100\`。`, highlightVars: ['val'] },
                { line: 5, vars: { val: 100, output: '"Java: 100"' }, explanation: `调用标准控制台输出，输出字符串。`, highlightVars: ['output'] }
            ]
        };
    } else {
        // Python
        return {
            id: item.id,
            title: item.title,
            lang: 'Python',
            filename: 'main.py',
            code: `# Python: ${cleanTitle}演示
x = 5
y = x + 10
print(f"y = {y}")`,
            steps: [
                { line: 2, vars: { x: 5 }, explanation: `Python 解析器声明名称对象 \`x\` 并引用整型对象 5。` },
                { line: 3, vars: { x: 5, y: 15 }, explanation: `计算并绑定局部作用域变量 \`y\` 的引用的值为 15。`, highlightVars: ['y'] },
                { line: 4, vars: { x: 5, y: 15, output: '"y = 15"' }, explanation: `执行 print 内建函数，输出信息。`, highlightVars: ['output'] }
            ]
        };
    }
};

interface ChatMessage {
    sender: 'ai' | 'user';
    text: string;
}

export const AlgoVisualizer: React.FC<{ onBack: () => void, theme?: 'light' | 'dark' }> = ({ onBack, theme = 'dark' }) => {
    const isDark = theme !== 'light';
    const [selectedLang, setSelectedLang] = useState<'All' | 'C' | 'C++' | 'Java' | 'Python'>('All');
    const [mobileView, setMobileView] = useState<'list' | 'visualizer'>('list');
    const [activeSyllabusItem, setActiveSyllabusItem] = useState<SyllabusItem>(
        SYLLABUS_ITEMS.find(s => s.id === 'c_ifelse') || SYLLABUS_ITEMS[0]
    );
    const [activeLesson, setActiveLesson] = useState<VisualizerLesson>(
        generateDynamicLesson(activeSyllabusItem)
    );
    
    const [stepIndex, setStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const playTimerRef = useRef<NodeJS.Timeout | null>(null);

    const currentStep = activeLesson.steps[stepIndex] || activeLesson.steps[0];

    // Filter syllabus based on selected language
    const filteredSyllabus = SYLLABUS_ITEMS.filter(s => selectedLang === 'All' || s.lang === selectedLang);

    // Chat states
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [aiThinking, setAiThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    // Reset chat and steps when active syllabus changes
    useEffect(() => {
        const lesson = generateDynamicLesson(activeSyllabusItem);
        setActiveLesson(lesson);
        setStepIndex(0);
        setIsPlaying(false);
        if (playTimerRef.current) {
            clearInterval(playTimerRef.current);
        }

        // Initialize Chat History
        setMessages([
            { 
                sender: 'ai', 
                text: `你好！我是你的 AI 算法私教 Co-Pilot。当前我们加载了「${activeSyllabusItem.title}」教学演练舱。\n\n你可以通过单步调试观察下方的内存变量变化，随时向我提问关于这段代码、数据流动或者条件跳转的任何问题！` 
            }
        ]);
    }, [activeSyllabusItem]);

    // Handle AutoPlay Timer
    useEffect(() => {
        if (isPlaying) {
            playTimerRef.current = setInterval(() => {
                setStepIndex(prev => {
                    if (prev >= activeLesson.steps.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1800);
        } else {
            if (playTimerRef.current) {
                clearInterval(playTimerRef.current);
            }
        }

        return () => {
            if (playTimerRef.current) {
                clearInterval(playTimerRef.current);
            }
        };
    }, [isPlaying, activeLesson]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleStepNext = () => {
        if (stepIndex < activeLesson.steps.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            setStepIndex(0);
        }
    };

    const handleStepPrev = () => {
        if (stepIndex > 0) {
            setStepIndex(prev => prev - 1);
        }
    };

    const handleReset = () => {
        setStepIndex(0);
        setIsPlaying(false);
    };

    const handleTogglePlay = () => {
        if (stepIndex >= activeLesson.steps.length - 1) {
            setStepIndex(0);
        }
        setIsPlaying(prev => !prev);
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || aiThinking) return;
        
        const userMsg = chatInput.trim();
        setChatInput('');
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setAiThinking(true);

        try {
            // Contextual dialogue generation incorporating debugger state!
            const promptContext = `
【当前调试环境】
编程语言: ${activeLesson.lang}
当前执行行号: 第 ${currentStep.line} 行
当前内存变量状态: ${JSON.stringify(currentStep.vars)}
课题名称: ${activeLesson.title}

【示例代码内容】
${activeLesson.code}

【学生提问】
${userMsg}

作为AI私教，请根据以上上下文和当前调试行号，用亲切易懂的方式解答学生的问题。不要输出Markdown代码块标记。
`;
            const reply = await getAIHint(promptContext, activeLesson.code, activeLesson.lang);
            setMessages(prev => [...prev, { sender: 'ai', text: reply || '抱歉，刚才信号有些不稳定，请再说一次。' }]);
        } catch (e: any) {
            console.error(e);
            setMessages(prev => [...prev, { sender: 'ai', text: '网络似乎有点拥堵，让我稍作调整，请稍后再试。' }]);
        }
        setAiThinking(false);
    };

    return (
        <div className={`flex flex-col gap-6 relative animate-fade-in transition-all duration-300 min-h-[calc(100vh-140px)] ${isDark ? 'text-white' : 'text-slate-800'}`}>
            
            {/* Main Interactive Workbench */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 mt-4 md:mt-8">
                
                {/* 1. Left Column: Tree Syllabus Directory */}
                <div className={`lg:col-span-1 flex-col h-[680px] transition-all duration-300 ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'}`}>

                    <div className="mb-6 flex items-center gap-2.5 px-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                            isDark
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm'
                        }`}>
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-800'}`}>课程体系</h4>
                            <p className="text-[8px] text-slate-500 font-bold tracking-wider mt-0.5">SYLLABUS TREE ({filteredSyllabus.length} 节课)</p>
                        </div>
                    </div>

                    {/* Language Selector Filter */}
                    <div className={`flex flex-wrap gap-1 p-1 rounded-xl border mb-4 transition-all duration-300 ${
                        isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200/60'
                    }`}>
                        {['All', 'C', 'C++', 'Java', 'Python'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => setSelectedLang(lang as any)}
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                                    selectedLang === lang 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : isDark 
                                            ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                }`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>

                    {/* Syllabus Menu List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {filteredSyllabus.map(item => {
                            const isActive = activeSyllabusItem.id === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveSyllabusItem(item);
                                        setMobileView('visualizer');
                                    }}
                                    className={`w-full p-3 border text-left flex items-center justify-between group rounded-xl transition-all duration-300 ${
                                        isActive 
                                            ? isDark
                                                ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/40 text-white shadow-lg' 
                                                : 'bg-gradient-to-r from-blue-50 to-indigo-50/30 border-blue-300 text-blue-700 font-bold shadow-sm'
                                            : isDark
                                                ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10 hover:bg-white/10'
                                                : 'bg-white border-slate-100 text-slate-600 hover:text-slate-800 hover:border-slate-200/80 hover:bg-slate-50/80 shadow-sm'
                                    }`}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className={`text-[10px] font-black tracking-tight line-clamp-1 ${
                                            isActive 
                                                ? isDark ? 'text-white' : 'text-blue-700'
                                                : isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'
                                        }`}>{item.title}</span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded transition-all duration-300 ${
                                                item.lang === 'C' ? (isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200') :
                                                item.lang === 'C++' ? (isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200') :
                                                item.lang === 'Java' ? (isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-650 border border-red-200') :
                                                (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                                            }`}>
                                                {item.lang}
                                            </span>
                                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">{item.category}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={12} className={`transition-transform duration-300 shrink-0 ${
                                        isActive ? 'text-blue-400 translate-x-1' : 'text-slate-600 group-hover:translate-x-1'
                                    }`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Center Column: Double-Layer Interaction Workbench */}
                <div className={`lg:col-span-2 flex-col gap-6 h-[680px] ${mobileView === 'visualizer' ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* A. Upper Layer: Data Flow visualizer */}
                    <Card className={`hidden lg:flex p-6 border rounded-[32px] backdrop-blur-3xl shadow-xl flex-col gap-4 relative overflow-hidden h-[240px] transition-all duration-300 ${
                        isDark 
                            ? 'bg-[#0b1329]/60 border-white/10' 
                            : 'tech-card-glass-dark border-slate-200/80 shadow-sm'
                    }`}>
                        <div className="flex justify-between items-center px-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                运行全景 (Memory Visualizer)
                            </span>
                            <span className="text-[8px] font-black text-slate-500 tracking-widest">
                                STEP {stepIndex + 1} OF {activeLesson.steps.length}
                            </span>
                        </div>

                        {/* Interactive Memory State Representation */}
                        <div className={`flex-1 flex flex-col items-center justify-center rounded-2xl border p-4 relative overflow-hidden transition-all duration-300 ${
                            isDark 
                                ? 'bg-slate-950/40 border-white/5' 
                                : 'bg-slate-50/50 border-slate-200/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]'
                        }`}>
                            {/* Glow grid lines */}
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-5 pointer-events-none">
                                {[...Array(18)].map((_, i) => <div key={i} className={`border ${isDark ? 'border-white/10' : 'border-slate-350'}`}></div>)}
                            </div>

                            {/* Variable Render Blocks */}
                            <div className="flex flex-wrap justify-center items-center gap-4 z-10 w-full animate-fade-in">
                                {Object.entries(currentStep.vars).map(([name, value]) => {
                                    const isHighlighted = currentStep.highlightVars?.includes(name);
                                    const isUninitialized = value === '未初始化';
                                    
                                    return (
                                        <div 
                                            key={name} 
                                            className={`p-3 px-5 rounded-2xl border transition-all duration-500 flex flex-col items-center min-w-[125px] ${
                                                isUninitialized
                                                    ? isDark
                                                        ? 'bg-slate-950/40 border-dashed border-slate-700/55 opacity-70 shadow-inner'
                                                        : 'bg-slate-100/50 border-dashed border-slate-350 opacity-80 shadow-inner'
                                                    : isHighlighted 
                                                        ? isDark
                                                            ? 'bg-gradient-to-b from-blue-500/25 to-indigo-500/25 border-blue-500/60 shadow-[0_0_22px_rgba(59,130,246,0.35)] scale-105 text-blue-400' 
                                                            : 'bg-gradient-to-b from-blue-50 to-indigo-50/30 border-blue-400 shadow-[0_4px_15px_rgba(59,130,246,0.15)] scale-105 text-blue-600 font-bold'
                                                        : isDark
                                                            ? 'bg-white/5 border-white/10 shadow-md hover:border-white/20'
                                                            : 'bg-white border-slate-200/80 shadow-sm hover:border-slate-300/80 hover:shadow-md'
                                            }`}
                                        >
                                            <span className={`text-[8px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{name}</span>
                                            <div className="flex flex-col items-center gap-1.5">
                                                {isUninitialized ? (
                                                    <>
                                                        <span className={`text-xs font-black font-mono animate-pulse tracking-wider ${isDark ? 'text-amber-500/80' : 'text-amber-600 font-bold'}`}>
                                                            0x7FFE5F8B
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest animate-pulse border ${
                                                            isDark 
                                                                ? 'bg-amber-500/10 text-amber-400/90 border-amber-500/20' 
                                                                : 'bg-amber-50 text-amber-600 border-amber-200'
                                                        }`}>
                                                            ⌛ ALLOCATING
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className={`text-base font-black font-mono tracking-tight transition ${
                                                        isHighlighted 
                                                            ? isDark ? 'text-blue-400' : 'text-blue-600'
                                                            : isDark ? 'text-white' : 'text-slate-800'
                                                    }`}>
                                                        {value}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-4 z-10 flex items-center gap-1.5">
                                ⓘ 此时实时变量数据在内存中的逻辑变化
                            </p>
                        </div>
                    </Card>

                    {/* B. Lower Layer: Code step visualizer */}
                    <Card className={`flex-1 p-6 border rounded-[32px] backdrop-blur-3xl shadow-xl flex flex-col gap-4 overflow-hidden transition-all duration-300 ${
                        isDark 
                            ? 'bg-[#0b1329]/60 border-white/10' 
                            : 'tech-card-glass-dark border-slate-200/80 shadow-sm'
                    }`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <button 
                                    className="lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200" 
                                    onClick={() => setMobileView('list')}
                                    title="返回课程体系"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    &lt;&gt; {activeLesson.filename}
                                </span>
                            </div>

                            {/* Editor control buttons */}
                            <div className={`flex items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${
                                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200/60'
                            }`}>
                                <button 
                                    onClick={handleReset}
                                    title="重置"
                                    className={`p-1.5 bg-transparent rounded-lg transition-colors ${
                                        isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                                    }`}
                                >
                                    <RotateCcw size={13} />
                                </button>
                                <div className={`w-[1px] h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                                <button 
                                    onClick={handleStepPrev}
                                    disabled={stepIndex === 0}
                                    className={`px-2.5 py-1 text-[9px] font-black bg-transparent disabled:opacity-30 rounded-lg transition-colors uppercase tracking-wider ${
                                        isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/60'
                                    }`}
                                >
                                    上一步
                                </button>
                                <button 
                                    onClick={handleStepNext}
                                    className="px-2.5 py-1 text-[9px] font-black bg-blue-600 hover:bg-blue-500 rounded-lg transition text-white uppercase tracking-wider"
                                >
                                    单步执行
                                </button>
                                <button 
                                    onClick={handleTogglePlay}
                                    className={`px-3 py-1 text-[9px] font-black rounded-lg transition flex items-center gap-1 uppercase tracking-wider ${
                                        isPlaying 
                                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg' 
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                                >
                                    {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                                    {isPlaying ? "暂停播放" : "自动播放"}
                                </button>
                            </div>
                        </div>

                        {/* Code editor line representation */}
                        <div className={`flex-1 p-6 rounded-2xl border font-mono text-xs overflow-y-auto leading-relaxed relative custom-scrollbar transition-all duration-300 ${
                            isDark 
                                ? 'bg-slate-950 border-white/5 text-slate-300' 
                                : 'bg-slate-50 border-slate-200/80 text-slate-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]'
                        }`}>
                            {activeLesson.code.split('\n').map((lineText, idx) => {
                                const lineNum = idx + 1;
                                const isCurrentLine = currentStep.line === lineNum;
                                const isComment = lineText.trim().startsWith('//') || lineText.trim().startsWith('#');
                                
                                return (
                                    <div 
                                        key={idx}
                                        className={`flex items-start -mx-6 px-6 py-0.5 border-l-4 transition-all duration-300 ${
                                            isCurrentLine 
                                                ? isDark 
                                                    ? 'bg-blue-500/20 border-blue-500 text-white font-bold' 
                                                    : 'bg-blue-100/70 border-blue-600 text-slate-950 font-bold shadow-sm'
                                                : 'border-transparent'
                                        }`}
                                    >
                                        <span className={`w-8 shrink-0 select-none text-right pr-4 text-[10px] ${
                                            isCurrentLine
                                                ? isDark ? 'text-blue-400' : 'text-blue-600 font-black'
                                                : isDark ? 'text-slate-600' : 'text-slate-400'
                                        }`}>{lineNum}</span>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <pre className={`whitespace-pre-wrap select-all font-mono tracking-tight text-[11px] ${
                                                isCurrentLine
                                                    ? isDark ? 'text-white' : 'text-slate-950'
                                                    : isComment
                                                        ? isDark ? 'text-emerald-500/80' : 'text-emerald-600 font-medium'
                                                        : isDark ? 'text-slate-300' : 'text-slate-700'
                                            }`}>{lineText}</pre>
                                            
                                            {/* Mobile Inline Bubble (Solution 4) */}
                                            {isCurrentLine && Object.keys(currentStep.vars).length > 0 && (
                                                <div className="lg:hidden flex flex-wrap items-center gap-2 mt-1.5 mb-1 animate-fade-in-up">
                                                    {Object.entries(currentStep.vars).map(([name, value]) => {
                                                        const isHighlighted = currentStep.highlightVars?.includes(name);
                                                        return (
                                                            <div key={name} className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black tracking-tight transition-all duration-300 ${
                                                                isHighlighted 
                                                                    ? isDark 
                                                                        ? 'bg-blue-500/30 border-blue-400 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105' 
                                                                        : 'bg-blue-100 border-blue-500 text-blue-800 shadow-[0_2px_8px_rgba(59,130,246,0.2)] scale-105'
                                                                    : isDark 
                                                                        ? 'bg-white/5 border-white/10 text-slate-400' 
                                                                        : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                                                            }`}>
                                                                <span className="opacity-70">{name}:</span>
                                                                <span className={`font-mono ${isHighlighted ? (isDark ? 'animate-pulse text-blue-300' : 'animate-pulse text-blue-700') : ''}`}>{value}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile Step Explanation (Hidden on Desktop) */}
                        <div className={`lg:hidden mt-2 p-4 rounded-xl border transition-all duration-300 animate-fade-in-up ${
                            isDark
                                ? 'bg-blue-950/40 border-blue-500/30 text-blue-100'
                                : 'bg-blue-50/80 border-blue-200 text-blue-900 shadow-sm'
                        }`}>
                            <div className={`flex items-center gap-1.5 mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                <Bot size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">AI 代码执行解析</span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed">
                                {currentStep.explanation}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* 3. Right Column: AI Co-Pilot / Companion Tutor Chat Panel */}
                <div className={`hidden lg:flex lg:col-span-1 flex-col border rounded-[32px] p-6 backdrop-blur-3xl shadow-xl h-[680px] overflow-hidden transition-all duration-300 ${
                    isDark 
                        ? 'bg-[#0b1329]/60 border-white/10' 
                        : 'tech-card-glass-dark border-slate-200/80 shadow-sm'
                }`}>
                    
                    {/* Header Area from Design Mockup */}
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                            isDark 
                                ? 'bg-blue-950/80 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.25)]' 
                                : 'bg-blue-50 border-blue-200 shadow-sm'
                        }`}>
                            <Bot size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>AI 算法私教</h4>
                                <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-widest border transition-all duration-300 ${
                                    isDark
                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_5px_rgba(59,130,246,0.2)]'
                                        : 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                                }`}>CO-PILOT</span>
                            </div>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI COMPANION TUTOR</p>
                        </div>
                    </div>

                    <div className={`w-full h-[1px] my-4 ${isDark ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'}`} />

                    {/* Today's Learning Target Card */}
                    <div className={`p-4 border rounded-2xl text-[10.5px] leading-relaxed transition-all duration-300 ${
                        isDark 
                            ? 'bg-white/5 border-white/10 text-slate-300 shadow-md hover:border-white/20' 
                            : 'bg-slate-50/80 border border-slate-200/80 text-slate-600 shadow-sm hover:border-slate-300/80 hover:shadow-md'
                    }`}>
                        <div className={`font-black mb-2 flex items-center gap-1.5 text-[9px] uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-655'}`}>
                            <Sparkles size={12} className="animate-pulse" />
                            <span>今日学习目标</span>
                        </div>
                        <p className="leading-relaxed">
                            欢迎进入「{activeSyllabusItem.title}」的可视化单步演练调试。通过中部“单步执行”，让我们一同看见代码 logic 的本质流动。
                        </p>
                    </div>

                    {/* Active Step Highlight Card (Current Line Analysis) */}
                    <div className={`mt-3 p-4 border rounded-2xl text-[10.5px] leading-relaxed transition-all duration-300 ${
                        isDark 
                            ? 'bg-gradient-to-b from-blue-900/20 to-indigo-900/20 border-blue-500/20 text-slate-100 shadow-md hover:border-blue-500/35' 
                            : 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200 text-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md'
                    }`}>
                        <div className={`font-black mb-2 flex items-center gap-1.5 text-[9px] uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-655'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}></span>
                            <span>当前代码行解析 (LINE {currentStep.line})</span>
                        </div>
                        <p className="leading-relaxed font-semibold">{currentStep.explanation}</p>
                    </div>

                    {/* Chat Dialogue Area (Scrollable widget with input) */}
                    <div className={`flex-1 flex flex-col rounded-2xl mt-4 overflow-hidden relative border transition-all duration-300 ${
                        isDark 
                            ? 'bg-slate-950/40 border-white/5' 
                            : 'bg-white border-slate-200/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]'
                    }`}>
                        <div className={`px-3 py-2 border-b flex items-center justify-between transition-all duration-300 ${
                            isDark ? 'border-white/5 bg-white/5' : 'border-slate-150 bg-slate-50/80'
                        }`}>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                💬 伴学式人机对话
                            </span>
                            {messages.length > 1 && (
                                <button 
                                    onClick={() => setMessages([{ 
                                        sender: 'ai', 
                                        text: `你好！我是你的 AI 算法私教 Co-Pilot。当前我们加载了「${activeSyllabusItem.title}」教学演练舱。\n\n你可以通过单步调试观察下方的内存变量变化，随时向我提问关于这段代码、数据流动或者条件跳转的任何问题！` 
                                    }])}
                                    className={`text-[8px] font-black transition ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                                >
                                    清空对话
                                </button>
                            )}
                        </div>

                        {/* Chat history bubbles */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 p-3 custom-scrollbar text-[10px]">
                            {messages.map((msg, i) => (
                                <div 
                                    key={i} 
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div 
                                        className={`max-w-[90%] p-2.5 rounded-2xl leading-relaxed transition-all duration-350 ${
                                            msg.sender === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                                                : isDark
                                                    ? 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
                                                    : 'bg-slate-100/80 border border-slate-200/60 text-slate-700 rounded-tl-none shadow-sm'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {aiThinking && (
                                <div className="flex justify-start animate-pulse">
                                    <div className={`p-2.5 rounded-2xl rounded-tl-none font-bold flex items-center gap-2 border transition-all duration-300 ${
                                        isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-550'
                                    }`}>
                                        <Loader2 className="animate-spin text-blue-500" size={10} />
                                        <span>AI 正在思考中...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat input bar */}
                        <div className={`p-2 border-t bg-transparent flex gap-1.5 items-center transition-all duration-300 ${
                            isDark ? 'border-white/5' : 'border-slate-150 bg-slate-50/20'
                        }`}>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="输入关于代码或内存的疑问..."
                                disabled={aiThinking}
                                className={`flex-1 rounded-xl px-3 py-1.5 text-[9px] focus:outline-none transition-all duration-200 ${
                                    isDark 
                                        ? 'bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/40' 
                                        : 'bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.01)]'
                                }`}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={aiThinking || !chatInput.trim()}
                                className="w-7 h-7 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white disabled:opacity-40 transition shadow-lg shadow-blue-500/25 shrink-0"
                            >
                                <Send size={10} />
                            </button>
                        </div>
                    </div>

                    {/* Footer from Mockup */}
                    <div className={`text-center mt-3 pt-1 border-t text-[8px] text-slate-500 font-bold uppercase tracking-widest shrink-0 transition-all duration-300 ${
                        isDark ? 'border-white/5' : 'border-slate-150'
                    }`}>
                        EDUCODE AI INTERACTIVE ASSISTANT
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AlgoVisualizer;
