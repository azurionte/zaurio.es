(() => {
  'use strict';

  const PREPROD_URL = 'https://wsdtcsjkssvdqovdpxrq.supabase.co';
  const PREPROD_KEY = 'sb_publishable_kWc68mbD1KZg9eu38KVEAA_mDARNb-e';
  const ALLOWED_EMAIL = 'dmnrobles@gmail.com';
  const PREPROD_ORIGIN = 'https://preprod.dinerozaurio.zaurio.es';
  const PROD_URL = 'https://dinerozaurio.zaurio.es';
  const SHARED_ASSET_ORIGIN = 'https://zaurio.es';

  window.__DINEROZAURIO_ENV__ = 'preprod';
  window.__DINEROZAURIO_PREPROD__ = true;
  window.__DINEROZAURIO_PREPROD_ORIGIN__ = PREPROD_ORIGIN;

  function normalizeSharedAssetUrl(value) {
    const