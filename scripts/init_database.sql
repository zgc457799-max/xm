-- ===================================
-- EduCode AI 数据库初始化脚本
-- ===================================

-- 创建数据库
DROP DATABASE IF EXISTS educode_ai;
CREATE DATABASE educode_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE educode_ai;

-- ===================================
-- 1. 用户与基础信息表
-- ===================================

-- 用户表
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY COMMENT '学号或工号',
    password_hash VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    name VARCHAR(64) NOT NULL COMMENT '真实姓名',
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL COMMENT '角色',
    college VARCHAR(100) DEFAULT NULL COMMENT '学院',
    major VARCHAR(100) DEFAULT NULL COMMENT '专业',
    class_name VARCHAR(64) DEFAULT NULL COMMENT '班级',
    avatar_url VARCHAR(255) DEFAULT NULL COMMENT '头像链接',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_role (role)
) COMMENT='用户表';

-- 学生统计表
CREATE TABLE student_stats (
    user_id VARCHAR(64) PRIMARY KEY COMMENT '学生ID',
    solved_count INT DEFAULT 0 COMMENT '已解决题目数',
    total_submissions INT DEFAULT 0 COMMENT '总提交数',
    accuracy_rate DECIMAL(5,2) DEFAULT 0 COMMENT '正确率',
    rank_score INT DEFAULT 0 COMMENT '排名积分',
    streak_days INT DEFAULT 0 COMMENT '连续打卡天数',
    last_check_in DATETIME DEFAULT NULL COMMENT '最后打卡时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='学生统计表';

-- ===================================
-- 2. 题目与题库系统
-- ===================================

-- 题库表
CREATE TABLE problem_banks (
    id VARCHAR(64) PRIMARY KEY COMMENT '题库ID',
    title VARCHAR(100) NOT NULL COMMENT '题库名称',
    description TEXT DEFAULT NULL COMMENT '题库描述',
    cover_url VARCHAR(255) DEFAULT NULL COMMENT '封面图',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='题库表';

-- 题目表
CREATE TABLE problems (
    id VARCHAR(64) PRIMARY KEY COMMENT '题目ID',
    bank_id VARCHAR(64) DEFAULT NULL COMMENT '题库ID',
    title VARCHAR(200) NOT NULL COMMENT '题目名称',
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL COMMENT '难度',
    description LONGTEXT NOT NULL COMMENT '题目描述',
    input_example TEXT DEFAULT NULL COMMENT '输入样例',
    output_example TEXT DEFAULT NULL COMMENT '输出样例',
    tags JSON DEFAULT NULL COMMENT '标签数组',
    pass_rate DECIMAL(5,2) DEFAULT 0 COMMENT '通过率',
    reference_code TEXT DEFAULT NULL COMMENT '标准题解',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES problem_banks(id) ON DELETE SET NULL,
    INDEX idx_bank_difficulty (bank_id, difficulty),
    FULLTEXT idx_title_search (title)
) COMMENT='题目表';

-- 测试用例表
CREATE TABLE test_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    problem_id VARCHAR(64) NOT NULL COMMENT '题目ID',
    input_data LONGTEXT NOT NULL COMMENT '输入数据',
    output_data LONGTEXT NOT NULL COMMENT '输出数据',
    is_hidden BOOLEAN DEFAULT TRUE COMMENT '是否隐藏',
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id)
) COMMENT='测试用例表';

-- 错题本关联表
CREATE TABLE mistake_book (
    user_id VARCHAR(64) NOT NULL,
    problem_id VARCHAR(64) NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, problem_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) COMMENT='错题本';

-- ===================================
-- 3. 比赛系统
-- ===================================

-- 比赛表
CREATE TABLE contests (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '比赛标题',
    type ENUM('CODING', 'PROJECT') NOT NULL COMMENT '比赛类型',
    description TEXT DEFAULT NULL COMMENT '比赛说明',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    is_leaderboard_open BOOLEAN DEFAULT FALSE COMMENT '是否公开榜单',
    certificate_config JSON DEFAULT NULL COMMENT '证书配置',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_time (start_time, end_time)
) COMMENT='比赛表';

-- 比赛报名表
CREATE TABLE contest_registrations (
    contest_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_submitted BOOLEAN DEFAULT FALSE COMMENT '是否已提交试卷',
    submitted_at DATETIME DEFAULT NULL COMMENT '提交时间',
    PRIMARY KEY (contest_id, user_id),
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='比赛报名表';

-- 比赛题目关联表
CREATE TABLE contest_problems (
    contest_id VARCHAR(64) NOT NULL,
    problem_id VARCHAR(64) NOT NULL,
    score_weight INT DEFAULT 100 COMMENT '分值',
    display_order INT DEFAULT 0 COMMENT '排序',
    PRIMARY KEY (contest_id, problem_id),
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) COMMENT='比赛题目关联表';

-- 比赛结果表
CREATE TABLE contest_results (
    contest_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    score INT DEFAULT 0 COMMENT '得分',
    `rank` INT DEFAULT 0 COMMENT '排名',
    award_name VARCHAR(64) DEFAULT NULL COMMENT '奖项名称',
    certificate_code VARCHAR(64) DEFAULT NULL UNIQUE COMMENT '证书代码',
    is_published BOOLEAN DEFAULT FALSE COMMENT '是否已发布',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (contest_id, user_id),
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_contest_rank (contest_id, `rank`)
) COMMENT='比赛结果表';

-- ===================================
-- 4. 提交与评测系统
-- ===================================

-- 代码提交记录表
CREATE TABLE coding_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    problem_id VARCHAR(64) NOT NULL,
    contest_id VARCHAR(64) DEFAULT NULL COMMENT '比赛ID（可空）',
    language VARCHAR(20) NOT NULL COMMENT '编程语言',
    code_content LONGTEXT NOT NULL COMMENT '代码内容',
    status ENUM('AC', 'WA', 'TLE', 'CE', 'RE', 'PENDING') DEFAULT 'PENDING' COMMENT '评测状态',
    score INT DEFAULT 0 COMMENT '得分',
    time_used INT DEFAULT 0 COMMENT '运行耗时(ms)',
    memory_used INT DEFAULT 0 COMMENT '内存消耗(KB)',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE SET NULL,
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_contest (contest_id, submitted_at)
) COMMENT='代码提交记录';

-- 作品提交记录表
CREATE TABLE project_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contest_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    code_url VARCHAR(500) DEFAULT NULL COMMENT '代码包URL',
    doc_url VARCHAR(500) DEFAULT NULL COMMENT '文档URL',
    video_url VARCHAR(500) DEFAULT NULL COMMENT '视频URL',
    score DECIMAL(5,2) DEFAULT NULL COMMENT '评分',
    feedback TEXT DEFAULT NULL COMMENT '评语',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_contest_user (contest_id, user_id)
) COMMENT='作品提交记录';
