# Every Idea Counts — 统一开发文档（v2.0 两模式版）

版本：v2.0（两模式设计）
创建日期：2026-03-06
更新说明：从5阶段状态机改为两模式捕获（快速记录/深入孵化）
> **状态**: ✅ 当前版本

---

## 1. 产品概述

### 1.1 核心理念

"Every idea counts"——每个想法都值得被认真对待，不应只停留在备忘录里被遗忘。

### 1.2 设计原则（v2.0 核心）

- **简易**：降低使用门槛，默认"快速记录"，一键生成笔记
- **快速**：最小化 API 调用，快速记录和深入孵化都只需 1 次 API 调用

### 1.3 目标用户

- 创业者：验证商业想法，快速原型思考
- 创作者：捕捉创作灵感，深化创意概念
- 学生：记录学习洞察，结构化知识体系

### 1.4 核心价值

- 从捕获到笔记：不只是记录，而是让想法结构化
- AI 协作补足：填补用户思维盲区，提出关键问题
- 结构化输出：将散乱想法转化为可行动的笔记

---

## 2. 关键用户旅程（v2.0）

### 2.1 快速记录模式（默认）

```
用户输入想法 → 选择类型 → 点击"记录想法"
    ↓
显示加载动画
    ↓
1次 API 调用（ai_extract_note）
    ↓
跳转到想法详情页，显示笔记
    ↓
[编辑笔记] [继续深入挖掘] [完成]
```

### 2.2 深入孵化模式

```
用户输入想法 → 选择类型 → 切换到"深入孵化"标签
    ↓
显示3个问题表单（前端静态，无 API）
    ↓
用户填写答案
    ↓
点击"生成笔记"
    ↓
1次 API 调用（ai_extract_note）
    ↓
跳转到想法详情页，显示笔记
    ↓
[编辑笔记] [继续深入挖掘] [完成]
```

### 2.3 继续深入挖掘（笔记后）

```
点击"继续深入挖掘"
    ↓
进入自由对话模式（复用 ai_ask）
    ↓
用户提问 → AI 回答 → 循环
    ↓
点击"更新笔记"
    ↓
1次 API 调用（ai_extract_note，追加模式）
    ↓
笔记追加新内容
```

### 2.4 想法库管理

1) 列表卡片展示全部想法
2) 按状态筛选、全文搜索、排序
3) 批量归档/删除
4) 导出（Markdown/HTML）

---

## 3. 功能规格（v2.0）

### 3.1 捕获页面（Capture Page）

#### 3.1.1 界面结构

```
┌─────────────────────────────────────┐
│  [快速记录] [深入孵化]               │  ← 标签切换（默认：快速记录）
├─────────────────────────────────────┤
│ 想法类型: [产品 ▼] [创作] [研究]    │  ← 类型选择器
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 输入你的想法...                  │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│     [记录想法 →]                     │  ← 主按钮
└─────────────────────────────────────┘
```

#### 3.1.2 快速记录模式

- **特点**：默认模式，最低门槛
- **流程**：输入 → 类型选择 → 记录 → 笔记生成
- **API 调用**：1次（ai_extract_note）
- **输入要求**：最少1行文字

#### 3.1.3 深入孵化模式

- **特点**：可选模式，更结构化
- **流程**：输入 → 类型选择 → 3个问题 → 生成笔记
- **API 调用**：1次（ai_extract_note）
- **问题来源**：前端静态，无 AI 调用

### 3.2 类型特定问题（深入模式）

#### 产品想法

| 问题 | 目的 | 对应笔记字段 |
|------|------|-------------|
| Q1: 这个想法为哪些用户解决什么问题？ | 明确用户和痛点 | 目标用户、解决的问题 |
| Q2: 用户在什么场景下会使用？ | 具体化使用情境 | 核心概念、独特价值 |
| Q3: 他们现在怎么解决这个问题？ | 了解现状和竞品 | 独特价值、关键洞察 |

#### 创作想法

| 问题 | 目的 | 对应笔记字段 |
|------|------|-------------|
| Q1: 主题或核心信息是什么？ | 明确创作核心 | 核心概念 |
| Q2: 目标受众是谁？为什么感兴趣？ | 定义受众 | 目标用户 |
| Q3: 有什么参考作品或灵感来源？ | 寻找参照 | 独特价值、关键洞察 |

#### 研究想法

| 问题 | 目的 | 对应笔记字段 |
|------|------|-------------|
| Q1: 想探索或验证什么问题？ | 明确研究问题 | 解决的问题、核心概念 |
| Q2: 打算用什么方法研究？ | 确定方法 | 行动项 |
| Q3: 已有相关研究有哪些？ | 了解现状 | 待探索问题、关键洞察 |

