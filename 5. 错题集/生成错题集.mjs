import { readFileSync, writeFileSync } from 'node:fs';

const DIR = '/Users/admin/openSource/tencent-FDE/6. FDE离线版';
global.window = {};
eval(readFileSync(`${DIR}/bank.js`, 'utf8'));
const B = window.FDE_BANK;
eval(readFileSync(`${DIR}/core.js`, 'utf8'));
const C = globalThis.FDECore;

const srcArg = process.argv[2];
if (!srcArg) { console.error('用法: node 生成错题集.mjs <导出的记录 JSON 路径>（默认取文件中最新一次成绩）'); process.exit(1); }
const payload = JSON.parse(readFileSync(srcArg, 'utf8'));
const recs = (Array.isArray(payload) ? payload : payload.history || []).slice().sort((a, b) => b.submittedAt - a.submittedAt);
if (!recs.length) { console.error('该记录文件里没有成绩。'); process.exit(1); }
const rec = recs[0];
const letters = 'ABCDE';
const qs = B.questions.filter(q => q.paper === rec.paperId);

// 每题错因（人工判读，按题号；新卷子跑出来会显示"待补"，需补写）
const WHY = {
  'FDE-01-02': '被"图像依据"四个字带跑了——那是**样本标注**的作用。关键结果复核盯的是**业务影响**（误检漏检会造成什么后果），不是证据本身。',
  'FDE-01-14': '把"知识未命中"当成了流程问题（节点顺序和分支是**流程错节点**的判据）。未命中只看一件事：目标资料有没有进召回结果。',
  'FDE-01-18': '选了"生成流畅不能单独证明事实真实"——那是**下一 Token 预测**的提示。模型幻觉对应的动作是"重要事实应核对可靠依据"。两者都谈真实性，但一个讲成因、一个讲应对。',
  'FDE-01-19': '题干关键词是**"别称"**——别称命中不了，是同义词配置没做。相似度阈值导致的是"门槛过高时召回接近为空"，跟别称无关。',
  'FDE-01-21': '"共享"两个字把你带到了外部通信审查（核对外发目的范围与授权）。但"测试审核后**按流程**共享"是企业共享审批的标准动作。',
  'FDE-01-22': '选了"切得越小不一定越易理解"——那是**表格切分**的误区。片段重叠调整要解决的是"内容被切断"，所以它的误区是"只改模型语气不能补回被切掉的内容"。',
  'FDE-01-24': '被更"高级"的描述吸引走了。"能利用最近可靠产物继续执行"是**断点恢复**的证据；幂等控制只看一句：重复请求有没有造成重复写入。',
  'FDE-01-25': '变量类型族混淆。"工具调用读取安全保存的凭证"是**环境变量**；系统变量是平台给的节点取当前用户问题这类运行信息。',
  'FDE-01-27': '保险案例内的检查项混淆。"核对规则符合性"是**产品规则资料**的检查；专业审核查的是**越权承诺**（有没有承诺了不该承诺的东西）。',
  'FDE-01-28': '授权原则族混淆。"当前功能实际需要哪些授权"是**最小权限**；权限复审查的是**当前角色与历史授权是否一致**（时间维度上的漂移）。',
  'FDE-01-29': '被"稳定"两个字带走。"探索任务已反复稳定"是另一个分期场景；"已具备资料的稳定问题"指的是**资料成熟而接口未就绪**。',
  'FDE-01-30': '同名诱惑：选项 C「需要完整方案设计的任务」看着就该归方案设计 Agent，但课程里那是**行业调研 Agent**；方案设计 Agent 转交的是"需要交付风险审核的方案"。',
  'FDE-01-32': '模型类型族混淆。"多模态阅读理解模型"管的是图文知识理解；**思考模型**才决定用户需求理解和处理方向。',
  'FDE-01-35': '选了更"保守"的那个：说明边界并引导专业咨询是**健康咨询助手**的处理。保险建议书是在产品规则内可做的，所以是"按产品规则组织并审核"。责任 AI 不是一律劝退。',
  'FDE-01-36': '被具体画面感吸引。"形成可继续编辑的页面草稿"是 **HTML 物料生成**；Claw 能力配置的目标是"为开放任务提供执行条件"。',
  'FDE-01-41': '多勾了 D。"空闲时单用户结果可替代目标峰值下的性能测试"是典型**以偏概全**——单用户数据永远替代不了峰值压测。看到"可替代"就应警惕。',
  'FDE-01-45': '多勾了 B。"模型生成的逼真效果数字可以作为真实业绩"直接违背**真实性**原则。这类选项荒谬度其实很高，扫一眼就该否掉。',
  'FDE-01-50': '多勾了 C。"检索后丢弃片段仍能保证回答依托该片段"**自相矛盾**——前提都丢了，结论怎么依托。看到这种自打嘴巴的表述直接排除。',
  'FDE-01-55': '多勾了 C。课程明确把**智能工作台**与应用运行模式区别说明，它不是"第五种运行模式"，而是自然语言创建任务的入口。概念越界型干扰。',
  'FDE-01-56': '多勾了 B。"自动裁判得分不能由业务人员复核或标注"是**否定式干扰**——把正确做法反过来写。人工标注恰恰是用来复核自动评价结果的。',
};

