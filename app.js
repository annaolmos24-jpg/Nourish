(function () {
  'use strict';

  var USER_NAME = 'Oriana';
  var STORE_KEY = 'nourish.data.v1';
  var THEME_KEY = 'nourish.theme';
  var MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
  var MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  var OFF_FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url';

  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- Storage ---------- */
  function defaultData() {
    return {
      goals: { kcal: 2000, protein: 120, carbs: 230, fat: 65, water: 8 },
      days: {},     // 'YYYY-MM-DD' -> { entries: [], water: 0 }
      weights: [],  // { date, kg }
      unit: 'lb'
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultData();
      var d = JSON.parse(raw);
      var base = defaultData();
      return {
        goals: Object.assign(base.goals, d.goals || {}),
        days: d.days || {},
        weights: Array.isArray(d.weights) ? d.weights : [],
        unit: d.unit === 'kg' ? 'kg' : 'lb'
      };
    } catch (e) { return defaultData(); }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();
  var selected = isoDate(new Date());

  /* ---------- Dates ---------- */
  function isoDate(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseIso(s); d.setDate(d.getDate() + n); return isoDate(d); }
  function day(s) {
    if (!state.days[s]) state.days[s] = { entries: [], water: 0 };
    return state.days[s];
  }
  function peekDay(s) { return state.days[s] || { entries: [], water: 0 }; }

  /* ---------- Theme ---------- */
  function applyTheme(choice) {
    document.documentElement.setAttribute('data-theme', choice);
    try { localStorage.setItem(THEME_KEY, choice); } catch (e) {}
    document.querySelectorAll('[data-theme-choice]').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.themeChoice === choice));
    });
  }
  document.querySelectorAll('[data-theme-choice]').forEach(function (b) {
    b.addEventListener('click', function () { applyTheme(b.dataset.themeChoice); });
  });
  applyTheme(document.documentElement.getAttribute('data-theme') || 'system');

  /* ---------- Greeting ---------- */
  function renderGreeting() {
    var now = new Date();
    var h = now.getHours();
    var part = h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    $('#greeting').textContent = part + ', ' + USER_NAME + ' 👋';
    $('#today-label').textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    var tips = [
      'Welcome back! Small, steady choices add up to big results.',
      'Great to see you. Let’s make today a nourishing one.',
      'Hydration check: a glass of water is a great way to start.',
      'Remember to include a source of protein with every meal.',
      'Colorful plates are nutrient-dense plates — aim for variety.',
      'Progress, not perfection. You’re doing great.'
    ];
    $('#greeting-sub').textContent = tips[(now.getDate() + now.getMonth()) % tips.length];
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- Helpers ---------- */
  function round(n, dp) { var f = Math.pow(10, dp || 0); return Math.round((n || 0) * f) / f; }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function totals(s) {
    return peekDay(s).entries.reduce(function (a, e) {
      a.kcal += e.kcal; a.protein += e.protein; a.carbs += e.carbs; a.fat += e.fat; return a;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }
  var svgNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var e = document.createElementNS(svgNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  /* ---------- Summary ---------- */
  var RING_C = 2 * Math.PI * 52;
  function renderSummary() {
    var t = totals(selected), g = state.goals;
    var pct = Math.min(t.kcal / g.kcal, 1);
    var ring = $('#cal-ring');
    ring.style.strokeDasharray = RING_C;
    ring.style.strokeDashoffset = RING_C * (1 - pct);
    ring.classList.toggle('over', t.kcal > g.kcal);
    $('#cal-eaten').textContent = Math.round(t.kcal);
    var left = Math.round(g.kcal - t.kcal);
    $('#cal-remaining').textContent = left >= 0 ? left + ' kcal left of ' + g.kcal : Math.abs(left) + ' kcal over ' + g.kcal;

    var box = $('#macros');
    box.innerHTML = '';
    [['Protein', 'protein', 'var(--protein)'], ['Carbs', 'carbs', 'var(--carbs)'], ['Fat', 'fat', 'var(--fat)']].forEach(function (m) {
      var val = t[m[1]], goal = g[m[1]] || 1;
      var w = Math.min(val / goal, 1) * 100;
      var bar = el('div', { class: 'bar', role: 'progressbar', 'aria-label': m[0], 'aria-valuemin': '0', 'aria-valuemax': String(goal), 'aria-valuenow': String(Math.round(val)) });
      var fill = el('i'); fill.style.width = w + '%'; fill.style.background = m[2];
      bar.appendChild(fill);
      box.appendChild(el('div', null, [
        el('div', { class: 'macro-top' }, [el('b', { text: m[0] }), el('span', { class: 'muted', text: round(val) + ' / ' + goal + ' g' })]),
        bar
      ]));
    });
  }

  /* ---------- Water ---------- */
  function renderWater() {
    var d = peekDay(selected), goal = state.goals.water;
    var box = $('#glasses');
    box.innerHTML = '';
    var count = Math.max(goal, d.water);
    for (var i = 0; i < count; i++) {
      (function (idx) {
        box.appendChild(el('button', {
          type: 'button', class: 'glass' + (idx < d.water ? ' full' : ''),
          'aria-label': 'Glass ' + (idx + 1) + (idx < d.water ? ' (filled)' : ''),
          onclick: function () { setWater(idx < d.water && idx === d.water - 1 ? idx : idx + 1); }
        }));
      })(i);
    }
    $('#water-text').textContent = d.water + ' / ' + goal + ' glasses';
  }
  function setWater(n) {
    day(selected).water = Math.max(0, Math.min(30, n));
    save(); renderWater();
    if (day(selected).water === state.goals.water) toast('Hydration goal reached — nice work, ' + USER_NAME + '! 💧');
  }
  $('#water-plus').addEventListener('click', function () { setWater(peekDay(selected).water + 1); });
  $('#water-minus').addEventListener('click', function () { setWater(peekDay(selected).water - 1); });

  /* ---------- Meals ---------- */
  function renderMeals() {
    var d = peekDay(selected), box = $('#meal-list');
    box.innerHTML = '';
    $('#meals-count').textContent = d.entries.length ? d.entries.length + ' item' + (d.entries.length > 1 ? 's' : '') : '';
    MEALS.forEach(function (meal) {
      var items = d.entries.filter(function (e) { return e.meal === meal; });
      var kcal = items.reduce(function (a, e) { return a + e.kcal; }, 0);
      var group = el('div', { class: 'meal-group' }, [
        el('div', { class: 'meal-title' }, [el('span', { text: MEAL_LABELS[meal] }), el('span', { text: Math.round(kcal) + ' kcal' })])
      ]);
      if (!items.length) group.appendChild(el('div', { class: 'empty', text: 'Nothing logged yet.' }));
      items.forEach(function (e) {
        group.appendChild(el('div', { class: 'entry' }, [
          el('div', null, [
            el('div', { class: 'entry-name', text: e.name }),
            el('div', { class: 'entry-meta', text: round(e.grams) + ' g · ' + Math.round(e.kcal) + ' kcal · P ' + round(e.protein) + ' · C ' + round(e.carbs) + ' · F ' + round(e.fat) })
          ]),
          el('button', { type: 'button', class: 'del', 'aria-label': 'Remove ' + e.name, text: '✕', onclick: function () { removeEntry(e.id); } })
        ]));
      });
      box.appendChild(group);
    });
  }
  function removeEntry(id) {
    var d = day(selected);
    d.entries = d.entries.filter(function (e) { return e.id !== id; });
    save(); renderAll();
    toast('Entry removed');
  }

  /* ---------- Charts ---------- */
  function renderCalChart() {
    var W = 520, H = 200, P = { l: 36, r: 8, t: 12, b: 26 };
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(addDays(selected, -i));
    var vals = days.map(function (s) { return totals(s).kcal; });
    var goal = state.goals.kcal;
    var max = Math.max(goal * 1.15, Math.max.apply(null, vals) * 1.1, 100);
    var iw = W - P.l - P.r, ih = H - P.t - P.b, bw = iw / 7;
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Calories for the last 7 days' });
    [0, .5, 1].forEach(function (f) {
      var y = P.t + ih * (1 - f);
      s.appendChild(svg('line', { class: 'gridline', x1: P.l, x2: W - P.r, y1: y, y2: y }));
      var tx = svg('text', { x: P.l - 6, y: y + 4, 'text-anchor': 'end' }); tx.textContent = Math.round(max * f); s.appendChild(tx);
    });
    vals.forEach(function (v, idx) {
      var h = ih * (v / max), x = P.l + idx * bw + bw * .18, y = P.t + ih - h;
      var r = svg('rect', { class: 'bar-rect' + (days[idx] === selected ? ' today' : ''), x: x, y: y, width: bw * .64, height: Math.max(h, 0), rx: 6 });
      var title = svg('title'); title.textContent = days[idx] + ': ' + Math.round(v) + ' kcal'; r.appendChild(title);
      s.appendChild(r);
      var lbl = svg('text', { x: x + bw * .32, y: H - 8, 'text-anchor': 'middle' });
      lbl.textContent = parseIso(days[idx]).toLocaleDateString(undefined, { weekday: 'short' });
      s.appendChild(lbl);
    });
    var gy = P.t + ih * (1 - goal / max);
    s.appendChild(svg('line', { class: 'goal-line', x1: P.l, x2: W - P.r, y1: gy, y2: gy }));
    var box = $('#cal-chart'); box.innerHTML = ''; box.appendChild(s);
    var logged = vals.filter(function (v) { return v > 0; });
    $('#avg-cal').textContent = logged.length ? 'avg ' + Math.round(logged.reduce(function (a, b) { return a + b; }, 0) / logged.length) + ' kcal' : '';
  }

  function toUnit(kg) { return state.unit === 'kg' ? kg : kg * 2.20462; }
  function renderWeight() {
    $('#weight-unit').value = state.unit;
    var pts = state.weights.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(-30);
    var box = $('#weight-chart'); box.innerHTML = '';
    if (!pts.length) {
      box.appendChild(el('div', { class: 'empty', text: 'Log your weight to see your trend over time.' }));
      $('#weight-delta').textContent = '';
      return;
    }
    var vals = pts.map(function (p) { return toUnit(p.kg); });
    var first = vals[0], last = vals[vals.length - 1], diff = last - first;
    $('#weight-delta').textContent = round(last, 1) + ' ' + state.unit + (pts.length > 1 ? ' (' + (diff > 0 ? '+' : '') + round(diff, 1) + ')' : '');

    var W = 520, H = 180, P = { l: 40, r: 12, t: 12, b: 26 };
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max - min < 2) { min -= 1; max += 1; }
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var x = function (i) { return P.l + (pts.length === 1 ? iw / 2 : iw * i / (pts.length - 1)); };
    var y = function (v) { return P.t + ih * (1 - (v - min) / (max - min)); };
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Weight trend' });
    [min, (min + max) / 2, max].forEach(function (v) {
      s.appendChild(svg('line', { class: 'gridline', x1: P.l, x2: W - P.r, y1: y(v), y2: y(v) }));
      var t = svg('text', { x: P.l - 6, y: y(v) + 4, 'text-anchor': 'end' }); t.textContent = round(v, 1); s.appendChild(t);
    });
    if (pts.length > 1) {
      s.appendChild(svg('path', { class: 'line', d: vals.map(function (v, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(v); }).join(' ') }));
    }
    vals.forEach(function (v, i) {
      var c = svg('circle', { class: 'dot', cx: x(i), cy: y(v), r: 4 });
      var tt = svg('title'); tt.textContent = pts[i].date + ': ' + round(v, 1) + ' ' + state.unit; c.appendChild(tt);
      s.appendChild(c);
    });
    [0, pts.length - 1].filter(function (v, i, a) { return a.indexOf(v) === i; }).forEach(function (i) {
      var t = svg('text', { x: x(i), y: H - 8, 'text-anchor': pts.length === 1 ? 'middle' : i === 0 ? 'start' : 'end' });
      t.textContent = parseIso(pts[i].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      s.appendChild(t);
    });
    box.appendChild(s);
  }
  $('#weight-unit').addEventListener('change', function (e) { state.unit = e.target.value; save(); renderWeight(); });
  $('#weight-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = num($('#weight-input').value);
    if (v <= 0) return;
    var kg = state.unit === 'kg' ? v : v / 2.20462;
    state.weights = state.weights.filter(function (w) { return w.date !== selected; });
    state.weights.push({ date: selected, kg: kg });
    save(); renderWeight();
    $('#weight-input').value = '';
    toast('Weight logged for ' + parseIso(selected).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  });

  /* ---------- Date navigation ---------- */
  var picker = $('#date-picker');
  function setDate(s) { selected = s; picker.value = s; renderAll(); }
  picker.addEventListener('change', function () { if (picker.value) setDate(picker.value); });
  $('#prev-day').addEventListener('click', function () { setDate(addDays(selected, -1)); });
  $('#next-day').addEventListener('click', function () { setDate(addDays(selected, 1)); });
  $('#today-btn').addEventListener('click', function () { setDate(isoDate(new Date())); });

  /* ---------- Open Food Facts (free, no key) ---------- */
  function normalize(p) {
    var n = p.nutriments || {};
    var kcal = n['energy-kcal_100g'];
    if (kcal == null && n['energy_100g'] != null) kcal = n['energy_100g'] / 4.184; // kJ -> kcal
    return {
      code: p.code || '',
      name: (p.product_name || '').trim() || 'Unnamed product',
      brand: (Array.isArray(p.brands) ? p.brands.join(', ') : (p.brands || '')).split(',')[0].trim(),
      image: p.image_front_small_url || '',
      servingGrams: num(p.serving_quantity) || 0,
      servingLabel: p.serving_size || '',
      per100: { kcal: num(kcal), protein: num(n.proteins_100g), carbs: num(n.carbohydrates_100g), fat: num(n.fat_100g) }
    };
  }
  function fetchJson(url, ms) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, ms || 12000);
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function searchFoods(q) {
    if (/^\d{8,14}$/.test(q)) {
      return fetchJson('https://world.openfoodfacts.org/api/v2/product/' + q + '.json?fields=' + OFF_FIELDS)
        .then(function (d) { return d && d.status === 1 && d.product ? [d.product] : []; });
    }
    var primary = 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=24'
      + '&search_terms=' + encodeURIComponent(q) + '&fields=' + OFF_FIELDS;
    var fallback = 'https://search.openfoodfacts.org/search?page_size=24&q=' + encodeURIComponent(q) + '&fields=' + OFF_FIELDS;
    return fetchJson(primary).then(function (d) { return d.products || []; })
      .catch(function () { return fetchJson(fallback).then(function (d) { return d.hits || []; }); });
  }

  var lastResults = [];
  $('#search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = $('#search-input').value.trim();
    if (!q) return;
    var status = $('#search-status'), list = $('#results');
    status.innerHTML = '<span class="spinner"></span>Searching live food database…';
    list.innerHTML = '';
    searchFoods(q).then(function (products) {
      lastResults = products.map(normalize).filter(function (p) { return p.per100.kcal > 0 || p.per100.protein > 0 || p.per100.carbs > 0; });
      status.textContent = lastResults.length ? lastResults.length + ' result' + (lastResults.length > 1 ? 's' : '') + ' for “' + q + '”' : 'No foods with nutrition data found. Try another term, or add a custom food.';
      renderResults();
    }).catch(function () {
      status.textContent = 'Could not reach Open Food Facts right now. Check your connection and try again, or add a custom food.';
    });
  });
  function renderResults() {
    var list = $('#results');
    list.innerHTML = '';
    lastResults.forEach(function (p, i) {
      var thumb = p.image ? el('img', { class: 'thumb', src: p.image, alt: '', loading: 'lazy' }) : el('div', { class: 'thumb', text: '🍽️' });
      if (p.image) thumb.addEventListener('error', function () { thumb.replaceWith(el('div', { class: 'thumb', text: '🍽️' })); });
      list.appendChild(el('li', { class: 'result' }, [
        thumb,
        el('div', { style: 'min-width:0' }, [
          el('div', { class: 'result-name', text: p.name }),
          el('div', { class: 'result-meta', text: (p.brand ? p.brand + ' · ' : '') + Math.round(p.per100.kcal) + ' kcal / 100 g · P ' + round(p.per100.protein, 1) + ' C ' + round(p.per100.carbs, 1) + ' F ' + round(p.per100.fat, 1) })
        ]),
        el('button', { type: 'button', class: 'btn primary small', 'aria-label': 'Add ' + p.name, text: 'Add', onclick: function () { openFoodDialog(lastResults[i]); } })
      ]));
    });
  }

  /* ---------- Food dialog ---------- */
  var dlg = $('#food-dialog'), pending = null;
  function openFoodDialog(food) {
    pending = food;
    dlg.classList.toggle('custom', !food);
    $('#food-dialog-title').textContent = food ? food.name : 'Custom food';
    $('#food-dialog-info').textContent = food ? (food.brand ? food.brand + ' · ' : '') + (food.servingLabel ? 'Serving: ' + food.servingLabel : 'Values per 100 g') : 'Enter nutrition values per 100 g.';
    $('#serving-grams').value = food && food.servingGrams ? food.servingGrams : 100;
    $('#dialog-meal').value = $('#meal-select').value;
    ['#cf-name', '#cf-kcal', '#cf-protein', '#cf-carbs', '#cf-fat'].forEach(function (s) { $(s).value = ''; });
    $('#cf-name').required = !food;
    $('#cf-kcal').required = !food;
    updatePreview();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closeFoodDialog() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  function currentPer100() {
    if (pending) return pending.per100;
    return { kcal: num($('#cf-kcal').value), protein: num($('#cf-protein').value), carbs: num($('#cf-carbs').value), fat: num($('#cf-fat').value) };
  }
  function updatePreview() {
    var g = num($('#serving-grams').value), p = currentPer100(), f = g / 100;
    var box = $('#serving-preview'); box.innerHTML = '';
    [['kcal', Math.round(p.kcal * f)], ['protein', round(p.protein * f, 1) + 'g'], ['carbs', round(p.carbs * f, 1) + 'g'], ['fat', round(p.fat * f, 1) + 'g']].forEach(function (x) {
      box.appendChild(el('div', null, [el('b', { text: String(x[1]) }), el('span', { text: x[0] })]));
    });
  }
  ['#serving-grams', '#cf-kcal', '#cf-protein', '#cf-carbs', '#cf-fat'].forEach(function (s) { $(s).addEventListener('input', updatePreview); });
  $('#food-cancel').addEventListener('click', closeFoodDialog);
  $('#custom-food-btn').addEventListener('click', function () { openFoodDialog(null); });
  $('#food-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var g = num($('#serving-grams').value);
    if (g <= 0) return;
    var p = currentPer100(), f = g / 100;
    var name = pending ? pending.name + (pending.brand ? ' (' + pending.brand + ')' : '') : $('#cf-name').value.trim();
    if (!name) return;
    var meal = $('#dialog-meal').value;
    day(selected).entries.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name, meal: meal, grams: g,
      kcal: p.kcal * f, protein: p.protein * f, carbs: p.carbs * f, fat: p.fat * f
    });
    save(); closeFoodDialog(); renderAll();
    toast('Added to ' + MEAL_LABELS[meal]);
  });

  /* ---------- Goals dialog ---------- */
  var gdlg = $('#goals-dialog');
  $('#edit-goals').addEventListener('click', function () {
    var g = state.goals;
    $('#g-kcal').value = g.kcal; $('#g-protein').value = g.protein; $('#g-carbs').value = g.carbs; $('#g-fat').value = g.fat; $('#g-water').value = g.water;
    if (gdlg.showModal) gdlg.showModal(); else gdlg.setAttribute('open', '');
  });
  $('#goals-cancel').addEventListener('click', function () { gdlg.close ? gdlg.close() : gdlg.removeAttribute('open'); });
  $('#goals-form').addEventListener('submit', function (e) {
    e.preventDefault();
    state.goals = {
      kcal: Math.round(num($('#g-kcal').value)) || 2000,
      protein: Math.round(num($('#g-protein').value)),
      carbs: Math.round(num($('#g-carbs').value)),
      fat: Math.round(num($('#g-fat').value)),
      water: Math.round(num($('#g-water').value)) || 8
    };
    save(); gdlg.close ? gdlg.close() : gdlg.removeAttribute('open'); renderAll();
    toast('Goals updated');
  });

  /* ---------- Render ---------- */
  function renderAll() {
    renderSummary(); renderWater(); renderMeals(); renderCalChart(); renderWeight();
  }

  picker.value = selected;
  renderGreeting();
  renderAll();
  setInterval(renderGreeting, 60 * 1000);
})();
