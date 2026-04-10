// NPC interaction system
Game.NPC = (function() {
  var currentNpc = null;
  var dialogIndex = 0;
  var dialogLines = [];
  var dialogPages = [];
  var dialogPageIndex = 0;
  var onDialogEnd = null;
  var npcMovement = {};
  var AUTO_DIALOG_KEY = '__gunmaNpcAutoDialogText';
  var INTERNAL_DIALOG_ACTIONS = {
    RESUME_COMPANION_TOPICS: '__resume_companion_topics'
  };
  var SERVICE_ICONS = {
    dice_shop: {
      sprite: [
        [0,1,1,1,1,1,0,0],
        [1,2,2,2,2,2,1,0],
        [1,2,3,2,3,2,1,0],
        [1,2,2,2,2,2,1,0],
        [1,2,3,2,2,3,1,0],
        [1,2,2,2,2,2,1,0],
        [0,1,1,1,1,1,0,0],
        [0,0,0,0,0,0,0,0]
      ],
      palette: { 1: '#f7e4a3', 2: '#fff8de', 3: '#293147' },
      frame: '#6a5629'
    },
    item_shop: {
      sprite: [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,2,3,3,2,2,1],
        [1,2,2,2,2,2,2,1],
        [1,2,4,2,2,4,2,1],
        [1,2,2,2,2,2,2,1],
        [0,1,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0]
      ],
      palette: { 1: '#4d3a22', 2: '#d4a164', 3: '#f6dcb0', 4: '#7d4d1d' },
      frame: '#6b4020'
    },
    inn: {
      sprite: [
        [1,1,1,1,1,1,1,0],
        [1,2,2,2,2,2,1,0],
        [1,3,3,2,2,2,1,0],
        [1,2,2,2,2,2,1,0],
        [1,4,4,4,4,4,1,0],
        [1,2,2,2,2,2,1,0],
        [1,1,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0]
      ],
      palette: { 1: '#8aa8d4', 2: '#f4f6fb', 3: '#d4e4ff', 4: '#5f7aa9' },
      frame: '#314768'
    }
  };
  var companionDialogState = {};
  var companionQuestionState = null;
  var companionTopicMeta = [
    { id: 'world', label: '世界観', description: '土地や掟のことを聞く。' },
    { id: 'feelings', label: '心情', description: '今の気持ちを聞く。' },
    { id: 'hint', label: '攻略', description: '進み方や勝ち筋を聞く。' },
    { id: 'trivia', label: '雑学', description: '群馬の小話を聞く。' },
    { id: 'joke', label: 'ギャグ', description: '少し力を抜いた話を聞く。' }
  ];
  var companionDialogDefs = {
    akagi: {
      defaultLines: [
        ['道が急に静かになったら、境目が近い合図だ。先に息を整えろ。'],
        ['群馬の道は、地図より先に気配で覚えた方が早い。風と匂いが道標になる。'],
        ['赤城おろしの日は声が遠くへ逃げる。呼び止めるなら、短く言うのがいい。']
      ],
      contextEntries: [
        {
          mapIds: ['maebashi'],
          lines: [
            '前橋は人が多いぶん、知らない顔もすぐ見つかる。',
            '困ったら、明るい店先と人の流れだけは見失うな。'
          ]
        },
        {
          mapIds: ['takasaki'],
          lines: [
            '高崎のだるまは、願いを入れる前の空洞がいちばん不気味だ。',
            '音だけで近づいてくる時は、焦って踏み込むな。'
          ]
        },
        {
          mapIds: ['forest', 'tamura', 'konuma', 'onuma'],
          lines: [
            '森と霧の中では、近道ほどだいたい罠だ。',
            '見える道より、戻れる道を先に覚えろ。'
          ]
        },
        {
          mapIds: ['akagi_ranch', 'akagi_shrine'],
          lines: [
            '赤城の上は昔から「風が先に人を選ぶ」って言う。',
            '急ぐ時ほど立ち止まるくらいで、ちょうどいい。'
          ]
        },
        {
          flags: ['daruma_master_cleared'],
          lines: [
            'だるま師匠を越えたなら、もう最初の群馬じゃない。',
            '景色の方も、こっちを覚え始めてる。'
          ]
        },
        {
          minChapter: 6,
          lines: [
            '一度石になったせいか、静かな場所の重みが前より分かる。',
            '急がず行こう。急がなくても、ちゃんと進める。'
          ]
        }
      ]
    },
    yamakawa: {
      defaultLines: [
        ['土地は見た目より、音と湿り気の方が正直です。足裏で読むと外れにくいですよ。'],
        ['古い道は、消えたあとも少しだけ癖を残します。段差と風向きにそれが出ます。'],
        ['地図は答えじゃなくて仮説です。歩いたあとで、ようやく正しい形になります。']
      ],
      contextEntries: [
        {
          mapIds: ['haruna_lake', 'oze_marsh'],
          lines: [
            '湖と湿地は、同じ水場でも足の取られ方が違います。',
            '榛名は迷わせて、尾瀬は沈ませる。そこを見分けましょう。'
          ]
        },
        {
          mapIds: ['tanigawa_tunnel', 'minakami_valley', 'border_tunnel'],
          lines: [
            'トンネルや谷筋は、音の跳ね返りで距離感が狂いやすいです。',
            '見えた位置より半歩ぶん遠いと思って動くと、崩れにくいです。'
          ]
        },
        {
          mapIds: ['jomo_gakuen'],
          lines: [
            '廃校の廊下は真っ直ぐでも、気配は直進しません。',
            '角の先を読むより、逃げる方向を先に決めておくべき場所です。'
          ]
        },
        {
          flags: ['party_yamakawa'],
          lines: [
            '地名って、残ったものより失われたものの方をよく記録してるんです。',
            'だから古い呼び名ほど、その土地の癖が残っていたりします。'
          ]
        }
      ]
    },
    furuya: {
      defaultLines: [
        ['古い看板とか壊れた機械って、その土地の「やめ方」が残るんだよな。そこが結構好き。'],
        ['ちゃんと終われなかった場所ほど、余韻だけが長く残る。群馬の深い方ってそういうの多い。'],
        ['雑に見える道具でも、持ち主の癖は消えない。手つきって、けっこう景色に残るんだよ。']
      ],
      contextEntries: [
        {
          mapIds: ['jomo_gakuen', 'tanigawa_tunnel'],
          lines: [
            '学校もトンネルも、人が通う前提で作られてるだろ。',
            '使う人がいなくなると、急に別のものみたいに見えてくる。'
          ]
        },
        {
          mapIds: ['minakami_valley', 'border_tunnel'],
          lines: [
            '終わりに近い場所ほど、落とし物が増えるんだよな。',
            '戻る気だったやつほど、最後に手放した物が重い。'
          ]
        },
        {
          flags: ['furuya_phone_found'],
          lines: [
            '沈んだスマホって、画面が割れてても妙に生々しいんだ。',
            '持ち主の時間だけ、そこに置きっぱなしになる感じがする。'
          ]
        },
        {
          flags: ['party_furuya'],
          lines: [
            '俺は理屈より先に手が出る方だけどさ、今はその前に一回だけ景色を見るようにしてる。',
            'たぶん、その一拍ぶんで助かることがある。'
          ]
        }
      ]
    }
  };
  var companionQuestionDefs = {
    akagi: {
      promptLines: [
        'アカギは風向きを確かめている。何を聞く？',
        'アカギが歩幅を少しゆるめた。聞くなら今だ。'
      ],
      topics: {
        world: {
          defaultResponses: [
            ['群馬は地図より先に、掟で区切られてる。', '同じ道でも、通っていい日と悪い日があるんだ。'],
            ['県境ってのは線じゃない。', '敬意が薄れた場所から、先にほころぶ。']
          ],
          contextEntries: [
            {
              mapIds: ['maebashi', 'takasaki'],
              responses: [
                ['町場は人の顔が多いぶん、気配も混ざる。', '派手な看板より、人が避ける角を見ろ。']
              ]
            },
            {
              mapIds: ['forest', 'konuma', 'onuma', 'akagi_ranch', 'akagi_shrine'],
              responses: [
                ['山の奥は、道より先に風が境目を知らせる。', '静かすぎたら、だいたい誰かが見てる。']
              ]
            }
          ]
        },
        feelings: {
          defaultResponses: [
            ['……心配はしてる。', '口に出すと鈍る気がするだけだ。'],
            ['お前が景色を見るようになったのは助かる。', '前みたいに突っ走るだけじゃなくなった。']
          ],
          contextEntries: [
            {
              flags: ['daruma_master_cleared'],
              responses: [
                ['最初の関所を越えて、少し安心した。', 'ようやく同じ旅をしてる感じがしてきた。']
              ]
            },
            {
              minChapter: 6,
              responses: [
                ['ここまで来ると、急ぐだけじゃ駄目だって分かる。', '戻るためにも、無事でいてくれ。']
              ]
            }
          ]
        },
        hint: {
          defaultResponses: [
            ['迷ったら、広い道じゃなく戻れる道を選べ。', '帰り道を残したやつから生き残る。'],
            ['敵の一手目は、だいたい見栄だ。', '先に息を整えると、次が読みやすい。']
          ],
          contextEntries: [
            {
              mapIds: ['takasaki'],
              responses: [
                ['高崎は見た目より音が先に来る。', '焦って踏み込むと、向こうの拍に飲まれるぞ。']
              ]
            },
            {
              mapIds: ['forest', 'konuma', 'onuma'],
              responses: [
                ['霧の中では近道ほど罠だ。', '見えた道より、戻れる道を先に覚えろ。']
              ]
            }
          ]
        },
        trivia: {
          defaultResponses: [
            ['ハルナは天気を読むのがうまい。', 'ミョウギは逆に、天気を煽るのがうまい。'],
            ['赤城おろしの日は、火より音が遠くへ飛ぶ。', '昔はそれで合図を回してた。']
          ]
        },
        joke: {
          defaultResponses: [
            ['群馬で迷ったらどうするか知ってるか。', '迷ってる顔を隠す。だいたいそれで半分助かる。'],
            ['褒めても何も出ない。', '……いや、次の助言くらいは出るか。']
          ]
        }
      }
    },
    yamakawa: {
      promptLines: [
        '山川が足元を見ながら歩いている。何を聞く？',
        '山川は地面の湿り気を確かめていた。何を聞こうか。'
      ],
      topics: {
        world: {
          defaultResponses: [
            ['土地の名前って、残ったものより失ったものをよく記録してるんです。', '古い呼び名ほど、その土地の癖が残りやすいんですよ。'],
            ['群馬の道具は、生活と博打が近すぎるんです。', '便利さと危うさが同じところから生まれてる。']
          ],
          contextEntries: [
            {
              mapIds: ['haruna_lake', 'oze_marsh'],
              responses: [
                ['同じ水辺でも、榛名は迷わせて、尾瀬は沈ませます。', '水の顔つきで土地の性格が違うんです。']
              ]
            }
          ]
        },
        feelings: {
          defaultResponses: [
            ['父の仕事が、今の群馬の土台になったのは事実です。', '誇りと後ろめたさ、両方あります。'],
            ['正しいものを残したかった人たちが、少しずつ使い方を間違えた。', 'その重さは、僕も無視できません。']
          ],
          contextEntries: [
            {
              minChapter: 5,
              responses: [
                ['ここまで来ると、継いだものから逃げるのも違う気がします。', 'せめて、良かった部分まで潰さないようにしたいです。']
              ]
            }
          ]
        },
        hint: {
          defaultResponses: [
            ['足場は見た目より、音と湿り気の方が正直です。', '迷ったら、まず足裏で読んでください。'],
            ['真っ直ぐな道ほど、逃げ道を先に決めておくべきです。', '退き方が決まると、進み方も安定します。']
          ],
          contextEntries: [
            {
              mapIds: ['tanigawa_tunnel', 'minakami_valley', 'border_tunnel'],
              responses: [
                ['トンネルや谷は、見えた位置より半歩ぶん遠いと思ってください。', '音の跳ね返りで距離感が狂いやすいです。']
              ]
            },
            {
              mapIds: ['jomo_gakuen'],
              responses: [
                ['廃校は直線が多いぶん、追い込まれやすいです。', '角を曲がる前に、逃げる先だけ決めておきましょう。']
              ]
            }
          ]
        },
        trivia: {
          defaultResponses: [
            ['父はサイコロの角の削り方だけで、一日中話せる人でした。', '良い意味でも、悪い意味でも職人だったんです。'],
            ['地名は発音より、どこで息継ぎするかが大事なんです。', 'そこに土地の古い癖が残ります。']
          ]
        },
        joke: {
          defaultResponses: [
            ['僕の冗談って、冗談に聞こえないらしいんですよ。', '今のは一応、ちゃんと冗談です。'],
            ['足元ばかり見てるってよく言われます。', 'でも転ばないのは、そのおかげですから。']
          ]
        }
      }
    },
    furuya: {
      promptLines: [
        '古谷が壊れた看板を眺めている。何を聞く？',
        '古谷は周囲の残骸を面白そうに見ている。何を聞こうか。'
      ],
      topics: {
        world: {
          defaultResponses: [
            ['壊れた機械とか古い看板って、その土地の「やめ方」が残るんだよ。', '終われなかった場所ほど、生々しい。'],
            ['群馬の深い方は、使う人を失った施設が急に別物になる。', '生活の形だけが残って、意味が抜けるんだ。']
          ],
          contextEntries: [
            {
              mapIds: ['jomo_gakuen', 'tanigawa_tunnel'],
              responses: [
                ['学校もトンネルも、人が通う前提で作られてるだろ。', '使う人が消えると、急に異界っぽさが増すんだよな。']
              ]
            }
          ]
        },
        feelings: {
          defaultResponses: [
            ['父さんが始めたことのせいで、今の荒れ方に繋がったならさ。', '無関係な顔はしたくない。'],
            ['理屈は後からいくらでも付くんだ。', 'でも嫌な感じがした場所って、だいたい当たる。']
          ],
          contextEntries: [
            {
              minChapter: 5,
              responses: [
                ['ここまで来ると、責任って言葉も軽く使えないな。', 'せめて、見なかったことにはしないつもり。']
              ]
            }
          ]
        },
        hint: {
          defaultResponses: [
            ['何かある場所って、物の置かれ方が不自然なんだ。', '先に「誰が最後に触ったか」を考えると見つけやすい。'],
            ['音が一拍遅れて返る場所は、だいたい仕掛けがある。', '壁より、空気の返り方を見た方が早い。']
          ],
          contextEntries: [
            {
              mapIds: ['minakami_valley', 'border_tunnel'],
              responses: [
                ['終わりに近い場所ほど落とし物が増える。', '戻る気だったやつほど、最後に重い物を手放すから。']
              ]
            }
          ]
        },
        trivia: {
          defaultResponses: [
            ['沈んだスマホって、画面が割れてても妙に生々しいんだ。', '持ち主の時間だけ、そこに置きっぱなしになる感じがする。'],
            ['古いネオンって切れても完全には死なないんだよ。', 'ごくたまに、忘れたみたいに一瞬だけ戻る。']
          ]
        },
        joke: {
          defaultResponses: [
            ['俺、理系っぽいって言われるけどさ。', '壊れた物を見てわくわくする時点で、だいぶ駄目だよな。'],
            ['安心しろ。今日はまだ怪しい物を拾ってない。', '……たぶんだけど。']
          ]
        }
      }
    }
  };

  function clampText(text, maxChars) {
    if (!text || text.length <= maxChars) return text || '';
    return text.substring(0, Math.max(0, maxChars - 1)) + '…';
  }

  function paginateDialogText(text, maxChars, maxLines) {
    var pages = [];
    var remaining = '' + (text || '');
    var punctuation = '、。！？…）)] ';

    if (!remaining.length) return [''];

    while (remaining.length > 0) {
      var lines = [];
      while (remaining.length > 0 && lines.length < maxLines) {
        if (remaining.length <= maxChars) {
          lines.push(remaining);
          remaining = '';
          break;
        }
        var slice = remaining.substring(0, maxChars);
        var splitAt = -1;
        for (var i = slice.length - 1; i >= Math.max(0, slice.length - 8); i--) {
          if (punctuation.indexOf(slice.charAt(i)) >= 0) {
            splitAt = i + 1;
            break;
          }
        }
        if (splitAt <= 0) splitAt = maxChars;
        lines.push(remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt);
      }

      if (!lines.length) {
        lines.push(clampText(remaining, maxChars));
        remaining = '';
      }

      pages.push(lines.join('\n'));
    }

    return pages.length ? pages : [''];
  }

  function buildDialogPages(text) {
    if (Game.UI && Game.UI.paginateDialogText) {
      return Game.UI.paginateDialogText(text, 36, 4);
    }
    return paginateDialogText(text, 36, 4);
  }

  function getCurrentMapId() {
    return Game.Map && Game.Map.getCurrentMapId ? Game.Map.getCurrentMapId() : '';
  }

  function getCurrentChapter() {
    return Game.Player && Game.Player.getData ? (Game.Player.getData().chapter || 1) : 1;
  }

  function getPartyCompanionById(memberId) {
    if (!memberId || !Game.Player || !Game.Player.getPartyMembers) return null;
    var partyMembers = Game.Player.getPartyMembers();
    for (var i = 0; i < partyMembers.length; i++) {
      if (partyMembers[i] && partyMembers[i].id === memberId) return partyMembers[i];
    }
    return null;
  }

  function companionContextMatches(entry) {
    if (!entry) return false;
    var mapId = getCurrentMapId();
    var chapterNumber = getCurrentChapter();
    if (entry.mapIds && entry.mapIds.length && entry.mapIds.indexOf(mapId) < 0) return false;
    if (typeof entry.minChapter === 'number' && chapterNumber < entry.minChapter) return false;
    if (typeof entry.maxChapter === 'number' && chapterNumber > entry.maxChapter) return false;
    if (entry.flags && entry.flags.length) {
      if (!Game.Story || !Game.Story.hasFlag) return false;
      for (var i = 0; i < entry.flags.length; i++) {
        if (!Game.Story.hasFlag(entry.flags[i])) return false;
      }
    }
    if (entry.notFlags && entry.notFlags.length && Game.Story && Game.Story.hasFlag) {
      for (var j = 0; j < entry.notFlags.length; j++) {
        if (Game.Story.hasFlag(entry.notFlags[j])) return false;
      }
    }
    return true;
  }

  function chooseCompanionDialogLines(memberId) {
    var def = companionDialogDefs[memberId];
    if (!def) return ['……。'];
    var pool = [];
    var i;
    if (def.contextEntries && def.contextEntries.length) {
      for (i = 0; i < def.contextEntries.length; i++) {
        if (companionContextMatches(def.contextEntries[i])) {
          pool.push(def.contextEntries[i].lines);
        }
      }
    }
    if (!pool.length) {
      pool = def.defaultLines ? def.defaultLines.slice() : [];
    }
    if (!pool.length) return ['……。'];
    companionDialogState[memberId] = (companionDialogState[memberId] || 0) + 1;
    return pool[(companionDialogState[memberId] - 1) % pool.length].slice();
  }

  function hasCompanionQuestionDialog(memberId) {
    var def = companionQuestionDefs[memberId];
    return !!(def && def.topics);
  }

  function chooseSequentialCompanionEntry(key, pool) {
    if (!pool || !pool.length) return null;
    companionDialogState[key] = (companionDialogState[key] || 0) + 1;
    var entry = pool[(companionDialogState[key] - 1) % pool.length];
    if (Array.isArray(entry)) return entry.slice();
    return [entry];
  }

  function getCompanionQuestionPrompt(memberId) {
    var def = companionQuestionDefs[memberId];
    if (!def || !def.promptLines || !def.promptLines.length) {
      return '何を聞く？';
    }
    var lines = chooseSequentialCompanionEntry(memberId + ':prompt', def.promptLines);
    return lines && lines.length ? lines[0] : '何を聞く？';
  }

  function chooseCompanionTopicLines(memberId, topicId) {
    var def = companionQuestionDefs[memberId];
    var topicDef = def && def.topics ? def.topics[topicId] : null;
    if (!topicDef) return chooseCompanionDialogLines(memberId);

    var pool = [];
    var i;
    if (topicDef.contextEntries && topicDef.contextEntries.length) {
      for (i = 0; i < topicDef.contextEntries.length; i++) {
        if (companionContextMatches(topicDef.contextEntries[i])) {
          pool.push(topicDef.contextEntries[i].responses);
        }
      }
    }
    if (!pool.length && topicDef.defaultResponses && topicDef.defaultResponses.length) {
      pool = topicDef.defaultResponses.slice();
    }
    if (!pool.length) return chooseCompanionDialogLines(memberId);

    var selectionPool = [];
    for (i = 0; i < pool.length; i++) {
      if (Array.isArray(pool[i]) && Array.isArray(pool[i][0])) {
        for (var j = 0; j < pool[i].length; j++) {
          selectionPool.push(pool[i][j]);
        }
      } else {
        selectionPool.push(pool[i]);
      }
    }
    return chooseSequentialCompanionEntry(memberId + ':' + topicId, selectionPool) || ['……。'];
  }

  function getCompanionQuestionChoices(memberId) {
    var def = companionQuestionDefs[memberId];
    if (!def || !def.topics) return [];
    var choices = [];
    for (var i = 0; i < companionTopicMeta.length; i++) {
      var meta = companionTopicMeta[i];
      if (!def.topics[meta.id]) continue;
      choices.push({
        id: meta.id,
        label: meta.label,
        description: meta.description
      });
    }
    return choices;
  }

  function clearCompanionQuestionState() {
    companionQuestionState = null;
  }

  function showCompanionQuestionMenu(memberId, preserveState) {
    var choices = getCompanionQuestionChoices(memberId);
    if (!choices.length) {
      clearCompanionQuestionState();
      dialogIndex = 0;
      dialogLines = chooseCompanionDialogLines(memberId);
      onDialogEnd = null;
      setCurrentDialogPages();
      return getCurrentDialog();
    }

    if (!preserveState || !companionQuestionState || companionQuestionState.memberId !== memberId) {
      companionQuestionState = {
        active: true,
        memberId: memberId,
        index: 0,
        askedTopics: {}
      };
    } else {
      companionQuestionState.active = true;
      companionQuestionState.index = Math.max(0, Math.min(companionQuestionState.index || 0, choices.length - 1));
      companionQuestionState.askedTopics = companionQuestionState.askedTopics || {};
    }
    companionQuestionState.choices = choices;
    dialogIndex = 0;
    dialogLines = [getCompanionQuestionPrompt(memberId)];
    onDialogEnd = null;
    setCurrentDialogPages();
    window[AUTO_DIALOG_KEY] = getCurrentDialog();
    return getCurrentDialog();
  }

  function closeCurrentDialog(actionOverride) {
    var action = typeof actionOverride === 'undefined' ? onDialogEnd : actionOverride;
    var npc = currentNpc;
    currentNpc = null;
    dialogIndex = 0;
    dialogLines = [];
    resetDialogPagination();
    onDialogEnd = null;
    clearCompanionQuestionState();
    window[AUTO_DIALOG_KEY] = null;
    return { done: true, action: action || null, npc: npc };
  }

  function getDialogChoiceState() {
    if (!companionQuestionState || !companionQuestionState.active) return null;
    var options = companionQuestionState.choices || getCompanionQuestionChoices(companionQuestionState.memberId);
    if (!options.length) return null;
    var current = options[companionQuestionState.index] || options[0];
    return {
      title: '聞くこと',
      index: companionQuestionState.index,
      description: current ? current.description : '',
      options: options.map(function(option) {
        return {
          id: option.id,
          label: option.label,
          asked: !!(companionQuestionState.askedTopics && companionQuestionState.askedTopics[option.id])
        };
      })
    };
  }

  function resetDialogPagination() {
    dialogPages = [];
    dialogPageIndex = 0;
  }

  function setCurrentDialogPages() {
    var line = dialogIndex < dialogLines.length ? dialogLines[dialogIndex] : '';
    dialogPages = buildDialogPages(line);
    dialogPageIndex = 0;
  }

  function getMovementState(npc) {
    if (!npc || !npc.id) return null;
    if (!npcMovement[npc.id]) {
      npcMovement[npc.id] = {
        timer: 0,
        waypoint: 0,
        baseX: npc.x,
        baseY: npc.y,
        moveX: 1,
        moveY: 0,
        facing: npc.facing || 'down',
        fromX: npc.x,
        fromY: npc.y,
        targetX: npc.x,
        targetY: npc.y,
        moveProgress: 1,
        moving: false,
        waitTimer: randInt(90, 150),
        chasing: false,
        touchCooldown: 0
      };
    }
    return npcMovement[npc.id];
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getPlayerData() {
    return Game.Player && Game.Player.getData ? Game.Player.getData() : null;
  }

  function faceNpcTowardPlayer(npc) {
    var state = getMovementState(npc);
    var pd = getPlayerData();
    if (!state || !pd) return;
    var dx = pd.tileX - npc.x;
    var dy = pd.tileY - npc.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      state.facing = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      state.facing = dy > 0 ? 'down' : 'up';
    }
    npc.facing = state.facing;
  }

  function getContextDialogEntry(npc, defeated) {
    if (!npc || !npc.contextDialog || !npc.contextDialog.length || !Game.Story || !Game.Story.hasFlag) {
      return null;
    }
    for (var i = 0; i < npc.contextDialog.length; i++) {
      var entry = npc.contextDialog[i];
      if (!entry) continue;
      if (entry.defeatedOnly && !defeated) continue;
      if (entry.excludeDefeated && defeated) continue;
      if (entry.flag && !Game.Story.hasFlag(entry.flag)) continue;
      return entry;
    }
    return null;
  }

  function interact(npc) {
    if (!npc) return;
    faceNpcTowardPlayer(npc);
    currentNpc = npc;
    dialogIndex = 0;
    resetDialogPagination();
    clearCompanionQuestionState();

    var checkpointFailedOnce = Game.Story && Game.Story.hasFlag && Game.Story.hasFlag('checkpoint_failed_once');
    var contextDialog = getContextDialogEntry(npc, !!npc.defeated);

    if (npc.defeated) {
      // Shop NPCs always reopen
      if (npc.afterDialog && npc.afterDialog.indexOf('shop_') === 0) {
        dialogLines = contextDialog && contextDialog.lines ? contextDialog.lines : npc.dialog;
        onDialogEnd = contextDialog && contextDialog.action ? contextDialog.action : npc.afterDialog;
        return dialogLines[0];
      }
      if (contextDialog && contextDialog.lines) {
        dialogLines = contextDialog.lines;
        onDialogEnd = contextDialog.action || null;
      } else if (npc.defeatedDialog) {
        dialogLines = npc.defeatedDialog;
        onDialogEnd = null;
      } else {
        dialogLines = ['...'];
        onDialogEnd = null;
      }
      if (npc.id === 'cabbageGuardian' && Game.Player.hasAllKeys()) {
        dialogLines = ['結界は既に解かれておる。県境を越えよ！'];
      }
    } else if (npc.id === 'cabbageGuardian' && npc.allKeysDialog &&
               Game.Player.hasItem('onsenKey') && Game.Player.hasItem('darumaEye') &&
               Game.Player.hasItem('konnyakuPass')) {
      dialogLines = npc.allKeysDialog;
      onDialogEnd = npc.afterDialog;
    } else if (npc.id === 'ruined_checkpoint' && checkpointFailedOnce) {
      dialogLines = [
        '（崩れた関所の中心だけが、妙に空いて見える）',
        '（力ずくで削れた跡はあるのに、空洞だけがまだ塞がっていない）'
      ];
      onDialogEnd = npc.afterDialog || null;
    } else if (npc.id === 'cabbageGuardian') {
      dialogLines = npc.dialog;
      onDialogEnd = null;
    } else if (contextDialog && contextDialog.lines) {
      dialogLines = contextDialog.lines;
      onDialogEnd = contextDialog.action || npc.afterDialog || null;
    } else {
      dialogLines = npc.dialog;
      onDialogEnd = npc.afterDialog || null;
    }

    setCurrentDialogPages();
    return getCurrentDialog();
  }

  function openDialog(lines, action, speakerNpc) {
    currentNpc = speakerNpc || null;
    dialogIndex = 0;
    dialogLines = (lines || []).slice ? lines.slice() : [lines || ''];
    onDialogEnd = action || null;
    clearCompanionQuestionState();
    setCurrentDialogPages();
    return getCurrentDialog();
  }

  function openCompanionDialog(memberId) {
    var member = getPartyCompanionById(memberId);
    if (!member) return '';
    currentNpc = {
      id: 'companion_' + member.id,
      name: member.name
    };
    dialogIndex = 0;
    resetDialogPagination();
    if (hasCompanionQuestionDialog(memberId)) {
      return showCompanionQuestionMenu(memberId, false);
    }
    return openDialog(chooseCompanionDialogLines(memberId), null, currentNpc);
  }

  function advance() {
    window[AUTO_DIALOG_KEY] = null;
    if (dialogPageIndex < dialogPages.length - 1) {
      dialogPageIndex++;
      return { done: false, text: getCurrentDialog() };
    }

    dialogIndex++;
    if (dialogIndex >= dialogLines.length) {
      var action = onDialogEnd;
      if (action && action.internal === INTERNAL_DIALOG_ACTIONS.RESUME_COMPANION_TOPICS) {
        return {
          done: false,
          text: showCompanionQuestionMenu(action.memberId, true)
        };
      }
      return closeCurrentDialog(action);
    }
    setCurrentDialogPages();
    return { done: false, text: getCurrentDialog() };
  }

  function updateDialogInput() {
    if (companionQuestionState && companionQuestionState.active) {
      var options = companionQuestionState.choices || [];
      if (Game.Input.isPressed('up')) {
        companionQuestionState.index = (companionQuestionState.index - 1 + options.length) % options.length;
        return { done: false, text: getCurrentDialog(), sound: 'confirm' };
      }
      if (Game.Input.isPressed('down')) {
        companionQuestionState.index = (companionQuestionState.index + 1) % options.length;
        return { done: false, text: getCurrentDialog(), sound: 'confirm' };
      }
      if (Game.Input.isPressed('cancel')) {
        var closeResult = closeCurrentDialog(null);
        closeResult.sound = 'cancel';
        return closeResult;
      }
      if (!Game.Input.isPressed('confirm')) return null;
      var selected = options[companionQuestionState.index];
      if (!selected) return null;
      companionQuestionState.askedTopics[selected.id] = true;
      companionQuestionState.active = false;
      dialogIndex = 0;
      dialogLines = chooseCompanionTopicLines(companionQuestionState.memberId, selected.id);
      onDialogEnd = {
        internal: INTERNAL_DIALOG_ACTIONS.RESUME_COMPANION_TOPICS,
        memberId: companionQuestionState.memberId
      };
      setCurrentDialogPages();
      window[AUTO_DIALOG_KEY] = null;
      return { done: false, text: getCurrentDialog(), sound: 'confirm' };
    }

    if (!Game.Input.isPressed('confirm')) return null;
    var result = advance();
    if (result) {
      if (!result.done) {
        result.sound = 'confirm';
      } else if (!result.action) {
        result.sound = 'cancel';
      }
    }
    return result;
  }

  function showDefeatedDialog(npc) {
    if (!npc || !npc.defeatedDialog) return;
    currentNpc = npc;
    dialogIndex = 0;
    npc.defeated = true;
    dialogLines = npc.defeatedDialog.slice();
    clearCompanionQuestionState();

    var rewardItems = [];
    if (npc.giveItem) rewardItems.push(npc.giveItem);
    if (npc.giveItems && npc.giveItems.length) {
      for (var i = 0; i < npc.giveItems.length; i++) {
        rewardItems.push(npc.giveItems[i]);
      }
    }
    for (var r = 0; r < rewardItems.length; r++) {
      Game.Player.addItem(rewardItems[r]);
    }

    if (npc.giveDiceSlot && Game.Player && Game.Player.addDiceSlot && Game.Player.getData) {
      if (Game.Player.addDiceSlot()) {
        var pd = Game.Player.getData();
        dialogLines.push('「サイコロポーチ」を手に入れた。装備枠は' + pd.diceSlots + 'つになった。');
      }
    }
    setCurrentDialogPages();
    onDialogEnd = npc.afterDefeat || null;
  }

  function getCurrentDialog() {
    if (dialogPageIndex < dialogPages.length) {
      return dialogPages[dialogPageIndex];
    }
    return null;
  }

  function getCurrentNpc() {
    return currentNpc;
  }

  function getNpcDisplayName(npc) {
    if (!npc) return '';
    if (npc.aliasName) {
      var revealed = false;
      if (npc.nameRevealFlag && Game.Story && Game.Story.hasFlag) {
        revealed = Game.Story.hasFlag(npc.nameRevealFlag);
      }
      if (revealed || (!npc.nameRevealFlag && npc.defeated)) {
        return npc.name || '';
      }
      return npc.aliasName;
    }
    return npc.name || '';
  }

  function getCurrentNpcDisplayName() {
    return getNpcDisplayName(currentNpc);
  }

  function shouldHideNpc(npc) {
    if (!npc) return false;
    if (npc.hideWhenDefeated && npc.defeated) return true;
    if (npc.hideWhenFlag && Game.Story && Game.Story.hasFlag && Game.Story.hasFlag(npc.hideWhenFlag)) return true;
    if (npc.hideWhenPartyMember && Game.Player && Game.Player.hasPartyMember && Game.Player.hasPartyMember(npc.hideWhenPartyMember)) {
      return true;
    }
    if (npc.hideWhenAnyFlag && npc.hideWhenAnyFlag.length && Game.Story && Game.Story.hasFlag) {
      for (var i = 0; i < npc.hideWhenAnyFlag.length; i++) {
        if (Game.Story.hasFlag(npc.hideWhenAnyFlag[i])) return true;
      }
    }
    return false;
  }

  function getShopItemIdsFromAction(action) {
    if (!action || action.indexOf('shop_') !== 0) return [];
    var parts = action.substring(5).split('_');
    return parts[1] ? parts[1].split(',').filter(Boolean) : [];
  }

  function getNpcServiceType(npc) {
    if (!npc || npc.hideServiceIcon) return null;
    if (npc.serviceType) return npc.serviceType;

    var action = npc.afterDialog || '';
    if (action.indexOf('inn_') === 0) return 'inn';
    if (action.indexOf('shop_') !== 0) return null;

    var itemIds = getShopItemIdsFromAction(action);
    for (var i = 0; i < itemIds.length; i++) {
      var item = Game.Items && Game.Items.get ? Game.Items.get(itemIds[i]) : null;
      if (item && (item.type === 'dice' || item.type === 'diceSlot')) {
        return 'dice_shop';
      }
    }
    return 'item_shop';
  }

  function drawNpcServiceIcon(npc, renderPos) {
    var serviceType = getNpcServiceType(npc);
    var iconDef = SERVICE_ICONS[serviceType];
    if (!iconDef || !renderPos || !Game.Renderer) return;

    var bob = Math.round(Math.sin(Date.now() / 220 + (npc.x || 0) * 0.8 + (npc.y || 0) * 0.6) * 1);
    var baseX = Math.floor(renderPos.x + 4);
    var baseY = Math.floor(renderPos.y - 8 + bob);

    Game.Renderer.drawRect(baseX - 2, baseY - 2, 10, 10, iconDef.frame);
    Game.Renderer.drawRect(baseX - 1, baseY - 1, 8, 8, '#0c1324');
    Game.Renderer.drawSprite(iconDef.sprite, baseX - 1, baseY - 1, iconDef.palette);
  }

  function canOccupyTile(npc, npcs, x, y) {
    if (!Game.Map || !Game.Map.isPassable || !Game.Map.isPassable(x, y)) {
      return false;
    }

    for (var i = 0; i < npcs.length; i++) {
      var other = npcs[i];
      if (!other || other === npc || shouldHideNpc(other)) continue;
      var otherState = getMovementState(other);
      if (other.x === x && other.y === y) return false;
      if (otherState && otherState.moving && otherState.targetX === x && otherState.targetY === y) {
        return false;
      }
    }
    return true;
  }

  function startMove(npc, state, targetX, targetY) {
    state.fromX = npc.x;
    state.fromY = npc.y;
    state.targetX = targetX;
    state.targetY = targetY;
    state.moveProgress = 0;
    state.moving = true;

    if (targetX > npc.x) state.facing = 'right';
    else if (targetX < npc.x) state.facing = 'left';
    else if (targetY > npc.y) state.facing = 'down';
    else if (targetY < npc.y) state.facing = 'up';
    npc.facing = state.facing;
  }

  function finishMove(npc, state) {
    npc.x = state.targetX;
    npc.y = state.targetY;
    state.fromX = npc.x;
    state.fromY = npc.y;
    state.moveProgress = 1;
    state.moving = false;
  }

  function updateMovingNpc(npc, state) {
    if (!state.moving) return false;
    state.moveProgress += 1 / 30;
    if (state.moveProgress >= 1) {
      finishMove(npc, state);
    }
    return true;
  }

  function updatePace(npc, state, npcs) {
    state.timer++;
    if (state.timer % 120 === 0) {
      state.moveX *= -1;
    }
    if (state.timer % 30 !== 0) return;

    var nextX = npc.x + state.moveX;
    var minX = state.baseX - 2;
    var maxX = state.baseX + 2;
    if (nextX < minX || nextX > maxX || !canOccupyTile(npc, npcs, nextX, npc.y)) {
      state.moveX *= -1;
      nextX = npc.x + state.moveX;
    }
    if (nextX >= minX && nextX <= maxX && canOccupyTile(npc, npcs, nextX, npc.y)) {
      startMove(npc, state, nextX, npc.y);
    }
  }

  function updatePatrol(npc, state, npcs) {
    if (!npc.waypoints || !npc.waypoints.length) return;
    state.timer++;
    if (state.timer % 30 !== 0) return;

    var point = npc.waypoints[state.waypoint] || npc.waypoints[0];
    if (!point) return;
    if (npc.x === point.x && npc.y === point.y) {
      state.waypoint = (state.waypoint + 1) % npc.waypoints.length;
      point = npc.waypoints[state.waypoint];
    }
    if (!point) return;

    var dx = point.x === npc.x ? 0 : (point.x > npc.x ? 1 : -1);
    var dy = dx === 0 && point.y !== npc.y ? (point.y > npc.y ? 1 : -1) : 0;
    var targetX = npc.x + dx;
    var targetY = npc.y + dy;
    if ((dx !== 0 || dy !== 0) && canOccupyTile(npc, npcs, targetX, targetY)) {
      startMove(npc, state, targetX, targetY);
    } else if (npc.x === point.x && npc.y === point.y) {
      state.waypoint = (state.waypoint + 1) % npc.waypoints.length;
    }
  }

  function updateWander(npc, state, npcs) {
    state.waitTimer--;
    if (state.waitTimer > 0) return;
    state.waitTimer = randInt(90, 150);

    var options = [
      { x: npc.x + 1, y: npc.y },
      { x: npc.x - 1, y: npc.y },
      { x: npc.x, y: npc.y + 1 },
      { x: npc.x, y: npc.y - 1 }
    ];

    for (var i = options.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = options[i];
      options[i] = options[j];
      options[j] = tmp;
    }

    for (var k = 0; k < options.length; k++) {
      var option = options[k];
      if (Math.abs(option.x - state.baseX) > 3 || Math.abs(option.y - state.baseY) > 3) continue;
      if (canOccupyTile(npc, npcs, option.x, option.y)) {
        startMove(npc, state, option.x, option.y);
        break;
      }
    }
  }

  function tryAutoDialog(npc, state) {
    if (state.touchCooldown > 0 || currentNpc || !Game.Main || !Game.Main.setState || !Game.UI) {
      return false;
    }
    var text = interact(npc);
    if (!text) return false;
    window[AUTO_DIALOG_KEY] = text;
    state.touchCooldown = 60;
    Game.Main.setState(Game.Config.STATE.DIALOG);
    if (Game.Audio && Game.Audio.playSfx) {
      Game.Audio.playSfx('confirm');
    }
    return true;
  }

  function updateChase(npc, state, npcs) {
    var pd = getPlayerData();
    if (!pd) return;

    var distance = Math.abs(pd.tileX - npc.x) + Math.abs(pd.tileY - npc.y);
    if (!state.chasing && distance <= 5) {
      state.chasing = true;
    } else if (state.chasing && distance > 7) {
      state.chasing = false;
    }

    if (distance === 0) {
      tryAutoDialog(npc, state);
      return;
    }

    if (!state.chasing) return;

    state.timer++;
    if (state.timer % 45 !== 0) return;

    var dx = pd.tileX > npc.x ? 1 : (pd.tileX < npc.x ? -1 : 0);
    var dy = pd.tileY > npc.y ? 1 : (pd.tileY < npc.y ? -1 : 0);
    var targetX = npc.x;
    var targetY = npc.y;

    if (Math.abs(pd.tileX - npc.x) >= Math.abs(pd.tileY - npc.y) && dx !== 0) {
      targetX += dx;
      state.facing = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      targetY += dy;
      state.facing = dy > 0 ? 'down' : 'up';
    }

    npc.facing = state.facing;
    if ((targetX !== npc.x || targetY !== npc.y) && canOccupyTile(npc, npcs, targetX, targetY)) {
      startMove(npc, state, targetX, targetY);
    }
  }

  function initMovement(npcs) {
    npcMovement = {};
    if (!npcs) return;
    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];
      if (!npc) continue;
      var state = getMovementState(npc);
      state.baseX = npc.x;
      state.baseY = npc.y;
      state.fromX = npc.x;
      state.fromY = npc.y;
      state.targetX = npc.x;
      state.targetY = npc.y;
      state.moveProgress = 1;
      state.moving = false;
      state.timer = 0;
      state.waypoint = 0;
      state.waitTimer = randInt(90, 150);
      state.facing = npc.facing || 'down';
      state.touchCooldown = 0;
      state.chasing = false;
      npc.facing = state.facing;
      if (!npc.movement) npc.movement = 'static';
    }
  }

  function updateMovement(npcs) {
    if (!npcs || !npcs.length) return false;
    var changed = false;

    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];
      if (!npc || npc.defeated || shouldHideNpc(npc)) continue;
      var state = getMovementState(npc);
      if (state.touchCooldown > 0) state.touchCooldown--;

      if (updateMovingNpc(npc, state)) {
        changed = true;
        continue;
      }

      switch (npc.movement || 'static') {
        case 'pace':
          updatePace(npc, state, npcs);
          break;
        case 'patrol':
          updatePatrol(npc, state, npcs);
          break;
        case 'wander':
          updateWander(npc, state, npcs);
          break;
        case 'chase':
          updateChase(npc, state, npcs);
          break;
      }
      if (state.moving) changed = true;
    }

    return changed;
  }

  function getNpcRenderPos(npc) {
    var state = getMovementState(npc);
    var ts = Game.Config.TILE_SIZE;
    if (!state || !state.moving) {
      return { x: npc.x * ts, y: npc.y * ts };
    }
    var renderX = (state.fromX + (state.targetX - state.fromX) * state.moveProgress) * ts;
    var renderY = (state.fromY + (state.targetY - state.fromY) * state.moveProgress) * ts;
    return { x: renderX, y: renderY };
  }

  function hookRuntimeIntegrations() {
    if (Game.Map && !Game.Map.__npcMovementPatched) {
      Game.Map.__npcMovementPatched = true;
      var originalLoad = Game.Map.load;
      var originalGetCurrentMap = Game.Map.getCurrentMap;
      var originalDraw = Game.Map.draw;

      Game.Map.load = function(mapId, spawnX, spawnY) {
        originalLoad(mapId, spawnX, spawnY);
        var map = originalGetCurrentMap();
        if (map && map.npcs) {
          initMovement(map.npcs);
        }
      };

      Game.Map.draw = function() {
        var map = originalGetCurrentMap();
        if (!map) return originalDraw();

        for (var y = 0; y < Game.Config.MAP_ROWS; y++) {
          for (var x = 0; x < Game.Config.MAP_COLS; x++) {
            Game.Renderer.drawTile(map.tiles[y][x], x, y);
          }
        }

        if (map.items) {
          for (var i = 0; i < map.items.length; i++) {
            var item = map.items[i];
            if (!item.taken) {
              var ts = Game.Config.TILE_SIZE;
              var px = item.x * ts;
              var py = item.y * ts;
              var t = Date.now() / 300;
              var brightness = Math.sin(t) * 0.3 + 0.7;
              var r = Math.floor(255 * brightness);
              var g = Math.floor(200 * brightness);
              Game.Renderer.drawRect(px + 4, py + 4, 8, 8, 'rgb(' + r + ',' + g + ',0)');
              Game.Renderer.drawRect(px + 6, py + 6, 4, 4, '#fff');
            }
          }
        }

        if (map.npcs) {
          for (var n = 0; n < map.npcs.length; n++) {
            var npc = map.npcs[n];
            if (shouldHideNpc(npc)) continue;
            var renderPos = getNpcRenderPos(npc);
            var state = getMovementState(npc);
            var flipped = state && state.facing === 'right';
            Game.Renderer.drawSprite(npc.sprite, renderPos.x, renderPos.y, npc.palette, flipped);
            drawNpcServiceIcon(npc, renderPos);
          }
        }
      };
    }

    if (Game.Player && !Game.Player.__npcMovementPatched) {
      Game.Player.__npcMovementPatched = true;
      var originalPlayerUpdate = Game.Player.update;
      Game.Player.update = function() {
        originalPlayerUpdate();
        var map = Game.Map && Game.Map.getCurrentMap ? Game.Map.getCurrentMap() : null;
        if (map && map.npcs) {
          updateMovement(map.npcs);
        }
      };
    }

    if (Game.UI && !Game.UI.__npcAutoDialogPatched) {
      Game.UI.__npcAutoDialogPatched = true;
      var originalDrawDialog = Game.UI.drawDialog;
      Game.UI.drawDialog = function(text) {
        originalDrawDialog(window[AUTO_DIALOG_KEY] || text);
      };
    }
  }

  window.addEventListener('load', hookRuntimeIntegrations);

  return {
    interact: interact,
    advance: advance,
    updateDialogInput: updateDialogInput,
    showDefeatedDialog: showDefeatedDialog,
    getCurrentDialog: getCurrentDialog,
    getCurrentNpc: getCurrentNpc,
    getCurrentNpcDisplayName: getCurrentNpcDisplayName,
    getDialogChoiceState: getDialogChoiceState,
    shouldHideNpc: shouldHideNpc,
    getNpcServiceType: getNpcServiceType,
    openDialog: openDialog,
    openCompanionDialog: openCompanionDialog,
    updateMovement: updateMovement,
    getNpcRenderPos: getNpcRenderPos,
    initMovement: initMovement
  };
})();
