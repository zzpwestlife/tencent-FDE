# 项目长期约定（tencent-FDE）

## 错题集输出格式（用户 2026-09-28 明确指定）

- **按题目顺序**：卷内题号升序排列，**不按知识领域分组**。
- 每题只给 5 个字段，字段标签带 emoji 便于扫读：`📋 原题`（题干 + 选项列表）、`❌ 你的选项`、`✅ 正确选项`、`💡 分析`、`🔗 资料来源`。
- **不要**额外加诊断章节（领域正确率表、规律总结、复习建议）。用户说的是「…即可」——加了他不要的内容等于白做。
- 选项文本 ≤ 24 字时，`【你的/正确选项】`附原文；超长（多选常见）只给字母，避免一行撑爆。
- `【资料来源】`同时给本地章节锚点（`../6.%20FDE离线版/course/第N章.html#anchor`）和在线课程链接。

## 工具

- `5. 错题集/生成错题集.mjs`：`node 生成错题集.mjs <导出的记录 JSON>`，默认取文件中**最新一次**成绩，按 paperId 输出 `FDE离线版-Pxx错题集.md`。
- 脚本内 `WHY` 表是**人工判读的错因**，按题号硬编码，目前只填了 P01 的 20 条。跑新卷子时该字段显示「（待补）」，需要照着题目补写——**这是脚本唯一的非自动环节**。

## 离线版题库（`6. FDE离线版/`）

- 题库版本 `2026-09-11-v2`；入口页是 `FDE课程及模拟测试题.html`（不是 index.html）。
- 加载方式：`global.window={}` + `eval(bank.js)` 拿到 `window.FDE_BANK`；`core.js` 挂在 **`globalThis.FDECore`**（不是 window.FDECore）。
- 记录存 localStorage（前缀 `fde.practice.v2.`），跨机器靠导出/导入 JSON + git。导出文件名 `fde-records-YYYYMMDD-HHmm.json`。
- 合并语义：按记录 id 去重求并集、题库版本不符则跳过、按 submittedAt 倒序、上限 100 条。导出的是**完整 history 不是增量**，导入最新一份即可。

## 在线版（2026-09-28 已发布）

- 分享链接 https://fde-practice-bank.app.workbuddy.host/ ，appId `wbapp_pTmIyRC93Z7Ncou60qsbYv`。
- **纯静态站，零后端**（`<script>` 加载题库、记录存 localStorage），改完本地文件后**重新发布同一目录即覆盖线上**，链接不变。
- 发布参数：`language`=static，`entryHtml`=`FDE课程及模拟测试题.html`（**必须显式传**，否则自动检测选错），`domainPrefix`=`fde-practice-bank`。117M 全量可传通。
- 发布会把目录里 `fde-records-*.json`（个人答题记录）一并上传，要剔除先移走。
- **站点无鉴权**：拿到链接即可访问，内含 ADP 课程副本（4 章正文 + 266 张课程截图 + 22 套卷）——分享范围自己把握。
- 会话内访问 github.com / `git push` 被代理拦成 502，走 GitHub 路线须用户在自己终端执行。
