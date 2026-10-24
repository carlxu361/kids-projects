/*
 * 题库与页面逻辑分开保存，方便以后根据老师的复习资料继续加题。
 * difficulty: 1 基础、2 提升、3 挑战
 * type: choice 选择、truefalse 判断、fill 填空、input 输入、matching 连线
 */

const transfer = (prompt, answer, explanation, extra = {}) => ({
  id: `${extra.id || "transfer"}-transfer`,
  type: extra.type || "input",
  topic: extra.topic,
  difficulty: extra.difficulty || 1,
  prompt,
  answer,
  explanation,
  choices: extra.choices,
  pairs: extra.pairs,
  items: extra.items,
  note: "举一反三：换一个问法，再试一次。",
  isTransfer: true
});

window.SUBJECT_INFO = {
  chinese: { name: "语文", route: "语文寻踪", color: "chinese" },
  math: { name: "数学", route: "数学解谜", color: "math" },
  english: { name: "英语", route: "English Trip", color: "english" }
};

window.QUESTION_BANK = {
  chinese: [
    {
      id: "cn-poem-01", topic: "古诗积累", difficulty: 1, type: "fill",
      prompt: "补全诗句：童孙未解供耕织，也傍桑阴学____。",
      answer: ["种瓜"],
      explanation: "诗句出自范成大的《四时田园杂兴（其三十一）》。“傍”是靠近的意思，孩子在桑树阴下学着种瓜。",
      transfer: transfer("补全诗句：稚子金盆脱晓冰，彩丝穿取当____。", ["银钲", "银铮"], "正确原句是“彩丝穿取当银钲”。“钲”是一种金属打击乐器。", { id: "cn-poem-01", topic: "古诗积累", type: "fill" })
    },
    {
      id: "cn-poem-02", topic: "古诗理解", difficulty: 2, type: "choice",
      prompt: "“草满池塘水满陂，山衔落日浸寒漪”主要描写的是什么时间的景色？",
      choices: ["清晨", "中午", "傍晚", "深夜"], answer: "傍晚",
      explanation: "“落日”直接点明时间是傍晚。做诗句理解题，要先圈出表示时间、地点和动作的关键词。",
      transfer: transfer("“昼出耘田夜绩麻”中的“夜”说明人们什么时候搓麻线？", "夜晚", "“夜”就是夜晚。抓住表示时间的字，答案就藏在诗句里。", { id: "cn-poem-02", topic: "古诗理解", type: "choice", choices: ["清晨", "中午", "傍晚", "夜晚"] })
    },
    {
      id: "cn-hanzi-01", topic: "汉字演变", difficulty: 1, type: "choice",
      prompt: "汉字字体大致按什么顺序演变？",
      choices: ["甲骨文→金文→小篆→隶书→楷书", "金文→甲骨文→楷书→小篆→隶书", "小篆→甲骨文→隶书→金文→楷书", "甲骨文→隶书→金文→楷书→小篆"],
      answer: "甲骨文→金文→小篆→隶书→楷书",
      explanation: "记住主线：甲骨文、金文、小篆、隶书、楷书。字体从图画性较强逐渐变得规整、方便书写。",
      transfer: transfer("在甲骨文、金文、小篆、隶书、楷书中，哪一种出现得最早？", "甲骨文", "甲骨文是目前已知较早的成熟汉字体系，因多刻在龟甲和兽骨上而得名。", { id: "cn-hanzi-01", topic: "汉字演变", type: "choice", choices: ["甲骨文", "小篆", "隶书", "楷书"] })
    },
    {
      id: "cn-hanzi-02", topic: "形声字", difficulty: 2, type: "truefalse",
      prompt: "判断：“湖”是形声字，“氵”提示意思与水有关，“胡”提示读音。",
      choices: ["正确", "错误"], answer: "正确",
      explanation: "形声字通常由形旁和声旁组成。形旁提示意义范围，声旁提示大致读音，但声旁不一定与现代读音完全相同。",
      transfer: transfer("“清”字中的“氵”主要提示什么？", "意思与水有关", "“氵”是形旁，提示意义；“青”是声旁，提示大致读音。", { id: "cn-hanzi-02", topic: "形声字", type: "choice", choices: ["意思与水有关", "一定读 qīng", "笔画数量", "书写顺序"] })
    },
    {
      id: "cn-classic-01", topic: "古典名著", difficulty: 1, type: "matching",
      prompt: "把课文与古典名著连起来。",
      pairs: [{ left: "《草船借箭》", right: "《三国演义》" }, { left: "《景阳冈》", right: "《水浒传》" }, { left: "《猴王出世》", right: "《西游记》" }, { left: "《红楼春趣》", right: "《红楼梦》" }],
      answer: "pairs",
      explanation: "四篇课文分别来自中国四大古典名著。记人物也能帮助判断：诸葛亮、武松、孙悟空、贾宝玉。",
      transfer: transfer("武松是哪一部古典名著中的人物？", "《水浒传》", "武松是《水浒传》中的人物，《景阳冈》写了他打虎的故事。", { id: "cn-classic-01", topic: "古典名著", type: "choice", choices: ["《三国演义》", "《水浒传》", "《西游记》", "《红楼梦》"] })
    },
    {
      id: "cn-classic-02", topic: "名著人物", difficulty: 2, type: "choice",
      prompt: "《草船借箭》中，诸葛亮能成功“借”到箭，最关键的品质是什么？",
      choices: ["力气很大", "神机妙算并善用条件", "箭法高超", "运气特别好"], answer: "神机妙算并善用条件",
      explanation: "诸葛亮算准天气、曹操的反应和船只安排，把雾、江面和敌军都变成了可利用的条件。",
      transfer: transfer("诸葛亮选择大雾天气行动，主要利用了大雾的什么作用？", "遮挡视线", "大雾遮挡视线，曹军不敢轻易出击，只能放箭。", { id: "cn-classic-02", topic: "名著人物", type: "choice", choices: ["遮挡视线", "加快船速", "让箭变轻", "吹响战鼓"] })
    },
    {
      id: "cn-reading-01", topic: "人物描写", difficulty: 1, type: "choice",
      prompt: "“他咬紧牙关，双手死死抓住绳子，额头冒出了汗。”主要运用了哪种人物描写？",
      choices: ["动作描写", "环境描写", "景物描写", "说明方法"], answer: "动作描写",
      explanation: "“咬紧、抓住”都是动作，“冒出了汗”也从外在表现人物的用力和紧张。",
      transfer: transfer("“他想：这一次我一定不能退缩。”主要属于哪种描写？", "心理描写", "句子直接写人物心里的想法，所以是心理描写。", { id: "cn-reading-01", topic: "人物描写", type: "choice", choices: ["语言描写", "心理描写", "外貌描写", "环境描写"] })
    },
    {
      id: "cn-reading-02", topic: "人物描写", difficulty: 2, type: "matching",
      prompt: "把句子与描写方法连起来。",
      pairs: [{ left: "“快跟我来！”他喊道。", right: "语言描写" }, { left: "她皱起眉头，来回踱步。", right: "动作描写" }, { left: "他心里像压着一块石头。", right: "心理描写" }],
      answer: "pairs",
      explanation: "先找信号：说出来的话多是语言描写；人物做了什么多是动作描写；心里的感受和想法是心理描写。",
      transfer: transfer("“他的脸涨得通红，眼睛盯着地面。”主要是通过什么来表现人物？", "神态描写", "脸色和眼神属于神态，能表现人物当时的情绪。", { id: "cn-reading-02", topic: "人物描写", type: "choice", choices: ["神态描写", "环境描写", "说明方法", "场面描写"] })
    },
    {
      id: "cn-story-01", topic: "文言文", difficulty: 1, type: "choice",
      prompt: "《自相矛盾》告诉我们的主要道理是什么？",
      choices: ["说话做事要前后一致", "做生意一定要大声", "兵器越多越好", "别人说什么都要相信"], answer: "说话做事要前后一致",
      explanation: "卖矛和盾的人说“矛无坚不摧、盾牢不可破”，两句话放在一起无法同时成立，所以“自相矛盾”指前后抵触。",
      transfer: transfer("下面哪句话存在自相矛盾？", "这件事我从来没有做过，但上次确实是我做的。", "前半句说从未做过，后半句又承认做过，前后不能同时成立。", { id: "cn-story-01", topic: "文言文", type: "choice", choices: ["雨停了，我们出发。", "他一边听一边记录。", "这件事我从来没有做过，但上次确实是我做的。", "先检查，再交卷。"] })
    },
    {
      id: "cn-story-02", topic: "思维方法", difficulty: 2, type: "choice",
      prompt: "田忌第二场比赛让上等马对齐威王的中等马，这种安排的关键是什么？",
      choices: ["只比较一场的输赢", "调整出场顺序，争取整体两胜", "每场都用同一匹马", "临时更换比赛规则"], answer: "调整出场顺序，争取整体两胜",
      explanation: "田忌接受一场失败，用自己的优势等级去赢另外两场。解决问题要看整体目标，不要只盯着局部。",
      transfer: transfer("三局两胜的比赛中，合理安排顺序主要是在优化什么？", "整体结果", "策略的目标是赢得整场比赛，也就是优化整体结果。", { id: "cn-story-02", topic: "思维方法", type: "choice", choices: ["整体结果", "第一局比分", "比赛时间", "观众数量"] })
    },
    {
      id: "cn-story-03", topic: "情节理解", difficulty: 2, type: "truefalse",
      prompt: "判断：《跳水》中船长朝孩子上方开枪，是为了吓孩子跳进海里，避免他摔到甲板上。",
      choices: ["正确", "错误"], answer: "正确",
      explanation: "孩子站在高高的横木上，退回去或掉到甲板都很危险。船长在紧急时刻让他跳水，水手马上救起了他。",
      transfer: transfer("《跳水》中的船长最突出的特点是什么？", "沉着果断", "危险发生时，他迅速判断并采取有效行动，表现出沉着和果断。", { id: "cn-story-03", topic: "情节理解", type: "choice", choices: ["沉着果断", "优柔寡断", "胆小退缩", "粗心大意"] })
    },
    {
      id: "cn-wenyan-01", topic: "文言文", difficulty: 2, type: "fill",
      prompt: "《杨氏之子》中“梁国杨氏子九岁，甚聪惠”的“惠”同“____”。",
      answer: ["慧"], explanation: "“惠”同“慧”，表示聪明。读文言文时，要注意教材注释中的通假字。",
      transfer: transfer("“孔君平诣其父”中的“诣”是什么意思？", ["拜访", "拜见"], "“诣”在这里是拜访的意思。句子说孔君平去拜访孩子的父亲。", { id: "cn-wenyan-01", topic: "文言文", type: "fill" })
    },
    {
      id: "cn-view-01", topic: "景物描写", difficulty: 1, type: "choice",
      prompt: "《威尼斯的小艇》把小艇比作独木舟和新月，主要写出了小艇的什么特点？",
      choices: ["又长又窄、两头翘起", "非常宽大", "颜色鲜艳", "速度固定"], answer: "又长又窄、两头翘起",
      explanation: "比喻不是只为了好看，它能把形状写具体。独木舟突出窄长，新月突出两头翘起。",
      transfer: transfer("阅读比喻句时，理解事物特点的好方法是什么？", "比较本体和喻体的相似处", "作者选择喻体，是因为它和所写事物有相似点，找到相似点就能读懂特点。", { id: "cn-view-01", topic: "景物描写", type: "choice", choices: ["比较本体和喻体的相似处", "只数句子字数", "跳过喻体", "只看标点"] })
    },
    {
      id: "cn-view-02", topic: "课文理解", difficulty: 1, type: "choice",
      prompt: "《牧场之国》反复出现“这就是真正的荷兰”，这样写有什么作用？",
      choices: ["强调作者对荷兰牧场的赞美", "说明作者忘记了内容", "表示故事还没开始", "提醒读者计算次数"], answer: "强调作者对荷兰牧场的赞美",
      explanation: "反复出现的中心句能串联画面，也不断加强作者对宁静、自由牧场生活的赞美。",
      transfer: transfer("文章中反复出现的关键句，通常可以帮助我们把握什么？", "中心意思", "关键句常常概括或强调文章的中心意思。", { id: "cn-view-02", topic: "课文理解", type: "choice", choices: ["中心意思", "纸张大小", "作者年龄", "标点数量"] })
    },
    {
      id: "cn-view-03", topic: "非连续性文本", difficulty: 3, type: "choice",
      prompt: "阅读介绍金字塔的文字和数据表时，哪种做法最有效？",
      choices: ["把文字、数据和图片信息联系起来", "只看标题", "只读最后一句", "忽略所有数字"], answer: "把文字、数据和图片信息联系起来",
      explanation: "非连续性文本常把信息分散在文字、表格和图片中。综合多种材料，得到的信息才完整。",
      transfer: transfer("资料中同时出现示意图和文字说明，应怎样阅读？", "对照阅读，互相补充", "图能直观展示结构，文字能解释细节，两者对照可以减少遗漏。", { id: "cn-view-03", topic: "非连续性文本", type: "choice", choices: ["对照阅读，互相补充", "只看图", "只看字", "随便选一部分"] })
    },
    {
      id: "cn-hand-01", topic: "中心思想", difficulty: 2, type: "choice",
      prompt: "《手指》最后强调五根手指团结起来力量大，说明了什么道理？",
      choices: ["各有所长，团结协作更有力量", "大拇指永远最重要", "外形好看最重要", "每个人应该独自完成所有事"], answer: "各有所长，团结协作更有力量",
      explanation: "每根手指姿态和作用不同，各有长短；合作时才能发挥整体力量。概括道理要从具体事物上升到普遍意义。",
      transfer: transfer("一个小组怎样做最能体现《手指》说明的道理？", "按各自长处分工并互相配合", "既看到每个人的长处，又共同完成目标，就是团结协作。", { id: "cn-hand-01", topic: "中心思想", type: "choice", choices: ["按各自长处分工并互相配合", "所有事交给一个人", "只听成绩最好的人", "互相比较不合作"] })
    },
    {
      id: "cn-word-01", topic: "词语运用", difficulty: 2, type: "choice",
      prompt: "选择最恰当的词语：比赛到了最后一局，他仍然冷静分析，显得十分（　）。",
      choices: ["胸有成竹", "手忙脚乱", "心惊胆战", "哭笑不得"], answer: "胸有成竹",
      explanation: "“胸有成竹”比喻做事之前已经有通盘考虑。句中“冷静分析”与它最符合。",
      transfer: transfer("面对突然发生的危险，他迅速想出办法，可以用哪个词语形容？", "急中生智", "“急中生智”指在紧急的时候猛然想出办法。", { id: "cn-word-01", topic: "词语运用", type: "choice", choices: ["急中生智", "养尊处优", "半信半疑", "随心所欲"] })
    },
    {
      id: "cn-read-03", topic: "阅读方法", difficulty: 3, type: "choice",
      prompt: "阅读人物故事，想判断人物品质，最可靠的依据是什么？",
      choices: ["人物的语言、动作和事件结果", "文章页数", "人物名字长短", "插图颜色"], answer: "人物的语言、动作和事件结果",
      explanation: "人物品质不是凭感觉猜的，要用文中的行为和语言作证据，再结合事件结果概括。",
      transfer: transfer("概括人物特点时，正确的表达方式是哪一种？", "特点＋文中具体证据", "先给出特点，再用人物的言行或事件证明，答案才完整。", { id: "cn-read-03", topic: "阅读方法", type: "choice", choices: ["特点＋文中具体证据", "只写一个形容词", "抄写全文", "只写自己的喜好"] })
    }
  ],

  math: [
    {
      id: "ma-factor-01", topic: "因数与倍数", difficulty: 1, type: "choice",
      prompt: "下面哪一个数是 24 的因数？",
      choices: ["5", "6", "7", "9"], answer: "6",
      explanation: "24÷6=4，没有余数，所以 6 是 24 的因数。判断因数就是看能不能整除。",
      transfer: transfer("下面哪一个数是 36 的因数？", "9", "36÷9=4，所以 9 是 36 的因数。", { id: "ma-factor-01", topic: "因数与倍数", type: "choice", choices: ["5", "7", "9", "11"] })
    },
    {
      id: "ma-factor-02", topic: "2、3、5的倍数", difficulty: 1, type: "choice",
      prompt: "下面哪个数同时是 2、3、5 的倍数？",
      choices: ["30", "45", "50", "72"], answer: "30",
      explanation: "同时是 2、3、5 的倍数，就要同时满足：末位是 0；各位数字和是 3 的倍数。30 满足。",
      transfer: transfer("下面哪个数同时是 2、3、5 的倍数？", "60", "60 的末位是 0，且 6+0=6 是 3 的倍数。", { id: "ma-factor-02", topic: "2、3、5的倍数", type: "choice", choices: ["40", "55", "60", "75"] })
    },
    {
      id: "ma-prime-01", topic: "质数与合数", difficulty: 1, type: "choice",
      prompt: "下面哪个数是质数？",
      choices: ["1", "9", "17", "21"], answer: "17",
      explanation: "质数只有 1 和它本身两个因数。17 只能被 1 和 17 整除；1 既不是质数也不是合数。",
      transfer: transfer("下面哪个数是合数？", "15", "15 除了 1 和 15，还有因数 3 和 5，所以是合数。", { id: "ma-prime-01", topic: "质数与合数", type: "choice", choices: ["2", "7", "13", "15"] })
    },
    {
      id: "ma-common-01", topic: "公因数", difficulty: 2, type: "input",
      prompt: "18 和 24 的最大公因数是多少？",
      answer: ["6"], explanation: "18 的因数有 1、2、3、6、9、18；24 的因数有 1、2、3、4、6、8、12、24。最大的公因数是 6。",
      transfer: transfer("12 和 20 的最大公因数是多少？", ["4"], "12 和 20 的公因数有 1、2、4，其中最大的是 4。", { id: "ma-common-01", topic: "公因数" })
    },
    {
      id: "ma-common-02", topic: "公倍数", difficulty: 2, type: "input",
      prompt: "6 和 8 的最小公倍数是多少？",
      answer: ["24"], explanation: "6 的倍数有 6、12、18、24……；8 的倍数有 8、16、24……，最先相同的是 24。",
      transfer: transfer("4 和 10 的最小公倍数是多少？", ["20"], "4 的倍数和 10 的倍数最先在 20 相遇。", { id: "ma-common-02", topic: "公倍数" })
    },
    {
      id: "ma-fraction-01", topic: "分数的意义", difficulty: 1, type: "choice",
      prompt: "把 3 米长的绳子平均分成 5 段，每段占全长的几分之几？",
      choices: ["1/3", "1/5", "3/5", "5/3"], answer: "1/5",
      explanation: "问“占全长的几分之几”，把全长看作单位“1”。平均分成 5 段，每段就是 1/5。",
      transfer: transfer("把一张纸平均分成 8 份，其中一份占整张纸的几分之几？", "1/8", "单位“1”被平均分成 8 份，每份是 1/8。", { id: "ma-fraction-01", topic: "分数的意义", type: "choice", choices: ["1/8", "1/7", "7/8", "8"] })
    },
    {
      id: "ma-fraction-02", topic: "约分", difficulty: 1, type: "input",
      prompt: "把 18/24 约成最简分数。",
      answer: ["3/4", "0.75"], explanation: "18 和 24 的最大公因数是 6，分子分母同时除以 6，得到 3/4。",
      transfer: transfer("把 15/25 约成最简分数。", ["3/5", "0.6"], "15 和 25 同时除以最大公因数 5，得到 3/5。", { id: "ma-fraction-02", topic: "约分" })
    },
    {
      id: "ma-fraction-03", topic: "通分与比较", difficulty: 2, type: "choice",
      prompt: "比较 3/4 和 5/6，正确的是？",
      choices: ["3/4＞5/6", "3/4＜5/6", "3/4＝5/6", "无法比较"], answer: "3/4＜5/6",
      explanation: "通分到 12：3/4=9/12，5/6=10/12，所以 3/4＜5/6。",
      transfer: transfer("比较 2/3 和 3/5，正确的是？", "2/3＞3/5", "通分到 15：2/3=10/15，3/5=9/15，所以 2/3＞3/5。", { id: "ma-fraction-03", topic: "通分与比较", type: "choice", choices: ["2/3＞3/5", "2/3＜3/5", "2/3＝3/5", "无法比较"] })
    },
    {
      id: "ma-add-01", topic: "分数加法", difficulty: 1, type: "input",
      prompt: "计算：2/7＋3/7＝？（填最简分数）",
      answer: ["5/7"], explanation: "同分母分数相加，分母不变，分子相加：2+3=5，所以是 5/7。",
      transfer: transfer("计算：3/8＋1/8＝？（填最简分数）", ["1/2", "4/8", "0.5"], "先得 4/8，再约分为 1/2。", { id: "ma-add-01", topic: "分数加法" })
    },
    {
      id: "ma-add-02", topic: "异分母加减法", difficulty: 2, type: "input",
      prompt: "计算：1/3＋1/4＝？（填最简分数）",
      answer: ["7/12"], explanation: "先通分：1/3=4/12，1/4=3/12，再相加得到 7/12。",
      transfer: transfer("计算：3/4－1/6＝？（填最简分数）", ["7/12"], "通分到 12：3/4=9/12，1/6=2/12，相减得 7/12。", { id: "ma-add-02", topic: "异分母加减法", difficulty: 2 })
    },
    {
      id: "ma-cube-01", topic: "长方体体积", difficulty: 1, type: "input",
      prompt: "一个长方体长 6 cm、宽 4 cm、高 3 cm，它的体积是多少 cm³？",
      answer: ["72", "72立方厘米", "72cm³", "72cm3"], explanation: "长方体体积=长×宽×高，所以 6×4×3=72（cm³）。",
      transfer: transfer("一个长方体长 5 cm、宽 3 cm、高 2 cm，体积是多少 cm³？", ["30", "30立方厘米", "30cm³", "30cm3"], "5×3×2=30（cm³）。", { id: "ma-cube-01", topic: "长方体体积" })
    },
    {
      id: "ma-cube-02", topic: "正方体表面积", difficulty: 2, type: "input",
      prompt: "一个棱长为 4 cm 的正方体，表面积是多少 cm²？",
      answer: ["96", "96平方厘米", "96cm²", "96cm2"], explanation: "正方体有 6 个相同的正方形面。表面积=4×4×6=96（cm²）。",
      transfer: transfer("一个棱长为 3 cm 的正方体，表面积是多少 cm²？", ["54", "54平方厘米", "54cm²", "54cm2"], "3×3×6=54（cm²）。", { id: "ma-cube-02", topic: "正方体表面积", difficulty: 2 })
    },
    {
      id: "ma-unit-01", topic: "体积单位", difficulty: 2, type: "input",
      prompt: "2.5 dm³ 等于多少 cm³？",
      answer: ["2500", "2500立方厘米", "2500cm³", "2500cm3"], explanation: "1 dm³=1000 cm³，所以 2.5×1000=2500 cm³。立方单位之间的进率不是 10，而是 1000。",
      transfer: transfer("3.2 L 等于多少 mL？", ["3200", "3200毫升", "3200ml", "3200mL"], "1 L=1000 mL，所以 3.2×1000=3200 mL。", { id: "ma-unit-01", topic: "体积单位", difficulty: 2 })
    },
    {
      id: "ma-rotate-01", topic: "图形的运动", difficulty: 1, type: "choice",
      prompt: "一个图形绕某点顺时针旋转 90°，什么不会改变？",
      choices: ["图形的大小和形状", "图形的方向", "每个点的位置", "图形朝向"], answer: "图形的大小和形状",
      explanation: "旋转只改变图形的位置和方向，不改变形状和大小。描述旋转要说清中心、方向和角度。",
      transfer: transfer("完整描述一次旋转，需要说清哪三项？", "旋转中心、方向和角度", "中心决定绕哪里转，方向分顺时针和逆时针，角度说明转多少。", { id: "ma-rotate-01", topic: "图形的运动", type: "choice", choices: ["旋转中心、方向和角度", "颜色、面积和周长", "长、宽和高", "速度、路程和时间"] })
    },
    {
      id: "ma-stat-01", topic: "折线统计图", difficulty: 1, type: "choice",
      prompt: "想清楚地表示一周气温的增减变化，最适合使用哪种统计图？",
      choices: ["单式折线统计图", "统计表一定更好", "只写最大值", "随意画图"], answer: "单式折线统计图",
      explanation: "折线统计图不但能表示数量多少，还能清楚看出数量随时间的增减变化。",
      transfer: transfer("要比较甲、乙两地一年气温变化趋势，适合使用什么图？", "复式折线统计图", "复式折线统计图能把两组数据画在同一张图中，方便比较趋势。", { id: "ma-stat-01", topic: "折线统计图", type: "choice", choices: ["复式折线统计图", "只有一条线的图", "路线图", "示意图"] })
    },
    {
      id: "ma-find-01", topic: "找次品", difficulty: 2, type: "choice",
      prompt: "有 9 个外观相同的零件，其中 1 个较轻。用无砝码天平至少称几次能保证找出它？",
      choices: ["1次", "2次", "3次", "4次"], answer: "2次",
      explanation: "把 9 个平均分成 3、3、3。第一次称两组；较轻组或未称组中有次品。再从目标的 3 个里称 1 对 1，第二次就能确定。",
      transfer: transfer("有 3 个零件，其中 1 个较轻，用天平至少称几次能保证找出？", "1次", "拿两个互称：若不平衡，轻的是次品；若平衡，没称的是次品。", { id: "ma-find-01", topic: "找次品", type: "choice", choices: ["1次", "2次", "3次", "无法确定"] })
    },
    {
      id: "ma-word-01", topic: "分数解决问题", difficulty: 2, type: "input",
      prompt: "一杯果汁，小明喝了 1/3，小红喝了 1/4。还剩这杯果汁的几分之几？",
      answer: ["5/12"], explanation: "把整杯看作 1：1－1/3－1/4=12/12－4/12－3/12=5/12。",
      transfer: transfer("一段路，上午修了 2/5，下午修了 1/4，还剩几分之几？", ["7/20"], "1－2/5－1/4=20/20－8/20－5/20=7/20。", { id: "ma-word-01", topic: "分数解决问题", difficulty: 2 })
    },
    {
      id: "ma-cube-03", topic: "体积解决问题", difficulty: 3, type: "input",
      prompt: "一个长方体水箱从里面量长 8 dm、宽 5 dm，水深 3 dm。水的体积是多少 L？",
      answer: ["120", "120升", "120l", "120L"], explanation: "水形成长方体：8×5×3=120 dm³。因为 1 dm³=1 L，所以是 120 L。",
      transfer: transfer("水槽底面积是 24 dm²，水深 4 dm，水有多少 L？", ["96", "96升", "96l", "96L"], "体积=底面积×高=24×4=96 dm³=96 L。", { id: "ma-cube-03", topic: "体积解决问题", difficulty: 3 })
    },
    {
      id: "ma-logic-01", topic: "数学思考", difficulty: 3, type: "truefalse",
      prompt: "判断：两个不同质数的积一定是合数。",
      choices: ["正确", "错误"], answer: "正确",
      explanation: "设两个质数为 a、b，它们的积 ab 至少有 1、a、b、ab 四个因数，所以一定是合数。",
      transfer: transfer("两个奇数的和一定是什么数？", "偶数", "奇数可以写成 2n+1，两个奇数相加会得到 2 的倍数，所以是偶数。", { id: "ma-logic-01", topic: "数学思考", type: "choice", choices: ["偶数", "奇数", "质数", "无法判断"] })
    }
  ],

  english: [
    {
      id: "en-u1-01", topic: "Unit 1 计划", difficulty: 1, type: "choice",
      prompt: "We are going to ___ stories.",
      choices: ["read", "reads", "reading", "readed"], answer: "read",
      explanation: "be going to 后面接动词原形，所以用 read。句意是“我们打算读故事”。",
      transfer: transfer("She is going to ___ a film.", "watch", "is going to 后面接动词原形 watch。", { id: "en-u1-01", topic: "Unit 1 计划", type: "choice", choices: ["watch", "watches", "watching", "watched"] })
    },
    {
      id: "en-u1-02", topic: "Unit 1 计划", difficulty: 2, type: "choice",
      prompt: "—Are you going to write about animals? —Yes, ___.",
      choices: ["I am", "I do", "I was", "I can"], answer: "I am",
      explanation: "问句用 Are you going to...，肯定回答要用 Yes, I am。助动词要前后一致。",
      transfer: transfer("—Is he going to read? —No, ___.", "he isn't", "Is he... 的否定回答是 No, he isn't。", { id: "en-u1-02", topic: "Unit 1 计划", type: "choice", choices: ["he isn't", "he doesn't", "he wasn't", "he can't"] })
    },
    {
      id: "en-u2-01", topic: "Unit 2 调查", difficulty: 1, type: "matching",
      prompt: "Match the words with their Chinese meanings.",
      pairs: [{ left: "research", right: "调查；研究" }, { left: "collect", right: "收集" }, { left: "information", right: "信息" }],
      answer: "pairs", explanation: "做 research 时常要 collect information（收集信息），这些词可以放在一个场景里记。",
      transfer: transfer("“收集图片”用英语怎样表达？", "collect pictures", "collect 是“收集”，pictures 是“图片”，合起来是 collect pictures。", { id: "en-u2-01", topic: "Unit 2 调查", type: "input" })
    },
    {
      id: "en-u2-02", topic: "Unit 2 调查", difficulty: 2, type: "choice",
      prompt: "We are going to ___ some research.",
      choices: ["do", "make", "play", "take"], answer: "do",
      explanation: "固定搭配是 do some research，表示“做一些调查/研究”。",
      transfer: transfer("Which phrase means “写一份报告”？", "write a report", "write a report 是“写一份报告”。", { id: "en-u2-02", topic: "Unit 2 调查", type: "choice", choices: ["write a report", "read a kite", "show a road", "make information"] })
    },
    {
      id: "en-u3-01", topic: "Unit 3 制作", difficulty: 1, type: "choice",
      prompt: "Let's ___ a kite.",
      choices: ["make", "makes", "making", "made"], answer: "make",
      explanation: "Let's 后面接动词原形，所以用 make。Let's make a kite. 意为“让我们做一个风筝吧”。",
      transfer: transfer("Let's ___ the picture.", "draw", "Let's 后面接动词原形 draw。", { id: "en-u3-01", topic: "Unit 3 制作", type: "choice", choices: ["draw", "draws", "drawing", "drew"] })
    },
    {
      id: "en-u3-02", topic: "Unit 3 制作", difficulty: 2, type: "matching",
      prompt: "Match the actions with their meanings.",
      pairs: [{ left: "cut the bamboo", right: "切竹子" }, { left: "tie a string", right: "系一根线" }, { left: "draw a picture", right: "画一幅画" }],
      answer: "pairs", explanation: "制作步骤题常考动词：cut（切）、tie（系）、draw（画）。按动作一起记更牢。",
      transfer: transfer("Which word means “用胶水粘”？", "glue", "glue 作动词时表示“用胶水粘”。", { id: "en-u3-02", topic: "Unit 3 制作", type: "choice", choices: ["glue", "show", "turn", "study"] })
    },
    {
      id: "en-u4-01", topic: "Unit 4 规则", difficulty: 1, type: "choice",
      prompt: "在图书馆提醒别人不要说话，应该说：",
      choices: ["Don't talk here.", "Talk loudly here.", "Let's run here.", "You are talking."], answer: "Don't talk here.",
      explanation: "Don't + 动词原形表示“不要做某事”。Don't talk here. 就是“不要在这里说话”。",
      transfer: transfer("“不要在这里吃东西”怎样说？", "Don't eat here.", "否定祈使句用 Don't + 动词原形：Don't eat here.", { id: "en-u4-01", topic: "Unit 4 规则", type: "choice", choices: ["Don't eat here.", "Not eat here.", "Doesn't eat here.", "No eats here."] })
    },
    {
      id: "en-u5-01", topic: "Unit 5 生日", difficulty: 1, type: "choice",
      prompt: "—When's your birthday? —It's ___ May.",
      choices: ["in", "on", "at", "to"], answer: "in",
      explanation: "月份前通常用 in：in May。具体日期前用 on，例如 on May 6th。",
      transfer: transfer("My birthday is ___ July 12th.", "on", "具体到某月某日时用介词 on。", { id: "en-u5-01", topic: "Unit 5 生日", type: "choice", choices: ["in", "on", "at", "from"] })
    },
    {
      id: "en-u5-02", topic: "Unit 5 月份", difficulty: 2, type: "matching",
      prompt: "Match the months.",
      pairs: [{ left: "March", right: "三月" }, { left: "August", right: "八月" }, { left: "December", right: "十二月" }],
      answer: "pairs", explanation: "月份首字母要大写。可以按季节分组记月份，而不是孤立地背 12 个单词。",
      transfer: transfer("Which month comes after September?", "October", "September 后面是 October。", { id: "en-u5-02", topic: "Unit 5 月份", type: "choice", choices: ["August", "October", "November", "December"] })
    },
    {
      id: "en-u6-01", topic: "Unit 6 将来时", difficulty: 1, type: "choice",
      prompt: "I'll ___ a beautiful card for my mother.",
      choices: ["make", "makes", "made", "making"], answer: "make",
      explanation: "I'll 是 I will 的缩写，will 后面接动词原形 make。",
      transfer: transfer("He will ___ some flowers for Mum.", "buy", "will 后面接动词原形 buy。", { id: "en-u6-01", topic: "Unit 6 将来时", type: "choice", choices: ["buy", "buys", "bought", "buying"] })
    },
    {
      id: "en-u6-02", topic: "Unit 6 节日表达", difficulty: 2, type: "input",
      prompt: "把“I will”写成缩写形式。",
      answer: ["I'll", "i'll", "I’ll", "i’ll"], explanation: "I will 的缩写是 I'll。撇号表示省略了字母 wi。",
      transfer: transfer("把“she will”写成缩写形式。", ["she'll", "She'll", "she’ll", "She’ll"], "she will 的缩写是 she'll。", { id: "en-u6-02", topic: "Unit 6 节日表达", type: "input" })
    },
    {
      id: "en-u7-01", topic: "Unit 7 地点", difficulty: 1, type: "choice",
      prompt: "There ___ a post office near my school.",
      choices: ["is", "are", "am", "be"], answer: "is",
      explanation: "a post office 是单数，所以用 There is。复数名词前用 There are。",
      transfer: transfer("There ___ two shops near the park.", "are", "two shops 是复数，所以用 There are。", { id: "en-u7-01", topic: "Unit 7 地点", type: "choice", choices: ["is", "are", "am", "was"] })
    },
    {
      id: "en-u7-02", topic: "Unit 7 方位", difficulty: 2, type: "matching",
      prompt: "Match the position words.",
      pairs: [{ left: "near", right: "在……附近" }, { left: "beside", right: "在……旁边" }, { left: "between", right: "在……之间" }],
      answer: "pairs", explanation: "方位词要放进完整场景里记：The shop is near the school. 商店在学校附近。",
      transfer: transfer("The bank is ___ the hotel and the cinema.", "between", "between A and B 表示“在 A 和 B 之间”。", { id: "en-u7-02", topic: "Unit 7 方位", type: "choice", choices: ["between", "kind", "first", "yesterday"] })
    },
    {
      id: "en-u8-01", topic: "Unit 8 问路", difficulty: 1, type: "choice",
      prompt: "别人问路时，“一直往前走”怎样说？",
      choices: ["Go straight.", "Turn left.", "Sit down.", "Come back."], answer: "Go straight.",
      explanation: "Go straight. 表示“一直走”。Turn left/right 表示“向左/右转”。",
      transfer: transfer("“在第二个路口右转”怎样说？", "Turn right at the second crossing.", "turn right 是右转，at the second crossing 是在第二个路口。", { id: "en-u8-01", topic: "Unit 8 问路", type: "choice", choices: ["Turn right at the second crossing.", "Go left yesterday.", "There are two rights.", "Show the second hotel."] })
    },
    {
      id: "en-u8-02", topic: "Unit 8 问路", difficulty: 2, type: "choice",
      prompt: "—Can you show me the way to the hotel? —___",
      choices: ["Sure.", "I'm a hotel.", "It was first.", "Don't birthday."], answer: "Sure.",
      explanation: "Sure. 表示“当然可以”，是答应帮助别人时常用的回答。",
      transfer: transfer("Which sentence is used to ask the way?", "How can I get to the park?", "How can I get to...? 是常见的问路句型。", { id: "en-u8-02", topic: "Unit 8 问路", type: "choice", choices: ["How can I get to the park?", "When's your birthday?", "Who was first?", "What did you make?"] })
    },
    {
      id: "en-u9-01", topic: "Unit 9 品质", difficulty: 1, type: "choice",
      prompt: "He is kind ___ children.",
      choices: ["to", "at", "in", "from"], answer: "to",
      explanation: "固定搭配 be kind to sb. 表示“对某人友善”。",
      transfer: transfer("She is friendly ___ everyone.", "to", "be friendly to sb. 表示“对某人友好”。", { id: "en-u9-01", topic: "Unit 9 品质", type: "choice", choices: ["to", "on", "with", "by"] })
    },
    {
      id: "en-u9-02", topic: "Unit 9 人物描述", difficulty: 2, type: "matching",
      prompt: "Match the words with their meanings.",
      pairs: [{ left: "kind", right: "友善的" }, { left: "friendly", right: "友好的" }, { left: "smart", right: "聪明的" }],
      answer: "pairs", explanation: "描述人物品质时，可用 He/She is + 形容词。注意不要把品质词和外貌词混淆。",
      transfer: transfer("“她对老人很友善”最合适的表达是？", "She is kind to old people.", "be kind to sb. 是固定搭配。", { id: "en-u9-02", topic: "Unit 9 人物描述", type: "choice", choices: ["She is kind to old people.", "She kind old people.", "She is old to kind.", "She was people kind."] })
    },
    {
      id: "en-u10-01", topic: "Unit 10 一般过去时", difficulty: 1, type: "choice",
      prompt: "—Where ___ you yesterday? —I was at home.",
      choices: ["were", "was", "are", "is"], answer: "were",
      explanation: "yesterday 表示过去；主语是 you，be 动词过去式用 were。",
      transfer: transfer("She ___ at school yesterday.", "was", "主语 She 是第三人称单数，过去式用 was。", { id: "en-u10-01", topic: "Unit 10 一般过去时", type: "choice", choices: ["was", "were", "is", "are"] })
    },
    {
      id: "en-u10-02", topic: "Unit 10 地点", difficulty: 2, type: "truefalse",
      prompt: "判断：回答“Where were you yesterday?”可以说“I was at the library.”",
      choices: ["正确", "错误"], answer: "正确",
      explanation: "问句询问昨天在哪里，I was at the library. 用过去式回答地点，结构正确。",
      transfer: transfer("—Where was Peter yesterday? —___", "He was at the park.", "Peter 用 he 指代，过去式用 was。", { id: "en-u10-02", topic: "Unit 10 地点", type: "choice", choices: ["He was at the park.", "He were at the park.", "He is tomorrow.", "He at park."] })
    },
    {
      id: "en-u11-01", topic: "Unit 11 序数词", difficulty: 1, type: "matching",
      prompt: "Match the ordinal numbers.",
      pairs: [{ left: "first", right: "第一" }, { left: "second", right: "第二" }, { left: "third", right: "第三" }],
      answer: "pairs", explanation: "first、second、third 是三个特殊的序数词，不能直接在基数词后加 -th，要单独记。",
      transfer: transfer("Who was ___ in the race?（谁在比赛中得了第一？）", "first", "“第一”用序数词 first。", { id: "en-u11-01", topic: "Unit 11 序数词", type: "choice", choices: ["first", "one", "four", "before"] })
    },
    {
      id: "en-u11-02", topic: "Unit 11 比赛", difficulty: 2, type: "choice",
      prompt: "Amy was first. Lingling was second. Who won the race?",
      choices: ["Amy", "Lingling", "Both", "We don't know"], answer: "Amy",
      explanation: "first 是第一名，因此 Amy won the race。读英语题先抓人物和顺序词。",
      transfer: transfer("Tom was third. Peter was second. Who was before Tom?", "Peter", "second 在 third 前面，所以 Peter was before Tom。", { id: "en-u11-02", topic: "Unit 11 比赛", type: "choice", choices: ["Peter", "Tom", "Both", "Nobody"] })
    },
    {
      id: "en-u12-01", topic: "Unit 12 过去式", difficulty: 1, type: "matching",
      prompt: "Match the verbs with their past forms.",
      pairs: [{ left: "go", right: "went" }, { left: "see", right: "saw" }, { left: "do", right: "did" }],
      answer: "pairs", explanation: "went、saw、did 都是不规则过去式，需要成组记忆：go-went，see-saw，do-did。",
      transfer: transfer("What is the past form of “have”?", "had", "have 的过去式是不规则变化 had。", { id: "en-u12-01", topic: "Unit 12 过去式", type: "choice", choices: ["had", "haved", "has", "having"] })
    },
    {
      id: "en-u12-02", topic: "Unit 12 旅行", difficulty: 2, type: "choice",
      prompt: "—Where did you go? —I ___ to Changsha.",
      choices: ["went", "go", "goes", "going"], answer: "went",
      explanation: "问句用 did 表示过去，回答描述已经发生的旅行，用 go 的过去式 went。",
      transfer: transfer("—What did you do there? —I ___ a museum.", "visited", "visit 的过去式是规则变化 visited。", { id: "en-u12-02", topic: "Unit 12 旅行", type: "choice", choices: ["visited", "visit", "visits", "visiting"] })
    }
  ]
};

