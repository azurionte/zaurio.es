const SUPABASE_URL = "https://adpjitccwwvlydrtvvqk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D8CL0HI8vLfD5L3g5ZgUGg_HOM6Ixdk";
const APP_PATH = "/velocichef";
const APP_BASE_URL = `${window.location.origin}${APP_PATH}/`;
const APP_ASSET_PATH = `${APP_PATH}/assets`;
const APP_LOGO_PATH = `${APP_ASSET_PATH}/logo.png`;
const APP_MINI_LOGO_PATH = `${APP_ASSET_PATH}/mini_logo.png`;
const APP_STORE_ICON_PATH = `${APP_ASSET_PATH}/store_icon.png`;
const ZAURIO_MENU_LOGO_PATH = "/shared/assets/brand/favicon-32x32.png";
const PUSH_PUBLIC_KEY_ENDPOINT = "/api/velocichef/push-public-key";
const STEP_IMAGE_ENDPOINT = "/api/velocichef/step-image";
const DEFAULT_REMINDER_LEAD_MINUTES = 75;
const APP_VERSION_META = window.__VELOCICHEF_VERSION__ || {
  major: 1,
  minor: 2,
  build: "0000000000",
  label: "1.2.0000000000",
};
const APP_VERSION_LABEL = `Version ${APP_VERSION_META.label || "1.2.0000000000"}`;
const ZAURIO_DESTINATIONS = [
  {
    href: "https://zaurio.es",
    label: "Inicio",
    icon: "/shared/assets/brand/favicon-32x32.png",
  },
  {
    href: "https://miercoles.zaurio.es",
    label: "Miercoles",
    icon: "/shared/assets/brand/miercoles.png",
  },
  {
    href: "https://secretos.zaurio.es",
    label: "Secretos",
    icon: "/shared/assets/brand/confesion.png",
  },
  {
    href: "https://herramientas.zaurio.es",
    label: "Herramientas",
    icon: "/shared/assets/brand/emprezaurio-icono.png",
  },
  {
    href: "https://juegos.zaurio.es",
    label: "Juegos",
    icon: "/shared/assets/brand/trivialodon-icono.png",
  },
];

const ALLERGY_OPTIONS = [
  "Gluten",
  "Lactosa",
  "Frutos secos",
  "Cacahuetes",
  "Marisco",
  "Pescado",
  "Huevo",
  "Soja",
  "Sésamo",
];

const LIKE_OPTIONS = [
  "Pasta",
  "Arroz",
  "Pollo",
  "Pescado",
  "Legumbres",
  "Verduras al horno",
  "Huevos",
  "Cremas y sopas",
  "Bocadillos potentes",
  "Cocina mediterránea",
  "Sabores asiáticos suaves",
  "Picoteo saludable",
];

const DISLIKE_OPTIONS = [
  "Brócoli",
  "Coliflor",
  "Remolacha",
  "Hígado",
  "Setas",
  "Berenjena",
  "Pepino",
  "Cilantro",
  "Comida muy picante",
  "Texturas cremosas",
  "Platos demasiado secos",
  "Comidas repetitivas",
];

const GOAL_OPTIONS = [
  "Comer balanceado",
  "Comer variado",
  "Mantenerme en peso",
  "Bajar de peso",
  "Subir de peso",
  "Añadir más verduras",
  "Añadir más proteína",
  "Comer con menos sal",
  "Reducir azúcares",
  "Evitar gluten",
  "Evitar semillas",
  "Evitar lácteos",
  "Comer más fibra",
  "Tener más energía",
  "Gastar menos en el súper",
  "Aprovechar sobras",
];

const COOKING_STYLE_OPTIONS = [
  {
    key: "simple",
    label: "Quiero cosas sencillas",
    hint: "Poco tiempo, pasos claros y cero dramas entre semana.",
  },
  {
    key: "balanced",
    label: "Me apaño con nivel medio",
    hint: "La mayoría fácil, pero algún plato con un poco más de gracia.",
  },
  {
    key: "challenging",
    label: "Soy cocinillas",
    hint: "Acepto alguna receta de dificultad media o alta si merece la pena.",
  },
];

const MEAL_OPTIONS = [
  { key: "breakfast", label: "Desayuno", icon: "\u2600\uFE0F", hint: "Algo práctico para empezar con buen pie." },
  { key: "lunch", label: "Almuerzo", icon: "\uD83C\uDF72", hint: "El plato fuerte del mediodía." },
  { key: "snack", label: "Merienda", icon: "\uD83C\uDF4E", hint: "Un apoyo entre horas." },
  { key: "dinner", label: "Cena", icon: "\uD83C\uDF19", hint: "Algo rico y asumible al final del día." },
  { key: "bites", label: "Colaciones", icon: "\uD83E\uDD5C", hint: "Pequeñas opciones para picar entre comidas." },
];

const COOKING_FEEDBACK_REASON_OPTIONS = [
  { key: "steps_not_precise", label: "Los pasos no eran precisos", hint: "Faltaban detalles o quedaban ambiguos." },
  { key: "quantities_not_precise", label: "Las cantidades no eran precisas", hint: "Algo no cuadraba con la receta real." },
  { key: "cooking_details_missing", label: "Faltaban detalles de cocción", hint: "Temperatura, punto o utensilio poco claros." },
  { key: "time_not_realistic", label: "El tiempo no era realista", hint: "Tardé bastante más o bastante menos." },
  { key: "difficulty_mismatch", label: "La dificultad no encajaba", hint: "Era más fácil o más difícil de lo esperado." },
  { key: "result_not_tasty", label: "El resultado no me convenció", hint: "No repetiría el plato tal como estaba." },
  { key: "visuals_not_helpful", label: "Las ilustraciones no ayudaban", hint: "La imagen no explicaba bien el paso." },
  { key: "too_long", label: "Se hizo demasiado largo", hint: "Demasiados pasos o demasiado tiempo seguido." },
];

const MEAL_LABELS = Object.fromEntries(MEAL_OPTIONS.map((item) => [item.key, item.label]));
const COOKING_FEEDBACK_REASON_LABELS = Object.fromEntries(
  COOKING_FEEDBACK_REASON_OPTIONS.map((item) => [item.key, item.label]),
);

const PRICE_COMPARISON_SUBTITLES = [
  "Estoy buscando los mejores precios en Carrefour, Mercadona, Bon Preu y Charter.",
  "Buscando las mejores ofertas para ahorrar en la compra.",
  "Analizando precios como un experto en no romper la hucha.",
  "Comparando ofertas para que tu bolsillo sonría.",
  "Investigando descuentos y promociones especiales.",
  "Calculando el mejor supermercado para tu lista.",
  "Explorando gangas y precios irresistibles.",
  "Optimizando tu compra para máxima eficiencia.",
  "Descubriendo ahorros ocultos en los estantes.",
  "Evaluando opciones para una compra inteligente.",
  "Buscando precios que hagan bailar a tu cartera.",
  "Analizando mercados para encontrar el tesoro.",
  "Comparando costes como un detective financiero.",
  "Descifrando códigos de barras y precios bajos.",
  "Explorando el mundo de las ofertas económicas.",
];

const REFINEMENT_REASON_OPTIONS = [
  { key: "ingredients", label: "No me gustan algunos ingredientes" },
  { key: "difficulty", label: "Es muy difícil" },
  { key: "time", label: "Lleva demasiado tiempo" },
];

const DEFAULT_MEAL_CLOCK = {
  breakfast: "08:00",
  bites: "11:30",
  lunch: "14:30",
  snack: "17:30",
  dinner: "21:00",
};

const COOKING_GLOSSARY = [
  {
    key: "juliana",
    phrase: "corta en juliana",
    title: "Cortar en juliana",
    body: "Significa hacer tiras finas y alargadas. Piensa en bastoncitos delgados para que el ingrediente se cocine rápido y quede uniforme.",
  },
  {
    key: "picar-fino",
    phrase: "pica fino",
    title: "Picar fino",
    body: "Es cortar en trozos pequeños y regulares. Va bien cuando quieres que el ingrediente se reparta por todo el plato sin dominar cada bocado.",
  },
  {
    key: "sofreir",
    phrase: "sofríe",
    title: "Sofreír",
    body: "Es cocinar a fuego medio con un poco de grasa hasta que el ingrediente se ablande y gane sabor sin llegar a quemarse.",
  },
  {
    key: "fuego-lento",
    phrase: "a fuego lento",
    title: "Cocinar a fuego lento",
    body: "Es mantener una cocción suave, con burbujas pequeñas. Sirve para que el sabor se concentre sin que el fondo se agarre.",
  },
  {
    key: "dorar",
    phrase: "dora",
    title: "Dorar",
    body: "Es cocinar lo justo para que la superficie tome color tostado. Ese color aporta aroma y un sabor más profundo.",
  },
  {
    key: "reservar",
    phrase: "reserva",
    title: "Reservar",
    body: "Solo significa apartar ese ingrediente por un momento para usarlo después, sin seguir cocinándolo.",
  },
];

const root = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const urlParams = new URLSearchParams(window.location.search);

const state = {
  client: null,
  session: null,
  profile: null,
  week: null,
  feedback: [],
  onboardingStep: 0,
  currentView: normalizeView(urlParams.get("view") || "home"),
  loading: true,
  busy: false,
  busyLabel: "",
  notice: "",
  error: "",
  activeMenu: null,
  storageMode: "supabase",
  modal: null,
  workerRegistration: null,
  reminderTimers: [],
  cooking: null,
  speechRecognition: null,
  timerTicker: null,
  notificationDevice: null,
  notificationTab: urlParams.get("tab") === "future" ? "future" : "pending",
  pendingReminderLink: null,
  pendingCookingRecovery: null,
  activeNotificationBannerId: null,
  profileSections: {
    basics: true,
    allergies: false,
    tastes: false,
    goals: false,
    household: false,
    plan: false,
    notifications: false,
  },
  priceComparison: {
    loading: false,
    results: null,
    error: null,
  },
};
let cookingMicHintTimer = null;
let notificationBannerTimer = null;
let systemBannerTimer = null;
let activeSystemBannerKey = "";
let cookingSnapshotSyncTimer = null;
let lastPushAutoRepairAt = 0;
let lastRenderedPageIdentity = "";
let historyInitialized = false;
let lastHistoryUrl = "";
let isRestoringHistory = false;
let remoteReminderRefreshPromise = null;
let lastRemoteReminderRefreshAt = 0;
let wakeLockSentinel = null;
let wakeLockRequestPromise = null;
let lastWakeLockErrorAt = 0;
const COOKING_RECOVERY_MAX_AGE_MS = 1000 * 60 * 60 * 18;
const PUSH_AUTO_REPAIR_MIN_INTERVAL_MS = 1000 * 45;
const PUSH_EXPIRY_WARNING_MS = 1000 * 60 * 60 * 24 * 3;
const PUSH_DEVICE_TAG_PREFIX = "vc-device:";

function normalizeView(view) {
  const valid = new Set(["home", "week", "schedule", "shopping", "today-shopping", "recipes", "profile", "notifications", "onboarding", "cook"]);
  return valid.has(view) ? view : "home";
}

function getCurrentPageIdentity() {
  if (state.loading) return "loading";
  if (!state.session) return "landing";
  if (!state.profile?.onboardingCompleted || state.currentView === "onboarding") {
    return `onboarding:${state.onboardingStep}`;
  }
  if (state.currentView === "cook") {
    return `cook:${state.cooking?.mode || "idle"}`;
  }
  return `workspace:${state.currentView}`;
}

function scrollViewportToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const app = document.querySelector(".vc-app");
  if (app) app.scrollTop = 0;
}

function createId() {
  return crypto.randomUUID();
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUiCopy(value) {
  return String(value || "")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã‘/g, "Ñ")
    .replace(/Â¿/g, "¿")
    .replace(/Â¡/g, "¡")
    .replace(/Â·/g, " · ")
    .replace(/â˜€ï¸/g, "☀️")
    .replace(/ðŸ²/g, "🍲")
    .replace(/ðŸŽ/g, "🍎")
    .replace(/ðŸŒ™/g, "🌙")
    .replace(/ðŸ¥œ/g, "🥜")
    .replace(/ÃƒÆ’Ã‚Â¡|ÃƒÂ¡/g, "á")
    .replace(/ÃƒÆ’Ã‚Â©|ÃƒÂ©/g, "é")
    .replace(/ÃƒÆ’Ã‚Â­|ÃƒÂ­/g, "í")
    .replace(/ÃƒÆ’Ã‚Â³|ÃƒÂ³/g, "ó")
    .replace(/ÃƒÆ’Ã‚Âº|ÃƒÂº/g, "ú")
    .replace(/ÃƒÆ’Ã‚Â±|ÃƒÂ±/g, "ñ")
    .replace(/ÃƒÆ’Ã‚Â|ÃƒÂ/g, "Á")
    .replace(/ÃƒÆ’Ã‚â€°|Ãƒâ€°/g, "É")
    .replace(/ÃƒÆ’Ã‚Â|ÃƒÂ/g, "Í")
    .replace(/ÃƒÆ’Ã‚â€œ|Ãƒâ€œ/g, "Ó")
    .replace(/ÃƒÆ’Ã‚Å¡|ÃƒÅ¡/g, "Ú")
    .replace(/ÃƒÆ’Ã‚â€˜|Ãƒâ€˜/g, "Ñ")
    .replace(/Ã‚Â¿/g, "¿")
    .replace(/Ã‚Â¡/g, "¡")
    .replace(/Ã‚/g, "")
    .replace(/Ãƒâ€š/g, "")
    .replace(/Ã¢Ëœâ‚¬Ã¯Â¸Â/g, "☀️")
    .replace(/Ã°Å¸ÂÂ²/g, "🍲")
    .replace(/Ã°Å¸ÂÅ½/g, "🍎")
    .replace(/Ã°Å¸Å’â„¢/g, "🌙")
    .replace(/Ã°Å¸Â¥Å“/g, "🥜")
    .replace(/Ãƒâ€šÃ‚Â·|Ã‚Â·/g, " Â· ")
    .replace(/â˜°/g, "☰")
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, "\"")
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢Å“â€¢|âœ•|✖|✕/g, "×")
    .replace(/Google login/gi, "Acceso seguro")
    .replace(/Gemini/gi, "VelociChef")
    .replace(/Supabase/gi, "tu cocina")
    .replace(/Push API/gi, "avisos del dispositivo")
    .replace(/Detalle tecnico:\s*/gi, "")
    .replace(/Push activo/gi, "Avisos activos")
    .replace(/push real/gi, "avisos del dispositivo")
    .replace(/opciÃ³n local/gi, "opciÃ³n de apoyo")
    .replace(/sistema local/gi, "sistema de apoyo")
    .replace(/recordatorio local/gi, "recordatorio de apoyo");
}

function uniqueValues(values) {
  return Array.from(new Set((values || []).filter(Boolean).map((item) => String(item).trim()).filter(Boolean)));
}

function decodeMojibakeText(value) {
  let current = String(value || "");
  if (!/[ÃÂâðïÕ]/.test(current)) {
    return current.replace(/âœ•|✖|✕/g, "×");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const cleaned = current.replace(/Ã‚/g, "").replace(/Â/g, "");
    try {
      const bytes = Uint8Array.from(Array.from(cleaned, (character) => character.charCodeAt(0) & 255));
      const decoded = new TextDecoder("utf-8").decode(bytes);
      if (decoded && !/\uFFFD/.test(decoded) && decoded !== current) {
        current = decoded;
        continue;
      }
      current = cleaned;
      break;
    } catch (_error) {
      current = cleaned;
      break;
    }
  }

  return sanitizeUiCopy(current)
    .replace(/Õ¿/g, "á")
    .replace(/âœ•|✖|✕/g, "×");
}

function repairVisibleText(container) {
  if (!container) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const nextValue = decodeMojibakeText(current.textContent || "");
    if (nextValue !== current.textContent) {
      current.textContent = nextValue;
    }
    current = walker.nextNode();
  }
}

function getUserLabel(user) {
  const meta = user?.user_metadata || {};
  const full = meta.full_name || meta.name || user?.email || "Chef";
  return String(full).trim();
}

function getUserShortLabel(user) {
  const source = state.profile?.displayName || getUserLabel(user);
  return String(source || "Chef").trim().split(/\s+/)[0] || "Chef";
}

function getUserAvatarUrl(user) {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || meta.photo_url || "";
}

function getUserInitial(user) {
  return getUserShortLabel(user).slice(0, 1).toUpperCase() || "C";
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";
}

function getTomorrowIso() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function fromIsoDate(dateString) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

