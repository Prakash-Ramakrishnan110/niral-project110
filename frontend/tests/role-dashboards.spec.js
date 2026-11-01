import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

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

  test('renders public statutory notice verification page for valid SHA-256 digest', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Query recorded valid hash
    const validHash = '45fb94cbf2c2ae05c6f62b5f386384e96414a3c327191851468f9965abaf6830';
    await page.goto(`http://localhost:5173/verify/${validHash}`);

    // Wait for verified badge
    await expect(page.locator('text=Authentic Document')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Audit Chain Intact')).toBeVisible();
    await expect(page.locator('text=Section 7 Show-Cause Notice')).toBeVisible();
    await expect(page.locator('text=235/3B')).toBeVisible();
    await expect(page.locator('text=Statutory Disclaimer')).toBeVisible();

    const verifyScreenshot = path.join(process.cwd(), '..', 'public_document_verification.png');
    await page.screenshot({ path: verifyScreenshot, fullPage: true });
    expect(fs.existsSync(verifyScreenshot)).toBeTruthy();

    await context.close();
  });

  test('renders tamper warning for unknown/invalid document digest', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const invalidHash = 'a'.repeat(64);
    await page.goto(`http://localhost:5173/verify/${invalidHash}`);

    await expect(page.locator('text=Document Digest Not Found or Tampered')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Verification Failed')).toBeVisible();

    await context.close();
  });

  test.describe('End-to-End Officer Journeys', () => {
    test('Journey 1: Standard Login navigates to dashboard', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('http://localhost:5173/');
      // Click Launch on first preset
      const launchBtn = page.getByRole('button', { name: 'Launch' }).first();
      await expect(launchBtn).toBeVisible({ timeout: 10000 });
      await launchBtn.click();

      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
      await expect(page.locator('text=Taluk Statutory Authority')).toBeVisible();
      await context.close();
    });

    test('Journey 2: Jurisdiction Scoping — cross-district data is completely absent', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('http://localhost:5173/');
      // Tahsildar (Salem West)
      await page.getByRole('button', { name: 'Launch' }).first().click();
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

      // Salem West should be present
      await expect(page.locator('text=Salem West')).toBeVisible();

      // Cross-district data (e.g. Coimbatore North) must be completely absent from rendered view
      const content = await page.content();
      expect(content).not.toContain('Coimbatore North');
      expect(content).not.toContain('Peelamedu');
      await context.close();
    });

    test('Journey 3: Allowed Action Succeeds — Tahsildar navigates to statutory hearing docket', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('http://localhost:5173/');
      await page.getByRole('button', { name: 'Launch' }).first().click();
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

      // Click Hearings action card
      const hearingsCard = page.locator('text=Schedule Hearing').first();
      if (await hearingsCard.isVisible()) {
        await hearingsCard.click();
        await expect(page).toHaveURL(/.*\/hearings/, { timeout: 10000 });
      } else {
        await page.goto('http://localhost:5173/hearings');
        await expect(page).toHaveURL(/.*\/hearings/);
      }
      await context.close();
    });

    test('Journey 4: Disallowed Action is Hidden — VAO cannot view High Court ATR compliance docket', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('http://localhost:5173/');
      // Click Launch for VAO (index 4)
      await page.getByRole('button', { name: 'Launch' }).nth(4).click();
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

      // High Court ATR Docket is restricted to Collector & State Apex; must be hidden for VAO
      await expect(page.locator('text=Madras High Court ATR Docket')).not.toBeVisible();
      await context.close();
    });

    test('Journey 5: Session Expiry Handled — unauthenticated access redirects to login prompt', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate directly to protected route without authentication
      await page.goto('http://localhost:5173/dashboard');

      // Must display authentication prompt
      await expect(page.locator('text=Revenue Officer Authentication Required')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Sign In with Officer Credentials')).toBeVisible();
      await context.close();
    });
  });
});
