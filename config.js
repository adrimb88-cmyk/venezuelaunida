// ============================================================
//  CONFIGURACIÓN — VENEZUELA UNIDA
//  Rellena tus credenciales de Supabase aquí
// ============================================================

const SUPABASE_URL = 'https://gsfqjbryitlwmtulcshg.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnFqYnJ5aXRsd210dWxjc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MDM4ODMsImV4cCI6MjA5ODI3OTg4M30.R1hpRrURXeEv-Y6vInB1xgYbX2Hmc_0PpU6VZIG9coc';

// Inicializa el cliente de Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
