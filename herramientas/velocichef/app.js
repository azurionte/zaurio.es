const SUPABASE_URL = "https://adpjitccwwvlydrtvvqk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D8CL0HI8vLfD5L3g5ZgUGg_HOM6Ixdk";
const APP_PATH = "/velocichef";
const APP_BASE_URL = `${window.location.origin}${APP_PATH}/`;
const APP_ASSET_PATH = `${APP_PATH}/assets`;
const APP_LOGO_PATH = `${APP_ASSET_PATH}/logo.png`;
const APP_STORE_ICON_PATH = `${APP_ASSET_PATH}/store_icon.png`;
const ZAURIO_MENU_LOGO_PATH = "/shared/assets/brand/favicon-32x32.png";
const PUSH_PUBLIC_KEY_ENDPOINT = "/api/velocichef/push-public-key";
const STEP_IMAGE_ENDPOINT = "/api/velocichef/step-image";
const DEFAULT_REMINDER_LEAD_MINUTES = 75;
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
  { key: "breakfast", label: "Desayuno", icon: "☀️", hint: "Algo práctico para empezar con buen pie." },
  { key: "lunch", label: "Almuerzo", icon: "🍲", hint: "El plato fuerte del mediodía." },
  { key: "snack", label: "Merienda", icon: "🍎", hint: "Un apoyo entre horas." },
  { key: "dinner", label: "Cena", icon: "🌙", hint: "Algo rico y asumible al final del día." },
  { key: "bites", label: "Colaciones", icon: "🥜", hint: "Pequeñas opciones para picar entre comidas." },
];

const MEAL_LABELS = Object.fromEntries(MEAL_OPTIONS.map((item) => [item.key, item.label]));

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
    body: "Significa hacer tiras finas y alargadas. Piensa en bastoncitos delgados para que el ingrediente se cocine rÃ¡pido y quede uniforme.",
  },
  {
    key: "picar-fino",
    phrase: "pica fino",
    title: "Picar fino",
    body: "Es cortar en trozos pequeÃ±os y regulares. Va bien cuando quieres que el ingrediente se reparta por todo el plato sin dominar cada bocado.",
  },
  {
    key: "sofreir",
    phrase: "sofrÃ­e",
    title: "SofreÃ­r",
    body: "Es cocinar a fuego medio con un poco de grasa hasta que el ingrediente se ablande y gane sabor sin llegar a quemarse.",
  },
  {
    key: "fuego-lento",
    phrase: "a fuego lento",
    title: "Cocinar a fuego lento",
    body: "Es mantener una cocciÃ³n suave, con burbujas pequeÃ±as. Sirve para que el sabor se concentre sin que el fondo se agarre.",
  },
  {
    key: "dorar",
    phrase: "dora",
    title: "Dorar",
    body: "Es cocinar lo justo para que la superficie tome color tostado. Ese color aporta aroma y un sabor mÃ¡s profundo.",
  },
  {
    key: "reservar",
    phrase: "reserva",
    title: "Reservar",
    body: "Solo significa apartar ese ingrediente por un momento para usarlo despuÃ©s, sin seguir cocinÃ¡ndolo.",
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
  currentView: normalizeView(urlParams.get("view") || "week"),
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
};

function normalizeView(view) {
  const valid = new Set(["week", "schedule", "shopping", "recipes", "profile", "onboarding", "cook"]);
  return valid.has(view) ? view : "week";
}

function createId() {
  return crypto.randomUUID();
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
    .replace(/ÃƒÂ¡|Ã¡/g, "a")
    .replace(/ÃƒÂ©|Ã©/g, "e")
    .replace(/ÃƒÂ­|Ã­/g, "i")
    .replace(/ÃƒÂ³|Ã³/g, "o")
    .replace(/ÃƒÂº|Ãº/g, "u")
    .replace(/ÃƒÂ±|Ã±/g, "n")
    .replace(/ÃƒÂ|Ã/g, "A")
    .replace(/ÃƒÂ‰|Ã‰/g, "E")
    .replace(/ÃƒÂ|Ã/g, "I")
    .replace(/ÃƒÂ“|Ã“/g, "O")
    .replace(/ÃƒÂš|Ãš/g, "U")
    .replace(/ÃƒÂ‘|Ã‘/g, "N")
    .replace(/Â¿/g, "¿")
    .replace(/Â¡/g, "¡")
    .replace(/Â/g, "")
    .replace(/Ã‚/g, "")
    .replace(/â˜€ï¸/g, "D")
    .replace(/ðŸ²/g, "A")
    .replace(/ðŸŽ/g, "M")
    .replace(/ðŸŒ™/g, "C")
    .replace(/ðŸ¥œ/g, "+")
    .replace(/Ã‚Â·|Â·/g, " · ")
    .replace(/â€œ|â€/g, "\"")
    .replace(/â€™/g, "'")
    .replace(/âœ•/g, "✕")
    .replace(/Google login/gi, "Acceso seguro")
    .replace(/Gemini/gi, "VelociChef")
    .replace(/Supabase/gi, "tu cocina")
    .replace(/Push API/gi, "avisos del dispositivo")
    .replace(/Detalle tecnico:\s*/gi, "")
    .replace(/Push activo/gi, "Avisos activos")
    .replace(/push real/gi, "avisos del dispositivo")
    .replace(/opción local/gi, "opción de apoyo")
    .replace(/sistema local/gi, "sistema de apoyo")
    .replace(/recordatorio local/gi, "recordatorio de apoyo");
}

function uniqueValues(values) {
  return Array.from(new Set((values || []).filter(Boolean).map((item) => String(item).trim()).filter(Boolean)));
}

function decodeMojibakeText(value) {
  const source = String(value || "");
  if (!/[ÃÂâ]/.test(source)) return source;
  try {
    const bytes = Uint8Array.from(Array.from(source, (character) => character.charCodeAt(0) & 255));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded && !/\uFFFD/.test(decoded) ? decoded : source.replace(/Â/g, "");
  } catch (_error) {
    return source.replace(/Â/g, "");
  }
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

function bytesToBase64Url(bytes) {
  const value = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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
    throw new Error("No pude obtener la clave pública de notificaciones.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!payload?.publicKey) {
    throw new Error("El backend no ha publicado una clave VAPID todavía.");
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
    throw new Error(body?.error || "No pude preparar la ilustracion del paso.");
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
      .limit(12);

    if (error) throw error;
    if (Array.isArray(data) && data.length) {
      const normalizedWeeks = data
        .map((row) => normalizeWeek(row.week_payload))
        .filter(Boolean);
      const activeWeek = normalizedWeeks.find((week) => isCurrentPlanningWeek(week));
      if (activeWeek) {
        state.storageMode = "supabase";
        writeLocal("week", activeWeek);
        return activeWeek;
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

async function syncRemoteReminders() {
  if (!state.client || !state.session?.user || !state.week?.id) return;

  const rows = (state.week.reminders || []).map((reminder) => ({
    id: reminder.id,
    user_id: state.session.user.id,
    week_id: state.week.id,
    reminder_kind: reminder.kind,
    trigger_at: reminder.triggerAt,
    delivered_at: reminder.deliveredAt || null,
    payload: {
      title: reminder.title,
      body: reminder.body,
      url: reminder.url,
      icon: APP_STORE_ICON_PATH,
      badge: APP_STORE_ICON_PATH,
      tag: reminder.id,
      kind: reminder.kind,
    },
  }));

  try {
    const remove = await state.client
      .from("velocichef_reminders")
      .delete()
      .eq("week_id", state.week.id);
    if (remove.error) throw remove.error;

    if (rows.length) {
      const insert = await state.client.from("velocichef_reminders").insert(rows);
      if (insert.error) throw insert.error;
    }
  } catch (_error) {
    state.storageMode = "local";
  }
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
      user_agent: navigator.userAgent,
      enabled: true,
    }, {
      onConflict: "endpoint",
    });
    if (error) throw error;
  } catch (_error) {
    state.storageMode = "local";
  }
}

async function disablePushSubscription(subscription) {
  if (!state.client || !state.session?.user || !subscription?.endpoint) return;
  try {
    const { error } = await state.client
      .from("velocichef_push_subscriptions")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("endpoint", subscription.endpoint)
      .eq("user_id", state.session.user.id);
    if (error) throw error;
  } catch (_error) {
    state.storageMode = "local";
  }
}

async function ensurePushSubscription(forceSubscribe = false) {
  if (!state.workerRegistration) return { supported: false, subscription: null };
  if (!("PushManager" in window)) return { supported: false, subscription: null };

  const registration = state.workerRegistration || await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription && forceSubscribe) {
    const publicKey = await fetchPushPublicKey();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });
  }

  if (subscription) {
    await upsertPushSubscription(subscription);
  }

  return { supported: true, subscription };
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
    .filter((ingredient) => /cebolla|pimiento|zanahoria|calabac|pepino|puerro|col|repollo|jud[ií]a|lechuga|tomate|berenjena|patata/i.test(ingredient.name))
    .slice(0, limit)
    .map((ingredient) => ingredient.name);
}

