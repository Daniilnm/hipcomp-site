/* HipComp — поведение страницы: язык, шапка, меню, появление блоков,
   окна «Написать нам» / «Загрузить BOM», поиск, мобильная панель действий. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var CFG = window.HC_CONFIG || {};

  /* ---------- Язык ---------- */
  var DICT = window.HC_I18N || { en: {}, ru: {} };
  var RU = {};
  $$('[data-i18n]').forEach(function (el) { RU[el.dataset.i18n] = el.innerHTML.trim(); });
  $$('[data-i18n-ph]').forEach(function (el) { RU[el.dataset.i18nPh] = el.getAttribute('placeholder'); });
  $$('[data-i18n-aria]').forEach(function (el) { RU[el.dataset.i18nAria] = el.getAttribute('aria-label'); });
  Object.keys(DICT.ru || {}).forEach(function (k) { if (!(k in RU)) RU[k] = DICT.ru[k]; });
  var lang = 'ru';
  function t(k) { return (lang === 'en' ? DICT.en[k] : RU[k]) || RU[k] || DICT.en[k] || k; }
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'ru';
    root.lang = lang;
    $$('[data-i18n]').forEach(function (el) { el.innerHTML = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    $$('[data-lang-toggle]').forEach(function (b) {
      $$('[data-l]', b).forEach(function (s) { s.dataset.l === lang ? s.setAttribute('aria-current', 'true') : s.removeAttribute('aria-current'); });
      b.setAttribute('aria-label', lang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    });
    document.title = lang === 'ru' ? 'HipComp — полупроводниковые материалы для микроэлектроники' : 'HipComp — semiconductor materials for microelectronics';
    try { localStorage.setItem('hc-lang', lang); } catch (e) {}
    if (searchInput && searchInput.value) renderSearch();
  }
  var searchInput = $('#srch-q');
  var initLang = new URLSearchParams(location.search).get('lang');
  if (!initLang) { try { initLang = localStorage.getItem('hc-lang'); } catch (e) {} }
  setLang(initLang || 'ru');
  $$('[data-lang-toggle]').forEach(function (b) { b.addEventListener('click', function () { setLang(lang === 'ru' ? 'en' : 'ru'); }); });

  /* ---------- Уведомление ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  /* ---------- Шапка ---------- */
  var hdr = $('#hdr');
  // шапка уезжает вместе со страницей, а лупа отделяется и сопровождает прокрутку — на ПК и на телефоне (ориентир — quanttelecom.ru)
  function onScroll() {
    var y = window.scrollY;
    if (y > 12 && !root.classList.contains('is-past-hdr')) placeSearch();
    hdr.classList.toggle('is-stuck', y > 12);
    root.classList.toggle('is-past-hdr', y > hdr.offsetHeight * .6);
  }
  // плавающая лупа встаёт по одной вертикали с лупой в шапке — будто та продолжает путь вместе с прокруткой
  var fsearch = $('#fsearch'), hsearch = $('.hdr__tools [data-open="search"]');
  function placeSearch() {
    if (!fsearch || !hsearch) return;
    var r = hsearch.getBoundingClientRect();
    fsearch.style.left = Math.round(r.left + r.width / 2 - fsearch.offsetWidth / 2) + 'px';
    fsearch.style.right = 'auto';
  }
  window.addEventListener('resize', placeSearch); placeSearch();
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // активный пункт меню
  if ('IntersectionObserver' in window) {
    var navMap = {};
    $$('.nav a.nav__a[href^="#"]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = navMap[e.target.id]; if (!a) return;
        if (e.isIntersecting) { Object.keys(navMap).forEach(function (k) { navMap[k].removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); }
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) secIO.observe(s); });
  }

  /* ---------- Мобильное меню ---------- */
  var burger = $('.burger'), mnav = $('#mnav');
  function menu(open) {
    mnav.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
    root.style.overflow = open ? 'hidden' : '';
    hdr.classList.toggle('is-menu', open);
    if (open) { var f = $('a, button', mnav); if (f) f.focus({ preventScroll: true }); }
  }
  burger.addEventListener('click', function () { menu(mnav.hidden); });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"], a[href$=".html"], [data-open]')) menu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) { menu(false); burger.focus(); } });
  window.matchMedia('(min-width:1081px)').addEventListener('change', function (m) { if (m.matches) menu(false); });

  /* ---------- Появление блоков ---------- */
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        rio.unobserve(e.target);
      });
    }, { threshold: .12 });
    root.classList.add('reveal-ready');
    $$('[data-reveal]').forEach(function (el) { rio.observe(el); });
  }

  /* ---------- Окна ---------- */
  var dialogs = { contact: $('#dlg-contact'), bom: $('#dlg-bom'), search: $('#dlg-search') };
  function openDlg(name) {
    var d = dialogs[name]; if (!d) return;
    if (!mnav.hidden) menu(false);
    Object.keys(dialogs).forEach(function (k) { if (dialogs[k].open && k !== name) closeDlg(dialogs[k]); });
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    root.style.overflow = 'hidden';
    var first = name === 'search' ? searchInput : $('[data-view="form"] input:not([type=radio]):not([type=file]), [data-view="form"] textarea', d);
    if (name === 'search') { searchInput.value = ''; renderSearch(); }
    setTimeout(function () { if (first) first.focus(); }, 30);
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); openDlg(o.dataset.open); }
  });
  Object.keys(dialogs).forEach(function (k) {
    var d = dialogs[k];
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeDlg(d); return; }
      // клик по подложке
      if (e.target === d || e.target.classList.contains('srch')) {
        var box = $('.dlg__box, .srch', d).getBoundingClientRect();
        if (e.clientY > box.bottom || e.clientY < box.top || e.clientX < box.left || e.clientX > box.right) closeDlg(d);
      }
    });
    d.addEventListener('close', function () { afterClose(d); });
  });
  // очистка после закрытия: вызывается сразу и ещё раз из события close (Esc)
  function afterClose(d) {
    var anyOpen = Object.keys(dialogs).some(function (k) { return dialogs[k].open; });
    if (!anyOpen && mnav.hidden) root.style.overflow = '';
    var f = $('form', d);
    if (f && f.dataset.done) resetForm(f);
  }
  function closeDlg(d) { if (d.open) d.close(); afterClose(d); }

  /* ---------- Формы ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function fld(input) { return input.closest('.fld'); }
  function mark(el, bad) { var f = el.classList.contains('fld') || el.classList.contains('drop') ? el : fld(el); if (f) f.classList.toggle('is-err', bad); }

  function validateContact(form, report) {
    var ok = true, firstBad = null;
    var E = form.elements, name = E.namedItem('name'), phone = E.namedItem('phone'), email = E.namedItem('email'), consent = E.namedItem('consent');
    function bad(el, cond) { if (report) mark(el, cond); if (cond) { ok = false; firstBad = firstBad || el; } }
    bad(name, !name.value.trim());
    var hasPhone = phone.value.replace(/\D/g, '').length >= 10;
    var emailVal = email.value.trim();
    var emailBad = emailVal && !EMAIL.test(emailVal);
    bad(email, !!emailBad);
    bad(phone, !hasPhone && !(emailVal && !emailBad));
    if (report) $('.fld__err--consent', form).classList.toggle('is-on', !consent.checked);
    if (!consent.checked) { ok = false; firstBad = firstBad || consent; }
    return { ok: ok, first: firstBad };
  }

  var bomFile = null;
  var BOM_EXT = ['xlsx', 'xls', 'csv', 'pdf', 'txt'], BOM_MAX = 10 * 1024 * 1024;
  function fileError(f) {
    if (!f) return 'err.fileReq';
    var ext = (f.name.split('.').pop() || '').toLowerCase();
    if (BOM_EXT.indexOf(ext) < 0) return 'err.fileType';
    if (f.size > BOM_MAX) return 'err.fileSize';
    return '';
  }
  function validateBom(form, report) {
    var ok = true, firstBad = null;
    var drop = $('#drop'), errEl = $('[data-err="file"]', drop);
    var fe = fileError(bomFile);
    if (report) { drop.classList.toggle('is-err', !!fe); errEl.textContent = fe ? t(fe) : ''; errEl.classList.toggle('is-on', !!fe); }
    if (fe) { ok = false; firstBad = $('#fb-file'); }
    var email = form.elements.namedItem('email'), consent = form.elements.namedItem('consent'), ev = email.value.trim();
    if (report) mark(email, !EMAIL.test(ev));
    if (!EMAIL.test(ev)) { ok = false; firstBad = firstBad || email; }
    if (report) $('.fld__err--consent', form).classList.toggle('is-on', !consent.checked);
    if (!consent.checked) { ok = false; firstBad = firstBad || consent; }
    return { ok: ok, first: firstBad };
  }

  function showView(form, view) {
    $$('[data-view]', form).forEach(function (v) { v.hidden = v.dataset.view !== view; });
  }
  function resetForm(form) {
    form.reset(); delete form.dataset.done; delete form.dataset.tried;
    $$('.is-err', form).forEach(function (e) { e.classList.remove('is-err'); });
    $$('.is-on', form).forEach(function (e) { e.classList.remove('is-on'); });
    $('.form-msg', form).textContent = '';
    if (form.id === 'form-bom') setFile(null);
    showView(form, 'form');
  }

  function wireForm(form, validate, kind) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.dataset.tried = '1';
      var v = validate(form, true);
      var msg = $('.form-msg', form);
      msg.textContent = ''; msg.classList.remove('is-err');
      if (!v.ok) { if (v.first) v.first.focus(); return; }
      var btn = $('button[type="submit"]', form), label = $('span', btn), was = label.innerHTML;
      btn.disabled = true; label.textContent = t('sending');
      var fd = new FormData(form);
      fd.set('form', kind); fd.set('lang', lang); fd.set('page', location.href);
      if (kind === 'bom') { fd.delete('file'); if (bomFile) fd.append('file', bomFile, bomFile.name); }
      var send = CFG.formEndpoint
        ? fetch(CFG.formEndpoint, { method: 'POST', body: fd }).then(function (r) { if (!r.ok) throw new Error(r.status); })
        : new Promise(function (res) { console.info('[HipComp] ' + RU.demo + ':', Object.fromEntries(fd.entries())); setTimeout(res, 700); });
      send.then(function () {
        form.dataset.done = '1';
        showView(form, 'done');
        var c = $('[data-view="done"] [data-close]', form); if (c) c.focus();
      }).catch(function () {
        msg.textContent = t('err.send'); msg.classList.add('is-err');
      }).then(function () { btn.disabled = false; label.innerHTML = was; });
    });
    // повторная проверка после первой попытки
    form.addEventListener('input', function () { if (form.dataset.tried) validate(form, true); });
    form.addEventListener('change', function () { if (form.dataset.tried) validate(form, true); });
  }
  wireForm($('#form-contact'), validateContact, 'contact');
  wireForm($('#form-bom'), validateBom, 'bom');

  /* загрузка файла */
  var drop = $('#drop'), fileInp = $('#fb-file');
  function fmtSize(b) { var en = lang === 'en'; return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', en ? '.' : ',') + (en ? ' MB' : ' МБ') : Math.max(1, Math.round(b / 1024)) + (en ? ' KB' : ' КБ'); }
  function setFile(f) {
    bomFile = f || null;
    $('.drop__zone', drop).hidden = !!f;
    $('.drop__file', drop).hidden = !f;
    $('.drop__name', drop).textContent = f ? f.name + ', ' + fmtSize(f.size) : '';
    if (!f) fileInp.value = '';
    // проверяем только файл: остальные поля человек ещё не заполнял
    var fe = f ? fileError(f) : ($('#form-bom').dataset.tried ? 'err.fileReq' : '');
    var errEl = $('[data-err="file"]', drop);
    drop.classList.toggle('is-err', !!fe);
    errEl.textContent = fe ? t(fe) : '';
    errEl.classList.toggle('is-on', !!fe);
  }
  fileInp.addEventListener('change', function () { setFile(fileInp.files[0]); });
  $('.drop__rm', drop).addEventListener('click', function () { setFile(null); fileInp.focus(); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) setFile(f); });

  /* ---------- Поиск ---------- */
  var CATEGORIES = [
    { label: 'cat.c1', go: '#cat-semi', k: 'si кремний silicon пластины wafers sic карбид кремния silicon carbide gaas арсенид галлия gallium arsenide inp фосфид индия indium phosphide сапфир sapphire al2o3' },
    { label: 'cat.c2', go: '#cat-ceramic', k: 'керамика ceramics al2o3 оксид алюминия alumina aln нитрид алюминия aluminium nitride aluminum nitride si3n4 нитрид кремния silicon nitride' },
    { label: 'cat.c3', go: '#cat-epi', k: 'gan/sic gan/si algan/gan ingaas/inp gan sic inp нитрид галлия gallium nitride гетероструктуры heterostructures hemt фотоника photonics' }
  ];
  var IDX = CATEGORIES.concat([
    { label: 'nav.about', k: 'о компании about company миссия mission', go: '#about' },
    { label: 'nav.catalog', k: 'каталог catalog продукция products подложки substrates', go: '#catalog' },
    { label: 'nav.bom', k: 'bom спецификация перечень файл excel upload specification', open: 'bom' },
    { label: 'nav.write', k: 'написать заявка кп коммерческое предложение quote contact связаться', open: 'contact' },
    { label: 'nav.contacts', k: 'контакты телефон почта адрес phone email address', go: '#contacts' },
    { label: 'nav.news', k: 'новости news', href: 'news.html' }
  ]);
  function resultTitle(x) { return t(x.label).replace(/&nbsp;/g, ' '); }
  var resEl = $('#srch-res'), sel = 0, hits = [];
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[₀-₉]/g, function (c) { return String(c.charCodeAt(0) - 8320); }); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(text, q) {
    if (!q) return esc(text);
    var i = norm(text).indexOf(q);
    return i < 0 ? esc(text) : esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }
  function renderSearch() {
    var q = norm(searchInput.value.trim());
    if (!q) {
      hits = CATEGORIES;
    } else {
      hits = IDX.map(function (x) {
        var title = norm(resultTitle(x)), kw = norm(x.k), s = 0;
        if (title.indexOf(q) === 0) s = 70; else if (title.indexOf(q) > -1) s = 50;
        else if (kw.indexOf(q) > -1) s = 30;
        return { x: x, s: s };
      }).filter(function (h) { return h.s > 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (h) { return h.x; });
    }
    sel = 0;
    if (!hits.length) {
      searchInput.removeAttribute('aria-activedescendant');
      resEl.innerHTML = '<li class="srch__empty" role="option" aria-disabled="true">' + esc(t('s.empty')) + '</li>';
      return;
    }
    resEl.innerHTML = hits.map(function (x, i) {
      var group = CATEGORIES.indexOf(x) >= 0 ? '<span class="s-cat">' + esc(t('nav.catalog')) + '</span>' : '';
      return '<li role="option" id="sr-' + i + '" data-i="' + i + '" aria-selected="' + (i === 0) + '"><b>' + hl(resultTitle(x), q) + '</b>' + group + '</li>';
    }).join('');
    searchInput.setAttribute('aria-activedescendant', 'sr-0');
  }
  function move(d) {
    if (!hits.length) return;
    sel = (sel + d + hits.length) % hits.length;
    $$('li[data-i]', resEl).forEach(function (li) { li.setAttribute('aria-selected', String(+li.dataset.i === sel)); });
    var cur = $('#sr-' + sel); if (cur) { cur.scrollIntoView({ block: 'nearest' }); searchInput.setAttribute('aria-activedescendant', cur.id); }
  }
  function pick(i) {
    var x = hits[i]; if (!x) return;
    closeDlg(dialogs.search);
    if (x.open) return openDlg(x.open);
    if (x.href) { location.href = x.href; return; }
    var target = $(x.go); if (!target) return;
    var category = target.classList.contains('card');
    if (category) target.classList.add('is-in');
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: category ? 'center' : 'start' });
    if (category) target.focus({ preventScroll: true });
  }
  searchInput.addEventListener('input', renderSearch);
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
  });
  resEl.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) pick(+li.dataset.i); });
  resEl.addEventListener('mousemove', function (e) { var li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== sel) move(+li.dataset.i - sel); });
  document.addEventListener('keydown', function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    var anyOpen = Object.keys(dialogs).some(function (k) { return dialogs[k].open; });
    if (anyOpen) return;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openDlg('search'); }
  });

  /* ---------- Мобильная панель действий ---------- */
  var bar = $('#actbar'), hero = $('.hero'), contacts = $('#contacts');
  if (bar && 'IntersectionObserver' in window) {
    var heroOut = false, ctIn = false;
    function upd() {
      var on = heroOut && !ctIn;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', String(!on));
      $$('a, button', bar).forEach(function (b) { b.tabIndex = on ? 0 : -1; });
    }
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; upd(); }, { rootMargin: '-40% 0px 0px 0px' }).observe(hero);
    new IntersectionObserver(function (es) { ctIn = es[0].isIntersecting; upd(); }).observe(contacts);
  }
})();
