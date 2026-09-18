import { renderChatPage } from './chat.js';

const app = document.querySelector('#app');
const toastRegion = document.querySelector('#toast-region');

const state = {
  token: sessionStorage.getItem('lp-token'),
  data: null,
  view: 'home',
  activeLessonId: null,
  questionIndex: 0,
  selectedAnswer: null,
  feedback: null,
  retryOverrides: {},
  boss: null,
  bossAnswers: {},
  busy: false,
  offlineQueue: loadQueue(),
  celebrate: null,
  tutor: { open: false, messages: [], busy: false },
  reduceMotion: loadReduceMotion(),
};

function loadReduceMotion() {
  try { return localStorage.getItem('lp-reduce-motion') === '1'; } catch { return false; }
}
function applyReduceMotion() {
  document.documentElement.classList.toggle('force-reduce-motion', state.reduceMotion);
}

function loadQueue() {
  try { return JSON.parse(localStorage.getItem('lp-offline-queue') || '[]'); } catch { return []; }
}
function saveQueue() {
  try { localStorage.setItem('lp-offline-queue', JSON.stringify(state.offlineQueue)); } catch { /* private mode or storage disabled: queue stays in-memory only */ }
}

const copy = {
  ar: {
    brand: 'منصة التعلّم', demo: 'بيئة تجريبية • المحتوى غير معتمد', home: 'القاعدة', map: 'خريطة الرحلة', progress: 'معمل التقدّم', shop: 'غرفة المكافآت', chat: 'المرشد الذكي', profile: 'الإعدادات',
    homeShort: 'القاعدة', mapShort: 'الخريطة', progressShort: 'التقدّم', shopShort: 'المكافآت', chatShort: 'المرشد', profileShort: 'الإعدادات', teacher: 'استوديو المعلّم', admin: 'استوديو المحتوى',
    greeting: 'أهلًا', ready: 'جاهز لخطوة صغيرة جديدة؟', today: 'مهمتك المقترحة اليوم', continue: 'كمّل الرحلة', minutes: 'دقائق', assignments: 'تكليفاتك', streak: 'إيقاع التعلّم', meaningful: 'كل إجابة صادقة تبني فهمك.',
    evidence: 'تقدّمك مبني على أدلة متنوعة، وليس إجابة واحدة.', insufficient: 'نحتاج أدلة أكثر', reteach: 'لنراجع الفكرة', supported: 'تدريب بمساندة', mixed: 'تطبيق متنوع', mastered: 'إتقان مبدئي',
    lesson: 'الدرس', example: 'مثال محلول', checkpoint: 'نقطة تحقق', submit: 'تحقق من إجابتي', next: 'السؤال التالي', retry: 'جرّب مرة أخرى', correct: 'إجابة موفقة!', incorrect: 'محاولة مفيدة—خلّينا نفهمها.', finish: 'أنهِ الدرس',
    owned: 'مملوك', buy: 'شراء', coins: 'عملة', logout: 'تسجيل الخروج', language: 'لغة الواجهة', accessibility: 'الوصول والراحة', reduced: 'تقليل الحركة', privacy: 'الخصوصية', demoPrivacy: 'هذه بيانات تجريبية محلية على الخادم.',
    boss: 'تحدي الوحدة', startBoss: 'ابدأ التحدي', locked: 'قيد المراجعة', noEvidence: 'لم تبدأ الأدلة بعد', reviews: 'مراجعات مجدولة', questions: 'إجابات مسجلة', completed: 'دروس مكتملة',
    xp: 'نقاط خبرة', level: 'المستوى', levelUp: 'مستوى جديد!', collection: 'مجموعتي', equip: 'ارتداء', equipped: 'مرتدى الآن', notOwned: 'غير مملوك بعد',
    pendingSync: 'بانتظار الاتصال', queued: 'محفوظة — ستُرسل عند رجوع الاتصال', syncing: 'جاري المزامنة…', synced: 'تمت المزامنة', queueFailed: 'تعذّر إرسال إجابة سابقة',
    reviewDraft: 'مسودة', reviewInReview: 'قيد المراجعة', reviewApproved: 'معتمد', pubDraft: 'غير منشور', pubPublished: 'منشور', pubRetired: 'متقاعد',
    submitReview: 'أرسل للمراجعة', approve: 'اعتماد', returnToDraft: 'إعادة للمسودة', publish: 'نشر', retire: 'سحب من النشر', reviewedBy: 'راجعه', publishedOn: 'نُشر في',
    assessmentOffline: 'التحدي غير متاح بدون اتصال لضمان نتيجة موثوقة.', purchaseOffline: 'الشراء غير متاح بدون اتصال.',
    studyHelper: 'مساعد الدراسة', aiDraftNotice: 'ردود المساعد مسودة من الذكاء الاصطناعي، تحقق دائمًا مع معلّمك.', askPlaceholder: 'اسأل عن الدرس الحالي…', send: 'إرسال', tutorIntro: 'أهلًا! اسألني عن الدرس الحالي وهساعدك تفهمه، من غير ما أديك الإجابة مباشرة.', tutorUnavailableBoss: 'المساعد غير متاح أثناء تحدي الوحدة للحفاظ على نتيجة موثوقة.',
  },
  en: {
    brand: 'Learning Platform', demo: 'Demo environment • content is not approved', home: 'Home Base', map: 'World Map', progress: 'Progress Lab', shop: 'Reward Room', chat: 'AI Chat', profile: 'Settings',
    homeShort: 'Home', mapShort: 'Map', progressShort: 'Progress', shopShort: 'Rewards', chatShort: 'AI Chat', profileShort: 'Settings', teacher: 'Teacher Studio', admin: 'Content Studio',
    greeting: 'Welcome', ready: 'Ready for one small step?', today: 'Your recommended task', continue: 'Continue quest', minutes: 'minutes', assignments: 'Your assignments', streak: 'Learning rhythm', meaningful: 'Every honest answer builds understanding.',
    evidence: 'Progress uses varied evidence, not one answer.', insufficient: 'More evidence needed', reteach: 'Review the idea', supported: 'Supported practice', mixed: 'Mixed application', mastered: 'Provisionally mastered',
    lesson: 'Lesson', example: 'Worked example', checkpoint: 'Checkpoint', submit: 'Check my answer', next: 'Next question', retry: 'Try again', correct: 'Nice reasoning!', incorrect: 'Useful attempt—let’s unpack it.', finish: 'Finish lesson',
    owned: 'Owned', buy: 'Buy', coins: 'coins', logout: 'Log out', language: 'Interface language', accessibility: 'Access and comfort', reduced: 'Reduce motion', privacy: 'Privacy', demoPrivacy: 'This is local demonstration data stored on the server.',
    boss: 'Unit Boss', startBoss: 'Start challenge', locked: 'Under review', noEvidence: 'No evidence yet', reviews: 'Scheduled reviews', questions: 'Recorded answers', completed: 'Completed lessons',
    xp: 'XP', level: 'Level', levelUp: 'Level up!', collection: 'My collection', equip: 'Equip', equipped: 'Equipped', notOwned: 'Not owned yet',
    pendingSync: 'Waiting for connection', queued: 'Saved — will send once you’re back online', syncing: 'Syncing…', synced: 'Synced', queueFailed: 'A saved answer could not be sent',
    reviewDraft: 'Draft', reviewInReview: 'In review', reviewApproved: 'Approved', pubDraft: 'Unpublished', pubPublished: 'Published', pubRetired: 'Retired',
    submitReview: 'Submit for review', approve: 'Approve', returnToDraft: 'Return to draft', publish: 'Publish', retire: 'Retire', reviewedBy: 'Reviewed by', publishedOn: 'Published on',
    assessmentOffline: 'The challenge is unavailable offline, to keep the result trustworthy.', purchaseOffline: 'Purchases are unavailable offline.',
    studyHelper: 'Study Helper', aiDraftNotice: 'Replies are an AI-generated draft — always check with your teacher.', askPlaceholder: 'Ask about the current lesson…', send: 'Send', tutorIntro: 'Hi! Ask me about the current lesson and I’ll help you reason it out, without just giving you the answer.', tutorUnavailableBoss: 'The study helper is unavailable during the Unit Boss, to keep the result trustworthy.',
  },
};

