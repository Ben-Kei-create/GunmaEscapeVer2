import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/Users/fumiaki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const outDir = '/Users/fumiaki/Desktop/GunmaEscapeVer2/output/web-game-20260408/typography-review';
const baseUrl = 'http://127.0.0.1:8000';

fs.mkdirSync(outDir, { recursive: true });

function readJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text, parseError: String(error) };
  }
}

async function advanceFrames(page, frames) {
  await page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) {
      if (typeof window.advanceTime === 'function') {
        await window.advanceTime(1000 / 60);
      }
    }
  }, frames);
}

async function tapKey(page, key) {
  await page.keyboard.down(key);
  await advanceFrames(page, 1);
  await page.keyboard.up(key);
}

async function getState(page) {
  const text = await page.evaluate(() => {
    if (typeof window.render_game_to_text === 'function') {
      return window.render_game_to_text();
    }
    return null;
  });
  return readJson(text);
}

async function captureScenario(browser, name, options) {
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

  await page.goto(options.url || baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));

  if (options.setup) {
    await options.setup(page);
  }
  if (options.actions) {
    await options.actions(page);
  }
  if (options.advance) {
    await advanceFrames(page, options.advance);
  }

  const canvas = page.locator('canvas').first();
  const screenshotPath = path.join(outDir, `${name}.png`);
  const statePath = path.join(outDir, `${name}.json`);
  await canvas.screenshot({ path: screenshotPath });
  const state = await getState(page);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  await page.close();
  return {
    name,
    screenshot: screenshotPath,
    statePath,
    errors,
    state
  };
}

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader']
});

