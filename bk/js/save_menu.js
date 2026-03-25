// Save menu UI for local save + passphrase flow
Game.SaveMenu = (function() {
  var state = {
    context: 'field',
    page: 'main',
    action: '',
    selection: 0,
    message: '',
    messageTimer: 0,
    passphrase: ''
  };

  function open(options) {
    options = options || {};
    state.context = options.context || 'field';
    state.action = options.action || '';
    state.selection = 0;
    state.message = '';
    state.messageTimer = 0;
    state.passphrase = '';

    if (state.context === 'title' && state.action === 'load') {
      state.page = 'slots';
      return;
    }
    if (state.context === 'title' && state.action === 'passphrase') {
      state.page = 'passphrase';
      return;
    }
    state.page = 'main';
  }

  function getContext() {
    return state.context;
  }

  function getCloseState() {
    return state.context === 'title' ? Game.Config.STATE.TITLE : Game.Config.STATE.EXPLORING;
  }

  function setMessage(text, timer) {
    state.message = text;
    state.messageTimer = timer || 70;
  }

  function update() {
    if (state.messageTimer > 0) state.messageTimer--;

    switch (state.page) {
      case 'main':
        return updateMainPage();
      case 'slots':
        return updateSlotPage();
      case 'passphrase':
        return updatePassphrasePage();
      case 'passphrase_view':
        return updatePassphraseViewPage();
      case 'help':
        return updateHelpPage();
    }

    return null;
  }

  function updateMainPage() {
    var options = ['きろくする', 'よみこむ', 'あいことば', 'せつめい', 'やめる'];

    if (Game.Input.isPressed('up')) {
      state.selection = (state.selection - 1 + options.length) % options.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      state.selection = (state.selection + 1) % options.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('cancel')) {
      Game.Audio.playSfx('cancel');
      return { closeTo: getCloseState() };
    }
    if (!Game.Input.isPressed('confirm')) return null;

    Game.Audio.playSfx('confirm');
    switch (state.selection) {
      case 0:
        state.page = 'slots';
        state.action = 'save';
        state.selection = 0;
        break;
      case 1:
        state.page = 'slots';
        state.action = 'load';
        state.selection = 0;
        break;
      case 2:
        state.page = 'passphrase';
        state.action = 'passphrase';
        state.selection = 0;
        break;
      case 3:
        state.page = 'help';
        state.selection = 0;
        break;
      default:
        return { closeTo: getCloseState() };
    }

    return null;
  }

  function updateSlotPage() {
    var optionCount = 4;

    if (Game.Input.isPressed('up')) {
      state.selection = (state.selection - 1 + optionCount) % optionCount;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      state.selection = (state.selection + 1) % optionCount;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('cancel')) {
      Game.Audio.playSfx('cancel');
      if (state.context === 'title') return { closeTo: Game.Config.STATE.TITLE };
      state.page = 'main';
      state.selection = 0;
      return null;
    }
    if (!Game.Input.isPressed('confirm')) return null;

    if (state.selection === 3) {
      Game.Audio.playSfx('cancel');
      if (state.context === 'title') return { closeTo: Game.Config.STATE.TITLE };
      state.page = 'main';
      state.selection = 0;
      return null;
    }

    var slot = state.selection + 1;
    if (state.action === 'save') {
      if (Game.Save.save(slot)) {
        setMessage(getSlotLabel(slot) + ' に きろくした。', 70);
        Game.Audio.playSfx('save');
      } else {
        setMessage('きろくに しっぱいした。', 70);
        Game.Audio.playSfx('cancel');
      }
      return null;
    }

    if (!Game.Save.hasSave(slot)) {
      setMessage('そのきろくちは まだ からっぽだ。', 70);
      Game.Audio.playSfx('cancel');
      return null;
    }

    if (!Game.Save.load(slot)) {
      setMessage('きろくを よみこめなかった。', 70);
      Game.Audio.playSfx('cancel');
      return null;
    }

    Game.Audio.playSfx('confirm');
    return { closeTo: Game.Config.STATE.EXPLORING, loaded: true };
  }

  function updatePassphrasePage() {
    var options = state.context === 'title'
      ? ['あいことばを いれる', 'もどる']
      : ['あいことばを つくる', 'あいことばを いれる', 'もどる'];

    if (Game.Input.isPressed('up')) {
      state.selection = (state.selection - 1 + options.length) % options.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('down')) {
      state.selection = (state.selection + 1) % options.length;
      Game.Audio.playSfx('confirm');
    }
    if (Game.Input.isPressed('cancel')) {
      Game.Audio.playSfx('cancel');
      if (state.context === 'title') return { closeTo: Game.Config.STATE.TITLE };
      state.page = 'main';
      state.selection = 0;
      return null;
    }
    if (!Game.Input.isPressed('confirm')) return null;

    if (state.context === 'title') {
      if (state.selection === 0) return handlePassphraseLoad();
      return { closeTo: Game.Config.STATE.TITLE };
    }

    if (state.selection === 0) {
      state.passphrase = Game.Save.createPassphrase();
      state.page = 'passphrase_view';
      state.selection = 0;
      if (window.prompt) {
        window.prompt('この あいことば を かならず メモ してください。', state.passphrase);
      }
      setMessage('あいことばを うつした。', 70);
      Game.Audio.playSfx('save');
      return null;
    }
    if (state.selection === 1) {
      return handlePassphraseLoad();
    }

    state.page = 'main';
    state.selection = 0;
    Game.Audio.playSfx('cancel');
    return null;
  }

  function handlePassphraseLoad() {
    if (!window.prompt) {
      setMessage('このブラウザでは入力できない。', 70);
      Game.Audio.playSfx('cancel');
      return null;
    }

    var input = window.prompt('あいことばを いれてください。');
    if (!input) {
      setMessage('あいことばの入力をやめた。', 60);
      Game.Audio.playSfx('cancel');
      return null;
    }

    var result = Game.Save.loadPassphrase(input);
    if (!result.success) {
      setMessage(result.error || 'あいことばが ちがう。', 80);
      Game.Audio.playSfx('cancel');
      return null;
    }

    Game.Audio.playSfx('confirm');
    return { closeTo: Game.Config.STATE.EXPLORING, loaded: true };
  }

  function updatePassphraseViewPage() {
    if (Game.Input.isPressed('confirm') && window.prompt) {
      window.prompt('この あいことば を かならず メモ してください。', state.passphrase);
      setMessage('もういちど ひらいた。', 60);
      Game.Audio.playSfx('confirm');
      return null;
    }

    if (Game.Input.isPressed('cancel')) {
      state.page = 'passphrase';
      state.selection = 0;
      Game.Audio.playSfx('cancel');
    }

    return null;
  }

  function updateHelpPage() {
    if (Game.Input.isPressed('confirm') || Game.Input.isPressed('cancel')) {
      state.page = state.context === 'title' ? 'passphrase' : 'main';
      state.selection = 0;
      Game.Audio.playSfx('cancel');
    }
    return null;
  }

  function draw() {
    var R = Game.Renderer;
    var C = Game.Config;

    R.drawDialogBox(52, 18, 376, 284);
    R.drawTextJP(getPageTitle(), 74, 30, C.COLORS.GOLD, 14);
    R.drawRectAbsolute(70, 52, 340, 1, '#446');

    switch (state.page) {
      case 'main':
        drawMainPage();
        break;
      case 'slots':
        drawSlotPage();
        break;
      case 'passphrase':
        drawPassphrasePage();
        break;
      case 'passphrase_view':
        drawPassphraseViewPage();
        break;
      case 'help':
        drawHelpPage();
        break;
    }

    if (state.messageTimer > 0 && state.message) {
      R.drawDialogBox(70, 270, 340, 20);
      R.drawTextJP(state.message, 82, 274, '#fff', 11);
    }
  }

  function drawMainPage() {
    var R = Game.Renderer;
    var options = ['きろくする', 'よみこむ', 'あいことば', 'せつめい', 'やめる'];

    drawOptionList(options, 82, 70, 20);
    R.drawTextJP('この世界の記録は ここで預かる。', 82, 198, '#ddd', 11);
    R.drawTextJP('同じPC・同じブラウザなら「つづきから」でも戻れる。', 82, 216, '#aaa', 10);
    R.drawTextJP('べつのPCへ移るなら、あいことばを必ずメモすること。', 82, 232, '#aaa', 10);
    R.drawTextJP('Z: 決定  X: 戻る', 82, 250, '#888', 10);
  }

  function drawSlotPage() {
    var R = Game.Renderer;
    for (var slot = 1; slot <= 3; slot++) {
      var info = Game.Save.getSlotInfo(slot);
      var y = 72 + (slot - 1) * 56;
      var selected = state.selection === slot - 1;

      R.drawRectAbsolute(78, y, 324, 44, selected ? 'rgba(255,204,0,0.12)' : 'rgba(255,255,255,0.04)');
      R.drawTextJP((selected ? '▶ ' : '  ') + getSlotLabel(slot), 88, y + 6, selected ? Game.Config.COLORS.GOLD : '#fff', 12);

      if (!info) {
        R.drawTextJP('きろくなし', 110, y + 24, '#666', 10);
        continue;
      }

      R.drawTextJP('章' + info.chapter + ' / ' + info.mapLabel, 110, y + 22, '#ddd', 10);
      R.drawTextJP('HP ' + info.hp + '/' + info.maxHp + '  ' + info.gold + 'G  ' + formatPlayTime(info.playTime), 230, y + 22, '#aaa', 10);
    }

    var backSelected = state.selection === 3;
    R.drawTextJP((backSelected ? '▶ ' : '  ') + 'もどる', 88, 244, backSelected ? Game.Config.COLORS.GOLD : '#fff', 12);
    R.drawTextJP(state.action === 'save' ? '保存先をえらんでください。' : '読み込む記録をえらんでください。', 82, 262, '#888', 10);
  }

  function drawPassphrasePage() {
    var R = Game.Renderer;
    var options = state.context === 'title'
      ? ['あいことばを いれる', 'もどる']
      : ['あいことばを つくる', 'あいことばを いれる', 'もどる'];

    drawOptionList(options, 82, 76, 22);
    R.drawTextJP('あいことばは PC が変わっても使える持ち運び用の記録です。', 82, 188, '#ddd', 10);
    R.drawTextJP('ただし手書きミスに弱いので、区切りごとに丁寧に写してください。', 82, 206, '#aaa', 10);
    R.drawTextJP('Z: 決定  X: 戻る', 82, 242, '#888', 10);
  }

  function drawPassphraseViewPage() {
    var R = Game.Renderer;
    var lines = wrapText(state.passphrase, 28);

    R.drawTextJP('この あいことば を かならず メモ してください。', 82, 72, '#fff', 12);
    R.drawRectAbsolute(82, 96, 316, 1, '#446');

    for (var i = 0; i < lines.length && i < 6; i++) {
      R.drawText(lines[i], 86, 108 + i * 18, '#ffefaa', 12);
    }

    R.drawTextJP('同じPC・同じブラウザなら「つづきから」でも戻れます。', 82, 228, '#aaa', 10);
    R.drawTextJP('でも環境が変わると消えることがあるので、必ず控えてください。', 82, 244, '#aaa', 10);
    R.drawTextJP('Z: もう一度ひらく  X: 戻る', 82, 262, '#888', 10);
  }

  function drawHelpPage() {
    var R = Game.Renderer;
    var lines = [
      'つづきから:',
      'このPC、このブラウザに残っている記録を読み込みます。',
      'ブラウザのデータを消したり、別のPCに移ると使えないことがあります。',
      '',
      'あいことば:',
      '今の状態を文字列にして持ち運ぶための記録です。',
      '長いので、紙でもメモ帳でもいいから必ず控えてください。'
    ];

    for (var i = 0; i < lines.length; i++) {
      R.drawTextJP(lines[i], 82, 74 + i * 22, i === 0 || i === 4 ? Game.Config.COLORS.GOLD : '#ddd', 11);
    }
    R.drawTextJP('Z / X で 戻る', 82, 248, '#888', 10);
  }

  function drawOptionList(options, startX, startY, lineHeight) {
    var R = Game.Renderer;
    for (var i = 0; i < options.length; i++) {
      var selected = state.selection === i;
      R.drawTextJP((selected ? '▶ ' : '  ') + options[i], startX, startY + i * lineHeight, selected ? Game.Config.COLORS.GOLD : '#fff', 12);
    }
  }

  function getSlotLabel(slot) {
    if (slot === 1) return 'つづきから用';
    if (slot === 2) return '記録帳A';
    return '記録帳B';
  }

  function formatPlayTime(playTime) {
    var totalSeconds = Math.max(0, Math.floor((playTime || 0) / 1000));
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
  }

  function pad(value) {
    return value < 10 ? '0' + value : '' + value;
  }

  function wrapText(text, width) {
    var lines = [];
    var index = 0;
    while (index < text.length) {
      lines.push(text.substring(index, index + width));
      index += width;
    }
    return lines;
  }

  function getPageTitle() {
    if (state.page === 'slots') {
      return state.action === 'save' ? '記録帳' : 'つづきから';
    }
    if (state.page === 'passphrase' || state.page === 'passphrase_view') {
      return 'あいことば';
    }
    if (state.page === 'help') {
      return '記録の説明';
    }
    return '記録の牧師';
  }

  return {
    open: open,
    update: update,
    draw: draw,
    getContext: getContext
  };
})();