const lang = () => state.data?.user?.language || 'ar';
const t = (key) => copy[lang()]?.[key] || copy.ar[key] || key;
const local = (item, key) => item?.[`${key}${lang() === 'en' ? 'En' : 'Ar'}`] ?? item?.[key] ?? '';
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const id = () => crypto.randomUUID();
const name = () => local(state.data.user, 'name');

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new Error(lang() === 'en' ? 'No connection. Your answer was not sent.' : 'لا يوجد اتصال. لم تُرسل إجابتك.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || (lang() === 'en' ? 'Something went wrong.' : 'حدث خطأ غير متوقع.'));
  return body;
}

function toast(message, type = '') {
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  toastRegion.append(node);
  setTimeout(() => node.remove(), 3500);
}

function setDocumentLanguage() {
  document.documentElement.lang = lang();
  document.documentElement.dir = lang() === 'en' ? 'ltr' : 'rtl';
  document.title = t('brand');
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) skipLink.textContent = lang() === 'en' ? 'Skip to content' : 'انتقل إلى المحتوى';
}

function loading() {
  app.innerHTML = '<main class="loading-page"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></main>';
}

function renderLogin(error = '') {
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  app.innerHTML = `
    <main class="login-page" id="main">
      <section class="login-visual" aria-label="رحلة تعلّم شخصية">
        <div class="brand"><div class="brand-mark">ل</div><span class="brand-name">منصة التعلّم</span></div>
        <div class="hero-copy">
          <span class="tag">مساحة تجريبية آمنة</span>
          <h1>اتعلّم.<br>جرّب. اكتشف.</h1>
          <p>رحلة عربية تساعدك تفهم الغلط، تجمع أدلة حقيقية على تقدّمك، وتكافئ مجهودك.</p>
          <div class="orbit" aria-hidden="true"><div class="orbit-line"></div><div class="planet">🧠</div><i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i></div>
        </div>
        <small>المحتوى الحالي توضيحي وغير مرتبط بمنهج رسمي.</small>
      </section>
      <section class="login-panel">
        <form class="login-card" id="login-form">
          <p class="eyebrow">أهلًا برجوعك</p>
          <h2>كمّل من مكانك</h2>
          <p>سجّل دخولك، أو استخدم أحد الحسابات التجريبية لاستكشاف الأدوار.</p>
          ${error ? `<div class="feedback incorrect" role="alert">${esc(error)}</div>` : ''}
          <div class="field"><label for="email">البريد الإلكتروني</label><input id="email" name="email" type="email" autocomplete="username" required value="student@demo.local"></div>
          <div class="field"><label for="password">كلمة المرور</label><input id="password" name="password" type="password" autocomplete="current-password" required value="demo123"></div>
          <button class="btn btn-primary btn-block" type="submit">دخول آمن <span aria-hidden="true">←</span></button>
          <div class="demo-access">
            <strong>دخول سريع بحساب تجريبي</strong>
            <div class="demo-buttons">
              <button class="demo-button" type="button" data-demo="student@demo.local">🎒 طالب</button>
              <button class="demo-button" type="button" data-demo="teacher@demo.local">📋 معلّم</button>
              <button class="demo-button" type="button" data-demo="admin@demo.local">🛡️ مسؤول</button>
            </div>
          </div>
        </form>
      </section>
    </main>`;
}

async function login(email, password = 'demo123') {
  loading();
  try {
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    state.token = result.token;
    sessionStorage.setItem('lp-token', state.token);
    await bootstrap();
  } catch (error) { renderLogin(error.message); }
}

async function bootstrap() {
  if (!state.token) return renderLogin();
  loading();
  try {
    state.data = await api('/api/bootstrap');
    setDocumentLanguage();
    state.view = state.data.user.role === 'student' ? state.view : state.data.user.role;
    render();
  } catch {
    sessionStorage.removeItem('lp-token');
    state.token = null;
    renderLogin('انتهت الجلسة. سجّل دخولك مرة أخرى.');
  }
}

const studentNav = [
  ['home', '⌂', 'home'], ['map', '🗺', 'map'], ['progress', '◔', 'progress'], ['shop', '✦', 'shop'], ['chat', '✧', 'chat'], ['profile', '⚙', 'profile'],
];

function equippedIcon(user) {
  const item = state.data.shopItems?.find((candidate) => candidate.id === user.avatarItemId);
  return item?.icon || (user.role === 'student' ? '🧭' : user.role === 'teacher' ? '📋' : '🛡️');
}

function shell(content, title = '') {
  const role = state.data.user.role;
  const nav = role === 'student' ? studentNav : role === 'teacher' ? [['teacher', '▦', 'teacher']] : [['admin', '▤', 'admin']];
  const wallet = state.data.wallet;
  const pending = state.offlineQueue.length;
  return `
    <div class="app-shell ${state.view === 'chat' ? 'is-chat' : ''}">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">ل</div><span class="brand-name">${t('brand')}</span></div>
        <nav class="sidebar-nav" aria-label="${lang() === 'en' ? 'Main navigation' : 'التنقل الرئيسي'}">${nav.map(navButton).join('')}</nav>
        <div class="sidebar-user"><div class="mini-avatar" style="background:${state.data.shopItems?.find((i) => i.id === state.data.user.avatarItemId)?.color || '#8174e6'}">${equippedIcon(state.data.user)}</div><div><strong>${esc(name())}</strong><span>${role === 'student' && wallet ? `${t('level')} ${wallet.level}` : role}</span></div></div>
      </aside>
      <div class="main-wrap">
        <header class="topbar"><span class="topbar-title">${esc(title || t(state.view))}</span><div class="top-actions">${pending ? `<span class="stat-pill pending-pill" title="${t('pendingSync')}">⏳<b>${pending}</b></span>` : ''}${wallet ? `<span class="stat-pill xp-pill" title="${t('xp')}">★<b>${wallet.xp}</b></span><span class="stat-pill"><i class="coin-dot">✦</i><b>${wallet.coins}</b><span>${t('coins')}</span></span>` : ''}<button class="icon-button" data-action="logout" aria-label="${t('logout')}">↪</button></div></header>
        <main id="main" class="content">${content}</main>
      </div>
      <nav class="mobile-nav" aria-label="${lang() === 'en' ? 'Mobile navigation' : 'التنقل على الهاتف'}">${nav.map((item) => navButton(item, true)).join('')}</nav>
    </div>`;
}

function navButton([view, icon, key], compact = false) {
  const active = state.view === view;
  // The bottom bar gets short labels: six full Arabic destination names cannot fit a ~64px cell without
  // shrinking to an unreadable size, and truncating them is worse than naming them concisely.
  const shortKey = `${key}Short`;
  const label = compact && t(shortKey) !== shortKey ? t(shortKey) : t(key);
  return `<button class="nav-button ${active ? 'active' : ''}" data-view="${view}" ${active ? 'aria-current="page"' : ''} title="${t(key)}"><span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-label">${label}</span></button>`;
}

