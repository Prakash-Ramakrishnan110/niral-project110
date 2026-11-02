import { execFileSync } from 'child_process';
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------------------------
// ISOLATION GUARD: these tests write to the database (assignments, verifications, hearings).
// They must only ever run against the isolated e2e backend (database land_records_e2e) started by
// scripts/e2e_up.ps1 and run with `npm run test:e2e`. Never against land_records.
// ---------------------------------------------------------------------------------------------
const E2E_CONTAINER = process.env.E2E_CONTAINER || 'land_backend_e2e';
if (E2E_CONTAINER === 'land_backend') {
  throw new Error('Refusing to run: E2E_CONTAINER must not be the main backend (land_records).');
}

function manage(...args) {
  return execFileSync('docker', ['exec', E2E_CONTAINER, 'python', 'manage.py', ...args], { encoding: 'utf-8' });
}

function dbShell(code) {
  return manage('shell', '-c', code);
}

/** Idempotently (re)creates the three E2E-* fixture alerts and returns their ids. */
function seedFixtures() {
  const out = manage('seed_e2e_fixtures');
  const line = out.split('\n').find((l) => l.startsWith('E2E_FIXTURES_JSON='));
  if (!line) throw new Error('seed_e2e_fixtures did not return fixtures. Output: ' + out);
  return JSON.parse(line.replace('E2E_FIXTURES_JSON=', ''));
}

test.beforeAll(() => {
  // Hard proof the target database is the e2e one
  const dbName = dbShell("from django.db import connection; print('DB=' + connection.settings_dict['NAME'])");
  expect(dbName).toContain('DB=land_records_e2e');
});

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

async function ensureLoginModal(page) {
  await page.goto('/');
  const launchButtons = page.getByRole('button', { name: 'Launch' });
  await expect(launchButtons.first()).toBeVisible({ timeout: 10000 });
}

async function loginAsRole(page, index = 0) {
  await ensureLoginModal(page);
  const launchButtons = page.getByRole('button', { name: 'Launch' });
  await expect(launchButtons.nth(index)).toBeVisible({ timeout: 10000 });
  await Promise.all([
    page.waitForResponse((resp) => resp.url().includes('/api/auth/login/') && resp.status() === 200, { timeout: 15000 }),
    launchButtons.nth(index).click(),
  ]);
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
}

/** Opens the statutory-transition form of the case modal and executes `targetState`. */
async function executeTransition(page, targetState, note) {
  const select = page.locator('form select').first();
  await expect(select).toBeVisible({ timeout: 10000 });
  // Throws (fails the test) if the option is missing or disabled/blocked.
  await select.selectOption(targetState, { timeout: 5000 });
  await page.locator('form input[type="checkbox"]').check();
  await page.locator('textarea').fill(note);
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/transitions/') && r.request().method() === 'POST', { timeout: 15000 }),
    page.getByRole('button', { name: 'Execute Statutory Transition' }).click(),
  ]);
  expect(resp.status()).toBe(200);
  return resp.json();
}

