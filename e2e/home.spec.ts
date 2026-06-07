import { test, expect } from '@playwright/test'

// Example smoke test. Requires the app (and its Supabase backend) to be running;
// the Playwright config starts `npm run dev` automatically.
test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/dough|bake/i)
})