function renderTutorWidget() {
  if (state.data.user.role !== 'student') return '';
  // The full AI Chat page is its own, richer destination — showing the small contextual FAB on top
  // of it would be redundant clutter, not a second option worth keeping visible.
  if (state.view === 'chat') return '';
  if (state.view === 'boss') {
    return state.tutor.open ? `<div class="tutor-panel"><div class="tutor-head"><strong>🤖 ${t('studyHelper')}</strong><button class="icon-button" data-action="tutor-toggle" aria-label="close">✕</button></div><p class="tutor-empty">${t('tutorUnavailableBoss')}</p></div>` : `<button class="tutor-fab" data-action="tutor-toggle" aria-label="${t('studyHelper')}">🤖</button>`;
  }
  if (!state.tutor.open) return `<button class="tutor-fab" data-action="tutor-toggle" aria-label="${t('studyHelper')}">🤖</button>`;
  const messages = state.tutor.messages;
  return `
    <div class="tutor-panel" role="dialog" aria-label="${t('studyHelper')}">
      <div class="tutor-head"><strong>🤖 ${t('studyHelper')}</strong><button class="icon-button" data-action="tutor-toggle" aria-label="close">✕</button></div>
      <p class="tutor-disclosure">${t('aiDraftNotice')}</p>
      <div class="tutor-messages" id="tutor-messages">${messages.length ? messages.map((item) => `<div class="tutor-msg ${item.role}">${item.role === 'assistant' && item.unavailable ? '<span class="tutor-flag">⚠</span> ' : ''}${esc(item.text)}</div>`).join('') : `<div class="tutor-msg assistant">${t('tutorIntro')}</div>`}${state.tutor.busy ? `<div class="tutor-msg assistant tutor-typing"><span></span><span></span><span></span></div>` : ''}</div>
      <form class="tutor-input-row" id="tutor-form"><input id="tutor-input" type="text" maxlength="500" placeholder="${t('askPlaceholder')}" autocomplete="off" ${state.tutor.busy ? 'disabled' : ''}><button class="btn btn-primary btn-sm" type="submit" ${state.tutor.busy ? 'disabled' : ''}>${t('send')}</button></form>
    </div>`;
}

function renderCelebration() {
  if (!state.celebrate) return '';
  const isBoss = state.celebrate === 'boss';
  return `<div class="modal-backdrop celebration-backdrop"><section class="modal celebration-modal" role="dialog" aria-modal="true" aria-labelledby="celebrate-title"><div class="confetti" aria-hidden="true">${'🎉✨🏆✦🌟'.split('').map((e, i) => `<i style="--i:${i}">${e}</i>`).join('')}</div><div class="celebration-icon">${isBoss ? '🏆' : '🎓'}</div><h2 id="celebrate-title">${isBoss ? (lang() === 'en' ? 'Unit Boss complete!' : 'أكملت تحدي الوحدة!') : (lang() === 'en' ? 'Lesson complete!' : 'أكملت الدرس!')}</h2><p>${isBoss ? (lang() === 'en' ? 'A one-time reward was recorded on your ledger.' : 'اتسجلت مكافأة الإكمال لمرة واحدة في سجلك.') : (lang() === 'en' ? '25 coins and 15 XP were recorded once.' : 'اتسجلت 25 عملة و15 نقطة خبرة لمرة واحدة.')}</p><button class="btn btn-primary btn-block" data-action="dismiss-celebration">${lang() === 'en' ? 'Keep going' : 'كمّل رحلتك'}</button></section></div>`;
}

// Publishes the bottom navigation's REAL height as --nav-h. Every full-height mobile layout (the chat
// page most of all) sizes itself against it, so label/scale/safe-area changes can never again leave a
// dead gap or an overlap the way a hard-coded rem value did.
let navResizeObserver = null;
function syncNavHeight() {
  const nav = document.querySelector('.mobile-nav');
  if (!nav) return;
  const apply = () => {
    const h = nav.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--nav-h', `${Math.round(h)}px`);
  };
  apply();
  if (typeof ResizeObserver === 'function') {
    navResizeObserver?.disconnect();
    navResizeObserver = new ResizeObserver(apply);
    navResizeObserver.observe(nav);
  }
}

function render() {
  if (!state.data) return renderLogin();
  const role = state.data.user.role;
  if (role === 'teacher') app.innerHTML = shell(renderTeacher(), t('teacher'));
  else if (role === 'admin') app.innerHTML = shell(renderAdmin(), t('admin'));
  else {
    const views = { home: renderHome, map: renderMap, lesson: renderLesson, progress: renderProgress, shop: renderShop, chat: renderChatPage, profile: renderProfile, boss: renderBoss };
    app.innerHTML = shell((views[state.view] || renderHome)(), state.view === 'lesson' ? t('lesson') : t(state.view));
  }
  syncNavHeight();
  app.insertAdjacentHTML('beforeend', renderCelebration());
  if (state.celebrate && !document.activeElement?.closest('.celebration-modal')) app.querySelector('.celebration-modal [data-action="dismiss-celebration"]')?.focus();
  app.insertAdjacentHTML('beforeend', renderTutorWidget());
  const tutorMessages = document.querySelector('#tutor-messages');
  if (tutorMessages) tutorMessages.scrollTop = tutorMessages.scrollHeight;
}

// Generic page-transition helper — not chat-specific, even though only the Chat page opts into a
// visible fade today. A fade only plays when entering or leaving Chat specifically, and never when
// reduced motion is on (an instant swap, not just a faster animation). Every other page-to-page
// navigation is unaffected — the same instant swap as before this existed.
function navigateTo(nextView) {
  const swap = () => { state.view = nextView; state.feedback = null; render(); window.scrollTo(0, 0); };
  const crossesChatBoundary = (state.view === 'chat') !== (nextView === 'chat');
  if (state.reduceMotion || !crossesChatBoundary || state.view === nextView) return swap();
  const current = app.querySelector('.content');
  if (!current) return swap();
  current.classList.add('page-fade-out');
  let settled = false;
  const finish = () => { if (settled) return; settled = true; swap(); };
  current.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 220);
}

function firstAvailableLesson() {
  const recommended = state.data.progress.recommendation?.lessonId;
  return state.data.curriculum.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.id === recommended)
    || state.data.curriculum.units.flatMap((unit) => unit.lessons)[0];
}

function completionPercent() {
  const lessons = state.data.curriculum.units.flatMap((unit) => unit.lessons).length;
  return lessons ? Math.round(state.data.progress.completedLessons.length / lessons * 100) : 0;
}

function renderHome() {
  const lesson = firstAvailableLesson();
  const assignment = state.data.assignments[0];
  const completed = state.data.progress.completedLessons.some((item) => item.lessonId === lesson.id);
  const wallet = state.data.wallet;
  return `
    <div class="welcome-row"><div><p class="eyebrow">${t('greeting')}${lang() === 'en' ? ',' : '،'} ${esc(name())} 👋</p><h1>${t('ready')}</h1><p>${t('meaningful')}</p></div><div class="demo-banner">⚠ ${t('demo')}</div></div>
    <section class="card xp-card"><div class="xp-card-head"><span class="level-badge">${t('level')} ${wallet.level}</span><span class="xp-count">★ ${wallet.xp} ${t('xp')}</span></div><div class="bar xp-bar"><i style="width:${wallet.levelPercent}%"></i></div><p class="xp-hint">${lang() === 'en' ? `${wallet.levelCeilingXp - wallet.xp} XP to level ${wallet.level + 1}` : `${wallet.levelCeilingXp - wallet.xp} نقطة للمستوى ${wallet.level + 1}`}</p></section>
    <div class="dashboard-grid">
      <section class="card quest-card">
        <div><span class="tag">${completed ? (lang() === 'en' ? 'Review' : 'مراجعة ذكية') : t('today')}</span><h2>${esc(local(lesson, 'title'))}</h2><p>${esc(local(lesson, 'summary'))}</p></div>
        <div class="quest-footer"><button class="btn" data-open-lesson="${lesson.id}">${completed ? (lang() === 'en' ? 'Review again' : 'راجع من جديد') : t('continue')} <span aria-hidden="true">←</span></button><div class="progress-ring" style="--value:${completionPercent()}" data-label="${completionPercent()}%" aria-label="${completionPercent()}%"></div></div>
      </section>
      <div class="side-stack">
        <section class="card streak-card"><div class="streak-head"><span class="tag success">${t('streak')}</span><div class="streak-icon">🔥</div></div><h3>${lang() === 'en' ? 'Build a calm rhythm' : 'ابنِ إيقاعًا هاديًا'}</h3><p>${lang() === 'en' ? 'Meaningful learning matters more than opening the app.' : 'التعلّم المفيد أهم من مجرد فتح التطبيق.'}</p><div class="week-dots">${['S','M','T','W','T','F','S'].map((day, index) => `<div class="day-dot ${index < Math.min(3, state.data.progress.attempts.length) ? 'done' : ''}">${day}<i>${index < Math.min(3, state.data.progress.attempts.length) ? '✓' : '·'}</i></div>`).join('')}</div></section>
        <section class="card milestone-card"><span class="tag warning">${lang() === 'en' ? 'Next milestone' : 'المحطة الجاية'}</span><h3>${lang() === 'en' ? 'Complete the motion unit' : 'أكمل وحدة الحركة'}</h3><p>${lang() === 'en' ? 'Finish both lessons, then try the three-question challenge.' : 'أنهِ الدرسين، وبعدها جرّب تحدي الثلاث أسئلة.'}</p></section>
      </div>
    </div>
    <section class="section"><div class="section-head"><h2>${t('assignments')}</h2><button class="text-button" data-view="map">${lang() === 'en' ? 'See map' : 'افتح الخريطة'}</button></div>
      <div class="assignment-list">${assignment ? `<article class="card assignment-card"><div class="assignment-icon">📘</div><div><h3>${esc(local(assignment, 'title'))}</h3><p>${lang() === 'en' ? 'Assigned by your teacher • no deadline' : 'من معلّمتك • بدون موعد ضغط'}</p></div></article>` : `<div class="card empty-state"><p>${lang() === 'en' ? 'No assignments right now.' : 'لا توجد تكليفات الآن.'}</p></div>`}<article class="card assignment-card"><div class="assignment-icon">⏱</div><div><h3>${lesson.duration} ${t('minutes')}</h3><p>${lang() === 'en' ? 'Estimated focused time' : 'وقت تركيز تقريبي'}</p></div></article></div>
    </section>`;
}