function getProteinIngredient(ingredients) {
  return (ingredients || []).find((ingredient) => /pollo|pavo|carne|huevo|salm|at[uú]n|garbanzo|lenteja|jud[ií]a|gamba|tofu|queso|yogur/i.test(ingredient.name)) || null;
}

function getBaseIngredient(ingredients) {
  return (ingredients || []).find((ingredient) => /pasta|arroz|cusc[uú]s|patata|pan|avena|quinoa/i.test(ingredient.name)) || null;
}

function inferCookingMethod(mealKey, meal) {
  const title = String(meal?.title || "").toLowerCase();
  const prepMinutes = Number(meal?.prepMinutes || meal?.prep_minutes || 20) || 20;

  if (/ensalada|yogur|batido|tostada|wrap fr[ií]o|bowl fr[ií]o/.test(title)) {
    return { type: "cold", timerMinutes: 0 };
  }
  if (/horno|asad|lasa|gratin|bake/.test(title)) {
    return { type: "oven", timerMinutes: Math.max(10, Math.round(prepMinutes * 0.65)) };
  }
  if (/sopa|crema|lenteja|curry|guiso/.test(title)) {
    return { type: "simmer", timerMinutes: Math.max(10, Math.round(prepMinutes * 0.55)) };
  }
  if (/pasta|arroz|cusc[uú]s/.test(title)) {
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

  return {
    id: step?.id || createId(),
    title,
    text,
    timerMinutes: Number(step?.timerMinutes || step?.timer_minutes || extractTimerMinutes(text)) || 0,
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
      text: `Saca ${formatNaturalList(primaryIngredients) || "los ingredientes principales"} y colÃ³calos ya medidos para cocinar sin prisas.`,
    });
  }

  if (method.type === "cold") {
    steps.push({
      title: "Mezcla y monta",
      text: `Combina ${formatNaturalList(primaryIngredients) || "los ingredientes"} en un bol, aliÃ±a al gusto y reserva el plato listo para servir.`,
    });
  } else if (method.type === "oven") {
    steps.push({
      title: "Da sabor",
      text: `AliÃ±a ${formatNaturalList(primaryIngredients) || "la mezcla"} con aceite y condimentos. Si usas proteÃ­na, dora ligeramente ${protein?.name || "la parte principal"} antes de meterla al horno.`,
    });
    steps.push({
      title: "Cocina principal",
      text: `Lleva la bandeja al horno y cocina durante ${method.timerMinutes} minutos, hasta que quede bien hecho y con color.`,
      timerMinutes: method.timerMinutes,
    });
  } else if (method.type === "simmer") {
    steps.push({
      title: "SofrÃ­e",
      text: `Pon una olla con un poco de aceite y sofrÃ­e la base aromÃ¡tica un par de minutos para arrancar con sabor.`,
    });
    steps.push({
      title: "Cuece suave",
      text: `AÃ±ade ${formatNaturalList(primaryIngredients) || "el resto de ingredientes"}, cubre lo necesario y cocina a fuego lento durante ${method.timerMinutes} minutos.`,
      timerMinutes: method.timerMinutes,
    });
  } else if (method.type === "boil") {
    steps.push({
      title: "Pon la base en marcha",
      text: `Hierve agua o caldo y cocina ${base?.name || "la base del plato"} durante ${method.timerMinutes} minutos hasta que quede en su punto.`,
      timerMinutes: method.timerMinutes,
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
      text: `Calienta una sartÃ©n con un poco de aceite y dora ${protein?.name || "el ingrediente principal"} para que coja color y sabor.`,
    });
    steps.push({
      title: "Termina la cocciÃ³n",
      text: `AÃ±ade ${formatNaturalList(primaryIngredients) || "el resto de ingredientes"} y cocina a fuego lento durante ${method.timerMinutes} minutos, removiendo de vez en cuando.`,
      timerMinutes: method.timerMinutes,
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
  const sourceSteps = Array.isArray(meal?.cookingSteps)
    ? meal.cookingSteps
    : (Array.isArray(meal?.steps) ? meal.steps : (Array.isArray(meal?.instructions) ? meal.instructions : []));

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
    cookingSteps: (sourceSteps.length ? sourceSteps.map(normalizeCookingStep) : buildFallbackCookingSteps(mealKey, meal, ingredients)).filter((step) => step.text),
    tags: uniqueValues(meal?.tags || []),
    feedback: meal?.feedback || { liked: false, disliked: false, reasons: null },
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
          pantryStatus: "need",
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
        pantryStatus: item.pantryStatus || "need",
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
    reminders: Array.isArray(rawWeek.reminders) ? rawWeek.reminders : [],
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
  });
  normalized.reminders = [];
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

function getMealClock(mealKey) {
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
    mode,
    mealId,
    stepIndex: 0,
    handsFree: false,
    recognitionState: "idle",
    transcript: "",
    activeTimer: null,
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

function getCookingTarget() {
  const mealId = state.cooking?.mealId;
  return mealId ? getMealById(mealId) : null;
}

function getCookingStageList(target) {
  if (!target) return [];
  const ingredientStep = {
    id: `${target.meal.id}-ingredients`,
    kind: "ingredients",
    title: "Paso 1 - PreparaciÃ³n",
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

function getCookingImageState(step) {
  if (!step || !state.cooking?.stepImages) return null;
  return state.cooking.stepImages[step.id] || null;
}

async function ensureCookingGuidance(mealId) {
  const target = getMealById(mealId);
  if (!target || !state.week) return;

  const currentSteps = target.meal.cookingSteps || [];
  const hasSpecificSteps = currentSteps.some((step) => step.imagePrompt || step.text.length > 80);
  if (hasSpecificSteps && state.cooking?.guidanceStatus === "done") return;

  ensureCookingState();
  state.cooking.guidanceStatus = "loading";
  state.busy = true;
  state.busyLabel = "Afinando la receta paso a paso...";
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
      }));
      await saveWeek();
    }
    state.cooking.guidanceStatus = "done";
    state.notice = "";
    state.error = "";
  } catch (_error) {
    state.cooking.guidanceStatus = "error";
    state.notice = "Voy a usar una guía rápida para esta receta mientras afino los pasos.";
  } finally {
    state.busy = false;
    state.busyLabel = "";
    render();
  }
}

async function ensureStepIllustration(mealId, step) {
  if (!step || step.kind !== "instruction" || (!step.imagePrompt && !step.imageSearchQuery && !step.text) || !state.cooking) return;
  if (state.cooking.imageSupport === "unavailable") {
    state.cooking.stepImages[step.id] = { status: "error" };
    render();
    return;
  }
  if (state.cooking.stepImages?.[step.id]?.status === "ready" || state.cooking.stepImages?.[step.id]?.status === "loading") return;

  state.cooking.stepImages[step.id] = { status: "loading" };
  render();

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
      state.cooking.stepImages[step.id] = { status: "error" };
    } else {
      state.cooking.stepImages[step.id] = { status: "error" };
    }
  } catch (_error) {
    state.cooking.stepImages[step.id] = { status: "error" };
  } finally {
    render();
  }
}