### 3.3 笔记生成（Note Generation）

#### 3.3.1 统一笔记模板

```markdown
# [AI 生成的标题]

## 💡 核心概念
[1-2 句话总结核心理念]

## 🎯 解决的问题
[具体描述要解决的痛点]

## 👥 目标用户
[用户画像描述]

## ✨ 独特价值
[与竞品的差异化]

## 🔍 关键洞察
[对话中产生的深度思考]

## ❓ 待探索问题
[需要进一步验证的假设]

## 📋 行动项
- [ ] 具体可执行的下一步（≤15分钟）
- [ ] 需要调研的信息（调研/验证导向）

---
*创建时间：{timestamp}*
*标签：{auto-generated tags}*
```

#### 3.3.2 生成规则

- **快速模式**：AI 基于单行输入推断和扩展
- **深入模式**：AI 整合原始输入和3个问题答案
- **追加规则**：再次生成追加到末尾，不覆盖原有内容
- **行动项要求**：至少1条 ≤15分钟 + 1条调研/验证

### 3.4 继续深入挖掘（Continue Digging）

- **触发**：笔记生成后点击"继续深入挖掘"按钮
- **模式**：自由对话，复用 ai_ask Edge Function
- **更新笔记**：对话结束后点击"更新笔记"，追加新洞察

### 3.5 想法库管理（Idea Library）

- 列表视图：卡片式展示所有想法
- 状态筛选：`draft` / `incubating` / `completed` / `archived`
- 搜索：全文搜索
- 排序：创建时间、更新时间
- 批量操作：批量归档、批量删除
- 回顾机制：每周回顾视图，按最久未更新排序

---

## 4. 数据模型（v2.0）

### 4.1 ideas 表

```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  
  -- 基础字段
  idea_type TEXT NOT NULL DEFAULT 'product'
    CHECK (idea_type IN ('product', 'creative', 'research')),
  title TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'incubating', 'completed', 'archived')),
  
  -- v2.0 新增字段
  capture_mode TEXT DEFAULT 'quick'
    CHECK (capture_mode IN ('quick', 'deep')),
  deep_answers JSONB DEFAULT NULL,
  
  -- 笔记字段
  final_note TEXT,
  
  -- v1 兼容字段（保留但不主动使用）
  current_state TEXT DEFAULT NULL,
  turn_count_in_state INTEGER DEFAULT 0,
  collected JSONB DEFAULT NULL,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_ideas_owner_updated ON ideas(owner_id, updated_at);
CREATE INDEX idx_ideas_owner_status ON ideas(owner_id, status);

-- RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own ideas" ON ideas
  FOR ALL USING (owner_id = auth.uid());
```

### 4.2 状态流转

```
draft ──[生成笔记]──▶ incubating ──[保存笔记]──▶ completed
  │                                               │
  └──[直接归档]───────────────────────────────────┴──[归档]──▶ archived
```

---

## 5. API 设计（v2.0）

### 5.1 ai_extract_note（核心）

**请求**：
```typescript
interface ExtractNoteRequest {
  idea_id: string
  idea_type: 'product' | 'creative' | 'research'
  raw_input: string
  timestamp: string
  
  // v2.0 新增
  capture_mode: 'quick' | 'deep'
  deep_answers?: {
    q1: string
    q2: string
    q3: string
  }
  
  // v1 兼容
  collected?: Record<string, unknown>
}
```

**响应**：
```typescript
interface ExtractNoteResponse {
  markdown: string
}
```

### 5.2 ai_ask（继续深入挖掘）

**请求**：
```typescript
interface AskRequest {
  idea_id: string
  idea_type: 'product' | 'creative' | 'research'
  raw_input: string
  current_note: string
  user_question: string
}
```

**响应**：
```typescript
interface AskResponse {
  answer: string  // 最多3句，不反问
}
```

### 5.3 废弃 API

- ~~`ai_router`~~：不再需要，深入模式问题为前端静态

---

## 6. Prompt 设计（v2.0）

### 6.1 快速记录模式 Prompt

```text
You are an expert product/creative/research assistant for Every Idea Counts.
Return ONLY Markdown. No JSON, no code fences, no extra commentary.

Based on the user's brief idea input, INFER and EXPAND the following:
- Target users and their pain points
- Usage scenarios
- Current alternatives and solutions
- Unique value proposition

Use the exact template structure and headings (including emoji) below.
Fill all sections with concrete, concise content.

Action items must include at least 2 checkbox items:
- First item is a quick win that can be done in <= 15 minutes (state the minutes explicitly).
- Second item must be research/validation oriented.
Generate 3-5 short tags in the tags line.

Template:
# [AI 生成的标题]

## 💡 核心概念
[1-2 句话总结核心理念]

## 🎯 解决的问题
[具体描述要解决的痛点]

## 👥 目标用户
[用户画像描述]

## ✨ 独特价值
[与竞品的差异化]

## 🔍 关键洞察
[基于想法推断的深度思考]

## ❓ 待探索问题
[需要进一步验证的假设]

## 📋 行动项
- [ ] 具体可执行的下一步
- [ ] 需要调研的信息

---
*创建时间：{timestamp}*
*标签：tag1, tag2, tag3*

Input:
idea_type: {idea_type}
raw_input: {raw_input}
capture_mode: quick
```

