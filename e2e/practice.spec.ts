import { test, expect } from '@playwright/test'

test('practice mode flow', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('e.g. SolarSage').fill('TestTutor')
  await page.getByRole('button', { name: 'Start Practice Match' }).click()

  await expect(page.getByText('Practice vs SimEconomy')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your hand' })).toBeVisible()

  // Attack and end turn buttons should be present
  await expect(page.getByRole('button', { name: /End Turn/i })).toBeVisible()
  await page.getByRole('button', { name: /End Turn/i }).click()
  await expect(
    page.getByRole('button', { name: /End Turn/i }),
  ).toBeDisabled()
})
