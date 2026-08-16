(() => {
  const STORAGE_KEY = 'dinerozaurio_budget_period_mode_v1';
  const VALID_MODES = new Set(['salary_cycle', 'calendar_month']);
  const MARKER = 'budget-period-sync-1';

  window.__DINEROZAURIO_BUDGET_PERIOD_SYNC__ = MARKER;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function waitForRuntime() {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const select = document.getElementById('budgetPeriodMode');
      if (window.dzSupabase && select) return select;
      await sleep(50);
    }
    return null;
  }

  function normalizeMode(value) {
    return VALID_MODES.has(value) ? value : null;
  }

  function applyModeToUi(select, mode) {
    if (!mode) return;
    localStorage.setItem(STORAGE_KEY, mode);
    if (select.value !== mode) {
      select.value = mode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  async function getCurrentPlan() {
    const { data: authData, error: authError } = await window.dzSupabase.auth.getUser();
    if (authError || !authData?.user?.id) return null;

    const { data, error } = await window.dzSupabase
      .from('plans')
      .select('id,budget_period_mode')
      .eq('user_id', authData.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('DineroZaurio: no se pudo leer budget_period_mode', error);
      return null;
    }
    return data || null;
  }

  async function persistMode(planId, mode) {
    if (!planId || !normalizeMode(mode)) return;
    const { error } = await window.dzSupabase
      .from('plans')
      .update({ budget_period_mode: mode })
      .eq('id', planId);
    if (error) console.warn('DineroZaurio: no se pudo guardar budget_period_mode', error);
  }

  async function init() {
    const select = await waitForRuntime();
    if (!select) return;

    const plan = await getCurrentPlan();
    if (!plan?.id) return;

    const remoteMode = normalizeMode(plan.budget_period_mode);
    const localMode = normalizeMode(localStorage.getItem(STORAGE_KEY));
    const uiMode = normalizeMode(select.value);

    if (remoteMode) {
      applyModeToUi(select, remoteMode);
    } else {
      const migrationMode = localMode || uiMode || 'salary_cycle';
      applyModeToUi(select, migrationMode);
      await persistMode(plan.id, migrationMode);
    }

    select.addEventListener('change', () => {
      const nextMode = normalizeMode(select.value);
      if (!nextMode) return;
      localStorage.setItem(STORAGE_KEY, nextMode);
      void persistMode(plan.id, nextMode);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void init(), { once: true });
  } else {
    void init();
  }
})();
