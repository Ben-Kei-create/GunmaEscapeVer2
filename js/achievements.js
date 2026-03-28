// Achievement / trophy system
Game.Achievements = (function() {
  var STORAGE_KEY = 'gunmaEscape_achievements';
  var NOTIFICATION_DURATION = 180;
  var achievements = [
    { id: 'first_step', name: '初めの一歩', description: '前橋を初めて訪れた。', unlocked: false, unlockedAt: null, icon: '🚶' },
    { id: 'onsen_master', name: '温泉マスター', description: '草津を訪れた。', unlocked: false, unlockedAt: null, icon: '♨️' },
    { id: 'daruma_town', name: 'だるまの街', description: '高崎を訪れた。', unlocked: false, unlockedAt: null, icon: '🎎' },
    { id: 'konnyaku_holy_land', name: 'こんにゃくの聖地', description: '下仁田を訪れた。', unlocked: false, unlockedAt: null, icon: '⬜' },
    { id: 'cabbage_kingdom', name: 'キャベツ王国', description: '嬬恋を訪れた。', unlocked: false, unlockedAt: null, icon: '🥬' },
    { id: 'mt_akagi', name: '赤城の山', description: '赤城ランチに到達した。', unlocked: false, unlockedAt: null, icon: '⛰️' },
    { id: 'all_maps', name: '全マップ制覇', description: '11マップすべてを訪れた。', unlocked: false, unlockedAt: null, icon: '🗺️' },
    { id: 'joumo_sanzan', name: '上毛三山踏破', description: '森・大沼・赤城エリアを巡った。', unlocked: false, unlockedAt: null, icon: '🌲' },
    { id: 'first_victory', name: '初勝利', description: '初めての戦闘勝利を収めた。', unlocked: false, unlockedAt: null, icon: '⚔️' },
    { id: 'gambling_master', name: '博打の達人', description: 'ギャンブルサイコロで12を出して勝利した。', unlocked: false, unlockedAt: null, icon: '🎲' },
    { id: 'all_same', name: 'ゾロ目', description: '1回の戦闘で全て同じ目を出した。', unlocked: false, unlockedAt: null, icon: '✨' },
    { id: 'thunder_god', name: '雷神', description: '1ターンで50以上のダメージを与えた。', unlocked: false, unlockedAt: null, icon: '⚡' },
    { id: 'healing_master', name: '回復の極み', description: '戦闘中に累計100以上回復した。', unlocked: false, unlockedAt: null, icon: '💚' },
    { id: 'angura_defeated', name: 'アングラ討伐', description: 'アングラボスを倒した。', unlocked: false, unlockedAt: null, icon: '👹' },
    { id: 'key_collector', name: '鍵コレクター', description: '第一章の4つの鍵を集めた。', unlocked: false, unlockedAt: null, icon: '🗝️' },
    { id: 'rich', name: '金持ち', description: '所持金が1000Gを超えた。', unlocked: false, unlockedAt: null, icon: '💰' },
    { id: 'dice_collector', name: 'サイコロコレクター', description: '異なるサイコロを5種類集めた。', unlocked: false, unlockedAt: null, icon: '🎲' },
    { id: 'best_equipment', name: '最強装備', description: '温泉の鎧と上州カミナリサイコロを装備した。', unlocked: false, unlockedAt: null, icon: '🛡️' },
    { id: 'chapter1_clear', name: '第一章クリア', description: '第一章をクリアした。', unlocked: false, unlockedAt: null, icon: '📘' },
    { id: 'gunma_escape', name: '群馬脱出', description: '第二章をクリアした。', unlocked: false, unlockedAt: null, icon: '🚪' },
    { id: 'gunma_expert', name: '群馬博士', description: 'クイズに全問正解した。', unlocked: false, unlockedAt: null, icon: '🎓' },
    { id: 'daruma_master', name: 'だるま名人', description: 'だるま積みをノーミスでクリアした。', unlocked: false, unlockedAt: null, icon: '🧘' }
  ];
  var progress = {
    visitedMaps: {},
    battleWins: 0,
    totalHealing: 0
  };
  var currentNotification = null;
  var notificationQueue = [];
  var achievementById = {};

  buildAchievementIndex();
  load();

  function buildAchievementIndex() {
    for (var i = 0; i < achievements.length; i++) {
      achievementById[achievements[i].id] = achievements[i];
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getTrackedMaps() {
    var tracked = [];
    if (!Game.Maps) return tracked;
    for (var mapId in Game.Maps) {
      if (!Game.Maps.hasOwnProperty(mapId)) continue;
      if (!Game.Maps[mapId] || !Game.Maps[mapId].tiles) continue;
      tracked.push(mapId);
    }
    tracked.sort();
    return tracked;
  }

  function refreshDynamicAchievementText() {
    var allMapsAchievement = achievementById.all_maps;
    if (allMapsAchievement) {
      allMapsAchievement.description = getTrackedMaps().length + 'マップすべてを訪れた。';
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        achievements: achievements.map(function(achievement) {
          return {
            id: achievement.id,
            unlocked: achievement.unlocked,
            unlockedAt: achievement.unlockedAt
          };
        }),
        progress: progress
      }));
    } catch (err) {
      // Ignore storage errors in restricted environments.
    }
  }

  function load() {
    refreshDynamicAchievementText();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved.progress) {
        progress.visitedMaps = saved.progress.visitedMaps || {};
        progress.battleWins = saved.progress.battleWins || 0;
        progress.totalHealing = saved.progress.totalHealing || 0;
      }
      if (saved.achievements && saved.achievements.length) {
        for (var i = 0; i < saved.achievements.length; i++) {
          var savedAchievement = saved.achievements[i];
          var achievement = achievementById[savedAchievement.id];
          if (achievement) {
            achievement.unlocked = !!savedAchievement.unlocked;
            achievement.unlockedAt = savedAchievement.unlockedAt || null;
          }
        }
      }
    } catch (err) {
      // Ignore malformed storage values and keep defaults.
    }
  }

  function queueNotification(achievement) {
    notificationQueue.push({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      timer: NOTIFICATION_DURATION
    });

    if (!currentNotification) {
      currentNotification = notificationQueue.shift();
    }
  }

  function unlock(id) {
    var achievement = achievementById[id];
    if (!achievement || achievement.unlocked) return false;

    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    queueNotification(achievement);
    persist();
    return true;
  }

  function isUnlocked(id) {
    return !!(achievementById[id] && achievementById[id].unlocked);
  }

  function markMapVisited(mapId) {
    if (!mapId) return;
    progress.visitedMaps[mapId] = true;
    refreshDynamicAchievementText();

    var mapAchievementMap = {
      maebashi: 'first_step',
      kusatsu: 'onsen_master',
      takasaki: 'daruma_town',
      shimonita: 'konnyaku_holy_land',
      tsumagoi: 'cabbage_kingdom',
      akagi_ranch: 'mt_akagi'
    };

    if (mapAchievementMap[mapId]) {
      unlock(mapAchievementMap[mapId]);
    }

    var trackedMaps = getTrackedMaps();
    var visitedAll = trackedMaps.length > 0;
    for (var i = 0; i < trackedMaps.length; i++) {
      if (!progress.visitedMaps[trackedMaps[i]]) {
        visitedAll = false;
        break;
      }
    }
    if (visitedAll) {
      unlock('all_maps');
    }

    if (progress.visitedMaps.forest && progress.visitedMaps.onuma &&
        (progress.visitedMaps.akagi_ranch || progress.visitedMaps.akagi_shrine)) {
      unlock('joumo_sanzan');
    }
  }

  function evaluatePlayerState() {
    if (!Game.Player || !Game.Player.getData) return;
    var playerData = Game.Player.getData();
    var inventory = playerData.inventory || [];
    var equippedDice = playerData.equippedDice || [];
    var uniqueDice = {};
    var keyIds = {
      onsenKey: true,
      darumaEye: true,
      konnyakuPass: true,
      cabbageCrest: true
    };
    var foundKeys = 0;
    var i;

    for (i = 0; i < inventory.length; i++) {
      if (keyIds[inventory[i]]) foundKeys++;
      if (Game.Items && Game.Items.get) {
        var invItem = Game.Items.get(inventory[i]);
        if (invItem && invItem.type === 'dice') {
          uniqueDice[inventory[i]] = true;
        }
      }
    }

    for (i = 0; i < equippedDice.length; i++) {
      uniqueDice[equippedDice[i]] = true;
    }

    if (foundKeys >= 4) {
      unlock('key_collector');
    }
    if (playerData.gold >= 1000) {
      unlock('rich');
    }
    if (Object.keys(uniqueDice).length >= 5) {
      unlock('dice_collector');
    }
    if (playerData.armor === 'onsenArmor' && equippedDice.indexOf('gunmaDice') >= 0) {
      unlock('best_equipment');
    }
  }

  function handleCheckPayload(payload) {
    if (!payload) {
      if (Game.Map && Game.Map.getCurrentMapId) {
        markMapVisited(Game.Map.getCurrentMapId());
      }
      evaluatePlayerState();
      return false;
    }

    if (typeof payload === 'string') {
      if (achievementById[payload]) {
        return unlock(payload);
      }

      if (payload.indexOf('map:') === 0) {
        markMapVisited(payload.substring(4));
      } else if (payload === 'battle_win') {
        progress.battleWins++;
        unlock('first_victory');
      } else if (payload === 'gambler_12') {
        unlock('gambling_master');
      } else if (payload === 'all_same_roll') {
        unlock('all_same');
      } else if (payload === 'thunder_50') {
        unlock('thunder_god');
      } else if (payload === 'heal_100') {
        progress.totalHealing = Math.max(progress.totalHealing, 100);
        unlock('healing_master');
      } else if (payload === 'angura_boss') {
        unlock('angura_defeated');
      } else if (payload === 'chapter1_clear') {
        unlock('chapter1_clear');
      } else if (payload === 'chapter2_clear') {
        unlock('gunma_escape');
      } else if (payload === 'quiz_perfect') {
        unlock('gunma_expert');
      } else if (payload === 'daruma_perfect') {
        unlock('daruma_master');
      } else if (getTrackedMaps().indexOf(payload) >= 0) {
        markMapVisited(payload);
      }

      evaluatePlayerState();
      persist();
      return false;
    }

    if (typeof payload === 'object') {
      if (payload.type === 'map') {
        markMapVisited(payload.map);
      } else if (payload.type === 'heal') {
        progress.totalHealing += payload.amount || 0;
        if (progress.totalHealing >= 100) {
          unlock('healing_master');
        }
      } else if (payload.type === 'battle_win') {
        progress.battleWins++;
        unlock('first_victory');
      } else if (payload.type === 'unlock' && payload.id) {
        unlock(payload.id);
      }

      evaluatePlayerState();
      persist();
    }

    return false;
  }

  function check(id) {
    return handleCheckPayload(id);
  }

  function getAll() {
    return clone(achievements);
  }

  function getUnlocked() {
    return clone(achievements.filter(function(achievement) {
      return achievement.unlocked;
    }));
  }

  function getDebugState() {
    var trackedMaps = getTrackedMaps();
    var visitedCount = 0;
    for (var i = 0; i < trackedMaps.length; i++) {
      if (progress.visitedMaps[trackedMaps[i]]) visitedCount++;
    }
    return {
      unlockedCount: getUnlocked().length,
      totalCount: achievements.length,
      trackedMapCount: trackedMaps.length,
      visitedTrackedMapCount: visitedCount
    };
  }

  function update() {
    if (!currentNotification && notificationQueue.length) {
      currentNotification = notificationQueue.shift();
    }

    if (!currentNotification) return;

    currentNotification.timer--;
    if (currentNotification.timer <= 0) {
      currentNotification = notificationQueue.length ? notificationQueue.shift() : null;
    }
  }

  function getNotificationY(notification) {
    var elapsed = NOTIFICATION_DURATION - notification.timer;
    var inProgress = Math.min(elapsed / 18, 1);
    var outProgress = notification.timer < 24 ? (24 - notification.timer) / 24 : 0;
    return -70 + inProgress * 80 - outProgress * 80;
  }

  function draw() {
    if (!currentNotification) return;

    var y = getNotificationY(currentNotification);
    Game.Renderer.drawRectAbsolute(0, y, 480, 60, 'rgba(0,0,0,0.78)');
    Game.Renderer.drawRectAbsolute(0, y + 58, 480, 2, 'rgba(255,204,0,0.8)');
    Game.Renderer.drawTextJP('実績解除！', 18, y + 10, '#ffcc00', 16);
    Game.Renderer.drawTextJP(currentNotification.icon + ' ' + currentNotification.name, 18, y + 28, '#ffffff', 13);
    Game.Renderer.drawTextJP(currentNotification.description, 180, y + 30, '#dddddd', 10);
  }

  function drawList() {
    Game.Renderer.drawRectAbsolute(10, 10, 460, 300, 'rgba(0,0,32,0.92)');
    Game.Renderer.drawTextJP('群馬実績一覧', 24, 18, '#ffcc00', 16);
    Game.Renderer.drawTextJP('解除済み ' + getUnlocked().length + ' / ' + achievements.length, 330, 22, '#dddddd', 10);

    for (var i = 0; i < achievements.length; i++) {
      var achievement = achievements[i];
      var column = i < 11 ? 0 : 1;
      var row = column === 0 ? i : i - 11;
      var x = 20 + column * 225;
      var y = 48 + row * 23;
      var bg = achievement.unlocked ? 'rgba(255,204,0,0.12)' : 'rgba(255,255,255,0.04)';
      var nameColor = achievement.unlocked ? '#ffffff' : '#888888';
      var descColor = achievement.unlocked ? '#dddddd' : '#666666';

      Game.Renderer.drawRectAbsolute(x, y, 210, 20, bg);
      Game.Renderer.drawTextJP(achievement.icon, x + 4, y + 2, achievement.unlocked ? '#ffcc00' : '#666666', 12);
      Game.Renderer.drawTextJP(achievement.name, x + 22, y + 2, nameColor, 10);
      Game.Renderer.drawTextJP(achievement.description, x + 22, y + 11, descColor, 8);
    }
  }

  return {
    check: check,
    unlock: unlock,
    isUnlocked: isUnlocked,
    getAll: getAll,
    getUnlocked: getUnlocked,
    getDebugState: getDebugState,
    update: update,
    draw: draw,
    drawList: drawList
  };
})();