### 6.2 深入孵化模式 Prompt

```text
You are an expert product/creative/research assistant for Every Idea Counts.
Return ONLY Markdown. No JSON, no code fences, no extra commentary.

The user has provided detailed answers to 3 clarifying questions.
Generate a comprehensive note based on BOTH the raw idea AND the user's answers.

Use the exact template structure and headings (including emoji) below.
Fill all sections with concrete, concise content based on ALL inputs.

Action items must include at least 2 checkbox items:
- First item is a quick win that can be done in <= 15 minutes (state the minutes explicitly).
- Second item must be research/validation oriented.
Generate 3-5 short tags in the tags line.

Template:
# [AI 生成的标题]

## 💡 核心概念
[1-2 句话总结核心理念]

## 🎯 解决的问题
[具体描述要解决的痛点]

## 👥 目标用户
[用户画像描述，基于用户回答]

## ✨ 独特价值
[与竞品的差异化，基于用户对现状的了解]

## 🔍 关键洞察
[综合用户答案提炼的深度思考]

## ❓ 待探索问题
[需要进一步验证的假设]

## 📋 行动项
- [ ] 具体可执行的下一步
- [ ] 需要调研的信息

---
*创建时间：{timestamp}*
*标签：tag1, tag2, tag3*

Input:
idea_type: {idea_type}
raw_input: {raw_input}
capture_mode: deep

User Answers:
Q1: {deep_answers.q1}
Q2: {deep_answers.q2}
Q3: {deep_answers.q3}
```

---

## 7. 技术架构（v2.0）

### 7.1 整体架构

```
Frontend (React PWA)
    │
    ├── 快速记录 → ai_extract_note (1次)
    ├── 深入孵化 → 3问题(前端) → ai_extract_note (1次)
    └── 继续挖掘 → ai_ask (N次) → 更新笔记
    │
    └──→ Supabase (PostgreSQL + RLS)
```

### 7.2 技术栈

- 前端框架：React 18 + TypeScript + Vite
- 样式：Inline styles（无 CSS 框架）
- 状态管理：Zustand + localStorage
- 后端：Supabase（Auth + PostgreSQL + RLS + Edge Functions）
- AI：GLM / Qwen API（双供应商，可切换）

---

## 8. 已确认决策（v2.0）

- MVP 平台：Web 优先（PWA）
- 捕获模式：两种（快速记录/深入孵化）
- 默认模式：快速记录
- API 调用：快速1次，深入1次
- 深入问题：前端静态，3个类型特定问题
- AI 成本策略：服务端保存单一 Key
- 用户范围：单用户（你自己用）
- 笔记编辑：Markdown 编辑 + 实时预览
- 笔记再生成：追加到末尾
- 继续深入挖掘：自由对话，更新笔记追加

---

## 9. 迁移计划（v1 → v2）

### 数据迁移

```sql
-- 添加新字段
ALTER TABLE ideas
ADD COLUMN capture_mode VARCHAR(10) DEFAULT 'quick',
ADD COLUMN deep_answers JSONB DEFAULT NULL;

-- 旧数据默认为 quick 模式
UPDATE ideas SET capture_mode = 'quick' WHERE capture_mode IS NULL;
```

### 代码迁移

| 组件 | 状态 | 说明 |
|------|------|------|
| `CapturePage.tsx` | 修改 | 添加两模式UI |
| `IncubationPanel.tsx` | 废弃 | 不再需要5阶段 |
| `NotePanel.tsx` | 修改 | 添加"继续深入挖掘" |
| `ai_router` | 废弃 | 不再需要 |
| `ai_extract_note` | 修改 | 支持两种模式 |
| `ai_ask` | 保留 | 用于继续深入挖掘 |

---

## 10. 成功指标（v2.0）

| 指标 | v1 基线 | v2 目标 |
|------|---------|---------|
| 首次笔记生成时间 | 5分钟+ | <30秒 |
| API 调用次数 | 10次+ | 1次 |
| 用户完成率 | 低 | 高 |
| 深入模式使用率 | N/A | 20-30% |