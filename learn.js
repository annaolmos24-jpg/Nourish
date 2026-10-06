// Learn tab: calorie calculator, meal plan templates, healthy plate, food facts, tips and myths.
// Content comes from learn-data.js; logging and goals go through window.Nourish (see app.js).
(function () {
  'use strict';

  var L = window.NOURISH_LEARN;
  var N = window.Nourish;
  if (!L || !N) return;

  var MEALS = [['breakfast', 'Breakfast', '🌅'], ['lunch', 'Lunch', '🥗'], ['dinner', 'Dinner', '🍽️'], ['snack', 'Snack', '🍎']];
  var ACTIVITY = [
    [1.2, 'Sedentary (little exercise)'],
    [1.375, 'Lightly active (1–3 workouts/week)'],
    [1.55, 'Moderately active (3–5/week)'],
    [1.725, 'Very active (6–7/week)'],
    [1.9, 'Athlete / physical job']
  ];
  var PROFILE_KEY = 'nourish.profile.v1';
  var selectedPlan = L.PLANS[0].id;
  var root = document.getElementById('learn-view');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n, dp) { return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: dp || 0 }); }
  function loadProfile() {
    try { return Object.assign({ sex: 'female', age: null, heightCm: null, weightKg: null, activity: 1.375 }, JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}); }
    catch (e) { return { sex: 'female', age: null, heightCm: null, weightKg: null, activity: 1.375 }; }
  }
  function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {} }
  var profile = loadProfile();

  function dayOfYear() {
    var now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  }
  function planTotals(plan, meal) {
    var items = meal ? plan.meals[meal] : [].concat.apply([], MEALS.map(function (m) { return plan.meals[m[0]]; }));
    return items.reduce(function (t, it) {
      return { kcal: t.kcal + it[1], protein: t.protein + it[2], carbs: t.carbs + it[3], fat: t.fat + it[4] };
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }
  function currentPlan() {
    return L.PLANS.filter(function (p) { return p.id === selectedPlan; })[0] || L.PLANS[0];
  }

  /* ---------- Calculator (Mifflin-St Jeor) ---------- */
  function calc() {
    var kg = profile.weightKg || N.latestWeightKg();
    if (!(profile.age > 0 && profile.heightCm > 0 && kg > 0)) return null;
    var bmr = 10 * kg + 6.25 * profile.heightCm - 5 * profile.age + (profile.sex === 'male' ? 5 : -161);
    var tdee = bmr * profile.activity;
    var floor = profile.sex === 'male' ? 1500 : 1200;
    var bmi = kg / Math.pow(profile.heightCm / 100, 2);
    var target = Math.max(Math.round((tdee - 500) / 10) * 10, floor);
    var protein = Math.round(kg * 1.4);
    var fat = Math.round(target * 0.3 / 9);
    return {
      kg: kg, bmi: bmi, floor: floor,
      bmiLabel: bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy range' : bmi < 30 ? 'overweight' : 'obese range',
      options: [
        ['Maintain', tdee],
        ['Lose ~0.5 lb / week', Math.max(tdee - 250, floor)],
        ['Lose ~1 lb / week', Math.max(tdee - 500, floor)]
      ],
      goals: { kcal: target, protein: protein, fat: fat, carbs: Math.max(Math.round((target - protein * 4 - fat * 9) / 4), 0) }
    };
  }

  function renderCalcResults() {
    var box = document.getElementById('calc-results');
    var r = calc();
    if (!r) { box.innerHTML = '<p class="empty">Fill in your age, height and weight to see your numbers.</p>'; return; }
    box.innerHTML =
      '<div class="calc-grid">' +
        r.options.map(function (o) {
          return '<div class="stat-mini"><span>' + o[0] + '</span><strong>' + fmt(Math.round(o[1] / 10) * 10) + '</strong><small>kcal / day</small></div>';
        }).join('') +
        '<div class="stat-mini"><span>BMI</span><strong>' + fmt(r.bmi, 1) + '</strong><small>' + r.bmiLabel + '</small></div>' +
      '</div>' +
      '<p class="small muted">Suggested daily goals for steady loss: <b>' + fmt(r.goals.kcal) + ' kcal</b>, ' + r.goals.protein + ' g protein, ' +
        r.goals.carbs + ' g carbs, ' + r.goals.fat + ' g fat.' +
        (r.goals.kcal === r.floor ? ' We don\'t suggest going below ' + fmt(r.floor) + ' kcal without medical supervision.' : '') + '</p>' +
      '<div class="row gap wrap">' +
        '<button type="button" class="btn primary" data-learn="apply-calc">Use these as my goals</button>' +
        '<span class="small muted">BMI is a screening tool. It doesn\'t account for muscle, age or body shape.</span>' +
      '</div>';
  }

  /* ---------- Render ---------- */
  function render() {
    var plan = currentPlan();
    var pt = planTotals(plan);
    var metric = N.unit() === 'kg';
    var kg = profile.weightKg || N.latestWeightKg();
    var ft = profile.heightCm ? Math.floor(profile.heightCm / 30.48) : '';
    var inch = profile.heightCm ? Math.round((profile.heightCm / 2.54) % 12) : '';
    var fact = L.FACTS[dayOfYear() % L.FACTS.length];
    var unit = N.unit();

    root.innerHTML =
      '<section class="learn-intro">' +
        '<h1>Learn &amp; plan</h1>' +
        '<p class="muted">Weight-loss basics, ready-made meal plans, food facts and everyday tips.</p>' +
      '</section>' +

      '<nav class="jump-nav" aria-label="Learn sections">' +
        [['calc', '🧮 Calorie calculator'], ['plans', '🥗 Meal plans'], ['plate', '🍽️ Healthy plate'], ['facts', '🔎 Food facts'], ['tips', '💡 Tips'], ['myths', '❓ Myths vs. facts']]
          .map(function (s) { return '<button type="button" class="chip" data-learn="jump" data-target="learn-' + s[0] + '">' + s[1] + '</button>'; }).join('') +
      '</nav>' +

      '<section class="card fact-day">' +
        '<div class="fact-emoji" aria-hidden="true">' + fact.emoji + '</div>' +
        '<div><div class="small muted"><b>Food fact of the day</b></div><h2>' + esc(fact.title) + '</h2><p>' + esc(fact.text) + '</p></div>' +
      '</section>' +

      '<section class="card stack" id="learn-calc">' +
        '<div><h2>🧮 How many calories do I need?</h2>' +
        '<p class="muted small">Your body burns energy at rest (BMR) plus through daily activity. Eating a little less than that total creates the deficit that leads to fat loss. This uses the Mifflin-St Jeor equation, the one most dietitians use.</p></div>' +
        '<form id="calc-form" class="calc-form">' +
          '<label class="field"><span>Sex</span><select id="c-sex"><option value="female"' + (profile.sex !== 'male' ? ' selected' : '') + '>Female</option><option value="male"' + (profile.sex === 'male' ? ' selected' : '') + '>Male</option></select></label>' +
          '<label class="field"><span>Age</span><input id="c-age" type="number" min="15" max="100" inputmode="numeric" value="' + (profile.age || '') + '" /></label>' +
          (metric
            ? '<label class="field"><span>Height (cm)</span><input id="c-cm" type="number" min="100" max="250" inputmode="decimal" value="' + (profile.heightCm ? Math.round(profile.heightCm) : '') + '" /></label>'
            : '<label class="field"><span>Height (ft)</span><input id="c-ft" type="number" min="3" max="8" inputmode="numeric" value="' + ft + '" /></label>' +
              '<label class="field"><span>(in)</span><input id="c-in" type="number" min="0" max="11" inputmode="numeric" value="' + inch + '" /></label>') +
          '<label class="field"><span>Weight (' + unit + ')</span><input id="c-w" type="number" min="50" step="0.1" inputmode="decimal" value="' + (kg ? Math.round(N.toUnit(kg) * 10) / 10 : '') + '" /></label>' +
          '<label class="field wide"><span>Activity</span><select id="c-act">' +
            ACTIVITY.map(function (a) { return '<option value="' + a[0] + '"' + (profile.activity === a[0] ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') +
          '</select></label>' +
        '</form>' +
        '<div id="calc-results"></div>' +
      '</section>' +

      '<section class="card stack" id="learn-plans">' +
        '<div><h2>🥗 Meal plan templates</h2>' +
        '<p class="muted small">One-day templates you can repeat or mix and match. Tap <b>Add</b> to log a meal to the day you have selected in the tracker, or add the whole day at once. Adjust portions to fit your calorie goal.</p></div>' +
        '<div class="chips" role="group" aria-label="Choose a plan">' +
          L.PLANS.map(function (p) {
            return '<button type="button" class="chip' + (p.id === plan.id ? ' active' : '') + '" data-learn="plan" data-id="' + p.id + '" aria-pressed="' + (p.id === plan.id) + '">' + p.emoji + ' ' + esc(p.name) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="plan-head">' +
          '<div>' +
            '<h3>' + plan.emoji + ' ' + esc(plan.name) + ' · ~' + fmt(Math.round(pt.kcal / 10) * 10) + ' kcal</h3>' +
            '<p class="small muted">' + esc(plan.summary) + '</p>' +
            '<p class="small dots"><span style="--c:var(--protein)">' + pt.protein + ' g protein</span><span style="--c:var(--carbs)">' + pt.carbs + ' g carbs</span><span style="--c:var(--fat)">' + pt.fat + ' g fat</span></p>' +
          '</div>' +
          '<button type="button" class="btn primary" data-learn="add-day">+ Add whole day</button>' +
        '</div>' +
        '<div class="plan-grid">' +
          MEALS.map(function (m) {
            var t = planTotals(plan, m[0]);
            return '<div class="plan-meal">' +
              '<div class="card-head"><h3>' + m[2] + ' ' + m[1] + ' <span class="muted small">' + fmt(t.kcal) + ' kcal</span></h3>' +
              '<button type="button" class="btn ghost small" data-learn="add-meal" data-meal="' + m[0] + '">+ Add</button></div>' +
              '<ul class="plan-items">' + plan.meals[m[0]].map(function (it) {
                return '<li><span>' + esc(it[0]) + '</span><span class="muted">' + it[1] + ' kcal · ' + it[2] + ' g P</span></li>';
              }).join('') + '</ul>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<details class="shopping"><summary>🛒 Shopping list for this plan</summary><ul>' +
          plan.shopping.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
        '</ul></details>' +
      '</section>' +

      '<section class="card plate-card" id="learn-plate">' +
        '<svg viewBox="0 0 200 200" class="plate" role="img" aria-label="Healthy plate: half vegetables, a quarter protein, a quarter whole grains">' +
          '<circle cx="100" cy="100" r="96" fill="var(--surface-2)" stroke="var(--border)" stroke-width="2"/>' +
          '<path d="M100 100 L100 14 A86 86 0 0 0 100 186 Z" fill="var(--primary)" opacity=".75"/>' +
          '<path d="M100 100 L100 14 A86 86 0 0 1 186 100 Z" fill="var(--protein)" opacity=".75"/>' +
          '<path d="M100 100 L186 100 A86 86 0 0 1 100 186 Z" fill="var(--carbs)" opacity=".75"/>' +
          '<text x="55" y="104" text-anchor="middle" class="plate-label">Veggies</text>' +
          '<text x="138" y="66" text-anchor="middle" class="plate-label">Protein</text>' +
          '<text x="138" y="144" text-anchor="middle" class="plate-label">Grains</text>' +
        '</svg>' +
        '<div class="stack">' +
          '<h2>🍽️ The healthy plate</h2>' +
          '<p>An easy way to build balanced meals without counting every calorie:</p>' +
          '<ul class="plain-list">' +
            '<li><b>½ vegetables & fruit</b>: leafy greens, peppers, broccoli, berries. High volume, low calories.</li>' +
            '<li><b>¼ lean protein</b>: chicken, fish, eggs, tofu, beans, Greek yogurt.</li>' +
            '<li><b>¼ whole grains or starch</b>: brown rice, quinoa, oats, potatoes, whole-wheat pasta.</li>' +
            '<li><b>A thumb of healthy fat</b>: olive oil, avocado, nuts or seeds.</li>' +
            '<li><b>Water</b> as your main drink.</li>' +
          '</ul>' +
        '</div>' +
      '</section>' +

      '<section class="stack" id="learn-facts">' +
        '<h2>🔎 Food facts</h2>' +
        '<div class="facts">' +
          L.FACTS.map(function (f) {
            return '<article class="card fact"><div class="fact-emoji" aria-hidden="true">' + f.emoji + '</div><div><h3>' + esc(f.title) + '</h3><p class="small">' + esc(f.text) + '</p></div></article>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="stack" id="learn-tips">' +
        '<h2>💡 Tips that work</h2>' +
        '<div class="tips-grid">' +
          L.TIPS.map(function (t) {
            return '<article class="card"><h3 class="tip-title">' + t.emoji + ' ' + esc(t.title) + '</h3><ul class="check-list">' +
              t.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></article>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="stack" id="learn-myths">' +
        '<h2>❓ Myths vs. facts</h2>' +
        L.MYTHS.map(function (m) {
          return '<details class="card myth"><summary><span class="myth-tag">Myth</span> ' + esc(m.myth) + '</summary>' +
            '<p><span class="fact-tag">Fact</span> ' + esc(m.fact) + '</p></details>';
        }).join('') +
      '</section>' +

      '<p class="muted small">This information is general education, not medical advice. If you\'re pregnant, managing a health condition, or taking medication, check with your doctor or a registered dietitian before changing your diet. Nutrition values are approximate.</p>';

    document.getElementById('calc-form').addEventListener('input', function () {
      profile.sex = document.getElementById('c-sex').value;
      profile.age = parseFloat(document.getElementById('c-age').value) || null;
      profile.heightCm = metric
        ? parseFloat(document.getElementById('c-cm').value) || null
        : ((parseFloat(document.getElementById('c-ft').value) || 0) * 12 + (parseFloat(document.getElementById('c-in').value) || 0)) * 2.54 || null;
      var w = parseFloat(document.getElementById('c-w').value);
      profile.weightKg = w > 0 ? N.fromUnit(w) : null;
      profile.activity = parseFloat(document.getElementById('c-act').value);
      saveProfile();
      renderCalcResults();
    });
    document.getElementById('calc-form').addEventListener('submit', function (e) { e.preventDefault(); });
    renderCalcResults();
  }

  function addPlanMeals(meals) {
    var plan = currentPlan();
    var items = [];
    meals.forEach(function (meal) {
      plan.meals[meal].forEach(function (it) {
        items.push({ name: it[0], meal: meal, kcal: it[1], protein: it[2], carbs: it[3], fat: it[4] });
      });
    });
    N.addEntries(items);
    N.toast(meals.length > 1
      ? 'Added the ' + plan.name + ' day (' + items.length + ' items) ✓'
      : 'Added ' + plan.name + ' ' + meals[0] + ' ✓');
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-learn]');
    if (!b) return;
    var action = b.getAttribute('data-learn');
    if (action === 'jump') {
      var t = document.getElementById(b.getAttribute('data-target'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'plan') {
      selectedPlan = b.getAttribute('data-id');
      render();
      document.getElementById('learn-plans').scrollIntoView({ block: 'start' });
    } else if (action === 'add-meal') {
      addPlanMeals([b.getAttribute('data-meal')]);
    } else if (action === 'add-day') {
      addPlanMeals(MEALS.map(function (m) { return m[0]; }));
    } else if (action === 'apply-calc') {
      var r = calc();
      if (!r) return;
      N.setGoals(r.goals);
      N.toast('Goals updated: ' + fmt(r.goals.kcal) + ' kcal a day ✓');
    }
  });

  window.NourishLearn = { render: render };
})();