// 第二轮新增：避坑题与多选、排序、改错题。
window.QUESTION_BANK.chinese.push(
  {
    id: "cn-trap-01", topic: "人物描写", difficulty: 2, type: "multiselect",
    prompt: "下面哪些句子主要运用了动作描写？（多选）",
    choices: ["他攥紧试卷，快步跑出教室。", "她想：我一定要再检查一遍。", "“我来试试！”他大声说。", "他弯下腰，轻轻扶起倒下的自行车。"],
    answer: ["他攥紧试卷，快步跑出教室。", "他弯下腰，轻轻扶起倒下的自行车。"],
    explanation: "“攥紧、跑出、弯下、扶起”都是看得见的动作。心里想的是心理描写，说出口的是语言描写。坑在于一句话里有人物，不等于就是动作描写。",
    transfer: transfer("“她低下头，手指不停地绞着衣角。”主要是什么描写？", "动作描写", "“低下、绞着”都是人物动作。", { id: "cn-trap-01", topic: "人物描写", type: "choice", choices: ["动作描写", "心理描写", "环境描写", "说明方法"] })
  },
  {
    id: "cn-order-01", topic: "汉字演变", difficulty: 2, type: "ordering",
    prompt: "按汉字字体出现的大致先后顺序排列。",
    items: ["甲骨文", "金文", "小篆", "隶书", "楷书"],
    answer: ["甲骨文", "金文", "小篆", "隶书", "楷书"],
    explanation: "主线是甲骨文→金文→小篆→隶书→楷书。注意：不是看哪个字写起来更复杂，而是看历史先后。",
    transfer: transfer("小篆之后、楷书之前的字体是哪一种？", "隶书", "演变主线中，小篆后面是隶书，再后面是楷书。", { id: "cn-order-01", topic: "汉字演变", type: "choice", choices: ["甲骨文", "金文", "隶书", "草书"] })
  },
  {
    id: "cn-correction-01", topic: "文言文", difficulty: 2, type: "correction",
    prompt: "改错：“梁国杨氏子九岁，甚聪惠”中的“惠”同“会”。请写出正确的通假字解释。",
    answer: ["惠同慧", "惠同“慧”", "惠通慧", "惠通“慧”"],
    explanation: "“惠”同“慧”，表示聪明。坑在于“惠”和“会”读音接近，但教材注释依据的是字义。",
    transfer: transfer("“孔君平诣其父”中“诣”的正确意思是什么？", ["拜访", "拜见"], "“诣”在这里是拜访。", { id: "cn-correction-01", topic: "文言文", type: "input" })
  },
  {
    id: "cn-trap-02", topic: "阅读证据", difficulty: 3, type: "multiselect",
    prompt: "要证明一个人物“沉着果断”，下面哪些材料可以作为直接证据？（多选）",
    choices: ["危险发生时迅速想出办法", "他的名字有三个字", "下命令时清楚而坚定", "故事一共有六个自然段"],
    answer: ["危险发生时迅速想出办法", "下命令时清楚而坚定"],
    explanation: "人物品质必须由言行和事件证明。名字长度、自然段数量与“沉着果断”没有关系。",
    transfer: transfer("概括人物品质后，还应该补上什么，答案才有根据？", "文中的具体言行或事件", "观点后面要有文本证据。", { id: "cn-trap-02", topic: "阅读证据", type: "choice", choices: ["文中的具体言行或事件", "文章页码", "插图颜色", "自己的猜测"] })
  }
);