function renderMap() {
  return `
    <div class="page-header"><div><p class="eyebrow">${local(state.data.curriculum, 'title')}</p><h1>${t('map')}</h1><p>${local(state.data.curriculum, 'grade')}</p></div><div class="demo-banner">⚠ ${t('demo')}</div></div>
    <section class="card world-map"><div class="unit-lane">${state.data.curriculum.units.map((unit, index) => {
      const done = unit.lessons?.filter((lesson) => state.data.progress.completedLessons.some((item) => item.lessonId === lesson.id)).length || 0;
      return `<article class="unit-card ${unit.locked ? 'locked' : ''}"><div class="unit-orb">${unit.locked ? '🔒' : index ? '⚛' : '↗'}</div><div><span class="tag ${unit.locked ? '' : 'success'}">${unit.locked ? t('locked') : `${done}/${unit.lessons.length} ${lang() === 'en' ? 'lessons' : 'دروس'}`}</span><h2>${esc(local(unit, 'title'))}</h2><p>${esc(local(unit, 'description'))}</p>${!unit.locked ? `<div class="lesson-chips">${unit.lessons.map((lesson) => `<button class="lesson-chip" data-open-lesson="${lesson.id}">${state.data.progress.completedLessons.some((item) => item.lessonId === lesson.id) ? '✓ ' : ''}${esc(local(lesson, 'title'))}</button>`).join('')}</div>` : ''}</div>${!unit.locked ? `<button class="btn btn-secondary" data-start-boss="${unit.id}">${t('startBoss')}</button>` : `<span class="tag">${lang() === 'en' ? 'Unavailable: awaiting review' : 'غير متاح: ينتظر المراجعة'}</span>`}</article>`;
    }).join('')}</div></section>`;
}

function currentLesson() {
  return state.data.curriculum.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.id === state.activeLessonId) || firstAvailableLesson();
}

function activeQuestion(lesson, index = state.questionIndex) {
  return state.retryOverrides[`${lesson.id}:${index}`] || lesson.questions[index] || lesson.questions[0];
}

function renderLesson() {
  const lesson = currentLesson();
  state.activeLessonId = lesson.id;
  const question = activeQuestion(lesson);
  const isVariant = question.id !== lesson.questions[state.questionIndex]?.id;
  const suffix = lang() === 'en' ? ['A','B','C','D'] : ['أ','ب','ج','د'];
  return `
    <div class="lesson-layout">
      <section class="card lesson-main">
        <div class="lesson-hero"><div class="breadcrumb">${t('map')} / ${t('lesson')} ${lesson.order}</div><h1>${esc(local(lesson, 'title'))}</h1><p>${esc(local(lesson, 'summary'))}</p>${lesson.id === 'lesson-motion-basics' ? `<div class="formula-box">speed = distance ÷ time</div>` : ''}</div>
        <div class="worked-example"><h3>💡 ${t('example')}</h3><p>${esc(local(lesson, 'worked'))}</p></div>
        <div class="question-stage">
          <div class="question-meta"><span class="tag">${t('checkpoint')} ${state.questionIndex + 1}/${lesson.questions.length}</span><span class="tag ${question.difficulty === 'core' ? 'success' : 'warning'}">${difficultyLabel(question.difficulty)}</span>${isVariant ? `<span class="tag variant-tag">🔄 ${lang() === 'en' ? 'New question, same idea' : 'سؤال جديد، نفس الفكرة'}</span>` : ''}</div>
          <h2>${esc(question.prompt)}</h2>
          ${question.type === 'multiple-choice' ? `<div class="choices">${question.choices.map((choice, index) => `<button class="choice ${String(state.selectedAnswer) === String(index) ? 'selected' : ''}" data-answer="${index}" ${state.feedback ? 'disabled' : ''}><span class="choice-letter">${suffix[index]}</span><span>${esc(choice)}</span></button>`).join('')}</div>` : `<div class="numeric-wrap"><input id="numeric-answer" type="number" step="any" inputmode="decimal" placeholder="0" value="${esc(state.selectedAnswer ?? '')}" ${state.feedback ? 'disabled' : ''}><span>${question.unit || (lang() === 'en' ? 'm/s' : 'م/ث')}</span></div>`}
          ${state.feedback?.pending ? `<div class="feedback pending" role="status"><strong>⏳ ${t('pendingSync')}</strong><br>${t('queued')}</div>` : state.feedback ? `<div class="feedback ${state.feedback.correct ? 'correct' : 'incorrect'}" role="status"><strong>${state.feedback.correct ? t('correct') : t('incorrect')}</strong><br>${esc(state.feedback.feedback)}</div>` : ''}
          <div class="question-actions">${state.feedback?.pending ? `<button class="btn btn-ghost" data-view="map">${t('map')}</button>` : state.feedback ? `<button class="btn ${state.feedback.correct ? 'btn-primary' : 'btn-secondary'}" data-action="${state.feedback.correct ? 'next-question' : 'retry-question'}">${state.feedback.correct ? (state.questionIndex === lesson.questions.length - 1 ? t('finish') : t('next')) : t('retry')}</button>` : `<button class="btn btn-primary" data-action="submit-answer" ${state.selectedAnswer === null || state.busy ? 'disabled' : ''}>${state.busy ? '…' : t('submit')}</button>`}</div>
        </div>
      </section>
      <aside class="card lesson-aside"><h3>${lang() === 'en' ? 'Quest checkpoints' : 'محطات الرحلة'}</h3><div class="step-list">${lesson.questions.map((_, index) => `<div class="step ${index < state.questionIndex ? 'done' : index === state.questionIndex ? 'current' : ''}"><span class="step-number">${index < state.questionIndex ? '✓' : index + 1}</span><span>${t('checkpoint')} ${index + 1}</span></div>`).join('')}</div><button class="btn btn-ghost btn-block" style="margin-top:1rem" data-view="map">${lang() === 'en' ? 'Back to map' : 'العودة للخريطة'}</button></aside>
    </div>`;
}

function difficultyLabel(value) {
  const labels = { ar: { core: 'أساسي', application: 'تطبيق', transfer: 'استدلال' }, en: { core: 'Core', application: 'Application', transfer: 'Transfer' } };
  return labels[lang()][value] || value;
}

