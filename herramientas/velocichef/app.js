const SUPABASE_URL = "https://adpjitccwwvlydrtvvqk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_D8CL0HI8vLfD5L3g5ZgUGg_HOM6Ixdk";
const APP_PATH = "/velocichef";
const APP_BASE_URL = `${window.location.origin}${APP_PATH}/`;
const APP_ASSET_PATH = `${APP_PATH}/assets`;
const APP_LOGO_PATH = `${APP_ASSET_PATH}/logo.png`;
const APP_STORE_ICON_PATH = `${APP_ASSET_PATH}/store_icon.png`;
const PUSH_PUBLIC_KEY_ENDPOINT = "/api/velocichef/push-public-key";
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
};

function normalizeView(view) {
  const valid = new Set(["week", "schedule", "shopping", "recipes", "profile", "onboarding"]);
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

function uniqueValues(values) {
  return Array.from(new Set((values || []).filter(Boolean).map((item) => String(item).trim()).filter(Boolean)));
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
  const fallback = readLocal("week", null);
  if (!state.client || !state.session?.user) {
    state.storageMode = "local";
    return fallback;
  }

  try {
    const { data, error } = await state.client
      .from("velocichef_weeks")
      .select("*")
      .eq("user_id", state.session.user.id)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data?.week_payload) {
      state.storageMode = "supabase";
      writeLocal("week", data.week_payload);
      return normalizeWeek(data.week_payload);
    }
  } catch (_error) {
    state.storageMode = "local";
  }

  return fallback ? normalizeWeek(fallback) : null;
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

function normalizeMeal(mealKey, meal, dayDate) {
  const fallbackTitle = `${MEAL_LABELS[mealKey] || "Comida"} sugerida`;
  const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients.map(normalizeIngredient).filter((item) => item.name) : [];
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
        ? "Notificaciones push activadas. Te avisaré aunque la app no esté abierta."
        : "Las notificaciones del navegador están activadas, pero este dispositivo no expone Push API. Mantengo el recordatorio local cuando la app esté abierta.";
      state.error = "";
      return true;
    } catch (error) {
      state.profile.notificationEnabled = true;
      await saveProfile();
      state.notice = "Permiso concedido, pero no pude completar la suscripción push. Te dejo el sistema local activo y podrás reintentar desde el perfil.";
      state.error = error instanceof Error ? error.message : "No pude registrar la suscripción push.";
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
    throw new Error("Supabase no está disponible.");
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
    throw new Error("Supabase no esta disponible.");
  }

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

  const callEndpoint = async (token) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/velocichef-plan-week`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
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

  if (!response.ok || payload?.ok === false) {
    const { data, error } = await state.client.functions.invoke("velocichef-plan-week", {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!error && data?.ok !== false) {
      return data;
    }

    throw new Error(payload?.error || error?.message || `La funcion respondio con ${response.status}.`);
  }

  return payload;
}

async function generateWeek(startDate = getTomorrowIso()) {
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
    state.notice = "No pude alcanzar Gemini ahora mismo, así que he dejado una semana de muestra editable para que la app siga funcionando.";
    state.notice = "No pude cerrar la generacion real en este intento, asi que he dejado una semana de muestra editable para que sigas avanzando.";
    state.error = `Detalle tecnico: ${_error instanceof Error ? _error.message : "No he podido generar el menu real."}`;
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
    state.notice = "Gemini no respondió a tiempo y te he puesto una alternativa local para no frenarte.";
    state.notice = "No he podido traer una alternativa real ahora mismo y te he puesto una opcion local para no frenarte.";
    state.error = `Detalle tecnico: ${_error instanceof Error ? _error.message : "No he podido sustituir el plato con Gemini."}`;
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
          <p class="vc-muted">Estoy preparando tu perfil, tus menús y la conexión con Supabase.</p>
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
  const zaurioMenuOpen = state.activeMenu === "zaurio";
  const userMenuOpen = state.activeMenu === "user";
  const displayName = state.profile?.displayName || getUserLabel(user);
  const notificationState = state.profile?.notificationEnabled ? "Push activo" : "Avisos pendientes";
  const shoppingState = state.week
    ? (state.week.shoppingCompleted ? "Compra cerrada" : "Compra pendiente")
    : "Sin semana activa";

  return `
    <header class="vc-topbar vc-card">
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
            <span class="vc-z-mark">Z</span>
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
              <button class="vc-menu-action" type="button" data-action="open-view" data-view="profile" role="menuitem">Notificaciones</button>
              <div class="vc-menu-meta">
                ${getStorageBadge()}
                <span class="vc-meta-pill">${escapeHtml(notificationState)}</span>
              </div>
              <button class="vc-menu-action vc-menu-action-danger" type="button" data-action="logout" role="menuitem">Salir</button>
            </div>
          </div>
        ` : `
          <button class="vc-button secondary vc-nav-login" type="button" data-action="login-google">Entrar con Google</button>
        `}
      </div>
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
              <span class="vc-meta-pill">Google login</span>
              <span class="vc-meta-pill">Gemini</span>
              <span class="vc-meta-pill">Supabase</span>
              <span class="vc-meta-pill">Mobile first</span>
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
              <span class="vc-muted">Gemini arma platos con calorías y reutilización de ingredientes.</span>
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
      copy: "Primero vamos con alergias y límites claros. Puedes marcar varias y dejar notas concretas para Gemini.",
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
          <span class="vc-helper">Esto se usará para ajustar recordatorios y para que Gemini tenga en cuenta tu ritmo real.</span>
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

function getStorageBadge() {
  return state.storageMode === "local"
    ? `<span class="vc-meta-pill">Guardado local</span>`
    : `<span class="vc-meta-pill">Supabase</span>`;
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
          ${getStorageBadge()}
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
  const memberNotes = state.profile.householdMembers.filter((member) => !member.sameAsMe && member.notes);
  const pushCapable = "PushManager" in window;
  return `
    <section class="vc-grid">
      <article class="vc-panel">
        <span class="vc-eyebrow">Perfil y preferencias</span>
        <h2 class="vc-title">Lo que VelociChef sabe de tu cocina</h2>
        <p class="vc-copy">Tus ajustes guardados se reutilizan cuando programes la siguiente semana.</p>
      </article>

      <div class="vc-profile-grid">
        <article class="vc-profile-card">
          <small class="vc-muted">Alergias</small>
          <h3 class="vc-inline-title">${state.profile.allergies.length ? escapeHtml(state.profile.allergies.join(", ")) : "Sin alergias marcadas"}</h3>
          <p class="vc-copy">${escapeHtml(state.profile.allergyNotes || "No hay notas extra.")}</p>
        </article>
        <article class="vc-profile-card">
          <small class="vc-muted">Gustos</small>
          <h3 class="vc-inline-title">${state.profile.likes.length ? escapeHtml(state.profile.likes.slice(0, 4).join(", ")) : "Todavía sin favoritos"}</h3>
          <p class="vc-copy">${escapeHtml(state.profile.dietaryNotes || "Sin notas extra de textura o estilo.")}</p>
        </article>
        <article class="vc-profile-card">
          <small class="vc-muted">Objetivos</small>
          <h3 class="vc-inline-title">${state.profile.goalTags.length ? escapeHtml(state.profile.goalTags.join(", ")) : "Sin objetivos concretos"}</h3>
          <p class="vc-copy">Nivel de cocina: ${escapeHtml(COOKING_STYLE_OPTIONS.find((item) => item.key === state.profile.cookingStyle)?.label || "Equilibrado")}</p>
        </article>
        <article class="vc-profile-card">
          <small class="vc-muted">Hogar</small>
          <h3 class="vc-inline-title">${state.profile.householdCount} ${state.profile.householdCount === 1 ? "persona" : "personas"}</h3>
          <p class="vc-copy">${memberNotes.length ? escapeHtml(memberNotes.map((member) => `${member.name}: ${member.notes}`).join(" · ")) : "El resto de personas comparten tus preferencias."}</p>
        </article>
        <article class="vc-profile-card">
          <small class="vc-muted">Horarios</small>
          <h3 class="vc-inline-title">Almuerzo ${escapeHtml(formatTime(state.profile.lunchTime))} · Cena ${escapeHtml(formatTime(state.profile.dinnerTime))}</h3>
          <p class="vc-copy">Recordatorio ${state.profile.reminderLeadMinutes} minutos antes. ${state.profile.lunchPrepNightBefore ? "El almuerzo se cocina la noche anterior." : "El almuerzo se prepara el mismo día."}</p>
        </article>
        <article class="vc-profile-card">
          <small class="vc-muted">Avisos</small>
          <h3 class="vc-inline-title">${state.profile.notificationEnabled ? "Notificaciones activadas" : "Notificaciones pendientes"}</h3>
          <p class="vc-copy">${state.profile.freezeNotificationsEnabled ? "También se usarán para recordar descongelados." : "Los avisos de congelado siguen desactivados."} ${pushCapable ? "Este dispositivo soporta push real." : "Este dispositivo solo permite el recordatorio local cuando la app está abierta."}</p>
          <div class="vc-inline-actions">
            <button class="vc-button secondary" data-action="request-notifications">${state.profile.notificationEnabled ? "Reactivar push" : "Activar avisos"}</button>
            <button class="vc-button ghost" data-action="test-notification">Probar aviso</button>
            <button class="vc-button ghost" data-action="restart-onboarding">Editar perfil</button>
          </div>
        </article>
      </div>
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
  };

  return `
    <section class="vc-workspace">
      ${renderWorkspaceHeader()}
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
  return renderBusyOverlay();
}

function render() {
  if (state.loading) {
    root.innerHTML = `${renderTopbar()}${renderLoading()}`;
    modalRoot.innerHTML = renderModal();
    return;
  }

  const notices = [
    state.notice ? `<div class="vc-note">${escapeHtml(state.notice)}</div>` : "",
    state.error ? `<div class="vc-error">${escapeHtml(state.error)}</div>` : "",
  ].filter(Boolean).join("");

  const content = !state.session
    ? renderLanding()
    : (!state.profile?.onboardingCompleted || state.currentView === "onboarding")
      ? renderOnboarding()
      : renderWorkspace();

  root.innerHTML = `${renderTopbar()}${notices ? `<section class="vc-shell">${notices}</section>` : ""}${content}`;
  modalRoot.innerHTML = renderModal();
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
  await generateWeek(getTomorrowIso());
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
      await generateWeek(getTomorrowIso());
      break;

    case "plan-new-week":
      if (!state.profile?.onboardingCompleted) {
        state.currentView = "onboarding";
        render();
        break;
      }
      await generateWeek(state.week ? addDays(state.week.endDate, 1) : getTomorrowIso());
      break;

    case "open-view":
      state.currentView = normalizeView(trigger.dataset.view || "week");
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
      await generateWeek(addDays(state.week.endDate, 1));
      break;

    case "logout":
      if (!state.client) return;
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
  if (event.key !== "Escape") return;
  if (!state.activeMenu && !state.modal) return;
  state.activeMenu = null;
  if (state.modal) {
    state.modal = null;
  }
  render();
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
  state.session = session;
  state.activeMenu = null;

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
    state.error = "No pude inicializar Supabase en esta sesión.";
    render();
    return;
  }

  const { data } = await state.client.auth.getSession();
  await hydrateSession(data.session);

  state.client.auth.onAuthStateChange((_event, session) => {
    hydrateSession(session);
  });
}

init();
