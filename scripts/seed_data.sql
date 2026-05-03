-- ===================================
-- EduCode AI 数据库模拟数据 (Seed Data)
-- ===================================

USE educode_ai;

-- 1. 插入用户 (Users)
-- 密码均为 '123456' (需在应用层哈希，这里仅为模拟，实际存储应该是hash值)
-- 假设 Hash('123456') = '$2b$10$YourHashedPasswordHere' (示例)

INSERT INTO users (id, password_hash, name, role, college, major, class_name, avatar_url) VALUES 
('admin', '$2a$10$2wGgNV3Wd/tMRUsBzkAtAe3kS5cQ79U.S0mSPPBB6.D5RI/Yi6A57y', '系统管理员', 'ADMIN', NULL, NULL, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
('t001', '$2a$10$2wGgNV3Wd/tMRUsBzkAtAe3kS5cQ79U.S0mSPPBB6.D5RI/Yi6A57y', '李老师', 'TEACHER', '计算机学院', '软件工程', NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher'),
('s001', '$2a$10$2wGgNV3Wd/tMRUsBzkAtAe3kS5cQ79U.S0mSPPBB6.D5RI/Yi6A57y', '张三', 'STUDENT', '计算机学院', '软件工程', '软工2301', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'),
('s002', '$2a$10$2wGgNV3Wd/tMRUsBzkAtAe3kS5cQ79U.S0mSPPBB6.D5RI/Yi6A57y', '李四', 'STUDENT', '计算机学院', '计算机科学', '计科2302', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi');

-- 2. 插入学生统计 (Student Stats)
INSERT INTO student_stats (user_id, solved_count, accuracy_rate, rank_score, streak_days) VALUES
('s001', 15, 85.50, 1500, 5),
('s002', 8, 60.00, 1200, 2);

-- 3. 插入题库 (Problem Banks)
INSERT INTO problem_banks (id, title, description, cover_url) VALUES
('bank_c_basic', 'C语言基础练习', '面向初学者的C语言基础语法练习题', 'https://placehold.co/600x400?text=C'),
('bank_c_adv', 'C语言进阶练习', 'C语言进阶知识与算法练习', 'https://placehold.co/600x400?text=C_Adv'),
('bank_java_basic', 'Java基础练习', 'Java面向对象基础语法练习题', 'https://placehold.co/600x400?text=Java'),
('bank_java_adv', 'Java进阶练习', 'Java高级特性与企业级开发练习', 'https://placehold.co/600x400?text=Java_Adv'),
('bank_python_basic', 'Python基础练习', 'Python入门语法与基础数据结构', 'https://placehold.co/600x400?text=Python'),
('bank_python_adv', 'Python进阶练习', 'Python高级编程与常用库练习', 'https://placehold.co/600x400?text=Python_Adv'),
('bank_cpp_basic', 'C++基础练习', 'C++基础语法与面向对象编程', 'https://placehold.co/600x400?text=CPP'),
('bank_cpp_adv', 'C++进阶练习', 'C++ STL与高级特性强化训练', 'https://placehold.co/600x400?text=CPP_Adv'),
('bank_js_basic', 'JavaScript基础练习', 'JavaScript核心语法与DOM操作', 'https://placehold.co/600x400?text=JS'),
('bank_go_basic', 'Go语言基础练习', 'Go语言基础语法与并发编程入门', 'https://placehold.co/600x400?text=Go');

-- 4. 插入题目 (Problems)
INSERT INTO problems (id, bank_id, title, difficulty, description, input_example, output_example, tags, pass_rate, reference_code) VALUES
('p1001', 'bank_c_basic', 'A+B Problem', 'Easy', 
'# A+B Problem\n\n## 题目描述\n输入两个整数 a 和 b，计算它们的和。\n\n## 输入格式\n一行两个包含空格的整数 a, b。\n\n## 输出格式\n输出 a+b 的值。', 
'1 2', '3', '["basic", "math"]', 95.5, 
'#include <stdio.h>\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d", a + b);\n    return 0;\n}'),

('p1002', 'bank_algo_adv', '冒泡排序', 'Medium', 
'# 冒泡排序\n\n## 题目描述\n给定一个长度为 n 的数组，请使用冒泡排序将其从小到大排序。\n\n## 输入格式\n第一行一个整数 n。\n第二行 n 个整数。\n\n## 输出格式\n输出排序后的数组，用空格分隔。', 
'5\n5 4 3 2 1', '1 2 3 4 5', '["sort", "array"]', 70.2, 
'// 略');

-- 5. 插入测试用例 (Test Cases)
INSERT INTO test_cases (problem_id, input_data, output_data, is_hidden) VALUES
('p1001', '1 2', '3', 0),
('p1001', '10 20', '30', 1),
('p1001', '-1 1', '0', 1),
('p1002', '3\n3 2 1', '1 2 3', 0),
('p1002', '5\n1 5 2 4 3', '1 2 3 4 5', 1);

-- 6. 插入比赛 (Contests)
INSERT INTO contests (id, title, type, description, start_time, end_time, is_leaderboard_open) VALUES
('c20231001', '2023秋季程序设计新生赛', 'CODING', '欢迎参加新生赛！', '2023-10-01 09:00:00', '2023-10-01 12:00:00', 1),
('c20240115', '期末大作业展示', 'PROJECT', '请提交期末项目作品。', '2024-01-15 08:00:00', '2024-01-20 18:00:00', 1);

-- 7. 插入比赛题目关联 (Contest Problems)
INSERT INTO contest_problems (contest_id, problem_id, score_weight, display_order) VALUES
('c20231001', 'p1001', 100, 1),
('c20231001', 'p1002', 200, 2);

-- 8. 插入比赛报名 (Contest Registrations)
INSERT INTO contest_registrations (contest_id, user_id) VALUES
('c20231001', 's001'),
('c20231001', 's002'),
('c20240115', 's001');

