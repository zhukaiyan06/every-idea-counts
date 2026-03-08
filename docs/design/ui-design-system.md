# Every Idea Counts — UI 设计系统

> 版本：v1.0  
> 风格：极简主义 + 冷色系  
> 技术：React 内联样式（无 CSS 框架）
> **状态**: ✅ 已应用
---

## 一、设计原则

### 1.1 核心理念

- **内容优先**：留白多，视觉层次清晰，用户专注内容
- **功能导向**：每个元素都有明确目的，无装饰性元素
- **一致性**：统一的颜色、字体、间距，减少认知负担
- **响应式**：适配桌面和移动端

### 1.2 设计参考

- **Notion**：极简编辑器，干净留白
- **Linear**：冷色调界面，专业感
- **Bear**：专注写作体验
- **Obsidian**：笔记应用的经典设计

---

## 二、颜色系统

### 2.1 主色调（Indigo）

基于 Radix Colors，专业、冷静、信任感。

```typescript
// src/styles/colors.ts

export const colors = {
  // 主色 - Indigo
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // 主色调
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // 辅助色 - Blue
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // 辅助色
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // 中性色 - Slate
  neutral: {
    50: '#f8fafc',   // 背景
    100: '#f1f5f9',  // 次级背景
    200: '#e2e8f0',  // 边框
    300: '#cbd5e1',  // 分割线
    400: '#94a3b8',  // 禁用文字
    500: '#64748b',  // 次级文字
    600: '#475569',  // 正文
    700: '#334155',  // 标题
    800: '#1e293b',
    900: '#0f172a',
  },

  // 语义色
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#065f46',
  },

  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#92400e',
  },

  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#991b1b',
  },
} as const
```

### 2.2 语义映射

```typescript
export const semanticColors = {
  // 背景
  background: colors.neutral[50],
  surface: '#ffffff',
  surfaceHover: colors.neutral[100],

  // 文字
  textPrimary: colors.neutral[700],
  textSecondary: colors.neutral[500],
  textDisabled: colors.neutral[400],
  textInverse: '#ffffff',

  // 边框
  border: colors.neutral[200],
  borderHover: colors.neutral[300],
  borderFocus: colors.primary[500],

  // 交互
  buttonPrimary: colors.primary[500],
  buttonPrimaryHover: colors.primary[600],
  buttonSecondary: '#ffffff',
  buttonSecondaryHover: colors.neutral[50],

  // 状态
  statusDraft: colors.neutral[500],
  statusIncubating: colors.primary[500],
  statusCompleted: colors.success.main,
  statusArchived: colors.neutral[400],
} as const
```

---

## 三、字体系统

### 3.1 字体栈

```typescript
export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  mono: '"SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
} as const
```

**说明**：
- 使用系统字体栈，无需加载外部字体
- 跨平台一致性，加载速度快
- 支持中英文显示

### 3.2 字号层级

```typescript
export const fontSize = {
  xs: '12px',    // 辅助文字、时间戳
  sm: '14px',    // 正文、表单标签
  base: '16px',  // 默认正文
  lg: '18px',    // 小标题
  xl: '20px',    // 页面标题
  '2xl': '24px', // 大标题
  '3xl': '30px', // 首屏大标题
} as const
```

### 3.3 行高

```typescript
export const lineHeight = {
  tight: 1.25,   // 标题
  normal: 1.5,   // 正文
  relaxed: 1.65, // 笔记内容
} as const
```

### 3.4 字重

```typescript
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
} as const
```

---

## 四、间距系统

### 4.1 基础单位（4px 网格）

```typescript
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const
```

### 4.2 组件间距

```typescript
export const componentSpacing = {
  // 页面内边距
  pagePadding: spacing[6],        // 24px
  pagePaddingMobile: spacing[4],  // 16px

  // 卡片内边距
  cardPadding: spacing[4],        // 16px

  // 表单间距
  formGap: spacing[4],            // 16px
  inputPadding: spacing[3],       // 12px

  // 列表间距
  listGap: spacing[3],            // 12px
} as const
```

---

## 五、圆角与阴影

### 5.1 圆角

```typescript
export const borderRadius = {
  none: '0',
  sm: '6px',   // 输入框、小按钮
  md: '8px',   // 按钮、卡片
  lg: '12px',  // 大卡片、模态框
  full: '9999px', // Badge、Avatar
} as const
```

### 5.2 阴影（可选，极简风格可不用）

```typescript
export const boxShadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
} as const
```

---

## 六、组件样式模式

### 6.1 按钮