window.QUESTION_BANK.math.push(
  {
    id: "ma-trap-01", topic: "因数与倍数", difficulty: 2, type: "multiselect",
    prompt: "下面哪些数是 12 的因数？（多选）",
    choices: ["1", "2", "3", "4", "5", "6", "8", "12"],
    answer: ["1", "2", "3", "4", "6", "12"],
    explanation: "因数必须能把 12 整除。5 和 8 都不能整除 12。容易漏掉的坑是：1 和 12 本身也都是 12 的因数。",
    transfer: transfer("下面哪个数不是 18 的因数？", "4", "18÷4 不能整除；1、3、6 都能整除 18。", { id: "ma-trap-01", topic: "因数与倍数", type: "choice", choices: ["1", "3", "4", "6"] })
  },
  {
    id: "ma-trap-02", topic: "单位辨析", difficulty: 2, type: "choice",
    prompt: "一个长方体纸盒的“占地大小”应该用哪个单位表示？",
    choices: ["cm", "cm²", "cm³", "L"], answer: "cm²",
    explanation: "“占地大小”问的是底面的面积，所以用 cm²。cm 是长度，cm³ 和 L 表示体积或容积。坑在于看到长方体就急着选 cm³。",
    transfer: transfer("一个粉笔盒能装多少粉笔，描述它的容积可用哪个单位？", "cm³", "容积表示能装多少，是三维大小，可用 cm³。", { id: "ma-trap-02", topic: "单位辨析", type: "choice", choices: ["cm", "cm²", "cm³", "kg"] })
  },
  {
    id: "ma-order-01", topic: "分数比较", difficulty: 2, type: "ordering",
    prompt: "把下面三个分数从小到大排列。",
    items: ["1/2", "2/3", "3/4"], answer: ["1/2", "2/3", "3/4"],
    explanation: "通分到 12：1/2=6/12，2/3=8/12，3/4=9/12，所以依次增大。不能只比较分子或只比较分母。",
    transfer: transfer("比较 3/5 和 2/3，较小的是哪一个？", "3/5", "通分到 15：3/5=9/15，2/3=10/15，所以 3/5 较小。", { id: "ma-order-01", topic: "分数比较", type: "choice", choices: ["3/5", "2/3", "一样大", "无法比较"] })
  },
  {
    id: "ma-correction-01", topic: "异分母加法", difficulty: 2, type: "correction",
    prompt: "改错：1/2＋1/3＝2/5。请写出正确结果（最简分数）。",
    answer: ["5/6"],
    explanation: "异分母不能把分子、分母分别相加。先通分：1/2=3/6，1/3=2/6，所以结果是 5/6。",
    transfer: transfer("计算：1/4＋1/2＝？", ["3/4", "0.75"], "把 1/2 通分成 2/4，再与 1/4 相加得到 3/4。", { id: "ma-correction-01", topic: "异分母加法", type: "input" })
  },
  {
    id: "ma-trap-03", topic: "质数与合数", difficulty: 1, type: "truefalse",
    prompt: "判断：1 只有一个因数，所以 1 是质数。",
    choices: ["正确", "错误"], answer: "错误",
    explanation: "质数必须“只有 1 和它本身两个不同的因数”。1 只有一个因数，因此既不是质数，也不是合数。",
    transfer: transfer("最小的质数是多少？", "2", "2 的因数只有 1 和 2，它也是唯一的偶质数。", { id: "ma-trap-03", topic: "质数与合数", type: "choice", choices: ["0", "1", "2", "3"] })
  }
);

