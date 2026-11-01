import { test, expect } from '@playwright/test';

const FORBIDDEN_STRINGS = [
  '100% of village parcels every 5 days',
  'detects foundation trenching',
  'judicial admissibility',
  'cryptographic proof',
  'zero fake data',
  '315 taluks',
  '1,768 villages',
];

const ROLES = [
  { index: 0, role: 'TAHSILDAR', username: 'tah_salem_west', expectedText: 'Taluk Statutory Authority & Magisterial Court' },
  { index: 1, role: 'COLLECTOR', username: 'col_salem', expectedText: 'District Collector & Executive Magistrate Command' },
  { index: 2, role: 'STATE_APEX', username: 'apex_tn', expectedText: 'Statewide Strategic Land Bank Directorate' },
  { index: 3, role: 'VIGILANCE', username: 'dvac_auditor', expectedText: 'Vigilance & Anti-Corruption Audit Directorate (DVAC)' },
  { index: 4, role: 'VAO', username: 'vao_kannan', expectedText: 'Village Administrative Officer (VAO) Field Operations' },
  { index: 5, role: 'ADMIN_GIS', username: 'admin', expectedText: 'Cadastral GIS & Sentinel-2 Infrastructure Operations' },
];

test.describe('Role Dashboard Verification & Statutory Compliance', () => {
  for (const { index, role, username, expectedText } of ROLES) {
    test(`renders ${role} dashboard with honesty badges and 0 forbidden claims`, async ({ browser }) => {
      // 1. Fresh isolated browser context for each role test
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // 2. Navigate to portal (unauthenticated initially)
        await page.goto('/');

        // 3. Click the specific Launch button for this role
        const launchButtons = page.getByRole('button', { name: 'Launch' });
        await expect(launchButtons.nth(index)).toBeVisible({ timeout: 10000 });
        await launchButtons.nth(index).click();

        // 4. Verify URL navigates to /dashboard
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

        // 5. Verify role-specific title appears
        await expect(page.locator(`text=${expectedText}`).first()).toBeVisible({ timeout: 10000 });

        // 6. Verify Honesty Badges
        const demoBadge = page.locator('text=DEMO').first();
        await expect(demoBadge).toBeVisible();

        // 7. Verify zero forbidden strings on the rendered page
        const pageContent = await page.content();
        for (const forbidden of FORBIDDEN_STRINGS) {
          expect(pageContent).not.toContain(forbidden);
        }
      } finally {
        await context.close();
      }
    });
  }
});
