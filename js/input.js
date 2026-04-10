// Input handling system with Keyboard, Mouse, Touch, and Gamepad support
Game.Input = (function() {
  var keysDown = {};
  var keysPressed = {};
  var prevKeys = {};

  // Touch & Mouse state
  var touchDir = null;
  var touchConfirm = false;
  var touchCancel = false;
  var prevTouchConfirm = false;
  var prevTouchCancel = false;
  var mouseConfirmQueued = false;
  var mouseCancelQueued = false;

  // Gamepad state
  var padState = {};
  var prevPadState = {};

  function init() {
    window.addEventListener('keydown', function(e) {
      keysDown[e.code] = true;
      // ゲームで使用するキーのみデフォルト動作（スクロール等）を防ぎ、F5やF12は通す
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyZ', 'KeyX', 'KeyQ', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].indexOf(e.code) !== -1) {
        e.preventDefault();
      }
    });
    
    window.addEventListener('keyup', function(e) {
      keysDown[e.code] = false;
    });

    // Touch support
    var canvas = document.getElementById('game');
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', function(e) {
      e.preventDefault();
      touchDir = null;
      touchConfirm = false;
      touchCancel = false;
    }, { passive: false });
    
    // Mouse support
    canvas.addEventListener('mousedown', function(e) {
      e.preventDefault();
      if (e.button === 2) {
        mouseCancelQueued = true;
        return;
      }
      mouseConfirmQueued = true;
    }, { passive: false });
    
    canvas.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    }, { passive: false });
  }

  function handleTouch(e) {
    e.preventDefault();
    var touch = e.touches[0];
    var rect = e.target.getBoundingClientRect();
    var x = (touch.clientX - rect.left) / rect.width;
    var y = (touch.clientY - rect.top) / rect.height;

    // Right side: confirm/cancel buttons
    if (x > 0.75) {
      if (y < 0.5) {
        touchConfirm = true;
      } else {
        touchCancel = true;
      }
      touchDir = null;
      return;
    }

    // Left side: D-pad
    if (x < 0.5) {
      var cx = 0.2, cy = 0.75;
      var dx = x - cx, dy = y - cy;
      if (Math.abs(dx) > Math.abs(dy)) {
        touchDir = dx > 0 ? 'right' : 'left';
      } else {
        touchDir = dy > 0 ? 'down' : 'up';
      }
    }
  }

  function updateGamepad() {
    // 前回の状態を保存
    for (var k in padState) {
      prevPadState[k] = padState[k];
    }
    // 状態をリセット
    padState = { up: false, down: false, left: false, right: false, confirm: false, cancel: false, journal: false };

    var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    var gp = null;
    for (var i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        gp = gamepads[i];
        break;
      }
    }
    
    if (!gp) return;

    var deadzone = 0.4; // スティックの遊び（誤爆防止）

    // 方向キー (D-Pad) と アナログスティック (Axes) の統合
    padState.up = (gp.buttons[12] && gp.buttons[12].pressed) || gp.axes[1] < -deadzone;
    padState.down = (gp.buttons[13] && gp.buttons[13].pressed) || gp.axes[1] > deadzone;
    padState.left = (gp.buttons[14] && gp.buttons[14].pressed) || gp.axes[0] < -deadzone;
    padState.right = (gp.buttons[15] && gp.buttons[15].pressed) || gp.axes[0] > deadzone;

    // ボタンマッピング (XInput標準準拠)
    // 0: A/Cross (決定)
    // 1: B/Circle (キャンセル)
    // 2: X/Square (決定・予備)
    // 3: Y/Triangle (依頼帳/メニュー)
    // 4: LB/L1 (依頼帳/メニュー)
    padState.confirm = (gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[2] && gp.buttons[2].pressed);
    padState.cancel = (gp.buttons[1] && gp.buttons[1].pressed);
    padState.journal = (gp.buttons[3] && gp.buttons[3].pressed) || (gp.buttons[4] && gp.buttons[4].pressed);
  }

  function update() {
    // 1. キーボードの更新
    keysPressed = {};
    for (var key in keysDown) {
      if (keysDown[key] && !prevKeys[key]) {
        keysPressed[key] = true;
      }
    }

    // 2. マウスの更新
    if (mouseConfirmQueued) {
      keysPressed.MouseConfirm = true;
      mouseConfirmQueued = false;
    }
    if (mouseCancelQueued) {
      keysPressed.MouseCancel = true;
      mouseCancelQueued = false;
    }

    // 3. 前回の状態を更新 (キーボード & タッチ)
    for (var k in keysDown) {
      prevKeys[k] = keysDown[k];
    }
    prevTouchConfirm = touchConfirm;
    prevTouchCancel = touchCancel;

    // 4. ゲームパッドの更新
    updateGamepad();
  }

  function isDown(action) {
    var p = padState[action] || false; // Gamepad
    switch (action) {
      case 'up':      return p || keysDown['ArrowUp'] || keysDown['KeyW'] || touchDir === 'up';
      case 'down':    return p || keysDown['ArrowDown'] || keysDown['KeyS'] || touchDir === 'down';
      case 'left':    return p || keysDown['ArrowLeft'] || keysDown['KeyA'] || touchDir === 'left';
      case 'right':   return p || keysDown['ArrowRight'] || keysDown['KeyD'] || touchDir === 'right';
      case 'confirm': return p || keysDown['KeyZ'] || keysDown['Enter'] || keysDown['Space'];
      case 'cancel':  return p || keysDown['KeyX'] || keysDown['Escape'];
      case 'journal': return p || keysDown['KeyQ'];
    }
    return false;
  }

  function isPressed(action) {
    var p = padState[action] && !prevPadState[action]; // Gamepad just pressed
    var tConfirm = touchConfirm && !prevTouchConfirm;
    var tCancel = touchCancel && !prevTouchCancel;

    switch (action) {
      case 'up':      return p || keysPressed['ArrowUp'] || keysPressed['KeyW'];
      case 'down':    return p || keysPressed['ArrowDown'] || keysPressed['KeyS'];
      case 'left':    return p || keysPressed['ArrowLeft'] || keysPressed['KeyA'];
      case 'right':   return p || keysPressed['ArrowRight'] || keysPressed['KeyD'];
      case 'confirm': return p || keysPressed['KeyZ'] || keysPressed['Enter'] || keysPressed['Space'] || keysPressed.MouseConfirm || tConfirm;
      case 'cancel':  return p || keysPressed['KeyX'] || keysPressed['Escape'] || keysPressed.MouseCancel || tCancel;
      case 'journal': return p || keysPressed['KeyQ'];
    }
    return false;
  }

  return {
    init: init,
    update: update,
    isDown: isDown,
    isPressed: isPressed
  };
})();