const scenarios = [
  {
    name: 'banner-forest',
    setup: async (page) => {
      await page.evaluate(async () => {
        if (Game.Story && Game.Story.reset) Game.Story.reset();
        if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
        if (Game.Shop && Game.Shop.resetState) Game.Shop.resetState();
        if (Game.Story && Game.Story.setFlag) Game.Story.setFlag('arrival_forest_auto');
        Game.Map.load('forest', 10, 10);
        Game.Player.getData().chapter = 3;
        Game.Main.setState(Game.Config.STATE.EXPLORING);
        Game.UI.showAreaBanner('forest', {
          detailLine: '森と湖には、運び切れなかったものの気配が沈んでいる。'
        });
      });
    },
    advance: 8
  },
  {
    name: 'field-menu',
    setup: async (page) => {
      await page.evaluate(async () => {
        if (Game.Story && Game.Story.reset) Game.Story.reset();
        if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
        if (Game.Story && Game.Story.setFlag) Game.Story.setFlag('arrival_forest_auto');
        Game.Map.load('forest', 10, 10);
        for (let i = 0; i < 190; i++) {
          await window.advanceTime(1000 / 60);
        }
        Game.Player.getData().chapter = 3;
        if (Game.Player && Game.Player.setPartyMembers) {
          Game.Player.setPartyMembers(['akagi', 'yamakawa', 'furuya']);
        }
        Game.Main.setState(Game.Config.STATE.MENU);
        if (Game.UI && Game.UI.setFieldMenuSectionForDebug) {
          Game.UI.setFieldMenuSectionForDebug(4);
        }
      });
    },
    advance: 3
  },
  {
    name: 'quest-log',
    setup: async (page) => {
      await page.evaluate(async () => {
        if (Game.Story && Game.Story.reset) Game.Story.reset();
        if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
        if (Game.Story && Game.Story.setFlag) Game.Story.setFlag('arrival_ikaho_auto');
        Game.Map.load('ikaho', 10, 10);
        for (let i = 0; i < 190; i++) {
          await window.advanceTime(1000 / 60);
        }
        Game.Player.getData().chapter = 1;
        if (Game.Story && Game.Story.setFlag) Game.Story.setFlag('env_ikaho_stone_steps');
        if (Game.Quests && Game.Quests.visitMap) Game.Quests.visitMap('ikaho');
        if (Game.Quests && Game.Quests.open) Game.Quests.open();
        Game.Main.setState(Game.Config.STATE.EXPLORING);
      });
    },
    advance: 3
  },
  {
    name: 'save-slots',
    setup: async (page) => {
      await page.evaluate(async () => {
        if (Game.Story && Game.Story.reset) Game.Story.reset();
        if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
        if (Game.Story && Game.Story.setFlag) Game.Story.setFlag('arrival_maebashi_auto');
        Game.Map.load('maebashi', 10, 10);
        for (let i = 0; i < 190; i++) {
          await window.advanceTime(1000 / 60);
        }
        if (Game.Save && Game.Save.save) Game.Save.save(1);
        if (Game.SaveMenu && Game.SaveMenu.open) {
          Game.SaveMenu.open({ context: 'title', action: 'load' });
        }
        Game.Main.setState(Game.Config.STATE.SAVE);
      });
    },
    advance: 3
  },
  {
    name: 'shop-confirm',
    setup: async (page) => {
      await page.evaluate(async () => {
        if (Game.Story && Game.Story.reset) Game.Story.reset();
        if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
        if (Game.Shop && Game.Shop.resetState) Game.Shop.resetState();
        if (Game.Story && Game.Story.setFlag) Game.Story.setFlag('arrival_maebashi_auto');
        Game.Map.load('maebashi', 10, 10);
        for (let i = 0; i < 190; i++) {
          await window.advanceTime(1000 / 60);
        }
        Game.Player.getData().gold = 60;
        Game.Shop.start('前橋道具屋', ['healHerb', 'yakimanju', 'tempoCharm', 'leatherArmor']);
        Game.Main.setState(Game.Config.STATE.SHOP);
      });
    },
    actions: async (page) => {
      await tapKey(page, 'Enter');
    },
    advance: 4
  },
  {
    name: 'event-dialogue',
    setup: async (page) => {
      await page.evaluate(async () => {
        if (Game.Story && Game.Story.reset) Game.Story.reset();
        if (Game.Quests && Game.Quests.reset) Game.Quests.reset();
        if (Game.Event && Game.Event.addEvent) {
          Game.Event.addEvent('typography_preview', [
            {
              bg: '#101726',
              speaker: 'アカギ',
              speakerColor: '#cc6633',
              lines: [
                '文字の幅を見直すため、少し長めの台詞をここで確認する。',
                '焦らなくていい。読める間合いが残っていれば、画面はちゃんと息をする。'
              ],
              effect: 'fade'
            }
          ]);
        }
        Game.Main.setState(Game.Config.STATE.EVENT);
        Game.Event.start('typography_preview', function() {});
        for (let i = 0; i < 220; i++) {
          await window.advanceTime(1000 / 60);
        }
      });
    },
    advance: 2
  },
  {
    name: 'battle-reward',
    url: baseUrl + '/?debugBattle=roadsideBandit&debugAttack=99',
    actions: async (page) => {
      for (let step = 0; step < 60; step++) {
        const state = await getState(page);
      const phase = state && state.battle ? state.battle.phase : null;
      if (phase === 'reward') break;
      if (phase === 'intro') {
        await advanceFrames(page, 6);
        continue;
      }
      if (phase === 'menu' || phase === 'diceRoll') {
        await tapKey(page, 'Space');
        await advanceFrames(page, 4);
        continue;
      }
        await advanceFrames(page, 6);
      }
    },
    advance: 3
  }
];

const results = [];
for (const scenario of scenarios) {
  results.push(await captureScenario(browser, scenario.name, scenario));
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  scenarios: results.map((entry) => ({
    name: entry.name,
    screenshot: entry.screenshot,
    mode: entry.state ? entry.state.mode : null,
    battlePhase: entry.state && entry.state.battle ? entry.state.battle.phase : null,
    hasAreaBanner: !!(entry.state && entry.state.ui && entry.state.ui.areaBanner),
    questOpen: !!(entry.state && entry.state.quests && entry.state.quests.open),
    saveContext: entry.state ? entry.state.saveMenuContext : null,
    shopMessage: entry.state && entry.state.shop ? entry.state.shop.message : null,
    eventId: entry.state && entry.state.event ? entry.state.event.eventId : null,
    consoleErrors: entry.errors.length
  }))
};

fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
