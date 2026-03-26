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

  return {
    getChapter: getChapter,
    getAll: getAll,
    getJourneyStops: getJourneyStops,
    getJourneyCount: getJourneyCount,
    getMap: getMap,
    getObjective: getObjective,
    getJourneyIndex: getJourneyIndex
  };
})();
