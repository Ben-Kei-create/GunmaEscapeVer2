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
  var storyBattleContext = null;

  function init() {
    Game.Renderer.init();
    Game.Input.init();
    Game.Audio.init();
    setState(Game.Config.STATE.TITLE);
    window.advanceTime = advanceTime;
    window.render_game_to_text = renderGameToText;

    // Mute key
    window.addEventListener('keydown', function(e) {
      if (e.code === 'KeyM') {
        Game.Audio.toggleMute();
      }
    });

    applyDebugLaunchOptions();
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
    if (Game.UI.updateAreaBanner) Game.UI.updateAreaBanner();
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
        var stepInfo = Game.Player.consumeCompletedStep ? Game.Player.consumeCompletedStep() : null;

        // Check exits
        var pd = Game.Player.getData();
        var exit = Game.Map.checkExit(pd.tileX, pd.tileY);
        if (exit) {
          startTransition(exit.target, exit.spawnX, exit.spawnY);
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

        if (stepInfo && Game.Encounters && Game.Encounters.consumeStep) {
          var encounterEnemy = Game.Encounters.consumeStep(Game.Map.getCurrentMapId(), tile);
          if (encounterEnemy) {
            setState(Game.Config.STATE.BATTLE);
            Game.Battle.start(encounterEnemy, null);
            break;
          }
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
            if (battleResult.goldReward) {
              Game.Player.addGold(battleResult.goldReward);
            }
            if (storyBattleContext) {
              var resume = storyBattleContext;
              storyBattleContext = null;
              if (resume.afterBattle && resume.afterBattle.length) {
                setState(Game.Config.STATE.EVENT);
                Game.Story.startEvent(resume.afterBattle, resume.afterCallback || null);
              } else if (resume.afterCallback) {
                resume.afterCallback();
              } else {
                setState(Game.Config.STATE.EXPLORING);
                Game.Audio.playBgm('field');
              }
            } else {
              if (battleResult.npc) {
                Game.NPC.showDefeatedDialog(battleResult.npc);
                dialogText = Game.NPC.getCurrentDialog();
                setState(Game.Config.STATE.DIALOG);
              } else {
                setState(Game.Config.STATE.EXPLORING);
              }
              Game.Audio.playBgm('field');
            }
          } else if (battleResult.result === 'defeat') {
            storyBattleContext = null;
            setState(Game.Config.STATE.GAMEOVER);
          } else if (battleResult.result === 'ritual_fail') {
            storyBattleContext = null;
            if (battleResult.returnEventId && Game.Event && Game.Event.hasEvent && Game.Event.hasEvent(battleResult.returnEventId)) {
              setState(Game.Config.STATE.EVENT);
              Game.Event.start(battleResult.returnEventId, function() {
                setState(Game.Config.STATE.EXPLORING);
                Game.Audio.playBgm('field');
              });
            } else {
              setState(Game.Config.STATE.EXPLORING);
              Game.Audio.playBgm('field');
            }
          } else if (battleResult.result === 'flee') {
            storyBattleContext = null;
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
          startChapter3();
        });
        break;
      case 'battle_kumako_steam':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('kumako_steam', npc);
        break;
      case 'event_ch3_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch3_ending', function() {
          startChapter4();
        });
        break;
      case 'battle_yubatake':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('yubatake_guardian', npc);
        break;
      case 'battle_thread_maiden':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('threadMaiden', npc);
        break;
      case 'event_ch4_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch4_ending', function() {
          startChapter5();
        });
        break;
      case 'battle_juke_gakuen':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('juke_gakuen', npc);
        break;
      case 'event_ch5_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch5_ending', function() {
          startChapter6();
        });
        break;
      case 'battle_echo_guardian':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('echo_guardian', npc);
        break;
      case 'battle_sato_kumako':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('sato_kumako_tunnel', npc);
        break;
      case 'event_ch6_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch6_ending', function() {
          startChapter7();
        });
        break;
      case 'battle_haruna_beast':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('haruna_lake_beast', npc);
        break;
      case 'event_ch7_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch7_ending', function() {
          startChapter8();
        });
        break;
      case 'battle_oze_wraith':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('oze_mud_wraith', npc);
        break;
      case 'event_ch8_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch8_ending', function() {
          startChapter9();
        });
        break;
      case 'battle_juke_minakami':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('juke_minakami', npc);
        break;
      case 'event_ch9_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch9_ending', function() {
          startChapter10();
        });
        break;
      case 'battle_juke_final':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('juke_final', npc);
        break;
      case 'event_ch10_ending':
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('ch10_ending', function() {
          setState(Game.Config.STATE.ENDING);
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

  function resetNewGameState() {
    // Reset all NPC states
    var allMaps = ['maebashi', 'takasaki', 'kusatsu', 'ikaho', 'shimonita', 'tomioka', 'tsumagoi',
                   'tamura', 'forest', 'konuma', 'onuma', 'akagi_ranch', 'akagi_shrine',
                   'shirane_trail', 'kusatsu_deep', 'jomo_gakuen', 'tanigawa_tunnel',
                   'haruna_lake', 'oze_marsh', 'minakami_valley', 'border_tunnel'];
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
    pd.partyMembers = [];
    pd.inventory = [];

    if (Game.Story && Game.Story.reset) {
      Game.Story.reset();
      if (Game.Story.saveFlags) Game.Story.saveFlags();
    }
  }

  function startGame() {
    resetNewGameState();
    Game.Map.load('maebashi', 14, 8);
    setState(Game.Config.STATE.EVENT);
    Game.Audio.stopBgm();
    Game.Event.start('opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      if (Game.UI && Game.UI.showAreaBanner) Game.UI.showAreaBanner('maebashi');
      Game.Audio.playBgm('field');
    });
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

  function startChapter3() {
    var pd = Game.Player.getData();
    pd.chapter = 3;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch3Maps = ['shirane_trail'];
    for (var m = 0; m < ch3Maps.length; m++) {
      var mapData = Game.Maps[ch3Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('shirane_trail', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch3_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startChapter4() {
    var pd = Game.Player.getData();
    pd.chapter = 4;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch4Maps = ['kusatsu_deep'];
    for (var m = 0; m < ch4Maps.length; m++) {
      var mapData = Game.Maps[ch4Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('kusatsu_deep', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch4_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startChapter5() {
    var pd = Game.Player.getData();
    pd.chapter = 5;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch5Maps = ['jomo_gakuen'];
    for (var m = 0; m < ch5Maps.length; m++) {
      var mapData = Game.Maps[ch5Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('jomo_gakuen', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch5_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startChapter6() {
    var pd = Game.Player.getData();
    pd.chapter = 6;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch6Maps = ['tanigawa_tunnel'];
    for (var m = 0; m < ch6Maps.length; m++) {
      var mapData = Game.Maps[ch6Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('tanigawa_tunnel', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch6_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startChapter7() {
    var pd = Game.Player.getData();
    pd.chapter = 7;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch7Maps = ['haruna_lake'];
    for (var m = 0; m < ch7Maps.length; m++) {
      var mapData = Game.Maps[ch7Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('haruna_lake', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch7_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startChapter8() {
    var pd = Game.Player.getData();
    pd.chapter = 8;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch8Maps = ['oze_marsh'];
    for (var m = 0; m < ch8Maps.length; m++) {
      var mapData = Game.Maps[ch8Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('oze_marsh', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch8_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startChapter9() {
    var pd = Game.Player.getData();
    pd.chapter = 9;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch9Maps = ['minakami_valley'];
    for (var m = 0; m < ch9Maps.length; m++) {
      var mapData = Game.Maps[ch9Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('minakami_valley', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch9_opening', function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
  }

  function startChapter10() {
    var pd = Game.Player.getData();
    pd.chapter = 10;
    pd.inventory = pd.inventory.filter(function(id) {
      var item = Game.Items.get(id);
      return !item || item.type !== 'key';
    });
    var ch10Maps = ['border_tunnel'];
    for (var m = 0; m < ch10Maps.length; m++) {
      var mapData = Game.Maps[ch10Maps[m]];
      if (mapData && mapData.npcs) {
        for (var n = 0; n < mapData.npcs.length; n++) { mapData.npcs[n].defeated = false; }
      }
      if (mapData && mapData.items) {
        for (var i = 0; i < mapData.items.length; i++) { mapData.items[i].taken = false; }
      }
    }
    Game.Map.load('border_tunnel', 14, 18);
    setState(Game.Config.STATE.EVENT);
    Game.Event.start('ch10_opening', function() {
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
        renderExploring(true);
        Game.UI.drawMenu();
        break;

      case Game.Config.STATE.SAVE:
        if (Game.SaveMenu && Game.SaveMenu.getContext && Game.SaveMenu.getContext() === 'title') {
          Game.UI.drawTitleScreen();
        } else {
          renderExploring(true);
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

  function renderExploring(overlayMode) {
    Game.Renderer.clear('#000');
    var pd = Game.Player.getData();
    Game.Renderer.setCamera(pd.x + 8, pd.y + 8);
    Game.Map.draw();
    Game.Player.draw();
    if (Game.Particles) Game.Particles.draw();
    if (Game.Weather) Game.Weather.draw();
    if (Game.Renderer.drawEffects) Game.Renderer.drawEffects();
    if (!overlayMode) {
      Game.UI.drawHUD();
      if (Game.UI.drawMinimap) Game.UI.drawMinimap();
      if (Game.UI.drawAreaBanner) Game.UI.drawAreaBanner();
    }
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
    var mapId = Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '';
    var chapterInfo = Game.Chapters && Game.Chapters.getChapter ? Game.Chapters.getChapter(pd.chapter, mapId) : null;
    var mapInfo = Game.Chapters && Game.Chapters.getMap && mapId ? Game.Chapters.getMap(mapId) : null;
    var journeyState = Game.Story && Game.Story.getJourneyState ? Game.Story.getJourneyState() : { respectGauge: 0, catalysts: [] };
    var payload = {
      mode: state,
      titleSelection: Game.UI.getTitleSelection ? Game.UI.getTitleSelection() : 0,
      map: mapId,
      mapLabel: mapInfo ? mapInfo.label : '',
      player: {
        tileX: pd.tileX,
        tileY: pd.tileY,
        direction: pd.direction,
        hp: pd.hp,
        maxHp: pd.maxHp,
        gold: pd.gold,
        chapter: pd.chapter
      },
      journeyLabel: chapterInfo ? chapterInfo.displayLabel : '',
      journeyIndex: chapterInfo ? chapterInfo.journeyIndex : pd.chapter,
      chapterTitle: chapterInfo ? chapterInfo.title : '',
      objective: Game.Chapters && Game.Chapters.getObjective ? Game.Chapters.getObjective(pd.chapter, mapId) : '',
      respectGauge: journeyState.respectGauge || 0,
      catalystCount: journeyState.catalysts ? journeyState.catalysts.length : 0,
      party: Game.Player.getPartyMemberIds ? Game.Player.getPartyMemberIds() : [],
      hasAnySave: Game.Save && Game.Save.hasAnySave ? Game.Save.hasAnySave() : false,
      saveMenuContext: Game.SaveMenu && Game.SaveMenu.getContext ? Game.SaveMenu.getContext() : null
    };
    if (Game.Encounters && Game.Encounters.getState) {
      payload.encounters = Game.Encounters.getState();
    }
    if (state === Game.Config.STATE.BATTLE && Game.Battle && Game.Battle.getStateSnapshot) {
      payload.battle = Game.Battle.getStateSnapshot();
    }
    return JSON.stringify(payload);
  }

  function applyDebugLaunchOptions() {
    if (typeof window === 'undefined' || !window.location || !window.location.search) return;
    var params = new URLSearchParams(window.location.search);
    var debugBattle = params.get('debugBattle');
    if (!debugBattle) return;

    var pd = Game.Player.getData();
    var debugInventory = params.get('debugInventory');
    pd.inventory = debugInventory ? debugInventory.split(',').filter(Boolean) : [];
    pd.equippedDice = ['normalDice'];
    pd.hp = pd.maxHp;

    setState(Game.Config.STATE.BATTLE);
    Game.Battle.start(debugBattle, null);
  }

  // Start when page loads
  window.addEventListener('load', init);

  function startStoryBattle(enemyId, afterBattle, afterCallback) {
    storyBattleContext = {
      afterBattle: afterBattle || null,
      afterCallback: afterCallback || null
    };
    setState(Game.Config.STATE.BATTLE);
    Game.Battle.start(enemyId, null);
  }

  return {
    init: init,
    setState: setState,
    startStoryBattle: startStoryBattle,
    applyDebugLaunchOptions: applyDebugLaunchOptions
  };
})();
