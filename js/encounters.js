// Step-based field encounters for route and dungeon maps
Game.Encounters = (function() {
  var state = {
    mapId: '',
    eligibleSteps: 0,
    cooldown: 0,
    cycleIndex: 0
  };

  function formation(enemyIds, options) {
    var opts = options || {};
    return {
      enemyIds: (enemyIds || []).slice(),
      packName: opts.packName || '',
      omen: opts.omen || '',
      directive: opts.directive || '',
      entryText: opts.entryText || '',
      layout: opts.layout || 'line',
      accent: opts.accent || '',
      roles: (opts.roles || []).slice()
    };
  }

  var tables = {
    takasaki: { stepInterval: 16, cooldown: 6, tiles: [0], formations: ['strayDaruma', 'wishShelfShade',
      formation(['roadsideBandit', 'wishShelfShade'], {
        packName: '棚荒らしの連れ影',
        omen: '高崎の棚音だけが、遅れて追いかけてくる。',
        directive: '先に手を伸ばし、遅れて掠め取る。',
        entryText: '棚荒らしの連れ影が、土産棚の陰から間合いを合わせて現れた。',
        layout: 'stagger',
        accent: '#ff9f7d',
        roles: ['掠め役', '拾い手']
      }),
      formation(['roadsideBandit', 'strayDaruma'], {
        packName: '願殻まじりの押し売り',
        omen: '赤い粉と足音が、逃げ道だけを先に塞いでくる。',
        directive: '前でぶつけ、横から荷を奪う。',
        entryText: '願殻まじりの押し売りが、道幅いっぱいに散って現れた。',
        layout: 'pincer',
        accent: '#ff8d7a',
        roles: ['押し役', '掠め役']
      })
    ] },
    kusatsu: { stepInterval: 10, cooldown: 4, tiles: [0, 5], formations: ['steamMonkey', 'bathhouseRemnant',
      formation(['steamMonkey', 'bathhouseRemnant'], {
        packName: '湯けむりの荒らし組',
        omen: '硫黄の向こうで、湯気と古傷が同じ拍で揺れている。',
        directive: '熱で視界を曇らせ、荒い爪で押し込む。',
        entryText: '湯けむりの荒らし組が、白い蒸気を裂いて現れた。',
        layout: 'screen',
        accent: '#ffb36b',
        roles: ['攪乱役', '押し込み']
      }),
      formation(['steamMonkey', 'strayDaruma'], {
        packName: '湯畑の厄混じり',
        omen: '湯気の切れ目ごとに、赤い願い殻が見え隠れする。',
        directive: '湯煙で焦らせ、勢いで当て崩す。',
        entryText: '湯畑の厄混じりが、白い泡立ちと一緒に押し寄せた。',
        layout: 'wedge',
        accent: '#ff9b70',
        roles: ['先走り', '当て役']
      })
    ] },
    shimonita: { stepInterval: 15, cooldown: 6, tiles: [0, 6], formations: ['konnyakuCrawler', 'shimonita_packer', 'shimonita_neglected_daruma',
      formation(['konnyakuCrawler', 'tomioka_tangled'], {
        packName: 'ぬめる搬送痕',
        omen: '畑土と糸くずが、同じ泥の温度で絡み合っている。',
        directive: '足を止め、絡めたところへ重みを乗せる。',
        entryText: 'ぬめる搬送痕が、畑道にべたりと広がって現れた。',
        layout: 'stagger',
        accent: '#b8c77d',
        roles: ['足止め', '絡め手']
      }),
      formation(['shimonita_packer', 'roadsideBandit'], {
        packName: '荷崩しの二人影',
        omen: '持ち去る手つきと、抱え損ねた肩が同時に近づいてくる。',
        directive: '抱え込みで視線を止め、横から抜き取る。',
        entryText: '荷崩しの二人影が、峠道の余白から同時に踏み込んできた。',
        layout: 'pincer',
        accent: '#ffb07d',
        roles: ['抱え役', '掠め役']
      })
    ] },
    tomioka: { stepInterval: 13, cooldown: 5, tiles: [0, 1], formations: ['silkShade', 'tomioka_weaver', 'tomioka_inspector',
      formation(['tomioka_tangled', 'silkShade'], {
        packName: '製糸の居残り',
        omen: '切れ残った白糸が、歩幅ごとにまだこちらを測っている。',
        directive: '細い手数で呼吸を乱し、遅れて絡め取る。',
        entryText: '製糸の居残りが、糸鳴りだけを先に響かせて現れた。',
        layout: 'screen',
        accent: '#d8c3ff',
        roles: ['絡め手', '刻み手']
      }),
      formation(['tomioka_dyer_sludge', 'tomioka_weaver'], {
        packName: '染場の残り香',
        omen: '濁った色と白糸の光だけが、工場跡の足元で混ざっている。',
        directive: '濁りで鈍らせ、白糸で詰める。',
        entryText: '染場の残り香が、濁りを引きずりながら迫ってきた。',
        layout: 'wedge',
        accent: '#c8bbff',
        roles: ['鈍らせ役', '縫い止め']
      })
    ] },
    tsumagoi: { stepInterval: 9, cooldown: 4, tiles: [0, 6], formations: ['cabbageWisp',
      formation(['cabbageWisp', 'roadsideBandit'], {
        packName: '畑荒らしの風切り',
        omen: '葉擦れに紛れた足音が、ひとつ多く混ざっている。',
        directive: '風で視線を振り、開いた隙を掠める。',
        entryText: '畑荒らしの風切りが、畝の間から滑り出た。',
        layout: 'stagger',
        accent: '#93d97a',
        roles: ['目くらまし', '掠め役']
      }),
      formation(['cabbageWisp', 'cabbageWisp'], {
        packName: '葉影の双子風',
        omen: '同じざわめきが二度鳴って、足元の向きだけを狂わせる。',
        directive: '軽さを重ねて間合いを揺らす。',
        entryText: '葉影の双子風が、畑一面のざわめきと一緒に寄ってきた。',
        layout: 'screen',
        accent: '#8fd96f',
        roles: ['先風', '返し風']
      })
    ] },
    forest: { stepInterval: 7, cooldown: 3, tiles: [0, 1], formations: ['roadsideBandit', 'lanternKeeper',
      formation(['roadsideBandit', 'lanternKeeper'], {
        packName: '灯盗りの寄り道',
        omen: '森の灯りが一歩ぶんだけ遅れて、こちらの背を照らしている。',
        directive: '灯で誘い、横から荷をさらう。',
        entryText: '灯盗りの寄り道が、木立の影を踏み替えて現れた。',
        layout: 'pincer',
        accent: '#ffd66b',
        roles: ['誘い灯', '掠め役']
      }),
      'strayDaruma'
    ] },
    konuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['mistBeastling', 'lanternKeeper',
      formation(['roadsideBandit', 'mistBeastling'], {
        packName: '霧縁の掠め足',
        omen: '霧の仔の気配の後ろで、人の足音だけが乾いている。',
        directive: '視界の端で迷わせ、背の荷へ触る。',
        entryText: '霧縁の掠め足が、湖畔の白さに紛れて現れた。',
        layout: 'stagger',
        accent: '#a8d9ff',
        roles: ['掠め役', '散らし役']
      }),
      formation(['mistBeastling', 'lanternKeeper'], {
        packName: '小沼の灯霧',
        omen: '小さな灯りが、霧の呼吸にあわせてゆっくり寄ってくる。',
        directive: '灯で測り、霧で詰める。',
        entryText: '小沼の灯霧が、水際の白さから浮かび上がった。',
        layout: 'screen',
        accent: '#b7dfff',
        roles: ['測り灯', '忍び足']
      })
    ] },
    onuma: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['mistBeastling', 'lanternKeeper',
      formation(['roadsideBandit', 'mistBeastling'], {
        packName: '大沼の掠め霧',
        omen: '霧の薄いところにだけ、人の欲が残っている。',
        directive: '霧に目を取らせ、荷の向きをずらす。',
        entryText: '大沼の掠め霧が、岸辺の静けさを裂いて現れた。',
        layout: 'stagger',
        accent: '#9fd7ff',
        roles: ['掠め役', '散らし役']
      }),
      formation(['roadsideBandit', 'lanternKeeper', 'strayDaruma'], {
        packName: '湖畔の寄せ集め',
        omen: '灯り、赤粉、足音が、まとまりきらないままこちらへ揃う。',
        directive: '役の違う三つの圧で、逃げ道を細らせる。',
        entryText: '湖畔の寄せ集めが、ばらばらの足並みのまま包むように現れた。',
        layout: 'wedge',
        accent: '#ffd18a',
        roles: ['掠め役', '誘い灯', '当て役']
      })
    ] },
    akagi_ranch: { stepInterval: 7, cooldown: 3, tiles: [0, 1, 6], formations: ['roadsideBandit', 'lanternKeeper',
      formation(['roadsideBandit', 'strayDaruma'], {
        packName: '牧柵くぐり',
        omen: '乾いた草の上で、赤い粉だけがやけに目につく。',
        directive: 'ぶつけて止め、横から走り抜ける。',
        entryText: '牧柵くぐりが、牧場の柵影から跳ね出してきた。',
        layout: 'pincer',
        accent: '#ffb980',
        roles: ['走り役', '当て役']
      }),
      formation(['lanternKeeper', 'roadsideBandit'], {
        packName: '放牧路の見張り影',
        omen: '消えかけた灯りが、道の先じゃなくこちらの手元を見ている。',
        directive: '灯で足を止め、横から抜く。',
        entryText: '放牧路の見張り影が、柵沿いの道幅へ並んだ。',
        layout: 'screen',
        accent: '#ffd66b',
        roles: ['見張り', '掠め役']
      })
    ] },
    shirane_trail: { stepInterval: 6, cooldown: 3, tiles: [1, 5], formations: ['steamMonkey', 'bathhouseRemnant',
      formation(['steamMonkey', 'silkShade'], {
        packName: '硫黄の裂き糸',
        omen: '熱にほどけた糸が、白根の風へ横から混ざってくる。',
        directive: '勢いで崩し、細い手数で詰める。',
        entryText: '硫黄の裂き糸が、白い尾を引きながら現れた。',
        layout: 'stagger',
        accent: '#ffb892',
        roles: ['切り込み', '詰め手']
      }),
      formation(['bathhouseRemnant', 'steamMonkey'], {
        packName: '噴気の押し返し',
        omen: '慰め損ねた手つきが、荒い爪と同じ拍で寄ってくる。',
        directive: '熱の壁で止め、勢いで押し切る。',
        entryText: '噴気の押し返しが、山道の視界を白く潰して現れた。',
        layout: 'wedge',
        accent: '#ffc089',
        roles: ['押し役', '切り込み']
      })
    ] },
    kusatsu_deep: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 5], formations: ['steamMonkey', 'bathhouseRemnant',
      formation(['steamMonkey', 'silkShade'], {
        packName: '深湯の裂き糸',
        omen: '白い湯けむりの奥で、糸だけが妙に乾いた音を立てる。',
        directive: '熱と白糸で、呼吸の拍をずらしてくる。',
        entryText: '深湯の裂き糸が、湯の底みたいな白さからにじんだ。',
        layout: 'stagger',
        accent: '#ffbe96',
        roles: ['攪乱役', '詰め手']
      }),
      formation(['bathhouseRemnant', 'silkShade', 'silkShade'], {
        packName: '湯宿の取り残し',
        omen: '癒やし損ねた手と、切れ残った糸がひとつの群れ声になっている。',
        directive: '湯気で鈍らせ、白糸で三方から寄る。',
        entryText: '湯宿の取り残しが、蒸気の段差ごと押し寄せてきた。',
        layout: 'wedge',
        accent: '#f7c0a2',
        roles: ['押し役', '絡め手', '詰め手']
      })
    ] },
    tanigawa_tunnel: { stepInterval: 6, cooldown: 3, tiles: [1, 9], formations: ['echoShard', 'ferryBellEcho',
      formation(['echoShard', 'roadsideBandit'], {
        packName: '反響の拾い手',
        omen: '返り声のすぐ後ろで、人の息遣いだけが近い。',
        directive: '遅れて響かせ、動いた先を掠める。',
        entryText: '反響の拾い手が、坑道の残響を踏み台にして現れた。',
        layout: 'stagger',
        accent: '#8fe0ff',
        roles: ['返り声', '掠め役']
      }),
      formation(['ferryBellEcho', 'echoShard', 'roadsideBandit'], {
        packName: '谷川の返し三拍',
        omen: '鐘、返り声、足音が、ひとつ遅れて重なってくる。',
        directive: '音で間を外し、最後に人の欲が手を伸ばす。',
        entryText: '谷川の返し三拍が、トンネルの黒から順番に迫ってきた。',
        layout: 'screen',
        accent: '#9fd8ff',
        roles: ['呼び声', '返り声', '掠め役']
      })
    ] },
    haruna_lake: { stepInterval: 6, cooldown: 3, tiles: [0, 1], formations: ['mistBeastling', 'lanternKeeper',
      formation(['mistBeastling', 'echoShard'], {
        packName: '湖霧の返り足',
        omen: '榛名の霧の中で、足音だけが湖面から跳ね返ってくる。',
        directive: '霧で散らし、返り声で拍をずらす。',
        entryText: '湖霧の返り足が、水面の白さから浮かび上がった。',
        layout: 'screen',
        accent: '#a8d9ff',
        roles: ['散らし役', '返り声']
      }),
      formation(['lanternKeeper', 'echoShard', 'echoShard'], {
        packName: '榛名の呼び灯',
        omen: 'ひとつの灯りに、遅れた声が二つ寄り添っている。',
        directive: '灯で測り、遅れた二拍で逃げ道を塞ぐ。',
        entryText: '榛名の呼び灯が、霧の境目から静かに輪を作った。',
        layout: 'wedge',
        accent: '#b7dbff',
        roles: ['測り灯', '返り声', '返り声']
      })
    ] },
    oze_marsh: { stepInterval: 6, cooldown: 3, tiles: [0, 1, 6], formations: ['mudWisp', 'marshPathShade',
      formation(['mudWisp', 'echoShard'], {
        packName: '湿原の濁り声',
        omen: '木道の下で揺れる黒と、遅れて返る声が同じ深さにある。',
        directive: '足元を鈍らせ、返り声で判断を遅らせる。',
        entryText: '湿原の濁り声が、木道の軋みと一緒に浮かび上がった。',
        layout: 'screen',
        accent: '#b8d0a0',
        roles: ['鈍らせ役', '返り声']
      }),
      formation(['marshPathShade', 'mudWisp', 'echoShard'], {
        packName: '尾瀬の沈み拍',
        omen: '踏むたびに、沈む気配が一拍ずつずれて追ってくる。',
        directive: '道を読み、足を沈ませ、遅れて詰める。',
        entryText: '尾瀬の沈み拍が、木道の先でじわりと揃った。',
        layout: 'wedge',
        accent: '#c7d8a8',
        roles: ['道読み', '足止め', '返り声']
      })
    ] },
    minakami_valley: { stepInterval: 6, cooldown: 3, tiles: [0, 1], formations: ['mudWisp', 'ferryBellEcho',
      formation(['mudWisp', 'mistBeastling'], {
        packName: '谷水の薄影',
        omen: '冷たい水音の下に、沈む黒と霧の仔が並んでいる。',
        directive: '足を鈍らせ、視界の端から気を削る。',
        entryText: '谷水の薄影が、断崖の風に押されて寄ってきた。',
        layout: 'stagger',
        accent: '#a7cde0',
        roles: ['足止め', '散らし役']
      }),
      formation(['ferryBellEcho', 'mistBeastling', 'mistBeastling'], {
        packName: '水上の返り霧',
        omen: 'ひとつの呼び声に、二つの白い影が遅れて揺れる。',
        directive: '呼び声で誘い、霧の二拍で包む。',
        entryText: '水上の返り霧が、谷あいの風を巻き込んで現れた。',
        layout: 'screen',
        accent: '#9fcee8',
        roles: ['呼び声', '左霧', '右霧']
      })
    ] }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function onMapLoaded(mapId) {
    state.mapId = mapId || '';
    state.eligibleSteps = 0;
    state.cooldown = 3;
    state.cycleIndex = 0;
  }

  function getTable(mapId) {
    return tables[mapId] || null;
  }

  function isEncounterTile(table, tileType) {
    return !!table && table.tiles.indexOf(tileType) >= 0;
  }

  function takeNextEnemy(table) {
    var pool = (table && table.formations && table.formations.length) ? table.formations : (table ? table.enemies : null);
    if (!pool || !pool.length) return null;
    var enemyId = pool[state.cycleIndex % pool.length];
    state.cycleIndex++;
    return clone(enemyId);
  }

  function consumeStep(mapId, tileType) {
    var table = getTable(mapId);
    if (!table || !isEncounterTile(table, tileType)) return null;

    if (state.mapId !== mapId) {
      onMapLoaded(mapId);
    }

    if (state.cooldown > 0) {
      state.cooldown--;
      return null;
    }

    state.eligibleSteps++;
    if (state.eligibleSteps < (table.stepInterval || 8)) return null;

    state.eligibleSteps = 0;
    state.cooldown = table.cooldown || 3;
    return takeNextEnemy(table);
  }

  function getState() {
    return clone(state);
  }

  return {
    onMapLoaded: onMapLoaded,
    consumeStep: consumeStep,
    getState: getState
  };
})();