async function startCookingFlow(mealId, mode = "active") {
  stopHandsFreeMode();
  stopCookingTimer();
  state.cooking = createCookingState(mode, mealId);
  state.currentView = "cook";
  render();
  window.scrollTo(0, 0);

  await ensureCookingGuidance(mealId);

  const target = getMealById(mealId);
  if (!target) return;
  const currentStep = getCookingStage(target).current;
  await ensureStepIllustration(mealId, currentStep);
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
      pantryStatus: existing?.pantryStatus || "need",
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

function composeReminders() {
  if (!state.week || !state.profile) return [];

  const reminders = [];
  const leadMinutes = Number(state.profile.reminderLeadMinutes || DEFAULT_REMINDER_LEAD_MINUTES);

  state.week.days.forEach((day, index) => {
    Object.entries(day.meals || {}).forEach(([mealKey, meal]) => {
      let date = day.date;
      let time = "12:00";
      let title = `Toca ${MEAL_LABELS[mealKey].toLowerCase()}: ${meal.title}`;

      if (mealKey === "dinner") {
        time = state.profile.dinnerTime || "21:00";
      } else if (mealKey === "lunch") {
        if (state.profile.lunchPrepNightBefore && index > 0) {
          date = state.week.days[index - 1].date;
          time = state.profile.dinnerTime || "20:00";
          title = `Deja listo el almuerzo de mañana: ${meal.title}`;
        } else {
          time = state.profile.lunchTime || "14:30";
        }
      } else if (mealKey === "breakfast") {
        time = "08:00";
      } else if (mealKey === "snack") {
        time = "17:30";
      } else if (mealKey === "bites") {
        time = "11:30";
      }

      const mealDate = combineDateAndTime(date, time);
      const triggerAt = new Date(mealDate.getTime() - leadMinutes * 60000);
      reminders.push({
        id: createId(),
        kind: "meal",
        title,
        body: `Empieza a organizarte para ${MEAL_LABELS[mealKey].toLowerCase()} y cocina con margen.`,
        triggerAt: triggerAt.toISOString(),
        url: `${APP_BASE_URL}?view=week&day=${day.date}&meal=${mealKey}`,
      });
    });
  });

  if (state.week.freezerOptIn) {
    state.week.freezerItems.forEach((item) => {
      const mealDate = combineDateAndTime(
        item.mealDate,
        item.mealKey === "dinner" ? state.profile.dinnerTime || "21:00" : state.profile.lunchTime || "14:30",
      );
      const triggerAt = new Date(mealDate.getTime() - (Number(item.thawLeadHours || 12) * 3600000));
      reminders.push({
        id: createId(),
        kind: "thaw",
        title: `Pon a descongelar ${item.ingredient}`,
        body: `Lo necesitas para "${item.mealTitle}" del ${formatDateLong(item.mealDate)}.`,
        triggerAt: triggerAt.toISOString(),
        url: `${APP_BASE_URL}?view=week&day=${item.mealDate}&meal=${item.mealKey}`,
      });
    });
  }

  if (state.week.endDate) {
    const replanDate = combineDateAndTime(addDays(state.week.endDate, -2), "10:00");
    reminders.push({
      id: createId(),
      kind: "replan",
      title: "Tu semana de VelociChef se acaba pronto",
      body: "Entra y programa la siguiente semana sin volver a pasar por todo el onboarding.",
      triggerAt: replanDate.toISOString(),
      url: `${APP_BASE_URL}?view=week&replan=1`,
    });
  }

  return reminders;
}

function clearReminderTimers() {
  state.reminderTimers.forEach((timerId) => clearTimeout(timerId));
  state.reminderTimers = [];
}

async function showBrowserNotification(reminder) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if (state.workerRegistration?.showNotification) {
    await state.workerRegistration.showNotification(reminder.title, {
      body: reminder.body,
      icon: APP_STORE_ICON_PATH,
      badge: APP_STORE_ICON_PATH,
      data: { url: reminder.url },
      tag: reminder.id,
    });
    return;
  }

  new Notification(reminder.title, {
    body: reminder.body,
    icon: APP_STORE_ICON_PATH,
  });
}

