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
  var pendingArrivalCheck = '';

  function init() {
    Game.Renderer.init();
    Game.Input.init();
    Game.Audio.init();
    setState(Game.Config.STATE.TITLE);
    if (Game.UI && Game.UI.startIntroMovie) Game.UI.startIntroMovie();
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

  function markMapVisited(mapId) {
    if (!mapId) return;
    pendingArrivalCheck = mapId;
    if (Game.Story && Game.Story.setFlag) {
      Game.Story.setFlag('visited_' + mapId);
      if (Game.Story.saveFlags) Game.Story.saveFlags();
    }
    if (Game.Achievements && Game.Achievements.check) {
      Game.Achievements.check(mapId);
    }
    if (Game.Quests && Game.Quests.visitMap) {
      Game.Quests.visitMap(mapId);
    }
  }

  function startForcedEvent(eventId, onComplete) {
    setState(Game.Config.STATE.EVENT);
    Game.Event.start(eventId, function() {
      if (onComplete) {
        onComplete();
      } else {
        setState(Game.Config.STATE.EXPLORING);
        if (!Game.Audio.isBgmPlaying()) Game.Audio.playBgm('field');
      }
    });
  }

  function maybeStartArrivalEvent() {
    var mapId = pendingArrivalCheck;
    if (!mapId) return false;
    pendingArrivalCheck = '';
    if (!Game.Story || !Game.Story.hasFlag || !Game.Story.setFlag) return false;

    var eventMap = {
      takasaki: { flag: 'arrival_takasaki_auto', eventId: 'arrival_takasaki_auto' },
      shimonita: { flag: 'arrival_shimonita_auto', eventId: 'arrival_shimonita_auto' },
      tomioka: { flag: 'arrival_tomioka_auto', eventId: 'arrival_tomioka_auto' },
      kusatsu: { flag: 'arrival_kusatsu_auto', eventId: 'arrival_kusatsu_auto' },
      ikaho: { flag: 'arrival_ikaho_auto', eventId: 'arrival_ikaho_auto' },
      akagi_ranch: { flag: 'arrival_akagi_ranch_auto', eventId: 'arrival_akagi_ranch_auto' }
    };
    var entry = eventMap[mapId];
    if (!entry || Game.Story.hasFlag(entry.flag)) return false;
    Game.Story.setFlag(entry.flag);
    if (Game.Story.saveFlags) Game.Story.saveFlags();
    startForcedEvent(entry.eventId, function() {
      setState(Game.Config.STATE.EXPLORING);
      Game.Audio.playBgm('field');
    });
    return true;
  }

  function continuePendingSkillFlow() {
    var nextSkill = Game.Player && Game.Player.consumePendingSkillChoice ? Game.Player.consumePendingSkillChoice() : null;
    if (nextSkill && Game.UI && Game.UI.openSkillLearn) {
      var skillId = typeof nextSkill === 'string' ? nextSkill : nextSkill.skillId;
      var sourceText = typeof nextSkill === 'string' ? '' : (nextSkill.sourceText || '');
      Game.UI.openSkillLearn(skillId, sourceText);
      setState(Game.Config.STATE.SKILL_LEARN);
      return true;
    }
    if (pendingAction && pendingAction.type === 'postBattleVictory' && pendingAction.resume) {
      var resume = pendingAction.resume;
      pendingAction = null;
      resume();
      return true;
    }
    pendingAction = null;
    return false;
  }

  function unlockGururinNetwork() {
    if (Game.Story && Game.Story.setFlag) {
      Game.Story.setFlag('gururin_network_unlocked');
      if (Game.Story.saveFlags) Game.Story.saveFlags();
    }
    if (Game.Player && Game.Player.addItem) {
      var hasPass = Game.Player.hasItem ? Game.Player.hasItem('gururinPass') : false;
      if (!hasPass) {
        Game.Player.addItem('gururinPass');
      }
    }
  }

  function beginDeliveryQuest(questId, itemId, npc) {
    var quest = Game.Quests && Game.Quests.getQuest ? Game.Quests.getQuest(questId) : null;
    if (!quest || quest.status === 'completed') {
      setState(Game.Config.STATE.EXPLORING);
      return;
    }

    if (Game.Quests && Game.Quests.startQuest) {
      Game.Quests.startQuest(questId);
    }
    if (quest.progress < 1 && Game.Quests && Game.Quests.updateProgress) {
      Game.Quests.updateProgress(questId, 1);
    }
    if (Game.Player && Game.Player.hasItem && Game.Player.addItem && !Game.Player.hasItem(itemId)) {
      Game.Player.addItem(itemId);
    }
    if (npc) {
      npc.defeated = true;
      if (Game.NPC && Game.NPC.showDefeatedDialog && npc.defeatedDialog) {
        Game.NPC.showDefeatedDialog(npc);
        dialogText = Game.NPC.getCurrentDialog();
        setState(Game.Config.STATE.DIALOG);
        Game.Audio.playSfx('item');
        return;
      }
    }
    setState(Game.Config.STATE.EXPLORING);
    Game.Audio.playSfx('item');
  }

  function turnInDeliveryQuest(questId, itemId, npc) {
    var quest = Game.Quests && Game.Quests.getQuest ? Game.Quests.getQuest(questId) : null;
    var hasItem = Game.Player && Game.Player.hasItem ? Game.Player.hasItem(itemId) : false;
    if (!quest || quest.status !== 'active' || !hasItem) {
      setState(Game.Config.STATE.EXPLORING);
      return;
    }

    if (Game.Player && Game.Player.removeItem) {
      Game.Player.removeItem(itemId);
    }
    if (Game.Quests && Game.Quests.updateProgress) {
      Game.Quests.updateProgress(questId, Math.max(1, (quest.target || 2) - (quest.progress || 0)));
    } else if (Game.Quests && Game.Quests.complete) {
      Game.Quests.complete(questId);
    }
    if (npc) {
      npc.defeated = true;
      if (Game.NPC && Game.NPC.showDefeatedDialog && npc.defeatedDialog) {
        Game.NPC.showDefeatedDialog(npc);
        dialogText = Game.NPC.getCurrentDialog();
        setState(Game.Config.STATE.DIALOG);
        Game.Audio.playSfx('item');
        return;
      }
    }
    setState(Game.Config.STATE.EXPLORING);
    Game.Audio.playSfx('item');
  }

  function resolveBattleVictory(battleResult) {
    if (battleResult.goldReward) {
      Game.Player.addGold(battleResult.goldReward);
    }
    var expSummary = null;
    if (battleResult.expReward) {
      expSummary = Game.Player.addExperience(battleResult.expReward);
    }
    if (battleResult.itemRewards && battleResult.itemRewards.length) {
      for (var rewardIndex = 0; rewardIndex < battleResult.itemRewards.length; rewardIndex++) {
        Game.Player.addItem(battleResult.itemRewards[rewardIndex]);
      }
    }
    if (Game.Achievements && Game.Achievements.check) {
      Game.Achievements.check({ type: 'battle_win' });
    }
    if (Game.Skills && Game.Skills.getBattleVictoryOffers && Game.Player && Game.Player.offerSkillChoice) {
      var skillOffers = Game.Skills.getBattleVictoryOffers(battleResult);
      for (var offerIndex = 0; offerIndex < skillOffers.length; offerIndex++) {
        Game.Player.offerSkillChoice(skillOffers[offerIndex].skillId, skillOffers[offerIndex].sourceText);
      }
    }

    var finishVictory = function() {
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
          if (battleResult.npc.id === 'ruined_checkpoint' && Game.Story && Game.Story.setFlag) {
            Game.Story.setFlag('checkpoint_cleared');
          }
          if (battleResult.npc.id === 'darumaMaster' && Game.Story && Game.Story.setFlag) {
            Game.Story.setFlag('daruma_master_cleared_slice');
          }
          if (battleResult.npc.id === 'threadMaiden' && Game.Story && Game.Story.setFlag) {
            Game.Story.setFlag('thread_maiden_cleared_slice');
          }
          Game.NPC.showDefeatedDialog(battleResult.npc);
          dialogText = Game.NPC.getCurrentDialog();
          setState(Game.Config.STATE.DIALOG);
        } else {
          setState(Game.Config.STATE.EXPLORING);
        }
        Game.Audio.playBgm('field');
      }
    };

    if (expSummary && expSummary.levelUps && expSummary.levelUps.length && Game.UI && Game.UI.addDamagePopup) {
      var lastRank = expSummary.levelUps[expSummary.levelUps.length - 1].rank;
      Game.UI.addDamagePopup('RANK ' + lastRank, 176, 34, '#ffdd66');
    }

    pendingAction = { type: 'postBattleVictory', resume: finishVictory };
    if (continuePendingSkillFlow()) return;
    pendingAction = null;
    finishVictory();
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
    if (Game.Achievements && Game.Achievements.update) Game.Achievements.update();

    switch (state) {
      case Game.Config.STATE.TITLE:
        var titleLocked = false;
        if (Game.UI.updateIntroMovie) {
          Game.UI.updateIntroMovie();
        }
        titleLocked = Game.UI.isTitleIntroLocked ? Game.UI.isTitleIntroLocked() : false;
        if (titleLocked) break;
        if (Game.UI.updateTitleMenu) Game.UI.updateTitleMenu();
        if (Game.UI.isAchievementListOpen && Game.UI.isAchievementListOpen()) {
          break;
        }
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
            if (Game.UI.openAchievementList) Game.UI.openAchievementList();
          }
        }
        break;

      case Game.Config.STATE.EXPLORING:
        if (maybeStartArrivalEvent()) {
          break;
        }
        if (Game.Quests && Game.Quests.isOpen && Game.Quests.isOpen()) {
          Game.Quests.update();
          break;
        }
        if (Game.Input.isPressed('journal') && Game.Quests && Game.Quests.open) {
          Game.Quests.open();
          Game.Audio.playSfx('confirm');
          break;
        }
        Game.Player.update();
        var stepInfo = Game.Player.consumeCompletedStep ? Game.Player.consumeCompletedStep() : null;
        var blockedMove = Game.Player.consumeBlockedMove ? Game.Player.consumeBlockedMove() : null;

        if (blockedMove && blockedMove.message) {
          dialogText = blockedMove.message;
          setState(Game.Config.STATE.DIALOG);
          Game.Audio.playSfx('cancel');
          break;
        }

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
            if (Game.Achievements && Game.Achievements.check) {
              Game.Achievements.check('chapter2_clear');
            }
            setState(Game.Config.STATE.ENDING);
            Game.Audio.stopBgm();
            Game.Audio.playSfx('victory');
          }
          break;
        }

        if (stepInfo && Game.Quests && Game.Quests.visitTile) {
          Game.Quests.visitTile(
            Game.Map.getCurrentMapId(),
            stepInfo.tileX,
            stepInfo.tileY,
            Game.Map.getTile(stepInfo.tileX, stepInfo.tileY)
          );
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
            if (Game.Quests && Game.Quests.talkToNpc) {
              Game.Quests.talkToNpc(npc.id, Game.Map.getCurrentMapId());
            }
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
            resolveBattleVictory(battleResult);
          } else if (battleResult.result === 'defeat') {
            storyBattleContext = null;
            setState(Game.Config.STATE.GAMEOVER);
          } else if (battleResult.result === 'ritual_fail') {
            storyBattleContext = null;
            if (battleResult.enemyId === 'ruined_checkpoint' && Game.Story && Game.Story.setFlag) {
              Game.Story.setFlag('checkpoint_failed_once');
            }
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

      case Game.Config.STATE.SKILL_LEARN:
        var skillLearnResult = Game.UI.updateSkillLearn ? Game.UI.updateSkillLearn() : null;
        if (skillLearnResult) {
          if (skillLearnResult.action === 'learn' && Game.Player && Game.Player.learnSkill) {
            Game.Player.learnSkill(skillLearnResult.skillId, skillLearnResult.replaceId);
          }
          continuePendingSkillFlow();
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
        } else if (menuResult && menuResult.warp) {
          Game.Audio.playSfx('confirm');
          startTransition(menuResult.warp.mapId, menuResult.warp.spawnX, menuResult.warp.spawnY);
        } else if (menuResult && menuResult.openQuestLog && Game.Quests && Game.Quests.open) {
          setState(Game.Config.STATE.EXPLORING);
          Game.Quests.open();
          Game.Audio.playSfx('confirm');
        }
        break;

      case Game.Config.STATE.SAVE:
        var saveResult = Game.SaveMenu.update ? Game.SaveMenu.update() : null;
        if (saveResult && saveResult.closeTo) {
          if (saveResult.loaded && Game.Quests && Game.Quests.syncFromGame) {
            Game.Quests.syncFromGame();
            if (Game.Player && Game.Player.getData && Game.Quests.activateChapter) {
              Game.Quests.activateChapter(Game.Player.getData().chapter || 1);
            }
          }
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

  function shouldPlaySpecialDiceIntro(itemIds) {
    if (!itemIds || !itemIds.length || !Game.Story || !Game.Story.hasFlag) return false;
    if (Game.Story.hasFlag('special_dice_intro_seen')) return false;
    for (var i = 0; i < itemIds.length; i++) {
      var item = Game.Items.get(itemIds[i]);
      if (item && item.type === 'dice' && item.id !== 'normalDice') {
        return true;
      }
    }
    return false;
  }

  function markSpecialDiceIntroSeen() {
    if (Game.Story && Game.Story.setFlag) {
      Game.Story.setFlag('special_dice_intro_seen');
      if (Game.Story.saveFlags) Game.Story.saveFlags();
    }
  }

  function openSystemDialog(lines) {
    if (Game.NPC && Game.NPC.openDialog) {
      dialogText = Game.NPC.openDialog(lines || ['']);
    } else {
      dialogText = (lines && lines[0]) || '';
    }
    setState(Game.Config.STATE.DIALOG);
  }

  function handleInnAction(action) {
    var parts = action.substring(4).split('_');
    var innName = parts[0] || '宿';
    var price = Math.max(0, parseInt(parts[1] || '0', 10) || 0);
    var pd = Game.Player.getData ? Game.Player.getData() : null;
    if (!pd) {
      setState(Game.Config.STATE.EXPLORING);
      return;
    }

    if (pd.hp >= pd.maxHp) {
      openSystemDialog([
        innName + 'の帳場は静かだ。',
        '今はもう、身体を休めきっている。'
      ]);
      Game.Audio.playSfx('confirm');
      return;
    }

    if (pd.gold < price) {
      openSystemDialog([
        innName + 'は一泊 ' + price + 'G だ。',
        '手持ちが少し足りない。'
      ]);
      Game.Audio.playSfx('cancel');
      return;
    }

    if (Game.Player && Game.Player.addGold) {
      Game.Player.addGold(-price);
    }
    if (Game.Player && Game.Player.fullHeal) {
      Game.Player.fullHeal();
    } else {
      pd.hp = pd.maxHp;
    }
    openSystemDialog([
      innName + 'でひと晩休んだ。',
      '湯気と寝息にほどけて、HPが全回復した。'
    ]);
    Game.Audio.playSfx('item');
  }

  function handleAction(action, npc) {
    switch (action) {
      case 'battle_ruined_checkpoint':
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('ruined_checkpoint', npc);
        break;
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
      case 'mark_defeated':
        if (npc) npc.defeated = true;
        setState(Game.Config.STATE.EXPLORING);
        break;
      case 'join_akagi':
        if (npc) {
          npc.defeated = true;
          if (Game.Player && Game.Player.addPartyMember) {
            Game.Player.addPartyMember('akagi');
          }
          if (Game.Story && Game.Story.setFlag) {
            Game.Story.setFlag('party_akagi');
            Game.Story.setFlag('akagi_joined_slice');
          }
          Game.NPC.showDefeatedDialog(npc);
          dialogText = Game.NPC.getCurrentDialog();
          setState(Game.Config.STATE.DIALOG);
        } else {
          setState(Game.Config.STATE.EXPLORING);
        }
        break;
      case 'battle_daruma_master':
        if (Game.Player && Game.Player.hasItem && Game.Player.addItem && !Game.Player.hasItem('darumaEye')) {
          Game.Player.addItem('darumaEye');
        }
        setState(Game.Config.STATE.BATTLE);
        Game.Battle.start('darumaMaster', npc);
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
      case 'event_special_dice_intro':
        markSpecialDiceIntroSeen();
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('special_dice_intro', function() {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playBgm('field');
        });
        break;
      case 'event_gururin_network':
        unlockGururinNetwork();
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('gururin_network', function() {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playBgm('field');
        });
        break;
      case 'event_gururin_network_midgame':
        if (Game.Story && Game.Story.hasFlag && Game.Story.hasFlag('gururin_network_unlocked')) {
          setState(Game.Config.STATE.EVENT);
          Game.Event.start('ch5_ending', function() {
            startChapter6();
          });
          break;
        }
        unlockGururinNetwork();
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('gururin_network', function() {
          Game.Event.start('ch5_ending', function() {
            startChapter6();
          });
        });
        break;
      case 'event_gururin':
        if (npc) npc.defeated = true;
        if (Game.Story && Game.Story.setFlag) {
          Game.Story.setFlag('gururin_seen');
          if (Game.Story.saveFlags) Game.Story.saveFlags();
        }
        setState(Game.Config.STATE.EVENT);
        Game.Event.start('gururin', function() {
          setState(Game.Config.STATE.EXPLORING);
          Game.Audio.playBgm('field');
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
      case 'quest_start_konnyaku_delivery':
        beginDeliveryQuest('konnyaku_delivery', 'konnyakuParcel', npc);
        break;
      case 'quest_turnin_konnyaku_delivery':
        turnInDeliveryQuest('konnyaku_delivery', 'konnyakuParcel', npc);
        break;
      case 'quest_start_silk_braid_delivery':
        beginDeliveryQuest('silk_braid_delivery', 'silkBraid', npc);
        break;
      case 'quest_turnin_silk_braid_delivery':
        turnInDeliveryQuest('silk_braid_delivery', 'silkBraid', npc);
        break;
      case 'quest_start_yumomi_letter_delivery':
        beginDeliveryQuest('yumomi_letter_delivery', 'yumomiLetter', npc);
        break;
      case 'quest_turnin_yumomi_letter_delivery':
        turnInDeliveryQuest('yumomi_letter_delivery', 'yumomiLetter', npc);
        break;
      default:
        if (action.indexOf('inn_') === 0) {
          handleInnAction(action);
          break;
        }
        // Check for shop actions: shop_<shopName>_<item1>,<item2>,...
        if (action.indexOf('shop_') === 0) {
          var parts = action.substring(5).split('_');
          var shopName = parts[0];
          var shopItemIds = parts[1] ? parts[1].split(',') : [];
          if (shouldPlaySpecialDiceIntro(shopItemIds)) {
            markSpecialDiceIntroSeen();
            setState(Game.Config.STATE.EVENT);
            Game.Event.start('special_dice_intro', function() {
              setState(Game.Config.STATE.SHOP);
              Game.Shop.start(shopName, shopItemIds);
            });
          } else {
            setState(Game.Config.STATE.SHOP);
            Game.Shop.start(shopName, shopItemIds);
          }
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
    pd.hp = 96;
    pd.maxHp = 96;
    pd.attack = 12;
    pd.defense = 6;
    pd.experience = 0;
    pd.gold = 100;
    pd.chapter = 1;
    pd.diceSlots = 1;
    pd.equippedDice = ['normalDice'];
    pd.armor = null;
    pd.partyMembers = [];
    pd.skillsKnown = [];
    pd.skillCharges = {};
    pd.inventory = [];
    if (Game.Player && Game.Player.syncGrowthStats) {
      Game.Player.syncGrowthStats('full');
    }
    if (Game.Player && Game.Player.syncSkillState) {
      Game.Player.syncSkillState(false);
    }
    if (Game.Player && Game.Player.clearPendingSkillChoices) {
      Game.Player.clearPendingSkillChoices();
    }
    pendingAction = null;

    if (Game.Story && Game.Story.reset) {
      Game.Story.reset();
      if (Game.Story.saveFlags) Game.Story.saveFlags();
    }
    if (Game.Quests && Game.Quests.reset) {
      Game.Quests.reset();
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
    if (Game.Achievements && Game.Achievements.check) {
      Game.Achievements.check('chapter1_clear');
    }
    var pd = Game.Player.getData();
    pd.chapter = 2;
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(2);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(3);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(4);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(5);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(6);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(7);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(8);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(9);
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
    if (Game.Quests && Game.Quests.activateChapter) Game.Quests.activateChapter(10);
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

      case Game.Config.STATE.SKILL_LEARN:
        renderExploring(true);
        if (Game.UI.drawSkillLearn) Game.UI.drawSkillLearn();
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

    if (state === Game.Config.STATE.TITLE && Game.UI.isAchievementListOpen && Game.UI.isAchievementListOpen() &&
        Game.Achievements && Game.Achievements.drawList) {
      Game.Achievements.drawList();
    }
    if (Game.Achievements && Game.Achievements.draw) {
      Game.Achievements.draw();
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
      if (Game.UI.drawAreaBanner) Game.UI.drawAreaBanner();
      if (Game.Quests && Game.Quests.drawTracker) Game.Quests.drawTracker();
    }
    if (Game.UI.drawPopups) Game.UI.drawPopups();
    if (Game.Quests && Game.Quests.draw) Game.Quests.draw();
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
    var storyFlags = Game.Story && Game.Story.getFlags ? Game.Story.getFlags() : {};
    var payload = {
      mode: state,
      titleSelection: Game.UI.getTitleSelection ? Game.UI.getTitleSelection() : 0,
      map: mapId,
      mapLabel: mapInfo ? mapInfo.label : '',
      audio: {
        requestedBgm: Game.Audio && Game.Audio.getRequestedBgmName ? Game.Audio.getRequestedBgmName() : null,
        currentBgm: Game.Audio && Game.Audio.getCurrentBgmName ? Game.Audio.getCurrentBgmName() : null
      },
      player: {
        tileX: pd.tileX,
        tileY: pd.tileY,
        direction: pd.direction,
        hp: pd.hp,
        maxHp: pd.maxHp,
        attack: pd.attack,
        defense: pd.defense,
        experience: pd.experience || 0,
        journeyRank: Game.Player.getJourneyRank ? Game.Player.getJourneyRank() : 1,
        nextRankExperience: Game.Player.previewExperienceGain ? Game.Player.previewExperienceGain(0).nextRankExperience : 80,
        gold: pd.gold,
        chapter: pd.chapter,
        skillsKnown: Game.Player.getSkills ? Game.Player.getSkills() : [],
        skillCharges: Game.Player.getAllSkillCharges ? Game.Player.getAllSkillCharges() : {},
        inventory: (pd.inventory || []).slice()
      },
      journeyLabel: chapterInfo ? chapterInfo.displayLabel : '',
      journeyIndex: chapterInfo ? chapterInfo.journeyIndex : pd.chapter,
      chapterTitle: chapterInfo ? chapterInfo.title : '',
      objective: Game.Chapters && Game.Chapters.getObjective ? Game.Chapters.getObjective(pd.chapter, mapId) : '',
      respectGauge: journeyState.respectGauge || 0,
      catalystCount: journeyState.catalysts ? journeyState.catalysts.length : 0,
      party: Game.Player.getPartyMemberIds ? Game.Player.getPartyMemberIds() : [],
      storyFlags: {
        checkpointFailedOnce: !!storyFlags.checkpoint_failed_once,
        checkpointCleared: !!storyFlags.checkpoint_cleared,
        akagiJoinedSlice: !!storyFlags.akagi_joined_slice,
        darumaCleared: !!storyFlags.daruma_master_cleared_slice,
        threadCleared: !!storyFlags.thread_maiden_cleared_slice
      },
      continueSlot: Game.Save && Game.Save.getSlotInfo ? Game.Save.getSlotInfo(1) : null,
      hasAnySave: Game.Save && Game.Save.hasAnySave ? Game.Save.hasAnySave() : false,
      saveMenuContext: Game.SaveMenu && Game.SaveMenu.getContext ? Game.SaveMenu.getContext() : null
    };
    if (Game.Quests) {
      payload.quests = {
        open: Game.Quests.isOpen ? Game.Quests.isOpen() : false,
        active: Game.Quests.getActive ? Game.Quests.getActive().map(function(quest) {
          return {
            id: quest.id,
            name: quest.name,
            progress: quest.progress,
            target: quest.target
          };
        }) : []
      };
    }
    if (Game.Map && Game.Map.getCurrentMap && Game.NPC && Game.NPC.getNpcServiceType) {
      var currentMap = Game.Map.getCurrentMap();
      if (currentMap && currentMap.npcs) {
        payload.services = currentMap.npcs.map(function(npc) {
          return {
            id: npc.id,
            type: Game.NPC.getNpcServiceType(npc),
            x: npc.x,
            y: npc.y
          };
        }).filter(function(entry) {
          return !!entry.type;
        });
      }
    }
    payload.ui = {
      showJourneyBadge: Game.UI && Game.UI.isJourneyBadgeEnabled ? Game.UI.isJourneyBadgeEnabled() : true,
      eventTextSpeed: Game.UI && Game.UI.getEventTextSpeedLabel ? Game.UI.getEventTextSpeedLabel() : 'ふつう',
      battleDialogueSpeed: Game.UI && Game.UI.getBattleDialogueSpeedLabel ? Game.UI.getBattleDialogueSpeedLabel() : 'ふつう'
    };
    if (Game.UI && Game.UI.getTitlePresentationState) {
      payload.title = Game.UI.getTitlePresentationState();
    }
    if (state === Game.Config.STATE.MENU && Game.UI && Game.UI.getFieldMenuDebugState) {
      payload.menu = Game.UI.getFieldMenuDebugState();
    }
    if (Game.Encounters && Game.Encounters.getState) {
      payload.encounters = Game.Encounters.getState();
    }
    if (Game.Achievements && Game.Achievements.getDebugState) {
      payload.achievements = Game.Achievements.getDebugState();
    }
    if (state === Game.Config.STATE.BATTLE && Game.Battle && Game.Battle.getStateSnapshot) {
      payload.battle = Game.Battle.getStateSnapshot();
    }
    if (state === Game.Config.STATE.EVENT && Game.Event && Game.Event.getStateSnapshot) {
      payload.event = Game.Event.getStateSnapshot();
    }
    if (state === Game.Config.STATE.SKILL_LEARN && Game.UI && Game.UI.getSkillLearnDebugState) {
      payload.skillLearn = Game.UI.getSkillLearnDebugState();
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
    var debugSkills = params.get('debugSkills');
    var debugSkillCharges = params.get('debugSkillCharges');
    var debugExp = parseInt(params.get('debugExp') || '', 10);
    var debugAttack = parseInt(params.get('debugAttack') || '', 10);
    var debugMaxHp = parseInt(params.get('debugMaxHp') || '', 10);
    pd.inventory = debugInventory ? debugInventory.split(',').filter(Boolean) : [];
    pd.skillsKnown = debugSkills ? debugSkills.split(',').filter(Boolean) : [];
    pd.skillCharges = {};
    if (debugSkillCharges) {
      var skillChargeValues = debugSkillCharges.split(',').map(function(value) {
        return parseInt(value, 10);
      });
      for (var s = 0; s < pd.skillsKnown.length; s++) {
        if (!isNaN(skillChargeValues[s])) {
          pd.skillCharges[pd.skillsKnown[s]] = Math.max(0, skillChargeValues[s]);
        }
      }
    }
    if (!isNaN(debugExp)) {
      pd.experience = Math.max(0, debugExp);
    }
    if (Game.Player && Game.Player.syncGrowthStats) {
      Game.Player.syncGrowthStats('full');
    }
    if (Game.Player && Game.Player.syncSkillState) {
      Game.Player.syncSkillState(true);
    }
    if (!isNaN(debugAttack)) {
      pd.attack = Math.max(1, debugAttack);
    }
    if (!isNaN(debugMaxHp)) {
      pd.maxHp = Math.max(1, debugMaxHp);
    }
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
    handleMapLoaded: markMapVisited,
    startStoryBattle: startStoryBattle,
    applyDebugLaunchOptions: applyDebugLaunchOptions
  };
})();
