/**
 * Cron-callable endpoint — call this daily via Vercel Cron, GitHub Actions, etc.
 *
 * Vercel cron example (vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/digest", "schedule": "0 9 * * *" }]
 * }
 *
 * GitHub Actions / external cron:
 *   curl -X POST https://your-domain.com/api/cron/digest \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return forwardToSendDigest(request)
}

export async function POST(request: NextRequest) {
  return forwardToSendDigest(request)
}

async function forwardToSendDigest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Vercel Cron passes its own token; also allow direct bearer token
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host')}`

  const res = await fetch(`${baseUrl}/api/send-digest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cronSecret ?? ''}`,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
