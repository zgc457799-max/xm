import { smartParseProblem } from './aiService';

/**
 * Clean HTML helper to strip script, style, svg tags and get a clean text representation
 */
export const cleanHtmlToText = (rawHtml: string): string => {
    return rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<svg[\s\S]*?<\/svg>/gi, '')
        .replace(/<head>[\s\S]*?<\/head>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Scrapes a single problem from a URL
 */
export const scrapeProblemFromUrl = async (
    url: string,
    platform: 'auto' | 'leetcode' | 'codeforces'
): Promise<any> => {
    try {
        console.log(`[Scraper] Starting scrape for URL: ${url}, Platform: ${platform}`);

        if (platform === 'leetcode') {
            const isCn = url.includes('leetcode.cn');
            const graphqlUrl = isCn ? 'https://leetcode.cn/graphql' : 'https://leetcode.com/graphql';

            // Extract slug
            const match = url.match(/\/problems\/([^/]+)/);
            const slug = match ? match[1] : url.trim();

            console.log(`[Scraper] LeetCode Slug identified: ${slug}`);

            const response = await fetch(graphqlUrl, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    query: `query questionData($titleSlug: String!) {
                        question(titleSlug: $titleSlug) {
                            questionId
                            questionFrontendId
                            title
                            titleSlug
                            content
                            translatedTitle
                            translatedContent
                            difficulty
                            topicTags {
                                name
                                slug
                                translatedName
                            }
                        }
                    }`,
                    variables: { titleSlug: slug }
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch LeetCode API: ${response.statusText}`);
            }

            const result = await response.json() as any;
            const question = result?.data?.question;
            if (!question) {
                throw new Error('未能从力扣获取题目数据，请检查链接或 Slug 是否正确。');
            }

            // Extract properties
            const title = question.translatedTitle || question.title;
            const rawContent = question.translatedContent || question.content || '';
            const difficultyText = question.difficulty || 'Medium';

            const difficulty = difficultyText === 'Easy' ? 'Easy' : (difficultyText === 'Hard' ? 'Hard' : 'Medium');
            const tags = (question.topicTags || []).map((t: any) => t.translatedName || t.name);

            console.log(`[Scraper] LeetCode data fetched successfully. Title: ${title}`);

            // Let AI parse the HTML description into structured Markdown format
            const parsed = await smartParseProblem(rawContent);

            return {
                title: parsed.title || title,
                description: parsed.description,
                difficulty,
                tags: tags.length > 0 ? tags : (parsed.tags || []),
                inputExample: parsed.inputExample || '',
                outputExample: parsed.outputExample || ''
            };
        } else if (platform === 'codeforces') {
            // Extract contest ID and index
            const match1 = url.match(/\/problemset\/problem\/(\d+)\/([A-Za-z\d]+)/i);
            const match2 = url.match(/\/contest\/(\d+)\/problem\/([A-Za-z\d]+)/i);
            const contestId = match1 ? match1[1] : (match2 ? match2[1] : null);
            const index = match1 ? match1[2] : (match2 ? match2[2] : null);

            let fetchUrl = url;
            if (contestId && index) {
                fetchUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
            }

            console.log(`[Scraper] Codeforces Fetch URL: ${fetchUrl}`);

            const response = await fetch(fetchUrl, {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch Codeforces: ${response.statusText}`);
            }

            const html = await response.text();

            // Try to extract problem-statement container to save tokens
            const bodyMatch = html.match(/<div class="problem-statement">([\s\S]*?)<\/div>\s*<div class="[\w-]+">/i)
                || html.match(/<div class="problem-statement">([\s\S]*?)<\/div>/i);

            const contentToParse = bodyMatch ? bodyMatch[1] : html;
            const cleanedText = cleanHtmlToText(contentToParse);

            console.log(`[Scraper] CF page crawled, text length: ${cleanedText.length}. Parsing via AI...`);

            // Use AI to extract full details from standard Codeforces formatting
            const parsed = await smartParseProblem(cleanedText);
            return parsed;
        } else {
            // Universal AI Scraping
            const response = await fetch(url, {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to crawl webpage: ${response.statusText}`);
            }

            const html = await response.text();
            const cleanedText = cleanHtmlToText(html);

            console.log(`[Scraper] Web page crawled successfully, text length: ${cleanedText.length}. Parsing via AI...`);

            // AI intelligent extraction
            const parsed = await smartParseProblem(cleanedText.substring(0, 15000)); // Cap length to avoid massive prompts
            return parsed;
        }
    } catch (error: any) {
        console.error(`[Scraper Error] ${error.message}`);
        throw error;
    }
};

/**
 * Returns static pre-configured high quality problem sets with ready test cases
 */
export const getPresetProblems = (presetId: string): any[] => {
    if (presetId === 'preset_syntax') {
        return [
            {
                title: 'A + B Problem (两数之和)',
                difficulty: 'Easy',
                tags: ['基础语法', '顺序结构', '数学'],
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
                title: '闰年判断',
                difficulty: 'Easy',
                tags: ['基础语法', '分支结构', '条件判断'],
                description: '### 题目描述\n给定一个公元年份 **year**，判断这一年是否是闰年。\n\n**闰年的判定规则**：\n1. 能被 **4** 整除但不能被 **100** 整除。\n2. 或者能被 **400** 整除。\n\n### 输入格式\n输入一个正整数 **year**，代表年份。\n\n### 输出格式\n若是闰年输出 `YES`，否则输出 `NO`。\n\n### 约束条件\n- $1 \\le year \\le 9999$',
                inputExample: '2024',
                outputExample: 'YES',
                testCases: [
                    { input: '2024', output: 'YES' },
                    { input: '2000', output: 'YES' },
                    { input: '1900', output: 'NO' },
                    { input: '2023', output: 'NO' },
                    { input: '2008', output: 'YES' }
                ]
            },
            {
                title: '九九乘法表',
                difficulty: 'Easy',
                tags: ['基础语法', '循环结构', '嵌套循环'],
                description: '### 题目描述\n输入一个正整数 **n**，输出前 **n** 行的九九乘法表。格式如下：\n`1*1=1`\n`1*2=2 2*2=4`\n依此类推，同一行的乘法等式之间用空格分隔。\n\n### 输入格式\n输入一个正整数 **n**。\n\n### 输出格式\n输出前 **n** 行乘法表，每一行末尾不要有空余空格。\n\n### 约束条件\n- $1 \\le n \\le 9$',
                inputExample: '3',
                outputExample: '1*1=1\n1*2=2 2*2=4\n1*3=3 2*3=6 3*3=9',
                testCases: [
                    { input: '1', output: '1*1=1' },
                    { input: '3', output: '1*1=1\n1*2=2 2*2=4\n1*3=3 2*3=6 3*3=9' },
                    { input: '5', output: '1*1=1\n1*2=2 2*2=4\n1*3=3 2*3=6 3*3=9\n1*4=4 2*4=8 3*4=12 4*4=16\n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25' }
                ]
            },
            {
                title: '素数判定',
                difficulty: 'Easy',
                tags: ['基础语法', '循环结构', '数学'],
                description: '### 题目描述\n给定一个正整数 **n**，判断它是否为素数（质数）。\n大于 **1** 的自然数中，除了 **1** 和它本身以外不再有其他因数的数称为素数。\n\n### 输入格式\n输入一个正整数 **n**。\n\n### 输出格式\n如果是素数，输出 `YES`，否则输出 `NO`。\n\n### 约束条件\n- $1 \\le n \\le 10^9$',
                inputExample: '7',
                outputExample: 'YES',
                testCases: [
                    { input: '1', output: 'NO' },
                    { input: '2', output: 'YES' },
                    { input: '4', output: 'NO' },
                    { input: '7', output: 'YES' },
                    { input: '999999997', output: 'NO' }
                ]
            },
            {
                title: '一维数组元素逆序',
                difficulty: 'Easy',
                tags: ['基础语法', '数组', '指针'],
                description: '### 题目描述\n输入包含 **n** 个整数的数组，将其元素顺序进行逆序反转，并输出逆序后的数组。\n\n### 输入格式\n第一行包含一个整数 **n**，代表数组元素个数。\n第二行包含 **n** 个以空格分隔的整数，代表数组元素。\n\n### 输出格式\n输出一行，包含 **n** 个以空格分隔的逆序后的整数。\n\n### 约束条件\n- $1 \\le n \\le 1000$',
                inputExample: '5\n1 3 5 7 9',
                outputExample: '9 7 5 3 1',
                testCases: [
                    { input: '5\n1 3 5 7 9', output: '9 7 5 3 1' },
                    { input: '1\n100', output: '100' },
                    { input: '4\n-1 0 2 8', output: '8 2 0 -1' }
                ]
            }
        ];
    } else if (presetId === 'preset_oop') {
        return [
            {
                title: '指针基本操作：交换数值',
                difficulty: 'Easy',
                tags: ['C++', '指针', '内存管理'],
                description: '### 题目描述\n在 C/C++ 中，定义一个函数 `swap(int *a, int *b)`，通过指针参数交换调用函数中两个外部变量的值。\n\n### 输入格式\n输入一行两个整数 **x** 和 **y**。\n\n### 输出格式\n输出交换后的两个整数 **x** 和 **y**，以空格分隔。\n\n### 约束条件\n- $-10^6 \\le x, y \\le 10^6$',
                inputExample: '12 88',
                outputExample: '88 12',
                testCases: [
                    { input: '12 88', output: '88 12' },
                    { input: '0 -5', output: '-5 0' }
                ]
            },
            {
                title: 'Java 类的继承与封装',
                difficulty: 'Easy',
                tags: ['Java', '面向对象', '基础语法'],
                description: '### 题目描述\n在 Java 中，设计一个 `Person` 基类与一个 `Student` 子类。\n- `Person` 类包含私有属性 `name` (String) 和 `age` (int)，提供带参构造方法及 `display()` 方法输出 `"Name: [name], Age: [age]"`。\n- `Student` 类继承自 `Person`，新增私有属性 `score` (double)，重写 `display()` 方法，输出 `"Name: [name], Age: [age], Score: [score]"`（保留一位小数）。\n\n测试框架会读入姓名、年龄、成绩，实例化 `Student` 并调用 `display()`。\n\n### 输入格式\n第一行输入姓名。\n第二行输入年龄。\n第三行输入成绩。\n\n### 输出格式\n输出该学生的信息。\n\n### 样例输入\n`Alice`\n`18`\n`92.5`\n\n### 样例输出\n`Name: Alice, Age: 18, Score: 92.5`',
                inputExample: 'Alice\n18\n92.5',
                outputExample: 'Name: Alice, Age: 18, Score: 92.5',
                testCases: [
                    { input: 'Alice\n18\n92.5', output: 'Name: Alice, Age: 18, Score: 92.5' },
                    { input: 'Bob\n20\n88.0', output: 'Name: Bob, Age: 20, Score: 88.0' }
                ]
            },
            {
                title: 'Python 列表切片与高级推导',
                difficulty: 'Easy',
                tags: ['Python', '切片操作', '数据结构'],
                description: '### 题目描述\n输入一个包含多个整数的列表，输出满足以下两个条件的新列表：\n1. 仅保留下标为**偶数**的元素。\n2. 对这些保留的元素进行**平方**操作。\n请使用 Python 列表切片 (Slicing) 与列表推导式 (List Comprehension) 优雅实现。\n\n### 输入格式\n输入一行以空格分隔的若干整数。\n\n### 输出格式\n输出新列表的元素，以空格分隔。\n\n### 约束条件\n- 元素个数在 $1$ 到 $1000$ 之间',
                inputExample: '1 2 3 4 5 6',
                outputExample: '1 9 25',
                testCases: [
                    { input: '1 2 3 4 5 6', output: '1 9 25' },
                    { input: '10', output: '100' },
                    { input: '-1 3 -2 4', output: '1 4' }
                ]
            }
        ];
    } else if (presetId === 'preset_ds') {
        return [
            {
                title: '单链表反转',
                difficulty: 'Medium',
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
                title: '有效的括号匹配',
                difficulty: 'Easy',
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
            }
        ];
    } else if (presetId === 'preset_algo') {
        return [
            {
                title: '快速排序算法',
                difficulty: 'Medium',
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
                title: '0/1 背包问题',
                difficulty: 'Hard',
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
    }

    return [];
};
