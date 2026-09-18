// src/app.js
// Основная логика тренажёра EasyEnglish + связка с Firebase Auth / Firestore.

import { watchAuthState, loginUser, registerUser, logoutUser, friendlyAuthError } from './auth.js';
import { loadAccount, saveProgress, saveSettings, defaultProgress, defaultSettings } from './db.js';
import { initAnalyticsIfAvailable } from './firebase.js';

initAnalyticsIfAvailable();

(function () {

  // ================= DATA (без изменений по сравнению с исходником) =================

  const possQuestions = [
    ["This is ___ car.", "(I)", ["my", "mine", "me", "I's"], 0],
    ["Is this pen ___?", "(you)", ["your", "yours", "you's", "yourself"], 1],
    ["___ dog is very friendly.", "(he)", ["His", "He's", "Him", "Hers"], 0],
    ["This bag is ___.", "(she)", ["her", "hers", "she's", "herself"], 1],
    ["The cat licked ___ paw.", "(it)", ["it's", "its", "its'", "it"], 1],
    ["We love ___ new house.", "(we)", ["our", "ours", "us", "we's"], 0],
    ["That house is ___.", "(we)", ["our", "ours", "us", "we"], 1],
    ["They finished ___ homework.", "(they)", ["their", "theirs", "them", "they's"], 0],
    ["This book is ___.", "(they)", ["their", "theirs", "them", "they"], 1],
    ["Is that ___ phone?", "(you)", ["your", "yours", "you", "you's"], 0],
    ["___ name is Anna.", "(I)", ["My", "Mine", "Me", "I's"], 0],
    ["This is not my pen, it's ___.", "(he)", ["him", "his", "he's", "himself"], 1],
    ["___ sister lives in Paris.", "(she)", ["Hers", "Her", "She's", "Herself"], 1],
    ["That umbrella is ___.", "(I)", ["my", "mine", "me", "myself"], 1],
    ["The dog wagged ___ tail.", "(it)", ["it's", "its", "their", "it"], 1],
    ["This is ___ classroom.", "(we)", ["our", "ours", "us", "we"], 0],
    ["Are these ___ keys?", "(you)", ["your", "yours", "you", "you's"], 0],
    ["That car is ___, not mine.", "(he)", ["he", "his", "him", "he's"], 1],
    ["___ parents are teachers.", "(they)", ["Theirs", "Their", "They", "Them"], 1],
    ["This seat is ___.", "(she)", ["her", "hers", "she", "herself"], 1],
    ["___ team won the match.", "(we)", ["Our", "Ours", "Us", "We's"], 0],
    ["Whose bag is this? It's ___.", "(I)", ["my", "mine", "me", "I"], 1],
    ["___ eyes are blue.", "(she)", ["Hers", "Her", "She's", "Herself"], 1],
    ["The children lost ___ toys.", "(they)", ["theirs", "their", "them", "they"], 1],
    ["Is this seat ___?", "(he)", ["he", "him", "his", "he's"], 2],
    ["___ house has a garden.", "(they)", ["Theirs", "Their", "Them", "They's"], 1],
    ["This laptop is ___.", "(you)", ["your", "yours", "you", "yourself"], 1],
    ["The bird built ___ nest.", "(it)", ["it's", "its", "their", "it"], 1],
    ["___ idea was brilliant.", "(she)", ["Hers", "Her", "She's", "Herself"], 1],
    ["That's ___ — I recognize it.", "(I)", ["my", "mine", "me", "myself"], 1]
  ];

  const natQuestions = [
    ["Как называется житель страны America?", null, ["American", "Americanish", "Americain", "Americanian"], 0],
    ["Из какой страны British?", null, ["Britain", "Britanish", "Britainian", "Britian"], 0],
    ["Как называется житель страны Germany?", null, ["German", "Germanish", "Germanian", "Germaniac"], 0],
    ["Как называется житель страны Spain?", null, ["Spanish", "Spainish", "Spanian", "Spanor"], 0],
    ["Как называется житель страны Japan?", null, ["Japanese", "Japanish", "Japaneese", "Japanian"], 0],
    ["Как называется житель страны Ukraine?", null, ["Ukrainian", "Ukrainish", "Ukranian", "Ukraineian"], 0],
    ["Как называется житель страны Brazil?", null, ["Brazilian", "Brazilish", "Brazillian", "Braziliar"], 0],
    ["Как называется житель страны India?", null, ["Indian", "Indianish", "Indiane", "Indain"], 0],
    ["Как называется житель страны Greece?", null, ["Greek", "Greekish", "Greecian", "Greeky"], 0],
    ["Как называется житель страны Australia?", null, ["Australian", "Australish", "Austrailian", "Australiane"], 0],
    ["Как называется житель страны Sweden?", null, ["Swedish", "Swedeish", "Swedian", "Swedenese"], 0],
    ["Как называется житель страны Switzerland?", null, ["Swiss", "Switzerlandish", "Swissian", "Switzish"], 0],
    ["Как называется житель страны Ireland?", null, ["Irish", "Irelandish", "Ireish", "Irian"], 0],
    ["Как называется житель страны Austria?", null, ["Austrian", "Austrish", "Austrianish", "Austrain"], 0],
    ["Как называется житель страны Finland?", null, ["Finnish", "Finlandish", "Finnian", "Finnese"], 0],
    ["Из какой страны Russian?", null, ["Russia", "Russiya", "Rusia", "Russland"], 0],
    ["Из какой страны French?", null, ["France", "Franch", "Francia", "Frence"], 0],
    ["Из какой страны Italian?", null, ["Italy", "Itali", "Itally", "Italia"], 0],
    ["Из какой страны Chinese?", null, ["China", "Chinia", "Chyna", "Sina"], 0],
    ["Из какой страны Polish?", null, ["Poland", "Polend", "Polandia", "Pholand"], 0],
    ["Из какой страны Canadian?", null, ["Canada", "Canda", "Canadaa", "Kanada"], 0],
    ["Из какой страны Mexican?", null, ["Mexico", "Mexicoo", "Maxico", "Mejico"], 0],
    ["Из какой страны Turkish?", null, ["Turkey", "Turkiye", "Turky", "Turkei"], 0],
    ["Из какой страны Egyptian?", null, ["Egypt", "Egipt", "Egyptia", "Egyptus"], 0],
    ["Из какой страны Dutch?", null, ["Netherlands", "Netherland", "Nederlands", "Netherlandia"], 0],
    ["Из какой страны Norwegian?", null, ["Norway", "Norwey", "Norwage", "Norwegia"], 0],
    ["Из какой страны Portuguese?", null, ["Portugal", "Portugual", "Portugalia", "Portugale"], 0],
    ["Из какой страны Scottish?", null, ["Scotland", "Scottland", "Scotlandia", "Scotlend"], 0],
    ["Из какой страны Belgian?", null, ["Belgium", "Belgia", "Belguim", "Belgum"], 0],
    ["Из какой страны Korean?", null, ["South Korea", "South Corea", "Southkorea", "South Koria"], 0]
  ];

  const timeQuestions = [
    { hour24: 6, minute: 0, options: ["six o'clock", "six o'clocks", "o'clock six", "six's clock"] },
    { hour24: 6, minute: 15, options: ["quarter past six", "quarter to six", "six quarter past", "quarter past to six"] },
    { hour24: 6, minute: 30, options: ["half past six", "half to six", "six thirty past", "half past to six"] },
    { hour24: 6, minute: 45, options: ["quarter to seven", "quarter past seven", "quarter to six", "seven quarter to"] },
    { hour24: 6, minute: 10, options: ["ten past six", "ten to six", "six past ten", "ten's past six"] },
    { hour24: 6, minute: 20, options: ["twenty past six", "twenty to six", "six twenty past", "twenty's past six"] },
    { hour24: 6, minute: 40, options: ["twenty to seven", "twenty past seven", "twenty to six", "seven twenty to"] },
    { hour24: 6, minute: 50, options: ["ten to seven", "ten past seven", "ten to six", "seven ten to"] },
    { hour24: 6, minute: 5, options: ["five past six", "five to six", "six five past", "five's past six"] },
    { hour24: 6, minute: 55, options: ["five to seven", "five past seven", "five to six", "seven five to"] },
    { hour24: 12, minute: 0, options: ["It's midday.", "It's midnight.", "It's noon o'clock.", "It's twelve to."], periodMatters: true, periodHint: "полдень", periodIcon: "☀️" },
    { hour24: 0, minute: 0, options: ["It's midnight.", "It's midday.", "It's twelve past.", "It's zero o'clock."], periodMatters: true, periodHint: "полночь", periodIcon: "🌙" },
    { hour24: 15, minute: 0, options: ["three o'clock in the afternoon", "three o'clock in the morning", "afternoon three o'clock", "three past afternoon"], periodMatters: true, periodHint: "день", periodIcon: "🌤️" },
    { hour24: 9, minute: 0, options: ["nine o'clock in the morning", "nine o'clock in the evening", "morning nine o'clock", "nine past morning"], periodMatters: true, periodHint: "утро", periodIcon: "🌅" },
    { hour24: 19, minute: 0, options: ["seven o'clock in the evening", "seven o'clock in the morning", "evening seven o'clock", "seven past evening"], periodMatters: true, periodHint: "вечер", periodIcon: "🌆" },
    { hour24: 1, minute: 30, options: ["half past one", "half to one", "one thirty to", "half one past"] },
    { hour24: 2, minute: 45, options: ["quarter to three", "quarter past three", "quarter to two", "three quarter to"] },
    { hour24: 4, minute: 15, options: ["quarter past four", "quarter to four", "four quarter past", "quarter past to four"] },
    { hour24: 8, minute: 35, options: ["twenty-five to nine", "twenty-five past nine", "twenty-five to eight", "nine twenty-five to"] },
    { hour24: 10, minute: 25, options: ["twenty-five past ten", "twenty-five to ten", "ten twenty-five past", "twenty-five's past ten"] }
  ];

  const onesWords = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teensWords = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tensWords = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const onesOrdinal = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
  const teensOrdinal = ["tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth"];
  const tensOrdinal = ["", "", "twentieth", "thirtieth", "fortieth", "fiftieth", "sixtieth", "seventieth", "eightieth", "ninetieth"];

  function ordinalToWords(n) {
    if (n === 100) return "one hundredth";
    if (n < 10) return onesOrdinal[n];
    if (n < 20) return teensOrdinal[n - 10];
    const t = Math.floor(n / 10), o = n % 10;
    return o === 0 ? tensOrdinal[t] : tensWords[t] + "-" + onesOrdinal[o];
  }

  function generateOrdWrongSpellings(correctWord, count) {
    const candidates = new Set();
    const irregularFixes = { eighth: "eigth", ninth: "nineth", fifth: "fiveth", twelfth: "twelveth" };
    Object.keys(irregularFixes).forEach(k => {
      if (correctWord.endsWith(k)) {
        candidates.add(correctWord.slice(0, correctWord.length - k.length) + irregularFixes[k]);
      }
    });
    if (correctWord.includes("ieth")) {
      candidates.add(correctWord.replace("ieth", "yeth"));
      candidates.add(correctWord.replace("ieth", "ith"));
    }
    if (correctWord.endsWith("th") && correctWord.length > 3) {
      candidates.add(correctWord.slice(0, -3) + correctWord.slice(-2));
    }
    if (correctWord.endsWith("th")) {
      const base = correctWord.slice(0, -2);
      const lastChar = base.slice(-1);
      candidates.add(base + lastChar + "th");
    }
    if (correctWord.includes("-")) {
      candidates.add(correctWord.replace("-", ""));
    }
    if (correctWord.length > 4) {
      const core = correctWord.replace("-", "");
      const i = 2 + Math.floor(Math.random() * (core.length - 3));
      const arr = core.split("");
      const tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp;
      candidates.add(arr.join(""));
    }
    candidates.delete(correctWord);
    let guard = 0;
    while (candidates.size < count && guard < 30) {
      guard++;
      const arr = correctWord.replace("-", "").split("");
      const i = Math.floor(Math.random() * arr.length);
      const action = Math.floor(Math.random() * 3);
      if (action === 0) { arr.splice(i, 1); }
      else if (action === 1) { arr.splice(i, 0, arr[i] || "e"); }
      else if (i < arr.length - 1) { const t = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = t; }
      const mutated = arr.join("");
      if (mutated !== correctWord && mutated.length > 2) candidates.add(mutated);
    }
    return shuffle(Array.from(candidates)).slice(0, count);
  }

  function pickOrdNumberDistractors(n, count) {
    const firstDigit = String(n)[0];
    let pool = [];
    for (let i = 1; i <= 100; i++) {
      if (i !== n && String(i)[0] === firstDigit) pool.push(i);
    }
    pool = shuffle(pool);
    const distractors = [];
    if (n >= 10 && n < 100) {
      const tens = Math.floor(n / 10), ones = n % 10;
      if (tens !== ones) {
        const swapped = ones * 10 + tens;
        if (swapped >= 1 && swapped <= 100 && swapped !== n) distractors.push(swapped);
      }
    }
    pool.forEach(v => { if (distractors.length < count && !distractors.includes(v)) distractors.push(v); });
    let guard = 0;
    while (distractors.length < count && guard < 50) {
      guard++;
      const candidate = Math.floor(Math.random() * 100) + 1;
      if (candidate !== n && !distractors.includes(candidate)) distractors.push(candidate);
    }
    return shuffle(distractors).slice(0, count);
  }

  const ordNumbers = [
    3, 7, 12, 15, 18, 20, 21, 24, 26, 29,
    30, 33, 35, 38, 40, 42, 45, 47, 50, 52,
    55, 58, 60, 63, 66, 69, 70, 73, 76, 79,
    80, 82, 85, 88, 90, 92, 95, 97, 99, 100
  ];

  function buildOrdBank() {
    return ordNumbers.map((n, i) => {
      const correctWord = ordinalToWords(n);
      const toWordDirection = i % 2 === 0;
      if (toWordDirection) {
        const distractors = generateOrdWrongSpellings(correctWord, 3);
        return { id: "ord" + i, category: "ord", prompt: "Порядковое числительное " + n + "?", sub: null, options: [correctWord, ...distractors], correctText: correctWord };
      } else {
        const distractors = pickOrdNumberDistractors(n, 3);
        return { id: "ord" + i, category: "ord", prompt: "Что означает " + correctWord + "?", sub: null, options: [String(n), ...distractors.map(String)], correctText: String(n) };
      }
    });
  }

  function buildBank(rawList, category) {
    return rawList.map((row, i) => {
      const [prompt, sub, opts, correctIdx] = row;
      return { id: category + i, category: category, prompt: prompt, sub: sub, options: opts, correctText: opts[correctIdx] };
    });
  }

  function buildTimeBank(rawList) {
    return rawList.map((row, i) => ({
      id: "time" + i, category: "time", hour24: row.hour24, minute: row.minute,
      options: row.options, correctText: row.options[0],
      periodMatters: !!row.periodMatters, periodHint: row.periodHint || null, periodIcon: row.periodIcon || null
    }));
  }

  const bankPoss = buildBank(possQuestions, "poss");
  const bankNat = buildBank(natQuestions, "nat");
  const bankTime = buildTimeBank(timeQuestions);
  const bankOrd = buildOrdBank();

  const CATEGORY_LABEL = { poss: "ПРИТЯЖАТЕЛЬНЫЕ", nat: "НАЦИОНАЛЬНОСТИ", time: "ВРЕМЯ", ord: "ЧИСЛИТЕЛЬНЫЕ", slang: "СЛЕНГ" };
  const CATEGORY_TITLE = { poss: "Притяжательные", nat: "Национальности", time: "Время", ord: "Числительные", slang: "Сленг" };

  const MODE_BANK = {
    poss: () => bankPoss,
    nat: () => bankNat,
    lesson1: () => bankPoss.concat(bankNat),
    time: () => bankTime,
    ord: () => bankOrd,
    lesson2: () => bankTime.concat(bankOrd),
    all: () => bankPoss.concat(bankNat, bankTime, bankOrd)
  };
  const MODE_BREAKDOWN_CATS = {
    lesson1: ["poss", "nat"],
    lesson2: ["time", "ord"],
    all: ["poss", "nat", "time", "ord"]
  };

  function modeIncludesTime(mode) {
    return mode === "time" || mode === "lesson2" || mode === "all";
  }

  const slangWordsRaw = [
    ["lit", "потрясающий, огонь (о вечеринке или событии)"],
    ["salty", "обиженный, раздражённый по мелочи"],
    ["extra", "слишком драматичный, наигранный"],
    ["ghost", "резко пропасть, перестать отвечать"],
    ["slay", "сделать что-то великолепно, «зажечь»"],
    ["basic", "слишком обычный, без своей изюминки"],
    ["vibe", "атмосфера, настроение"],
    ["flex", "хвастаться, выпендриваться"],
    ["sus", "подозрительный, странный"],
    ["cap", "враньё, неправда"],
    ["bet", "договорились, хорошо"],
    ["ship", "поддерживать пару, «шипперить»"],
    ["simp", "тот, кто слишком старается угодить"],
    ["yeet", "резко бросить / возглас восторга"],
    ["cringe", "испытывать неловкость за кого-то"],
    ["drip", "стильный образ, крутая одежда"],
    ["gucci", "всё отлично, окей"],
    ["savage", "дерзкий, беспощадно крутой"],
    ["clutch", "спасти положение в решающий момент"],
    ["finna", "собираюсь, вот-вот сделаю"],
    ["lowkey", "слегка, немного, по-тихому"],
    ["highkey", "открыто, явно"],
    ["tea", "сплетни, горячие новости"],
    ["shade", "завуалированное оскорбление"],
    ["stan", "быть ярым фанатом"],
    ["woke", "осознанный в социальных вопросах"],
    ["mood", "точно про меня, настроение"],
    ["fire", "очень крутой, огонь"],
    ["dead", "умираю (от смеха), очень смешно"],
    ["thirsty", "отчаянно ищущий внимания"],
    ["snatched", "идеально выглядящий"],
    ["bougie", "строящий из себя богача"],
    ["shook", "в шоке, потрясён"],
    ["bail", "резко уйти, слинять"],
    ["chill", "расслабленный, спокойный"],
    ["hangry", "злой от голода"],
    ["janky", "халтурный, ненадёжный"],
    ["legit", "настоящий, законный"],
    ["lame", "скучный, отстойный"],
    ["yolo", "живём один раз (оправдание риска)"],
    ["glow up", "сильно похорошеть, преобразиться"],
    ["clap back", "резко ответить на критику"],
    ["binge", "смотреть/делать без остановки"],
    ["petty", "мелочный, обидчивый по пустякам"],
    ["reckon", "думать, полагать (брит.)"],
    ["cheeky", "дерзко-игривый (брит.)"],
    ["knackered", "вымотанный, уставший (брит.)"],
    ["gutted", "очень расстроенный (брит.)"],
    ["mate", "приятель, друг (брит.)"],
    ["sorted", "всё улажено, в порядке (брит.)"]
  ];

  function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  const slangGroups = chunkArray(slangWordsRaw, 5);

  let slangGroupIndex = 0;
  let lastSlangPassed = false;

  function buildSlangGroupBank(gi) {
    const group = slangGroups[gi];
    return group.map((pair, i) => {
      const [en, ru] = pair;
      const others = group.filter((_, j) => j !== i).map(p => p[1]);
      const distractors = shuffle(others).slice(0, 3);
      return { id: "slang" + gi + "_" + i, category: "slang", prompt: "Переведи слово: <b>" + en + "</b>", sub: null, options: shuffle([ru, ...distractors]), correctText: ru };
    });
  }

  // ================= ПЕРСИСТЕНТНОЕ СОСТОЯНИЕ (Firestore при входе / localStorage для гостя) =================

  let currentUser = null;
  let progress = defaultProgress();
  let settings = defaultSettings();
  let progressReady = false; // true, когда прогресс загружен (из Firestore или localStorage)

  const GUEST_PROGRESS_KEY = "easyenglish_guest_progress";
  const GUEST_SETTINGS_KEY = "easyenglish_guest_settings";

  function storageAvailable() {
    try {
      const testKey = "__ee_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadGuestState() {
    try {
      const p = window.localStorage.getItem(GUEST_PROGRESS_KEY);
      const s = window.localStorage.getItem(GUEST_SETTINGS_KEY);
      progress = p ? { ...defaultProgress(), ...JSON.parse(p) } : defaultProgress();
      settings = s ? { ...defaultSettings(), ...JSON.parse(s) } : defaultSettings();
    } catch (e) {
      progress = defaultProgress();
      settings = defaultSettings();
    }
    progressReady = true;
  }

  function persistGuestProgress() {
    try { window.localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ }
  }
  function persistGuestSettings() {
    try { window.localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  async function persistProgress() {
    if (currentUser) {
      try { await saveProgress(currentUser.uid, progress); }
      catch (e) { console.warn("Не удалось сохранить прогресс в Firestore:", e); }
    } else {
      persistGuestProgress();
    }
  }

  async function persistSettings() {
    if (currentUser) {
      try { await saveSettings(currentUser.uid, settings); }
      catch (e) { console.warn("Не удалось сохранить настройки в Firestore:", e); }
    } else {
      persistGuestSettings();
    }
  }

  function getBest(mode) { return progress.best[mode] || null; }
  function setBest(mode, score, total) {
    const prev = getBest(mode);
    if (!prev || score > prev.score) {
      progress.best[mode] = { score, total };
      persistProgress();
      return true;
    }
    return false;
  }
  function getPassed(mode, timed) {
    const p = progress.passed[mode];
    return !!(p && (timed ? p.t : p.n));
  }
  function setPassed(mode, timed) {
    if (!progress.passed[mode]) progress.passed[mode] = { n: false, t: false };
    progress.passed[mode][timed ? "t" : "n"] = true;
    persistProgress();
  }
  function getAttempted(mode, timed) {
    const a = progress.attempted[mode];
    return !!(a && (timed ? a.t : a.n));
  }
  function setAttempted(mode, timed) {
    if (!progress.attempted[mode]) progress.attempted[mode] = { n: false, t: false };
    progress.attempted[mode][timed ? "t" : "n"] = true;
    persistProgress();
  }
  function getSlangProgress() { return progress.slangGroupsCompleted || 0; }
  function setSlangProgress(n) {
    if (n > getSlangProgress()) {
      progress.slangGroupsCompleted = n;
      persistProgress();
    }
  }
  function getStatus(mode, timed) {
    if (getPassed(mode, timed)) return "full";
    if (getAttempted(mode, timed)) return "partial";
    return "none";
  }
  function formatBest(b) {
    const pct = Math.round(b.score / b.total * 100);
    return "Рекорд: " + b.score + "/" + b.total + " (" + pct + "%)";
  }

  function updateSlangProgressLabel() {
    const el = document.getElementById("bestSlang");
    if (!el) return;
    const done = getSlangProgress();
    el.textContent = done >= slangGroups.length ? "Все " + slangGroups.length + " групп пройдены"
      : (done > 0 ? "Пройдено групп: " + done + "/" + slangGroups.length : "Ещё не начато");
  }

  function renderStatusBadges() {
    const modes = ["poss", "nat", "lesson1", "time", "ord", "lesson2", "all"];
    modes.forEach(mode => {
      const el = document.getElementById("passRow_" + mode);
      if (!el) return;
      const ns = getStatus(mode, false);
      const ts = getStatus(mode, true);
      const nIcon = ns === "full" ? "✓ " : (ns === "partial" ? "• " : "— ");
      const tIcon = ts === "full" ? "✓ " : (ts === "partial" ? "• " : "— ");
      el.innerHTML = '<span class="status-pill n-' + ns + '">' + nIcon + 'обычный</span>'
        + '<span class="status-pill t-' + ts + '">' + tIcon + 'на время</span>';
    });
  }

  function renderBests() {
    const map = { poss: "bestPoss", nat: "bestNat", lesson1: "bestLesson1", time: "bestTime", ord: "bestOrd", lesson2: "bestLesson2", all: "bestAll" };
    Object.keys(map).forEach(mode => {
      const el = document.getElementById(map[mode]);
      const b = getBest(mode);
      el.textContent = b ? formatBest(b) : "Ещё не пройдено";
    });
    renderStatusBadges();
    updateSlangProgressLabel();
  }

  function updateCounts() {
    document.querySelectorAll(".mode-card").forEach(card => {
      const mode = card.dataset.mode;
      const getBank = MODE_BANK[mode];
      if (!getBank) return;
      const countEl = card.querySelector(".mc-count");
      if (countEl) countEl.textContent = getBank().length;
    });
    const tag = document.getElementById("mastheadTag");
    if (tag) tag.textContent = MODE_BANK.all().length + " вопросов";
  }

  // ================= ВРЕМЯ: РЕНДЕРИНГ =================

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function digital24(hour24, minute) { return pad2(hour24) + ":" + pad2(minute); }
  function digital12(hour24, minute, showPeriod) {
    let h = hour24 % 12;
    if (h === 0) h = 12;
    const suffix = hour24 < 12 ? "AM" : "PM";
    let s = h + ":" + pad2(minute);
    if (showPeriod) s += " " + suffix;
    return s;
  }
  function computeClockAngles(hour24, minute) {
    const hour12 = hour24 % 12;
    return { hourAngle: hour12 * 30 + minute * 0.5, minuteAngle: minute * 6 };
  }
  function clockSVG(hour24, minute, startHour24, startMinute) {
    const cx = 60, cy = 60, r = 52;
    const hasStart = (startHour24 !== undefined && startHour24 !== null);
    const initial = hasStart ? computeClockAngles(startHour24, startMinute) : computeClockAngles(hour24, minute);
    let ticks = "";
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const rad = (angle - 90) * Math.PI / 180;
      const outer = { x: cx + (r - 4) * Math.cos(rad), y: cy + (r - 4) * Math.sin(rad) };
      const inner = { x: cx + (r - 12) * Math.cos(rad), y: cy + (r - 12) * Math.sin(rad) };
      ticks += '<line x1="' + inner.x.toFixed(1) + '" y1="' + inner.y.toFixed(1) + '" x2="' + outer.x.toFixed(1) + '" y2="' + outer.y.toFixed(1) + '" stroke="var(--ink-soft)" stroke-width="2" stroke-linecap="round"/>';
    }
    return '<svg viewBox="0 0 120 120" width="112" height="112" xmlns="http://www.w3.org/2000/svg">'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--paper)" stroke="var(--line)" stroke-width="2"/>'
      + ticks
      + '<line id="clockHourHand" x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - 26) + '" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" style="transform-origin:' + cx + 'px ' + cy + 'px; transform:rotate(' + initial.hourAngle + 'deg);"/>'
      + '<line id="clockMinHand" x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - 40) + '" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" style="transform-origin:' + cx + 'px ' + cy + 'px; transform:rotate(' + initial.minuteAngle + 'deg);"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="var(--ink)"/>'
      + '</svg>';
  }
  function triggerClockSpin(prevQ, q) {
    const hourEl = document.getElementById("clockHourHand");
    const minEl = document.getElementById("clockMinHand");
    if (!hourEl || !minEl) return;
    const startAngles = computeClockAngles(prevQ.hour24, prevQ.minute);
    const targetAngles = computeClockAngles(q.hour24, q.minute);
    function forwardTarget(start, targetBase) {
      let t = targetBase;
      while (t <= start) t += 360;
      return t;
    }
    const hourTarget = forwardTarget(startAngles.hourAngle, targetAngles.hourAngle);
    const minTarget = forwardTarget(startAngles.minuteAngle, targetAngles.minuteAngle);
    void hourEl.getBoundingClientRect();
    void minEl.getBoundingClientRect();
    requestAnimationFrame(() => {
      hourEl.style.transition = "transform .6s cubic-bezier(.5,0,.25,1)";
      minEl.style.transition = "transform .5s cubic-bezier(.5,0,.25,1)";
      hourEl.style.transform = "rotate(" + hourTarget + "deg)";
      minEl.style.transform = "rotate(" + minTarget + "deg)";
    });
  }
  function timeGivenHTML(q, startHour24, startMinute) {
    let html = '<div class="time-given">';
    if (settings.timeDisplayMode === "clock") {
      html += clockSVG(q.hour24, q.minute, startHour24, startMinute);
      if (q.periodMatters) html += '<div class="period-hint">' + (q.periodIcon || "") + ' ' + q.periodHint + '</div>';
    } else {
      const str = settings.timeHourFormat === "24" ? digital24(q.hour24, q.minute) : digital12(q.hour24, q.minute, q.periodMatters);
      html += '<span class="time-digits">' + str + '</span>';
    }
    html += '</div>';
    return html;
  }
  function timeReviewLabel(q) {
    let s = digital24(q.hour24, q.minute);
    if (q.periodMatters) s += " (" + q.periodHint + ")";
    return s;
  }

  // ================= НАВИГАЦИЯ ПО ЭКРАНАМ =================

  const startScreen = document.getElementById("startScreen");
  const quizScreen = document.getElementById("quizScreen");
  const resultScreen = document.getElementById("resultScreen");
  const slangLearnScreen = document.getElementById("slangLearnScreen");

  function showScreen(name) {
    startScreen.classList.toggle("hidden", name !== "start");
    quizScreen.classList.toggle("hidden", name !== "quiz");
    resultScreen.classList.toggle("hidden", name !== "result");
    slangLearnScreen.classList.toggle("hidden", name !== "slangLearn");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showSlangLearn(gi) {
    slangGroupIndex = gi;
    showScreen("slangLearn");
    document.getElementById("slangProgressLabel").textContent = "Группа " + (gi + 1) + " / " + slangGroups.length;
    document.getElementById("slangProgressFill").style.width = (gi / slangGroups.length * 100) + "%";
    const list = document.getElementById("slangWordList");
    list.innerHTML = "";
    slangGroups[gi].forEach(pair => {
      const div = document.createElement("div");
      div.style.cssText = "padding:12px 14px;background:var(--paper);border:1px solid var(--line);border-radius:9px;";
      div.innerHTML = '<div style="font-family:var(--font-display);font-weight:600;font-size:17px;">' + pair[0] + '</div>'
        + '<div style="color:var(--ink-soft);font-size:14px;margin-top:3px;">' + pair[1] + '</div>';
      list.appendChild(div);
    });
  }

  function startSlangQuiz(gi) {
    currentMode = "slangGroup" + gi;
    currentTimed = false;
    timedMode = false;
    queue = shuffle(buildSlangGroupBank(gi));
    idx = 0;
    answers = [];
    showScreen("quiz");
    renderQuestion();
  }

  function finishSlangGroup(score, total) {
    lastSlangPassed = (score === total);
    if (lastSlangPassed) {
      setSlangProgress(slangGroupIndex + 1);
      updateSlangProgressLabel();
    }
    showScreen("result");
    document.getElementById("resultScore").textContent = score + "/" + total;
    document.getElementById("resultPercent").textContent = lastSlangPassed
      ? "Группа пройдена!"
      : Math.round(score / total * 100) + "% правильных — нужно " + total + "/" + total;
    document.getElementById("resultBest").classList.add("hidden");

    const breakdownRow = document.getElementById("breakdownRow");
    breakdownRow.innerHTML = '<div class="breakdown-item"><div class="num">' + score + '/' + total + '</div>'
      + '<div class="lbl">Группа ' + (slangGroupIndex + 1) + ' из ' + slangGroups.length + '</div></div>';

    const wrong = answers.filter(a => !a.isCorrect);
    const reviewList = document.getElementById("reviewList");
    const reviewTitle = document.getElementById("reviewTitle");
    const allCorrectMsg = document.getElementById("allCorrectMsg");
    reviewList.innerHTML = "";
    if (wrong.length === 0) {
      reviewTitle.classList.add("hidden");
      allCorrectMsg.classList.remove("hidden");
    } else {
      reviewTitle.classList.remove("hidden");
      allCorrectMsg.classList.add("hidden");
      wrong.forEach(a => {
        const div = document.createElement("div");
        div.className = "review-item";
        div.innerHTML = '<div class="rq">' + a.q.prompt + '</div>'
          + '<div class="ra">Твой ответ: <s>' + (a.chosenText || "—") + '</s> · Правильно: <b>' + a.q.correctText + '</b></div>';
        reviewList.appendChild(div);
      });
    }

    const retryBtn = document.getElementById("retryBtn");
    if (lastSlangPassed) {
      retryBtn.textContent = (slangGroupIndex === slangGroups.length - 1) ? "Готово" : "Следующая группа";
    } else {
      retryBtn.textContent = "Повторить слова и попробовать снова";
    }
  }

  // ================= КВИЗ =================

  let currentMode = null;
  let pendingMode = null;
  let pendingTimed = false;
  let currentTimed = false;
  let queue = [];
  let idx = 0;
  let answers = [];
  let answeredCurrent = false;
  let timedMode = false;
  let questionTimerId = null;
  let questionTimeLeft = 0;
  const QUESTION_TIME_LIMIT = 5;

  document.querySelectorAll(".mode-card[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => requestStartQuiz(btn.dataset.mode, false));
  });
  document.querySelectorAll(".timer-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      requestStartQuiz(btn.dataset.mode, true);
    });
  });

  document.getElementById("slangStartBtn").addEventListener("click", () => {
    showSlangLearn(Math.min(getSlangProgress(), slangGroups.length - 1));
  });
  document.getElementById("slangToQuizBtn").addEventListener("click", () => startSlangQuiz(slangGroupIndex));
  document.getElementById("slangQuitBtn").addEventListener("click", () => {
    showScreen("start");
    renderBests();
  });

  const confirmOverlay = document.getElementById("confirmOverlay");
  document.getElementById("quitBtn").addEventListener("click", () => confirmOverlay.classList.remove("hidden"));
  document.getElementById("modalCancel").addEventListener("click", () => confirmOverlay.classList.add("hidden"));
  document.getElementById("modalConfirm").addEventListener("click", () => {
    clearQuestionTimer();
    confirmOverlay.classList.add("hidden");
    showScreen("start");
    renderBests();
  });
  confirmOverlay.addEventListener("click", (e) => { if (e.target === confirmOverlay) confirmOverlay.classList.add("hidden"); });

  document.getElementById("backBtn").addEventListener("click", () => {
    clearQuestionTimer();
    showScreen("start");
    renderBests();
  });
  document.getElementById("retryBtn").addEventListener("click", () => {
    if (currentMode && currentMode.indexOf("slangGroup") === 0) {
      if (lastSlangPassed) {
        if (slangGroupIndex === slangGroups.length - 1) { showScreen("start"); renderBests(); }
        else { showSlangLearn(slangGroupIndex + 1); }
      } else {
        showSlangLearn(slangGroupIndex);
      }
    } else {
      requestStartQuiz(currentMode, currentTimed);
    }
  });

  const timeSettingsOverlay = document.getElementById("timeSettingsOverlay");
  const displaySegmented = document.getElementById("displaySegmented");
  const formatSegmented = document.getElementById("formatSegmented");

  function setActive(container, value) {
    container.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.value === value));
  }
  displaySegmented.querySelectorAll(".seg-btn").forEach(b => {
    b.addEventListener("click", () => { settings.timeDisplayMode = b.dataset.value; setActive(displaySegmented, settings.timeDisplayMode); });
  });
  formatSegmented.querySelectorAll(".seg-btn").forEach(b => {
    b.addEventListener("click", () => { settings.timeHourFormat = b.dataset.value; setActive(formatSegmented, settings.timeHourFormat); });
  });

  document.getElementById("timeSettingsCancel").addEventListener("click", () => {
    timeSettingsOverlay.classList.add("hidden");
    pendingMode = null;
  });
  document.getElementById("timeSettingsStart").addEventListener("click", () => {
    timeSettingsOverlay.classList.add("hidden");
    persistSettings();
    launchWithCountdown(pendingMode, pendingTimed);
  });

  function requestStartQuiz(mode, timed) {
    pendingTimed = !!timed;
    if (modeIncludesTime(mode)) {
      pendingMode = mode;
      setActive(displaySegmented, settings.timeDisplayMode);
      setActive(formatSegmented, settings.timeHourFormat);
      timeSettingsOverlay.classList.remove("hidden");
    } else {
      launchWithCountdown(mode, pendingTimed);
    }
  }

  function launchWithCountdown(mode, timed) {
    if (timed) showCountdownThenStart(mode);
    else actuallyStartQuiz(mode, false);
  }

  function showCountdownThenStart(mode) {
    const overlay = document.getElementById("countdownOverlay");
    const numEl = document.getElementById("countdownNumber");
    const steps = ["3", "2", "1", "Поехали!"];
    let i = 0;
    overlay.classList.remove("hidden");
    function tick() {
      numEl.textContent = steps[i];
      numEl.classList.toggle("go", steps[i] === "Поехали!");
      numEl.classList.remove("pulse");
      void numEl.offsetWidth;
      numEl.classList.add("pulse");
      i++;
      if (i < steps.length) {
        setTimeout(tick, 700);
      } else {
        setTimeout(() => { overlay.classList.add("hidden"); actuallyStartQuiz(mode, true); }, 500);
      }
    }
    tick();
  }

  function actuallyStartQuiz(mode, timed) {
    currentMode = mode;
    currentTimed = !!timed;
    timedMode = currentTimed;
    const bank = MODE_BANK[mode]();
    queue = shuffle(bank).map(q => ({ ...q, shuffledOptions: shuffle(q.options) }));
    idx = 0;
    answers = [];
    showScreen("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    answeredCurrent = false;
    const total = queue.length;
    const q = queue[idx];

    document.getElementById("progressLabel").textContent = (idx + 1) + " / " + total;
    document.getElementById("progressFill").style.width = ((idx) / total * 100) + "%";
    document.getElementById("categoryLabel").textContent = CATEGORY_LABEL[q.category];

    let clockSpinFrom = null;
    if (q.category === "time" && settings.timeDisplayMode === "clock" && idx > 0 && queue[idx - 1].category === "time") {
      clockSpinFrom = queue[idx - 1];
    }

    let qText;
    if (q.category === "poss") {
      qText = q.prompt.replace("___", '<span class="gap" id="answerSlot">___</span>');
      if (q.sub) qText += "  <span style='color:var(--ink-soft); font-size:16px;'>" + q.sub + "</span>";
    } else if (q.category === "time") {
      qText = timeGivenHTML(q, clockSpinFrom ? clockSpinFrom.hour24 : null, clockSpinFrom ? clockSpinFrom.minute : null)
        + '<div class="time-question-label">Как сказать это время?</div>'
        + '<div class="time-answer-line">Ответ: <span class="gap" id="answerSlot">___</span></div>';
    } else {
      qText = q.prompt + (q.category === "slang" ? '<br>' : ' ') + '<span class="answer-line">— <span class="gap" id="answerSlot">___</span></span>';
    }
    document.getElementById("questionText").innerHTML = qText;

    if (clockSpinFrom) triggerClockSpin(clockSpinFrom, q);

    const grid = document.getElementById("optionsGrid");
    grid.innerHTML = "";
    (q.shuffledOptions || q.options).forEach(optText => {
      const b = document.createElement("button");
      b.className = "option";
      b.textContent = optText;
      b.addEventListener("click", () => selectOption(optText, b));
      grid.appendChild(b);
    });

    document.getElementById("cardFooter").innerHTML = "";
    startQuestionTimer();
  }

  function clearQuestionTimer() {
    if (questionTimerId) { clearInterval(questionTimerId); questionTimerId = null; }
  }

  function startQuestionTimer() {
    clearQuestionTimer();
    const wrap = document.getElementById("qTimerWrap");
    if (!timedMode) { wrap.classList.add("hidden"); return; }
    const fill = document.getElementById("qTimerFill");
    const numEl = document.getElementById("qTimerNum");
    wrap.classList.remove("hidden");
    wrap.classList.remove("urgent");
    fill.style.width = "100%";
    questionTimeLeft = QUESTION_TIME_LIMIT;
    numEl.textContent = questionTimeLeft;
    const totalMs = QUESTION_TIME_LIMIT * 1000;
    const startTs = Date.now();
    questionTimerId = setInterval(() => {
      const elapsed = Date.now() - startTs;
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);
      fill.style.width = (remainingMs / totalMs * 100) + "%";
      if (remainingSec !== questionTimeLeft) { questionTimeLeft = remainingSec; numEl.textContent = questionTimeLeft; }
      if (remainingMs <= 1500) wrap.classList.add("urgent");
      if (remainingMs <= 0) { clearQuestionTimer(); handleTimeExpired(); }
    }, 50);
  }

  function handleTimeExpired() {
    if (answeredCurrent) return;
    answeredCurrent = true;
    const q = queue[idx];
    document.querySelectorAll("#optionsGrid .option").forEach(b => {
      b.disabled = true;
      if (b.textContent === q.correctText) b.classList.add("correct");
    });
    answers.push({ q, chosenText: null, isCorrect: false, timedOut: true });
    const footer = document.getElementById("cardFooter");
    footer.innerHTML = '<span style="color:var(--bad); font-size:14px; font-weight:600; margin-right:auto; align-self:center;">Время вышло</span>';
    const isLast = idx === queue.length - 1;
    setTimeout(() => { if (isLast) finishQuiz(); else { idx++; renderQuestion(); } }, 1100);
  }

  function selectOption(chosenText, btnEl) {
    if (answeredCurrent) return;
    answeredCurrent = true;
    clearQuestionTimer();
    const q = queue[idx];
    const isCorrect = chosenText === q.correctText;
    document.querySelectorAll("#optionsGrid .option").forEach(b => {
      b.disabled = true;
      if (b.textContent === q.correctText) b.classList.add("correct");
      else if (b === btnEl && !isCorrect) b.classList.add("incorrect");
    });
    if (isCorrect) {
      const slot = document.getElementById("answerSlot");
      if (slot) { slot.textContent = q.correctText; slot.classList.add("filled"); }
    }
    answers.push({ q, chosenText, isCorrect });
    const footer = document.getElementById("cardFooter");
    const isLast = idx === queue.length - 1;
    const nextBtn = document.createElement("button");
    nextBtn.className = "next-btn";
    nextBtn.textContent = isLast ? "Смотреть результат" : "Далее";
    nextBtn.addEventListener("click", () => { if (isLast) finishQuiz(); else { idx++; renderQuestion(); } });
    footer.appendChild(nextBtn);
  }

  function finishQuiz() {
    clearQuestionTimer();
    document.getElementById("qTimerWrap").classList.add("hidden");
    document.getElementById("progressFill").style.width = "100%";
    const total = answers.length;
    const score = answers.filter(a => a.isCorrect).length;

    if (currentMode && currentMode.indexOf("slangGroup") === 0) {
      finishSlangGroup(score, total);
      return;
    }

    document.getElementById("retryBtn").textContent = "Пройти ещё раз";
    const isNewBest = setBest(currentMode, score, total);
    setAttempted(currentMode, currentTimed);
    if (score === total) setPassed(currentMode, currentTimed);

    document.getElementById("resultScore").textContent = score + "/" + total;
    document.getElementById("resultPercent").textContent = Math.round(score / total * 100) + "% правильных";
    document.getElementById("resultBest").classList.toggle("hidden", !isNewBest);

    const breakdownRow = document.getElementById("breakdownRow");
    breakdownRow.innerHTML = "";
    const breakdownCats = MODE_BREAKDOWN_CATS[currentMode];
    if (breakdownCats) {
      breakdownCats.forEach(cat => {
        const catAnswers = answers.filter(a => a.q.category === cat);
        if (catAnswers.length === 0) return;
        const catScore = catAnswers.filter(a => a.isCorrect).length;
        const div = document.createElement("div");
        div.className = "breakdown-item";
        div.innerHTML = '<div class="num">' + catScore + '/' + catAnswers.length + '</div><div class="lbl">' + CATEGORY_TITLE[cat] + '</div>';
        breakdownRow.appendChild(div);
      });
    } else {
      const div = document.createElement("div");
      div.className = "breakdown-item";
      div.innerHTML = '<div class="num">' + score + '/' + total + '</div><div class="lbl">' + CATEGORY_TITLE[currentMode] + '</div>';
      breakdownRow.appendChild(div);
    }

    const wrong = answers.filter(a => !a.isCorrect);
    const reviewList = document.getElementById("reviewList");
    const reviewTitle = document.getElementById("reviewTitle");
    const allCorrectMsg = document.getElementById("allCorrectMsg");
    reviewList.innerHTML = "";
    if (wrong.length === 0) {
      reviewTitle.classList.add("hidden");
      allCorrectMsg.classList.remove("hidden");
    } else {
      reviewTitle.classList.remove("hidden");
      allCorrectMsg.classList.add("hidden");
      wrong.forEach(a => {
        const div = document.createElement("div");
        div.className = "review-item";
        let promptClean;
        if (a.q.category === "time") promptClean = timeReviewLabel(a.q);
        else promptClean = a.q.prompt.replace("___", "___") + (a.q.sub ? ' <span style="color:var(--ink-soft)">' + a.q.sub + '</span>' : '');
        const answerPart = a.timedOut ? "Время вышло" : "Твой ответ: <s>" + a.chosenText + "</s>";
        div.innerHTML = '<div class="rq">' + promptClean + '</div>' + '<div class="ra">' + answerPart + ' · Правильно: <b>' + a.q.correctText + '</b></div>';
        reviewList.appendChild(div);
      });
    }

    showScreen("result");
  }

  // ================= АВТОРИЗАЦИЯ (UI + Firebase) =================

  const authGuestControls = document.getElementById("authGuestControls");
  const authUserControls = document.getElementById("authUserControls");
  const authUserEmail = document.getElementById("authUserEmail");
  const cookieWarning = document.getElementById("cookieWarning");

  const loginOverlay = document.getElementById("loginOverlay");
  const registerOverlay = document.getElementById("registerOverlay");

  function openModal(overlay) { overlay.classList.remove("hidden"); }
  function closeModal(overlay) { overlay.classList.add("hidden"); }

  document.getElementById("openLoginBtn").addEventListener("click", () => { clearAuthErrors(); openModal(loginOverlay); });
  document.getElementById("openRegisterBtn").addEventListener("click", () => { clearAuthErrors(); openModal(registerOverlay); });
  document.getElementById("loginCancelBtn").addEventListener("click", () => closeModal(loginOverlay));
  document.getElementById("registerCancelBtn").addEventListener("click", () => closeModal(registerOverlay));
  document.getElementById("loginSwitchToRegister").addEventListener("click", () => { closeModal(loginOverlay); clearAuthErrors(); openModal(registerOverlay); });
  document.getElementById("registerSwitchToLogin").addEventListener("click", () => { closeModal(registerOverlay); clearAuthErrors(); openModal(loginOverlay); });
  [loginOverlay, registerOverlay].forEach(ov => ov.addEventListener("click", (e) => { if (e.target === ov) closeModal(ov); }));

  function clearAuthErrors() {
    document.getElementById("loginError").textContent = "";
    document.getElementById("registerError").textContent = "";
  }

  function setAuthBusy(busy) {
    ["loginSubmitBtn", "registerSubmitBtn"].forEach(id => { document.getElementById(id).disabled = busy; });
  }

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthErrors();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    setAuthBusy(true);
    try {
      await loginUser(email, password);
      closeModal(loginOverlay);
      document.getElementById("loginForm").reset();
    } catch (err) {
      document.getElementById("loginError").textContent = friendlyAuthError(err);
    } finally {
      setAuthBusy(false);
    }
  });

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthErrors();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    setAuthBusy(true);
    try {
      await registerUser(email, password);
      closeModal(registerOverlay);
      document.getElementById("registerForm").reset();
    } catch (err) {
      document.getElementById("registerError").textContent = friendlyAuthError(err);
    } finally {
      setAuthBusy(false);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    try { await logoutUser(); } catch (err) { console.warn("Ошибка выхода:", err); }
  });

  function renderAuthUI(user) {
    if (user) {
      authGuestControls.classList.add("hidden");
      authUserControls.classList.remove("hidden");
      authUserEmail.textContent = user.email || "Пользователь";
      cookieWarning.classList.add("hidden");
    } else {
      authGuestControls.classList.remove("hidden");
      authUserControls.classList.add("hidden");
      if (!storageAvailable()) cookieWarning.classList.remove("hidden");
    }
  }

  function applyThemeFromSettings() {
    const theme = settings.theme || "system";
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.textContent = theme === "dark" ? "🌙" : (theme === "light" ? "☀️" : "🌓");
  }

  document.getElementById("themeToggleBtn").addEventListener("click", () => {
    const order = ["system", "light", "dark"];
    const cur = settings.theme || "system";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    settings.theme = next;
    applyThemeFromSettings();
    persistSettings();
  });

  // Пока идёт первичная загрузка (проверка сессии/чтение прогресса) —
  // не даём стартовать квиз с неполными данными.
  function setAppLoading(loading) {
    document.querySelectorAll(".mode-card, .timer-btn").forEach(el => { el.disabled = loading; el.style.opacity = loading ? "0.5" : ""; });
  }

  setAppLoading(true);
  loadGuestState(); // мгновенно показываем гостевые данные, пока идёт проверка авторизации
  applyThemeFromSettings();
  renderBests();
  updateCounts();

  watchAuthState(async (user) => {
    currentUser = user;
    setAppLoading(true);
    try {
      if (user) {
        const account = await loadAccount(user.uid, user.email);
        progress = account.progress;
        settings = account.settings;
      } else {
        loadGuestState();
      }
    } catch (err) {
      console.warn("Не удалось загрузить данные аккаунта:", err);
      if (!user) loadGuestState();
    }
    progressReady = true;
    renderAuthUI(user);
    applyThemeFromSettings();
    renderBests();
    updateCounts();
    setAppLoading(false);
  });

})();
