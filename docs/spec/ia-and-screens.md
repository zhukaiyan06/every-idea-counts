# Every Idea Counts — 信息架构与关键页面规格（PWA MVP / 单用户）

目标：把 PWA MVP 的页面、导航、状态与关键交互说清楚，确保后续实现不走偏。

已锁定前提（来自融合规格）：
- PWA MVP；单用户；Supabase Auth 仅你可登录
- 捕获入口：仅 PWA（应用内快捷键 + 首页入口）
- 想法类型：捕获时手动选择 `product/creative/research`
- 孵化会话：默认单阶段（1 问 + 可选 1 追问），继续才推进下一阶段
- 编辑：Markdown + 实时预览
- Notion：不直连，仅导出 Markdown/HTML
- 周回顾：每周回顾视图，默认按“最久未更新”优先

---

## 1) 导航与路由（建议）

一级导航（底部 Tab 或侧边栏，取决于屏幕宽度）：
- `Capture`（首页）
- `Library`
- `Weekly Review`
- `Settings`

核心详情页：
- `Idea Detail`（从 Library/Weekly Review 点击进入）

路由示例：
- `/` → 重定向到 `/capture`
- `/capture`
- `/library`
- `/review`
- `/idea/:id`
- `/settings`

---

## 2) 登录与会话

页面：`/login`（如需）
- 单用户策略：仅允许你的邮箱/账号登录
- 登录方式建议：Magic Link（邮箱）

未登录访问策略：
- 进入 `/login`
- 登录成功后回到上次访问的页面

---

## 3) Capture（/capture）

目的：最快创建一个 idea，并立即进入“可推进”的状态。

页面结构：
- 顶部：应用标题 +（可选）本周回顾提示（若到期）
- 类型选择（必填）：
  - Product / Creative / Research（三段切换或下拉）
- 主输入框（必填）：一段话描述想法（Markdown 输入）
- 智能提示（placeholder / helper text）：
  - Product: “这个想法为谁解决什么问题？”
  - Creative: “这条灵感想表达什么？给谁看？”
  - Research: “这个洞察的结论是什么？你想验证什么？”
- 主按钮：`Capture & Start`（创建 idea 并进入孵化）
- 次按钮：`Just Capture`（仅创建 idea，不立刻进入孵化；适合很忙时）

交互：
- 自动草稿：本地保存（刷新不丢）
- 提交成功：
  - 创建 `idea`（status=draft）
  - 若选 `Capture & Start`：跳转 `/idea/:id` 并切到孵化视图，立即发起第一阶段问题
  - 若选 `Just Capture`：跳转 `/library` 并高亮新卡片

错误/边界：
- 离线：仍允许 `Just Capture`（只写本地缓存）；`Capture & Start` 给出“需要联网以使用 AI”提示
- 输入为空：禁用按钮并提示

---

## 4) Idea Detail（/idea/:id）

这是 MVP 的“主战场”：孵化 + 笔记 + 导出。

页面信息区（顶部）：
- 标题（可编辑，默认由 AI 或从 raw_input 抽取）
- 类型标签：Product/Creative/Research
- 状态：draft/incubating/completed/archived
- 快捷操作：Archive / Delete

主体布局（建议两栏，移动端上下）：

A. 孵化区（左或上）
- 进度条：5 阶段（可点击跳转仅用于查看，不用于“跳过完成”）
- 当前阶段卡片：
  - 阶段目标一句话
  - AI 的“当前唯一问题”
- 输入框：用户回答
- 模式切换（MVP）：`Answer` / `Ask AI`
- 按钮：
  - `Send`
  - `Skip`
  - `Generate Note`
  - `Continue`（仅当本阶段被判定“目标达成”或用户主动确认）

对话规则（MVP）：
- 默认会话只推进 1 阶段：完成本阶段后提示“本次已推进 1 步”，提供 `Continue` 进入下一阶段
- AI 一次只问 1 个问题；如果需要追问，最多 1 次追问后必须允许进入下一阶段或生成笔记

异常：
- AI 失败：展示可重试 + 降级策略（你可手动填写该阶段答案并继续）

B. 笔记区（右或下）
- Markdown 编辑器（左）+ 预览（右）
- 顶部按钮：
  - `Save`
  - `Export Markdown`
  - `Export HTML`
  - （可选）`Export PDF`

生成策略：
- `Generate Note` 会根据当前对话历史生成/刷新笔记
- 生成后不覆盖用户手改内容（已选定默认策略）：默认“追加到笔记末尾”（并用分隔线标注生成时间）

---

## 5) Library（/library）

目的：快速找到想法、继续推进、管理归档。

页面组件：
- 搜索框：全文（raw_input + final_note）
- 筛选：状态（draft/incubating/completed/archived）、类型（product/creative/research）、标签
- 排序：
  - 最近更新
  - 最近创建
  - 标题
- 列表：卡片
  - 标题、类型、状态、更新时间、1 行摘要、行动项计数（可选）
- 批量操作：归档/删除

卡片主操作：
- 点击进入 `/idea/:id`
- 快捷按钮：`Continue 1 Step`（直接进入孵化区并开始当前阶段）

---

## 6) Weekly Review（/review）

目的：对抗遗忘，把“最久未更新”的想法拉回来。

页面结构：
- 顶部：本周概览
  - 新增数、完成数、孵化中数
- 主列表：默认只显示 `draft`/`incubating`
- 默认排序：`updated_at` 最早优先（最久未更新）

每条想法提供 3 个快捷动作：
- `Continue 1 Step`
- `Generate Note`
- `Archive`

---

## 7) Settings（/settings）

MVP 必要项：
- AI 供应商选择：GLM/Qwen
- AI 风格参数（最多 1-2 个）：
  - “更犀利/更温和”
  - “更短/更详细”
- 导出默认格式：Markdown/HTML
- 账号：登出

---

## 8) MVP 不做但要预留的扩展点

- 浏览器扩展/桌面壳：全局热键与系统级捕获
- 多用户：配额、计费、Key 管理、权限
- Notion API 直连同步：OAuth、数据映射