function renderProgress() {
  const attempts = state.data.progress.attempts;
  const correct = attempts.filter((item) => item.correct).length;
  const states = { insufficient: t('insufficient'), reteach: t('reteach'), supported: t('supported'), mixed: t('mixed'), 'mastered-provisional': t('mastered') };
  return `
    <div class="page-header"><div><p class="eyebrow">${t('evidence')}</p><h1>${t('progress')}</h1><p>${lang() === 'en' ? 'See what the evidence says—and what it cannot say yet.' : 'شوف الأدلة بتقول إيه، وإيه اللي لسه محتاج وقت.'}</p></div></div>
    <div class="stat-grid"><article class="card metric-card"><span>${t('questions')}</span><strong>${attempts.length}</strong><em>${correct} ${lang() === 'en' ? 'correct' : 'إجابة صحيحة'}</em></article><article class="card metric-card"><span>${t('completed')}</span><strong>${state.data.progress.completedLessons.length}</strong><em>${completionPercent()}%</em></article><article class="card metric-card"><span>${t('reviews')}</span><strong>${state.data.progress.reviews.length}</strong><em>${lang() === 'en' ? '1, 3, 7-day rhythm' : 'إيقاع 1، 3، 7 أيام'}</em></article></div>
    <section class="skill-list">${state.data.skills.map((skill) => {
      const mastery = state.data.progress.mastery.find((item) => item.skillId === skill.id);
      const score = mastery?.score ?? 0;
      return `<article class="card skill-card"><div class="skill-top"><div><h3>${esc(local(skill, 'title'))}</h3><span>${mastery ? states[mastery.state] : t('noEvidence')}</span></div><b>${mastery?.score === null || !mastery ? '—' : `${mastery.score}%`}</b></div><div class="bar"><i style="width:${score}%"></i></div><div class="skill-foot"><span>${mastery ? `${mastery.independentQuestionCount} ${lang() === 'en' ? 'distinct independent questions' : 'أسئلة مستقلة مختلفة'}` : t('noEvidence')}</span><span>${mastery?.nextReviewAt ? `${lang() === 'en' ? 'Review' : 'مراجعة'}: ${new Date(mastery.nextReviewAt).toLocaleDateString(lang() === 'en' ? 'en-US' : 'ar-EG')}` : ''}</span></div></article>`;
    }).join('')}</section>
    <div class="insight-box"><div class="insight-icon">💬</div><div><h3>${lang() === 'en' ? 'A kind recommendation' : 'اقتراح بسيط ليك'}</h3><p>${lang() === 'en' ? 'Let’s practise reading graphs again. Different questions help make the evidence stronger.' : 'خلّينا نتمرّن على قراءة الرسوم مرة كمان. أسئلة مختلفة هتخلّي الدليل أقوى.'}</p></div></div>`;
}

function renderShop() {
  const ownedIds = new Set(state.data.inventory.map((item) => item.itemId));
  return `
    <div class="page-header"><div><p class="eyebrow">${lang() === 'en' ? 'Cosmetics only • no learning advantage' : 'مظاهر فقط • بلا أفضلية تعليمية'}</p><h1>${t('shop')}</h1><p>${lang() === 'en' ? 'Spend earned coins on a space that feels like yours.' : 'استخدم العملات اللي كسبتها في مساحة شبهك.'}</p></div></div>
    <section class="card shop-hero"><div><h2>${lang() === 'en' ? 'Your collection grows with real learning' : 'مجموعتك بتكبر مع تعلّمك الحقيقي'}</h2><p>${lang() === 'en' ? 'Every purchase is recorded and can’t take your balance below zero.' : 'كل عملية شراء مسجلة، ورصيدك عمره ما ينزل تحت الصفر.'}</p></div><div class="big-balance"><i class="coin-dot">✦</i><div><strong>${state.data.wallet.coins}</strong><small> ${t('coins')}</small></div></div></section>
    <section class="shop-grid">${state.data.shopItems.filter((item) => item.price > 0).map((item) => `<article class="card item-card"><div class="item-preview" style="--item:${item.color}">${item.icon}</div><div class="item-body"><h3>${esc(local(item, 'name'))}</h3><p>${typeLabel(item.type)}</p><div class="item-footer">${ownedIds.has(item.id) ? `<span class="owned">✓ ${t('owned')}</span>` : `<span class="price">✦ ${item.price}</span><button class="btn btn-secondary" data-buy="${item.id}" ${state.data.wallet.coins < item.price ? 'disabled' : ''}>${t('buy')}</button>`}</div></div></article>`).join('')}</section>`;
}

function typeLabel(type) {
  const values = { ar: { avatar: 'الشخصية', outfit: 'زي للشخصية', companion: 'رفيق تجميلي', background: 'خلفية للمساحة' }, en: { avatar: 'Avatar', outfit: 'Avatar outfit', companion: 'Cosmetic companion', background: 'Space background' } };
  return values[lang()][type] || type;
}

const EQUIP_FIELD_BY_TYPE = { avatar: 'avatarItemId', outfit: 'outfitItemId', companion: 'companionItemId', background: 'backgroundItemId' };

function renderProfile() {
  const owned = new Set(state.data.inventory.map((item) => item.itemId));
  const collection = state.data.shopItems.filter((item) => owned.has(item.id));
  return `
    <div class="page-header"><div><p class="eyebrow">${esc(state.data.user.email)}</p><h1>${t('profile')}</h1><p>${lang() === 'en' ? 'Make the experience comfortable for you.' : 'خلّي التجربة مريحة ومناسبة ليك.'}</p></div></div>
    <section class="card collection-card">
      <h2>${t('collection')}</h2>
      <div class="collection-grid">${collection.length ? collection.map((item) => {
        const field = EQUIP_FIELD_BY_TYPE[item.type];
        const isEquipped = field && state.data.user[field] === item.id;
        return `<article class="collection-item ${isEquipped ? 'equipped' : ''}"><div class="item-preview" style="--item:${item.color}">${item.icon}</div><div class="item-body"><h3>${esc(local(item, 'name'))}</h3><p>${typeLabel(item.type)}</p>${field ? `<button class="btn ${isEquipped ? 'btn-primary' : 'btn-ghost'} btn-sm" data-equip="${field}:${item.id}" ${isEquipped ? 'disabled' : ''}>${isEquipped ? `✓ ${t('equipped')}` : t('equip')}</button>` : ''}</div></article>`;
      }).join('') : `<p class="muted">${lang() === 'en' ? 'Nothing owned yet — visit the Reward Room.' : 'لا شيء مملوك بعد — زُر غرفة المكافآت.'}</p>`}</div>
    </section>
    <div class="settings-grid">
      <section class="card settings-card"><h2>${t('language')}</h2><div class="setting-row"><div><strong>العربية</strong><span>واجهة كاملة من اليمين لليسار</span></div><button class="btn ${lang() === 'ar' ? 'btn-primary' : 'btn-ghost'}" data-language="ar">${lang() === 'ar' ? '✓' : 'اختيار'}</button></div><div class="setting-row"><div><strong>English</strong><span>Complete left-to-right interface</span></div><button class="btn ${lang() === 'en' ? 'btn-primary' : 'btn-ghost'}" data-language="en">${lang() === 'en' ? '✓' : 'Choose'}</button></div></section>
      <section class="card settings-card"><h2>${t('accessibility')}</h2><div class="setting-row"><div><strong>${t('reduced')}</strong><span>${lang() === 'en' ? 'Also respects your device preference automatically' : 'ونحترم كمان إعداد جهازك تلقائيًا'}</span></div><button class="toggle ${state.reduceMotion ? 'on' : ''}" data-toggle="motion" aria-label="${t('reduced')}" aria-pressed="${state.reduceMotion}"></button></div><div class="setting-row"><div><strong>${t('privacy')}</strong><span>${t('demoPrivacy')}</span></div><span aria-hidden="true">🔒</span></div></section>
      <section class="card settings-card"><h2>${lang() === 'en' ? 'Account controls' : 'التحكم في الحساب'}</h2><div class="setting-row"><div><strong>${t('logout')}</strong><span>${lang() === 'en' ? 'Clears this account session on this device.' : 'يمسح جلسة الحساب من الجهاز.'}</span></div><button class="btn btn-danger" data-action="logout">${t('logout')}</button></div></section>
    </div>`;
}

