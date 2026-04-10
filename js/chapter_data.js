// Journey and area presentation data
Game.Chapters = (function() {
  var journeyCount = 7;

  var journeys = {
    1: {
      number: 1,
      displayLabel: '第一章',
      act: 'ACT I',
      shortLabel: '前橋',
      title: '前橋関所',
      subtitle: '群馬の掟と最初の関所',
      arrivalLine: 'まだ道路の冷たさが、旅人の靴裏に薄く残っている。',
      theme: '笑いながら入った異界の旅が、少しずつ敬意へ変わり始める入口。',
      objective: '前橋で旅の作法を学び、最初の関所を越える準備を整えろ。',
      hint: '拠点で情報と儀式の基本を掴み、この旅の空気に足を慣らす。',
      accent: '#ffcc33',
      ambient: 'rgba(18, 24, 46, 0.34)'
    },
    2: {
      number: 2,
      displayLabel: '第二章',
      act: 'ACT II',
      shortLabel: '路線',
      title: '路線の町と最初の敬意',
      subtitle: '関所を越えるたび、笑いは切なさへ反転する',
      arrivalLine: '誇りの濃い町ほど、旅人の呼吸まで見逃してくれない。',
      theme: 'だるま、温泉、畑、宿場町。ご当地の誇りが儀式を通じて見えてくる。',
      objective: '町々の関所を抜け、群馬の深部へ続く通行鍵を手に入れろ。',
      hint: 'お使いではなく前進。各土地でひとつずつ作法を学びながら進む。',
      accent: '#ffb347',
      ambient: 'rgba(42, 22, 14, 0.34)'
    },
    3: {
      number: 3,
      displayLabel: '第三章',
      act: 'ACT III',
      shortLabel: '赤城',
      title: '赤城の運び屋たち',
      subtitle: '荷を失った者たちの誇り',
      arrivalLine: '森と湖には、運び切れなかったものの気配が沈んでいる。',
      theme: '運ぶことに生きた者たちが、通さぬ者へ変わってしまった旅の中盤。',
      objective: '暗鞍の痕跡を追い、赤城の奥で仲間とユウマの手掛かりを掴め。',
      hint: '森から湖、牧場、神社へ。景色が深まるほど敵の悲哀も濃くなる。',
      accent: '#ff8a3d',
      ambient: 'rgba(36, 14, 18, 0.34)'
    },
    4: {
      number: 4,
      displayLabel: '第四章',
      act: 'ACT IV',
      shortLabel: '白根',
      title: '白根と上毛学園',
      subtitle: '石化と改ざんのあいだ',
      arrivalLine: '景色そのものが書き換わり、足場まで少しずつ疑わしくなる。',
      theme: '身体の侵食と記憶の侵食が同時に押し寄せる、旅の反転点。',
      objective: '白根と学園の異常を鎮め、儀式の意味そのものを反転させろ。',
      hint: 'ここからは勝つだけでは足りない。相手の誇りを満たす儀式が要る。',
      accent: '#d589ff',
      ambient: 'rgba(32, 14, 44, 0.34)'
    },
    5: {
      number: 5,
      displayLabel: '第五章',
      act: 'ACT V',
      shortLabel: '湯水',
      title: '湯と水の境界',
      subtitle: '輪郭が溶ける白い道',
      arrivalLine: '白さと霧が、名前の輪郭から先に奪っていく。',
      theme: '湯煙、吹雪、濃霧。人の輪郭と名前が薄れていく静かな恐怖。',
      objective: '湯と水の異界を抜け、記憶の核心へ続く境界線を渡れ。',
      hint: '視界の悪さそのものが演出。移動の息苦しさも物語の一部にする。',
      accent: '#8fd6ff',
      ambient: 'rgba(14, 28, 44, 0.34)'
    },
    6: {
      number: 6,
      displayLabel: '第六章',
      act: 'ACT VI',
      shortLabel: '交差点',
      title: '尾瀬と水上の交差点',
      subtitle: '脱出と記憶がぶつかる場所',
      arrivalLine: 'ここまで覚えた作法が、会話と決断の全部へ返ってくる。',
      theme: '失われた痕跡と自己犠牲の論理を、儀式の知識で越えていく終盤。',
      objective: '尾瀬と水上で仲間の選択と向き合い、最後の境界へ進む覚悟を固めろ。',
      hint: 'ここまでに学んだ作法が、自然と会話と決断のすべてに返ってくる。',
      accent: '#86d07c',
      ambient: 'rgba(18, 32, 26, 0.34)'
    },
    7: {
      number: 7,
      displayLabel: '終章',
      act: 'FINAL',
      shortLabel: '国境',
      title: '国境トンネル',
      subtitle: '現実と異界の最終儀式',
      arrivalLine: '旅で拾った記憶を、静かな手つきで手放す夜が来る。',
      theme: '旅の記憶を抱えたまま、出るか残るかを決める静かな夜明け前。',
      objective: '最後の儀式を完遂し、群馬と現実の境界を越えろ。',
      hint: '最終章は総決算。旅で拾った知識と記憶を全部つないで前へ出る。',
      accent: '#ff6d6d',
      ambient: 'rgba(28, 4, 8, 0.36)',
      finalJourney: true
    }
  };

  var mapJourneyIndex = {
    maebashi: 1,
    takasaki: 2,
    kusatsu: 2,
    ikaho: 2,
    shimonita: 2,
    tomioka: 2,
    tsumagoi: 2,
    forest: 3,
    tamura: 3,
    konuma: 3,
    onuma: 3,
    akagi_ranch: 3,
    akagi_shrine: 3,
    shirane_trail: 4,
    kusatsu_deep: 4,
    jomo_gakuen: 4,
    tanigawa_tunnel: 5,
    haruna_lake: 5,
    oze_marsh: 6,
    minakami_valley: 6,
    border_tunnel: 7
  };

  var chapterFallbackIndex = {
    1: 1,
    2: 3,
    3: 4,
    4: 4,
    5: 4,
    6: 5,
    7: 5,
    8: 6,
    9: 6,
    10: 7
  };

  var maps = {
    maebashi: { label: '前橋中央通り', subtitle: '旅の起点', hint: '買い物、会話、セーブ導線が集まる安全地帯。', objective: '前橋で儀式の作法を学び、最初の関所を越える準備を整える。' },
    takasaki: { label: '高崎だるま街', subtitle: '願掛けの町', hint: '試練の前に準備を整え、最初の敬意を学ぶ。', objective: 'だるまの関所を越え、町の誇りにふさわしい旅人と認められる。' },
    kusatsu: { label: '草津温泉郷', subtitle: '湯けむりの門前', hint: '温泉の鍵を巡る導線を、視線誘導で素直に体験させる。', objective: '湯の作法を学び、次の路線へ抜けるための通行鍵を手に入れる。' },
    ikaho: { label: '伊香保石段街', subtitle: '登る湯の町', hint: '石段と視線の高さで、疲労そのものを土地の物語に変える。', objective: '段を登るごとに町の呼吸を読み、湯の路線が試す敬意を受け止める。' },
    shimonita: { label: '下仁田宿', subtitle: '山あいの宿場', hint: 'ローカル色の強い町並みで、西方面の手触りを変える。', objective: '宿場の誇りに触れ、次の町へ進むための導線を開く。' },
    tomioka: { label: '富岡製糸場跡', subtitle: '繭と記録の町', hint: '産業遺産の気配を残し、レガシーの厚みを出す。', objective: '残された産業の記憶を辿り、旅路の作法をひとつ深める。' },
    tsumagoi: { label: '嬬恋高原', subtitle: '風の畑', hint: '開放感の奥に、関所越えの緊張を仕込む。', objective: '最後の路線関所を越え、群馬の深部へ進む道をひらく。' },
    tamura: { label: 'タムラ村', subtitle: '記憶の継承地', hint: '土地のルールと次の目標を語る拠点。', objective: '赤城へ沈む前に、旅の意味と次の危機を受け取る。' },
    forest: { label: '廃墟の森', subtitle: '侵入者を選ぶ入口', hint: '霧と孤独を印象づけ、旅の緊張を再起動する。', objective: '赤城の異界へ足を踏み入れ、運び屋たちの痕跡を追い始める。' },
    konuma: { label: '小沼', subtitle: '霧の湖畔', hint: '輸送と誘拐の気配が漂う前線エリア。', objective: '小沼の拠点を抜け、奪われたものの痕跡を追う。' },
    onuma: { label: '大沼', subtitle: '沈黙する湖', hint: 'ワゴン車や手掛かりで物語を大きく動かす場所。', objective: '湖畔の静けさの中で、仲間とユウマの手掛かりを掴む。' },
    akagi_ranch: { label: '赤城牧場', subtitle: '霧の牧柵', hint: '国定忠治との遭遇に向け、荒廃した広がりを使う。', objective: '失われた運び屋の誇りと向き合い、神社への道を開く。' },
    akagi_shrine: { label: '赤城神社', subtitle: '荷車の墓場', hint: '章ボス前の緊張を高める終着点。', objective: '赤城の最奥で、旅の中盤を決定づける儀式に挑む。' },
    shirane_trail: { label: '白根登山道', subtitle: '硫黄の尾根', hint: '危険な一本道で前進圧を作る。', objective: '白根山の異常へ踏み込み、石化の兆候を追う。' },
    kusatsu_deep: { label: '草津深部', subtitle: '蒸気の迷層', hint: '安心の象徴が不安へ変わる章転換。', objective: '暴走する湯の気配を鎮め、儀式の意味を反転させる。' },
    jomo_gakuen: { label: '上毛学園', subtitle: '止まった時計', hint: '反復する校舎で記憶攪乱を演出。', objective: '書き換えられた記録を辿り、学園のルールそのものに挑む。' },
    tanigawa_tunnel: { label: '谷川トンネル', subtitle: '白い無音', hint: '吹雪と反響で存在の危うさを見せる。', objective: '名を奪う吹雪を抜け、境界線の作法を学び直す。' },
    haruna_lake: { label: '榛名湖', subtitle: '霧の水面', hint: '視界不良を使い、見えない敵を印象づける。', objective: '湯と水の境界を越え、終盤へ向かう静かな呼吸を整える。' },
    oze_marsh: { label: '尾瀬湿原', subtitle: '腐食する足場', hint: '移動するだけで緊張が続く構成に向く。', objective: '沈む足場を進み、失われた痕跡を拾い集める。' },
    minakami_valley: { label: '水上渓谷', subtitle: '冷たい断崖', hint: '会話劇と決別の空気を支える縦長の地形。', objective: '古谷の選択と向き合い、最後の境界へ進む意志を固める。' },
    border_tunnel: { label: '国境トンネル', subtitle: '境界の最上階', hint: '最終局面は総決算。景色もルールも旅の記憶を回帰させる。', objective: '旅のすべてを賭けた最終儀式で、群馬と現実の境界を越える。' }
  };

  var environmentSpots = {
    maebashi: [
      {
        id: 'central_line',
        x: 14,
        y: 9,
        radius: 4,
        title: '中央通りの白線',
        lines: [
          '乾いた白線だけが、',
          'まだ県境の冷たさを靴裏へ残している。'
        ],
        variants: [
          {
            id: 'after',
            whenFlag: 'checkpoint_cleared',
            title: 'ほどけた白線',
            lines: [
              '止まれと書かれていた白線が、',
              '今は東へ進めと薄く背中を押してくる。'
            ],
            accent: '#ffd27a'
          }
        ]
      }
    ],
    takasaki: [
      {
        id: 'daruma_rows',
        x: 18,
        y: 14,
        radius: 4,
        title: '片目の棚',
        lines: [
          '赤い殻が並ぶほど、',
          '言えなかった願いの数まで町が重くなる。'
        ],
        variants: [
          {
            id: 'after',
            whenFlag: 'daruma_master_cleared_slice',
            title: '空きの増えた棚',
            lines: [
              '抜けた赤殻のぶんだけ、',
              '町がようやく息を継ぎ直した気がした。'
            ],
            accent: '#ffc98c'
          }
        ]
      }
    ],
    kusatsu: [
      {
        id: 'yubatake_edge',
        x: 14,
        y: 9,
        radius: 4,
        title: '湯の縁',
        lines: [
          '白い湯気は慰めより先に、',
          '急ぐ足をやわらかく押し戻してくる。'
        ]
      }
    ],
    ikaho: [
      {
        id: 'stone_steps',
        x: 14,
        y: 6,
        radius: 4,
        title: '石段の息切れ',
        lines: [
          '段を数えるより先に、',
          '町がこちらの呼吸の乱れを覚えていく。'
        ]
      }
    ],
    shimonita: [
      {
        id: 'freight_crate',
        x: 24,
        y: 14,
        radius: 3,
        title: '積み残しの荷札',
        lines: [
          '木箱の角に残った泥が、',
          'ここでは荷より先に誇りが止まったと告げる。'
        ]
      }
    ],
    tomioka: [
      {
        id: 'silent_reel',
        x: 26,
        y: 16,
        radius: 3,
        title: '無言のリール',
        lines: [
          '回らないはずの輪が、',
          '風のたびにほどけ損ねた名前を返してくる。'
        ],
        variants: [
          {
            id: 'after',
            whenFlag: 'thread_maiden_cleared_slice',
            title: '止まった機械音',
            lines: [
              'もう軋みは返ってこない。',
              '静けさのほうが、ここではようやく正常だった。'
            ],
            accent: '#c7d9ff'
          }
        ]
      }
    ],
    tsumagoi: [
      {
        id: 'wind_field',
        x: 14,
        y: 14,
        radius: 4,
        title: '高原の芯',
        lines: [
          '開けた景色なのに、',
          '風だけはずっと誰かの背中を押し続けている。'
        ]
      }
    ],
    tamura: [
      {
        id: 'woven_home',
        x: 4,
        y: 12,
        radius: 4,
        title: '織りの手元',
        lines: [
          '畑の話と機の話が同じ声で続く。',
          'この村では暮らしそのものが受け継ぎだ。'
        ]
      }
    ],
    forest: [
      {
        id: 'ruin_breath',
        x: 5,
        y: 3,
        radius: 4,
        title: '湿った石',
        lines: [
          '苔むした壁は崩れても、',
          'ここが誰かの入口だった記憶だけは残している。'
        ]
      }
    ],
    konuma: [
      {
        id: 'mist_watch',
        x: 14,
        y: 10,
        radius: 4,
        title: '霧の見張り',
        lines: [
          '見張り台より先に、',
          '湖面のほうが侵入者を数えている。'
        ]
      }
    ],
    onuma: [
      {
        id: 'wagon_memory',
        x: 13,
        y: 13,
        radius: 4,
        title: '止まった車体',
        lines: [
          '金属の冷たさに触れると、',
          '自分たちの旅路までここで足止めされた気がする。'
        ]
      }
    ],
    akagi_ranch: [
      {
        id: 'fence_wind',
        x: 13,
        y: 9,
        radius: 4,
        title: '牧柵の切れ目',
        lines: [
          '広い空ほど逃げ場がない。',
          '風はいつも、残された者の名から冷えていく。'
        ]
      }
    ],
    akagi_shrine: [
      {
        id: 'sando_graveyard',
        x: 13,
        y: 8,
        radius: 4,
        title: '荷車の墓場',
        lines: [
          '石段より先は祈りじゃない。',
          '運び終えられなかったものだけが奥へ積まれている。'
        ]
      }
    ],
    shirane_trail: [
      {
        id: 'sulfur_cut',
        x: 14,
        y: 5,
        radius: 4,
        title: '硫黄の裂け目',
        lines: [
          '甘い匂いが喉に刺さるたび、',
          '山が景色ではなく傷口だとわかる。'
        ]
      }
    ],
    kusatsu_deep: [
      {
        id: 'deep_steam',
        x: 14,
        y: 4,
        radius: 4,
        title: '深部の湯面',
        lines: [
          'やさしいはずの湯気が、',
          'ここでは境界線みたいに体温を選り分ける。'
        ]
      }
    ],
    jomo_gakuen: [
      {
        id: 'submission_hall',
        x: 10,
        y: 6,
        radius: 4,
        title: '提出廊下',
        lines: [
          '磨かれすぎた床が、',
          '立ち止まることまで反省文みたいに映してくる。'
        ]
      }
    ],
    tanigawa_tunnel: [
      {
        id: 'echo_shaft',
        x: 14,
        y: 8,
        radius: 4,
        title: '返声の坑道',
        lines: [
          '遅れて返る足音が、',
          '自分の輪郭だけを少しずつ削っていく。'
        ]
      }
    ],
    haruna_lake: [
      {
        id: 'mist_bank',
        x: 7,
        y: 8,
        radius: 4,
        title: '霧の岸',
        lines: [
          '水際の距離感だけが狂っている。',
          '近いはずの波音が、ずっとひとつ向こうで鳴る。'
        ]
      }
    ],
    oze_marsh: [
      {
        id: 'marsh_boardwalk',
        x: 13,
        y: 9,
        radius: 4,
        title: '沈む木道',
        lines: [
          '踏むたびに足場が答える。',
          'ここでは景色より重さのほうが記憶を残す。'
        ]
      }
    ],
    minakami_valley: [
      {
        id: 'prayer_ledge',
        x: 8,
        y: 11,
        radius: 4,
        title: '祈りの断崖',
        lines: [
          '川音が大きいぶん、',
          '願いごとは口に出す前から削られていく。'
        ]
      }
    ],
    border_tunnel: [
      {
        id: 'false_stars',
        x: 14,
        y: 12,
        radius: 4,
        title: '偽りの星空',
        lines: [
          '作りものだと知っても、',
          '見上げた数だけ本物の夜を思い出してしまう。'
        ]
      }
    ]
  };

  function getJourneyIndex(rawChapterNumber, mapId) {
    if (mapId && mapJourneyIndex[mapId]) return mapJourneyIndex[mapId];
    return chapterFallbackIndex[rawChapterNumber] || 1;
  }

  function getChapter(rawChapterNumber, mapId) {
    var journeyIndex = getJourneyIndex(rawChapterNumber, mapId);
    var journey = journeys[journeyIndex] || journeys[1];
    var result = {};
    for (var key in journey) {
      result[key] = journey[key];
    }
    result.rawChapter = rawChapterNumber || 1;
    result.journeyIndex = journeyIndex;
    result.journeyCount = journeyCount;
    return result;
  }

  function getAll() {
    return journeys;
  }

  function getJourneyStops() {
    var stops = [];
    for (var i = 1; i <= journeyCount; i++) {
      stops.push({
        number: journeys[i].number,
        displayLabel: journeys[i].displayLabel,
        shortLabel: journeys[i].shortLabel,
        title: journeys[i].title,
        accent: journeys[i].accent
      });
    }
    return stops;
  }

  function getJourneyCount() {
    return journeyCount;
  }

  function getMap(mapId) {
    return maps[mapId] || null;
  }

  function getObjective(rawChapterNumber, mapId) {
    var chapter = getChapter(rawChapterNumber, mapId);
    var map = getMap(mapId);
    if (map && map.objective) return map.objective;
    return chapter.objective;
  }

  function getEnvironmentSpots(mapId) {
    return environmentSpots[mapId] || [];
  }

  return {
    getChapter: getChapter,
    getAll: getAll,
    getJourneyStops: getJourneyStops,
    getJourneyCount: getJourneyCount,
    getMap: getMap,
    getObjective: getObjective,
    getJourneyIndex: getJourneyIndex,
    getEnvironmentSpots: getEnvironmentSpots
  };
})();
