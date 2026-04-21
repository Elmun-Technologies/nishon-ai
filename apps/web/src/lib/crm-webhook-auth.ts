export function verifyCrmWebhook(req: Request): boolean {
  const secret = process.env.CRM_WEBHOOK_SECRET
  if (!secret) return true
  return req.headers.get('x-crm-webhook-secret') === secret
}
