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
      }
    ],
    currentQ: 0,
    selectedQuestions: [],
    score: 0,
    selectedChoice: 0,
    phase: 'question', // question, correct, wrong, success, fail
    messageTimer: 0
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
    }
  }

  function update() {
    if (!active) return null;

    if (type === 'daruma') return updateDaruma();
    if (type === 'quiz') return updateQuiz();
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

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, '#111133');

    if (type === 'daruma') drawDaruma(R, C);
    if (type === 'quiz') drawQuiz(R, C);
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

  function isActive() { return active; }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive
  };
})();
