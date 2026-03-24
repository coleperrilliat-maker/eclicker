(function() {
  var container = document.getElementById('homeFloatingFaces');
  if (!container) return;

  var faceSize = 72;
  var padding = 40;
  var numFaces = 20;
  var faces = [];
  var rafId = null;

  function getExclusionRect() {
    var layout = document.querySelector('.home-page .home-layout');
    var quick = document.querySelector('.home-page .home-quicklinks');
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (layout) {
      var r = layout.getBoundingClientRect();
      minX = Math.min(minX, r.left - padding);
      minY = Math.min(minY, r.top - padding);
      maxX = Math.max(maxX, r.right + padding);
      maxY = Math.max(maxY, r.bottom + padding);
    }
    if (quick) {
      var q = quick.getBoundingClientRect();
      minX = Math.min(minX, q.left - padding);
      minY = Math.min(minY, q.top - padding);
      maxX = Math.max(maxX, q.right + padding);
      maxY = Math.max(maxY, q.bottom + padding);
    }
    if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function intersects(x, y, ex) {
    return !(x + faceSize <= ex.minX || x >= ex.maxX || y + faceSize <= ex.minY || y >= ex.maxY);
  }

  function bounceOffTextBorder(x, y, ex, w, h, vel) {
    var vx = vel.vx;
    var vy = vel.vy;
    if (x + faceSize > ex.minX && x < ex.maxX) {
      if (x + faceSize / 2 < (ex.minX + ex.maxX) / 2) {
        x = ex.minX - faceSize;
        if (vx > 0) vx = -vx;
      } else {
        x = ex.maxX;
        if (vx < 0) vx = -vx;
      }
    }
    if (y + faceSize > ex.minY && y < ex.maxY) {
      if (y + faceSize / 2 < (ex.minY + ex.maxY) / 2) {
        y = ex.minY - faceSize;
        if (vy > 0) vy = -vy;
      } else {
        y = ex.maxY;
        if (vy < 0) vy = -vy;
      }
    }
    x = Math.max(0, Math.min(w - faceSize, x));
    y = Math.max(0, Math.min(h - faceSize, y));
    return { x: x, y: y, vx: vx, vy: vy };
  }

  function facesOverlap(ax, ay, bx, by) {
    return ax < bx + faceSize && ax + faceSize > bx && ay < by + faceSize && ay + faceSize > by;
  }

  function resolveFaceCollision(a, b) {
    var overlapX = Math.min(a.x + faceSize, b.x + faceSize) - Math.max(a.x, b.x);
    var overlapY = Math.min(a.y + faceSize, b.y + faceSize) - Math.max(a.y, b.y);
    if (overlapX <= 0 || overlapY <= 0) return;
    if (overlapX < overlapY) {
      var half = overlapX / 2;
      if (a.x < b.x) {
        a.x -= half;
        b.x += half;
      } else {
        a.x += half;
        b.x -= half;
      }
      a.vx = -a.vx;
      b.vx = -b.vx;
    } else {
      var halfY = overlapY / 2;
      if (a.y < b.y) {
        a.y -= halfY;
        b.y += halfY;
      } else {
        a.y += halfY;
        b.y -= halfY;
      }
      a.vy = -a.vy;
      b.vy = -b.vy;
    }
  }

  function randomPosition(ex, w, h) {
    var x, y, tries = 0;
    do {
      x = Math.random() * (w - faceSize);
      y = Math.random() * (h - faceSize);
      tries++;
    } while (tries < 60 && intersects(x, y, ex));
    return { x: x, y: y };
  }

  function createFace() {
    var img = document.createElement('img');
    img.className = 'home-floating-face';
    img.src = 'click.png';
    img.alt = '';
    img.setAttribute('role', 'presentation');
    return img;
  }

  function placeFaces() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var ex = getExclusionRect();
    container.innerHTML = '';
    faces = [];
    for (var i = 0; i < numFaces; i++) {
      var pos = randomPosition(ex, w, h);
      var img = createFace();
      img.style.left = pos.x + 'px';
      img.style.top = pos.y + 'px';
      img.dataset.x = pos.x;
      img.dataset.y = pos.y;
      img.dataset.vx = (Math.random() - 0.5) * 0.8;
      img.dataset.vy = (Math.random() - 0.5) * 0.8;
      container.appendChild(img);
      faces.push(img);
    }
  }

  function drift() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var ex = getExclusionRect();
    var state = [];
    faces.forEach(function(img) {
      if (img.classList.contains('pop')) return;
      state.push({
        el: img,
        x: parseFloat(img.dataset.x) || 0,
        y: parseFloat(img.dataset.y) || 0,
        vx: parseFloat(img.dataset.vx) || 0,
        vy: parseFloat(img.dataset.vy) || 0
      });
    });
    state.forEach(function(s) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x <= 0 || s.x >= w - faceSize) { s.vx = -s.vx; s.x = Math.max(0, Math.min(w - faceSize, s.x)); }
      if (s.y <= 0 || s.y >= h - faceSize) { s.vy = -s.vy; s.y = Math.max(0, Math.min(h - faceSize, s.y)); }
      if (intersects(s.x, s.y, ex)) {
        var out = bounceOffTextBorder(s.x, s.y, ex, w, h, { vx: s.vx, vy: s.vy });
        s.x = out.x;
        s.y = out.y;
        s.vx = out.vx;
        s.vy = out.vy;
      }
    });
    for (var pass = 0; pass < 3; pass++) {
      for (var i = 0; i < state.length; i++) {
        for (var j = i + 1; j < state.length; j++) {
          if (facesOverlap(state[i].x, state[i].y, state[j].x, state[j].y)) {
            resolveFaceCollision(state[i], state[j]);
          }
        }
      }
    }
    state.forEach(function(s) {
      if (Math.random() < 0.008) {
        s.vx += (Math.random() - 0.5) * 0.15;
        s.vy += (Math.random() - 0.5) * 0.15;
        s.vx = Math.max(-1.2, Math.min(1.2, s.vx));
        s.vy = Math.max(-1.2, Math.min(1.2, s.vy));
      }
      s.el.dataset.x = s.x;
      s.el.dataset.y = s.y;
      s.el.dataset.vx = s.vx;
      s.el.dataset.vy = s.vy;
      s.el.style.left = s.x + 'px';
      s.el.style.top = s.y + 'px';
    });
    rafId = requestAnimationFrame(drift);
  }

  function onPopEnd(e) {
    if (e.animationName !== 'homeFacePop') return;
    var img = e.target;
    img.removeEventListener('animationend', onPopEnd);
    img.remove();
    var idx = faces.indexOf(img);
    if (idx !== -1) faces.splice(idx, 1);
    var w = window.innerWidth;
    var h = window.innerHeight;
    var ex = getExclusionRect();
    var pos = randomPosition(ex, w, h);
    var newImg = createFace();
    newImg.style.left = pos.x + 'px';
    newImg.style.top = pos.y + 'px';
    newImg.dataset.x = pos.x;
    newImg.dataset.y = pos.y;
    newImg.dataset.vx = (Math.random() - 0.5) * 0.8;
    newImg.dataset.vy = (Math.random() - 0.5) * 0.8;
    container.appendChild(newImg);
    faces.push(newImg);
    newImg.addEventListener('click', onClick);
  }

  function onClick(e) {
    var img = e.currentTarget;
    if (img.classList.contains('pop')) return;
    img.classList.add('pop');
    img.removeEventListener('click', onClick);
    img.addEventListener('animationend', onPopEnd);
  }

  function init() {
    placeFaces();
    faces.forEach(function(img) { img.addEventListener('click', onClick); });
    rafId = requestAnimationFrame(drift);
  }

  window.addEventListener('resize', function() {
    placeFaces();
    faces.forEach(function(img) { img.addEventListener('click', onClick); });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
