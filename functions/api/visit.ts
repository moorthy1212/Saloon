import { isSameOrigin, jsonResponse, type Env } from '../_lib/auth'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.DB.prepare('SELECT page_views FROM site_stats WHERE id = 1').first<{ page_views: number }>()
  return jsonResponse({ pageViews: result?.page_views ?? 0 })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)

  const result = await env.DB.prepare(
    'UPDATE site_stats SET page_views = page_views + 1 WHERE id = 1 RETURNING page_views',
  ).first<{ page_views: number }>()

  if (!result) return jsonResponse({ error: 'Visitor counter is not initialized.' }, 503)
  return jsonResponse({ pageViews: result.page_views })
}