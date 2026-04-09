import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/Users/fumiaki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const outDir = '/Users/fumiaki/Desktop/GunmaEscapeVer2/output/web-game-20260408/illustration-review';
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

async function getState(page) {
  const text = await page.evaluate(() => window.render_game_to_text());
  return parseJson(text);
}

async function captureCanvas(page, name) {
  const canvas = page.locator('canvas').first();
  const screenshotPath = path.join(outDir, `${name}.png`);
  const statePath = path.join(outDir, `${name}.json`);
  await canvas.screenshot({ path: screenshotPath });
  const state = await getState(page);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  return { screenshot: screenshotPath, statePath, state };
}

async function scenarioEventCard(browser, name, motion, lines, speaker, speakerColor) {
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

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await page.waitForTimeout(200);

  await page.evaluate(({ id, motionName, eventLines, nameText, colorText }) => {
    if (window.localStorage) window.localStorage.clear();
    if (Game.Story && Game.Story.reset) Game.Story.reset();
    if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
    if (Game.Shop && Game.Shop.resetState) Game.Shop.resetState();
    if (Game.Event && Game.Event.addEvent) {
      Game.Event.addEvent(id, [{
        bg: '#0d1523',
        speaker: nameText,
        speakerColor: colorText,
        motion: motionName,
        lines: eventLines,
        effect: 'fade'
      }]);
    }
    Game.Main.setState(Game.Config.STATE.EVENT);
    Game.Event.start(id, function() {});
  }, {
    id: `illustration_preview_${name}`,
    motionName: motion,
    eventLines: lines,
    nameText: speaker,
    colorText: speakerColor
  });

  await advanceFrames(page, 240);
  const capture = await captureCanvas(page, name);
  await page.close();
  return {
    name,
    type: 'event',
    motion,
    errors,
    screenshot: capture.screenshot,
    statePath: capture.statePath,
    state: capture.state
  };
}

async function scenarioBossCard(browser, name, enemyId) {
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

  await page.goto(`${baseUrl}/?debugBattle=${encodeURIComponent(enemyId)}`, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await page.waitForTimeout(250);
  await advanceFrames(page, 4);

  const capture = await captureCanvas(page, name);
  await page.close();
  return {
    name,
    type: 'boss',
    enemyId,
    errors,
    screenshot: capture.screenshot,
    statePath: capture.statePath,
    state: capture.state
  };
}

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader']
});

const results = [];

results.push(await scenarioEventCard(
  browser,
  'event-opening-card',
  'road_trip',
  [
    '夜の県境を抜ける車窓に、街の灯りが途切れ途切れに浮かぶ。',
    '言葉より先に、帰れない距離だけが静かに伝わってくる。'
  ],
  '語り手',
  '#d7bb7a'
));

results.push(await scenarioEventCard(
  browser,
  'event-lake-card',
  'lake_mist',
  [
    '榛名の水面は、霧の下でまだ誰かの気配を抱えたまま揺れている。',
    '近づくほど静かになって、音だけがこちらを見返してくる。'
  ],
  '山川',
  '#9ed9d2'
));

results.push(await scenarioBossCard(browser, 'boss-daruma-card', 'darumaMaster'));
results.push(await scenarioBossCard(browser, 'boss-final-card', 'juke_final'));

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
