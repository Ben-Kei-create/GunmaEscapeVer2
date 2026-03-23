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
    if (Game.Weather) {
      Game.Weather.update();
    }

    switch (state) {
      case Game.Config.STATE.TITLE:
        if (Game.Input.isPressed('confirm')) {
          Game.Audio.playSfx('confirm');
          startGame();
        }
        break;

      case Game.Config.STATE.EXPLORING:
        Game.Player.update();

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
            // Show defeated dialog
            Game.NPC.showDefeatedDialog(battleResult.npc);
            dialogText = Game.NPC.getCurrentDialog();
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
        if (Game.Input.isPressed('cancel')) {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playSfx('cancel');
        }
        // Use heal item from menu
        if (Game.Input.isPressed('confirm')) {
          var inv = Game.Player.getData().inventory;
          for (var i = 0; i < inv.length; i++) {
            var itemDef2 = Game.Items.get(inv[i]);
            if (itemDef2 && itemDef2.type === 'heal') {
              Game.Player.heal(itemDef2.healAmount);
              Game.Player.removeItem(inv[i]);
              Game.Audio.playSfx('item');
              break;
            }
          }
        }
        break;

      case Game.Config.STATE.TRANSITION:
        transitionAlpha += 0.05;
        if (transitionAlpha >= 1) {
          Game.Map.load(transitionTarget, transitionSpawnX, transitionSpawnY);
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
    var allMaps = ['maebashi', 'takasaki', 'kusatsu', 'shimonita', 'tsumagoi',
                   'tamura', 'forest', 'konuma', 'onuma', 'akagi_ranch', 'akagi_shrine'];
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
    if (Game.Weather) {
      Game.Weather.draw();
    }
    Game.UI.drawHUD();
  }

  // Start when page loads
  window.addEventListener('load', init);

  return {
    init: init,
    setState: setState
  };
})();
