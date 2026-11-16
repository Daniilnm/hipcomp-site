/* HipComp — центральное изображение, вариант Б «Глубина».
   Пластина Si как тёмное стекло; под поверхностью — плоскости кристаллической решётки.
   Знак HC (малая форма) — не наклейка, а объём внутри материала: его точки есть
   на каждой глубине. Знак виден весь цикл.
   Цикл 10 с, без сброса:
   — плоскость фокуса уходит с поверхности вглубь и возвращается;
     резкий слой знака — тот, что в фокусе, остальные размыты;
   — по пластине по замкнутой «восьмёрке» плывёт лупа и показывает атомы на глубине фокуса;
   — когда фокус возвращается на поверхность, вдоль косого среза знака проходит луч
     и знак светится изнутри — затем фокус снова уходит вглубь.
   Одна перспективная камера, один источник света, все окружности и тени — в проекции.
   Цвет самой пластины натуральный (тёмное стекло, нейтральный торец); фирменный салатно-мятный
   появляется только в свете: блик, который обходит кромку за цикл, отсвет на торце под ним,
   мятный луч по срезу знака и свечение знака изнутри.
   Свет на всём цикле: у решётки нижний порог яркости, знак мягко светится всегда,
   по поверхности медленно гуляют два мягких световых пятна (тёплое из светлого тёплого и едва
   мятное), по стеклу проходит тёплый блик. Вид чуть сверху — пластина читается кругом.
   Подписи и шкалы нет: это художественный образ, а не техническая демонстрация. */
