import { hasAdminSession, jsonResponse, type Env } from '../../_lib/auth'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authenticated = await hasAdminSession(request, env.ADMIN_SESSION_SECRET)
  return jsonResponse({ authenticated })
}