async function maybeFireReminder(reminder) {
  if (!state.week || !state.profile?.notificationEnabled) return;
  if (reminder.deliveredAt) return;
  reminder.deliveredAt = new Date().toISOString();
  try {
    await showBrowserNotification(reminder);
    await saveWeek();
  } catch (_error) {
    reminder.deliveredAt = null;
  }
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
  if (!("Notification" in window)) {
    state.error = "Este navegador no soporta notificaciones web.";
    render();
    return false;
  }
  if (isIOSDevice() && !isStandaloneApp()) {
    state.notice = "En iPhone, los avisos solo se pueden activar desde la app instalada en la pantalla de inicio. Ábrela desde allí y vuelve a intentarlo.";
    state.error = "";
    render();
    return false;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    try {
      const push = await ensurePushSubscription(true);
      state.profile.notificationEnabled = true;
      await saveProfile();
      if (state.week) {
        state.week.reminders = composeReminders();
        await saveWeek();
        scheduleReminders();
      }
      state.notice = push.supported
        ? "Notificaciones activadas. Te avisaré aunque la app no esté abierta."
        : "Los avisos están activados mientras la app siga abierta en este dispositivo.";
      state.error = "";
      return true;
    } catch (error) {
      state.profile.notificationEnabled = true;
      await saveProfile();
      state.notice = "He dejado los avisos listos en este dispositivo, pero aún no he cerrado la activación completa.";
      state.error = "No pude completar la activación de avisos ahora mismo.";
      render();
      return false;
    }
  }
  state.notice = "Las notificaciones siguen desactivadas. Puedes volver a activarlas más tarde desde tu perfil.";
  return false;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    state.workerRegistration = await navigator.serviceWorker.ready;
    navigator.serviceWorker.addEventListener("message", (event) => {
      const url = event.data?.url;
      if (!url) return;
      const next = new URL(url, window.location.origin);
      state.currentView = normalizeView(next.searchParams.get("view") || "week");
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
  if (!state.cooking?.activeTimer) {
    clearTimerTicker();
    return;
  }

  const remainingMs = state.cooking.activeTimer.endsAt - Date.now();
  state.cooking.activeTimer.remainingMs = remainingMs;

  if (remainingMs <= 0) {
    clearTimerTicker();
    const finishedLabel = state.cooking.activeTimer.label;
    state.cooking.activeTimer.remainingMs = 0;
    state.notice = `${finishedLabel} ya estÃ¡ listo.`;
    if ("Notification" in window && Notification.permission === "granted") {
      showBrowserNotification({
        id: `cook-timer-${Date.now()}`,
        title: "Tiempo cumplido",
        body: `${finishedLabel} ya puede pasar al siguiente paso.`,
        url: `${APP_BASE_URL}?view=cook`,
      }).catch(() => {});
    }
  }

  render();
}

function startCookingTimer(label, minutes) {
  ensureCookingState();
  state.cooking.activeTimer = {
    id: createId(),
    label,
    durationMinutes: minutes,
    endsAt: Date.now() + minutes * 60000,
    remainingMs: minutes * 60000,
  };
  state.modal = { type: "timer" };
  clearTimerTicker();
  state.timerTicker = window.setInterval(syncCookingTimer, 1000);
  syncCookingTimer();
}

function stopCookingTimer() {
  clearTimerTicker();
  if (state.cooking) {
    state.cooking.activeTimer = null;
  }
}

async function moveCookingStep(delta) {
  const target = getCookingTarget();
  if (!target) return;
  const { stages } = getCookingStage(target);
  ensureCookingState();
  state.cooking.stepIndex = Math.max(0, Math.min((state.cooking.stepIndex || 0) + delta, Math.max(0, stages.length - 1)));
  render();
  window.scrollTo(0, 0);
  const nextTarget = getCookingTarget();
  const currentStep = nextTarget ? getCookingStage(nextTarget).current : null;
  await ensureStepIllustration(nextTarget?.meal?.id, currentStep);
}

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function stopHandsFreeMode() {
  if (state.speechRecognition) {
    state.speechRecognition.onend = null;
    state.speechRecognition.onresult = null;
    state.speechRecognition.onerror = null;
    try {
      state.speechRecognition.stop();
    } catch (_error) {
      // Si ya estÃ¡ detenido, no hace falta hacer nada.
    }
  }
  state.speechRecognition = null;
  if (state.cooking) {
    state.cooking.handsFree = false;
    state.cooking.recognitionState = "idle";
    state.cooking.transcript = "";
  }
}

async function handleVoiceNavigation(transcript) {
  const normalized = String(transcript || "").toLowerCase();
  if (/siguiente/.test(normalized)) {
    await moveCookingStep(1);
    return true;
  }
  if (/atr[aá]s/.test(normalized)) {
    await moveCookingStep(-1);
    return true;
  }

  const target = getCookingTarget();
  const currentStage = target ? getCookingStage(target).current : null;
  if (/temporizador|cuenta regresiva/.test(normalized) && currentStage?.timerMinutes) {
    startCookingTimer(currentStage.title, currentStage.timerMinutes);
    return true;
  }
  return false;
}

function startHandsFreeMode() {
  const RecognitionCtor = getSpeechRecognitionCtor();
  if (!RecognitionCtor) {
    state.notice = "El modo manos libres todavÃ­a no estÃ¡ disponible en este navegador.";
    render();
    return;
  }

  stopHandsFreeMode();
  ensureCookingState();

  const recognition = new RecognitionCtor();
  recognition.lang = "es-ES";
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .filter((result) => result.isFinal)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();

    if (!transcript) return;
    state.cooking.transcript = transcript;
    handleVoiceNavigation(transcript).finally(() => render());
  };

  recognition.onerror = () => {
    state.notice = "No he podido mantener activo el modo manos libres.";
    stopHandsFreeMode();
    render();
  };

  recognition.onend = () => {
    if (!state.cooking?.handsFree) return;
    try {
      recognition.start();
      state.cooking.recognitionState = "listening";
      render();
    } catch (_error) {
      state.notice = "He pausado el modo manos libres. Puedes volver a activarlo cuando quieras.";
      stopHandsFreeMode();
      render();
    }
  };

  state.speechRecognition = recognition;
  state.cooking.handsFree = true;
  state.cooking.recognitionState = "listening";

  try {
    recognition.start();
  } catch (_error) {
    state.notice = "No he podido arrancar el modo manos libres.";
    stopHandsFreeMode();
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
        "Desayuno rápido con fruta fresca y algo crujiente para arrancar suave.",
        380,
        8,
        "Fácil",
        [
          { name: "Yogur natural", quantity: 700, unit: "g", category: "Lácteos" },
          { name: "Avena", quantity: 280, unit: "g", category: "Despensa" },
          { name: "Plátano", quantity: 4, unit: "unit", category: "Fruta" },
          { name: "Canela", quantity: 1, unit: "unit", category: "Especias", spice: true, pantry: true },
        ],
        ["Rápido", "Saciante"],
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
          { name: "Pechuga de pollo", quantity: 650, unit: "g", category: "Carnicería", freezable: true, thawLeadHours: 18 },
          { name: "Calabacín", quantity: 2, unit: "unit", category: "Verduras" },
          { name: "Pimiento rojo", quantity: 2, unit: "unit", category: "Verduras" },
          { name: "Aceite de oliva", quantity: 80, unit: "ml", category: "Despensa", pantry: true },
        ],
        ["Batch cooking", "Proteína"],
      ),
      dinner: createSampleMeal(
        "dinner",
        "Tortilla vaga con ensalada crujiente",
        "Cena ligera, rica en proteína y con ingredientes fáciles de repetir.",
        510,
        22,
        "Fácil",
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
        "Fácil",
        [
          { name: "Pan integral", quantity: 8, unit: "unit", category: "Panadería" },
          { name: "Hummus", quantity: 220, unit: "g", category: "Refrigerados" },
          { name: "Tomate", quantity: 2, unit: "unit", category: "Verduras" },
        ],
        ["Vegetal", "Sin cocina"],
      ),
      lunch: createSampleMeal(
        "lunch",
        "Lentejas rápidas con verduras",
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
        ["Económico", "Fibra"],
      ),
      dinner: createSampleMeal(
        "dinner",
        "Salmón al horno con patata y judías",
        "Pescado sencillo con guarnición que no pide mucha atención.",
        560,
        27,
        "Media",
        [
          { name: "Salmón", quantity: 500, unit: "g", category: "Pescadería", freezable: true, thawLeadHours: 12 },
          { name: "Patata", quantity: 500, unit: "g", category: "Verduras" },
          { name: "Judías verdes", quantity: 300, unit: "g", category: "Verduras" },
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
            "Algo fácil para llegar con energía a la cena.",
            210,
            5,
            "Fácil",
            [
              { name: "Manzana", quantity: 2, unit: "unit", category: "Fruta" },
              { name: "Yogur natural", quantity: 250, unit: "g", category: "Lácteos" },
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
            "Puñado de frutos secos y mandarina",
            "Pequeño refuerzo portátil.",
            180,
            2,
            "Fácil",
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
      "Si haces hummus o crema, guarda una parte para merienda o colación.",
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
      "Porridge rápido con pera y nueces",
      "Más cremoso y calmado, ideal si quieres variar el desayuno.",
      360,
      12,
      "Fácil",
      [
        { name: "Avena", quantity: 80, unit: "g", category: "Despensa" },
        { name: "Leche o bebida vegetal", quantity: 250, unit: "ml", category: "Lácteos" },
        { name: "Pera", quantity: 1, unit: "unit", category: "Fruta" },
      ],
      ["Desayuno caliente"],
    ),
    lunch: createSampleMeal(
      "lunch",
      "Cuscús con garbanzos y verduras salteadas",
      "Alternativa fácil de improvisar y muy amable con la lista de la compra.",
      590,
      24,
      "Fácil",
      [
        { name: "Cuscús", quantity: 240, unit: "g", category: "Despensa" },
        { name: "Garbanzos cocidos", quantity: 500, unit: "g", category: "Legumbres" },
        { name: "Calabacín", quantity: 1, unit: "unit", category: "Verduras" },
        { name: "Pimiento rojo", quantity: 1, unit: "unit", category: "Verduras" },
      ],
      ["Vegetal", "Cambio exprés"],
    ),
    dinner: createSampleMeal(
      "dinner",
      "Pasta con atún, tomate y rúcula",
      "Cena muy resolutiva para cuando quieres menos pasos.",
      520,
      18,
      "Fácil",
      [
        { name: "Pasta", quantity: 280, unit: "g", category: "Despensa" },
        { name: "Atún", quantity: 2, unit: "unit", category: "Conservas" },
        { name: "Tomate triturado", quantity: 300, unit: "g", category: "Despensa" },
        { name: "Rúcula", quantity: 100, unit: "g", category: "Verduras" },
      ],
      ["Menos tiempo", "Sencillo"],
    ),
    snack: createSampleMeal(
      "snack",
      "Batido suave de plátano y cacao",
      "Una merienda distinta pero igual de fácil.",
      240,
      6,
      "Fácil",
      [
        { name: "Plátano", quantity: 1, unit: "unit", category: "Fruta" },
        { name: "Leche o bebida vegetal", quantity: 250, unit: "ml", category: "Lácteos" },
        { name: "Cacao puro", quantity: 1, unit: "unit", category: "Especias", spice: true, pantry: true },
      ],
      ["Merienda"],
    ),
    bites: createSampleMeal(
      "bites",
      "Tortitas de maíz con queso crema y pavo",
      "Mini colación salada para salir del paso.",
      190,
      5,
      "Fácil",
      [
        { name: "Tortitas de maíz", quantity: 4, unit: "unit", category: "Snacks" },
        { name: "Queso crema", quantity: 80, unit: "g", category: "Lácteos" },
        { name: "Pavo cocido", quantity: 120, unit: "g", category: "Charcutería" },
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
    lunchTime: state.profile?.lunchTime || null,
    dinnerTime: state.profile?.dinnerTime || null,
    timezone: state.profile?.timezone || getTimezone(),
  };
}

async function invokePlanner(body) {
  if (!state.client) {
    throw new Error("La cocina no está disponible ahora mismo.");
  }
  const { data, error } = await state.client.functions.invoke("velocichef-plan-week", {
    body,
  });
  if (error) throw error;
  return data;
}

async function invokePlannerDirect(body) {
  if (!state.session?.access_token) {
    throw new Error("No hay una sesiÃ³n activa para llamar a VelociChef.");
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
    throw new Error(payload?.error || `La funciÃ³n respondiÃ³ con ${response.status}.`);
  }
  return payload;
}

async function invokePlannerStable(body) {
  if (!state.client) {
    throw new Error("La cocina no está disponible ahora mismo.");
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
  state.busyLabel = "Preparando tu menú semanal...";
  state.error = "";
  render();

  try {
    const data = await invokePlannerStable({
      action: "generate_week",
      startDate,
      profile: plannerProfilePayload(),
    });
    state.week = buildWeekFromPlan(data.plan || data);
    state.notice = "";
    state.error = "";
  } catch (_error) {
    const error = _error;
    state.week = buildWeekFromPlan(createSampleWeekPlan(startDate));
    state.notice = "No pude cerrar la generación real en este intento, así que he dejado una semana de muestra editable para que sigas avanzando.";
    state.error = "Ahora mismo no he podido generar el menú real.";
  } finally {
    state.week.reminders = composeReminders();
    await saveWeek();
    state.currentView = "week";
    state.busy = false;
    state.busyLabel = "";
    render();
  }
}

async function swapMeal(target, reasons) {
  const original = target.meal;
  state.busy = true;
  state.busyLabel = "Buscando otra opción de plato...";
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
  const zaurioMenuOpen = state.activeMenu === "zaurio";
  const userMenuOpen = state.activeMenu === "user";
  const displayName = state.profile?.displayName || getUserLabel(user);
  const notificationState = state.profile?.notificationEnabled ? "Avisos activos" : "Avisos pendientes";
  const shoppingState = state.week
    ? (state.week.shoppingCompleted ? "Compra cerrada" : "Compra pendiente")
    : "Sin semana activa";

  return `
    <header class="vc-topbar vc-card ${isCookView ? "vc-topbar-cooking" : ""}">
      <div class="vc-topbar-main">
        <div class="vc-topbar-side vc-topbar-left">
          <div class="vc-menu-wrap ${zaurioMenuOpen ? "open" : ""}">
            <button
              class="vc-menu-btn"
              type="button"
              data-action="toggle-menu"
              data-menu="zaurio"
              aria-label="Abrir menu de Zaurio"
              aria-haspopup="true"
              aria-expanded="${zaurioMenuOpen ? "true" : "false"}"
            >
              <span class="vc-menu-glyph" aria-hidden="true">☰</span>
              <span class="vc-z-mark"><img src="${ZAURIO_MENU_LOGO_PATH}" alt=""></span>
              <span class="vc-menu-text">Zaurio</span>
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
          <a class="vc-topbar-logo" href="${APP_BASE_URL}" aria-label="Ir al inicio de VelociChef">
            <img src="${APP_LOGO_PATH}" alt="VelociChef">
          </a>
        </div>

        <div class="vc-topbar-side vc-topbar-right">
          ${user ? `
            <div class="vc-menu-wrap vc-user-wrap ${userMenuOpen ? "open" : ""}">
              <button
                class="vc-user-pill"
                type="button"
                data-action="toggle-menu"
                data-menu="user"
                aria-label="Abrir menu del usuario"
                aria-haspopup="true"
                aria-expanded="${userMenuOpen ? "true" : "false"}"
              >
                ${renderUserAvatar(user)}
                <span class="vc-user-copy">
                  <strong>${escapeHtml(displayName)}</strong>
                  <small>${escapeHtml(shoppingState)}</small>
                </span>
                <span class="vc-user-caret" aria-hidden="true"></span>
              </button>
              <div class="vc-menu-drop vc-user-menu" role="menu" aria-label="Menu del usuario">
                <button class="vc-menu-action" type="button" data-action="open-view" data-view="shopping" role="menuitem">Mi lista de la compra</button>
                <button class="vc-menu-action" type="button" data-action="open-view" data-view="recipes" role="menuitem">Mis recetas de esta semana</button>
                <button class="vc-menu-action" type="button" data-action="plan-new-week" role="menuitem">Planificar nueva semana</button>
                <button class="vc-menu-action" type="button" data-action="open-view" data-view="profile" role="menuitem">Perfil</button>
                <div class="vc-menu-meta">
                  <span class="vc-meta-pill">${escapeHtml(notificationState)}</span>
                </div>
                <button class="vc-menu-action vc-menu-action-danger" type="button" data-action="logout" role="menuitem">Salir</button>
              </div>
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
              <small class="vc-muted">2. Menú</small>
              <strong>Semana útil</strong>
              <span class="vc-muted">Recibes platos con calorías aproximadas y una compra pensada con cabeza.</span>
            </div>
            <div class="vc-stat">
              <small class="vc-muted">3. Compra</small>
              <strong>Súper sin caos</strong>
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
      copy: "Marca las franjas de comida que quieres planificar y cuéntame cómo encaja el almuerzo en tu día.",
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
          <label class="vc-label" for="onboarding-lunch-time">¿A qué hora te gusta comer regularmente?</label>
          <input id="onboarding-lunch-time" class="vc-time" type="time" data-field="lunchTime" value="${escapeHtml(state.profile.lunchTime)}">
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
            ? `<button class="vc-button primary" data-action="finish-onboarding">Preparar mi menú de la semana</button>`
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
        <strong>Tu lista de la compra todavía no está marcada como completada.</strong>
        <p class="vc-copy">Puedes terminarla ahora o revisar qué ingredientes te faltan antes de salir al súper.</p>
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
        <strong>Esta semana está a punto de acabarse.</strong>
        <p class="vc-copy">Puedes lanzar ya la siguiente comenzando justo después del plan actual y reutilizando las preferencias guardadas.</p>
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

  return `
    <section class="vc-workspace-head">
      <article class="vc-brand-card vc-card">
        <div class="vc-header-copy">
          <span class="vc-eyebrow">Tu cocina semanal</span>
          <h1 class="vc-title">Hola, ${escapeHtml(userName)}.</h1>
          <p class="vc-copy">Tu menu, tu lista de la compra y tus avisos estan organizados para que la semana vaya suave de verdad.</p>
        </div>
        <div class="vc-chip-row">
          <span class="vc-meta-pill">${escapeHtml(state.profile?.timezone || getTimezone())}</span>
          <span class="vc-meta-pill">${state.week?.shoppingCompleted ? "Compra cerrada" : "Compra pendiente"}</span>
        </div>
      </article>

      <div class="vc-stat-grid">
        <article class="vc-stat">
          <small class="vc-muted">Semana actual</small>
          <strong>${mealsCount}</strong>
          <span class="vc-muted">platos planificados</span>
        </article>
        <article class="vc-stat">
          <small class="vc-muted">Lista del súper</small>
          <strong>${shoppingItems}</strong>
          <span class="vc-muted">ingredientes agregados</span>
        </article>
        <article class="vc-stat">
          <small class="vc-muted">Recordatorios</small>
          <strong>${reminderCount}</strong>
          <span class="vc-muted">avisos pendientes</span>
        </article>
      </div>
      ${renderBanner()}
    </section>
  `;
}

function renderMealCard(day, mealKey, meal) {
  const feedback = meal.feedback || {};
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
        <button class="vc-button primary" data-action="cook-meal" data-meal-id="${meal.id}">Cocinar</button>
        <button class="vc-button subtle" data-action="toggle-like" data-meal-id="${meal.id}">Me gusta</button>
        <button class="vc-button secondary" data-action="open-refine" data-meal-id="${meal.id}">No me gusta</button>
        <button class="vc-button secondary" data-action="swap-meal" data-meal-id="${meal.id}">Cambiar por otro plato</button>
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
          <div class="vc-field">
            <label class="vc-label" for="lunch-time">¿A qué hora te gustaría almorzar regularmente?</label>
            <input id="lunch-time" class="vc-time" type="time" data-field="lunchTime" value="${escapeHtml(state.profile.lunchTime)}">
          </div>
          <div class="vc-field">
            <label class="vc-label" for="dinner-time">¿A qué hora te gustaría cenar regularmente?</label>
            <input id="dinner-time" class="vc-time" type="time" data-field="dinnerTime" value="${escapeHtml(state.profile.dinnerTime)}">
          </div>
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
  const haveCount = state.week.shoppingList.filter((item) => item.pantryStatus === "have").length;
  const needCount = state.week.shoppingList.filter((item) => item.pantryStatus !== "have").length;

  return `
    <section class="vc-grid">
      <div class="vc-shopping-summary">
        <article class="vc-summary-card">
          <small class="vc-muted">Ya lo tienes</small>
          <strong>${haveCount}</strong>
          <p class="vc-copy">ingredientes marcados como resueltos</p>
        </article>
        <article class="vc-summary-card">
          <small class="vc-muted">A comprar</small>
          <strong>${needCount}</strong>
          <p class="vc-copy">ingredientes que siguen pendientes</p>
        </article>
      </div>

      <article class="vc-panel">
        <div class="vc-shopping-head">
          <div>
            <span class="vc-eyebrow">Mi lista de la compra</span>
            <h2 class="vc-title">Todo lo que necesitarás esta semana</h2>
            <p class="vc-copy">Marca qué ya tienes en casa y qué sigue pendiente para el súper.</p>
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
                  <div>
                    <span class="vc-shopping-name">${escapeHtml(item.name)}</span>
                    <span class="vc-muted">${escapeHtml(item.displayQuantity)}</span>
                  </div>
                  <div class="vc-segmented">
                    <button class="vc-toggle ${item.pantryStatus === "have" ? "active" : ""}" data-action="set-shopping-state" data-item-id="${item.id}" data-status="have">Ya lo tengo</button>
                    <button class="vc-toggle ${item.pantryStatus !== "have" ? "active" : ""}" data-action="set-shopping-state" data-item-id="${item.id}" data-status="need">Comprar</button>
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

function renderRecipesView() {
  if (!state.week) return renderWeekView();
  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <span class="vc-eyebrow">Mis recetas de esta semana</span>
        <h2 class="vc-title">Recetario semanal</h2>
        <p class="vc-copy">Aquí tienes todos los platos reunidos para revisar detalles o volver a una receta concreta.</p>
        <div class="vc-inline-actions">
          <button class="vc-button secondary" data-action="redo-current-week">Rehacer planificación</button>
        </div>
      </article>
      <div class="vc-recipe-grid">
        ${flattenMeals(state.week).map(({ day, mealKey, meal }) => `
          <article class="vc-profile-card">
            <small class="vc-muted">${escapeHtml(day.label)} · ${escapeHtml(MEAL_LABELS[mealKey])}</small>
            <h3 class="vc-inline-title">${escapeHtml(meal.title)}</h3>
            <p class="vc-copy">${escapeHtml(meal.summary)}</p>
            <div class="vc-meta">
              <span class="vc-meta-pill">${meal.prepMinutes} min</span>
              <span class="vc-meta-pill">${meal.calories} kcal</span>
              <span class="vc-meta-pill">${escapeHtml(meal.difficulty)}</span>
            </div>
            <div class="vc-inline-actions">
              <button class="vc-button primary" data-action="cook-meal" data-meal-id="${meal.id}">Cocinar</button>
              <button class="vc-button ghost" data-action="open-details" data-meal-id="${meal.id}">Ver detalles</button>
              <button class="vc-button secondary" data-action="swap-meal" data-meal-id="${meal.id}">Cambiar</button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderProfileView() {
  const pushCapable = "PushManager" in window;
  const speechCapable = !!getSpeechRecognitionCtor();
  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <span class="vc-eyebrow">Perfil</span>
        <h2 class="vc-title">Ajusta tu cocina a tu gusto</h2>
        <p class="vc-copy">Todo lo que cambies aquí se guardará para las próximas semanas y para el modo cocinar.</p>
      </article>

      <article class="vc-card vc-step vc-profile-editor">
        <div class="vc-grid two">
          <div class="vc-field">
            <label class="vc-label" for="profile-name">Cómo quieres que te llame VelociChef</label>
            <input id="profile-name" class="vc-input" type="text" data-field="displayName" value="${escapeHtml(state.profile.displayName || "")}">
          </div>
          <div class="vc-field">
            <label class="vc-label" for="profile-household-count">Personas que comen regularmente contigo</label>
            <input id="profile-household-count" class="vc-input" type="number" min="1" max="8" data-field="householdCount" value="${state.profile.householdCount}">
          </div>
        </div>

        <section class="vc-editor-section">
          <div>
            <span class="vc-eyebrow">Alergias</span>
            <h3 class="vc-inline-title">Ingredientes que deben quedar fuera</h3>
          </div>
          <div class="vc-pill-grid">${ALLERGY_OPTIONS.map((option) => renderPill(option, "allergies", state.profile.allergies)).join("")}</div>
          <div class="vc-field">
            <label class="vc-label" for="profile-allergy-notes">Otros detalles importantes</label>
            <textarea id="profile-allergy-notes" class="vc-textarea" data-field="allergyNotes" placeholder="Ejemplo: el pescado blanco me va bien, pero el marisco no.">${escapeHtml(state.profile.allergyNotes)}</textarea>
          </div>
        </section>

        <section class="vc-editor-section">
          <div>
            <span class="vc-eyebrow">Gustos</span>
            <h3 class="vc-inline-title">Lo que sí y lo que no</h3>
          </div>
          <div class="vc-fieldset">
            <label class="vc-label">Cosas que me gustan</label>
            <div class="vc-pill-grid">${LIKE_OPTIONS.map((option) => renderPill(option, "likes", state.profile.likes)).join("")}</div>
          </div>
          <div class="vc-fieldset">
            <label class="vc-label">Cosas que no me gustan</label>
            <div class="vc-pill-grid">${DISLIKE_OPTIONS.map((option) => renderPill(option, "dislikes", state.profile.dislikes)).join("")}</div>
          </div>
          <div class="vc-field">
            <label class="vc-label" for="profile-dietary-notes">Cuéntamelo con tus palabras</label>
            <textarea id="profile-dietary-notes" class="vc-textarea" data-field="dietaryNotes" placeholder="Ejemplo: prefiero platos jugosos y cenas suaves.">${escapeHtml(state.profile.dietaryNotes)}</textarea>
          </div>
        </section>

        <section class="vc-editor-section">
          <div>
            <span class="vc-eyebrow">Objetivos</span>
            <h3 class="vc-inline-title">Cómo quieres comer esta semana</h3>
          </div>
          <div class="vc-fieldset">
            <label class="vc-label">Nivel de cocina</label>
            <div class="vc-pill-grid">${COOKING_STYLE_OPTIONS.map((option) => renderCookingChoice(option, state.profile.cookingStyle)).join("")}</div>
          </div>
          <div class="vc-fieldset">
            <label class="vc-label">Objetivos alimentarios</label>
            <div class="vc-pill-grid">${GOAL_OPTIONS.map((option) => renderPill(option, "goalTags", state.profile.goalTags)).join("")}</div>
          </div>
        </section>

        <section class="vc-editor-section">
          <div>
            <span class="vc-eyebrow">Hogar</span>
            <h3 class="vc-inline-title">Reglas por persona</h3>
          </div>
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
        </section>

        <section class="vc-editor-section">
          <div>
            <span class="vc-eyebrow">Plan</span>
            <h3 class="vc-inline-title">Comidas, horarios y avisos</h3>
          </div>
          <div class="vc-fieldset">
            <label class="vc-label">Comidas a planificar</label>
            <div class="vc-pill-grid">${MEAL_OPTIONS.map((option) => renderMealChoice(option, state.profile.plannedMeals)).join("")}</div>
          </div>
          <label class="vc-switch vc-switch-card">
            <span>
              <strong>¿Preparas el almuerzo la noche anterior?</strong>
              <small class="vc-helper">Así podré organizar mejor el momento de cocinar.</small>
            </span>
            <input type="checkbox" data-field="lunchPrepNightBefore" ${state.profile.lunchPrepNightBefore ? "checked" : ""}>
          </label>
          <div class="vc-grid two">
            <div class="vc-field">
              <label class="vc-label" for="profile-lunch-time">¿A qué hora sueles comer?</label>
              <input id="profile-lunch-time" class="vc-time" type="time" data-field="lunchTime" value="${escapeHtml(state.profile.lunchTime)}">
            </div>
            <div class="vc-field">
              <label class="vc-label" for="profile-dinner-time">¿A qué hora sueles cenar?</label>
              <input id="profile-dinner-time" class="vc-time" type="time" data-field="dinnerTime" value="${escapeHtml(state.profile.dinnerTime)}">
            </div>
          </div>
          <div class="vc-field">
            <label class="vc-label" for="profile-lead-time">¿Con cuánto margen quieres que te avise?</label>
            <select id="profile-lead-time" class="vc-select" data-field="reminderLeadMinutes">
              ${[45, 60, 75, 90, 120].map((value) => `<option value="${value}" ${Number(state.profile.reminderLeadMinutes) === value ? "selected" : ""}>${value} minutos antes</option>`).join("")}
            </select>
          </div>
        </section>

        <section class="vc-editor-section">
          <div>
            <span class="vc-eyebrow">Avisos y ayuda</span>
            <h3 class="vc-inline-title">Mantén la app a tu ritmo</h3>
          </div>
          ${isIOSDevice() && !isStandaloneApp() ? `<div class="vc-note">En iPhone, abre VelociChef desde la pantalla de inicio para poder activar avisos.</div>` : ""}
          <p class="vc-copy">${state.profile.notificationEnabled ? "Tus avisos están activos." : "Todavía no has activado avisos en este dispositivo."} ${state.profile.freezeNotificationsEnabled ? "También recordaré los ingredientes que convenga descongelar." : "Los recordatorios de congelado siguen apagados por ahora."}</p>
          <div class="vc-chip-row">
            <span class="vc-meta-pill">${pushCapable ? "Avisos también fuera de la app" : "Avisos mientras la app está abierta"}</span>
            <span class="vc-meta-pill">${speechCapable ? "Modo manos libres disponible" : "Modo manos libres limitado en este navegador"}</span>
          </div>
          <div class="vc-inline-actions">
            <button class="vc-button secondary" data-action="request-notifications">${state.profile.notificationEnabled ? "Revisar avisos" : "Activar avisos"}</button>
            <button class="vc-button ghost" data-action="test-notification">Probar aviso</button>
          </div>
        </section>

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
        <h2 class="vc-title">TodavÃ­a no hay ningÃºn plato listo para cocinar.</h2>
        <p class="vc-copy">Prepara una semana primero y volverÃ¡s aquÃ­ con un modo paso a paso.</p>
        <div class="vc-inline-actions" style="justify-content:center">
          <button class="vc-button primary" data-action="generate-first-week">Preparar mi menÃº de la semana</button>
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
              <h3 class="vc-inline-title">Â¿EstÃ¡s queriendo cocinar el plato "${escapeHtml(suggestedTarget.meal.title)}" del ${escapeHtml((MEAL_LABELS[suggestedTarget.mealKey] || "").toLowerCase())} del dÃ­a ${escapeHtml(formatDateLong(suggestedTarget.day.date))}?</h3>
              <p class="vc-copy">${escapeHtml(suggestedTarget.meal.summary)}</p>
              <div class="vc-inline-actions">
                <button class="vc-button primary" data-action="cook-suggest-yes">SÃ­</button>
                <button class="vc-button secondary" data-action="cook-suggest-no">No</button>
              </div>
            </article>
          ` : `
            <article class="vc-cook-suggestion">
              <h3 class="vc-inline-title">No he encontrado un plato claro para este momento.</h3>
              <p class="vc-copy">Elige tÃº mismo quÃ© receta quieres cocinar ahora.</p>
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
          <p class="vc-copy">Selecciona el dÃ­a y la comida que quieres preparar ahora mismo.</p>
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
                    <button class="vc-button primary" data-action="cook-meal" data-meal-id="${meal.id}">Cocinar</button>
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
  const activeTimer = state.cooking?.activeTimer;
  const isIngredientsStep = current?.kind === "ingredients";
  const isLastStep = stepIndex === stages.length - 1;
  const currentImage = getCookingImageState(current);

  return `
    <section class="vc-grid vc-cook-screen">
      <article class="vc-card vc-step vc-cook-mode">
        <div class="vc-step-progress-head">
          <span class="vc-eyebrow">Cocinar</span>
          <span class="vc-helper">Paso ${stepIndex + 1} de ${stages.length}</span>
        </div>

        <div class="vc-step-hero vc-cook-hero">
          <div class="vc-step-badge">${String(stepIndex + 1).padStart(2, "0")}</div>
          <div class="vc-step-intro">
            <span class="vc-step-kicker">${escapeHtml(target.day.label)} Â· ${escapeHtml(MEAL_LABELS[target.mealKey])}</span>
            <h1 class="vc-step-title">${escapeHtml(target.meal.title)}</h1>
            <p class="vc-step-copy">${isIngredientsStep ? "Prepara todo antes de empezar para cocinar con calma." : escapeHtml(current.title)}</p>
          </div>
        </div>

        <div class="vc-inline-actions vc-cook-toolbar">
          <button class="vc-button secondary vc-handsfree-toggle ${state.cooking?.handsFree ? "active" : ""}" data-action="toggle-hands-free" aria-pressed="${state.cooking?.handsFree ? "true" : "false"}">Manos libres</button>
          <button class="vc-button ghost" data-action="cook-back-to-picker">Cambiar de plato</button>
          ${activeTimer ? `<span class="vc-meta-pill">Temporizador: ${formatCountdown(activeTimer.remainingMs)}</span>` : ""}
        </div>

        ${state.cooking?.handsFree ? `
          <div class="vc-note">
            Comandos disponibles: "siguiente" y "atrÃ¡s". ${current?.timerMinutes ? 'TambiÃ©n puedes decir "temporizador".' : ""}
            ${state.cooking.transcript ? `ÂÚltimo comando: "${escapeHtml(state.cooking.transcript)}".` : ""}
          </div>
        ` : ""}

        ${state.cooking?.guidanceStatus === "loading" ? `<div class="vc-note">Estoy afinando los pasos de esta receta para que queden bien claros.</div>` : ""}

        ${isIngredientsStep ? `
          <article class="vc-cook-stage">
            <h3 class="vc-inline-title">Paso 1 - PreparaciÃ³n</h3>
            <p class="vc-copy">Coge los ingredientes necesarios para esta receta.</p>
            <div class="vc-cook-ingredients">
              ${(current.ingredients || []).map((ingredient) => `
                <article class="vc-cook-ingredient">
                  <strong>${escapeHtml(ingredient.name)}</strong>
                  <span class="vc-muted">${escapeHtml(formatQuantity(ingredient.quantity, ingredient.unit))}</span>
                </article>
              `).join("")}
            </div>
          </article>
        ` : `
          <article class="vc-cook-stage">
            <h3 class="vc-inline-title">${escapeHtml(current.title)}</h3>
            ${currentImage?.status === "loading" ? `<div class="vc-cook-image-shell vc-cook-image-loading"><div class="vc-spinner" aria-hidden="true"></div><span>Ilustrando este paso...</span></div>` : ""}
            ${currentImage?.status === "ready" ? `
              <figure class="vc-cook-figure">
                <img src="${currentImage.src}" alt="${escapeHtml(current.title)}">
                <figcaption>${escapeHtml(current.title)}</figcaption>
                ${currentImage.attributionLabel
                  ? `<a class="vc-cook-image-credit" href="${escapeHtml(currentImage.attributionUrl || "#")}" target="_blank" rel="noreferrer">${escapeHtml(currentImage.attributionLabel)}</a>`
                  : ""}
              </figure>
            ` : ""}
            ${currentImage?.status === "error" ? `<div class="vc-note">La ilustración de este paso no está disponible ahora mismo.</div>` : ""}
            <p class="vc-copy vc-cook-step-copy">${renderTechniqueText(current.text)}</p>
            ${current.timerMinutes ? `
              <div class="vc-inline-actions">
                <button class="vc-button primary" data-action="start-step-timer">Comenzar cuenta regresiva</button>
              </div>
            ` : ""}
          </article>
        `}

        <div class="vc-step-foot vc-cook-foot">
          <button class="vc-button secondary" data-action="cook-stage-prev" ${stepIndex === 0 ? "disabled" : ""}>AtrÃ¡s</button>
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
    week: renderWeekView(),
    schedule: renderScheduleView(),
    shopping: renderShoppingView(),
    recipes: renderRecipesView(),
    profile: renderProfileView(),
    cook: renderCookView(),
  };

  return `
    <section class="vc-workspace">
      ${state.currentView === "cook" ? "" : renderWorkspaceHeader()}
      ${views[state.currentView] || views.week}
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
            <small class="vc-muted">${escapeHtml(day.label)} · ${escapeHtml(MEAL_LABELS[mealKey])}</small>
            <h2 class="vc-modal-title">${escapeHtml(meal.title)}</h2>
            <p class="vc-copy">${escapeHtml(meal.summary)}</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">✕</button>
        </div>
        <div class="vc-meta">
          <span class="vc-meta-pill">Tiempo: ${meal.prepMinutes} min</span>
          <span class="vc-meta-pill">Dificultad: ${escapeHtml(meal.difficulty)}</span>
          <span class="vc-meta-pill">Calorías: ${meal.calories} kcal</span>
          <span class="vc-meta-pill">Porciones: ${meal.servings}</span>
        </div>
        <div class="vc-grid two">
          <article class="vc-profile-card">
            <h3 class="vc-inline-title">Ingredientes</h3>
            <ul class="vc-list">
              ${(meal.ingredients || []).map((ingredient) => `<li>${escapeHtml(`${ingredient.name} · ${formatQuantity(ingredient.quantity, ingredient.unit)}`)}</li>`).join("")}
            </ul>
          </article>
          <article class="vc-profile-card">
            <h3 class="vc-inline-title">Nutrición aproximada</h3>
            <ul class="vc-list">
              <li>Proteína: ${meal.nutrition.protein} g</li>
              <li>Carbohidratos: ${meal.nutrition.carbs} g</li>
              <li>Grasas: ${meal.nutrition.fats} g</li>
              <li>Fibra: ${meal.nutrition.fiber} g</li>
            </ul>
          </article>
        </div>
        ${(meal.cookingSteps || []).length ? `
          <article class="vc-profile-card">
            <h3 class="vc-inline-title">Cómo se hace</h3>
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

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Ayuda de cocina</small>
            <h2 class="vc-modal-title">${escapeHtml(technique.title)}</h2>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">✕</button>
        </div>
        <article class="vc-profile-card">
          <p class="vc-copy">${escapeHtml(technique.body)}</p>
        </article>
      </div>
    </div>
  `;
}

function renderTimerModal() {
  const timer = state.cooking?.activeTimer;
  if (!timer) return "";

  return `
    <div class="vc-modal-layer" data-action="close-modal">
      <div class="vc-modal vc-timer-modal" role="dialog" aria-modal="true">
        <div class="vc-modal-head">
          <div>
            <small class="vc-muted">Cuenta regresiva</small>
            <h2 class="vc-modal-title">${escapeHtml(timer.label)}</h2>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">✕</button>
        </div>
        <div class="vc-timer-face">
          <strong>${formatCountdown(timer.remainingMs)}</strong>
          <span>${timer.durationMinutes} min</span>
        </div>
        <div class="vc-inline-actions" style="justify-content:center">
          <button class="vc-button secondary" data-action="stop-cooking-timer">Detener</button>
          <button class="vc-button primary" data-action="close-modal">Seguir cocinando</button>
        </div>
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
            <small class="vc-muted">${escapeHtml(target.day.label)} · ${escapeHtml(MEAL_LABELS[target.mealKey])}</small>
            <h2 class="vc-modal-title">Afinar gustos</h2>
            <p class="vc-copy">Cuéntame qué ha fallado en "${escapeHtml(target.meal.title)}" y te busco algo mejor.</p>
          </div>
          <button class="vc-close" data-action="close-modal" aria-label="Cerrar">✕</button>
        </div>

        <div class="vc-fieldset">
          <label class="vc-label">¿Qué ha pasado?</label>
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
            <label class="vc-label">¿Qué ingredientes prefieres evitar aquí?</label>
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
            <h2 class="vc-modal-title">¿Quieres congelar algunos ingredientes y recibir aviso para descongelarlos?</h2>
            <p class="vc-copy">VelociChef ha detectado productos que quizá quieras congelar para que aguanten mejor hasta el día del plato.</p>
          </div>
        </div>
        <article class="vc-profile-card">
          <ul class="vc-list">
            ${state.week.freezerItems.map((item) => `<li>${escapeHtml(`${item.ingredient} para ${item.mealTitle} (${formatDateLong(item.mealDate)})`)}</li>`).join("")}
          </ul>
        </article>
        <div class="vc-step-foot">
          <button class="vc-button secondary" data-action="decline-freezer">No, gracias</button>
          <button class="vc-button primary" data-action="accept-freezer">Sí, avísame</button>
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
  if (state.modal.type === "timer") {
    return `${renderTimerModal()}${renderBusyOverlay()}`;
  }
  return renderBusyOverlay();
}

function syncLayoutMetrics() {
  const topbar = root.querySelector(".vc-topbar");
  const topbarHeight = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty("--vc-topbar-current-height", `${topbarHeight}px`);
}

function render() {
  if (state.loading) {
    root.innerHTML = `${renderTopbar()}${renderLoading()}`;
    modalRoot.innerHTML = renderModal();
    repairVisibleText(root);
    repairVisibleText(modalRoot);
    window.requestAnimationFrame(syncLayoutMetrics);
    return;
  }

  const notices = [
    state.notice ? `<div class="vc-note">${escapeHtml(sanitizeUiCopy(state.notice))}</div>` : "",
    state.error ? `<div class="vc-error">${escapeHtml(sanitizeUiCopy(state.error))}</div>` : "",
  ].filter(Boolean).join("");

  const content = !state.session
    ? renderLanding()
    : (!state.profile?.onboardingCompleted || state.currentView === "onboarding")
      ? renderOnboarding()
      : renderWorkspace();

  root.innerHTML = `${renderTopbar()}${notices ? `<section class="vc-shell">${notices}</section>` : ""}${content}`;
  modalRoot.innerHTML = renderModal();
  repairVisibleText(root);
  repairVisibleText(modalRoot);
  window.requestAnimationFrame(syncLayoutMetrics);
}

function toggleFromArray(list, value) {
  const set = new Set(list || []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set);
}

function validateOnboardingStep() {
  if (state.onboardingStep === 4 && !(state.profile.plannedMeals || []).length) {
    state.error = "Marca al menos una comida para poder generar el menú.";
    render();
    return false;
  }
  if (state.onboardingStep === 4 && !state.profile.lunchTime) {
    state.error = "Necesito una hora de almuerzo para ajustar bien el plan semanal.";
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

async function saveScheduleAndContinue() {
  state.week.scheduleStepComplete = true;
  state.week.reminders = composeReminders();
  await saveProfile();
  await saveWeek();
  state.currentView = "shopping";
  render();
}

async function saveProfileSettings() {
  if (!(state.profile.plannedMeals || []).length) {
    state.error = "Marca al menos una comida para poder guardar el perfil.";
    render();
    return false;
  }
  if (!state.profile.lunchTime || !state.profile.dinnerTime) {
    state.error = "Necesito una hora de almuerzo y una hora de cena para guardar el perfil.";
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
    const note = "Prefiero platos con menos tiempo de preparación entre semana.";
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
  if (!state.profile?.notificationEnabled || !("Notification" in window) || Notification.permission !== "granted") {
    state.notice = "";
    state.error = "Activa antes las notificaciones para poder probar un aviso.";
    render();
    return;
  }

  await showBrowserNotification({
    id: `test-${Date.now()}`,
    title: "VelociChef está listo",
    body: "Este es un aviso de prueba para confirmar que las notificaciones funcionan.",
    url: `${APP_BASE_URL}?view=profile`,
  });
  state.notice = "Aviso de prueba enviado.";
  state.error = "";
  render();
}

async function handleAction(action, trigger) {
  if (action !== "toggle-menu") {
    state.activeMenu = null;
  }

  switch (action) {
    case "toggle-menu":
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
        state.error = error instanceof Error ? error.message : "No pude iniciar sesión con Google.";
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
      stopHandsFreeMode();
      if (!state.profile?.onboardingCompleted) {
        state.currentView = "onboarding";
        render();
        break;
      }
      await generateWeek(getActivePlanningStartIso());
      break;

    case "open-view": {
      const nextView = normalizeView(trigger.dataset.view || "week");
      if (nextView !== "cook") {
        stopHandsFreeMode();
      }
      state.currentView = nextView;
      render();
      break;
    }

    case "open-cook": {
      const suggested = getSuggestedCookingTarget();
      stopHandsFreeMode();
      stopCookingTimer();
      state.cooking = createCookingState(suggested ? "suggest" : "picker", suggested?.meal.id || null);
      state.currentView = "cook";
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
      render();
      break;

    case "cook-back-to-picker":
      stopHandsFreeMode();
      stopCookingTimer();
      ensureCookingState();
      state.cooking.mode = "picker";
      state.cooking.stepIndex = 0;
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

    case "finish-cooking-session":
      stopHandsFreeMode();
      stopCookingTimer();
      state.notice = "Receta terminada. Ya puedes servir el plato.";
      state.currentView = "week";
      render();
      break;

    case "toggle-hands-free":
      if (state.cooking?.handsFree) {
        stopHandsFreeMode();
        render();
      } else {
        startHandsFreeMode();
      }
      break;

    case "open-technique":
      state.modal = { type: "technique", techniqueKey: trigger.dataset.technique };
      render();
      break;

    case "start-step-timer": {
      const target = getCookingTarget();
      const current = target ? getCookingStage(target).current : null;
      if (!current?.timerMinutes) return;
      startCookingTimer(current.title, current.timerMinutes);
      break;
    }

    case "stop-cooking-timer":
      stopCookingTimer();
      state.modal = null;
      render();
      break;

    case "open-details":
      state.modal = { type: "details", mealId: trigger.dataset.mealId };
      render();
      break;

    case "close-modal":
      state.modal = null;
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
      const status = trigger.dataset.status || "need";
      state.week.shoppingList = state.week.shoppingList.map((item) => item.id === itemId ? { ...item, pantryStatus: status } : item);
      await saveWeek();
      render();
      break;
    }

    case "complete-shopping":
      await completeShoppingList();
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
      render();
      break;

    case "replan-next-week":
      await generateWeek(getActivePlanningStartIso());
      break;

    case "redo-current-week":
      if (!state.week?.startDate) return;
      await generateWeek(state.week.startDate);
      state.currentView = "recipes";
      render();
      break;

    case "logout":
      if (!state.client) return;
      stopHandsFreeMode();
      stopCookingTimer();
      state.notice = "";
      state.error = "";
      await state.client.auth.signOut();
      window.history.replaceState({}, "", APP_BASE_URL);
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
  event.preventDefault();

  if (trigger.classList.contains("vc-modal-layer") && trigger.dataset.action === "close-modal") {
    state.modal = null;
    render();
    return;
  }

  await handleAction(trigger.dataset.action, trigger);
});

document.addEventListener("click", (event) => {
  if (!state.activeMenu) return;
  if (event.target.closest(".vc-menu-wrap")) return;
  state.activeMenu = null;
  render();
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
    if (!state.activeMenu && !state.modal) return;
    state.activeMenu = null;
    if (state.modal) {
      state.modal = null;
    }
    render();
  }
});

document.addEventListener("input", (event) => {
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
  flushDueReminders();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    flushDueReminders();
  }
});

async function hydrateSession(session) {
  clearReminderTimers();
  stopHandsFreeMode();
  stopCookingTimer();
  state.session = session;
  state.activeMenu = null;
  state.cooking = null;

  if (!session?.user) {
    state.profile = null;
    state.week = null;
    state.feedback = [];
    state.currentView = "week";
    state.loading = false;
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
    state.week.reminders = state.week.reminders?.length ? state.week.reminders : composeReminders();
    await saveWeek();
    await flushDueReminders();
    scheduleReminders();
  }

  if (state.profile.notificationEnabled) {
    try {
      await ensurePushSubscription(("Notification" in window) && Notification.permission === "granted");
    } catch (_error) {
      // Si falla el push real, mantenemos al menos el fallback local.
    }
  }

  state.loading = false;
  render();
}

async function init() {
  state.client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }) || null;

  await registerServiceWorker();

  if (!state.client) {
    state.loading = false;
    state.error = "No pude abrir tu cocina ahora mismo.";
    render();
    return;
  }

  const { data } = await state.client.auth.getSession();
  await hydrateSession(data.session);

  state.client.auth.onAuthStateChange((_event, session) => {
    hydrateSession(session);
  });
}

window.addEventListener("resize", syncLayoutMetrics);
window.addEventListener("orientationchange", syncLayoutMetrics);

init();
