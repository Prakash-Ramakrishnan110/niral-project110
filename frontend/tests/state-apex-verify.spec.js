import { test, expect } from '@playwright/test';
import path from 'path';

test('State Apex Navigation & ATR Status Verification', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // 1. Visit root and log in as State Apex (index 2)
  await page.goto('/');
  const launchButtons = page.getByRole('button', { name: 'Launch' });
  await expect(launchButtons.nth(2)).toBeVisible({ timeout: 10000 });

  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login/') && resp.status() === 200),
    launchButtons.nth(2).click(),
  ]);

  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.locator('text=Statewide Strategic Land Bank Directorate').first()).toBeVisible();

  // 2. Navigate to ATR Status (/atr)
  const atrNav = page.locator('a[href="/atr"]').first();
  await expect(atrNav).toBeVisible();
  await atrNav.click();
  await expect(page).toHaveURL(/.*\/atr/);
  await expect(page.locator('text=Waterbody Protection & Action Taken Report').first()).toBeVisible();
  await expect(page.locator('text=Waterbody Encroachments').first()).toBeVisible();

  const atrScreenshot = 'C:/Users/praka/.gemini/antigravity/brain/bd18bbdd-3489-4bb6-a702-8ebf737d1678/atr_status_apex.png';
  await page.screenshot({ path: atrScreenshot, fullPage: true });

  // 3. Navigate to District Comparison (/districts)
  const distNav = page.locator('a[href="/districts"]').first();
  await expect(distNav).toBeVisible();
  await distNav.click();
  await expect(page).toHaveURL(/.*\/districts/);
  await expect(page.locator('text=Inter-District Cadastral Enforcement').first()).toBeVisible();

  const distScreenshot = 'C:/Users/praka/.gemini/antigravity/brain/bd18bbdd-3489-4bb6-a702-8ebf737d1678/districts_comparison_apex.png';
  await page.screenshot({ path: distScreenshot, fullPage: true });

  // 4. Navigate to Audit Trail (/audit)
  const auditNav = page.locator('a[href="/audit"]').first();
  await expect(auditNav).toBeVisible();
  await auditNav.click();
  await expect(page).toHaveURL(/.*\/audit/);
  await expect(page.locator('text=Statutory Audit Log').first()).toBeVisible();

  const auditScreenshot = 'C:/Users/praka/.gemini/antigravity/brain/bd18bbdd-3489-4bb6-a702-8ebf737d1678/audit_trail_apex.png';
  await page.screenshot({ path: auditScreenshot, fullPage: true });

  console.log('ALL STATE APEX ROUTES VERIFIED. Console error count:', errors.length);
});