(function () {
  'use strict';
  var canvas = document.getElementById('stack');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var FREEZE = parseFloat(new URLSearchParams(location.search).get('frame'));

  var PAPER = [243, 241, 234], MINT = [131, 224, 190], GRAPH = [45, 44, 42];
  var WARM = PAPER; // тёплый блик — фирменный светлый тёплый #F3F1EA, без нового цвета
  var C_PAPER = '#F3F1EA', C_MINT = '#83E0BE', C_HOT = '#C9F2E2';
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function shade(c, k) { return k < 1 ? mix(GRAPH, c, k) : mix(c, PAPER, k - 1); }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function sm(t) { t = clamp(t); return t * t * (3 - 2 * t); }

  // ---- знак HC, только прямые; все наклонные грани под 59° ----
  var PATHS = [
    'M12.607 59.165L47.593 0.939L109.106 0.939L74.121 59.165Z',
    'M0 171.861L8.1 171.861L43.65 112.696L57.267 112.696L21.717 171.861L45.665 171.861L81.215 112.696L145.555 112.696L213.27 0L166.206 0L130.656 59.165L119.386 59.165L154.936 0L143.667 0L108.117 59.165L67.714 59.165Z',
    'M110.005 171.861L151.327 171.861L186.877 112.696L145.555 112.696Z',
    'M186.877 112.696L254.591 0L356.38 0L320.83 59.165L278.149 59.165L245.984 112.696L353.093 112.696L317.543 171.861L190.291 171.861L225.841 112.696Z',
    'M334.447 59.165L346.656 59.165L382.206 0L369.997 0Z'
  ];
  var MW = 382.206, MH = 171.861, MS = .8; // знак на пластине: 311 из 510 по ширине
  function parse(d) {
    var tok = d.match(/[MLHVZ]|-?\d*\.?\d+/g), pts = [], x = 0, y = 0, cmd = '', i = 0;
    while (i < tok.length) {
      if (/[A-Z]/.test(tok[i])) { cmd = tok[i++]; if (cmd === 'Z') continue; }
      if (cmd === 'M' || cmd === 'L') { x = +tok[i++]; y = +tok[i++]; }
      else if (cmd === 'H') x = +tok[i++]; else if (cmd === 'V') y = +tok[i++];
      pts.push([(x - MW / 2) * MS, (y - MH / 2) * MS]);
    }
    var l = pts[pts.length - 1], f = pts[0];
    if (Math.abs(l[0] - f[0]) < .01 && Math.abs(l[1] - f[1]) < .01) pts.pop();
    return pts;
  }
  var PIECES = PATHS.map(parse);
  // маска знака в мировых координатах — «точка внутри знака»
  var MK = 3, mask = document.createElement('canvas'); mask.width = Math.ceil(MW * MK); mask.height = Math.ceil(MH * MK);
  var mc = mask.getContext('2d'); mc.scale(MK, MK); PATHS.forEach(function (d) { mc.fill(new Path2D(d)); });
  var md = mc.getImageData(0, 0, mask.width, mask.height).data;
  function inMark(x, y) {
    var u = ((x / MS + MW / 2) * MK) | 0, v = ((y / MS + MH / 2) * MK) | 0;
    return u >= 0 && v >= 0 && u < mask.width && v < mask.height && md[(v * mask.width + u) * 4 + 3] > 127;
  }
  // направление косого среза знака (в плоскости пластины) и нормаль к нему — по ним идёт луч
  var SLANT = (function () { var dx = 12.6074 - 47.5932, dy = 59.1652 - 0.9391, l = Math.hypot(dx, dy); return [dx / l, dy / l]; })();
  var SN = [-SLANT[1], SLANT[0]];

  // ---- пластина: идеально круглая (без среза-ориентира — по просьбе заказчика) ----
  var R0 = 255, T = 12; // толщина торца: изящная пластина
  var WPTS = (function () {
    var n = 180, out = [];
    for (var i = 0; i < n; i++) { var a = 6.2832 * i / n; out.push([R0 * Math.cos(a), R0 * Math.sin(a)]); }
    return out;
  })();
  var WEDGES = edgesOf(WPTS);
  function edgesOf(pts) {
    var a = 0, k, edges = [];
    for (k = 0; k < pts.length; k++) { var p = pts[k], q = pts[(k + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    for (k = 0; k < pts.length; k++) {
      var p1 = pts[k], p2 = pts[(k + 1) % pts.length], dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy) || 1;
      edges.push([p1, p2, a > 0 ? dy / L : -dy / L, a > 0 ? -dx / L : dx / L]);
    }
    return edges;
  }

  // ---- плоскости решётки: поверхность и три глубины через равные шаги ----
  var DEPTHS = [-1, -4.5, -8, -11.5];
  var NP = DEPTHS.length, DZ = 3.5;
  var planes = [];
  (function build() {
    var FST = 9.2, MST = 4.6, RR = R0 * .935;
    for (var d = 0; d < NP; d++) {
      var off = d % 2 ? .5 : 0, field = [], mark = [];
      for (var i = -30; i <= 30; i++) for (var j = -30; j <= 30; j++) {
        var x = (i + off) * FST, y = (j + off) * FST;
        if (x * x + y * y < RR * RR && !inMark(x, y)) field.push(x, y);
      }
      for (var i2 = -40; i2 <= 40; i2++) for (var j2 = -20; j2 <= 20; j2++) {
        var x2 = (i2 + off) * MST, y2 = (j2 + off) * MST;
        if (inMark(x2, y2)) mark.push(x2, y2);
      }
      planes.push({ z: DEPTHS[d], field: field, mark: mark });
    }
  })();

  // ---- камера ----
  // один источник света: слева, спереди, сверху (x вправо, y к зрителю, z вверх)
  var LIGHT = (function () { var v = [-.5, .55, .67], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  var SHADOW = [-LIGHT[0] / LIGHT[2], -LIGHT[1] / LIGHT[2]];
  var LOOP = 10, P = 44 * Math.PI / 180, cosP = Math.cos(P), sinP = Math.sin(P), CAM = 2400;
  var CAMY = CAM * sinP, CAMZ = CAM * cosP;

  var W = 0, H = 0, dpr = 1, s = 1, cx = 0, cy = 0, narrow = false;
  var yaw = 0, cyw = 1, syw = 0;
  var t0 = performance.now(), running = false, visible = true, raf = 0;

  function projW(xr, yr, z) { var k = s * CAM / (CAM - yr * sinP - z * cosP); return [cx + xr * k, cy + (yr * cosP - z * sinP) * k, k]; }
  function rot(x, y) { return [x * cyw - y * syw, x * syw + y * cyw]; }
  function proj(x, y, z) { return projW(x * cyw - y * syw, x * syw + y * cyw, z); }
  function poly(pts, z, k) {
    ctx.beginPath(); k = k || 1;
    for (var i = 0; i < pts.length; i++) { var p = proj(pts[i][0] * k, pts[i][1] * k, z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.closePath();
  }
  function markPath(z) {
    ctx.beginPath();
    PIECES.forEach(function (pts) { for (var i = 0; i < pts.length; i++) { var p = proj(pts[i][0], pts[i][1], z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.closePath(); });
  }
  function circle(c, r, z) { ctx.beginPath(); for (var i = 0; i <= 72; i++) { var a = i / 72 * 6.2832, p = proj(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.closePath(); }
  function lightOf(nx, ny) { return .42 + .7 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1]); }
  // торец: только грани, обращённые к камере, от дальних к ближним
  function sides(z0, z1, colorFn) {
    var faces = [];
    for (var e = 0; e < WEDGES.length; e++) {
      var E = WEDGES[e], nx = E[2] * cyw - E[3] * syw, ny = E[2] * syw + E[3] * cyw, m = rot((E[0][0] + E[1][0]) / 2, (E[0][1] + E[1][1]) / 2);
      if (nx * -m[0] + ny * (CAMY - m[1]) <= 0) continue;
      faces.push([m[1], E[0], E[1], nx, ny, Math.atan2((E[0][1] + E[1][1]) / 2, (E[0][0] + E[1][0]) / 2)]);
    }
    faces.sort(function (p, q) { return p[0] - q[0]; });
    for (var f = 0; f < faces.length; f++) {
      var F = faces[f], p1 = proj(F[1][0], F[1][1], z1), p2 = proj(F[2][0], F[2][1], z1), p3 = proj(F[2][0], F[2][1], z0), p4 = proj(F[1][0], F[1][1], z0);
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle = colorFn(lightOf(F[3], F[4]), F[5]); ctx.fill(); ctx.lineWidth = .5; ctx.stroke();
    }
  }
  // атом — маленький квадрат в плоскости пластины (укорочен по глубине, как всё в этой плоскости)
  function dot(x, y, z, w, a) {
    if (a < .012) return;
    var p = proj(x, y, z), ww = w * p[2], hh = Math.max(.7, ww * cosP);
    ctx.globalAlpha = a > 1 ? 1 : a;
    ctx.fillRect(p[0] - ww / 2, p[1] - hh / 2, ww, hh);
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    narrow = W < 560;
    // габарит пластины в проекции при s = 1 — по нему масштаб и оптический центр
    s = 1; cx = 0; cy = 0; yaw = 0; cyw = 1; syw = 0;
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    WPTS.forEach(function (p) { [0, -T].forEach(function (z) { var q = projW(p[0], p[1], z); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }); });
    var CX = narrow ? .5 : .46;
    s = Math.min(W * (narrow ? .9 : .84) / (x1 - x0), H * (narrow ? .84 : .8) / (y1 - y0));
    cx = W * CX - (x0 + x1) / 2 * s;
    cy = H * .5 - (y0 + y1) / 2 * s;
    if (!running) frame(performance.now());
  }

  // ---- таймлайн ----
  // u: 0 — фокус на поверхности, 1 — на самой глубокой плоскости
  function focusAt(lt) {
    if (lt < 4.4) return sm(seg(lt, .3, 4.4));
    if (lt < 5.0) return 1;
    if (lt < 8.0) return 1 - sm(seg(lt, 5.0, 8.0));
    return 0;
  }

  function frame(now) {
    var t = (now - t0) / 1000;
    if (reduce.matches) t = 8.9;
    if (FREEZE >= 0) t = FREEZE;
    var lt = t % LOOP, first = t < LOOP && !(FREEZE >= 0) && !reduce.matches;

    var th = 6.2832 * lt / LOOP;
    var u = focusAt(lt), zf = DEPTHS[0] + (DEPTHS[NP - 1] - DEPTHS[0]) * u;
    var surf = 1 - sm(seg(u, 0, .35));                    // фокус у поверхности: знак светится изнутри
    var breathe = .9 + .1 * Math.sin(th * 3);
    // луч вдоль косого среза знака — когда фокус вернулся на поверхность
    var sw = seg(lt, 7.3, 9.7), beamOn = lt > 7.3 && lt < 9.7, bw = 34;
    var bpos = -R0 * 1.15 + sw * R0 * 2.3, bA = Math.sin(sw * Math.PI);
    var intro = first ? sm(seg(lt, 0, 1.1)) : 1;
    // блик фирменного цвета обходит кромку за цикл (от левого переднего края, по направлению к свету)
    var rimA = 2.2 + 6.2832 * lt / LOOP;

    yaw = -.03 + .07 * Math.sin(th); cyw = Math.cos(yaw); syw = Math.sin(yaw);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = intro;

    // 1. мягкая тень на столе по направлению света
    for (var i = 5; i >= 0; i--) {
      var kk = 1 + i * .02, off = 10 + i * 2;
      ctx.fillStyle = 'rgba(0,0,0,' + (.05 + (5 - i) * .014) * intro + ')'; ctx.beginPath();
      for (var j = 0; j < WPTS.length; j++) { var r0 = rot(WPTS[j][0] * kk, WPTS[j][1] * kk), pp = projW(r0[0] + SHADOW[0] * off, r0[1] + SHADOW[1] * off, -T - 8); j ? ctx.lineTo(pp[0], pp[1]) : ctx.moveTo(pp[0], pp[1]); }
      ctx.closePath(); ctx.fill();
    }
    // 2. торец — тёмное стекло с фаской
    sides(-T, -1.5, function (l, a) { return rgba(mix(shade([62, 60, 57], l * .9), MINT, .38 * rimK(a, rimA) * intro), 1); });
    sides(-1.5, 0, function (l, a) { return rgba(mix(shade([74, 72, 68], .95 + l * .4), MINT, .5 * rimK(a, rimA) * intro), 1); });
    // 3. толща под поверхностью
    var far = proj(0, -R0, 0), near = proj(0, R0, 0);
    var g = ctx.createLinearGradient(far[0], far[1], near[0], near[1]);
    g.addColorStop(0, '#3a3935'); g.addColorStop(.55, '#272623'); g.addColorStop(1, '#1d1c1a');
    poly(WPTS, 0); ctx.fillStyle = g; ctx.fill();

    // 4. плоскости решётки, от глубоких к поверхности
    ctx.save(); poly(WPTS, 0); ctx.clip();
    for (var d = NP - 1; d >= 0; d--) {
      var L = planes[d], z = L.z, f = Math.exp(-Math.pow((z - zf) / (DZ * .62), 2)), depthK = 1 - d * .12;
      var F = L.field, litD = [];
      ctx.fillStyle = C_PAPER;
      for (var q = 0; q < F.length; q += 2) {
        var lit = beamOn ? Math.exp(-Math.pow((F[q] * SN[0] + F[q + 1] * SN[1] - bpos + d * 5) / bw, 2)) * bA : 0;
        dot(F[q], F[q + 1], z, 1.25 + .5 * lit, (.1 + .13 * f + .12 * lit) * depthK * intro);
        if (lit > .03) litD.push(F[q], F[q + 1], lit);
      }
      // отсвет луча на атомах — мятный, поверх натурального цвета
      ctx.fillStyle = C_MINT;
      for (var q3 = 0; q3 < litD.length; q3 += 3) dot(litD[q3], litD[q3 + 1], z, 1.25 + .5 * litD[q3 + 2], .26 * litD[q3 + 2] * depthK * intro);
      // знак: резкий слой в фокусе, остальные — мягкие и крупнее (расфокус)
      var M = L.mark, crisp = f > .5;
      ctx.fillStyle = crisp ? C_HOT : C_MINT;
      var aM = (.36 + .8 * f + .2 * surf) * (1 - d * .05) * breathe * intro, wM = 1.35 + 1.4 * (1 - f);
      for (var q2 = 0; q2 < M.length; q2 += 2) {
        var lit2 = beamOn ? Math.exp(-Math.pow((M[q2] * SN[0] + M[q2 + 1] * SN[1] - bpos + d * 5) / bw, 2)) * bA : 0;
        dot(M[q2], M[q2 + 1], z, wM + .6 * lit2, aM * (1 - .45 * (1 - f)) + .5 * lit2);
      }
      ctx.globalAlpha = 1;
      // мутность стекла между плоскостями — глубина
      if (d > 0) { poly(WPTS, z + DZ / 2); ctx.fillStyle = 'rgba(23,23,22,' + .055 * intro + ')'; ctx.fill(); }
    }
    ctx.globalAlpha = intro;
    // знак мягко светится изнутри весь цикл, ярче — когда фокус у поверхности
    ctx.shadowColor = rgba(MINT, .55); ctx.shadowBlur = 20 * s * dpr;
    markPath(zf); ctx.fillStyle = rgba(MINT, (.06 + .1 * surf) * breathe * intro); ctx.fill();
    ctx.shadowBlur = 0;
    // срез знака на глубине фокуса и плоскость фокуса
    ctx.lineWidth = 1;
    markPath(zf); ctx.strokeStyle = rgba(MINT, .7 + .2 * surf); ctx.stroke();
    poly(WPTS, zf, .965); ctx.strokeStyle = rgba(MINT, .2 * (1 - surf)); ctx.stroke();
    // отсвет луча на поверхности — полоса в плоскости пластины
    if (beamOn) {
      [[bw * 1.6, .03], [bw * .7, .05], [bw * .22, .07]].forEach(function (b) {
        var qd = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (k) { return [SN[0] * (bpos + k[1] * b[0]) + SLANT[0] * k[0] * R0 * 1.5, SN[1] * (bpos + k[1] * b[0]) + SLANT[1] * k[0] * R0 * 1.5]; });
        poly(qd, 0); ctx.fillStyle = rgba(mix(PAPER, MINT, .45), b[1] * bA); ctx.fill();
      });
    }
    // 5. свет по всей поверхности: два медленных мягких пятна (тёплое и едва мятное)
    glow(R0 * .52 * Math.cos(th + .6), R0 * .42 * Math.sin(2 * th + .6), R0 * .62, WARM, .085 * intro);
    glow(R0 * .55 * Math.cos(th + 3.4), R0 * .45 * Math.sin(2 * th + 3.9), R0 * .5, MINT, .035 * intro);
    // стекло: тёплый блик медленно проходит по поверхности за цикл; френелевский отлив дальнего края
    var dir = [.62, .78], nrm = [-dir[1], dir[0]], sh = Math.sin(th - .8), c0 = [-R0 * .3 + nrm[0] * sh * R0 * .55, -R0 * .1 + nrm[1] * sh * R0 * .55];
    [[60, .02], [26, .035], [9, .04]].forEach(function (b) {
      poly([[-1.6, -1], [1.6, -1], [1.6, 1], [-1.6, 1]].map(function (k) { return [c0[0] + dir[0] * k[0] * R0 + nrm[0] * k[1] * b[0], c0[1] + dir[1] * k[0] * R0 + nrm[1] * k[1] * b[0]]; }), 0);
      ctx.fillStyle = rgba(WARM, b[1] * intro); ctx.fill();
    });
    var fg = ctx.createLinearGradient(far[0], far[1], near[0], near[1]);
    fg.addColorStop(0, rgba(PAPER, .09)); fg.addColorStop(.4, rgba(PAPER, 0));
    poly(WPTS, 0); ctx.fillStyle = fg; ctx.fill();
    ctx.restore();

    // 6. кромка и бегущий по ней мятный блик
    var eg = ctx.createLinearGradient(proj(-R0, 0, 0)[0], 0, proj(R0, 0, 0)[0], 0);
    eg.addColorStop(0, rgba(PAPER, .62)); eg.addColorStop(.5, rgba(PAPER, .3)); eg.addColorStop(1, rgba(PAPER, .2));
    ctx.strokeStyle = eg; ctx.lineWidth = 1.2; poly(WPTS, 0); ctx.stroke();
    ctx.strokeStyle = rgba(PAPER, .07 * intro); ctx.lineWidth = 1; poly(WPTS, 0, .975); ctx.stroke();
    drawRim(rimA, intro);

    // 7. лупа: «восьмёрка» над пластиной, показывает решётку на глубине фокуса
    drawLoupe(th, zf, u, intro);

    ctx.globalAlpha = 1;
    if (running) raf = requestAnimationFrame(frame);
  }

  // мягкое световое пятно в плоскости пластины (радиальный градиент, сжатый по глубине как сама плоскость)
  function glow(x, y, r, col, a) {
    var p = proj(x, y, 0), rr = r * p[2];
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, cosP);
    var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(.55, rgba(col, a * .4)); gr.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gr; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore();
  }

  // сила мятного блика для точки кромки под углом a (блик — в rimA, ширина ~±25°)
  function rimK(a, rimA) {
    var d = Math.atan2(Math.sin(a - rimA), Math.cos(a - rimA));
    return Math.exp(-Math.pow(d / .44, 2));
  }
  // блик по верхней кромке: тонкая линия с мягким ореолом, без неона
  function drawRim(rimA, intro) {
    ctx.save(); ctx.lineCap = 'round';
    [[5, .07], [2.4, .16], [1.1, .7]].forEach(function (w) {
      ctx.lineWidth = w[0];
      for (var i = 0; i < WPTS.length; i++) {
        var q = WPTS[(i + 1) % WPTS.length];
        var a = Math.atan2((WPTS[i][1] + q[1]) / 2, (WPTS[i][0] + q[0]) / 2), k = rimK(a, rimA);
        if (k < .02) continue;
        var p1 = proj(WPTS[i][0], WPTS[i][1], 0), p2 = proj(q[0], q[1], 0);
        ctx.strokeStyle = rgba(MINT, w[1] * k * intro); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
      }
    });
    ctx.restore();
  }

  function drawLoupe(th, zf, u, intro) {
    var ph = th - 6.2832 * .9 + Math.PI / 2;               // в 9 с лупа у правого края знака, центр свободен
    var C = [148 * Math.sin(ph), -14 + 50 * Math.sin(2 * ph)];
    var RL = narrow ? 58 : 64, HL = 24, MAG = 2.8;
    // точка плоскости фокуса, видимая через центр линзы, — по лучу камеры
    var cr = rot(C[0], C[1]), q = (CAMZ - zf) / (CAMZ - HL);
    var hr = [cr[0] * q, CAMY + (cr[1] - CAMY) * q];
    var hit = [hr[0] * cyw + hr[1] * syw, -hr[0] * syw + hr[1] * cyw];
    // тень оправы на пластине
    ctx.save(); poly(WPTS, 0); ctx.clip();
    var so = [SHADOW[0] * HL, SHADOW[1] * HL], sc = [C[0] + so[0] * cyw + so[1] * syw, C[1] - so[0] * syw + so[1] * cyw];
    circle(sc, RL + 2, 0); ctx.fillStyle = 'rgba(0,0,0,' + .24 * intro + ')'; ctx.fill();
    ctx.restore();
    // вид сквозь линзу
    ctx.save(); circle(C, RL, HL); ctx.clip();
    circle(C, RL * 1.3, 0); ctx.fillStyle = '#141413'; ctx.fill();
    var ST = 3.3, rr = RL * 1.45 / MAG;
    for (var d = NP - 1; d >= 0; d--) {
      var z0 = DEPTHS[d], f = Math.exp(-Math.pow((z0 - zf) / (DZ * .62), 2)), zz = zf + (z0 - zf) * MAG, off = d % 2 ? ST / 2 : 0;
      for (var x = Math.floor((hit[0] - rr) / ST) * ST; x <= hit[0] + rr; x += ST) for (var y = Math.floor((hit[1] - rr) / ST) * ST; y <= hit[1] + rr; y += ST) {
        var px = x + off, py = y + off;
        if (px * px + py * py > R0 * R0 * .87) continue;
        var on = inMark(px, py), mx = hit[0] + (px - hit[0]) * MAG, my = hit[1] + (py - hit[1]) * MAG;
        ctx.fillStyle = on ? (f > .5 ? C_HOT : C_MINT) : C_PAPER;
        dot(mx, my, zz, (on ? 3.6 : 2.6) * (1 + 1.2 * (1 - f)), ((on ? .25 + .75 * f : .1 + .35 * f) * (1 - .4 * (1 - f))) * intro);
      }
      ctx.globalAlpha = 1;
      if (d > 0) { circle(C, RL * 1.4, zf + (z0 + DZ / 2 - zf) * MAG); ctx.fillStyle = 'rgba(20,20,19,.3)'; ctx.fill(); }
    }
    ctx.globalAlpha = intro;
    var cp = proj(C[0], C[1], HL), R = RL * cp[2];
    var lg = ctx.createRadialGradient(cp[0] - R * .45, cp[1] - R * .3, 0, cp[0], cp[1], R * 1.15);
    lg.addColorStop(0, rgba(PAPER, .13)); lg.addColorStop(.5, rgba(PAPER, .02)); lg.addColorStop(1, rgba(MINT, .1));
    ctx.fillStyle = lg; ctx.fillRect(cp[0] - R * 1.5, cp[1] - R * 1.5, R * 3, R * 3);
    ctx.restore();
    // оправа: тонкое кольцо с толщиной, верх светлее
    for (var h = 0; h <= 4; h++) { circle(C, RL, HL - 4 + h); ctx.strokeStyle = h === 4 ? rgba(PAPER, .7 * intro) : rgba(GRAPH, .95 * intro); ctx.lineWidth = h === 4 ? 1.2 : 1.6; ctx.stroke(); }
    circle(C, RL + 1.6, HL); ctx.strokeStyle = rgba(MINT, .35 * intro); ctx.lineWidth = 1; ctx.stroke();
  }

  function start() {
    if (running || reduce.matches || FREEZE >= 0 || !visible || document.hidden) return;
    running = true; raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: .02 }).observe(canvas);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { stop(); frame(performance.now()); start(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  resize();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { resize(); start(); });
})();
