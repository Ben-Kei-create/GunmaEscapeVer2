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
  }

  function loadFlags() {
    try {
      var saved = localStorage.getItem('gunmaEscape_storyFlags');
      if (saved) storyFlags = JSON.parse(saved);
    } catch (e) {}
  }

  function exportFlags() {
    return JSON.parse(JSON.stringify(storyFlags || {}));
  }

  function importFlags(flags) {
    storyFlags = JSON.parse(JSON.stringify(flags || {}));
    saveFlags();
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
    exportFlags: exportFlags,
    importFlags: importFlags
  };
})();
