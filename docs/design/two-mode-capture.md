# 两模式捕获设计文档

> 版本：2.0
> 日期：2026-03-06
> 状态：✅ 已实现（2026-03-06）
> 
> **实现说明**: Phase 1-2 已完成。CapturePage 已重构为两模式UI，ai_extract_note 已支持 quick/deep 模式。Phase 3（继续深入挖掘）待实现。

## 一、设计目标

### 核心原则
- **简易**：降低使用门槛，默认"快速记录"，一键生成笔记
- **快速**：最小化 API 调用，快速记录和深入孵化都只需 1 次 API 调用

### 与 V1 对比

| 维度 | V1（当前） | V2（新设计） |
|------|-----------|-------------|
| 默认模式 | 强制进入5阶段孵化 | 默认"快速记录" |
| API 调用 | 10次+（每阶段2轮） | 1次（笔记生成） |
| 用户控制 | 被动回答问题 | 主动选择模式 |
| 首次笔记 | 需完成至少1阶段 | 立即可得 |
| 深度思考 | 5阶段相同问题 | 3类各不同问题 |

## 二、用户流程

### 2.1 捕获页面新设计

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

### 2.2 快速记录模式（默认）

```
用户输入 → 选择类型 → 点击记录
    ↓
显示加载动画
    ↓
1次 API 调用（ai_extract_note）
    ↓
跳转到想法详情页，显示笔记
    ↓
[编辑笔记] [继续深入挖掘] [完成]
```

### 2.3 深入孵化模式

```
用户输入 → 选择类型 → 切换到"深入孵化"
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

### 2.4 继续深入挖掘（笔记后）

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

## 三、类型特定问题

### 3.1 产品想法

| 问题 | 目的 | 对应笔记字段 |
|------|------|-------------|
| Q1: 这个想法为哪些用户解决什么问题？ | 明确用户和痛点 | 目标用户、解决的问题 |
| Q2: 用户在什么场景下会使用？ | 具体化使用情境 | 核心概念、独特价值 |
| Q3: 他们现在怎么解决这个问题？ | 了解现状和竞品 | 独特价值、关键洞察 |

### 3.2 创作想法

| 问题 | 目的 | 对应笔记字段 |
|------|------|-------------|
| Q1: 主题或核心信息是什么？ | 明确创作核心 | 核心概念 |
| Q2: 目标受众是谁？为什么感兴趣？ | 定义受众 | 目标用户 |
| Q3: 有什么参考作品或灵感来源？ | 寻找参照 | 独特价值、关键洞察 |

### 3.3 研究想法

| 问题 | 目的 | 对应笔记字段 |
|------|------|-------------|
| Q1: 想探索或验证什么问题？ | 明确研究问题 | 解决的问题、核心概念 |
| Q2: 打算用什么方法研究？ | 确定方法 | 行动项 |
| Q3: 已有相关研究有哪些？ | 了解现状 | 待探索问题、关键洞察 |

## 四、数据结构变更

### 4.1 IdeaRecord 新增字段

```typescript
interface IdeaRecord {
  id: string
  idea_type: 'product' | 'creative' | 'research'
  title: string
  raw_input: string
  status: 'draft' | 'incubating' | 'completed' | 'archived'

  // 新增：捕获模式
  capture_mode?: 'quick' | 'deep'

  // 新增：深入模式问题答案
  deep_answers?: {
    q1: string
    q2: string
    q3: string
  }

  // 保留现有字段
  final_note?: string | null
  collected?: Record<string, string> | null
  current_state?: string | null
  turn_count_in_state?: number | null
  created_at: string
  updated_at: string
}
```

### 4.2 废弃字段

以下字段在 V2 中保留但不再使用：

- `current_state` — 不再需要状态机
- `turn_count_in_state` — 不再需要轮次计数
- `collected` — 被 `deep_answers` 替代

## 五、API 变更

### 5.1 ai_extract_note 修改

**新增参数**：

```typescript
interface ExtractNoteRequest {
  idea_id: string
  idea_type: 'product' | 'creative' | 'research'
  raw_input: string
  timestamp: string

  // 新增
  capture_mode: 'quick' | 'deep'

  // 深入模式必填
  deep_answers?: {
    q1: string
    q2: string
    q3: string
  }

