// Main game loop and state machine
Game.Main = (function() {
  var state = '';
  var lastTime = 0;
  var transitionAlpha = 0;
  var transitionTarget = null;
  var transitionSpawnX = 0;
  var transitionSpawnY = 0;
  var dialogText = '';
  var pendingAction = null;

  function init() {
    Game.Renderer.init();
    Game.Input.init();
    Game.Audio.init();
    setState(Game.Config.STATE.TITLE);

    // Load extra enemies directly from globals
    if (window.GameData_Enemies && Game.Battle && Game.Battle.addEnemies) {
        Game.Battle.addEnemies(window.GameData_Enemies);
    }
    window.advanceTime = advanceTime;
    window.render_game_to_text = renderGameToText;
    window.warpToChapter = warpToChapter;

    // ── ストーリー分岐イベント登録（ch5 / ch10） ──
    // 学園長撃破前の演出イベント
    if (Game.Event && Game.Event.addEvent) {
      Game.Event.addEvent('gakuencho_battle_intro', {
        scenes: [
          {
            bg: '#0a0a1a',
            speaker: '学園長',
            speakerColor: '#ccaa00',
            lines: [
              '...ここまで来たか。',
              'この学園は記憶を書き換える場所。',
              '佐藤くんの記憶も、ここで「修正」した。',
              'お前たちの記憶も、書き換えてあげましょう。'
            ]
          },
          {
            bg: '#080818',
            speaker: null,
            lines: [
              '学園長が結界を展開した！',
              '記憶が揺れる...戦え！'
            ],
            effect: 'shake'
          }
        ]
      });
      // ラスボス前の演出イベント
      Game.Event.addEvent('juke_final_intro', {
        scenes: [
          {
            bg: '#000011',
            speaker: 'ジューク',
            speakerColor: '#ff4444',
            lines: [
              '...よく来た。本当に、よく来た。',
              '俺はこの土地の掟そのものだ。',
              '路線、結界、記憶の書き換え...全部俺が管理してきた。',
              'お前たちが帰りたければ俺を倒せ。'
            ]
          },
          {
            bg: '#04020e',
            speaker: '主人公',
            speakerColor: '#ffffff',
            lines: [
              '友達を返せ。名前を返せ。現実を返せ！',
              'これが...俺たちの決着だ！!'
            ],
            effect: 'shake'
          }
        ]
      });
    }

    // Load Chapter 10 endings from JS global
    if (window.GameData_Endings && Game.Event && Game.Event.registerEndingEvents) {
      Game.Event.registerEndingEvents(window.GameData_Endings);
    }

    // Mute key
    window.addEventListener('keydown', function(e) {
      if (e.code === 'KeyM') {
        Game.Audio.toggleMute();
      }
    });

    requestAnimationFrame(gameLoop);
  }

  function setState(newState) {
    state = newState;
  }

  function gameLoop(timestamp) {
    var dt = timestamp - lastTime;
    lastTime = timestamp;

    Game.Input.update();
    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    if (Game.Weather) Game.Weather.update();
    if (Game.Particles) Game.Particles.update();
    if (Game.UI.updatePopups) Game.UI.updatePopups();
    if (Game.Renderer.updateEffects) Game.Renderer.updateEffects();

    switch (state) {
      case Game.Config.STATE.TITLE:
        if (Game.UI.updateTitleMenu) Game.UI.updateTitleMenu();
        if (Game.Input.isPressed('confirm')) {
          var sel = Game.UI.getTitleSelection ? Game.UI.getTitleSelection() : 0;
          if (sel === 0) {
            Game.Audio.playSfx('confirm');
            startGame();
          } else if (sel === 1 && Game.Save && Game.Save.hasAnySave && Game.Save.hasAnySave()) {
            Game.Audio.playSfx('confirm');
            Game.SaveMenu.open({ context: 'title', action: 'load' });
            setState(Game.Config.STATE.SAVE);
          } else if (sel === 2) {
            Game.Audio.playSfx('confirm');
            Game.SaveMenu.open({ context: 'title', action: 'passphrase' });
            setState(Game.Config.STATE.SAVE);
          } else if (sel === 3) {
            Game.Audio.playSfx('confirm');
            // Show achievements (toggle back with confirm)
          }
        }
        break;

      case Game.Config.STATE.EXPLORING:
        Game.Player.update();

        // Check exits
        var pd = Game.Player.getData();
        var exit = Game.Map.checkExit(pd.tileX, pd.tileY);
        if (exit) {
          var targetMap = exit.target;
          var sx = exit.spawnX;
          var sy = exit.spawnY;
          var currentId = Game.Map.getCurrentMapId();
          
          if (currentId === 'gunma_world' && targetMap !== 'gunma_world') {
              pd.worldX = pd.tileX;
              pd.worldY = pd.tileY;
          }
          if (targetMap === 'gunma_world') {
              sx = pd.worldX || 25;
              sy = pd.worldY || 25;
              // Spawn right next to the town entrance so we don't trigger the entrance again immediately
              sy += 1;
          }
          startTransition(targetMap, sx, sy);
          break;
        }

        // Check item pickup on player tile
        var item = Game.Map.checkItem(pd.tileX, pd.tileY);
        if (item) {
          item.taken = true;
          Game.Player.addItem(item.id);
          var itemDef = Game.Items.get(item.id);
          var itemName = itemDef ? itemDef.name : item.id;
          dialogText = '「' + itemName + '」を手に入れた！';
          setState(Game.Config.STATE.DIALOG);
          Game.Audio.playSfx('item');
          break;
        }

        // Check border crossing
        var tile = Game.Map.getTile(pd.tileX, pd.tileY);
        if (tile === Game.Config.TILE.BORDER && Game.Player.hasAllKeys()) {
          if (pd.chapter === 1) {
            // Chapter 1 complete → transition to Chapter 2
            Game.Audio.stopBgm();
            setState(Game.Config.STATE.EVENT);
            Game.Event.start('ch1_ending', function() {
              startChapter2();
            });
          } else {
            setState(Game.Config.STATE.ENDING);
            Game.Audio.stopBgm();
            Game.Audio.playSfx('victory');
          }
          break;
        }

        // Interact with NPC
        if (Game.Input.isPressed('confirm')) {
          var facing = Game.Player.getFacingTile();
          var npc = Game.Map.getNpcAt(facing.x, facing.y);
          if (npc) {
            Game.Audio.playSfx('confirm');
            dialogText = Game.NPC.interact(npc);
            setState(Game.Config.STATE.DIALOG);
          }
        }

        // Open menu
        if (Game.Input.isPressed('cancel')) {
          if (Game.UI.openFieldMenu) Game.UI.openFieldMenu();
          setState(Game.Config.STATE.MENU);
          Game.Audio.playSfx('confirm');
        }
        break;

      case Game.Config.STATE.DIALOG:
        if (Game.Input.isPressed('confirm')) {
          var result = Game.NPC.advance();
          if (result.done) {
            if (result.action) {
              handleAction(result.action, result.npc);
            } else {
              setState(Game.Config.STATE.EXPLORING);
              Game.Audio.playSfx('cancel');
            }
          } else {
            dialogText = result.text;
            Game.Audio.playSfx('confirm');
          }
        }
        break;

      case Game.Config.STATE.BATTLE:
        var battleResult = Game.Battle.update();
        if (battleResult) {
          if (battleResult.result === 'victory') {
            // Give gold reward
            Game.Player.addGold(battleResult.goldReward || 50);
            
            // SPECIAL: Final Boss Check
            if (battleResult.npc && battleResult.npc.id === 'juke_final') {
                var endingId = determineEnding();
                setState(Game.Config.STATE.EVENT);
                Game.Event.start(endingId, function() {
                    setState(Game.Config.STATE.ENDING);
                });
                return;
            }

            // Apply EXP & Drops
            var expRes = Game.Player.addExp(battleResult.expReward || 0);
            if (battleResult.dropItem) {
                Game.Player.addItem(battleResult.dropItem);
            }
            
            var rewardMsg = (battleResult.expReward || 0) + 'EXP 獲得！\n';
            if (battleResult.dropItem) {
                var dItem = Game.Items.get(battleResult.dropItem);
                rewardMsg += '「' + (dItem ? dItem.name : battleResult.dropItem) + '」を手に入れた！\n';
            }
            if (expRes && expRes.leveledUp) {
                rewardMsg += 'レベルが ' + expRes.level + ' に上がった！\n' +
                             'HP+' + expRes.hpGained + ' ATK+' + expRes.atkGained + ' DEF+' + expRes.defGained + ' SPD+' + expRes.spdGained + '\n';
            }

            // Show defeated dialog
            Game.NPC.showDefeatedDialog(battleResult.npc);
            dialogText = rewardMsg + '\n' + Game.NPC.getCurrentDialog();
            setState(Game.Config.STATE.DIALOG);
            Game.Audio.playBgm('field');
          } else if (battleResult.result === 'defeat') {
            setState(Game.Config.STATE.GAMEOVER);
          } else if (battleResult.result === 'flee') {
            setState(Game.Config.STATE.EXPLORING);
          }
        }
        break;

      case Game.Config.STATE.PUZZLE:
        var puzzleResult = Game.Puzzle.update();
        if (puzzleResult) {
          if (puzzleResult.result === 'success') {
            Game.Player.addGold(40);
            Game.NPC.showDefeatedDialog(puzzleResult.npc);
            dialogText = Game.NPC.getCurrentDialog();
            setState(Game.Config.STATE.DIALOG);
            Game.Audio.playBgm('field');
          } else {
            setState(Game.Config.STATE.EXPLORING);
            Game.Audio.playBgm('field');
          }
        }
        break;

      case Game.Config.STATE.SHOP:
        var shopResult = Game.Shop.update();
        if (shopResult) {
          if (shopResult.result === 'exit') {
            setState(Game.Config.STATE.EXPLORING);
            Game.Audio.playBgm('field');
          }
        }
        break;

      case Game.Config.STATE.EVENT:
        var eventResult = Game.Event.update();
        if (eventResult) {
          if (eventResult.result === 'done') {
            setState(Game.Config.STATE.EXPLORING);
            if (!Game.Audio.isBgmPlaying()) {
              Game.Audio.playBgm('field');
            }
          }
        }
        break;

      case Game.Config.STATE.MENU:
        var menuResult = Game.UI.updateFieldMenu ? Game.UI.updateFieldMenu() : null;
        if (menuResult && menuResult.close) {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playSfx('cancel');
        }
        break;

      case Game.Config.STATE.SAVE:
        var saveResult = Game.SaveMenu.update ? Game.SaveMenu.update() : null;
        if (saveResult && saveResult.closeTo) {
          setState(saveResult.closeTo);
          if (saveResult.loaded && saveResult.closeTo === Game.Config.STATE.EXPLORING) {
            Game.Audio.playBgm('field');
          }
        }
        break;

      case Game.Config.STATE.TRANSITION:
        transitionAlpha += 0.05;
        if (transitionAlpha >= 1) {
          Game.Map.load(transitionTarget, transitionSpawnX, transitionSpawnY);
          // Auto-save on map transition
          if (Game.Save && Game.Save.autoSave) Game.Save.autoSave();
          // Set weather for new map
          if (Game.Weather && Game.Weather.setMapWeather) {
            var curMap = Game.Map.getCurrentMap();
            if (curMap) Game.Weather.setMapWeather(curMap.name);
          }
          transitionAlpha = 1;
          state = 'transition_out';
        }
        break;

      case 'transition_out':
        transitionAlpha -= 0.05;
        if (transitionAlpha <= 0) {
          transitionAlpha = 0;
          setState(Game.Config.STATE.EXPLORING);
        }
        break;

      case Game.Config.STATE.GAMEOVER:
        if (Game.Input.isPressed('confirm')) {
          setState(Game.Config.STATE.TITLE);
        }
        break;

      case Game.Config.STATE.ENDING:
        if (Game.Input.isPressed('confirm')) {
          Game.Audio.stopBgm();
          // Reset game state for next play
          if (Game.Player.reset) Game.Player.reset();
          if (Game.Story.reset) Game.Story.reset();
          setState(Game.Config.STATE.TITLE);
        }
        break;
    }
  }

  function handleAction(action, npc) {
    switch (action) {
      case 'battle_onsenMonkey':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('onsenMonkey', npc);
        break;
      case 'battle_cabbage':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('cabbage', npc);
        break;
      case 'puzzle_daruma':
        setState(Game.Config.STATE.PUZZLE);
        Game.Puzzle.start('daruma', npc);
        break;
      case 'puzzle_quiz':
        setState(Game.Config.STATE.PUZZLE);
        Game.Puzzle.start('quiz', npc);
        break;
      case 'event_opening':
        if (npc) npc.defeated = true;
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('opening', function() {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playBgm('field');
        });
        break;
      case 'event_firstKey':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('firstKey', function() {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playBgm('field');
        });
        break;
      case 'event_preBoss':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('preBoss', function() {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playBgm('field');
        });
        break;
      case 'event_allKeys':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('allKeys', function() {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playBgm('field');
        });
        break;
      case 'event_preEnding':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('preEnding', function() {
          setState(Game.Config.STATE.ENDING);
        });
        break;
      // Ikaho battle
      case 'battle_ishidanGuard':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('ishidanGuard', npc);
        break;
      // Chapter 2 battles
      case 'battle_angura_guard':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('anguraGuard', npc);
        break;
      case 'battle_chuji':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('preChuji', function() {
          setState(Game.Config.STATE.BATTLE);
          Game.Battle.start('chuji', npc);
        });
        break;
      case 'battle_angura_boss':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('preAnguraBoss', function() {
          setState(Game.Config.STATE.BATTLE);
          Game.Battle.start('anguraBoss', npc);
        });
        break;
      case 'event_ch2_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch2_ending', function() {
          setState(Game.Config.STATE.ENDING);
        });
        break;
      // ── 新規ボス戦アクション ──
      case 'battle_gakuencho_boss':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('gakuencho_battle_intro', function() {
          setState(Game.Config.STATE.BATTLE);
          Game.Battle.start('juke_gakuen', npc);
        });
        break;
      case 'battle_haruna_lake_beast':
        setState(Game.Config.STATE.BATTLE);
        Game.Audio.playBgm && Game.Audio.playBgm('boss');
        Game.Battle.start('haruna_lake_beast', npc);
        break;
      case 'battle_juke_minakami':
        setState(Game.Config.STATE.BATTLE);
        Game.Audio.playBgm && Game.Audio.playBgm('boss');
        Game.Battle.start('juke_minakami', npc);
        break;
      case 'battle_juke_final':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('juke_final_intro', function() {
          Game.Audio.playBgm && Game.Audio.playBgm('boss');
          setState(Game.Config.STATE.BATTLE);
          Game.Battle.start('juke_final', npc);
        });
        break;
      case 'save_priest':
        if (Game.SaveMenu && Game.SaveMenu.open) {
          Game.SaveMenu.open({ context: 'field' });
          setState(Game.Config.STATE.SAVE);
        } else {
          setState(Game.Config.STATE.EXPLORING);
        }
        break;
      default:
        // Check for shop actions: shop_<shopName>_<item1>,<item2>,...
        if (action.indexOf('shop_') === 0) {
          var parts = action.substring(5).split('_');
          var shopName = parts[0];
          var shopItemIds = parts[1] ? parts[1].split(',') : [];
          setState(Game.Config.STATE.SHOP);
          Game.Shop.start(shopName, shopItemIds);
        } else {
          setState(Game.Config.STATE.EXPLORING);
        }
    }
  }

  function startGame() {
    Game.Map.load('maebashi', 14, 8);
    setState(Game.Config.STATE.EXPLORING);
    Game.Audio.playBgm('field');

    // Reset all NPC states
    var allMaps = ['maebashi', 'takasaki', 'kusatsu', 'ikaho', 'shimonita', 'tomioka', 'tsumagoi',
                   'tamura', 'forest', 'konuma', 'onuma', 'akagi_ranch', 'akagi_shrine',
                   'gakuen', 'haruna', 'minakami', 'kentyou'];
    for (var m = 0; m < allMaps.length; m++) {
      var mapData = Game.Maps[allMaps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) {
          mapData.npcs[n].defeated = false;
        }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) {
          mapData.items[i].taken = false;
        }
      }
    }

    // Reset player
    var pd = Game.Player.getData();
    pd.hp = 100;
    pd.maxHp = 100;
    pd.gold = 100;
    pd.chapter = 1;
    pd.diceSlots = 1;
    pd.equippedDice = ['normalDice'];
    pd.armor = null;
    pd.inventory = [];

    if (Game.Story && Game.Story.reset) {
      Game.Story.reset();
      if (Game.Story.saveFlags) Game.Story.saveFlags();
    }
  }

  function startChapter2() {
    var pd = Game.Player.getData();
    pd.chapter = 2;
    // Keep current stats/gold/armor, but clear Ch1 keys
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    // Reset Ch2 map NPCs
    var ch2Maps = ['tamura', 'forest', 'konuma', 'onuma', 'akagi_ranch', 'akagi_shrine'];
    for (var m = 0; m < ch2Maps.length; m++) {
      var mapData = Game.Maps[ch2Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) {
          mapData.npcs[n].defeated = false;
        }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) {
          mapData.items[i].taken = false;
        }
      }
    }
    // Load forest (Ch2 starting map)
    Game.Map.load('forest', 10, 10);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch2_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startTransition(target, spawnX, spawnY) {
    transitionTarget = target;
    transitionSpawnX = spawnX;
    transitionSpawnY = spawnY;
    transitionAlpha = 0;
    setState(Game.Config.STATE.TRANSITION);
  }

  function render() {
    switch (state) {
      case Game.Config.STATE.TITLE:
        Game.UI.drawTitleScreen();
        break;

      case Game.Config.STATE.EXPLORING:
        renderExploring();
        break;

      case Game.Config.STATE.DIALOG:
        renderExploring();
        Game.UI.drawDialog(dialogText);
        break;

      case Game.Config.STATE.BATTLE:
        Game.Battle.draw();
        if (Game.Particles) Game.Particles.draw();
        if (Game.UI.drawPopups) Game.UI.drawPopups();
        break;

      case Game.Config.STATE.PUZZLE:
        Game.Puzzle.draw();
        break;

      case Game.Config.STATE.SHOP:
        Game.Shop.draw();
        break;

      case Game.Config.STATE.EVENT:
        Game.Event.draw();
        break;

      case Game.Config.STATE.MENU:
        renderExploring();
        Game.UI.drawMenu();
        break;

      case Game.Config.STATE.SAVE:
        if (Game.SaveMenu && Game.SaveMenu.getContext && Game.SaveMenu.getContext() === 'title') {
          Game.UI.drawTitleScreen();
        } else {
          renderExploring();
        }
        if (Game.SaveMenu && Game.SaveMenu.draw) Game.SaveMenu.draw();
        break;

      case Game.Config.STATE.TRANSITION:
      case 'transition_out':
        renderExploring();
        Game.UI.drawTransition(transitionAlpha);
        break;

      case Game.Config.STATE.GAMEOVER:
        Game.UI.drawGameOver();
        break;

      case Game.Config.STATE.ENDING:
        Game.UI.drawEnding();
        break;
    }
  }

  function renderExploring() {
    Game.Renderer.clear('#000');
    var pd = Game.Player.getData();
    Game.Renderer.setCamera(pd.x + 8, pd.y + 8);
    Game.Map.draw();
    Game.Player.draw();
    if (Game.Particles) Game.Particles.draw();
    if (Game.Weather) Game.Weather.draw();
    if (Game.Renderer.drawEffects) Game.Renderer.drawEffects();
    Game.UI.drawHUD();
    if (Game.UI.drawMinimap) Game.UI.drawMinimap();
    if (Game.UI.drawPopups) Game.UI.drawPopups();
  }

  function advanceTime(ms) {
    var steps = Math.max(1, Math.round((ms || 16) / (1000 / 60)));
    for (var i = 0; i < steps; i++) {
      Game.Input.update();
      update(1000 / 60);
      render();
    }
    return Promise.resolve();
  }

  function renderGameToText() {
    var pd = Game.Player.getData();
    return JSON.stringify({
      mode: state,
      titleSelection: Game.UI.getTitleSelection ? Game.UI.getTitleSelection() : 0,
      map: Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '',
      player: {
        tileX: pd.tileX,
        tileY: pd.tileY,
        direction: pd.direction,
        hp: pd.hp,
        maxHp: pd.maxHp,
        gold: pd.gold,
        chapter: pd.chapter
      },
      hasAnySave: Game.Save && Game.Save.hasAnySave ? Game.Save.hasAnySave() : false,
      saveMenuContext: Game.SaveMenu && Game.SaveMenu.getContext ? Game.SaveMenu.getContext() : null
    });
  }

  // ============================================================
  //  🛠️  DEBUG: warpToChapter(n)
  //
  //  ブラウザのコンソールから任意の章に即ワープするデバッグ関数。
  //  使い方:
  //    warpToChapter(1)  // 第1章（前橋）からスタート
  //    warpToChapter(5)  // 第5章（学園）からスタート（必須フラグ＋ステータス自動設定）
  //    warpToChapter(10) // 最終章（水上）からスタート
  //
  //  ※ 本番リリース時はこの関数ごと削除すること。
  // ============================================================
  function warpToChapter(chapterNum) {
    chapterNum = Math.max(1, Math.min(10, Math.floor(chapterNum) || 1));

    // ── 章ごとのスタート地点定義 ──────────────────────────────
    var chapterConfig = {
      1:  { map: 'maebashi',    spawnX: 14, spawnY: 8,  bgm: 'field' },
      2:  { map: 'tamura',      spawnX: 10, spawnY: 10, bgm: 'field' },
      3:  { map: 'tsumagoi',    spawnX: 10, spawnY: 10, bgm: 'field' },
      4:  { map: 'akagi_ranch', spawnX: 10, spawnY: 10, bgm: 'ch4_shirane' },
      5:  { map: 'gakuen',      spawnX: 14, spawnY: 17, bgm: 'ch5_gakuen' },
      6:  { map: 'akagi_shrine',spawnX: 10, spawnY: 10, bgm: 'ch6_tunnel' },
      7:  { map: 'haruna',      spawnX: 14, spawnY: 17, bgm: 'ch7_haruna' },
      8:  { map: 'konuma',      spawnX: 10, spawnY: 10, bgm: 'ch8_oze' },
      9:  { map: 'minakami',    spawnX: 14, spawnY: 10, bgm: 'ch9_minakami' },
      10: { map: 'kentyou',     spawnX: 14, spawnY: 17, bgm: 'ch10_border' }
    };

    var cfg = chapterConfig[chapterNum];
    if (!cfg) {
      console.warn('[warpToChapter] 対応する章が見つかりません: ' + chapterNum);
      return;
    }

    // ── 1. Story フラグをリセットして累積セット ──────────────
    if (Game.Story && Game.Story.reset) Game.Story.reset();

    // 各章に到達するまでに立っているべき必須フラグ
    var flagsByChapter = {
      // 第1章 : フラグなし（新規スタート相当）
      1: [],
      // 第2章 : 1章完了
      2: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained',
        'sato_test_cleared', 'ch1_complete'
      ],
      // 第3章 : 1-2章完了
      3: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete'
      ],
      // 第4章 : 1-3章完了（アカギ石化）
      4: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete',
        'ch3_started', 'shimonita_entered', 'konnyaku_king_cleared',
        'tsumagoi_entered', 'cabbage_guardian_cleared', 'akagi_weakened',
        'akagi_petrified', 'party_akagi_lost', 'angura_guard_cleared',
        'ch3_complete'
      ],
      // 第5章 : 1-4章完了（熊子撃破・浄化石入手）
      5: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete',
        'ch3_started', 'shimonita_entered', 'konnyaku_king_cleared',
        'tsumagoi_entered', 'cabbage_guardian_cleared', 'akagi_weakened',
        'akagi_petrified', 'party_akagi_lost', 'angura_guard_cleared',
        'ch3_complete',
        'ch4_started', 'kumako_info_received', 'shirane_entered',
        'kumako_met', 'kumako_steam_defeated', 'ch4_complete'
      ],
      // 第6章 : 1-5章完了（アカギ復活・学園クリア）
      6: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete',
        'ch3_started', 'shimonita_entered', 'konnyaku_king_cleared',
        'tsumagoi_entered', 'cabbage_guardian_cleared', 'akagi_weakened',
        'akagi_petrified', 'party_akagi_lost', 'angura_guard_cleared',
        'ch3_complete',
        'ch4_started', 'kumako_info_received', 'shirane_entered',
        'kumako_met', 'kumako_steam_defeated', 'ch4_complete',
        'ch5_started', 'gakuen_entered', 'sato_seat_found', 'missing_photo_found',
        'gakuencho_truth', 'juke_gakuen_defeated', 'sato_rescue_determined',
        'ch5_complete'
      ],
      // 第7章 : 1-6章完了（アカギ復活・国境トンネル突破）
      7: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete',
        'ch3_started', 'shimonita_entered', 'konnyaku_king_cleared',
        'tsumagoi_entered', 'cabbage_guardian_cleared', 'akagi_weakened',
        'akagi_petrified', 'party_akagi_lost', 'angura_guard_cleared',
        'ch3_complete',
        'ch4_started', 'kumako_info_received', 'shirane_entered',
        'kumako_met', 'kumako_steam_defeated', 'ch4_complete',
        'ch5_started', 'gakuen_entered', 'sato_seat_found', 'missing_photo_found',
        'gakuencho_truth', 'juke_gakuen_defeated', 'sato_rescue_determined',
        'ch5_complete',
        'ch6_started', 'akagi_revived', 'party_akagi_restored',
        'kazekaeshi_visited', 'return_name_event', 'echo_guardian_defeated',
        'tunnel_entered', 'border_tunnel', 'sato_kumako_tunnel_cleared',
        'ch6_complete'
      ],
      // 第8章 : 1-7章完了（山川加入）
      8: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete',
        'ch3_started', 'shimonita_entered', 'konnyaku_king_cleared',
        'tsumagoi_entered', 'cabbage_guardian_cleared', 'akagi_weakened',
        'akagi_petrified', 'party_akagi_lost', 'angura_guard_cleared',
        'ch3_complete',
        'ch4_started', 'kumako_info_received', 'shirane_entered',
        'kumako_met', 'kumako_steam_defeated', 'ch4_complete',
        'ch5_started', 'gakuen_entered', 'sato_seat_found', 'missing_photo_found',
        'gakuencho_truth', 'juke_gakuen_defeated', 'sato_rescue_determined',
        'ch5_complete',
        'ch6_started', 'akagi_revived', 'party_akagi_restored',
        'kazekaeshi_visited', 'return_name_event', 'echo_guardian_defeated',
        'tunnel_entered', 'border_tunnel', 'sato_kumako_tunnel_cleared',
        'ch6_complete',
        'ch7_started', 'yamakawa_found', 'haruna_path_blocked',
        'yamakawa_resolve', 'haruna_beast_defeated', 'party_yamakawa',
        'ch7_complete'
      ],
      // 第9章 : 1-8章完了（尾瀬クリア・古谷スマホ発見）
      9: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete',
        'ch3_started', 'shimonita_entered', 'konnyaku_king_cleared',
        'tsumagoi_entered', 'cabbage_guardian_cleared', 'akagi_weakened',
        'akagi_petrified', 'party_akagi_lost', 'angura_guard_cleared',
        'ch3_complete',
        'ch4_started', 'kumako_info_received', 'shirane_entered',
        'kumako_met', 'kumako_steam_defeated', 'ch4_complete',
        'ch5_started', 'gakuen_entered', 'sato_seat_found', 'missing_photo_found',
        'gakuencho_truth', 'juke_gakuen_defeated', 'sato_rescue_determined',
        'ch5_complete',
        'ch6_started', 'akagi_revived', 'party_akagi_restored',
        'kazekaeshi_visited', 'return_name_event', 'echo_guardian_defeated',
        'tunnel_entered', 'border_tunnel', 'sato_kumako_tunnel_cleared',
        'ch6_complete',
        'ch7_started', 'yamakawa_found', 'haruna_path_blocked',
        'yamakawa_resolve', 'haruna_beast_defeated', 'party_yamakawa',
        'ch7_complete',
        'ch8_started', 'oze_entered', 'rosen_revelation', 'memory_leak_aware',
        'oze_wraith_defeated', 'furuya_phone_found',
        'ch8_complete'
      ],
      // 第10章 : 1-9章完了（古谷加入）
      10: [
        'ch1_started', 'sato_letter_found', 'maebashi_reached',
        'akagi_joined_ch1', 'sato_met_ch1', 'dice_obtained', 'sato_test_cleared',
        'ch1_complete',
        'ch2_started', 'takasaki_entered', 'daruma_master_cleared',
        'kusatsu_entered', 'onsen_monkey_cleared', 'tamura_visited',
        'yuuma_clue_tamura', 'ch2_complete',
        'ch3_started', 'shimonita_entered', 'konnyaku_king_cleared',
        'tsumagoi_entered', 'cabbage_guardian_cleared', 'akagi_weakened',
        'akagi_petrified', 'party_akagi_lost', 'angura_guard_cleared',
        'ch3_complete',
        'ch4_started', 'kumako_info_received', 'shirane_entered',
        'kumako_met', 'kumako_steam_defeated', 'ch4_complete',
        'ch5_started', 'gakuen_entered', 'sato_seat_found', 'missing_photo_found',
        'gakuencho_truth', 'juke_gakuen_defeated', 'sato_rescue_determined',
        'ch5_complete',
        'ch6_started', 'akagi_revived', 'party_akagi_restored',
        'kazekaeshi_visited', 'return_name_event', 'echo_guardian_defeated',
        'tunnel_entered', 'border_tunnel', 'sato_kumako_tunnel_cleared',
        'ch6_complete',
        'ch7_started', 'yamakawa_found', 'haruna_path_blocked',
        'yamakawa_resolve', 'haruna_beast_defeated', 'party_yamakawa',
        'ch7_complete',
        'ch8_started', 'oze_entered', 'rosen_revelation', 'memory_leak_aware',
        'oze_wraith_defeated', 'furuya_phone_found', 'ch8_complete',
        'ch9_started', 'furuya_found', 'furuya_sacrifice_intent',
        'furuya_choice_made', 'furuya_join_true', 'juke_minakami_defeated',
        'party_furuya', 'ch9_complete'
      ]
    };

    var flagsToSet = flagsByChapter[chapterNum] || [];
    for (var i = 0; i < flagsToSet.length; i++) {
      if (Game.Story && Game.Story.setFlag) Game.Story.setFlag(flagsToSet[i]);
    }
    if (Game.Story && Game.Story.saveFlags) Game.Story.saveFlags();

    // ── 2. プレイヤーステータスをリセット＋章相応に引き上げる ──
    var pd = Game.Player.getData();

    // 章スタート相当の装備・ダイス構成
    var chapterStats = {
      //        hp,  maxHp, atk, def, gold, slots, dice
      1:  [100, 100,  12,  5,  100, 1, ['normalDice']],
      2:  [150, 150,  15,  7,  300, 2, ['normalDice', 'darumaDice']],
      3:  [200, 200,  18,  9,  600, 2, ['normalDice', 'cabbageDice']],
      4:  [260, 260,  22, 12,  900, 3, ['normalDice', 'cabbageDice', 'konnyakuDice']],
      5:  [320, 320,  26, 14, 1200, 3, ['normalDice', 'cabbageDice', 'konnyakuDice']],
      6:  [380, 380,  30, 17, 1600, 3, ['normalDice', 'onsenDice',   'konnyakuDice']],
      7:  [450, 450,  35, 20, 2000, 4, ['normalDice', 'onsenDice',   'cabbageDice', 'konnyakuDice']],
      8:  [530, 530,  40, 24, 2500, 4, ['normalDice', 'onsenDice',   'cabbageDice', 'konnyakuDice']],
      9:  [620, 620,  46, 28, 3000, 4, ['normalDice', 'onsenDice',   'cabbageDice', 'konnyakuDice']],
      10: [700, 700,  52, 32, 4000, 5, ['normalDice', 'onsenDice',   'cabbageDice', 'konnyakuDice', 'darumaDice']]
    };

    var st = chapterStats[chapterNum] || chapterStats[1];
    pd.chapter   = chapterNum;
    pd.hp        = st[0];
    pd.maxHp     = st[1];
    pd.attack    = st[2];
    pd.defense   = st[3];
    pd.gold      = st[4];
    pd.diceSlots = st[5];
    pd.equippedDice = st[6].slice();
    pd.armor     = null;
    pd.inventory = [];

    // 特定の章では鍵・アイテムをインベントリに補填
    if (chapterNum >= 5) {
      // 浄化の石（ch4で入手）
      pd.inventory.push('purifyStone');
    }
    if (chapterNum >= 6) {
      // 赤城神社で使用済みのため削除、代わりに切符を追加
      pd.inventory.push('shinjukuTicket');
    }
    if (chapterNum >= 8) {
      pd.inventory.push('furuyaPhone');
    }

    // ── 3. マップロード・BGM・ゲーム状態を EXPLORING に遷移 ──
    Game.Map.load(cfg.map, cfg.spawnX, cfg.spawnY);
    Game.Audio.stopBgm ? Game.Audio.stopBgm() : null;
    Game.Audio.playBgm(cfg.bgm);
    setState(Game.Config.STATE.EXPLORING);

    console.log(
      '%c[warpToChapter] ✅ 第' + chapterNum + '章にワープしました！',
      'color: #0f0; font-weight: bold;'
    );
    console.log('  マップ:', cfg.map, '  スポーン:', cfg.spawnX, cfg.spawnY);
    console.log('  HP:', pd.hp + '/' + pd.maxHp, '  ATK:', pd.attack, '  DEF:', pd.defense, '  G:', pd.gold);
    console.log('  セットされたフラグ数:', flagsToSet.length);
  }

  function determineEnding() {
    var S = Game.Story;
    // Check members
    var hasAkagi = S.hasFlag('flg_akagi_join') || S.hasFlag('party_akagi_restored');
    var hasYamakawa = S.hasFlag('party_yamakawa') || S.hasFlag('flg_yamakawa_join');
    var hasFuruya = S.hasFlag('party_furuya') || S.hasFlag('flg_furuya_join');
    
    // Check specific truth flag (optional, but requested in requirement)
    // Assume flags set in ch5/ch8/ch9 events
    var knowsTruth = S.hasFlag('gakuencho_truth') && S.hasFlag('rosen_revelation');

    if (hasAkagi && hasYamakawa && hasFuruya && knowsTruth) {
        return 'ch10_ending_C'; // TRUE
    } else if (hasAkagi || hasYamakawa || hasFuruya) {
        return 'ch10_ending_B'; // NORMAL
    }
    return 'ch10_ending_A'; // BAD
  }

  function triggerRandomEncounter() {
      if (!Game.Battle || !Game.Battle.getEnemies) return;
      var all = Game.Battle.getEnemies();
      var chapter = Game.Player.getData().chapter || 1;
      var possible = [];
      for (var key in all) {
          if (all[key].chapter === chapter || (chapter >= 5 && all[key].chapter >= 4)) {
              if (key.indexOf('mob_') === 0) {
                 possible.push(key);
              }
          }
      }
      if (possible.length > 0) {
          var eId = possible[Math.floor(Math.random() * possible.length)];
          setState(Game.Config.STATE.BATTLE);
          Game.Battle.start(eId, null);
      }
  }

  // Start when page loads
  window.addEventListener('load', init);

  return {
    init: init,
    setState: setState,
    determineEnding: determineEnding,
    triggerRandomEncounter: triggerRandomEncounter
  };
})();