const wrong = [];
for (const q of qs) {
  const sel = rec.answers[q.id] || [];
  if (!sel.length || !C.equal(sel, q.answer)) wrong.push({ q, sel });
}
wrong.sort((a, b) => a.q.id.localeCompare(b.q.id));

const catName = id => (C.categories.find(c => c.id === id) || {}).name;
const srcOf = q => (q.sources || []).map(id => B.sources[id]).filter(Boolean);
const dedupeSrc = list => { const seen = new Set(); return list.filter(s => !seen.has(s.title + s.url) && seen.add(s.title + s.url)); };
// 选项整体较短时附原文，较长（多选常见）时只给字母，避免一行撑爆
const optText = (q, idxs) => {
  if (!idxs.length) return '（未作答）';
  const withText = q.options.every(o => o.length <= 24);
  return withText
    ? idxs.map(i => `${letters[i]}. ${q.options[i]}`).join('　／　')
    : idxs.map(i => letters[i]).join('、');
};

const pad = String(rec.paperId).padStart(2, '0');
const L = [];
L.push(`# FDE 离线版 · 模拟试卷 ${pad} 错题集`);
L.push('');
L.push(`> 题库版本 \`${B.version}\`｜记录文件 \`${srcArg.split('/').pop()}\``);
L.push(`> 成绩 **${rec.score} / 100**（通过线 70）｜用时 ${Math.round(rec.duration / 60000)} 分钟｜答对 ${qs.length - wrong.length} / ${qs.length}`);
L.push(`> 下面 ${wrong.length} 道为全部答错题目，按卷内题号顺序排列。`);
L.push('');
L.push('---');
L.push('');

wrong.forEach(({ q, sel }, i) => {
  L.push(`## ${i + 1}. ${q.id} · ${q.type === 'single' ? '单选' : '多选'} ${q.points} 分 · ${catName(q.category)}`);
  L.push('');
  L.push(`**📋 原题** ${q.stem}`);
  L.push('');
  q.options.forEach((o, j) => L.push(`- ${letters[j]}. ${o}`));
  L.push('');
  L.push(`**❌ 你的选项** ${optText(q, sel)}`);
  L.push('');
  L.push(`**✅ 正确选项** ${optText(q, q.answer)}`);
  L.push('');
  L.push(`**💡 分析** ${WHY[q.id] || '（待补）'}`);
  L.push('');
  const src = dedupeSrc(srcOf(q));
  if (src.length) {
    const local = s => `../6.%20FDE离线版/course/第${s.localChapter}章.html#${s.anchor}`;
    L.push('**🔗 资料来源** ' + src.map(s => `${s.section}《${s.title}》 — [本地章节](${local(s)}) · [在线](${s.url})`).join('　｜　'));
  } else {
    L.push('**🔗 资料来源** ——');
  }
  L.push('');
  L.push('---');
  L.push('');
});

// 未答题目（有则附在最后）
const blanks = qs.filter(q => !(rec.answers[q.id] || []).length);
if (blanks.length) {
  L.push('## 附：未作答题');
  L.push('');
  for (const q of blanks) {
    L.push(`- ${q.id} · ${q.stem}`);
    L.push(`  - 正确选项：${optText(q, q.answer)}`);
  }
  L.push('');
}

const out = `/Users/admin/openSource/tencent-FDE/5. 错题集/FDE离线版-P${pad}错题集.md`;
writeFileSync(out, L.join('\n') + '\n');
console.log(`已生成 ${out}　共 ${L.length} 行，错题 ${wrong.length} 道${blanks.length ? `，未答 ${blanks.length} 道` : ''}`);
