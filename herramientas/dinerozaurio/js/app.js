// Importa el estado global desde utils.js (state.js solo exporta supabase y auth helpers)
import { state } from './utils.js';
// Importa helpers de formato y fechas desde forecast.js (utils.js no exporta estas funciones)
import { euros, h, ymNow } from './forecast.js';
// buildMonthForecast y buildForecastSeries se definen en db.js, no en forecast.js
import { buildForecastSeries, buildMonthForecast } from './db.js';
// Importa el resto de funciones de db.js como espacio de nombres
import * as db from './db.js';

const $ = (s) => document.querySelector(s);

// ... el resto del archivo permanece igual ...