function renderBoss() {
  if (!state.boss) return `<div class="card empty-state"><div class="empty-icon">⏳</div><h2>${lang() === 'en' ? 'Loading challenge…' : 'بنجهّز التحدي…'}</h2></div>`;
  if (state.boss.result) {
    const result = state.boss.result;
    return `<div class="card empty-state"><div class="empty-icon">${result.score === 3 ? '🏆' : result.score === 2 ? '🧩' : '🌱'}</div><h2>${result.score}/3</h2><p>${result.score === 3 ? (lang() === 'en' ? 'You completed the challenge. The one-time reward is recorded.' : 'أكملت التحدي، واتسجلت مكافأة الإكمال لمرة واحدة.') : result.score === 2 ? (lang() === 'en' ? 'Good progress. We’ll recommend focused recovery next.' : 'تقدّم كويس. هنقترح مراجعة مركزة للجزء الناقص.') : (lang() === 'en' ? 'This is a starting point, not a block. Return to supported practice and retry with parallel questions.' : 'دي نقطة بداية، مش باب مقفول. ارجع لتدريب بمساندة وبعدها جرّب تاني.')}</p><div class="modal-actions"><button class="btn btn-secondary" data-view="map">${t('map')}</button><button class="btn btn-primary" data-view="progress">${t('progress')}</button></div></div>`;
  }
  const answered = Object.keys(state.bossAnswers).length;
  return `<div class="page-header"><div><p class="eyebrow">${lang() === 'en' ? 'Three escalating questions' : 'ثلاث أسئلة بتدرّج واضح'}</p><h1>${t('boss')}</h1><p>${lang() === 'en' ? 'This challenge supports the evidence; it does not prove full mastery alone.' : 'التحدي ده جزء من الأدلة، ومش كفاية لوحده لإثبات الإتقان.'}</p></div></div><section class="skill-list">${state.boss.questions.map((question, qIndex) => `<article class="card skill-card"><div class="question-meta"><span class="tag">${qIndex + 1}/3</span><span class="tag warning">${difficultyLabel(question.difficulty)}</span></div><h3 style="line-height:1.8">${esc(question.prompt)}</h3>${question.type === 'multiple-choice' ? `<div class="choices">${question.choices.map((choice, index) => `<button class="choice ${String(state.bossAnswers[question.id]) === String(index) ? 'selected' : ''}" data-boss-answer="${question.id}:${index}"><span class="choice-letter">${index + 1}</span><span>${esc(choice)}</span></button>`).join('')}</div>` : `<div class="numeric-wrap"><input type="number" step="any" inputmode="decimal" data-boss-numeric="${question.id}" placeholder="0" value="${esc(state.bossAnswers[question.id] ?? '')}"><span>${lang() === 'en' ? 'm/s' : 'م/ث'}</span></div>`}</article>`).join('')}</section><div class="question-actions"><button class="btn btn-primary" data-action="submit-boss" ${answered < 3 ? 'disabled' : ''}>${lang() === 'en' ? 'Submit challenge' : 'سلّم التحدي'}</button></div>`;
}

function renderTeacher() {
  const classroom = state.data.classes[0];
  return `
    <div class="page-header"><div><p class="eyebrow">${t('greeting')}${lang() === 'en' ? ',' : '،'} ${esc(name())}</p><h1>${t('teacher')}</h1><p>${lang() === 'en' ? 'Separate no activity, limited evidence, assisted work, and independent success.' : 'فرّق بين عدم النشاط، وقلة الأدلة، والنجاح بمساعدة، والنجاح المستقل.'}</p></div><div class="demo-banner">⚠ ${t('demo')}</div></div>
    <div class="stat-grid"><article class="card metric-card"><span>${lang() === 'en' ? 'Assigned classes' : 'الفصول المسندة'}</span><strong>${state.data.classes.length}</strong></article><article class="card metric-card"><span>${lang() === 'en' ? 'Students in scope' : 'الطلاب ضمن صلاحيتك'}</span><strong>${classroom?.students.length || 0}</strong></article><article class="card metric-card"><span>${lang() === 'en' ? 'Active assignments' : 'التكليفات النشطة'}</span><strong>${state.data.assignments.length}</strong></article></div>
    <div class="staff-grid"><section class="card table-card"><table class="data-table"><thead><tr><th>${lang() === 'en' ? 'Student' : 'الطالب'}</th><th>${lang() === 'en' ? 'Activity' : 'النشاط'}</th><th>${lang() === 'en' ? 'Skill evidence' : 'أدلة المهارات'}</th><th>${lang() === 'en' ? 'Support signal' : 'إشارة الدعم'}</th></tr></thead><tbody>${(classroom?.students || []).map((student) => `<tr><td><strong>${esc(local(student, 'name'))}</strong></td><td>${student.attempts ? `${student.attempts} ${lang() === 'en' ? 'attempts' : 'محاولات'}` : (lang() === 'en' ? 'No activity' : 'لا نشاط')}</td><td>${student.mastery.length ? student.mastery.map((item) => item.score === null ? '—' : `${item.score}%`).join(' · ') : t('insufficient')}</td><td><span class="tag ${student.attempts ? 'warning' : ''}">${student.attempts ? (lang() === 'en' ? 'Gather more evidence' : 'اجمع أدلة أكثر') : (lang() === 'en' ? 'Check access' : 'تحقّق من الوصول')}</span></td></tr>`).join('')}</tbody></table></section>
      <form class="card form-card" id="assignment-form"><h2>${lang() === 'en' ? 'Create an assignment' : 'إنشاء تكليف'}</h2><div class="field"><label for="assign-class">${lang() === 'en' ? 'Class' : 'الفصل'}</label><select id="assign-class" name="classId">${state.data.classes.map((item) => `<option value="${item.id}">${esc(local(item, 'name'))}</option>`).join('')}</select></div><div class="field"><label for="assign-lesson">${t('lesson')}</label><select id="assign-lesson" name="lessonId">${state.data.curriculum.units.flatMap((unit) => unit.lessons).map((lesson) => `<option value="${lesson.id}">${esc(local(lesson, 'title'))}</option>`).join('')}</select></div><button class="btn btn-primary btn-block" type="submit">${lang() === 'en' ? 'Assign lesson' : 'إسناد الدرس'}</button></form></div>`;
}

function reviewBadge(status) {
  const map = { draft: ['reviewDraft', ''], 'in-review': ['reviewInReview', 'warning'], approved: ['reviewApproved', 'success'] };
  const [key, cls] = map[status] || [status, ''];
  return `<span class="tag ${cls}">${t(key)}</span>`;
}
function pubBadge(status) {
  const map = { draft: ['pubDraft', ''], 'published-demo': ['pubPublished', 'success'], retired: ['pubRetired', 'warning'] };
  const [key, cls] = map[status] || [status, ''];
  return `<span class="tag ${cls}">${t(key)}</span>`;
}
function reviewActionsFor(item) {
  const btn = (action, label) => `<button class="btn btn-ghost btn-sm" data-review-action="${item.id}:${action}">${label}</button>`;
  if (item.publicationStatus === 'retired') return '';
  if (item.reviewStatus === 'draft') return btn('submit-review', t('submitReview'));
  if (item.reviewStatus === 'in-review') return `${btn('approve', t('approve'))}${btn('return-to-draft', t('returnToDraft'))}`;
  if (item.reviewStatus === 'approved' && item.publicationStatus === 'draft') return btn('publish', t('publish'));
  if (item.publicationStatus === 'published-demo') return btn('retire', t('retire'));
  return '';
}

