import { DEFAULT_SETTINGS, type ScheduleSettings } from '../../shared/schedule'
import { jsonResponse, type Env } from '../_lib/auth'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.DB.prepare('SELECT settings_json FROM site_settings WHERE id = 1').first<{ settings_json: string }>()
  if (!result) return jsonResponse({ settings: DEFAULT_SETTINGS })

  try {
    return jsonResponse({ settings: JSON.parse(result.settings_json) as ScheduleSettings })
  } catch {
    return jsonResponse({ settings: DEFAULT_SETTINGS })
  }
}