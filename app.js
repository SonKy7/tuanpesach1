// CC1 x SonKy — Study Summary Web App + Integrated 23-Folder Google Drive Sheet Library

const App = {
  data: window.CC1_DATA || { groups: [], driveFolders: [] },
  state: {
    route: 'home',
    readTopics: {},
    bookmarkedTopics: {},
    expandedHomeGroups: {},
    quizAnswers: {},
    quizWrongHistory: {},
    quizFilter: 'all',
    quizShuffle: {},
    quizShuffleOn: true,
    quizHubTab: 'chapter',
    quizDiseaseSource: 'past', // 'past' | 'all' | 'chapter'
    quizDiseaseView: 'disease', // 'disease' | 'group'
    quizWrongGroupBy: 'disease', // 'disease' | 'source'
    quizWrongScope: 'active', // 'active' | 'history'
    quizExamMode: 'instant', // 'instant' | 'sim'
    quizTimerOn: false,
    quizTimerSec: 0,
    quizRandomSession: null,
    quizRetrySession: null,
    fontScale: 1,
    inPageFind: {
      isOpen: false,
      matches: [],
      activeIndex: -1
    }
  },


  // ================= OFF-CANVAS SLIDE DRAWER =================
  wrapResponsiveTables(root = document) {
    if (!root) return;
    try {
      const tables = root.querySelectorAll('table');
      tables.forEach(table => {
        const parent = table.parentElement;
        if (parent && !parent.classList.contains('table-responsive') && !parent.getAttribute('style')?.includes('overflow-x')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-responsive';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });
    } catch (e) {
      console.warn('wrapResponsiveTables:', e);
    }
  },

  openDrawer() {
    this.renderDrawer();
    document.getElementById('slideNavDrawer')?.classList.add('active');
    document.getElementById('drawerBackdrop')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeDrawer() {
    document.getElementById('slideNavDrawer')?.classList.remove('active');
    document.getElementById('drawerBackdrop')?.classList.remove('active');
    document.body.style.overflow = '';
  },

  renderDrawer() {
    const isQuick = !!this.state.quickMode;
    const currentId = this.state.currentTopicId || (this.getAllTopics()[0] ? this.getAllTopics()[0].id : 'htn');
    const drawerBody = document.getElementById('drawerBody');
    if (!drawerBody) return;

    drawerBody.innerHTML = `
      <!-- Main Navigation Items -->
      <div>
        <div style="display: flex; flex-direction: column; gap: 0.35rem;">
          <a href="#/" class="drawer-nav-item ${this.state.route === 'home' ? 'active' : ''}">หน้าแรก</a>
          <a href="#/summary?topic=${currentId}" class="drawer-nav-item ${!isQuick && this.state.route === 'summary' ? 'active' : ''}">เนื้อหา</a>
          <a href="#/quick-rx?topic=${currentId}" class="drawer-nav-item ${isQuick ? 'active' : ''}">สรุป</a>
          <a href="#/drive" class="drawer-nav-item ${this.state.route === 'drive' ? 'active' : ''}">Drive</a>
          <a href="#/cheatsheet" class="drawer-nav-item ${this.state.route === 'cheatsheet' ? 'active' : ''}">สรุปรวม</a>
          <a href="#/quiz" class="drawer-nav-item ${this.state.route === 'quiz' ? 'active' : ''}">📝 คลังข้อสอบ & สุ่มข้อสอบ</a>
          <a href="https://rx-practice-ple-cc1-2026.lushlarch17.chatgpt.site/" target="_blank" rel="noopener" class="drawer-nav-item" style="color: #059669; font-weight: 600;">ทำข้อสอบ CC1 ↗</a>
          <a href="https://jame0854117312-blip.github.io/cc2-app/" target="_blank" rel="noopener" class="drawer-nav-item" style="color: #7c3aed; font-weight: 600;">OSPE CC2 ↗</a>
        </div>
      </div>
    `;

    // Auto-close drawer on any link click
    drawerBody.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        this.closeDrawer();
      });
    });
  },

  init() {
    this.loadProgress();
    this.setupTheme();
    this.setupInPageFind();
    this.setupAbbrTooltip();

    // Drawer triggers (☰ FAB and Topbar)
    // floatingMenuBtn removed
    document.getElementById('topbarMenuBtn')?.addEventListener('click', () => this.openDrawer());
    document.getElementById('drawerCloseBtn')?.addEventListener('click', () => this.closeDrawer());
    document.getElementById('drawerBackdrop')?.addEventListener('click', () => this.closeDrawer());
    document.querySelector('.brand')?.addEventListener('click', (e) => {
      if (window.location.hash === '#/' || window.location.hash === '' || window.location.hash === '#') {
        e.preventDefault();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Close drawer on ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeDrawer();
    });

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const sidebarSearch = document.getElementById('sidebarFilterInput');
        if (sidebarSearch) {
          sidebarSearch.focus();
          sidebarSearch.select();
          return;
        }
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          window.location.hash = '#/';
          setTimeout(() => {
            const s = document.getElementById('globalSearchInput');
            if (s) { s.focus(); s.select(); }
          }, 150);
        }
      }
    });
    this.handleRoute();
  },

  loadProgress() {
    try {
      this.state.readTopics = JSON.parse(localStorage.getItem('cc1.readTopics') || '{}');
      this.state.bookmarkedTopics = JSON.parse(localStorage.getItem('cc1.bookmarkedTopics') || '{}');
      this.state.quizAnswers = JSON.parse(localStorage.getItem('cc1.quizAnswers') || '{}');
      this.state.quizWrongHistory = JSON.parse(localStorage.getItem('cc1.quizWrongHistory') || '{}');
      this.state.quizShuffle = JSON.parse(localStorage.getItem('cc1.quizShuffle') || '{}');
      const savedShufOn = localStorage.getItem('cc1.quizShuffleOn');
      if (savedShufOn !== null) this.state.quizShuffleOn = savedShufOn === 'true';
      const savedScale = parseFloat(localStorage.getItem('cc1.fontScale') || '1');
      if (savedScale >= 0.9 && savedScale <= 1.35) {
        this.state.fontScale = savedScale;
        document.documentElement.style.fontSize = `${savedScale * 100}%`;
      }
    } catch (e) {
      this.state.readTopics = {};
      this.state.bookmarkedTopics = {};
      this.state.quizAnswers = {};
      this.state.quizWrongHistory = {};
      this.state.quizShuffle = {};
    }
  },

  saveQuizAnswers() {
    try {
      localStorage.setItem('cc1.quizAnswers', JSON.stringify(this.state.quizAnswers || {}));
    } catch (e) {}
  },

  saveQuizWrongHistory() {
    try {
      localStorage.setItem('cc1.quizWrongHistory', JSON.stringify(this.state.quizWrongHistory || {}));
    } catch (e) {}
  },

  recordQuizAttempt(q, pickedIdx) {
    if (!q || !q.id || typeof pickedIdx !== 'number') return;
    if (!this.state.quizWrongHistory) this.state.quizWrongHistory = {};
    const ok = this.isQuizChoiceCorrect(q, pickedIdx);
    const prev = this.state.quizWrongHistory[q.id];
    if (!ok) {
      this.state.quizWrongHistory[q.id] = {
        wrongIdx: pickedIdx,
        lastPickedIdx: pickedIdx,
        count: (prev?.count || 0) + 1,
        resolved: false,
        updatedAt: Date.now()
      };
      this.saveQuizWrongHistory();
    } else if (prev) {
      this.state.quizWrongHistory[q.id] = {
        ...prev,
        lastPickedIdx: pickedIdx,
        resolved: true,
        updatedAt: Date.now()
      };
      this.saveQuizWrongHistory();
    }
  },

  saveQuizPrefs() {
    try {
      localStorage.setItem('cc1.quizShuffle', JSON.stringify(this.state.quizShuffle || {}));
      localStorage.setItem('cc1.quizShuffleOn', String(!!this.state.quizShuffleOn));
    } catch (e) {}
  },

  toggleRead(topicId) {
    if (this.state.readTopics[topicId]) {
      delete this.state.readTopics[topicId];
    } else {
      this.state.readTopics[topicId] = true;
    }
    localStorage.setItem('cc1.readTopics', JSON.stringify(this.state.readTopics));
    this.handleRoute();
  },

  toggleGroupRead(groupIdx) {
    const g = (this.data.groups || [])[groupIdx];
    if (!g || !g.topics || !g.topics.length) return;
    const allRead = g.topics.every(t => !!this.state.readTopics[t.id]);
    g.topics.forEach(t => {
      if (allRead) {
        delete this.state.readTopics[t.id];
      } else {
        this.state.readTopics[t.id] = true;
      }
    });
    localStorage.setItem('cc1.readTopics', JSON.stringify(this.state.readTopics));
    this.handleRoute();
  },

  toggleHomeGroup(groupIdx) {
    this.state.expandedHomeGroups[groupIdx] = !this.state.expandedHomeGroups[groupIdx];
    this.handleRoute();
  },

  formatDurationMin(min) {
    if (!min || min <= 0) return '';
    if (min >= 60) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
    }
    return `${min} นาที`;
  },

  toggleBookmark(topicId) {
    if (this.state.bookmarkedTopics[topicId]) {
      delete this.state.bookmarkedTopics[topicId];
    } else {
      this.state.bookmarkedTopics[topicId] = true;
    }
    localStorage.setItem('cc1.bookmarkedTopics', JSON.stringify(this.state.bookmarkedTopics));
    this.handleRoute();
  },

  setupTheme() {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    const syncState = (theme) => {
      btn.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
    };
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.dataset.theme === 'dark';
      const nextTheme = isDark ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('cc1.theme', nextTheme);
      syncState(nextTheme);
    });
    syncState(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  },

  
  getFirstLectureTopic() {
    const cvsGroup = (this.data.groups || []).find(g => g.group === 'cvs');
    if (cvsGroup && cvsGroup.topics && cvsGroup.topics[0]) {
      return cvsGroup.topics[0];
    }
    const all = this.getAllTopics();
    const nonPast = all.find(t => !t.id.startsWith('past-'));
    return nonPast || all[0] || { id: 'htn' };
  },

  getAllTopics() {
    const list = [];
    (this.data.groups || []).forEach((g, gIdx) => {
      (g.topics || []).forEach(t => {
        list.push({
          ...t,
          groupId: g.group,
          groupName: g.groupName,
          groupIndex: gIdx + 1,
          icon: g.icon || '📌'
        });
      });
    });
    return list;
  },

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  },


  renderQuickSummary(rawHtml) {
    if (!rawHtml) return '';
    try {
      let html = rawHtml;

      // 1. Transform subgroup headers
      html = html.replace(/<div\s+style="[^"]*border-left:[^"]*"[^>]*>\s*<b>([^<]+)<\/b>\s*<\/div>/gi, (m, text) => {
        return `<div class="rx-subgroup-banner"><b>${text}</b></div>`;
      });

      // 2. Wrap drug blocks into .drug-card if not already wrapped
      if (!html.includes('class="drug-card"')) {
        const drugPattern = /<p>\s*<b>(\d+\.|•|-|[ก-ฮ]\.)\s*([^<]+)<\/b>:?\s*<\/p>\s*<ul>([\s\S]*?)<\/ul>/gi;
        html = html.replace(drugPattern, (match, num, title, listContent) => {
          const fullTitle = `${num} ${title}`.trim().replace(/:$/, '');
          return `
            <div class="drug-card">
              <div class="drug-card-header">
                <span class="drug-title">${fullTitle}</span>
              </div>
              <ul>
                ${listContent}
              </ul>
            </div>
          `;
        });
      }

      // 3. Highlight 1st-line badges (bright emerald green)
      html = html.replace(/[\[\(]\s*(?:1st-line|First-line)[^\]\)]*[\]\)]/gi, (match) => {
        const clean = match.replace(/^[\[\(]\s*/, '').replace(/\s*[\]\)]$/, '').replace(/^[—\-:\s]+/, '');
        return `<span class="badge-1st-line">✓ ${clean}</span>`;
      });

      // 4. Highlight 2nd-line badges (slate gray)
      html = html.replace(/[\[\(]\s*(?:2nd-line|Second-line)[^\]\)]*[\]\)]/gi, (match) => {
        const clean = match.replace(/^[\[\(]\s*/, '').replace(/\s*[\]\)]$/, '').replace(/^[—\-:\s]+/, '');
        return `<span class="badge-2nd-line">${clean}</span>`;
      });

      return html;
    } catch (e) {
      console.error('Error in renderQuickSummary:', e);
      return rawHtml;
    }
  },

  renderDriveFilesWidget(driveFiles, isCompact = false) {
    if (!driveFiles || !driveFiles.length) return '';
    const isUnlocked = sessionStorage.getItem('cc1.drive_unlocked') === 'true';

    if (!isUnlocked) {
      return `
        <div class="card no-print" style="margin-top: 1.25rem; border: 1.5px solid var(--primary); background: var(--bg-surface-solid); text-align: center; padding: 1.75rem 1.25rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔒</div>
          <h3 style="margin-top: 0; margin-bottom: 0.35rem; font-size: 1.15rem; color: var(--text-primary); font-weight: 700;">
            เอกสารสไลด์ต้นฉบับประจำบท (${driveFiles.length} ไฟล์ PDF)
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.92rem; margin-bottom: 1.15rem;">
            ไฟล์สไลด์ PDF ถูกเข้ารหัสเพื่อความปลอดภัย กรุณากรอกรหัสผ่านเพื่อปลดล็อกเข้าดู
          </p>
          <form id="topicPdfUnlockForm" onsubmit="event.preventDefault();" style="display: flex; gap: 0.5rem; justify-content: center; align-items: center; max-width: 320px; margin: 0 auto; flex-wrap: wrap;">
            <input type="password" id="topicPdfPasswordInput" class="search-input" placeholder="ใส่รหัสผ่าน..." style="padding: 0.5rem 0.85rem; font-size: 1rem; text-align: center; width: 170px; letter-spacing: 0.15em;" autocomplete="off">
            <button type="submit" id="topicPdfSubmitBtn" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.92rem; font-weight: 700;">
              🔑 ปลดล็อก
            </button>
          </form>
          <div id="topicPdfPassError" style="color: var(--danger); font-size: 0.85rem; font-weight: 600; display: none; margin-top: 0.65rem;">
            ❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
          </div>
        </div>
      `;
    }

    return `
      <div class="card" style="margin-top: 1rem; margin-bottom: ${isCompact ? '0.5rem' : '1rem'}; background: var(--bg-primary); border: 1px solid var(--primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.65rem;">
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--primary); display: flex; align-items: center; gap: 0.4rem;">
            <span>📂</span>
            <span>เอกสารสไลด์ต้นฉบับประจำบท (${driveFiles.length} ไฟล์ PDF — ปลดล็อกแล้ว):</span>
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <a href="#/drive" class="btn btn-outline no-print" style="padding: 0.2rem 0.6rem; font-size: 0.82rem;">ดูคลังชีททั้ง 23 โฟลเดอร์ →</a>
            <button id="lockTopicPdfBtn" class="btn btn-secondary no-print" style="padding: 0.2rem 0.55rem; font-size: 0.78rem;" title="ล็อกการเข้าถึงไฟล์ชีท">🔒 ล็อก</button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${driveFiles.map(df => `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">
                  📄 <b>${this.escapeHtml(df.name)}</b> <span class="badge" style="font-size: 0.75rem; background: var(--bg-secondary);">${df.totalPages || 0} หน้า</span>
                </div>
                <a href="${df.url}" target="_blank" rel="noopener" class="btn btn-secondary no-print" style="font-size: 0.8rem; padding: 0.25rem 0.55rem;">
                  เปิด PDF บน Google Drive ↗
                </a>
              </div>
              
              ${df.rawText ? `
                <details style="margin-top: 0.4rem; background: var(--bg-secondary); border-radius: 6px; border: 1px solid var(--border-color); overflow: hidden;">
                  <summary style="cursor: pointer; padding: 0.5rem 0.75rem; font-weight: 600; font-size: 0.88rem; color: var(--primary); outline: none; user-select: none;">
                    🔍 คลิกเพื่อเปิดอ่านเนื้อหาถอดความจากสไลด์ทีละหน้าแบบ 100% (${df.totalPages || 0} หน้า — อ่านในเว็บได้ทันที ไม่ต้องเปิดไฟล์)
                  </summary>
                  <div style="padding: 0.85rem; max-height: 500px; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85rem; line-height: 1.65; white-space: pre-wrap; background: var(--bg-primary); border-top: 1px solid var(--border-color); color: var(--text-primary);">
${this.escapeHtml(df.rawText)}
                  </div>
                </details>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, query] = hash.split('?');
    const navLinks = document.querySelectorAll('.nav a[data-route]');
    navLinks.forEach(a => a.classList.remove('active'));

    const container = document.getElementById('app');
    if (this.clearQuizKeyHandler) this.clearQuizKeyHandler();

    if (path === '/' || path === '') {
      this.highlightNav('home');
      this.renderHome(container);
    } else if (path.startsWith('/quick-rx')) {
      this.highlightNav('quick-rx');
      const params = new URLSearchParams(query);
      this.state.quickMode = true;
      const defaultTopic = this.state.currentTopicId || this.getFirstLectureTopic().id;
      const targetTopic = params.get('topic') || defaultTopic;
      this.renderSummary(container, targetTopic);
    } else if (path.startsWith('/summary')) {
      this.state.quickMode = false;
      this.highlightNav('summary');
      const params = new URLSearchParams(query);
      const defaultTopic = this.state.currentTopicId || this.getFirstLectureTopic().id;
      const targetTopic = params.get('topic') || defaultTopic;
      this._pendingDeepLink = params.get('hl') || params.get('sec') || '';
      this.renderSummary(container, targetTopic);
    } else if (path.startsWith('/drive')) {
      this.highlightNav('drive');
      const params = new URLSearchParams(query);
      this.renderDriveLibrary(container, params.get('folder'));
    } else if (path.startsWith('/cheatsheet')) {
      this.highlightNav('cheatsheet');
      this.renderCheatSheet(container);
    } else if (path.startsWith('/quiz')) {
      this.highlightNav('quiz');
      const params = new URLSearchParams(query);
      const chapterId = params.get('chapter');
      const subParam = params.get('sub') || '';
      const groupId = params.get('group');
      const diseaseId = params.get('disease');
      const srcParam = params.get('src') || 'all';
      const yrParam = params.get('yr') || '';
      const yearId = params.get('year');
      const dayParam = params.get('day') || 'all';
      const isRandom = params.get('random') === '1';
      const isRetryWrong = params.get('retrywrong') === '1';
      const tabParam = params.get('tab');
      if (tabParam && ['chapter', 'disease', 'year', 'wrong', 'random'].includes(tabParam)) {
        this.state.quizHubTab = tabParam;
      }
      const orderParam = params.get('order');
      if (orderParam === 'orig') { this.state.quizShuffleOn = false; this.saveQuizPrefs(); }
      else if (orderParam === 'shuffle') { this.state.quizShuffleOn = true; this.saveQuizPrefs(); }
      const qNo = parseInt(params.get('q') || '0', 10);
      const qIdParam = params.get('qid') || '';
      if (isRetryWrong) {
        this.renderRetryWrongRunner(container, qNo);
      } else if (isRandom) {
        this.renderRandomQuizRunner(container, qNo);
      } else if (groupId) {
        this.renderGroupQuizRunner(container, groupId, srcParam, yrParam, qNo, qIdParam);
      } else if (diseaseId) {
        this.renderDiseaseQuizRunner(container, diseaseId, srcParam, yrParam, qNo, qIdParam);
      } else if (yearId) {
        this.renderPastExamRunner(container, yearId, dayParam, qNo, qIdParam);
      } else if (chapterId) {
        this.renderQuizRunner(container, chapterId, qNo, subParam, qIdParam);
      } else {
        this.renderQuizHub(container);
      }
    } else {
      this.highlightNav('home');
      this.renderHome(container);
    }
    this.wrapResponsiveTables(container);
    if (this.state.inPageFind && this.state.inPageFind.isOpen) {
      const findInput = document.getElementById('inPageFindInput');
      if (findInput && findInput.value.trim()) {
        this.runInPageFind(findInput.value, false);
      } else {
        this.clearInPageFindHighlights();
      }
    }
  },

  highlightNav(route) {
    this.state.route = route;
    this.renderDrawer();
    const target = document.querySelector(`.nav a[data-route="${route}"]`);
    if (target) target.classList.add('active');

    const curId = this.state.currentTopicId || this.getFirstLectureTopic().id;
    const summaryNav = document.querySelector('.nav a[data-route="summary"]');
    const quickNav = document.querySelector('.nav a[data-route="quick-rx"]');
    if (summaryNav) summaryNav.setAttribute('href', `#/summary?topic=${curId}`);
    if (quickNav) quickNav.setAttribute('href', `#/quick-rx?topic=${curId}`);
  },

  // ================= VIEW: HOME (BLUEPRINT DIRECTORY & INLINE FULL SUMMARY) =================
  renderHome(c) {
    const allTopics = this.getAllTopics();
    const readCount = allTopics.filter(t => this.state.readTopics[t.id]).length;
    const bookmarkedList = allTopics.filter(t => this.state.bookmarkedTopics[t.id]);
    const percentRead = allTopics.length ? Math.round((readCount / allTopics.length) * 100) : 0;
    const totalDriveFolders = (this.data.driveFolders || []).length;
    const totalDriveFiles = (this.data.driveFolders || []).reduce((acc, f) => acc + (f.files ? f.files.length : 0), 0);
    const firstTopic = this.getFirstLectureTopic();

    c.innerHTML = `
      <!-- Overview Top Bar (Mockup Style) -->
      <div class="overview-top-bar">
        <div class="overview-title-group">
          <h2 class="overview-heading">ภาพรวมระบบ (Overview)</h2>
          <span class="overview-pill-badge">
            <span class="ping-dot" style="width:7px; height:7px; border-radius:50%; background:#16a34a;"></span>
            <span>เกณฑ์ ศสภ. ที่ 5/2566 · ฉบับอัปเดตล่าสุด</span>
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <a href="#/quiz" class="btn btn-secondary" style="border-radius: 9999px; padding: 0.45rem 1rem; font-size: 0.88rem; font-weight: 700;">
            📝 คลังข้อสอบ (${(window.CC1_QUIZ_DATA?.totalQuestions || 765) + (window.CC1_PAST_EXAM_DATA?.totalQuestions || 0)} ข้อ)
          </a>
          <a href="#/drive" class="btn btn-secondary" style="border-radius: 9999px; padding: 0.45rem 1rem; font-size: 0.88rem;">
            📁 คลังชีท Drive (${totalDriveFolders})
          </a>
          <a href="#/quick-rx?topic=${firstTopic.id}" class="btn-lime-pill" style="font-size: 0.88rem;">
            ⚡ สรุปด่วน QuickRx
          </a>
          <a href="#/summary?topic=${firstTopic.id}" class="btn-dark-pill" style="font-size: 0.88rem;">
            + เริ่มอ่านบทเรียน
          </a>
        </div>
      </div>

      <!-- Hero Dark Banner (Image 1 & 4 Style) -->
      <div class="hero-banner-dark">
        <div class="hero-lime-tag">
          <span class="ping-dot"></span>
          <span>ระบบพร้อมสอบ 100% สรุปครบ ${this.data.groups.length} หมวด ${allTopics.length} หัวข้อ ${totalDriveFiles} สไลด์</span>
        </div>
        <h1>CC1 x SonKy — ระบบเตรียมสอบใบประกอบวิชาชีพเภสัชกรรม</h1>
        <p>
          คลังสรุปเนื้อหาเข้มข้นตรงตามเกณฑ์มาตรฐาน ศสภ. ครบทั้ง 16 กลุ่มโรค เภสัชภัณฑ์ เภสัชเคมี (SAR) การควบคุมคุณภาพ สมุนไพร กฎหมายวิชาชีพ และเล่มเขียว OSPE CC2 แยกอ่านเป็นบทเดี่ยวพร้อมตาราง QuickRx ยาแม่บทและภาพประกอบ
        </p>
        <div class="hero-dark-watermark"><img src="logo-mark.png" alt="" class="hero-watermark-img"></div>
      </div>

      <!-- Metrics Strip (4 Clean White Cards as in Mockup) -->
      <div class="metric-strip-modern">
        <div class="metric-card-modern">
          <div class="metric-left-col">
            <span class="metric-label-clean">หมวดวิชาทั้งหมด</span>
            <span class="metric-val-clean">${this.data.groups.length}</span>
            <span class="metric-sub-clean" style="color: #d97706;">✓ มาตรฐาน ศสภ. + เล่มเขียว</span>
          </div>
          <div class="metric-badge-icon icon-amber">📚</div>
        </div>

        <div class="metric-card-modern">
          <div class="metric-left-col">
            <span class="metric-label-clean">บทสรุปเจาะลึกในระบบ</span>
            <span class="metric-val-clean">${allTopics.length}</span>
            <span class="metric-sub-clean" style="color: #2563eb;">✓ ครบ 22 หมวด + เล่มเขียว 8 บท</span>
          </div>
          <div class="metric-badge-icon icon-blue">📖</div>
        </div>

        <div class="metric-card-modern">
          <div class="metric-left-col">
            <span class="metric-label-clean">สไลด์ PDF ต้นฉบับ</span>
            <span class="metric-val-clean">${totalDriveFiles}</span>
            <span class="metric-sub-clean" style="color: #16a34a;">📁 Drive 23 โฟลเดอร์</span>
          </div>
          <div class="metric-badge-icon icon-green">📄</div>
        </div>

        <div class="metric-card-modern">
          <div class="metric-left-col">
            <span class="metric-label-clean">ความคืบหน้าการอ่าน</span>
            <span class="metric-val-clean">${percentRead}%</span>
            <span class="metric-sub-clean" style="color: #4d7c0f;">● อ่านแล้ว ${readCount}/${allTopics.length} บท</span>
          </div>
          <div class="metric-badge-icon icon-lime">🎯</div>
        </div>
      </div>

      <!-- Spotlight Search Bar Full Pill -->
      <div class="search-wrapper-pill">
        <span class="search-icon-pill">🔍</span>
        <input type="search" id="globalSearchInput" class="search-input-pill" placeholder="ค้นหาได้ทั้งสรุปและสไลด์ PDF 119 ไฟล์ (เช่น allopurinol, GINA, ข.ย.11, HLB, ICER, ยาเบญจกูล, lithium, SAR)..." autocomplete="off">
      </div>
      <div id="searchResultsBox" style="margin-top: -1rem; margin-bottom: 1.5rem;"></div>

      <!-- Dashboard Two Column Content -->
      <div class="dashboard-grid-cols">
        <!-- Left: Chapter Progress List -->
        <div class="card" style="padding: 1.75rem 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0; color: var(--text-primary);">
              ความคืบหน้าการจัดตารางอ่านรายหมวด
            </h3>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${this.data.groups.length} หมวดวิชา</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.45rem;">
            ${this.data.groups.map((g, gi) => {
              const gTopics = g.topics || [];
              const gRead = gTopics.filter(t => this.state.readTopics[t.id]).length;
              const gPercent = gTopics.length ? Math.round((gRead / gTopics.length) * 100) : 0;
              const allRead = gTopics.length > 0 && gRead === gTopics.length;
              const partialRead = gRead > 0 && !allRead;
              const isExpanded = !!this.state.expandedHomeGroups[gi];
              const totalGroupMin = gTopics.reduce((acc, t) => acc + (t.videoDurationMin || 0), 0);
              const groupDurLabel = totalGroupMin ? ` · ⏱ ${this.formatDurationMin(totalGroupMin)}` : '';
              return `
                <div class="dashboard-chapter-card">
                  <div class="dashboard-chapter-row" data-toggle-group="${gi}" title="คลิกเพื่อดูหัวข้อย่อยใน ${g.groupName}">
                    <div style="display: flex; align-items: center; gap: 0.55rem; min-width: 0; flex: 1;">
                      <button type="button" class="chapter-check-btn ${allRead ? 'checked' : (partialRead ? 'partial' : '')}" data-check-group="${gi}" title="${allRead ? 'ยกเลิกติ๊กทั้งหมวด' : 'ติ๊กทั้งหมวดว่าอ่านแล้ว'}" aria-label="ติ๊กทั้งหมวด ${g.groupName}">
                        ${allRead ? '✓' : (partialRead ? '–' : '')}
                      </button>
                      <span style="font-size: 1.2rem; flex-shrink: 0;">${g.icon}</span>
                      <div style="min-width: 0; flex: 1;">
                        <div style="font-weight: 600; font-size: 0.92rem; line-height: 1.3; word-break: break-word;">
                          ${g.groupName}
                        </div>
                        <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.1rem;">
                          ${gTopics.length} บทเรียน (${gRead}/${gTopics.length} จบแล้ว)${groupDurLabel}
                        </div>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
                      <div class="chapter-progress-bar-bg">
                        <div class="chapter-progress-bar-fill" style="width: ${gPercent}%;"></div>
                      </div>
                      <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); min-width: 32px; text-align: right;">${gPercent}%</span>
                      <button type="button" class="chapter-expand-btn ${isExpanded ? 'expanded' : ''}" data-expand-group="${gi}" aria-expanded="${isExpanded}" aria-label="แสดงรายการเลกเชอร์ใน ${g.groupName}">▾</button>
                    </div>
                  </div>
                  ${isExpanded ? `
                    <div class="chapter-lecture-list">
                      ${gTopics.map(t => {
                        const tRead = !!this.state.readTopics[t.id];
                        const durText = t.videoDurationMin ? this.formatDurationMin(t.videoDurationMin) : '';
                        const multiVids = Array.isArray(t.videos) && t.videos.length > 1 ? t.videos : null;
                        return `
                          <div class="chapter-lecture-item" style="${multiVids ? 'flex-wrap: wrap;' : ''}">
                            <div class="chapter-lecture-left">
                              <button type="button" class="lecture-check-btn ${tRead ? 'checked' : ''}" data-check-topic="${t.id}" title="${tRead ? 'ยกเลิกติ๊กอ่านแล้ว' : 'ติ๊กอ่านแล้ว'}" aria-label="ติ๊ก ${t.title}">
                                ${tRead ? '✓' : ''}
                              </button>
                              <a href="#/summary?topic=${t.id}" class="lecture-item-link ${tRead ? 'is-read' : ''}">${t.title}</a>
                            </div>
                            ${durText ? `<span class="lecture-duration-badge" title="ความยาวคลิปวิดีโอเลกเชอร์">⏱ ${durText}${multiVids ? ` (${multiVids.length} คลิป)` : ''}</span>` : ''}
                            ${multiVids ? `
                              <div style="width: 100%; padding-left: 1.9rem; margin-top: 0.3rem; display: flex; flex-wrap: wrap; gap: 0.35rem;">
                                ${multiVids.map(v => `<span style="font-size: 0.74rem; padding: 0.12rem 0.48rem; border-radius: 999px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary);">🎬 ${this.escapeHtml(v.title.replace(/^Social\s*-\s*/i, ''))} · <b>${this.formatDurationMin(v.durationMin)}</b></span>`).join('')}
                              </div>
                            ` : ''}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Quiz Bank & Companion Apps -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="card" style="padding: 1.55rem 1.75rem; border-color: var(--border-hover);">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.55rem;">
              <h3 style="font-size: 1.12rem; font-weight: 800; margin: 0; color: var(--text-primary);">
                📝 คลังข้อสอบ & สุ่มข้อสอบ PLE-CC1
              </h3>
              <span class="qz-stat-pill" style="font-size: 0.78rem; padding: 0.22rem 0.62rem;">
                ${(window.CC1_QUIZ_DATA?.totalQuestions || 765) + (window.CC1_PAST_EXAM_DATA?.totalQuestions || 0)} ข้อ
              </span>
            </div>
            <p style="font-size: 0.86rem; color: var(--text-secondary); margin: 0 0 0.9rem 0; line-height: 1.5;">
              ครบทั้งข้อสอบแยก 20 บท, ข้อสอบย้อนหลังปี 2556–2567 (13 ชุด) และโหมดสุ่มข้อสอบตามปี/บท พร้อมคำอธิบายเชื่อมไปยังเนื้อหาบทเรียน
            </p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <a href="#/quiz" class="btn-dark-pill" style="flex: 1 1 130px; justify-content: center; font-size: 0.88rem;">
                เข้าคลังข้อสอบ
              </a>
              <a href="#/quiz?tab=random" class="btn-lime-pill" style="flex: 1 1 120px; justify-content: center; font-size: 0.88rem;">
                🎲 สุ่มข้อสอบ
              </a>
            </div>
          </div>
          <!-- Companion Apps Card -->
          <div class="card" style="padding: 1.75rem 2rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.65rem; color: var(--text-primary);">
              🔗 แหล่งเรียนรู้เตรียมสอบคู่เคียง
            </h3>
            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              <a href="https://rx-practice-ple-cc1-2026.lushlarch17.chatgpt.site/" target="_blank" rel="noopener" class="btn btn-secondary" style="border-radius: var(--radius-lg); text-align: left; justify-content: flex-start; padding: 0.75rem 1rem;">
                <span style="font-size: 1.25rem;">📝</span>
                <div>
                  <div style="font-weight: 700; font-size: 0.92rem;">เว็บฝึกข้อสอบ PLE-CC1 ↗</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">คลังโจทย์เสมือนจริง จับเวลาและเฉลยละเอียด</div>
                </div>
              </a>
              <a href="https://jame0854117312-blip.github.io/cc2-app/" target="_blank" rel="noopener" class="btn btn-secondary" style="border-radius: var(--radius-lg); text-align: left; justify-content: flex-start; padding: 0.75rem 1rem;">
                <span style="font-size: 1.25rem;">🧪</span>
                <div>
                  <div style="font-weight: 700; font-size: 0.92rem;">CC2 OSPE Lab ↗</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">ห้องฝึกทักษะปฏิบัติการ OSPE เภสัชกรรม</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach chapter check, dropdown expand, and lecture check listeners
    c.querySelectorAll('[data-check-group]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleGroupRead(parseInt(btn.getAttribute('data-check-group'), 10));
      });
    });
    c.querySelectorAll('[data-toggle-group]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('[data-check-group]')) return;
        this.toggleHomeGroup(parseInt(row.getAttribute('data-toggle-group'), 10));
      });
    });
    c.querySelectorAll('[data-check-topic]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleRead(btn.getAttribute('data-check-topic'));
      });
    });

    // Reattach search listeners
    const searchInput = document.getElementById('globalSearchInput');
    const resultsBox = document.getElementById('searchResultsBox');
    if (searchInput && resultsBox) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          resultsBox.innerHTML = '';
          return;
        }

        const hits = [];
        allTopics.forEach(t => {
          const matchTitle = ((t.title || '') + ' ' + (t.titleTh || '')).toLowerCase().includes(query);
          const matchHighYield = (t.highYield || []).some(y => {
            const yText = typeof y === 'string' ? y : ((y && ((y.title || '') + ' ' + (y.text || ''))) || '');
            return yText.toLowerCase().includes(query);
          });
          const matchCheat = t.cheatSheet ? JSON.stringify(t.cheatSheet).toLowerCase().includes(query) : false;
          const matchSection = (t.sections || []).some(s => ((s.heading || s.title || '').toLowerCase().includes(query)) || (s.html || '').toLowerCase().includes(query));
          const matchSummary = (t.quickSummaryHtml || '').toLowerCase().includes(query);
          const matchQuickRx = (t.quickRx && typeof t.quickRx === 'object' ? ((t.quickRx.title || '') + ' ' + (t.quickRx.html || '')).toLowerCase().includes(query) : false);
          if (matchTitle || matchHighYield || matchCheat || matchSection || matchSummary || matchQuickRx) {
            hits.push(t);
          }
        });

        if (hits.length === 0) {
          resultsBox.innerHTML = `<div class="card" style="padding: 1rem; text-align: center; color: var(--text-muted); border-radius: var(--radius-2xl);">🔍 ไม่พบบทเรียนที่ตรงกับคำค้น "${e.target.value}"</div>`;
          return;
        }

        resultsBox.innerHTML = `
          <div class="card" style="padding: 1rem 1.25rem; border-radius: var(--radius-2xl); border-color: var(--border-hover);">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">
              ผลการค้นหา (${hits.length} หัวข้อ):
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.45rem; max-height: 380px; overflow-y: auto;">
              ${hits.slice(0, 10).map(h => `
                <a href="#/summary?topic=${h.id}" class="dashboard-chapter-row" style="margin-bottom:0; padding:0.6rem 0.85rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>${h.icon}</span>
                    <span style="font-weight: 600; font-size: 0.92rem;">${h.title}</span>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">(${h.groupName})</span>
                  </div>
                  <span style="font-size: 0.85rem; color: var(--text-muted);">›</span>
                </a>
              `).join('')}
            </div>
          </div>
        `;
      });
    }
  },

  // ================= VIEW: SUMMARY READER =================
  renderSummary(c, activeTopicId) {
    const allTopics = this.getAllTopics();
    const defaultTopicObj = this.getFirstLectureTopic();
    let currentIndex = allTopics.findIndex(t => t.id === activeTopicId);
    if (currentIndex === -1) {
      currentIndex = allTopics.findIndex(t => t.id === defaultTopicObj.id);
      if (currentIndex === -1) currentIndex = 0;
    }
    const currentTopic = allTopics[currentIndex] || defaultTopicObj;

    if (!currentTopic) {
      c.innerHTML = `<div class="card"><p>ไม่พบเนื้อหาสรุป</p></div>`;
      return;
    }

    this.state.currentTopicId = currentTopic.id;
    const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
    const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;
    const isRead = !!this.state.readTopics[currentTopic.id];
    const isBookmarked = !!this.state.bookmarkedTopics[currentTopic.id];

    const existingLayout = c.querySelector('.summary-layout');
    const existingSidebar = document.getElementById('summarySidebar');
    const getArticleElement = () => c.querySelector('.topic-content');

    const renderArticleHtml = () => `
      <!-- Mobile Topic Drawer Toggle Button -->
      <button id="mobileSidebarToggleBtn" class="mobile-sidebar-toggle-btn no-print" type="button" aria-label="เปิดสารบัญบทเรียน">
        <span style="display: flex; align-items: center; gap: 0.45rem;">
          <span>📚</span>
          <span>สารบัญบทเรียน: ${currentTopic.icon} ${currentTopic.groupName}</span>
        </span>
        <span id="mobileSidebarArrow" style="font-size: 1.15rem; transition: transform 0.2s;">▾</span>
      </button>

      <div class="card" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span class="badge badge-blue" style="font-size: 0.85rem;">${currentTopic.icon} ${currentTopic.groupName}</span>
              ${currentTopic.videoDurationMin ? `<span class="lecture-duration-badge" style="font-size: 0.82rem;">⏱ เวลาเรียนรวม ${this.formatDurationMin(currentTopic.videoDurationMin)}${Array.isArray(currentTopic.videos) && currentTopic.videos.length > 1 ? ` (${currentTopic.videos.length} คลิป)` : ''}</span>` : ''}
            </div>
            <h1 style="font-size: 1.85rem; font-weight: 700; margin: 0.35rem 0 0.15rem 0;">
              ${currentTopic.title}
            </h1>
            ${currentTopic.titleTh && currentTopic.titleTh !== currentTopic.title ? `<div style="color: var(--text-secondary); font-size: 1.05rem; font-weight: 500;">${currentTopic.titleTh}</div>` : ''}
            ${Array.isArray(currentTopic.videos) && currentTopic.videos.length > 1 ? `
              <div style="margin-top: 0.55rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
                ${currentTopic.videos.map(v => `<span style="font-size: 0.78rem; padding: 0.2rem 0.55rem; border-radius: 999px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary);">🎬 ${this.escapeHtml(v.title)} · <b>${this.formatDurationMin(v.durationMin)}</b></span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="no-print" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="toggleBookmarkBtn" class="btn btn-secondary" style="padding: 0.45rem 0.85rem; font-size: 0.9rem;">
              ${isBookmarked ? '⭐ ปักหมุดแล้ว' : '☆ ปักหมุดทบทวน'}
            </button>
            <button id="toggleReadBtn" class="btn ${isRead ? 'btn-primary' : 'btn-outline'}" style="padding: 0.45rem 0.85rem; font-size: 0.9rem;">
              ${isRead ? '✅ อ่านจบแล้ว' : '☑️ ทำเครื่องหมายว่าอ่านจบ'}
            </button>
          </div>
        </div>
      </div>

      <!-- Detailed Sections / Quick Mode Filter -->
      ${this.state.quickMode ? (
        currentTopic.quickSummaryHtml ? `
          <section class="card" style="margin-bottom: 1rem; border-top: 4px solid var(--accent); padding: 1.5rem 1.75rem;">
            <div style="line-height: 1.8; font-size: 1.05rem;">
              ${this.renderQuickSummary(currentTopic.quickSummaryHtml)}
            </div>
          </section>
          ${currentTopic.quickRx && currentTopic.quickRx.html ? `
            <section class="card" style="margin-bottom: 1rem; padding: 1.5rem 1.75rem;">
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--accent);">
                ${currentTopic.quickRx.title || '⚡ ตารางยาแม่บท & จุดจำเน้นสอบ (QuickRx Cards)'}
              </h2>
              ${currentTopic.quickRx.html}
            </section>
          ` : ''}
        ` : `
          <section class="card" style="margin-bottom: 1rem; padding: 1.5rem;">
            <div class="callout callout-info" style="margin-bottom: 1rem;">
              <b>⚡ สรุปย่อ CC1:</b> กำลังเตรียมเนื้อหาสรุปย่อแม่บทสำหรับหัวข้อนี้ (ดูเนื้อหาเต็มได้ที่แถบ สรุปเนื้อหาเต็ม)
            </div>
            ${currentTopic.sections.filter(s => {
              const h = s.heading || '';
              return !h.includes('สรุปคำสอนสด') && (h.includes('Quick Rx') || h.includes('ตารางยา') || h.includes('สรุปย่อ') || h.includes('จุดเน้น'));
            }).map(s => `
              <div style="line-height: 1.75; font-size: 1.05rem; margin-bottom: 1.25rem;">
                ${s.html}
              </div>
            `).join('')}
          </section>
        `
      ) : (
        currentTopic.sections.filter(s => {
          const h = s.heading || s.title || '';
          return !h.includes('สรุปคำสอนสด') && !h.includes('Quick Rx');
        }).map((s, idx) => {
          const h = s.heading || s.title || '';
          return `
          <section class="card" style="margin-bottom: 1rem;">
            <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.45rem;">
              ${/^\d+\./.test(h.trim()) ? h : `${idx + 1}. ${h}`}
            </h2>
            <div style="line-height: 1.75; font-size: 1.05rem;">
              ${s.html}
            </div>
          </section>
        `;
        }).join('')
      )}


      ${currentTopic.refs && currentTopic.refs.length > 0 ? `
        <div class="card" style="background: var(--bg-primary); font-size: 0.9rem; color: var(--text-secondary);">
          <b>📚 แนวทางเวชปฏิบัติและเอกสารอ้างอิง:</b>
          <ul style="margin-top: 0.3rem; padding-left: 1.3rem;">
            ${currentTopic.refs.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Prev / Next Topic Footer Navigation -->
      <div class="card no-print" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <div>
          ${prevTopic ? `
            <a href="#/${this.state.quickMode ? 'quick-rx' : 'summary'}?topic=${prevTopic.id}" class="btn btn-secondary">
              ⬅️ ก่อนหน้า: ${prevTopic.title}
            </a>
          ` : `<span></span>`}
        </div>
        <button id="bottomMarkReadBtn" class="btn ${isRead ? 'btn-secondary' : 'btn-primary'}">
          ${isRead ? '✅ อ่านจบหัวข้อนี้แล้ว' : '✅ บันทึกว่าอ่านจบหัวข้อนี้'}
        </button>
        <div>
          ${nextTopic ? `
            <a href="#/${this.state.quickMode ? 'quick-rx' : 'summary'}?topic=${nextTopic.id}" class="btn btn-primary">
              ถัดไป: ${nextTopic.title} ➡️
            </a>
          ` : `<a href="#/" class="btn btn-primary">🏠 กลับหน้าสารบัญ</a>`}
        </div>
      </div>
    `;

    const attachArticleEvents = () => {
      document.getElementById('toggleReadBtn')?.addEventListener('click', () => this.toggleRead(currentTopic.id));
      // Mobile drawer toggle & close
      const mobileToggle = document.getElementById('mobileSidebarToggleBtn');
      const mobileClose = document.getElementById('mobileSidebarCloseBtn');
      const sb = document.getElementById('summarySidebar');
      const arrow = document.getElementById('mobileSidebarArrow');

      if (mobileToggle && sb) {
        mobileToggle.addEventListener('click', () => {
          sb.classList.toggle('mobile-expanded');
          if (arrow) arrow.textContent = sb.classList.contains('mobile-expanded') ? '▴' : '▾';
          if (sb.classList.contains('mobile-expanded')) {
            sb.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
      if (mobileClose && sb) {
        mobileClose.addEventListener('click', () => {
          sb.classList.remove('mobile-expanded');
          if (arrow) arrow.textContent = '▾';
        });
      }

      document.getElementById('bottomMarkReadBtn')?.addEventListener('click', () => {
        this.toggleRead(currentTopic.id);
        if (!isRead && nextTopic) {
          window.location.hash = `#/${this.state.quickMode ? 'quick-rx' : 'summary'}?topic=${nextTopic.id}`;
        }
      });
      document.getElementById('toggleBookmarkBtn')?.addEventListener('click', () => this.toggleBookmark(currentTopic.id));
      // Topic PDF password unlock & lock listeners
      const topicPdfForm = document.getElementById('topicPdfUnlockForm');
      const topicPdfInput = document.getElementById('topicPdfPasswordInput');
      const topicPdfErr = document.getElementById('topicPdfPassError');

      topicPdfForm?.addEventListener('submit', () => {
        if (topicPdfInput && topicPdfInput.value.trim() === '12345') {
          sessionStorage.setItem('cc1.drive_unlocked', 'true');
          const artEl = getArticleElement();
          if (artEl) {
            artEl.innerHTML = renderArticleHtml();
            this.wrapResponsiveTables(c);
    this.enhanceAbbreviations(c);
    attachArticleEvents();
          }
        } else {
          if (topicPdfErr) topicPdfErr.style.display = 'block';
          if (topicPdfInput) {
            topicPdfInput.value = '';
            topicPdfInput.focus();
          }
        }
      });

      document.getElementById('lockTopicPdfBtn')?.addEventListener('click', () => {
        sessionStorage.removeItem('cc1.drive_unlocked');
        const artEl = getArticleElement();
        if (artEl) {
          artEl.innerHTML = renderArticleHtml();
          this.wrapResponsiveTables(c);
    this.enhanceAbbreviations(c);
    attachArticleEvents();
        }
      });
    };

    const currentArtEl = getArticleElement();
    if (existingLayout && existingSidebar && currentArtEl) {
      // In-place update: sidebar preserves its exact scroll position, main article updates and jumps smoothly to top
      const prevScrollTop = existingSidebar.scrollTop;
      currentArtEl.innerHTML = renderArticleHtml();
      this.wrapResponsiveTables(c);
    this.enhanceAbbreviations(c);
    attachArticleEvents();

      const targetModePrefix = this.state.quickMode ? 'quick-rx' : 'summary';
      existingSidebar.querySelectorAll('.sidebar-topic-link').forEach(a => {
        const tid = a.getAttribute('data-topic-id');
        if (tid) {
          a.setAttribute('href', `#/${targetModePrefix}?topic=${tid}`);
        }
        const isTarget = tid === currentTopic.id;
        a.setAttribute('data-active', isTarget ? 'true' : 'false');
        if (isTarget) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });
      existingSidebar.querySelectorAll('.sidebar-group > a').forEach(a => {
        const tid = a.getAttribute('data-first-topic');
        if (tid) {
          a.setAttribute('href', `#/${targetModePrefix}?topic=${tid}`);
        }
      });
      const activeLink = existingSidebar.querySelector(`.sidebar-topic-link[data-topic-id="${currentTopic.id}"]`);
      if (activeLink) {
        activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      if (window.innerWidth <= 900) {
        const mobileSb = document.getElementById('summarySidebar');
        if (mobileSb) mobileSb.classList.remove('mobile-expanded');
        const arrow = document.getElementById('mobileSidebarArrow');
        if (arrow) arrow.textContent = '▾';
      }

      existingSidebar.scrollTop = prevScrollTop;
      if (this._pendingDeepLink) {
        this.focusSummaryDeepLink(c, this._pendingDeepLink);
        this._pendingDeepLink = '';
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    c.innerHTML = `
      <div class="summary-layout">
        <!-- Sidebar Navigation grouped by Official Blueprint -->
        <aside id="summarySidebar" class="card no-print sidebar-sticky-panel">
          <!-- Pinned Header: ALWAYS VISIBLE -->
          <div class="sidebar-pinned-header">
            <!-- Mobile Close Bar -->
            <div class="mobile-sidebar-close-row no-print" style="margin-bottom: 0.5rem; padding-bottom: 0.35rem; border-bottom: 1px solid var(--border-color);">
              <span style="font-weight: 700; color: var(--primary); font-size: 0.92rem;">📖 สารบัญ ${this.data.groups.length} หมวด ${allTopics.length} บท</span>
              <button id="mobileSidebarCloseBtn" type="button" class="btn btn-secondary" style="padding: 0.2rem 0.55rem; font-size: 0.8rem; font-weight: 600;">✕ ปิด</button>
            </div>
            <div class="sidebar-search-container">
              <span class="sidebar-search-icon">🔍</span>
              <input type="search" id="sidebarFilterInput" class="sidebar-search-input" placeholder="ค้นหา / กรองหัวข้อ (${allTopics.length} บท)..." autocomplete="off">
              <button id="sidebarSearchClearBtn" type="button" class="sidebar-search-clear" title="ล้างการค้นหา" style="display: none;">✕</button>
            </div>
          </div>

          <!-- Scrollable Topic List -->
          <div id="sidebarTopicList" class="sidebar-scrollable-list">
            ${this.data.groups.map((g, gIdx) => `
              <div class="sidebar-group">
                <a href="#/${this.state.quickMode ? 'quick-rx' : 'summary'}?topic=${g.topics[0] ? g.topics[0].id : ''}" data-first-topic="${g.topics[0] ? g.topics[0].id : ''}" style="text-decoration: none; display: block;" title="ไปยังบทแรกของหมวดนี้">
                  <div class="sidebar-group-title" style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; padding: 0.2rem 0.3rem; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;">
                    ${g.icon} ${g.groupName}
                  </div>
                </a>
                <div class="sidebar-group-topics" style="display: flex; flex-direction: column; gap: 0.2rem;">
                  ${g.topics.map(t => {
                    const active = t.id === currentTopic.id;
                    const read = !!this.state.readTopics[t.id];
                    const bmk = !!this.state.bookmarkedTopics[t.id];
                    return `
                      <a href="#/${this.state.quickMode ? 'quick-rx' : 'summary'}?topic=${t.id}" class="sidebar-topic-link ${active ? 'active' : ''}" data-topic-id="${t.id}" data-active="${active ? 'true' : 'false'}" data-title="${(t.title + ' ' + (t.titleTh || '')).toLowerCase()}">
                        <span>${t.title}</span>
                        <span style="font-size: 0.8rem; margin-left: 0.35rem; flex-shrink: 0;">${bmk ? '⭐' : ''}${read ? '✅' : ''}</span>
                      </a>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
            <div id="sidebarNoMatch" style="display: none; padding: 1.25rem 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
              🔍 ไม่พบหัวข้อที่ตรงกับคำค้น
            </div>
          </div>
        </aside>

        <!-- Main Study Article -->
        <article class="topic-content">
          ${renderArticleHtml()}
        </article>
      </div>
    `;

    this.wrapResponsiveTables(c);
    this.enhanceAbbreviations(c);
    attachArticleEvents();
    if (this._pendingDeepLink) {
      this.focusSummaryDeepLink(c, this._pendingDeepLink);
      this._pendingDeepLink = '';
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const activeLink = document.querySelector(`.sidebar-topic-link[href="#/summary?topic=${currentTopic.id}"]`);
    if (activeLink) {
      activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    document.getElementById('toggleReadBtn')?.addEventListener('click', () => this.toggleRead(currentTopic.id));
    document.getElementById('bottomMarkReadBtn')?.addEventListener('click', () => {
      this.toggleRead(currentTopic.id);
      if (!isRead && nextTopic) {
        window.location.hash = `#/${this.state.quickMode ? 'quick-rx' : 'summary'}?topic=${nextTopic.id}`;
      }
    });
    document.getElementById('toggleBookmarkBtn')?.addEventListener('click', () => this.toggleBookmark(currentTopic.id));

    const filterInput = document.getElementById('sidebarFilterInput');
    const clearBtn = document.getElementById('sidebarSearchClearBtn');
    const noMatchEl = document.getElementById('sidebarNoMatch');

    const updateFilter = () => {
      const q = (filterInput?.value || '').trim().toLowerCase();
      const isFiltering = q.length > 0;
      if (clearBtn) clearBtn.style.display = isFiltering ? 'block' : 'none';
      let totalVisible = 0;

      document.querySelectorAll('.sidebar-group').forEach(grp => {
        const titleEl = grp.querySelector('.sidebar-group-title');
        let groupMatches = 0;

        grp.querySelectorAll('.sidebar-topic-link').forEach(a => {
          const match = !isFiltering || (a.dataset.title || '').includes(q);
          a.style.display = match ? 'flex' : 'none';
          if (match) {
            groupMatches++;
            totalVisible++;
          }
        });

        if (isFiltering) {
          if (titleEl) titleEl.style.display = 'none';
          grp.style.display = groupMatches > 0 ? 'block' : 'none';
        } else {
          if (titleEl) titleEl.style.display = 'block';
          grp.style.display = 'block';
        }
      });

      if (noMatchEl) {
        noMatchEl.style.display = (isFiltering && totalVisible === 0) ? 'block' : 'none';
      }
    };

    filterInput?.addEventListener('input', updateFilter);
    filterInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        filterInput.value = '';
        updateFilter();
      }
    });
    clearBtn?.addEventListener('click', () => {
      if (filterInput) {
        filterInput.value = '';
        filterInput.focus();
        updateFilter();
      }
    });
  },

  // ================= VIEW: 23-FOLDER GOOGLE DRIVE LIBRARY =================
  renderDriveLibrary(c, activeFolderId) {
    const isUnlocked = sessionStorage.getItem('cc1.drive_unlocked') === 'true';
    
    // Naturally sort folders: Chapter 1..16 first, then remaining folders alphabetically
    const parseChapterNum = (name) => {
      const m = (name || '').match(/chapter\s*(\d+)/i);
      return m ? parseInt(m[1], 10) : 9999;
    };
    const folders = [...(this.data.driveFolders || [])].sort((a, b) => {
      const na = parseChapterNum(a.name);
      const nb = parseChapterNum(b.name);
      if (na !== nb) return na - nb;
      return (a.name || '').localeCompare(b.name || '', 'th');
    });

    const totalFiles = folders.reduce((acc, f) => acc + (f.files ? f.files.length : 0), 0);

    if (!isUnlocked) {
      c.innerHTML = `
        <div style="max-width: 440px; margin: 3.5rem auto; text-align: center;">
          <div class="card" style="padding: 2.5rem 1.75rem; border: 1.5px solid var(--border-glow); box-shadow: var(--shadow-lg);">
            <div style="font-size: 3.2rem; margin-bottom: 0.75rem;">🔒</div>
            <h2 style="font-family: var(--font-display); font-size: 1.45rem; font-weight: 800; margin-bottom: 0.4rem;">
              คลังชีท Google Drive
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">
              กรุณากรอกรหัสผ่านเพื่อเข้าดูคลังชีทต้นฉบับ 23 โฟลเดอร์ (${totalFiles} ไฟล์ PDF)
            </p>
            <form id="driveUnlockForm" onsubmit="event.preventDefault();" style="display: flex; flex-direction: column; gap: 0.85rem;">
              <input type="password" id="drivePasswordInput" class="search-input" placeholder="ใส่รหัสผ่าน..." style="text-align: center; font-size: 1.25rem; letter-spacing: 0.25em; padding: 0.75rem 1rem;" autocomplete="off" autofocus>
              <div id="drivePassError" style="color: var(--danger); font-size: 0.88rem; font-weight: 600; display: none;">
                ❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
              </div>
              <button type="submit" id="submitUnlockBtn" class="btn btn-primary" style="padding: 0.75rem; font-size: 1rem; font-weight: 700;">
                🔑 ปลดล็อกเข้าดูคลังชีท
              </button>
            </form>
          </div>
        </div>
      `;
      const form = document.getElementById('driveUnlockForm');
      const input = document.getElementById('drivePasswordInput');
      const err = document.getElementById('drivePassError');
      form?.addEventListener('submit', () => {
        if (input.value.trim() === '12345') {
          sessionStorage.setItem('cc1.drive_unlocked', 'true');
          this.renderDriveLibrary(c, activeFolderId);
        } else {
          err.style.display = 'block';
          input.value = '';
          input.focus();
        }
      });
      return;
    }

    c.innerHTML = `
      <div class="card" style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="badge badge-blue">Google Drive Sync • 23 โฟลเดอร์</span>
          <h1 style="font-family: var(--font-display); font-size: 1.65rem; font-weight: 800; margin-top: 0.35rem;">
            📂 คลังชีทเรียน Google Drive (${totalFiles} ไฟล์ PDF)
          </h1>
        </div>
        <button id="lockDriveBtn" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.4rem 0.85rem;">
          🔒 ล็อกคลังชีท
        </button>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <input type="search" id="driveSearchInput" class="search-input" placeholder="🔎 ค้นหาชื่อโฟลเดอร์หรือชื่อไฟล์ PDF..." autocomplete="off">
      </div>

      <div id="driveFoldersContainer" style="display: flex; flex-direction: column; gap: 1rem;">
        ${folders.map((folder, fIdx) => `
          <div class="card drive-folder-card" data-search="${this.escapeHtml((folder.name + ' ' + folder.files.map(x => x.name).join(' ')).toLowerCase())}" style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.6rem;">
              <h2 style="font-size: 1.2rem; font-weight: 700; color: var(--primary);">
                📁 ${fIdx + 1}. ${this.escapeHtml(folder.name)} <small style="font-weight: 500; color: var(--text-secondary); font-size: 0.85rem;">(${folder.files.length} ไฟล์)</small>
              </h2>
              <a href="${folder.url}" target="_blank" rel="noopener" class="btn btn-outline" style="padding: 0.3rem 0.75rem; font-size: 0.85rem;">
                เปิดโฟลเดอร์ใน Drive ↗
              </a>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.5rem;">
              ${folder.files.map(df => `
                <a href="${df.url}" target="_blank" rel="noopener" class="btn btn-secondary" style="justify-content: space-between; padding: 0.5rem 0.8rem; font-size: 0.88rem; text-align: left;">
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;" title="${this.escapeHtml(df.name)}">
                    📄 ${this.escapeHtml(df.name)}
                  </span>
                  <small style="color: var(--text-muted); flex-shrink: 0;">${df.totalPages || 0} หน้า ↗</small>
                </a>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('lockDriveBtn')?.addEventListener('click', () => {
      sessionStorage.removeItem('cc1.drive_unlocked');
      this.renderDriveLibrary(c, activeFolderId);
    });

    const searchInput = document.getElementById('driveSearchInput');
    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      document.querySelectorAll('.drive-folder-card').forEach(card => {
        const match = !q || (card.dataset.search || '').includes(q);
        card.style.display = match ? 'block' : 'none';
      });
    });
  },

  // ================= VIEW: ALL HIGH-YIELD CHEAT SHEET =================
  renderCheatSheet(c) {
    const groups = this.data.groups || [];
    const totalTopics = groups.reduce((acc, g) => acc + (g.topics || []).length, 0);
    const kindIcons = {
      criteria: '🎯',
      mechanism: '⚙️',
      signature: '💊',
      trap: '⚠️'
    };

    const shortPillLabel = (g) => {
      const m = (g.groupName || '').match(/^Chapter\s+\d+\s+([^(]+)/i);
      if (m) return `${g.icon} ${m[1].trim()}`;
      const map = {
        herbal: 'สมุนไพร',
        medchem: 'MedChem',
        pharmaceutics: 'เภสัชกรรม',
        qc: 'QC',
        pk: 'PK/PD',
        social: 'กฎหมาย/สังคม',
        green_book: 'เล่มเขียว'
      };
      return `${g.icon} ${map[g.group] || (g.groupName || '').split('(')[0].trim()}`;
    };

    const stripHtmlText = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const buildTopicSearchText = (g, t) => {
      const parts = [g.groupName, g.group, t.title, t.titleTh];
      if (t.cheatSheet) {
        parts.push(stripHtmlText(t.cheatSheet.tagline));
        (t.cheatSheet.blocks || []).forEach(b => {
          parts.push(stripHtmlText(b.label));
          (b.items || []).forEach(it => parts.push(stripHtmlText(it)));
        });
        if (t.cheatSheet.compareTable) {
          parts.push(stripHtmlText(t.cheatSheet.compareTable.title));
          (t.cheatSheet.compareTable.headers || []).forEach(h => parts.push(stripHtmlText(h)));
          (t.cheatSheet.compareTable.rows || []).forEach(r => r.forEach(cell => parts.push(stripHtmlText(cell))));
        }
      } else {
        (t.highYield || []).forEach(y => {
          parts.push(typeof y === 'string' ? stripHtmlText(y) : ((y && ((y.title || '') + ' ' + (y.text || ''))) || ''));
        });
      }
      return parts.filter(Boolean).join(' ').toLowerCase();
    };

    const renderTopicBody = (t) => {
      const cs = t.cheatSheet;
      if (!cs) {
        return `
          <ul class="cs-block-list">
            ${(t.highYield || []).map(hy => {
              const txt = typeof hy === 'string' ? hy : `<b>${hy.title || ''}</b> ${hy.text || ''}`;
              return `<li>${txt}</li>`;
            }).join('')}
          </ul>
        `;
      }
      const blocksHtml = (cs.blocks || []).map(b => {
        const kind = kindIcons[b.kind] ? b.kind : 'criteria';
        const rawLabel = b.label || '';
        const hasLeadingIcon = /^(?:🎯|⚙️|💊|⚠️|★)/.test(rawLabel.trim());
        return `
          <div class="cs-block cs-kind-${kind}">
            <div class="cs-block-label">${hasLeadingIcon ? rawLabel : `${kindIcons[kind]} ${rawLabel}`}</div>
            <ul class="cs-block-list">
              ${(b.items || []).map(it => `<li>${it}</li>`).join('')}
            </ul>
          </div>
        `;
      }).join('');

      const ct = cs.compareTable;
      const tableHtml = ct && (ct.rows || []).length ? `
        <div class="cs-compare-wrap table-responsive">
          ${ct.title ? `<div class="cs-compare-title">${ct.title}</div>` : ''}
          <table class="cs-compare-table">
            <thead>
              <tr>${(ct.headers || []).map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${(ct.rows || []).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : '';

      return `
        ${cs.tagline ? `<div class="cs-tagline">${cs.tagline}</div>` : ''}
        <div class="cs-blocks-grid">${blocksHtml}</div>
        ${tableHtml}
      `;
    };

    c.innerHTML = `
      <div class="card cs-toolbar">
        <div class="cs-toolbar-top">
          <div>
            <h1 class="cs-toolbar-title">⚡ สรุปรวมจุดเด่น &amp; เกณฑ์ตัดสินสอบสภา</h1>
            <p class="cs-toolbar-sub">คัดเฉพาะเกณฑ์วินิจฉัย · คะแนน/การแบ่งระดับ · กลุ่มยา (ตัวอย่าง) &amp; กลไกลูกศร (→) · จุดต่างรายตัว และกับดักสอบ (${groups.length} หมวด · ${totalTopics} บท)</p>
          </div>
          <div class="cs-toolbar-actions no-print">
            <button type="button" class="cs-action-btn" id="csExpandAllBtn">กางทั้งหมด</button>
            <button type="button" class="cs-action-btn" id="csCollapseAllBtn">ย่อทั้งหมด</button>
            <button type="button" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.84rem;" onclick="window.print()">🖨️ พิมพ์สรุป</button>
          </div>
        </div>

        <div class="cs-filter-row no-print">
          <div class="cs-search-wrap">
            <input type="search" id="csFilterInput" class="cs-search-input" placeholder="🔍 ค้นหาชื่อยา, เกณฑ์คะแนน, กลไก, SAR, Cutoff (เช่น CHA2DS2, Tetrazole, GOLD, CrCl)..." autocomplete="off">
          </div>
          <span class="cs-match-badge" id="csMatchBadge">แสดง ${totalTopics} / ${totalTopics} บท</span>
        </div>

        <div class="cs-pill-strip no-print" id="csPillStrip">
          <button type="button" class="cs-group-pill active" data-cs-group="all">ทั้งหมด (${groups.length})</button>
          ${groups.map((g, gi) => `
            <button type="button" class="cs-group-pill" data-cs-group="${g.group}">${shortPillLabel(g)} (${(g.topics || []).length})</button>
          `).join('')}
        </div>
      </div>

      <div id="csEmptyState" class="card" style="display: none; text-align: center; padding: 1.5rem; color: var(--text-muted);">
        ไม่พบหัวข้อที่ตรงกับคำค้นหรือหมวดที่เลือก
      </div>

      <div id="csGroupsContainer">
        ${groups.map(g => {
          const gTopics = g.topics || [];
          return `
            <section class="card cs-group-card" data-cs-group="${g.group}">
              <button type="button" class="cs-group-header" aria-expanded="true">
                <h2 class="cs-group-title">
                  <span>${g.icon}</span>
                  <span>${g.groupName}</span>
                </h2>
                <span class="cs-group-meta">
                  <span class="cs-group-count">${gTopics.length} บท</span>
                  <span class="cs-chevron no-print">▾</span>
                </span>
              </button>
              <div class="cs-group-body">
                ${gTopics.map(t => `
                  <article class="cs-topic-card" data-search="${this.escapeHtml(buildTopicSearchText(g, t))}">
                    <div class="cs-topic-head">
                      <h3 class="cs-topic-title">${t.title}</h3>
                      <div class="cs-topic-links no-print">
                        <a href="#/quick-rx?topic=${t.id}" class="cs-mini-link">QuickRx</a>
                        <a href="#/summary?topic=${t.id}" class="cs-mini-link">เนื้อหาเต็ม</a>
                      </div>
                    </div>
                    ${renderTopicBody(t)}
                  </article>
                `).join('')}
              </div>
            </section>
          `;
        }).join('')}
      </div>
    `;

    // Wire interactive filter, group pills, and accordions
    const filterInput = document.getElementById('csFilterInput');
    const pillStrip = document.getElementById('csPillStrip');
    const matchBadge = document.getElementById('csMatchBadge');
    const emptyState = document.getElementById('csEmptyState');
    const groupCards = Array.from(c.querySelectorAll('.cs-group-card'));
    let activeGroup = 'all';

    const applyFilter = () => {
      const q = (filterInput?.value || '').trim().toLowerCase();
      let visibleTopics = 0;

      groupCards.forEach(gc => {
        const gKey = gc.getAttribute('data-cs-group');
        const groupMatch = activeGroup === 'all' || gKey === activeGroup;
        const topicCards = Array.from(gc.querySelectorAll('.cs-topic-card'));
        let groupVisible = 0;

        topicCards.forEach(tc => {
          const hay = tc.getAttribute('data-search') || '';
          const match = groupMatch && (!q || hay.includes(q));
          tc.classList.toggle('cs-hidden', !match);
          if (match) {
            groupVisible++;
            visibleTopics++;
          }
        });

        gc.classList.toggle('cs-hidden', groupVisible === 0);
        const countEl = gc.querySelector('.cs-group-count');
        if (countEl) {
          countEl.textContent = q ? `${groupVisible}/${topicCards.length} บท` : `${topicCards.length} บท`;
        }
        // Auto-expand matched groups when actively searching or filtering single group
        if ((q || activeGroup !== 'all') && groupVisible > 0) {
          const hdr = gc.querySelector('.cs-group-header');
          const body = gc.querySelector('.cs-group-body');
          const chev = gc.querySelector('.cs-chevron');
          if (hdr) hdr.setAttribute('aria-expanded', 'true');
          if (body) body.classList.remove('cs-collapsed');
          if (chev) chev.textContent = '▾';
        }
      });

      if (matchBadge) matchBadge.textContent = `แสดง ${visibleTopics} / ${totalTopics} บท`;
      if (emptyState) emptyState.style.display = visibleTopics === 0 ? 'block' : 'none';
    };

    pillStrip?.addEventListener('click', (e) => {
      const btn = e.target.closest('.cs-group-pill');
      if (!btn) return;
      activeGroup = btn.getAttribute('data-cs-group') || 'all';
      pillStrip.querySelectorAll('.cs-group-pill').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      applyFilter();
    });

    filterInput?.addEventListener('input', applyFilter);

    groupCards.forEach(gc => {
      const hdr = gc.querySelector('.cs-group-header');
      const body = gc.querySelector('.cs-group-body');
      const chev = gc.querySelector('.cs-chevron');
      hdr?.addEventListener('click', () => {
        const expanded = hdr.getAttribute('aria-expanded') === 'true';
        hdr.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        body?.classList.toggle('cs-collapsed', expanded);
        if (chev) chev.textContent = expanded ? '▸' : '▾';
      });
    });

    const setAllExpanded = (expand) => {
      groupCards.forEach(gc => {
        const hdr = gc.querySelector('.cs-group-header');
        const body = gc.querySelector('.cs-group-body');
        const chev = gc.querySelector('.cs-chevron');
        if (hdr) hdr.setAttribute('aria-expanded', expand ? 'true' : 'false');
        if (body) body.classList.toggle('cs-collapsed', !expand);
        if (chev) chev.textContent = expand ? '▾' : '▸';
      });
    };

    document.getElementById('csExpandAllBtn')?.addEventListener('click', () => setAllExpanded(true));
    document.getElementById('csCollapseAllBtn')?.addEventListener('click', () => setAllExpanded(false));

    this.enhanceAbbreviations(c);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ================= IN-PAGE FIND (CTRL+F / MOBILE FIND BAR) =================
  setupInPageFind() {
    const toggleBtn = document.getElementById('findToggleBtn');
    const bar = document.getElementById('inPageFindBar');
    const input = document.getElementById('inPageFindInput');
    const prevBtn = document.getElementById('inPageFindPrev');
    const nextBtn = document.getElementById('inPageFindNext');
    const closeBtn = document.getElementById('inPageFindClose');
    if (!toggleBtn || !bar || !input) return;

    toggleBtn.addEventListener('click', () => this.toggleInPageFind());
    closeBtn?.addEventListener('click', () => this.closeInPageFind());
    prevBtn?.addEventListener('click', () => this.stepInPageFind(-1));
    nextBtn?.addEventListener('click', () => this.stepInPageFind(1));

    let debounceTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.runInPageFind(input.value, true), 90);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.state.inPageFind.matches.length === 0 && input.value.trim()) {
          this.runInPageFind(input.value, true);
        } else {
          this.stepInPageFind(e.shiftKey ? -1 : 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeInPageFind();
      }
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.openInPageFind();
      } else if (e.key === 'Escape' && this.state.inPageFind.isOpen) {
        this.closeInPageFind();
      }
    });
  },

  toggleInPageFind() {
    if (this.state.inPageFind.isOpen) {
      this.closeInPageFind();
    } else {
      this.openInPageFind();
    }
  },

  positionInPageFindBar() {
    const bar = document.getElementById('inPageFindBar');
    const topbar = document.querySelector('.topbar');
    if (!bar || !topbar) return;
    const rect = topbar.getBoundingClientRect();
    bar.style.top = `${Math.max(8, Math.round(rect.bottom + 8))}px`;
  },

  openInPageFind() {
    const bar = document.getElementById('inPageFindBar');
    const input = document.getElementById('inPageFindInput');
    const toggleBtn = document.getElementById('findToggleBtn');
    if (!bar || !input) return;

    this.state.inPageFind.isOpen = true;
    this.positionInPageFindBar();
    bar.hidden = false;
    toggleBtn?.setAttribute('aria-expanded', 'true');
    input.focus();
    input.select();

    if (input.value.trim()) {
      this.runInPageFind(input.value, false);
    } else {
      this.updateInPageFindUI();
    }
  },

  closeInPageFind() {
    const bar = document.getElementById('inPageFindBar');
    const toggleBtn = document.getElementById('findToggleBtn');
    if (!bar) return;

    this.state.inPageFind.isOpen = false;
    bar.hidden = true;
    toggleBtn?.setAttribute('aria-expanded', 'false');
    this.clearInPageFindHighlights();
  },

  clearInPageFindHighlights() {
    const appEl = document.getElementById('app');
    if (appEl) {
      const marks = appEl.querySelectorAll('mark.inpage-find-hit');
      const parentsToNormalize = new Set();
      marks.forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        parentsToNormalize.add(parent);
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      });
      parentsToNormalize.forEach(p => p.normalize());
    }
    this.state.inPageFind.matches = [];
    this.state.inPageFind.activeIndex = -1;
    this.updateInPageFindUI();
  },

  runInPageFind(rawQuery, shouldScroll = true) {
    this.clearInPageFindHighlights();
    const query = (rawQuery || '').trim();
    if (!query) return;

    const appEl = document.getElementById('app');
    if (!appEl) return;

    const qLower = query.toLowerCase();
    const qLen = query.length;
    const textNodes = [];

    const walker = document.createTreeWalker(appEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest('svg, script, style, noscript, input, textarea, select, [hidden], mark.inpage-find-hit')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let current;
    while ((current = walker.nextNode())) {
      textNodes.push(current);
    }

    const matches = [];
    textNodes.forEach(node => {
      const text = node.nodeValue;
      const lower = text.toLowerCase();
      let idx = lower.indexOf(qLower, 0);
      if (idx === -1) return;

      const frag = document.createDocumentFragment();
      let lastPos = 0;
      while (idx !== -1) {
        if (idx > lastPos) {
          frag.appendChild(document.createTextNode(text.slice(lastPos, idx)));
        }
        const mark = document.createElement('mark');
        mark.className = 'inpage-find-hit';
        mark.textContent = text.slice(idx, idx + qLen);
        frag.appendChild(mark);
        matches.push(mark);
        lastPos = idx + qLen;
        idx = lower.indexOf(qLower, lastPos);
      }
      if (lastPos < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastPos)));
      }
      node.parentNode?.replaceChild(frag, node);
    });

    this.state.inPageFind.matches = matches;
    this.state.inPageFind.activeIndex = matches.length ? 0 : -1;
    if (matches.length) {
      this.scrollToInPageMatch(0, shouldScroll);
    } else {
      this.updateInPageFindUI();
    }
  },

  stepInPageFind(delta) {
    const { matches, activeIndex } = this.state.inPageFind;
    if (!matches.length) return;
    const nextIdx = (activeIndex + delta + matches.length) % matches.length;
    this.scrollToInPageMatch(nextIdx, true);
  },

  scrollToInPageMatch(index, shouldScroll = true) {
    const { matches } = this.state.inPageFind;
    if (!matches.length || index < 0 || index >= matches.length) return;

    matches.forEach(m => m.classList.remove('is-active'));
    const target = matches[index];
    target.classList.add('is-active');
    this.state.inPageFind.activeIndex = index;

    if (shouldScroll) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
    this.updateInPageFindUI();
  },

  updateInPageFindUI() {
    const countEl = document.getElementById('inPageFindCount');
    const prevBtn = document.getElementById('inPageFindPrev');
    const nextBtn = document.getElementById('inPageFindNext');
    const input = document.getElementById('inPageFindInput');
    if (!countEl) return;

    const { matches, activeIndex } = this.state.inPageFind;
    const hasQuery = !!(input && input.value.trim());
    const total = matches.length;
    const current = total > 0 && activeIndex >= 0 ? activeIndex + 1 : 0;

    countEl.textContent = `${current} / ${total}`;
    countEl.classList.toggle('is-empty', hasQuery && total === 0);
    if (prevBtn) prevBtn.disabled = total === 0;
    if (nextBtn) nextBtn.disabled = total === 0;
  },

  focusSummaryDeepLink(c, queryStr) {
    if (!c || !queryStr) return;
    const raw = String(queryStr).trim().toLowerCase();
    const cards = Array.from(c.querySelectorAll('.topic-content section.card'));
    let target = cards.find(sec => {
      const h = (sec.querySelector('h2')?.textContent || '').toLowerCase();
      return h && (h.includes(raw) || raw.includes(h.replace(/^\d+\.\s*/, '')));
    });
    if (!target) {
      const words = raw.split(/\s+/).filter(w => w.length >= 3).slice(0, 4);
      if (words.length) {
        let bestScore = 0;
        cards.forEach(sec => {
          const txt = (sec.textContent || '').toLowerCase();
          const sc = words.reduce((a, w) => a + (txt.includes(w) ? 1 : 0), 0);
          if (sc > bestScore) { bestScore = sc; target = sec; }
        });
      }
    }
    if (target) {
      target.classList.add('cc1-deeplink-focus');
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      setTimeout(() => target.classList.remove('cc1-deeplink-focus'), 3200);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  clearQuizTimer() {
    if (this._quizTimerInterval) {
      clearInterval(this._quizTimerInterval);
      this._quizTimerInterval = null;
    }
  },

  clearQuizKeyHandler() {
    if (this._quizKeyHandler) {
      window.removeEventListener('keydown', this._quizKeyHandler);
      this._quizKeyHandler = null;
    }
    this.clearQuizTimer();
  },

  getQuestionCorrectIndices(q) {
    if (!q) return [];
    if (Array.isArray(q.answerIndices)) return q.answerIndices;
    if (typeof q.answerIdx === 'number' && q.answerIdx >= 0) return [q.answerIdx];
    return [];
  },

  isQuizChoiceCorrect(q, pickedIdx) {
    if (q?.answerSource === 'no_answer') return true; // never fail unanswerable book items
    const valid = this.getQuestionCorrectIndices(q);
    return valid.includes(pickedIdx);
  },

  getQuizSetStats(questions, answersMap = null) {
    const qs = questions || [];
    const ans = answersMap || this.state.quizAnswers || {};
    let done = 0;
    let correct = 0;
    let wrong = 0;
    qs.forEach(q => {
      const picked = ans[q.id];
      if (typeof picked === 'number') {
        done++;
        if (this.isQuizChoiceCorrect(q, picked)) correct++;
        else wrong++;
      }
    });
    return { total: qs.length, done, correct, wrong };
  },

  getChapterQuizStats(ch) {
    return this.getQuizSetStats(ch?.questions || []);
  },

  qzIcon(name, size = 16) {
    const p = {
      search: '<circle cx="11" cy="11" r="7.5"/><line x1="20.5" y1="20.5" x2="16.2" y2="16.2"/>',
      shuffle: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
      list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
      chevLeft: '<polyline points="15 18 9 12 15 6"/>',
      chevRight: '<polyline points="9 18 15 12 9 6"/>',
      clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
      check: '<polyline points="20 6 9 17 4 12"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
      reset: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    }[name] || '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  },

  qzRingHtml(done, total, size = 44) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    const stroke = size >= 52 ? 4.5 : 3.8;
    const r = (size - stroke * 2) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - pct / 100);
    return `
      <div class="qz-ring-box" style="width:${size}px;height:${size}px;" title="ทำแล้ว ${done}/${total} ข้อ (${pct}%)">
        <svg class="qz-ring-svg" width="${size}" height="${size}">
          <circle class="qz-ring-track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"/>
          <circle class="qz-ring-fill" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
        </svg>
        <span class="qz-ring-pct ${size >= 52 ? 'is-lg' : ''}">${pct}%</span>
      </div>
    `;
  },

  isClinicalTopicGroup(groupId) {
    return [
      'cvs', 'infection', 'psychiatry', 'immunology', 'renal', 'gi',
      'bone_joint', 'gynecology', 'neurology', 'oncology', 'endocrine',
      'pulmonary', 'hematology', 'dermatology', 'eent'
    ].includes(groupId || '');
  },

  getTaggedDecks(sourceFilter = 'past') {
    const chData = window.CC1_QUIZ_DATA || { chapters: [] };
    const peData = window.CC1_PAST_EXAM_DATA || { chapters: [] };
    const disMap = new Map();
    const grpMap = new Map();

    const registerQ = (q, meta) => {
      const tag = q.topicTag || (q.dataRef && q.dataRef.topicId ? {
        id: q.dataRef.topicId,
        title: q.dataRef.topicTitle || q.dataRef.topicId,
        groupId: q.dataRef.groupId || '',
        groupName: q.dataRef.groupName || ''
      } : null);
      if (!tag || !tag.id) return;
      const gId = tag.groupId || tag.groupName || 'other';
      const gTitle = tag.groupName || gId;
      const isClin = this.isClinicalTopicGroup(gId);
      const qCopy = {
        ...q,
        _sourceLabel: meta.label,
        _sourceType: meta.type,
        _sourceYear: meta.year || '',
        _sortKey: meta.sortKey
      };

      if (!disMap.has(tag.id)) {
        disMap.set(tag.id, {
          id: tag.id,
          title: tag.title || tag.id,
          groupId: gId,
          groupName: gTitle,
          isClinical: isClin,
          questions: [],
          pastCount: 0,
          chapterCount: 0,
          yearCounts: {},
          years: []
        });
      }
      const dEntry = disMap.get(tag.id);
      dEntry.questions.push(qCopy);
      if (meta.type === 'past') {
        dEntry.pastCount++;
        if (meta.year) dEntry.yearCounts[meta.year] = (dEntry.yearCounts[meta.year] || 0) + 1;
      } else {
        dEntry.chapterCount++;
      }

      if (!grpMap.has(gId)) {
        grpMap.set(gId, {
          id: gId,
          title: gTitle,
          isClinical: isClin,
          questions: [],
          pastCount: 0,
          chapterCount: 0,
          yearCounts: {},
          years: [],
          diseaseIds: new Set(),
          diseases: []
        });
      }
      const gEntry = grpMap.get(gId);
      gEntry.questions.push(qCopy);
      gEntry.diseaseIds.add(tag.id);
      if (meta.type === 'past') {
        gEntry.pastCount++;
        if (meta.year) gEntry.yearCounts[meta.year] = (gEntry.yearCounts[meta.year] || 0) + 1;
      } else {
        gEntry.chapterCount++;
      }
    };

    if (sourceFilter !== 'chapter') {
      (peData.chapters || []).forEach(yr => {
        const yNum = parseInt(yr.year, 10) || 0;
        (yr.questions || []).forEach(q => {
          const dNum = q.day === 'day2' ? 2 : 1;
          const sortKey = yNum * 100000 + dNum * 10000 + (parseInt(q.origNo, 10) || 0);
          registerQ(q, {
            type: 'past',
            year: String(yr.year || ''),
            label: `${yr.title} · ${q.day === 'day2' ? 'วันที่สอง' : 'วันแรก'} ข้อ ${q.origNo}`,
            sortKey
          });
        });
      });
    }

    if (sourceFilter !== 'past') {
      (chData.chapters || []).forEach(ch => {
        const chNum = parseInt(ch.chapterNum, 10) || 0;
        (ch.questions || []).forEach(q => {
          registerQ(q, {
            type: 'chapter',
            year: '',
            label: `บท ${ch.chapterNum}. ${ch.title}`,
            sortKey: 90000000 + chNum * 1000 + (parseInt(q.origNo, 10) || 0)
          });
        });
      });
    }

    const finalize = (item) => {
      item.questions.sort((a, b) => (a._sortKey || 0) - (b._sortKey || 0));
      item.years = Object.keys(item.yearCounts).sort();
      return item;
    };

    const diseases = Array.from(disMap.values()).map(finalize)
      .sort((a, b) => b.questions.length - a.questions.length);

    const groups = Array.from(grpMap.values()).map(g => {
      finalize(g);
      g.diseases = Array.from(g.diseaseIds)
        .map(did => disMap.get(did))
        .filter(Boolean)
        .sort((a, b) => b.questions.length - a.questions.length);
      return g;
    }).sort((a, b) => {
      if (a.isClinical !== b.isClinical) return a.isClinical ? -1 : 1;
      return b.questions.length - a.questions.length;
    });

    return { diseases, groups };
  },

  getDiseaseDecks(sourceFilter = 'all') {
    return this.getTaggedDecks(sourceFilter).diseases;
  },

  shuffleArray(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  },

  getOrderedQuestions(setKey, questions) {
    if (!questions || !questions.length) return [];
    if (!this.state.quizShuffleOn) {
      return questions.map((q, i) => ({ ...q, displayNo: i + 1 }));
    }
    const savedIds = this.state.quizShuffle[setKey];
    const idMap = new Map(questions.map(q => [q.id, q]));
    let ordered = [];
    if (Array.isArray(savedIds) && savedIds.length === questions.length && savedIds.every(id => idMap.has(id))) {
      ordered = savedIds.map(id => idMap.get(id));
    } else {
      ordered = this.shuffleArray(questions);
      this.state.quizShuffle[setKey] = ordered.map(q => q.id);
      this.saveQuizPrefs();
    }
    return ordered.map((q, i) => ({ ...q, displayNo: i + 1 }));
  },

  reshuffleSet(setKey, questions) {
    const ordered = this.shuffleArray(questions || []);
    this.state.quizShuffle[setKey] = ordered.map(q => q.id);
    this.saveQuizPrefs();
    return ordered.map((q, i) => ({ ...q, displayNo: i + 1 }));
  },

  formatTimerClock(sec) {
    const s = Math.max(0, sec | 0);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  },

  buildDataRefHtml(q) {
    const ref = q?.dataRef || (Array.isArray(q?.dataRefs) ? q.dataRefs[0] : null);
    if (!ref || !ref.topicId) return '';
    const secLabel = ref.secHeading ? ` · ${this.escapeHtml(ref.secHeading)}` : '';
    const hlParam = encodeURIComponent(ref.secHeading || (ref.quote || '').slice(0, 48));
    return `
      <div class="qz-dataref-box">
        <div class="qz-dataref-head">
          <span class="qz-dataref-title">เนื้อหาอ้างอิง: ${this.escapeHtml(ref.topicTitle || ref.topicId)}${secLabel}</span>
          <a href="#/summary?topic=${this.escapeHtml(ref.topicId)}&hl=${hlParam}" class="qz-btn-outline" style="padding: 0.28rem 0.68rem; font-size: 0.78rem;">
            ${this.qzIcon('book', 13)} อ่านในบทเรียน
          </a>
        </div>
        ${ref.quote ? `<div class="qz-dataref-quote">“${this.escapeHtml(ref.quote)}”</div>` : ''}
      </div>
    `;
  },

  getAllQuestionsIndexed() {
    const chData = window.CC1_QUIZ_DATA || { chapters: [] };
    const peData = window.CC1_PAST_EXAM_DATA || { chapters: [] };
    const list = [];
    const seen = new Set();
    const resolveDisease = (q) => q.topicTag || (q.dataRef && q.dataRef.topicId ? {
      id: q.dataRef.topicId,
      title: q.dataRef.topicTitle || q.dataRef.topicId,
      groupId: q.dataRef.groupId || '',
      groupName: q.dataRef.groupName || ''
    } : null);

    (chData.chapters || []).forEach(ch => {
      const srcKey = `ch_${ch.id}`;
      const srcTitle = `บท ${ch.chapterNum}. ${ch.title}`;
      (ch.questions || []).forEach(q => {
        if (seen.has(q.id)) return;
        seen.add(q.id);
        const dis = resolveDisease(q);
        list.push({
          ...q,
          _sourceType: 'chapter',
          _sourceKey: srcKey,
          _sourceTitle: srcTitle,
          _sourceLabel: q._sourceLabel || srcTitle,
          _sourceHref: `#/quiz?chapter=${ch.id}&order=orig&qid=${encodeURIComponent(q.id)}`,
          _diseaseKey: dis ? dis.id : `src_${srcKey}`,
          _diseaseTitle: dis ? dis.title : (q.subtopic || srcTitle),
          _diseaseGroup: dis?.groupName || (ch.category === 'clinical' ? 'กลุ่มโรค' : 'เภสัชศาสตร์·วิเคราะห์·กฎหมาย')
        });
      });
    });

    (peData.chapters || []).forEach(yr => {
      const srcKey = `yr_${yr.id}`;
      const srcTitle = yr.title || yr.id;
      (yr.questions || []).forEach(q => {
        if (seen.has(q.id)) return;
        seen.add(q.id);
        const dis = resolveDisease(q);
        const dayTag = q.day === 'day2' ? 'วันที่สอง' : 'วันแรก';
        list.push({
          ...q,
          _sourceType: 'year',
          _sourceKey: srcKey,
          _sourceTitle: srcTitle,
          _sourceLabel: q._sourceLabel || `${srcTitle} · ${dayTag} ข้อ ${q.origNo || '-'}`,
          _sourceHref: `#/quiz?year=${yr.id}&day=${q.day || 'all'}&order=orig&qid=${encodeURIComponent(q.id)}`,
          _diseaseKey: dis ? dis.id : `src_${srcKey}`,
          _diseaseTitle: dis ? dis.title : srcTitle,
          _diseaseGroup: dis?.groupName || 'ข้อสอบย้อนหลังรายปี'
        });
      });
    });
    return list;
  },

  getWrongEntries(scope = 'active') {
    const ans = this.state.quizAnswers || {};
    const hist = this.state.quizWrongHistory || {};
    const allQs = this.getAllQuestionsIndexed();
    const out = [];
    allQs.forEach(q => {
      const currPicked = typeof ans[q.id] === 'number' ? ans[q.id] : null;
      const isCurrWrong = currPicked !== null && !this.isQuizChoiceCorrect(q, currPicked);
      const h = hist[q.id];
      if (scope === 'active') {
        if (!isCurrWrong) return;
        out.push({
          ...q,
          _wrongPickedIdx: currPicked,
          _isResolved: false,
          _wrongCount: Math.max(1, h?.count || 1),
          _updatedAt: h?.updatedAt || 0
        });
      } else {
        if (!isCurrWrong && !h) return;
        const pickedForReview = isCurrWrong ? currPicked : (typeof h?.wrongIdx === 'number' ? h.wrongIdx : currPicked);
        out.push({
          ...q,
          _wrongPickedIdx: pickedForReview,
          _isResolved: !isCurrWrong,
          _wrongCount: Math.max(1, h?.count || 1),
          _updatedAt: h?.updatedAt || 0
        });
      }
    });
    return out;
  },

  launchRetryWrongSession(questions, title = 'ทำใหม่เฉพาะข้อที่ผิด') {
    if (!questions || !questions.length) return;
    const prevWrongMap = {};
    const ans = this.state.quizAnswers || {};
    const hist = this.state.quizWrongHistory || {};
    questions.forEach(q => {
      if (typeof q._wrongPickedIdx === 'number') prevWrongMap[q.id] = q._wrongPickedIdx;
      else if (typeof ans[q.id] === 'number' && !this.isQuizChoiceCorrect(q, ans[q.id])) prevWrongMap[q.id] = ans[q.id];
      else if (typeof hist[q.id]?.wrongIdx === 'number') prevWrongMap[q.id] = hist[q.id].wrongIdx;
    });
    const baseList = this.state.quizShuffleOn ? this.shuffleArray(questions) : [...questions];
    const ordered = baseList.map((q, idx) => ({ ...q, displayNo: idx + 1 }));
    this.state.quizTimerSec = 0;
    this.state.quizRetrySession = {
      title,
      questions: ordered,
      retryAnswers: {},
      simAnswers: {},
      simSubmitted: false,
      prevWrongMap
    };
    window.location.hash = '#/quiz?retrywrong=1&q=1';
  },

  renderQuizHub(c) {
    const chData = window.CC1_QUIZ_DATA || { chapters: [], totalQuestions: 0 };
    const chapters = chData.chapters || [];
    const peData = window.CC1_PAST_EXAM_DATA || { chapters: [], totalQuestions: 0 };
    const years = peData.chapters || [];
    const pastTagged = this.getTaggedDecks('past');
    const answers = this.state.quizAnswers || {};
    const activeTab = this.state.quizHubTab || 'chapter';

    const allChapterQs = chapters.flatMap(ch => ch.questions || []);
    const allYearQs = years.flatMap(y => y.questions || []);
    const stAll = this.getQuizSetStats([...allChapterQs, ...allYearQs]);
    const wrongActiveCount = stAll.wrong;

    const clinicalCount = chapters.filter(ch => ch.category === 'clinical').length;
    const pharmCount = chapters.filter(ch => ch.category === 'pharm').length;
    const mcqCount = years.filter(y => y.track === 'mcq').length;
    const pleCount = years.filter(y => y.track === 'ple').length;

    c.innerHTML = `
      <div class="qz-hub-wrap">
        <div class="qz-panel">
          <div class="qz-header-top">
            <div>
              <h1 class="qz-title">คลังข้อสอบ PLE-CC1</h1>
              <p class="qz-sub">แยกบท (${chapters.length} บท · ${allChapterQs.length} ข้อ) · แยกตามโรค/กลุ่ม (${pastTagged.groups.length} กลุ่ม · ${pastTagged.diseases.length} หัวข้อ) · ย้อนหลังรายปี (${allYearQs.length} ข้อ)</p>
            </div>
            <div class="qz-overview-metrics">
              ${this.qzRingHtml(stAll.done, stAll.total, 54)}
              <div class="qz-stats-strip">
                <span class="qz-stat-pill">ทำแล้ว ${stAll.done}/${stAll.total}</span>
                <span class="qz-stat-pill is-success">ถูก ${stAll.correct}</span>
                <button type="button" class="qz-stat-pill is-danger is-clickable" id="qzJumpWrongTabBtn" title="คลิกเพื่อดูและทำใหม่เฉพาะข้อที่ผิด">ผิด ${wrongActiveCount}</button>
                ${stAll.done > 0 ? `<button type="button" class="qz-btn-soft" id="qzResetAllBtn">${this.qzIcon('reset', 13)} ล้างทั้งหมด</button>` : ''}
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
            <div class="qz-seg-tabs" role="tablist" aria-label="ประเภทคลังข้อสอบ">
              <button type="button" role="tab" class="qz-seg-tab ${activeTab === 'chapter' ? 'active' : ''}" data-qz-tab="chapter">
                <span>ข้อสอบแยกบท</span>
                <span class="qz-seg-count">${allChapterQs.length}</span>
              </button>
              <button type="button" role="tab" class="qz-seg-tab ${activeTab === 'disease' ? 'active' : ''}" data-qz-tab="disease">
                <span>แยกตามโรค / กลุ่ม</span>
                <span class="qz-seg-count">${pastTagged.diseases.length}</span>
              </button>
              <button type="button" role="tab" class="qz-seg-tab ${activeTab === 'year' ? 'active' : ''}" data-qz-tab="year">
                <span>ข้อสอบรายปี (2556–2567)</span>
                <span class="qz-seg-count">${allYearQs.length}</span>
              </button>
              <button type="button" role="tab" class="qz-seg-tab ${activeTab === 'wrong' ? 'active' : ''} ${wrongActiveCount > 0 ? 'has-wrong-alert' : ''}" data-qz-tab="wrong">
                <span>ข้อที่เคยผิด</span>
                <span class="qz-seg-count ${wrongActiveCount > 0 ? 'is-alert' : ''}">${wrongActiveCount}</span>
              </button>
              <button type="button" role="tab" class="qz-seg-tab ${activeTab === 'random' ? 'active' : ''}" data-qz-tab="random">
                <span>สุ่มข้อสอบ (Custom)</span>
              </button>
            </div>
          </div>

          <div class="qz-toolbar-row">
            <div class="qz-order-control">
              <span class="qz-order-label">ลำดับข้อสอบ:</span>
              <div class="qz-seg-mini" role="group" aria-label="เลือกลำดับการทำข้อสอบ">
                <button type="button" class="qz-seg-mini-btn ${!this.state.quizShuffleOn ? 'active' : ''}" data-hub-order="orig">
                  ${this.qzIcon('list', 14)} เรียงตามต้นฉบับ
                </button>
                <button type="button" class="qz-seg-mini-btn ${this.state.quizShuffleOn ? 'active' : ''}" data-hub-order="shuffle">
                  ${this.qzIcon('shuffle', 14)} สุ่มลำดับข้อ
                </button>
              </div>
            </div>
            <span style="font-size:0.8rem; color:var(--qb-muted);">
              ${this.state.quizShuffleOn ? 'เข้าทำแต่ละครั้งระบบจะสุ่มเรียงลำดับข้อให้' : 'เข้าทำจะเรียงข้อที่ 1, 2, 3... ตามหนังสือ/ปี พ.ศ. ต้นฉบับ'}
            </span>
          </div>
        </div>

        <div id="qzTabContent"></div>
      </div>
    `;

    const tabBox = document.getElementById('qzTabContent');

    const renderChapterTab = () => {
      tabBox.innerHTML = `
        <div class="qz-panel" style="padding: 1rem 1.25rem;">
          <div class="qz-filter-bar">
            <div class="qz-search-box">
              <input type="search" id="qzChSearchInput" class="qz-search-input" placeholder="ค้นหาชื่อบทหรือโรคในบท..." autocomplete="off">
              <span class="qz-search-btn-sq">${this.qzIcon('search', 16)}</span>
            </div>
            <div class="qz-cat-pills" id="qzCatPills">
              <button type="button" class="qz-btn-soft active" data-qz-cat="all">ทั้งหมด (${chapters.length})</button>
              <button type="button" class="qz-btn-soft" data-qz-cat="clinical">กลุ่มโรค (${clinicalCount})</button>
              <button type="button" class="qz-btn-soft" data-qz-cat="pharm">เภสัชภัณฑ์·วิเคราะห์·กฎหมาย (${pharmCount})</button>
              <button type="button" class="qz-btn-outline" id="qzGoDiseaseTabQuick" style="padding:0.32rem 0.72rem; font-size:0.8rem;">ดูข้อสอบเก่าแยกตามโรค &rarr;</button>
            </div>
          </div>
        </div>

        <div id="qzEmptyHub" class="qz-panel" style="display: none; text-align: center; padding: 1.5rem; color: var(--qb-muted);">
          ไม่พบรายการที่ตรงกับคำค้นหา
        </div>

        <div class="qz-chapter-grid" id="qzChapterGrid">
          ${chapters.map(ch => {
            const st = this.getChapterQuizStats(ch);
            const subMap = new Map();
            (ch.questions || []).forEach(q => {
              const s = q.subtopic;
              if (s) subMap.set(s, (subMap.get(s) || 0) + 1);
            });
            const subs = Array.from(subMap.entries());
            const searchBlob = `${ch.chapterNum} ${ch.title} ${ch.id} ${subs.map(s=>s[0]).join(' ')}`.toLowerCase();
            return `
              <article class="qz-ch-card" data-qz-cat="${ch.category}" data-qz-search="${this.escapeHtml(searchBlob)}">
                <div class="qz-ch-head">
                  <div style="min-width: 0; flex: 1;">
                    <div style="display:flex; align-items:center; gap:0.45rem; margin-bottom:0.3rem;">
                      <span class="qz-ch-badge-num">${String(ch.chapterNum).padStart(2, '0')}</span>
                      <span class="qz-ch-meta">${ch.category === 'clinical' ? 'เภสัชบำบัด' : 'เภสัชศาสตร์'} · ${st.total} ข้อ</span>
                    </div>
                    <h2 class="qz-ch-title">${this.escapeHtml(ch.title)}</h2>
                    <div class="qz-ch-meta">
                      ${st.done > 0 ? `<span>ทำแล้ว ${st.done}/${st.total} · ถูก ${st.correct}</span>` : '<span>ยังไม่ได้เริ่มทำ</span>'}
                    </div>
                  </div>
                  ${this.qzRingHtml(st.done, st.total, 46)}
                </div>

                ${subs.length > 1 ? `
                  <div class="qz-disease-chips">
                    ${subs.slice(0, 6).map(([sname, scnt]) => `
                      <a href="#/quiz?chapter=${ch.id}&sub=${encodeURIComponent(sname)}" class="qz-disease-chip" title="ฝึกเฉพาะหัวข้อ ${this.escapeHtml(sname)}">
                        <span>${this.escapeHtml(sname)}</span>
                        <span style="opacity:0.65;">${scnt}</span>
                      </a>
                    `).join('')}
                  </div>
                ` : (subs.length === 1 ? `
                  <div class="qz-disease-chips">
                    <span class="qz-disease-chip" style="cursor:default;">${this.escapeHtml(subs[0][0])} · ${subs[0][1]} ข้อ</span>
                  </div>
                ` : '')}

                <div class="qz-ch-actions">
                  <a href="#/quiz?chapter=${ch.id}" class="qz-btn-solid" style="flex: 1;">
                    ${st.done === 0 ? 'เริ่มทำข้อสอบ' : (st.done < st.total ? `ทำต่อ (${st.done}/${st.total})` : 'ทบทวนทั้งหมด')}
                  </a>
                  ${st.done > 0 ? `<button type="button" class="qz-btn-soft" data-qz-clear-ch="${ch.id}">รีเซ็ต</button>` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;

      document.getElementById('qzGoDiseaseTabQuick')?.addEventListener('click', () => {
        this.state.quizHubTab = 'disease';
        c.querySelectorAll('[data-qz-tab]').forEach(b => b.classList.toggle('active', b.getAttribute('data-qz-tab') === 'disease'));
        renderActiveTab();
      });

      const searchInput = document.getElementById('qzChSearchInput');
      const catPills = document.getElementById('qzCatPills');
      const cards = Array.from(tabBox.querySelectorAll('.qz-ch-card'));
      const emptyEl = document.getElementById('qzEmptyHub');
      let activeCat = 'all';

      const applyHubFilter = () => {
        const q = (searchInput?.value || '').trim().toLowerCase();
        let shown = 0;
        cards.forEach(card => {
          const catOk = activeCat === 'all' || card.getAttribute('data-qz-cat') === activeCat;
          const txtOk = !q || (card.getAttribute('data-qz-search') || '').includes(q);
          const vis = catOk && txtOk;
          card.classList.toggle('is-hidden', !vis);
          if (vis) shown++;
        });
        if (emptyEl) emptyEl.style.display = shown === 0 ? 'block' : 'none';
      };

      searchInput?.addEventListener('input', applyHubFilter);
      catPills?.querySelectorAll('[data-qz-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeCat = btn.getAttribute('data-qz-cat') || 'all';
          catPills.querySelectorAll('[data-qz-cat]').forEach(p => p.classList.toggle('active', p === btn));
          applyHubFilter();
        });
      });
      tabBox.querySelectorAll('[data-qz-clear-ch]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cid = btn.getAttribute('data-qz-clear-ch');
          const targetCh = chapters.find(x => x.id === cid);
          if (!targetCh) return;
          targetCh.questions.forEach(q => { delete this.state.quizAnswers[q.id]; });
          this.saveQuizAnswers();
          this.renderQuizHub(c);
        });
      });
    };

    const renderDiseaseTab = () => {
      let srcFilter = this.state.quizDiseaseSource || 'past';
      let viewMode = this.state.quizDiseaseView || 'disease';
      let domainCat = 'all'; // 'all' | 'clinical' | 'pharm'
      let grpFilterId = 'all';
      let searchQuery = '';

      const buildYearChipsHtml = (yearsArr, yearCounts, baseHref) => {
        if (!yearsArr || !yearsArr.length) return '';
        return `
          <div class="qz-year-chips">
            ${yearsArr.map(y => `
              <a href="${baseHref}&yr=${encodeURIComponent(y)}" class="qz-year-chip" title="ทำเฉพาะปี พ.ศ. ${y}">
                <span>${y}</span>
                <span class="qz-year-chip-n">${yearCounts[y] || 0}</span>
              </a>
            `).join('')}
          </div>
        `;
      };

      const paintDiseaseHub = () => {
        const tagged = this.getTaggedDecks(srcFilter);
        const groups = tagged.groups;
        const diseases = tagged.diseases;
        const qNorm = searchQuery.trim().toLowerCase();

        const domainMatches = (isClin) => domainCat === 'all' || (domainCat === 'clinical' ? isClin : !isClin);
        const filteredGroups = groups.filter(g => {
          if (!domainMatches(g.isClinical)) return false;
          if (!qNorm) return true;
          const blob = `${g.title} ${g.id} ${g.years.join(' ')} ${g.diseases.map(d => d.title).join(' ')}`.toLowerCase();
          return blob.includes(qNorm);
        });
        const filteredDiseases = diseases.filter(d => {
          if (!domainMatches(d.isClinical)) return false;
          if (grpFilterId !== 'all' && d.groupId !== grpFilterId) return false;
          if (!qNorm) return true;
          const blob = `${d.title} ${d.id} ${d.groupName} ${d.years.join(' ')}`.toLowerCase();
          return blob.includes(qNorm);
        });

        const selectedGrpObj = (viewMode === 'disease' && grpFilterId !== 'all')
          ? groups.find(g => g.id === grpFilterId)
          : null;
        const clinicalGrpCount = groups.filter(g => g.isClinical).length;
        const pharmGrpCount = groups.length - clinicalGrpCount;

        tabBox.innerHTML = `
          <div class="qz-panel" style="padding: 1rem 1.25rem; display:flex; flex-direction:column; gap:0.75rem;">
            <div class="qz-wrong-controls">
              <div class="qz-seg-mini" role="group" aria-label="แหล่งข้อสอบ">
                <button type="button" class="qz-seg-mini-btn ${srcFilter === 'past' ? 'active' : ''}" data-dis-src="past">เฉพาะข้อสอบเก่า 2556–2567 (${allYearQs.length})</button>
                <button type="button" class="qz-seg-mini-btn ${srcFilter === 'all' ? 'active' : ''}" data-dis-src="all">รวมทั้งหมด · เก่า+แยกบท (${stAll.total})</button>
                <button type="button" class="qz-seg-mini-btn ${srcFilter === 'chapter' ? 'active' : ''}" data-dis-src="chapter">เฉพาะแยกบท (${allChapterQs.length})</button>
              </div>
              <div class="qz-seg-mini" role="group" aria-label="มุมมองรายโรคหรือรายกลุ่ม">
                <button type="button" class="qz-seg-mini-btn ${viewMode === 'disease' ? 'active' : ''}" data-dis-view="disease">แยกรายโรค / หัวข้อ (${diseases.length})</button>
                <button type="button" class="qz-seg-mini-btn ${viewMode === 'group' ? 'active' : ''}" data-dis-view="group">แยกรายกลุ่ม / ระบบ (${groups.length})</button>
              </div>
            </div>

            <div class="qz-filter-bar">
              <div class="qz-search-box">
                <input type="search" id="qzDisSearchInput" class="qz-search-input" value="${this.escapeHtml(searchQuery)}" placeholder="ค้นหาโรค, กลุ่มโรค หรือปี พ.ศ. เช่น Hypertension, เบาหวาน, CVS, 2566..." autocomplete="off">
                <span class="qz-search-btn-sq">${this.qzIcon('search', 16)}</span>
              </div>
              ${viewMode === 'disease' ? `
                <select id="qzDisGroupSelect" class="qz-select" aria-label="กรองตามกลุ่มโรค">
                  <option value="all" ${grpFilterId === 'all' ? 'selected' : ''}>ทุกกลุ่ม / ทุกระบบ (${groups.length} กลุ่ม)</option>
                  ${groups.filter(g => domainMatches(g.isClinical)).map(g => `
                    <option value="${this.escapeHtml(g.id)}" ${grpFilterId === g.id ? 'selected' : ''}>${this.escapeHtml(g.title)} (${g.questions.length} ข้อ)</option>
                  `).join('')}
                </select>
              ` : ''}
              <div class="qz-cat-pills">
                <button type="button" class="qz-btn-soft ${domainCat === 'all' ? 'active' : ''}" data-dis-dom="all">ทั้งหมด</button>
                <button type="button" class="qz-btn-soft ${domainCat === 'clinical' ? 'active' : ''}" data-dis-dom="clinical">กลุ่มโรคทางคลินิก (${clinicalGrpCount})</button>
                <button type="button" class="qz-btn-soft ${domainCat === 'pharm' ? 'active' : ''}" data-dis-dom="pharm">เภสัชศาสตร์·เคมี·กฎหมาย (${pharmGrpCount})</button>
              </div>
            </div>
          </div>

          ${selectedGrpObj ? (() => {
            const gSt = this.getQuizSetStats(selectedGrpObj.questions);
            const gHref = `#/quiz?group=${encodeURIComponent(selectedGrpObj.id)}&src=${srcFilter}`;
            return `
              <div class="qz-grp-banner">
                <div style="min-width:0; flex:1;">
                  <div style="font-size:0.78rem; font-weight:700; color:var(--qb-blue); margin-bottom:0.2rem;">
                    ฝึกทั้งกลุ่มรวมทุกหัวข้อย่อย (${selectedGrpObj.diseases.length} หัวข้อ${selectedGrpObj.years.length ? ` · ออก ${selectedGrpObj.years.length} ปี: ${selectedGrpObj.years[0]}–${selectedGrpObj.years[selectedGrpObj.years.length - 1]}` : ''})
                  </div>
                  <h2 style="margin:0; font-size:1.08rem; font-weight:800; color:var(--qb-text);">${this.escapeHtml(selectedGrpObj.title)}</h2>
                  <div style="font-size:0.83rem; color:var(--qb-muted); margin-top:0.2rem;">
                    รวม ${gSt.total} ข้อ · ทำแล้ว ${gSt.done} · ถูก ${gSt.correct}
                  </div>
                </div>
                <a href="${gHref}" class="qz-btn-solid">
                  ${gSt.done === 0 ? `ฝึกทั้งกลุ่ม (${gSt.total} ข้อ)` : `ทำต่อทั้งกลุ่ม (${gSt.done}/${gSt.total})`}
                </a>
              </div>
            `;
          })() : ''}

          ${((viewMode === 'group' ? filteredGroups.length : filteredDiseases.length) === 0) ? `
            <div class="qz-panel" style="text-align: center; padding: 1.75rem; color: var(--qb-muted);">
              ไม่พบโรคหรือกลุ่มที่ตรงกับตัวกรอง
            </div>
          ` : `
            <div class="qz-chapter-grid" id="qzDiseaseGrid">
              ${viewMode === 'group' ? filteredGroups.map(grp => {
                const st = this.getQuizSetStats(grp.questions);
                const gHref = `#/quiz?group=${encodeURIComponent(grp.id)}&src=${srcFilter}`;
                const yrSpan = grp.years.length
                  ? `ข้อสอบเก่า ${grp.years.length} ปี (${grp.years[0]}–${grp.years[grp.years.length - 1]})`
                  : 'คลังแยกบท';
                return `
                  <article class="qz-ch-card">
                    <div class="qz-ch-head">
                      <div style="min-width:0; flex:1;">
                        <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.28rem;">
                          <span class="qz-src-badge ${grp.isClinical ? 'is-file' : ''}">${grp.isClinical ? 'กลุ่มโรคทางคลินิก' : 'เภสัชศาสตร์ / กฎหมาย'}</span>
                          <span class="qz-ch-meta">${grp.diseases.length} หัวข้อ · ${st.total} ข้อ</span>
                        </div>
                        <h2 class="qz-ch-title">${this.escapeHtml(grp.title)}</h2>
                        <div class="qz-ch-meta">
                          <span>${yrSpan}</span>
                          ${st.done > 0 ? `<span>· ถูก ${st.correct}/${st.done}</span>` : ''}
                        </div>
                      </div>
                      ${this.qzRingHtml(st.done, st.total, 46)}
                    </div>

                    ${grp.diseases.length ? `
                      <div class="qz-disease-chips">
                        ${grp.diseases.map(d => `
                          <a href="#/quiz?disease=${encodeURIComponent(d.id)}&src=${srcFilter}" class="qz-disease-chip" title="ฝึกเฉพาะ ${this.escapeHtml(d.title)}">
                            <span>${this.escapeHtml(d.title)}</span>
                            <span style="opacity:0.65;">${d.questions.length}</span>
                          </a>
                        `).join('')}
                      </div>
                    ` : ''}

                    ${buildYearChipsHtml(grp.years, grp.yearCounts, gHref)}

                    <div class="qz-ch-actions">
                      <a href="${gHref}" class="qz-btn-solid" style="flex:1;">
                        ${st.done === 0 ? `ฝึกทั้งกลุ่ม (${st.total} ข้อ)` : `ทำต่อทั้งกลุ่ม (${st.done}/${st.total})`}
                      </a>
                      ${st.done > 0 ? `<button type="button" class="qz-btn-soft" data-dis-reset-grp="${this.escapeHtml(grp.id)}">รีเซ็ต</button>` : ''}
                    </div>
                  </article>
                `;
              }).join('') : filteredDiseases.map(dis => {
                const st = this.getQuizSetStats(dis.questions);
                const dHref = `#/quiz?disease=${encodeURIComponent(dis.id)}&src=${srcFilter}`;
                const srcInfoParts = [];
                if (dis.pastCount > 0) srcInfoParts.push(`ข้อสอบเก่า ${dis.pastCount} ข้อ (${dis.years.length} ปี)`);
                if (dis.chapterCount > 0) srcInfoParts.push(`แยกบท ${dis.chapterCount} ข้อ`);
                return `
                  <article class="qz-ch-card">
                    <div class="qz-ch-head">
                      <div style="min-width:0; flex:1;">
                        <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.25rem;">
                          <button type="button" class="qz-group-link-pill" data-pick-dis-grp="${this.escapeHtml(dis.groupId)}" title="คลิกเพื่อกรองทั้งกลุ่ม ${this.escapeHtml(dis.groupName)}">
                            ${this.escapeHtml(dis.groupName)}
                          </button>
                        </div>
                        <h2 class="qz-ch-title">${this.escapeHtml(dis.title)}</h2>
                        <div class="qz-ch-meta">
                          <span>${srcInfoParts.join(' · ') || `${st.total} ข้อ`}</span>
                          ${st.done > 0 ? `<span>· ถูก ${st.correct}/${st.done}</span>` : ''}
                        </div>
                      </div>
                      ${this.qzRingHtml(st.done, st.total, 46)}
                    </div>

                    ${buildYearChipsHtml(dis.years, dis.yearCounts, dHref)}

                    <div class="qz-ch-actions">
                      <a href="${dHref}" class="qz-btn-solid" style="flex:1;">
                        ${st.done === 0 ? `ฝึกทุกปี (${st.total} ข้อ)` : `ทำต่อ (${st.done}/${st.total})`}
                      </a>
                      ${st.done > 0 ? `<button type="button" class="qz-btn-soft" data-dis-reset-id="${this.escapeHtml(dis.id)}">รีเซ็ต</button>` : ''}
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          `}
        `;

        tabBox.querySelectorAll('[data-dis-src]').forEach(btn => btn.addEventListener('click', () => {
          srcFilter = btn.getAttribute('data-dis-src') || 'past';
          this.state.quizDiseaseSource = srcFilter;
          grpFilterId = 'all';
          paintDiseaseHub();
        }));
        tabBox.querySelectorAll('[data-dis-view]').forEach(btn => btn.addEventListener('click', () => {
          viewMode = btn.getAttribute('data-dis-view') || 'disease';
          this.state.quizDiseaseView = viewMode;
          paintDiseaseHub();
        }));
        tabBox.querySelectorAll('[data-dis-dom]').forEach(btn => btn.addEventListener('click', () => {
          domainCat = btn.getAttribute('data-dis-dom') || 'all';
          grpFilterId = 'all';
          paintDiseaseHub();
        }));
        document.getElementById('qzDisGroupSelect')?.addEventListener('change', (e) => {
          grpFilterId = e.target.value;
          paintDiseaseHub();
        });
        tabBox.querySelectorAll('[data-pick-dis-grp]').forEach(btn => btn.addEventListener('click', () => {
          grpFilterId = btn.getAttribute('data-pick-dis-grp') || 'all';
          paintDiseaseHub();
        }));
        const sIn = document.getElementById('qzDisSearchInput');
        sIn?.addEventListener('input', (e) => {
          searchQuery = e.target.value;
          paintDiseaseHub();
          const f = document.getElementById('qzDisSearchInput');
          if (f) {
            f.focus();
            f.setSelectionRange(searchQuery.length, searchQuery.length);
          }
        });
        tabBox.querySelectorAll('[data-dis-reset-id]').forEach(btn => btn.addEventListener('click', () => {
          const did = btn.getAttribute('data-dis-reset-id');
          const d = diseases.find(x => x.id === did);
          if (!d) return;
          d.questions.forEach(q => { delete this.state.quizAnswers[q.id]; });
          this.saveQuizAnswers();
          this.renderQuizHub(c);
        }));
        tabBox.querySelectorAll('[data-dis-reset-grp]').forEach(btn => btn.addEventListener('click', () => {
          const gid = btn.getAttribute('data-dis-reset-grp');
          const g = groups.find(x => x.id === gid);
          if (!g) return;
          g.questions.forEach(q => { delete this.state.quizAnswers[q.id]; });
          this.saveQuizAnswers();
          this.renderQuizHub(c);
        }));
      };

      paintDiseaseHub();
    };

    const renderYearTab = () => {
      if (!years.length) {
        tabBox.innerHTML = `<div class="qz-panel" style="text-align:center;">ไม่พบข้อสอบรายปี</div>`;
        return;
      }
      tabBox.innerHTML = `
        <div class="qz-panel" style="padding: 1rem 1.25rem;">
          <div class="qz-filter-bar">
            <div class="qz-search-box">
              <input type="search" id="qzYrSearchInput" class="qz-search-input" placeholder="ค้นหาปี พ.ศ. หรือชุดข้อสอบ เช่น 2566, 2561, PLE-CC1, MCQ..." autocomplete="off">
              <span class="qz-search-btn-sq">${this.qzIcon('search', 16)}</span>
            </div>
            <div class="qz-cat-pills" id="qzYrCatPills">
              <button type="button" class="qz-btn-soft active" data-yr-cat="all">ทั้งหมด (${years.length})</button>
              <button type="button" class="qz-btn-soft" data-yr-cat="mcq">MCQ 2556–2562 (${mcqCount})</button>
              <button type="button" class="qz-btn-soft" data-yr-cat="ple">PLE-CC1 2561–2567 (${pleCount})</button>
            </div>
          </div>
        </div>

        <div id="qzYrEmpty" class="qz-panel" style="display: none; text-align: center; padding: 1.5rem; color: var(--qb-muted);">
          ไม่พบชุดข้อสอบที่ตรงกับคำค้นหา
        </div>

        <div class="qz-chapter-grid" id="qzYearGrid">
          ${years.map(yr => {
            const qs = yr.questions || [];
            const st = this.getQuizSetStats(qs);
            const fileKeys = qs.filter(q => q.answerSource === 'file').length;
            const aiKeys = qs.filter(q => q.answerSource === 'ai').length;
            const d1Count = qs.filter(q => q.day === 'day1').length;
            const d2Count = qs.filter(q => q.day === 'day2').length;
            const searchBlob = `${yr.title} ${yr.year} ${yr.track} ch${yr.chapterNum}`.toLowerCase();
            return `
              <article class="qz-ch-card" data-yr-cat="${yr.track}" data-yr-search="${this.escapeHtml(searchBlob)}">
                <div class="qz-ch-head">
                  <div style="min-width: 0; flex: 1;">
                    <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.3rem;">
                      <span class="qz-ch-badge-num">${yr.year}</span>
                      <span class="qz-src-badge">${yr.track === 'ple' ? 'PLE-CC1' : 'MCQ'}</span>
                      ${fileKeys > 0 ? `<span class="qz-src-badge is-file">เฉลยไฟล์ ${fileKeys}</span>` : ''}
                      ${aiKeys > 0 ? `<span class="qz-src-badge is-ai">AI เฉลย ${aiKeys}</span>` : ''}
                    </div>
                    <h2 class="qz-ch-title">${this.escapeHtml(yr.title)}</h2>
                    <div class="qz-ch-meta">
                      <span>${st.total} ข้อ</span>
                      ${st.done > 0 ? `<span>· ถูก ${st.correct}/${st.done}</span>` : '<span>· ยังไม่ได้ทำ</span>'}
                    </div>
                  </div>
                  ${this.qzRingHtml(st.done, st.total, 46)}
                </div>
                <div class="qz-ch-actions">
                  <a href="#/quiz?year=${yr.id}&day=all" class="qz-btn-solid" style="flex: 1;">
                    ทำทั้งชุด (${st.total})
                  </a>
                  ${yr.hasDay2 && d2Count > 0 ? `
                    <a href="#/quiz?year=${yr.id}&day=day1" class="qz-btn-outline" title="เฉพาะวันแรก (${d1Count} ข้อ)">วัน 1</a>
                    <a href="#/quiz?year=${yr.id}&day=day2" class="qz-btn-outline" title="เฉพาะวันที่สอง (${d2Count} ข้อ)">วัน 2</a>
                  ` : ''}
                  ${st.done > 0 ? `<button type="button" class="qz-btn-soft" data-yr-clear="${yr.id}">รีเซ็ต</button>` : ''}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;

      const sInput = document.getElementById('qzYrSearchInput');
      const pills = document.getElementById('qzYrCatPills');
      const cards = Array.from(tabBox.querySelectorAll('.qz-ch-card'));
      const emptyEl = document.getElementById('qzYrEmpty');
      let act = 'all';
      const applyYr = () => {
        const q = (sInput?.value || '').trim().toLowerCase();
        let shown = 0;
        cards.forEach(card => {
          const okCat = act === 'all' || card.getAttribute('data-yr-cat') === act;
          const okTxt = !q || (card.getAttribute('data-yr-search') || '').includes(q);
          const vis = okCat && okTxt;
          card.classList.toggle('is-hidden', !vis);
          if (vis) shown++;
        });
        if (emptyEl) emptyEl.style.display = shown === 0 ? 'block' : 'none';
      };
      sInput?.addEventListener('input', applyYr);
      pills?.querySelectorAll('[data-yr-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          act = btn.getAttribute('data-yr-cat') || 'all';
          pills.querySelectorAll('[data-yr-cat]').forEach(p => p.classList.toggle('active', p === btn));
          applyYr();
        });
      });
      tabBox.querySelectorAll('[data-yr-clear]').forEach(btn => {
        btn.addEventListener('click', () => {
          const yid = btn.getAttribute('data-yr-clear');
          const yr = years.find(x => x.id === yid);
          if (!yr) return;
          yr.questions.forEach(q => { delete this.state.quizAnswers[q.id]; });
          this.saveQuizAnswers();
          this.renderQuizHub(c);
        });
      });
    };

    const renderRandomTab = () => {
      let srcScope = 'all'; // 'all' | 'years' | 'chapters' | 'diseases' | 'custom'
      let dayScope = 'all';
      let statusScope = 'all';
      let chosenChapters = new Set(chapters.map(x => x.id));
      let chosenYears = new Set(years.map(x => x.id));
      let chosenDiseases = new Set(diseases.slice(0, 8).map(x => x.id));
      let reqCount = 30;
      let examMode = this.state.quizExamMode || 'instant';
      let timerOn = !!this.state.quizTimerOn;

      const buildPool = () => {
        let pool = [];
        const seenIds = new Set();
        const addQ = (q, label) => {
          if (seenIds.has(q.id)) return;
          seenIds.add(q.id);
          pool.push({ ...q, _sourceLabel: q._sourceLabel || label });
        };
        const addCh = (ch) => (ch.questions || []).forEach(q => addQ(q, `บท ${ch.chapterNum}. ${ch.title}`));
        const addYr = (yr) => (yr.questions || []).forEach(q => {
          if (dayScope !== 'all' && q.day !== dayScope) return;
          addQ(q, `${yr.title} · ${q.day === 'day2' ? 'วันสอง' : 'วันแรก'} ข้อ ${q.origNo}`);
        });

        if (srcScope === 'all') {
          chapters.forEach(addCh);
          years.forEach(addYr);
        } else if (srcScope === 'chapters') {
          chapters.forEach(addCh);
        } else if (srcScope === 'years') {
          years.forEach(addYr);
        } else if (srcScope === 'diseases') {
          diseases.filter(d => chosenDiseases.has(d.id)).forEach(d => {
            d.questions.forEach(q => {
              if (dayScope !== 'all' && q.day && q.day !== dayScope) return;
              addQ(q, q._sourceLabel || d.title);
            });
          });
        } else {
          chapters.filter(ch => chosenChapters.has(ch.id)).forEach(addCh);
          years.filter(yr => chosenYears.has(yr.id)).forEach(addYr);
        }

        if (statusScope === 'todo') {
          pool = pool.filter(q => typeof answers[q.id] !== 'number');
        } else if (statusScope === 'wrong') {
          pool = pool.filter(q => typeof answers[q.id] === 'number' && !this.isQuizChoiceCorrect(q, answers[q.id]));
        }
        return pool;
      };

      const paintBuilder = () => {
        const pool = buildPool();
        const actualCount = Math.min(Math.max(1, reqCount), pool.length);
        tabBox.innerHTML = `
          <div class="qz-rand-panel">
            <div class="qz-rand-section">
              <div class="qz-rand-label">
                <span>1. แหล่งข้อสอบที่จะสุ่ม</span>
                <span class="qz-stat-pill">พบ ${pool.length} ข้อที่ตรงเงื่อนไข</span>
              </div>
              <div class="qz-cat-pills">
                <button type="button" class="qz-btn-soft ${srcScope === 'all' ? 'active' : ''}" data-scope="all">ทั้งหมด (${stAll.total})</button>
                <button type="button" class="qz-btn-soft ${srcScope === 'years' ? 'active' : ''}" data-scope="years">ข้อสอบรายปี (${allYearQs.length})</button>
                <button type="button" class="qz-btn-soft ${srcScope === 'chapters' ? 'active' : ''}" data-scope="chapters">ข้อสอบแยกบท (${allChapterQs.length})</button>
                <button type="button" class="qz-btn-soft ${srcScope === 'diseases' ? 'active' : ''}" data-scope="diseases">เลือกตามโรค (${diseases.length})</button>
                <button type="button" class="qz-btn-soft ${srcScope === 'custom' ? 'active' : ''}" data-scope="custom">ติ๊กเลือกหลายปี / หลายบท</button>
              </div>
              ${srcScope === 'diseases' ? `
                <div style="margin-top:0.85rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                    <span style="font-size:0.82rem; font-weight:700; color:var(--qb-muted);">เลือกโรคที่ต้องการฝึก (${chosenDiseases.size} หัวข้อที่เลือก):</span>
                    <div style="display:flex; gap:0.35rem;">
                      <button type="button" class="qz-btn-soft" id="qzDisAllOn">เลือกทั้งหมด</button>
                      <button type="button" class="qz-btn-soft" id="qzDisAllOff">ล้าง</button>
                    </div>
                  </div>
                  <div class="qz-pick-grid">
                    ${diseases.map(d => `
                      <label class="qz-pick-item">
                        <input type="checkbox" data-pick-dis="${this.escapeHtml(d.id)}" ${chosenDiseases.has(d.id) ? 'checked' : ''}>
                        <span>${this.escapeHtml(d.title)} (${d.questions.length})</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${srcScope === 'custom' ? `
                <div style="margin-top: 0.85rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                    <span style="font-size:0.82rem; font-weight:700;">ข้อสอบรายปี (เลือกได้หลายปี)</span>
                    <div style="display:flex; gap:0.35rem;">
                      <button type="button" class="qz-btn-soft" id="qzYrAllOn">เลือกทุกปี</button>
                      <button type="button" class="qz-btn-soft" id="qzYrAllOff">ล้าง</button>
                    </div>
                  </div>
                  <div class="qz-pick-grid">
                    ${years.map(yr => `
                      <label class="qz-pick-item">
                        <input type="checkbox" data-pick-yr="${yr.id}" ${chosenYears.has(yr.id) ? 'checked' : ''}>
                        <span>${this.escapeHtml(yr.title)} (${yr.questionCount})</span>
                      </label>
                    `).join('')}
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin: 0.85rem 0 0.35rem;">
                    <span style="font-size:0.82rem; font-weight:700;">ข้อสอบแยกบท (เลือกได้หลายบท)</span>
                    <div style="display:flex; gap:0.35rem;">
                      <button type="button" class="qz-btn-soft" id="qzChAllOn">เลือกทุกบท</button>
                      <button type="button" class="qz-btn-soft" id="qzChAllOff">ล้าง</button>
                    </div>
                  </div>
                  <div class="qz-pick-grid">
                    ${chapters.map(ch => `
                      <label class="qz-pick-item">
                        <input type="checkbox" data-pick-ch="${ch.id}" ${chosenChapters.has(ch.id) ? 'checked' : ''}>
                        <span>บท ${ch.chapterNum}. ${this.escapeHtml(ch.title)} (${ch.questionCount})</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="qz-rand-section">
              <div class="qz-rand-label"><span>2. ตัวกรองวันและสถานะ</span></div>
              <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <div style="font-size: 0.78rem; color: var(--qb-muted); margin-bottom: 0.35rem;">ช่วงวัน (สำหรับข้อสอบรายปี):</div>
                  <div class="qz-seg-mini">
                    <button type="button" class="qz-seg-mini-btn ${dayScope === 'all' ? 'active' : ''}" data-rday="all">ทั้งปี</button>
                    <button type="button" class="qz-seg-mini-btn ${dayScope === 'day1' ? 'active' : ''}" data-rday="day1">วันแรก</button>
                    <button type="button" class="qz-seg-mini-btn ${dayScope === 'day2' ? 'active' : ''}" data-rday="day2">วันที่สอง</button>
                  </div>
                </div>
                <div>
                  <div style="font-size: 0.78rem; color: var(--qb-muted); margin-bottom: 0.35rem;">สถานะข้อสอบ:</div>
                  <div class="qz-seg-mini">
                    <button type="button" class="qz-seg-mini-btn ${statusScope === 'all' ? 'active' : ''}" data-rstatus="all">ทุกข้อ</button>
                    <button type="button" class="qz-seg-mini-btn ${statusScope === 'todo' ? 'active' : ''}" data-rstatus="todo">ยังไม่ทำ</button>
                    <button type="button" class="qz-seg-mini-btn ${statusScope === 'wrong' ? 'active' : ''}" data-rstatus="wrong">เคยผิด</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="qz-rand-section">
              <div class="qz-rand-label"><span>3. จำนวนข้อ รูปแบบตรวจ และนาฬิกา</span></div>
              <div class="qz-rand-count-row" style="margin-bottom: 0.9rem;">
                ${[10, 20, 30, 50, 100].map(n => `
                  <button type="button" class="qz-btn-soft ${reqCount === n ? 'active' : ''}" data-rcount="${n}">${n} ข้อ</button>
                `).join('')}
                <label style="display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.83rem; font-weight: 700;">
                  กำหนดเอง:
                  <input type="number" id="qzCustomCountInput" class="qz-num-input" min="1" max="${Math.max(1, pool.length)}" value="${reqCount}">
                </label>
              </div>
              <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.85rem;">
                <div class="qz-seg-mini">
                  <button type="button" class="qz-seg-mini-btn ${examMode === 'instant' ? 'active' : ''}" data-rmode="instant">ติ๊กปุ๊บเฉลยปั๊บ</button>
                  <button type="button" class="qz-seg-mini-btn ${examMode === 'sim' ? 'active' : ''}" data-rmode="sim">จำลองสอบ (ตรวจตอนจบ)</button>
                </div>
                <label class="qz-switch-label">
                  <button type="button" role="switch" id="qzTimerSwitch" class="qz-switch" aria-checked="${timerOn}"><span class="qz-switch-thumb"></span></button>
                  <span>จับเวลาระหว่างทำข้อสอบ</span>
                </label>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <button type="button" id="qzStartRandomBtn" class="qz-btn-solid" style="padding: 0.72rem 1.55rem; font-size: 0.95rem;" ${pool.length === 0 ? 'disabled' : ''}>
                ${this.qzIcon('shuffle', 16)} เริ่มสุ่มข้อสอบ (${actualCount} ข้อ)
              </button>
              ${this.state.quizRandomSession ? `
                <a href="#/quiz?random=1" class="qz-btn-outline" style="padding: 0.68rem 1.15rem;">
                  ทำชุดสุ่มเดิมต่อ (${this.state.quizRandomSession.questions.length} ข้อ)
                </a>
              ` : ''}
            </div>
          </div>
        `;

        tabBox.querySelectorAll('[data-scope]').forEach(btn => btn.addEventListener('click', () => { srcScope = btn.getAttribute('data-scope'); paintBuilder(); }));
        tabBox.querySelectorAll('[data-rday]').forEach(btn => btn.addEventListener('click', () => { dayScope = btn.getAttribute('data-rday'); paintBuilder(); }));
        tabBox.querySelectorAll('[data-rstatus]').forEach(btn => btn.addEventListener('click', () => { statusScope = btn.getAttribute('data-rstatus'); paintBuilder(); }));
        tabBox.querySelectorAll('[data-rcount]').forEach(btn => btn.addEventListener('click', () => { reqCount = parseInt(btn.getAttribute('data-rcount'), 10) || 20; paintBuilder(); }));
        document.getElementById('qzCustomCountInput')?.addEventListener('change', (e) => { reqCount = Math.max(1, parseInt(e.target.value, 10) || 20); paintBuilder(); });
        tabBox.querySelectorAll('[data-rmode]').forEach(btn => btn.addEventListener('click', () => { examMode = btn.getAttribute('data-rmode'); this.state.quizExamMode = examMode; paintBuilder(); }));
        document.getElementById('qzTimerSwitch')?.addEventListener('click', () => { timerOn = !timerOn; this.state.quizTimerOn = timerOn; paintBuilder(); });

        tabBox.querySelectorAll('[data-pick-yr]').forEach(cb => cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-pick-yr');
          if (cb.checked) chosenYears.add(id); else chosenYears.delete(id);
          paintBuilder();
        }));
        tabBox.querySelectorAll('[data-pick-ch]').forEach(cb => cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-pick-ch');
          if (cb.checked) chosenChapters.add(id); else chosenChapters.delete(id);
          paintBuilder();
        }));
        tabBox.querySelectorAll('[data-pick-dis]').forEach(cb => cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-pick-dis');
          if (cb.checked) chosenDiseases.add(id); else chosenDiseases.delete(id);
          paintBuilder();
        }));
        document.getElementById('qzYrAllOn')?.addEventListener('click', () => { chosenYears = new Set(years.map(x => x.id)); paintBuilder(); });
        document.getElementById('qzYrAllOff')?.addEventListener('click', () => { chosenYears.clear(); paintBuilder(); });
        document.getElementById('qzChAllOn')?.addEventListener('click', () => { chosenChapters = new Set(chapters.map(x => x.id)); paintBuilder(); });
        document.getElementById('qzChAllOff')?.addEventListener('click', () => { chosenChapters.clear(); paintBuilder(); });
        document.getElementById('qzDisAllOn')?.addEventListener('click', () => { chosenDiseases = new Set(diseases.map(x => x.id)); paintBuilder(); });
        document.getElementById('qzDisAllOff')?.addEventListener('click', () => { chosenDiseases.clear(); paintBuilder(); });

        document.getElementById('qzStartRandomBtn')?.addEventListener('click', () => {
          const finalPool = buildPool();
          if (!finalPool.length) return;
          const n = Math.min(Math.max(1, reqCount), finalPool.length);
          const picked = this.shuffleArray(finalPool).slice(0, n).map((q, idx) => ({ ...q, displayNo: idx + 1 }));
          this.state.quizExamMode = examMode;
          this.state.quizTimerOn = timerOn;
          this.state.quizTimerSec = 0;
          this.state.quizRandomSession = {
            title: `ชุดสุ่มข้อสอบ (${n} ข้อ)`,
            questions: picked,
            simAnswers: {},
            simSubmitted: false
          };
          window.location.hash = '#/quiz?random=1&q=1';
        });
      };

      paintBuilder();
    };

    const renderWrongTab = () => {
      let scope = this.state.quizWrongScope || 'active';
      let groupBy = this.state.quizWrongGroupBy || 'disease';
      let catFilter = 'all';
      let queryStr = '';
      const collapsedGroups = new Set();

      const paintWrongView = () => {
        const activeList = this.getWrongEntries('active');
        const historyList = this.getWrongEntries('history');
        const baseList = scope === 'history' ? historyList : activeList;
        const resolvedCount = historyList.filter(x => x._isResolved).length;

        const buildGroups = (items) => {
          const map = new Map();
          items.forEach(item => {
            const gKey = groupBy === 'disease'
              ? (item._diseaseKey || item._sourceKey)
              : (item._sourceKey || item._diseaseKey);
            const gTitle = groupBy === 'disease'
              ? (item._diseaseTitle || item._sourceTitle)
              : (item._sourceTitle || item._diseaseTitle);
            const gSub = groupBy === 'disease'
              ? (item._diseaseGroup || '')
              : (item._sourceType === 'year' ? 'ข้อสอบย้อนหลังรายปี' : 'ข้อสอบแยกบท');
            if (!map.has(gKey)) {
              map.set(gKey, { key: gKey, title: gTitle, sub: gSub, items: [] });
            }
            map.get(gKey).items.push(item);
          });
          return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
        };

        const allGroups = buildGroups(baseList);
        const qNorm = queryStr.trim().toLowerCase();
        const filteredItems = baseList.filter(item => {
          const gKey = groupBy === 'disease'
            ? (item._diseaseKey || item._sourceKey)
            : (item._sourceKey || item._diseaseKey);
          if (catFilter !== 'all' && gKey !== catFilter) return false;
          if (qNorm) {
            const blob = `${item.stem || ''} ${item.caseText || ''} ${(item.options || []).join(' ')} ${item._diseaseTitle || ''} ${item._sourceLabel || ''} ${item.subtopic || ''}`.toLowerCase();
            if (!blob.includes(qNorm)) return false;
          }
          return true;
        });
        const shownGroups = buildGroups(filteredItems);

        tabBox.innerHTML = `
          <div class="qz-panel" style="padding: 1.1rem 1.25rem;">
            <div class="qz-wrong-hero">
              <div>
                <h2 class="qz-ch-title" style="font-size: 1.08rem; margin-bottom: 0.25rem;">หมวดหมู่ข้อสอบที่เคยตอบผิด</h2>
                <div class="qz-stats-strip">
                  <span class="qz-stat-pill is-danger">ยังผิดอยู่ ${activeList.length} ข้อ</span>
                  <span class="qz-stat-pill is-success">แก้ถูกแล้ว ${resolvedCount} ข้อ</span>
                  <span class="qz-stat-pill">ทั้งหมดในประวัติ ${historyList.length} ข้อ</span>
                </div>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:0.45rem; align-items:center;">
                <button type="button" id="qzStartRetryAllBtn" class="qz-btn-solid" ${filteredItems.length === 0 ? 'disabled' : ''}>
                  ${this.qzIcon('reset', 15)} ลองทำใหม่เฉพาะข้อที่ผิด (${filteredItems.length} ข้อ)
                </button>
                ${resolvedCount > 0 ? `<button type="button" id="qzClearResolvedBtn" class="qz-btn-soft">ล้างข้อที่แก้ถูกแล้ว</button>` : ''}
              </div>
            </div>

            <div class="qz-filter-bar">
              <div class="qz-seg-mini" role="group" aria-label="ขอบเขตข้อที่ผิด">
                <button type="button" class="qz-seg-mini-btn ${scope === 'active' ? 'active' : ''}" data-wrong-scope="active">ยังผิดอยู่ (${activeList.length})</button>
                <button type="button" class="qz-seg-mini-btn ${scope === 'history' ? 'active' : ''}" data-wrong-scope="history">ประวัติเคยผิด (${historyList.length})</button>
              </div>
              <div class="qz-seg-mini" role="group" aria-label="จัดกลุ่มข้อที่ผิด">
                <button type="button" class="qz-seg-mini-btn ${groupBy === 'disease' ? 'active' : ''}" data-wrong-grp="disease">จัดกลุ่มตามโรค / หัวข้อ</button>
                <button type="button" class="qz-seg-mini-btn ${groupBy === 'source' ? 'active' : ''}" data-wrong-grp="source">จัดกลุ่มตามบท / ปี</button>
              </div>
              <select id="qzWrongCatFilter" class="qz-select" aria-label="กรองตามหมวดหมู่ข้อที่ผิด">
                <option value="all">ทุกหมวด (${allGroups.length} หมวด · ${baseList.length} ข้อ)</option>
                ${allGroups.map(g => `<option value="${this.escapeHtml(g.key)}" ${catFilter === g.key ? 'selected' : ''}>${this.escapeHtml(g.title)} (${g.items.length})</option>`).join('')}
              </select>
              <div class="qz-search-box" style="min-width: 210px;">
                <input type="search" id="qzWrongSearchInput" class="qz-search-input" value="${this.escapeHtml(queryStr)}" placeholder="ค้นหาโจทย์ ชื่อยา หรือโรคที่ผิด..." autocomplete="off">
                <span class="qz-search-btn-sq">${this.qzIcon('search', 16)}</span>
              </div>
            </div>
          </div>

          ${baseList.length === 0 ? `
            <div class="qz-panel qz-wrong-empty">
              <div class="qz-wrong-empty-icon">${this.qzIcon('check', 24)}</div>
              <h3 class="qz-ch-title" style="margin-bottom: 0.35rem;">
                ${scope === 'active'
                  ? (stAll.done > 0 ? 'เยี่ยมมาก — ตอนนี้ไม่มีข้อที่ค้างตอบผิดแล้ว' : 'ยังไม่มีประวัติข้อที่ตอบผิด')
                  : 'ยังไม่มีประวัติข้อที่เคยตอบผิด'}
              </h3>
              <p class="qz-sub" style="margin-bottom: 1rem;">
                ${scope === 'active' && resolvedCount > 0
                  ? `คุณเคยแก้ข้อที่ผิดให้ถูกแล้ว ${resolvedCount} ข้อ กดดู "ประวัติเคยผิด" เพื่อทบทวนได้`
                  : 'เมื่อทำข้อสอบในหมวดแยกบท แยกโรค หรือข้อสอบรายปีแล้วตอบผิด ระบบจะรวมไว้ให้ทบทวนและทำใหม่ตรงนี้ทันที'}
              </p>
              <div style="display:flex; justify-content:center; gap:0.5rem; flex-wrap:wrap;">
                ${scope === 'active' && resolvedCount > 0 ? `<button type="button" class="qz-btn-outline" id="qzShowHistEmptyBtn">ดูประวัติเคยผิด (${historyList.length} ข้อ)</button>` : ''}
                <button type="button" class="qz-btn-solid" id="qzGoPracticeBtn">ไปทำข้อสอบแยกบท / แยกโรค</button>
              </div>
            </div>
          ` : (filteredItems.length === 0 ? `
            <div class="qz-panel qz-wrong-empty">
              <p class="qz-sub" style="margin-bottom: 0.75rem;">ไม่พบข้อที่ผิดตามคำค้นหาหรือตัวกรองที่เลือก</p>
              <button type="button" class="qz-btn-outline" id="qzClearWrongFilterBtn">ล้างตัวกรอง</button>
            </div>
          ` : `
            <div class="qz-wrong-groups">
              ${shownGroups.map(grp => {
                const isCollapsed = collapsedGroups.has(grp.key);
                const activeInGrp = grp.items.filter(x => !x._isResolved).length;
                return `
                  <section class="qz-wrong-group ${isCollapsed ? 'is-collapsed' : ''}" data-wrong-section="${this.escapeHtml(grp.key)}">
                    <div class="qz-wrong-group-head">
                      <div class="qz-wrong-group-info">
                        <h3 class="qz-wrong-group-title">
                          <span>${this.escapeHtml(grp.title)}</span>
                          <span class="qz-stat-pill is-danger" style="font-size:0.75rem; padding:0.18rem 0.55rem;">${grp.items.length} ข้อ</span>
                          ${scope === 'history' && activeInGrp < grp.items.length ? `<span class="qz-stat-pill is-success" style="font-size:0.75rem; padding:0.18rem 0.55rem;">แก้แล้ว ${grp.items.length - activeInGrp}</span>` : ''}
                        </h3>
                        ${grp.sub ? `<div class="qz-wrong-group-sub">${this.escapeHtml(grp.sub)}</div>` : ''}
                      </div>
                      <div class="qz-wrong-group-actions">
                        <button type="button" class="qz-btn-outline" style="padding: 0.36rem 0.78rem; font-size: 0.8rem;" data-retry-wrong-grp="${this.escapeHtml(grp.key)}">
                          ${this.qzIcon('reset', 13)} ทำใหม่เฉพาะหมวดนี้ (${grp.items.length})
                        </button>
                        <button type="button" class="qz-btn-soft" style="padding: 0.36rem 0.7rem;" data-toggle-wrong-grp="${this.escapeHtml(grp.key)}">
                          ${isCollapsed ? 'ดูรายละเอียด' : 'ซ่อนรายการ'}
                        </button>
                      </div>
                    </div>

                    <div class="qz-wrong-list">
                      ${grp.items.map(item => {
                        const labels = item.optionLabels || ['ก', 'ข', 'ค', 'ง', 'จ'];
                        const opts = item.options || [];
                        const pickedIdx = item._wrongPickedIdx;
                        const pickedKey = typeof pickedIdx === 'number' ? (labels[pickedIdx] || String(pickedIdx + 1)) : '?';
                        const pickedTxt = typeof pickedIdx === 'number' && opts[pickedIdx] ? opts[pickedIdx] : '(ไม่ได้เลือก)';
                        const validIdxs = this.getQuestionCorrectIndices(item);
                        const rightTextList = validIdxs.length
                          ? validIdxs.map(i => `${labels[i] || (i + 1)}. ${opts[i] || ''}`).join('  |  ')
                          : (item.answerSource === 'no_answer' ? 'เฉลยทางการระบุ: ไม่มีคำตอบ' : '-');
                        return `
                          <article class="qz-wrong-item" data-wrong-qid="${this.escapeHtml(item.id)}">
                            <div class="qz-wrong-item-head">
                              <div style="display:flex; flex-wrap:wrap; gap:0.38rem; align-items:center;">
                                <span class="qz-subtopic-pill">${this.escapeHtml(item._sourceLabel || item._sourceTitle)}</span>
                                ${item.subtopic ? `<span class="qz-src-badge">${this.escapeHtml(item.subtopic)}</span>` : ''}
                                ${item._diseaseTitle && groupBy === 'source' ? `<span class="qz-src-badge is-ai">${this.escapeHtml(item._diseaseTitle)}</span>` : ''}
                              </div>
                              <div style="display:flex; flex-wrap:wrap; gap:0.35rem; align-items:center;">
                                ${item._isResolved
                                  ? `<span class="qz-src-badge is-file">แก้ถูกแล้ว</span>`
                                  : `<span class="qz-stat-pill is-danger" style="font-size:0.74rem; padding:0.16rem 0.52rem;">ผิด ${item._wrongCount > 1 ? `${item._wrongCount} ครั้ง` : 'รอบล่าสุด'}</span>`}
                              </div>
                            </div>

                            ${item.caseText ? `<div class="qz-wrong-case">${this.escapeHtml(item.caseText.length > 260 ? item.caseText.slice(0, 260) + '...' : item.caseText)}</div>` : ''}
                            <div class="qz-wrong-stem">${this.escapeHtml(item.stem)}</div>

                            <div class="qz-wrong-diff">
                              <div class="qz-diff-row is-wrong">
                                <span class="qz-diff-tag">ที่ตอบ (ผิด)</span>
                                <span class="qz-diff-opt">${this.escapeHtml(pickedKey)}. ${this.escapeHtml(pickedTxt)}</span>
                              </div>
                              <div class="qz-diff-row is-right">
                                <span class="qz-diff-tag">เฉลยที่ถูก</span>
                                <span class="qz-diff-opt">${this.escapeHtml(rightTextList)}</span>
                              </div>
                            </div>

                            <div class="qz-wrong-exp">
                              <div class="qz-wrong-exp-label">เหตุผล &amp; จุดที่ควรจำ</div>
                              <div class="qz-wrong-exp-body">${this.escapeHtml(item.explanation || `คำตอบที่ถูกต้องคือ ${rightTextList}`)}</div>
                              ${this.buildDataRefHtml(item)}
                            </div>

                            <div class="qz-wrong-item-foot">
                              <span style="font-size:0.78rem; color:var(--qb-muted);">${item.pdfPage ? `หน้า PDF ${item.pdfPage}` : ''}</span>
                              <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                                ${item._sourceHref ? `<a href="${item._sourceHref}" class="qz-btn-soft">เปิดดูในชุดเดิม</a>` : ''}
                                <button type="button" class="qz-btn-outline" style="padding:0.36rem 0.8rem; font-size:0.81rem;" data-retry-wrong-one="${this.escapeHtml(item.id)}">
                                  ${this.qzIcon('reset', 13)} ลองทำข้อนี้ใหม่
                                </button>
                              </div>
                            </div>
                          </article>
                        `;
                      }).join('')}
                    </div>
                  </section>
                `;
              }).join('')}
            </div>
          `)}
        `;

        const findGroupByKey = (k) => shownGroups.find(g => g.key === k);

        tabBox.querySelectorAll('[data-wrong-scope]').forEach(b => b.addEventListener('click', () => {
          scope = b.getAttribute('data-wrong-scope') || 'active';
          this.state.quizWrongScope = scope;
          catFilter = 'all';
          paintWrongView();
        }));

        tabBox.querySelectorAll('[data-wrong-grp]').forEach(b => b.addEventListener('click', () => {
          groupBy = b.getAttribute('data-wrong-grp') || 'disease';
          this.state.quizWrongGroupBy = groupBy;
          catFilter = 'all';
          collapsedGroups.clear();
          paintWrongView();
        }));

        document.getElementById('qzWrongCatFilter')?.addEventListener('change', (e) => {
          catFilter = e.target.value || 'all';
          paintWrongView();
        });

        document.getElementById('qzWrongSearchInput')?.addEventListener('input', (e) => {
          queryStr = e.target.value || '';
          const pos = e.target.selectionStart;
          paintWrongView();
          const inp = document.getElementById('qzWrongSearchInput');
          if (inp) {
            inp.focus();
            if (typeof pos === 'number') inp.setSelectionRange(pos, pos);
          }
        });

        document.getElementById('qzStartRetryAllBtn')?.addEventListener('click', () => {
          if (!filteredItems.length) return;
          const catObj = catFilter !== 'all' ? findGroupByKey(catFilter) : null;
          const title = catObj
            ? `ทำใหม่เฉพาะข้อที่ผิด · ${catObj.title}`
            : `ทำใหม่เฉพาะข้อที่ผิดทั้งหมด (${filteredItems.length} ข้อ)`;
          this.launchRetryWrongSession(filteredItems, title);
        });

        tabBox.querySelectorAll('[data-retry-wrong-grp]').forEach(b => b.addEventListener('click', () => {
          const grp = findGroupByKey(b.getAttribute('data-retry-wrong-grp'));
          if (grp && grp.items.length) {
            this.launchRetryWrongSession(grp.items, `ทำใหม่ข้อที่ผิด · ${grp.title}`);
          }
        }));

        tabBox.querySelectorAll('[data-retry-wrong-one]').forEach(b => b.addEventListener('click', () => {
          const qid = b.getAttribute('data-retry-wrong-one');
          const found = filteredItems.find(x => x.id === qid) || baseList.find(x => x.id === qid);
          if (found) {
            this.launchRetryWrongSession([found], `ทำใหม่ข้อที่ผิด · ${found._diseaseTitle || found._sourceTitle}`);
          }
        }));

        tabBox.querySelectorAll('[data-toggle-wrong-grp]').forEach(b => b.addEventListener('click', () => {
          const k = b.getAttribute('data-toggle-wrong-grp');
          if (collapsedGroups.has(k)) collapsedGroups.delete(k);
          else collapsedGroups.add(k);
          paintWrongView();
        }));

        document.getElementById('qzClearResolvedBtn')?.addEventListener('click', () => {
          if (!this.state.quizWrongHistory) return;
          Object.keys(this.state.quizWrongHistory).forEach(id => {
            if (this.state.quizWrongHistory[id]?.resolved) delete this.state.quizWrongHistory[id];
          });
          this.saveQuizWrongHistory();
          paintWrongView();
        });

        document.getElementById('qzClearWrongFilterBtn')?.addEventListener('click', () => {
          catFilter = 'all';
          queryStr = '';
          paintWrongView();
        });

        document.getElementById('qzShowHistEmptyBtn')?.addEventListener('click', () => {
          scope = 'history';
          this.state.quizWrongScope = 'history';
          paintWrongView();
        });

        document.getElementById('qzGoPracticeBtn')?.addEventListener('click', () => {
          this.state.quizHubTab = 'chapter';
          this.renderQuizHub(c);
        });
      };

      paintWrongView();
    };

    const renderActiveTab = () => {
      if (this.state.quizHubTab === 'disease') renderDiseaseTab();
      else if (this.state.quizHubTab === 'year') renderYearTab();
      else if (this.state.quizHubTab === 'wrong') renderWrongTab();
      else if (this.state.quizHubTab === 'random') renderRandomTab();
      else renderChapterTab();
    };

    c.querySelectorAll('[data-qz-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.quizHubTab = btn.getAttribute('data-qz-tab') || 'chapter';
        c.querySelectorAll('[data-qz-tab]').forEach(b => b.classList.toggle('active', b === btn));
        renderActiveTab();
      });
    });

    document.getElementById('qzJumpWrongTabBtn')?.addEventListener('click', () => {
      this.state.quizHubTab = 'wrong';
      c.querySelectorAll('[data-qz-tab]').forEach(b => b.classList.toggle('active', b.getAttribute('data-qz-tab') === 'wrong'));
      renderActiveTab();
      document.getElementById('qzTabContent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    c.querySelectorAll('[data-hub-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.quizShuffleOn = btn.getAttribute('data-hub-order') === 'shuffle';
        this.saveQuizPrefs();
        this.renderQuizHub(c);
      });
    });

    document.getElementById('qzResetAllBtn')?.addEventListener('click', () => {
      if (!window.confirm('ต้องการล้างประวัติการทำข้อสอบทั้งหมดใช่หรือไม่?')) return;
      this.state.quizAnswers = {};
      this.state.quizWrongHistory = {};
      this.saveQuizAnswers();
      this.saveQuizWrongHistory();
      this.renderQuizHub(c);
    });

    renderActiveTab();
  },

  renderQuizRunner(c, chapterId, qNumParam, subtopicFilter = '', qIdParam = '') {
    const chData = window.CC1_QUIZ_DATA || { chapters: [] };
    const ch = (chData.chapters || []).find(x => x.id === chapterId) || (chData.chapters || [])[0];
    if (!ch) { this.renderQuizHub(c); return; }
    let qs = ch.questions || [];
    let subTag = '';
    if (subtopicFilter) {
      const matched = qs.filter(q => (q.subtopic || '') === subtopicFilter);
      if (matched.length) {
        qs = matched;
        subTag = ` · ${subtopicFilter}`;
      }
    }
    this.renderUnifiedRunner(c, {
      setKey: `ch_${ch.id}${subtopicFilter ? '_' + subtopicFilter : ''}`,
      backTab: 'chapter',
      baseHash: `#/quiz?chapter=${ch.id}${subtopicFilter ? '&sub=' + encodeURIComponent(subtopicFilter) : ''}`,
      title: `บทที่ ${ch.chapterNum}. ${ch.title}${subTag}`,
      rawQuestions: qs,
      qNumParam,
      qIdParam
    });
  },

  launchTaggedDeckRunner(c, kind, deck, srcParam, yrParam, qNumParam, qIdParam = '') {
    if (!deck) { this.renderQuizHub(c); return; }
    const src = ['past', 'all', 'chapter'].includes(srcParam) ? srcParam : 'all';
    const yr = yrParam && deck.years && deck.years.includes(yrParam) ? yrParam : '';
    const qs = yr ? deck.questions.filter(q => q._sourceYear === yr) : deck.questions;
    const prefix = kind === 'group' ? 'กลุ่ม' : 'โรค/หัวข้อ';
    const yearTag = yr ? ` · ปี ${yr}` : (src === 'past' && deck.years.length > 1 ? ` · รวม ${deck.years.length} ปี` : '');
    const yearBaseHash = `#/quiz?${kind}=${encodeURIComponent(deck.id)}&src=${src}`;
    this.renderUnifiedRunner(c, {
      setKey: `${kind}_${deck.id}_${src}${yr ? '_' + yr : ''}`,
      backTab: 'disease',
      baseHash: `${yearBaseHash}${yr ? '&yr=' + encodeURIComponent(yr) : ''}`,
      yearBaseHash,
      availableYears: deck.years || [],
      yearCounts: deck.yearCounts || {},
      activeYear: yr,
      totalAcrossYears: deck.questions.length,
      title: `${prefix}: ${deck.title}${yearTag}`,
      rawQuestions: qs,
      qNumParam,
      qIdParam
    });
  },

  renderDiseaseQuizRunner(c, diseaseId, srcParam = 'all', yrParam = '', qNumParam = 0, qIdParam = '') {
    const src = ['past', 'all', 'chapter'].includes(srcParam) ? srcParam : 'all';
    const dis = this.getTaggedDecks(src).diseases.find(d => d.id === diseaseId);
    this.launchTaggedDeckRunner(c, 'disease', dis, src, yrParam, qNumParam, qIdParam);
  },

  renderGroupQuizRunner(c, groupId, srcParam = 'past', yrParam = '', qNumParam = 0, qIdParam = '') {
    const src = ['past', 'all', 'chapter'].includes(srcParam) ? srcParam : 'past';
    const grp = this.getTaggedDecks(src).groups.find(g => g.id === groupId);
    this.launchTaggedDeckRunner(c, 'group', grp, src, yrParam, qNumParam, qIdParam);
  },

  renderPastExamRunner(c, yearId, dayParam, qNumParam, qIdParam = '') {
    const peData = window.CC1_PAST_EXAM_DATA || { chapters: [] };
    const yr = (peData.chapters || []).find(x => x.id === yearId) || (peData.chapters || [])[0];
    if (!yr) { this.renderQuizHub(c); return; }
    const dayFilter = (dayParam === 'day1' || dayParam === 'day2') ? dayParam : 'all';
    const rawQs = (yr.questions || []).filter(q => dayFilter === 'all' || q.day === dayFilter);
    const dayTag = dayFilter === 'day1' ? ' · วันแรก' : (dayFilter === 'day2' ? ' · วันที่สอง' : '');
    this.renderUnifiedRunner(c, {
      setKey: `yr_${yr.id}_${dayFilter}`,
      backTab: 'year',
      baseHash: `#/quiz?year=${yr.id}&day=${dayFilter}`,
      title: `${yr.title}${dayTag}`,
      rawQuestions: rawQs,
      qNumParam,
      qIdParam
    });
  },

  renderRandomQuizRunner(c, qNumParam) {
    const sess = this.state.quizRandomSession;
    if (!sess || !sess.questions || !sess.questions.length) {
      this.state.quizHubTab = 'random';
      this.renderQuizHub(c);
      return;
    }
    this.renderUnifiedRunner(c, {
      setKey: '__random_session__',
      isRandomSession: true,
      backTab: 'random',
      baseHash: '#/quiz?random=1',
      title: sess.title,
      rawQuestions: sess.questions,
      qNumParam
    });
  },

  renderRetryWrongRunner(c, qNumParam) {
    const sess = this.state.quizRetrySession;
    if (!sess || !sess.questions || !sess.questions.length) {
      this.state.quizHubTab = 'wrong';
      this.renderQuizHub(c);
      return;
    }
    this.renderUnifiedRunner(c, {
      setKey: '__retry_wrong_session__',
      isRetryWrongSession: true,
      prevWrongMap: sess.prevWrongMap || {},
      backTab: 'wrong',
      baseHash: '#/quiz?retrywrong=1',
      title: sess.title,
      rawQuestions: sess.questions,
      qNumParam
    });
  },

  renderUnifiedRunner(c, cfg) {
    const sessionObj = cfg.isRetryWrongSession
      ? this.state.quizRetrySession
      : (cfg.isRandomSession ? this.state.quizRandomSession : null);
    const isAdhoc = !!(cfg.isRandomSession || cfg.isRetryWrongSession);

    let qs = isAdhoc
      ? cfg.rawQuestions
      : this.getOrderedQuestions(cfg.setKey, cfg.rawQuestions);
    if (!qs.length) { this.renderQuizHub(c); return; }

    let filterMode = isAdhoc ? 'all' : (this.state.quizFilter || 'all');
    let currentPos = (cfg.qNumParam >= 1 && cfg.qNumParam <= qs.length) ? cfg.qNumParam : 1;
    if (cfg.qIdParam) {
      const targetById = qs.find(x => x.id === cfg.qIdParam);
      if (targetById) currentPos = targetById.displayNo;
    }
    let showMap = false;
    let examMode = this.state.quizExamMode || 'instant';
    let simSubmitted = sessionObj ? !!sessionObj.simSubmitted : false;

    if (sessionObj) {
      if (!sessionObj.simAnswers) sessionObj.simAnswers = {};
      if (cfg.isRetryWrongSession && !sessionObj.retryAnswers) sessionObj.retryAnswers = {};
    } else {
      this._localSimAnswers = {};
    }

    const getAnsStore = () => {
      if (examMode === 'sim') {
        return sessionObj ? sessionObj.simAnswers : (this._localSimAnswers || (this._localSimAnswers = {}));
      }
      return cfg.isRetryWrongSession ? sessionObj.retryAnswers : this.state.quizAnswers;
    };

    const getFilteredQs = () => {
      const ans = getAnsStore();
      if (filterMode === 'todo') return qs.filter(q => typeof ans[q.id] !== 'number');
      if (filterMode === 'wrong') {
        if (examMode === 'sim' && !simSubmitted) return qs;
        return qs.filter(q => typeof ans[q.id] === 'number' && !this.isQuizChoiceCorrect(q, ans[q.id]));
      }
      return qs;
    };

    const startTimerIfNeeded = () => {
      this.clearQuizTimer();
      if (!this.state.quizTimerOn) return;
      this._quizTimerInterval = setInterval(() => {
        this.state.quizTimerSec = (this.state.quizTimerSec || 0) + 1;
        const el = document.getElementById('qzClockDisplay');
        if (el) el.textContent = this.formatTimerClock(this.state.quizTimerSec);
      }, 1000);
    };

    const renderBody = () => {
      const ans = getAnsStore();
      const st = this.getQuizSetStats(qs, ans);
      const visibleQs = getFilteredQs();
      let q = qs.find(x => x.displayNo === currentPos) || qs[0];
      if (visibleQs.length && !visibleQs.some(x => x.displayNo === q.displayNo)) {
        q = visibleQs[0];
        currentPos = q.displayNo;
      }

      const selectedIdx = typeof ans[q.id] === 'number' ? ans[q.id] : null;
      const isAnswered = selectedIdx !== null;
      const showInstantReveal = isAnswered && (examMode === 'instant' || simSubmitted);
      const validIndices = this.getQuestionCorrectIndices(q);
      const isNoAnswer = q.answerSource === 'no_answer';
      const isCorrect = isAnswered && this.isQuizChoiceCorrect(q, selectedIdx);
      const labels = q.optionLabels || ['ก', 'ข', 'ค', 'ง', 'จ'];
      const correctLabelsText = isNoAnswer
        ? 'ไม่มีคำตอบในเฉลย'
        : validIndices.map(i => labels[i] || (i + 1)).join(', ');

      const visIdx = visibleQs.findIndex(x => x.displayNo === q.displayNo);
      const prevQ = visIdx > 0 ? visibleQs[visIdx - 1] : null;
      const nextQ = (visIdx >= 0 && visIdx + 1 < visibleQs.length) ? visibleQs[visIdx + 1] : null;

      const ansTag = q.answerSource === 'no_answer'
        ? `<span class="qz-src-badge is-warn">เฉลยระบุ: ไม่มีคำตอบ</span>`
        : (q.answerSource === 'file'
          ? `<span class="qz-src-badge is-file">เฉลยจากไฟล์</span>`
          : (q.answerSource === 'ai' ? `<span class="qz-src-badge is-ai">AI เฉลยเทียบเนื้อหา</span>` : ''));
      const choiceTag = q.choiceSource === 'ai'
        ? `<span class="qz-src-badge is-ai">AI สร้างชอยส์</span>`
        : '';

      c.innerHTML = `
        <div class="qz-runner-wrap">
          <div class="qz-runner-topbar">
            <div class="qz-topbar-row">
              <a href="#/quiz?tab=${cfg.backTab}" class="qz-btn-outline" style="padding: 0.36rem 0.78rem; font-size: 0.82rem;">
                ${this.qzIcon('chevLeft', 14)} กลับหน้าคลัง
              </a>
              <div class="qz-runner-ch-name">${this.escapeHtml(cfg.title)}</div>
              <div class="qz-stats-strip">
                ${this.state.quizTimerOn ? `<span class="qz-timer-pill">${this.qzIcon('clock', 13)} <span id="qzClockDisplay">${this.formatTimerClock(this.state.quizTimerSec)}</span></span>` : ''}
                ${(examMode === 'instant' || simSubmitted) ? `
                  <span class="qz-stat-pill is-success">ถูก ${st.correct}</span>
                  <span class="qz-stat-pill is-danger">ผิด ${st.wrong}</span>
                ` : `<span class="qz-stat-pill">ตอบ ${st.done}/${st.total}</span>`}
                <button type="button" class="qz-btn-soft" id="qzToggleMapBtn">${showMap ? 'ซ่อนเลขข้อ' : `ข้อ ${q.displayNo}/${st.total}`}</button>
              </div>
            </div>
            ${showMap ? `
              <div class="qz-nav-strip" id="qzNavStrip">
                ${qs.map(item => {
                  const ua = ans[item.id];
                  let cls = 'qz-qdot';
                  if (typeof ua === 'number') {
                    if (examMode === 'sim' && !simSubmitted) cls += ' is-current';
                    else cls += (this.isQuizChoiceCorrect(item, ua) ? ' is-ok' : ' is-bad');
                  }
                  if (item.displayNo === q.displayNo) cls += ' is-current';
                  return `<button type="button" class="${cls}" data-qz-jump="${item.displayNo}">${item.displayNo}</button>`;
                }).join('')}
              </div>
            ` : ''}
          </div>

          <div class="qz-filter-modes">
            <div class="qz-seg-mini">
              <button type="button" class="qz-seg-mini-btn ${filterMode === 'all' ? 'active' : ''}" data-qz-mode="all">ทั้งหมด (${st.total})</button>
              <button type="button" class="qz-seg-mini-btn ${filterMode === 'todo' ? 'active' : ''}" data-qz-mode="todo">ยังไม่ทำ (${st.total - st.done})</button>
              ${(examMode === 'instant' || simSubmitted) ? `<button type="button" class="qz-seg-mini-btn ${filterMode === 'wrong' ? 'active' : ''}" data-qz-mode="wrong">ข้อที่ผิด (${st.wrong})</button>` : ''}
            </div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
              ${(!cfg.isRetryWrongSession && st.wrong > 0 && (examMode === 'instant' || simSubmitted)) ? `
                <button type="button" class="qz-btn-outline" id="qzRunnerRetryWrongBtn" style="padding: 0.34rem 0.72rem; font-size: 0.8rem;">
                  ${this.qzIcon('reset', 13)} ทำใหม่ข้อที่ผิด (${st.wrong})
                </button>
              ` : ''}
              ${!isAdhoc ? `
                <div class="qz-seg-mini">
                  <button type="button" class="qz-seg-mini-btn ${!this.state.quizShuffleOn ? 'active' : ''}" data-run-order="orig" title="เรียงตามข้อ 1, 2, 3 ต้นฉบับ">
                    ${this.qzIcon('list', 13)} ต้นฉบับ
                  </button>
                  <button type="button" class="qz-seg-mini-btn ${this.state.quizShuffleOn ? 'active' : ''}" data-run-order="shuffle" title="สุ่มลำดับข้อ">
                    ${this.qzIcon('shuffle', 13)} สุ่มข้อ
                  </button>
                </div>
                ${this.state.quizShuffleOn ? `<button type="button" class="qz-btn-soft" id="qzReshuffleBtn" title="สุ่มเรียงรอบใหม่">สุ่มใหม่</button>` : ''}
              ` : ''}
              <button type="button" class="qz-btn-soft ${examMode === 'sim' ? 'active' : ''}" id="qzToggleSimModeBtn" title="สลับระหว่างติ๊กเฉลยทันทีกับจำลองสอบ">
                ${examMode === 'sim' ? 'โหมดจำลองสอบ' : 'เฉลยทันที'}
              </button>
              <button type="button" class="qz-btn-soft ${this.state.quizTimerOn ? 'active' : ''}" id="qzToggleTimerBtn">
                ${this.qzIcon('clock', 13)} ${this.state.quizTimerOn ? 'ซ่อนเวลา' : 'จับเวลา'}
              </button>
              ${st.done > 0 ? `<button type="button" class="qz-btn-soft" id="qzClearChRunnerBtn">${this.qzIcon('reset', 13)} ล้าง</button>` : ''}
            </div>
          </div>

          ${(cfg.availableYears && cfg.availableYears.length > 1) ? `
            <div class="qz-runner-years-bar">
              <span class="qz-runner-years-label">กรองตามปี พ.ศ.:</span>
              <a href="${cfg.yearBaseHash}" class="qz-year-chip ${!cfg.activeYear ? 'active' : ''}">
                ทุกปี <span class="qz-year-chip-n">${cfg.totalAcrossYears || st.total}</span>
              </a>
              ${cfg.availableYears.map(y => `
                <a href="${cfg.yearBaseHash}&yr=${encodeURIComponent(y)}" class="qz-year-chip ${cfg.activeYear === y ? 'active' : ''}">
                  ${y} <span class="qz-year-chip-n">${(cfg.yearCounts && cfg.yearCounts[y]) || 0}</span>
                </a>
              `).join('')}
            </div>
          ` : ''}

          ${(examMode === 'sim' && simSubmitted) ? `
            <div class="qz-sim-summary">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div style="display:flex; align-items:center; gap:1rem;">
                  ${this.qzRingHtml(st.correct, st.total, 62)}
                  <div>
                    <div style="font-size:0.84rem; font-weight:700; color:var(--qb-muted);">สรุปผลคะแนนโหมดจำลองสอบ</div>
                    <div class="qz-sim-score-big">${st.correct} / ${st.total} ข้อ</div>
                    <div style="font-size:0.84rem; color:var(--qb-muted);">ตอบ ${st.done} ข้อ · ถูก ${st.correct} · ผิด ${st.wrong}${this.state.quizTimerSec > 0 ? ` · เวลา ${this.formatTimerClock(this.state.quizTimerSec)}` : ''}</div>
                  </div>
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                  ${st.wrong > 0 ? `<button type="button" class="qz-btn-outline" data-qz-mode="wrong">ดูข้อที่ผิด (${st.wrong})</button>` : ''}
                  ${(!cfg.isRetryWrongSession && st.wrong > 0) ? `<button type="button" class="qz-btn-outline" id="qzSimRetryWrongBtn">${this.qzIcon('reset', 14)} ลองทำใหม่เฉพาะข้อที่ผิด (${st.wrong})</button>` : ''}
                  <button type="button" class="qz-btn-solid" id="qzSimRestartBtn">ทำรอบใหม่อีกครั้ง</button>
                </div>
              </div>
            </div>
          ` : (examMode === 'sim' && !simSubmitted ? `
            <div class="qz-panel" style="padding: 0.72rem 1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <span style="font-size:0.85rem; color:var(--qb-muted);"><b>โหมดจำลองสอบ:</b> ตอบแล้ว <b>${st.done}/${st.total}</b> ข้อ (ยังไม่เฉลยจนกว่าจะกดส่งคำตอบ)</span>
              <button type="button" class="qz-btn-solid" id="qzSubmitSimBtn">${this.qzIcon('check', 14)} ส่งคำตอบ &amp; ตรวจคะแนน</button>
            </div>
          ` : '')}

          ${visibleQs.length === 0 ? `
            <div class="qz-q-card" style="text-align: center; padding: 2.2rem 1.25rem;">
              <p style="font-size: 1.02rem; font-weight: 700; margin: 0 0 0.85rem 0;">
                ${filterMode === 'wrong' ? 'ไม่มีข้อที่ตอบผิดแล้ว' : 'ทำครบทุกข้อในชุดนี้แล้ว'}
              </p>
              <button type="button" class="qz-btn-solid" data-qz-mode="all">แสดงข้อสอบทั้งหมด (${st.total} ข้อ)</button>
            </div>
          ` : `
            <div class="qz-q-card" id="qzActiveCard">
              <div class="qz-q-head">
                <div style="display:flex; flex-wrap:wrap; gap:0.4rem; align-items:center;">
                  <span class="qz-q-badge">ข้อ ${q.displayNo} / ${st.total}</span>
                  ${q._sourceLabel ? `<span class="qz-subtopic-pill">${this.escapeHtml(q._sourceLabel)}</span>` : (q.subtopic ? `<span class="qz-subtopic-pill">${this.escapeHtml(q.subtopic)}</span>` : (q.origNo ? `<span class="qz-src-badge">ข้อ ${q.origNo} (${q.day === 'day2' ? 'วันที่สอง' : 'วันแรก'})</span>` : ''))}
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.35rem; align-items:center;">
                  ${ansTag}${choiceTag}
                </div>
              </div>

              ${(q.caseText || (q.caseImages && q.caseImages.length)) ? `
                <div class="qz-case-box">
                  <div class="qz-case-label">กรณีศึกษา / ข้อมูลประกอบโจทย์</div>
                  ${q.caseText ? `<div>${this.escapeHtml(q.caseText)}</div>` : ''}
                  ${(q.caseImages && q.caseImages.length) ? `
                    <div class="qz-fig-wrap">
                      ${q.caseImages.map(src => `<img src="${src}" alt="ภาพประกอบกรณีศึกษา" class="qz-fig-img" loading="lazy">`).join('')}
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <div class="qz-stem">${this.escapeHtml(q.stem)}</div>

              ${(q.images && q.images.length) ? `
                <div class="qz-fig-wrap">
                  ${q.images.map(src => `<img src="${src}" alt="ภาพประกอบคำถาม" class="qz-fig-img">`).join('')}
                </div>
              ` : ''}

              <div class="qz-options-list" role="radiogroup" aria-label="ตัวเลือกคำถามข้อ ${q.displayNo}">
                ${(q.options || []).map((optText, i) => {
                  const key = labels[i] || String(i + 1);
                  let optCls = 'qz-opt-btn';
                  if (examMode === 'sim' && !simSubmitted) {
                    if (i === selectedIdx) optCls += ' is-selected-sim';
                  } else if (showInstantReveal) {
                    const isRightOpt = validIndices.includes(i) || (isNoAnswer && i === q.bestGuess);
                    if (isRightOpt) optCls += ' is-correct-choice';
                    else if (i === selectedIdx && !isNoAnswer) optCls += ' is-wrong-choice';
                    else optCls += ' is-dimmed';
                  }
                  const locked = (examMode === 'instant' && isAnswered) || simSubmitted;
                  return `
                    <button type="button" class="${optCls}" data-qz-opt="${i}" ${locked ? 'aria-disabled="true"' : ''}>
                      <span class="qz-opt-key">${this.escapeHtml(key)}</span>
                      <span class="qz-opt-text">${this.escapeHtml(optText)}</span>
                    </button>
                  `;
                }).join('')}
              </div>

              ${showInstantReveal ? `
                <div class="qz-feedback-card ${isCorrect ? 'is-ok' : 'is-bad'}" role="status" aria-live="polite">
                  <div class="qz-feedback-banner">
                    <span>
                      ${isNoAnswer
                        ? `เฉลยทางการระบุ: ไม่มีคำตอบ (ไม่หักคะแนน)${typeof q.bestGuess === 'number' ? ` · ใกล้เคียงสุด: ข้อ ${labels[q.bestGuess]}` : ''}`
                        : (isCorrect
                          ? `ถูกต้อง (ข้อ ${this.escapeHtml(correctLabelsText)}${validIndices.length > 1 ? ' · ตอบได้หลายข้อ' : ''})`
                          : `ยังไม่ถูกต้อง — เฉลยคือข้อ ${this.escapeHtml(correctLabelsText)}`)}
                    </span>
                    <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
                      ${(cfg.isRetryWrongSession && typeof cfg.prevWrongMap?.[q.id] === 'number')
                        ? `<span class="qz-src-badge is-warn">รอบก่อนเคยเลือกข้อ ${this.escapeHtml(labels[cfg.prevWrongMap[q.id]] || String(cfg.prevWrongMap[q.id] + 1))}</span>`
                        : ''}
                      ${examMode === 'instant' ? `<button type="button" class="qz-btn-soft" id="qzRetryOneBtn" style="font-size: 0.78rem; padding: 0.24rem 0.62rem;">ทำใหม่ข้อนี้</button>` : ''}
                    </div>
                  </div>
                  <div class="qz-feedback-body">
                    ${this.escapeHtml(q.explanation || `เฉลยข้อ ${correctLabelsText}`)}
                    ${(q.expImages && q.expImages.length) ? `
                      <div class="qz-fig-wrap" style="margin-top: 0.75rem; margin-bottom: 0;">
                        ${q.expImages.map(src => `<img src="${src}" alt="ภาพประกอบเฉลย" class="qz-fig-img" loading="lazy">`).join('')}
                      </div>
                    ` : ''}
                    ${this.buildDataRefHtml(q)}
                  </div>
                </div>
              ` : ''}

              <div class="qz-q-footer">
                <button type="button" class="qz-btn-outline" id="qzPrevBtn" ${prevQ ? '' : 'disabled'}>
                  ${this.qzIcon('chevLeft', 15)} ข้อก่อนหน้า
                </button>
                <span style="font-size: 0.79rem; color: var(--qb-muted);">
                  หน้า PDF ${q.pdfPage || '-'} · ปุ่ม 1–${(q.options || []).length} หรือลูกศร ← / →
                </span>
                <button type="button" class="qz-btn-solid" id="qzNextBtn" ${nextQ ? '' : 'disabled'}>
                  ข้อถัดไป ${this.qzIcon('chevRight', 15)}
                </button>
              </div>
            </div>
          `}
        </div>
      `;

      const activeCard = document.getElementById('qzActiveCard');
      if (activeCard) this.enhanceAbbreviations(activeCard);

      document.getElementById('qzToggleMapBtn')?.addEventListener('click', () => { showMap = !showMap; renderBody(); });

      c.querySelectorAll('[data-qz-jump]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentPos = parseInt(btn.getAttribute('data-qz-jump'), 10);
          window.history.replaceState(null, '', `${cfg.baseHash}&q=${currentPos}`);
          renderBody();
        });
      });

      c.querySelectorAll('[data-qz-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          filterMode = btn.getAttribute('data-qz-mode') || 'all';
          this.state.quizFilter = filterMode;
          renderBody();
        });
      });

      c.querySelectorAll('[data-run-order]').forEach(btn => {
        btn.addEventListener('click', () => {
          const wantShuf = btn.getAttribute('data-run-order') === 'shuffle';
          if (this.state.quizShuffleOn === wantShuf) return;
          this.state.quizShuffleOn = wantShuf;
          this.saveQuizPrefs();
          qs = this.getOrderedQuestions(cfg.setKey, cfg.rawQuestions);
          currentPos = 1;
          window.history.replaceState(null, '', `${cfg.baseHash}&q=1`);
          renderBody();
        });
      });

      document.getElementById('qzReshuffleBtn')?.addEventListener('click', () => {
        this.state.quizShuffleOn = true;
        qs = this.reshuffleSet(cfg.setKey, cfg.rawQuestions);
        currentPos = 1;
        window.history.replaceState(null, '', `${cfg.baseHash}&q=1`);
        renderBody();
      });

      document.getElementById('qzToggleSimModeBtn')?.addEventListener('click', () => {
        examMode = examMode === 'instant' ? 'sim' : 'instant';
        this.state.quizExamMode = examMode;
        simSubmitted = false;
        renderBody();
      });

      document.getElementById('qzToggleTimerBtn')?.addEventListener('click', () => {
        this.state.quizTimerOn = !this.state.quizTimerOn;
        if (this.state.quizTimerOn) startTimerIfNeeded();
        else this.clearQuizTimer();
        renderBody();
      });

      const commitInstantAnswer = (question, picked) => {
        const store = getAnsStore();
        if (typeof store[question.id] === 'number') return false;
        store[question.id] = picked;
        this.state.quizAnswers[question.id] = picked;
        this.recordQuizAttempt(question, picked);
        this.saveQuizAnswers();
        return true;
      };

      const startRunnerWrongRetry = () => {
        const curAns = getAnsStore();
        const wrongOnly = qs.filter(item => typeof curAns[item.id] === 'number' && !this.isQuizChoiceCorrect(item, curAns[item.id]));
        if (wrongOnly.length) {
          this.launchRetryWrongSession(wrongOnly, `ทำใหม่ข้อที่ผิด · ${cfg.title}`);
        }
      };

      document.getElementById('qzRunnerRetryWrongBtn')?.addEventListener('click', startRunnerWrongRetry);
      document.getElementById('qzSimRetryWrongBtn')?.addEventListener('click', startRunnerWrongRetry);

      document.getElementById('qzSubmitSimBtn')?.addEventListener('click', () => {
        simSubmitted = true;
        if (sessionObj) sessionObj.simSubmitted = true;
        const qById = new Map(qs.map(item => [item.id, item]));
        Object.entries(getAnsStore()).forEach(([id, v]) => {
          this.state.quizAnswers[id] = v;
          if (qById.has(id)) this.recordQuizAttempt(qById.get(id), v);
        });
        this.saveQuizAnswers();
        this.clearQuizTimer();
        renderBody();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      document.getElementById('qzSimRestartBtn')?.addEventListener('click', () => {
        simSubmitted = false;
        if (sessionObj) {
          sessionObj.simSubmitted = false;
          sessionObj.simAnswers = {};
        } else {
          this._localSimAnswers = {};
        }
        this.state.quizTimerSec = 0;
        filterMode = 'all';
        currentPos = 1;
        startTimerIfNeeded();
        renderBody();
      });

      c.querySelectorAll('[data-qz-opt]').forEach(btn => {
        btn.addEventListener('click', () => {
          const picked = parseInt(btn.getAttribute('data-qz-opt'), 10);
          if (examMode === 'instant') {
            if (!commitInstantAnswer(q, picked)) return;
            renderBody();
            requestAnimationFrame(() => {
              document.querySelector('.qz-feedback-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
          } else if (!simSubmitted) {
            getAnsStore()[q.id] = picked;
            renderBody();
          }
        });
      });

      document.getElementById('qzRetryOneBtn')?.addEventListener('click', () => {
        delete getAnsStore()[q.id];
        if (!cfg.isRetryWrongSession) this.saveQuizAnswers();
        renderBody();
      });

      document.getElementById('qzClearChRunnerBtn')?.addEventListener('click', () => {
        const store = getAnsStore();
        qs.forEach(item => { delete store[item.id]; });
        if (examMode === 'instant' && !cfg.isRetryWrongSession) this.saveQuizAnswers();
        simSubmitted = false;
        if (sessionObj) sessionObj.simSubmitted = false;
        filterMode = 'all';
        this.state.quizFilter = 'all';
        currentPos = 1;
        renderBody();
      });

      document.getElementById('qzPrevBtn')?.addEventListener('click', () => {
        if (!prevQ) return;
        currentPos = prevQ.displayNo;
        window.history.replaceState(null, '', `${cfg.baseHash}&q=${currentPos}`);
        renderBody();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      document.getElementById('qzNextBtn')?.addEventListener('click', () => {
        if (!nextQ) return;
        currentPos = nextQ.displayNo;
        window.history.replaceState(null, '', `${cfg.baseHash}&q=${currentPos}`);
        renderBody();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      this.clearQuizKeyHandler();
      startTimerIfNeeded();
      this._quizKeyHandler = (e) => {
        if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        if (e.key === 'ArrowRight' && nextQ) {
          currentPos = nextQ.displayNo;
          window.history.replaceState(null, '', `${cfg.baseHash}&q=${currentPos}`);
          renderBody();
        } else if (e.key === 'ArrowLeft' && prevQ) {
          currentPos = prevQ.displayNo;
          window.history.replaceState(null, '', `${cfg.baseHash}&q=${currentPos}`);
          renderBody();
        } else if (/^[1-5]$/.test(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx >= 0 && idx < (q.options || []).length) {
            if (examMode === 'instant') {
              if (commitInstantAnswer(q, idx)) renderBody();
            } else if (examMode === 'sim' && !simSubmitted) {
              getAnsStore()[q.id] = idx;
              renderBody();
            }
          }
        }
      };
      window.addEventListener('keydown', this._quizKeyHandler);
    };

    renderBody();
  },

  setupAbbrTooltip() {
    if (document.getElementById('cc1AbbrTooltip')) return;
    const tip = document.createElement('div');
    tip.id = 'cc1AbbrTooltip';
    tip.className = 'cc1-abbr-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.appendChild(tip);

    let activeEl = null;
    let lastTouchTime = 0;
    const hideTip = () => {
      tip.hidden = true;
      activeEl = null;
    };
    const showTip = (el) => {
      const key = el.dataset.abbr;
      const glossary = window.CC1_ABBR_GLOSSARY || {};
      const meaning = glossary[key];
      if (!meaning) return;
      activeEl = el;
      const [enPart, thPart] = meaning.split(' — ');
      tip.innerHTML = `<span class="cc1-abbr-tip-key">${key}</span><span class="cc1-abbr-tip-en">${enPart || ''}</span>${thPart ? `<span class="cc1-abbr-tip-th">${thPart}</span>` : ''}`;
      tip.hidden = false;

      const rect = el.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();
      const pad = 10;
      let left = rect.left + rect.width / 2 - tipRect.width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - tipRect.width - pad));
      let top = rect.top - tipRect.height - 8;
      if (top < pad) {
        top = rect.bottom + 8;
      }
      tip.style.left = `${Math.round(left)}px`;
      tip.style.top = `${Math.round(top)}px`;
    };

    document.addEventListener('touchstart', () => {
      lastTouchTime = Date.now();
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const abbr = e.target.closest('abbr.cc1-abbr');
      if (abbr) showTip(abbr);
    });
    document.addEventListener('pointerout', (e) => {
      if (e.pointerType !== 'mouse') return;
      const abbr = e.target.closest('abbr.cc1-abbr');
      if (abbr && abbr === activeEl) hideTip();
    });
    document.addEventListener('focusin', (e) => {
      if (Date.now() - lastTouchTime < 600) return;
      const abbr = e.target.closest('abbr.cc1-abbr');
      if (abbr) showTip(abbr);
    });
    document.addEventListener('focusout', (e) => {
      if (Date.now() - lastTouchTime < 600) return;
      if (e.target.closest('abbr.cc1-abbr')) hideTip();
    });
    document.addEventListener('click', (e) => {
      const abbr = e.target.closest('abbr.cc1-abbr');
      if (abbr) {
        e.preventDefault();
        e.stopPropagation();
        if (!tip.hidden && activeEl === abbr) hideTip();
        else showTip(abbr);
      } else if (!tip.hidden) {
        hideTip();
      }
    });
    window.addEventListener('scroll', hideTip, { passive: true });
  },

  enhanceAbbreviations(rootEl) {
    const glossary = window.CC1_ABBR_GLOSSARY;
    if (!rootEl || !glossary) return;
    const keys = Object.keys(glossary).sort((a, b) => b.length - a.length);
    if (!keys.length) return;
    if (!this._abbrRegex) {
      const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      this._abbrRegex = new RegExp(`(?<![A-Za-z0-9\\-])(${escaped.join('|')})(?![A-Za-z0-9\\-])`, 'g');
    }
    const regex = this._abbrRegex;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('aside, script, style, code, pre, svg, a, button, abbr, mark, input, textarea, select, h1, h2, h3')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);

    textNodes.forEach(node => {
      const text = node.nodeValue;
      regex.lastIndex = 0;
      if (!regex.test(text)) return;
      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const abbr = document.createElement('abbr');
        abbr.className = 'cc1-abbr';
        abbr.dataset.abbr = match[1];
        abbr.tabIndex = 0;
        abbr.textContent = match[1];
        frag.appendChild(abbr);
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      node.parentNode.replaceChild(frag, node);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
