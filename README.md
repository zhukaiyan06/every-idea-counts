# Every Idea Counts

> 每个想法都值得被认真对待 — 一款基于 AI 的想法捕获与笔记生成 PWA 应用。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39-green.svg)](https://supabase.com/)

## ✨ 功能特色

### 🚀 一键记录并生成
用户只需点击一次按钮，系统自动完成「保存 → AI 生成 → 跳转」全流程：
- 按钮显示「保存中...」→「AI 生成中...」
- AI 完成后自动跳转到笔记详情页
- 无需多次操作，极速体验

### 📝 双模式捕获

**快速记录**（默认模式）
- 单次输入 → 1 次 API 调用 → 结构化笔记
- 最低门槛，最快速度
- AI 自动推断并扩展你的想法

**深入孵化**
- 回答 3 个类型特定问题 → 1 次 API 调用 → 深度笔记
- 问题为前端静态渲染（无 API 调用）
- 针对产品/创作/研究想法的定制化提问

### 🔄 继续深入挖掘
笔记生成后，可与 AI 进行自由对话，持续深化想法。对话内容以追加形式更新到笔记（不覆盖原有内容）。

### 📱 PWA + 离线优先
- 可安装到手机和桌面
- 离线可用，本地存储数据
- 恢复联网后自动后台同步
- 匿名自动登录，零门槛使用

### 🎨 清晰架构
- 领域驱动设计，业务逻辑纯净
- 全程类型安全（严格 TypeScript）
- 内联样式（零 CSS 依赖）
- 可测试架构（单元测试 + E2E 测试）

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite |
| **样式** | 内联样式 + 主题系统 |
| **状态** | Zustand + localStorage |
| **后端** | Supabase（Auth + PostgreSQL + RLS + Edge Functions） |
| **AI** | GLM / Qwen API（双供应商，服务端调用） |
| **测试** | Vitest（单元）+ Playwright（E2E） |
| **PWA** | vite-plugin-pwa + Workbox |

## 🚦 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Docker Desktop（用于本地 Supabase）
- Supabase CLI

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/every-idea-counts.git
cd every-idea-counts

# 安装依赖
npm ci

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 Supabase 凭证

# 启动本地 Supabase
supabase start

# 启动开发服务器
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173) 查看应用。

### 环境变量

在项目根目录创建 `.env`：

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

为 Edge Functions 创建 `supabase/functions/.env`（切勿提交）：

```bash
GLM_API_KEY=your_glm_key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
DASHSCOPE_API_KEY=your_dashscope_key
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## 📂 项目结构

```
every-idea-counts/
├── src/
│   ├── components/          # 可复用 UI 组件
│   │   ├── Layout.tsx       # 应用外壳与导航
│   │   ├── note/            # 笔记相关组件
│   │   └── capture/         # 捕获模式组件
│   ├── design/              # 主题系统
│   │   ├── theme.ts         # 主题令牌
│   │   └── index.ts         # ThemeProvider + useTheme
│   ├── domain/              # 纯业务逻辑（可测试）
│   │   ├── text.ts          # 文本处理工具
│   │   └── types.ts         # 领域类型
│   ├── hooks/               # 自定义 React Hooks
│   ├── lib/                 # 外部服务客户端
│   │   ├── supabase.ts      # Supabase 客户端
│   │   └── createId.ts      # ID 生成
│   ├── pages/               # 路由级组件
│   │   ├── CapturePage.tsx  # 主捕获界面
│   │   └── IdeaDetailPage.tsx
│   └── services/            # 应用服务
│       ├── generateNote.ts  # 笔记生成编排
│       └── offline/         # 离线同步逻辑
├── supabase/
│   ├── functions/           # Edge Functions（Deno）
│   │   ├── ai_extract_note/ # 核心笔记生成
│   │   ├── ai_ask/          # 继续深入挖掘对话
│   │   └── _shared/         # 认证、CORS 工具
│   └── migrations/          # 数据库 Schema
├── e2e/                     # Playwright E2E 测试
└── docs/                    # 设计文档与规格
```

## 🧪 测试

### 单元测试（Vitest）

```bash
# 运行所有单元测试
npm test

