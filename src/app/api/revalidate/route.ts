// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Simple endpoint to manually trigger revalidation if needed.
// Could be secured or called by webhooks in a real app.
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '/'
  revalidatePath(path)
  console.log(`Revalidated path: ${path}`)
  return NextResponse.json({ revalidated: true, path, now: Date.now() })
}