function renderAdmin() {
  const drafts = state.data.content.filter((item) => item.publicationStatus === 'draft').length;
  return `
    <div class="page-header"><div><p class="eyebrow">${esc(name())}</p><h1>${t('admin')}</h1><p>${lang() === 'en' ? 'Move content through draft → review → approve → publish, and audit every change.' : 'حرّك المحتوى عبر مسودة ← مراجعة ← اعتماد ← نشر، وراقب كل تغيير.'}</p></div><div class="demo-banner">⚠ ${t('demo')}</div></div>
    <div class="stat-grid"><article class="card metric-card"><span>${lang() === 'en' ? 'Question versions' : 'إصدارات الأسئلة'}</span><strong>${state.data.content.length}</strong></article><article class="card metric-card"><span>${lang() === 'en' ? 'Published, live' : 'منشور وفعّال'}</span><strong>${state.data.content.filter((item) => item.publicationStatus === 'published-demo').length}</strong></article><article class="card metric-card"><span>${lang() === 'en' ? 'Awaiting publish' : 'بانتظار النشر'}</span><strong>${drafts}</strong></article><article class="card metric-card"><span>${lang() === 'en' ? 'Rule versions' : 'إصدارات القواعد'}</span><strong>2</strong><em>${state.data.configuration.masteryRuleVersion} · ${state.data.configuration.economyRuleVersion}</em></article></div>
    <section class="card table-card"><table class="data-table"><thead><tr><th>ID</th><th>${lang() === 'en' ? 'Prompt' : 'السؤال'}</th><th>${lang() === 'en' ? 'Review' : 'المراجعة'}</th><th>${lang() === 'en' ? 'Publication' : 'النشر'}</th><th>${lang() === 'en' ? 'Actions' : 'إجراءات'}</th></tr></thead><tbody>${state.data.content.map((item) => `<tr><td><code>${item.id}</code>${item.variantOf ? `<div class="row-sub">↳ ${lang() === 'en' ? 'variant of' : 'نسخة بديلة لـ'} ${item.variantOf}</div>` : ''}</td><td class="prompt-cell">${esc(item.promptAr || '')}</td><td>${reviewBadge(item.reviewStatus)}${item.reviewedBy ? `<div class="row-sub">${t('reviewedBy')} ${esc(item.reviewedBy)}</div>` : ''}</td><td>${pubBadge(item.publicationStatus)}${item.publishedAt ? `<div class="row-sub">${t('publishedOn')} ${new Date(item.publishedAt).toLocaleDateString()}</div>` : ''}</td><td class="actions-cell">${reviewActionsFor(item)}</td></tr>`).join('')}</tbody></table></section>
    <section class="section"><div class="section-head"><h2>${lang() === 'en' ? 'Recent audit events' : 'أحدث أحداث التدقيق'}</h2></div>${state.data.audit.length ? `<div class="card table-card"><table class="data-table"><tbody>${state.data.audit.map((item) => `<tr><td>${esc(item.action)}</td><td>${esc(item.actorId)}</td><td>${new Date(item.at).toLocaleString()}</td></tr>`).join('')}</tbody></table></div>` : `<div class="card empty-state"><div class="empty-icon">🛡️</div><h2>${lang() === 'en' ? 'No privileged changes yet' : 'لا توجد تغييرات إدارية بعد'}</h2><p>${lang() === 'en' ? 'Profile and assignment changes will appear here.' : 'تغييرات الملف والتكليفات ستظهر هنا.'}</p></div>`}</section>`;
}

async function submitCurrentAnswer() {
  const lesson = currentLesson();
  const question = activeQuestion(lesson);
  if (state.selectedAnswer === null || state.busy) return;
  state.busy = true;
  render();
  const payload = { questionId: question.id, answer: state.selectedAnswer, assisted: false, idempotencyKey: id() };
  if (!navigator.onLine) {
    state.offlineQueue.push({ id: payload.idempotencyKey, route: '/api/attempts', body: payload, lessonId: lesson.id, questionIndex: state.questionIndex, createdAt: new Date().toISOString() });
    saveQueue();
    state.feedback = { pending: true };
    state.busy = false;
    render();
    return;
  }
  try {
    const result = await api('/api/attempts', { method: 'POST', body: JSON.stringify(payload) });
    state.feedback = result;
    if (result.retryQuestion) state.retryOverrides[`${lesson.id}:${state.questionIndex}`] = result.retryQuestion;
    await refresh(false);
  } catch (error) { toast(error.message, 'error'); }
  finally { state.busy = false; render(); }
}

async function syncOfflineQueue() {
  if (!state.offlineQueue.length || !navigator.onLine) return;
  const remaining = [];
  const viewingLesson = state.view === 'lesson' && currentLesson();
  for (const item of state.offlineQueue) {
    try {
      const result = await api(item.route, { method: 'POST', body: JSON.stringify(item.body) });
      if (item.lessonId != null && result.retryQuestion && !result.correct) {
        state.retryOverrides[`${item.lessonId}:${item.questionIndex}`] = result.retryQuestion;
      }
      const isCurrentQuestion = viewingLesson && viewingLesson.id === item.lessonId && state.questionIndex === item.questionIndex;
      if (isCurrentQuestion) state.feedback = result;
      else toast(`${result.correct ? '✓' : '•'} ${lang() === 'en' ? 'A saved answer synced.' : 'اتزامنت إجابة محفوظة.'}`);
    } catch (error) {
      if (error.message?.includes('اتصال') || error.message?.includes('connection')) { remaining.push(item); continue; }
      toast(`${t('queueFailed')}: ${error.message}`, 'error');
    }
  }
  state.offlineQueue = remaining;
  saveQueue();
  await refresh();
  if (!remaining.length) toast(lang() === 'en' ? 'All saved answers were synced.' : 'اتزامنت كل الإجابات المحفوظة.');
}

async function refresh(doRender = true) {
  state.data = await api('/api/bootstrap');
  setDocumentLanguage();
  if (doRender) render();
}

async function openBoss(unitId) {
  state.view = 'boss'; state.boss = null; state.bossAnswers = {};
  render();
  try { state.boss = await api(`/api/units/${unitId}/boss`); render(); }
  catch (error) { toast(error.message, 'error'); state.view = 'map'; render(); }
}

function showPurchaseConfirmation(itemId) {
  const item = state.data.shopItems.find((candidate) => candidate.id === itemId);
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal._returnFocus = document.activeElement;
  modal.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title"><h2 id="purchase-title">${lang() === 'en' ? 'Confirm purchase' : 'تأكيد الشراء'}</h2><p>${lang() === 'en' ? `Buy ${local(item, 'name')} for ${item.price} coins? This item is cosmetic only.` : `تشتري ${local(item, 'name')} مقابل ${item.price} عملة؟ العنصر تجميلي فقط.`}</p><div class="modal-actions"><button class="btn btn-ghost" data-close-modal>${lang() === 'en' ? 'Cancel' : 'إلغاء'}</button><button class="btn btn-primary" data-confirm-buy="${item.id}">${t('buy')}</button></div></section>`;
  document.body.append(modal);
  modal.querySelector('[data-close-modal]').focus();
}

