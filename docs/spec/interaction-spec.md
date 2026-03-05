# Every Idea Counts — 交互方案细化（PWA MVP / 单用户）

目的：把关键交互“说死”，让实现阶段不需要再做产品判断。

适用范围：
- PWA MVP
- 单用户（仅你登录）
- 想法类型手动选择：product / creative / research
- 孵化默认单阶段（1 问 + 最多 1 追问），用户点击“继续孵化”才进入下一阶段
- 笔记编辑：Markdown + 实时预览
- 笔记再生成：默认追加到末尾
- 每周回顾：默认按最久未更新排序

---

## 1) 交互基调（必须遵守）

- 快：捕获页从打开到提交不超过 2 次点击
- 短：AI 一次只问 1 个问题；AI 回复不超过 3 句
- 控：任何阶段都能“跳过/先生成笔记/结束本次”
- 推进：每次会话必须留下至少 1 条可执行行动项（生成笔记时保证）

---

## 2) 术语与 UI 文案规范（统一用词）

- 想法（Idea）：一条记录
- 孵化（Incubation）：与 AI 交互推进想法具体化
- 阶段（Stage）：五阶段之一
- 推进 1 步（1 Step）：完成当前阶段并停止（默认）
- 生成笔记（Generate Note）：把 collected/对话映射为 Markdown
- 继续孵化（Continue）：进入下一阶段
- 归档（Archive）：从活跃流中移出，但可搜索

按钮文案统一：
- 主动作：动词 + 结果，例如 `Capture & Start` / `Continue 1 Step` / `Generate Note`
- 次动作：短词，例如 `Skip` / `Save` / `Archive`

Toast（提示）语气：短句、可执行、可撤销（若适用）。

---

## 3) Capture（/capture）交互细化

### 3.1 页面默认状态

- 焦点：进入页面后输入框自动 focus
- 类型选择默认：`product`
- 输入框 placeholder（随类型切换）：
  - product：`用一句话写：为谁，在什么场景，解决什么问题。`
  - creative：`用一句话写：你想表达的核心观点/画面是什么？`
  - research：`用一句话写：你的洞察结论是什么，你想验证什么？`

辅助提示（输入框下方一行，随类型切换）：
  - product：`别写“做个 AI 工具”。写清楚对象和痛点。`
  - creative：`先别追求完美，把“最想说的那句”写出来。`
  - research：`尽量写成可证伪的命题。`

### 3.2 主/次按钮

- 主按钮：`Capture & Start`
  - 条件：类型已选 + 输入非空
  - 结果：创建 idea（status=draft）→ 立刻进入 `/idea/:id` 并开始当前阶段问题（problem_definition）

- 次按钮：`Just Capture`
  - 结果：创建 idea（status=draft）→ 跳转 `/library` 并高亮新卡片

草稿策略：
- 本地自动保存：每 1-2 秒 debounce
- 草稿恢复提示：`已恢复上次未提交内容`（Toast，3 秒）
- 提交后清空草稿

离线策略：
- 离线时 `Capture & Start` 仍可点击，但会在跳转到详情页后提示：
  - Banner：`当前离线：可继续编辑想法，但 AI 孵化需要联网。`
- 离线时 `Just Capture` 正常（仅本地缓存/待同步）

---

## 4) Library（/library）交互细化

### 4.1 搜索与筛选

- 搜索框 placeholder：`搜索想法、笔记、行动项...`
- 默认筛选：状态 = `draft + incubating + completed`（不含 archived）
- archived 单独开关：`Show archived`

### 4.2 卡片信息层级

- 第一行：标题（可为空时显示 `（未命名）`） + 类型 badge + 状态 badge
- 第二行：一行摘要
  - 优先：final_note 的第一行
  - 其次：raw_input
- 右侧/底部：`Updated {relative_time}`

### 4.3 快捷动作

- 主点击：进入 `/idea/:id`
- 快捷按钮（卡片上）：`Continue 1 Step`
  - 行为：进入 `/idea/:id` 并聚焦孵化输入框；自动发起本阶段问题
- 更多菜单：`Archive` / `Delete`

批量操作：
- 进入选择模式按钮：`Select`
- 批量操作：`Archive selected` / `Delete selected`

删除确认：
- 对话框标题：`Delete this idea?`
- 正文：`This can't be undone.`
- 主按钮：`Delete`
- 次按钮：`Cancel`

---

## 5) Weekly Review（/review）交互细化

### 5.1 触发与入口

- 顶部入口：导航 `Weekly Review`
- Capture 页/Library 页可显示小提示（不打断）：
  - `本周回顾已准备好（{count} 条想法）` + `Open`

