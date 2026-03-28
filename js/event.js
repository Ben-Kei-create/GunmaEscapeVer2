// Event scene system - full-screen story/cutscene display
Game.Event = (function() {
  var active = false;
  var scenes = [];       // array of scene objects
  var sceneIndex = 0;
  var lineIndex = 0;
  var charIndex = 0;     // for typewriter effect
  var charTimer = 0;
  var charSpeed = 2;     // frames per character
  var fadeAlpha = 0;
  var fadeDir = 0;       // 1 = fading in, -1 = fading out, 0 = none
  var waitTimer = 0;
  var onComplete = null;
  var textComplete = false;
  var autoAdvanceTimer = 0;
  var MAX_EVENT_CHARS_PER_LINE = 23;
  var TRAILING_PUNCTUATION = '、。！？…）)]」』】';

  // Scene format:
  // {
  //   bg: '#color' or 'pattern_name',
  //   speaker: 'Name' or null,
  //   speakerColor: '#color',
  //   lines: ['line1', 'line2', ...],
  //   effect: 'fade' | 'shake' | null,
  //   bgm: 'bgm_name' or null,
  //   sfx: 'sfx_name' or null
  // }

  // Predefined event scripts
  var events = {
    // Opening mini-movie when starting a new game
    opening: [
      {
        bg: '#060814',
        motion: 'road_trip',
        bgm: 'sad',
        speaker: null,
        lines: [
          '深夜の関越道。ワゴン車は、群馬へ向かっていた。',
          'くだらない笑い声と、見慣れた横顔だけが、暗闇の中で揺れている。'
        ],
        autoAdvance: 150
      },
      {
        bg: '#0b0f1b',
        motion: 'van_memory',
        speaker: null,
        lines: [
          'サトウ、フルヤ、ヤマカワ――',
          '名前だけが、ヘッドライトの残像みたいに浮かんでは消えていく。'
        ],
        autoAdvance: 150
      },
      {
        bg: '#101420',
        motion: 'border_glitch',
        sfx: 'critical',
        effect: 'shake',
        speaker: null,
        lines: [
          '県境を越えた瞬間、景色がノイズ混じりに裂けた。',
          '白線もガードレールも、群馬の闇に飲み込まれていく。'
        ],
        autoAdvance: 165
      },
      {
        bg: '#0b1510',
        motion: 'forest_wake',
        speaker: null,
        lines: [
          '気がつくと、朽ちた森の地面にひとりで倒れていた。',
          '空には、鶴の形に裂けた赤いひびだけが残っている。'
        ],
        autoAdvance: 165
      },
      {
        bg: '#161326',
        motion: 'dawn_frontier',
        speaker: '主人公',
        speakerColor: '#88aaff',
        lines: [
          '……ここは前橋？ どうして、ひとりなんだ。',
          '喉の奥に、知らない地名ばかりが引っかかっている。'
        ],
        effect: 'fade',
        autoAdvance: 180
      },
      {
        bg: '#101726',
        motion: 'dawn_frontier',
        speaker: null,
        lines: [
          '道の向こうで、青い上着の男がじっとこちらを見ていた。',
          '群馬の誇りと悲哀を辿る旅が、静かに始まる。'
        ],
        effect: 'fade',
        autoAdvance: 210
      }
    ],

    special_dice_intro: [
      {
        bg: '#17121f',
        speaker: null,
        lines: [
          '手のひらのだるまサイコロが、白い熱を帯びて脈打った。',
          'ただ目が強いだけじゃない。',
          'この土地の願い癖そのものが、出目に染みついている。'
        ],
        effect: 'fade'
      },
      {
        bg: '#141824',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'それが特殊サイコロだ。',
          '群馬の誇りや未練が、道具のかたちで固まったもんだと思え。',
          '強いぶん癖も強い。土地の気分に合わせて持ち替えろ。'
        ]
      },
      {
        bg: '#100f1c',
        speaker: '主人公',
        speakerColor: '#88aaff',
        lines: [
          '武器じゃなく、場所の性格を借りる感じか……。',
          'なら数を増やすより、今の枠で何を持つかのほうが大事だ。'
        ]
      }
    ],

    gururin: [
      {
        bg: '#0f1420',
        motion: 'gururin_stop',
        speaker: null,
        lines: [
          '高崎の交差点に、緑の車体が音もなく滑り込んできた。',
          'フロントガラスの行き先表示には、丸い文字で「ぐるりん」と浮かんでいる。'
        ],
        effect: 'fade'
      },
      {
        bg: '#111926',
        motion: 'gururin_loop',
        speaker: '車内アナウンス',
        speakerColor: '#8fd7a1',
        lines: [
          'まもなく、もてなし広場前。高崎中心市街地を巡回します。',
          '外へ向かうように見えて、路線図は町の内側を円でなぞるばかりだった。'
        ]
      },
      {
        bg: '#12101d',
        motion: 'gururin_loop',
        speaker: '主人公',
        speakerColor: '#88aaff',
        lines: [
          '逃げ道かと思ったのに、ここでも円を描くのか……。',
          '群馬は、出ていく道まで土地の記憶に巻き取ってくる。'
        ]
      },
      {
        bg: '#0d1320',
        motion: 'gururin_stop',
        speaker: null,
        lines: [
          'ぐるりんは交差点をひと回りすると、同じ停留所へ静かに戻ってきた。',
          '閉まりかけた扉のすきまから、町の鼓動みたいな灯だけが漏れている。'
        ],
        effect: 'fade'
      }
    ],

    arrival_takasaki_auto: [
      {
        bg: '#111726',
        motion: 'akagi_approach',
        speaker: null,
        lines: [
          '高崎の路地へ足を踏み入れた瞬間、青い上着が横切った。',
          'アカギは二、三歩先で振り返り、だるま棚のほうへ顎をしゃくる。'
        ]
      },
      {
        bg: '#151120',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'この町は願掛けの抜け殻が多い。しゃべる前に、先に見ろ。',
          '赤い殻が多いほど、空っぽの祈りも多いってことだ。'
        ]
      }
    ],

    arrival_shimonita_auto: [
      {
        bg: '#151216',
        motion: 'akagi_approach',
        speaker: null,
        lines: [
          '山あいの荷札を眺めていると、アカギが無言で木箱を蹴って止めた。',
          '箱の継ぎ目から、積み残された誇りみたいな息が白く漏れる。'
        ]
      },
      {
        bg: '#131823',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'ここは化け物が先にいたわけじゃない。',
          '止まった荷が、怒りより先に未練になった土地だ。'
        ]
      }
    ],

    arrival_tomioka_auto: [
      {
        bg: '#10131d',
        motion: 'akagi_approach',
        speaker: null,
        lines: [
          '製糸場の影へ入ると、アカギが前へ出て手をひらいた。',
          '止まらない糸の音だけが、先へ行くなと細く鳴っている。'
        ]
      },
      {
        bg: '#17121e',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'ここは切るより、ほどく土地だ。',
          '強く引いたら負ける。手つきで覚えろ。'
        ]
      }
    ],

    arrival_kusatsu_auto: [
      {
        bg: '#11181b',
        motion: 'akagi_approach',
        speaker: null,
        lines: [
          '湯気の切れ目へ踏み込んだ瞬間、白い幕の向こうからアカギが現れた。',
          '長い板を肩に担いだまま、湯畑の縁を指でとんとん叩いてくる。'
        ]
      },
      {
        bg: '#16111e',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'ここは熱さを力で越える土地じゃない。少しずつ冷まして、飲み込め。',
          '急いだ奴から、湯気の向こうへ置いていかれる。'
        ]
      }
    ],

    arrival_ikaho_auto: [
      {
        bg: '#16131a',
        motion: 'akagi_approach',
        speaker: null,
        lines: [
          '石段を見上げたところで、アカギが一段上から靴音を鳴らした。',
          '追い抜かせる気のない歩幅で、先の暗がりだけを顎で示している。'
        ]
      },
      {
        bg: '#18121a',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'この町は上へ行くほど息が切れる。見えてる段数より、心のほうが先に試される。',
          '焦って駆けるな。石は急いだ足をちゃんと覚える。'
        ]
      }
    ],

    arrival_akagi_ranch_auto: [
      {
        bg: '#10171a',
        motion: 'akagi_approach',
        speaker: null,
        lines: [
          '牧柵の影が伸びたあたりで、アカギが前へ回り込んできた。',
          '山の風だけが強く、言葉より先にこの先の冷たさを知らせてくる。'
        ]
      },
      {
        bg: '#14131e',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          '赤城の奥は、景色が広いほど逃げ場がない。',
          '足を止めたら飲まれる。見るなら遠くより、まず足元だ。'
        ]
      }
    ],

    gururin_network: [
      {
        bg: '#0f1522',
        motion: 'gururin_stop',
        speaker: null,
        lines: [
          '学園の門前へ出ると、見覚えのある緑の車体が静かに停まっていた。',
          '行き先表示は高崎ではなく、群馬じゅうの地名を順番に滲ませている。'
        ]
      },
      {
        bg: '#111926',
        motion: 'gururin_loop',
        speaker: '車内アナウンス',
        speakerColor: '#8fd7a1',
        lines: [
          'ぐるりん回送網、開通しました。',
          '一度たどった停留所へ、循環便が順次お連れします。'
        ]
      },
      {
        bg: '#13131f',
        speaker: '主人公',
        speakerColor: '#88aaff',
        lines: [
          '高崎だけの足じゃなかったのか。',
          'これなら後半の町も、一気に行き来できる。'
        ]
      }
    ],

    // === Chapter 1 Ending → Chapter 2 Transition ===
    ch1_ending: [
      {
        bg: '#1a1028',
        speaker: null,
        lines: [
          '県境に張りついていた光の壁が、',
          '耳をつんざく音とともに砕け散った。',
          '出口だ――そう思った瞬間、足元の地面まで震えた。'
        ],
        sfx: 'victory'
      },
      {
        bg: '#1a2030',
        speaker: null,
        lines: [
          '振り返ると、湯けむりの町、無言で並ぶだるま、',
          'ぬめるこんにゃく、風に揺れる嬬恋キャベツが脳裏をよぎる。',
          '短いはずの旅は、もう思い出の形をしていた。'
        ]
      },
      {
        bg: '#08110c',
        speaker: null,
        lines: [
          'だが県境の向こうに広がっていたのは自由ではなかった。',
          'そこには、さらに深く、さらに濃い',
          '"群馬の森"が待っていた。'
        ],
        effect: 'shake'
      },
      {
        bg: '#0a1a0a',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'おい……生きてるか？',
          '立てるなら来い。',
          'ここで倒れてたら、本当に群馬に喰われるぞ。'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '第一章 群馬脱出編 ―― END'
        ],
        effect: 'fade'
      }
    ],

    // === Chapter 2 Opening ===
    ch2_opening: [
      {
        bg: '#101020',
        speaker: null,
        lines: [
          '第二章 赤城の闇編'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: null,
        lines: [
          '冷たい土の匂いで目を覚ます。',
          'たしかに県境は越えたはずだった。',
          'なのに視界を埋めるのは、またしても群馬の暗い森だった。'
        ]
      },
      {
        bg: '#0f1820',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          '俺はアカギ。タムラ村の人間だ。',
          'この辺りを荒らしてる"暗鞍"は、',
          '昔は荷を運んでいたトラック運転手たちだ。',
          '高速が閉じて仕事を失ってから、',
          '連中は名まで忘れて、ナンバープレートで呼び合う賊になった。'
        ]
      },
      {
        bg: '#1a1430',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          '村には村長の龝櫻（シュウオウ）がいる。',
          'ここじゃ敬意がなければ勝負も始まらない。',
          '生き残る方法は博打だけ――',
          'シュウオウにもらう特別なサイコロを使いこなせ。'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '新たな冒険が始まる……',
          '特別なダイスの力を使いこなせ！'
        ],
        effect: 'fade'
      }
    ],

    // Pre-Chuji boss event
    preChuji: [
      {
        bg: '#1a1a2a',
        bgm: 'melancholy_intro',
        speaker: null,
        lines: [
          '霧に沈んだ廃牧場。',
          '崩れた柵の向こうに、',
          '人とも影ともつかぬ威圧的な姿が立っていた。'
        ]
      },
      {
        bg: '#1a1a2a',
        speaker: '国定忠治',
        speakerColor: '#ffcc44',
        lines: [
          '賭けの奥へ踏み込むのは危ねぇぞ。',
          'おめぇさんはもう、一歩そっち側へ足を入れちまってる。',
          '俺は盗人だった。死体まで盗まれた男の忠告だ。'
        ]
      },
      {
        bg: '#141428',
        speaker: null,
        lines: [
          '敬意がなければ勝負は始まらない。',
          'それでも、お前は戦うのか？'
        ],
        effect: 'shake'
      }
    ],

    // Pre-Angura Boss event
    preAnguraBoss: [
      {
        bg: '#0a1a2a',
        speaker: null,
        lines: [
          '赤城神社の闇に、巨大な影がうごめく。',
          '軋む車輪の音とともに、',
          'それは山ほどの荷車を引いて現れた。'
        ]
      },
      {
        bg: '#101020',
        speaker: 'ナンバー12-グンマ',
        speakerColor: '#ff4444',
        lines: [
          '俺たちはただの運び屋だった……。',
          '名前なんて忘れた、残ったのはナンバープレートだけだ。',
          '届ける場所を失って、俺たちは荷物より先に自分をなくした。'
        ]
      },
      {
        bg: '#180808',
        speaker: null,
        lines: [
          'ここは配達人たちの墓場だ！！'
        ],
        effect: 'shake'
      }
    ],

    // === Chapter 3 Opening / Ending ===
    ch3_opening: [
      { bg: '#2a1a0a', speaker: null, lines: ['白根山への登山道。', '鼻を突く強い硫黄の匂いが、風に乗って漂ってくる。', '地面からは絶えず熱を帯びた蒸気が噴き出していた。'] },
      { bg: '#2a1a0a', speaker: 'アカギ', speakerColor: '#cc6633', lines: ['……気をつけろ。この山の気は強すぎる。', '私の体も、なんだか重く……いや、硬くなってきているようだ。', '石化の呪い……この結界の主の仕業か。'] },
      { bg: '#1a1a2a', speaker: '主人公', speakerColor: '#88aaff', lines: ['アカギの腕に、少しずつ岩のようなヒビが走っている。', '早く山の主を止めなければ、彼が完全に石になってしまう。', '先を急ごう。'], effect: 'fade' }
    ],
    ch3_ending: [
      { bg: '#1a1a2a', speaker: '熊子', speakerColor: '#884433', lines: ['ああ……熱が、冷めていく……。', '私はただ、この山を、源泉を守りたかっただけなのに……。', 'どうか……群馬を……。'] },
      { bg: '#1a1a2a', speaker: 'アカギ', speakerColor: '#cc6633', lines: ['熊子……お前の願い、確かに受け取ったぞ。', 'だが、私の時間はここまでらしい。', 'すまない……あとは、頼んだ……ぞ……。'] },
      { bg: '#000000', speaker: null, lines: ['アカギの体は完全に硬直した。', 'ただの冷たい石像と化してしまった彼の手に、', '熊子が遺した「浄化の石」が握られている。', 'この石の力があれば、あるいは……。'], effect: 'fade' }
    ],

    // === Chapter 4 Opening / Ending ===
    ch4_opening: [
      { bg: '#1a2a3a', speaker: null, lines: ['草津温泉の深奥。', '視界を遮るほどの青白い蒸気が立ち込めている。', 'だが、その熱気にはどこか不自然な冷たさが混じっていた。'] },
      { bg: '#1a2a3a', speaker: '龝櫻', speakerColor: '#555566', lines: ['気をつけるんじゃな。ここの湯煙は輪郭を溶かす。', '過剰な癒やしに溺れれば、己の存在すら忘れてしまうぞ。', 'お主のその「記憶喪失」も、ここの毒にあてられた結果かもしれん。'] },
      { bg: '#1a2a3a', speaker: '主人公', speakerColor: '#88aaff', lines: ['自分の過去すら思い出せないのに、これ以上何を奪われるというのか。', 'だが、立ち止まるわけにはいかない。', '温泉の異常を止め、源泉の奥へと進むしかない。'], effect: 'fade' }
    ],
    ch4_ending: [
      { bg: '#1a2a3a', speaker: null, lines: ['湯畑の守護者が崩れ落ちると同時、', '周囲を覆っていた異常な蒸気がスッと引いていった。', '源泉の鼓動が、本来のリズムを取り戻しつつある。'] },
      { bg: '#1a2a3a', speaker: '龝櫻', speakerColor: '#555566', lines: ['見事じゃ。源泉の暴走は止まったようだな。', 'だが、群馬全土を覆う侵食が止まったわけではない。', 'この先は、さらに歪んだ結界が待ち受けておるはずじゃ。'] },
      { bg: '#000000', speaker: '主人公', speakerColor: '#88aaff', lines: ['浄化の石が、かすかに光を帯びている。', 'アカギを元に戻す方法は、まだ見つからない。', 'それでも、俺は先へ進む。'], effect: 'fade' }
    ],

    // === Chapter 5 Opening / Ending ===
    ch5_opening: [
      { bg: '#0a0a1a', speaker: null, sfx: 'confirm', lines: ['キィン、コォン……カァン、コォン……。', '不協和音のように歪んだチャイムが、廃校の廊下に響き渡る。', '壁の時計は、すべて同じ時間を指して止まっていた。'] },
      { bg: '#0a0a1a', speaker: '佐藤', speakerColor: '#5588cc', lines: ['あ、あれ……？ 俺は、なんでこんなところに……。', 'そうだ、俺はここの生徒で……今日も補習を受けなきゃ……。', '先生が怒る……早く教室に戻らないと……。'] },
      { bg: '#0a0a1a', speaker: '主人公', speakerColor: '#88aaff', lines: ['佐藤の様子がおかしい。瞳の焦点が合っていない。', 'この学園の空間そのものが、彼の記憶を書き換えているのか？', '彼を正気に戻さなければ！'], effect: 'fade' }
    ],
    ch5_ending: [
      { bg: '#0a0a1a', speaker: 'ジューク', speakerColor: '#ff4444', lines: ['ふふ……ルールの書き換えに抵抗するとは、予想外です。', 'ですが、彼の「記録」は既に壊れていますよ。', 'せいぜい、壊れたおもちゃを引きずって歩くことですね。'] },
      { bg: '#0a0a1a', speaker: '佐藤', speakerColor: '#5588cc', lines: ['うぁぁっ……頭が……割れるように痛い……！', '俺の……俺の記憶は……どこからが本物なんだ！？', '誰か……助けてくれ……！'] },
      { bg: '#000000', speaker: null, lines: ['ジュークが姿を消すと、学園の壁がボロボロと崩れ始めた。', '佐藤の記憶は混濁したままだが、今は脱出が先だ。', '崩壊する学園を背に、闇の中へと走り出した。'], effect: 'fade' }
    ],

    // === Chapter 6 Opening / Ending ===
    ch6_opening: [
      { bg: '#ccddee', speaker: null, lines: ['谷川岳の地下トンネルへ続く道。', '猛烈な吹雪が、体温と視界を容赦なく奪っていく。', '一歩踏み外せば、永遠に雪の底へ沈みそうだ。'] },
      { bg: '#ccddee', speaker: '龝櫻', speakerColor: '#555566', lines: ['待て。この吹雪の中で、決して己の「名」を名乗るな。', 'ここは音と名前を喰らう場所。不用意に声を出せば存在ごと消される。', '……それと、お主の持っているその石、雪の力と共鳴しておるな？'] },
      { bg: '#1a1a2a', speaker: '主人公', speakerColor: '#88aaff', lines: ['手元の「浄化の石」が、脈打つように熱を放っている。', 'もしかして、この力を使えばアカギの石化を解けるかもしれない。', 'トンネルの奥に、その答えがあるはずだ。'], effect: 'fade' }
    ],
    ch6_ending: [
      { bg: '#1a1a2a', speaker: '佐藤', speakerColor: '#5588cc', lines: ['ハァ、ハァ……俺は、今まで何を……？', 'お前と戦って……記憶が、少しずつ繋がってきた。', 'ごめん、もう大丈夫だ。俺は俺を取り戻したよ。'] },
      { bg: '#1a1a2a', speaker: 'アカギ', speakerColor: '#cc6633', lines: ['……フゥッ。長き石の眠りから、ようやく目覚めたぞ！', 'お前たち、よくやってくれた。浄化の石の力、確かにこの身に受けた。', 'さあ、反撃の狼煙を上げようじゃないか！'] },
      { bg: '#000000', speaker: '主人公', speakerColor: '#88aaff', lines: ['佐藤の瞳に光が戻り、アカギの頼もしい声が響く。', '失いかけた仲間が、再びパーティに揃った。', 'どんな結界が来ようと、今の俺たちなら突破できる。'], effect: 'fade' }
    ],

    // === Chapter 7 Opening / Ending ===
    ch7_opening: [
      { bg: '#2a3a4a', speaker: null, bgm: 'field', lines: ['榛名湖畔。', '一寸先も見えないほどの濃霧が、湖面をすっぽりと覆い隠している。', '静寂の中、ピチャ……ピチャ……という不気味な水音が響く。'] },
      { bg: '#2a3a4a', speaker: '山川', speakerColor: '#77aa55', lines: ['……誰かと思えば、君たちか。無事でよかった。', 'この湖、明らかに普通じゃない。自然の生態系が完全に狂っているわ。', '霧の奥で、巨大な「何か」が蠢いているのがわかる。'] },
      { bg: '#2a3a4a', speaker: '主人公', speakerColor: '#88aaff', lines: ['山川との再会を喜ぶ暇もなく、足元の地面が微かに揺れた。', '湖の底から、底知れぬ悪意がこちらを狙っている。', '武器を構え、濃霧の奥へと目を凝らした。'], effect: 'fade' }
    ],
    ch7_ending: [
      { bg: '#2a3a4a', speaker: '山川', speakerColor: '#77aa55', lines: ['湖獣は沈んだわ。霧も……少しずつ晴れてきている。', '自然の調和を取り戻すには時間がかかるだろうけど、', 'これ以上、あいつの好きにはさせないわ。私も一緒に行く！'] },
      { bg: '#2a3a4a', speaker: 'ジューク', speakerColor: '#ff4444', lines: ['（遠くから響く声）……仲間が増えて、さぞ心強いでしょうね。', 'ですが、絆などという不確かなもので、この結界は壊せません。', '次は、泥の底でお会いしましょう……。'] },
      { bg: '#000000', speaker: null, lines: ['霧の向こうに一瞬だけ見えた赤い影は、幻のように消えた。', '山川が仲間に加わり、戦力は増した。', 'ジュークを追い、俺たちはさらに深い群馬の闇へと進む。'], effect: 'fade' }
    ],

    // === Chapter 8 Opening / Ending ===
    ch8_opening: [
      { bg: '#1a2a1a', speaker: null, lines: ['尾瀬の湿原。', '美しいはずの自然は腐敗し、緑色の泥がどこまでも続いている。', '一歩踏み出すたびに、足が泥濘に深く沈み込んだ。'] },
      { bg: '#1a2a1a', speaker: 'ジューク', speakerColor: '#ff4444', lines: ['おや、足元にはお気をつけください。', 'そこの泥は、一度沈めば二度と浮かび上がれませんから。', '正しいルートを選ばなければ、永遠にここで息継ぎですよ。'] },
      { bg: '#1a2a1a', speaker: '主人公', speakerColor: '#88aaff', lines: ['挑発するようなジュークの言葉。', 'だが、進むしかない。この泥の海を越えなければ、', '群馬からの脱出はあり得ないのだから。'], effect: 'fade' }
    ],
    ch8_ending: [
      { bg: '#1a2a1a', speaker: null, lines: ['泥異形が崩れ落ちると同時、周囲の泥濘が少しだけ固さを取り戻した。', 'ふと、泥の中に落ちている見慣れたスマートフォンを見つける。', '画面には泥がこびりついているが、電源は入っている。'] },
      { bg: '#1a2a1a', speaker: '主人公', speakerColor: '#88aaff', lines: ['これは……古谷のスマホだ！', '充電はまだ残っている。彼がここを通ったのは最近のはずだ。', '古谷は、まだ近くにいる！'] },
      { bg: '#1a2a1a', speaker: '山川', speakerColor: '#77aa55', lines: ['あいつ、いつも一人で抱え込む癖があるから……。', '急いで追いかけましょう！', 'これ以上、誰一人欠けさせないわ！'], effect: 'fade' }
    ],

    // === Chapter 9 Opening / Ending ===
    ch9_opening: [
      { bg: '#1a1a3a', speaker: null, lines: ['水上の谷。', '切り立った崖と、凍てつくような冷たい川のせせらぎ。', '谷底に、見慣れた後ろ姿が立っていた。'] },
      { bg: '#1a1a3a', speaker: '古谷', speakerColor: '#7766aa', lines: ['……来るなと言ったはずだ。', '俺がここでこの結界のコアを抑え込めば、お前らは逃げられる。', '誰かが犠牲にならなきゃ、このループは終わらないんだよ！'] },
      { bg: '#1a1a3a', speaker: '主人公', speakerColor: '#88aaff', lines: ['そんな自己満足で終わらせてたまるか！', '記憶がない俺でも、それだけは間違っているとわかる。', '俺たち全員で、群馬を抜け出すんだ！'], effect: 'fade' }
    ],
    ch9_ending: [
      { bg: '#1a1a3a', speaker: '古谷', speakerColor: '#7766aa', lines: ['……お前らって奴は、本当にしぶといな。', 'わかったよ……俺の負けだ。俺も最後まで付き合ってやる。', 'お前がそのダイスを振るなら、俺は最高の目を出してやるさ。'] },
      { bg: '#1a1a3a', speaker: 'ジューク', speakerColor: '#ff4444', lines: ['チッ……美しき自己犠牲のシナリオが台無しですね。', 'ですが、国境の扉はそう簡単には開きません。', '最上階で、あなたたちの絶望を鑑賞させてもらいましょう。'] },
      { bg: '#000000', speaker: null, lines: ['古谷が合流し、ついに仲間が全員揃った。', '残るは、現実と虚構の境界を支配するジュークのみ。', '決戦の地、国境のトンネルへと向かう。'], effect: 'fade' }
    ],

    // === Chapter 10 Opening / Ending ===
    ch10_opening: [
      { bg: '#000000', speaker: null, lines: ['国境のトンネル。', 'どこまで歩いても終わらない、現実と虚構が入り混じる境界線。', 'ここは、群馬であって群馬ではない、世界の狭間だ。'] },
      { bg: '#111111', speaker: 'アカギ', speakerColor: '#cc6633', lines: ['空気が違う。ここまでの結界とは比べ物にならない重圧だ。', 'だが、恐れることはない。我々にはこれまでの絆がある。', '行くぞ！ 全ての因縁をここで断ち切るのだ！'] },
      { bg: '#111111', speaker: '主人公', speakerColor: '#88aaff', lines: ['失われた記憶が戻る保証はない。', 'それでも、この仲間たちと過ごした旅の時間は本物だ。', '群馬からの脱出。その答えを、俺自身の手で掴み取る！'], effect: 'fade' }
    ],
    ch10_ending: [
      { bg: '#111111', speaker: 'ジューク', speakerColor: '#ff4444', lines: ['バカな……この完璧な箱庭が、崩壊していく……！', 'お前たちは、本当に現実へ帰るつもりですか？', 'このぬるま湯のような世界を捨てて、残酷な現実へ……？'] },
      { bg: '#000000', speaker: null, lines: ['真・ジュークの体が光に包まれ、空間全体が激しく揺れ始めた。', '境界が崩れていく……。', '目の前に、現実世界へ続く眩い光の裂け目が現れた。'] },
      { bg: '#000000', speaker: '主人公', speakerColor: '#88aaff', lines: ['帰るのか、残るのか、それとも……。', '仲間たちの顔を、もう一度見渡す。', '選択の時が来た。'], effect: 'fade' }
    ],

    // Ch2 Ending
    ch2_ending: [
      {
        bg: '#1a140a',
        speaker: null,
        lines: [
          'ナンバー12-グンマが膝をつく。',
          '荷車は横倒しになり、こんにゃく、下仁田ねぎ、',
          '木彫り細工が石畳へと雪崩れ落ちた。'
        ]
      },
      {
        bg: '#1a1830',
        speaker: '花（はな）',
        speakerColor: '#ff88aa',
        lines: [
          '助けてくれて、ありがとうございます。',
          'お父さまも村のみんなも、',
          'ずっとあなたが来るって信じていました。'
        ]
      },
      {
        bg: '#201030',
        speaker: '龝櫻（シュウオウ）',
        speakerColor: '#cc88ff',
        lines: [
          'お前の敬意……しかと見届けた。',
          '群馬で生きることにも、たしかに意味はある。',
          'その意味を背負える者だけが、次の賭けへ進めるのだ。'
        ]
      },
      {
        bg: '#0a0a1a',
        speaker: null,
        lines: [
          '大沼で見つかったワゴン車から、一枚のメモが出てきた。',
          'サトウの字だ――',
          '「ユウマさんに連れて行かれた。助けに来るな」',
          'ユウマ……それは誰なんだ？'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '赤城の闇は晴れた。',
          'だが物語は終わらない……',
          '仲間たちはまだ、その先にいる。'
        ],
        effect: 'fade'
      }
    ],

    ev_fail_ch1_pushback: [
      {
        bg: '#18080f',
        speaker: null,
        lines: [
          '暴力では、空っぽの器を満たせなかった。',
          '目の前が赤く揺らぎ、工場の入り口まで押し返される。',
          '瓦礫の中心だけが、まだ何かを待っているようだった。'
        ],
        effect: 'fade'
      }
    ],

    ev_fail_ch2_rewind: [
      {
        bg: '#0f0a18',
        speaker: null,
        lines: [
          '強引に引いた糸が切れ、記憶が絡まり直していく。',
          '気づくと、路地の入口へ静かに巻き戻されていた。'
        ],
        effect: 'fade'
      }
    ],

    ev_fail_tomioka_rewind: [
      {
        bg: '#101018',
        speaker: null,
        lines: [
          '強く引いた糸が、耳障りな音を立てて切れた。',
          '気づくと、製糸場の回廊の入口まで静かに巻き戻されている。'
        ],
        effect: 'fade'
      }
    ],

    ev_fail_yubatake_downstream: [
      {
        bg: '#1a1208',
        speaker: null,
        lines: [
          '熱が暴れ、湯の濁流が足元をさらっていく。',
          '下流まで押し流され、荒い息だけが残った。'
        ],
        effect: 'fade'
      }
    ]
  };

  function start(eventId, callback) {
    var eventData = events[eventId];
    if (!eventData) {
      if (callback) callback();
      return;
    }
    active = true;
    scenes = eventData;
    sceneIndex = 0;
    lineIndex = 0;
    charIndex = 0;
    charTimer = 0;
    fadeAlpha = 1;
    fadeDir = -1; // fade in
    waitTimer = 0;
    textComplete = false;
    autoAdvanceTimer = 0;
    charSpeed = getConfiguredCharSpeed();
    onComplete = callback || null;

    var firstScene = scenes[0];
    if (firstScene.bgm) Game.Audio.playBgm(firstScene.bgm);
    if (firstScene.sfx) Game.Audio.playSfx(firstScene.sfx);
  }

  function wrapEventText(text, maxChars) {
    var source = '' + (text || '');
    var segments = source.split('\n');
    var lines = [];
    var punctuation = '、。！？…）)] ';

    for (var s = 0; s < segments.length; s++) {
      var remaining = segments[s];
      if (!remaining.length) {
        lines.push('');
        continue;
      }
      while (remaining.length > 0) {
        if (remaining.length <= maxChars) {
          lines.push(remaining);
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
        if (splitAt === maxChars && splitAt < remaining.length && TRAILING_PUNCTUATION.indexOf(remaining.charAt(splitAt)) >= 0) {
          splitAt++;
        }
        lines.push(remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt);
      }
    }

    return lines.length ? lines : [''];
  }

  function update() {
    if (!active) return null;
    charSpeed = getConfiguredCharSpeed();

    // Handle fade
    if (fadeDir !== 0) {
      fadeAlpha += fadeDir * 0.03;
      if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeDir = 0;
      }
      if (fadeAlpha >= 1) {
        fadeAlpha = 1;
        fadeDir = 0;
        // If fading out (between scenes), advance
        if (sceneIndex >= scenes.length) {
          active = false;
          if (onComplete) onComplete();
          return { result: 'done' };
        }
      }
      return null;
    }

    if (waitTimer > 0) {
      waitTimer--;
      return null;
    }

    var scene = scenes[sceneIndex];
    if (!scene) {
      active = false;
      if (onComplete) onComplete();
      return { result: 'done' };
    }

    // Typewriter effect
    if (!textComplete) {
      charTimer++;
      if (charTimer >= charSpeed) {
        charTimer = 0;
        charIndex++;
        var currentLine = scene.lines[lineIndex] || '';
        if (charIndex >= currentLine.length) {
          textComplete = true;
        }
      }
    } else if (scene.autoAdvance) {
      if (autoAdvanceTimer <= 0) {
        autoAdvanceTimer = scene.autoAdvance;
      } else {
        autoAdvanceTimer--;
        if (autoAdvanceTimer <= 0) {
          advanceScene(false);
          return null;
        }
      }
    }

    // Advance on confirm
    if (Game.Input.isPressed('confirm')) {
      if (!textComplete) {
        // Skip typewriter, show full line
        var currentLine = scene.lines[lineIndex] || '';
        charIndex = currentLine.length;
        textComplete = true;
        autoAdvanceTimer = scene.autoAdvance || 0;
        return null;
      }
      advanceScene(true);
    }

    return null;
  }

  function draw() {
    if (!active) return;

    var R = Game.Renderer;
    var C = Game.Config;
    var ctx = R.getContext();

    var scene = scenes[sceneIndex];
    if (!scene) return;

    // Background
    var bg = scene.bg || '#000011';
    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, bg);
    drawMotionLayer(ctx, C, scene, Date.now() / 1000);

    // Atmospheric particles
    var t = Date.now() / 1000;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var i = 0; i < 15; i++) {
      var px = (Math.sin(t * 0.3 + i * 2.1) * 0.5 + 0.5) * C.CANVAS_WIDTH;
      var py = (Math.cos(t * 0.2 + i * 1.7) * 0.5 + 0.5) * C.CANVAS_HEIGHT;
      ctx.fillRect(px, py, 2, 2);
    }

    // Shake effect
    var shakeOffsetX = 0, shakeOffsetY = 0;
    if (scene.effect === 'shake') {
      shakeOffsetX = (Math.random() - 0.5) * 3;
      shakeOffsetY = (Math.random() - 0.5) * 3;
    }

    // Top decorative line
    R.drawRectAbsolute(20, 60, C.CANVAS_WIDTH - 40, 1, '#334');

    // Speaker name
    if (scene.speaker) {
      var speakerColor = scene.speakerColor || C.COLORS.GOLD;
      R.drawTextJP(scene.speaker, 40 + shakeOffsetX, 42 + shakeOffsetY, speakerColor, 16);
    }

    // Text area - show all previous lines + current line with typewriter
    var textStartY = 80;
    var lineHeight = 24;
    var maxDisplayLines = 7;
    var maxCharsPerLine = MAX_EVENT_CHARS_PER_LINE;
    var visualLines = [];

    for (var i = 0; i <= lineIndex && i < scene.lines.length; i++) {
      var lineText = i < lineIndex ? scene.lines[i] : scene.lines[i].substring(0, charIndex);
      var wrapped = wrapEventText(lineText, maxCharsPerLine);
      for (var j = 0; j < wrapped.length; j++) {
        visualLines.push({
          text: wrapped[j],
          isCurrent: i === lineIndex
        });
      }
    }

    var startVisualLine = Math.max(0, visualLines.length - maxDisplayLines);
    for (var v = startVisualLine; v < visualLines.length; v++) {
      var y = textStartY + (v - startVisualLine) * lineHeight + shakeOffsetY;
      var x = 50 + shakeOffsetX;
      var visual = visualLines[v];
      R.drawTextJP(visual.text, x, y, visual.isCurrent ? '#ffffff' : '#aaaacc', 15);
    }

    // Bottom decorative line
    R.drawRectAbsolute(20, C.CANVAS_HEIGHT - 60, C.CANVAS_WIDTH - 40, 1, '#334');

    // Advance prompt
    if (textComplete) {
      var blinkT = Date.now() / 400;
      var promptColor = Math.sin(blinkT) > 0 ? '#d7dced' : '#939db8';
      R.drawTextJP('Z / Enterで進む', C.CANVAS_WIDTH - 132, C.CANVAS_HEIGHT - 50, promptColor, 9);
      if (scene.autoAdvance) {
        var remainingFrames = autoAdvanceTimer > 0 ? autoAdvanceTimer : scene.autoAdvance;
        var remainingSeconds = Math.max(0, remainingFrames / 60);
        R.drawTextJP('Auto ' + remainingSeconds.toFixed(1) + 's', C.CANVAS_WIDTH - 92, C.CANVAS_HEIGHT - 37, '#707a98', 8);
      }
    }

    // Scene counter (small)
    R.drawTextJP((sceneIndex + 1) + '/' + scenes.length, 20, C.CANVAS_HEIGHT - 18, '#333', 10);

    // Fade overlay
    if (fadeAlpha > 0) {
      R.fadeOverlay(fadeAlpha);
    }
  }

  function advanceScene(playConfirmSfx) {
    var scene = scenes[sceneIndex];
    if (!scene) return;

    lineIndex++;
    autoAdvanceTimer = 0;
    if (lineIndex >= scene.lines.length) {
      sceneIndex++;
      lineIndex = 0;
      charIndex = 0;
      charTimer = 0;
      textComplete = false;

      if (sceneIndex >= scenes.length) {
        if (scene.effect === 'fade') {
          fadeDir = 1;
        } else {
          active = false;
          if (onComplete) onComplete();
        }
        return;
      }

      var nextScene = scenes[sceneIndex];
      if (nextScene.bgm) {
        Game.Audio.stopBgm();
        Game.Audio.playBgm(nextScene.bgm);
      }
      if (nextScene.sfx) Game.Audio.playSfx(nextScene.sfx);

      if (scene.effect === 'fade') {
        fadeDir = 1;
        waitTimer = 5;
      }
      return;
    }

    charIndex = 0;
    charTimer = 0;
    textComplete = false;
    if (playConfirmSfx) Game.Audio.playSfx('confirm');
  }

  function drawMotionLayer(ctx, C, scene, t) {
    if (!scene.motion) return;
    var w = C.CANVAS_WIDTH;
    var h = C.CANVAS_HEIGHT;
    var i;

    switch (scene.motion) {
      case 'road_trip':
        ctx.fillStyle = '#080b15';
        ctx.beginPath();
        ctx.moveTo(w * 0.24, h);
        ctx.lineTo(w * 0.42, h * 0.36);
        ctx.lineTo(w * 0.58, h * 0.36);
        ctx.lineTo(w * 0.76, h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f4d96f';
        for (i = 0; i < 7; i++) {
          var laneY = ((t * 90 + i * 42) % (h + 30)) - 20;
          var laneW = 4 + laneY * 0.03;
          ctx.fillRect(w * 0.5 - laneW * 0.5, laneY, laneW, 18);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        for (i = 0; i < 22; i++) {
          ctx.fillRect((i * 23 + 17) % w, 10 + ((i * 37) % 90), 2, 2);
        }
        break;

      case 'van_memory':
        ctx.fillStyle = '#121725';
        ctx.fillRect(0, h * 0.52, w, h * 0.18);
        ctx.fillStyle = '#262d40';
        ctx.fillRect(0, h * 0.7, w, h * 0.3);
        ctx.fillStyle = '#e8d38a';
        ctx.fillRect(w * 0.18, h * 0.62, w * 0.64, 4);
        ctx.fillStyle = '#88b9ff';
        for (i = 0; i < 5; i++) {
          var dashX = (w * 0.2 + ((t * 120 + i * 88) % (w * 0.6)));
          ctx.fillRect(dashX, h * 0.57, 24, 3);
        }
        ctx.fillStyle = 'rgba(255,120,120,0.2)';
        ctx.fillRect(22, 24, 34, 14);
        ctx.fillRect(w - 56, 24, 34, 14);
        break;

      case 'border_glitch':
        ctx.fillStyle = '#171d2e';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        ctx.strokeStyle = '#ff5c7a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.48, 0);
        ctx.lineTo(w * 0.52, h * 0.2);
        ctx.lineTo(w * 0.46, h * 0.42);
        ctx.lineTo(w * 0.54, h * 0.64);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        for (i = 0; i < 9; i++) {
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,60,90,0.08)';
          ctx.fillRect(((i * 53) + Math.floor(t * 20)) % w, 20 + i * 18, 60, 6);
        }
        break;

      case 'forest_wake':
        ctx.fillStyle = '#10170f';
        for (i = 0; i < 12; i++) {
          var trunkX = i * 42 + ((i % 2) * 10);
          ctx.fillRect(trunkX, h * 0.18, 12, h * 0.52);
        }
        ctx.fillStyle = 'rgba(180,210,190,0.08)';
        for (i = 0; i < 5; i++) {
          var fogX = ((t * 24) + i * 90) % (w + 80) - 80;
          ctx.fillRect(fogX, h * 0.58 + i * 8, 80, 18);
        }
        ctx.strokeStyle = '#b8404e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.28, h * 0.16);
        ctx.lineTo(w * 0.41, h * 0.08);
        ctx.lineTo(w * 0.54, h * 0.18);
        ctx.lineTo(w * 0.66, h * 0.1);
        ctx.stroke();
        break;

      case 'dawn_frontier':
        ctx.fillStyle = '#261f3a';
        ctx.fillRect(0, h * 0.52, w, h * 0.48);
        ctx.fillStyle = '#ef8f73';
        ctx.fillRect(0, h * 0.42, w, 10);
        ctx.fillStyle = '#3a314f';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.lineTo(w * 0.16, h * 0.58);
        ctx.lineTo(w * 0.34, h * 0.68);
        ctx.lineTo(w * 0.52, h * 0.54);
        ctx.lineTo(w * 0.72, h * 0.69);
        ctx.lineTo(w, h * 0.57);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,115,115,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 18);
        ctx.lineTo(w * 0.56, 42);
        ctx.lineTo(w * 0.52, 70);
        ctx.lineTo(w * 0.58, 98);
        ctx.stroke();
        for (i = 0; i < 4; i++) {
          var poleX = 44 + i * 90;
          ctx.strokeStyle = '#2b2536';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(poleX, h * 0.5);
          ctx.lineTo(poleX, h * 0.75);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(poleX - 8, h * 0.56);
          ctx.lineTo(poleX + 8, h * 0.56);
          ctx.stroke();
        }
        break;

      case 'akagi_approach':
        ctx.fillStyle = 'rgba(18,24,34,0.78)';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        ctx.strokeStyle = 'rgba(132,152,190,0.18)';
        ctx.lineWidth = 1;
        for (i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(18, h * (0.28 + i * 0.08));
          ctx.lineTo(w - 18, h * (0.28 + i * 0.08));
          ctx.stroke();
        }

        var horizonY = h * 0.63;
        ctx.fillStyle = '#0b0f18';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(w * 0.22, horizonY);
        ctx.lineTo(w * 0.78, horizonY);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        var playerX = w * 0.68;
        var playerY = h * 0.56;
        ctx.fillStyle = '#d8dde7';
        ctx.fillRect(playerX - 6, playerY - 22, 12, 12);
        ctx.fillStyle = '#242a37';
        ctx.fillRect(playerX - 8, playerY - 8, 16, 24);
        ctx.fillStyle = '#1a202b';
        ctx.fillRect(playerX - 5, playerY + 16, 4, 14);
        ctx.fillRect(playerX + 1, playerY + 16, 4, 14);

        var approachT = (Math.sin(t * 1.6) * 0.5 + 0.5);
        var akagiX = w * 0.16 + approachT * (w * 0.34);
        var akagiY = h * 0.55 + Math.sin(t * 4.2) * 2;
        ctx.fillStyle = '#d0bfab';
        ctx.fillRect(akagiX - 6, akagiY - 22, 12, 12);
        ctx.fillStyle = '#4a6e9b';
        ctx.fillRect(akagiX - 8, akagiY - 8, 16, 24);
        ctx.fillStyle = '#6d432e';
        ctx.fillRect(akagiX - 10, akagiY - 4, 3, 16);
        ctx.fillRect(akagiX + 7, akagiY - 4, 3, 16);
        ctx.fillStyle = '#2d241e';
        ctx.fillRect(akagiX - 5, akagiY + 16, 4, 14);
        ctx.fillRect(akagiX + 1, akagiY + 16, 4, 14);

        var gestureY = akagiY + 2;
        ctx.strokeStyle = '#c9d8ef';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(akagiX + 10, gestureY);
        ctx.lineTo(akagiX + 24, gestureY - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(akagiX + 22, gestureY - 8);
        ctx.lineTo(akagiX + 30, gestureY - 4);
        ctx.lineTo(akagiX + 22, gestureY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (i = 0; i < 5; i++) {
          var driftX = ((t * 28) + i * 68) % (w + 36) - 18;
          ctx.fillRect(driftX, h * 0.34 + i * 22, 28, 2);
        }
        break;

      case 'gururin_stop':
        ctx.fillStyle = '#0f1525';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        ctx.fillStyle = '#1f2a40';
        ctx.fillRect(0, h * 0.44, w, h * 0.16);
        ctx.fillStyle = '#f2c96d';
        for (i = 0; i < 5; i++) {
          ctx.fillRect(36 + i * 62, h * 0.515, 24, 3);
        }
        ctx.strokeStyle = '#6d725b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w * 0.18, h * 0.38);
        ctx.lineTo(w * 0.18, h * 0.75);
        ctx.stroke();
        ctx.fillStyle = '#2d6e4b';
        ctx.fillRect(w * 0.14, h * 0.36, 28, 18);
        ctx.fillStyle = '#dceccf';
        ctx.fillRect(w * 0.147, h * 0.39, 14, 3);
        var arrivalX = w + 40 - ((t * 90) % (w + 120));
        ctx.fillStyle = '#2a8d63';
        ctx.fillRect(arrivalX, h * 0.47, 88, 34);
        ctx.fillStyle = '#dceccf';
        ctx.fillRect(arrivalX + 8, h * 0.49, 20, 11);
        ctx.fillRect(arrivalX + 33, h * 0.49, 20, 11);
        ctx.fillRect(arrivalX + 58, h * 0.49, 18, 11);
        ctx.fillStyle = '#f0c86a';
        ctx.fillRect(arrivalX + 10, h * 0.474, 52, 6);
        ctx.fillStyle = '#243a33';
        ctx.fillRect(arrivalX + 68, h * 0.48, 10, 22);
        ctx.fillStyle = '#101726';
        ctx.fillRect(arrivalX + 10, h * 0.55, 15, 8);
        ctx.fillRect(arrivalX + 30, h * 0.55, 15, 8);
        ctx.fillRect(arrivalX + 50, h * 0.55, 15, 8);
        break;

      case 'gururin_loop':
        ctx.fillStyle = '#101726';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        ctx.strokeStyle = '#315f52';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.58, 74, Math.PI * 0.12, Math.PI * 1.88);
        ctx.stroke();
        ctx.strokeStyle = '#6fcf97';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.58, 74, Math.PI * 0.12, Math.PI * 1.88);
        ctx.stroke();
        var loopAngle = (t * 1.35) % (Math.PI * 2);
        var busX = w * 0.5 + Math.cos(loopAngle - Math.PI * 0.5) * 74;
        var busY = h * 0.58 + Math.sin(loopAngle - Math.PI * 0.5) * 74;
        ctx.fillStyle = '#2a8d63';
        ctx.fillRect(busX - 16, busY - 9, 32, 18);
        ctx.fillStyle = '#dceccf';
        ctx.fillRect(busX - 11, busY - 6, 8, 5);
        ctx.fillRect(busX, busY - 6, 8, 5);
        ctx.fillRect(busX + 9, busY - 6, 5, 5);
        ctx.fillStyle = '#f0c86a';
        ctx.fillRect(busX - 10, busY - 12, 18, 3);
        ctx.fillStyle = '#1d2b24';
        ctx.fillRect(busX + 9, busY - 4, 4, 9);
        ctx.fillStyle = 'rgba(143,215,161,0.12)';
        for (i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.58, 34 + i * 18, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(143,215,161,' + (0.18 - i * 0.03) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        break;
    }
  }

  function getConfiguredCharSpeed() {
    return Game.UI && Game.UI.getEventTextSpeedFrames ? Game.UI.getEventTextSpeedFrames() : 2;
  }

  function getStateSnapshot() {
    var scene = scenes[sceneIndex];
    return {
      active: active,
      sceneIndex: sceneIndex,
      sceneCount: scenes.length,
      lineIndex: lineIndex,
      charIndex: charIndex,
      charSpeed: charSpeed,
      textComplete: textComplete,
      autoAdvanceTimer: autoAdvanceTimer,
      speaker: scene ? scene.speaker : null,
      lines: scene && scene.lines ? scene.lines.slice() : [],
      autoAdvance: scene ? (scene.autoAdvance || 0) : 0
    };
  }

  function isActive() { return active; }

  // Allow adding custom events at runtime
  function addEvent(id, sceneData) {
    events[id] = sceneData;
  }

  function hasEvent(id) {
    return !!events[id];
  }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    addEvent: addEvent,
    hasEvent: hasEvent,
    getStateSnapshot: getStateSnapshot
  };
})();
