// Side quest tracking system
Game.Quests = (function() {
  var STORAGE_KEY = 'gunmaEscape_quests';
  var TITLE = '冒険の記録';
  var questOrder = [
    {
      id: 'onsen_tour',
      name: '温泉巡り',
      description: '群馬の名湯を3箇所巡ろう',
      contextNotes: [
        { flag: 'env_kusatsu_yubatake_edge', text: '草津の湯気は、急ぐ足をやわらかく押し戻してくる。' },
        { flag: 'env_ikaho_stone_steps', text: '伊香保では段を登る呼吸そのものが、湯の作法になる。' },
        { flag: 'env_kusatsu_deep_deep_steam', text: 'やさしいはずの湯が境界線に変わる場所もある。' }
      ],
      status: 'active',
      progress: 0,
      target: 3,
      reward: { type: 'gold', value: 90 },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'konnyaku_delivery',
      name: '灰こんにゃく便',
      description: '下仁田のこんにゃく包みを前橋の煮しめ屋へ届けよう',
      contextNotes: [
        { flag: 'env_shimonita_freight_crate', text: '下仁田では荷より先に誇りが止まる。その包みは軽く扱えない。' },
        { mapId: 'maebashi', text: '中央通りの白線が冷えているうちに、煮しめ屋まで届けたい。' }
      ],
      status: 'locked',
      progress: 0,
      target: 2,
      reward: { type: 'item', value: 'guardChalk' },
      chapter: 1,
      rewardClaimed: false,
      manualStart: true
    },
    {
      id: 'silk_braid_delivery',
      name: '白糸の結び目',
      description: '富岡の結い糸を高崎の縁結び職人へ届けよう',
      contextNotes: [
        { flag: 'env_tomioka_silent_reel', text: 'ほどけ損ねた糸の気配が、結び目ひとつにも残っている。' },
        { flag: 'env_takasaki_daruma_rows', text: '願掛けの町では、結い目の重さまで赤い棚に見られている。' }
      ],
      status: 'locked',
      progress: 0,
      target: 2,
      reward: { type: 'item', value: 'loadedSand' },
      chapter: 1,
      rewardClaimed: false,
      manualStart: true
    },
    {
      id: 'yumomi_letter_delivery',
      name: '湯けむり文通',
      description: '草津の湯もみ口上を伊香保の湯番へ届けよう',
      contextNotes: [
        { flag: 'env_kusatsu_yubatake_edge', text: '湯もみ口上は、湯の縁に立つと少しだけ熱を帯びる。' },
        { flag: 'env_ikaho_stone_steps', text: '段を登る息に合わせると、伊香保の湯番にはよく届く。' }
      ],
      status: 'locked',
      progress: 0,
      target: 2,
      reward: { type: 'item', value: 'tempoCharm' },
      chapter: 1,
      rewardClaimed: false,
      manualStart: true
    },
    {
      id: 'joumo_karuta_collection',
      name: '上毛かるた収集',
      description: '各地に散らばる上毛かるたの札を5枚集めよう',
      contextNotes: [
        { flag: 'env_maebashi_central_line', text: '札は名所より先に、その土地の息づかいを覚えている。' },
        { flag: 'env_takasaki_daruma_rows', text: '願いの並ぶ町では、読み札も少し声を低くする。' },
        { flag: 'env_tomioka_silent_reel', text: '産業の記憶が濃い場所ほど、一文字の重みも増していく。' }
      ],
      status: 'active',
      progress: 0,
      target: 5,
      reward: { type: 'gold', value: 180 },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'daruma_perseverance',
      name: 'だるま七転び八起き',
      description: 'だるま積みを3回クリアしよう',
      contextNotes: [
        { flag: 'env_takasaki_daruma_rows', text: '片目の棚を抜けたあとだと、七転びの意味が少し変わる。' }
      ],
      status: 'active',
      progress: 0,
      target: 3,
      reward: { type: 'item', value: 'darumaDice' },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'gunma_dialect_master',
      name: '群馬弁マスター',
      description: '5人のNPCと会話して群馬弁を学ぼう',
      contextNotes: [
        { flag: 'env_shimonita_freight_crate', text: '町の荷札みたいに、ことばにも土地ごとの癖が貼られている。' },
        { flag: 'env_tamura_woven_home', text: '暮らしと機織りが混ざる村では、語尾まで受け継がれていく。' }
      ],
      status: 'active',
      progress: 0,
      target: 5,
      reward: { type: 'gold', value: 120 },
      chapter: 1,
      rewardClaimed: false
    },
    {
      id: 'legendary_blacksmith',
      name: '伝説の刀鍛冶',
      description: '赤城山の鍛冶師に最高の素材を届けよう',
      contextNotes: [
        { flag: 'env_shirane_trail_sulfur_cut', text: '白根の傷口を越えた素材なら、鍛冶師も黙って見過ごさない。' },
        { flag: 'env_akagi_shrine_sando_graveyard', text: '運び終えられなかったものの重さが、鍛える理由を深くする。' }
      ],
      status: 'locked',
      progress: 0,
      target: 4,
      reward: { type: 'item', value: 'gunmaDice' },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'search_for_hana',
      name: '花の捜索',
      description: '攫われた村長の娘を探し出そう',
      contextNotes: [
        { flag: 'env_forest_ruin_breath', text: '廃墟の入口に残る呼吸が、花の行方まで湿らせている。' },
        { flag: 'env_konuma_mist_watch', text: '小沼では湖面そのものが、来た者と連れ去られた者を数えている。' },
        { flag: 'env_onuma_wagon_memory', text: '止まった車体のそばには、急いだ足跡だけが薄く残る。' }
      ],
      status: 'locked',
      progress: 0,
      target: 1,
      reward: { type: 'item', value: 'storyProgress' },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'fishing_master',
      name: '釣り名人',
      description: '大沼でワカサギを3匹釣ろう',
      contextNotes: [
        { flag: 'env_onuma_wagon_memory', text: '静かな湖ほど、餌を落とす小さな音まできっちり覚えている。' }
      ],
      status: 'locked',
      progress: 0,
      target: 3,
      reward: { type: 'gold', value: 70 },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'angura_secret',
      name: 'アングラの秘密',
      description: 'アングラの正体を全て明かそう',
      contextNotes: [
        { flag: 'env_tamura_woven_home', text: '受け継ぎの村で途切れた名前を追うと、暗鞍の影が濃くなる。' },
        { flag: 'env_akagi_ranch_fence_wind', text: '牧柵の切れ目では、残された者の名ほど風がよく拾う。' }
      ],
      status: 'locked',
      progress: 0,
      target: 3,
      reward: { type: 'item', value: 'akagiKey' },
      chapter: 2,
      rewardClaimed: false
    },
    {
      id: 'way_of_the_dice',
      name: 'サイコロ道',
      description: '全種類のサイコロを手に入れよう',
      contextNotes: [
        { flag: 'env_jomo_gakuen_submission_hall', text: '学園では選択肢まで、提出物みたいに見張られている。' },
        { flag: 'env_border_tunnel_false_stars', text: '旅の終わりで振るサイコロは、もうただの遊びじゃない。' }
      ],
      status: 'locked',
      progress: 0,
      target: 10,
      reward: { type: 'gold', value: 300 },
      chapter: 2,
      rewardClaimed: false
    }
  ];

  var questById = {};
  var runtime = {
    visitedMaps: {},
    onsenMaps: {},
    deliveryFlags: {},
    karutaCards: {},
    talkedNpcs: {},
    blacksmithMaterials: {},
    fishingSpots: {},
    anguraTalks: {},
    ownedDice: {},
    logOpen: false,
    selectedIndex: 0,
    scrollOffset: 0,
    trackedQuestId: ''
  };

  var karutaLocations = [
    { mapId: 'maebashi', x: 10, y: 13, key: 'maebashi_card' },
    { mapId: 'takasaki', x: 25, y: 14, key: 'takasaki_card' },
    { mapId: 'kusatsu', x: 22, y: 3, key: 'kusatsu_card' },
    { mapId: 'shimonita', x: 2, y: 14, key: 'shimonita_card' },
    { mapId: 'tsumagoi', x: 4, y: 8, key: 'tsumagoi_card' }
  ];

  var fishingLocations = [
    { x: 10, y: 4, key: 'lake_a' },
    { x: 14, y: 6, key: 'lake_b' },
    { x: 18, y: 8, key: 'lake_c' }
  ];

  var legendaryMaterials = {
    healHerb: 'forest_herb',
    superYakimanju: 'kusatsu_sweet',
    yakimanju: 'onuma_snack'
  };

  var diceItemIds = {
    powerDice: true,
    gamblerDice: true,
    steadyDice: true,
    healDice: true,
    fireDice: true,
    darumaDice: true,
    onsenDice: true,
    konnyakuDice: true,
    cabbageDice: true,
    gunmaDice: true
  };

  buildIndex();
  load();
  activateChapter(1);

  function buildIndex() {
    for (var i = 0; i < questOrder.length; i++) {
      questById[questOrder[i].id] = questOrder[i];
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        quests: questOrder.map(function(quest) {
          return {
            id: quest.id,
            status: quest.status,
            progress: quest.progress,
            rewardClaimed: !!quest.rewardClaimed
          };
        }),
        runtime: {
          visitedMaps: runtime.visitedMaps,
          onsenMaps: runtime.onsenMaps,
          deliveryFlags: runtime.deliveryFlags,
          karutaCards: runtime.karutaCards,
          talkedNpcs: runtime.talkedNpcs,
          blacksmithMaterials: runtime.blacksmithMaterials,
          fishingSpots: runtime.fishingSpots,
          anguraTalks: runtime.anguraTalks,
          ownedDice: runtime.ownedDice,
          trackedQuestId: runtime.trackedQuestId || ''
        }
      }));
    } catch (err) {
      // Ignore storage errors.
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved.quests && saved.quests.length) {
        for (var i = 0; i < saved.quests.length; i++) {
          var savedQuest = saved.quests[i];
          var quest = questById[savedQuest.id];
          if (!quest) continue;
          quest.status = savedQuest.status || quest.status;
          quest.progress = typeof savedQuest.progress === 'number' ? savedQuest.progress : quest.progress;
          quest.rewardClaimed = !!savedQuest.rewardClaimed;
        }
      }
      if (saved.runtime) {
        runtime.visitedMaps = saved.runtime.visitedMaps || {};
        runtime.onsenMaps = saved.runtime.onsenMaps || {};
        runtime.deliveryFlags = saved.runtime.deliveryFlags || {};
        runtime.karutaCards = saved.runtime.karutaCards || {};
        runtime.talkedNpcs = saved.runtime.talkedNpcs || {};
        runtime.blacksmithMaterials = saved.runtime.blacksmithMaterials || {};
        runtime.fishingSpots = saved.runtime.fishingSpots || {};
        runtime.anguraTalks = saved.runtime.anguraTalks || {};
        runtime.ownedDice = saved.runtime.ownedDice || {};
        runtime.trackedQuestId = saved.runtime.trackedQuestId || '';
      }
    } catch (err) {
      // Ignore malformed values.
    }
  }

  function exportState() {
    return clone({
      quests: questOrder.map(function(quest) {
        return {
          id: quest.id,
          status: quest.status,
          progress: quest.progress,
          rewardClaimed: !!quest.rewardClaimed
        };
      }),
      runtime: {
        visitedMaps: runtime.visitedMaps,
        onsenMaps: runtime.onsenMaps,
        deliveryFlags: runtime.deliveryFlags,
        karutaCards: runtime.karutaCards,
        talkedNpcs: runtime.talkedNpcs,
        blacksmithMaterials: runtime.blacksmithMaterials,
        fishingSpots: runtime.fishingSpots,
        anguraTalks: runtime.anguraTalks,
        ownedDice: runtime.ownedDice,
        trackedQuestId: runtime.trackedQuestId || ''
      }
    });
  }

  function importState(state) {
    if (!state) return false;

    for (var i = 0; i < questOrder.length; i++) {
      questOrder[i].status = (questOrder[i].chapter === 1 && !questOrder[i].manualStart) ? 'active' : 'locked';
      questOrder[i].progress = 0;
      questOrder[i].rewardClaimed = false;
    }

    if (state.quests && state.quests.length) {
      for (var questIndex = 0; questIndex < state.quests.length; questIndex++) {
        var savedQuest = state.quests[questIndex];
        var quest = questById[savedQuest.id];
        if (!quest) continue;
        quest.status = savedQuest.status || quest.status;
        quest.progress = typeof savedQuest.progress === 'number' ? savedQuest.progress : quest.progress;
        quest.rewardClaimed = !!savedQuest.rewardClaimed;
      }
    }

    runtime.visitedMaps = {};
    runtime.onsenMaps = {};
    runtime.deliveryFlags = {};
    runtime.karutaCards = {};
    runtime.talkedNpcs = {};
    runtime.blacksmithMaterials = {};
    runtime.fishingSpots = {};
    runtime.anguraTalks = {};
    runtime.ownedDice = {};
    runtime.trackedQuestId = '';

    if (state.runtime) {
      runtime.visitedMaps = state.runtime.visitedMaps || {};
      runtime.onsenMaps = state.runtime.onsenMaps || {};
      runtime.deliveryFlags = state.runtime.deliveryFlags || {};
      runtime.karutaCards = state.runtime.karutaCards || {};
      runtime.talkedNpcs = state.runtime.talkedNpcs || {};
      runtime.blacksmithMaterials = state.runtime.blacksmithMaterials || {};
      runtime.fishingSpots = state.runtime.fishingSpots || {};
      runtime.anguraTalks = state.runtime.anguraTalks || {};
      runtime.ownedDice = state.runtime.ownedDice || {};
      runtime.trackedQuestId = state.runtime.trackedQuestId || '';
    }

    normalizeIndex();
    persist();
    return true;
  }

  function countKeys(object) {
    var total = 0;
    for (var key in object) {
      if (object.hasOwnProperty(key) && object[key]) total++;
    }
    return total;
  }

  function getQuestInternal(id) {
    return questById[id] || null;
  }

  function normalizeIndex() {
    var maxIndex = Math.max(questOrder.length - 1, 0);
    runtime.selectedIndex = Math.max(0, Math.min(runtime.selectedIndex, maxIndex));
    var visibleRows = 4;
    var selectedRow = runtime.selectedIndex;
    if (selectedRow < runtime.scrollOffset) {
      runtime.scrollOffset = selectedRow;
    }
    if (selectedRow >= runtime.scrollOffset + visibleRows) {
      runtime.scrollOffset = selectedRow - visibleRows + 1;
    }
  }

  function ensureActive(quest) {
    return !!(quest && quest.status !== 'locked');
  }

  function setTrackedQuest(questId, skipPersist) {
    runtime.trackedQuestId = questId || '';
    if (!skipPersist) persist();
  }

  function getTrackedQuestInternal() {
    var tracked = getQuestInternal(runtime.trackedQuestId);
    if (tracked && tracked.status === 'active') return tracked;
    return null;
  }

  function notifyQuest(kind, quest, rewardText) {
    if (!quest || !Game.UI || !Game.UI.addDamagePopup) return;
    if (kind === 'start') {
      Game.UI.addDamagePopup('依頼開始', 84, 244, '#8fe0ff');
      Game.UI.addDamagePopup(quest.name, 176, 244, '#ffdd66');
      return;
    }
    if (kind === 'complete') {
      Game.UI.addDamagePopup('依頼達成', 84, 244, '#ffcc44');
      Game.UI.addDamagePopup(quest.name, 176, 244, '#ffffff');
      if (rewardText) {
        Game.UI.addDamagePopup('報酬 ' + rewardText, 186, 228, '#8fe08f');
      }
    }
  }

  function grantReward(quest) {
    if (!quest || !quest.reward || quest.rewardClaimed) return '';

    if (quest.reward.type === 'gold') {
      if (Game.Player && Game.Player.addGold) {
        Game.Player.addGold(quest.reward.value);
      }
      quest.rewardClaimed = true;
      return quest.reward.value + 'G';
    }

    if (quest.reward.type === 'item') {
      if (quest.reward.value === 'storyProgress') {
        quest.rewardClaimed = true;
        return '';
      }
      if (Game.Player && Game.Player.addItem) {
        Game.Player.addItem(quest.reward.value);
      }
      quest.rewardClaimed = true;
      return getRewardText(quest);
    }

    return '';
  }

  function finalizeQuest(quest) {
    if (!quest) return false;
    quest.status = 'completed';
    quest.progress = quest.target;
    var rewardText = grantReward(quest);
    if (runtime.trackedQuestId === quest.id) {
      runtime.trackedQuestId = '';
    }
    persist();
    notifyQuest('complete', quest, rewardText);
    return true;
  }

  function activate(questId) {
    var quest = getQuestInternal(questId);
    if (!quest || quest.status !== 'locked') return false;
    quest.status = 'active';
    setTrackedQuest(quest.id, true);
    persist();
    return true;
  }

  function startQuest(questId) {
    var quest = getQuestInternal(questId);
    if (!quest || quest.status === 'completed') return false;
    if (quest.status === 'locked') {
      quest.status = 'active';
    }
    setTrackedQuest(quest.id, true);
    persist();
    notifyQuest('start', quest);
    return true;
  }

  function activateChapter(chapter) {
    var changed = false;
    for (var i = 0; i < questOrder.length; i++) {
      if (questOrder[i].manualStart) continue;
      if (questOrder[i].chapter <= chapter && questOrder[i].status === 'locked') {
        questOrder[i].status = 'active';
        changed = true;
      }
    }
    if (changed) persist();
    return changed;
  }

  function updateProgress(questId, amount) {
    var quest = getQuestInternal(questId);
    if (!ensureActive(quest)) return false;
    var next = Math.max(0, Math.min(quest.progress + (amount || 0), quest.target));
    if (next === quest.progress) return false;
    quest.progress = next;
    if (quest.progress >= quest.target) {
      return finalizeQuest(quest);
    }
    setTrackedQuest(quest.id, true);
    persist();
    return true;
  }

  function complete(questId) {
    var quest = getQuestInternal(questId);
    if (!quest || quest.status === 'completed') return false;
    return finalizeQuest(quest);
  }

  function getQuest(questId) {
    var quest = getQuestInternal(questId);
    return quest ? clone(quest) : null;
  }

  function getActive() {
    var result = [];
    for (var i = 0; i < questOrder.length; i++) {
      if (questOrder[i].status === 'active') result.push(clone(questOrder[i]));
    }
    return result;
  }

  function getTrackedQuest() {
    var quest = getTrackedQuestInternal();
    return quest ? clone(quest) : null;
  }

  function getAll() {
    return clone(questOrder);
  }

  function isCompleted(questId) {
    var quest = getQuestInternal(questId);
    return !!(quest && quest.status === 'completed');
  }

  function claimReward(questId) {
    var quest = getQuestInternal(questId);
    if (!quest || quest.status !== 'completed' || quest.rewardClaimed) return false;
    grantReward(quest);
    persist();
    return true;
  }

  function visitMap(mapId) {
    if (!mapId) return false;
    runtime.visitedMaps[mapId] = true;

    if (mapId === 'kusatsu' && !runtime.onsenMaps.kusatsu) {
      runtime.onsenMaps.kusatsu = true;
      syncProgress('onsen_tour', countKeys(runtime.onsenMaps));
    }

    if (mapId === 'akagi_shrine') {
      complete('search_for_hana');
    }

    persist();
    return true;
  }

  function syncProgress(questId, value) {
    var quest = getQuestInternal(questId);
    if (!ensureActive(quest)) return false;
    var next = Math.max(0, Math.min(value, quest.target));
    if (next === quest.progress) return false;
    quest.progress = next;
    if (quest.progress >= quest.target) {
      return finalizeQuest(quest);
    }
    setTrackedQuest(quest.id, true);
    persist();
    return true;
  }

  function visitTile(mapId, x, y, tileType, options) {
    options = options || {};
    var i;
    var changed = false;
    var isOnsenTile = !!options.isOnsen;

    if (!isOnsenTile && Game.Config && Game.Config.TILE) {
      isOnsenTile = tileType === Game.Config.TILE.ONSEN;
    }
    if (runtime.onsenMaps.kusatsu && mapId && mapId !== 'kusatsu' && isOnsenTile && !runtime.onsenMaps[mapId]) {
      runtime.onsenMaps[mapId] = true;
      changed = syncProgress('onsen_tour', countKeys(runtime.onsenMaps)) || changed;
    }

    for (i = 0; i < karutaLocations.length; i++) {
      if (karutaLocations[i].mapId === mapId && karutaLocations[i].x === x && karutaLocations[i].y === y && !runtime.karutaCards[karutaLocations[i].key]) {
        runtime.karutaCards[karutaLocations[i].key] = true;
        changed = syncProgress('joumo_karuta_collection', countKeys(runtime.karutaCards)) || changed;
        break;
      }
    }

    if (mapId === 'onuma') {
      for (i = 0; i < fishingLocations.length; i++) {
        if (fishingLocations[i].x === x && fishingLocations[i].y === y && !runtime.fishingSpots[fishingLocations[i].key]) {
          runtime.fishingSpots[fishingLocations[i].key] = true;
          changed = syncProgress('fishing_master', countKeys(runtime.fishingSpots)) || changed;
          break;
        }
      }
    }

    if (changed) persist();
    return changed;
  }

  function talkToNpc(npcId, mapId) {
    if (!npcId) return false;
    var changed = false;

    if (!runtime.talkedNpcs[npcId]) {
      runtime.talkedNpcs[npcId] = mapId || true;
      changed = syncProgress('gunma_dialect_master', countKeys(runtime.talkedNpcs)) || changed;
    }

    if (npcId === 'ranchShop' && countKeys(runtime.blacksmithMaterials) >= 3) {
      changed = complete('legendary_blacksmith') || changed;
    }

    if ((npcId === 'angura_guard' || npcId === 'angura_boss' || npcId === 'kunisada_chuji') && !runtime.anguraTalks[npcId]) {
      runtime.anguraTalks[npcId] = true;
      changed = syncProgress('angura_secret', countKeys(runtime.anguraTalks)) || changed;
    }

    if (changed) persist();
    return changed;
  }

  function completePuzzle(puzzleId, success) {
    if (!success || puzzleId !== 'daruma') return false;
    return updateProgress('daruma_perseverance', 1);
  }

  function obtainItem(itemId) {
    var changed = false;
    if (!itemId) return false;

    if (legendaryMaterials[itemId] && !runtime.blacksmithMaterials[legendaryMaterials[itemId]]) {
      runtime.blacksmithMaterials[legendaryMaterials[itemId]] = true;
      changed = syncProgress('legendary_blacksmith', countKeys(runtime.blacksmithMaterials)) || changed;
    }

    if (diceItemIds[itemId]) {
      runtime.ownedDice[itemId] = true;
      changed = syncProgress('way_of_the_dice', countKeys(runtime.ownedDice)) || changed;
    }

    if (changed) persist();
    return changed;
  }

  function syncInventory(inventory, equippedDice) {
    inventory = inventory || [];
    equippedDice = equippedDice || [];
    var i;
    var changed = false;

    for (i = 0; i < inventory.length; i++) {
      if (diceItemIds[inventory[i]]) {
        runtime.ownedDice[inventory[i]] = true;
      }
    }
    for (i = 0; i < equippedDice.length; i++) {
      if (diceItemIds[equippedDice[i]]) {
        runtime.ownedDice[equippedDice[i]] = true;
      }
    }

    changed = syncProgress('way_of_the_dice', countKeys(runtime.ownedDice)) || changed;
    if (changed) persist();
    return changed;
  }

  function eventUpdate(type, payload) {
    payload = payload || {};
    switch (type) {
      case 'chapter_change':
      case 'chapter':
        return activateChapter(payload.chapter || payload.value || 1);
      case 'start_quest':
      case 'quest_start':
        return startQuest(payload.questId || payload.id);
      case 'visit_map':
      case 'map_visit':
        return visitMap(payload.mapId || payload.id || payload.mapName);
      case 'visit_tile':
      case 'tile_visit':
        return visitTile(payload.mapId, payload.x, payload.y, payload.tileType, payload);
      case 'npc_talk':
      case 'talk':
        return talkToNpc(payload.npcId || payload.id, payload.mapId);
      case 'puzzle_complete':
      case 'puzzle':
        return completePuzzle(payload.puzzleId || payload.id, payload.success !== false);
      case 'item_obtain':
      case 'obtain_item':
        return obtainItem(payload.itemId || payload.id);
      case 'sync_inventory':
      case 'inventory':
        return syncInventory(payload.inventory, payload.equippedDice);
    }
    return false;
  }

  function open() {
    runtime.logOpen = true;
    normalizeIndex();
  }

  function close() {
    runtime.logOpen = false;
  }

  function toggle() {
    runtime.logOpen = !runtime.logOpen;
    normalizeIndex();
    return runtime.logOpen;
  }

  function update(type, payload) {
    if (typeof type === 'string') {
      return eventUpdate(type, payload);
    }

    if (!runtime.logOpen || !Game.Input) return false;

    if (Game.Input.isPressed('up')) {
      runtime.selectedIndex--;
      normalizeIndex();
      return true;
    }
    if (Game.Input.isPressed('down')) {
      runtime.selectedIndex++;
      normalizeIndex();
      return true;
    }
    if (Game.Input.isPressed('cancel')) {
      close();
      return true;
    }
    if (Game.Input.isPressed('confirm')) {
      var selectedQuest = questOrder[runtime.selectedIndex];
      if (selectedQuest && selectedQuest.status === 'active') {
        setTrackedQuest(selectedQuest.id);
        return true;
      }
    }
    return false;
  }

  function getQuestColor(status) {
    if (status === 'completed') return '#ffcc44';
    if (status === 'active') return '#ffffff';
    return '#777777';
  }

  function getRewardText(quest) {
    if (!quest.reward) return 'なし';
    if (quest.reward.type === 'gold') return quest.reward.value + 'G';
    if (Game.Items && Game.Items.get) {
      var item = Game.Items.get(quest.reward.value);
      if (item && item.name) return item.name;
    }
    return quest.reward.value;
  }

  function clampQuestText(text, maxChars) {
    if (!text || text.length <= maxChars) return text || '';
    return text.substring(0, Math.max(0, maxChars - 1)) + '…';
  }

  function matchesContextNote(note) {
    if (!note) return false;
    if (note.flag && (!Game.Story || !Game.Story.hasFlag || !Game.Story.hasFlag(note.flag))) return false;
    if (note.notFlag && Game.Story && Game.Story.hasFlag && Game.Story.hasFlag(note.notFlag)) return false;
    if (note.mapId && Game.Map && Game.Map.getCurrentMapId && Game.Map.getCurrentMapId() !== note.mapId) return false;
    if (typeof note.minChapter === 'number' && Game.Player && Game.Player.getData) {
      if ((Game.Player.getData().chapter || 1) < note.minChapter) return false;
    }
    return true;
  }

  function getQuestContextNote(questOrId) {
    var quest = typeof questOrId === 'string' ? getQuestInternal(questOrId) : questOrId;
    if (!quest || !quest.contextNotes || !quest.contextNotes.length) return '';
    for (var i = 0; i < quest.contextNotes.length; i++) {
      if (matchesContextNote(quest.contextNotes[i])) {
        return quest.contextNotes[i].text || '';
      }
    }
    return '';
  }

  function drawProgressBar(x, y, width, height, quest) {
    var ratio = quest.target > 0 ? quest.progress / quest.target : 0;
    Game.Renderer.drawRectAbsolute(x, y, width, height, '#222');
    Game.Renderer.drawRectAbsolute(x + 1, y + 1, Math.max(0, Math.floor((width - 2) * ratio)), height - 2, '#44aa88');
    Game.Renderer.drawRectAbsolute(x, y + height, width, 1, '#445566');
  }

  function draw() {
    if (!runtime.logOpen) return false;

    var R = Game.Renderer;
    var C = Game.Config;
    var listTop = 52;
    var rowHeight = 60;
    var visibleRows = 4;
    var i;

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(6,10,22,0.98)');
    R.drawTextJP(TITLE, 170, 10, '#ffcc44', 18);
    R.drawTextJP('↑↓ スクロール  Z 追跡  X 閉じる', 120, 32, '#99a3c8', 9);

    for (i = 0; i < visibleRows; i++) {
      var questIndex = runtime.scrollOffset + i;
      if (questIndex >= questOrder.length) break;
      var quest = questOrder[questIndex];
      var y = listTop + i * rowHeight;
      var selected = questIndex === runtime.selectedIndex;
      var color = getQuestColor(quest.status);
      R.drawRectAbsolute(16, y, 448, 52, selected ? 'rgba(50,62,96,0.95)' : 'rgba(20,24,38,0.92)');
      R.drawRectAbsolute(16, y, 448, 1, selected ? '#88aaff' : '#2b324f');
      R.drawRectAbsolute(16, y + 52, 448, 1, '#1c2238');
      R.drawTextJP((questIndex + 1) + '.', 24, y + 8, '#9ca6cb', 10);
      R.drawTextJP(clampQuestText(quest.name, 13), 44, y + 6, color, 13);
      R.drawTextJP(clampQuestText(quest.description, 24), 44, y + 23, quest.status === 'locked' ? '#666' : '#bcc3da', 9);
      R.drawTextJP('報酬: ' + clampQuestText(getRewardText(quest), 12), 298, y + 6, '#d8bc63', 9);
      if (quest.status === 'active') {
        drawProgressBar(300, y + 26, 140, 8, quest);
        R.drawTextJP(quest.progress + '/' + quest.target, 392, y + 37, '#d9f7ee', 8);
        if (runtime.trackedQuestId === quest.id) {
          R.drawTextJP('追跡中', 246, y + 37, '#8fe0ff', 8);
        }
      } else if (quest.status === 'completed') {
        R.drawTextJP('達成済み', 364, y + 26, '#ffcc44', 10);
      } else {
        R.drawTextJP('未解放', 368, y + 26, '#777', 10);
      }
    }

    var selectedQuest = questOrder[runtime.selectedIndex] || null;
    var selectedContextNote = getQuestContextNote(selectedQuest);
    R.drawRectAbsolute(16, 288, 448, 18, 'rgba(16,20,32,0.9)');
    R.drawRectAbsolute(16, 288, 448, 1, '#202843');
    R.drawTextJP(
      clampQuestText(selectedContextNote || '土地の反応を拾うと、依頼の見え方も少し変わる。', 34),
      24,
      294,
      selectedContextNote ? '#8fd6ff' : '#6f7a9a',
      7
    );
    R.drawTextJP('全' + questOrder.length + '件', 456, 294, '#888', 9, 'right');
    return true;
  }

  function drawTracker() {
    var quest = getTrackedQuestInternal();
    if (!quest) {
      var active = getActive();
      if (!active.length) return false;
      quest = getQuestInternal(active[0].id);
      if (!quest) return false;
    }
    var R = Game.Renderer;
    var contextNote = getQuestContextNote(quest);
    var trackerY = contextNote ? 270 : 282;
    var trackerHeight = contextNote ? 44 : 32;
    R.drawRectAbsolute(8, trackerY, 238, trackerHeight, 'rgba(0,0,0,0.72)');
    R.drawTextJP(clampQuestText(quest.name, 14), 14, trackerY + 9, '#ffcc44', 9);
    if (contextNote) {
      R.drawTextJP(clampQuestText(contextNote, 31), 14, trackerY + 21, '#9fc6ef', 7);
    }
    drawProgressBar(120, trackerY + (contextNote ? 29 : 13), 90, 6, quest);
    R.drawTextJP(quest.progress + '/' + quest.target, 182, trackerY + (contextNote ? 23 : 7), '#ffffff', 8);
    R.drawTextJP('Q 依頼帳', 238, trackerY + 9, '#8fe0ff', 7, 'right');
    return true;
  }

  function reset() {
    for (var i = 0; i < questOrder.length; i++) {
      questOrder[i].status = (questOrder[i].chapter === 1 && !questOrder[i].manualStart) ? 'active' : 'locked';
      questOrder[i].progress = 0;
      questOrder[i].rewardClaimed = false;
    }
    runtime.visitedMaps = {};
    runtime.onsenMaps = {};
    runtime.deliveryFlags = {};
    runtime.karutaCards = {};
    runtime.talkedNpcs = {};
    runtime.blacksmithMaterials = {};
    runtime.fishingSpots = {};
    runtime.anguraTalks = {};
    runtime.ownedDice = {};
    runtime.trackedQuestId = '';
    runtime.selectedIndex = 0;
    runtime.scrollOffset = 0;
    runtime.logOpen = false;
    persist();
  }

  function syncFromGame() {
    if (Game.Map && Game.Map.getCurrentMapId) {
      visitMap(Game.Map.getCurrentMapId());
    }
    if (Game.Player && Game.Player.getData) {
      var playerData = Game.Player.getData();
      syncInventory(playerData.inventory || [], playerData.equippedDice || []);
    }
  }

  return {
    activate: activate,
    updateProgress: updateProgress,
    complete: complete,
    startQuest: startQuest,
    getQuest: getQuest,
    getActive: getActive,
    getTrackedQuest: getTrackedQuest,
    getAll: getAll,
    getContextNote: getQuestContextNote,
    isCompleted: isCompleted,
    update: update,
    draw: draw,
    drawTracker: drawTracker,
    activateChapter: activateChapter,
    claimReward: claimReward,
    visitMap: visitMap,
    visitTile: visitTile,
    talkToNpc: talkToNpc,
    completePuzzle: completePuzzle,
    obtainItem: obtainItem,
    syncInventory: syncInventory,
    syncFromGame: syncFromGame,
    exportState: exportState,
    importState: importState,
    open: open,
    close: close,
    toggle: toggle,
    isOpen: function() { return runtime.logOpen; },
    reset: reset
  };
})();
