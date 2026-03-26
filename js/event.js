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
    // Opening event when game starts
    opening: [
      {
        bg: '#000011',
        speaker: null,
        lines: [
          '……暗い。',
          '揺れるワゴン車のエンジン音と、',
          '下北沢から群馬へ向かう道の記憶だけが、',
          '途切れた意識の底で鳴っていた。',
          'サトウ、フルヤ、ヤマカワ――',
          '三人の声を思い出した瞬間、',
          '朽ちた森の地面でひとり目を覚ました。'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: 'おばあちゃん',
        speakerColor: '#ffaa88',
        lines: [
          'おや、目が覚めたかい。',
          'ここは群馬県の前橋じゃよ。',
          '見上げな、空に鶴みたいな裂け目があるだろう。',
          '群馬県は一度入ったら出られない...',
          'そういう言い伝えがあるんじゃ。'
        ]
      },
      {
        bg: '#0a1a0a',
        speaker: 'おばあちゃん',
        speakerColor: '#ffaa88',
        lines: [
          'でも方法がないわけじゃないよ。',
          '結界を破るには四つの証がいる。',
          '温泉の鍵、だるまの目、',
          'こんにゃくパス、キャベツの紋章...',
          'この4つじゃ。',
          '四つそろわなけりゃ、何度でもこの県に飲まれるよ。'
        ]
      },
      {
        bg: '#0a0a22',
        speaker: null,
        lines: [
          '群馬県からの脱出が、今はじまる……。'
        ],
        effect: 'fade'
      }
    ],

    // First key obtained
    firstKey: [
      {
        bg: '#111122',
        speaker: null,
        lines: [
          '最初の証を手に入れた！',
          'あと3つ...群馬の力を感じる...'
        ]
      }
    ],

    // Pre-boss event at Tsumagoi
    preBoss: [
      {
        bg: '#0a1a0a',
        speaker: null,
        lines: [
          '嬬恋の空気が変わった...',
          '強大な気配を感じる。'
        ]
      },
      {
        bg: '#1a0a0a',
        speaker: 'キャベツ番人',
        speakerColor: '#66dd66',
        lines: [
          'よくぞここまで来た、旅の者よ。',
          '3つの証を持っているようだな。',
          'しかし、最後の紋章はそう簡単には渡せぬ。',
          'この群馬を出るにふさわしい者か...',
          '我が見極めてやろう！'
        ]
      }
    ],

    // All keys collected
    allKeys: [
      {
        bg: '#112244',
        speaker: null,
        lines: [
          '4つの証が揃った！',
          '温泉の鍵が光っている...',
          'だるまの目が見開いた...',
          'こんにゃくパスが震えている...',
          'キャベツの紋章が輝いている...'
        ],
        effect: 'shake'
      },
      {
        bg: '#223355',
        speaker: null,
        lines: [
          '県境の結界が弱まっていく...',
          '今なら脱出できるかもしれない！',
          '嬬恋の南にある県境を目指そう！'
        ]
      }
    ],

    // Pre-ending (Ch2 only)
    preEnding: [
      {
        bg: '#1a2844',
        speaker: null,
        lines: [
          '赤城を覆っていた闇が薄れ、',
          'タムラ村には久しぶりの静かな風が戻ってくる。',
          '村人たちは空を見上げ、失われかけた平穏の気配を確かめている。'
        ],
        sfx: 'victory',
        effect: 'fade'
      },
      {
        bg: '#1a2844',
        speaker: null,
        lines: [
          'だが旅はまだ終わらない。',
          '名も、仲間も、県の奥に沈んだ真実も、',
          'これから取り戻さなければならない。'
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
    ]
  };

  function start(eventId, callback) {
    var eventData = events[eventId];
    if (!eventData) {
      if (callback) callback();
      return;
    }

    // Check if the event has flag conditions
    if (eventData.condition && !checkFlag(eventData.condition)) {
      if (callback) callback();
      return;
    }

    active = true;
    scenes = eventData.scenes || [];
    sceneIndex = 0;
    lineIndex = 0;
    charIndex = 0;
    charTimer = 0;
    fadeAlpha = 1;
    fadeDir = -1; // fade in
    waitTimer = 0;
    textComplete = false;
    onComplete = callback || null;

    var firstScene = scenes[0];
    if (firstScene.bgm) Game.Audio.playBgm(firstScene.bgm);
    if (firstScene.sfx) Game.Audio.playSfx(firstScene.sfx);
  }

  function update() {
    if (!active) return null;

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
    }

    // Advance on confirm
    if (Game.Input.isPressed('confirm')) {
      if (!textComplete) {
        // Skip typewriter, show full line
        var currentLine = scene.lines[lineIndex] || '';
        charIndex = currentLine.length;
        textComplete = true;
        return null;
      }

      // Next line
      lineIndex++;
      if (lineIndex >= scene.lines.length) {
        // Next scene
        sceneIndex++;
        lineIndex = 0;
        charIndex = 0;
        charTimer = 0;
        textComplete = false;

        // --- System Action Handling ---
        var curScene = scenes[sceneIndex];
        if (curScene && curScene.type === 'system') {
            if (curScene.action === 'show_title') {
                currentEndingTitle = curScene.value;
            }
        }

        if (sceneIndex >= scenes.length) {
          // End of event
          if (scene.effect === 'fade') {
            fadeDir = 1; // fade out
          } else {
            active = false;
            if (onComplete) onComplete();
            return { result: 'done' };
          }
        } else {
          // Transition between scenes
          var nextScene = scenes[sceneIndex];
          if (nextScene.bgm) {
            Game.Audio.stopBgm();
            Game.Audio.playBgm(nextScene.bgm);
          }
          if (nextScene.sfx) Game.Audio.playSfx(nextScene.sfx);

          if (scene.effect === 'fade') {
            fadeDir = 1; // fade out then in
            waitTimer = 5;
          }
        }
      } else {
        charIndex = 0;
        charTimer = 0;
        textComplete = false;
        Game.Audio.playSfx('confirm');
      }
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
    var lineHeight = 28;
    var maxDisplayLines = 6;
    var startLine = Math.max(0, lineIndex - maxDisplayLines + 1);

    for (var i = startLine; i <= lineIndex && i < scene.lines.length; i++) {
      var y = textStartY + (i - startLine) * lineHeight + shakeOffsetY;
      var x = 50 + shakeOffsetX;

      if (i < lineIndex) {
        // Previous lines: full text, slightly dimmed
        R.drawTextJP(scene.lines[i], x, y, '#aaaacc', 15);
      } else {
        // Current line: typewriter effect
        var displayText = scene.lines[i].substring(0, charIndex);
        R.drawTextJP(displayText, x, y, '#ffffff', 15);
      }
    }

    // Bottom decorative line
    R.drawRectAbsolute(20, C.CANVAS_HEIGHT - 60, C.CANVAS_WIDTH - 40, 1, '#334');

    // Advance prompt
    if (textComplete) {
      var blinkT = Date.now() / 400;
      if (Math.sin(blinkT) > 0) {
        R.drawTextJP('▼', C.CANVAS_WIDTH - 45, C.CANVAS_HEIGHT - 50, '#aaa', 14);
      }
    }

    // Scene counter (small)
    R.drawTextJP((sceneIndex + 1) + '/' + scenes.length, 20, C.CANVAS_HEIGHT - 18, '#333', 10);

    // Fade overlay
    if (fadeAlpha > 0) {
      R.fadeOverlay(fadeAlpha);
    }
  }

  function isActive() { return active; }

  // Allow adding custom events at runtime
  function addEvent(id, sceneData) {
    events[id] = sceneData;
  }

  function registerEndingEvents(endingData) {
    for (var i = 0; i < endingData.length; i++) {
        var event = endingData[i];
        var eventScenes = [];
        for (var j = 0; j < event.scenes.length; j++) {
            var s = event.scenes[j];
            if (s.type === 'narration') {
                eventScenes.push({ bg: '#000018', speaker: null, lines: [s.text] });
            } else if (s.type === 'dialog') {
                var col = Game.Config.COLORS.GOLD;
                if (s.speaker === 'アカギ') col = '#44aaff';
                if (s.speaker === 'ヤマカワ') col = '#ff88aa';
                if (s.speaker === 'フルヤ') col = '#aaff88';
                if (s.speaker === 'ジューク') col = '#ff4444';
                eventScenes.push({ bg: '#0a1020', speaker: s.speaker, speakerColor: col, lines: [s.text] });
            } else if (s.type === 'system') {
                eventScenes.push({ bg: '#000', type: 'system', action: s.action, value: s.value, lines: [' '] });
            }
        }
        events[event.event_id] = eventScenes;
    }
  }

  function hasEvent(id) {
    return !!events[id];
  }

  var currentEndingTitle = '';
  function getEndingTitle() { return currentEndingTitle; }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: isActive,
    addEvent: addEvent,
    hasEvent: hasEvent,
    registerEndingEvents: registerEndingEvents,
    getEndingTitle: getEndingTitle
  };
})();
