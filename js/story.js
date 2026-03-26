// Story Event Engine - Manages scripted story sequences
Game.Story = (function() {
  var currentEvent = null;
  var stepIndex = 0;
  var waitingForInput = false;
  var currentSpeaker = '';
  var currentText = '';
  var storyFlags = {};
  var chapter = 1;
  var phase = ''; // current story phase tracking
  var JOURNEY_STORAGE_KEY = 'gunmaEscape_storyJourney';
  var journeyState = createJourneyState();

  // Chapter → field BGM mapping (uses audio.js melody IDs)
  var chapterFieldBgm = {
    1: 'field',          // ch1-3: 汎用フィールド曲
    2: 'field',
    3: 'dungeon',        // ch3: 赤城山ダンジョン
    4: 'ch4_shirane',    // 白根山の硫黄環境音
    5: 'ch5_gakuen',     // 歪んだチャイムと郷愁ピアノ
    6: 'ch6_tunnel',     // 凍える風と地下反響
    7: 'ch7_haruna',     // 濃霧と湖面
    8: 'ch8_oze',        // 泥の泡立ち重低音
    9: 'ch9_minakami',   // 川のせせらぎと張り詰めた空気
    10: 'ch10_border'    // 現実ノイズ終末アンビエント
  };
  var eventQueue = [];
  var onEventEnd = null;
  var choiceIndex = 0;
  var choices = null;
  var bgImage = null; // background scene type
  var bgColor = '#000';
  var characters = []; // characters shown on screen during event
  var fadeAlpha = 0;
  var fadeDir = 0; // 0=none, 1=fading in, -1=fading out
  var fadeCallback = null;
  var shakeTimer = 0;
  var typewriterText = '';
  var typewriterIndex = 0;
  var typewriterSpeed = 2; // frames per character
  var typewriterTimer = 0;
  var pauseTimer = 0;
  var bgmOverride = null;

  function createJourneyState() {
    return {
      respectGauge: 0,
      catalysts: []
    };
  }

  function normalizeJourneyState(state) {
    var normalized = createJourneyState();
    if (!state || typeof state !== 'object') return normalized;

    if (typeof state.respectGauge === 'number' && isFinite(state.respectGauge)) {
      normalized.respectGauge = Math.max(0, Math.round(state.respectGauge));
    }

    if (Array.isArray(state.catalysts)) {
      for (var i = 0; i < state.catalysts.length; i++) {
        var catalystId = state.catalysts[i];
        if (typeof catalystId === 'string' && normalized.catalysts.indexOf(catalystId) < 0) {
          normalized.catalysts.push(catalystId);
        }
      }
    }

    return normalized;
  }

  // Character portraits (8x8 pixel grids, scaled to 64x64)
  var portraits = {
    '主人公': { color: '#888888', accent: '#aaaaaa', label: '?' },
    'アカギ': { color: '#8b4422', accent: '#cc6633', label: 'A' },
    '龝櫻':  { color: '#333344', accent: '#555566', label: '翁' },
    '国定忠治': { color: '#223366', accent: '#4455aa', label: '忠' },
    'ナンバー12': { color: '#222222', accent: '#444444', label: '12' },
    '花':    { color: '#cc88aa', accent: '#ffaacc', label: '花' },
    '佐藤':  { color: '#3366aa', accent: '#5588cc', label: '佐' },
    'ユウマ': { color: '#664422', accent: '#886633', label: '幽' },
    '山川':  { color: '#557744', accent: '#77aa55', label: '山' },
    '古谷':  { color: '#554488', accent: '#7766aa', label: '古' },
    '熊子':  { color: '#663322', accent: '#884433', label: '熊' },
    '学園長': { color: '#334455', accent: '#556677', label: '長' }
  };

  // ============================================================
  //  第1章〜第3章 イベント配列
  //  各 event_id → scene配列 (story engine の step 形式)
  // ============================================================

  var chapterEvents = {

    // ── 第1章「覚醒 ─ 赤城の記憶」 ──────────────────

    'ch1_opening': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '...目が覚めると、知らない土地だった。' },
      { type: 'narration', text: '道路標識には「群馬県」の三文字。' },
      { type: 'narration', text: '記憶がない。自分の名前すら思い出せない。' },
      { type: 'dialog', speaker: '主人公', text: 'ここは...どこだ？' },
      { type: 'dialog', speaker: '主人公', text: '頭がぼんやりする。何も思い出せない。' },
      { type: 'set_flag', flag: 'ch1_started' },
      { type: 'narration', text: '足元に一通の手紙が落ちている。' },
      { type: 'play_sfx', sfx: 'item' },
      { type: 'dialog', speaker: '主人公', text: '「前橋に来い。佐藤」...佐藤？知っている名前のような...。' },
      { type: 'set_flag', flag: 'sato_letter_found' }
    ],

    'ch1_first_encounter': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '森の中を彷徨っていると、人影が見えた。' },
      { type: 'show_character', name: 'アカギ', position: 'right' },
      { type: 'dialog', speaker: 'アカギ', text: 'おい、そこのお前。この土地を歩くな。' },
      { type: 'dialog', speaker: 'アカギ', text: 'ここには...掟がある。余所者は立ち入れない。' },
      { type: 'dialog', speaker: '主人公', text: '掟？何のことだ？' },
      { type: 'dialog', speaker: 'アカギ', text: '...記憶がないのか。ならばなおさら危ない。' },
      { type: 'dialog', speaker: 'アカギ', text: '俺はアカギ。この辺りの道案内をしている。' },
      { type: 'choice', speaker: 'アカギ', text: 'どうする？ 一緒に来るか、一人で行くか。', choices: [
        { text: '一緒に行く', goto: 11 },
        { text: '一人で行く', goto: 14 }
      ]},
      // goto:11 → 一緒に行く
      { type: 'dialog', speaker: 'アカギ', text: '賢い選択だ。前橋まで案内してやる。' },
      { type: 'party_join', id: 'akagi', name: 'アカギ' },
      { type: 'set_flag', flag: 'akagi_joined_ch1' },
      // goto:14 → 一人で行く（合流は後で強制発生）
      { type: 'dialog', speaker: 'アカギ', text: '...まあいい。だが死にたくなければ結界の外に出るな。' },
      { type: 'dialog', speaker: 'アカギ', text: '前橋の方角はあちらだ。気をつけろ。' },
      { type: 'set_flag', flag: 'akagi_warned' }
    ],

    'ch1_maebashi_arrival': [
      { type: 'set_bg', bg: 'village' },
      { type: 'fade_in' },
      { type: 'narration', text: '前橋の街に辿り着いた。' },
      { type: 'narration', text: '人の気配はあるが、どこか...よそよそしい。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤の手紙には「前橋に来い」とだけ書いてあった。' },
      { type: 'dialog', speaker: '主人公', text: '何を探せばいい？' },
      { type: 'set_flag', flag: 'maebashi_reached' },
      { type: 'check_flag', flag: 'akagi_joined_ch1', gotoTrue: 8, gotoFalse: 10 },
      // gotoTrue:8
      { type: 'dialog', speaker: 'アカギ', text: 'この先に宿場がある。まずは情報を集めろ。' },
      { type: 'narration', text: 'アカギが案内してくれた。' },
      // gotoFalse:10
      { type: 'narration', text: '一人で街を歩く。情報を探さなくては。' }
    ],

    'ch1_sato_encounter': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'fade_in' },
      { type: 'show_character', name: '佐藤', position: 'center' },
      { type: 'dialog', speaker: '佐藤', text: '...来たか。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤！お前なのか！？' },
      { type: 'dialog', speaker: '佐藤', text: 'その記憶の欠け方...やはりお前も侵食されていたか。' },
      { type: 'dialog', speaker: '主人公', text: '侵食？何のことだ？' },
      { type: 'dialog', speaker: '佐藤', text: 'この土地には古い結界がある。' },
      { type: 'dialog', speaker: '佐藤', text: '結界が弱まると、中にいる者の記憶が薄れていく。' },
      { type: 'dialog', speaker: '佐藤', text: '俺たちは車で群馬に入った。4人で。' },
      { type: 'dialog', speaker: '主人公', text: '4人...？俺と佐藤と、あと誰が...。' },
      { type: 'dialog', speaker: '佐藤', text: '山川と古谷。...思い出せないか？' },
      { type: 'dialog', speaker: '佐藤', text: '今は説明している時間がない。' },
      { type: 'dialog', speaker: '佐藤', text: 'ユウマという男を探せ。群馬の奥地に消えたらしい。' },
      { type: 'dialog', speaker: '佐藤', text: '俺は俺で別の路線を辿る。' },
      { type: 'give_item', item: 'normalDice' },
      { type: 'dialog', speaker: '佐藤', text: 'これを持っていけ。この土地では「ダイス」が力になる。' },
      { type: 'dice_tutorial', text: 'ダイスを振ってみよう！（Zキーで止める）' },
      { type: 'set_flag', flag: 'sato_met_ch1' },
      { type: 'set_flag', flag: 'dice_obtained' },
      { type: 'hide_character', name: '佐藤' },
      { type: 'narration', text: '佐藤は足早に去っていった。' },
      { type: 'dialog', speaker: '主人公', text: '山川...古谷...。名前だけは、どこかで聞いたことがある気がする。' }
    ],

    'ch1_boss_sato_test': [
      // 佐藤が主人公の力を試すイベント戦
      { type: 'set_bg', bg: 'battle_field' },
      { type: 'dialog', speaker: '佐藤', text: '...一つ確認させろ。' },
      { type: 'dialog', speaker: '佐藤', text: 'お前が本物かどうか、この土地が見せる幻でないかどうか。' },
      { type: 'shake', duration: 20 },
      { type: 'dialog', speaker: '佐藤', text: '来い。ダイスで証明しろ。' },
      { type: 'start_battle', enemy: 'satoTest' },
      { type: 'dialog', speaker: '佐藤', text: '...間違いない。お前は本物だ。' },
      { type: 'dialog', speaker: '佐藤', text: '先を急げ。高崎へ向かえ。' },
      { type: 'set_flag', flag: 'sato_test_cleared' },
      { type: 'heal' }
    ],

    'ch1_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第一章「覚醒 ─ 赤城の記憶」 完 ──' },
      { type: 'narration', text: '記憶を失った主人公。佐藤との再会。' },
      { type: 'narration', text: '結界、侵食、そして消えた男・ユウマ。' },
      { type: 'narration', text: '群馬の奥地に、何が待っているのか。' },
      { type: 'set_flag', flag: 'ch1_complete' },
      { type: 'end_chapter', next: 2 },
      { type: 'fade_out' }
    ],

    // ── 第2章「路線 ─ 高崎・草津を往く」 ──────────────

    'ch2_opening': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第二章「路線 ─ 高崎・草津を往く」──' },
      { type: 'set_phase', phase: 'ch2' },
      { type: 'narration', text: '佐藤の言葉を頼りに、高崎へ向かう。' },
      { type: 'dialog', speaker: 'アカギ', text: '高崎にはだるま師匠がいる。' },
      { type: 'dialog', speaker: 'アカギ', text: 'あの人なら古い路線について知っているかもしれない。' },
      { type: 'dialog', speaker: '主人公', text: '路線...？' },
      { type: 'dialog', speaker: 'アカギ', text: 'この土地を走る力の流れのことだ。' },
      { type: 'dialog', speaker: 'アカギ', text: '鉄道に沿って結界が張られている。路線が途切れると結界も綻ぶ。' },
      { type: 'set_flag', flag: 'ch2_started' }
    ],

    'ch2_takasaki_daruma': [
      { type: 'set_bg', bg: 'village' },
      { type: 'fade_in' },
      { type: 'narration', text: '高崎の町に入ると、巨大なだるまが並んでいた。' },
      { type: 'dialog', speaker: 'アカギ', text: 'だるま師匠に会いに行こう。あの人が路線の鍵を握っている。' },
      { type: 'set_flag', flag: 'takasaki_entered' }
    ],

    'ch2_daruma_master_pre': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'fade_in' },
      { type: 'dialog', speaker: 'だるま師匠', text: '七転び八起き。何度でも立ち上がれ。' },
      { type: 'dialog', speaker: 'だるま師匠', text: 'お前の記憶が欠けているのは、結界の侵食のせいだ。' },
      { type: 'dialog', speaker: 'だるま師匠', text: 'だが心配するな。心に刻まれた記憶は消えない。' },
      { type: 'dialog', speaker: 'だるま師匠', text: '...まずはお前の覚悟を見せてもらおう。' },
      { type: 'dialog', speaker: 'だるま師匠', text: 'この目を預ける。空白を埋められるか、そこで見せてみろ。' },
      { type: 'give_item', item: 'darumaEye' },
      { type: 'start_battle', enemy: 'darumaMaster' },
      { type: 'dialog', speaker: 'だるま師匠', text: 'よし、合格だ。これを持っていけ。' },
      { type: 'give_item', item: 'darumaDice' },
      { type: 'set_flag', flag: 'daruma_master_cleared' }
    ],

    'ch2_kusatsu_arrival': [
      { type: 'set_bg', bg: 'konuma' },
      { type: 'fade_in' },
      { type: 'narration', text: '湯けむりの中に、草津の温泉街が現れた。' },
      { type: 'dialog', speaker: 'アカギ', text: 'ここが草津だ。温泉の力は侵食を和らげる。' },
      { type: 'dialog', speaker: 'アカギ', text: 'だが...番人がいる。通してもらえるかどうか。' },
      { type: 'set_flag', flag: 'kusatsu_entered' }
    ],

    'ch2_onsen_monkey_battle': [
      { type: 'set_bg', bg: 'konuma' },
      { type: 'dialog', speaker: '温泉猿', text: 'キキーッ！ここは俺の湯だ！' },
      { type: 'dialog', speaker: '温泉猿', text: '入りたきゃ俺に勝ってから来い！' },
      { type: 'start_battle', enemy: 'onsenMonkey' },
      { type: 'dialog', speaker: '温泉猿', text: 'キキ...やるじゃねぇか。好きなだけ浸かれ。' },
      { type: 'give_item', item: 'onsenDice' },
      { type: 'heal' },
      { type: 'set_flag', flag: 'onsen_monkey_cleared' },
      { type: 'narration', text: '温泉に浸かり、体力が回復した。侵食の痛みが少し和らぐ。' }
    ],

    'ch2_tamura_village': [
      { type: 'set_bg', bg: 'village' },
      { type: 'fade_in' },
      { type: 'show_character', name: '龝櫻', position: 'center' },
      { type: 'dialog', speaker: '龝櫻', text: 'よく来たな、旅人よ。' },
      { type: 'dialog', speaker: '龝櫻', text: 'わしは龝櫻。この村を預かる者だ。' },
      { type: 'dialog', speaker: '龝櫻', text: 'お前が探しているユウマという男は...確かにここを通った。' },
      { type: 'dialog', speaker: '龝櫻', text: 'だが、谷川岳の先...国境のトンネルに消えたきり戻らぬ。' },
      { type: 'dialog', speaker: '主人公', text: '国境のトンネル...？' },
      { type: 'dialog', speaker: '龝櫻', text: '群馬と新潟を繋ぐ古い路線の先にある。' },
      { type: 'dialog', speaker: '龝櫻', text: 'あそこは結界が最も深い場所だ。安易に近づくな。' },
      { type: 'set_flag', flag: 'tamura_visited' },
      { type: 'set_flag', flag: 'yuuma_clue_tamura' },
      { type: 'hide_character', name: '龝櫻' }
    ],

    'ch2_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第二章「路線 ─ 高崎・草津を往く」 完 ──' },
      { type: 'narration', text: '路線と結界の関係。龝櫻の助言。' },
      { type: 'narration', text: 'ユウマの足跡は、国境のトンネルへと続いていた。' },
      { type: 'set_flag', flag: 'ch2_complete' },
      { type: 'end_chapter', next: 3 },
      { type: 'fade_out' }
    ],

    // ── 第3章「侵食 ─ 赤城山の影」 ──────────────────

    'ch3_opening': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第三章「侵食 ─ 赤城山の影」──' },
      { type: 'set_phase', phase: 'ch3' },
      { type: 'narration', text: '龝櫻の助言に従い、赤城山方面を調査することになった。' },
      { type: 'dialog', speaker: 'アカギ', text: '赤城山は...俺の名の由来でもある。' },
      { type: 'dialog', speaker: 'アカギ', text: 'あの山には古い力が眠っている。侵食の源がそこにあるかもしれない。' },
      { type: 'set_flag', flag: 'ch3_started' }
    ],

    'ch3_shimonita': [
      { type: 'set_bg', bg: 'village' },
      { type: 'fade_in' },
      { type: 'narration', text: '下仁田に立ち寄る。こんにゃくの匂いが漂う山あいの宿場。' },
      { type: 'dialog', speaker: 'アカギ', text: 'ここの大王に会えば、赤城山への道が開けるかもしれない。' },
      { type: 'set_flag', flag: 'shimonita_entered' }
    ],

    'ch3_konnyaku_king_battle': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'fade_in' },
      { type: 'dialog', speaker: 'こんにゃく大王', text: 'ほう、余所者か。この地を通りたければ掟に従え。' },
      { type: 'dialog', speaker: 'こんにゃく大王', text: 'わしのクイズに答え、ダイスで勝負せよ！' },
      { type: 'start_battle', enemy: 'konnyakuKing' },
      { type: 'dialog', speaker: 'こんにゃく大王', text: 'むぅ...見事だ。赤城への道、通してやろう。' },
      { type: 'give_item', item: 'konnyakuDice' },
      { type: 'set_flag', flag: 'konnyaku_king_cleared' }
    ],

    'ch3_tsumagoi': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '嬬恋の高原。見渡す限りのキャベツ畑が広がる。' },
      { type: 'dialog', speaker: 'アカギ', text: 'この畑を守る番人がいる。' },
      { type: 'dialog', speaker: 'アカギ', text: '力ずくでは通れない。正面から挑め。' },
      { type: 'set_flag', flag: 'tsumagoi_entered' }
    ],

    'ch3_cabbage_guardian_battle': [
      { type: 'set_bg', bg: 'battle_field' },
      { type: 'dialog', speaker: 'キャベツ番人', text: 'この大地を荒らす者は許さん！' },
      { type: 'start_battle', enemy: 'cabbageGuardian' },
      { type: 'dialog', speaker: 'キャベツ番人', text: '...見事な闘いだった。先へ進め。' },
      { type: 'give_item', item: 'cabbageDice' },
      { type: 'set_flag', flag: 'cabbage_guardian_cleared' }
    ],

    'ch3_akagi_approach': [
      { type: 'set_bg', bg: 'akagi_ranch' },
      { type: 'fade_in' },
      { type: 'narration', text: '赤城山の麓。霧が深くなり、侵食が強くなっている。' },
      { type: 'dialog', speaker: 'アカギ', text: '...俺の体に異変が起きている。' },
      { type: 'dialog', speaker: 'アカギ', text: 'この山の侵食は、俺にも影響しているようだ。' },
      { type: 'dialog', speaker: '主人公', text: 'アカギ！大丈夫か？' },
      { type: 'shake', duration: 30 },
      { type: 'dialog', speaker: 'アカギ', text: 'ぐっ...体が重い。少し休ませてくれ。' },
      { type: 'set_flag', flag: 'akagi_weakened' }
    ],

    'ch3_akagi_petrify': [
      { type: 'set_bg', bg: 'akagi_ranch' },
      { type: 'narration', text: '赤城山の侵食が、アカギの体を蝕んでいく。' },
      { type: 'shake', duration: 40 },
      { type: 'dialog', speaker: 'アカギ', text: '...すまない。もう動けない。' },
      { type: 'dialog', speaker: 'アカギ', text: '俺の体が...石に...。' },
      { type: 'dialog', speaker: '主人公', text: 'アカギ！！' },
      { type: 'play_sfx', sfx: 'hit' },
      { type: 'narration', text: 'アカギの体が灰色に変わり、動かなくなった。' },
      { type: 'narration', text: '── 石化。赤城山の侵食が引き起こした呪い。' },
      { type: 'dialog', speaker: '主人公', text: 'くそっ...必ず元に戻す。絶対にだ。' },
      { type: 'set_flag', flag: 'akagi_petrified' },
      { type: 'set_flag', flag: 'party_akagi_lost' },
      { type: 'legacy_card', cardId: 'akagi_petrified', name: '石化のアカギ',
        description: '赤城山の侵食に呑まれ、石と化した案内人。' }
    ],

    'ch3_angura_first': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: 'アングラの見張りが道を塞いでいる。' },
      { type: 'dialog', speaker: 'アングラの見張り', text: '...ここから先は我らの領域だ。' },
      { type: 'dialog', speaker: 'アングラの見張り', text: '引き返せ。さもなくば消す。' },
      { type: 'dialog', speaker: '主人公', text: 'アカギを元に戻すためには、先に進むしかない！' },
      { type: 'start_battle', enemy: 'anguraGuard' },
      { type: 'dialog', speaker: '主人公', text: 'アングラ...一体何者だ？' },
      { type: 'set_flag', flag: 'angura_guard_cleared' }
    ],

    'ch3_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第三章「侵食 ─ 赤城山の影」 完 ──' },
      { type: 'narration', text: 'アカギの石化。アングラの影。深まる侵食。' },
      { type: 'narration', text: 'アカギを救う手がかりを求めて、旅は続く。' },
      { type: 'set_flag', flag: 'ch3_complete' },
      { type: 'end_chapter', next: 4 },
      { type: 'fade_out' }
    ],

    // ── 第4章「石化 ─ 白根の噴煙」 ──────────────────

    'ch4_opening': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第四章「石化 ─ 白根の噴煙」──' },
      { type: 'set_phase', phase: 'ch4' },
      { type: 'narration', text: 'アカギが石に変わった。' },
      { type: 'narration', text: '主人公は一人、白根山方面へ手がかりを探しに向かう。' },
      { type: 'dialog', speaker: '主人公', text: 'アカギを元に戻す方法...龝櫻なら知っているかもしれない。' },
      { type: 'set_flag', flag: 'ch4_started' }
    ],

    'ch4_shuuou_advice': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'fade_in' },
      { type: 'show_character', name: '龝櫻', position: 'center' },
      { type: 'dialog', speaker: '龝櫻', text: '石化を解くには、侵食の源を断つしかない。' },
      { type: 'dialog', speaker: '龝櫻', text: '白根の火口に、結界を蝕む力の結晶がある。' },
      { type: 'dialog', speaker: '龝櫻', text: 'だが白根は危険だ。噴煙の中に「湯隠」の長がいる。' },
      { type: 'dialog', speaker: '龝櫻', text: '白井熊子という名だ。...油断するな。' },
      { type: 'dialog', speaker: '主人公', text: '熊子...。行くしかない。' },
      { type: 'set_flag', flag: 'kumako_info_received' },
      { type: 'hide_character', name: '龝櫻' }
    ],

    'ch4_shirane_approach': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '白根山への登山道。硫黄の匂いが鼻を刺す。' },
      { type: 'narration', text: '霧が濃い。視界は数メートルしかない。' },
      { type: 'dialog', speaker: '主人公', text: '一人は...やっぱり心細いな。' },
      { type: 'check_flag', flag: 'sato_met_ch1', gotoTrue: 5, gotoFalse: 7 },
      // gotoTrue:5
      { type: 'dialog', speaker: '主人公', text: '佐藤が言っていた。山川と古谷。あいつらも群馬にいるのか？' },
      { type: 'narration', text: '仲間の記憶が、かすかに蘇りかける。' },
      // gotoFalse:7
      { type: 'narration', text: '足元の石が崩れる。慎重に進むしかない。' },
      { type: 'set_flag', flag: 'shirane_entered' }
    ],

    'ch4_kumako_encounter': [
      { type: 'set_bg', bg: 'konuma' },
      { type: 'fade_in' },
      { type: 'narration', text: '噴煙の向こうに、人影が立っている。' },
      { type: 'show_character', name: '熊子', position: 'center' },
      { type: 'dialog', speaker: '熊子', text: 'あら...お客さん？' },
      { type: 'dialog', speaker: '熊子', text: '温めてあげましょうか。体も、記憶も。' },
      { type: 'dialog', speaker: '主人公', text: 'お前が白井熊子か...！' },
      { type: 'dialog', speaker: '熊子', text: '怖い顔しないで。痛くないわよ。' },
      { type: 'dialog', speaker: '熊子', text: '...全部、溶かしてあげるから。' },
      { type: 'shake', duration: 25 },
      { type: 'set_flag', flag: 'kumako_met' }
    ],

    'ch4_kumako_battle': [
      { type: 'set_bg', bg: 'battle_field' },
      { type: 'dialog', speaker: '熊子', text: '回復？ ここでは毒よ。覚えておきなさい。' },
      { type: 'narration', text: '熊子の結界内では、回復の力が反転する！' },
      { type: 'play_sfx', sfx: 'hit' },
      { type: 'start_battle', enemy: 'kumako_steam' },
      { type: 'dialog', speaker: '熊子', text: '...負けちゃった。でも、気持ちよかったわ。' },
      { type: 'dialog', speaker: '熊子', text: 'あなたの仲間、谷川岳の先にいたわよ。' },
      { type: 'dialog', speaker: '熊子', text: '石化を解く結晶...持っていきなさい。' },
      { type: 'give_item', item: 'purifyStone' },
      { type: 'set_flag', flag: 'kumako_steam_defeated' },
      { type: 'legacy_card', cardId: 'kumako_lullaby', name: '熊子の子守唄',
        description: '癒やしの裏の侵食の恐怖。' },
      { type: 'hide_character', name: '熊子' }
    ],

    'ch4_yuflower_discovery': [
      { type: 'set_bg', bg: 'konuma' },
      { type: 'fade_in' },
      { type: 'narration', text: '火口付近で不思議な結晶を見つけた。' },
      { type: 'narration', text: '熱いのに冷たい。湯花が凍りついたような石。' },
      { type: 'set_flag', flag: 'yuflower_crystal' },
      { type: 'legacy_card', cardId: 'frozen_yuflower', name: '凍れる湯花',
        description: '白根火口で結晶化した不思議な湯花。' }
    ],

    'ch4_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第四章「石化 ─ 白根の噴煙」 完 ──' },
      { type: 'narration', text: '熊子を倒し、浄化の石を手に入れた。' },
      { type: 'narration', text: 'アカギを元に戻せるかもしれない。' },
      { type: 'narration', text: 'だが、谷川岳の先に何が待っているのか...。' },
      { type: 'set_flag', flag: 'ch4_complete' },
      { type: 'end_chapter', next: 5 },
      { type: 'fade_out' }
    ],

    // ── 第5章「学園 ─ 上毛の教室」 ──────────────────

    'ch5_opening': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第五章「学園 ─ 上毛の教室」──' },
      { type: 'set_phase', phase: 'ch5' },
      { type: 'narration', text: '旅の途中、不思議な建物に迷い込んだ。' },
      { type: 'narration', text: '校門には「県立上毛学園」の看板。' },
      { type: 'dialog', speaker: '主人公', text: '...学校？なぜこんな場所に。' },
      { type: 'set_flag', flag: 'ch5_started' },
      { type: 'set_flag', flag: 'gakuen_entered' }
    ],

    'ch5_gakuen_explore': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'fade_in' },
      { type: 'narration', text: '廊下を歩く。チャイムが鳴る。' },
      { type: 'play_sfx', sfx: 'confirm' },
      { type: 'narration', text: '教室には机が並んでいるが、座っているのは影のような生徒たち。' },
      { type: 'dialog', speaker: '主人公', text: 'この学校は...記憶の中の場所なのか？' },
      { type: 'dialog', speaker: '主人公', text: '待て...あの席。あれは佐藤の席だ。' },
      { type: 'narration', text: '佐藤の席には、ノートの切れ端が残されていた。' },
      { type: 'dialog', speaker: '主人公', text: '「ここにいたい」...佐藤が書いたのか？' },
      { type: 'set_flag', flag: 'sato_seat_found' },
      { type: 'legacy_card', cardId: 'empty_seat_note', name: '空席のノートの切れ端',
        description: '佐藤の席で見つけたメモ。' }
    ],

    'ch5_missing_photo': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'fade_in' },
      { type: 'narration', text: '職員室の壁に、古い卒業写真が飾られている。' },
      { type: 'dialog', speaker: '主人公', text: 'これは...俺たちの写真？' },
      { type: 'narration', text: '写真の中の一人だけ、顔が白く飛んでいる。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤の顔が...消えている。' },
      { type: 'dialog', speaker: '主人公', text: '記憶のアンカーが欠けている、ということか...？' },
      { type: 'set_flag', flag: 'missing_photo_found' },
      { type: 'legacy_card', cardId: 'missing_photo', name: '欠けた卒業写真',
        description: '佐藤の顔だけが白く飛んだ写真。' }
    ],

    'ch5_gakuencho_encounter': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'fade_in' },
      { type: 'show_character', name: '学園長', position: 'center' },
      { type: 'dialog', speaker: '学園長', text: '...授業中ですよ。席に着きなさい。' },
      { type: 'dialog', speaker: '主人公', text: 'あなたは...？' },
      { type: 'dialog', speaker: '学園長', text: 'この学園は、記憶を書き換える場所です。' },
      { type: 'dialog', speaker: '学園長', text: '侵食された記憶を正しく上書きし、安全に保つ。' },
      { type: 'dialog', speaker: '学園長', text: 'あなたの仲間の佐藤くんも...ここで書き換えられた。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤の記憶が書き換えられた...？' },
      { type: 'dialog', speaker: '学園長', text: '彼は自分からそれを望んだのです。' },
      { type: 'dialog', speaker: '学園長', text: '「現実に帰りたくない」と。' },
      { type: 'shake', duration: 20 },
      { type: 'set_flag', flag: 'gakuencho_truth' },
      { type: 'hide_character', name: '学園長' }
    ],

    'ch5_juke_confrontation': [
      { type: 'set_bg', bg: 'battle_field' },
      { type: 'fade_in' },
      { type: 'narration', text: '屋上に立つ影。風が強い。' },
      { type: 'dialog', speaker: 'ジューク', text: 'お前がここまで来るとはな。' },
      { type: 'dialog', speaker: 'ジューク', text: '掟を壊す気か？この土地のルールを。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤を連れ戻す。それだけだ。' },
      { type: 'dialog', speaker: 'ジューク', text: 'お前はただのプレイヤーだ。' },
      { type: 'dialog', speaker: 'ジューク', text: '掟の痛みを知れ。' },
      { type: 'start_battle', enemy: 'juke_gakuen' },
      { type: 'dialog', speaker: 'ジューク', text: '...なるほど。お前のダイスは確かに強い。' },
      { type: 'dialog', speaker: 'ジューク', text: 'だが佐藤は...自分の意志でここにいる。' },
      { type: 'dialog', speaker: 'ジューク', text: 'それでも連れ戻すのか？' },
      { type: 'choice', speaker: '主人公', text: '...。', choices: [
        { text: 'それでも連れ帰る', goto: 15 },
        { text: '佐藤の意志を尊重する', goto: 17 }
      ]},
      // goto:15
      { type: 'dialog', speaker: '主人公', text: 'あいつが望んでいなくても、俺はあいつを迎えに来た。' },
      { type: 'set_flag', flag: 'sato_rescue_determined' },
      // goto:17
      { type: 'dialog', speaker: '主人公', text: '...佐藤に、直接聞きたい。' },
      { type: 'set_flag', flag: 'sato_will_respected' },
      { type: 'set_flag', flag: 'juke_gakuen_defeated' },
      { type: 'legacy_card', cardId: 'juke_taunt', name: 'ジュークの挑発状',
        description: '掟を突きつけるライバルの怒り。' }
    ],

    'ch5_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第五章「学園 ─ 上毛の教室」 完 ──' },
      { type: 'narration', text: '佐藤の記憶は書き換えられていた。' },
      { type: 'narration', text: '彼自身の意志で。' },
      { type: 'narration', text: 'それでも...谷川岳の先に、答えがあるはずだ。' },
      { type: 'set_flag', flag: 'ch5_complete' },
      { type: 'end_chapter', next: 6 },
      { type: 'fade_out' }
    ],

    // ── 第6章「国境 ─ 谷川岳のトンネル」 ──────────────

    'ch6_opening': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第六章「国境 ─ 谷川岳のトンネル」──' },
      { type: 'set_phase', phase: 'ch6' },
      { type: 'narration', text: '谷川岳。群馬と新潟の県境。' },
      { type: 'narration', text: '結界が最も深い場所。国境のトンネルが待っている。' },
      { type: 'dialog', speaker: '主人公', text: 'ここまで来た。あとは...トンネルを越えるだけだ。' },
      { type: 'set_flag', flag: 'ch6_started' }
    ],

    'ch6_akagi_revival': [
      { type: 'set_bg', bg: 'akagi_shrine' },
      { type: 'fade_in' },
      { type: 'narration', text: '浄化の石を、アカギの石化した体に当てる。' },
      { type: 'pause', duration: 60 },
      { type: 'shake', duration: 40 },
      { type: 'play_sfx', sfx: 'victory' },
      { type: 'narration', text: '── ひびが入り、石の殻が砕けていく。' },
      { type: 'show_character', name: 'アカギ', position: 'center' },
      { type: 'dialog', speaker: 'アカギ', text: '...ぐっ...ここは...。' },
      { type: 'dialog', speaker: '主人公', text: 'アカギ！目が覚めたか！' },
      { type: 'dialog', speaker: 'アカギ', text: '...ああ。長い夢を見ていたような気がする。' },
      { type: 'dialog', speaker: 'アカギ', text: '...お前、一人でここまで来たのか。' },
      { type: 'dialog', speaker: '主人公', text: '当たり前だ。仲間だろ。' },
      { type: 'party_join', id: 'akagi', name: 'アカギ' },
      { type: 'set_flag', flag: 'akagi_revived' },
      { type: 'set_flag', flag: 'party_akagi_restored' },
      { type: 'legacy_card', cardId: 'akagi_revival', name: 'アカギの復活',
        description: '石の殻を破り、再び立ち上がった案内人。' },
      { type: 'hide_character', name: 'アカギ' }
    ],

    'ch6_kazekaeshi_village': [
      { type: 'set_bg', bg: 'village' },
      { type: 'fade_in' },
      { type: 'narration', text: '風返しの村。谷川岳の麓にある小さな集落。' },
      { type: 'narration', text: 'ここでは本名を名乗ると、存在が消されるという。' },
      { type: 'dialog', speaker: 'アカギ', text: '偽名を使え。本名は絶対に言うな。' },
      { type: 'dialog', speaker: '主人公', text: '...俺は本名を知らないから、逆に安全かもな。' },
      { type: 'dialog', speaker: 'アカギ', text: '...皮肉なものだ。' },
      { type: 'set_flag', flag: 'kazekaeshi_visited' },
      { type: 'set_flag', flag: 'return_name_event' }
    ],

    'ch6_echo_guardian_battle': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: 'トンネルの入口に、反響のように揺れる影が立っている。' },
      { type: 'dialog', speaker: '返声の番', text: '...お前の名前を、しばらく借りるぞ。' },
      { type: 'dialog', speaker: 'アカギ', text: '名前を奪う番人か。気をつけろ！' },
      { type: 'start_battle', enemy: 'echo_guardian' },
      { type: 'dialog', speaker: '返声の番', text: '...お前の名前は...結局、空っぽだった。' },
      { type: 'dialog', speaker: '主人公', text: '空っぽでも、俺は俺だ。' },
      { type: 'set_flag', flag: 'echo_guardian_defeated' },
      { type: 'give_item', item: 'echoBell' },
      { type: 'legacy_card', cardId: 'echo_bell', name: '反響の鈴',
        description: '返声の番が落とした鈴。' }
    ],

    'ch6_tunnel_entrance': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '国境のトンネル。暗闇が続く。' },
      { type: 'narration', text: '足音だけが反響する。' },
      { type: 'dialog', speaker: 'アカギ', text: '...この先は結界の最深部だ。' },
      { type: 'dialog', speaker: 'アカギ', text: '名前を捨てなければ、通れないかもしれない。' },
      { type: 'dialog', speaker: '主人公', text: '名前を捨てる...？' },
      { type: 'dialog', speaker: 'アカギ', text: '自分が何者かを忘れることで、結界をすり抜ける。' },
      { type: 'dialog', speaker: 'アカギ', text: '...危険な賭けだ。' },
      { type: 'set_flag', flag: 'tunnel_entered' },
      { type: 'set_flag', flag: 'border_tunnel' }
    ],

    'ch6_sato_kumako_tunnel': [
      { type: 'set_bg', bg: 'black' },
      { type: 'shake', duration: 30 },
      { type: 'narration', text: 'トンネルの奥で、佐藤が立ちはだかっている。' },
      { type: 'narration', text: '...その隣に、溶けかけた熊子の影。' },
      { type: 'show_character', name: '佐藤', position: 'left' },
      { type: 'show_character', name: '熊子', position: 'right' },
      { type: 'dialog', speaker: '佐藤', text: '来るな。俺はもう...戻れない。' },
      { type: 'dialog', speaker: '佐藤', text: '現実になんか帰りたくない。ここがいいんだ。' },
      { type: 'dialog', speaker: '熊子', text: '佐藤くんは私が守るわ。温かくしてあげる。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤...！目を覚ませ！' },
      { type: 'dialog', speaker: '佐藤', text: 'お前らの現実は...俺が絶対に守る！' },
      { type: 'start_battle', enemy: 'sato_kumako_tunnel' },
      { type: 'clear_characters' },
      { type: 'dialog', speaker: '佐藤', text: '...もうやめろ。分かった。分かったよ。' },
      { type: 'dialog', speaker: '佐藤', text: 'でも...俺のポケットにこれがある限り。' },
      { type: 'narration', text: '佐藤のポケットから、新宿行きの切符が落ちた。' },
      { type: 'give_item', item: 'shinjukuTicket' },
      { type: 'set_flag', flag: 'sato_kumako_tunnel_cleared' },
      { type: 'legacy_card', cardId: 'shinjuku_ticket', name: '現実の切符（新宿）',
        description: '現実は、まだ繋がっている。' },
      { type: 'dialog', speaker: '佐藤', text: '...先に行け。俺は...もう少しだけ、ここにいる。' },
      { type: 'dialog', speaker: '主人公', text: '待ってるからな。絶対に迎えに来る。' }
    ],

    'ch6_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第六章「国境 ─ 谷川岳のトンネル」 完 ──' },
      { type: 'narration', text: 'アカギの復活。国境のトンネル。' },
      { type: 'narration', text: '佐藤は「戻れない」と言った。' },
      { type: 'narration', text: 'だが新宿行きの切符が、現実への道を示している。' },
      { type: 'narration', text: '旅は、後半へと続く──' },
      { type: 'set_flag', flag: 'ch6_complete' },
      { type: 'end_chapter', next: 7 },
      { type: 'fade_out' }
    ],

    // ── 第7章「合流 ─ 山川の覚悟」 ──────────────────

    'ch7_opening': [
      { type: 'set_bg', bg: 'konuma' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第七章「合流 ─ 山川の覚悟」──' },
      { type: 'set_phase', phase: 'ch7' },
      { type: 'narration', text: '榛名湖は濃い霧に包まれていた。' },
      { type: 'dialog', speaker: 'アカギ', text: 'この霧、結界の澱みだな。' },
      { type: 'dialog', speaker: '？？？', text: '地図と地形が全く合わない…' },
      { type: 'dialog', speaker: '主人公', text: '山川！？無事だったのか！' },
      { type: 'show_character', name: '山川', position: 'center' },
      { type: 'dialog', speaker: '山川', text: 'お前か。記憶は戻ったのか？' },
      { type: 'dialog', speaker: '主人公', text: '自分の名前すらまだだ。' },
      { type: 'dialog', speaker: '山川', text: '俺もだ。助手席の記憶しかない。' },
      { type: 'set_flag', flag: 'ch7_started' },
      { type: 'set_flag', flag: 'yamakawa_found' }
    ],

    'ch7_mid1': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '榛名湖畔の道を進む。霧がさらに濃くなる。' },
      { type: 'dialog', speaker: '山川', text: '俺の地図じゃここは行き止まりだ。' },
      { type: 'dialog', speaker: 'アカギ', text: '土地の掟だ。道は作ればいい。' },
      { type: 'dialog', speaker: '山川', text: '相変わらず野蛮な理屈だ。' },
      { type: 'dialog', speaker: '主人公', text: 'でも、進むしかないんだ。' },
      { type: 'set_flag', flag: 'haruna_path_blocked' }
    ],

    'ch7_mid2': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '足元の景色がぐにゃりと歪む。' },
      { type: 'shake', duration: 25 },
      { type: 'dialog', speaker: 'アカギ', text: '気をつけろ、侵食が始まってる。' },
      { type: 'dialog', speaker: '山川', text: 'ただ見てるだけはもう終わりだ。' },
      { type: 'dialog', speaker: '山川', text: '俺も前線に立つ。覚悟は決めた。' },
      { type: 'set_flag', flag: 'yamakawa_resolve' },
      { type: 'legacy_card', cardId: 'yamakawa_map', name: '山川の古地図',
        description: '現実と結界の狭間で書き換わった地図。' }
    ],

    'ch7_boss_pre': [
      { type: 'set_bg', bg: 'konuma' },
      { type: 'fade_in' },
      { type: 'narration', text: '湖面から巨大な影が這い上がる。' },
      { type: 'shake', duration: 35 },
      { type: 'dialog', speaker: 'ジューク', text: '結界の底からのお出ましだぜ。' },
      { type: 'dialog', speaker: '主人公', text: '邪魔するなよ、ジューク！' },
      { type: 'dialog', speaker: '山川', text: '俺の解析で弱点を突く！行くぞ！' },
      { type: 'start_battle', enemy: 'haruna_lake_beast' },
      { type: 'set_flag', flag: 'haruna_beast_defeated' },
      { type: 'legacy_card', cardId: 'haruna_mist', name: '榛名の霧粒',
        description: '湖底から這い出た獣が残した結界の残滓。' }
    ],

    'ch7_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'dialog', speaker: '山川', text: 'なんとか退けたな。' },
      { type: 'dialog', speaker: 'アカギ', text: 'やるじゃないか、地図男。' },
      { type: 'dialog', speaker: '山川', text: 'フッ…これからは頼りにしてくれ。' },
      { type: 'narration', text: '山川が正式に戦闘に加わった！' },
      { type: 'party_join', id: 'yamakawa', name: '山川' },
      { type: 'narration', text: '── 第七章「合流 ─ 山川の覚悟」 完 ──' },
      { type: 'set_flag', flag: 'ch7_complete' },
      { type: 'set_flag', flag: 'party_yamakawa' },
      { type: 'end_chapter', next: 8 },
      { type: 'fade_out' }
    ],

    // ── 第8章「深層 ─ 結界の綻び」 ──────────────────

    'ch8_opening': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第八章「深層 ─ 結界の綻び」──' },
      { type: 'set_phase', phase: 'ch8' },
      { type: 'narration', text: '尾瀬の湿原は泥に沈みかけていた。' },
      { type: 'dialog', speaker: '山川', text: '結界の綻びがここにも…' },
      { type: 'dialog', speaker: '主人公', text: '侵食のスピードが上がってる。' },
      { type: 'set_flag', flag: 'ch8_started' },
      { type: 'set_flag', flag: 'oze_entered' }
    ],

    'ch8_mid1': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '湿原の木道が侵食で崩れかけている。' },
      { type: 'dialog', speaker: 'ジューク', text: '路線が繋がりかけてる証拠さ。' },
      { type: 'dialog', speaker: '主人公', text: 'どこへ繋がろうとしてるんだ？' },
      { type: 'dialog', speaker: 'ジューク', text: 'お前らの大事な現実ってやつだ。' },
      { type: 'set_flag', flag: 'rosen_revelation' }
    ],

    'ch8_mid2': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '結界の裂け目から冷たい風が吹き込む。' },
      { type: 'dialog', speaker: 'アカギ', text: 'この土地の記憶が流れ出すのか。' },
      { type: 'dialog', speaker: '山川', text: 'それは防がなきゃいけない。' },
      { type: 'dialog', speaker: '主人公', text: '急ごう、まだ間に合うはずだ。' },
      { type: 'set_flag', flag: 'memory_leak_aware' }
    ],

    'ch8_boss_pre': [
      { type: 'set_bg', bg: 'battle_field' },
      { type: 'fade_in' },
      { type: 'narration', text: '泥の中から異形が姿を現す。' },
      { type: 'shake', duration: 30 },
      { type: 'dialog', speaker: 'アカギ', text: '土地の記憶の成れの果てか。' },
      { type: 'dialog', speaker: '主人公', text: '倒して、結界を縫い止める！' },
      { type: 'start_battle', enemy: 'oze_mud_wraith' },
      { type: 'set_flag', flag: 'oze_wraith_defeated' },
      { type: 'legacy_card', cardId: 'oze_silt', name: '尾瀬の泥花',
        description: '泥から咲いた結界の記憶の花。' }
    ],

    'ch8_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'narration', text: '泥の中に沈むスマホを見つけた。' },
      { type: 'give_item', item: 'furuyaPhone' },
      { type: 'dialog', speaker: '山川', text: 'これは…古谷のものだ。' },
      { type: 'dialog', speaker: '主人公', text: '水上の方へ向かったのか。' },
      { type: 'dialog', speaker: 'アカギ', text: 'あいつ、一人で何を考えてる…' },
      { type: 'narration', text: '── 第八章「深層 ─ 結界の綻び」 完 ──' },
      { type: 'set_flag', flag: 'ch8_complete' },
      { type: 'set_flag', flag: 'furuya_phone_found' },
      { type: 'legacy_card', cardId: 'furuya_phone', name: '古谷の水没スマホ',
        description: '泥に沈んでいた古谷の痕跡。' },
      { type: 'end_chapter', next: 9 },
      { type: 'fade_out' }
    ],

    // ── 第9章「孤独 ─ 古谷の選択」 ──────────────────

    'ch9_opening': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 第九章「孤独 ─ 古谷の選択」──' },
      { type: 'set_phase', phase: 'ch9' },
      { type: 'narration', text: '水上の谷に冷たい風が吹く。' },
      { type: 'dialog', speaker: '主人公', text: '古谷！どこにいる！' },
      { type: 'dialog', speaker: '古谷', text: '…来るなと言ったはずだ。' },
      { type: 'narration', text: '岩陰から古谷が姿を現した。' },
      { type: 'show_character', name: '古谷', position: 'center' },
      { type: 'set_flag', flag: 'ch9_started' },
      { type: 'set_flag', flag: 'furuya_found' }
    ],

    'ch9_mid1': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'dialog', speaker: '山川', text: 'なぜ一人で結界の奥へ来た？' },
      { type: 'dialog', speaker: '古谷', text: '俺が一人で路線を断つためだ。' },
      { type: 'dialog', speaker: 'アカギ', text: '自己犠牲のつもりかよ。' },
      { type: 'dialog', speaker: '古谷', text: '俺みたいな奴が消えても...誰も困らない。' },
      { type: 'set_flag', flag: 'furuya_sacrifice_intent' }
    ],

    'ch9_mid2': [
      { type: 'set_bg', bg: 'forest' },
      { type: 'fade_in' },
      { type: 'dialog', speaker: '古谷', text: '俺の居場所はどこにもないんだ。' },
      { type: 'choice', speaker: '主人公', text: 'どうする？', choices: [
        { text: '一緒に記憶を探そう', flag: 'furuya_join_true' },
        { text: '無理には誘わない', flag: 'furuya_join_false' }
      ]},
      { type: 'set_flag', flag: 'furuya_choice_made' }
    ],

    'ch9_boss_pre': [
      { type: 'set_bg', bg: 'battle_field' },
      { type: 'fade_in' },
      { type: 'narration', text: '古谷の背後に黒い影が迫る！' },
      { type: 'shake', duration: 30 },
      { type: 'dialog', speaker: '主人公', text: '危ない、古谷！' },
      { type: 'dialog', speaker: '古谷', text: 'くそっ、囲まれたか！' },
      { type: 'dialog', speaker: 'ジューク', text: '掟の番人の恐さを教えてやるよ。' },
      { type: 'start_battle', enemy: 'juke_minakami' },
      { type: 'set_flag', flag: 'juke_minakami_defeated' },
      { type: 'legacy_card', cardId: 'juke_decree', name: 'ジュークの裁定書',
        description: '掟の番人が下した最後の判決。' }
    ],

    'ch9_ending': [
      { type: 'set_bg', bg: 'chapter_end' },
      { type: 'fade_in' },
      { type: 'dialog', speaker: '古谷', text: '…助かった。迷惑かけたな。' },
      { type: 'dialog', speaker: '主人公', text: '俺たちは仲間だろ。' },
      { type: 'dialog', speaker: '古谷', text: 'ああ、最後まで付き合うさ。' },
      { type: 'narration', text: '古谷が正式に戦闘に加わった！' },
      { type: 'party_join', id: 'furuya', name: '古谷' },
      { type: 'narration', text: '── 第九章「孤独 ─ 古谷の選択」 完 ──' },
      { type: 'set_flag', flag: 'ch9_complete' },
      { type: 'set_flag', flag: 'party_furuya' },
      { type: 'end_chapter', next: 10 },
      { type: 'fade_out' }
    ],

    // ── 第10章「帰還 ─ 名前を取り戻す旅」 ─────────────

    'ch10_opening': [
      { type: 'set_bg', bg: 'tunnel' },
      { type: 'fade_in' },
      { type: 'narration', text: '── 最終章「帰還 ─ 名前を取り戻す旅」──' },
      { type: 'set_phase', phase: 'ch10' },
      { type: 'narration', text: '国境の長いトンネルの入り口。' },
      { type: 'dialog', speaker: 'アカギ', text: 'この奥にすべてがあるんだな。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤を助け、名前を取り戻す。' },
      { type: 'set_flag', flag: 'ch10_started' },
      { type: 'set_flag', flag: 'final_tunnel_entered' }
    ],

    'ch10_mid1': [
      { type: 'set_bg', bg: 'tunnel' },
      { type: 'fade_in' },
      { type: 'narration', text: '暗闇の奥に、見覚えのある背中。' },
      { type: 'show_character', name: '佐藤', position: 'center' },
      { type: 'dialog', speaker: '主人公', text: '佐藤！無事だったか！' },
      { type: 'dialog', speaker: '佐藤', text: '…なぜ来た。路線が繋がるぞ。' },
      { type: 'dialog', speaker: '山川', text: '君を置いて帰れるわけないだろ。' },
      { type: 'set_flag', flag: 'sato_final_encounter' }
    ],

    'ch10_mid2': [
      { type: 'set_bg', bg: 'tunnel' },
      { type: 'fade_in' },
      { type: 'dialog', speaker: '佐藤', text: '俺の記憶が路線の核なんだ。' },
      { type: 'dialog', speaker: '古谷', text: 'お前一人に背負わせはしない。' },
      { type: 'dialog', speaker: '主人公', text: '全員で現実に帰るんだ！' },
      { type: 'dialog', speaker: '佐藤', text: '…お前ら、変わったな。' },
      { type: 'set_flag', flag: 'sato_core_revealed' }
    ],

    'ch10_boss_pre': [
      { type: 'set_bg', bg: 'battle_field' },
      { type: 'fade_in' },
      { type: 'narration', text: '結界の主が真の姿を現す。' },
      { type: 'shake', duration: 50 },
      { type: 'play_sfx', sfx: 'hit' },
      { type: 'dialog', speaker: 'ジューク', text: 'さあ、最後の掟を越えてみせろ！' },
      { type: 'dialog', speaker: '主人公', text: 'これが、俺たちの決着だ！' },
      { type: 'start_battle', enemy: 'juke_final' },
      { type: 'set_flag', flag: 'juke_final_defeated' },
      { type: 'legacy_card', cardId: 'juke_broken_rule', name: '砕けた掟の石版',
        description: '番人が守り続けた最後の掟。' },
      { type: 'route_ending' }
    ],

    'ch10_ending_A': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── Ending A「帰還」──' },
      { type: 'narration', text: 'トンネルの先に光が見える。' },
      { type: 'play_sfx', sfx: 'victory' },
      { type: 'dialog', speaker: '佐藤', text: 'さあ、お前たちの路線へ帰れ。' },
      { type: 'dialog', speaker: '主人公', text: 'ああ、思い出した。俺の名は…' },
      { type: 'dialog', speaker: '山川', text: 'ついに境界を越えるんだな。' },
      { type: 'dialog', speaker: 'アカギ', text: '達者でな、相棒！' },
      { type: 'narration', text: '未明の始発駅に、鐘が鳴る。' },
      { type: 'narration', text: '主人公は名前を取り戻し、現実に帰還した。' },
      { type: 'set_flag', flag: 'ending_A' },
      { type: 'legacy_card', cardId: 'dawn_bell', name: '始発の鐘',
        description: '名前を取り戻し、境界を越えた証。' },
      { type: 'narration', text: '── Fin. ──' },
      { type: 'fade_out' }
    ],

    'ch10_ending_B': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── Ending B「残留」──' },
      { type: 'narration', text: '切符は手の中で溶けてしまった。' },
      { type: 'dialog', speaker: '佐藤', text: 'お前も残る道を選んだか。' },
      { type: 'dialog', speaker: '主人公', text: 'この記憶を手放したくないんだ。' },
      { type: 'dialog', speaker: 'ジューク', text: '物好きめ。永遠にここで迷え。' },
      { type: 'narration', text: '溶け残った切符が風に舞う。' },
      { type: 'narration', text: '主人公は名前を思い出せないまま、この土地に留まった。' },
      { type: 'set_flag', flag: 'ending_B' },
      { type: 'legacy_card', cardId: 'melted_ticket', name: '溶けた切符',
        description: '帰れなかった者の記念。' },
      { type: 'narration', text: '── Fin. ──' },
      { type: 'fade_out' }
    ],

    'ch10_ending_C': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '── Ending C「反転」──' },
      { type: 'narration', text: 'トンネルを抜け、現実に帰還した。' },
      { type: 'play_sfx', sfx: 'victory' },
      { type: 'dialog', speaker: '古谷', text: 'やった…ついに脱出したぞ！' },
      { type: 'dialog', speaker: '主人公', text: '…待て。スマホの画面がおかしい。' },
      { type: 'shake', duration: 60 },
      { type: 'dialog', speaker: 'ジューク', text: '境界線が反転したのさ。' },
      { type: 'dialog', speaker: 'ジューク', text: '現実が、こっちを迎えに来た。' },
      { type: 'narration', text: 'おまえはグンマーからにげられない' },
      { type: 'pause', duration: 120 },
      { type: 'narration', text: '主人公は脱出したはずだった。だが...。' },
      { type: 'set_flag', flag: 'ending_C' },
      { type: 'legacy_card', cardId: 'inverted_border', name: '反転した境界線',
        description: '逃げられない。グンマーは永遠に。' },
      { type: 'narration', text: '── Fin. ──' },
      { type: 'narration', text: '── To be continued in GunmaEscape 2... ──' },
      { type: 'fade_out' }
    ]
  };

  // Helper: start a named chapter event
  function startChapterEvent(eventId, callback) {
    var ev = chapterEvents[eventId];
    if (ev) startEvent(ev, callback);
  }

  // Chapter 3 story scenes
  var ch3Scenes = {
    'ch3_foreshadow': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '...夢を見ている。' },
      { type: 'dialog', speaker: '主人公', text: 'ユウマさんに連れていかれた...？' },
      { type: 'dialog', speaker: '主人公', text: '佐藤の置き手紙にあった名前だ。' },
      { type: 'dialog', speaker: 'アカギ', text: 'ユウマは群馬の奥地に消えた人物だ。' },
      { type: 'dialog', speaker: 'アカギ', text: '谷川岳の向こう...新潟との県境に何かがある。' },
      { type: 'choice', speaker: 'アカギ', text: 'どうする？', choices: [
        { text: '調べに行く', goto: 8 },
        { text: '仲間を待つ', goto: 10 }
      ]},
      { type: 'dialog', speaker: '主人公', text: '行こう。真実を確かめなければ。' },
      { type: 'narration', text: '第三章へ続く...' },
      { type: 'dialog', speaker: '主人公', text: '...まずは仲間を集めよう。' },
      { type: 'narration', text: '第三章へ続く...' }
    ],
    'yuuma_clue_1': [
      { type: 'set_bg', bg: 'village_interior' },
      { type: 'dialog', speaker: '謎の商人', text: 'ユウマ？...ああ、あの男か。' },
      { type: 'dialog', speaker: '謎の商人', text: '三国峠を越えていったよ。もう何年も前の話だがね。' },
      { type: 'dialog', speaker: '謎の商人', text: '群馬と新潟の境...あそこには不思議な力が渦巻いている。' }
    ],
    'friend_flashback': [
      { type: 'set_bg', bg: 'black' },
      { type: 'fade_in' },
      { type: 'narration', text: '記憶が蘇る...' },
      { type: 'dialog', speaker: '主人公', text: '下北沢を出たあの日...4人で笑っていた。' },
      { type: 'dialog', speaker: '主人公', text: '佐藤は運転しながら歌っていた。フルヤはずっとスマホをいじっていた。' },
      { type: 'dialog', speaker: '主人公', text: '山川は助手席で地図を広げて...「群馬って何があるんだ？」' },
      { type: 'dialog', speaker: '主人公', text: '...全部、思い出せる。なのに自分の名前だけが...' },
      { type: 'fade_out' }
    ]
  };

  // Story progress flags
  function setFlag(flag) { storyFlags[flag] = true; }
  function hasFlag(flag) { return !!storyFlags[flag]; }
  function clearFlag(flag) { delete storyFlags[flag]; }
  // ── ED分岐ロジック ──
  // ch5: sato_rescue_determined (連れ帰る) / sato_will_respected (意志を尊重)
  // ch9: furuya_join_true (一緒に探す) / furuya_join_false (無理に誘わない)
  //
  // Ending A「帰還」: 両方ポジティブ（rescue + join）
  // Ending B「残留」: 佐藤の意志を尊重した場合
  // Ending C「反転」: それ以外（デフォルト＝真のED）
  function resolveEnding() {
    var rescueSato = hasFlag('sato_rescue_determined');
    var respectSato = hasFlag('sato_will_respected');
    var furuyaJoined = hasFlag('furuya_join_true');
    var furuyaAlone = hasFlag('furuya_join_false');

    // Ending A: 佐藤を連れ帰る意志 ＋ 古谷と共に探す
    if (rescueSato && furuyaJoined) {
      return 'ch10_ending_A';
    }
    // Ending B: 佐藤の意志を尊重した
    if (respectSato) {
      return 'ch10_ending_B';
    }
    // Ending C: デフォルト（反転エンド）
    return 'ch10_ending_C';
  }

  function getPhase() { return phase; }
  function setPhase(p) { phase = p; }
  function getChapter() { return chapter; }

  // Start a story event (array of steps)
  function startEvent(event, callback) {
    currentEvent = event;
    stepIndex = 0;
    waitingForInput = false;
    onEventEnd = callback || null;
    processStep();
  }

  // Queue an event to play after current
  function queueEvent(event, callback) {
    eventQueue.push({ event: event, callback: callback });
  }

  function processStep() {
    if (!currentEvent || stepIndex >= currentEvent.length) {
      endEvent();
      return;
    }

    var step = currentEvent[stepIndex];

    switch (step.type) {
      case 'dialog':
        currentSpeaker = step.speaker || '';
        currentText = '';
        typewriterText = step.text || '';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      case 'narration':
        currentSpeaker = '';
        currentText = '';
        typewriterText = step.text || '';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      case 'system':
        currentSpeaker = 'システム';
        currentText = '';
        typewriterText = step.text || '';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      case 'choice':
        choices = step.choices;
        choiceIndex = 0;
        currentSpeaker = step.speaker || '';
        currentText = step.text || '選んでください';
        typewriterText = '';
        typewriterIndex = 0;
        waitingForInput = true;
        break;

      case 'fade_out':
        fadeAlpha = 0;
        fadeDir = 1;
        bgColor = step.color || '#000';
        fadeCallback = function() {
          stepIndex++;
          processStep();
        };
        break;

      case 'fade_in':
        fadeAlpha = 1;
        fadeDir = -1;
        fadeCallback = function() {
          stepIndex++;
          processStep();
        };
        break;

      case 'set_bg':
        bgImage = step.bg || null;
        bgColor = step.color || '#000';
        stepIndex++;
        processStep();
        break;

      case 'show_character':
        characters.push({
          name: step.name,
          position: step.position || 'center', // left, center, right
          sprite: step.sprite || null,
          palette: step.palette || null
        });
        stepIndex++;
        processStep();
        break;

      case 'hide_character':
        characters = characters.filter(function(c) { return c.name !== step.name; });
        stepIndex++;
        processStep();
        break;

      case 'clear_characters':
        characters = [];
        stepIndex++;
        processStep();
        break;

      case 'shake':
        shakeTimer = step.duration || 30;
        stepIndex++;
        processStep();
        break;

      case 'pause':
        pauseTimer = step.duration || 60;
        break;

      case 'set_flag':
        setFlag(step.flag);
        stepIndex++;
        processStep();
        break;

      case 'check_flag':
        if (hasFlag(step.flag)) {
          stepIndex = step.gotoTrue || stepIndex + 1;
        } else {
          stepIndex = step.gotoFalse || stepIndex + 1;
        }
        processStep();
        break;

      case 'route_ending':
        // Determine ending based on accumulated flags
        var endingId = resolveEnding();
        var endingEvent = chapterEvents[endingId];
        if (endingEvent) {
          currentEvent = endingEvent;
          stepIndex = 0;
          processStep();
        } else {
          stepIndex++;
          processStep();
        }
        return;

      case 'start_quiz':
        // Trigger quiz puzzle from story event
        // Usage: { type: 'start_quiz', difficulty: 2, count: 3 }
        var quizDiff = step.difficulty || 1;
        var quizCount = step.count || 3;
        var afterQuiz = currentEvent.slice(stepIndex + 1);
        var afterQuizCallback = onEventEnd;
        endEvent();
        Game.Main.setState(Game.Config.STATE.PUZZLE);
        Game.Puzzle.start('quiz', null, { difficulty: quizDiff, count: quizCount });
        // Resume story after quiz ends (handled by main.js puzzle completion)
        onEventEnd = function() {
          if (afterQuiz.length > 0) {
            startEvent(afterQuiz, afterQuizCallback);
          } else if (afterQuizCallback) {
            afterQuizCallback();
          }
        };
        return;

      case 'give_item':
        Game.Player.addItem(step.item);
        currentSpeaker = 'システム';
        var itemDef = Game.Items.get(step.item);
        var itemName = itemDef ? itemDef.name : step.item;
        typewriterText = '「' + itemName + '」を手に入れた！';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        Game.Audio.playSfx('item');
        break;

      case 'heal':
        Game.Player.heal(step.amount || 9999);
        stepIndex++;
        processStep();
        break;

      case 'play_bgm':
        bgmOverride = step.bgm;
        Game.Audio.stopBgm();
        Game.Audio.playBgm(step.bgm);
        stepIndex++;
        processStep();
        break;

      case 'stop_bgm':
        Game.Audio.stopBgm();
        bgmOverride = null;
        stepIndex++;
        processStep();
        break;

      case 'play_sfx':
        Game.Audio.playSfx(step.sfx);
        stepIndex++;
        processStep();
        break;

      case 'battle':
        // Trigger a battle, return to story after
        stepIndex++;
        if (step.onVictory) {
          onEventEnd = function() {
            startEvent(step.onVictory);
          };
        }
        endEvent();
        Game.Main.setState(Game.Config.STATE.BATTLE);
        Game.Battle.start(step.enemy, step.npcRef || null);
        return;

      case 'start_battle':
        // Start battle and continue story after victory
        var battleEnemy = step.enemy;
        var afterBattle = currentEvent.slice(stepIndex + 1);
        var afterCallback = onEventEnd;
        currentEvent = null;
        Game.Main.startStoryBattle(battleEnemy, afterBattle, afterCallback);
        return;

      case 'load_map':
        Game.Map.load(step.map, step.x, step.y);
        stepIndex++;
        processStep();
        break;

      case 'set_phase':
        phase = step.phase;
        stepIndex++;
        processStep();
        break;

      case 'end_chapter':
        chapter = step.next || chapter + 1;
        // Play chapter-specific field BGM if available
        var chFieldBgm = chapterFieldBgm[chapter];
        if (chFieldBgm) {
          Game.Audio.stopBgm();
          Game.Audio.playBgm(chFieldBgm);
        }
        stepIndex++;
        processStep();
        break;

      case 'callback':
        if (step.fn) step.fn();
        stepIndex++;
        processStep();
        break;

      case 'legacy_card':
        // Show legacy card obtained
        currentSpeaker = 'レガシーカード';
        typewriterText = '【' + step.name + '】\n' + step.description;
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        if (Game.Legacy) Game.Legacy.unlock(step.cardId);
        Game.Audio.playSfx('item');
        break;

      case 'party_join':
        currentSpeaker = 'システム';
        typewriterText = step.name + 'が仲間に加わった！';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        setFlag('party_' + step.id);
        Game.Audio.playSfx('victory');
        break;

      case 'dice_tutorial':
        // Special dice rolling demo
        currentSpeaker = 'システム';
        typewriterText = step.text || 'ダイスを振ってみよう！（Zキーで振る）';
        typewriterIndex = 0;
        typewriterTimer = 0;
        waitingForInput = false;
        break;

      default:
        stepIndex++;
        processStep();
        break;
    }
  }

  function update() {
    // Handle fade
    if (fadeDir !== 0) {
      fadeAlpha += fadeDir * 0.03;
      if (fadeDir > 0 && fadeAlpha >= 1) {
        fadeAlpha = 1;
        fadeDir = 0;
        if (fadeCallback) { fadeCallback(); fadeCallback = null; }
      } else if (fadeDir < 0 && fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeDir = 0;
        if (fadeCallback) { fadeCallback(); fadeCallback = null; }
      }
      return; // Don't process input during fade
    }

    // Handle pause
    if (pauseTimer > 0) {
      pauseTimer--;
      if (pauseTimer <= 0) {
        stepIndex++;
        processStep();
      }
      return;
    }

    // Handle shake
    if (shakeTimer > 0) shakeTimer--;

    // Handle typewriter effect with variable speed
    if (typewriterText && typewriterIndex < typewriterText.length) {
      typewriterTimer++;
      // Variable speed: pause longer on punctuation
      var currentChar = typewriterText.charAt(typewriterIndex);
      var charSpeed = typewriterSpeed;
      if (currentChar === '。' || currentChar === '…' || currentChar === '！' || currentChar === '？') {
        charSpeed = typewriterSpeed + 8; // pause on punctuation
      } else if (currentChar === '、' || currentChar === ',') {
        charSpeed = typewriterSpeed + 4;
      } else if (currentChar === '*') {
        charSpeed = typewriterSpeed * 2; // dramatic text marker
      }
      if (typewriterTimer >= charSpeed) {
        typewriterTimer = 0;
        typewriterIndex++;
        currentText = typewriterText.substring(0, typewriterIndex);
      }

      // Skip typewriter with confirm
      if (Game.Input.isPressed('confirm')) {
        typewriterIndex = typewriterText.length;
        currentText = typewriterText;
      }
      return;
    }

    // Text fully displayed
    if (typewriterText && typewriterIndex >= typewriterText.length && !waitingForInput) {
      waitingForInput = true;
    }

    if (!currentEvent) return;

    var step = currentEvent[stepIndex];
    if (!step) { endEvent(); return; }

    // Handle choices
    if (step.type === 'choice' && choices) {
      if (Game.Input.isPressed('up')) {
        choiceIndex = (choiceIndex - 1 + choices.length) % choices.length;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('down')) {
        choiceIndex = (choiceIndex + 1) % choices.length;
        Game.Audio.playSfx('confirm');
      }
      if (Game.Input.isPressed('confirm')) {
        Game.Audio.playSfx('confirm');
        var chosen = choices[choiceIndex];
        choices = null;
        // Set flag if the choice defines one
        if (chosen.flag) {
          setFlag(chosen.flag);
          saveFlags();
        }
        if (chosen.goto !== undefined) {
          stepIndex = chosen.goto;
        } else {
          stepIndex++;
        }
        processStep();
        return;
      }
      return;
    }

    // Advance on confirm
    if (waitingForInput && Game.Input.isPressed('confirm')) {
      Game.Audio.playSfx('confirm');
      waitingForInput = false;
      typewriterText = '';
      typewriterIndex = 0;
      currentText = '';
      stepIndex++;
      processStep();
    }
  }

  function endEvent() {
    currentEvent = null;
    stepIndex = 0;
    waitingForInput = false;
    currentSpeaker = '';
    currentText = '';
    typewriterText = '';
    choices = null;
    characters = [];

    var cb = onEventEnd;
    onEventEnd = null;

    if (cb) {
      cb();
    } else if (eventQueue.length > 0) {
      var next = eventQueue.shift();
      startEvent(next.event, next.callback);
    } else {
      Game.Main.setState(Game.Config.STATE.EXPLORING);
    }
  }

  function draw() {
    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();
    var shakeOff = shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;

    // Draw background scene
    ctx.save();
    if (shakeTimer > 0) ctx.translate(shakeOff, shakeOff * 0.5);

    if (bgImage) {
      drawSceneBg(R, C, bgImage);
    }

    // Draw characters on scene
    for (var i = 0; i < characters.length; i++) {
      drawCharacterOnScene(R, C, characters[i]);
    }

    ctx.restore();

    // Draw character portrait if speaker has one
    if (currentSpeaker && portraits[currentSpeaker]) {
      drawPortrait(R, C, currentSpeaker);
    }

    // Draw dialog box if we have text
    if (currentText || (choices && choices.length > 0)) {
      drawStoryDialog(R, C);
    }

    // Draw fade overlay
    if (fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + fadeAlpha + ')';
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    }
  }

  function drawPortrait(R, C, speaker) {
    var p = portraits[speaker];
    if (!p) return;
    var px = 12, py = C.CANVAS_HEIGHT - 100 - 70;
    // Portrait frame
    R.drawRectAbsolute(px - 2, py - 2, 68, 68, '#888');
    R.drawRectAbsolute(px, py, 64, 64, p.color);
    // Accent rectangle (face area)
    R.drawRectAbsolute(px + 16, py + 12, 32, 24, p.accent);
    // Label
    R.drawTextJP(p.label, px + 20, py + 40, '#fff', 16);
    // Name below portrait
    R.drawTextJP(speaker, px, py + 66, '#ccc', 9);
  }

  function drawSceneBg(R, C, scene) {
    var ctx = R.getContext();
    switch (scene) {
      case 'forest':
        // Dark misty forest
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a0a');
        // Ground
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#1a2e1a');
        // Trees
        for (var i = 0; i < 8; i++) {
          var tx = i * 65 + 10;
          ctx.fillStyle = '#0d2a0d';
          ctx.fillRect(tx + 15, 80, 20, 120);
          ctx.fillStyle = '#1a3a1a';
          ctx.beginPath();
          ctx.moveTo(tx, 140);
          ctx.lineTo(tx + 25, 40);
          ctx.lineTo(tx + 50, 140);
          ctx.fill();
          ctx.fillStyle = '#153015';
          ctx.beginPath();
          ctx.moveTo(tx + 5, 110);
          ctx.lineTo(tx + 25, 20);
          ctx.lineTo(tx + 45, 110);
          ctx.fill();
        }
        // Fog
        ctx.fillStyle = 'rgba(180,200,180,0.15)';
        var fogT = Date.now() / 2000;
        for (var f = 0; f < 5; f++) {
          var fx = Math.sin(fogT + f * 1.5) * 60 + f * 100;
          ctx.fillRect(fx, 130 + f * 15, 150, 30);
        }
        break;

      case 'village':
        // Tamura Village
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a2844');
        // Sky gradient
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, 120, '#2a3854');
        // Ground
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#3a5a2a');
        // Path
        R.drawRectAbsolute(200, 180, 80, 140, '#8a7a5a');
        // Houses
        drawHouse(ctx, 30, 120, '#5a4a3a');
        drawHouse(ctx, 140, 130, '#4a3a2a');
        drawHouse(ctx, 320, 125, '#5a4a3a');
        drawHouse(ctx, 400, 135, '#4a3a2a');
        break;

      case 'village_interior':
        // Inside a building
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#2a1a0a');
        // Floor
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#5a4a3a');
        // Walls
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, 200, '#3a2a1a');
        // Wall line
        R.drawRectAbsolute(0, 195, C.CANVAS_WIDTH, 5, '#4a3a2a');
        // Scroll on wall (掛け軸)
        R.drawRectAbsolute(220, 30, 40, 100, '#f0e8d0');
        R.drawRectAbsolute(225, 35, 30, 90, '#e8d8c0');
        R.drawTextJP('国定', 228, 50, '#333', 12);
        R.drawTextJP('忠治', 228, 70, '#333', 12);
        break;

      case 'konuma':
        // Small lake area with fog
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a2a');
        // Water
        R.drawRectAbsolute(0, 160, C.CANVAS_WIDTH, 160, '#1a3a5a');
        // Shore
        R.drawRectAbsolute(0, 150, C.CANVAS_WIDTH, 20, '#3a4a2a');
        // Fog
        ctx.fillStyle = 'rgba(150,170,190,0.2)';
        for (var f = 0; f < 4; f++) {
          ctx.fillRect(f * 130, 100 + f * 20, 200, 40);
        }
        break;

      case 'onuma':
        // Large lake, more ominous
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a0a1a');
        R.drawRectAbsolute(0, 140, C.CANVAS_WIDTH, 180, '#1a2a4a');
        R.drawRectAbsolute(0, 130, C.CANVAS_WIDTH, 20, '#2a3a2a');
        // Wagon silhouette
        R.drawRectAbsolute(180, 100, 60, 35, '#2a2a2a');
        R.drawRectAbsolute(175, 120, 70, 15, '#1a1a1a');
        // Wheels
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(190, 138, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(230, 138, 8, 0, Math.PI * 2); ctx.fill();
        break;

      case 'akagi_ranch':
        // Misty ruins
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a1a2a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#2a2a1a');
        // Ruined buildings
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(100, 100, 80, 80);
        ctx.fillRect(300, 110, 60, 70);
        // Broken roof
        ctx.fillStyle = '#3a2a2a';
        ctx.beginPath();
        ctx.moveTo(90, 100); ctx.lineTo(140, 60); ctx.lineTo(190, 100);
        ctx.fill();
        // Heavy fog
        ctx.fillStyle = 'rgba(150,150,170,0.25)';
        for (var f = 0; f < 6; f++) {
          var fx2 = Math.sin(Date.now() / 3000 + f) * 40 + f * 80;
          ctx.fillRect(fx2, 80 + f * 20, 180, 35);
        }
        break;

      case 'akagi_shrine':
        // Shrine at lake
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a1a2a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#1a3a5a');
        R.drawRectAbsolute(0, 170, C.CANVAS_WIDTH, 15, '#3a5a3a');
        // Torii gate
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(200, 60, 8, 110);
        ctx.fillRect(272, 60, 8, 110);
        ctx.fillRect(195, 55, 90, 8);
        ctx.fillRect(198, 75, 84, 6);
        // Shrine building
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(210, 90, 60, 80);
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.moveTo(200, 90); ctx.lineTo(240, 50); ctx.lineTo(280, 90);
        ctx.fill();
        break;

      case 'battle_field':
        // Generic battle area
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111122');
        // Grid
        ctx.strokeStyle = '#222244';
        ctx.lineWidth = 1;
        for (var gi = 0; gi < C.CANVAS_WIDTH; gi += 32) {
          ctx.beginPath(); ctx.moveTo(gi, 0); ctx.lineTo(gi, C.CANVAS_HEIGHT); ctx.stroke();
        }
        for (var gj = 0; gj < C.CANVAS_HEIGHT; gj += 32) {
          ctx.beginPath(); ctx.moveTo(0, gj); ctx.lineTo(C.CANVAS_WIDTH, gj); ctx.stroke();
        }
        break;

      case 'black':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#000');
        break;

      case 'chapter_end':
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#0a0a1a');
        break;

      case 'gakuen':
        // School interior (ch5)
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#2a2a3a');
        R.drawRectAbsolute(0, 200, C.CANVAS_WIDTH, 120, '#4a4a3a');
        // Desks
        for (var d = 0; d < 4; d++) {
          ctx.fillStyle = '#5a4a3a';
          ctx.fillRect(60 + d * 100, 140, 60, 30);
          ctx.fillStyle = '#4a3a2a';
          ctx.fillRect(70 + d * 100, 170, 10, 30);
          ctx.fillRect(110 + d * 100, 170, 10, 30);
        }
        // Blackboard
        R.drawRectAbsolute(100, 20, 280, 100, '#2a4a2a');
        R.drawRectAbsolute(105, 25, 270, 90, '#1a3a1a');
        R.drawTextJP('上毛学園', 190, 60, '#aaccaa', 14);
        break;

      case 'tunnel':
        // Dark tunnel (ch6)
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#050508');
        // Tunnel walls
        ctx.fillStyle = '#1a1a22';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(120, 80); ctx.lineTo(120, 240); ctx.lineTo(0, 320);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(480, 0); ctx.lineTo(360, 80); ctx.lineTo(360, 240); ctx.lineTo(480, 320);
        ctx.fill();
        // Rails
        R.drawRectAbsolute(140, 260, 200, 3, '#333');
        R.drawRectAbsolute(140, 275, 200, 3, '#333');
        // Faint light at end
        ctx.fillStyle = 'rgba(180,200,220,0.08)';
        ctx.beginPath();
        ctx.arc(240, 160, 40, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'shirane':
        // Mt Shirane volcanic area (ch4)
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#1a1a0a');
        R.drawRectAbsolute(0, 180, C.CANVAS_WIDTH, 140, '#3a3a1a');
        // Sulfur vents
        for (var v = 0; v < 5; v++) {
          var vx = 40 + v * 95;
          ctx.fillStyle = '#4a4a1a';
          ctx.fillRect(vx, 165, 20, 15);
          ctx.fillStyle = 'rgba(220,220,100,0.15)';
          var st = Date.now() / 1500 + v;
          ctx.fillRect(vx - 10, 100 + Math.sin(st) * 20, 40, 60);
        }
        break;

      default:
        R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, bgColor || '#000');
        break;
    }
  }

  function drawHouse(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 60, 50);
    // Roof
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 30, y - 30);
    ctx.lineTo(x + 65, y);
    ctx.fill();
    // Door
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x + 22, y + 25, 16, 25);
    // Window
    ctx.fillStyle = '#8a8a2a';
    ctx.fillRect(x + 8, y + 12, 12, 10);
    ctx.fillRect(x + 40, y + 12, 12, 10);
  }

  function drawCharacterOnScene(R, C, char) {
    var x;
    switch (char.position) {
      case 'left': x = 80; break;
      case 'right': x = 320; break;
      default: x = 200; break;
    }
    if (char.sprite && char.palette) {
      R.drawSpriteAbsolute(char.sprite, x, 80, char.palette, 5);
    }
  }

  function drawStoryDialog(R, C) {
    // Full-width dialog box at bottom
    var boxH = 90;
    var boxY = C.CANVAS_HEIGHT - boxH - 5;
    R.drawDialogBox(10, boxY, C.CANVAS_WIDTH - 20, boxH);

    // Speaker name box
    if (currentSpeaker) {
      var nameWidth = Math.max(80, currentSpeaker.length * 14 + 20);
      R.drawDialogBox(10, boxY - 22, nameWidth, 24);
      var nameColor = C.COLORS.GOLD;
      if (currentSpeaker === 'システム') nameColor = '#88aaff';
      R.drawTextJP(currentSpeaker, 20, boxY - 18, nameColor, 13);
    }

    // Dialog text with word wrap
    if (currentText) {
      var maxChars = 26;
      var lines = [];
      var textParts = currentText.split('\n');
      for (var p = 0; p < textParts.length; p++) {
        var remaining = textParts[p];
        while (remaining.length > 0) {
          if (remaining.length <= maxChars) {
            lines.push(remaining);
            break;
          }
          lines.push(remaining.substring(0, maxChars));
          remaining = remaining.substring(maxChars);
        }
      }
      for (var i = 0; i < lines.length && i < 4; i++) {
        R.drawTextJP(lines[i], 25, boxY + 10 + i * 18, '#fff', 13);
      }
    }

    // Choices
    if (choices && choices.length > 0) {
      var choiceBoxW = 200;
      var choiceBoxH = choices.length * 28 + 10;
      var choiceBoxX = C.CANVAS_WIDTH - choiceBoxW - 20;
      var choiceBoxY = boxY - choiceBoxH - 5;
      R.drawDialogBox(choiceBoxX, choiceBoxY, choiceBoxW, choiceBoxH);
      for (var c = 0; c < choices.length; c++) {
        var color = (c === choiceIndex) ? C.COLORS.GOLD : '#fff';
        var prefix = (c === choiceIndex) ? '▶ ' : '  ';
        R.drawTextJP(prefix + choices[c].text, choiceBoxX + 15, choiceBoxY + 8 + c * 28, color, 13);
      }
    }

    // Advance indicator (blinking triangle)
    if (waitingForInput && !choices) {
      var blink = Math.floor(Date.now() / 400) % 2;
      if (blink === 0) {
        R.drawTextJP('▼', C.CANVAS_WIDTH - 35, C.CANVAS_HEIGHT - 20, '#fff', 12);
      }
    }
  }

  function isActive() {
    return currentEvent !== null;
  }

  function getBgImage() {
    return bgImage;
  }

  function reset() {
    currentEvent = null;
    stepIndex = 0;
    waitingForInput = false;
    currentSpeaker = '';
    currentText = '';
    storyFlags = {};
    chapter = 1;
    phase = '';
    journeyState = createJourneyState();
    eventQueue = [];
    onEventEnd = null;
    choices = null;
    bgImage = null;
    characters = [];
    fadeAlpha = 0;
    fadeDir = 0;
    shakeTimer = 0;
    typewriterText = '';
    typewriterIndex = 0;
    pauseTimer = 0;
  }

  // Start a named Ch3 scene
  function startCh3Scene(sceneId, callback) {
    var scene = ch3Scenes[sceneId];
    if (scene) startEvent(scene, callback);
  }

  // Save/load story flags to localStorage
  function saveFlags() {
    try {
      localStorage.setItem('gunmaEscape_storyFlags', JSON.stringify(storyFlags));
    } catch (e) {}
    saveJourneyState();
  }

  function loadFlags() {
    try {
      var saved = localStorage.getItem('gunmaEscape_storyFlags');
      if (saved) storyFlags = JSON.parse(saved);
    } catch (e) {}
    loadJourneyState();
  }

  function exportFlags() {
    return JSON.parse(JSON.stringify(storyFlags || {}));
  }

  function importFlags(flags) {
    storyFlags = JSON.parse(JSON.stringify(flags || {}));
    saveFlags();
  }

  function saveJourneyState() {
    try {
      localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeyState));
    } catch (e) {}
  }

  function loadJourneyState() {
    try {
      var saved = localStorage.getItem(JOURNEY_STORAGE_KEY);
      journeyState = saved ? normalizeJourneyState(JSON.parse(saved)) : createJourneyState();
    } catch (e) {
      journeyState = createJourneyState();
    }
  }

  function getJourneyState() {
    return journeyState;
  }

  function exportJourneyState() {
    return normalizeJourneyState(journeyState);
  }

  function importJourneyState(state) {
    journeyState = normalizeJourneyState(state);
    saveJourneyState();
  }

  function setRespectGauge(value) {
    journeyState.respectGauge = Math.max(0, Math.round(value || 0));
    saveJourneyState();
    return journeyState.respectGauge;
  }

  function addRespect(amount) {
    return setRespectGauge(journeyState.respectGauge + (amount || 0));
  }

  function registerCatalyst(itemId) {
    if (!itemId || journeyState.catalysts.indexOf(itemId) >= 0) return false;
    journeyState.catalysts.push(itemId);
    saveJourneyState();
    return true;
  }

  function hasCatalyst(itemId) {
    return journeyState.catalysts.indexOf(itemId) >= 0;
  }

  return {
    startEvent: startEvent,
    queueEvent: queueEvent,
    update: update,
    draw: draw,
    isActive: isActive,
    setFlag: setFlag,
    hasFlag: hasFlag,
    clearFlag: clearFlag,
    getPhase: getPhase,
    setPhase: setPhase,
    getChapter: getChapter,
    getBgImage: getBgImage,
    reset: reset,
    startCh3Scene: startCh3Scene,
    startChapterEvent: startChapterEvent,
    getChapterEvents: function() { return chapterEvents; },
    saveFlags: saveFlags,
    loadFlags: loadFlags,
    getFlags: exportFlags,
    exportFlags: exportFlags,
    importFlags: importFlags,
    getJourneyState: getJourneyState,
    exportJourneyState: exportJourneyState,
    importJourneyState: importJourneyState,
    setRespectGauge: setRespectGauge,
    addRespect: addRespect,
    registerCatalyst: registerCatalyst,
    hasCatalyst: hasCatalyst,
    resolveEnding: resolveEnding
  };
})();
