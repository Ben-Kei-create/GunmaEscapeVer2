import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/Users/fumiaki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const outDir = '/Users/fumiaki/Desktop/GunmaEscapeVer2/output/web-game-20260408/dice-loadout-rules';
const baseUrl = 'http://127.0.0.1:8000';

fs.mkdirSync(outDir, { recursive: true });

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text, parseError: String(error) };
  }
}

async function waitForGame(page) {
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && typeof window.advanceTime === 'function');
}

async function advanceFrames(page, frames) {
  await page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) {
      await window.advanceTime(1000 / 60);
    }
  }, frames);
}

async function getRenderState(page) {
  const text = await page.evaluate(() => window.render_game_to_text());
  return parseJson(text);
}

async function capture(page, name, extraStateFn) {
  const canvas = page.locator('canvas').first();
  const screenshotPath = path.join(outDir, `${name}.png`);
  const statePath = path.join(outDir, `${name}.json`);
  await canvas.screenshot({ path: screenshotPath });
  const renderState = await getRenderState(page);
  const extraState = extraStateFn ? await page.evaluate(extraStateFn) : null;
  const payload = { renderState, extraState };
  fs.writeFileSync(statePath, JSON.stringify(payload, null, 2));
  return { screenshot: screenshotPath, statePath, payload };
}

async function setupMenu(page, mutate) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    if (window.localStorage) window.localStorage.clear();
    if (Game.Story && Game.Story.reset) Game.Story.reset();
    if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
    if (Game.Shop && Game.Shop.resetState) Game.Shop.resetState();
    Game.Map.load('maebashi', 10, 10);
    Game.Main.setState(Game.Config.STATE.MENU);
    if (Game.UI && Game.UI.openFieldMenu) Game.UI.openFieldMenu();
    if (Game.UI && Game.UI.setFieldMenuSectionForDebug) Game.UI.setFieldMenuSectionForDebug(1);
  });
  if (mutate) {
    await page.evaluate(mutate);
  }
  await advanceFrames(page, 6);
}

async function runScenario(browser, name, mutate) {
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', text: msg.text() });
    }
  });
  page.on('pageerror', (error) => {
    errors.push({ type: 'pageerror', text: String(error) });
  });

  await setupMenu(page, mutate);
  const captureResult = await capture(page, name, () => {
    const pd = Game.Player.getData();
    return {
      diceSlots: pd.diceSlots,
      equippedDiceRaw: (pd.equippedDice || []).slice(),
      diceLoadout: Game.Player.getDiceLoadout ? Game.Player.getDiceLoadout() : [],
      equippedDice: Game.Player.getEquippedDice ? Game.Player.getEquippedDice() : [],
      inventory: (pd.inventory || []).slice()
    };
  });
  await page.close();
  return {
    name,
    screenshot: captureResult.screenshot,
    statePath: captureResult.statePath,
    errors,
    state: captureResult.payload
  };
}

async function runSaveRestoreScenario(browser) {
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', text: msg.text() });
    }
  });
  page.on('pageerror', (error) => {
    errors.push({ type: 'pageerror', text: String(error) });
  });

  await setupMenu(page, () => {
    const pd = Game.Player.getData();
    pd.inventory = [];
    pd.equippedDice = ['normalDice'];
    pd.diceSlots = 1;
    Game.Player.addDiceSlot();
    Game.Player.addDiceSlot();
    Game.Player.addItem('powerDice');
    Game.Player.equipDice('powerDice', 2);
    Game.Save.save(1);
    pd.equippedDice = ['normalDice', 'fireDice', 'fireDice'];
    pd.inventory = [];
    Game.Save.load(1);
    Game.Main.setState(Game.Config.STATE.MENU);
    if (Game.UI && Game.UI.openFieldMenu) Game.UI.openFieldMenu();
    if (Game.UI && Game.UI.setFieldMenuSectionForDebug) Game.UI.setFieldMenuSectionForDebug(1);
  });
  const captureResult = await capture(page, 'save-restore-menu', () => {
    const pd = Game.Player.getData();
    return {
      diceSlots: pd.diceSlots,
      equippedDiceRaw: (pd.equippedDice || []).slice(),
      diceLoadout: Game.Player.getDiceLoadout ? Game.Player.getDiceLoadout() : [],
      equippedDice: Game.Player.getEquippedDice ? Game.Player.getEquippedDice() : [],
      inventory: (pd.inventory || []).slice()
    };
  });
  await page.close();
  return {
    name: 'save-restore-menu',
    screenshot: captureResult.screenshot,
    statePath: captureResult.statePath,
    errors,
    state: captureResult.payload
  };
}

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader']
});

const results = [];

results.push(await runScenario(browser, 'pouch-only-menu', () => {
  const pd = Game.Player.getData();
  pd.inventory = [];
  pd.equippedDice = ['normalDice'];
  pd.diceSlots = 1;
  Game.Player.addDiceSlot();
  Game.Player.addDiceSlot();
}));

results.push(await runScenario(browser, 'inventory-only-menu', () => {
  const pd = Game.Player.getData();
  pd.inventory = [];
  pd.equippedDice = ['normalDice'];
  pd.diceSlots = 1;
  Game.Player.addDiceSlot();
  Game.Player.addDiceSlot();
  Game.Player.addItem('powerDice');
}));

results.push(await runSaveRestoreScenario(browser));

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  results,
  errorCount: results.reduce((sum, item) => sum + item.errors.length, 0)
};

fs.writeFileSync(
  path.join(outDir, 'summary.json'),
  JSON.stringify(summary, null, 2)
);
