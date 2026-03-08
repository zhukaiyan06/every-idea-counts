import { expect, test } from '@playwright/test'

/**
 * E2E tests for Every Idea Counts v2.0
 * 
 * Tests the two-mode capture system:
 * - Quick Capture (default): 1 API call
 * - Deep Incubation: 3 questions + 1 API call
 * - Continue Digging: Free-form AI chat
 */

/**
 * Helper: Create idea using Quick Capture mode
 */
async function quickCapture(page: import('@playwright/test').Page, text: string) {
  await page.goto('/capture')
  
  // Default mode is "Quick Capture"
  await expect(page.getByText('快速记录')).toBeVisible()
  
  // Fill in the idea
  await page.locator('textarea').first().fill(text)
  
  // Submit
  await page.getByRole('button', { name: '记录想法' }).click()
  
  // Should navigate to idea detail page
  await expect(page).toHaveURL(/\/idea\//)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

/**
 * Helper: Create idea using Deep Incubation mode
 */
async function deepIncubation(
  page: import('@playwright/test').Page, 
  text: string, 
  answers: { q1: string; q2: string; q3: string }
) {
  await page.goto('/capture')
  
  // Switch to Deep Incubation mode
  await page.getByRole('button', { name: '深入孵化' }).click()
  await expect(page.getByText('回答以下问题，帮助深化你的想法')).toBeVisible()
  
  // Fill in the idea
  await page.locator('textarea').first().fill(text)
  
  // Fill in the 3 questions
  const questionTextareas = page.locator('textarea')
  await questionTextareas.nth(1).fill(answers.q1)
  await questionTextareas.nth(2).fill(answers.q2)
  await questionTextareas.nth(3).fill(answers.q3)
  
  // Submit
  await page.getByRole('button', { name: '生成笔记' }).click()
  
  // Should navigate to idea detail page
  await expect(page).toHaveURL(/\/idea\//)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

// ============================================
// Quick Capture Mode Tests
// ============================================

test('Quick Capture: creates idea and navigates to detail', async ({ page }) => {
  await quickCapture(page, '这是一个用于测试的产品想法')
  
  // Verify idea type badge
  await expect(page.getByText('产品', { exact: true })).toBeVisible()
  
  // Verify status badge
  await expect(page.getByText('草稿')).toBeVisible()
})

test('Quick Capture: generates note with 1 API call', async ({ page }) => {
  await quickCapture(page, '一个帮助用户记录心情的App')
  
  // Note panel should be visible
  const noteTextarea = page.locator('textarea').first()
  await expect(noteTextarea).toBeVisible()
  
  await noteTextarea.fill('测试笔记内容')
  await expect(noteTextarea).toHaveValue('测试笔记内容')
})

test('Quick Capture: local draft persistence', async ({ page }) => {
  await page.goto('/capture')
  
  // Fill in partial idea
  await page.locator('textarea').first().fill('这是一个未完成的草稿')
  
  await expect
    .poll(async () => {
      return await page.evaluate(() => localStorage.getItem('every-idea-counts-draft') || '')
    })
    .toContain('这是一个未完成的草稿')
  
  // Reload page
  await page.reload()
  
  // Draft should be restored
  const textarea = page.locator('textarea').first()
  await expect(textarea).toHaveValue('这是一个未完成的草稿')
})

// ============================================
// Deep Incubation Mode Tests
// ============================================

test('Deep Incubation: creates idea with 3 questions answered', async ({ page }) => {
  await deepIncubation(
    page,
    '一个帮助用户记录心情的App',
    {
      q1: '为压力大的都市白领解决情绪管理问题',
      q2: '每天下班后，用户想复盘一天的情绪变化',
      q3: '现在主要用备忘录或日记App，但缺乏结构化分析'
    }
  )
  
  // Verify idea type badge
  await expect(page.getByText('产品')).toBeVisible()
  
  // Verify capture mode badge
  await expect(page.getByText('深入孵化')).toBeVisible()
})

test('Deep Incubation: validates all 3 questions must be answered', async ({ page }) => {
  await page.goto('/capture')
  
  // Switch to Deep Incubation mode
  await page.getByRole('button', { name: '深入孵化' }).click()
  
  // Fill in the idea
  await page.locator('textarea').first().fill('这是一个测试想法')
  
  // Only fill 2 questions
  const questionTextareas = page.locator('textarea')
  await questionTextareas.nth(1).fill('答案1')
  await questionTextareas.nth(2).fill('答案2')
  // Leave q3 empty
  
  // Submit button should be disabled
  const submitButton = page.getByRole('button', { name: '生成笔记' })
  await expect(submitButton).toBeDisabled()
  
  // Should show validation message
  await expect(page.getByText('请回答所有3个问题后再提交')).toBeVisible()
})

test('Deep Incubation: type-specific questions change on type switch', async ({ page }) => {
  await page.goto('/capture')
  await page.getByRole('button', { name: '深入孵化' }).click()
  
  // Default type is "product"
  await expect(page.getByText('这个想法为哪些用户解决什么问题？')).toBeVisible()
  
  // Switch to "creative"
  await page.getByRole('button', { name: '创作' }).click()
  await expect(page.getByText('主题或核心信息是什么？')).toBeVisible()
  
  // Switch to "research"
  await page.getByRole('button', { name: '研究' }).click()
  await expect(page.getByText('想探索或验证什么问题？')).toBeVisible()
})

// ============================================
// Continue Digging Tests
// ============================================

test('Continue Digging: opens dialog and allows free-form chat', async ({ page }) => {
  await quickCapture(page, '一个测试想法')
  
  // Click "Continue Digging" button
  await page.getByRole('button', { name: '继续深入挖掘' }).click()
  
  // Dialog should open
  await expect(page.getByRole('heading', { name: '继续深入挖掘' })).toBeVisible()
  await expect(page.getByPlaceholder('输入你的问题...')).toBeVisible()
})

test('Continue Digging: can send messages', async ({ page }) => {
  await quickCapture(page, '一个测试想法')
  
  await page.getByRole('button', { name: '继续深入挖掘' }).click()
  
  // Send a message
  await page.getByPlaceholder('输入你的问题...').fill('这个想法的主要竞争对手是谁？')
  await page.getByRole('button', { name: '发送' }).click()
  
  // Should show user message
  await expect(page.getByText('这个想法的主要竞争对手是谁？')).toBeVisible()
})

test('Continue Digging: updates note with conversation', async ({ page }) => {
  await quickCapture(page, '一个测试想法')
  
  // Get initial note content
  const noteTextarea = page.locator('textarea').first()
  const initialNote = await noteTextarea.inputValue()
  
  // Open Continue Digging
  await page.getByRole('button', { name: '继续深入挖掘' }).click()
  
  // Send a message
  await page.getByPlaceholder('输入你的问题...').fill('测试问题')
  await page.getByRole('button', { name: '发送' }).click()
  
  // Update note
  await page.getByRole('button', { name: '更新笔记' }).click()
  
  // Dialog should close
  await expect(page.getByPlaceholder('输入你的问题...')).not.toBeVisible()
  
  // Note should have new content appended
  const updatedNote = await noteTextarea.inputValue()
  expect(updatedNote.length).toBeGreaterThan(initialNote.length)
  expect(updatedNote).toContain('继续深入挖掘')
})

// ============================================
// Note Generation Tests
// ============================================

test('Note Generation: appends without overwriting manual text', async ({ page }) => {
  await quickCapture(page, '一个测试想法')
  
  const noteTextarea = page.locator('textarea').first()
  
  // Add manual text
  await noteTextarea.fill('这是手动添加的笔记内容')
  
  // Generate note
  const noteResponsePromise = page.waitForResponse((response) => {
    return response.url().includes('/functions/v1/ai_extract_note') && response.request().method() === 'POST'
  })
  await page.getByRole('button', { name: '生成笔记' }).click()
  await noteResponsePromise
  
  // Manual text should still be there
  const noteContent = await noteTextarea.inputValue()
  expect(noteContent).toContain('这是手动添加的笔记内容')
})

test('Note Generation: can export as Markdown', async ({ page }) => {
  await quickCapture(page, '一个测试想法')
  
  // Click export button
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 Markdown' }).click()
  const download = await downloadPromise
  
  // Verify download
  expect(download.suggestedFilename()).toMatch(/idea-.*\.md/)
})

// ============================================
// Weekly Review Tests
// ============================================

test('Weekly Review: orders by oldest updated first', async ({ page }) => {
  const oldest = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  const newer = new Date(Date.now() - 1000 * 60 * 60).toISOString()

  await page.addInitScript(({ oldestValue, newerValue }) => {
    const payload = [
      {
        id: 'idea-oldest',
        idea_type: 'product',
        title: '最久未更新想法',
        raw_input: 'old',
        status: 'draft',
        capture_mode: 'quick',
        created_at: oldestValue,
        updated_at: oldestValue,
      },
      {
        id: 'idea-newer',
        idea_type: 'creative',
        title: '最近更新想法',
        raw_input: 'new',
        status: 'incubating',
        capture_mode: 'quick',
        created_at: newerValue,
        updated_at: newerValue,
      },
    ]
    localStorage.setItem('unsynced-ideas', JSON.stringify(payload))
  }, { oldestValue: oldest, newerValue: newer })

  await page.goto('/review')

  // First item should be the oldest
  const firstTitle = await page.locator('article strong').first().textContent()
  expect(firstTitle).toContain('最久未更新想法')
})

// ============================================
// Library Tests
// ============================================

test('Library: shows all ideas with filters', async ({ page }) => {
  await page.goto('/library')
  
  await expect(page.getByRole('combobox')).toHaveCount(3)
  await expect(page.getByRole('combobox').first()).toContainText('草稿')
  await expect(page.getByRole('combobox').first()).toContainText('孵化中')
  await expect(page.getByRole('combobox').first()).toContainText('已完成')
})

test('Library: can search ideas', async ({ page }) => {
  // Create an idea with unique text
  await quickCapture(page, '这是一个包含独特关键词的想法：人工智能助手')
  
  // Go to library
  await page.goto('/library')
  
  // Search for the unique keyword
  await page.getByPlaceholder('搜索想法、笔记、行动项...').fill('人工智能助手')
  
  // Should find the idea
  await expect(page.locator('article').filter({ hasText: '人工智能助手' }).first()).toBeVisible()
})
