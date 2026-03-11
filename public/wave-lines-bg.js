(function() {
  var canvas = document.getElementById('wave-lines-bg');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var mouse = { x: 0.5, y: 0.5 };
  var numLines = 12;
  var time = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function onMove(e) {
    var w = canvas.width;
    var h = canvas.height;
    if (e.touches) {
      e = e.touches[0];
    }
    mouse.x = (e.clientX || 0) / w;
    mouse.y = (e.clientY || 0) / h;
  }

  function draw() {
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    time += 0.012;

    for (var i = 0; i < numLines; i++) {
      var spacing = h / (numLines + 1);
      var baseY = spacing * (i + 1);
      var influence = 0.5 + 0.5 * Math.sin(time + i * 0.7);
      var pull = (mouse.y - baseY / h) * 80 * influence;
      var phase = time * 2 + i * 0.5 + mouse.x * 4;
      var amp = 8 + Math.sin(time + i) * 4;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 180, 255, 0.92)';
      ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(0, 180, 255, 0.9)';
      ctx.shadowBlur = 8;

      var segments = 80;
      for (var s = 0; s <= segments; s++) {
        var t = s / segments;
        var x = t * (w + 100) - 50;
        var normX = x / w;
        var distFromMouse = Math.abs(normX - mouse.x);
        var wavePull = distFromMouse < 0.15 ? (1 - distFromMouse / 0.15) * pull : 0;
        var y = baseY + Math.sin(t * Math.PI * 4 + phase) * amp + wavePull;

        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });

  draw();
})();
