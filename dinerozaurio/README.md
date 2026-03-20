<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DineroZaurio</title>
  <link rel="stylesheet" href="./styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div id="authGate" class="auth-gate">
    <div class="auth-card">
      <h1>DineroZaurio</h1>
      <p>Planificador visual de deudas, gastos, ingresos y ahorro.</p>
      <button id="googleLoginBtn" class="btn primary">Entrar con Google</button>
      <p class="muted">Tus datos se guardan en tu cuenta.</p>
    </div>
  </div>

  <div id="app" class="app hidden">
    <header class="topbar">
      <div>
        <h1>DineroZaurio</h1>
        <p class="muted">Configuración y previsión con Supabase</p>
      </div>
      <div class="topbar-actions">
        <span id="userEmail" class="pill"></span>
        <button id="saveAllBtn" class="btn">Guardar</button>
        <button id="syncBtn" class="btn">Recargar</button>
        <button id="logoutBtn" class="btn danger">Salir</button>
      </div>
    </header>

    <nav class="tabs">
      <button class="tab active" data-tab="config">Configuración</button>
      <button class="tab" data-tab="forecast">Previsión</button>
    </nav>

    <section id="tab-config" class="tab-panel">
      <div class="summary-grid">
        <div class="summary-card"><span>Ingreso base</span><strong id="sumIncome">0 €</strong></div>
        <div class="summary-card"><span>Gasto base</span><strong id="sumExpense">0 €</strong></div>
        <div class="summary-card"><span>Deuda base</span><strong id="sumDebt">0 €</strong></div>
        <div class="summary-card"><span>Margen base</span><strong id="sumMargin">0 €</strong></div>
      </div>

      <div class="grid">
        <section class="panel">
          <div class="panel-head">
            <div><h2>Ingresos</h2><p class="muted">Sueldo, bonus, side income, etc.</p></div>
            <button id="addIncomeBtn" class="btn primary">+ Añadir</button>
          </div>
          <div id="incomeList" class="list"></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div><h2>Gastos</h2><p class="muted">Fijos y variables con periodicidad.</p></div>
            <button id="addExpenseBtn" class="btn primary">+ Añadir</button>
          </div>
          <div id="expenseList" class="list"></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div><h2>Deudas</h2><p class="muted">Préstamos y tarjetas.</p></div>
            <button id="addDebtBtn" class="btn primary">+ Añadir</button>
          </div>
          <div id="debtList" class="list"></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div><h2>Objetivos de ahorro</h2><p class="muted">Ahorro 1 y ahorro 2 o los que quieras.</p></div>
            <button id="addGoalBtn" class="btn primary">+ Añadir</button>
          </div>
          <div id="goalList" class="list"></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div><h2>Plan</h2><p class="muted">Datos globales del plan.</p></div>
          </div>
          <div class="form-grid">
            <label><span>Nombre del plan</span><input id="planNameInput" type="text" placeholder="Plan principal" /></label>
            <label><span>Colchón inicial</span><input id="initialReserveInput" type="number" step="0.01" /></label>
            <label><span>Mes inicio por defecto</span><input id="defaultStartMonthInput" type="month" /></label>
          </div>
        </section>
      </div>
    </section>

    <section id="tab-forecast" class="tab-panel hidden">
      <section class="panel">
        <div class="forecast-toolbar">
          <label><span>Desde</span><input id="forecastFrom" type="month"></label>
          <label><span>Hasta</span><input id="forecastTo" type="month"></label>
          <label><span>Ahorro 1</span><select id="forecastGoal1"></select></label>
          <label><span>Ahorro 2</span><select id="forecastGoal2"></select></label>
          <div class="toolbar-actions"><button id="generateForecastBtn" class="btn primary">Generar</button></div>
        </div>
        <div class="summary-grid">
          <div class="summary-card"><span>Sobrante total</span><strong id="forecastNet">0 €</strong></div>
          <div class="summary-card"><span>Recuperado total</span><strong id="forecastRecovered">0 €</strong></div>
          <div class="summary-card"><span>Ahorro 1 acumulado</span><strong id="forecastGoal1Total">0 €</strong></div>
          <div class="summary-card"><span>Ahorro 2 acumulado</span><strong id="forecastGoal2Total">0 €</strong></div>
        </div>
      </section>
      <div id="monthsGrid" class="months-grid"></div>
    </section>
  </div>

  <div id="modalRoot" class="modal-root hidden"></div>
  <script type="module" src="./js/app.js"></script>
</body>
</html>
