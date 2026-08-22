/* StudyBonk gamification engine — XP, levels, streaks, quests, challenges,
 * daily boosts and badges. All state lives in localStorage (sb.* keys).
 * Every tool awards XP through SB.gamification.award(type, meta). */
(function () {
  "use strict";
  window.SB = window.SB || {};
  const S = () => window.SB.storage;

  const XP_RULES = {
    card: 10,            // one flashcard reviewed
    answer_correct: 15,  // correct quiz answer
    answer_wrong: 2,     // wrong answers still teach something
    focus_session: 25,   // completed pomodoro
    quiz_complete: 20,   // finished a quiz
    deck_complete: 20,   // finished a full deck review
    challenge_complete: 40,
    ai_chat: 3,          // using the local tutor
  };

  const LEVEL_NAMES = [
    "Bonk Novice", "Curious Cub", "Study Sprout", "Focus Finder", "Card Slinger",
    "Quiz Wizard", "Streak Knight", "Brain Buffer", "XP Hoarder", "Memory Master",
    "Bonk Legend",
  ];
  const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

  function levelFor(xp) {
    let lvl = 1;
    for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) lvl = i + 1;
    return Math.min(lvl, LEVEL_NAMES.length);
  }

  const BADGES = {
    first_steps:  { emoji: "🐣", name: "First Bonk",    desc: "Earn your first XP" },
    card_100:     { emoji: "🃏", name: "Card Slinger",  desc: "Review 100 flashcards" },
    quiz_perfect: { emoji: "💯", name: "Flawless",      desc: "Ace a quiz (100%)" },
    streak_3:     { emoji: "🔥", name: "Warming Up",    desc: "3-day streak" },
    streak_7:     { emoji: "⚡", name: "Week Warrior",  desc: "7-day streak" },
    streak_30:    { emoji: "👑", name: "Unbonkable",    desc: "30-day streak" },
    level_5:      { emoji: "🌟", name: "Rising Star",   desc: "Reach level 5" },
    level_10:     { emoji: "🏆", name: "Memory Master", desc: "Reach level 10" },
    focus_10:     { emoji: "⏱️", name: "Deep Diver",    desc: "10 focus sessions" },
    night_owl:    { emoji: "🦉", name: "Night Owl",     desc: "Study after 10pm" },
    early_bird:   { emoji: "🌅", name: "Early Bird",    desc: "Study before 8am" },
    challenge_1:  { emoji: "🥊", name: "Challenger",    desc: "Finish a Bonk Challenge" },
    deck_builder: { emoji: "🏗️", name: "Deck Builder",  desc: "Create a custom deck" },
    ai_pioneer:   { emoji: "🤖", name: "AI Pioneer",    desc: "Chat with Bonk AI" },
    xp_1000:      { emoji: "💎", name: "XP Hoarder",    desc: "Earn 1,000 total XP" },
  };

  const QUEST_POOL = [
    { id: "cards10",  icon: "🃏", label: "Review 10 flashcards",   type: "card",           target: 10,  reward: 50 },
    { id: "ans15",    icon: "🎯", label: "Answer 15 questions",    type: "answer_any",     target: 15,  reward: 50 },
    { id: "cor10",    icon: "✅", label: "Get 10 correct answers", type: "answer_correct", target: 10,  reward: 75 },
    { id: "focus1",   icon: "⏱️", label: "Finish a focus session", type: "focus_session",  target: 1,   reward: 60 },
    { id: "xp120",    icon: "⚡", label: "Earn 120 XP today",      type: "xp",             target: 120, reward: 50 },
    { id: "quiz2",    icon: "🧠", label: "Complete 2 quizzes",     type: "quiz_complete",  target: 2,   reward: 70 },
  ];

  /* ---------- helpers ---------- */
  const dayKey = (d) => {
    const x = d ? new Date(d) : new Date();
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  };
  const addDays = (k, n) => {
    const d = new Date(k + "T12:00:00");
    d.setDate(d.getDate() + n);
    return dayKey(d);
  };
  function seededShuffle(arr, seed) {
    const a = arr.slice();
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function dateSeed(k) {
    return k.split("-").reduce((acc, part) => acc * 1000 + parseInt(part, 10), 0);
  }

  /* ---------- state ---------- */
  function defaultState() {
    return {
      xp: 0,
      totals: { card: 0, answer_correct: 0, answer_any: 0, focus_session: 0, quiz_complete: 0, deck_complete: 0, challenge_complete: 0, ai_chat: 0 },
      streak: { current: 0, best: 0, lastDay: null, freezes: 1, lastFreezeGrant: null },
      quests: null,          // { date, list: [...], claimed: {} }
      weekly: null,          // { weekStart, xp, reward }
      dailyBoost: null,      // { day, until }
      badges: {},            // id -> dayKey
      activity: {},          // dayKey -> xp
      counters: { focus_total: 0, cards_total: 0, perfect_quizzes: 0 },
    };
  }
  function load() {
    const st = Object.assign(defaultState(), S().get("gamification", {}));
    // merge nested defaults for forward compatibility
    st.totals = Object.assign(defaultState().totals, st.totals || {});
    st.streak = Object.assign(defaultState().streak, st.streak || {});
    st.counters = Object.assign(defaultState().counters, st.counters || {});
    return st;
  }
  function save(st) { S().set("gamification", st); }

  let state = load();

  /* ---------- quests ---------- */
  function weekStartKey() {
    const d = new Date();
    const dow = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - dow);
    return dayKey(d);
  }
  function ensureQuests(st) {
    const today = dayKey();
    if (!st.quests || st.quests.date !== today) {
      const seed = dateSeed(today);
      const list = seededShuffle(QUEST_POOL, seed).slice(0, 3);
      list.forEach((q) => { q.progress = 0; q.done = false; });
      st.quests = { date: today, list };
    }
    const wk = weekStartKey();
    if (!st.weekly || st.weekly.weekStart !== wk) {
      st.weekly = { weekStart: wk, xp: 0, target: 500, reward: 200, done: false };
    }
  }

  /* ---------- streak ---------- */
  function updateStreak(st) {
    const today = dayKey();
    const last = st.streak.lastDay;
    if (last === today) return;
    if (last === addDays(today, -1)) {
      st.streak.current += 1;
    } else if (last === addDays(today, -2) && st.streak.freezes > 0) {
      st.streak.freezes -= 1;
      st.streak.current += 1;
      queueToast("🧊 Streak freeze used! Your streak survives.", "info");
    } else {
      st.streak.current = 1;
    }
    st.streak.lastDay = today;
    st.streak.best = Math.max(st.streak.best, st.streak.current);
    // regen freezes weekly (max 2)
    const grant = st.streak.lastFreezeGrant;
    if (st.streak.freezes < 2 && (!grant || grant < addDays(today, -7))) {
      st.streak.freezes += 1;
      st.streak.lastFreezeGrant = today;
    }
    if (st.streak.current > 1) {
      queueToast("🔥 " + st.streak.current + "-day streak! Keep it alive.", "good");
    } else {
      queueToast("🔥 Streak started — come back tomorrow to grow it!", "good");
    }
  }

  /* ---------- badges ---------- */
  function checkBadges(st, meta) {
    const now = dayKey();
    const grant = (id) => {
      if (!st.badges[id]) {
        st.badges[id] = now;
        const b = BADGES[id];
        queueToast(b.emoji + " Badge earned: " + b.name + "!", "level");
      }
    };
    if (Object.keys(st.badges).length === 0 && st.xp > 0) grant("first_steps");
    if (st.counters.cards_total >= 100) grant("card_100");
    if (st.streak.current >= 3) grant("streak_3");
    if (st.streak.current >= 7) grant("streak_7");
    if (st.streak.current >= 30) grant("streak_30");
    if (levelFor(st.xp) >= 5) grant("level_5");
    if (levelFor(st.xp) >= 10) grant("level_10");
    if (st.counters.focus_total >= 10) grant("focus_10");
    if (st.counters.perfect_quizzes >= 1) grant("quiz_perfect");
    if (st.counters.challenges >= 1) grant("challenge_1");
    if (st.xp >= 1000) grant("xp_1000");
    if (meta && meta.deck_builder) grant("deck_builder");
    if (meta && meta.ai_pioneer) grant("ai_pioneer");
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) grant("night_owl");
    if (hour >= 5 && hour < 8) grant("early_bird");
  }

  /* ---------- toasts queue (deferred so DOM/UI is ready) ---------- */
  const pendingToasts = [];
  function queueToast(msg, kind) {
    if (window.SB.ui) window.SB.ui.toast(msg, kind);
    else pendingToasts.push([msg, kind]);
  }
  document.addEventListener("DOMContentLoaded", () => {
    while (pendingToasts.length) {
      const [m, k] = pendingToasts.shift();
      queueToast(m, k);
    }
  });

  /* ---------- daily boost ---------- */
  function boostActive(st) {
    return st.dailyBoost && st.dailyBoost.day === dayKey() && Date.now() < st.dailyBoost.until;
  }

  /* ---------- core award ---------- */
  function award(type, meta) {
    meta = meta || {};
    const beforeLevel = levelFor(state.xp);
    const base = XP_RULES[type] || 0;
    if (!base) return 0;

    ensureQuests(state);
    let boosted = false;
    if (!boostActive(state) && !(state.dailyBoost && state.dailyBoost.day === dayKey())) {
      state.dailyBoost = { day: dayKey(), until: Date.now() + 15 * 60 * 1000 };
      boosted = true;
    }
    const mult = boostActive(state) || boosted ? 2 : 1;
    const gained = base * mult;

    state.xp += gained;
    if (type === "card") state.counters.cards_total += 1;
    if (type === "quiz_complete" && meta.perfect) state.counters.perfect_quizzes += 1;
    if (type === "challenge_complete") state.counters.challenges = (state.counters.challenges || 0) + 1;
    if (type === "focus_session") state.counters.focus_total += 1;

    const today = dayKey();
    state.activity[today] = (state.activity[today] || 0) + gained;
    state.weekly.xp += gained;
    if (!state.weekly.done && state.weekly.xp >= state.weekly.target) {
      state.weekly.done = true;
      state.xp += state.weekly.reward;
      state.activity[today] += state.weekly.reward;
      queueToast("🏅 Weekly quest complete! +" + state.weekly.reward + " bonus XP", "level");
    }

    // quest progress
    for (const q of state.quests.list) {
      if (q.done) continue;
      const matches =
        q.type === type ||
        (q.type === "answer_any" && (type === "answer_correct" || type === "answer_wrong")) ||
        (q.type === "xp" && gained > 0);
      if (matches) {
        q.progress = Math.min(q.target, q.progress + (q.type === "xp" ? gained : 1));
        if (q.progress >= q.target) {
          q.done = true;
          state.xp += q.reward;
          state.activity[today] += q.reward;
          queueToast("✅ Quest complete: " + q.label + " (+" + q.reward + " XP)", "level");
        }
      }
    }

    updateStreak(state);
    checkBadges(state, meta);
    save(state);

    const afterLevel = levelFor(state.xp);
    if (afterLevel > beforeLevel) {
      queueToast("⬆️ Level " + afterLevel + " — " + LEVEL_NAMES[afterLevel - 1] + "!", "level");
      if (window.SB.ui) {
        window.SB.ui.confetti(2000);
        window.SB.ui.levelUpModal(afterLevel, LEVEL_NAMES[afterLevel - 1]);
      }
    } else if (boosted) {
      queueToast("🚀 Daily Boost: 2× XP for 15 minutes!", "xp");
    }

    document.dispatchEvent(new CustomEvent("sb:xp", { detail: { gained, type, total: state.xp } }));
    return gained;
  }

  /* ---------- public API ---------- */
  window.SB.gamification = {
    award,
    LEVEL_NAMES,
    LEVEL_XP,
    BADGES,
    levelFor,
    levelName(lvl) { return LEVEL_NAMES[Math.min(lvl, LEVEL_NAMES.length) - 1]; },
    getStats() {
      ensureQuests(state); save(state);
      const lvl = levelFor(state.xp);
      const cur = LEVEL_XP[Math.min(lvl - 1, LEVEL_XP.length - 1)];
      const next = LEVEL_XP[Math.min(lvl, LEVEL_XP.length - 1)];
      return {
        xp: state.xp,
        level: lvl,
        levelName: LEVEL_NAMES[lvl - 1],
        levelProgress: lvl >= LEVEL_NAMES.length ? 100 : Math.round(((state.xp - cur) / (next - cur)) * 100),
        xpToNext: lvl >= LEVEL_NAMES.length ? 0 : next - state.xp,
        streak: { ...state.streak },
        quests: state.quests,
        weekly: state.weekly,
        badges: { ...state.badges },
        activity: { ...state.activity },
        totals: { ...state.totals },
        counters: { ...state.counters },
      };
    },
    boostActive: () => boostActive(state),
    reset() {
      state = defaultState();
      save(state);
    },
  };
})();
