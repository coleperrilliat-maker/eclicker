(function() {
  var canvas = document.getElementById('neon-dots-bg');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var dots = [];
  var mouse = { x: -1000, y: -1000 };
  var gridCols = 32;
  var gridRows = 24;
  var spacing = 0;
  var basePositions = [];
  var radius = 1.2;
  var influenceRadius = 160;
  var pullStrength = 0.2;
  var jitter = 0.65;

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    spacing = Math.min(Math.floor(w / gridCols), Math.floor(h / gridRows));
    basePositions.length = 0;
    for (var y = spacing / 2; y < h; y += spacing) {
      for (var x = spacing / 2; x < w; x += spacing) {
        var jx = (Math.random() - 0.5) * spacing * jitter;
        var jy = (Math.random() - 0.5) * spacing * jitter;
        basePositions.push({ x: x + jx, y: y + jy });
      }
    }
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  function animate() {
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < basePositions.length; i++) {
      var base = basePositions[i];
      var d = dist(base.x, base.y, mouse.x, mouse.y);
      var influence = 0;
      if (d < influenceRadius) {
        influence = (1 - d / influenceRadius) * pullStrength;
      }
      var x = base.x + (mouse.x - base.x) * influence;
      var y = base.y + (mouse.y - base.y) * influence;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(animate);
  }

  function onMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', function(e) {
    if (e.touches.length) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  });
  requestAnimationFrame(animate);
})();
