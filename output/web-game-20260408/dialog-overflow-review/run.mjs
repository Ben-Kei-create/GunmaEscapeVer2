import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/Users/fumiaki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const outDir = '/Users/fumiaki/Desktop/GunmaEscapeVer2/output/web-game-20260408/dialog-overflow-review';
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

async function getState(page, extraFn) {
  const renderState = parseJson(await page.evaluate(() => window.render_game_to_text()));
  const extraState = extraFn ? await page.evaluate(extraFn) : null;
  return { renderState, extraState };
}

async function capture(page, name, extraFn) {
  const canvas = page.locator('canvas').first();
  const screenshot = path.join(outDir, `${name}.png`);
  const statePath = path.join(outDir, `${name}.json`);
  await canvas.screenshot({ path: screenshot });
  const state = await getState(page, extraFn);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  return { screenshot, statePath, state };
}

async function createPage(browser, url = baseUrl) {
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
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await page.waitForTimeout(200);
  return { page, errors };
}

async function runNpcDialogScenario(browser) {
  const { page, errors } = await createPage(browser);
  await page.evaluate(async () => {
    if (window.localStorage) window.localStorage.clear();
    if (Game.Story && Game.Story.reset) Game.Story.reset();
    if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
    Game.Map.load('maebashi', 10, 10);
    const text = Game.NPC.openDialog([
      '境界の説明は長くなる。だからこそ、ひと息で押し切らず、読める速さと読める幅で旅人へ渡しなおさなければならない。'
    ]);
    const originalDrawDialog = Game.UI.drawDialog;
    Game.NPC.getCurrentNpcDisplayName = function() {
      return '境界案内の観測者';
    };
    Game.UI.drawDialog = function() {
      originalDrawDialog(text);
    };
    Game.Main.setState(Game.Config.STATE.DIALOG);
  });
  await advanceFrames(page, 1);
  const result = await capture(page, 'npc-dialog', () => ({
    dialogPreview: Game.NPC.getCurrentDialog ? Game.NPC.getCurrentDialog() : null
  }));
  await page.close();
  return { name: 'npc-dialog', errors, ...result };
}

async function runBattleMessageScenario(browser) {
  const { page, errors } = await createPage(browser, `${baseUrl}/?debugBattle=darumaMaster`);
  await advanceFrames(page, 80);
  await page.evaluate(() => {
    Game.Battle.debugSetMessage(
      '関所の声が重なりすぎている。いま見ているのは単なる注意文ではなく、戦況の整理と次の判断を同時に伝える長い戦況メッセージだ。',
      120
    );
  });
  await advanceFrames(page, 1);
  const result = await capture(page, 'battle-message', () => ({
    battle: Game.Battle.getStateSnapshot ? Game.Battle.getStateSnapshot() : null
  }));
  await page.close();
  return { name: 'battle-message', errors, ...result };
}

async function runBattleDialogueScenario(browser) {
  const { page, errors } = await createPage(browser, `${baseUrl}/?debugBattle=juke_final`);
  await advanceFrames(page, 80);
  await page.evaluate(() => {
    Game.Battle.debugQueueDialogue([
      {
        speaker: '真・ジューク',
        text: 'ここから先は数だけでは越えられない。おまえが並べる目と、そのあいだに残る沈黙まで、こちらは全部見ている。'
      }
    ]);
  });
  await advanceFrames(page, 1);
  const result = await capture(page, 'battle-dialogue', () => ({
    battle: Game.Battle.getStateSnapshot ? Game.Battle.getStateSnapshot() : null
  }));
  await page.close();
  return { name: 'battle-dialogue', errors, ...result };
}

async function runSaveMenuScenario(browser) {
  const { page, errors } = await createPage(browser);
  await page.evaluate(() => {
    if (window.localStorage) window.localStorage.clear();
    const originalIsPressed = Game.Input.isPressed;
    Game.Input.isPressed = function(key) {
      if (key === 'confirm') return true;
      return false;
    };
    Game.Save.loadPassphrase = function() {
      return {
        success: false,
        error: 'あいことばが古い記録形式のため読み込めない。新しい記録帳で作りなおした言葉を、もう一度静かに確かめてほしい。'
      };
    };
    window.prompt = function() { return 'invalid-passphrase'; };
    Game.SaveMenu.open({ context: 'title', action: 'passphrase' });
    Game.Main.setState(Game.Config.STATE.SAVE);
    Game.SaveMenu.update();
    Game.Input.isPressed = originalIsPressed;
  });
  await advanceFrames(page, 1);
  const result = await capture(page, 'save-menu-message', () => ({
    state: Game.SaveMenu.getContext ? { context: Game.SaveMenu.getContext() } : null
  }));
  await page.close();
  return { name: 'save-menu-message', errors, ...result };
}

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader']
});

const results = [];
results.push(await runNpcDialogScenario(browser));
results.push(await runBattleMessageScenario(browser));
results.push(await runBattleDialogueScenario(browser));
results.push(await runSaveMenuScenario(browser));

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  errorCount: results.reduce((sum, item) => sum + item.errors.length, 0),
  results
};

fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