  // 兼容 V1
  collected?: Record<string, unknown>
}
```

### 5.2 废弃 Edge Function

- `ai_router` — 不再需要，深入模式问题为前端静态

### 5.3 保留 Edge Function

- `ai_ask` — 用于"继续深入挖掘"的自由对话

## 六、Prompt 设计

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
- Second item must be research/validation oriented (use words like research/validate or 调研/验证).
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
- [ ] 可联系的相关人员

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
- Second item must be research/validation oriented (use words like research/validate or 调研/验证).
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
- [ ] 可联系的相关人员

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

## 七、UI 组件变更

### 7.1 新增/修改组件

| 组件 | 变更类型 | 说明 |
|------|----------|------|
| `CapturePage.tsx` | 重构 | 添加标签切换、深入模式问题表单 |
| `IdeaDetailPage.tsx` | 修改 | 简化状态显示，添加"继续深入挖掘"入口 |
| `NotePanel.tsx` | 修改 | 添加"继续深入挖掘"按钮和对话界面 |
| `IncubationPanel.tsx` | 废弃 | 不再需要5阶段对话 |
| `DeepModeQuestions.tsx` | 新增 | 深入模式3问题表单组件 |
| `ContinueDiggingDialog.tsx` | 新增 | "继续深入挖掘"对话组件 |

### 7.2 CapturePage 状态机

```typescript
type CaptureMode = 'quick' | 'deep'
type IdeaType = 'product' | 'creative' | 'research'

// 快速模式状态
interface QuickModeState {
  type: IdeaType
  content: string
}

// 深入模式状态
interface DeepModeState {
  type: IdeaType
  content: string
  answers: {
    q1: string
    q2: string
    q3: string
  }
}
```

## 八、迁移计划

### 8.1 Phase 1: 快速记录模式（优先）

1. 修改 `CapturePage.tsx` — 添加标签切换
2. 修改 `ai_extract_note` — 支持 `capture_mode: 'quick'`
3. 修改 `NotePanel.tsx` — 添加"继续深入挖掘"入口
4. 测试快速记录 → 笔记生成流程

### 8.2 Phase 2: 深入孵化模式

1. 创建 `DeepModeQuestions.tsx` 组件
2. 修改 `ai_extract_note` — 支持 `capture_mode: 'deep'`
3. 测试深入模式 → 笔记生成流程

### 8.3 Phase 3: 继续深入挖掘

1. 创建 `ContinueDiggingDialog.tsx` 组件
2. 复用 `ai_ask` Edge Function
3. 实现"更新笔记"逻辑
4. 测试完整流程

### 8.4 Phase 4: 清理

1. 标记 `IncubationPanel.tsx` 为废弃
2. 标记 `ai_router` Edge Function 为废弃
3. 更新所有文档
4. 数据库迁移：添加 `capture_mode` 和 `deep_answers` 字段

## 九、数据库迁移

```sql
-- 添加新字段
ALTER TABLE ideas
ADD COLUMN capture_mode VARCHAR(10) DEFAULT 'quick',
ADD COLUMN deep_answers JSONB DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN ideas.capture_mode IS 'quick or deep capture mode';
COMMENT ON COLUMN ideas.deep_answers IS 'answers to the 3 deep mode questions';
```

## 十、测试用例

### 10.1 快速记录模式

1. 输入一行想法 → 选择产品类型 → 点击记录 → 跳转到详情页
2. 笔记应包含所有必填字段
3. 行动项应包含 ≤15分钟快速行动 + 调研验证项

### 10.2 深入孵化模式

1. 输入一行想法 → 切换到深入孵化 → 填写3个问题 → 点击生成
2. 笔记应整合 raw_input 和 3个答案
3. 笔记质量应高于快速模式

### 10.3 继续深入挖掘

1. 笔记生成后 → 点击"继续深入挖掘" → 进入对话
2. 提问 → AI 回答 → 循环
3. 点击"更新笔记" → 笔记追加新内容
4. 新内容不应覆盖原有笔记

### 10.4 离线支持

1. 快速记录离线 → 本地存储 → 上线后同步
2. 深入模式离线 → 本地存储 → 上线后同步
3. 笔记生成离线 → 显示错误提示

## 十一、成功指标

| 指标 | V1 基线 | V2 目标 |
|------|---------|---------|
| 首次笔记生成时间 | 5分钟+ | <30秒 |
| 用户完成率 | 低（5阶段门槛高） | 高（1步完成） |
| API 调用次数 | 10次+ | 1次 |
| 用户满意度 | 待测 | 待测 |

## 十二、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 快速记录笔记质量低 | 用户觉得没价值 | 优化 Prompt，增加推断能力 |
| 深入模式问题不够好 | 笔记质量不如预期 | 迭代问题设计，用户测试 |
| 用户不知道有深入模式 | 只用快速模式 | UI 设计突出标签切换 |
| 旧数据兼容问题 | V1 数据无法使用 | 迁移脚本，保留旧字段 |

---

## 附录：问题设计迭代历史

### V1 问题设计（已废弃）

```
Stage 1: problem_definition
Stage 2: target_audience
Stage 3: unique_value
Stage 4: execution_steps
Stage 5: risk_assessment
```

### V2 问题设计

#### 产品
```
Q1: 这个想法为哪些用户解决什么问题？
Q2: 用户在什么场景下会使用？
Q3: 他们现在怎么解决这个问题？
```

#### 创作
```
Q1: 主题或核心信息是什么？
Q2: 目标受众是谁？为什么感兴趣？
Q3: 有什么参考作品或灵感来源？
```

#### 研究
```
Q1: 想探索或验证什么问题？
Q2: 打算用什么方法研究？
Q3: 已有相关研究有哪些？
```

## 十三、UI 动画实现（2026-03-07）

> 版本：v2.1 动画增强
> 状态：✅ 已实现

### 13.1 模式切换动画

**目标**：在 Quick Capture 和 Deep Incubation 模式切换时，让界面的变化显得自然而非生硬跳变。

**实现效果**：

| 动画 | 实现方式 | 时长 |
|------|---------|------|
| 容器高度动态伸缩 | CSS Grid `grid-template-rows: 0fr → 1fr` | 400ms |
| 问题淡入向上滑动 | `opacity + translateY` 过渡 | 320ms |
| 问题依次入场 | `transition-delay` 递增 80ms | - |
| 滑动指示器 | `left` 属性过渡 | 250ms |

**关键代码**：

```typescript
// 动画时序常量
const ANIMATION = {
  containerHeight: 400,  // 容器高度过渡
  questionStagger: 80,   // 每个问题延迟
  questionFadeIn: 320,   // 淡入动画时长
} as const

