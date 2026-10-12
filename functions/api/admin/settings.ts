import { isValidSchedule } from '../../../shared/schedule'
import { hasAdminSession, isSameOrigin, jsonResponse, type Env } from '../../_lib/auth'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!await hasAdminSession(request, env.ADMIN_SESSION_SECRET)) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }

  const result = await env.DB.prepare('SELECT settings_json FROM site_settings WHERE id = 1').first<{ settings_json: string }>()
  return jsonResponse({ settings: result ? JSON.parse(result.settings_json) : null })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)
  if (!await hasAdminSession(request, env.ADMIN_SESSION_SECRET)) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }

  let body: { settings?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }

  if (!isValidSchedule(body.settings)) return jsonResponse({ error: 'Invalid schedule.' }, 400)

  await env.DB.prepare(
    'INSERT INTO site_settings (id, settings_json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET settings_json = excluded.settings_json',
  ).bind(JSON.stringify(body.settings)).run()

  return jsonResponse({ settings: body.settings })
}