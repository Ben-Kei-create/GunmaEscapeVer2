// Puzzle system
Game.Puzzle = (function() {
  var active = false;
  var type = ''; // 'daruma' or 'quiz'
  var npcRef = null;
  var result = null;

  // Daruma stacking
  var daruma = {
    stack: [],
    current: { x: 240, falling: true },
    targetHeight: 5,
    speed: 3,
    direction: 1,
    dropTimer: 0,
    phase: 'moving', // moving, dropping, success, fail
    lives: 3
  };

  // Quiz
  var quiz = {
    questions: [
      {
        q: '群馬県の形は何に似ている？',
        choices: ['鶴', '亀', '犬'],
        answer: 0
      },
      {
        q: 'こんにゃくの生産量日本一は？',
        choices: ['群馬県', '栃木県', '埼玉県'],
        answer: 0
      },
      {
        q: '草津温泉の湯畑で有名な「湯もみ」で使う道具は？',
        choices: ['板', 'バケツ', '竹'],
        answer: 0
      },
      {
        q: '高崎市は何の生産で日本一？',
        choices: ['だるま', '招き猫', 'こけし'],
        answer: 0
      },
      {
        q: '群馬県の県庁所在地は？',
        choices: ['高崎市', '前橋市', '太田市'],
        answer: 1
      },
      {
        q: '群馬県の「上毛三山」に含まれないのは？',
        choices: ['赤城山', '浅間山', '榛名山'],
        answer: 1
      },
      {
        q: '富岡製糸場が世界遺産に登録された年は？',
        choices: ['2010年', '2014年', '2018年'],
        answer: 1
      },
      {
        q: '群馬県の名物「焼きまんじゅう」のタレは何味？',
        choices: ['醤油', '味噌', '塩'],
        answer: 1
      },
      {
        q: '「上毛かるた」は全部で何枚？',
        choices: ['44枚', '48枚', '52枚'],
        answer: 0
      },
      {
        q: '草津温泉の「湯もみ」で使う板の長さは約？',
        choices: ['約30cm', '約180cm', '約300cm'],
        answer: 1
      },
      {
        q: '群馬県の県の花は？',
        choices: ['サクラ', 'レンゲツツジ', 'ヒマワリ'],
        answer: 1
      },
      {
        q: '国定忠治が処刑された場所は？',
        choices: ['大戸の関所', '碓氷峠', '草津温泉'],
        answer: 0
      },
      {
        q: '伊香保温泉の石段は何段？',
        choices: ['265段', '365段', '465段'],
        answer: 1
      },
      {
        q: '群馬弁で「なげる」の意味は？',
        choices: ['投げる', '捨てる', '走る'],
        answer: 1
      },
      {
        q: '赤城山の山頂にある湖の名前は？',
        choices: ['大沼', '中禅寺湖', '榛名湖'],
        answer: 0
      },
      // ── 上毛かるたクイズ（難易度1: 易） ──
      {
        q: '「つる舞う形の群馬県」の「つる」とは？',
        choices: ['鶴', '蔓', '弦'],
        answer: 0, difficulty: 1, karuta: 'つ'
      },
      {
        q: '「ねぎとこんにゃく下仁田宿」で有名なのは何ねぎ？',
        choices: ['下仁田ねぎ', '深谷ねぎ', '九条ねぎ'],
        answer: 0, difficulty: 1, karuta: 'ね'
      },
      {
        q: '「草津よいとこ薬の温泉」の「草津」は何と読む？',
        choices: ['くさつ', 'くさづ', 'そうしん'],
        answer: 0, difficulty: 1, karuta: 'く'
      },
      {
        q: '「紅葉に映える妙義山」の妙義山の特徴は？',
        choices: ['奇岩怪石', '日本一高い', '一年中雪'],
        answer: 0, difficulty: 1, karuta: 'も'
      },
      {
        q: '「裾野は長し赤城山」の赤城山にある湖は？',
        choices: ['大沼', '芦ノ湖', '中禅寺湖'],
        answer: 0, difficulty: 1, karuta: 'す'
      },
      {
        q: '「登る榛名のキャンプ村」の「榛名」は何山？',
        choices: ['榛名山', '浅間山', '谷川岳'],
        answer: 0, difficulty: 1, karuta: 'の'
      },
      {
        q: '「伊香保温泉日本の名湯」のシンボルは？',
        choices: ['石段街', '大鳥居', '砂風呂'],
        answer: 0, difficulty: 1, karuta: 'い'
      },
      {
        q: '「世のちり洗う四万温泉」の四万温泉は何県？',
        choices: ['群馬県', '長野県', '新潟県'],
        answer: 0, difficulty: 1, karuta: 'よ'
      },
      {
        q: '「雷とからっ風義理人情」の「からっ風」とは？',
        choices: ['強い冬の風', '夏の通り雨', '春の突風'],
        answer: 0, difficulty: 1, karuta: 'ら'
      },
      {
        q: '「力あわせる二百万」の二百万は何の数？',
        choices: ['群馬県の人口', '温泉の数', '山の数'],
        answer: 0, difficulty: 1, karuta: 'ち'
      },
      // ── 上毛かるたクイズ（難易度2: 中） ──
      {
        q: '「浅間のいたずら鬼の押出し」はどうやってできた？',
        choices: ['火山の溶岩', '隕石の落下', '大地震の亀裂'],
        answer: 0, difficulty: 2, karuta: 'あ'
      },
      {
        q: '「関東と信越つなぐ高崎市」高崎市の名物は？',
        choices: ['だるま', 'こけし', '赤べこ'],
        answer: 0, difficulty: 2, karuta: 'か'
      },
      {
        q: '「桐生は日本の機どころ」桐生市で盛んなのは？',
        choices: ['織物', '陶器', '刃物'],
        answer: 0, difficulty: 2, karuta: 'き'
      },
      {
        q: '「銘仙織り出す伊勢崎市」伊勢崎銘仙とは？',
        choices: ['絹織物', '陶磁器', '郷土玩具'],
        answer: 0, difficulty: 2, karuta: 'め'
      },
      {
        q: '「縁起だるまの少林山」少林山達磨寺がある市は？',
        choices: ['高崎市', '前橋市', '太田市'],
        answer: 0, difficulty: 2, karuta: 'え'
      },
      {
        q: '「和算の大家関孝和」和算とは何のこと？',
        choices: ['日本独自の数学', '日本独自の暦', '日本独自の占い'],
        answer: 0, difficulty: 2, karuta: 'わ'
      },
      {
        q: '「滝は吹割片品渓谷」吹割の滝の別名は？',
        choices: ['東洋のナイアガラ', '東洋のビクトリア', '東洋のイグアス'],
        answer: 0, difficulty: 2, karuta: 'た'
      },
      {
        q: '「中仙道しのぶ安中杉並木」安中杉並木を植えたのは？',
        choices: ['松平勝男', '徳川家康', '上杉謙信'],
        answer: 0, difficulty: 2, karuta: 'な'
      },
      {
        q: '「耶馬渓しのぐ吾妻峡」吾妻峡は何が美しい？',
        choices: ['紅葉と渓谷美', '夜景', '砂浜'],
        answer: 0, difficulty: 2, karuta: 'や'
      },
      {
        q: '「県都前橋生糸の市」前橋市は何の県都？',
        choices: ['群馬県', '埼玉県', '栃木県'],
        answer: 0, difficulty: 2, karuta: 'け'
      },
      // ── 上毛かるたクイズ（難易度3: 難） ──
      {
        q: '「ゆかりは古し貫前神社」の珍しい参拝方法は？',
        choices: ['石段を下る', '石段を後ろ向きに', '石段を這って'],
        answer: 0, difficulty: 3, karuta: 'ゆ'
      },
      {
        q: '「三波石と共に名高い冬桜」冬桜の名所は？',
        choices: ['桜山公園', '敷島公園', '華蔵寺公園'],
        answer: 0, difficulty: 3, karuta: 'さ'
      },
      {
        q: '「老農船津伝次平」船津伝次平は何に貢献した？',
        choices: ['農業指導', '養蚕業', '温泉の開拓'],
        answer: 0, difficulty: 3, karuta: 'ろ'
      },
      {
        q: '「日本で最初の富岡製糸」富岡製糸場は何の工場？',
        choices: ['生糸', '鉄鋼', '紡績'],
        answer: 0, difficulty: 3, karuta: 'に'
      },
      {
        q: '「誇る文豪田山花袋」田山花袋の代表作は？',
        choices: ['蒲団', '吾輩は猫である', '雪国'],
        answer: 0, difficulty: 3, karuta: 'ほ'
      },
      {
        q: '「平和の使徒新島襄」新島襄が創立した大学は？',
        choices: ['同志社大学', '早稲田大学', '慶應義塾大学'],
        answer: 0, difficulty: 3, karuta: 'へ'
      },
      {
        q: '「心の燈台内村鑑三」内村鑑三の有名な思想は？',
        choices: ['無教会主義', '武士道', '脱亜入欧'],
        answer: 0, difficulty: 3, karuta: 'こ'
      },
      {
        q: '「そろいの仕度で八木節音頭」の伴奏で使う樽は？',
        choices: ['空樽', '酒樽', '味噌樽'],
        answer: 0, difficulty: 3, karuta: 'そ'
      },
      {
        q: '「白衣観音慈悲の御手」白衣大観音がある山は？',
        choices: ['観音山', '赤城山', '妙義山'],
        answer: 0, difficulty: 3, karuta: 'ひ'
      },
      {
        q: '「昔を語る多胡の古碑」多胡碑は何と呼ばれる？',
        choices: ['上野三碑', '日本三古碑', '関東三碑'],
        answer: 0, difficulty: 3, karuta: 'む'
      }
    ],
    currentQ: 0,
    selectedQuestions: [],
    score: 0,
    selectedChoice: 0,
    phase: 'question', // question, correct, wrong, success, fail
    messageTimer: 0
  };

  // Karuta matching
  var karuta = {
    templates: [
      { id: 'tsu', kana: 'つ', text: '鶴舞う形の群馬県', color: '#cc4444' },
      { id: 'chi', kana: 'ち', text: '力あわせる二百万', color: '#4477cc' },
      { id: 're', kana: 'れ', text: '歴史に名高い新田義貞', color: '#44aa55' },
      { id: 'su', kana: 'す', text: '裾野は長し赤城山', color: '#8855cc' },
      { id: 'yu', kana: 'ゆ', text: 'ゆかりは古し貫前神社', color: '#ccaa33' }
    ],
    cards: [],
    selectedIndex: 0,
    firstCard: null,
    secondCard: null,
    mismatchTimer: 0,
    failedAttempts: 0,
    clearedPairs: 0,
    phase: 'playing',
    pendingFail: false,
    resultTimer: 0
  };

  // Rhythm game
  var rhythm = {
    pattern: [0, 1, 2, 1, 0, 2, 1, 0, 2, 2, 1, 0, 1, 2, 0, 1],
    notes: [],
    frame: 0,
    score: 0,
    phase: 'playing',
    resultTimer: 0,
    judgeText: '',
    judgeTimer: 0,
    hitZoneY: 255,
    noteSpeed: 4,
    laneX: [140, 240, 340]
  };

  function start(puzzleType, npc) {
    active = true;
    type = puzzleType;
    npcRef = npc;
    result = null;

    if (type === 'daruma') {
      daruma.stack = [];
      daruma.current = { x: 240, falling: false };
      daruma.speed = 2;
      daruma.direction = 1;
      daruma.phase = 'moving';
      daruma.lives = 3;
    } else if (type === 'quiz') {
      // Pick 3 random questions
      var shuffled = quiz.questions.slice().sort(function() { return Math.random() - 0.5; });
      quiz.selectedQuestions = shuffled.slice(0, 3);
      quiz.currentQ = 0;
      quiz.score = 0;
      quiz.selectedChoice = 0;
      quiz.phase = 'question';
      quiz.messageTimer = 0;
    } else if (type === 'karuta') {
      initKaruta();
    } else if (type === 'rhythm') {
      initRhythm();
    }
  }

  function update() {
    if (!active) return null;

    if (type === 'daruma') return updateDaruma();
    if (type === 'quiz') return updateQuiz();
    if (type === 'karuta') return updateKaruta();
    if (type === 'rhythm') return updateRhythm();
    return null;
  }

  function updateDaruma() {
    switch (daruma.phase) {
      case 'moving':
        daruma.current.x += daruma.speed * daruma.direction;
        if (daruma.current.x > 400) daruma.direction = -1;
        if (daruma.current.x < 80) daruma.direction = 1;

        if (Game.Input.isPressed('confirm')) {
          daruma.phase = 'dropping';
          daruma.dropTimer = 0;
          Game.Audio.playSfx('confirm');
        }
        break;

      case 'dropping':
        daruma.dropTimer++;
        if (daruma.dropTimer > 15) {
          // Check alignment
          var targetX = 240;
          var tolerance = 25 - daruma.stack.length * 2; // Gets harder
          if (tolerance < 10) tolerance = 10;

          if (Math.abs(daruma.current.x - targetX) < tolerance) {
            daruma.stack.push({ x: daruma.current.x });
            Game.Audio.playSfx('item');

            if (daruma.stack.length >= daruma.targetHeight) {
              daruma.phase = 'success';
              daruma.dropTimer = 0;
            } else {
              daruma.current = { x: 240, falling: false };
              daruma.speed += 0.5;
              daruma.phase = 'moving';
            }
          } else {
            daruma.lives--;
            Game.Audio.playSfx('damage');
            if (daruma.lives <= 0) {
              daruma.phase = 'fail';
              daruma.dropTimer = 0;
            } else {
              daruma.current = { x: 240, falling: false };
              daruma.phase = 'moving';
            }
          }
        }
        break;

      case 'success':
        daruma.dropTimer++;
        if (daruma.dropTimer > 60) {
          active = false;
          Game.Audio.playSfx('victory');
          return { result: 'success', npc: npcRef };
        }
        break;

      case 'fail':
        daruma.dropTimer++;
        if (daruma.dropTimer > 60) {
          active = false;
          return { result: 'fail', npc: npcRef };
        }
        break;
    }
    return null;
  }

  function updateQuiz() {
    if (quiz.messageTimer > 0) {
      quiz.messageTimer--;
      return null;
    }

    switch (quiz.phase) {
      case 'question':
        if (Game.Input.isPressed('up')) {
          quiz.selectedChoice = (quiz.selectedChoice - 1 + 3) % 3;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('down')) {
          quiz.selectedChoice = (quiz.selectedChoice + 1) % 3;
          Game.Audio.playSfx('confirm');
        }
        if (Game.Input.isPressed('confirm')) {
          var q = quiz.selectedQuestions[quiz.currentQ];
          if (quiz.selectedChoice === q.answer) {
            quiz.score++;
            quiz.phase = 'correct';
            quiz.messageTimer = 40;
            Game.Audio.playSfx('item');
          } else {
            quiz.phase = 'wrong';
            quiz.messageTimer = 40;
            Game.Audio.playSfx('damage');
          }
        }
        break;

      case 'correct':
      case 'wrong':
        quiz.currentQ++;
        quiz.selectedChoice = 0;
        if (quiz.currentQ >= quiz.selectedQuestions.length) {
          if (quiz.score >= 2) {
            quiz.phase = 'success';
            quiz.messageTimer = 60;
          } else {
            quiz.phase = 'fail';
            quiz.messageTimer = 60;
          }
        } else {
          quiz.phase = 'question';
        }
        break;

      case 'success':
        active = false;
        Game.Audio.playSfx('victory');
        return { result: 'success', npc: npcRef };

      case 'fail':
        active = false;
        return { result: 'fail', npc: npcRef };
    }
    return null;
  }

  function initKaruta() {
    var selected = karuta.templates.slice().sort(function() {
      return Math.random() - 0.5;
    }).slice(0, 3);
    var cards = [];
    var i;

    for (i = 0; i < selected.length; i++) {
      cards.push({ pairId: selected[i].id, kana: selected[i].kana, text: selected[i].text, color: selected[i].color, flipped: false, cleared: false });
      cards.push({ pairId: selected[i].id, kana: selected[i].kana, text: selected[i].text, color: selected[i].color, flipped: false, cleared: false });
    }

    karuta.cards = cards.sort(function() {
      return Math.random() - 0.5;
    });
    karuta.selectedIndex = 0;
    karuta.firstCard = null;
    karuta.secondCard = null;
    karuta.mismatchTimer = 0;
    karuta.failedAttempts = 0;
    karuta.clearedPairs = 0;
    karuta.phase = 'playing';
    karuta.pendingFail = false;
    karuta.resultTimer = 0;
  }

  function updateKaruta() {
    if (karuta.phase === 'success') {
      karuta.resultTimer++;
      if (karuta.resultTimer > 60) {
        active = false;
        Game.Audio.playSfx('victory');
        return { result: 'success', npc: npcRef };
      }
      return null;
    }

    if (karuta.phase === 'fail') {
      karuta.resultTimer++;
      if (karuta.resultTimer > 60) {
        active = false;
        return { result: 'fail', npc: npcRef };
      }
      return null;
    }

    if (karuta.mismatchTimer > 0) {
      karuta.mismatchTimer--;
      if (karuta.mismatchTimer <= 0 && karuta.firstCard !== null && karuta.secondCard !== null) {
        if (!karuta.cards[karuta.firstCard].cleared) karuta.cards[karuta.firstCard].flipped = false;
        if (!karuta.cards[karuta.secondCard].cleared) karuta.cards[karuta.secondCard].flipped = false;
        karuta.firstCard = null;
        karuta.secondCard = null;
        if (karuta.pendingFail) {
          karuta.phase = 'fail';
          karuta.resultTimer = 0;
        }
      }
      return null;
    }

    if (Game.Input.isPressed('left') && karuta.selectedIndex % 3 !== 0) {
      karuta.selectedIndex--;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('right') && karuta.selectedIndex % 3 !== 2) {
      karuta.selectedIndex++;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('up') && karuta.selectedIndex >= 3) {
      karuta.selectedIndex -= 3;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down') && karuta.selectedIndex < 3) {
      karuta.selectedIndex += 3;
      Game.Audio.playSfx('confirm');
    }

    if (Game.Input.isPressed('confirm')) {
      var card = karuta.cards[karuta.selectedIndex];
      if (card && !card.flipped && !card.cleared) {
        card.flipped = true;
        Game.Audio.playSfx('confirm');

        if (karuta.firstCard === null) {
          karuta.firstCard = karuta.selectedIndex;
        } else {
          karuta.secondCard = karuta.selectedIndex;
          if (karuta.cards[karuta.firstCard].pairId === karuta.cards[karuta.secondCard].pairId) {
            karuta.cards[karuta.firstCard].cleared = true;
            karuta.cards[karuta.secondCard].cleared = true;
            karuta.firstCard = null;
            karuta.secondCard = null;
            karuta.clearedPairs++;
            Game.Audio.playSfx('item');

            if (karuta.clearedPairs >= 3) {
              karuta.phase = 'success';
              karuta.resultTimer = 0;
            }
          } else {
            karuta.failedAttempts++;
            karuta.pendingFail = karuta.failedAttempts >= 5;
            karuta.mismatchTimer = 40;
            Game.Audio.playSfx('damage');
          }
        }
      }
    }

    if (Game.Input.isPressed('cancel')) {
      active = false;
      return { result: 'fail', npc: npcRef };
    }

    return null;
  }

  function initRhythm() {
    rhythm.notes = [];
    rhythm.frame = 0;
    rhythm.score = 0;
    rhythm.phase = 'playing';
    rhythm.resultTimer = 0;
    rhythm.judgeText = '';
    rhythm.judgeTimer = 0;

    for (var i = 0; i < rhythm.pattern.length; i++) {
      rhythm.notes.push({
        lane: rhythm.pattern[i],
        time: 30 + i * 18,
        hit: false,
        judged: false,
        result: ''
      });
    }
  }

  function updateRhythm() {
    if (rhythm.phase === 'success') {
      rhythm.resultTimer++;
      if (rhythm.resultTimer > 60) {
        active = false;
        Game.Audio.playSfx('victory');
        return { result: 'success', npc: npcRef };
      }
      return null;
    }

    if (rhythm.phase === 'fail') {
      rhythm.resultTimer++;
      if (rhythm.resultTimer > 60) {
        active = false;
        return { result: 'fail', npc: npcRef };
      }
      return null;
    }

    rhythm.frame++;
    if (rhythm.judgeTimer > 0) {
      rhythm.judgeTimer--;
    }

    handleRhythmInput('left', 0);
    handleRhythmInput('confirm', 1);
    handleRhythmInput('right', 2);

    for (var i = 0; i < rhythm.notes.length; i++) {
      var note = rhythm.notes[i];
      if (!note.judged && rhythm.frame - note.time > 8) {
        note.judged = true;
        note.result = 'miss';
        rhythm.judgeText = 'Miss';
        rhythm.judgeTimer = 18;
        Game.Audio.playSfx('damage');
      }
    }

    if (Game.Input.isPressed('cancel')) {
      active = false;
      return { result: 'fail', npc: npcRef };
    }

    if (allRhythmNotesDone()) {
      rhythm.phase = rhythm.score >= 24 ? 'success' : 'fail';
      rhythm.resultTimer = 0;
    }

    return null;
  }

  function handleRhythmInput(action, lane) {
    if (!Game.Input.isPressed(action)) return;

    var bestIndex = -1;
    var bestDiff = 999;
    for (var i = 0; i < rhythm.notes.length; i++) {
      var note = rhythm.notes[i];
      if (!note.judged && note.lane === lane) {
        var diff = Math.abs(rhythm.frame - note.time);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = i;
        }
      }
    }

    if (bestIndex === -1 || bestDiff > 8) {
      rhythm.judgeText = 'Miss';
      rhythm.judgeTimer = 18;
      Game.Audio.playSfx('damage');
      return;
    }

    var targetNote = rhythm.notes[bestIndex];
    targetNote.judged = true;
    targetNote.hit = true;

    if (bestDiff <= 4) {
      targetNote.result = 'perfect';
      rhythm.score += 3;
      rhythm.judgeText = 'Perfect';
      Game.Audio.playSfx('confirm');
    } else {
      targetNote.result = 'good';
      rhythm.score += 1;
      rhythm.judgeText = 'Good';
      Game.Audio.playSfx('item');
    }
    rhythm.judgeTimer = 18;
  }

  function allRhythmNotesDone() {
    for (var i = 0; i < rhythm.notes.length; i++) {
      if (!rhythm.notes[i].judged) return false;
    }
    return true;
  }

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111133');

    if (type === 'daruma') drawDaruma(R, C);
    if (type === 'quiz') drawQuiz(R, C);
    if (type === 'karuta') drawKaruta(R, C);
    if (type === 'rhythm') drawRhythm(R, C);
  }

  function drawDaruma(R, C) {
    // Title
    R.drawTextJP('だるま積み！', 180, 10, C.COLORS.GOLD, 18);
    R.drawTextJP('残り: ' + daruma.lives + '回  目標: ' + daruma.targetHeight + '個',
      150, 35, '#fff', 12);

    // Platform
    R.drawRectAbsolute(190, 280, 100, 10, '#888');

    // Stacked daruma
    for (var i = 0; i < daruma.stack.length; i++) {
      var dy = 260 - i * 28;
      drawDarumaSprite(R, daruma.stack[i].x - 15, dy);
    }

    // Current daruma
    if (daruma.phase === 'moving' || daruma.phase === 'dropping') {
      var cy = daruma.phase === 'dropping'
        ? Math.min(260 - daruma.stack.length * 28, 40 + daruma.dropTimer * 10)
        : 40;
      drawDarumaSprite(R, daruma.current.x - 15, cy);

      // Guide line
      if (daruma.phase === 'moving') {
        R.drawRectAbsolute(daruma.current.x, cy + 20, 1, 280 - cy - 20, 'rgba(255,255,0,0.3)');
      }
    }

    // Messages
    if (daruma.phase === 'success') {
      R.drawTextJP('成功！だるま積み完成！', 140, 150, C.COLORS.GOLD, 18);
    } else if (daruma.phase === 'fail') {
      R.drawTextJP('失敗...もう一度話しかけてね', 120, 150, C.COLORS.HP_RED, 16);
    }

    if (daruma.phase === 'moving') {
      R.drawTextJP('Zキーでだるまを落とす！', 140, C.CANVAS_HEIGHT - 25, '#aaa', 12);
    }
  }

  function drawDarumaSprite(R, x, y) {
    R.drawRectAbsolute(x, y, 30, 20, '#cc2222');
    R.drawRectAbsolute(x + 5, y + 2, 20, 16, '#dd4444');
    R.drawRectAbsolute(x + 10, y + 5, 4, 4, '#000');
    R.drawRectAbsolute(x + 18, y + 5, 4, 4, '#000');
    R.drawRectAbsolute(x + 12, y + 12, 6, 3, '#ffcc88');
  }

  function drawQuiz(R, C) {
    R.drawTextJP('群馬県クイズ！', 170, 10, C.COLORS.GOLD, 18);
    R.drawTextJP('問題 ' + (quiz.currentQ + 1) + ' / ' + quiz.selectedQuestions.length +
      '  正解: ' + quiz.score, 160, 35, '#fff', 12);

    if (quiz.phase === 'question' && quiz.currentQ < quiz.selectedQuestions.length) {
      var q = quiz.selectedQuestions[quiz.currentQ];

      R.drawDialogBox(30, 60, 420, 50);
      R.drawTextJP(q.q, 45, 75, '#fff', 14);

      for (var i = 0; i < q.choices.length; i++) {
        var color = (i === quiz.selectedChoice) ? C.COLORS.GOLD : '#fff';
        var prefix = (i === quiz.selectedChoice) ? '▶ ' : '  ';
        R.drawDialogBox(100, 130 + i * 45, 280, 35);
        R.drawTextJP(prefix + q.choices[i], 120, 140 + i * 45, color, 14);
      }
    } else if (quiz.phase === 'correct') {
      R.drawTextJP('正解！', 210, 150, C.COLORS.HP_GREEN, 24);
    } else if (quiz.phase === 'wrong') {
      R.drawTextJP('不正解...', 195, 150, C.COLORS.HP_RED, 24);
    } else if (quiz.phase === 'success') {
      R.drawTextJP('合格！クイズクリア！', 140, 150, C.COLORS.GOLD, 20);
    } else if (quiz.phase === 'fail') {
      R.drawTextJP('不合格...もう一度挑戦しよう', 110, 150, C.COLORS.HP_RED, 16);
    }
  }

  function drawKaruta(R, C) {
    var startX = 100;
    var startY = 60;
    var gapX = 100;
    var gapY = 120;

    R.drawTextJP('上毛かるた合わせ', 150, 10, C.COLORS.GOLD, 18);
    R.drawTextJP('失敗 ' + karuta.failedAttempts + ' / 5   クリア ' + karuta.clearedPairs + ' / 3',
      130, 35, '#fff', 12);

    for (var i = 0; i < karuta.cards.length; i++) {
      var col = i % 3;
      var row = Math.floor(i / 3);
      var x = startX + col * gapX;
      var y = startY + row * gapY;
      var card = karuta.cards[i];
      var isSelected = i === karuta.selectedIndex && karuta.phase === 'playing' && karuta.mismatchTimer === 0;
      var borderColor = isSelected ? C.COLORS.GOLD : '#666';

      R.drawRectAbsolute(x - 3, y - 3, 86, 106, borderColor);
      R.drawRectAbsolute(x, y, 80, 100, card.flipped || card.cleared ? card.color : '#223355');

      if (card.flipped || card.cleared) {
        R.drawTextJP(card.kana, x + 32, y + 14, '#fff', 20);
        R.drawTextJP(card.text, x + 8, y + 48, '#fff', 10);
      } else {
        R.drawTextJP('上毛', x + 20, y + 34, '#fff', 16);
        R.drawTextJP('かるた', x + 16, y + 58, '#aaccee', 14);
      }

      if (card.cleared) {
        R.drawTextJP('OK', x + 28, y + 78, '#ffef88', 12);
      }
    }

    if (karuta.phase === 'success') {
      R.drawTextJP('全ペア達成！', 180, 285, C.COLORS.GOLD, 18);
    } else if (karuta.phase === 'fail') {
      R.drawTextJP('5回ミス...もう一度挑戦！', 125, 285, C.COLORS.HP_RED, 16);
    } else if (karuta.mismatchTimer > 0) {
      R.drawTextJP('ざんねん！', 195, 285, C.COLORS.HP_RED, 16);
    } else {
      R.drawTextJP('矢印で選択、Zでめくる', 145, 285, '#aaa', 12);
    }
  }

  function drawRhythm(R, C) {
    var laneWidth = 70;
    var laneTop = 55;
    var laneBottom = 270;
    var hitZoneY = rhythm.hitZoneY;
    var laneColors = ['#66aaff', '#ffcc44', '#ff7777'];
    var laneLabels = ['←', 'Z', '→'];

    R.drawTextJP('草津節リズムゲーム', 130, 10, C.COLORS.GOLD, 18);
    R.drawTextJP('スコア ' + rhythm.score + ' / 48   目標 24点', 150, 35, '#fff', 12);
    R.drawTextJP('「草津よいとこ 一度はおいで」', 108, 300, '#aaa', 11);

    for (var i = 0; i < 3; i++) {
      var laneX = rhythm.laneX[i] - laneWidth / 2;
      R.drawRectAbsolute(laneX, laneTop, laneWidth, laneBottom - laneTop, 'rgba(255,255,255,0.08)');
      R.drawRectAbsolute(laneX, hitZoneY, laneWidth, 4, laneColors[i]);
      R.drawTextJP('▼', rhythm.laneX[i] - 6, hitZoneY + 8, laneColors[i], 14);
      R.drawTextJP(laneLabels[i], rhythm.laneX[i] - 7, laneBottom + 8, '#fff', 14);
    }

    for (i = 0; i < rhythm.notes.length; i++) {
      var note = rhythm.notes[i];
      if (note.judged && !note.hit) continue;
      if (note.judged && note.hit) continue;

      var y = hitZoneY - (note.time - rhythm.frame) * rhythm.noteSpeed;
      if (y < laneTop - 20 || y > laneBottom) continue;
      R.drawTextJP('●', rhythm.laneX[note.lane] - 8, y, laneColors[note.lane], 20);
    }

    if (rhythm.judgeTimer > 0) {
      var judgeColor = '#fff';
      if (rhythm.judgeText === 'Perfect') judgeColor = C.COLORS.GOLD;
      if (rhythm.judgeText === 'Good') judgeColor = C.COLORS.HP_GREEN;
      if (rhythm.judgeText === 'Miss') judgeColor = C.COLORS.HP_RED;
      R.drawTextJP(rhythm.judgeText, 205, 75, judgeColor, 18);
    }

    if (rhythm.phase === 'success') {
      R.drawTextJP('リズム成功！', 175, 120, C.COLORS.GOLD, 20);
    } else if (rhythm.phase === 'fail') {
      R.drawTextJP('リズム失敗...', 165, 120, C.COLORS.HP_RED, 20);
    }
  }

  function isActive() { return active; }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive
  };
})();