```typescript
// src/styles/components/button.ts

import { colors, borderRadius, spacing, fontSize, fontWeight } from '../tokens'

export const buttonStyles = {
  primary: {
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    borderRadius: borderRadius.md,
    border: 'none',
    backgroundColor: colors.primary[500],
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },

  secondary: {
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.neutral[200]}`,
    backgroundColor: '#ffffff',
    color: colors.neutral[700],
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },

  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
} as const
```

### 6.2 输入框

```typescript
// src/styles/components/input.ts

export const inputStyles = {
  base: {
    width: '100%',
    padding: `${spacing[3]}`,
    fontSize: fontSize.base,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.neutral[200]}`,
    backgroundColor: '#ffffff',
    color: colors.neutral[700],
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },

  focus: {
    borderColor: colors.primary[500],
  },

  error: {
    borderColor: colors.error.main,
  },
} as const
```

### 6.3 卡片

```typescript
// src/styles/components/card.ts

export const cardStyles = {
  base: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.neutral[200]}`,
    backgroundColor: '#ffffff',
  },

  hover: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[300],
  },
} as const
```

### 6.4 Badge

```typescript
// src/styles/components/badge.ts

export const badgeStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[1]} ${spacing[2]}`,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    borderRadius: borderRadius.full,
  },

  product: {
    backgroundColor: colors.primary[50],
    color: colors.primary[700],
  },

  creative: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },

  research: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
} as const
```

---

## 七、布局模式

### 7.1 页面容器

```typescript
export const layoutStyles = {
  pageContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: spacing[6],
  },

  pageContainerWide: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: spacing[6],
  },
} as const
```

### 7.2 表单布局

```typescript
export const formLayoutStyles = {
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
  },

  row: {
    display: 'flex',
    gap: spacing[3],
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
} as const
```

### 7.3 列表布局

```typescript
export const listLayoutStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  },

  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
} as const
```

---

## 八、响应式断点

```typescript
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
} as const

// 使用方式（在组件中判断）
const isMobile = window.innerWidth < 768
```

---

## 九、动画过渡

```typescript
export const transitions = {
  fast: '0.15s ease',
  normal: '0.25s ease',
  slow: '0.35s ease',
} as const
```

---

## 十、使用示例

### 10.1 捕获页面按钮

```tsx
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens'

function CaptureButton() {
  return (
    <button
      style={{
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: fontSize.base,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary[500],
        color: '#ffffff',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      记录想法
    </button>
  )
}
```

### 10.2 想法卡片

```tsx
function IdeaCard({ idea }) {
  return (
    <article
      style={{
        padding: spacing[4],
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.neutral[200]}`,
        backgroundColor: '#ffffff',
      }}
    >
      <h3 style={{ fontSize: fontSize.lg, color: colors.neutral[700] }}>
        {idea.title}
      </h3>
      <p style={{ fontSize: fontSize.sm, color: colors.neutral[500] }}>
        {idea.raw_input}
      </p>
    </article>
  )
}
```

---

## 十一、实现步骤

### Phase 1：创建样式常量文件

```
src/styles/
├── tokens.ts          # 基础设计令牌
├── colors.ts          # 颜色系统
├── typography.ts      # 字体系统
├── spacing.ts         # 间距系统
└── components/
    ├── button.ts
    ├── input.ts
    ├── card.ts
    └── badge.ts
```

### Phase 2：应用样式到核心页面

1. `CapturePage.tsx` — 捕获页面
2. `IdeaDetailPage.tsx` — 详情页面
3. `LibraryPage.tsx` — 想法库
4. `WeeklyReviewPage.tsx` — 每周回顾

### Phase 3：优化细节

- 添加 Hover 状态
- 添加 Focus 状态
- 优化移动端适配

---

## 十二、设计对比

| 元素 | 当前样式 | 新设计样式 |
|------|----------|-----------|
| 主色 | 默认蓝色 | Indigo #6366f1 |
| 按钮 | 无样式 | 统一圆角、颜色、间距 |
| 卡片 | 灰色边框 | 柔和边框、悬停效果 |
| 字体 | 无统一 | 系统字体栈 |
| 间距 | 不一致 | 4px 网格系统 |

---

## 十三、总结

这个设计系统遵循**适度美化**原则：

- ✅ 建立统一的设计令牌
- ✅ 保持代码简洁（无 CSS 框架）
- ✅ 易于维护（样式集中管理）
- ✅ 渐进式应用（可逐步美化各页面）

下一步：创建样式文件并应用到核心页面。