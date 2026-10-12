import { clearedSessionCookie, isSameOrigin, jsonResponse, type Env } from '../../_lib/auth'

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)
  return jsonResponse({ authenticated: false }, 200, { 'Set-Cookie': clearedSessionCookie(request) })
}