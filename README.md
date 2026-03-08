# Every Idea Counts (PWA MVP v2.0)

> **v2.0 Update**: One-click capture with AI auto-generation. No manual login required.

## 核心特色

### 🚀 一键记录并生成
用户只需点击一次按钮，系统自动完成「保存 → AI 生成 → 跳转」全流程：
- 按钮显示「保存中...」→「AI 生成中...」
- AI 完成后自动跳转到笔记详情页
- 无需多次操作，极速体验

### 📝 双模式捕获
- **快速记录** (默认): 单次输入 → 1 API 调用 → 笔记生成
- **深入孵化**: 3 个类型特定问题 → 1 API 调用 → 笔记生成

### ✨ 其他特性
- **匿名自动登录**: 打开应用即可使用，无需手动登录
- **继续深入挖掘**: 笔记生成后可与 AI 对话，持续深化想法
- **离线优先**: 本地存储 + 后台同步，断网也能记录
- **PWA**: 可安装到手机和桌面

## 用户流程

```
快速记录模式:
  输入想法 → 点击按钮 → AI 生成中... → 自动跳转到笔记详情页

深入孵化模式:
  输入想法 → 回答 3 个问题 → AI 生成 → 自动跳转到笔记详情页

继续深入挖掘:
  查看笔记 → 点击「继续深入挖掘」→ 与 AI 对话 → 更新笔记
```
---


## Supabase local development

Prerequisites:
- Docker Desktop running
- Supabase CLI installed

Common commands:

```bash
# initialize Supabase (first time)
supabase init

# start local stack
supabase start

# stop local stack
supabase stop

# view local services status
supabase status
```

Local Studio: http://localhost:54323

## Local JWT for functions smoke tests

The edge functions expect a valid JWT for authentication. Use the local
Supabase auth endpoints to generate a token.

```bash
export SUPABASE_URL=http://localhost:54321
export SUPABASE_ANON_KEY=your-local-anon-key
export TEST_EMAIL=you@example.com

# create or reuse a test user
curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"local-smoke-Password!123\"}" > /dev/null

# fetch an access token
curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"local-smoke-Password!123\"}"
```

Copy the returned `access_token` when calling functions manually, or run
`./scripts/functions-smoke.sh` which generates tokens automatically.

For a 200 response, the local functions must be served with AI provider keys
configured in `supabase/functions/.env`.
## Supabase remote deployment

Prerequisites:
- Supabase account and organization
- Remote project created in Supabase dashboard

### Deployment runbook

Follow these steps in order to deploy to the remote production environment:

1. **Log in to Supabase CLI**
   ```bash
   supabase login
   ```

2. **Link to remote project**
   ```bash
   # Replace <project-ref> with your Supabase project ID (from dashboard)
   supabase link --project-ref <ref>
   ```

3. **Push database migrations**
   ```bash
   supabase db push
   ```

4. **Set environment secrets**
   Create a local file `supabase/.env.production` (do **NOT** commit this file) with the required keys, then run:
   ```bash
   supabase secrets set --env-file ./supabase/.env.production
   ```

5. **Deploy Edge Functions**
   ```bash
   # v2.0: Deploy active functions
   supabase functions deploy ai_extract_note
   supabase functions deploy ai_ask
   ```

### Required secrets

The following secrets must be defined in your `.env.production` or set manually:

- `GLM_API_KEY`: API key for 智谱AI (GLM) 国内版.
- `GLM_BASE_URL`: Base URL for GLM API (default: `https://open.bigmodel.cn/api/paas/v4`).
- `DASHSCOPE_API_KEY`: API key for 通义千问 (Qwen/DashScope).
- `DASHSCOPE_BASE_URL`: Base URL for Qwen API (default: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`).

> **Note**: The `./supabase/.env.production` file is excluded from git for security. Ensure it is handled safely on your local machine.