window.QUESTION_BANK.english.push(
  {
    id: "en-multi-01", topic: "be going to", difficulty: 2, type: "multiselect",
    prompt: "Which sentences are correct?（多选）",
    choices: ["I am going to read a story.", "He is going to play football.", "She going to make a card.", "We are going to doing research."],
    answer: ["I am going to read a story.", "He is going to play football."],
    explanation: "be going to 的结构是“主语＋be＋going to＋动词原形”。第三句缺少 is，第四句的 doing 应改为 do。",
    transfer: transfer("Choose the correct sentence.", "They are going to collect pictures.", "They 后用 are，going to 后用动词原形 collect。", { id: "en-multi-01", topic: "be going to", type: "choice", choices: ["They is going to collect pictures.", "They are going to collecting pictures.", "They are going to collect pictures.", "They going collect pictures."] })
  },
  {
    id: "en-order-01", topic: "Unit 2 调查", difficulty: 2, type: "ordering",
    prompt: "Put the parts in the correct order to make a sentence.",
    items: ["We", "are going to", "do some research", "."],
    answer: ["We", "are going to", "do some research", "."],
    explanation: "英语陈述句通常先放主语 We，再放谓语结构 are going to，最后放动作 do some research。",
    transfer: transfer("Choose the correct sentence.", "We are going to read books.", "主语 We 后用 are，going to 后用动词原形 read。", { id: "en-order-01", topic: "Unit 2 调查", type: "choice", choices: ["We going are to read books.", "We are going to read books.", "Are we read going books.", "We are read to going books."] })
  },
  {
    id: "en-correction-01", topic: "There be 句型", difficulty: 2, type: "correction",
    prompt: "Correct the sentence: There are a post office near my school.",
    answer: ["There is a post office near my school.", "there is a post office near my school"],
    explanation: "a post office 是单数，所以用 There is。不要只看到地点句就固定使用 are。",
    transfer: transfer("There ___ three shops near the park.", "are", "three shops 是复数，所以用 are。", { id: "en-correction-01", topic: "There be 句型", type: "choice", choices: ["is", "are", "was", "am"] })
  },
  {
    id: "en-trap-01", topic: "一般过去时", difficulty: 2, type: "choice",
    prompt: "Which sentence is correct?",
    choices: ["Where did you went?", "Where did you go?", "Where do you went?", "Where were you go?"],
    answer: "Where did you go?",
    explanation: "did 已经表示过去，后面的动词要恢复原形 go。常见坑是把 did 和 went 同时放进一句话。",
    transfer: transfer("What did she ___ yesterday?", "do", "did 后面使用动词原形 do。", { id: "en-trap-01", topic: "一般过去时", type: "choice", choices: ["do", "did", "does", "doing"] })
  },
  {
    id: "en-multi-02", topic: "一般过去时", difficulty: 3, type: "multiselect",
    prompt: "Which sentences talk about the past correctly?（多选）",
    choices: ["I was at home yesterday.", "She visited a museum last Sunday.", "He go to Changsha yesterday.", "They were in the library."],
    answer: ["I was at home yesterday.", "She visited a museum last Sunday.", "They were in the library."],
    explanation: "was、visited、were 都是过去式。第三句有 yesterday，但动词 go 没变成 went，这是时间词与动词不一致的坑。",
    transfer: transfer("He ___ to Beijing last week.", "went", "last week 表示过去，go 的过去式是 went。", { id: "en-multi-02", topic: "一般过去时", type: "choice", choices: ["go", "goes", "went", "going"] })
  }
);