function closeTopModal() {
  const modal = document.querySelector('.modal-backdrop');
  if (!modal) return false;
  modal._returnFocus?.focus();
  modal.remove();
  return true;
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (state.celebrate) { state.celebrate = null; render(); return; }
    if (closeTopModal()) return;
    if (state.tutor.open) { state.tutor.open = false; render(); document.querySelector('[data-action="tutor-toggle"]')?.focus(); return; }
    return;
  }
  if (event.key === 'Tab') {
    const modal = document.querySelector('.modal-backdrop .modal, .modal-backdrop .celebration-modal');
    if (!modal) return;
    const focusable = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('modal-backdrop')) { if (state.celebrate) { state.celebrate = null; render(); } else closeTopModal(); return; }
  const motionToggle = event.target.closest('[data-toggle="motion"]');
  if (motionToggle) {
    state.reduceMotion = !state.reduceMotion;
    try { localStorage.setItem('lp-reduce-motion', state.reduceMotion ? '1' : '0'); } catch { /* private mode: preference won't persist across reloads */ }
    applyReduceMotion();
    render();
    return;
  }
  const demo = event.target.closest('[data-demo]');
  if (demo) return login(demo.dataset.demo);
  const view = event.target.closest('[data-view]');
  if (view) { navigateTo(view.dataset.view); return; }
  const lessonButton = event.target.closest('[data-open-lesson]');
  if (lessonButton) { state.activeLessonId = lessonButton.dataset.openLesson; state.questionIndex = 0; state.selectedAnswer = null; state.feedback = null; state.view = 'lesson'; render(); window.scrollTo(0,0); return; }
  const answer = event.target.closest('[data-answer]');
  if (answer) { state.selectedAnswer = answer.dataset.answer; render(); return; }
  const boss = event.target.closest('[data-start-boss]');
  if (boss) {
    if (!navigator.onLine) { toast(t('assessmentOffline'), 'error'); return; }
    return openBoss(boss.dataset.startBoss);
  }
  const bossAnswer = event.target.closest('[data-boss-answer]');
  if (bossAnswer) { const [questionId, value] = bossAnswer.dataset.bossAnswer.split(':'); state.bossAnswers[questionId] = value; render(); return; }
  const buy = event.target.closest('[data-buy]');
  if (buy) {
    if (!navigator.onLine) { toast(t('purchaseOffline'), 'error'); return; }
    return showPurchaseConfirmation(buy.dataset.buy);
  }
  const close = event.target.closest('[data-close-modal]');
  if (close) return closeTopModal();
  const confirmBuy = event.target.closest('[data-confirm-buy]');
  if (confirmBuy) {
    confirmBuy.disabled = true;
    try { await api('/api/shop/purchase', { method: 'POST', body: JSON.stringify({ itemId: confirmBuy.dataset.confirmBuy, idempotencyKey: id() }) }); confirmBuy.closest('.modal-backdrop').remove(); await refresh(); toast(lang() === 'en' ? 'Added to your collection.' : 'اتضاف العنصر لمجموعتك.'); }
    catch (error) { toast(error.message, 'error'); confirmBuy.disabled = false; }
    return;
  }
  const equip = event.target.closest('[data-equip]');
  if (equip) {
    const [field, itemId] = equip.dataset.equip.split(':');
    try { await api('/api/profile', { method: 'PATCH', body: JSON.stringify({ [field]: itemId }) }); await refresh(); }
    catch (error) { toast(error.message, 'error'); }
    return;
  }
  const review = event.target.closest('[data-review-action]');
  if (review) {
    const [questionId, reviewAction] = review.dataset.reviewAction.split(':');
    review.disabled = true;
    try { await api(`/api/admin/questions/${questionId}/status`, { method: 'PATCH', body: JSON.stringify({ action: reviewAction }) }); await refresh(); }
    catch (error) { toast(error.message, 'error'); review.disabled = false; }
    return;
  }
  const language = event.target.closest('[data-language]');
  if (language) { try { await api('/api/profile', { method: 'PATCH', body: JSON.stringify({ language: language.dataset.language }) }); await refresh(); } catch (error) { toast(error.message, 'error'); } return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'submit-answer') return submitCurrentAnswer();
  if (action === 'retry-question') { state.selectedAnswer = null; state.feedback = null; render(); return; }
  if (action === 'next-question') {
    const lesson = currentLesson();
    delete state.retryOverrides[`${lesson.id}:${state.questionIndex}`];
    if (state.questionIndex < lesson.questions.length - 1) { state.questionIndex += 1; state.selectedAnswer = null; state.feedback = null; render(); }
    else {
      const justCompleted = state.data.progress.completedLessons.some((item) => item.lessonId === lesson.id);
      state.view = 'progress'; state.questionIndex = 0; state.selectedAnswer = null; state.feedback = null;
      if (justCompleted) state.celebrate = 'lesson';
      render();
      toast(lang() === 'en' ? 'Lesson completed—25 coins and 15 XP recorded once.' : 'اكتمل الدرس—اتسجلت 25 عملة و15 نقطة خبرة لمرة واحدة.');
    }
    return;
  }
  if (action === 'submit-boss') {
    try {
      state.boss.result = await api(`/api/boss/${state.boss.unitId}`, { method: 'POST', body: JSON.stringify({ idempotencyKey: id(), answers: Object.entries(state.bossAnswers).map(([questionId, answer]) => ({ questionId, answer })) }) });
      if (state.boss.result.score === 3) state.celebrate = 'boss';
      await refresh(false); render();
    }
    catch (error) { toast(error.message, 'error'); }
    return;
  }
  if (action === 'dismiss-celebration') { state.celebrate = null; render(); return; }
  if (action === 'tutor-toggle') { state.tutor.open = !state.tutor.open; render(); if (state.tutor.open) document.querySelector('#tutor-input')?.focus(); return; }
  if (action === 'logout') {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    sessionStorage.removeItem('lp-token'); state.token = null; state.data = null;
    state.offlineQueue = []; state.retryOverrides = {};
    try { localStorage.removeItem('lp-offline-queue'); } catch { /* private mode: nothing to clear */ }
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then((items) => items.forEach((item) => item.unregister()));
    renderLogin();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'numeric-answer') { state.selectedAnswer = event.target.value === '' ? null : event.target.value; const submit = document.querySelector('[data-action="submit-answer"]'); if (submit) submit.disabled = state.selectedAnswer === null; }
  if (event.target.matches('[data-boss-numeric]')) { if (event.target.value === '') delete state.bossAnswers[event.target.dataset.bossNumeric]; else state.bossAnswers[event.target.dataset.bossNumeric] = event.target.value; const submit = document.querySelector('[data-action="submit-boss"]'); if (submit) submit.disabled = Object.keys(state.bossAnswers).length < 3; }
});

document.addEventListener('submit', async (event) => {
  if (event.target.id === 'login-form') { event.preventDefault(); const form = new FormData(event.target); return login(form.get('email'), form.get('password')); }
  if (event.target.id === 'assignment-form') {
    event.preventDefault(); const form = new FormData(event.target);
    try { await api('/api/assignments', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) }); await refresh(); toast(lang() === 'en' ? 'Assignment created.' : 'تم إنشاء التكليف.'); }
    catch (error) { toast(error.message, 'error'); }
  }
  if (event.target.id === 'tutor-form') {
    event.preventDefault();
    const input = document.querySelector('#tutor-input');
    const text = input?.value.trim();
    if (!text || state.tutor.busy) return;
    const lesson = state.view === 'lesson' ? currentLesson() : null;
    const question = lesson ? activeQuestion(lesson) : null;
    state.tutor.messages.push({ role: 'user', text });
    state.tutor.busy = true;
    render();
    try {
      const result = await api('/api/tutor/ask', { method: 'POST', body: JSON.stringify({ message: text, lessonId: lesson?.id, questionId: question?.id }) });
      state.tutor.messages.push({ role: 'assistant', text: result.reply, unavailable: !result.aiGenerated });
    } catch (error) {
      state.tutor.messages.push({ role: 'assistant', text: error.message, unavailable: true });
    } finally {
      state.tutor.busy = false;
      render();
      document.querySelector('#tutor-input')?.focus();
    }
  }
});

window.addEventListener('offline', () => { const bar = document.createElement('div'); bar.className = 'offline-bar'; bar.id = 'offline-bar'; bar.textContent = lang() === 'en' ? 'Offline — practice answers will wait for a connection' : 'أنت بدون اتصال — إجابات التدريب هتستنى رجوع الاتصال'; document.body.append(bar); });
window.addEventListener('online', () => { document.querySelector('#offline-bar')?.remove(); toast(lang() === 'en' ? 'Connection restored.' : 'رجع الاتصال.'); syncOfflineQueue(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

applyReduceMotion();
bootstrap().then(() => { if (navigator.onLine) syncOfflineQueue(); });

// Shared utilities re-exported for public/chat.js (the AI Chat page lives in its own module rather
// than growing this file further — see docs/DECISIONS.md). Safe as a circular import: chat.js only
// ever uses these inside function bodies invoked later at runtime, never at its own module top level.
export { state, api, esc, t, lang, local, id, toast, render };
