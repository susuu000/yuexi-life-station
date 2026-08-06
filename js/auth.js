/* ============================================
   auth.js - 邮箱登录 / 注册 UI（Supabase Auth）
   ============================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const configured = typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.includes('YOUR-');
  let mode = 'signin';
  let skipped = false;
  const overlay = $('authOverlay');

  function openAuthModal(m) {
    mode = m || 'signin';
    setMode(mode);
    clearError();
    overlay.style.display = '';          // 移除内联样式，让 .show 类生效
    overlay.classList.add('show');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
    setTimeout(() => { const e = $('authEmail'); if (e) e.focus(); }, 50);
  }
  function closeAuthModal() {
    overlay.classList.remove('show');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  }

  function setMode(m) {
    mode = m;
    $('tabSignin').classList.toggle('active', m === 'signin');
    $('tabSignup').classList.toggle('active', m === 'signup');
    $('authTitle').textContent = m === 'signin' ? '登录云端账户' : '注册云端账户';
    $('authSubmit').textContent = m === 'signin' ? '登录' : '注册并登录';
    $('authHint').textContent = m === 'signup'
      ? '注册后数据将安全地保存在你的 Supabase 云端，支持手机 / 网页多设备同步。'
      : '';
    $('authPassword').setAttribute('autocomplete', m === 'signin' ? 'current-password' : 'new-password');
  }
  function clearError() { $('authError').textContent = ''; }
  function showError(msg) { $('authError').textContent = msg; }

  async function submit() {
    clearError();
    const email = ($('authEmail').value || '').trim();
    const pw = $('authPassword').value || '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showError('请输入有效邮箱'); return; }
    if (pw.length < 6) { showError('密码至少 6 位'); return; }

    const btn = $('authSubmit');
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = '处理中...';
    try {
      if (mode === 'signup') {
        await Sync.signUp(email, pw);
        if (!Sync.isOnline()) {
          // 开启了邮件确认：session 为空，需先验证
          showError('注册成功！请前往邮箱完成验证，然后回到这里登录。');
          setMode('signin');
          btn.disabled = false; btn.textContent = '登录';
          return;
        }
      } else {
        await Sync.signIn(email, pw);
      }
      closeAuthModal();
      // 首次登录：把本机已有数据上传到云端（迁移），并拉取其他设备数据
      if (Sync.isOnline()) { Sync.syncNow(); }
      else if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ 已登录');
    } catch (e) {
      showError((e && e.message) ? e.message : '操作失败，请重试');
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }

  function logout() {
    Sync.signOut();
    if (typeof App !== 'undefined' && App.showToast) App.showToast('已退出登录（本机数据仍保留）');
  }

  // 事件绑定
  $('tabSignin').addEventListener('click', () => setMode('signin'));
  $('tabSignup').addEventListener('click', () => setMode('signup'));
  $('authSubmit').addEventListener('click', submit);
  $('authClose').addEventListener('click', closeAuthModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAuthModal(); });
  $('authSkip').addEventListener('click', () => {
    skipped = true; closeAuthModal();
    if (typeof App !== 'undefined' && App.showToast) App.showToast('仅本机使用：数据存于当前浏览器');
  });
  $('accountBtn').addEventListener('click', () => {
    if (Sync.isOnline()) {
      if (window.confirm('当前已登录：' + (Sync.user && Sync.user.email ? Sync.user.email : '') + '\n确定要退出登录吗？')) logout();
    } else {
      openAuthModal('signin');
    }
  });

  // 与 Sync 联动
  Sync.onNeedAuth = () => openAuthModal('signin');
  Sync.onAuthChange((user) => {
    updateAccountBtn(user);
    if (user) closeAuthModal();
  });

  function updateAccountBtn(user) {
    const span = document.querySelector('#accountBtn span');
    if (span) span.textContent = user ? (user.email || '账户') : '我的账户';
  }

  // 启动后给出引导；但【绝不自动弹出遮挡式登录框】——
  // 应用本身以本机存储为首选，未登录也应完全可用（否则会拦截所有点击，导致「点击阅读无反应」等问题）。
  // 登录仅在用户主动点击「我的账户」或触发同步时才弹出。
  if (!configured) {
    setTimeout(() => {
      if (typeof App !== 'undefined' && App.showToast)
        App.showToast('未配置 Supabase，当前仅本机使用（见 README）', 4000);
    }, 1500);
  } else {
    setTimeout(() => {
      if (!skipped && !Sync.isOnline() && typeof App !== 'undefined' && App.showToast)
        App.showToast('未登录云端 · 点「我的账户」可登录同步（也可仅本机使用）', 4500);
    }, 1800);
  }
})();