// AnimatedQuestion 组件
<div style={{
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
  transition: `opacity ${duration}ms, transform ${duration}ms`,
  transitionDelay: isVisible ? `${index * 80}ms` : '0ms',
}}>
```

### 13.2 "魔法"反馈动画

**目标**：在用户点击"生成笔记"到完成跳转的这段时间内（通常小于 30 秒），提供具有美感的视觉反馈。

**实现效果**：

| 效果 | 实现 | 说明 |
|------|------|------|
| 轨道粒子加载 | `orbit` animation | 3个粒子环绕中心旋转 |
| 呼吸灯效果 | `breathe` animation | 背景渐变脉动，暗示 AI 工作 |
| 流光进度条 | `shimmer` + `pulse-underline` | 极细进度条底部流光 |
| 点击微交互 | `scale(0.98)` | 按下缩小反馈 |

**关键代码**：

```css
/* 轨道粒子动画 */
@keyframes orbit {
  0% { transform: rotate(0deg) translateX(8px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(8px) rotate(-360deg); }
}

/* 呼吸灯效果 */
@keyframes breathe {
  0%, 100% { opacity: 0.6; transform: scaleX(0.95); }
  50% { opacity: 1; transform: scaleX(1.02); }
}

/* 流光进度条 */
@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

### 13.3 页面转场动画

**目标**：让用户在从捕获页跳转到想法详情页时，感觉逻辑是连贯的。

**实现效果**：

- 页面淡入 + 缩放效果（`scale(0.98) → scale(1)`）
- 所有页面通过 `PageTransition` 包装器自动应用过渡

**新增文件**：

| 文件 | 说明 |
|------|------|
| `src/components/PageTransition.tsx` | 页面过渡包装组件 |
| `src/components/AnimatedCard.tsx` | 动画卡片组件（可选使用） |

**关键代码**：

```typescript
// PageTransition - 页面过渡包装器
const [isVisible, setIsVisible] = useState(false)

useEffect(() => {
  const timer = requestAnimationFrame(() => setIsVisible(true))
  return () => cancelAnimationFrame(timer)
}, [])

<div style={{
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(8px)',
  transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
}}>
```

### 13.4 列表交互动画

**目标**：在每周回顾中，让用户在处理"停滞最久"的想法时感到愉悦。

**实现效果**：

| 动画 | 说明 |
|------|------|
| **弹性入场** | `fadeInUp` with spring-like cubic-bezier |
| **悬停反馈** | 向上偏移 4px + scale(1.005) + 阴影加深 |
| **归档滑出** | `slideOutRight` 向右侧滑出消失 |
| **删除滑出** | 同样使用滑出动画 |

**关键代码**：

```typescript
// 退出状态管理
const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

// handleArchive 触发动画
setExitingIds((prev) => new Set([...prev, idea.id]))
await new Promise((resolve) => setTimeout(resolve, 350)) // 等待动画
```

```css
/* 弹性入场 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 滑出消失 */
@keyframes slideOutRight {
  from { transform: translateX(0) scale(1); opacity: 1; }
  to { transform: translateX(120%) scale(0.95); opacity: 0; }
}
```

### 13.5 无障碍支持

所有动画都遵循 `prefers-reduced-motion` 媒体查询，在用户偏好减少动画时自动禁用：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 13.6 文件变更清单

| 文件 | 变更 |
|------|------|
| `src/components/PageTransition.tsx` | 新建 - 页面过渡组件 |
| `src/components/AnimatedCard.tsx` | 新建 - 动画卡片组件 |
| `src/components/Layout.tsx` | 添加 PageTransition 包装 Outlet |
| `src/pages/CapturePage.tsx` | 添加模式切换动画和魔法反馈 |
| `src/pages/LibraryPage.tsx` | 添加列表交互动画 |
| `src/pages/WeeklyReviewPage.tsx` | 添加列表交互动画 |
| `src/pages/IdeaDetailPage.tsx` | 导入 StaggeredReveal |