### 5.2 默认内容

- 只展示：`draft + incubating`
- 默认排序：最久未更新（updated_at 最早优先）

每条 item 固定 3 个动作：
- `Continue 1 Step`
- `Generate Note`
- `Archive`

### 5.3 回顾顶部总结（只做轻量）

- `New this week: {n}`
- `Completed: {n}`
- `Stuck longest: {n}`（可选）

---

## 6) Idea Detail（/idea/:id）交互细化

页面分区：
- Header（元信息 + 快捷动作）
- Incubation（孵化）
- Note（笔记）

### 6.1 Header（元信息）

- 标题默认：
  - 如果 AI 未生成标题：显示 `（未命名）`，点击可改
- 状态展示：`Draft / Incubating / Completed / Archived`
- 快捷动作：`Archive` / `Delete`
- 状态切换规则：
  - 进入孵化时：status → incubating
  - 生成笔记并保存后：status → completed（可手动改回 incubating）

### 6.2 孵化区（Incubation）

#### 6.2.1 进度条

- 展示 5 个阶段名称（短标签）：
  - Problem / Audience / Value / Steps / Risk
- 交互：
  - MVP 默认不可点击跳阶段（避免“跳过思考”）
  - 允许 hover/click 仅展示说明（tooltip）

#### 6.2.2 当前阶段卡片（Stage Card）

显示内容：
- 标题：`Stage {i}/5: {stage_name}`
- 目标一句话（Goal line，随 stage 变化）
- AI 当前唯一问题（question）

Goal line（中文，固定文案）：
- problem_definition：`把想法说清楚：为谁，在什么场景，解决什么。`
- target_audience：`选定第一优先对象：一个具体用户画像。`
- unique_value：`写出对比句：相对现有方案，你到底强在哪。`
- execution_steps：`落到证据：一周内能验证的最小步骤。`
- risk_assessment：`找最大不确定性：怎么最低成本降低它。`

#### 6.2.3 输入与动作

输入框 placeholder（统一）：`用一句话回答，越具体越好。`

按钮（从左到右，主次清晰）：
- 主按钮：`Send`
- 次按钮：`Skip`
- 次按钮：`Generate Note`
- 主按钮（仅在本阶段完成后高亮显示）：`Continue`

键盘操作（MVP 必须支持）：
- `Enter`：发送（当输入框非空且未处于 loading）
- `Shift+Enter`：换行
- `Esc`：关闭错误 Banner（若存在，不影响状态）

默认会话策略（已锁定）：
- 进入页面自动发起当前阶段主问题
- 用户回复后：
  - 若 Router = FOLLOW_UP：AI 追问 1 次
  - 若 Router = ADVANCE：展示下一阶段主问题（但不自动进入下一阶段；需要用户点 Continue）
- 当本阶段已发生 2 次用户回复：不再追问，必须允许 Continue

状态与控件启用/禁用规则（必须遵守）：
- AI 正在生成/网络请求中：
  - 禁用：`Send`、`Skip`、`Continue`（避免状态错乱）
  - 允许：`Generate Note`（但如果生成也依赖 AI，可显示同一 loading 并复用错误处理）
- 输入框为空：禁用 `Send`
- 未达到“本阶段可推进”条件：禁用 `Continue`

“本阶段可推进”条件（MVP 规则）：
- Router 输出 action = `ADVANCE` 时，设置 `stage_ready_to_advance = true`
- 或 turn_count_in_state 已达到 2（强制推进）时，设置 `stage_ready_to_advance = true`

阶段完成反馈：
- Toast：`推进 1 步完成：{stage_name}`
- 文案：`本次已推进 1 步。要继续下一阶段吗？`
- 按钮：`Continue`（主） + `Not now`（次，结束本次会话）

“结束本次会话（Not now）”行为：
- 关闭阶段完成提示
- 保持 current_state 不变（仍停留在当前 state 的“已完成”状态）
- 显示静态提示条：`本阶段已完成。随时点 Continue 进入下一阶段。`

#### 6.2.4 消息编排（非常重要：避免 AI 话痨）

孵化区消息分三类：
- `Coach Question`（AI 的唯一问题）
- `Your Answer`（用户回答）
- `Coach Follow-up`（AI 的唯一追问，最多 1 次）

显示规则（MVP）：
- 仅展示“当前阶段”的最近 1 问 1-2 答（不做长聊天滚动），避免变成聊天应用
- 进入下一阶段后，上一阶段折叠为一行摘要：`Stage {i}: Answer saved`（可展开查看，但默认折叠）

#### 6.2.5 Continue 的语义与确认

