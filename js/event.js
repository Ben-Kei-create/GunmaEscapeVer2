// Event scene data for chapter/cutscene scripting.
// Note: this repository snapshot did not include a prior js/event.js,
// so this file defines the requested events object directly.
var events = {
  opening: {
    scenes: [
      {
        bg: '#000011',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '……暗い。',
          '揺れる幌馬車のきしみと、下北沢から群馬へ向かう道だけが、途切れた記憶の底で鳴っていた。',
          'サトウ、フルヤ、ヤマカワ――三人の声を思い出した瞬間、俺は朽ちた森の地面でひとり目を覚ました。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a1a0a',
        speaker: 'おばあちゃん',
        speakerColor: '#ffaa88',
        lines: [
          'その森はもう群馬の罠の中さ。',
          '見上げな、空にひしゃげた鶴みたいな裂け目があるだろう。',
          'あれが外へ出る道に見えて、旅人をもっと深い群馬へ折りたたむんだよ。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a1a0a',
        speaker: 'おばあちゃん',
        speakerColor: '#ffaa88',
        lines: [
          '結界を破るには四つの証がいる。',
          '土地への敬い、失くした名の手がかり、仲間を信じる心、それから群馬そのものに勝った証。',
          '四つそろわなけりゃ、あんたは何度でもこの県に飲まれるよ。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a0a22',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '群馬県からの脱出が、今はじまる……。'
        ],
        effect: 'fade',
        sfx: ''
      }
    ]
  },

  ch1_ending: {
    scenes: [
      {
        bg: '#1a1028',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '県境に張りついていた光の壁が、耳をつんざく音とともに砕け散った。',
          '出口だ――そう思った瞬間、足元の地面まで震えた。'
        ],
        effect: '',
        sfx: 'victory'
      },
      {
        bg: '#1a2030',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '振り返ると、湯けむりの町、無言で並ぶだるま、ぬめるこんにゃく、風に揺れる嬬恋キャベツが脳裏をよぎる。',
          '短いはずの旅は、もう思い出の形をしていた。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#08110c',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          'だが県境の向こうに広がっていたのは自由ではなかった。',
          'そこには、さらに深く、さらに濃い“群馬の森”が待っていた。'
        ],
        effect: 'shake',
        sfx: ''
      },
      {
        bg: '#0a1a0a',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          'おい……生きてるか？',
          '立てるなら来い。ここで倒れてたら、本当に群馬に喰われるぞ。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a0a22',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '第一章 群馬脱出編 ―― END'
        ],
        effect: 'fade',
        sfx: ''
      }
    ]
  },

  ch2_opening: {
    scenes: [
      {
        bg: '#101020',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '第二章 赤城の闇編'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a1a0a',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '冷たい土の匂いで目を覚ます。',
          'たしかに県境は越えたはずだった。なのに視界を埋めるのは、またしても群馬の暗い森だった。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0f1820',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          '俺はアカギ。田村村の人間だ。',
          'この辺りを荒らしてる“暗鞍”は、昔は荷を運んでいたトラック運転手たちだ。',
          '高速が閉じて仕事を失ってから、連中は名まで忘れて、ナンバープレートで呼び合う賊になった。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#1a1430',
        speaker: 'アカギ',
        speakerColor: '#44aaff',
        lines: [
          '村には首領の龝櫻（シュウオウ）がいる。あんたを助けたのも、あの人の判断だ。',
          'ここじゃ敬意がなければ勝負も始まらない。生き残る方法は賭けだけ――シュウオウにもらう特別なサイコロを使いこなせ。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a0a22',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '新たな冒険が始まる……特別なダイスの力を使いこなせ！'
        ],
        effect: 'fade',
        sfx: ''
      }
    ]
  },

  preChuji: {
    scenes: [
      {
        bg: '#1a1a2a',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '霧に沈んだ廃牧場。',
          '崩れた柵の向こうに、人とも影ともつかぬ威圧的な姿が立っていた。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#1a1a2a',
        speaker: '国定忠治',
        speakerColor: '#ffcc44',
        lines: [
          '賭けの奥へ踏み込むのは危ねぇぞ。',
          'おめぇさんはもう、一歩そっち側へ足を入れちまってる。',
          '俺は盗人だった。死体まで盗まれた男の忠告だ。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#141428',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '敬意がなければ勝負は始まらない。',
          'それでも、お前は戦うのか？'
        ],
        effect: 'shake',
        sfx: ''
      }
    ]
  },

  preAnguraBoss: {
    scenes: [
      {
        bg: '#0a1a2a',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '赤城神社の闇に、巨大な影がうごめく。',
          '軋む車輪の音とともに、それは山ほどの荷車を引いて現れた。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#101020',
        speaker: 'ナンバー12-グンマ',
        speakerColor: '#ff4444',
        lines: [
          '俺たちはただの運び屋だった……。',
          '名前なんて忘れた、残ったのはナンバープレートだけだ。',
          '届ける場所を失って、俺たちは荷物より先に自分をなくした。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#180808',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          'ここは配達人たちの墓場だ！！'
        ],
        effect: 'shake',
        sfx: ''
      }
    ]
  },

  ch2_ending: {
    scenes: [
      {
        bg: '#1a140a',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          'ナンバー12-グンマが膝をつく。',
          '荷車は横倒しになり、こんにゃく、下仁田ねぎ、木彫り細工が石畳へと雪崩れ落ちた。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#1a1830',
        speaker: '花（はな）',
        speakerColor: '#ff88aa',
        lines: [
          '助けてくれて、ありがとうございます。',
          'お父さまも村のみんなも、ずっとあなたが来るって信じていました。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#201030',
        speaker: '龝櫻（シュウオウ）',
        speakerColor: '#cc88ff',
        lines: [
          'お前の敬意……しかと見届けた。',
          '群馬で生きることにも、たしかに意味はある。',
          'その意味を背負える者だけが、次の賭けへ進めるのだ。'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a0a1a',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '大沼で見つかった幌馬車の残骸から、一枚のメモが出てきた。',
          'サトウの字だ――「ユウマさんに連れて行かれた。助けに来るな」',
          'ユウマ……それは誰なんだ？'
        ],
        effect: '',
        sfx: ''
      },
      {
        bg: '#0a0a22',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '赤城の闇は晴れた。だが物語は終わらない……仲間たちはまだ、その先にいる。'
        ],
        effect: 'fade',
        sfx: ''
      }
    ]
  },

  preEnding: {
    scenes: [
      {
        bg: '#1a2844',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          '赤城を覆っていた闇が薄れ、田村村には久しぶりの静かな風が戻ってきた。',
          '村人たちは空を見上げ、失われかけた平穏の気配を確かめている。'
        ],
        effect: 'fade',
        sfx: 'victory'
      },
      {
        bg: '#1a2844',
        speaker: '',
        speakerColor: '#ffffff',
        lines: [
          'だが旅はまだ終わらない。',
          '名も、仲間も、県の奥に沈んだ真実も、これから取り戻さなければならない。'
        ],
        effect: '',
        sfx: ''
      }
    ]
  }
};
