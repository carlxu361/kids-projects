/*
 * 一、二、三、四、六年级的基础能力题库。
 * 这些题不冒充某一本教材的完整单元题库，只用于基础训练。
 * 五年级完整题库仍在 questions.js 中。
 */

const gradeQuestion = (id, topic, difficulty, type, prompt, answer, explanation, extra = {}) => ({
  id, topic, difficulty, type, prompt, answer, explanation, ...extra
});

window.GRADE_QUESTION_BANKS = {
  1: {
    chinese: [
      gradeQuestion("g1-cn-01", "拼音", 1, "choice", "“妈”的拼音是哪一个？", "mā", "“妈”读第一声 mā。", { choices: ["mā", "má", "mǎ", "mà"] }),
      gradeQuestion("g1-cn-02", "反义词", 1, "choice", "“大”的反义词是什么？", "小", "“大”和“小”表示相反的意思。", { choices: ["多", "小", "高", "上"] }),
      gradeQuestion("g1-cn-03", "量词", 1, "choice", "选择合适的量词：一（　）小鸟。", "只", "表示小鸟的数量常用“一只”。", { choices: ["只", "本", "把", "条"] }),
      gradeQuestion("g1-cn-04", "完整句", 1, "truefalse", "判断：“我在操场上跑步。”是一个完整的句子。", "正确", "句子写清了谁、在哪里、做什么。", { choices: ["正确", "错误"] })
    ],
    math: [
      gradeQuestion("g1-ma-01", "20以内加法", 1, "input", "计算：8＋7＝？", ["15"], "把 7 分成 2 和 5，8＋2＝10，再加 5 得 15。"),
      gradeQuestion("g1-ma-02", "20以内减法", 1, "input", "计算：16－9＝？", ["7"], "16－10＝6，再加回 1，得到 7。"),
      gradeQuestion("g1-ma-03", "比较大小", 1, "choice", "在 12、9、15 中，最大的数是？", "15", "15 比 12 和 9 都大。", { choices: ["12", "9", "15", "一样大"] }),
      gradeQuestion("g1-ma-04", "认识图形", 1, "choice", "哪个图形没有角？", "圆", "圆的边是弯曲的，没有角。", { choices: ["正方形", "三角形", "圆", "长方形"] })
    ],
    english: [
      gradeQuestion("g1-en-01", "字母", 1, "choice", "Which is the lowercase letter of A?", "a", "大写 A 对应的小写字母是 a。", { choices: ["a", "b", "d", "e"] }),
      gradeQuestion("g1-en-02", "问候", 1, "choice", "早上见到同学，可以说：", "Good morning!", "Good morning! 表示“早上好”。", { choices: ["Good morning!", "Good night!", "Thank you!", "Goodbye!"] }),
      gradeQuestion("g1-en-03", "数字", 1, "choice", "Which word means “三”？", "three", "three 表示数字 3。", { choices: ["one", "two", "three", "four"] }),
      gradeQuestion("g1-en-04", "颜色", 1, "choice", "The sun is usually ___.", "yellow", "太阳在儿童英语表达中通常用 yellow 描述。", { choices: ["yellow", "blue", "black", "green"] })
    ]
  },
  2: {
    chinese: [
      gradeQuestion("g2-cn-01", "部首", 1, "choice", "“河”的部首是什么？", "氵", "“河”和水有关，部首是三点水“氵”。", { choices: ["氵", "口", "木", "亻"] }),
      gradeQuestion("g2-cn-02", "标点", 1, "choice", "“你今天开心吗（　）”句末应该填什么？", "？", "这是疑问句，句末用问号。", { choices: ["。", "，", "？", "！"] }),
      gradeQuestion("g2-cn-03", "词语搭配", 1, "choice", "选择恰当的搭配。", "明亮的眼睛", "“明亮”可以形容眼睛有光彩。", { choices: ["明亮的眼睛", "奔跑的天空", "香甜的石头", "安静的雷声"] }),
      gradeQuestion("g2-cn-04", "句子顺序", 2, "ordering", "把词语排成一句话。", ["小鸟", "在树上", "唱歌", "。"], "顺序是“谁＋在哪里＋做什么”。", { items: ["小鸟", "在树上", "唱歌", "。"] })
    ],
    math: [
      gradeQuestion("g2-ma-01", "两位数加法", 1, "input", "计算：36＋27＝？", ["63"], "个位 6＋7＝13，写 3 进 1；十位 3＋2＋1＝6。"),
      gradeQuestion("g2-ma-02", "乘法口诀", 1, "input", "计算：6×7＝？", ["42"], "六七四十二。"),
      gradeQuestion("g2-ma-03", "长度单位", 1, "choice", "一支铅笔大约长 18（　）。", "cm", "铅笔长度通常用 cm 表示，18 m 会比教室还长。", { choices: ["cm", "m", "kg", "L"] }),
      gradeQuestion("g2-ma-04", "时间", 2, "input", "1 h 等于多少 min？", ["60", "60min"], "1 h＝60 min。")
    ],
    english: [
      gradeQuestion("g2-en-01", "自我介绍", 1, "choice", "—What's your name? —___", "I'm Tom.", "询问姓名可以回答 I'm Tom。", { choices: ["I'm Tom.", "I'm fine.", "It's red.", "Good night."] }),
      gradeQuestion("g2-en-02", "家庭", 1, "choice", "Which word means “妈妈”？", "mother", "mother 表示妈妈。", { choices: ["mother", "father", "brother", "teacher"] }),
      gradeQuestion("g2-en-03", "动物", 1, "choice", "A cat says ___.", "meow", "猫叫声常写作 meow。", { choices: ["meow", "woof", "moo", "quack"] }),
      gradeQuestion("g2-en-04", "简单句", 1, "truefalse", "判断：I like apples. 表示“我喜欢苹果”。", "正确", "like 表示喜欢，apples 表示苹果。", { choices: ["正确", "错误"] })
    ]
  },
  3: {
    chinese: [
      gradeQuestion("g3-cn-01", "修辞", 1, "choice", "“弯弯的月亮像小船”使用了什么修辞手法？", "比喻", "句子把月亮比作小船，是比喻。", { choices: ["比喻", "拟人", "排比", "反问"] }),
      gradeQuestion("g3-cn-02", "近义词", 1, "choice", "“安静”的近义词是？", "宁静", "“安静”和“宁静”意思相近。", { choices: ["宁静", "热闹", "飞快", "明亮"] }),
      gradeQuestion("g3-cn-03", "修改病句", 2, "correction", "改错：我估计他今天一定会来。", ["我估计他今天会来。", "他今天一定会来。"], "“估计”和“一定”意思矛盾，应删去一个。"),
      gradeQuestion("g3-cn-04", "阅读证据", 2, "choice", "判断人物很勤劳，最可靠的依据是什么？", "人物做过的具体事情", "人物特点要由文中的言行和事件证明。", { choices: ["人物做过的具体事情", "插图颜色", "文章页数", "人物名字"] })
    ],
    math: [
      gradeQuestion("g3-ma-01", "多位数乘一位数", 1, "input", "计算：214×3＝？", ["642"], "200×3＋14×3＝600＋42＝642。"),
      gradeQuestion("g3-ma-02", "有余数除法", 1, "input", "计算：29÷4，余数是多少？", ["1"], "4×7＝28，29－28＝1，所以余数是 1。"),
      gradeQuestion("g3-ma-03", "周长", 2, "input", "长方形长 8 cm、宽 5 cm，周长是多少 cm？", ["26", "26cm"], "周长＝（长＋宽）×2＝（8＋5）×2＝26 cm。"),
      gradeQuestion("g3-ma-04", "分数初步", 1, "choice", "把一个蛋糕平均分成 4 份，吃掉 1 份，吃了几分之几？", "1/4", "平均分成 4 份，其中 1 份是 1/4。", { choices: ["1/4", "1/3", "3/4", "4/1"] })
    ],
    english: [
      gradeQuestion("g3-en-01", "问候", 1, "choice", "—How are you? —___", "I'm fine.", "How are you? 询问近况，可回答 I'm fine。", { choices: ["I'm fine.", "I'm ten.", "It's blue.", "Good night."] }),
      gradeQuestion("g3-en-02", "颜色", 1, "choice", "What colour is the grass?", "green", "grass 是草，通常是 green。", { choices: ["green", "red", "black", "white"] }),
      gradeQuestion("g3-en-03", "数量", 1, "choice", "—How many pens? —___ pens.", "Five", "How many 询问数量。", { choices: ["Five", "Blue", "Big", "Fine"] }),
      gradeQuestion("g3-en-04", "单复数", 2, "choice", "Two ___.", "books", "two 后面要使用可数名词复数 books。", { choices: ["book", "books", "a book", "bookes"] })
    ]
  },
  4: {
    chinese: [
      gradeQuestion("g4-cn-01", "关联词", 1, "choice", "（　）天气很冷，（　）他仍坚持晨跑。", "虽然……但是……", "前后意思转折，使用“虽然……但是……”。", { choices: ["虽然……但是……", "因为……所以……", "如果……就……", "不但……而且……"] }),
      gradeQuestion("g4-cn-02", "说明方法", 2, "choice", "“这座塔高约 50 m”主要使用了什么说明方法？", "列数字", "句子用具体数字说明塔的高度。", { choices: ["列数字", "打比方", "举例子", "作比较"] }),
      gradeQuestion("g4-cn-03", "修辞", 1, "truefalse", "判断：“风儿唱着歌走过田野”使用了拟人。", "正确", "风不会唱歌和行走，作者把它当作人来写。", { choices: ["正确", "错误"] }),
      gradeQuestion("g4-cn-04", "概括", 2, "choice", "概括一段话主要意思，应该优先找什么？", "中心句和关键词", "中心句与反复出现的关键词能帮助抓住主要内容。", { choices: ["中心句和关键词", "最长的句子", "所有标点", "生字数量"] })
    ],
    math: [
      gradeQuestion("g4-ma-01", "大数读写", 1, "choice", "3050000 读作什么？", "三百零五万", "3050000＝305 万，读作三百零五万。", { choices: ["三百零五万", "三千零五万", "三十万五千", "三百五十万"] }),
      gradeQuestion("g4-ma-02", "运算顺序", 2, "input", "计算：120－20×4＝？", ["40"], "先算乘法 20×4＝80，再算 120－80＝40。"),
      gradeQuestion("g4-ma-03", "角", 1, "choice", "一个直角是多少度？", "90°", "直角是 90°。", { choices: ["45°", "90°", "180°", "360°"] }),
      gradeQuestion("g4-ma-04", "小数", 2, "choice", "比较 0.8 和 0.75，正确的是？", "0.8＞0.75", "0.8＝0.80，0.80＞0.75。", { choices: ["0.8＞0.75", "0.8＜0.75", "0.8＝0.75", "无法比较"] })
    ],
    english: [
      gradeQuestion("g4-en-01", "现在进行时", 1, "choice", "Peter is ___ now.", "reading", "is 后用 reading 构成现在进行时。", { choices: ["read", "reads", "reading", "readed"] }),
      gradeQuestion("g4-en-02", "星期", 1, "choice", "What day comes after Friday?", "Saturday", "Friday 后面是 Saturday。", { choices: ["Thursday", "Saturday", "Sunday", "Monday"] }),
      gradeQuestion("g4-en-03", "能力", 1, "choice", "—Can you swim? —Yes, ___.", "I can", "Can you...? 的肯定回答是 Yes, I can。", { choices: ["I can", "I am", "I do", "I was"] }),
      gradeQuestion("g4-en-04", "方位", 2, "choice", "The book is ___ the desk.（书在桌子上）", "on", "on 表示在物体表面上。", { choices: ["on", "under", "behind", "between"] })
    ]
  },
  6: {
    chinese: [
      gradeQuestion("g6-cn-01", "修辞作用", 2, "choice", "排比句最常见的表达作用是什么？", "增强语势，使表达更有节奏", "排比把结构相似的句子排列起来，能增强语势。", { choices: ["增强语势，使表达更有节奏", "缩短文章篇幅", "说明数字准确", "隐藏人物身份"] }),
      gradeQuestion("g6-cn-02", "文言词义", 2, "choice", "阅读文言文，遇到不懂的词最可靠的第一步是什么？", "结合注释和上下文", "教材注释与上下文是理解文言词义的直接依据。", { choices: ["结合注释和上下文", "只猜读音", "跳过全文", "只看插图"] }),
      gradeQuestion("g6-cn-03", "修改病句", 2, "correction", "改错：通过这次活动，使我明白了合作的重要。", ["通过这次活动，我明白了合作的重要性。", "这次活动使我明白了合作的重要性。"], "原句缺少主语，且“重要”应改为“重要性”。"),
      gradeQuestion("g6-cn-04", "阅读主旨", 3, "choice", "概括文章主旨，除了主要内容还要关注什么？", "作者表达的情感或观点", "主旨通常由“写了什么”和“为什么写”两部分组成。", { choices: ["作者表达的情感或观点", "纸张颜色", "段落数量", "字体大小"] })
    ],
    math: [
      gradeQuestion("g6-ma-01", "分数乘法", 1, "input", "计算：3/4×2/5＝？（最简分数）", ["3/10"], "分子相乘得 6，分母相乘得 20，约分为 3/10。"),
      gradeQuestion("g6-ma-02", "百分数", 2, "input", "把 0.35 化成百分数。", ["35%", "百分之三十五"], "小数化百分数，小数点向右移动两位并添上百分号。"),
      gradeQuestion("g6-ma-03", "比", 2, "input", "把 12∶18 化成最简整数比。", ["2:3", "2∶3"], "12 和 18 同时除以最大公因数 6，得到 2∶3。"),
      gradeQuestion("g6-ma-04", "圆", 2, "input", "圆的半径是 3 cm，直径是多少 cm？", ["6", "6cm"], "直径＝半径×2＝6 cm。")
    ],
    english: [
      gradeQuestion("g6-en-01", "一般过去时", 1, "choice", "I ___ my grandparents yesterday.", "visited", "yesterday 表示过去，visit 变为 visited。", { choices: ["visit", "visits", "visited", "visiting"] }),
      gradeQuestion("g6-en-02", "比较级", 2, "choice", "This tree is ___ than that one.", "taller", "than 提示使用比较级 taller。", { choices: ["tall", "taller", "tallest", "more tall"] }),
      gradeQuestion("g6-en-03", "一般将来时", 2, "choice", "We will ___ a picnic tomorrow.", "have", "will 后面接动词原形 have。", { choices: ["have", "has", "had", "having"] }),
      gradeQuestion("g6-en-04", "情态动词", 2, "choice", "We should ___ water.", "save", "should 后面接动词原形，save water 表示节约用水。", { choices: ["save", "saves", "saved", "saving"] })
    ]
  }
};