当 `stage_ready_to_advance = true` 时：
- Stage Card 底部出现提示：`看起来足够清晰了。`
- `Continue` 按钮高亮（主按钮样式）

点击 `Continue` 行为：
1) 应用侧将 collected[current_state] 写入（保存本阶段的“当前最佳答案”）
2) 将 current_state 切换到 next_state（step_index +1）
3) 自动发起 next_state 的主问题（显示 loading，再渲染 `Coach Question`）
4) 会话结束规则：
   - MVP 默认“单阶段会话”意味着：
     - 如果这是用户本次打开页面后的第一次推进（从 stage i 到 i+1），则立刻弹出提示：
       - 文案：`本次已推进 1 步。要继续孵化下一阶段吗？`
       - 按钮：`Continue`（主） / `Not now`（次）
     - 若选择 Not now：停留在新的阶段（i+1）的主问题已展示，但不强制继续输入

说明：这会导致“Continue -> 进入下一阶段 -> 立刻提示是否继续”。这是刻意设计，用于把会话切短，但又让你能顺滑再走一段。

#### 6.2.6 Skip 的语义

点击 `Skip` 行为：
- 不生成追问
- 在 collected[current_state] 写入：`（待补充：用户选择跳过本阶段）`
- 立即将 `stage_ready_to_advance = true`
- 触发阶段完成反馈（同上）

#### 6.2.7 用户主动提问（Ask AI，MVP 必做）

在输入框上方提供一个小切换（Segmented Control）：
- `Answer`（默认） / `Ask AI`

Ask AI 模式规则：
- 用户输入的是“问题”，AI 回答可以最多 3 句
- AI 回答必须遵守：不反问、不推进阶段、不写入 collected、不生成笔记
- AI 回答后必须自动切回 `Answer` 模式，并重新展示当前阶段的主问题（不改变 stage）

显示规则：
- Ask AI 的问答记录展示在孵化区里，但使用单独的视觉样式（例如更淡的气泡/标记为 `Side Q&A`）
- Ask AI 只保留最近 1 轮（避免聊天化）

禁用规则：
- 当 AI 正在生成时：禁用模式切换
- 离线时：隐藏或禁用 `Ask AI`（并在 tooltip 中解释“需要联网”）

---

#### 6.2.4 AI 失败与降级

- 错误 banner：`AI 暂时不可用。你可以：重试 / 跳过 / 先生成笔记。`
- 按钮：`Retry` / `Skip` / `Generate Note`

超时与重试策略（MVP）：
- 超时阈值：30s（超过则视为失败）
- Retry 行为：重发上一次请求（保持同一 state）

离线提示（MVP）：
- 若检测离线：在孵化区顶部显示 banner：`当前离线：AI 孵化不可用。你仍可编辑笔记或先捕获想法。`
- 离线时禁用：`Send` / `Continue` / `Retry`
- 离线时允许：`Skip` / `Generate Note`（若 Generate Note 依赖 AI，则也禁用并提示）

---

### 6.3 笔记区（Note）

#### 6.3.1 编辑器

- 左：Markdown 编辑
- 右：实时预览

保存按钮：
- 文案：`Save`
- 成功 toast：`Saved`
- 失败 toast：`Save failed. Retry.`

#### 6.3.2 生成笔记（Generate Note）

- 生成时 loading：`Generating...`
- 生成成功：
  - 默认追加到末尾（以分隔线标记）：
    - `---`
    - `AI draft (YYYY-MM-DD HH:mm)`
  - toast：`AI draft appended`

生成失败：
- toast：`Generation failed. Retry.`

#### 6.3.3 导出

- `Export Markdown`：下载 `.md`
- `Export HTML`：下载 `.html`
- PDF（可选，若做）：`Export PDF`

导出成功 toast：`Exported`

---

## 7) 三轨道的“默认问题语气”与 UI 细节

类型 badge 文案：
- product：`Product`
- creative：`Creative`
- research：`Research`

在 Stage Card 的 question 下方显示一行“提问角度提示”（非必须，但能让你感觉更贴合）：
- product：`角度：用户/替代方案/差异化/证据`
- creative：`角度：受众/表达/结构/素材`
- research：`角度：命题/边界/证据/应用`

---

## 8) 通用空状态与错误文案

Library 空状态：
- 标题：`No ideas yet`
- 副文案：`Capture your first idea in 10 seconds.`
- 按钮：`Go to Capture`

Review 空状态：
- 标题：`Nothing to review`
- 副文案：`All caught up. Capture a new idea.`

网络错误（通用）：
- `You're offline. Some features may not work.`

权限错误（Auth 过期）：
- `Session expired. Please sign in again.` + `Sign in`
