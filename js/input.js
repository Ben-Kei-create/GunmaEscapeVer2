// Input handling
Game.Input = (function() {
  var keysDown = {};
  var keysPressed = {};
  var prevKeys = {};
  var touchDir = null;
  var touchConfirm = false;
  var touchCancel = false;
  var mouseConfirmQueued = false;
  var mouseCancelQueued = false;

  function init() {
    window.addEventListener('keydown', function(e) {
      keysDown[e.code] = true;
      e.preventDefault();
    });
    window.addEventListener('keyup', function(e) {
      keysDown[e.code] = false;
      e.preventDefault();
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

  function update() {
    keysPressed = {};
    for (var key in keysDown) {
      if (keysDown[key] && !prevKeys[key]) {
        keysPressed[key] = true;
      }
    }
    if (mouseConfirmQueued) {
      keysPressed.MouseConfirm = true;
      mouseConfirmQueued = false;
    }
    if (mouseCancelQueued) {
      keysPressed.MouseCancel = true;
      mouseCancelQueued = false;
    }
    prevKeys = {};
    for (var key in keysDown) {
      prevKeys[key] = keysDown[key];
    }
  }

  function isDown(action) {
    switch (action) {
      case 'up':    return keysDown['ArrowUp'] || keysDown['KeyW'] || touchDir === 'up';
      case 'down':  return keysDown['ArrowDown'] || keysDown['KeyS'] || touchDir === 'down';
      case 'left':  return keysDown['ArrowLeft'] || keysDown['KeyA'] || touchDir === 'left';
      case 'right': return keysDown['ArrowRight'] || keysDown['KeyD'] || touchDir === 'right';
      case 'confirm': return keysDown['KeyZ'] || keysDown['Enter'] || keysDown['Space'];
      case 'cancel':  return keysDown['KeyX'] || keysDown['Escape'];
    }
    return false;
  }

  function isPressed(action) {
    switch (action) {
      case 'up':    return keysPressed['ArrowUp'] || keysPressed['KeyW'];
      case 'down':  return keysPressed['ArrowDown'] || keysPressed['KeyS'];
      case 'left':  return keysPressed['ArrowLeft'] || keysPressed['KeyA'];
      case 'right': return keysPressed['ArrowRight'] || keysPressed['KeyD'];
      case 'confirm': return keysPressed['KeyZ'] || keysPressed['Enter'] || keysPressed['Space'] || keysPressed.MouseConfirm || touchConfirm;
      case 'cancel':  return keysPressed['KeyX'] || keysPressed['Escape'] || keysPressed.MouseCancel || touchCancel;
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
