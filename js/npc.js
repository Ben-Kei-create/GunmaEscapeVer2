// NPC interaction system
Game.NPC = (function() {
  var currentNpc = null;
  var dialogIndex = 0;
  var dialogLines = [];
  var onDialogEnd = null;

  function interact(npc) {
    if (!npc) return;
    currentNpc = npc;
    dialogIndex = 0;

    if (npc.defeated) {
      // Shop NPCs always reopen
      if (npc.afterDialog && npc.afterDialog.indexOf('shop_') === 0) {
        dialogLines = npc.dialog;
        onDialogEnd = npc.afterDialog;
        return dialogLines[0];
      }
      if (npc.defeatedDialog) {
        dialogLines = npc.defeatedDialog;
      } else {
        dialogLines = ['...'];
      }
      if (npc.id === 'cabbageGuardian' && Game.Player.hasAllKeys()) {
        dialogLines = ['結界は既に解かれておる。県境を越えよ！'];
      }
      onDialogEnd = null;
    } else if (npc.id === 'cabbageGuardian' && npc.allKeysDialog &&
               Game.Player.hasItem('onsenKey') && Game.Player.hasItem('darumaEye') &&
               Game.Player.hasItem('konnyakuPass')) {
      dialogLines = npc.allKeysDialog;
      onDialogEnd = npc.afterDialog;
    } else if (npc.id === 'cabbageGuardian') {
      dialogLines = npc.dialog;
      onDialogEnd = null;
    } else {
      dialogLines = npc.dialog;
      onDialogEnd = npc.afterDialog || null;
    }

    return dialogLines[0];
  }

  function advance() {
    dialogIndex++;
    if (dialogIndex >= dialogLines.length) {
      var action = onDialogEnd;
      var npc = currentNpc;
      currentNpc = null;
      dialogIndex = 0;
      dialogLines = [];
      onDialogEnd = null;
      return { done: true, action: action, npc: npc };
    }
    return { done: false, text: dialogLines[dialogIndex] };
  }

  function showDefeatedDialog(npc) {
    if (!npc || !npc.defeatedDialog) return;
    currentNpc = npc;
    dialogIndex = 0;
    dialogLines = npc.defeatedDialog;
    onDialogEnd = null;
    npc.defeated = true;
    if (npc.giveItem) {
      Game.Player.addItem(npc.giveItem);
    }
  }

  function getCurrentDialog() {
    if (dialogIndex < dialogLines.length) {
      return dialogLines[dialogIndex];
    }
    return null;
  }

  function getCurrentNpc() {
    return currentNpc;
  }

  return {
    interact: interact,
    advance: advance,
    showDefeatedDialog: showDefeatedDialog,
    getCurrentDialog: getCurrentDialog,
    getCurrentNpc: getCurrentNpc
  };
})();