function addDays(isoDate, amount) {
  const date = fromIsoDate(isoDate);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

function compareIsoDate(a, b) {
  return new Date(`${a}T12:00:00`).getTime() - new Date(`${b}T12:00:00`).getTime();
}

function getActivePlanningStartIso() {
  return getTomorrowIso();
}

function isIsoDateWithinRange(targetDate, startDate, endDate) {
  return compareIsoDate(targetDate, startDate) >= 0 && compareIsoDate(targetDate, endDate) <= 0;
}

function isCurrentPlanningWeek(week) {
  if (!week?.startDate || !week?.endDate) return false;
  const activeStart = getActivePlanningStartIso();
  return compareIsoDate(week.startDate, activeStart) === 0 || isIsoDateWithinRange(activeStart, week.startDate, week.endDate);
}

function formatDateLong(isoDate) {
  return fromIsoDate(isoDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function friendlyDayLabel(isoDate, startDate) {
  if (isoDate === startDate) return "Mañana";
  const diff = Math.round((fromIsoDate(isoDate) - fromIsoDate(startDate)) / 86400000);
  if (diff === 1) return "Pasado mañana";
  const formatted = formatDateLong(isoDate);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTime(time) {
  return time || "--:--";
}

function formatDateTimeLong(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInputTimeFromIso(isoString) {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function buildDefaultProfile(user) {
  return syncHouseholdMembers({
    displayName: getUserLabel(user),
    allergies: [],
    allergyNotes: "",
    likes: [],
    dislikes: [],
    dietaryNotes: "",
    cookingStyle: "balanced",
    goalTags: ["Comer balanceado", "Comer variado"],
    householdCount: 1,
    householdMembers: [
      {
        id: createId(),
        name: "Yo",
        sameAsMe: true,
        notes: "",
      },
    ],
    plannedMeals: ["breakfast", "lunch", "dinner"],
    lunchPrepNightBefore: false,
    breakfastTime: "08:00",
    snackTime: "17:30",
    lunchTime: "14:30",
    dinnerTime: "21:00",
    reminderLeadMinutes: DEFAULT_REMINDER_LEAD_MINUTES,
    timezone: getTimezone(),
    onboardingCompleted: false,
    notificationEnabled: false,
    freezeNotificationsEnabled: false,
  });
}

function syncHouseholdMembers(profile) {
  const count = Math.max(1, Number(profile.householdCount || 1));
  const current = Array.isArray(profile.householdMembers) ? [...profile.householdMembers] : [];
  const next = [];

  for (let index = 0; index < count; index += 1) {
    const existing = current[index];
    next.push({
      id: existing?.id || createId(),
      name: existing?.name || (index === 0 ? "Yo" : `Persona ${index + 1}`),
      sameAsMe: existing?.sameAsMe !== false,
      notes: existing?.notes || "",
    });
  }

  profile.householdMembers = next;
  profile.householdCount = count;
  return profile;
}

function serializeProfile(userId, profile) {
  return {
    user_id: userId,
    display_name: profile.displayName,
    allergies: uniqueValues(profile.allergies),
    allergy_notes: profile.allergyNotes || "",
    likes: uniqueValues(profile.likes),
    dislikes: uniqueValues(profile.dislikes),
    dietary_notes: profile.dietaryNotes || "",
    cooking_style: profile.cookingStyle,
    goal_tags: uniqueValues(profile.goalTags),
    household_count: Number(profile.householdCount || 1),
    household_members: syncHouseholdMembers({ ...profile }).householdMembers,
    planned_meals: uniqueValues(profile.plannedMeals),
    lunch_prep_night_before: !!profile.lunchPrepNightBefore,
    breakfast_time: profile.breakfastTime || null,
    snack_time: profile.snackTime || null,
    lunch_time: profile.lunchTime || null,
    dinner_time: profile.dinnerTime || null,
    reminder_lead_minutes: Number(profile.reminderLeadMinutes || DEFAULT_REMINDER_LEAD_MINUTES),
    timezone: profile.timezone || getTimezone(),
    onboarding_completed: !!profile.onboardingCompleted,
    notification_enabled: !!profile.notificationEnabled,
    freeze_notifications_enabled: !!profile.freezeNotificationsEnabled,
    updated_at: new Date().toISOString(),
  };
}

function deserializeProfile(user, row) {
  return syncHouseholdMembers({
    displayName: row?.display_name || getUserLabel(user),
    allergies: uniqueValues(row?.allergies || []),
    allergyNotes: row?.allergy_notes || "",
    likes: uniqueValues(row?.likes || []),
    dislikes: uniqueValues(row?.dislikes || []),
    dietaryNotes: row?.dietary_notes || "",
    cookingStyle: row?.cooking_style || "balanced",
    goalTags: uniqueValues(row?.goal_tags || []),
    householdCount: Number(row?.household_count || 1),
    householdMembers: Array.isArray(row?.household_members) ? row.household_members : [],
    plannedMeals: uniqueValues(row?.planned_meals || ["breakfast", "lunch", "dinner"]),
    lunchPrepNightBefore: !!row?.lunch_prep_night_before,
    breakfastTime: row?.breakfast_time || "08:00",
    snackTime: row?.snack_time || "17:30",
    lunchTime: row?.lunch_time || "14:30",
    dinnerTime: row?.dinner_time || "21:00",
    reminderLeadMinutes: Number(row?.reminder_lead_minutes || DEFAULT_REMINDER_LEAD_MINUTES),
    timezone: row?.timezone || getTimezone(),
    onboardingCompleted: !!row?.onboarding_completed,
    notificationEnabled: !!row?.notification_enabled,
    freezeNotificationsEnabled: !!row?.freeze_notifications_enabled,
  });
}

function serializeWeek(userId, week) {
  return {
    id: week.id,
    user_id: userId,
    start_date: week.startDate,
    end_date: week.endDate,
    status: week.status || "draft",
    shopping_completed: !!week.shoppingCompleted,
    freeze_prompt_answered: !!week.freezePromptAnswered,
    week_payload: week,
    updated_at: new Date().toISOString(),
  };
}

function getLocalKey(kind) {
  return `velocichef:${kind}:${state.session?.user?.id || "guest"}`;
}

function readLocal(kind, fallback = null) {
  try {
    const raw = localStorage.getItem(getLocalKey(kind));
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeLocal(kind, value) {
  try {
    localStorage.setItem(getLocalKey(kind), JSON.stringify(value));
  } catch (error) {
    // Ignoramos errores de almacenamiento local.
  }
}

function removeLocal(kind) {
  try {
    localStorage.removeItem(getLocalKey(kind));
  } catch (error) {
    // Ignoramos errores de almacenamiento local.
  }
}

function canUseWakeLock() {
  return !!(typeof navigator !== "undefined" && navigator.wakeLock && typeof navigator.wakeLock.request === "function");
}

function shouldKeepScreenAwake() {
  if (typeof document === "undefined" || document.visibilityState !== "visible") return false;
  if (state.busy) return true;
  return state.currentView === "cook" && state.cooking?.mode === "active" && !!getCookingTarget();
}

async function requestScreenWakeLock() {
  if (!canUseWakeLock() || wakeLockSentinel || wakeLockRequestPromise || !shouldKeepScreenAwake()) {
    return !!wakeLockSentinel;
  }

  wakeLockRequestPromise = navigator.wakeLock.request("screen")
    .then((sentinel) => {
      wakeLockSentinel = sentinel;
      sentinel.addEventListener("release", () => {
        if (wakeLockSentinel === sentinel) {
          wakeLockSentinel = null;
        }
        if (shouldKeepScreenAwake()) {
          void requestScreenWakeLock();
        }
      }, { once: true });
      return true;
    })
    .catch((error) => {
      const now = Date.now();
      if (now - lastWakeLockErrorAt > 60000) {
        console.warn("[VelociChef] No pude mantener la pantalla activa.", error);
        lastWakeLockErrorAt = now;
      }
      return false;
    })
    .finally(() => {
      wakeLockRequestPromise = null;
    });

  return wakeLockRequestPromise;
}

async function releaseScreenWakeLock() {
  const sentinel = wakeLockSentinel;
  wakeLockSentinel = null;
  if (!sentinel) return;
  try {
    await sentinel.release();
  } catch (_error) {
    // Si el sistema ya lo liberó, no necesitamos hacer nada más.
  }
}

function syncScreenWakeLock() {
  if (shouldKeepScreenAwake()) {
    void requestScreenWakeLock();
    return;
  }
  void releaseScreenWakeLock();
}

function bytesToBase64Url(bytes) {
  const value = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizeSubscriptionUserAgent(userAgent) {
  return String(userAgent || "").replace(/\s*\[vc-device:[^\]]+\]\s*$/i, "").trim();
}

function extractPushDeviceId(userAgent) {
  const match = String(userAgent || "").match(/\[vc-device:([^\]]+)\]\s*$/i);
  return match?.[1] ? String(match[1]).trim() : "";
}

function getPushDeviceId() {
  const current = readLocal("push-device", null);
  if (current?.id) return String(current.id);
  const next = createId();
  writeLocal("push-device", {
    id: next,
    createdAt: new Date().toISOString(),
  });
  return next;
}

function buildPushSubscriptionUserAgent() {
  const baseUserAgent = String(navigator.userAgent || "").trim();
  return `${baseUserAgent} [${PUSH_DEVICE_TAG_PREFIX}${getPushDeviceId()}]`.trim();
}

function base64UrlToUint8Array(value) {
  const padded = `${String(value).replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat((4 - (String(value).length % 4 || 4)) % 4)}`;
  const raw = atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function fetchPushPublicKey() {
  const response = await fetch(PUSH_PUBLIC_KEY_ENDPOINT, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("No pude obtener la clave pÃºblica de notificaciones.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!payload?.publicKey) {
    throw new Error("El backend no ha publicado una clave VAPID todavÃ­a.");
  }
  return String(payload.publicKey);
}

async function fetchStepIllustration(payload) {
  const response = await fetch(STEP_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    console.error("[VelociChef] Fallo al preparar la ilustracion del paso", {
      status: response.status,
      payload,
      body,
    });
    throw new Error(body?.error || "No pude preparar la ilustracion del paso.");
  }
  if (body?.imageAvailable === false) {
    console.warn("[VelociChef] No se pudo ilustrar este paso", {
      payload,
      error: body?.error || "",
      providerErrors: Array.isArray(body?.providerErrors) ? body.providerErrors : [],
      provider: body?.provider || "",
      promptLength: String(body?.prompt || "").length,
      searchQuery: body?.searchQuery || "",
    });
  }
  return body;
}

async function loadProfile(user) {
  const fallback = readLocal("profile", null);
  if (!state.client || !user) {
    state.storageMode = "local";
    return fallback || buildDefaultProfile(user);
  }

  try {
    const { data, error } = await state.client
      .from("velocichef_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      state.storageMode = "supabase";
      writeLocal("profile", data);
      return deserializeProfile(user, data);
    }
  } catch (error) {
    state.storageMode = "local";
  }

  return fallback ? deserializeProfile(user, fallback) : buildDefaultProfile(user);
}

async function saveProfile() {
  if (!state.session?.user || !state.profile) return;

  const row = serializeProfile(state.session.user.id, state.profile);
  writeLocal("profile", row);

  if (!state.client) {
    state.storageMode = "local";
    return;
  }

  try {
    const { error } = await state.client.from("velocichef_profiles").upsert(row, {
      onConflict: "user_id",
    });
    if (error) throw error;
    state.storageMode = "supabase";
  } catch (error) {
    state.storageMode = "local";
  }
}

async function loadWeek() {
  const fallback = normalizeWeek(readLocal("week", null));
  if (!state.client || !state.session?.user) {
    state.storageMode = "local";
    return isCurrentPlanningWeek(fallback) ? fallback : null;
  }

  try {
    const { data, error } = await state.client
      .from("velocichef_weeks")
      .select("*")
      .eq("user_id", state.session.user.id)
      .order("start_date", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(12);

    if (error) throw error;
    if (Array.isArray(data) && data.length) {
      const normalizedRows = data
        .map((row) => ({
          row,
          week: normalizeWeek({
            ...(row.week_payload || {}),
            id: row.id,
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status,
            shopping_completed: row.shopping_completed,
            updated_at: row.updated_at,
          }),
        }))
        .filter((entry) => entry.week)
        .sort((left, right) => {
          const startDiff = compareIsoDate(right.week.startDate, left.week.startDate);
          if (startDiff) return startDiff;
          return new Date(right.row.updated_at || 0).getTime() - new Date(left.row.updated_at || 0).getTime();
        });
      const activeEntry = normalizedRows.find((entry) => isCurrentPlanningWeek(entry.week));
      if (activeEntry) {
        const duplicateIds = normalizedRows
          .filter((entry) => entry.row.id !== activeEntry.row.id)
          .filter((entry) =>
            entry.week.startDate === activeEntry.week.startDate
            && entry.week.endDate === activeEntry.week.endDate)
          .map((entry) => entry.row.id);
        if (duplicateIds.length) {
          void pruneDuplicateWeeks(activeEntry.week, duplicateIds);
        }
        state.storageMode = "supabase";
        const mergedWeek = fallback?.cookingSnapshot
          ? normalizeWeek({
              ...activeEntry.week,
              cookingSnapshot: fallback.cookingSnapshot,
            })
          : activeEntry.week;
        writeLocal("week", mergedWeek);
        return mergedWeek;
      }
    }
    if (fallback && isCurrentPlanningWeek(fallback)) {
      state.storageMode = "supabase";
      return fallback;
    }
  } catch (_error) {
    state.storageMode = "local";
  }

  return isCurrentPlanningWeek(fallback) ? fallback : null;
}

async function saveWeek() {
  if (!state.week || !state.session?.user) return;
  const normalized = normalizeWeek(state.week);
  state.week = normalized;
  writeLocal("week", normalized);

  if (!state.client) {
    state.storageMode = "local";
    return;
  }

  try {
    const row = serializeWeek(state.session.user.id, normalized);
    const { error } = await state.client.from("velocichef_weeks").upsert(row, {
      onConflict: "id",
    });
    if (error) throw error;
    state.storageMode = "supabase";
    await pruneDuplicateWeeks(normalized);
    await syncRemoteReminders();
  } catch (_error) {
    state.storageMode = "local";
  }
}

async function loadFeedback() {
  const fallback = readLocal("feedback", []);
  if (!state.client || !state.session?.user) {
    state.storageMode = "local";
    return fallback;
  }

  try {
    const { data, error } = await state.client
      .from("velocichef_feedback")
      .select("*")
      .eq("user_id", state.session.user.id)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) throw error;
    if (Array.isArray(data)) {
      state.storageMode = "supabase";
      writeLocal("feedback", data);
      return data;
    }
  } catch (_error) {
    state.storageMode = "local";
  }

  return fallback;
}

async function saveFeedback(entry) {
  const next = [entry, ...(state.feedback || [])].slice(0, 100);
  state.feedback = next;
  writeLocal("feedback", next);

  if (!state.client || !state.session?.user) {
    state.storageMode = "local";
    return;
  }

  try {
    const payload = {
      id: entry.id,
      user_id: state.session.user.id,
      week_id: entry.weekId || state.week?.id || null,
      meal_id: entry.mealId,
      feedback_type: entry.type,
      payload: entry.payload || {},
      created_at: entry.createdAt,
    };
    const { error } = await state.client.from("velocichef_feedback").insert(payload);
    if (error) throw error;
    state.storageMode = "supabase";
  } catch (_error) {
    state.storageMode = "local";
  }
}

function getFeedbackEntryType(entry) {
  return String(entry?.type || entry?.feedback_type || "").trim();
}

function getFeedbackEntryPayload(entry) {
  return entry?.payload && typeof entry.payload === "object" ? entry.payload : {};
}

function getRecentCookingFeedbackSummary(limit = 8) {
  const entries = (state.feedback || [])
    .filter((entry) => getFeedbackEntryType(entry) === "cook_rating")
    .slice(0, limit);
  if (!entries.length) return "";

  const positives = entries.filter((entry) => Number(getFeedbackEntryPayload(entry).rating || 0) >= 5).length;
  const reasonCounts = new Map();

  entries.forEach((entry) => {
    const payload = getFeedbackEntryPayload(entry);
    const reasons = Array.isArray(payload.reasons) ? payload.reasons.map(String).filter(Boolean) : [];
    reasons.forEach((reason) => {
      reasonCounts.set(reason, Number(reasonCounts.get(reason) || 0) + 1);
    });
  });

  const topReasons = Array.from(reasonCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([reason]) => COOKING_FEEDBACK_REASON_LABELS[reason] || reason);

  const summaryParts = [];
  if (positives) {
    summaryParts.push(`${positives} recetas recientes han gustado mucho al usuario.`);
  }
  if (topReasons.length) {
    summaryParts.push(`Ajustes pedidos recientemente: ${topReasons.join(", ")}.`);
  }

  return summaryParts.join(" ").trim();
}

async function syncRemoteReminders() {
  if (!state.client || !state.session?.user || !state.week?.id) return;

  const rows = (state.week.reminders || []).map((reminder) => {
    const notificationPayload = buildBrowserNotificationPayload(reminder);
    return {
      id: reminder.id,
      user_id: state.session.user.id,
      week_id: state.week.id,
      reminder_kind: reminder.kind,
      trigger_at: reminder.triggerAt,
      delivered_at: reminder.deliveredAt || null,
      payload: {
        ...notificationPayload,
        reminderId: reminder.id,
        url: notificationPayload.url,
        tag: reminder.id,
        silentWhenVisible: true,
        kind: reminder.kind,
        groupKey: reminder.groupKey,
        mealId: reminder.mealId,
        mealDate: reminder.mealDate,
        mealKey: reminder.mealKey,
        mealTitle: reminder.mealTitle,
        ingredient: reminder.ingredient,
        dateLabel: reminder.dateLabel,
      },
    };
  });

  try {
    const remove = await state.client
      .from("velocichef_reminders")
      .delete()
      .eq("week_id", state.week.id)
      .neq("reminder_kind", "timer");
    if (remove.error) throw remove.error;

    if (rows.length) {
      const insert = await state.client.from("velocichef_reminders").upsert(rows, {
        onConflict: "id",
      });
      if (insert.error) throw insert.error;
    }
  } catch (_error) {
    state.storageMode = "local";
  }
}

function buildRemoteTimerReminder(timer) {
  if (!timer || !state.week?.id || !state.session?.user) return null;

  const reminderId = isUuid(timer.reminderId) ? timer.reminderId : createId();
  timer.reminderId = reminderId;

  const target = timer.mealId ? getMealById(timer.mealId) : null;
  const triggerAt = new Date(timer.endsAt || (Date.now() + Math.max(0, Number(timer.remainingMs || 0)))).toISOString();
  const timerLabel = String(timer.label || "Temporizador").trim() || "Temporizador";
  const payload = buildBrowserNotificationPayload({
    id: reminderId,
    kind: "timer",
    title: `${timerLabel} listo`,
    body: `${timerLabel} ya está listo.`,
    url: timer.mealId ? buildCookSessionUrl(timer.mealId, timer.stepId || "") : `${APP_BASE_URL}?view=cook`,
    actionLabel: "Seguir",
    actionType: "cook",
    mealId: timer.mealId || null,
    stepId: timer.stepId || null,
    mealDate: target?.day?.date || null,
    mealKey: target?.mealKey || null,
    mealTitle: target?.meal?.title || null,
    timestamp: triggerAt,
    triggerAt,
    renotify: true,
    requireInteraction: true,
    urgency: "high",
    silentWhenVisible: true,
  });

  return {
    id: reminderId,
    user_id: state.session.user.id,
    week_id: state.week.id,
    reminder_kind: "timer",
    trigger_at: triggerAt,
    delivered_at: null,
    payload: {
      ...payload,
      reminderId,
      kind: "timer",
      tag: `timer-${timer.id || reminderId}`,
      groupKey: "cook-timer",
      timerId: timer.id,
      timerLabel,
      mealId: timer.mealId || null,
      stepId: timer.stepId || null,
      mealDate: target?.day?.date || null,
      mealKey: target?.mealKey || null,
      mealTitle: target?.meal?.title || null,
      deliveredAt: null,
      silentWhenVisible: true,
    },
  };
}

async function upsertRemoteTimerReminder(timer) {
  if (!state.client || !state.session?.user || !state.week?.id || !timer) return;
  if (!isNotificationActiveOnCurrentDevice()) return;
  if (timer.paused) return;

  const row = buildRemoteTimerReminder(timer);
  if (!row) return;

  try {
    const { error } = await state.client.from("velocichef_reminders").upsert(row, {
      onConflict: "id",
    });
    if (error) throw error;
    state.storageMode = "supabase";
  } catch (_error) {
    state.storageMode = "local";
  }
}

async function deleteRemoteTimerReminder(timerOrId) {
  if (!state.client || !state.session?.user) return;
  const reminderId = typeof timerOrId === "string"
    ? timerOrId
    : (timerOrId?.reminderId || "");
  if (!isUuid(reminderId)) return;

  try {
    const { error } = await state.client
      .from("velocichef_reminders")
      .delete()
      .eq("id", reminderId)
      .eq("user_id", state.session.user.id);
    if (error) throw error;
    state.storageMode = "supabase";
  } catch (_error) {
    state.storageMode = "local";
  }
}

async function markRemoteTimerReminderDelivered(timerOrId) {
  if (!state.client || !state.session?.user) return;
  const reminderId = typeof timerOrId === "string"
    ? timerOrId
    : (timerOrId?.reminderId || "");
  if (!isUuid(reminderId)) return;

  try {
    const { error } = await state.client
      .from("velocichef_reminders")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", reminderId)
      .eq("user_id", state.session.user.id);
    if (error) throw error;
    state.storageMode = "supabase";
  } catch (_error) {
    state.storageMode = "local";
  }
}

function syncRemoteCookingTimers() {
  if (!state.cooking?.activeTimers?.length) return;
  if (!isNotificationActiveOnCurrentDevice()) return;
  (state.cooking.activeTimers || []).forEach((timer) => {
    if (!timer?.paused) {
      void upsertRemoteTimerReminder(timer);
    }
  });
}

async function refreshRemoteReminderActivity(options = {}) {
  if (!state.client || !state.session?.user || !state.week?.id) return false;

  if (remoteReminderRefreshPromise) return remoteReminderRefreshPromise;

  const now = Date.now();
  if (!options.force && (now - lastRemoteReminderRefreshAt) < 15000) {
    return false;
  }

  remoteReminderRefreshPromise = (async () => {
    let changed = false;
    try {
      let query = state.client
        .from("velocichef_reminders")
        .select("id, reminder_kind, trigger_at, delivered_at, payload")
        .eq("week_id", state.week.id)
        .not("delivered_at", "is", null)
        .order("delivered_at", { ascending: true })
        .limit(24);

      if (state.week.lastReminderSyncAt) {
        query = query.gt("delivered_at", state.week.lastReminderSyncAt);
      }

      const { data, error } = await query;
      if (error) throw error;

      const deliveredRows = Array.isArray(data) ? data : [];
      for (const row of deliveredRows) {
        // Secuencial para no desordenar la bandeja ni pisar badges.
        // eslint-disable-next-line no-await-in-loop
        const ingested = await ingestRemoteReminderPayload({
          id: row.id,
          reminderId: row.id,
          kind: row.reminder_kind || row.payload?.kind || "reminder",
          triggerAt: row.trigger_at,
          deliveredAt: row.delivered_at,
          ...(row.payload || {}),
        }, {
          persist: false,
          showBanner: options.showBanner === true,
        });
        changed = ingested || changed;
      }

      const latestDeliveredAt = deliveredRows.length
        ? (deliveredRows[deliveredRows.length - 1]?.delivered_at || "")
        : "";
      if (latestDeliveredAt && state.week.lastReminderSyncAt !== latestDeliveredAt) {
        state.week.lastReminderSyncAt = latestDeliveredAt;
        changed = true;
      }

      if (changed) {
        await saveWeek();
        render();
      } else if (state.week) {
        writeLocal("week", normalizeWeek(state.week));
      }
    } catch (_error) {
      return false;
    } finally {
      lastRemoteReminderRefreshAt = Date.now();
      remoteReminderRefreshPromise = null;
      void syncAppBadgeCount();
    }

    return changed;
  })();

  return remoteReminderRefreshPromise;
}

async function upsertPushSubscription(subscription) {
  if (!state.client || !state.session?.user || !subscription) return;

  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  if (!p256dh || !auth) return;

  try {
    const { error } = await state.client.from("velocichef_push_subscriptions").upsert({
      user_id: state.session.user.id,
      endpoint: subscription.endpoint,
      p256dh: bytesToBase64Url(new Uint8Array(p256dh)),
      auth: bytesToBase64Url(new Uint8Array(auth)),
      user_agent: buildPushSubscriptionUserAgent(),
      enabled: true,
    }, {
      onConflict: "endpoint",
    });
    if (error) throw error;
    await disableDuplicatePushSubscriptions(subscription);
  } catch (_error) {
    state.storageMode = "local";
  }
}

async function disablePushSubscription(subscriptionOrEndpoint) {
  const endpoint = typeof subscriptionOrEndpoint === "string"
    ? String(subscriptionOrEndpoint || "").trim()
    : String(subscriptionOrEndpoint?.endpoint || "").trim();
  if (!state.client || !state.session?.user || !endpoint) return;
  try {
    const { error } = await state.client
      .from("velocichef_push_subscriptions")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("endpoint", endpoint)
      .eq("user_id", state.session.user.id);
    if (error) throw error;
  } catch (_error) {
    state.storageMode = "local";
  }
}

async function disableDuplicatePushSubscriptions(subscription) {
  if (!state.client || !state.session?.user || !subscription?.endpoint) return;
  const currentEndpoint = String(subscription.endpoint || "").trim();
  const currentDeviceId = getPushDeviceId();
  const currentUserAgent = normalizeSubscriptionUserAgent(navigator.userAgent);
  if (!currentEndpoint || !currentDeviceId) return;

  try {
    const { data, error } = await state.client
      .from("velocichef_push_subscriptions")
      .select("endpoint,user_agent,enabled")
      .eq("user_id", state.session.user.id)
      .eq("enabled", true);
    if (error) throw error;

    const duplicateEndpoints = (Array.isArray(data) ? data : [])
      .filter((row) => String(row.endpoint || "").trim() && String(row.endpoint || "").trim() !== currentEndpoint)
      .filter((row) => {
        const storedDeviceId = extractPushDeviceId(row.user_agent);
        if (storedDeviceId) return storedDeviceId === currentDeviceId;
        return normalizeSubscriptionUserAgent(row.user_agent) === currentUserAgent;
      })
      .map((row) => String(row.endpoint).trim());

    if (!duplicateEndpoints.length) return;

    const { error: disableError } = await state.client
      .from("velocichef_push_subscriptions")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .in("endpoint", duplicateEndpoints)
      .eq("user_id", state.session.user.id);
    if (disableError) throw disableError;
  } catch (_error) {
    state.storageMode = "local";
  }
}

function readPushMeta() {
  return readLocal("push-meta", null);
}

function writePushMeta(subscription) {
  if (!subscription) {
    removeLocal("push-meta");
    return;
  }
  writeLocal("push-meta", {
    endpoint: String(subscription.endpoint || "").trim(),
    deviceId: getPushDeviceId(),
    expirationTime: Number.isFinite(Number(subscription.expirationTime)) ? Number(subscription.expirationTime) : null,
    updatedAt: new Date().toISOString(),
  });
}

async function ensurePushSubscription(forceSubscribe = false) {
  if (!state.workerRegistration) return { supported: false, subscription: null };
  if (!("PushManager" in window)) return { supported: false, subscription: null };

  const registration = state.workerRegistration || await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  const previousMeta = readPushMeta();

  if (!subscription && forceSubscribe) {
    const publicKey = await fetchPushPublicKey();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });
  }

  if (subscription) {
    if (previousMeta?.endpoint && previousMeta.endpoint !== subscription.endpoint) {
      await disablePushSubscription(previousMeta.endpoint);
    }
    await upsertPushSubscription(subscription);
    writePushMeta(subscription);
  } else if (previousMeta?.endpoint) {
    writePushMeta(null);
  }

  return { supported: true, subscription };
}

async function pruneDuplicateWeeks(referenceWeek = state.week, explicitDuplicateIds = []) {
  if (!state.client || !state.session?.user || !referenceWeek?.id) return;
  const duplicateIds = Array.from(new Set((explicitDuplicateIds || []).filter(Boolean)));

  try {
    if (!duplicateIds.length) {
      const { data, error } = await state.client
        .from("velocichef_weeks")
        .select("id")
        .eq("user_id", state.session.user.id)
        .eq("start_date", referenceWeek.startDate)
        .eq("end_date", referenceWeek.endDate)
        .neq("id", referenceWeek.id);
      if (error) throw error;
      duplicateIds.push(...(Array.isArray(data) ? data.map((row) => row.id).filter(Boolean) : []));
    }

    if (!duplicateIds.length) return;

    const { error: deleteError } = await state.client
      .from("velocichef_weeks")
      .delete()
      .in("id", duplicateIds)
      .eq("user_id", state.session.user.id);
    if (deleteError) throw deleteError;
  } catch (_error) {
    state.storageMode = "local";
  }
}

function createNotificationDeviceState(overrides = {}) {
  return {
    supported: "Notification" in window,
    pushSupported: ("PushManager" in window) && !!state.workerRegistration,
    needsInstall: isIOSDevice() && !isStandaloneApp(),
    permission: "Notification" in window ? Notification.permission : "unsupported",
    hasSubscription: false,
    endpoint: "",
    expirationTime: null,
    expiringSoon: false,
    ...overrides,
  };
}

async function refreshNotificationDeviceState() {
  const nextState = createNotificationDeviceState();

  if (nextState.pushSupported) {
    try {
      const registration = state.workerRegistration || await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      nextState.hasSubscription = !!subscription;
      nextState.endpoint = subscription?.endpoint || "";
      nextState.expirationTime = Number.isFinite(Number(subscription?.expirationTime)) ? Number(subscription.expirationTime) : null;
      nextState.expiringSoon = !!(nextState.expirationTime && nextState.expirationTime - Date.now() <= PUSH_EXPIRY_WARNING_MS);
    } catch (_error) {
      nextState.hasSubscription = false;
    }
  }

  state.notificationDevice = nextState;
  return nextState;
}

async function autoRepairPushSubscription(options = {}) {
  const force = !!options.force;
  const now = Date.now();
  if (!force && now - lastPushAutoRepairAt < PUSH_AUTO_REPAIR_MIN_INTERVAL_MS) {
    return getNotificationDeviceState();
  }
  lastPushAutoRepairAt = now;

  const currentDevice = await refreshNotificationDeviceState();
  if (!currentDevice.supported || currentDevice.needsInstall || currentDevice.permission !== "granted" || !currentDevice.pushSupported) {
    return currentDevice;
  }

  try {
    const result = await ensurePushSubscription(!currentDevice.hasSubscription);
    const repairedState = await refreshNotificationDeviceState();
    if (result.subscription && state.profile && !state.profile.notificationEnabled) {
      state.profile.notificationEnabled = true;
      await saveProfile();
    }
    return repairedState;
  } catch (_error) {
    return currentDevice;
  }
}

function getNotificationDeviceState() {
  return state.notificationDevice || createNotificationDeviceState();
}

function isNotificationActiveOnCurrentDevice(deviceState = getNotificationDeviceState()) {
  if (!deviceState.supported || deviceState.needsInstall) return false;
  if (deviceState.permission !== "granted") return false;
  return deviceState.hasSubscription || !deviceState.pushSupported;
}

function getNotificationCtaLabel() {
  const deviceState = getNotificationDeviceState();
  if (isNotificationActiveOnCurrentDevice(deviceState)) return "Revisar en este dispositivo";
  if (deviceState.needsInstall) return "Activar en este iPhone";
  if (state.profile?.notificationEnabled) return "Activar también aquí";
  return "Activar en este dispositivo";
}

function getNotificationStatusCopy() {
  const deviceState = getNotificationDeviceState();

  if (!deviceState.supported) {
    return "Este navegador no permite avisos web en este dispositivo.";
  }
  if (deviceState.needsInstall) {
    return "Tus avisos pueden seguir activos en otro dispositivo, pero en iPhone necesitas abrir VelociChef desde la pantalla de inicio para activarlos aquí.";
  }
  if (isNotificationActiveOnCurrentDevice(deviceState)) {
    return "Los avisos están activos en este dispositivo y también podré usarlos para recordatorios de cocina y compra.";
  }
  if (deviceState.permission === "denied") {
    return "Los avisos están bloqueados en este dispositivo. Tendrás que volver a permitirlos desde los ajustes del navegador o del sistema.";
  }
  if (state.profile?.notificationEnabled) {
    return "Tus avisos ya están activos en otro dispositivo, pero todavía no en este. Puedes activarlos también aquí.";
  }
  return "Todavía no has activado avisos en este dispositivo.";
}

function getNotificationDeviceChip() {
  const deviceState = getNotificationDeviceState();
  if (isNotificationActiveOnCurrentDevice(deviceState)) return "Avisos activos en este dispositivo";
  if (deviceState.needsInstall) return "Actívalo desde pantalla de inicio";
  if (deviceState.permission === "denied") return "Avisos bloqueados aquí";
  if (state.profile?.notificationEnabled) return "Activos en otro dispositivo";
  return "Avisos pendientes en este dispositivo";
}

function normalizeDifficulty(level) {
  const map = {
    facil: "Fácil",
    easy: "Fácil",
    medio: "Media",
    media: "Media",
    medium: "Media",
    dificil: "Difícil",
    difficult: "Difícil",
    hard: "Difícil",
  };
  return map[String(level || "").toLowerCase()] || "Media";
}

function normalizeUnit(unit) {
  const value = String(unit || "unit").toLowerCase();
  const map = {
    unidad: "unit",
    unidades: "unit",
    u: "unit",
    unit: "unit",
    units: "unit",
    g: "g",
    gr: "g",
    gramos: "g",
    gram: "g",
    kg: "kg",
    kilo: "kg",
    kilos: "kg",
    ml: "ml",
    mililitros: "ml",
    l: "l",
    litro: "l",
    litros: "l",
  };
  return map[value] || "unit";
}

function normalizeShoppingStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (["bought", "comprado", "done", "complete", "completed", "have"].includes(value)) return "bought";
  return "pending";
}

function getShoppingStatusMeta(status) {
  const normalized = normalizeShoppingStatus(status);
  if (normalized === "bought") {
    return {
      key: "bought",
      label: "Comprado",
      icon: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9.2 16.6 5.6 13l-1.4 1.4 5 5 10-10-1.4-1.4z"></path>
        </svg>
      `,
    };
  }
  return {
    key: "pending",
    label: "Pendiente",
    icon: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2ZM7.17 14h9.95c.75 0 1.41-.41 1.75-1.03L22.96 5H6.21l-.94-2H2v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 8 18h12v-2H8z"></path>
      </svg>
    `,
  };
}

function renderShoppingStatusBadge(status) {
  const meta = getShoppingStatusMeta(status);
  return `
    <span class="vc-shopping-status-badge vc-shopping-status-${meta.key}">
      <span class="vc-shopping-status-icon" aria-hidden="true">${meta.icon}</span>
      <span>${escapeHtml(meta.label)}</span>
    </span>
  `;
}

function renderShoppingStatusAction(item) {
  const status = normalizeShoppingStatus(item?.pantryStatus);
  const pendingMeta = getShoppingStatusMeta("pending");
  const boughtMeta = getShoppingStatusMeta("bought");
  const pendingActive = status !== "bought";
  const boughtActive = status === "bought";
  return `
    <div class="vc-shopping-status-action" role="group" aria-label="Estado de compra">
      <button
        class="vc-shopping-state vc-shopping-state-pending ${pendingActive ? "is-active" : "is-inactive"}"
        type="button"
        data-action="set-shopping-state"
        data-item-id="${item.id}"
        data-status="pending"
        aria-label="${escapeHtml(pendingActive ? "Pendiente" : "Marcar como pendiente")}"
        aria-pressed="${pendingActive ? "true" : "false"}"
        title="${escapeHtml(pendingActive ? "Pendiente" : "Marcar como pendiente")}"
      >
        <span class="vc-shopping-status-icon" aria-hidden="true">${pendingMeta.icon}</span>
        ${pendingActive ? '<span class="vc-shopping-state-label">Pendiente</span>' : ""}
      </button>
      <button
        class="vc-shopping-state vc-shopping-state-bought ${boughtActive ? "is-active" : "is-inactive"}"
        type="button"
        data-action="set-shopping-state"
        data-item-id="${item.id}"
        data-status="bought"
        aria-label="${escapeHtml(boughtActive ? "Comprado" : "Marcar como comprado")}"
        aria-pressed="${boughtActive ? "true" : "false"}"
        title="${escapeHtml(boughtActive ? "Comprado" : "Marcar como comprado")}"
      >
        <span class="vc-shopping-status-icon" aria-hidden="true">${boughtMeta.icon}</span>
        ${boughtActive ? '<span class="vc-shopping-state-label">Comprado</span>' : ""}
      </button>
    </div>
  `;
}

function unitToBase(quantity, unit) {
  const normalizedUnit = normalizeUnit(unit);
  const amount = Number(quantity || 0) || 0;
  if (normalizedUnit === "kg") return { amount: amount * 1000, unit: "g" };
  if (normalizedUnit === "l") return { amount: amount * 1000, unit: "ml" };
  return { amount, unit: normalizedUnit };
}

function formatQuantity(quantity, unit) {
  const base = unitToBase(quantity, unit);
  if (base.unit === "g" && base.amount >= 1000) {
    return `${(base.amount / 1000).toFixed(base.amount % 1000 === 0 ? 0 : 2)} kg`;
  }
  if (base.unit === "ml" && base.amount >= 1000) {
    return `${(base.amount / 1000).toFixed(base.amount % 1000 === 0 ? 0 : 2)} l`;
  }
  if (base.unit === "unit") {
    return `${base.amount || 1} ud`;
  }
  return `${Number(base.amount.toFixed(base.amount >= 10 ? 0 : 1))} ${base.unit}`;
}

function normalizeIngredient(ingredient) {
  const quantity = Number(ingredient?.quantity || ingredient?.qty || 0) || 0;
  const unit = normalizeUnit(ingredient?.unit);
  return {
    id: ingredient?.id || createId(),
    name: String(ingredient?.name || ingredient?.ingredient || "").trim(),
    quantity,
    unit,
    category: String(ingredient?.category || "Otros").trim(),
    pantry: !!ingredient?.pantry,
    spice: !!ingredient?.spice,
    freezable: !!ingredient?.freezable,
    thawLeadHours: Number(ingredient?.thaw_lead_hours || ingredient?.thawLeadHours || 0) || 0,
    note: String(ingredient?.note || "").trim(),
  };
}

function formatNaturalList(items) {
  const clean = uniqueValues(items);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} y ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} y ${clean[clean.length - 1]}`;
}

function getPrimaryIngredients(ingredients, limit = 3) {
  return (ingredients || [])
    .filter((ingredient) => ingredient?.name)
    .filter((ingredient) => !ingredient.spice && !ingredient.pantry)
    .slice(0, limit)
    .map((ingredient) => ingredient.name);
}

function getCuttableIngredients(ingredients, limit = 2) {
  return (ingredients || [])
    .filter((ingredient) => ingredient?.name)
    .filter((ingredient) => /cebolla|pimiento|zanahoria|calabac|pepino|puerro|col|repollo|jud[iÃ­]a|lechuga|tomate|berenjena|patata/i.test(ingredient.name))
    .slice(0, limit)
    .map((ingredient) => ingredient.name);
}

function getProteinIngredient(ingredients) {
  return (ingredients || []).find((ingredient) => /pollo|pavo|carne|huevo|salm|at[uÃº]n|garbanzo|lenteja|jud[iÃ­]a|gamba|tofu|queso|yogur/i.test(ingredient.name)) || null;
}

function getBaseIngredient(ingredients) {
  return (ingredients || []).find((ingredient) => /pasta|arroz|cusc[uÃº]s|patata|pan|avena|quinoa/i.test(ingredient.name)) || null;
}

function inferCookingMethod(mealKey, meal) {
  const title = String(meal?.title || "").toLowerCase();
  const prepMinutes = Number(meal?.prepMinutes || meal?.prep_minutes || 20) || 20;

  if (/ensalada|yogur|batido|tostada|wrap fr[iÃ­]o|bowl fr[iÃ­]o/.test(title)) {
    return { type: "cold", timerMinutes: 0 };
  }
  if (/horno|asad|lasa|gratin|bake/.test(title)) {
    return { type: "oven", timerMinutes: Math.max(10, Math.round(prepMinutes * 0.65)) };
  }
  if (/sopa|crema|lenteja|curry|guiso/.test(title)) {
    return { type: "simmer", timerMinutes: Math.max(10, Math.round(prepMinutes * 0.55)) };
  }
  if (/pasta|arroz|cusc[uÃº]s/.test(title)) {
    return { type: "boil", timerMinutes: Math.max(8, Math.round(prepMinutes * 0.45)) };
  }
  if (mealKey === "breakfast" || mealKey === "snack" || mealKey === "bites") {
    return { type: "quick", timerMinutes: 0 };
  }
  return { type: "pan", timerMinutes: Math.max(6, Math.round(prepMinutes * 0.4)) };
}

function extractTimerMinutes(text) {
  const minuteMatch = String(text || "").match(/(\d+)\s*(?:min|minutos)/i);
  if (minuteMatch) return Number(minuteMatch[1]) || 0;
  const hourMatch = String(text || "").match(/(\d+)\s*(?:hora|horas)/i);
  if (hourMatch) return (Number(hourMatch[1]) || 0) * 60;
  return 0;
}

function normalizeCookingStep(step, index) {
  const text = typeof step === "string"
    ? step
    : String(step?.text || step?.instruction || step?.description || "").trim();
  const title = typeof step === "string"
    ? `Paso ${index + 1}`
    : String(step?.title || `Paso ${index + 1}`).trim();
  const timerLabel = typeof step === "string"
    ? ""
    : String(step?.timerLabel || step?.timer_label || "").trim();

  return {
    id: step?.id || createId(),
    title,
    text,
    timerMinutes: Number(step?.timerMinutes || step?.timer_minutes || extractTimerMinutes(text)) || 0,
    timerLabel,
    imagePrompt: typeof step === "string" ? "" : String(step?.imagePrompt || step?.image_prompt || "").trim(),
    imageSearchQuery: typeof step === "string" ? "" : String(step?.imageSearchQuery || step?.image_search_query || "").trim(),
  };
}

function buildFallbackCookingSteps(mealKey, meal, ingredients) {
  const primaryIngredients = getPrimaryIngredients(ingredients, 3);
  const cuttableIngredients = getCuttableIngredients(ingredients, 2);
  const protein = getProteinIngredient(ingredients);
  const base = getBaseIngredient(ingredients);
  const method = inferCookingMethod(mealKey, meal);
  const steps = [];

  if (cuttableIngredients.length) {
    steps.push({
      title: "Prepara la base",
      text: `Lava bien ${formatNaturalList(cuttableIngredients)} y corta en juliana ${formatNaturalList(cuttableIngredients)}. Deja el resto de ingredientes medidos y a mano.`,
    });
  } else {
    steps.push({
      title: "Ordena tu encimera",
      text: `Saca ${formatNaturalList(primaryIngredients) || "los ingredientes principales"} y colÃƒÂ³calos ya medidos para cocinar sin prisas.`,
    });
  }

  if (method.type === "cold") {
    steps.push({
      title: "Mezcla y monta",
      text: `Combina ${formatNaturalList(primaryIngredients) || "los ingredientes"} en un bol, aliÃƒÂ±a al gusto y reserva el plato listo para servir.`,
    });
  } else if (method.type === "oven") {
    steps.push({
      title: "Da sabor",
      text: `AliÃƒÂ±a ${formatNaturalList(primaryIngredients) || "la mezcla"} con aceite y condimentos. Si usas proteÃƒÂ­na, dora ligeramente ${protein?.name || "la parte principal"} antes de meterla al horno.`,
    });
    steps.push({
      title: "Cocina principal",
      text: `Lleva la bandeja al horno y cocina durante ${method.timerMinutes} minutos, hasta que quede bien hecho y con color.`,
      timerMinutes: method.timerMinutes,
      timerLabel: "Retirar del horno",
    });
  } else if (method.type === "simmer") {
    steps.push({
      title: "SofrÃƒÂ­e",
      text: `Pon una olla con un poco de aceite y sofrÃƒÂ­e la base aromÃƒÂ¡tica un par de minutos para arrancar con sabor.`,
    });
    steps.push({
      title: "Cuece suave",
      text: `AÃƒÂ±ade ${formatNaturalList(primaryIngredients) || "el resto de ingredientes"}, cubre lo necesario y cocina a fuego lento durante ${method.timerMinutes} minutos.`,
      timerMinutes: method.timerMinutes,
      timerLabel: "Revisar la olla",
    });
  } else if (method.type === "boil") {
    steps.push({
      title: "Pon la base en marcha",
      text: `Hierve agua o caldo y cocina ${base?.name || "la base del plato"} durante ${method.timerMinutes} minutos hasta que quede en su punto.`,
      timerMinutes: method.timerMinutes,
      timerLabel: base?.name ? `Escurrir ${base.name}` : "Escurrir la base",
    });
    steps.push({
      title: "Saltea y une",
      text: `Mientras tanto, pica fino lo que falte, saltea ${protein?.name || "el ingrediente principal"} y mezcla todo al final para que quede jugoso.`,
    });
  } else if (method.type === "quick") {
    steps.push({
      title: "Monta el plato",
      text: `Une ${formatNaturalList(primaryIngredients) || "los ingredientes"}, ajusta textura o temperatura y deja el plato listo para comer.`,
    });
  } else {
    steps.push({
      title: "Pon calor",
      text: `Calienta una sartÃƒÂ©n con un poco de aceite y dora ${protein?.name || "el ingrediente principal"} para que coja color y sabor.`,
    });
    steps.push({
      title: "Termina la cocciÃƒÂ³n",
      text: `AÃƒÂ±ade ${formatNaturalList(primaryIngredients) || "el resto de ingredientes"} y cocina a fuego lento durante ${method.timerMinutes} minutos, removiendo de vez en cuando.`,
      timerMinutes: method.timerMinutes,
      timerLabel: "Retirar la sartén",
    });
  }

  steps.push({
    title: "Acabado",
    text: "Prueba, ajusta de sal si hace falta, emplata y reserva un minuto antes de servir.",
  });

  return steps.map(normalizeCookingStep);
}

function normalizeMeal(mealKey, meal, dayDate) {
  const fallbackTitle = `${MEAL_LABELS[mealKey] || "Comida"} sugerida`;
  const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients.map(normalizeIngredient).filter((item) => item.name) : [];
  const skipCooking = !!meal?.skipCooking || !!meal?.skip_cooking;
  const sourceSteps = Array.isArray(meal?.cookingSteps)
    ? meal.cookingSteps
    : (Array.isArray(meal?.steps) ? meal.steps : (Array.isArray(meal?.instructions) ? meal.instructions : []));
  const normalizedSteps = (skipCooking
    ? []
    : (sourceSteps.length ? sourceSteps.map(normalizeCookingStep) : buildFallbackCookingSteps(mealKey, meal, ingredients)))
    .filter((step) => step.text);
  const hasStoredGuidance = !!meal?.guidanceRefined || !!meal?.guidance_refined;

  return {
    id: meal?.id || createId(),
    mealKey,
    date: dayDate,
    title: String(meal?.title || fallbackTitle).trim(),
    summary: String(meal?.summary || meal?.description || "").trim(),
    prepMinutes: Number(meal?.prep_minutes || meal?.prepMinutes || 20) || 20,
    difficulty: normalizeDifficulty(meal?.difficulty),
    calories: Number(meal?.calories || 0) || 0,
    servings: Number(meal?.servings || state.profile?.householdCount || 1) || 1,
    nutrition: {
      protein: Number(meal?.nutrition?.protein || meal?.nutrition?.protein_g || 0) || 0,
      carbs: Number(meal?.nutrition?.carbs || meal?.nutrition?.carbs_g || 0) || 0,
      fats: Number(meal?.nutrition?.fats || meal?.nutrition?.fats_g || 0) || 0,
      fiber: Number(meal?.nutrition?.fiber || meal?.nutrition?.fiber_g || 0) || 0,
    },
    ingredients,
    cookingSteps: normalizedSteps,
    guidanceRefined: hasStoredGuidance,
    tags: uniqueValues(meal?.tags || []),
    feedback: meal?.feedback || { liked: false, disliked: false, reasons: null },
    skipCooking,
  };
}

function aggregateShopping(days) {
  const bucket = new Map();
  days.forEach((day) => {
    Object.entries(day.meals || {}).forEach(([mealKey, meal]) => {
      (meal.ingredients || []).forEach((ingredient) => {
        if (!ingredient.name) return;
        const base = unitToBase(ingredient.quantity || 0, ingredient.unit);
        const key = `${ingredient.name.toLowerCase()}__${base.unit}`;
        const entry = bucket.get(key) || {
          id: createId(),
          name: ingredient.name,
          quantity: 0,
          unit: base.unit,
          category: ingredient.category || "Otros",
          pantryStatus: "pending",
          pantry: !!ingredient.pantry,
          spice: !!ingredient.spice,
          freezable: !!ingredient.freezable,
          refs: [],
        };
        entry.quantity += base.amount || (ingredient.spice ? 1 : 0);
        entry.refs.push({
          date: day.date,
          mealKey,
          mealTitle: meal.title,
        });
        bucket.set(key, entry);
      });
    });
  });

  return Array.from(bucket.values())
    .map((item) => ({
      ...item,
      displayQuantity: formatQuantity(item.quantity, item.unit),
    }))
    .sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category, "es");
      return categoryCompare || a.name.localeCompare(b.name, "es");
    });
}

function normalizeCarryoverIngredient(item) {
  if (!item?.name) return null;
  return {
    id: item.id || createId(),
    name: String(item.name || "").trim(),
    quantity: Number(item.quantity || 0) || 0,
    unit: normalizeUnit(item.unit || "unit"),
    category: String(item.category || "Otros").trim(),
    sourceMealId: item.sourceMealId || item.source_meal_id || null,
    sourceMealTitle: item.sourceMealTitle || item.source_meal_title || "",
    sourceMealDate: item.sourceMealDate || item.source_meal_date || null,
    sourceReason: item.sourceReason || item.source_reason || "carryover",
  };
}

function mergeCarryoverIngredients(existing = [], next = []) {
  const bucket = new Map();
  [...existing, ...next]
    .map(normalizeCarryoverIngredient)
    .filter(Boolean)
    .forEach((item) => {
      const base = unitToBase(item.quantity || 0, item.unit);
      const key = `${String(item.name || "").toLowerCase()}__${base.unit}__${String(item.sourceReason || "carryover")}`;
      const current = bucket.get(key) || {
        ...item,
        id: item.id || createId(),
        quantity: 0,
        unit: base.unit,
      };
      current.quantity += base.amount || 0;
      current.sourceMealId = current.sourceMealId || item.sourceMealId || null;
      current.sourceMealTitle = current.sourceMealTitle || item.sourceMealTitle || "";
      current.sourceMealDate = current.sourceMealDate || item.sourceMealDate || null;
      bucket.set(key, current);
    });

  return [...bucket.values()].map((item) => ({
    ...item,
    quantity: Number(item.quantity || 0),
    unit: normalizeUnit(item.unit || "unit"),
  }));
}

function buildFreezerItems(days, existingFreezerItems = []) {
  if (Array.isArray(existingFreezerItems) && existingFreezerItems.length) {
    return existingFreezerItems.map((item) => ({
      id: item.id || createId(),
      ingredient: item.ingredient,
      quantity: Number(item.quantity || 0) || 0,
      unit: normalizeUnit(item.unit),
      mealDate: item.mealDate,
      mealKey: item.mealKey,
      mealTitle: item.mealTitle,
      thawLeadHours: Number(item.thawLeadHours || item.thaw_lead_hours || 12) || 12,
    }));
  }

  const freezerItems = [];
  days.forEach((day) => {
    Object.entries(day.meals || {}).forEach(([mealKey, meal]) => {
      (meal.ingredients || []).forEach((ingredient) => {
        if (!ingredient.freezable) return;
        freezerItems.push({
          id: createId(),
          ingredient: ingredient.name,
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit || "unit",
          mealDate: day.date,
          mealKey,
          mealTitle: meal.title,
          thawLeadHours: ingredient.thawLeadHours || 12,
        });
      });
    });
  });
  return freezerItems;
}

function normalizeWeek(rawWeek) {
  if (!rawWeek) return null;
  const startDate = rawWeek.startDate || rawWeek.start_date || getTomorrowIso();
  const daysSource = Array.isArray(rawWeek.days) ? rawWeek.days : [];
  const normalizedDays = daysSource.map((day, index) => {
    const date = day.date || addDays(startDate, index);
    const meals = {};
    Object.entries(day.meals || {}).forEach(([mealKey, meal]) => {
      meals[mealKey] = normalizeMeal(mealKey, meal, date);
    });
    return {
      date,
      label: day.label || friendlyDayLabel(date, startDate),
      meals,
    };
  });

  const endDate = rawWeek.endDate || rawWeek.end_date || addDays(startDate, Math.max(0, normalizedDays.length - 1));
  const shoppingList = Array.isArray(rawWeek.shoppingList) && rawWeek.shoppingList.length
    ? rawWeek.shoppingList.map((item) => ({
        ...item,
        id: item.id || createId(),
        pantryStatus: normalizeShoppingStatus(item.pantryStatus),
        displayQuantity: item.displayQuantity || formatQuantity(item.quantity || 0, item.unit),
      }))
    : aggregateShopping(normalizedDays);

  return {
    id: rawWeek.id || createId(),
    startDate,
    endDate,
    status: rawWeek.status || "draft",
    strategy: rawWeek.strategy || "",
    batchingTips: Array.isArray(rawWeek.batchingTips) ? rawWeek.batchingTips : [],
    days: normalizedDays,
    shoppingList,
    shoppingCompleted: !!rawWeek.shoppingCompleted,
    scheduleStepComplete: !!rawWeek.scheduleStepComplete,
    freezePromptAnswered: !!rawWeek.freezePromptAnswered,
    freezerOptIn: !!rawWeek.freezerOptIn,
    freezerItems: buildFreezerItems(normalizedDays, rawWeek.freezerItems),
    carryoverIngredients: mergeCarryoverIngredients(rawWeek.carryoverIngredients || rawWeek.carryover_ingredients || []),
    reminders: Array.isArray(rawWeek.reminders) ? rawWeek.reminders.map(normalizeReminder).filter(Boolean) : [],
    activityNotifications: Array.isArray(rawWeek.activityNotifications) ? rawWeek.activityNotifications.map(normalizeActivityNotification).filter(Boolean) : [],
    cookingSnapshot: rawWeek.cookingSnapshot && typeof rawWeek.cookingSnapshot === "object" ? { ...rawWeek.cookingSnapshot } : null,
    lastReminderSyncAt: rawWeek.lastReminderSyncAt || null,
  };
}

function buildWeekFromPlan(plan) {
  const normalized = normalizeWeek({
    ...plan,
    shoppingCompleted: false,
    scheduleStepComplete: false,
    freezePromptAnswered: false,
    freezerOptIn: false,
    carryoverIngredients: [],
  });
  normalized.reminders = [];
  normalized.activityNotifications = [];
  return normalized;
}

function flattenMeals(week) {
  if (!week) return [];
  return week.days.flatMap((day) =>
    Object.entries(day.meals || {}).map(([mealKey, meal]) => ({
      day,
      mealKey,
      meal,
    })),
  );
}

function getMealById(mealId) {
  return flattenMeals(state.week).find((item) => item.meal.id === mealId) || null;
}

function isMealCookable(meal) {
  return !!meal && !meal.skipCooking;
}

function buildCarryoverIngredientsFromMeal(entry, sourceReason = "carryover") {
  if (!entry?.meal?.ingredients?.length) return [];
  return entry.meal.ingredients
    .filter((ingredient) => ingredient?.name)
    .filter((ingredient) => !ingredient.spice && !ingredient.pantry)
    .map((ingredient) => normalizeCarryoverIngredient({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: ingredient.category,
      sourceMealId: entry.meal.id,
      sourceMealTitle: entry.meal.title,
      sourceMealDate: entry.day?.date || null,
      sourceReason,
    }))
    .filter(Boolean);
}

function buildSkippedMealPlaceholder(mealKey, dayDate, reason = "outside") {
  const title = reason === "moved"
    ? "Comida libre"
    : "Comida fuera o delivery";
  const summary = reason === "moved"
    ? "Este hueco queda libre porque has movido este plato a otro momento de la semana."
    : "Has marcado que aqui no cocinaras. VelociChef tendra en cuenta esos ingredientes en la proxima planificacion.";
  return normalizeMeal(mealKey, {
    id: createId(),
    title,
    summary,
    prep_minutes: 0,
    difficulty: "facil",
    calories: 0,
    servings: Number(state.profile?.householdCount || 1) || 1,
    nutrition: { protein_g: 0, carbs_g: 0, fats_g: 0, fiber_g: 0 },
    ingredients: [],
    steps: [],
    tags: ["descanso"],
    skipCooking: true,
  }, dayDate);
}

function replaceMealEntry(mealId, nextMealFactory) {
  if (!state.week) return false;
  let changed = false;
  state.week.days = state.week.days.map((day) => ({
    ...day,
    meals: Object.fromEntries(
      Object.entries(day.meals || {}).map(([mealKey, meal]) => {
        if (meal.id !== mealId) return [mealKey, meal];
        changed = true;
        return [mealKey, nextMealFactory(meal, day, mealKey)];
      }),
    ),
  }));
  return changed;
}

function finalizeWeekMealsMutation() {
  if (!state.week) return;
  state.week.shoppingList = aggregateShopping(state.week.days).map((item) => {
    const existing = state.week.shoppingList.find((current) => current.name === item.name && current.unit === item.unit);
    return {
      ...item,
      pantryStatus: normalizeShoppingStatus(existing?.pantryStatus),
    };
  });
  state.week.freezerItems = buildFreezerItems(state.week.days);
  state.week.reminders = composeReminders();
}

function getFutureReplacementEntries(reminder) {
  if (!state.week || !reminder?.mealId) return [];
  const sourceTime = new Date(reminder.triggerAt).getTime();
  return getScheduledCookingEntries()
    .filter((entry) => entry.meal.id !== reminder.mealId)
    .filter((entry) => isMealCookable(entry.meal))
    .filter((entry) => entry.cookAt.getTime() > sourceTime)
    .sort((a, b) => a.cookAt.getTime() - b.cookAt.getTime());
}

function getMealClock(mealKey) {
  if (mealKey === "breakfast") return state.profile?.breakfastTime || DEFAULT_MEAL_CLOCK.breakfast;
  if (mealKey === "snack") return state.profile?.snackTime || DEFAULT_MEAL_CLOCK.snack;
  if (mealKey === "lunch") return state.profile?.lunchTime || DEFAULT_MEAL_CLOCK.lunch;
  if (mealKey === "dinner") return state.profile?.dinnerTime || DEFAULT_MEAL_CLOCK.dinner;
  return DEFAULT_MEAL_CLOCK[mealKey] || "12:00";
}

function getCookMoment(day, mealKey) {
  const date = combineDateAndTime(day.date, getMealClock(mealKey));
  if (mealKey === "lunch" && state.profile?.lunchPrepNightBefore) {
    date.setDate(date.getDate() - 1);
    date.setHours(...String(state.profile?.dinnerTime || DEFAULT_MEAL_CLOCK.dinner).split(":").map(Number), 0, 0);
  }
  return date;
}

function getSuggestedCookingTarget() {
  if (!state.week) return null;
  const now = new Date();
  const meals = flattenMeals(state.week)
    .filter((entry) => isMealCookable(entry.meal))
    .map((entry) => ({
      ...entry,
      cookAt: getCookMoment(entry.day, entry.mealKey),
    }))
    .sort((a, b) => a.cookAt.getTime() - b.cookAt.getTime());

  const upcoming = meals.find((entry) => entry.cookAt.getTime() >= now.getTime() - 90 * 60000);
  return upcoming || meals[0] || null;
}

function createCookingState(mode = "suggest", mealId = null) {
  return {
    sessionId: createId(),
    mode,
    mealId,
    stepIndex: 0,
    handsFree: false,
    showMicHint: false,
    recognitionState: "idle",
    lastCommand: "",
    activeTimers: [],
    activeTimer: null,
    timerMenuOpen: false,
    guidanceStatus: "idle",
    stepImages: {},
    imageSupport: "unknown",
  };
}

function ensureCookingState() {
  if (!state.cooking) {
    const suggested = getSuggestedCookingTarget();
    state.cooking = createCookingState(suggested ? "suggest" : "picker", suggested?.meal.id || null);
  }
  return state.cooking;
}

function clearCookingMicHintTimer() {
  if (cookingMicHintTimer) {
    window.clearTimeout(cookingMicHintTimer);
    cookingMicHintTimer = null;
  }
}

function dismissCookingMicHint() {
  clearCookingMicHintTimer();
  if (state.cooking?.showMicHint) {
    state.cooking.showMicHint = false;
  }
}

function scheduleCookingMicHint(sessionId = state.cooking?.sessionId || "") {
  clearCookingMicHintTimer();
  if (!state.cooking || state.cooking.sessionId !== sessionId) return;
  state.cooking.showMicHint = true;
  render();
  cookingMicHintTimer = window.setTimeout(() => {
    if (!state.cooking || state.cooking.sessionId !== sessionId) return;
    state.cooking.showMicHint = false;
    cookingMicHintTimer = null;
    render();
  }, 10000);
}

function getCookingTarget() {
  const mealId = state.cooking?.mealId;
  return mealId ? getMealById(mealId) : null;
}

function getCookCopyDensityClass(text, options = {}) {
  const source = String(text || "").trim();
  const ingredientBoost = options.isIngredientsStep ? 18 : 0;
  const timerBoost = options.hasTimer ? 28 : 0;
  const lengthScore = source.length + ingredientBoost + timerBoost;

  if (lengthScore <= 95) return "vc-cook-density-xl";
  if (lengthScore <= 165) return "vc-cook-density-lg";
  if (lengthScore <= 245) return "vc-cook-density-md";
  return "vc-cook-density-sm";
}

function sortCookingTimers(timers = []) {
  return [...timers].sort((left, right) => {
    if (!!left?.paused !== !!right?.paused) {
      return left?.paused ? 1 : -1;
    }
    const leftRemaining = Number(left?.remainingMs ?? 0);
    const rightRemaining = Number(right?.remainingMs ?? 0);
    if (leftRemaining !== rightRemaining) return leftRemaining - rightRemaining;
    return String(left?.id || "").localeCompare(String(right?.id || ""));
  });
}

function syncPrimaryCookingTimer() {
  if (!state.cooking) return;
  state.cooking.activeTimers = sortCookingTimers((state.cooking.activeTimers || []).filter(Boolean));
  state.cooking.activeTimer = state.cooking.activeTimers[0] || null;
}

function getActiveCookingTimers() {
  return sortCookingTimers(state.cooking?.activeTimers || []);
}

function getPrimaryCookingTimer() {
  return getActiveCookingTimers()[0] || null;
}

function serializeCookingTimer(timer) {
  if (!timer) return null;
  return {
    id: String(timer.id || createId()),
    label: String(timer.label || "Temporizador").trim() || "Temporizador",
    durationMinutes: Math.max(0, Number(timer.durationMinutes || 0)),
    endsAt: Number(timer.endsAt || 0),
    remainingMs: Math.max(0, Number(timer.remainingMs || 0)),
    paused: !!timer.paused,
    stepId: String(timer.stepId || "").trim(),
    mealId: String(timer.mealId || "").trim(),
    reminderId: isUuid(timer.reminderId) ? String(timer.reminderId).trim() : "",
  };
}

function persistCookingState() {
  if (!state.session?.user) return;
  const cooking = state.cooking;
  const timers = sortCookingTimers((cooking?.activeTimers || []).map(serializeCookingTimer).filter(Boolean));
  const currentMealId = String(cooking?.mealId || "").trim();
  const currentMode = String(cooking?.mode || "").trim();
  const currentMeal = currentMealId ? getMealById(currentMealId) : null;
  const currentStages = currentMeal ? getCookingStageList(currentMeal) : [];
  const safeStepIndex = currentStages.length
    ? Math.max(0, Math.min(Number(cooking?.stepIndex || 0), currentStages.length - 1))
    : 0;
  const currentStep = currentStages[safeStepIndex] || null;
  const hasRecoverableMeal = !!currentMealId && currentMode === "active";
  const shouldPersist = hasRecoverableMeal || timers.length > 0;

  if (!shouldPersist) {
    removeLocal("cooking");
    syncWeekCookingSnapshot(null);
    return;
  }

  const snapshot = {
    mode: hasRecoverableMeal ? currentMode : "picker",
    mealId: currentMealId || null,
    stepIndex: safeStepIndex,
    stepId: currentStep?.id || "",
    stepTitle: currentStep?.title || "",
    displayStepTitle: currentStep?.title || "",
    displayStepNumber: currentStages.length ? `${safeStepIndex + 1} / ${currentStages.length}` : "",
    activeTimers: timers,
    updatedAt: new Date().toISOString(),
  };

  writeLocal("cooking", snapshot);
  syncWeekCookingSnapshot(snapshot);
}

function clearPersistedCookingState(options = {}) {
  removeLocal("cooking");
  state.pendingCookingRecovery = null;
  syncWeekCookingSnapshot(null);
  if (options.resetCooking) {
    state.cooking = null;
  }
}

function getCookingFeedbackTarget(modalState = state.modal) {
  const mealId = String(modalState?.mealId || "").trim();
  return mealId ? getMealById(mealId) : getCookingTarget();
}

function getCookingFeedbackRatingLabel(rating) {
  if (rating >= 5) return "Me encantó";
  if (rating === 4) return "Bastante bien";
  if (rating === 3) return "Aceptable";
  if (rating === 2) return "Regular";
  if (rating === 1) return "Flojita";
  return "Valora la receta";
}

function renderCookingFeedbackReasonPill(option, activeReasons) {
  const active = activeReasons.includes(option.key);
  return `
    <button
      class="vc-pill ${active ? "active" : ""}"
      type="button"
      data-action="toggle-cook-feedback-reason"
      data-value="${option.key}"
    >
      <span class="vc-pill-content">
        <span class="vc-pill-copy">
          <strong class="vc-pill-label">${escapeHtml(option.label)}</strong>
          <small>${escapeHtml(option.hint)}</small>
        </span>
      </span>
      <span class="vc-pill-check" aria-hidden="true"></span>
    </button>
  `;
}

function markCookingMealCompleted(mealId, feedbackPatch = {}) {
  const target = mealId ? getMealById(mealId) : getCookingTarget();
  if (!target) return null;
  const cookedAt = new Date().toISOString();
  updateMeal(target.meal.id, (meal) => ({
    ...meal,
    feedback: {
      ...(meal.feedback || {}),
      cookedAt,
      ...feedbackPatch,
    },
  }));
  return { ...target, cookedAt };
}

async function completeCookingSession(options = {}) {
  const notice = String(options.notice || "").trim();
  clearCookingMicHintTimer();
  stopHandsFreeMode();
  stopCookingTimer();
  clearPersistedCookingState({ resetCooking: true });
  state.modal = null;
  state.notice = notice;
  state.error = "";
  state.currentView = options.view || "week";
  syncHistoryFromState({ mode: options.historyMode || "push", view: state.currentView });
  render();
}

async function submitCookingFeedbackAndFinish(options = {}) {
  const modalState = state.modal;
  if (!modalState || modalState.type !== "cook-feedback") return false;
  const target = getCookingFeedbackTarget(modalState);
  if (!target) return false;

  const rating = Math.max(1, Math.min(5, Number(options.rating || modalState.rating || 0)));
  const reasons = Array.isArray(options.reasons) ? options.reasons : (modalState.reasons || []);
  const skipReasonsValidation = !!options.skipReasonsValidation;

  if (rating <= 4 && !skipReasonsValidation && !reasons.length) {
    state.modal.inlineError = "Elige al menos un motivo para que pueda afinar mejor las próximas recetas.";
    render();
    return false;
  }

  markCookingMealCompleted(target.meal.id, {
    recipeRating: rating,
    recipeReasons: reasons,
  });
  await saveWeek();
  await saveFeedback({
    id: createId(),
    weekId: state.week?.id,
    mealId: target.meal.id,
    type: "cook_rating",
    payload: {
      rating,
      reasons,
      mealTitle: target.meal.title,
      mealDate: target.day.date,
      mealKey: target.mealKey,
      prepMinutes: target.meal.prepMinutes,
      difficulty: target.meal.difficulty,
      calories: target.meal.calories,
    },
    createdAt: new Date().toISOString(),
  });

  state.modal = {
    ...modalState,
    type: "cook-feedback",
    mealId: target.meal.id,
    rating,
    reasons,
    submitted: true,
    inlineError: "",
  };
  render();
  return true;
}

function queueCookingSnapshotRemoteSync(delayMs = 600) {
  if (cookingSnapshotSyncTimer) {
    window.clearTimeout(cookingSnapshotSyncTimer);
    cookingSnapshotSyncTimer = null;
  }
  if (!state.week || !state.client || !state.session?.user) return;
  cookingSnapshotSyncTimer = window.setTimeout(() => {
    cookingSnapshotSyncTimer = null;
    void saveWeek();
  }, Math.max(0, Number(delayMs || 0)));
}

function syncWeekCookingSnapshot(snapshot) {
  if (!state.week) return;
  state.week.cookingSnapshot = snapshot ? { ...snapshot } : null;
  writeLocal("week", normalizeWeek(state.week));
  queueCookingSnapshotRemoteSync(snapshot ? 600 : 0);
}

function resolveCookingStageSnapshot(target, options = {}) {
  const stages = getCookingStageList(target);
  if (!stages.length) {
    return {
      stages,
      stepIndex: 0,
      step: null,
    };
  }

  const requestedStepId = String(options.stepId || "").trim();
  const requestedStepTitle = String(options.stepTitle || "").trim().toLowerCase();
  const requestedStepIndex = Math.max(0, Number(options.stepIndex || 0));
  const preferIndex = !!options.preferIndex;
  const indexMatchedStep = stages[Math.max(0, Math.min(requestedStepIndex, stages.length - 1))] || null;
  const idMatchedStep = stages.find((step) => requestedStepId && step.id === requestedStepId) || null;
  const titleMatchedStep = stages.find((step) => requestedStepTitle && String(step.title || "").trim().toLowerCase() === requestedStepTitle) || null;
  const matchedStep = preferIndex
    ? (indexMatchedStep || idMatchedStep || titleMatchedStep || stages[0] || null)
    : (idMatchedStep || titleMatchedStep || indexMatchedStep || stages[0] || null);
  const stepIndex = matchedStep ? stages.findIndex((step) => step.id === matchedStep.id) : 0;
  return {
    stages,
    stepIndex: Math.max(0, stepIndex),
    step: matchedStep,
  };
}

function readPersistedCookingState() {
  const localStored = readLocal("cooking", null);
  const weekStored = state.week?.cookingSnapshot || readLocal("week", null)?.cookingSnapshot || null;
  const stored = [localStored, weekStored]
    .filter((entry) => entry && typeof entry === "object")
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0] || null;
  if (!stored || typeof stored !== "object") return null;

  const mealId = String(stored.mealId || "").trim();
  if (!mealId) return null;
  const mode = mealId ? String(stored.mode || "active").trim() : "picker";
  const target = mealId ? getMealById(mealId) : null;
  if (!target) return null;
  const requestedStepIndex = Math.max(0, Number(stored.stepIndex || 0));
  const { stages, stepIndex: safeStepIndex, step: safeStep } = resolveCookingStageSnapshot(target, {
    stepId: stored.stepId || "",
    stepTitle: stored.stepTitle || "",
    stepIndex: requestedStepIndex,
    preferIndex: true,
  });
  const activeTimers = (Array.isArray(stored.activeTimers) ? stored.activeTimers : [])
    .map(serializeCookingTimer)
    .filter((timer) => timer && (!timer.mealId || !!getMealById(timer.mealId)));
  const hasRecoverableTimers = activeTimers.length > 0;
  const isRecoverableMode = mode === "active";
  const snapshotAge = Date.now() - new Date(stored.updatedAt || 0).getTime();

  if ((!isRecoverableMode && !hasRecoverableTimers) || !Number.isFinite(snapshotAge) || snapshotAge > COOKING_RECOVERY_MAX_AGE_MS) {
    removeLocal("cooking");
    syncWeekCookingSnapshot(null);
    return null;
  }

  return {
    mode,
    mealId,
    mealTitle: target.meal?.title || "",
    mealLabel: [target.day?.label, MEAL_LABELS[target.mealKey] || ""].filter(Boolean).join(" · "),
    stepIndex: safeStepIndex,
    stepId: safeStep?.id || String(stored.stepId || "").trim(),
    stepTitle: String(stored.stepTitle || safeStep?.title || "").trim(),
    displayStepTitle: String(stored.displayStepTitle || stored.stepTitle || safeStep?.title || "").trim(),
    displayStepNumber: String(stored.displayStepNumber || "").trim(),
    activeTimers,
    updatedAt: stored.updatedAt || "",
  };
}

function restorePersistedCookingState() {
  const snapshot = readPersistedCookingState();
  if (!snapshot) return false;
  const cooking = createCookingState(snapshot.mode, snapshot.mealId || null);
  cooking.stepIndex = Math.max(0, Number(snapshot.stepIndex || 0));
  cooking.activeTimers = snapshot.activeTimers.map((timer) => ({ ...timer }));
  state.cooking = cooking;
  syncPrimaryCookingTimer();
  return true;
}

function getCookingStageList(target) {
  if (!target) return [];
  const ingredientStep = {
    id: `${target.meal.id}-ingredients`,
    kind: "ingredients",
    title: "Paso 1 - Preparación",
    copy: "Coge los ingredientes necesarios para esta receta.",
    ingredients: target.meal.ingredients || [],
  };

  const recipeSteps = (target.meal.cookingSteps || []).map((step, index) => ({
    ...step,
    kind: "instruction",
    title: `Paso ${index + 2} - ${step.title}`,
  }));

  return [ingredientStep, ...recipeSteps];
}

function getCookingStage(target) {
  const stages = getCookingStageList(target);
  const stepIndex = Math.max(0, Math.min(state.cooking?.stepIndex || 0, Math.max(0, stages.length - 1)));
  return {
    stages,
    stepIndex,
    current: stages[stepIndex] || null,
  };
}

function isImmersiveCookMode() {
  return state.currentView === "cook" && state.cooking?.mode === "active" && !!getCookingTarget();
}

function getCookingImageState(step) {
  if (!step || !state.cooking?.stepImages) return null;
  return state.cooking.stepImages[step.id] || null;
}

function isVisibleCookingStep(mealId, stepId) {
  if (state.currentView !== "cook" || !mealId || !stepId) return false;
  const target = getCookingTarget();
  if (!target || target.meal.id !== mealId) return false;
  return getCookingStage(target).current?.id === stepId;
}

async function ensureCookingGuidance(mealId) {
  const target = getMealById(mealId);
  if (!target || !state.week) return;

  const currentSteps = target.meal.cookingSteps || [];
  const hasSavedGuidance = !!target.meal.guidanceRefined && currentSteps.length;
  if (hasSavedGuidance || state.cooking?.guidanceStatus === "done") {
    state.cooking.guidanceStatus = "done";
    render();
    return;
  }

  ensureCookingState();
  state.cooking.guidanceStatus = "loading";
  render();

  try {
    const data = await invokePlannerStable({
      action: "cook_guidance",
      profile: plannerProfilePayload(),
      mealKey: target.mealKey,
      meal: {
        title: target.meal.title,
        summary: target.meal.summary,
        prep_minutes: target.meal.prepMinutes,
        difficulty: target.meal.difficulty,
        servings: target.meal.servings,
        ingredients: target.meal.ingredients,
      },
    });

    const nextSteps = Array.isArray(data.steps) ? data.steps.map(normalizeCookingStep).filter((step) => step.text) : [];
    if (nextSteps.length) {
      updateMeal(mealId, (meal) => ({
        ...meal,
        cookingSteps: nextSteps,
        guidanceRefined: true,
      }));
      await saveWeek();
      if (state.cooking?.mealId === mealId) {
        persistCookingState();
      }
    }
    state.cooking.guidanceStatus = "done";
    state.notice = "";
    state.error = "";
  } catch (_error) {
    state.cooking.guidanceStatus = "error";
  } finally {
    render();
  }
}

async function ensureStepIllustration(mealId, step, options = {}) {
  if (!step || step.kind !== "instruction" || (!step.imagePrompt && !step.imageSearchQuery && !step.text) || !state.cooking) return;
  const sessionId = options.sessionId || state.cooking?.sessionId || "";
  const renderWhileLoading = options.renderWhileLoading !== false;
  if (state.cooking.imageSupport === "unavailable") {
    state.cooking.stepImages[step.id] = { status: "error" };
    if (renderWhileLoading && isVisibleCookingStep(mealId, step.id)) render();
    return;
  }
  if (state.cooking.stepImages?.[step.id]?.status === "ready" || state.cooking.stepImages?.[step.id]?.status === "loading") return;

  state.cooking.stepImages[step.id] = { status: "loading" };
  if (renderWhileLoading && isVisibleCookingStep(mealId, step.id)) render();

  try {
    const target = getMealById(mealId);
    if (!target) return;

    const data = await fetchStepIllustration({
      meal: {
        title: target.meal.title,
        summary: target.meal.summary,
      },
      step: {
        title: step.title,
        text: step.text,
        image_prompt: step.imagePrompt,
        image_search_query: step.imageSearchQuery,
      },
    });

    if (!state.cooking || state.cooking.sessionId !== sessionId) {
      return;
    }

    if (data?.image?.src || data?.image?.data) {
      state.cooking.imageSupport = "ready";
      state.cooking.stepImages[step.id] = {
        status: "ready",
        src: data.image.src || `data:${data.image.mimeType || "image/png"};base64,${data.image.data}`,
        provider: data.image.provider || "",
        attributionLabel: data.image.attributionLabel || "",
        attributionUrl: data.image.attributionUrl || "",
      };
    } else if (data?.supportAvailable === false) {
      state.cooking.imageSupport = "unavailable";
      state.cooking.stepImages[step.id] = {
        status: "error",
        reason: data?.error || "",
      };
    } else {
      state.cooking.stepImages[step.id] = {
        status: "error",
        reason: data?.error || "",
      };
    }
  } catch (_error) {
    if (!state.cooking || state.cooking.sessionId !== sessionId) {
      return;
    }
    console.error("[VelociChef] Error preparando la ilustracion del paso", {
      mealId,
      stepId: step.id,
      error: _error instanceof Error ? _error.message : _error,
    });
    state.cooking.stepImages[step.id] = {
      status: "error",
      reason: _error instanceof Error ? _error.message : "",
    };
  } finally {
    if (renderWhileLoading && isVisibleCookingStep(mealId, step.id)) render();
  }
}

async function prefetchCookingIllustrations(mealId, sessionId = state.cooking?.sessionId || "") {
  const target = getMealById(mealId);
  if (!target || !state.cooking || state.cooking.sessionId !== sessionId) return;

  const instructionSteps = getCookingStageList(target).filter((step) => step.kind === "instruction");
  if (!instructionSteps.length) return;

  let cursor = 0;
  const parallel = Math.min(2, instructionSteps.length);

  const workers = Array.from({ length: parallel }, async () => {
    while (cursor < instructionSteps.length && state.cooking?.sessionId === sessionId) {
      const nextStep = instructionSteps[cursor];
      cursor += 1;
      if (!nextStep) return;
      await ensureStepIllustration(mealId, nextStep, {
        sessionId,
        renderWhileLoading: false,
      });
    }
  });

  await Promise.allSettled(workers);
}

async function startCookingFlow(mealId, mode = "active", options = {}) {
  stopHandsFreeMode();
  if (!options.preserveTimers) {
    stopCookingTimer();
  }
  clearCookingMicHintTimer();
  state.notice = "";
  state.cooking = createCookingState(mode, mealId);
  const initialTarget = mealId ? getMealById(mealId) : null;
  if (initialTarget) {
    const initialSnapshot = resolveCookingStageSnapshot(initialTarget, {
      stepId: options.initialStepId || options.stepId || "",
      stepTitle: options.initialStepTitle || options.stepTitle || "",
      stepIndex: options.initialStepIndex ?? options.stepIndex ?? 0,
      preferIndex: !!options.preferStepIndex,
    });
    state.cooking.stepIndex = initialSnapshot.stepIndex;
  }
  if (options.preserveTimers && Array.isArray(options.activeTimers) && options.activeTimers.length) {
    state.cooking.activeTimers = options.activeTimers.map((timer) => ({ ...timer }));
    syncPrimaryCookingTimer();
    if ((state.cooking.activeTimers || []).some((timer) => !timer.paused) && !state.timerTicker) {
      state.timerTicker = window.setInterval(syncCookingTimer, 1000);
    }
  }
  persistCookingState();
  const sessionId = state.cooking.sessionId;
  state.currentView = "cook";
  syncHistoryFromState({ mode: options.historyMode || "push", view: "cook", mealId, stepId: "" });
  render();
  window.scrollTo(0, 0);
  scheduleCookingMicHint(sessionId);

  await ensureCookingGuidance(mealId);

  const target = getMealById(mealId);
  if (!target || !state.cooking || state.cooking.sessionId !== sessionId || state.cooking.mealId !== mealId) return;
  const liveStepIndex = Math.max(0, Number(state.cooking.stepIndex ?? options.initialStepIndex ?? options.stepIndex ?? 0));
  const resolvedSnapshot = resolveCookingStageSnapshot(target, {
    stepId: options.initialStepId || options.stepId || "",
    stepTitle: options.initialStepTitle || options.stepTitle || "",
    stepIndex: liveStepIndex,
    preferIndex: true,
  });
  state.cooking.stepIndex = resolvedSnapshot.stepIndex;
  persistCookingState();
  void prefetchCookingIllustrations(mealId, sessionId);
}

function focusCookingStep(mealId, stepId = "") {
  if (!stepId || !state.cooking || state.cooking.mealId !== mealId) return false;
  const target = getMealById(mealId);
  if (!target) return false;
  const { stages } = getCookingStage(target);
  const nextIndex = stages.findIndex((step) => step.id === stepId);
  if (nextIndex < 0) return false;
  state.cooking.stepIndex = nextIndex;
  state.cooking.timerMenuOpen = false;
  persistCookingState();
  window.scrollTo(0, 0);
  return true;
}

function focusCookingStepIndex(mealId, stepIndex = 0) {
  if (!state.cooking || state.cooking.mealId !== mealId) return false;
  const target = getMealById(mealId);
  if (!target) return false;
  const { stages } = getCookingStage(target);
  if (!stages.length) return false;
  const nextIndex = Math.max(0, Math.min(Number(stepIndex || 0), stages.length - 1));
  state.cooking.stepIndex = nextIndex;
  state.cooking.timerMenuOpen = false;
  persistCookingState();
  window.scrollTo(0, 0);
  return true;
}

async function openCookingSession(mealId, options = {}) {
  const mode = options.mode || "active";
  const stepId = options.stepId || "";
  const stepTitle = options.stepTitle || "";
  const stepIndex = Math.max(0, Number(options.stepIndex || 0));
  const preferStepIndex = !!options.preferStepIndex;
  await startCookingFlow(mealId, mode, {
    preserveTimers: !!options.preserveTimers,
    activeTimers: options.activeTimers || [],
    historyMode: options.historyMode || "push",
    initialStepId: stepId,
    initialStepTitle: stepTitle,
    initialStepIndex: stepIndex,
    preferStepIndex,
  });
  const target = getMealById(mealId);
  const resolvedSnapshot = target ? resolveCookingStageSnapshot(target, {
    stepId,
    stepTitle,
    stepIndex,
    preferIndex: preferStepIndex,
  }) : null;
  if ((resolvedSnapshot && focusCookingStepIndex(mealId, resolvedSnapshot.stepIndex)) || focusCookingStep(mealId, stepId) || focusCookingStepIndex(mealId, stepIndex)) {
    const target = getMealById(mealId);
    const currentStep = target ? getCookingStage(target).current : null;
    if (currentStep?.kind === "instruction") {
      void ensureStepIllustration(mealId, currentStep, { sessionId: state.cooking?.sessionId || "" });
    }
    syncHistoryFromState({ mode: "replace", view: "cook", mealId, stepId: currentStep?.id || "" });
    render();
  }
}

function updateMeal(mealId, updater) {
  if (!state.week) return;
  state.week.days = state.week.days.map((day) => ({
    ...day,
    meals: Object.fromEntries(
      Object.entries(day.meals || {}).map(([mealKey, meal]) => [
        mealKey,
        meal.id === mealId ? updater(meal, day, mealKey) : meal,
      ]),
    ),
  }));
  state.week.shoppingList = aggregateShopping(state.week.days).map((item) => {
    const existing = state.week.shoppingList.find((current) => current.name === item.name && current.unit === item.unit);
    return {
      ...item,
      pantryStatus: normalizeShoppingStatus(existing?.pantryStatus),
    };
  });
  state.week.freezerItems = buildFreezerItems(state.week.days);
}

function isWeekEndingSoon(week) {
  if (!week?.endDate) return false;
  return compareIsoDate(week.endDate, addDays(getTomorrowIso(), 1)) <= 0;
}

function shouldPromptShopping(week) {
  return !!week && !week.shoppingCompleted;
}

function combineDateAndTime(isoDate, time) {
  const [hours, minutes] = String(time || "12:00").split(":").map(Number);
  const date = fromIsoDate(isoDate);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function buildReminderUrl(reminder) {
  const params = new URLSearchParams({
    view: "notifications",
    reminder: reminder.id,
  });
  if (reminder.kind === "meal") {
    params.set("intent", "cook");
  }
  return `${APP_BASE_URL}?${params.toString()}`;
}

function buildCookSessionUrl(mealId, stepId = "") {
  const params = new URLSearchParams({
    view: "cook",
    meal: mealId,
  });
  if (stepId) {
    params.set("step", stepId);
  }
  return `${APP_BASE_URL}?${params.toString()}`;
}

function getCurrentCookingStepId() {
  if (state.currentView !== "cook" || !state.cooking?.mealId) return "";
  const target = getMealById(state.cooking.mealId);
  if (!target) return "";
  return getCookingStage(target).current?.id || "";
}

function buildAppUrlFromState(overrides = {}) {
  if (!state.session?.user) return APP_BASE_URL;

  const params = new URLSearchParams();
  const requestedView = normalizeView(overrides.view || state.currentView || "home");
  const onboardingView = !state.profile?.onboardingCompleted || requestedView === "onboarding";

  if (onboardingView) {
    params.set("view", "onboarding");
  } else if (requestedView !== "home") {
    params.set("view", requestedView);
  }

  if (requestedView === "notifications") {
    params.set("tab", overrides.tab || state.notificationTab || "pending");
  }

  if (requestedView === "cook") {
    const mealId = overrides.mealId !== undefined ? overrides.mealId : (state.cooking?.mealId || "");
    const stepId = overrides.stepId !== undefined ? overrides.stepId : getCurrentCookingStepId();
    if (mealId) params.set("meal", mealId);
    if (stepId) params.set("step", stepId);
  }

  const query = params.toString();
  return query ? `${APP_BASE_URL}?${query}` : APP_BASE_URL;
}

function syncHistoryFromState(options = {}) {
  if (!window.history?.replaceState) return;
  const mode = options.mode === "push" ? "pushState" : "replaceState";
  const url = options.url || buildAppUrlFromState(options);

  if (isRestoringHistory) {
    lastHistoryUrl = window.location.href;
    historyInitialized = true;
    return;
  }

  if (!historyInitialized) {
    window.history.replaceState({ velocichef: true }, "", url);
    historyInitialized = true;
    lastHistoryUrl = url;
    return;
  }

  if (mode === "pushState" && url === lastHistoryUrl) return;
  if (mode === "replaceState" && url === lastHistoryUrl && !options.force) return;

  window.history[mode]({ velocichef: true }, "", url);
  lastHistoryUrl = url;
}

function normalizeReminder(rawReminder) {
  if (!rawReminder) return null;
  const stableKey = String(rawReminder.key || rawReminder.id || createId()).trim();
  const safeId = isUuid(rawReminder.id)
    ? String(rawReminder.id).trim()
    : (isUuid(rawReminder.reminder_id) ? String(rawReminder.reminder_id).trim() : createId());
  const reminder = {
    id: safeId,
    key: stableKey,
    kind: rawReminder.kind || rawReminder.reminder_kind || "meal",
    groupKey: rawReminder.groupKey || rawReminder.group_key || rawReminder.kind || "meal",
    title: String(rawReminder.title || "").trim(),
    body: String(rawReminder.body || "").trim(),
    triggerAt: rawReminder.triggerAt || rawReminder.trigger_at || new Date().toISOString(),
    customTriggerAt: rawReminder.customTriggerAt || rawReminder.custom_trigger_at || null,
    deliveredAt: rawReminder.deliveredAt || rawReminder.delivered_at || null,
    skippedAt: rawReminder.skippedAt || rawReminder.skipped_at || null,
    mealId: rawReminder.mealId || rawReminder.meal_id || null,
    stepId: rawReminder.stepId || rawReminder.step_id || null,
    mealDate: rawReminder.mealDate || rawReminder.meal_date || null,
    mealKey: rawReminder.mealKey || rawReminder.meal_key || null,
    mealTitle: rawReminder.mealTitle || rawReminder.meal_title || null,
    timerId: rawReminder.timerId || rawReminder.timer_id || null,
    timerLabel: rawReminder.timerLabel || rawReminder.timer_label || null,
    ingredient: rawReminder.ingredient || null,
    dateLabel: rawReminder.dateLabel || rawReminder.date_label || null,
    url: rawReminder.url || "",
  };
  reminder.url = reminder.url || buildReminderUrl(reminder);
  return reminder;
}

function normalizeActivityNotification(rawNotification) {
  if (!rawNotification) return null;
  return {
    id: rawNotification.id || createId(),
    sourceKey: rawNotification.sourceKey || rawNotification.source_key || "",
    kind: String(rawNotification.kind || "info"),
    title: String(rawNotification.title || "").trim(),
    body: String(rawNotification.body || "").trim(),
    createdAt: rawNotification.createdAt || rawNotification.created_at || new Date().toISOString(),
    readAt: rawNotification.readAt || rawNotification.read_at || null,
    actionLabel: String(rawNotification.actionLabel || rawNotification.action_label || "").trim(),
    actionType: String(rawNotification.actionType || rawNotification.action_type || "").trim(),
    reminderId: rawNotification.reminderId || rawNotification.reminder_id || null,
    mealId: rawNotification.mealId || rawNotification.meal_id || null,
    stepId: rawNotification.stepId || rawNotification.step_id || null,
    url: rawNotification.url || "",
  };
}

function getActivityNotifications() {
  return (state.week?.activityNotifications || []).map(normalizeActivityNotification).filter(Boolean);
}

function getUnreadActivityNotifications() {
  return getActivityNotifications().filter((item) => !item.readAt);
}

function getUnreadActivityNotificationCount() {
  return getUnreadActivityNotifications().length;
}

function getActivityNotificationBySourceKey(sourceKey) {
  if (!sourceKey) return null;
  return getActivityNotifications().find((item) => item.sourceKey === sourceKey) || null;
}

async function syncAppBadgeCount() {
  const count = getUnreadActivityNotificationCount();
  try {
    if (typeof navigator === "undefined") return;
    if (count > 0 && typeof navigator.setAppBadge === "function") {
      await navigator.setAppBadge(count);
      return;
    }
    if (count === 0 && typeof navigator.clearAppBadge === "function") {
      await navigator.clearAppBadge();
      return;
    }
    if (count === 0 && typeof navigator.setAppBadge === "function") {
      await navigator.setAppBadge(0);
    }
  } catch (_error) {
    // Ignoramos navegadores sin soporte completo para badge.
  }
}

function getNotificationKindEyebrow(kind) {
  if (kind === "timer") return "Temporizador";
  if (kind === "meal") return "Hora de cocinar";
  if (kind === "thaw") return "Descongelar";
  if (kind === "replan") return "Nueva semana";
  return "Notificación";
}

function buildReminderNotificationPayload(reminder) {
  const kind = String(reminder?.kind || "reminder");
  const moment = reminder?.triggerAt ? getReminderMomentLabel(reminder) : "";
  const defaults = {
    actionLabel: "Abrir",
    actionType: "reminder",
    urgency: "normal",
    requireInteraction: false,
    renotify: false,
    vibrate: [120, 60, 120],
  };

  if (kind === "meal") {
    return {
      title: String(reminder?.title || `Es hora de ponerte con ${String(MEAL_LABELS[reminder?.mealKey] || "la comida").toLowerCase()}`).trim(),
      body: String(reminder?.body || `${reminder?.mealTitle || "Tu plato de hoy"} · ${moment}. Abre VelociChef y empieza con margen.`).trim(),
      actionLabel: "Comenzar",
      actionType: "reminder",
      urgency: "high",
      requireInteraction: false,
      renotify: true,
      vibrate: [160, 70, 160],
    };
  }

  if (kind === "thaw") {
    return {
      title: String(reminder?.title || `Pon a descongelar ${reminder?.ingredient || "ese ingrediente"}`).trim(),
      body: String(reminder?.body || `Lo necesitarás para ${reminder?.mealTitle || "el plato previsto"} del ${reminder?.mealDate ? formatDateLong(reminder.mealDate) : "día de hoy"}.`).trim(),
      actionLabel: "Revisar",
      actionType: "reminder",
      urgency: "high",
      requireInteraction: true,
      renotify: true,
      vibrate: [220, 90, 220],
    };
  }

  if (kind === "replan") {
    return {
      title: String(reminder?.title || "Planifica tu próxima semana").trim(),
      body: String(reminder?.body || "Tu planificación actual está a punto de terminar. Entra y deja lista la siguiente.").trim(),
      actionLabel: "Planificar",
      actionType: "reminder",
      urgency: "normal",
      requireInteraction: false,
      renotify: false,
      vibrate: [110, 50, 110],
    };
  }

  return {
    title: String(reminder?.title || "VelociChef").trim(),
    body: String(reminder?.body || "Tienes un aviso pendiente en tu cocina semanal.").trim(),
    ...defaults,
  };
}

function buildBrowserNotificationPayload(rawNotification) {
  if (!rawNotification) {
    return {
      title: "VelociChef",
      body: "Tienes un aviso pendiente en tu cocina semanal.",
      url: APP_BASE_URL,
      icon: APP_STORE_ICON_PATH,
      badge: APP_STORE_ICON_PATH,
      tag: `velocichef-${Date.now()}`,
      kind: "info",
      actions: [],
      badgeCount: Math.max(1, getUnreadActivityNotificationCount()),
      timestamp: new Date().toISOString(),
      renotify: false,
      requireInteraction: false,
      urgency: "normal",
      vibrate: [],
      actionLabel: "",
      actionType: "",
      reminderId: null,
      mealId: null,
      stepId: null,
      mealDate: null,
      mealKey: null,
      mealTitle: null,
      ingredient: null,
      deliveredAt: null,
    };
  }

  const kind = String(rawNotification.kind || "info");
  const reminderPresentation = kind === "meal" || kind === "thaw" || kind === "replan"
    ? buildReminderNotificationPayload(rawNotification)
    : null;
  const actionLabel = String(
    rawNotification.actionLabel
    || reminderPresentation?.actionLabel
    || (kind === "timer" ? "Seguir" : "Abrir"),
  ).trim();
  const fallbackUrl = kind === "timer" && rawNotification.mealId
    ? buildCookSessionUrl(rawNotification.mealId, rawNotification.stepId || "")
    : APP_BASE_URL;
  const timestamp = rawNotification.timestamp
    || rawNotification.triggerAt
    || rawNotification.createdAt
    || rawNotification.deliveredAt
    || new Date().toISOString();

  return {
    title: String(rawNotification.title || reminderPresentation?.title || "VelociChef").trim(),
    body: String(rawNotification.body || reminderPresentation?.body || "Tienes un aviso pendiente en tu cocina semanal.").trim(),
    url: rawNotification.url || fallbackUrl,
    icon: rawNotification.icon || APP_STORE_ICON_PATH,
    badge: rawNotification.badge || APP_STORE_ICON_PATH,
    tag: rawNotification.tag || rawNotification.id || `${kind}-${Date.now()}`,
    kind,
    actions: actionLabel ? [{ action: "open", title: actionLabel }] : [],
    badgeCount: Math.max(1, Number(rawNotification.badgeCount || getUnreadActivityNotificationCount() || 1)),
    timestamp,
    renotify: rawNotification.renotify ?? reminderPresentation?.renotify ?? (kind === "timer"),
    requireInteraction: rawNotification.requireInteraction ?? reminderPresentation?.requireInteraction ?? (kind === "timer"),
    urgency: String(rawNotification.urgency || reminderPresentation?.urgency || (kind === "timer" ? "high" : "normal")),
    vibrate: Array.isArray(rawNotification.vibrate)
      ? rawNotification.vibrate
      : (Array.isArray(reminderPresentation?.vibrate) ? reminderPresentation.vibrate : (kind === "timer" ? [190, 80, 190] : [])),
    actionLabel,
    actionType: String(rawNotification.actionType || reminderPresentation?.actionType || (kind === "timer" ? "cook" : "")).trim(),
    reminderId: rawNotification.reminderId || rawNotification.id || null,
    mealId: rawNotification.mealId || null,
    stepId: rawNotification.stepId || null,
    mealDate: rawNotification.mealDate || null,
    mealKey: rawNotification.mealKey || null,
    mealTitle: rawNotification.mealTitle || null,
    ingredient: rawNotification.ingredient || null,
    deliveredAt: rawNotification.deliveredAt || null,
  };
}

function isFreshNotificationTimestamp(value, thresholdMs = 120000) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && (Date.now() - time) <= thresholdMs;
}

function clearNotificationBannerTimer() {
  if (!notificationBannerTimer) return;
  window.clearTimeout(notificationBannerTimer);
  notificationBannerTimer = null;
}

function clearSystemBannerTimer() {
  if (!systemBannerTimer) return;
  window.clearTimeout(systemBannerTimer);
  systemBannerTimer = null;
}

function showNotificationBanner(notificationId) {
  clearNotificationBannerTimer();
  state.activeNotificationBannerId = notificationId;
  notificationBannerTimer = window.setTimeout(() => {
    state.activeNotificationBannerId = null;
    notificationBannerTimer = null;
    render();
  }, 5000);
}

function getSystemBannerMessage() {
  const notice = String(state.notice || "").trim();
  const error = String(state.error || "").trim();
  if (!notice && !error) return null;
  if (notice) {
    return {
      key: `notice:${notice}::${error}`,
      kind: error ? "warning" : "note",
      label: error ? "Aviso de sistema" : "Aviso",
      text: sanitizeUiCopy(notice),
      clearNotice: notice,
      clearError: error,
    };
  }
  return {
    key: `error:${error}`,
    kind: "error",
    label: "Algo no salió bien",
    text: sanitizeUiCopy(error),
    clearNotice: "",
    clearError: error,
  };
}

function syncSystemBannerTimer() {
  const banner = getSystemBannerMessage();
  if (!banner) {
    activeSystemBannerKey = "";
    clearSystemBannerTimer();
    return;
  }
  if (activeSystemBannerKey === banner.key && systemBannerTimer) {
    return;
  }

  activeSystemBannerKey = banner.key;
  clearSystemBannerTimer();
  systemBannerTimer = window.setTimeout(() => {
    const currentBanner = getSystemBannerMessage();
    if (!currentBanner || currentBanner.key !== banner.key) {
      activeSystemBannerKey = "";
      systemBannerTimer = null;
      return;
    }

    if (banner.clearNotice && state.notice === banner.clearNotice) {
      state.notice = "";
    }
    if (banner.clearError && state.error === banner.clearError) {
      state.error = "";
    }
    activeSystemBannerKey = "";
    systemBannerTimer = null;
    render();
  }, 5000);
}

function pushActivityNotification(rawNotification, options = {}) {
  if (!state.week) return null;
  const notification = normalizeActivityNotification(rawNotification);
  if (!notification) return null;

  const current = getActivityNotifications();
  const index = notification.sourceKey
    ? current.findIndex((item) => item.sourceKey && item.sourceKey === notification.sourceKey)
    : -1;

  if (index >= 0) {
    current.splice(index, 1);
  }

  current.unshift(notification);
  state.week.activityNotifications = current.slice(0, 40);

  if (options.showBanner !== false) {
    showNotificationBanner(notification.id);
  }

  if (options.persist !== false) {
    void saveWeek();
  }

  void syncAppBadgeCount();
  render();
  return notification;
}

function markAllActivityNotificationsRead() {
  if (!state.week?.activityNotifications?.length) return false;
  let changed = false;
  state.week.activityNotifications = state.week.activityNotifications.map((item) => {
    const normalized = normalizeActivityNotification(item);
    if (!normalized || normalized.readAt) return normalized;
    changed = true;
    return {
      ...normalized,
      readAt: new Date().toISOString(),
    };
  }).filter(Boolean);
  if (changed) {
    void syncAppBadgeCount();
  }
  return changed;
}

function markActivityNotificationRead(notificationId) {
  if (!state.week?.activityNotifications?.length) return false;
  let changed = false;
  state.week.activityNotifications = state.week.activityNotifications.map((item) => {
    const normalized = normalizeActivityNotification(item);
    if (!normalized || normalized.id !== notificationId || normalized.readAt) return normalized;
    changed = true;
    return {
      ...normalized,
      readAt: new Date().toISOString(),
    };
  }).filter(Boolean);
  if (changed) {
    void syncAppBadgeCount();
  }
  return changed;
}

function getActivityNotificationById(notificationId) {
  return getActivityNotifications().find((item) => item.id === notificationId) || null;
}

function getReminderActivitySourceKey(reminder) {
  if (!reminder) return "";
  if (String(reminder.kind || "") === "timer") {
    return `timer:${reminder.timerId || reminder.id}`;
  }
  return `reminder:${reminder.id}`;
}

function buildActivityNotificationFromReminder(reminder) {
  if (!reminder) return null;
  const notificationPayload = buildBrowserNotificationPayload(reminder);
  const isTimerReminder = String(reminder.kind || "") === "timer";
  const timerLabel = String(reminder.timerLabel || "").trim();
  return {
    id: createId(),
    sourceKey: getReminderActivitySourceKey(reminder),
    kind: reminder.kind || "reminder",
    title: isTimerReminder && timerLabel ? `${timerLabel} listo` : notificationPayload.title,
    body: isTimerReminder && timerLabel ? `${timerLabel} ya está listo.` : notificationPayload.body,
    createdAt: reminder.deliveredAt || reminder.triggerAt || new Date().toISOString(),
    readAt: null,
    actionLabel: isTimerReminder ? "Seguir" : (notificationPayload.actionLabel || "Abrir"),
    actionType: isTimerReminder ? "cook" : (notificationPayload.actionType || "reminder"),
    reminderId: reminder.id,
    mealId: reminder.mealId || null,
    stepId: reminder.stepId || null,
    url: notificationPayload.url || reminder.url || "",
  };
}

async function ingestRemoteReminderPayload(rawPayload, options = {}) {
  if (!state.week || !rawPayload) return false;

  const deliveredAt = rawPayload.deliveredAt || rawPayload.delivered_at || new Date().toISOString();
  const reminderId = rawPayload.reminderId || rawPayload.reminder_id || rawPayload.id || "";
  let changed = false;
  let reminder = reminderId ? getReminderById(reminderId) : null;

  if (reminder && reminder.deliveredAt !== deliveredAt) {
    reminder.deliveredAt = deliveredAt;
    changed = true;
  }

  if (!reminder && reminderId) {
    reminder = normalizeReminder({
      id: reminderId,
      key: rawPayload.key || reminderId,
      kind: rawPayload.kind || "reminder",
      groupKey: rawPayload.groupKey || rawPayload.group_key || rawPayload.kind || "reminder",
      title: rawPayload.title || "",
      body: rawPayload.body || "",
      triggerAt: rawPayload.triggerAt || rawPayload.trigger_at || rawPayload.timestamp || deliveredAt,
      deliveredAt,
      mealId: rawPayload.mealId || rawPayload.meal_id || null,
      stepId: rawPayload.stepId || rawPayload.step_id || null,
      mealDate: rawPayload.mealDate || rawPayload.meal_date || null,
      mealKey: rawPayload.mealKey || rawPayload.meal_key || null,
      mealTitle: rawPayload.mealTitle || rawPayload.meal_title || null,
      timerId: rawPayload.timerId || rawPayload.timer_id || null,
      timerLabel: rawPayload.timerLabel || rawPayload.timer_label || null,
      ingredient: rawPayload.ingredient || null,
      dateLabel: rawPayload.dateLabel || rawPayload.date_label || null,
      url: rawPayload.url || "",
    });
    if (reminder) {
      state.week.reminders = [...(state.week.reminders || []), reminder];
      changed = true;
    }
  }

  if (reminder) {
    reminder.deliveredAt = reminder.deliveredAt || deliveredAt;
  }

  const sourceKey = reminder ? getReminderActivitySourceKey(reminder) : "";
  if (reminder && !getActivityNotificationBySourceKey(sourceKey)) {
    const activity = buildActivityNotificationFromReminder(reminder);
    if (activity) {
      activity.createdAt = deliveredAt;
      pushActivityNotification(activity, {
        persist: false,
        showBanner: options.showBanner === true && isFreshNotificationTimestamp(deliveredAt),
      });
      changed = true;
    }
  }

  if (deliveredAt && state.week.lastReminderSyncAt !== deliveredAt) {
    state.week.lastReminderSyncAt = deliveredAt;
    changed = true;
  }

  writeLocal("week", normalizeWeek(state.week));

  if (changed && options.persist !== false) {
    await saveWeek();
    render();
  } else {
    void syncAppBadgeCount();
    render();
  }

  return changed;
}

function finalizeReminder(baseReminder, previousReminder = null) {
  const existing = previousReminder ? normalizeReminder(previousReminder) : null;
  const normalized = normalizeReminder({
    ...baseReminder,
    id: existing?.id || (isUuid(baseReminder.id) ? baseReminder.id : createId()),
    key: baseReminder.key || existing?.key || baseReminder.id || createId(),
    triggerAt: existing?.customTriggerAt || baseReminder.triggerAt,
    customTriggerAt: existing?.customTriggerAt || null,
    deliveredAt: existing?.deliveredAt || null,
    skippedAt: existing?.skippedAt || null,
  });
  normalized.url = buildReminderUrl(normalized);
  return normalized;
}

function getReminderById(reminderId) {
  return (state.week?.reminders || []).find((reminder) => reminder.id === reminderId) || null;
}

function getReminderBucket(reminder, now = new Date()) {
  if (!reminder) return "future";
  return new Date(reminder.triggerAt).getTime() <= now.getTime() ? "pending" : "future";
}

function getReminderKindLabel(reminder) {
  if (reminder.kind === "meal") return "Hora de cocinar";
  if (reminder.kind === "thaw") return "Descongelar";
  if (reminder.kind === "replan") return "Nueva semana";
  return "Aviso";
}

function getReminderMomentLabel(reminder) {
  return formatDateTimeLong(reminder.triggerAt);
}

function getReminderTypeDescription(reminder) {
  if (reminder.kind === "meal") {
    return reminder.mealKey ? MEAL_LABELS[reminder.mealKey] || "Comida" : "Comida";
  }
  if (reminder.kind === "thaw") return "Congelador";
  if (reminder.kind === "replan") return "Plan semanal";
  return "Aviso";
}

function composeReminders() {
  if (!state.week || !state.profile) return [];

  const previousByKey = new Map(
    (state.week.reminders || [])
      .map((reminder) => normalizeReminder(reminder))
      .filter(Boolean)
      .map((reminder) => [reminder.key, reminder]),
  );
  const reminders = [];
  const leadMinutes = Number(state.profile.reminderLeadMinutes || DEFAULT_REMINDER_LEAD_MINUTES);
  const pushReminder = (baseReminder) => {
    reminders.push(finalizeReminder(baseReminder, previousByKey.get(baseReminder.key)));
  };

  state.week.days.forEach((day, index) => {
    Object.entries(day.meals || {}).forEach(([mealKey, meal]) => {
      if (!isMealCookable(meal)) return;
      let date = day.date;
      let time = "12:00";
      let title = `Es hora de empezar con ${meal.title}`;
      let body = `${MEAL_LABELS[mealKey].toLowerCase()} de ${day.label}. Abre VelociChef y cocina con margen.`;

      if (mealKey === "dinner") {
        time = state.profile.dinnerTime || "21:00";
      } else if (mealKey === "lunch") {
        if (state.profile.lunchPrepNightBefore && index > 0) {
          date = state.week.days[index - 1].date;
          time = state.profile.dinnerTime || "20:00";
          title = `Deja listo el almuerzo de mañana: ${meal.title}`;
          body = `Déjalo preparado esta noche para que mañana ${MEAL_LABELS[mealKey].toLowerCase()} vaya sin prisas.`;
        } else {
          time = state.profile.lunchTime || "14:30";
        }
      } else if (mealKey === "breakfast") {
        time = state.profile.breakfastTime || "08:00";
      } else if (mealKey === "snack") {
        time = state.profile.snackTime || "17:30";
      } else if (mealKey === "bites") {
        time = "11:30";
      }

      const mealDate = combineDateAndTime(date, time);
      const triggerAt = new Date(mealDate.getTime() - leadMinutes * 60000);
      pushReminder({
        key: `meal:${day.date}:${mealKey}`,
        kind: "meal",
        groupKey: `meal:${mealKey}`,
        title,
        body,
        triggerAt: triggerAt.toISOString(),
        mealId: meal.id,
        mealDate: day.date,
        mealKey,
        mealTitle: meal.title,
        dateLabel: day.label,
      });
    });
  });

  if (state.week.freezerOptIn) {
    state.week.freezerItems.forEach((item) => {
      const mealDate = combineDateAndTime(
        item.mealDate,
        getMealClock(item.mealKey),
      );
      const triggerAt = new Date(mealDate.getTime() - (Number(item.thawLeadHours || 12) * 3600000));
      pushReminder({
        key: `thaw:${item.mealDate}:${item.mealKey}:${slugify(item.ingredient)}`,
        kind: "thaw",
        groupKey: "thaw",
        title: `Pon a descongelar ${item.ingredient}`,
        body: `Lo vas a necesitar para ${item.mealTitle} del ${formatDateLong(item.mealDate)}.`,
        triggerAt: triggerAt.toISOString(),
        mealDate: item.mealDate,
        mealKey: item.mealKey,
        mealTitle: item.mealTitle,
        ingredient: item.ingredient,
      });
    });
  }

  if (state.week.endDate) {
    const replanDate = combineDateAndTime(addDays(state.week.endDate, -2), "10:00");
    pushReminder({
      key: `replan:${state.week.endDate}`,
      kind: "replan",
      groupKey: "replan",
      title: "Tu semana de VelociChef se acaba pronto",
      body: "Aprovecha un momento y deja planificada la siguiente semana sin repetir todo el onboarding.",
      triggerAt: replanDate.toISOString(),
      mealDate: state.week.endDate,
    });
  }

  return reminders.sort((a, b) => new Date(a.triggerAt).getTime() - new Date(b.triggerAt).getTime());
}

function formatClockFromDate(date) {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScheduledCookingEntries() {
  if (!state.week) return [];
  return flattenMeals(state.week)
    .filter((entry) => isMealCookable(entry.meal))
    .map((entry) => ({
      ...entry,
      cookAt: getCookMoment(entry.day, entry.mealKey),
    }))
    .sort((a, b) => a.cookAt.getTime() - b.cookAt.getTime());
}

function getRemainingCookingEntriesToday(now = new Date()) {
  const todayIso = toIsoDate(now);
  const graceMs = 45 * 60000;
  return getScheduledCookingEntries().filter((entry) =>
    toIsoDate(entry.cookAt) === todayIso && entry.cookAt.getTime() >= now.getTime() - graceMs);
}

function getNextCookingEntry(now = new Date()) {
  const graceMs = 45 * 60000;
  return getScheduledCookingEntries().find((entry) => entry.cookAt.getTime() >= now.getTime() - graceMs) || null;
}

function getRelevantShoppingItemsForEntries(entries, options = {}) {
  const onlyMissing = options.onlyMissing !== false;
  const refs = new Set(entries.map((entry) => `${entry.day.date}__${entry.mealKey}`));
  return (state.week?.shoppingList || [])
    .filter((item) => !onlyMissing || normalizeShoppingStatus(item.pantryStatus) !== "bought")
    .map((item) => ({
      ...item,
      relevantRefs: (item.refs || []).filter((ref) => refs.has(`${ref.date}__${ref.mealKey}`)),
    }))
    .filter((item) => item.relevantRefs.length)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function getTodayMissingShoppingItems(now = new Date()) {
  return getRelevantShoppingItemsForEntries(getRemainingCookingEntriesToday(now), { onlyMissing: true });
}

function getTodayMealLabel(entry) {
  if (!entry) return "";
  const cookTime = formatClockFromDate(entry.cookAt);
  if (entry.mealKey === "lunch" && toIsoDate(entry.cookAt) !== entry.day.date) {
    return `Hoy dejas listo el almuerzo de manana Â· ${cookTime}`;
  }
  return `${MEAL_LABELS[entry.mealKey] || "Comida"} Â· ${cookTime}`;
}

function getWeekTopIngredients(limit = 3) {
  return (state.week?.shoppingList || [])
    .filter((item) => item.name)
    .filter((item) => !item.spice && !item.pantry)
    .sort((a, b) => {
      const refDiff = (b.refs?.length || 0) - (a.refs?.length || 0);
      if (refDiff) return refDiff;
      return (b.quantity || 0) - (a.quantity || 0);
    })
    .slice(0, limit)
    .map((item) => item.name.toLowerCase());
}

function buildWeekSummaryText() {
  if (!state.week) return "";
  const strategy = String(state.week.strategy || "").trim();
  const topIngredients = getWeekTopIngredients();
  const ingredientCopy = topIngredients.length
    ? `Aprovechamos especialmente ${formatNaturalList(topIngredients)} para comprar con mas cabeza.`
    : "La compra esta pensada para reutilizar ingredientes con mas cabeza.";

  if (strategy) {
    return `${strategy} ${ingredientCopy}`.trim();
  }

  const mealCount = flattenMeals(state.week).length;
  return `Esta semana tienes ${mealCount} platos pensados para que la cocina vaya suave, con sabores variados y una compra mas facil de sostener. ${ingredientCopy}`;
}

function parseAppUrl(url) {
  const next = new URL(url, window.location.origin);
  return {
    view: normalizeView(next.searchParams.get("view") || "home"),
    tab: next.searchParams.get("tab") === "future" ? "future" : "pending",
    reminderId: next.searchParams.get("reminder") || "",
    intent: next.searchParams.get("intent") || "",
    mealId: next.searchParams.get("meal") || "",
    stepId: next.searchParams.get("step") || "",
  };
}

function applyIncomingUrl(url) {
  const parsed = parseAppUrl(url);
  state.currentView = parsed.view;
  state.notificationTab = parsed.tab;
  state.pendingReminderLink = parsed.reminderId || parsed.mealId
    ? {
        reminderId: parsed.reminderId,
        intent: parsed.intent,
        mealId: parsed.mealId,
        stepId: parsed.stepId,
      }
    : null;
}

function openReminderModal(reminder, options = {}) {
  if (!reminder) return;
  const forceCookPrompt = !!options.forceCookPrompt;
  const isPending = getReminderBucket(reminder) === "pending";
  if (reminder.kind === "meal" && (forceCookPrompt || isPending)) {
    state.modal = {
      type: "cook-reminder",
      reminderId: reminder.id,
      postponeExpanded: false,
      postponeChoice: "",
      editedTime: formatInputTimeFromIso(new Date(Date.now() + 60 * 60000).toISOString()),
      inlineError: "",
    };
    return;
  }
  state.modal = {
    type: "reminder-detail",
    reminderId: reminder.id,
    editedTime: formatInputTimeFromIso(reminder.triggerAt),
    readOnly: isPending,
  };
}

function openCookingRecoveryPrompt(snapshot = state.pendingCookingRecovery) {
  if (!snapshot?.mealId) return;
  state.modal = {
    type: "cook-recovery",
    mealId: snapshot.mealId,
    stepId: snapshot.stepId || "",
  };
}

function dismissPersistedCookingRecovery() {
  clearPersistedCookingState();
  if (state.modal?.type === "cook-recovery") {
    state.modal = null;
  }
}

function buildCookingRecoverySnapshotFromLink(link) {
  if (!link?.mealId || !state.week) return null;
  const target = getMealById(link.mealId);
  if (!target) return null;
  const resolvedSnapshot = resolveCookingStageSnapshot(target, {
    stepId: link.stepId || "",
    stepIndex: 0,
    preferIndex: false,
  });
  return {
    mode: "active",
    mealId: target.meal.id,
    mealTitle: target.meal.title || "",
    mealLabel: [target.day?.label, MEAL_LABELS[target.mealKey] || ""].filter(Boolean).join(" · "),
    stepIndex: resolvedSnapshot.stepIndex,
    stepId: resolvedSnapshot.step?.id || String(link.stepId || "").trim(),
    stepTitle: resolvedSnapshot.step?.title || "",
    displayStepTitle: resolvedSnapshot.step?.title || "",
    displayStepNumber: resolvedSnapshot.stages.length ? `${resolvedSnapshot.stepIndex + 1} / ${resolvedSnapshot.stages.length}` : "",
    activeTimers: [],
    updatedAt: new Date().toISOString(),
  };
}

function refreshPendingCookingRecovery(options = {}) {
  const snapshot = readPersistedCookingState();
  const shouldPrompt = options.prompt !== false;
  const canPrompt = state.modal?.type !== "cook-recovery" && !(state.currentView === "cook" && state.cooking?.mealId);

  if (!snapshot?.mealId) {
    state.pendingCookingRecovery = null;
    if (state.modal?.type === "cook-recovery") {
      state.modal = null;
    }
    return false;
  }

  state.pendingCookingRecovery = snapshot;
  if (shouldPrompt && canPrompt) {
    openCookingRecoveryPrompt(snapshot);
  }
  return true;
}

async function resumePersistedCooking(snapshot = state.pendingCookingRecovery) {
  if (!snapshot?.mealId) return;
  state.pendingCookingRecovery = null;
  state.modal = null;
  await openCookingSession(snapshot.mealId, {
    mode: "active",
    stepIndex: snapshot.stepIndex || 0,
    preferStepIndex: true,
    preserveTimers: Array.isArray(snapshot.activeTimers) && snapshot.activeTimers.length > 0,
    activeTimers: snapshot.activeTimers || [],
    historyMode: "push",
  });
}

async function resolvePendingReminderLink(options = {}) {
  if (!state.pendingReminderLink || !state.week) return;
  const pendingLink = { ...state.pendingReminderLink };
  state.pendingReminderLink = null;

  if (pendingLink.mealId) {
    await openCookingSession(pendingLink.mealId, {
      mode: "active",
      stepId: pendingLink.stepId || "",
      stepIndex: Number.isFinite(Number(pendingLink.stepIndex)) ? Number(pendingLink.stepIndex) : 0,
      preserveTimers: !!options.preserveTimers,
      activeTimers: options.activeTimers || [],
      historyMode: options.historyMode || "replace",
    });
    return;
  }

  if (!pendingLink.reminderId) return;
  const reminder = getReminderById(pendingLink.reminderId);
  if (!reminder) return;
  state.currentView = "notifications";
  state.notificationTab = getReminderBucket(reminder);
  openReminderModal(reminder, { forceCookPrompt: pendingLink.intent === "cook" });
  syncHistoryFromState({ mode: options.historyMode || "replace", view: "notifications", tab: state.notificationTab });
}

async function restoreNavigationFromUrl(url) {
  isRestoringHistory = true;
  applyIncomingUrl(url);
  historyInitialized = true;
  lastHistoryUrl = window.location.href;
  state.modal = null;
  state.activeMenu = null;

  try {
    if (!state.session?.user) {
      render();
      return;
    }

    if (!state.profile?.onboardingCompleted || state.currentView === "onboarding") {
      render();
      return;
    }

    if (state.currentView !== "cook") {
      clearCookingMicHintTimer();
      stopHandsFreeMode();
    }

    if (state.currentView === "notifications") {
      clearNotificationBannerTimer();
      state.activeNotificationBannerId = null;
    }

    if (state.pendingReminderLink) {
      const preservedTimers = getActiveCookingTimers();
      await resolvePendingReminderLink({
        historyMode: "replace",
        preserveTimers: preservedTimers.length > 0,
        activeTimers: preservedTimers,
      });
      if (state.currentView === "notifications") {
        render();
      }
      return;
    }

    if (state.currentView === "cook") {
      const suggested = getSuggestedCookingTarget();
      const preservedTimers = getActiveCookingTimers();
      state.cooking = createCookingState(suggested ? "suggest" : "picker", suggested?.meal.id || null);
      if (preservedTimers.length) {
        state.cooking.activeTimers = preservedTimers.map((timer) => ({ ...timer }));
        syncPrimaryCookingTimer();
      }
      render();
      return;
    }

    render();

    if (state.currentView === "profile" || state.currentView === "notifications") {
      refreshNotificationDeviceState().then(() => {
        if (!isRestoringHistory) render();
      }).catch(() => {});
    }
  } finally {
    isRestoringHistory = false;
  }
}

function clearReminderTimers() {
  state.reminderTimers.forEach((timerId) => clearTimeout(timerId));
  state.reminderTimers = [];
}

async function showBrowserNotification(reminder) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const payload = buildBrowserNotificationPayload(reminder);
  const timestamp = new Date(payload.timestamp).getTime();

  if (state.workerRegistration?.showNotification) {
    await state.workerRegistration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: {
        url: payload.url,
        payload,
      },
      tag: payload.tag,
      actions: payload.actions,
      renotify: !!payload.renotify,
      requireInteraction: !!payload.requireInteraction,
      timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
      vibrate: payload.vibrate,
    });
    return;
  }

  new Notification(payload.title, {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    data: {
      url: payload.url,
      payload,
    },
    actions: payload.actions,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    renotify: !!payload.renotify,
    requireInteraction: !!payload.requireInteraction,
    vibrate: payload.vibrate,
  });
}

async function maybeFireReminder(reminder) {
  if (!state.week || !state.profile?.notificationEnabled) return;
  if (reminder.deliveredAt) return;
  reminder.deliveredAt = new Date().toISOString();
  pushActivityNotification(buildActivityNotificationFromReminder(reminder), { persist: false, showBanner: true });
  await showBrowserNotification(reminder).catch(() => {});
  await saveWeek();
}

function scheduleReminders() {
  clearReminderTimers();
  if (!state.week || !state.profile?.notificationEnabled) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = Date.now();
  state.week.reminders.forEach((reminder) => {
    if (reminder.deliveredAt) return;
    const diff = new Date(reminder.triggerAt).getTime() - now;
    if (diff <= 0) return;
    const timerId = window.setTimeout(() => {
      maybeFireReminder(reminder);
    }, diff);
    state.reminderTimers.push(timerId);
  });
}

async function flushDueReminders() {
  if (!state.week || !state.profile?.notificationEnabled) return;
  const now = Date.now();
  const due = state.week.reminders.filter((reminder) => !reminder.deliveredAt && new Date(reminder.triggerAt).getTime() <= now);
  for (const reminder of due) {
    // Secuencial para no disparar demasiadas a la vez.
    // eslint-disable-next-line no-await-in-loop
    await maybeFireReminder(reminder);
  }
}

async function requestNotifications() {
  const previousGlobalState = !!state.profile?.notificationEnabled;
  const currentDevice = await refreshNotificationDeviceState();

  if (!("Notification" in window)) {
    state.error = "Este navegador no soporta notificaciones web.";
    render();
    return false;
  }
  if (currentDevice.needsInstall) {
    state.notice = "En iPhone, los avisos solo se pueden activar desde la app instalada en la pantalla de inicio. Ábrela desde allí y vuelve a intentarlo.";
    state.error = "";
    render();
    return false;
  }
  const permission = currentDevice.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission === "granted") {
    try {
      const push = await ensurePushSubscription(true);
      state.profile.notificationEnabled = true;
      await saveProfile();
      await refreshNotificationDeviceState();
      if (state.week) {
        state.week.reminders = composeReminders();
        await saveWeek();
        scheduleReminders();
      }
      syncRemoteCookingTimers();
      state.notice = isNotificationActiveOnCurrentDevice()
        ? "Avisos activados en este dispositivo. Te avisaré también aunque la app no esté abierta."
        : "Los avisos están activados mientras la app siga abierta en este dispositivo.";
      state.error = "";
      return true;
    } catch (_error) {
      state.profile.notificationEnabled = previousGlobalState || Notification.permission === "granted";
      await saveProfile();
      await refreshNotificationDeviceState();
      state.notice = "He dejado los avisos preparados para este dispositivo, pero aún no he cerrado la activación completa.";
      state.error = "No pude completar la activación de avisos ahora mismo.";
      render();
      return false;
    }
  }
  await refreshNotificationDeviceState();
  state.notice = "Las notificaciones siguen desactivadas. Puedes volver a activarlas más tarde desde tu perfil.";
  return false;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" });
    state.workerRegistration = await navigator.serviceWorker.ready;
    await state.workerRegistration?.update?.();
    await refreshNotificationDeviceState();
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "velocichef-push" && event.data?.payload && state.week) {
        void ingestRemoteReminderPayload(event.data.payload, {
          showBanner: document.visibilityState === "visible",
        });
      }

      if (event.data?.payload && state.week) {
        void ingestRemoteReminderPayload(event.data.payload, {
          showBanner: false,
          persist: false,
        });
      }

      const url = event.data?.url;
      if (!url) return;
      applyIncomingUrl(url);
      if (state.week) {
        void resolvePendingReminderLink();
      }
      render();
    });
  } catch (_error) {
    state.workerRegistration = null;
  }
  return state.workerRegistration;
}

function clearTimerTicker() {
  if (!state.timerTicker) return;
  clearInterval(state.timerTicker);
  state.timerTicker = null;
}

function formatCountdown(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function syncCookingTimer() {
  if (!state.cooking) {
    clearTimerTicker();
    return;
  }

  const timers = [...(state.cooking.activeTimers || [])];
  if (!timers.length) {
    clearTimerTicker();
    return;
  }

  const now = Date.now();
  const finished = [];
  const nextTimers = timers.filter((timer) => {
    if (timer.paused) return true;
    const remainingMs = timer.endsAt - now;
    timer.remainingMs = remainingMs;
    if (remainingMs <= 0) {
      timer.remainingMs = 0;
      finished.push(timer);
      return false;
    }
    return true;
  });

  state.cooking.activeTimers = nextTimers;
  syncPrimaryCookingTimer();

  if (finished.length) {
    finished.forEach((timer) => {
      const sourceKey = `timer:${timer.id}`;
      if (!getActivityNotificationBySourceKey(sourceKey)) {
        pushActivityNotification({
          id: createId(),
          sourceKey,
          kind: "timer",
          title: `${timer.label} listo`,
          body: `${timer.label} ya está listo.`,
          createdAt: new Date().toISOString(),
          readAt: null,
          actionLabel: "Seguir",
          actionType: "cook",
          mealId: timer.mealId || null,
          stepId: timer.stepId || null,
          url: timer.mealId ? buildCookSessionUrl(timer.mealId, timer.stepId || "") : `${APP_BASE_URL}?view=cook`,
        }, { persist: true, showBanner: true });
      }
    });
    finished.forEach((timer) => {
      void markRemoteTimerReminderDelivered(timer);
    });
    if (!isNotificationActiveOnCurrentDevice() && "Notification" in window && Notification.permission === "granted") {
      finished.forEach((timer) => {
        showBrowserNotification({
          id: `cook-timer-${timer.id}`,
          kind: "timer",
          title: `${timer.label} listo`,
          body: `${timer.label} ya está listo.`,
          url: timer.mealId ? buildCookSessionUrl(timer.mealId, timer.stepId || "") : `${APP_BASE_URL}?view=cook`,
          actionLabel: "Seguir",
          actionType: "cook",
          mealId: timer.mealId || null,
          stepId: timer.stepId || null,
        }).catch(() => {});
      });
    }
  }

  const hasRunningTimers = (state.cooking.activeTimers || []).some((timer) => !timer.paused);
  if (!hasRunningTimers) {
    clearTimerTicker();
  }

  persistCookingState();
  render();
}

function startCookingTimer(label, minutes, options = {}) {
  ensureCookingState();
  const timer = {
    id: options.timerId || createId(),
    label,
    durationMinutes: minutes,
    endsAt: Date.now() + minutes * 60000,
    remainingMs: minutes * 60000,
    paused: false,
    stepId: options.stepId || "",
    mealId: options.mealId || "",
  };
  state.cooking.activeTimers = (state.cooking.activeTimers || []).filter((entry) => entry.stepId !== timer.stepId || entry.mealId !== timer.mealId);
  state.cooking.activeTimers.push(timer);
  syncPrimaryCookingTimer();
  state.cooking.timerMenuOpen = false;
  persistCookingState();
  void upsertRemoteTimerReminder(timer);
  if (!state.timerTicker) {
    state.timerTicker = window.setInterval(syncCookingTimer, 1000);
  }
  syncCookingTimer();
}

function toggleCookingTimerPause(timerId = "") {
  if (!state.cooking?.activeTimers?.length) return;
  const timer = (state.cooking.activeTimers || []).find((entry) => entry.id === timerId) || getPrimaryCookingTimer();
  if (!timer) return;
  if (timer.paused) {
    timer.paused = false;
    timer.endsAt = Date.now() + Math.max(0, timer.remainingMs || 0);
    persistCookingState();
    void upsertRemoteTimerReminder(timer);
    if (!state.timerTicker) {
      state.timerTicker = window.setInterval(syncCookingTimer, 1000);
    }
    syncCookingTimer();
  } else {
    timer.remainingMs = Math.max(0, timer.endsAt - Date.now());
    timer.paused = true;
    void deleteRemoteTimerReminder(timer);
    syncPrimaryCookingTimer();
    persistCookingState();
    if (!(state.cooking.activeTimers || []).some((entry) => !entry.paused)) {
      clearTimerTicker();
    }
    render();
  }
}

function stopCookingTimer(timerId = "") {
  if (!state.cooking) return;
  if (!timerId) {
    (state.cooking.activeTimers || []).forEach((timer) => {
      void deleteRemoteTimerReminder(timer);
    });
    state.cooking.activeTimers = [];
  } else {
    const timerToRemove = (state.cooking.activeTimers || []).find((timer) => timer.id === timerId);
    if (timerToRemove) {
      void deleteRemoteTimerReminder(timerToRemove);
    }
    state.cooking.activeTimers = (state.cooking.activeTimers || []).filter((timer) => timer.id !== timerId);
  }
  syncPrimaryCookingTimer();
  persistCookingState();
  if (!(state.cooking.activeTimers || []).some((timer) => !timer.paused)) {
    clearTimerTicker();
  }
  state.cooking.timerMenuOpen = false;
}

async function moveCookingStep(delta) {
  const target = getCookingTarget();
  if (!target) return;
  const { stages } = getCookingStage(target);
  ensureCookingState();
  const sessionId = state.cooking.sessionId;
  state.cooking.stepIndex = Math.max(0, Math.min((state.cooking.stepIndex || 0) + delta, Math.max(0, stages.length - 1)));
  state.cooking.timerMenuOpen = false;
  persistCookingState();
  syncHistoryFromState({ mode: "replace", view: "cook", mealId: target.meal.id, stepId: stages[state.cooking.stepIndex]?.id || "" });
  render();
  window.scrollTo(0, 0);
  const nextTarget = getCookingTarget();
  const currentStep = nextTarget ? getCookingStage(nextTarget).current : null;
  void ensureStepIllustration(nextTarget?.meal?.id, currentStep, { sessionId });
  void prefetchCookingIllustrations(nextTarget?.meal?.id, sessionId);
}

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function stopHandsFreeMode(options = {}) {
  const notify = !!options.notify;
  const message = options.message || "El modo manos libres se ha desactivado.";
  if (state.speechRecognition) {
    state.speechRecognition.onend = null;
    state.speechRecognition.onresult = null;
    state.speechRecognition.onerror = null;
    state.speechRecognition.onstart = null;
    try {
      state.speechRecognition.stop();
    } catch (_error) {
      // Si ya estÃƒÂ¡ detenido, no hace falta hacer nada.
    }
  }
  state.speechRecognition = null;
  if (state.cooking) {
    state.cooking.handsFree = false;
    state.cooking.recognitionState = "idle";
    state.cooking.lastCommand = "";
  }
  if (notify) {
    state.notice = message;
    state.error = "";
  }
}

async function handleVoiceNavigation(transcript) {
  const normalized = String(transcript || "").toLowerCase();
  if (/siguiente/.test(normalized)) {
    await moveCookingStep(1);
    return "siguiente";
  }
  if (/atr[aÃ¡]s/.test(normalized)) {
    await moveCookingStep(-1);
    return "atras";
  }

  const target = getCookingTarget();
  const currentStage = target ? getCookingStage(target).current : null;
  if (/temporizador|cuenta regresiva/.test(normalized) && currentStage?.timerMinutes) {
    startCookingTimer(currentStage.timerLabel || currentStage.title, currentStage.timerMinutes, {
      stepId: currentStage.id,
      mealId: target?.meal?.id || "",
    });
    return "temporizador";
  }
  return "";
}

function startHandsFreeMode() {
  const RecognitionCtor = getSpeechRecognitionCtor();
  if (!RecognitionCtor) {
    state.notice = "El modo manos libres todavÃƒÂ­a no estÃƒÂ¡ disponible en este navegador.";
    render();
    return;
  }

  state.notice = "";
  dismissCookingMicHint();
  stopHandsFreeMode();
  ensureCookingState();

  const recognition = new RecognitionCtor();
  recognition.lang = "es-ES";
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (!state.cooking) return;
    state.cooking.handsFree = true;
    state.cooking.recognitionState = "listening";
    render();
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .filter((result) => result.isFinal)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();

    if (!transcript) return;
    handleVoiceNavigation(transcript).then((command) => {
      if (state.cooking) {
        state.cooking.lastCommand = command || "";
      }
      if (command) {
        render();
      }
    });
  };

  recognition.onerror = () => {
    stopHandsFreeMode({
      notify: true,
      message: "El modo manos libres se ha detenido. Puedes activarlo de nuevo cuando quieras.",
    });
    render();
  };

  recognition.onend = () => {
    if (!state.cooking?.handsFree) return;
    try {
      recognition.start();
      state.cooking.recognitionState = "listening";
      render();
    } catch (_error) {
      stopHandsFreeMode({
        notify: true,
        message: "El modo manos libres se ha desactivado al perder el microfono.",
      });
      render();
    }
  };

  state.speechRecognition = recognition;
  state.cooking.handsFree = true;
  state.cooking.recognitionState = "listening";
  render();

  try {
    recognition.start();
  } catch (_error) {
    stopHandsFreeMode({
      notify: true,
      message: "No he podido activar el modo manos libres ahora mismo.",
    });
    render();
  }
}

function createSampleMeal(mealKey, title, summary, calories, prepMinutes, difficulty, ingredients, tags = []) {
  return {
    id: createId(),
    mealKey,
    title,
    summary,
    calories,
    prepMinutes,
    difficulty,
    servings: state.profile?.householdCount || 1,
    nutrition: {
      protein: Math.round(calories * 0.05),
      carbs: Math.round(calories * 0.08),
      fats: Math.round(calories * 0.03),
      fiber: 8,
    },
    ingredients,
    tags,
    feedback: { liked: false, disliked: false, reasons: null },
  };
}

function createSampleWeekPlan(startDate) {
  const template = [
    {
      breakfast: createSampleMeal(
        "breakfast",
        "Yogur con fruta y avena",
        "Desayuno rÃ¡pido con fruta fresca y algo crujiente para arrancar suave.",
        380,
        8,
        "FÃ¡cil",
        [
          { name: "Yogur natural", quantity: 700, unit: "g", category: "LÃ¡cteos" },
          { name: "Avena", quantity: 280, unit: "g", category: "Despensa" },
          { name: "PlÃ¡tano", quantity: 4, unit: "unit", category: "Fruta" },
          { name: "Canela", quantity: 1, unit: "unit", category: "Especias", spice: true, pantry: true },
        ],
        ["RÃ¡pido", "Saciante"],
      ),
      lunch: createSampleMeal(
        "lunch",
        "Bowl templado de arroz, pollo y verduras",
        "Arroz jugoso con pollo a la plancha y verduras repetidas para facilitar la compra.",
        690,
        28,
        "Media",
        [
          { name: "Arroz", quantity: 320, unit: "g", category: "Despensa" },
          { name: "Pechuga de pollo", quantity: 650, unit: "g", category: "CarnicerÃ­a", freezable: true, thawLeadHours: 18 },
          { name: "CalabacÃ­n", quantity: 2, unit: "unit", category: "Verduras" },
          { name: "Pimiento rojo", quantity: 2, unit: "unit", category: "Verduras" },
          { name: "Aceite de oliva", quantity: 80, unit: "ml", category: "Despensa", pantry: true },
        ],
        ["Batch cooking", "ProteÃ­na"],
      ),
      dinner: createSampleMeal(
        "dinner",
        "Tortilla vaga con ensalada crujiente",
        "Cena ligera, rica en proteÃ­na y con ingredientes fÃ¡ciles de repetir.",
        510,
        22,
        "FÃ¡cil",
        [
          { name: "Huevos", quantity: 6, unit: "unit", category: "Huevos" },
          { name: "Patata", quantity: 600, unit: "g", category: "Verduras" },
          { name: "Lechuga", quantity: 1, unit: "unit", category: "Verduras" },
          { name: "Tomate", quantity: 2, unit: "unit", category: "Verduras" },
        ],
        ["Cena", "Sencillo"],
      ),
    },
    {
      breakfast: createSampleMeal(
        "breakfast",
        "Tostadas con hummus y tomate",
        "Desayuno salado para rotar sin complicar la compra.",
        340,
        10,
        "FÃ¡cil",
        [
          { name: "Pan integral", quantity: 8, unit: "unit", category: "PanaderÃ­a" },
          { name: "Hummus", quantity: 220, unit: "g", category: "Refrigerados" },
          { name: "Tomate", quantity: 2, unit: "unit", category: "Verduras" },
        ],
        ["Vegetal", "Sin cocina"],
      ),
      lunch: createSampleMeal(
        "lunch",
        "Lentejas rÃ¡pidas con verduras",
        "Receta de cuchara amable, barata y cumplidora.",
        620,
        35,
        "Media",
        [
          { name: "Lentejas cocidas", quantity: 800, unit: "g", category: "Legumbres" },
          { name: "Zanahoria", quantity: 3, unit: "unit", category: "Verduras" },
          { name: "Pimiento rojo", quantity: 1, unit: "unit", category: "Verduras" },
          { name: "Cebolla", quantity: 1, unit: "unit", category: "Verduras" },
        ],
        ["EconÃ³mico", "Fibra"],
      ),
      dinner: createSampleMeal(
        "dinner",
        "SalmÃ³n al horno con patata y judÃ­as",
        "Pescado sencillo con guarniciÃ³n que no pide mucha atenciÃ³n.",
        560,
        27,
        "Media",
        [
          { name: "SalmÃ³n", quantity: 500, unit: "g", category: "PescaderÃ­a", freezable: true, thawLeadHours: 12 },
          { name: "Patata", quantity: 500, unit: "g", category: "Verduras" },
          { name: "JudÃ­as verdes", quantity: 300, unit: "g", category: "Verduras" },
        ],
        ["Omega 3", "Horno"],
      ),
    },
  ];

  const plannedMeals = uniqueValues(state.profile?.plannedMeals || ["breakfast", "lunch", "dinner"]);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index);
    const set = template[index % template.length];
    const meals = {};

    plannedMeals.forEach((mealKey) => {
      if (set[mealKey]) {
        meals[mealKey] = normalizeMeal(mealKey, { ...set[mealKey], id: createId() }, date);
      }
      if (mealKey === "snack" && !meals[mealKey]) {
        meals[mealKey] = normalizeMeal(
          mealKey,
          createSampleMeal(
            mealKey,
            "Merienda de fruta y yogur",
            "Algo fÃ¡cil para llegar con energÃ­a a la cena.",
            210,
            5,
            "FÃ¡cil",
            [
              { name: "Manzana", quantity: 2, unit: "unit", category: "Fruta" },
              { name: "Yogur natural", quantity: 250, unit: "g", category: "LÃ¡cteos" },
            ],
            ["Entre horas"],
          ),
          date,
        );
      }
      if (mealKey === "bites" && !meals[mealKey]) {
        meals[mealKey] = normalizeMeal(
          mealKey,
          createSampleMeal(
            mealKey,
            "PuÃ±ado de frutos secos y mandarina",
            "PequeÃ±o refuerzo portÃ¡til.",
            180,
            2,
            "FÃ¡cil",
            [
              { name: "Frutos secos", quantity: 140, unit: "g", category: "Snacks" },
              { name: "Mandarina", quantity: 4, unit: "unit", category: "Fruta" },
            ],
            ["Snack"],
          ),
          date,
        );
      }
    });

    return {
      date,
      label: friendlyDayLabel(date, startDate),
      meals,
    };
  });

  return {
    id: createId(),
    startDate,
    endDate: addDays(startDate, 6),
    strategy: "Semana pensada para repetir ingredientes base, cocinar sin perder demasiado tiempo y mantener variedad.",
    batchingTips: [
      "Deja una tanda de arroz y patata cocida lista al principio de la semana.",
      "Aprovecha las verduras repetidas para cortar todo junto una sola vez.",
      "Si haces hummus o crema, guarda una parte para merienda o colaciÃ³n.",
    ],
    days,
    shoppingList: aggregateShopping(days),
    freezerItems: buildFreezerItems(days),
  };
}

function createFallbackSwapMeal(target, meal) {
  const swapMap = {
    breakfast: createSampleMeal(
      "breakfast",
      "Porridge rÃ¡pido con pera y nueces",
      "MÃ¡s cremoso y calmado, ideal si quieres variar el desayuno.",
      360,
      12,
      "FÃ¡cil",
      [
        { name: "Avena", quantity: 80, unit: "g", category: "Despensa" },
        { name: "Leche o bebida vegetal", quantity: 250, unit: "ml", category: "LÃ¡cteos" },
        { name: "Pera", quantity: 1, unit: "unit", category: "Fruta" },
      ],
      ["Desayuno caliente"],
    ),
    lunch: createSampleMeal(
      "lunch",
      "CuscÃºs con garbanzos y verduras salteadas",
      "Alternativa fÃ¡cil de improvisar y muy amable con la lista de la compra.",
      590,
      24,
      "FÃ¡cil",
      [
        { name: "CuscÃºs", quantity: 240, unit: "g", category: "Despensa" },
        { name: "Garbanzos cocidos", quantity: 500, unit: "g", category: "Legumbres" },
        { name: "CalabacÃ­n", quantity: 1, unit: "unit", category: "Verduras" },
        { name: "Pimiento rojo", quantity: 1, unit: "unit", category: "Verduras" },
      ],
      ["Vegetal", "Cambio exprÃ©s"],
    ),
    dinner: createSampleMeal(
      "dinner",
      "Pasta con atÃºn, tomate y rÃºcula",
      "Cena muy resolutiva para cuando quieres menos pasos.",
      520,
      18,
      "FÃ¡cil",
      [
        { name: "Pasta", quantity: 280, unit: "g", category: "Despensa" },
        { name: "AtÃºn", quantity: 2, unit: "unit", category: "Conservas" },
        { name: "Tomate triturado", quantity: 300, unit: "g", category: "Despensa" },
        { name: "RÃºcula", quantity: 100, unit: "g", category: "Verduras" },
      ],
      ["Menos tiempo", "Sencillo"],
    ),
    snack: createSampleMeal(
      "snack",
      "Batido suave de plÃ¡tano y cacao",
      "Una merienda distinta pero igual de fÃ¡cil.",
      240,
      6,
      "FÃ¡cil",
      [
        { name: "PlÃ¡tano", quantity: 1, unit: "unit", category: "Fruta" },
        { name: "Leche o bebida vegetal", quantity: 250, unit: "ml", category: "LÃ¡cteos" },
        { name: "Cacao puro", quantity: 1, unit: "unit", category: "Especias", spice: true, pantry: true },
      ],
      ["Merienda"],
    ),
    bites: createSampleMeal(
      "bites",
      "Tortitas de maÃ­z con queso crema y pavo",
      "Mini colaciÃ³n salada para salir del paso.",
      190,
      5,
      "FÃ¡cil",
      [
        { name: "Tortitas de maÃ­z", quantity: 4, unit: "unit", category: "Snacks" },
        { name: "Queso crema", quantity: 80, unit: "g", category: "LÃ¡cteos" },
        { name: "Pavo cocido", quantity: 120, unit: "g", category: "CharcuterÃ­a" },
      ],
      ["Snack salado"],
    ),
  };

  return normalizeMeal(target.mealKey, swapMap[target.mealKey] || meal, target.day.date);
}

function plannerProfilePayload() {
  return {
    allergies: state.profile?.allergies || [],
    allergyNotes: state.profile?.allergyNotes || "",
    likes: state.profile?.likes || [],
    dislikes: state.profile?.dislikes || [],
    dietaryNotes: state.profile?.dietaryNotes || "",
    cookingStyle: state.profile?.cookingStyle || "balanced",
    goalTags: state.profile?.goalTags || [],
    householdCount: Number(state.profile?.householdCount || 1),
    householdMembers: state.profile?.householdMembers || [],
    plannedMeals: state.profile?.plannedMeals || ["breakfast", "lunch", "dinner"],
    lunchPrepNightBefore: !!state.profile?.lunchPrepNightBefore,
    breakfastTime: state.profile?.breakfastTime || null,
    snackTime: state.profile?.snackTime || null,
    lunchTime: state.profile?.lunchTime || null,
    dinnerTime: state.profile?.dinnerTime || null,
    carryoverIngredients: mergeCarryoverIngredients(state.week?.carryoverIngredients || []),
    recentCookingFeedbackSummary: getRecentCookingFeedbackSummary(),
    timezone: state.profile?.timezone || getTimezone(),
  };
}

async function invokePlanner(body) {
  if (!state.client) {
    throw new Error("La cocina no estÃ¡ disponible ahora mismo.");
  }
  const { data, error } = await state.client.functions.invoke("velocichef-plan-week", {
    body,
  });
  if (error) throw error;
  return data;
}

async function invokePlannerDirect(body) {
  if (!state.session?.access_token) {
    throw new Error("No hay una sesiÃƒÂ³n activa para llamar a VelociChef.");
  }
  const response = await fetch(`${SUPABASE_URL}/functions/v1/velocichef-plan-week`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `La funciÃƒÂ³n respondiÃƒÂ³ con ${response.status}.`);
  }
  return payload;
}

async function invokePlannerStable(body) {
  if (!state.client) {
    throw new Error("La cocina no estÃ¡ disponible ahora mismo.");
  }
  const skipSdkFallback = body?.action === "generate_step_image";

  const sessionResult = await state.client.auth.getSession();
  if (sessionResult.error) {
    throw sessionResult.error;
  }

  let activeSession = sessionResult.data?.session || state.session || null;
  let accessToken = activeSession?.access_token || "";

  if (!accessToken) {
    throw new Error("No hay una sesion activa para llamar a VelociChef.");
  }

  state.session = activeSession;

  const callEndpoint = async (token, includeAuthorization = true) => {
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    };
    if (includeAuthorization && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${SUPABASE_URL}/functions/v1/velocichef-plan-week`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  };

  let { response, payload } = await callEndpoint(accessToken);

  if (response.status === 401) {
    const refreshResult = await state.client.auth.refreshSession();
    const refreshedSession = refreshResult.data?.session || null;
    if (refreshedSession?.access_token) {
      state.session = refreshedSession;
      accessToken = refreshedSession.access_token;
      ({ response, payload } = await callEndpoint(accessToken));
    }
  }

  if (response.status === 401) {
    ({ response, payload } = await callEndpoint("", false));
  }

  if (!response.ok || payload?.ok === false) {
    if (!skipSdkFallback) {
      const { data, error } = await state.client.functions.invoke("velocichef-plan-week", {
        body,
      });

      if (!error && data?.ok !== false) {
        return data;
      }

      throw new Error(payload?.error || error?.message || `La funcion respondio con ${response.status}.`);
    }
    throw new Error(payload?.error || `La funcion respondio con ${response.status}.`);
  }

  return payload;
}

async function generateWeek(startDate = getActivePlanningStartIso()) {
  state.busy = true;
  state.busyLabel = "Preparando tu menÃº semanal...";
  state.error = "";
  const previousWeek = state.week ? normalizeWeek(state.week) : null;
  render();

  try {
    const data = await invokePlannerStable({
      action: "generate_week",
      startDate,
      profile: plannerProfilePayload(),
    });
    state.week = buildWeekFromPlan(data.plan || data);
    if (previousWeek?.startDate === state.week.startDate && previousWeek?.endDate === state.week.endDate) {
      state.week.id = previousWeek.id;
    }
    state.week.carryoverIngredients = [];
    state.notice = "";
    state.error = "";
  } catch (_error) {
    const error = _error;
    state.week = buildWeekFromPlan(createSampleWeekPlan(startDate));
    if (previousWeek?.startDate === state.week.startDate && previousWeek?.endDate === state.week.endDate) {
      state.week.id = previousWeek.id;
    }
    state.week.carryoverIngredients = mergeCarryoverIngredients(previousWeek?.carryoverIngredients || [], state.week.carryoverIngredients || []);
    state.notice = "No pude cerrar la generaciÃ³n real en este intento, asÃ­ que he dejado una semana de muestra editable para que sigas avanzando.";
    state.error = "Ahora mismo no he podido generar el menÃº real.";
  } finally {
    state.week.reminders = composeReminders();
    await saveWeek();
    state.currentView = "week";
    syncHistoryFromState({ mode: "replace", view: "week" });
    state.busy = false;
    state.busyLabel = "";
    render();
  }
}

async function swapMeal(target, reasons) {
  const original = target.meal;
  state.busy = true;
  state.busyLabel = "Buscando otra opciÃ³n de plato...";
  state.error = "";
  render();

  let replacement = null;
  try {
    const data = await invokePlannerStable({
      action: "swap_meal",
      startDate: state.week?.startDate,
      profile: plannerProfilePayload(),
      existingWeek: {
        startDate: state.week?.startDate,
        days: state.week?.days?.map((day) => ({
          date: day.date,
          meals: Object.fromEntries(
            Object.entries(day.meals || {}).map(([mealKey, meal]) => [
              mealKey,
              {
                title: meal.title,
                summary: meal.summary,
                ingredients: meal.ingredients,
                calories: meal.calories,
                prep_minutes: meal.prepMinutes,
                difficulty: meal.difficulty,
              },
            ]),
          ),
        })),
      },
      target: {
        date: target.day.date,
        mealKey: target.mealKey,
        currentMeal: {
          title: target.meal.title,
          ingredients: target.meal.ingredients,
          difficulty: target.meal.difficulty,
          prepMinutes: target.meal.prepMinutes,
        },
        reasons,
      },
    });
    replacement = normalizeMeal(target.mealKey, data.meal || data, target.day.date);
    state.notice = "";
    state.error = "";
  } catch (_error) {
    replacement = createFallbackSwapMeal(target, original);
    state.notice = "No he podido traer una alternativa real ahora mismo y te he puesto una opción de apoyo para no frenarte.";
    state.error = "No he podido sustituir el plato ahora mismo.";
  } finally {
    updateMeal(target.meal.id, () => replacement);
    state.week.reminders = composeReminders();
    await saveWeek();
    await saveFeedback({
      id: createId(),
      weekId: state.week?.id,
      mealId: original.id,
      type: "swap",
      payload: reasons,
      createdAt: new Date().toISOString(),
    });
    state.busy = false;
    state.busyLabel = "";
    state.modal = null;
    render();
  }
}

function renderLoading() {
  return `
    <section class="vc-shell">
      <article class="vc-card vc-loader">
        <div class="vc-spinner" aria-hidden="true"></div>
        <div>
          <h1 class="vc-title">VelociChef está arrancando la cocina.</h1>
          <p class="vc-muted">Estoy preparando tu perfil, tus menús y tu cocina semanal.</p>
        </div>
      </article>
    </section>
  `;
}

function renderBusyOverlay() {
  if (!state.busy) return "";
  return `
    <div class="vc-modal-layer">
      <div class="vc-modal">
        <div class="vc-loader">
          <div class="vc-spinner" aria-hidden="true"></div>
          <div>
            <h2 class="vc-modal-title">${escapeHtml(state.busyLabel || "Procesando...")}</h2>
            <p class="vc-muted">VelociChef está cocinando la siguiente respuesta.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderToastStack() {
  const banner = getSystemBannerMessage();
  if (!banner) return "";

  return `
    <div class="vc-system-banner ${state.activeNotificationBannerId ? "with-activity" : ""}" aria-live="polite" aria-atomic="true">
      <div class="vc-notification-banner-bubble vc-system-banner-bubble vc-system-banner-${escapeHtml(banner.kind)}">
        <div class="vc-notification-banner-copy">
          <small>${escapeHtml(banner.label)}</small>
          <p>${escapeHtml(banner.text)}</p>
        </div>
      </div>
    </div>
  `;
}

function renderNotificationBanner() {
  const notification = getActivityNotificationById(state.activeNotificationBannerId);
  if (!notification) return "";

  return `
    <div class="vc-notification-banner" role="status" aria-live="polite">
      <div class="vc-notification-banner-bubble vc-notification-banner-${escapeHtml(notification.kind || "info")}">
        <div class="vc-notification-banner-copy">
          <small>${escapeHtml(getNotificationKindEyebrow(notification.kind))}</small>
          <strong>${escapeHtml(notification.title)}</strong>
          <p>${escapeHtml(notification.body)}</p>
        </div>
        ${notification.actionLabel ? `
          <button class="vc-button primary vc-notification-banner-action" type="button" data-action="open-activity-notification" data-notification-id="${notification.id}">
            ${escapeHtml(notification.actionLabel)}
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

function renderUserAvatar(user) {
  const avatarUrl = getUserAvatarUrl(user);
  if (avatarUrl) {
    return `<span class="vc-user-avatar"><img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(getUserLabel(user))}"></span>`;
  }
  return `<span class="vc-user-avatar vc-user-avatar-fallback">${escapeHtml(getUserInitial(user))}</span>`;
}

function renderTopbar() {
  const user = state.session?.user || null;
  const isCookView = state.currentView === "cook";
  const isImmersiveCook = isImmersiveCookMode();
  const zaurioMenuOpen = state.activeMenu === "zaurio";
  const userMenuOpen = state.activeMenu === "user";
  const displayName = state.profile?.displayName || getUserLabel(user);
  const notificationsActive = isNotificationActiveOnCurrentDevice();
  const shoppingState = state.week
    ? (state.week.shoppingCompleted ? "Compra cerrada" : "Compra pendiente")
    : "Sin semana activa";
  const unreadActivityCount = getUnreadActivityNotifications().length;
  const cookingTarget = isImmersiveCook ? getCookingTarget() : null;
  const cookingStage = cookingTarget ? getCookingStage(cookingTarget) : null;
  const activeTimers = isImmersiveCook ? getActiveCookingTimers() : [];
  const activeTimer = activeTimers[0] || null;
  const extraTimerCount = Math.max(0, activeTimers.length - 1);
  const handsFreeActive = !!(state.cooking?.handsFree && state.cooking?.recognitionState === "listening");
  const cookingStepLabel = cookingStage
    ? `${String(cookingStage.stepIndex + 1).padStart(2, "0")} / ${String(cookingStage.stages.length).padStart(2, "0")}`
    : "";
  const immersiveMicControl = isImmersiveCook ? `
    <div class="vc-cook-mic-wrap vc-cook-mic-wrap-inline">
      <button
        class="vc-cook-mic-bubble ${handsFreeActive ? "active" : ""}"
        type="button"
        data-action="toggle-hands-free"
        aria-label="${handsFreeActive ? "Desactivar manos libres" : "Activar manos libres"}"
        aria-pressed="${handsFreeActive ? "true" : "false"}"
      >
        <span class="vc-cook-mic-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <rect x="9" y="3.5" width="6" height="10" rx="3"></rect>
            <path d="M6.5 10.5a5.5 5.5 0 0 0 11 0"></path>
            <path d="M12 16v4"></path>
            <path d="M9 20h6"></path>
            ${handsFreeActive ? "" : '<path d="M5 5L19 19"></path>'}
          </svg>
        </span>
      </button>
      ${state.cooking?.showMicHint ? `
        <div class="vc-cook-mic-tooltip" role="status">
          Activa el modo manos libres para navegar los pasos con la voz.
        </div>
      ` : ""}
    </div>
  ` : "";
  const immersiveCloseControl = isImmersiveCook ? `
    <button
      class="vc-cook-close-bubble"
      type="button"
      data-action="request-close-cooking-session"
      aria-label="Cerrar modo cocina"
      title="Cerrar modo cocina"
    >
      <span aria-hidden="true">×</span>
    </button>
  ` : "";

  return `
    <header class="vc-topbar ${isImmersiveCook ? "vc-topbar-immersive" : "vc-card"} ${isCookView ? "vc-topbar-cooking" : ""}">
      <div class="vc-topbar-main">
        <div class="vc-topbar-side vc-topbar-left">
          <div class="vc-menu-wrap ${zaurioMenuOpen ? "open" : ""}">
            <button
              class="vc-menu-btn ${isImmersiveCook ? "vc-menu-btn-bubble" : ""}"
              type="button"
              data-action="toggle-menu"
              data-menu="zaurio"
              aria-label="Abrir menu de Zaurio"
              aria-haspopup="true"
              aria-expanded="${zaurioMenuOpen ? "true" : "false"}"
            >
              ${isImmersiveCook ? `
                <span class="vc-cook-bubble-logo"><img src="${APP_MINI_LOGO_PATH}" alt=""></span>
              ` : `
                <span class="vc-menu-glyph" aria-hidden="true">&#9776;</span>
                <span class="vc-z-mark"><img src="${ZAURIO_MENU_LOGO_PATH}" alt=""></span>
                <span class="vc-menu-text">Zaurio</span>
              `}
            </button>
            <nav class="vc-menu-drop" aria-label="Menu de Zaurio">
              ${ZAURIO_DESTINATIONS.map((item) => `
                <a class="vc-menu-link" href="${item.href}">
                  <img src="${item.icon}" alt="">
                  <span>${escapeHtml(item.label)}</span>
                </a>
              `).join("")}
            </nav>
          </div>
        </div>

        <div class="vc-topbar-center">
          ${isImmersiveCook ? `
            <div class="vc-cook-step-cluster">
              ${immersiveMicControl}
              <div class="vc-cook-step-indicator" aria-label="Paso actual">
                <small>Paso</small>
                <strong>${escapeHtml(cookingStepLabel)}</strong>
              </div>
              ${activeTimer ? `
                <div class="vc-cook-timer-wrap ${state.cooking?.timerMenuOpen ? "open" : ""}">
                  <button
                    class="vc-cook-top-timer ${activeTimer.paused ? "paused" : "running"}"
                    type="button"
                    data-action="toggle-cooking-timer-menu"
                    aria-label="Gestionar temporizador"
                    aria-expanded="${state.cooking?.timerMenuOpen ? "true" : "false"}"
                  >
                    <span class="vc-cook-top-timer-label">${activeTimer.paused ? "Pausado" : "Tiempo"}</span>
                    <strong>${formatCountdown(activeTimer.remainingMs)}</strong>
                    ${extraTimerCount ? `<span class="vc-cook-top-timer-extra">+${extraTimerCount}</span>` : ""}
                  </button>
                  ${state.cooking?.timerMenuOpen ? `
                    <div class="vc-cook-timer-popover" role="dialog" aria-label="Opciones del temporizador">
                      ${activeTimers.map((timer) => `
                        <article class="vc-cook-timer-item">
                          <div class="vc-cook-timer-copy">
                            <span class="vc-cook-timer-title">${escapeHtml(timer.label)}</span>
                            <div class="vc-cook-timer-meta">
                              <strong class="vc-cook-timer-value">${formatCountdown(timer.remainingMs)}</strong>
                              ${timer.paused ? '<span class="vc-cook-timer-state">Pausado</span>' : ""}
                            </div>
                          </div>
                          <div class="vc-cook-timer-item-actions">
                            <button class="vc-cook-timer-popover-action" type="button" data-action="toggle-cooking-timer-pause" data-timer-id="${timer.id}">
                              ${timer.paused ? "Reanudar" : "Pausar"}
                            </button>
                            <button class="vc-cook-timer-popover-action danger" type="button" data-action="stop-cooking-timer" data-timer-id="${timer.id}">
                              Detener
                            </button>
                          </div>
                        </article>
                      `).join("")}
                    </div>
                  ` : ""}
                </div>
              ` : ""}
            </div>
          ` : `
            <a class="vc-topbar-logo" href="${APP_BASE_URL}?view=home" aria-label="Ir al inicio de VelociChef">
              <img src="${APP_LOGO_PATH}" alt="VelociChef">
            </a>
          `}
        </div>

        <div class="vc-topbar-side vc-topbar-right ${isImmersiveCook ? "vc-topbar-right-immersive" : ""}">
          ${user ? `
            <div class="vc-topbar-user-stack ${isImmersiveCook ? "vc-topbar-user-stack-immersive" : ""}">
              <div class="vc-menu-wrap vc-user-wrap ${userMenuOpen ? "open" : ""}">
                <button
                  class="vc-user-pill ${isImmersiveCook ? "vc-user-pill-avatar" : ""}"
                  type="button"
                  data-action="toggle-menu"
                  data-menu="user"
                  aria-label="Abrir menu del usuario"
                  aria-haspopup="true"
                  aria-expanded="${userMenuOpen ? "true" : "false"}"
                >
                  ${renderUserAvatar(user)}
                  ${unreadActivityCount && !state.activeNotificationBannerId ? `<span class="vc-user-avatar-dot" aria-hidden="true"></span>` : ""}
                  ${isImmersiveCook ? "" : `
                    <span class="vc-user-copy">
                      <strong>${escapeHtml(displayName)}</strong>
                      <small>${escapeHtml(shoppingState)}</small>
                    </span>
                    <span class="vc-user-caret" aria-hidden="true"></span>
                  `}
                </button>
                <div class="vc-menu-drop vc-user-menu" role="menu" aria-label="Menu del usuario">
                  <button class="vc-menu-action" type="button" data-action="open-view" data-view="profile" role="menuitem">Perfil</button>
                  <button class="vc-menu-action vc-menu-action-with-dot" type="button" data-action="open-view" data-view="notifications" role="menuitem">Notificaciones${unreadActivityCount ? '<span class="vc-menu-action-dot" aria-hidden="true"></span>' : ""}</button>
                  ${notificationsActive ? `
                    <div class="vc-menu-meta">
                      <span class="vc-meta-pill">Notificaciones activadas</span>
                    </div>
                  ` : `
                    <button class="vc-menu-action" type="button" data-action="request-notifications" role="menuitem">Activar notificaciones</button>
                  `}
                  <button class="vc-menu-action" type="button" data-action="open-view" data-view="shopping" role="menuitem">Mi lista de la compra</button>
                  <button class="vc-menu-action" type="button" data-action="open-view" data-view="recipes" role="menuitem">Mis recetas de esta semana</button>
                  <button class="vc-menu-action" type="button" data-action="plan-new-week" role="menuitem">Planificar nueva semana</button>
                  <button class="vc-menu-action vc-menu-action-danger" type="button" data-action="logout" role="menuitem">Salir</button>
                  <div class="vc-menu-version" aria-label="${escapeHtml(APP_VERSION_LABEL)}">${escapeHtml(APP_VERSION_LABEL)}</div>
                </div>
              </div>
              ${immersiveCloseControl}
            </div>
          ` : `
            <button class="vc-button secondary vc-nav-login" type="button" data-action="login-google">Entrar con Google</button>
          `}
        </div>
      </div>

      ${user && !isCookView ? `
        <div class="vc-topbar-cookbar">
          <button class="vc-cook-launch" type="button" data-action="open-cook">
            Cocinar!
          </button>
        </div>
      ` : ""}
    </header>
  `;
}

function renderLanding() {
  return `
    <section class="vc-shell">
      <article class="vc-hero">
        <span class="vc-eyebrow">Nueva herramienta</span>
        <div class="vc-preview-grid">
          <div class="vc-grid">
            <div>
              <h1 class="vc-hero-title">Tu cocina semanal, la alacena y la compra en una sola app.</h1>
              <p class="vc-lead">VelociChef planifica menús realistas, reutiliza ingredientes, calcula calorías aproximadas y te acompaña desde el “qué cenamos” hasta la lista del súper.</p>
            </div>
            <div class="vc-chip-row">
              <span class="vc-meta-pill">Perfil a medida</span>
              <span class="vc-meta-pill">Semana organizada</span>
              <span class="vc-meta-pill">Compra clara</span>
              <span class="vc-meta-pill">Hecho para móvil</span>
            </div>
            <div class="vc-toolbar">
              <button class="vc-button primary" data-action="login-google">Registrarme / iniciar sesión con Google</button>
            </div>
          </div>
          <div class="vc-hero-art">
            <img src="${APP_LOGO_PATH}" alt="VelociChef">
          </div>
        </div>
      </article>

      <section class="vc-support-grid">
        <article class="vc-panel">
          <h2 class="vc-title">Lo que podrás hacer</h2>
          <div class="vc-kitchen-points">
            <div class="vc-kitchen-point">
              <h3 class="vc-inline-title">Perfilar tus gustos reales</h3>
              <p class="vc-copy">Alergias, cosas que te gustan, lo que no quieres volver a ver en el plato, nivel de cocina, objetivos y reglas por persona si cocinas para más gente.</p>
            </div>
            <div class="vc-kitchen-point">
              <h3 class="vc-inline-title">Recibir una semana completa</h3>
              <p class="vc-copy">Desayuno, almuerzo, merienda, cena y colaciones según lo que quieras planificar, con porciones adaptadas y detalles por receta.</p>
            </div>
            <div class="vc-kitchen-point">
              <h3 class="vc-inline-title">Transformar el menú en compra útil</h3>
              <p class="vc-copy">Lista total por cantidades, control de lo que ya tienes y recordatorios para cocinar, descongelar y replanificar la siguiente semana.</p>
            </div>
          </div>
        </article>

        <article class="vc-login-card vc-card">
          <span class="vc-eyebrow">Cómo funciona</span>
          <div class="vc-stat-grid">
            <div class="vc-stat">
              <small class="vc-muted">1. Perfil</small>
              <strong>Tus reglas</strong>
              <span class="vc-muted">VelociChef aprende gustos, alergias y objetivos.</span>
            </div>
            <div class="vc-stat">
              <small class="vc-muted">2. MenÃº</small>
              <strong>Semana Ãºtil</strong>
              <span class="vc-muted">Recibes platos con calorÃ­as aproximadas y una compra pensada con cabeza.</span>
            </div>
            <div class="vc-stat">
              <small class="vc-muted">3. Compra</small>
              <strong>SÃºper sin caos</strong>
              <span class="vc-muted">Todo queda guardado en tu perfil para volver cuando quieras.</span>
            </div>
          </div>
        </article>
      </section>
    </section>
  `;
}

function renderPill(option, group, activeValues, helper = "") {
  const isActive = activeValues.includes(option);
  return `
    <button
      class="vc-pill ${isActive ? "active" : ""}"
      type="button"
      data-action="toggle-pill"
      data-group="${group}"
      data-value="${escapeHtml(option)}"
    >
      <span class="vc-pill-content">
        <span class="vc-pill-copy">
          <strong class="vc-pill-label">${escapeHtml(option)}</strong>
          ${helper ? `<small>${escapeHtml(helper)}</small>` : ""}
        </span>
      </span>
      <span class="vc-pill-check" aria-hidden="true"></span>
    </button>
  `;
}

function renderMealChoice(option, activeValues) {
  const active = activeValues.includes(option.key);
  return `
    <button
      class="vc-pill ${active ? "active" : ""}"
      type="button"
      data-action="toggle-pill"
      data-group="plannedMeals"
      data-value="${option.key}"
    >
      <span class="vc-pill-content">
        <span class="vc-pill-icon" aria-hidden="true">${option.icon}</span>
        <span class="vc-pill-copy">
          <strong class="vc-pill-label">${escapeHtml(option.label)}</strong>
          <small>${escapeHtml(option.hint)}</small>
        </span>
      </span>
      <span class="vc-pill-check" aria-hidden="true"></span>
    </button>
  `;
}

function renderCookingChoice(option, current) {
  const active = current === option.key;
  return `
    <button
      class="vc-pill ${active ? "active" : ""}"
      type="button"
      data-action="set-cooking-style"
      data-value="${option.key}"
    >
      <span class="vc-pill-content">
        <span class="vc-pill-copy">
          <strong class="vc-pill-label">${escapeHtml(option.label)}</strong>
          <small>${escapeHtml(option.hint)}</small>
        </span>
      </span>
      <span class="vc-pill-check" aria-hidden="true"></span>
    </button>
  `;
}

function renderOnboarding() {
  const steps = [
    {
      kicker: "Alergias",
      title: "Comienza a preparar tu perfil",
      copy: "Primero vamos con alergias y límites claros. Puedes marcar varias y dejar notas concretas para afinar tus platos.",
      content: `
        <div class="vc-step-section vc-fieldset">
          <label class="vc-label">Alergias o ingredientes que deben quedar fuera</label>
          <div class="vc-pill-grid">${ALLERGY_OPTIONS.map((option) => renderPill(option, "allergies", state.profile.allergies)).join("")}</div>
        </div>
        <div class="vc-field vc-step-section">
          <label class="vc-label" for="allergy-notes">Otros o matices</label>
          <textarea id="allergy-notes" class="vc-textarea" data-field="allergyNotes" placeholder="Ejemplo: el marisco me sienta mal, pero el pescado blanco me va bien.">${escapeHtml(state.profile.allergyNotes)}</textarea>
          <span class="vc-helper">Si hay excepciones o matices, este campo manda sobre las opciones rápidas.</span>
        </div>
      `,
    },
    {
      kicker: "Gustos",
      title: "Tus gustos de verdad",
      copy: "Ahora toca decirle a VelociChef qué te gusta encontrar en la cocina y qué preferirías esquivar.",
      content: `
        <div class="vc-step-section vc-fieldset">
          <label class="vc-label">Cosas que me gustan</label>
          <div class="vc-pill-grid">${LIKE_OPTIONS.map((option) => renderPill(option, "likes", state.profile.likes)).join("")}</div>
        </div>
        <div class="vc-step-section vc-fieldset">
          <label class="vc-label">Cosas que no me gustan</label>
          <div class="vc-pill-grid">${DISLIKE_OPTIONS.map((option) => renderPill(option, "dislikes", state.profile.dislikes)).join("")}</div>
        </div>
        <div class="vc-field vc-step-section">
          <label class="vc-label" for="dietary-notes">Explícamelo mejor</label>
          <textarea id="dietary-notes" class="vc-textarea" data-field="dietaryNotes" placeholder="Ejemplo: no me van bien las salsas muy pesadas y prefiero platos jugosos.">${escapeHtml(state.profile.dietaryNotes)}</textarea>
          <span class="vc-helper">Aquí puedes contar texturas, sabores o combinaciones que prefieres evitar.</span>
        </div>
      `,
    },
    {
      kicker: "Objetivos",
      title: "Estilo de cocina y objetivos",
      copy: "Aquí definimos qué tanto quieres complicarte entre semana y qué quieres conseguir con tu alimentación.",
      content: `
        <div class="vc-step-section vc-fieldset">
          <label class="vc-label">¿Qué nivel de cocina quieres esta semana?</label>
          <div class="vc-pill-grid">${COOKING_STYLE_OPTIONS.map((option) => renderCookingChoice(option, state.profile.cookingStyle)).join("")}</div>
        </div>
        <div class="vc-step-section vc-fieldset">
          <label class="vc-label">Objetivos alimentarios</label>
          <div class="vc-pill-grid">${GOAL_OPTIONS.map((option) => renderPill(option, "goalTags", state.profile.goalTags)).join("")}</div>
        </div>
      `,
    },
    {
      kicker: "Hogar",
      title: "¿Para cuántas personas cocinamos?",
      copy: "Puedes decirle a cada persona si come lo mismo que tú o si tiene reglas especiales.",
      content: `
        <div class="vc-field vc-step-section">
          <label class="vc-label" for="householdCount">Personas que comen regularmente contigo</label>
          <input id="householdCount" class="vc-input" type="number" min="1" max="8" data-field="householdCount" value="${state.profile.householdCount}">
        </div>
        <div class="vc-member-list vc-step-section">
          ${state.profile.householdMembers.map((member, index) => `
            <article class="vc-member-card">
              <div class="vc-field">
                <label class="vc-label">Persona ${index + 1}</label>
                <input
                  class="vc-input"
                  type="text"
                  value="${escapeHtml(member.name)}"
                  data-member-field="name"
                  data-member-id="${member.id}"
                >
              </div>
              <label class="vc-switch">
                <span>
                  <strong>Lo mismo que yo</strong>
                  <small class="vc-helper">Usa tus mismas reglas alimentarias.</small>
                </span>
                <input type="checkbox" ${member.sameAsMe ? "checked" : ""} data-member-field="sameAsMe" data-member-id="${member.id}">
              </label>
              ${member.sameAsMe ? "" : `
                <div class="vc-field">
                  <label class="vc-label">Reglas especiales o preferencias</label>
                  <textarea class="vc-textarea" data-member-field="notes" data-member-id="${member.id}" placeholder="Ejemplo: no come pescado azul y prefiere cenas suaves.">${escapeHtml(member.notes)}</textarea>
                </div>
              `}
            </article>
          `).join("")}
        </div>
      `,
    },
    {
      kicker: "Plan",
      title: "¿Qué comidas quieres planificar?",
      copy: "Marca las franjas de comida que quieres planificar y cuéntame a qué horas sueles comer.",
      content: `
        <div class="vc-step-section vc-fieldset">
          <label class="vc-label">Comidas a planificar</label>
          <div class="vc-pill-grid">${MEAL_OPTIONS.map((option) => renderMealChoice(option, state.profile.plannedMeals)).join("")}</div>
        </div>
        <label class="vc-switch vc-switch-card vc-step-section">
          <span>
            <strong>¿Preparas el almuerzo la noche anterior?</strong>
            <small class="vc-helper">Así puedo proponerte platos que funcionen mejor recalentados o listos para llevar.</small>
          </span>
          <input type="checkbox" data-field="lunchPrepNightBefore" ${state.profile.lunchPrepNightBefore ? "checked" : ""}>
        </label>
        <div class="vc-step-section vc-fieldset">
          <label class="vc-label">¿A qué horas sueles comer regularmente?</label>
          <div class="vc-grid two">
            ${state.profile.plannedMeals.includes("breakfast") ? `<div class="vc-field"><label class="vc-label" for="onboarding-breakfast-time">Desayuno</label><input id="onboarding-breakfast-time" class="vc-time" type="time" data-field="breakfastTime" value="${escapeHtml(state.profile.breakfastTime)}"></div>` : ""}
            ${state.profile.plannedMeals.includes("snack") ? `<div class="vc-field"><label class="vc-label" for="onboarding-snack-time">Merienda</label><input id="onboarding-snack-time" class="vc-time" type="time" data-field="snackTime" value="${escapeHtml(state.profile.snackTime)}"></div>` : ""}
            ${state.profile.plannedMeals.includes("lunch") ? `<div class="vc-field"><label class="vc-label" for="onboarding-lunch-time">Almuerzo</label><input id="onboarding-lunch-time" class="vc-time" type="time" data-field="lunchTime" value="${escapeHtml(state.profile.lunchTime)}"></div>` : ""}
            ${state.profile.plannedMeals.includes("dinner") ? `<div class="vc-field"><label class="vc-label" for="onboarding-dinner-time">Cena</label><input id="onboarding-dinner-time" class="vc-time" type="time" data-field="dinnerTime" value="${escapeHtml(state.profile.dinnerTime)}"></div>` : ""}
          </div>
          <span class="vc-helper">Esto se usará para ajustar recordatorios y encajar el plan con tu ritmo real.</span>
        </div>
        <div class="vc-note vc-note-strong">
          Se generará una semana empezando mañana, con porciones adaptadas a ${state.profile.householdCount} ${state.profile.householdCount === 1 ? "persona" : "personas"}, intentando reutilizar ingredientes y midiendo calorías aproximadas por plato.
        </div>
      `,
    },
  ];

  const step = steps[state.onboardingStep];
  const progress = ((state.onboardingStep + 1) / steps.length) * 100;

  return `
    <section class="vc-shell">
      <article class="vc-card vc-step">
        <div class="vc-progress">
          <div class="vc-step-progress-head">
            <span class="vc-eyebrow">Paso ${state.onboardingStep + 1} de ${steps.length}</span>
            <span class="vc-helper">${Math.round(progress)}% completado</span>
          </div>
          <div class="vc-progress-bar"><div class="vc-progress-fill" style="width:${progress}%"></div></div>
        </div>
        <div class="vc-step-hero">
          <div class="vc-step-badge">${String(state.onboardingStep + 1).padStart(2, "0")}</div>
          <div class="vc-step-intro">
            <span class="vc-step-kicker">${escapeHtml(step.kicker)}</span>
            <h1 class="vc-step-title">${escapeHtml(step.title)}</h1>
            <p class="vc-step-copy">${escapeHtml(step.copy)}</p>
          </div>
        </div>
        <div class="vc-form vc-onboarding-form">${step.content}</div>
        <div class="vc-step-foot">
          ${state.onboardingStep > 0 ? `<button class="vc-button secondary" data-action="onboarding-back">Volver</button>` : `<span></span>`}
          ${state.onboardingStep === steps.length - 1
            ? `<button class="vc-button primary" data-action="finish-onboarding">Preparar mi menÃº de la semana</button>`
            : `<button class="vc-button primary" data-action="onboarding-next">Continuar</button>`}
        </div>
      </article>
    </section>
  `;
}

function renderBanner() {
  if (!state.week) return "";

  const banners = [];
  if (shouldPromptShopping(state.week)) {
    banners.push(`
      <article class="vc-banner">
        <strong>Tu lista de la compra todavÃ­a no estÃ¡ marcada como completada.</strong>
        <p class="vc-copy">Puedes terminarla ahora o revisar quÃ© ingredientes te faltan antes de salir al sÃºper.</p>
        <div class="vc-inline-actions">
          <button class="vc-button primary" data-action="open-view" data-view="shopping">Completar</button>
          <button class="vc-button secondary" data-action="open-view" data-view="shopping">Revisar lista</button>
        </div>
      </article>
    `);
  }

  if (isWeekEndingSoon(state.week)) {
    banners.push(`
      <article class="vc-banner">
        <strong>Esta semana estÃ¡ a punto de acabarse.</strong>
        <p class="vc-copy">Puedes lanzar ya la siguiente comenzando justo despuÃ©s del plan actual y reutilizando las preferencias guardadas.</p>
        <div class="vc-inline-actions">
          <button class="vc-button primary" data-action="replan-next-week">Programar la siguiente semana</button>
        </div>
      </article>
    `);
  }

  return banners.join("");
}

function renderWorkspaceHeader() {
  const userName = state.profile?.displayName?.split(" ")[0] || "Chef";
  const mealsCount = flattenMeals(state.week).length;
  const shoppingItems = state.week?.shoppingList?.length || 0;
  const reminderCount = state.week?.reminders?.filter((item) => !item.deliveredAt).length || 0;
  const weekSummary = buildWeekSummaryText();

  return `
    <section class="vc-workspace-head">
      <article class="vc-hero vc-home-hero">
        <div class="vc-header-copy">
          <span class="vc-eyebrow">Tu semana actual</span>
          <h1 class="vc-title">Hola, ${escapeHtml(userName)}.</h1>
          <p class="vc-copy vc-home-summary-copy">${escapeHtml(weekSummary)}</p>
        </div>
        <div class="vc-chip-row">
          <span class="vc-meta-pill">${escapeHtml(formatDateLong(state.week?.startDate || getTomorrowIso()))}</span>
          <span class="vc-meta-pill">${state.week?.shoppingCompleted ? "Compra cerrada" : "Compra pendiente"}</span>
          <span class="vc-meta-pill">${escapeHtml(state.profile?.timezone || getTimezone())}</span>
        </div>
        <div class="vc-inline-actions">
          <button class="vc-button primary" data-action="open-view" data-view="week">Ver calendario</button>
          <button class="vc-button secondary" data-action="open-view" data-view="shopping">Abrir compra</button>
        </div>
      </article>

      <div class="vc-stat-grid">
        <article class="vc-stat">
          <small class="vc-muted">Semana actual</small>
          <strong>${mealsCount}</strong>
          <span class="vc-muted">platos planificados</span>
        </article>
        <article class="vc-stat">
          <small class="vc-muted">Lista del sÃºper</small>
          <strong>${shoppingItems}</strong>
          <span class="vc-muted">ingredientes agregados</span>
        </article>
        <article class="vc-stat">
          <small class="vc-muted">Recordatorios</small>
          <strong>${reminderCount}</strong>
          <span class="vc-muted">avisos pendientes</span>
        </article>
      </div>
    </section>
  `;
}

function renderHomeMealCard(entry) {
  const cookable = isMealCookable(entry.meal);
  return `
    <article class="vc-home-meal-card">
      <small class="vc-muted">${escapeHtml(getTodayMealLabel(entry))}</small>
      <h3 class="vc-inline-title">${escapeHtml(entry.meal.title)}</h3>
      <p class="vc-copy">${escapeHtml(entry.meal.summary)}</p>
      <div class="vc-meta">
        <span class="vc-meta-pill">${entry.meal.prepMinutes} min</span>
        <span class="vc-meta-pill">${entry.meal.calories} kcal</span>
        <span class="vc-meta-pill">${escapeHtml(entry.meal.difficulty)}</span>
      </div>
      <div class="vc-inline-actions">
        ${cookable ? `<button class="vc-button primary" data-action="cook-meal" data-meal-id="${entry.meal.id}">Cocinar</button>` : ""}
        <button class="vc-button ghost" data-action="open-details" data-meal-id="${entry.meal.id}">Ver detalles</button>
      </div>
    </article>
  `;
}

function renderHomeView() {
  if (!state.week) return renderWeekView();
  const todayEntries = getRemainingCookingEntriesToday();
  const nextEntry = getNextCookingEntry();
  const missingTodayItems = getTodayMissingShoppingItems();
  const futureReminderCount = (state.week.reminders || []).filter((reminder) => getReminderBucket(reminder) === "future").length;
  const batchingTips = (state.week.batchingTips || []).slice(0, 3);

  return `
    <section class="vc-grid">
      <div class="vc-grid two vc-home-grid">
        <article class="vc-panel vc-home-section">
          <span class="vc-eyebrow">Hoy</span>
          <h2 class="vc-title">Lo que queda por cocinar</h2>
          <p class="vc-copy">VelociChef mira la hora actual y te ensena solo los platos que todavia entran en juego hoy.</p>
          ${todayEntries.length ? `
            <div class="vc-home-meal-list">
              ${todayEntries.map(renderHomeMealCard).join("")}
            </div>
          ` : `
            <article class="vc-card vc-empty vc-home-empty">
              <h3 class="vc-inline-title">Hoy ya no queda nada pendiente.</h3>
              <p class="vc-copy">${nextEntry
                ? `Lo siguiente que viene es ${nextEntry.meal.title} para ${formatDateLong(nextEntry.day.date)}.`
                : "Cuando tengas un plato activo aqui te mostrare el siguiente paso de la semana."}</p>
              <div class="vc-inline-actions" style="justify-content:center">
                <button class="vc-button primary" data-action="open-view" data-view="week">Abrir calendario</button>
              </div>
            </article>
          `}
        </article>

        <article class="vc-panel vc-home-section">
          <span class="vc-eyebrow">Semana</span>
          <h2 class="vc-title">Resumen rapido</h2>
          <p class="vc-copy">Tus avisos, la compra y las recetas de esta semana quedan aqui a mano para moverte rapido entre lo importante.</p>
          <div class="vc-home-side-stack">
            <article class="vc-summary-card">
              <small class="vc-muted">Avisos por delante</small>
              <strong>${futureReminderCount}</strong>
              <p class="vc-copy">recordatorios futuros entre cocina, congelador y replanificacion.</p>
            </article>
            <article class="vc-summary-card">
              <small class="vc-muted">Compra de hoy</small>
              <strong>${missingTodayItems.length}</strong>
              <p class="vc-copy">${missingTodayItems.length ? "ingredientes pendientes para los platos de hoy." : "No hay ingredientes pendientes para hoy."}</p>
            </article>
          </div>
          <div class="vc-inline-actions">
            <button class="vc-button secondary" data-action="open-view" data-view="notifications">Notificaciones</button>
            <button class="vc-button ghost" data-action="open-view" data-view="recipes">Mis recetas</button>
          </div>
        </article>
      </div>

      ${missingTodayItems.length ? `
        <article class="vc-banner vc-home-warning">
          <strong>Puede que no tengas todos los ingredientes para hoy.</strong>
          <p class="vc-copy">Faltan ${missingTodayItems.length} ingrediente${missingTodayItems.length === 1 ? "" : "s"} por revisar para los platos que aun quedan por cocinar.</p>
          <div class="vc-inline-actions">
            <button class="vc-button primary" data-action="open-view" data-view="today-shopping">Revisar</button>
          </div>
        </article>
      ` : `
        <article class="vc-summary-card vc-home-ok">
          <strong>Hoy lo tienes controlado.</strong>
          <p class="vc-copy">Todo lo que necesitas para los platos pendientes de hoy ya esta marcado como resuelto.</p>
        </article>
      `}

      ${batchingTips.length ? `
        <article class="vc-panel">
          <span class="vc-eyebrow">Para que vaya suave</span>
          <h2 class="vc-title">Pequenos atajos de la semana</h2>
          <ul class="vc-list">
            ${batchingTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
          </ul>
        </article>
      ` : ""}

      ${renderBanner()}
    </section>
  `;
}

function renderMealCard(day, mealKey, meal) {
  const feedback = meal.feedback || {};
  const cookable = isMealCookable(meal);
  return `
    <article class="vc-meal-card">
      <div class="vc-meal-head">
        <div class="vc-meal-copy">
          <small class="vc-muted">${escapeHtml(MEAL_LABELS[mealKey] || mealKey)}</small>
          <strong>${escapeHtml(meal.title)}</strong>
          <p class="vc-copy">${escapeHtml(meal.summary)}</p>
        </div>
      </div>
      <div class="vc-meta">
        <span class="vc-meta-pill">${meal.prepMinutes} min</span>
        <span class="vc-meta-pill">${escapeHtml(meal.difficulty)}</span>
        <span class="vc-meta-pill">${meal.calories} kcal</span>
        <span class="vc-meta-pill">${meal.servings} ${meal.servings === 1 ? "persona" : "personas"}</span>
        ${feedback.liked ? `<span class="vc-meta-pill">Te gusta</span>` : ""}
      </div>
      <div class="vc-meal-actions">
        ${cookable ? `<button class="vc-button primary" data-action="cook-meal" data-meal-id="${meal.id}">Cocinar</button>` : ""}
        ${cookable ? `<button class="vc-button subtle" data-action="toggle-like" data-meal-id="${meal.id}">Me gusta</button>` : ""}
        ${cookable ? `<button class="vc-button secondary" data-action="open-refine" data-meal-id="${meal.id}">No me gusta</button>` : ""}
        ${cookable ? `<button class="vc-button secondary" data-action="swap-meal" data-meal-id="${meal.id}">Cambiar por otro plato</button>` : ""}
        <button class="vc-button ghost" data-action="open-details" data-meal-id="${meal.id}">Ver detalles</button>
      </div>
    </article>
  `;
}

function renderWeekView() {
  if (!state.week) {
    return `
      <article class="vc-card vc-empty">
        <h2 class="vc-title">Todavía no hay semana cocinada.</h2>
        <p class="vc-copy">Lanza tu primer menú semanal y VelociChef te preparará recetas, compra y recordatorios.</p>
        <div class="vc-inline-actions" style="justify-content:center">
          <button class="vc-button primary" data-action="generate-first-week">Preparar mi menú de la semana</button>
        </div>
      </article>
    `;
  }

  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <div class="vc-weekday-head">
          <div>
            <span class="vc-eyebrow">Semana desde ${escapeHtml(friendlyDayLabel(state.week.startDate, state.week.startDate))}</span>
            <h2 class="vc-title">Calendario de platos</h2>
            <p class="vc-copy">${escapeHtml(state.week.strategy || "Semana pensada para cocinar con cabeza y comprar sin duplicar demasiado.")}</p>
          </div>
          <div class="vc-inline-actions">
            <button class="vc-button secondary" data-action="open-view" data-view="recipes">Mis recetas de esta semana</button>
          </div>
        </div>
      </article>

      <div class="vc-week-grid">
        ${state.week.days.map((day) => `
          <article class="vc-week-card vc-card">
            <div class="vc-weekday-head">
              <div>
                <h3 class="vc-weekday-title">${escapeHtml(day.label)}</h3>
                <p class="vc-weekday-date">${escapeHtml(formatDateLong(day.date))}</p>
              </div>
            </div>
            <div class="vc-day-meals">
              ${Object.entries(day.meals || {}).map(([mealKey, meal]) => renderMealCard(day, mealKey, meal)).join("")}
            </div>
          </article>
        `).join("")}
      </div>

      ${state.week.batchingTips?.length ? `
        <article class="vc-panel">
          <h3 class="vc-title">Tips para que la semana vaya suave</h3>
          <ul class="vc-list">
            ${state.week.batchingTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
          </ul>
        </article>
      ` : ""}

      <div class="vc-inline-actions" style="justify-content:flex-end">
        <button class="vc-button primary" data-action="open-view" data-view="schedule">Siguiente</button>
      </div>
    </section>
  `;
}

function groupByCategory(items) {
  return items.reduce((acc, item) => {
    const key = item.category || "Otros";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

function renderScheduleView() {
  return `
    <section class="vc-grid">
      <article class="vc-card vc-step">
        <div>
          <span class="vc-eyebrow">Ajustes finales</span>
          <h2 class="vc-step-title">Encajemos la semana con tu ritmo real</h2>
          <p class="vc-step-copy">Aquí puedes revisar lo que ya marcaste en el onboarding y afinar los avisos antes de ir a la compra.</p>
        </div>

        <div class="vc-fieldset">
          <label class="vc-switch">
            <span>
              <strong>¿Prefieres cocinar el almuerzo la noche anterior?</strong>
              <small class="vc-helper">Si activas esto, te avisaremos la tarde anterior para dejarlo listo.</small>
            </span>
            <input type="checkbox" data-field="lunchPrepNightBefore" ${state.profile.lunchPrepNightBefore ? "checked" : ""}>
          </label>
        </div>

        <div class="vc-grid two">
          ${state.profile.plannedMeals.includes("breakfast") ? `<div class="vc-field"><label class="vc-label" for="breakfast-time">¿A qué hora te gustaría desayunar regularmente?</label><input id="breakfast-time" class="vc-time" type="time" data-field="breakfastTime" value="${escapeHtml(state.profile.breakfastTime)}"></div>` : ""}
          ${state.profile.plannedMeals.includes("snack") ? `<div class="vc-field"><label class="vc-label" for="snack-time">¿A qué hora te gustaría merendar regularmente?</label><input id="snack-time" class="vc-time" type="time" data-field="snackTime" value="${escapeHtml(state.profile.snackTime)}"></div>` : ""}
          ${state.profile.plannedMeals.includes("lunch") ? `<div class="vc-field"><label class="vc-label" for="lunch-time">¿A qué hora te gustaría almorzar regularmente?</label><input id="lunch-time" class="vc-time" type="time" data-field="lunchTime" value="${escapeHtml(state.profile.lunchTime)}"></div>` : ""}
          ${state.profile.plannedMeals.includes("dinner") ? `<div class="vc-field"><label class="vc-label" for="dinner-time">¿A qué hora te gustaría cenar regularmente?</label><input id="dinner-time" class="vc-time" type="time" data-field="dinnerTime" value="${escapeHtml(state.profile.dinnerTime)}"></div>` : ""}
        </div>

        <div class="vc-field">
          <label class="vc-label" for="lead-time">¿Con cuánto margen quieres el recordatorio de cocina?</label>
          <select id="lead-time" class="vc-select" data-field="reminderLeadMinutes">
            ${[45, 60, 75, 90, 120].map((value) => `<option value="${value}" ${Number(state.profile.reminderLeadMinutes) === value ? "selected" : ""}>${value} minutos antes</option>`).join("")}
          </select>
        </div>

        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="open-view" data-view="week">Volver al calendario</button>
          <button class="vc-button primary" data-action="save-schedule">Ir a la lista de la compra</button>
        </div>
      </article>
    </section>
  `;
}

function renderShoppingView() {
  if (!state.week) return renderWeekView();
  const grouped = groupByCategory(state.week.shoppingList);
  const boughtCount = state.week.shoppingList.filter((item) => normalizeShoppingStatus(item.pantryStatus) === "bought").length;
  const pendingCount = state.week.shoppingList.filter((item) => normalizeShoppingStatus(item.pantryStatus) !== "bought").length;
  const pendingMeta = getShoppingStatusMeta("pending");
  const boughtMeta = getShoppingStatusMeta("bought");

  return `
    <section class="vc-grid">
      <div class="vc-shopping-summary">
        <article class="vc-summary-card">
          <small class="vc-muted">Estado de compra</small>
          <div class="vc-shopping-summary-head">
            <span class="vc-shopping-status-badge vc-shopping-status-pending">
              <span class="vc-shopping-status-icon" aria-hidden="true">${pendingMeta.icon}</span>
              <span>Pendiente</span>
            </span>
          </div>
          <div class="vc-shopping-summary-line">
            <strong>${pendingCount}</strong>
            <p class="vc-copy">ingredientes que siguen pendientes</p>
          </div>
        </article>
        <article class="vc-summary-card">
          <small class="vc-muted">Estado de compra</small>
          <div class="vc-shopping-summary-head">
            <span class="vc-shopping-status-badge vc-shopping-status-bought">
              <span class="vc-shopping-status-icon" aria-hidden="true">${boughtMeta.icon}</span>
              <span>Comprado</span>
            </span>
          </div>
          <div class="vc-shopping-summary-line">
            <strong>${boughtCount}</strong>
            <p class="vc-copy">ingredientes que ya has marcado como comprados</p>
          </div>
        </article>
      </div>

      <article class="vc-panel">
          <div class="vc-shopping-head">
            <div>
              <span class="vc-eyebrow">Mi lista de la compra</span>
              <h2 class="vc-title">Todo lo que necesitarás esta semana</h2>
              <p class="vc-copy">Todo empieza en pendiente. Marca cada ingrediente como comprado cuando ya lo tengas resuelto.</p>
            </div>
            <div class="vc-inline-actions">
              <button class="vc-button secondary" data-action="compare-prices" title="Compara precios en supermercados españoles">🔍 Comparar precios</button>
            </div>
          </div>
      </article>

      ${Object.entries(grouped).map(([category, items]) => `
        <article class="vc-list-card">
          <div class="vc-shopping-head">
            <div>
              <h3 class="vc-title">${escapeHtml(category)}</h3>
              <p class="vc-copy">${items.length} ingrediente${items.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div class="vc-shopping-items">
            ${items.map((item) => `
              <article class="vc-shopping-item">
                <div class="vc-shopping-top">
                  <div class="vc-shopping-copy">
                    <span class="vc-shopping-name">${escapeHtml(item.name)}</span>
                    <span class="vc-muted">${escapeHtml(item.displayQuantity)}</span>
                  </div>
                  <div class="vc-shopping-status-line">
                    ${renderShoppingStatusAction(item)}
                  </div>
                </div>
                <div class="vc-tag-row">
                  ${item.refs.slice(0, 2).map((ref) => `<span class="vc-meta-pill">${escapeHtml(MEAL_LABELS[ref.mealKey])}: ${escapeHtml(ref.mealTitle)}</span>`).join("")}
                </div>
              </article>
            `).join("")}
          </div>
        </article>
      `).join("")}

      <div class="vc-step-foot">
        <button class="vc-button secondary" data-action="open-view" data-view="week">Volver al menú</button>
        <button class="vc-button primary" data-action="complete-shopping">Marcar lista como completada</button>
      </div>
    </section>
  `;
}

function renderTodayShoppingView() {
  if (!state.week) return renderShoppingView();
  const todayEntries = getRemainingCookingEntriesToday();
  const todayItems = getTodayMissingShoppingItems();
  const grouped = groupByCategory(todayItems);

  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <span class="vc-eyebrow">Lo que falta para hoy</span>
        <h2 class="vc-title">Ingredientes necesarios para los platos pendientes de hoy</h2>
        <p class="vc-copy">${todayEntries.length
          ? "Aqui solo te enseno lo que aun necesitas para las recetas que siguen vivas hoy segun la hora actual."
          : "Ahora mismo no hay platos pendientes para hoy, asi que no hace falta revisar ingredientes."}</p>
        ${todayEntries.length ? `
          <div class="vc-chip-row">
            ${todayEntries.map((entry) => `<span class="vc-meta-pill">${escapeHtml(getTodayMealLabel(entry))}: ${escapeHtml(entry.meal.title)}</span>`).join("")}
          </div>
        ` : ""}
      </article>

      ${todayItems.length ? Object.entries(grouped).map(([category, items]) => `
        <article class="vc-list-card">
          <div class="vc-shopping-head">
            <div>
              <h3 class="vc-title">${escapeHtml(category)}</h3>
              <p class="vc-copy">${items.length} ingrediente${items.length === 1 ? "" : "s"} pendiente${items.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div class="vc-shopping-items">
            ${items.map((item) => `
              <article class="vc-shopping-item">
                <div class="vc-shopping-top">
                  <div class="vc-shopping-copy">
                    <span class="vc-shopping-name">${escapeHtml(item.name)}</span>
                    <span class="vc-muted">${escapeHtml(item.displayQuantity)}</span>
                  </div>
                  <div class="vc-shopping-status-line">
                    ${renderShoppingStatusAction(item)}
                  </div>
                </div>
                <div class="vc-tag-row">
                  ${item.relevantRefs.map((ref) => `<span class="vc-meta-pill">${escapeHtml(MEAL_LABELS[ref.mealKey] || ref.mealKey)}: ${escapeHtml(ref.mealTitle)}</span>`).join("")}
                </div>
              </article>
            `).join("")}
          </div>
        </article>
      `).join("") : `
        <article class="vc-card vc-empty">
          <h3 class="vc-inline-title">Hoy no te falta nada.</h3>
          <p class="vc-copy">Todo lo necesario para los platos que quedan por cocinar hoy ya esta marcado como resuelto.</p>
        </article>
      `}

      <div class="vc-step-foot">
        <button class="vc-button secondary" data-action="open-view" data-view="home">Volver al inicio</button>
        <button class="vc-button primary" data-action="open-view" data-view="shopping">Ver lista completa</button>
      </div>
    </section>
  `;
}

function renderRecipesView() {
  if (!state.week) return renderWeekView();
  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <span class="vc-eyebrow">Mis recetas de esta semana</span>
        <h2 class="vc-title">Recetario semanal</h2>
        <p class="vc-copy">AquÃ­ tienes todos los platos reunidos para revisar detalles o volver a una receta concreta.</p>
        <div class="vc-inline-actions">
          <button class="vc-button secondary" data-action="redo-current-week">Rehacer planificaciÃ³n</button>
        </div>
      </article>
      <div class="vc-recipe-grid">
        ${flattenMeals(state.week).map(({ day, mealKey, meal }) => `
          <article class="vc-profile-card">
            <small class="vc-muted">${escapeHtml(day.label)} Â· ${escapeHtml(MEAL_LABELS[mealKey])}</small>
            <h3 class="vc-inline-title">${escapeHtml(meal.title)}</h3>
            <p class="vc-copy">${escapeHtml(meal.summary)}</p>
            <div class="vc-meta">
              <span class="vc-meta-pill">${meal.prepMinutes} min</span>
              <span class="vc-meta-pill">${meal.calories} kcal</span>
              <span class="vc-meta-pill">${escapeHtml(meal.difficulty)}</span>
            </div>
            <div class="vc-inline-actions">
              ${isMealCookable(meal) ? `<button class="vc-button primary" data-action="cook-meal" data-meal-id="${meal.id}">Cocinar</button>` : ""}
              <button class="vc-button ghost" data-action="open-details" data-meal-id="${meal.id}">Ver detalles</button>
              ${isMealCookable(meal) ? `<button class="vc-button secondary" data-action="swap-meal" data-meal-id="${meal.id}">Cambiar</button>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReminderCard(reminder, bucket) {
  const isPending = bucket === "pending";
  return `
    <article class="vc-reminder-card ${isPending ? "is-pending" : ""}">
      <div class="vc-reminder-head">
        <div>
          <small class="vc-muted">${escapeHtml(getReminderKindLabel(reminder))}</small>
          <h3 class="vc-inline-title">${escapeHtml(reminder.title)}</h3>
        </div>
        ${isPending
          ? `<button class="vc-reminder-delete" type="button" data-action="delete-reminder" data-reminder-id="${reminder.id}" aria-label="Borrar aviso">X</button>`
          : `<span class="vc-meta-pill">${escapeHtml(getReminderMomentLabel(reminder))}</span>`}
      </div>
      <p class="vc-copy">${escapeHtml(reminder.body)}</p>
      <div class="vc-meta">
        <span class="vc-meta-pill">${escapeHtml(getReminderTypeDescription(reminder))}</span>
        <span class="vc-meta-pill">${escapeHtml(getReminderMomentLabel(reminder))}</span>
        ${reminder.mealTitle ? `<span class="vc-meta-pill">${escapeHtml(reminder.mealTitle)}</span>` : ""}
      </div>
      <div class="vc-inline-actions">
        <button class="vc-button ${isPending ? "primary" : "secondary"}" type="button" data-action="open-reminder" data-reminder-id="${reminder.id}">${isPending ? "Abrir aviso" : "Ver detalle"}</button>
      </div>
    </article>
  `;
}

function renderActivityNotificationCard(notification) {
  const kindLabel = notification.kind === "timer"
    ? "Temporizador"
    : notification.kind === "meal"
      ? "Hora de cocinar"
      : notification.kind === "thaw"
        ? "Descongelar"
        : "Aviso";

  return `
    <article class="vc-reminder-card is-pending">
      <div class="vc-reminder-head">
        <div>
          <small class="vc-muted">${escapeHtml(kindLabel)}</small>
          <h3 class="vc-inline-title">${escapeHtml(notification.title)}</h3>
        </div>
        <button class="vc-reminder-delete" type="button" data-action="delete-activity-notification" data-notification-id="${notification.id}" aria-label="Borrar aviso">&times;</button>
      </div>
      <p class="vc-copy">${escapeHtml(notification.body)}</p>
      <div class="vc-meta">
        <span class="vc-meta-pill">${escapeHtml(formatDateTimeLong(notification.createdAt))}</span>
      </div>
      <div class="vc-inline-actions">
        ${notification.actionLabel
          ? `<button class="vc-button primary" type="button" data-action="open-activity-notification" data-notification-id="${notification.id}">${escapeHtml(notification.actionLabel)}</button>`
          : ""}
      </div>
    </article>
  `;
}

function renderNotificationsView() {
  if (!state.week) return renderWeekView();
  const reminders = (state.week.reminders || []).map(normalizeReminder).filter(Boolean);
  const activityNotifications = getActivityNotifications()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const now = new Date();
  const future = reminders
    .filter((reminder) => getReminderBucket(reminder, now) === "future")
    .sort((a, b) => new Date(a.triggerAt).getTime() - new Date(b.triggerAt).getTime());
  const activeTab = state.notificationTab === "pending" ? "pending" : "future";
  const list = activeTab === "pending" ? activityNotifications : future;

  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <span class="vc-eyebrow">Notificaciones</span>
        <h2 class="vc-title">Tus avisos de cocina</h2>
        <p class="vc-copy">Revisa lo que ya paso y lo que esta por venir, y ajusta la hora de los avisos futuros sin tocar el resto de la app.</p>
        <div class="vc-segmented vc-reminder-tabs" role="tablist" aria-label="Pestanas de avisos">
          <button class="vc-toggle ${activeTab === "pending" ? "active" : ""}" type="button" data-action="set-notification-tab" data-tab="pending">Pendientes</button>
          <button class="vc-toggle ${activeTab === "future" ? "active" : ""}" type="button" data-action="set-notification-tab" data-tab="future">Futuras</button>
        </div>
      </article>

      ${list.length ? `
        <div class="vc-reminder-list">
          ${activeTab === "pending"
            ? list.map((notification) => renderActivityNotificationCard(notification)).join("")
            : list.map((reminder) => renderReminderCard(reminder, activeTab)).join("")}
        </div>
      ` : `
        <article class="vc-card vc-empty">
          <h3 class="vc-inline-title">${activeTab === "pending" ? "No tienes avisos pendientes." : "No tienes avisos futuros ahora mismo."}</h3>
          <p class="vc-copy">${activeTab === "pending"
            ? "Aqui iras viendo las notificaciones recientes de temporizador, descongelado y hora de cocinar."
            : "Los proximos avisos de cocinar, descongelar o replanificar apareceran aqui en cuanto existan."}</p>
        </article>
      `}
    </section>
  `;
}

function ensureProfileSectionState() {
  const defaults = {
    basics: true,
    allergies: false,
    tastes: false,
    goals: false,
    household: false,
    plan: false,
    notifications: false,
  };
  state.profileSections = {
    ...defaults,
    ...(state.profileSections || {}),
  };
  return state.profileSections;
}

function summarizeProfileValues(values, fallback, max = 2) {
  const clean = uniqueValues(values || []).filter(Boolean);
  if (!clean.length) return fallback;
  if (clean.length <= max) return clean.join(", ");
  return `${clean.slice(0, max).join(", ")} y ${clean.length - max} mas`;
}

function getProfileSectionSummary(key) {
  const count = Math.max(1, Number(state.profile?.householdCount || 1));
  const cookingStyleLabel = COOKING_STYLE_OPTIONS.find((option) => option.value === state.profile?.cookingStyle)?.label || "A tu ritmo";
  const customMembers = (state.profile?.householdMembers || []).filter((member) => !member.sameAsMe).length;
  const plannedMeals = uniqueValues(state.profile?.plannedMeals || []).map((meal) => MEAL_LABELS[meal] || meal);
  const notificationEnabledHere = isNotificationActiveOnCurrentDevice();

  switch (key) {
    case "basics":
      return `${state.profile?.displayName || "Chef"} · ${count} ${count === 1 ? "persona" : "personas"} en casa`;
    case "allergies":
      return state.profile?.allergyNotes?.trim()
        ? `${summarizeProfileValues(state.profile?.allergies, "Sin alergias marcadas")} · con notas extra`
        : summarizeProfileValues(state.profile?.allergies, "Sin alergias marcadas");
    case "tastes": {
      const likes = summarizeProfileValues(state.profile?.likes, "gustos sin marcar", 2);
      const dislikes = state.profile?.dislikes?.length ? summarizeProfileValues(state.profile.dislikes, "", 2) : "";
      return dislikes ? `Te gusta ${likes} · evitamos ${dislikes}` : `Te gusta ${likes}`;
    }
    case "goals":
      return `${cookingStyleLabel} · ${summarizeProfileValues(state.profile?.goalTags, "sin objetivos marcados", 2)}`;
    case "household":
      return customMembers ? `${count} personas · ${customMembers} con reglas propias` : `${count} personas · todos siguen tus mismas reglas`;
    case "plan": {
      const times = [];
      if (plannedMeals.includes("breakfast")) times.push(`desayuno ${state.profile?.breakfastTime || "--:--"}`);
      if (plannedMeals.includes("snack")) times.push(`merienda ${state.profile?.snackTime || "--:--"}`);
      if (plannedMeals.includes("lunch")) times.push(`almuerzo ${state.profile?.lunchTime || "--:--"}`);
      if (plannedMeals.includes("dinner")) times.push(`cena ${state.profile?.dinnerTime || "--:--"}`);
      return `${summarizeProfileValues(plannedMeals, "Sin comidas elegidas", 3)} · ${times.join(" · ")}`;
    }
    case "notifications":
      return `${notificationEnabledHere ? "Notificaciones activadas" : "Notificaciones por activar"} · aviso ${state.profile?.reminderLeadMinutes || DEFAULT_REMINDER_LEAD_MINUTES} min antes`;
    default:
      return "";
  }
}

function renderProfileEditorSection({ key, eyebrow, title, summary, body, open }) {
  return `
    <section class="vc-editor-section vc-editor-accordion ${open ? "is-open" : ""}">
      <button class="vc-editor-toggle" type="button" data-action="toggle-profile-section" data-section="${key}" aria-expanded="${open ? "true" : "false"}">
        <span class="vc-editor-toggle-copy">
          <span class="vc-eyebrow">${escapeHtml(eyebrow)}</span>
          <strong class="vc-editor-toggle-title">${title}</strong>
          <span class="vc-editor-toggle-summary">${escapeHtml(summary)}</span>
        </span>
        <span class="vc-editor-toggle-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
          </svg>
        </span>
      </button>
      ${open ? `<div class="vc-editor-panel">${body}</div>` : ""}
    </section>
  `;
}

function renderProfileView() {
  const pushCapable = "PushManager" in window;
  const speechCapable = !!getSpeechRecognitionCtor();
  const deviceNotification = getNotificationDeviceState();
  const sectionState = ensureProfileSectionState();
  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <span class="vc-eyebrow">Perfil</span>
        <h2 class="vc-title">Ajusta tu cocina a tu gusto</h2>
        <p class="vc-copy">Todo lo que cambies aqu&iacute; se guardar&aacute; para las pr&oacute;ximas semanas y para el modo cocinar.</p>
      </article>

      <article class="vc-card vc-step vc-profile-editor">
        ${renderProfileEditorSection({
          key: "basics",
          eyebrow: "Base",
          title: "Tu perfil base",
          summary: getProfileSectionSummary("basics"),
          open: sectionState.basics,
          body: `
            <div class="vc-grid two">
              <div class="vc-field">
                <label class="vc-label" for="profile-name">C&oacute;mo quieres que te llame VelociChef</label>
                <input id="profile-name" class="vc-input" type="text" data-field="displayName" value="${escapeHtml(state.profile.displayName || "")}">
              </div>
              <div class="vc-field">
                <label class="vc-label" for="profile-household-count">Personas que comen regularmente contigo</label>
                <input id="profile-household-count" class="vc-input" type="number" min="1" max="8" data-field="householdCount" value="${state.profile.householdCount}">
              </div>
            </div>
          `,
        })}

        ${renderProfileEditorSection({
          key: "allergies",
          eyebrow: "Alergias",
          title: "Ingredientes que deben quedar fuera",
          summary: getProfileSectionSummary("allergies"),
          open: sectionState.allergies,
          body: `
            <div class="vc-pill-grid">${ALLERGY_OPTIONS.map((option) => renderPill(option, "allergies", state.profile.allergies)).join("")}</div>
            <div class="vc-field">
              <label class="vc-label" for="profile-allergy-notes">Otros detalles importantes</label>
              <textarea id="profile-allergy-notes" class="vc-textarea" data-field="allergyNotes" placeholder="Ejemplo: el pescado blanco me va bien, pero el marisco no.">${escapeHtml(state.profile.allergyNotes)}</textarea>
            </div>
          `,
        })}

        ${renderProfileEditorSection({
          key: "tastes",
          eyebrow: "Gustos",
          title: "Lo que s&iacute; y lo que no",
          summary: getProfileSectionSummary("tastes"),
          open: sectionState.tastes,
          body: `
            <div class="vc-fieldset">
              <label class="vc-label">Cosas que me gustan</label>
              <div class="vc-pill-grid">${LIKE_OPTIONS.map((option) => renderPill(option, "likes", state.profile.likes)).join("")}</div>
            </div>
            <div class="vc-fieldset">
              <label class="vc-label">Cosas que no me gustan</label>
              <div class="vc-pill-grid">${DISLIKE_OPTIONS.map((option) => renderPill(option, "dislikes", state.profile.dislikes)).join("")}</div>
            </div>
            <div class="vc-field">
              <label class="vc-label" for="profile-dietary-notes">Cu&eacute;ntamelo con tus palabras</label>
              <textarea id="profile-dietary-notes" class="vc-textarea" data-field="dietaryNotes" placeholder="Ejemplo: prefiero platos jugosos y cenas suaves.">${escapeHtml(state.profile.dietaryNotes)}</textarea>
            </div>
          `,
        })}

        ${renderProfileEditorSection({
          key: "goals",
          eyebrow: "Objetivos",
          title: "C&oacute;mo quieres comer esta semana",
          summary: getProfileSectionSummary("goals"),
          open: sectionState.goals,
          body: `
            <div class="vc-fieldset">
              <label class="vc-label">Nivel de cocina</label>
              <div class="vc-pill-grid">${COOKING_STYLE_OPTIONS.map((option) => renderCookingChoice(option, state.profile.cookingStyle)).join("")}</div>
            </div>
            <div class="vc-fieldset">
              <label class="vc-label">Objetivos alimentarios</label>
              <div class="vc-pill-grid">${GOAL_OPTIONS.map((option) => renderPill(option, "goalTags", state.profile.goalTags)).join("")}</div>
            </div>
          `,
        })}

        ${renderProfileEditorSection({
          key: "household",
          eyebrow: "Hogar",
          title: "Reglas por persona",
          summary: getProfileSectionSummary("household"),
          open: sectionState.household,
          body: `
            <div class="vc-member-list">
              ${state.profile.householdMembers.map((member, index) => `
                <article class="vc-member-card">
                  <div class="vc-field">
                    <label class="vc-label">Persona ${index + 1}</label>
                    <input
                      class="vc-input"
                      type="text"
                      value="${escapeHtml(member.name)}"
                      data-member-field="name"
                      data-member-id="${member.id}"
                    >
                  </div>
                  <label class="vc-switch">
                    <span>
                      <strong>Lo mismo que yo</strong>
                      <small class="vc-helper">Usa tus mismas reglas alimentarias.</small>
                    </span>
                    <input type="checkbox" ${member.sameAsMe ? "checked" : ""} data-member-field="sameAsMe" data-member-id="${member.id}">
                  </label>
                  ${member.sameAsMe ? "" : `
                    <div class="vc-field">
                      <label class="vc-label">Reglas especiales o preferencias</label>
                      <textarea class="vc-textarea" data-member-field="notes" data-member-id="${member.id}" placeholder="Ejemplo: prefiere cenas suaves y sin pescado azul.">${escapeHtml(member.notes)}</textarea>
                    </div>
                  `}
                </article>
              `).join("")}
            </div>
          `,
        })}

        ${renderProfileEditorSection({
          key: "plan",
          eyebrow: "Plan",
          title: "Comidas, horarios y avisos",
          summary: getProfileSectionSummary("plan"),
          open: sectionState.plan,
          body: `
            <div class="vc-fieldset">
              <label class="vc-label">Comidas a planificar</label>
              <div class="vc-pill-grid">${MEAL_OPTIONS.map((option) => renderMealChoice(option, state.profile.plannedMeals)).join("")}</div>
            </div>
            <label class="vc-switch vc-switch-card">
              <span>
                <strong>&iquest;Preparas el almuerzo la noche anterior?</strong>
                <small class="vc-helper">As&iacute; podr&eacute; organizar mejor el momento de cocinar.</small>
              </span>
              <input type="checkbox" data-field="lunchPrepNightBefore" ${state.profile.lunchPrepNightBefore ? "checked" : ""}>
            </label>
            <div class="vc-grid two">
              ${state.profile.plannedMeals.includes("breakfast") ? `<div class="vc-field"><label class="vc-label" for="profile-breakfast-time">¿A qué hora sueles desayunar?</label><input id="profile-breakfast-time" class="vc-time" type="time" data-field="breakfastTime" value="${escapeHtml(state.profile.breakfastTime)}"></div>` : ""}
              ${state.profile.plannedMeals.includes("snack") ? `<div class="vc-field"><label class="vc-label" for="profile-snack-time">¿A qué hora sueles merendar?</label><input id="profile-snack-time" class="vc-time" type="time" data-field="snackTime" value="${escapeHtml(state.profile.snackTime)}"></div>` : ""}
              ${state.profile.plannedMeals.includes("lunch") ? `<div class="vc-field"><label class="vc-label" for="profile-lunch-time">¿A qué hora sueles comer?</label><input id="profile-lunch-time" class="vc-time" type="time" data-field="lunchTime" value="${escapeHtml(state.profile.lunchTime)}"></div>` : ""}
              ${state.profile.plannedMeals.includes("dinner") ? `<div class="vc-field"><label class="vc-label" for="profile-dinner-time">¿A qué hora sueles cenar?</label><input id="profile-dinner-time" class="vc-time" type="time" data-field="dinnerTime" value="${escapeHtml(state.profile.dinnerTime)}"></div>` : ""}
            </div>
            <div class="vc-field">
              <label class="vc-label" for="profile-lead-time">&iquest;Con cu&aacute;nto margen quieres que te avise?</label>
              <select id="profile-lead-time" class="vc-select" data-field="reminderLeadMinutes">
                ${[45, 60, 75, 90, 120].map((value) => `<option value="${value}" ${Number(state.profile.reminderLeadMinutes) === value ? "selected" : ""}>${value} minutos antes</option>`).join("")}
              </select>
            </div>
          `,
        })}

        ${renderProfileEditorSection({
          key: "notifications",
          eyebrow: "Avisos y ayuda",
          title: "Mant&eacute;n la app a tu ritmo",
          summary: getProfileSectionSummary("notifications"),
          open: sectionState.notifications,
          body: `
            ${isIOSDevice() && !isStandaloneApp() ? `<div class="vc-note">En iPhone, abre VelociChef desde la pantalla de inicio para poder activar avisos.</div>` : ""}
            <p class="vc-copy">${escapeHtml(getNotificationStatusCopy())} ${state.profile.freezeNotificationsEnabled ? "Tambi&eacute;n recordar&eacute; los ingredientes que convenga descongelar." : "Los recordatorios de congelado siguen apagados por ahora."}</p>
            <div class="vc-chip-row">
              <span class="vc-meta-pill">${escapeHtml(getNotificationDeviceChip())}</span>
              <span class="vc-meta-pill">${pushCapable ? "Avisos tambi&eacute;n fuera de la app" : "Avisos mientras la app est&aacute; abierta"}</span>
              <span class="vc-meta-pill">${speechCapable ? "Modo manos libres disponible" : "Modo manos libres limitado en este navegador"}</span>
              <span class="vc-meta-pill">${deviceNotification.permission === "granted" ? "Permiso concedido" : deviceNotification.permission === "denied" ? "Permiso bloqueado" : "Permiso pendiente"}</span>
            </div>
            <div class="vc-inline-actions">
              <button class="vc-button secondary" data-action="request-notifications">${escapeHtml(getNotificationCtaLabel())}</button>
              <button class="vc-button ghost" data-action="test-notification">Probar aviso</button>
            </div>
          `,
        })}

        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="plan-new-week">Planificar nueva semana</button>
          <button class="vc-button primary" data-action="save-profile-settings">Guardar cambios del perfil</button>
        </div>
      </article>
    </section>
  `;
}

function getTechniqueMatches(text) {
  const source = String(text || "");
  const normalized = source.toLowerCase();
  const matches = [];

  COOKING_GLOSSARY.forEach((technique) => {
    const phrase = technique.phrase.toLowerCase();
    let index = normalized.indexOf(phrase);
    while (index !== -1) {
      matches.push({
        key: technique.key,
        start: index,
        end: index + phrase.length,
      });
      index = normalized.indexOf(phrase, index + phrase.length);
    }
  });

  return matches
    .sort((a, b) => a.start - b.start)
    .filter((match, index, collection) => index === 0 || match.start >= collection[index - 1].end);
}

function renderTechniqueText(text) {
  const source = String(text || "");
  const matches = getTechniqueMatches(source);
  if (!matches.length) return escapeHtml(source);

  let cursor = 0;
  let html = "";

  matches.forEach((match) => {
    html += escapeHtml(source.slice(cursor, match.start));
    html += `<button class="vc-inline-term" type="button" data-action="open-technique" data-technique="${match.key}">${escapeHtml(source.slice(match.start, match.end))}</button>`;
    cursor = match.end;
  });

  html += escapeHtml(source.slice(cursor));
  return html;
}

function renderCookView() {
  if (!state.week) {
    return `
      <article class="vc-card vc-empty">
        <h2 class="vc-title">Todavia no hay ningun plato listo para cocinar.</h2>
        <p class="vc-copy">Prepara una semana primero y volveras aqui con un modo paso a paso.</p>
        <div class="vc-inline-actions" style="justify-content:center">
          <button class="vc-button primary" data-action="generate-first-week">Preparar mi menu de la semana</button>
        </div>
      </article>
    `;
  }

  const cooking = ensureCookingState();
  const suggestedTarget = cooking.mealId ? getMealById(cooking.mealId) : getSuggestedCookingTarget();

  if (!cooking.mealId || cooking.mode === "suggest") {
    return `
      <section class="vc-grid">
        <article class="vc-card vc-step vc-cook-entry">
          <div>
            <span class="vc-eyebrow">Cocinar</span>
            <h2 class="vc-step-title">Vamos a ponernos con ello</h2>
            <p class="vc-step-copy">VelociChef intenta adelantarse al plato que probablemente quieras preparar ahora mismo.</p>
          </div>

          ${suggestedTarget ? `
            <article class="vc-cook-suggestion">
              <small class="vc-muted">${escapeHtml(suggestedTarget.day.label)} Â· ${escapeHtml(MEAL_LABELS[suggestedTarget.mealKey])}</small>
              <h3 class="vc-inline-title">Estas queriendo cocinar el plato "${escapeHtml(suggestedTarget.meal.title)}" del ${escapeHtml((MEAL_LABELS[suggestedTarget.mealKey] || "").toLowerCase())} del dia ${escapeHtml(formatDateLong(suggestedTarget.day.date))}?</h3>
              <p class="vc-copy">${escapeHtml(suggestedTarget.meal.summary)}</p>
              <div class="vc-inline-actions">
                <button class="vc-button primary" data-action="cook-suggest-yes">Si</button>
                <button class="vc-button secondary" data-action="cook-suggest-no">No</button>
              </div>
            </article>
          ` : `
            <article class="vc-cook-suggestion">
              <h3 class="vc-inline-title">No he encontrado un plato claro para este momento.</h3>
              <p class="vc-copy">Elige tu mismo que receta quieres cocinar ahora.</p>
              <div class="vc-inline-actions">
                <button class="vc-button primary" data-action="cook-suggest-no">Elegir receta</button>
              </div>
            </article>
          `}
        </article>
      </section>
    `;
  }

  if (cooking.mode === "picker") {
    return `
      <section class="vc-grid">
        <article class="vc-panel">
          <span class="vc-eyebrow">Cocinar</span>
          <h2 class="vc-title">Elige tu plato</h2>
          <p class="vc-copy">Selecciona el dia y la comida que quieres preparar ahora mismo.</p>
        </article>
        <div class="vc-week-grid">
          ${state.week.days.map((day) => `
            <article class="vc-week-card vc-card">
              <div class="vc-weekday-head">
                <div>
                  <h3 class="vc-weekday-title">${escapeHtml(day.label)}</h3>
                  <p class="vc-weekday-date">${escapeHtml(formatDateLong(day.date))}</p>
                </div>
              </div>
              <div class="vc-cook-pick-list">
                ${Object.entries(day.meals || {}).map(([mealKey, meal]) => `
                  <article class="vc-cook-pick-card">
                    <small class="vc-muted">${escapeHtml(MEAL_LABELS[mealKey])}</small>
                    <strong>${escapeHtml(meal.title)}</strong>
                    <p class="vc-copy">${escapeHtml(meal.summary)}</p>
                    ${isMealCookable(meal) ? `<button class="vc-button primary" data-action="cook-meal" data-meal-id="${meal.id}">Cocinar</button>` : `<span class="vc-meta-pill">Sin cocina</span>`}
                  </article>
                `).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  const target = getCookingTarget();
  if (!target) {
    state.cooking = createCookingState("picker", null);
    return renderCookView();
  }

  const { stages, stepIndex, current } = getCookingStage(target);
  const activeTimer = getPrimaryCookingTimer();
  const isIngredientsStep = current?.kind === "ingredients";
  const isLastStep = stepIndex === stages.length - 1;
  const currentImage = getCookingImageState(current);
  const currentStepTimer = current?.id
    ? (state.cooking?.activeTimers || []).find((timer) => timer.stepId === current.id && timer.mealId === target.meal.id) || null
    : null;
  const stepMeta = isIngredientsStep ? "Preparación" : current.title;
  const stepCopyText = isIngredientsStep
    ? "Coge estos ingredientes, dejalos a mano y preparalos para arrancar sin interrupciones."
    : (current.text || "");
  const timerButtonLabel = currentStepTimer
    ? "Volver a empezar este temporizador"
    : (activeTimer ? "Añadir otra cuenta regresiva" : "Comenzar cuenta regresiva");
  const cookDensityClass = isIngredientsStep
    ? "vc-cook-density-ingredients"
    : getCookCopyDensityClass(stepCopyText, {
        isIngredientsStep,
        hasTimer: !!current?.timerMinutes,
      });
  const cookCopyPanel = `
    <div class="vc-cook-copy-panel ${isIngredientsStep ? "vc-cook-copy-panel-ingredients" : ""}">
      <div class="vc-cook-copy-meta">
        <small class="vc-muted">${escapeHtml(target.day.label)} · ${escapeHtml(MEAL_LABELS[target.mealKey])}</small>
        <small class="vc-muted">${escapeHtml(stepMeta)}</small>
      </div>
      <p class="vc-copy vc-cook-step-copy ${isIngredientsStep ? "vc-cook-step-copy-ingredients" : ""}">${isIngredientsStep
        ? escapeHtml(stepCopyText)
        : renderTechniqueText(stepCopyText)}</p>
      ${current?.timerMinutes ? `
        <div class="vc-inline-actions vc-cook-inline-tools">
          <button class="vc-button secondary" data-action="start-step-timer">
            ${escapeHtml(timerButtonLabel)}
          </button>
        </div>
      ` : ""}
    </div>
  `;

  return `
    <section class="vc-grid vc-cook-screen vc-cook-screen-immersive">
      <article class="vc-cook-mode vc-cook-mode-immersive">
        <article class="vc-cook-stage vc-cook-stage-immersive ${isIngredientsStep ? "is-ingredients" : ""} ${cookDensityClass}">
          ${isIngredientsStep ? cookCopyPanel : ""}
          <div class="vc-cook-visual ${isIngredientsStep ? "vc-cook-visual-ingredients" : ""}">
            ${isIngredientsStep ? `
              <div class="vc-cook-ingredient-board-wrap">
                <div class="vc-cook-ingredient-board">
                  ${(current.ingredients || []).map((ingredient) => `
                    <article class="vc-cook-ingredient">
                      <strong>${escapeHtml(ingredient.name)}</strong>
                      <span class="vc-muted">${escapeHtml(formatQuantity(ingredient.quantity, ingredient.unit))}</span>
                    </article>
                  `).join("")}
                </div>
              </div>
            ` : `
              ${!currentImage || currentImage?.status === "loading" ? `<div class="vc-cook-image-shell vc-cook-image-loading" aria-hidden="true"><span class="vc-cook-image-glow"></span></div>` : ""}
              ${currentImage?.status === "ready" ? `
                <figure class="vc-cook-figure vc-cook-figure-immersive">
                  <img src="${currentImage.src}" alt="${escapeHtml(stepMeta)}">
                  ${currentImage.attributionLabel
                    ? `<a class="vc-cook-image-credit" href="${escapeHtml(currentImage.attributionUrl || "#")}" target="_blank" rel="noreferrer">${escapeHtml(currentImage.attributionLabel)}</a>`
                    : ""}
                </figure>
              ` : ""}
              ${currentImage?.status === "error" ? `<div class="vc-note vc-cook-image-fallback">Ilustracion no disponible ahora mismo.</div>` : ""}
            `}
          </div>
          ${isIngredientsStep ? "" : cookCopyPanel}
        </article>

        <div class="vc-step-foot vc-cook-foot vc-cook-foot-immersive">
          <button class="vc-button secondary" data-action="cook-stage-prev" ${stepIndex === 0 ? "disabled" : ""}>Atras</button>
          ${isLastStep
            ? `<button class="vc-button primary" data-action="finish-cooking-session">Terminar</button>`
            : `<button class="vc-button primary" data-action="cook-stage-next">Siguiente</button>`}
        </div>
      </article>
    </section>
  `;
}

function renderWorkspace() {
  const views = {
    home: renderHomeView(),
    week: renderWeekView(),
    schedule: renderScheduleView(),
    shopping: renderShoppingView(),
    "today-shopping": renderTodayShoppingView(),
    recipes: renderRecipesView(),
    profile: renderProfileView(),
    notifications: renderNotificationsView(),
    cook: renderCookView(),
  };

  return `
    <section class="vc-workspace">
      ${state.currentView === "home" ? renderWorkspaceHeader() : ""}
      ${views[state.currentView] || views.home}
    </section>
  `;
}

function renderMealDetailModal(target) {
  const { meal, day, mealKey } = target;
  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">${escapeHtml(day.label)} Â· ${escapeHtml(MEAL_LABELS[mealKey])}</small>
            <h2 class="vc-modal-title">${escapeHtml(meal.title)}</h2>
            <p class="vc-copy">${escapeHtml(meal.summary)}</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>
        <div class="vc-meta">
          <span class="vc-meta-pill">Tiempo: ${meal.prepMinutes} min</span>
          <span class="vc-meta-pill">Dificultad: ${escapeHtml(meal.difficulty)}</span>
          <span class="vc-meta-pill">CalorÃ­as: ${meal.calories} kcal</span>
          <span class="vc-meta-pill">Porciones: ${meal.servings}</span>
        </div>
        <div class="vc-grid two">
          <article class="vc-profile-card">
            <h3 class="vc-inline-title">Ingredientes</h3>
            <ul class="vc-list">
              ${(meal.ingredients || []).map((ingredient) => `<li>${escapeHtml(`${ingredient.name} Â· ${formatQuantity(ingredient.quantity, ingredient.unit)}`)}</li>`).join("")}
            </ul>
          </article>
          <article class="vc-profile-card">
            <h3 class="vc-inline-title">NutriciÃ³n aproximada</h3>
            <ul class="vc-list">
              <li>ProteÃ­na: ${meal.nutrition.protein} g</li>
              <li>Carbohidratos: ${meal.nutrition.carbs} g</li>
              <li>Grasas: ${meal.nutrition.fats} g</li>
              <li>Fibra: ${meal.nutrition.fiber} g</li>
            </ul>
          </article>
        </div>
        ${(meal.cookingSteps || []).length ? `
          <article class="vc-profile-card">
            <h3 class="vc-inline-title">CÃ³mo se hace</h3>
            <ol class="vc-list vc-list-ordered">
              ${meal.cookingSteps.map((step) => `<li>${escapeHtml(step.text)}</li>`).join("")}
            </ol>
          </article>
        ` : ""}
      </div>
    </div>
  `;
}

function renderTechniqueModal() {
  const technique = COOKING_GLOSSARY.find((item) => item.key === state.modal?.techniqueKey);
  if (!technique) return "";
  const techniqueTitle = sanitizeUiCopy(technique.title);
  const techniqueBody = sanitizeUiCopy(technique.body);

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Ayuda de cocina</small>
            <h2 class="vc-modal-title">${escapeHtml(techniqueTitle)}</h2>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>
        <article class="vc-profile-card">
          <p class="vc-copy">${escapeHtml(techniqueBody)}</p>
        </article>
      </div>
    </div>
  `;
}

function renderRefineModal(target) {
  const chosen = state.modal?.reasons || [];
  const ingredientChoices = state.modal?.selectedIngredients || [];
  const savePreference = state.modal?.savePreference !== false;

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">${escapeHtml(target.day.label)} Â· ${escapeHtml(MEAL_LABELS[target.mealKey])}</small>
            <h2 class="vc-modal-title">Afinar gustos</h2>
            <p class="vc-copy">CuÃ©ntame quÃ© ha fallado en "${escapeHtml(target.meal.title)}" y te busco algo mejor.</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        <div class="vc-fieldset">
          <label class="vc-label">Â¿QuÃ© ha pasado?</label>
          <div class="vc-pill-grid">
            ${REFINEMENT_REASON_OPTIONS.map((reason) => `
              <button class="vc-pill ${chosen.includes(reason.key) ? "active" : ""}" data-action="toggle-refine-reason" data-value="${reason.key}">
                <span>${escapeHtml(reason.label)}</span>
              </button>
            `).join("")}
          </div>
        </div>

        ${chosen.includes("ingredients") ? `
          <div class="vc-fieldset">
            <label class="vc-label">Â¿QuÃ© ingredientes prefieres evitar aquÃ­?</label>
            <div class="vc-pill-grid">
              ${target.meal.ingredients.map((ingredient) => `
                <button class="vc-pill ${ingredientChoices.includes(ingredient.name) ? "active" : ""}" data-action="toggle-refine-ingredient" data-value="${escapeHtml(ingredient.name)}">
                  <span>${escapeHtml(ingredient.name)}</span>
                </button>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <label class="vc-switch">
          <span>
            <strong>Guardar estas preferencias para futuras semanas</strong>
            <small class="vc-helper">Si marcas ingredientes o ajustes de dificultad, los usaremos al replanificar.</small>
          </span>
          <input type="checkbox" data-action="toggle-refine-save" ${savePreference ? "checked" : ""}>
        </label>

        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="close-modal">Cancelar</button>
          <button class="vc-button primary" data-action="submit-refinement">Guardar preferencias y recibir otro plato</button>
        </div>
      </div>
    </div>
  `;
}

function renderFreezerPromptModal() {
  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <h2 class="vc-modal-title">Â¿Quieres congelar algunos ingredientes y recibir aviso para descongelarlos?</h2>
            <p class="vc-copy">VelociChef ha detectado productos que quizÃ¡ quieras congelar para que aguanten mejor hasta el dÃ­a del plato.</p>
          </div>
        </div>
        <article class="vc-profile-card">
          <ul class="vc-list">
            ${state.week.freezerItems.map((item) => `<li>${escapeHtml(`${item.ingredient} para ${item.mealTitle} (${formatDateLong(item.mealDate)})`)}</li>`).join("")}
          </ul>
        </article>
        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="decline-freezer">No, gracias</button>
          <button class="vc-button primary" data-action="accept-freezer">SÃ­, avÃ­same</button>
        </div>
      </div>
    </div>
  `;
}

function renderPriceComparisonModal() {
  const results = state.priceComparison.results;
  const loading = state.priceComparison.loading;
  const error = state.priceComparison.error;
  const subtitle = state.priceComparison.subtitle || "Estoy buscando los mejores precios en Carrefour, Mercadona, Bon Preu y Charter.";

  if (loading) {
    return `
      <div class="vc-modal-layer" data-action="close-modal">
        <div class="vc-modal" role="dialog" aria-modal="true">
          <div class="vc-modal-head">
            <h2 class="vc-modal-title">Comparando precios...</h2>
            <p class="vc-copy" style="text-align: left; line-height: 1.4; max-width: 420px; margin: 0 0 16px;">${escapeHtml(subtitle)}</p>
          </div>
          <div class="vc-loading" style="padding: 24px 20px; text-align: center;">
            <div class="vc-spinner" style="display: inline-block; width: 44px; height: 44px; border: 3px solid rgba(239,123,45,.2); border-top-color: #ef7b2d; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  if (error) {
    const retryAvailable = (state.priceComparison.retryCount || 0) < 2;
    return `
      <div class="vc-modal-layer" data-action="close-modal">
        <div class="vc-modal" role="dialog" aria-modal="true">
          <div class="vc-modal-head">
            <div>
              <h2 class="vc-modal-title">Error al comparar precios</h2>
              <p class="vc-copy">${escapeHtml(error)}</p>
            </div>
          </div>
          <div class="vc-step-foot">
            ${retryAvailable ? '<button class="vc-button secondary" data-action="retry-price-comparison">Intentar de nuevo</button>' : ''}
            <button class="vc-button primary" data-action="close-modal">${retryAvailable ? 'Cerrar' : 'Cerrar'}</button>
          </div>
        </div>
      </div>
    `;
  }

  if (!results) {
    return ``;
  }

  const ingredients = results.ingredients || [];
  const summary = results.summary || {};

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-modal-large" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <h2 class="vc-modal-title">Comparación de precios</h2>
            <p class="vc-copy">Aquí están los precios de tus ingredientes en diferentes supermercados españoles. El mejor supermercado para tu compra es: <strong>${escapeHtml(summary.best_supermarket_overall || "buscando...")}</strong></p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        <div class="vc-price-grid">
          ${ingredients.map((ing) => `
            <article class="vc-price-card">
              <div class="vc-price-card-head">
                <h3 class="vc-price-ingredient">${escapeHtml(ing.name)}</h3>
                <span class="vc-price-quantity">${escapeHtml(String(ing.quantity || ""))}${ing.unit ? ` ${escapeHtml(String(ing.unit))}` : ""}</span>
              </div>
              <div class="vc-price-results">
                ${ing.results && ing.results.length > 0
                  ? ing.results.map((result) => `
                      <div class="vc-price-item">
                        <span class="vc-price-supermarket">${escapeHtml(String(result.supermarket || ""))}</span>
                        <strong class="vc-price-value">${Number(result.price || 0).toFixed(2)} €</strong>
                        <span class="vc-price-availability ${result.availability === "available" ? "available" : "unavailable"}">${result.availability === "available" ? "✓" : "✗"}</span>
                        ${result.note ? `<span class="vc-price-note">${escapeHtml(String(result.note))}</span>` : ""}
                      </div>
                    `).join("")
                  : `<p class="vc-muted">No se encontraron precios</p>`}
              </div>
            </article>
          `).join("")}
        </div>

        <div class="vc-step-foot">
          <button class="vc-button primary" data-action="close-modal">Entendido</button>
        </div>
      </div>
    </div>

    <style>
      .vc-modal-large {
        max-width: 720px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .vc-price-grid {
        display: grid;
        gap: 16px;
        padding: 16px;
      }
      .vc-price-card {
        border: 1px solid rgba(80,29,10,.12);
        border-radius: 12px;
        padding: 12px;
        background: rgba(255,250,244,.5);
      }
      .vc-price-card-head {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .vc-price-ingredient {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: var(--vc-ink);
      }
      .vc-price-quantity {
        font-size: 0.875rem;
        color: var(--vc-muted);
      }
      .vc-price-results {
        display: grid;
        gap: 8px;
      }
      .vc-price-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        background: rgba(255,255,255,.5);
        border-radius: 8px;
        font-size: 0.9rem;
      }
      .vc-price-supermarket {
        font-weight: 500;
        flex: 1;
      }
      .vc-price-value {
        color: #ef7b2d;
        font-size: 1.1rem;
        margin: 0 12px;
      }
      .vc-price-availability {
        font-size: 1.2rem;
      }
      .vc-price-note {
        font-size: 0.8rem;
        color: var(--vc-muted);
        margin-top: 4px;
        display: block;
      }
      .vc-price-availability.available {
        color: #2f8f58;
      }
      .vc-price-availability.unavailable {
        color: #e85a4f;
      }
    </style>
  `;
}

function renderReminderDetailModal(reminder) {
  const isReadOnly = !!state.modal?.readOnly;
  const canSkipFutureMeal = !isReadOnly && reminder.kind === "meal";
  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-reminder-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">${escapeHtml(getReminderKindLabel(reminder))}</small>
            <h2 class="vc-modal-title">${escapeHtml(reminder.title)}</h2>
            <p class="vc-copy">${escapeHtml(reminder.body)}</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        <article class="vc-profile-card">
          <div class="vc-grid two">
            <div>
              <small class="vc-muted">Fecha</small>
              <p class="vc-copy">${escapeHtml(formatDateLong(toIsoDate(new Date(reminder.triggerAt))))}</p>
            </div>
            <div>
              <small class="vc-muted">Hora</small>
              ${isReadOnly
                ? `<p class="vc-copy">${escapeHtml(formatInputTimeFromIso(reminder.triggerAt))}</p>`
                : `<input class="vc-time" type="time" data-modal-field="editedTime" value="${escapeHtml(state.modal?.editedTime || formatInputTimeFromIso(reminder.triggerAt))}">`}
            </div>
          </div>
        </article>

        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="close-modal">Cerrar</button>
          ${canSkipFutureMeal ? `<button class="vc-button secondary" data-action="open-future-no-cook" data-reminder-id="${reminder.id}">No cocinare</button>` : ""}
          ${isReadOnly ? "" : `<button class="vc-button primary" data-action="save-reminder-time" data-reminder-id="${reminder.id}">Guardar hora</button>`}
        </div>
      </div>
    </div>
  `;
}

function renderFutureNoCookModal(reminder) {
  const sourceEntry = reminder.mealId ? getMealById(reminder.mealId) : null;
  const choice = state.modal?.futureNoCookChoice || "";
  const replacementMealId = state.modal?.replacementMealId || "";
  const inlineError = state.modal?.inlineError || "";
  const replacementOptions = getFutureReplacementEntries(reminder);

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-reminder-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">No cocinare este plato</small>
            <h2 class="vc-modal-title">Que quieres hacer con ${escapeHtml(reminder.mealTitle || sourceEntry?.meal?.title || "esta comida")}?</h2>
            <p class="vc-copy">Si vas a comer fuera o pedir delivery, puedo guardar sus ingredientes como disponibles para la proxima planificacion. Si prefieres mover este plato a otro hueco, te dejo elegir que comida futura quieres reemplazar.</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        <article class="vc-profile-card">
          <div class="vc-choice-grid">
            <button class="vc-pill ${choice === "carryover" ? "active" : ""}" type="button" data-action="set-future-no-cook-choice" data-value="carryover">
              <span>Comere fuera o pedire delivery</span>
            </button>
            <button class="vc-pill ${choice === "replace" ? "active" : ""}" type="button" data-action="set-future-no-cook-choice" data-value="replace">
              <span>Mover este plato a otra comida</span>
            </button>
          </div>

          ${choice === "replace" ? `
            <div class="vc-field">
              <label class="vc-label" for="future-replacement">Que comida quieres reemplazar con este plato?</label>
              <select id="future-replacement" class="vc-select" data-modal-field="replacementMealId">
                <option value="">Elige una comida futura</option>
                ${replacementOptions.map((entry) => `
                  <option value="${escapeHtml(entry.meal.id)}" ${replacementMealId === entry.meal.id ? "selected" : ""}>
                    ${escapeHtml(`${entry.day.label} · ${MEAL_LABELS[entry.mealKey] || entry.mealKey} · ${entry.meal.title}`)}
                  </option>
                `).join("")}
              </select>
              <small class="vc-helper">La comida que reemplaces saldra de esta semana y sus ingredientes quedaran guardados para el siguiente plan.</small>
            </div>
          ` : ""}

          ${inlineError ? `<div class="vc-error">${escapeHtml(inlineError)}</div>` : ""}
        </article>

        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="close-modal">Cancelar</button>
          <button class="vc-button primary" data-action="confirm-future-no-cook" data-reminder-id="${reminder.id}">Guardar cambio</button>
        </div>
      </div>
    </div>
  `;
}

function renderFutureNoCookResultModal() {
  const ingredients = Array.isArray(state.modal?.carryoverIngredients) ? state.modal.carryoverIngredients.map(normalizeCarryoverIngredient).filter(Boolean) : [];
  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-reminder-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Cambio guardado</small>
            <h2 class="vc-modal-title">${escapeHtml(state.modal?.title || "He actualizado tu semana")}</h2>
            <p class="vc-copy">${escapeHtml(state.modal?.body || "Tendre esto en cuenta en el siguiente plan semanal.")}</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        ${ingredients.length ? `
          <article class="vc-profile-card">
            <small class="vc-muted">Ingredientes que guardare como disponibles para la siguiente planificacion</small>
            <ul class="vc-list">
              ${ingredients.map((item) => `<li>${escapeHtml(`${item.name} · ${formatQuantity(item.quantity, item.unit)}`)}</li>`).join("")}
            </ul>
          </article>
        ` : ""}

        <div class="vc-step-foot">
          <button class="vc-button primary" data-action="close-modal">Entendido</button>
        </div>
      </div>
    </div>
  `;
}

function renderReminderApplyAllModal(reminder) {
  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-reminder-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Cambio guardado</small>
            <h2 class="vc-modal-title">Quieres aplicar esta hora al resto?</h2>
            <p class="vc-copy">He preparado el cambio para "${escapeHtml(reminder.title)}". Quieres mover tambien los otros avisos de este tipo a las ${escapeHtml(state.modal?.editedTime || "--:--")}?</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>
        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="apply-reminder-time" data-scope="single" data-reminder-id="${reminder.id}">No</button>
          <button class="vc-button primary" data-action="apply-reminder-time" data-scope="group" data-reminder-id="${reminder.id}">Si</button>
        </div>
      </div>
    </div>
  `;
}

function renderCookReminderModal(reminder) {
  const meal = reminder.mealId ? getMealById(reminder.mealId) : null;
  const postponeExpanded = !!state.modal?.postponeExpanded;
  const postponeChoice = state.modal?.postponeChoice || "";
  const editedTime = state.modal?.editedTime || formatInputTimeFromIso(new Date(Date.now() + 60 * 60000).toISOString());
  const inlineError = state.modal?.inlineError || "";

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-reminder-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">${escapeHtml(getReminderKindLabel(reminder))}</small>
            <h2 class="vc-modal-title">Comenzamos a cocinar ${escapeHtml((MEAL_LABELS[reminder.mealKey] || "este plato").toLowerCase())} de hoy?</h2>
            <p class="vc-copy">${escapeHtml(reminder.mealTitle || meal?.meal?.title || reminder.title)}</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        ${!postponeExpanded ? `
          <div class="vc-step-foot">
            <button class="vc-button secondary" data-action="open-cook-postpone" data-reminder-id="${reminder.id}">Aplazar</button>
            <button class="vc-button primary" data-action="start-cook-from-reminder" data-reminder-id="${reminder.id}">Comenzar!</button>
          </div>
        ` : `
          <article class="vc-profile-card">
            <h3 class="vc-inline-title">Que hacemos con este aviso?</h3>
            <div class="vc-choice-grid">
              <button class="vc-pill ${postponeChoice === "skip" ? "active" : ""}" type="button" data-action="set-cook-postpone-choice" data-value="skip">
                <span>Hoy no cocino</span>
              </button>
              <button class="vc-pill ${postponeChoice === "later" ? "active" : ""}" type="button" data-action="set-cook-postpone-choice" data-value="later">
                <span>Cocinare mas tarde</span>
              </button>
            </div>
            ${postponeChoice === "later" ? `
              <div class="vc-field">
                <label class="vc-label" for="postpone-time">Nueva hora para el recordatorio de hoy</label>
                <input id="postpone-time" class="vc-time" type="time" data-modal-field="editedTime" value="${escapeHtml(editedTime)}">
              </div>
            ` : ""}
            ${inlineError ? `<div class="vc-error">${escapeHtml(inlineError)}</div>` : ""}
          </article>
          <div class="vc-step-foot">
            <button class="vc-button secondary" data-action="close-modal">Cancelar</button>
            <button class="vc-button primary" data-action="save-cook-postpone" data-reminder-id="${reminder.id}">Guardar cambio</button>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderCookRecoveryModal() {
  const snapshot = state.pendingCookingRecovery;
  if (!snapshot?.mealId) return "";
  const target = getMealById(snapshot.mealId);
  const mealTitle = snapshot.mealTitle || target?.meal?.title || "tu receta";
  const stepTitle = snapshot.displayStepTitle || snapshot.stepTitle || "el punto donde lo dejaste";
  const stepNumber = snapshot.displayStepNumber || "";
  const mealLabel = snapshot.mealLabel || [target?.day?.label, MEAL_LABELS[target?.mealKey] || ""].filter(Boolean).join(" · ");
  const activeTimerCount = Array.isArray(snapshot.activeTimers) ? snapshot.activeTimers.filter((timer) => !timer.paused).length : 0;

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-reminder-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Recuperar receta</small>
            <h2 class="vc-modal-title">Parece que estabas en medio de una receta</h2>
            <p class="vc-copy">Puedo llevarte de vuelta exactamente a donde lo dejaste para seguir con "${escapeHtml(mealTitle)}".</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        <article class="vc-profile-card">
          <div class="vc-grid">
            ${mealLabel ? `
              <div>
                <small class="vc-muted">Receta</small>
                <p class="vc-copy">${escapeHtml(mealLabel)}</p>
              </div>
            ` : ""}
            <div>
              <small class="vc-muted">Ultimo paso visible</small>
              ${stepNumber ? `<p class="vc-copy">${escapeHtml(stepNumber)}</p>` : ""}
              <p class="vc-copy"><strong>${escapeHtml(stepTitle)}</strong></p>
            </div>
            ${activeTimerCount > 0 ? `
              <div>
                <small class="vc-muted">Temporizadores activos</small>
                <p class="vc-copy">${escapeHtml(`${activeTimerCount} en marcha`)}</p>
              </div>
            ` : ""}
          </div>
        </article>

        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="dismiss-cooking-recovery">Ahora no</button>
          <button class="vc-button primary" data-action="resume-cooking-recovery">Recuperar donde lo deje</button>
        </div>
      </div>
    </div>
  `;
}

function renderCookCloseConfirmModal() {
  const target = getCookingTarget();
  const cookingStage = target ? getCookingStage(target) : null;
  const activeTimerCount = getActiveCookingTimers().length;
  const mealLabel = target ? `${target.day.label} · ${MEAL_LABELS[target.mealKey] || target.mealKey}` : "Modo cocina";

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-reminder-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Cerrar modo cocina</small>
            <h2 class="vc-modal-title">Quieres salir de esta receta?</h2>
            <p class="vc-copy">Cerraras el modo cocina y dejare de seguir este paso a paso hasta que vuelvas a abrirlo.</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">&times;</button>
        </div>

        <article class="vc-profile-card">
          <div class="vc-grid">
            <div>
              <small class="vc-muted">Receta actual</small>
              <p class="vc-copy"><strong>${escapeHtml(target?.meal?.title || "Tu receta actual")}</strong></p>
              <p class="vc-copy">${escapeHtml(mealLabel)}</p>
            </div>
            ${cookingStage?.current ? `
              <div>
                <small class="vc-muted">Paso visible</small>
                <p class="vc-copy">${escapeHtml(`${String(cookingStage.stepIndex + 1).padStart(2, "0")} / ${String(cookingStage.stages.length).padStart(2, "0")}`)}</p>
                <p class="vc-copy"><strong>${escapeHtml(cookingStage.current.title || "Paso actual")}</strong></p>
              </div>
            ` : ""}
            ${activeTimerCount ? `
              <div>
                <small class="vc-muted">Temporizadores activos</small>
                <p class="vc-copy">${escapeHtml(`${activeTimerCount} en marcha`)}</p>
              </div>
            ` : ""}
          </div>
          ${activeTimerCount ? `<div class="vc-note">Si cierras ahora, tambien parare los temporizadores activos de esta receta.</div>` : ""}
        </article>

        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="close-modal">Seguir cocinando</button>
          <button class="vc-button primary" data-action="confirm-close-cooking-session">Si, cerrar</button>
        </div>
      </div>
    </div>
  `;
}

function renderCookFeedbackModal() {
  const modalState = state.modal;
  const target = getCookingFeedbackTarget(modalState);
  if (!target) return "";

  const rating = Math.max(0, Math.min(5, Number(modalState?.rating || 0)));
  const reasons = Array.isArray(modalState?.reasons) ? modalState.reasons.map(String) : [];
  const submitted = !!modalState?.submitted;
  const inlineError = modalState?.inlineError || "";
  const showReasons = rating > 0 && rating <= 4 && !submitted;
  const ratingLabel = getCookingFeedbackRatingLabel(rating);
  const selectedReasonLabels = reasons.map((reason) => COOKING_FEEDBACK_REASON_LABELS[reason] || reason).filter(Boolean);
  const thanksTitle = rating >= 5 ? "Gracias por tu opinion" : "Gracias por ayudarme a mejorar";
  const thanksBody = rating >= 5
    ? "Me guardo esta receta como una buena referencia para proponerte platos parecidos."
    : "Tendre en cuenta tus comentarios para afinar futuras recetas y los prompts que usamos contigo.";

  return `
    <div class="vc-modal-layer">
      <div class="vc-modal vc-cook-feedback-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Receta terminada</small>
            <h2 class="vc-modal-title">Que te ha parecido esta receta?</h2>
            <p class="vc-copy">${escapeHtml(target.meal.title)}</p>
          </div>
          <button
            class="vc-close"
            data-action="${submitted ? "finish-cook-feedback" : "skip-cook-feedback"}"
            aria-label="${submitted ? "Cerrar receta" : "Omitir valoracion"}"
          >&times;</button>
        </div>

        <div class="vc-cook-feedback-scroll">
          <article class="vc-profile-card vc-cook-feedback-head">
            <div class="vc-cook-feedback-meta">
              <span class="vc-meta-pill">${escapeHtml(target.day.label)} · ${escapeHtml(MEAL_LABELS[target.mealKey] || target.mealKey)}</span>
              <span class="vc-meta-pill">${escapeHtml(String(target.meal.prepMinutes || 0))} min</span>
              <span class="vc-meta-pill">${escapeHtml(String(target.meal.calories || 0))} kcal</span>
              <span class="vc-meta-pill">${escapeHtml(target.meal.difficulty || "Media")}</span>
            </div>

            ${submitted ? `
              <div class="vc-cook-feedback-thanks">
                <div class="vc-cook-feedback-face" aria-hidden="true">${rating >= 5 ? "&#9786;" : "&#9787;"}</div>
                <div class="vc-cook-feedback-thanks-copy">
                  <strong>${escapeHtml(thanksTitle)}</strong>
                  <p class="vc-copy">${escapeHtml(thanksBody)}</p>
                  ${selectedReasonLabels.length ? `<p class="vc-copy vc-cook-feedback-summary">Me apunto esto para ti: ${escapeHtml(selectedReasonLabels.join(", "))}.</p>` : ""}
                </div>
              </div>
            ` : `
              <div class="vc-cook-feedback-stars" role="radiogroup" aria-label="Valora esta receta de una a cinco estrellas">
                ${Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1;
                  const active = starValue <= rating;
                  return `
                    <button
                      class="vc-cook-feedback-star ${active ? "active" : ""}"
                      type="button"
                      data-action="set-cook-feedback-rating"
                      data-value="${starValue}"
                      aria-label="Valorar con ${starValue} estrellas"
                      aria-pressed="${active ? "true" : "false"}"
                    >
                      <span class="vc-cook-feedback-star-glyph" aria-hidden="true">&#9733;</span>
                      <small>${starValue}</small>
                    </button>
                  `;
                }).join("")}
              </div>
              <p class="vc-cook-feedback-rating-label">${escapeHtml(ratingLabel)}</p>
              ${rating >= 5 ? `
                <div class="vc-cook-feedback-thanks vc-cook-feedback-thanks-inline">
                  <div class="vc-cook-feedback-face" aria-hidden="true">&#9786;</div>
                  <div class="vc-cook-feedback-thanks-copy">
                    <strong>Gracias por tu opinion</strong>
                    <p class="vc-copy">Me sirve para repetirte recetas parecidas cuando encajen contigo.</p>
                  </div>
                </div>
              ` : ""}
            `}
          </article>

          ${showReasons ? `
            <article class="vc-profile-card">
              <div class="vc-cook-feedback-reason-head">
                <h3 class="vc-inline-title">Que mejorarias?</h3>
                <p class="vc-copy">Marca todo lo que te ayude a tener recetas mejores la proxima vez.</p>
              </div>
              <div class="vc-cook-feedback-reasons">
                ${COOKING_FEEDBACK_REASON_OPTIONS.map((option) => renderCookingFeedbackReasonPill(option, reasons)).join("")}
              </div>
              ${inlineError ? `<div class="vc-error">${escapeHtml(inlineError)}</div>` : ""}
            </article>
          ` : ""}
        </div>

        <div class="vc-step-foot vc-cook-feedback-foot">
          ${submitted ? `
            <button class="vc-button primary" data-action="finish-cook-feedback">Cerrar receta</button>
          ` : `
            <button class="vc-button secondary" data-action="skip-cook-feedback">Omitir</button>
            <button class="vc-button primary" data-action="submit-cook-feedback" ${rating ? "" : "disabled"}>Guardar opinion</button>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderModal() {
  if (!state.modal) return renderBusyOverlay();
  if (state.modal.type === "details") {
    const target = getMealById(state.modal.mealId);
    return `${target ? renderMealDetailModal(target) : ""}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "refine") {
    const target = getMealById(state.modal.mealId);
    return `${target ? renderRefineModal(target) : ""}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "freezer") {
    return `${renderFreezerPromptModal()}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "technique") {
    return `${renderTechniqueModal()}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "reminder-detail") {
    const reminder = getReminderById(state.modal.reminderId);
    return `${reminder ? renderReminderDetailModal(reminder) : ""}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "reminder-apply-all") {
    const reminder = getReminderById(state.modal.reminderId);
    return `${reminder ? renderReminderApplyAllModal(reminder) : ""}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "cook-reminder") {
    const reminder = getReminderById(state.modal.reminderId);
    return `${reminder ? renderCookReminderModal(reminder) : ""}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "future-no-cook") {
    const reminder = getReminderById(state.modal.reminderId);
    return `${reminder ? renderFutureNoCookModal(reminder) : ""}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "future-no-cook-result") {
    return `${renderFutureNoCookResultModal()}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "cook-recovery") {
    return `${renderCookRecoveryModal()}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "cook-close-confirm") {
    return `${renderCookCloseConfirmModal()}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "cook-feedback") {
    return `${renderCookFeedbackModal()}${renderBusyOverlay()}`;
  }
  if (state.modal.type === "priceComparison") {
    return `${renderPriceComparisonModal()}${renderBusyOverlay()}`;
  }
  return renderBusyOverlay();
}

function syncLayoutMetrics() {
  const topbar = root.querySelector(".vc-topbar");
  const rect = topbar ? topbar.getBoundingClientRect() : null;
  const topbarHeight = rect ? Math.ceil(rect.height) : 0;
  const topbarTop = rect ? Math.max(0, Math.ceil(rect.top)) : 0;
  const topbarBottom = rect ? Math.max(topbarHeight, Math.ceil(rect.bottom)) : topbarHeight;
  document.documentElement.style.setProperty("--vc-topbar-current-height", `${topbarHeight}px`);
  document.documentElement.style.setProperty("--vc-topbar-current-top", `${topbarTop}px`);
  document.documentElement.style.setProperty("--vc-topbar-current-bottom", `${topbarBottom}px`);
}

function render() {
  const immersiveCook = isImmersiveCookMode();
  const pageIdentity = getCurrentPageIdentity();
  const didPageChange = pageIdentity !== lastRenderedPageIdentity;
  lastRenderedPageIdentity = pageIdentity;
  document.documentElement.classList.toggle("vc-cook-immersive-page", immersiveCook);
  document.body.classList.toggle("vc-cook-immersive-body", immersiveCook);

  if (state.loading) {
    root.innerHTML = `${renderTopbar()}<div class="vc-page-shell ${didPageChange ? "vc-page-enter" : ""}" data-page-key="${escapeHtml(pageIdentity)}">${renderLoading()}</div>`;
    modalRoot.innerHTML = renderModal();
    repairVisibleText(root);
    repairVisibleText(modalRoot);
    syncSystemBannerTimer();
    syncScreenWakeLock();
    window.requestAnimationFrame(() => {
      syncLayoutMetrics();
      if (didPageChange) {
        scrollViewportToTop();
      }
    });
    return;
  }

  const content = !state.session
    ? renderLanding()
    : (!state.profile?.onboardingCompleted || state.currentView === "onboarding")
      ? renderOnboarding()
      : renderWorkspace();

  root.innerHTML = `${renderTopbar()}${renderNotificationBanner()}${renderToastStack()}<div class="vc-page-shell ${didPageChange ? "vc-page-enter" : ""}" data-page-key="${escapeHtml(pageIdentity)}">${content}</div>`;
  modalRoot.innerHTML = renderModal();
  repairVisibleText(root);
  repairVisibleText(modalRoot);
  syncSystemBannerTimer();
  syncScreenWakeLock();
  window.requestAnimationFrame(() => {
    syncLayoutMetrics();
    if (didPageChange) {
      scrollViewportToTop();
    }
  });
}

function toggleFromArray(list, value) {
  const set = new Set(list || []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set);
}

function validateOnboardingStep() {
  if (state.onboardingStep === 4 && !(state.profile.plannedMeals || []).length) {
    state.error = "Marca al menos una comida para poder generar el menÃº.";
    render();
    return false;
  }
  const missingTimes = state.profile.plannedMeals.filter(meal => {
    if (meal === "breakfast") return !state.profile.breakfastTime;
    if (meal === "snack") return !state.profile.snackTime;
    if (meal === "lunch") return !state.profile.lunchTime;
    if (meal === "dinner") return !state.profile.dinnerTime;
    return false;
  });
  if (state.onboardingStep === 4 && missingTimes.length > 0) {
    const mealLabels = missingTimes.map(meal => MEAL_LABELS[meal]).join(", ");
    state.error = `Necesito una hora para ${mealLabels} para ajustar bien el plan semanal.`;
    render();
    return false;
  }
  state.error = "";
  return true;
}

async function finishOnboarding() {
  if (!(state.profile.plannedMeals || []).length) {
    state.error = "Necesito al menos una comida seleccionada para preparar tu semana.";
    render();
    return;
  }

  state.profile.onboardingCompleted = true;
  state.profile.timezone = getTimezone();
  await saveProfile();
  await generateWeek(getActivePlanningStartIso());
}

async function completeShoppingList() {
  state.week.shoppingCompleted = true;
  if (state.week.freezerItems.length && !state.week.freezePromptAnswered) {
    state.modal = { type: "freezer" };
  }
  state.week.reminders = composeReminders();
  await saveWeek();
  render();
}

function translatePriceComparisonError(error) {
  const raw = String(error?.message || error || "").toLowerCase();
  if (raw.includes("high demand") || raw.includes("spikes in demand") || raw.includes("model is currently experiencing") || raw.includes("muy demandado") || raw.includes("saturado")) {
    return "El modelo está muy demandado ahora mismo. Es un pico temporal.";
  }
  if (raw.includes("timeout") || raw.includes("gateway timeout") || raw.includes("504")) {
    return "No he recibido respuesta a tiempo del servicio de precios.";
  }
  return "No he podido obtener la comparación de precios en este momento.";
}

async function comparePrices() {
  if (!state.week?.shoppingList?.length) {
    state.error = "No hay ingredientes en la lista para comparar.";
    render();
    return;
  }

  const currentListKey = JSON.stringify(state.week.shoppingList.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit })));
  if (state.week.priceComparison && state.week.priceComparison.listKey === currentListKey && state.week.priceComparison.results) {
    state.priceComparison.results = state.week.priceComparison.results;
    state.priceComparison.loading = false;
    state.priceComparison.error = null;
    state.priceComparison.retryCount = 0;
    state.modal = { type: "priceComparison" };
    render();
    return;
  }

  state.priceComparison.loading = true;
  state.priceComparison.error = null;
  state.priceComparison.results = null;
  state.priceComparison.retryCount = 0;
  state.priceComparison.subtitle = PRICE_COMPARISON_SUBTITLES[0];
  state.modal = { type: "priceComparison" };
  render();

  let subtitleIndex = 0;
  const subtitleTimer = setInterval(() => {
    subtitleIndex = (subtitleIndex + 1) % PRICE_COMPARISON_SUBTITLES.length;
    state.priceComparison.subtitle = PRICE_COMPARISON_SUBTITLES[subtitleIndex];
    render();
  }, 4000);

  try {
    const ingredients = state.week.shoppingList.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
    }));

    const data = await invokePlannerStable({
      action: "compare_prices",
      ingredients,
    });

    clearInterval(subtitleTimer);
    state.priceComparison.results = data?.data || data;
    state.priceComparison.loading = false;

    state.week.priceComparison = {
      listKey: currentListKey,
      results: state.priceComparison.results,
      timestamp: new Date().toISOString(),
    };
    await saveWeek();

    render();
  } catch (error) {
    clearInterval(subtitleTimer);
    state.priceComparison.loading = false;
    state.priceComparison.retryCount = (state.priceComparison.retryCount || 0) + 1;
    const friendly = translatePriceComparisonError(error);
    if (state.priceComparison.retryCount < 2) {
      state.priceComparison.error = `${friendly} Intenta de nuevo.`;
    } else {
      state.priceComparison.error = `No he podido completar la comparación. Intenta más tarde, por favor.`;
    }
    render();
  }
}

async function saveScheduleAndContinue() {
  state.week.scheduleStepComplete = true;
  state.week.reminders = composeReminders();
  await saveProfile();
  await saveWeek();
  state.currentView = "shopping";
  syncHistoryFromState({ mode: "push", view: "shopping" });
  render();
}

async function saveProfileSettings() {
  if (!(state.profile.plannedMeals || []).length) {
    state.error = "Marca al menos una comida para poder guardar el perfil.";
    render();
    return false;
  }
  const missingTimes = state.profile.plannedMeals.filter(meal => {
    if (meal === "breakfast") return !state.profile.breakfastTime;
    if (meal === "snack") return !state.profile.snackTime;
    if (meal === "lunch") return !state.profile.lunchTime;
    if (meal === "dinner") return !state.profile.dinnerTime;
    return false;
  });
  if (missingTimes.length > 0) {
    const mealLabels = missingTimes.map(meal => MEAL_LABELS[meal]).join(", ");
    state.error = `Necesito una hora para ${mealLabels} para guardar el perfil.`;
    render();
    return false;
  }

  state.profile.timezone = getTimezone();
  state.profile.onboardingCompleted = true;
  await saveProfile();

  if (state.week) {
    state.week.reminders = composeReminders();
    await saveWeek();
  }

  state.notice = "Guardado!";
  state.error = "";
  render();
  return true;
}

function applyRefinementPreferences(modalState, mealTarget) {
  if (!modalState.savePreference) return;

  if (modalState.selectedIngredients?.length) {
    state.profile.dislikes = uniqueValues([...(state.profile.dislikes || []), ...modalState.selectedIngredients]);
  }

  if (modalState.reasons?.includes("difficulty") && state.profile.cookingStyle === "challenging") {
    state.profile.cookingStyle = "balanced";
  }

  if (modalState.reasons?.includes("time")) {
    const note = "Prefiero platos con menos tiempo de preparaciÃ³n entre semana.";
    if (!state.profile.dietaryNotes.includes(note)) {
      state.profile.dietaryNotes = `${state.profile.dietaryNotes ? `${state.profile.dietaryNotes}\n` : ""}${note}`.trim();
    }
  }

  if (mealTarget) {
    updateMeal(mealTarget.meal.id, (meal) => ({
      ...meal,
      feedback: {
        liked: false,
        disliked: true,
        reasons: {
          reasons: modalState.reasons || [],
          ingredients: modalState.selectedIngredients || [],
        },
      },
    }));
  }
}

async function sendTestNotification() {
  const deviceState = await refreshNotificationDeviceState();
  if (!deviceState.supported || deviceState.needsInstall || deviceState.permission !== "granted") {
    state.notice = "";
    state.error = "Activa antes los avisos en este dispositivo para poder probar uno.";
    render();
    return;
  }

  await showBrowserNotification({
    id: `test-${Date.now()}`,
    title: "VelociChef está listo",
    body: "Este es un aviso de prueba para confirmar que las notificaciones funcionan.",
    url: `${APP_BASE_URL}?view=profile`,
  });
  pushActivityNotification({
    id: createId(),
    sourceKey: `test:${Date.now()}`,
    kind: "info",
    title: "Aviso de prueba enviado",
    body: "Este es un aviso de prueba para confirmar que las notificaciones funcionan.",
    createdAt: new Date().toISOString(),
    readAt: null,
    actionLabel: "Notificaciones",
    actionType: "view",
  }, { persist: false, showBanner: true });
  state.notice = "";
  state.error = "";
  render();
}

async function handleAction(action, trigger) {
  if (action !== "toggle-menu") {
    state.activeMenu = null;
  }

  switch (action) {
    case "toggle-menu":
      if (state.cooking) {
        state.cooking.timerMenuOpen = false;
      }
      state.activeMenu = state.activeMenu === trigger.dataset.menu ? null : trigger.dataset.menu;
      render();
      break;

    case "login-google": {
      state.error = "";
      try {
        await state.client.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: APP_BASE_URL,
            scopes: "email profile https://www.googleapis.com/auth/userinfo.email",
          },
        });
      } catch (error) {
        state.error = error instanceof Error ? error.message : "No pude iniciar sesiÃ³n con Google.";
        render();
      }
      break;
    }

    case "onboarding-next":
      if (!validateOnboardingStep()) return;
      state.onboardingStep += 1;
      render();
      break;

    case "onboarding-back":
      state.onboardingStep = Math.max(0, state.onboardingStep - 1);
      render();
      break;

    case "finish-onboarding":
      await finishOnboarding();
      break;

    case "generate-first-week":
      await generateWeek(getActivePlanningStartIso());
      break;

    case "plan-new-week":
      clearCookingMicHintTimer();
      stopHandsFreeMode();
      if (!state.profile?.onboardingCompleted) {
        state.currentView = "onboarding";
        syncHistoryFromState({ mode: "push", view: "onboarding" });
        render();
        break;
      }
      await generateWeek(getActivePlanningStartIso());
      break;

    case "open-view": {
      const nextView = normalizeView(trigger.dataset.view || "week");
      if (nextView !== "cook") {
        clearCookingMicHintTimer();
        stopHandsFreeMode();
      }
      state.currentView = nextView;
      if (nextView === "notifications") {
        state.notificationTab = "pending";
        clearNotificationBannerTimer();
        state.activeNotificationBannerId = null;
        if (markAllActivityNotificationsRead()) {
          await saveWeek();
        }
      }
      syncHistoryFromState({ mode: "push", view: nextView, tab: state.notificationTab });
      render();
      if (nextView === "profile" || nextView === "notifications") {
        refreshNotificationDeviceState().then(() => {
          render();
        }).catch(() => {});
      }
      break;
    }

    case "open-cook": {
      const suggested = getSuggestedCookingTarget();
      clearCookingMicHintTimer();
      stopHandsFreeMode();
      stopCookingTimer();
      state.cooking = createCookingState(suggested ? "suggest" : "picker", suggested?.meal.id || null);
      state.currentView = "cook";
      syncHistoryFromState({ mode: "push", view: "cook", mealId: "", stepId: "" });
      render();
      break;
    }

    case "cook-suggest-yes":
      ensureCookingState();
      await startCookingFlow(state.cooking.mealId, "active");
      break;

    case "cook-suggest-no":
      ensureCookingState();
      state.cooking.mode = "picker";
      syncHistoryFromState({ mode: "replace", view: "cook", mealId: "", stepId: "" });
      render();
      break;

    case "cook-back-to-picker":
      clearCookingMicHintTimer();
      stopHandsFreeMode();
      stopCookingTimer();
      ensureCookingState();
      state.cooking.mode = "picker";
      state.cooking.stepIndex = 0;
      syncHistoryFromState({ mode: "replace", view: "cook", mealId: "", stepId: "" });
      render();
      break;

    case "cook-meal":
      await startCookingFlow(trigger.dataset.mealId, "active");
      break;

    case "cook-stage-prev":
      await moveCookingStep(-1);
      break;

    case "cook-stage-next":
      await moveCookingStep(1);
      break;

    case "request-close-cooking-session":
      state.modal = { type: "cook-close-confirm" };
      render();
      break;

    case "confirm-close-cooking-session":
      await completeCookingSession({
        notice: "He cerrado el modo cocina. Puedes volver cuando quieras con otra receta.",
      });
      break;

    case "finish-cooking-session":
      state.modal = {
        type: "cook-feedback",
        mealId: getCookingTarget()?.meal?.id || "",
        rating: Number(getCookingTarget()?.meal?.feedback?.recipeRating || 0),
        reasons: [...(getCookingTarget()?.meal?.feedback?.recipeReasons || [])],
        submitted: false,
        inlineError: "",
      };
      render();
      break;

    case "set-cook-feedback-rating":
      if (state.modal?.type !== "cook-feedback") return;
      state.modal = {
        ...state.modal,
        rating: Math.max(1, Math.min(5, Number(trigger.dataset.value || 0))),
        inlineError: "",
      };
      render();
      break;

    case "toggle-cook-feedback-reason":
      if (state.modal?.type !== "cook-feedback") return;
      state.modal = {
        ...state.modal,
        reasons: toggleFromArray(state.modal.reasons || [], trigger.dataset.value),
        inlineError: "",
      };
      render();
      break;

    case "submit-cook-feedback":
      if (state.modal?.type !== "cook-feedback") return;
      if (!Number(state.modal.rating || 0)) {
        state.modal.inlineError = "Marca una puntuacion antes de guardar tu opinion.";
        render();
        break;
      }
      await submitCookingFeedbackAndFinish();
      break;

    case "skip-cook-feedback": {
      const target = getCookingFeedbackTarget();
      if (target) {
        markCookingMealCompleted(target.meal.id);
        await saveWeek();
      }
      await completeCookingSession({
        notice: "Receta terminada. Ya puedes servir el plato.",
      });
      break;
    }

    case "finish-cook-feedback":
      await completeCookingSession({
        notice: "Gracias por tu opinion. Ya puedes servir el plato.",
      });
      break;

    case "toggle-hands-free":
      if (state.cooking?.handsFree) {
        stopHandsFreeMode();
        render();
      } else {
        startHandsFreeMode();
      }
      break;

    case "retry-price-comparison":
      await comparePrices();
      break;

    case "open-technique":
      state.modal = { type: "technique", techniqueKey: trigger.dataset.technique };
      render();
      break;

    case "start-step-timer": {
      const target = getCookingTarget();
      const current = target ? getCookingStage(target).current : null;
      if (!current?.timerMinutes) return;
      startCookingTimer(current.timerLabel || current.title, current.timerMinutes, {
        stepId: current.id,
        mealId: target?.meal?.id || "",
      });
      break;
    }

    case "toggle-cooking-timer-menu":
      if (!getPrimaryCookingTimer()) return;
      state.cooking.timerMenuOpen = !state.cooking.timerMenuOpen;
      render();
      break;

    case "toggle-cooking-timer-pause":
      if (!getPrimaryCookingTimer()) return;
      toggleCookingTimerPause(trigger.dataset.timerId || "");
      state.cooking.timerMenuOpen = false;
      render();
      break;

    case "stop-cooking-timer":
      stopCookingTimer(trigger.dataset.timerId || "");
      render();
      break;

    case "open-details":
      state.modal = { type: "details", mealId: trigger.dataset.mealId };
      render();
      break;

    case "set-notification-tab":
      state.notificationTab = trigger.dataset.tab === "pending" ? "pending" : "future";
      syncHistoryFromState({ mode: "replace", view: "notifications", tab: state.notificationTab });
      render();
      break;

    case "open-reminder": {
      const reminder = getReminderById(trigger.dataset.reminderId);
      if (!reminder) return;
      openReminderModal(reminder);
      render();
      break;
    }

    case "open-activity-notification": {
      const notification = getActivityNotificationById(trigger.dataset.notificationId);
      if (!notification) return;
      clearNotificationBannerTimer();
      state.activeNotificationBannerId = null;
      const changed = markActivityNotificationRead(notification.id);

      if (notification.actionType === "reminder" && notification.reminderId) {
        const reminder = getReminderById(notification.reminderId);
        if (reminder) {
          state.currentView = "notifications";
          state.notificationTab = "pending";
          openReminderModal(reminder, { forceCookPrompt: reminder.kind === "meal" });
        }
      } else if (notification.actionType === "cook") {
        if (notification.mealId) {
          const preservedTimers = getActiveCookingTimers();
          await openCookingSession(notification.mealId, {
            mode: "active",
            stepId: notification.stepId || "",
            preserveTimers: preservedTimers.length > 0,
            activeTimers: preservedTimers,
          });
        } else {
          state.currentView = "cook";
        }
      } else {
        state.currentView = "notifications";
      }

      if (changed) {
        await saveWeek();
      }
      if (state.currentView === "notifications") {
        syncHistoryFromState({ mode: "push", view: "notifications", tab: state.notificationTab });
      } else if (state.currentView === "cook" && !notification.mealId) {
        syncHistoryFromState({ mode: "push", view: "cook", mealId: "", stepId: "" });
      }
      render();
      break;
    }

    case "delete-activity-notification":
      if (!state.week) return;
      state.week.activityNotifications = getActivityNotifications().filter((item) => item.id !== trigger.dataset.notificationId);
      if (state.activeNotificationBannerId === trigger.dataset.notificationId) {
        clearNotificationBannerTimer();
        state.activeNotificationBannerId = null;
      }
      await saveWeek();
      void syncAppBadgeCount();
      render();
      break;

    case "delete-reminder":
      state.week.reminders = (state.week.reminders || []).filter((reminder) => reminder.id !== trigger.dataset.reminderId);
      await saveWeek();
      scheduleReminders();
      render();
      break;

    case "save-reminder-time": {
      const reminder = getReminderById(trigger.dataset.reminderId || state.modal?.reminderId);
      const editedTime = state.modal?.editedTime || "";
      if (!reminder || !editedTime) return;
      state.modal = {
        type: "reminder-apply-all",
        reminderId: reminder.id,
        editedTime,
      };
      render();
      break;
    }

    case "open-future-no-cook":
      state.modal = {
        type: "future-no-cook",
        reminderId: trigger.dataset.reminderId || state.modal?.reminderId,
        futureNoCookChoice: "",
        replacementMealId: "",
        inlineError: "",
      };
      render();
      break;

    case "set-future-no-cook-choice":
      state.modal = {
        ...(state.modal || {}),
        futureNoCookChoice: trigger.dataset.value || "",
        replacementMealId: trigger.dataset.value === "replace" ? (state.modal?.replacementMealId || "") : "",
        inlineError: "",
      };
      render();
      break;

    case "confirm-future-no-cook": {
      const reminder = getReminderById(trigger.dataset.reminderId || state.modal?.reminderId);
      const sourceEntry = reminder?.mealId ? getMealById(reminder.mealId) : null;
      const choice = state.modal?.futureNoCookChoice || "";
      if (!reminder || !sourceEntry || !choice) {
        state.modal = {
          ...(state.modal || {}),
          inlineError: "Elige como quieres gestionar esta comida.",
        };
        render();
        break;
      }

      let carryoverIngredients = [];
      let resultTitle = "He actualizado esta comida";
      let resultBody = "";

      if (choice === "carryover") {
        carryoverIngredients = buildCarryoverIngredientsFromMeal(sourceEntry, "skip_future_meal");
        replaceMealEntry(sourceEntry.meal.id, (_meal, day, mealKey) => buildSkippedMealPlaceholder(mealKey, day.date, "outside"));
        state.week.carryoverIngredients = mergeCarryoverIngredients(state.week.carryoverIngredients || [], carryoverIngredients);
        resultTitle = "He dejado este hueco como comida libre";
        resultBody = "Guardare estos ingredientes como disponibles para la siguiente planificacion semanal.";
      } else if (choice === "replace") {
        const replacementMealId = state.modal?.replacementMealId || "";
        const targetEntry = replacementMealId ? getMealById(replacementMealId) : null;
        if (!targetEntry) {
          state.modal = {
            ...(state.modal || {}),
            inlineError: "Elige la comida futura que quieres reemplazar.",
          };
          render();
          break;
        }

        carryoverIngredients = buildCarryoverIngredientsFromMeal(targetEntry, "replaced_future_meal");
        const movedMeal = normalizeMeal(targetEntry.mealKey, {
          ...sourceEntry.meal,
          id: sourceEntry.meal.id,
          mealKey: targetEntry.mealKey,
          date: targetEntry.day.date,
          skipCooking: false,
        }, targetEntry.day.date);

        replaceMealEntry(sourceEntry.meal.id, (_meal, day, mealKey) => buildSkippedMealPlaceholder(mealKey, day.date, "moved"));
        replaceMealEntry(targetEntry.meal.id, () => movedMeal);
        state.week.carryoverIngredients = mergeCarryoverIngredients(state.week.carryoverIngredients || [], carryoverIngredients);
        resultTitle = "He movido el plato a otra comida";
        resultBody = `La comida reemplazada era "${targetEntry.meal.title}". Sus ingredientes quedaran guardados para el siguiente plan semanal.`;
      }

      finalizeWeekMealsMutation();
      await saveWeek();
      scheduleReminders();
      state.notificationTab = "future";
      state.modal = {
        type: "future-no-cook-result",
        title: resultTitle,
        body: resultBody,
        carryoverIngredients,
      };
      state.notice = "";
      state.error = "";
      render();
      break;
    }

    case "apply-reminder-time": {
      const reminder = getReminderById(trigger.dataset.reminderId || state.modal?.reminderId);
      const editedTime = state.modal?.editedTime || "";
      const scope = trigger.dataset.scope || "single";
      if (!reminder || !editedTime) return;

      state.week.reminders = (state.week.reminders || []).map((item) => {
        const sameTarget = item.id === reminder.id;
        const sameGroup = scope === "group" && item.groupKey === reminder.groupKey && getReminderBucket(item) === "future";
        if (!sameTarget && !sameGroup) return item;
        const triggerDate = toIsoDate(new Date(item.triggerAt));
        const nextTrigger = combineDateAndTime(triggerDate, editedTime).toISOString();
        return normalizeReminder({
          ...item,
          triggerAt: nextTrigger,
          customTriggerAt: nextTrigger,
        });
      });
      await saveWeek();
      scheduleReminders();
      state.modal = null;
      state.notice = scope === "group"
        ? "He actualizado todos los avisos de este tipo a esa hora."
        : "He guardado la nueva hora del aviso.";
      state.error = "";
      render();
      break;
    }

    case "open-cook-postpone":
      state.modal = {
        ...(state.modal || {}),
        type: "cook-reminder",
        reminderId: trigger.dataset.reminderId || state.modal?.reminderId,
        postponeExpanded: true,
        inlineError: "",
      };
      render();
      break;

    case "set-cook-postpone-choice":
      state.modal = {
        ...(state.modal || {}),
        postponeChoice: trigger.dataset.value || "",
        inlineError: "",
      };
      render();
      break;

    case "save-cook-postpone": {
      const reminder = getReminderById(trigger.dataset.reminderId || state.modal?.reminderId);
      const choice = state.modal?.postponeChoice || "";
      if (!reminder || !choice) {
        state.modal = {
          ...(state.modal || {}),
          inlineError: "Elige una opcion antes de guardar.",
        };
        render();
        break;
      }

      if (choice === "skip") {
        const nowIso = new Date().toISOString();
        state.week.reminders = (state.week.reminders || []).map((item) =>
          item.id === reminder.id
            ? normalizeReminder({
                ...item,
                deliveredAt: item.deliveredAt || nowIso,
                skippedAt: nowIso,
              })
            : item);
        await saveWeek();
        scheduleReminders();
        state.modal = null;
        state.notice = "Vale, hoy no te volvere a avisar de esa comida.";
        state.error = "";
        render();
        break;
      }

      const editedTime = state.modal?.editedTime || "";
      const nextTrigger = combineDateAndTime(toIsoDate(new Date()), editedTime);
      if (!editedTime || nextTrigger.getTime() <= Date.now()) {
        state.modal = {
          ...(state.modal || {}),
          inlineError: "Necesito una hora futura para poder avisarte mas tarde hoy.",
        };
        render();
        break;
      }

      const nextIso = nextTrigger.toISOString();
      state.week.reminders = (state.week.reminders || []).map((item) =>
        item.id === reminder.id
          ? normalizeReminder({
              ...item,
              triggerAt: nextIso,
              customTriggerAt: nextIso,
              deliveredAt: null,
              skippedAt: null,
            })
          : item);
      await saveWeek();
      scheduleReminders();
      state.modal = null;
      state.notificationTab = "future";
      state.notice = "Perfecto, te lo recordare mas tarde hoy.";
      state.error = "";
      render();
      break;
    }

    case "start-cook-from-reminder": {
      const reminder = getReminderById(trigger.dataset.reminderId || state.modal?.reminderId);
      if (!reminder?.mealId) return;
      state.pendingCookingRecovery = null;
      state.modal = null;
      await openCookingSession(reminder.mealId, { mode: "active" });
      break;
    }

    case "resume-cooking-recovery":
      await resumePersistedCooking();
      break;

    case "dismiss-cooking-recovery":
      dismissPersistedCookingRecovery();
      render();
      break;

    case "close-modal":
      if (state.modal?.type === "cook-recovery") {
        dismissPersistedCookingRecovery();
      } else {
        state.modal = null;
      }
      render();
      break;

    case "toggle-like": {
      const target = getMealById(trigger.dataset.mealId);
      if (!target) return;
      updateMeal(target.meal.id, (meal) => ({
        ...meal,
        feedback: {
          ...(meal.feedback || {}),
          liked: !(meal.feedback?.liked),
          disliked: false,
        },
      }));
      await saveWeek();
      await saveFeedback({
        id: createId(),
        weekId: state.week?.id,
        mealId: target.meal.id,
        type: "like",
        payload: { liked: target.meal.feedback?.liked !== true },
        createdAt: new Date().toISOString(),
      });
      render();
      break;
    }

    case "open-refine":
      state.modal = {
        type: "refine",
        mealId: trigger.dataset.mealId,
        reasons: [],
        selectedIngredients: [],
        savePreference: true,
      };
      render();
      break;

    case "toggle-refine-reason":
      state.modal.reasons = toggleFromArray(state.modal.reasons, trigger.dataset.value);
      render();
      break;

    case "toggle-refine-ingredient":
      state.modal.selectedIngredients = toggleFromArray(state.modal.selectedIngredients, trigger.dataset.value);
      render();
      break;

    case "toggle-refine-save":
      state.modal.savePreference = !state.modal.savePreference;
      render();
      break;

    case "submit-refinement": {
      const target = getMealById(state.modal.mealId);
      if (!target) return;

      applyRefinementPreferences(state.modal, target);
      await saveProfile();
      await saveWeek();
      await saveFeedback({
        id: createId(),
        weekId: state.week?.id,
        mealId: target.meal.id,
        type: "dislike",
        payload: {
          reasons: state.modal.reasons,
          ingredients: state.modal.selectedIngredients,
          savePreference: state.modal.savePreference,
        },
        createdAt: new Date().toISOString(),
      });
      await swapMeal(target, {
        reasons: state.modal.reasons,
        ingredients: state.modal.selectedIngredients,
        dietaryNotes: state.profile.dietaryNotes,
      });
      break;
    }

    case "swap-meal": {
      const target = getMealById(trigger.dataset.mealId);
      if (!target) return;
      await swapMeal(target, { reasons: ["swap_direct"], ingredients: [] });
      break;
    }

    case "save-schedule":
      await saveScheduleAndContinue();
      break;

    case "set-shopping-state": {
      const itemId = trigger.dataset.itemId;
      const status = normalizeShoppingStatus(trigger.dataset.status || "pending");
      state.week.shoppingList = state.week.shoppingList.map((item) => item.id === itemId ? { ...item, pantryStatus: status } : item);
      await saveWeek();
      render();
      break;
    }

    case "complete-shopping":
      await completeShoppingList();
      break;

    case "compare-prices":
      await comparePrices();
      break;

    case "accept-freezer":
      state.week.freezePromptAnswered = true;
      state.week.freezerOptIn = true;
      state.profile.freezeNotificationsEnabled = true;
      state.week.reminders = composeReminders();
      await saveProfile();
      await saveWeek();
      await requestNotifications();
      state.modal = null;
      render();
      break;

    case "decline-freezer":
      state.week.freezePromptAnswered = true;
      state.week.freezerOptIn = false;
      state.week.reminders = composeReminders();
      await saveWeek();
      state.modal = null;
      render();
      break;

    case "request-notifications":
      await requestNotifications();
      render();
      break;

    case "toggle-profile-section":
      ensureProfileSectionState();
      state.profileSections[trigger.dataset.section] = !state.profileSections[trigger.dataset.section];
      render();
      break;

    case "save-profile-settings":
      await saveProfileSettings();
      break;

    case "test-notification":
      await sendTestNotification();
      break;

    case "restart-onboarding":
      state.currentView = "onboarding";
      state.profile.onboardingCompleted = false;
      state.onboardingStep = 0;
      syncHistoryFromState({ mode: "push", view: "onboarding" });
      render();
      break;

    case "replan-next-week":
      await generateWeek(getActivePlanningStartIso());
      break;

    case "redo-current-week":
      if (!state.week?.startDate) return;
      await generateWeek(state.week.startDate);
      state.currentView = "recipes";
      syncHistoryFromState({ mode: "push", view: "recipes" });
      render();
      break;

    case "logout":
      if (!state.client) return;
      clearNotificationBannerTimer();
      state.activeNotificationBannerId = null;
      clearCookingMicHintTimer();
      stopHandsFreeMode();
      stopCookingTimer();
      state.notice = "";
      state.error = "";
      await state.client.auth.signOut();
      window.history.replaceState({}, "", APP_BASE_URL);
      historyInitialized = true;
      lastHistoryUrl = APP_BASE_URL;
      break;

    case "toggle-pill": {
      const group = trigger.dataset.group;
      const value = trigger.dataset.value;
      state.profile[group] = toggleFromArray(state.profile[group], value);
      render();
      break;
    }

    case "set-cooking-style":
      state.profile.cookingStyle = trigger.dataset.value;
      render();
      break;

    default:
      break;
  }
}

document.addEventListener("click", async (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;

  if (trigger.classList.contains("vc-modal-layer") && trigger.dataset.action === "close-modal") {
    if (event.target !== trigger) return;
    event.preventDefault();
    state.modal = null;
    render();
    return;
  }

  event.preventDefault();
  await handleAction(trigger.dataset.action, trigger);
});

document.addEventListener("click", (event) => {
  let shouldRender = false;

  if (state.activeMenu && !event.target.closest(".vc-menu-wrap")) {
    state.activeMenu = null;
    shouldRender = true;
  }

  if (state.cooking?.timerMenuOpen && !event.target.closest(".vc-cook-timer-wrap")) {
    state.cooking.timerMenuOpen = false;
    shouldRender = true;
  }

  if (shouldRender) {
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (state.currentView === "cook" && !state.modal) {
    if (event.key === "ArrowRight") {
      moveCookingStep(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      moveCookingStep(-1);
      return;
    }
  }

  if (event.key === "Escape") {
    if (!state.activeMenu && !state.modal && !state.cooking?.timerMenuOpen) return;
    state.activeMenu = null;
    if (state.cooking?.timerMenuOpen) {
      state.cooking.timerMenuOpen = false;
    }
    if (state.modal) {
      state.modal = null;
    }
    render();
  }
});

document.addEventListener("input", (event) => {
  const modalField = event.target.dataset.modalField;
  if (modalField && state.modal) {
    state.modal[modalField] = event.target.value;
    if (modalField === "editedTime" || modalField === "postponeChoice") {
      state.modal.inlineError = "";
    }
    return;
  }

  const field = event.target.dataset.field;
  if (field && state.profile) {
    if (field === "householdCount") {
      state.profile.householdCount = Math.max(1, Math.min(8, Number(event.target.value || 1)));
      syncHouseholdMembers(state.profile);
      render();
      return;
    }
    state.profile[field] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  }

  const memberField = event.target.dataset.memberField;
  const memberId = event.target.dataset.memberId;
  if (memberField && memberId) {
    const member = state.profile.householdMembers.find((item) => item.id === memberId);
    if (!member) return;
    member[memberField] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    if (memberField === "sameAsMe") render();
  }
});

document.addEventListener("change", (event) => {
  const modalField = event.target.dataset.modalField;
  if (modalField && state.modal) {
    state.modal[modalField] = event.target.value;
    if (modalField === "editedTime" || modalField === "postponeChoice" || modalField === "replacementMealId") {
      state.modal.inlineError = "";
    }
    return;
  }

  const field = event.target.dataset.field;
  if (field && state.profile) {
    state.profile[field] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    if (field === "lunchPrepNightBefore") render();
  }

  const memberField = event.target.dataset.memberField;
  const memberId = event.target.dataset.memberId;
  if (memberField && memberId) {
    const member = state.profile.householdMembers.find((item) => item.id === memberId);
    if (!member) return;
    member[memberField] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    render();
  }
});

window.addEventListener("focus", () => {
  syncScreenWakeLock();
  flushDueReminders();
  void refreshRemoteReminderActivity({ showBanner: true });
  if (state.profile?.notificationEnabled || ("Notification" in window && Notification.permission === "granted")) {
    void autoRepairPushSubscription();
  }
  if (state.week) {
    const changed = refreshPendingCookingRecovery();
    if (changed) render();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && state.currentView === "cook" && state.cooking?.mealId) {
    persistCookingState();
  }
  if (document.visibilityState === "visible") {
    syncScreenWakeLock();
    flushDueReminders();
    void refreshRemoteReminderActivity({ showBanner: true });
    if (state.profile?.notificationEnabled || ("Notification" in window && Notification.permission === "granted")) {
      void autoRepairPushSubscription();
    }
    if (state.week) {
      const changed = refreshPendingCookingRecovery();
      if (changed) render();
    }
  } else {
    void releaseScreenWakeLock();
  }
});

window.addEventListener("pagehide", () => {
  if (state.currentView === "cook" && state.cooking?.mealId) {
    persistCookingState();
  }
  void releaseScreenWakeLock();
});

async function hydrateSession(session, options = {}) {
  const preserveState = !!options.preserveState;
  const sameUser = !!(session?.user?.id && state.session?.user?.id && session.user.id === state.session.user.id);
  const hasLoadedUserState = !!(state.profile || state.week || state.feedback?.length);

  if (preserveState && session?.user && sameUser && hasLoadedUserState) {
    state.session = session;
    if (state.profile?.notificationEnabled) {
      try {
        await autoRepairPushSubscription({ force: true });
      } catch (_error) {
        // Si falla el push real, mantenemos el estado visible actual.
      }
    }
    await refreshNotificationDeviceState();
    void syncAppBadgeCount();
    syncScreenWakeLock();
    return;
  }

  clearReminderTimers();
  clearNotificationBannerTimer();
  if (cookingSnapshotSyncTimer) {
    window.clearTimeout(cookingSnapshotSyncTimer);
    cookingSnapshotSyncTimer = null;
  }
  stopHandsFreeMode();
  stopCookingTimer();
  void releaseScreenWakeLock();
  state.session = session;
  state.activeMenu = null;
  state.cooking = null;
  state.pendingCookingRecovery = null;
  state.activeNotificationBannerId = null;

  if (!session?.user) {
    state.profile = null;
    state.week = null;
    state.feedback = [];
    state.currentView = "home";
    clearPersistedCookingState();
    state.loading = false;
    void syncAppBadgeCount();
    syncHistoryFromState({ mode: "replace", view: "home", force: true });
    render();
    return;
  }

  state.loading = true;
  render();

  const [profile, week, feedback] = await Promise.all([
    loadProfile(session.user),
    loadWeek(),
    loadFeedback(),
  ]);

  state.profile = profile || buildDefaultProfile(session.user);
  state.week = week ? normalizeWeek(week) : null;
  state.feedback = feedback || [];
  state.onboardingStep = 0;

  if (state.profile.onboardingCompleted && !state.week) {
    await generateWeek(getActivePlanningStartIso());
    state.week = state.week ? normalizeWeek(state.week) : null;
  }

  if (!state.profile.onboardingCompleted) {
    state.currentView = "onboarding";
  } else if (!state.week) {
    state.currentView = "week";
  }

  if (state.week) {
    const persistedCooking = readPersistedCookingState();
    const needsReminderBootstrap = !(state.week.reminders?.length);
    state.week.reminders = needsReminderBootstrap ? composeReminders() : state.week.reminders;
    if (needsReminderBootstrap) {
      await saveWeek();
    }
    await refreshRemoteReminderActivity({ force: true, showBanner: false });
    await flushDueReminders();
    scheduleReminders();
    const hasExplicitReminderIntent = !!(state.pendingReminderLink?.reminderId || state.pendingReminderLink?.intent);
    if (state.pendingReminderLink && !hasExplicitReminderIntent) {
      const recoverySnapshot = (persistedCooking?.mealId && state.pendingReminderLink.mealId === persistedCooking.mealId)
        ? persistedCooking
        : buildCookingRecoverySnapshotFromLink(state.pendingReminderLink);
      if (recoverySnapshot?.mealId) {
        state.pendingReminderLink = null;
        state.pendingCookingRecovery = recoverySnapshot;
        if (!state.modal) {
          openCookingRecoveryPrompt(recoverySnapshot);
        }
      } else {
        await resolvePendingReminderLink({
          preserveTimers: !!(persistedCooking?.activeTimers || []).length,
          activeTimers: persistedCooking?.activeTimers || [],
        });
      }
    } else if (state.pendingReminderLink) {
      await resolvePendingReminderLink({
        preserveTimers: !!(persistedCooking?.activeTimers || []).length,
        activeTimers: persistedCooking?.activeTimers || [],
      });
    } else if (persistedCooking?.mealId) {
      refreshPendingCookingRecovery();
    }
  }

  if (state.profile.notificationEnabled) {
    try {
      await autoRepairPushSubscription({ force: true });
    } catch (_error) {
      // Si falla el push real, mantenemos al menos el fallback local.
    }
  }

  await refreshNotificationDeviceState();

  state.loading = false;
  void syncAppBadgeCount();
  syncHistoryFromState({ mode: "replace", force: true });
  render();
}

async function init() {
  applyIncomingUrl(window.location.href);
  state.client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }) || null;

  await registerServiceWorker();
  await refreshNotificationDeviceState();

  if (!state.client) {
    state.loading = false;
    state.error = "No pude abrir tu cocina ahora mismo.";
    render();
    return;
  }

  const { data } = await state.client.auth.getSession();
  await hydrateSession(data.session);

  state.client.auth.onAuthStateChange((event, session) => {
    const preserveState = event === "TOKEN_REFRESHED"
      || event === "USER_UPDATED"
      || (event === "SIGNED_IN" && session?.user?.id && session.user.id === state.session?.user?.id);
    hydrateSession(session, { preserveState });
  });
}

window.addEventListener("resize", syncLayoutMetrics);
window.addEventListener("orientationchange", syncLayoutMetrics);
window.addEventListener("popstate", () => {
  void restoreNavigationFromUrl(window.location.href);
});

init();
