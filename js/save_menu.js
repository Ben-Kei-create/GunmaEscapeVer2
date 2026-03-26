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

    R.drawRectAbsolute(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT, 'rgba(4, 6, 18, 0.56)');
    R.drawDialogBox(44, 12, 392, 296);
    drawPanelAccent(44, 12, 392, 296, C.COLORS.GOLD);
    R.drawTextJP(getPageTitle(), 240, 24, C.COLORS.GOLD, 14, 'center');
    R.drawTextJP('記録とあいことばを、静かに整理する。', 240, 40, '#b7c3e3', 9, 'center');
    R.drawRectAbsolute(66, 54, 348, 1, '#446');

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
      drawInsetPanel(68, 270, 344, 22, '', '#8fb8ff', '#8fb8ff');
      R.drawTextJP(clampText(state.message, 40), 80, 274, '#fff', 10);
    }
  }

  function drawMainPage() {
    var R = Game.Renderer;
    var options = ['きろくする', 'よみこむ', 'あいことば', 'せつめい', 'やめる'];

    drawInsetPanel(70, 66, 132, 128, '行き先', Game.Config.COLORS.GOLD, Game.Config.COLORS.GOLD);
    drawOptionList(options, 80, 86, 18, 112);

    drawInsetPanel(218, 66, 180, 146, '案内', '#8fb8ff', '#8fb8ff');
    drawWrappedParagraph('この世界の記録は ここで預かる。', 228, 86, 20, 2, 12, '#ddd', 10);
    drawWrappedParagraph('同じPC・同じブラウザなら「つづきから」でも戻れる。', 228, 114, 22, 2, 12, '#b7c3e3', 9);
    drawWrappedParagraph('べつのPCへ移るなら、あいことばを必ずメモすること。', 228, 146, 22, 3, 12, '#b7c3e3', 9);
    R.drawTextJP('Z 決定  X 戻る', 228, 192, '#7e8cac', 9);
  }

  function drawSlotPage() {
    var R = Game.Renderer;
    drawInsetPanel(70, 66, 332, 176, state.action === 'save' ? '保存先' : '読み込み先', Game.Config.COLORS.GOLD, Game.Config.COLORS.GOLD);
    for (var slot = 1; slot <= 3; slot++) {
      var info = Game.Save.getSlotInfo(slot);
      var y = 86 + (slot - 1) * 48;
      var selected = state.selection === slot - 1;

      R.drawRectAbsolute(82, y, 308, 38, selected ? 'rgba(255,204,0,0.12)' : 'rgba(255,255,255,0.04)');
      R.drawTextJP((selected ? '▶ ' : '  ') + getSlotLabel(slot), 92, y + 4, selected ? Game.Config.COLORS.GOLD : '#fff', 11);

      if (!info) {
        R.drawTextJP('きろくなし', 112, y + 20, '#666', 10);
        continue;
      }

      R.drawTextJP('章' + info.chapter + ' / ' + clampText(info.mapLabel, 12), 112, y + 18, '#ddd', 10);
      R.drawTextJP('HP ' + info.hp + '/' + info.maxHp + '  ' + info.gold + 'G  ' + formatPlayTime(info.playTime), 232, y + 18, '#aaa', 9);
    }

    var backSelected = state.selection === 3;
    R.drawRectAbsolute(82, 234, 120, 18, backSelected ? 'rgba(255,204,0,0.12)' : 'rgba(255,255,255,0.04)');
    R.drawTextJP((backSelected ? '▶ ' : '  ') + 'もどる', 92, 238, backSelected ? Game.Config.COLORS.GOLD : '#fff', 11);
    R.drawTextJP(state.action === 'save' ? '保存先をえらんでください。' : '読み込む記録をえらんでください。', 218, 238, '#888', 9);
  }

  function drawPassphrasePage() {
    var R = Game.Renderer;
    var options = state.context === 'title'
      ? ['あいことばを いれる', 'もどる']
      : ['あいことばを つくる', 'あいことばを いれる', 'もどる'];

    drawInsetPanel(70, 70, 148, 96, 'あいことば', Game.Config.COLORS.GOLD, Game.Config.COLORS.GOLD);
    drawOptionList(options, 80, 88, 18, 128);
    drawInsetPanel(234, 70, 164, 126, '説明', '#8fb8ff', '#8fb8ff');
    drawWrappedParagraph('あいことばは PC が変わっても使える持ち運び用の記録です。', 244, 90, 18, 3, 12, '#ddd', 9);
    drawWrappedParagraph('ただし手書きミスに弱いので、区切りごとに丁寧に写してください。', 244, 132, 18, 3, 12, '#b7c3e3', 9);
    R.drawTextJP('Z 決定  X 戻る', 244, 180, '#7e8cac', 9);
  }

  function drawPassphraseViewPage() {
    var R = Game.Renderer;
    var lines = wrapText(state.passphrase, 28);

    drawInsetPanel(70, 68, 328, 132, '控え用のあいことば', Game.Config.COLORS.GOLD, Game.Config.COLORS.GOLD);
    R.drawTextJP('この あいことば を かならず メモ してください。', 82, 88, '#fff', 11);
    R.drawRectAbsolute(82, 108, 304, 1, '#446');

    for (var i = 0; i < lines.length && i < 6; i++) {
      R.drawText(lines[i], 88, 118 + i * 16, '#ffefaa', 12);
    }

    drawInsetPanel(70, 212, 328, 46, '注意', '#8fb8ff', '#8fb8ff');
    drawWrappedParagraph('同じPC・同じブラウザなら「つづきから」でも戻れます。', 82, 230, 30, 2, 11, '#aaa', 9);
    drawWrappedParagraph('でも環境が変わると消えることがあるので、必ず控えてください。', 82, 242, 30, 2, 11, '#aaa', 9);
    R.drawTextJP('Z もう一度ひらく  X 戻る', 82, 274, '#888', 9);
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

    drawInsetPanel(70, 68, 328, 180, '記録の使い分け', Game.Config.COLORS.GOLD, Game.Config.COLORS.GOLD);
    for (var i = 0; i < lines.length; i++) {
      R.drawTextJP(lines[i], 82, 82 + i * 20, i === 0 || i === 4 ? Game.Config.COLORS.GOLD : '#ddd', 10);
    }
    R.drawTextJP('Z / X で 戻る', 82, 258, '#888', 9);
  }

  function drawOptionList(options, startX, startY, lineHeight, highlightW) {
    var R = Game.Renderer;
    for (var i = 0; i < options.length; i++) {
      var selected = state.selection === i;
      var y = startY + i * lineHeight;
      if (selected) {
        R.drawRectAbsolute(startX - 4, y - 1, highlightW || 120, 13, 'rgba(255,204,0,0.12)');
      }
      R.drawTextJP((selected ? '▶ ' : '  ') + options[i], startX, y, selected ? Game.Config.COLORS.GOLD : '#fff', 11);
    }
  }

  function drawPanelAccent(x, y, w, h, accent) {
    var R = Game.Renderer;
    var ctx = R.getContext();
    var color = accent || Game.Config.COLORS.GOLD;
    R.drawRectAbsolute(x + 6, y + 5, Math.max(12, w - 12), 1, color);
    R.drawRectAbsolute(x + 5, y + 6, 2, Math.max(8, h - 12), color);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(x + 6, y + 8, Math.max(8, w - 12), 4);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(x + 6, y + h - 10, Math.max(8, w - 12), 2);
  }

  function drawInsetPanel(x, y, w, h, title, accent, titleColor) {
    var R = Game.Renderer;
    var color = accent || '#8fb8ff';
    R.drawRectAbsolute(x, y, w, h, 'rgba(10,14,36,0.72)');
    R.drawRectAbsolute(x, y, w, 1, color);
    R.drawRectAbsolute(x, y + h - 1, w, 1, 'rgba(255,255,255,0.08)');
    R.drawRectAbsolute(x, y, 1, h, 'rgba(255,255,255,0.05)');
    R.drawRectAbsolute(x + 1, y + 1, w - 2, h - 2, 'rgba(255,255,255,0.015)');
    if (title) {
      R.drawTextJP(title, x + 8, y + 5, titleColor || color, 10);
    }
  }

  function clampText(text, maxChars) {
    if (!text || text.length <= maxChars) return text || '';
    return text.substring(0, Math.max(0, maxChars - 1)) + '…';
  }

  function drawWrappedParagraph(text, x, y, width, maxLines, lineHeight, color, size) {
    var lines = wrapText(text || '', width);
    for (var i = 0; i < lines.length && i < maxLines; i++) {
      Game.Renderer.drawTextJP(lines[i], x, y + i * lineHeight, color, size);
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