# 运行单个测试文件
npm test -- src/domain/text.test.ts

# 单次运行（不监听）
npm test -- --run
```

### E2E 测试（Playwright）

```bash
# 前置条件：supabase start + npm run dev
npm run test:e2e
```

## 🛠️ 开发

### 可用脚本

```bash
npm run dev          # 启动开发服务器（端口 5173）
npm run build        # 生产构建（tsc && vite build）
npm run lint         # ESLint（--max-warnings 0）
npm run preview      # 预览生产构建
```

### 代码风格

- **缩进**：2 空格
- **分号**：无
- **引号**：`.ts/.tsx` 用单引号，配置文件用双引号
- **类型**：严格模式，类型专用导入，禁止 `any`
- **样式**：内联 `style` 属性，无 CSS 文件

详见 [AGENTS.md](./AGENTS.md) 完整风格指南。

### 架构原则

1. **领域纯净**：`src/domain/` 包含零依赖的业务逻辑
2. **类型安全**：严格 TypeScript，无类型逃逸
3. **内联样式**：零 CSS 依赖，通过 `useTheme()` 访问主题
4. **离线优先**：本地存储 + 后台同步
5. **API 极简**：快速模式 = 1 次调用，深入模式 = 1 次调用

## 🚀 部署

### Supabase 远程配置

```bash
# 1. 关联远程项目
supabase link --project-ref <your-project-ref>

# 2. 推送数据库迁移
supabase db push

# 3. 设置密钥
supabase secrets set --env-file ./supabase/.env.production

# 4. 部署 Edge Functions
supabase functions deploy ai_extract_note
supabase functions deploy ai_ask
```

### 前端部署

构建后将 `dist/` 文件夹部署到 Vercel、Netlify 或任何静态托管。

```bash
npm run build
# 上传 dist/ 到托管服务商
```

## 📊 用户流程

```
快速记录模式:
  输入想法 → 选择类型 → 点击「记录想法」→ AI 生成 → 自动跳转到笔记详情页

深入孵化模式:
  输入想法 → 选择类型 → 切换到「深入孵化」→ 回答 3 个问题 → 生成笔记

继续深入挖掘:
  查看笔记 → 点击「继续深入挖掘」→ 与 AI 对话 → 更新笔记（追加）
```

## 🔐 安全性

- **行级安全（RLS）**：每个用户只能访问自己的数据
- **匿名认证**：自动生成账户，零门槛上手
- **服务端 AI 密钥**：API 密钥永不暴露给客户端
- **CORS 保护**：Edge Functions 验证请求来源

## 📈 成功指标

| 指标 | 目标 |
|------|------|
| 首次笔记生成时间 | < 30 秒 |
| 每次捕获的 API 调用 | 1 次 |
| 用户完成率 | 高 |
| 深入模式使用率 | 20-30% |

## 📝 许可证

MIT

## 🤝 贡献

欢迎贡献代码！请阅读贡献指南后提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📚 文档

- [AGENTS.md](./AGENTS.md) — Agent 指南与代码风格
- [docs/spec/unified-spec.md](./docs/spec/unified-spec.md) — 产品规格
- [docs/design/two-mode-capture.md](./docs/design/two-mode-capture.md) — 双模式设计

## 🐛 问题排查

| 问题 | 解决方案 |
|------|----------|
| `npm run build` 失败 | 运行 `npx tsc --noEmit` 查看 TypeScript 错误 |
| E2E 测试失败 | 确保 `supabase start` 正在运行 |
| 认证错误 | 检查 `.env` 中的 URL 和 anon key |
| 离线同步问题 | 检查 localStorage 键 `unsynced-ideas` |
| AI 生成失败 | 验证 Edge Function 环境中的 GLM/DASHSCOPE 密钥 |

## 💡 设计理念

> "Every idea counts" — 每个想法都值得被捕获、结构化和付诸行动。

大多数想法都消失在被遗忘的备忘录里。本工具以最小阻力将转瞬即逝的想法转化为可行动的洞察。一键，一次 API 调用，一份结构化笔记。

---

**用 ❤️ 构建的想法捕获工具**