test.describe('Role Dashboard Verification & Statutory Compliance', () => {
  for (const { index, role, expectedText } of ROLES) {
    test(`renders ${role} dashboard with honesty badges and 0 forbidden claims`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await loginAsRole(page, index);
        await expect(page.locator(`text=${expectedText}`).first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=DEMO').first()).toBeVisible();

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

    const validHash = '45fb94cbf2c2ae05c6f62b5f386384e96414a3c327191851468f9965abaf6830';
    await page.goto(`/verify/${validHash}`);

    await expect(page.locator('text=Authentic Document')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Audit Chain Intact')).toBeVisible();
    await expect(page.locator('text=Section 7 Show-Cause Notice')).toBeVisible();
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
    await page.goto(`/verify/${invalidHash}`);

    await expect(page.locator('text=Document Digest Not Found or Tampered')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Verification Failed')).toBeVisible();
    await context.close();
  });

  test.describe('Role-Based Authority: Statutory Authority & Action Boundary Specs', () => {
    test('VAO submits a verification (server row asserted); VAO has no court-report access', async ({ browser }) => {
      const fx = seedFixtures().vao;

      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 4);

      await page.locator('a[href="/field-queue"]').first().click();
      await expect(page).toHaveURL(/.*\/field-queue/, { timeout: 10000 });

      // The fixture card must exist; a missing card fails the test
      const card = page.locator(`text=${fx.survey_number}`).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      await card.click();
      await page.locator('textarea').fill('Verified on-ground encroachment via GPS boundary inspection.');

      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/verifications/') && r.request().method() === 'POST', { timeout: 15000 }),
        page.getByRole('button', { name: 'Submit Certified Inspection Record' }).click(),
      ]);
      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(String(data.alert)).toBe(fx.alert_id);

      // Server result: exactly one FieldVerification row now exists for the fixture alert
      const count = dbShell(
        `from core.models import FieldVerification; print('VERIF_COUNT=%d' % FieldVerification.objects.filter(alert_id='${fx.alert_id}').count())`
      );
      expect(count).toContain('VERIF_COUNT=1');

      // Refused action: a VAO has no ATR / court-report navigation
      await expect(page.locator('a[href="/atr"]')).toHaveCount(0);
      await context.close();
    });

    test('Tahsildar assigns a VAO (server audit row asserted); Tahsildar has no court-report access', async ({ browser }) => {
      const fx = seedFixtures().assign;

      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 0);

      await page.locator('a[href="/cases"]').first().click();
      await expect(page).toHaveURL(/.*\/cases/, { timeout: 10000 });

      // Find the fixture row via the work-queue search box, then open it
      await page.getByPlaceholder(/Search by Survey Number/i).fill(fx.survey_number);
      const row = page.locator('tr', { hasText: fx.survey_number }).first();
      await expect(row).toBeVisible({ timeout: 10000 });
      await row.getByRole('button', { name: 'Inspect' }).click();
      await expect(page.locator('text=Overview & Actions').first()).toBeVisible({ timeout: 10000 });

      const result = await executeTransition(page, 'VAO_ASSIGNED', 'Statutory assignment verified by Taluk Executive Magistrate.');
      expect(result.status).toBe('VAO_ASSIGNED');

      // Server result: alert state and an audit event for exactly this alert
      const check = dbShell(
        `from core.models import EncroachmentAlert, CaseAuditEvent; a = EncroachmentAlert.objects.get(id='${fx.alert_id}'); ` +
        `print('STATUS=' + a.status); ` +
        `print('AUDIT=%d' % CaseAuditEvent.objects.filter(alert=a, to_state='VAO_ASSIGNED').count())`
      );
      expect(check).toContain('STATUS=VAO_ASSIGNED');
      expect(check).toMatch(/AUDIT=[1-9]/);

      // Refused action: Tahsildar has no High Court ATR navigation
      await expect(page.locator('a[href="/atr"]')).toHaveCount(0);
      await context.close();
    });

    test('Collector opens the court report', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 1);

      await expect(page.locator('text=District Collector & Executive Magistrate').first()).toBeVisible({ timeout: 10000 });
      await page.locator('a[href="/atr"]').first().click();
      await expect(page).toHaveURL(/.*\/atr/, { timeout: 10000 });
      await expect(page.locator('text=Waterbody Protection & Action Taken Report').first()).toBeVisible();
      await context.close();
    });

    test('Vigilance sees no write buttons', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 3);

      await expect(page.locator('text=Vigilance & Anti-Corruption Audit').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=STATUTORY AUDIT (READ-ONLY)').first()).toBeVisible();

      await expect(page.locator('text=Issue Eviction Warrant')).not.toBeVisible();
      await expect(page.locator('text=Submit Verification')).not.toBeVisible();
      await expect(page.locator('text=Assign Officer')).not.toBeVisible();
      await context.close();
    });
  });

  test.describe('End-to-End Officer Journeys', () => {
    test('Journey 1: Standard Login navigates to dashboard', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 0);

      await expect(page.locator('text=Taluk Statutory Authority').first()).toBeVisible();
      await context.close();
    });

    test('Journey 2: Jurisdiction Scoping — cross-district data is completely absent', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 0);

      await expect(page.locator('text=Salem West').first()).toBeVisible();

      const content = await page.content();
      expect(content).not.toContain('Coimbatore North');
      expect(content).not.toContain('Peelamedu');
      await context.close();
    });

    test('Journey 3: Tahsildar schedules a hearing (server state asserted)', async ({ browser }) => {
      const fx = seedFixtures().hearing;

      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 0);

      await page.locator('a[href="/hearings"]').first().click();
      await expect(page).toHaveURL(/.*\/hearings/, { timeout: 10000 });

      // Fixture case is awaiting a reply; open it from the hearing docket
      const row = page.locator('tr', { hasText: fx.survey_number }).first();
      await expect(row).toBeVisible({ timeout: 10000 });
      await row.getByRole('button', { name: 'Examine Case' }).click();
      await expect(page.locator('text=Overview & Actions').first()).toBeVisible({ timeout: 10000 });

      const result = await executeTransition(page, 'HEARING_SCHEDULED', 'Personal hearing scheduled; occupant to appear with documents.');
      expect(result.status).toBe('HEARING_SCHEDULED');

      const check = dbShell(
        `from core.models import EncroachmentAlert, CaseAuditEvent; a = EncroachmentAlert.objects.get(id='${fx.alert_id}'); ` +
        `print('STATUS=' + a.status); ` +
        `print('AUDIT=%d' % CaseAuditEvent.objects.filter(alert=a, to_state='HEARING_SCHEDULED').count())`
      );
      expect(check).toContain('STATUS=HEARING_SCHEDULED');
      expect(check).toMatch(/AUDIT=[1-9]/);
      await context.close();
    });

    test('Journey 4: Disallowed Action is Hidden — VAO cannot view High Court ATR compliance docket', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsRole(page, 4);

      await expect(page.locator('a[href="/atr"]')).toHaveCount(0);
      await expect(page.locator('text=Madras High Court ATR Docket')).not.toBeVisible();
      await context.close();
    });

    test('Journey 5: Session Expiry Handled — unauthenticated access redirects to login prompt', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');
      await page.evaluate(() => fetch('/api/auth/logout/', { method: 'POST', credentials: 'include' }).catch(() => {}));
      await page.goto('/dashboard');
      await expect(page.locator('text=Revenue Officer Authentication Required')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Sign In with Officer Credentials')).toBeVisible();
      await context.close();
    });
  });
});
