<?php
/**
 * DEPRECATED — GitHub Pages does not execute PHP (POST returns 405).
 *
 * Lead intake moved to Supabase (browser insert + admin.html).
 * See SUPABASE.md and optional supabase/functions/notify-lead for
 * server-side Telegram with secrets stored only in Supabase Edge Function env.
 *
 * Hardcoded Telegram / WhatsApp tokens were removed from this public file.
 * Rotate any previously exposed tokens in Telegram BotFather and Meta.
 */
header('Content-Type: application/json; charset=utf-8');
http_response_code(410);
echo json_encode([
    'success' => false,
    'message' => 'Tento endpoint je vyradený. Použite kontaktný formulár napojený na Supabase (SUPABASE.md).',
]);
