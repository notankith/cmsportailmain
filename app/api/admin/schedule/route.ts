import { NextResponse } from "next/server"

// Credentials stored in code as requested (BE CAREFUL: this is not secure for production)
const PAGE_ID = "111378218725444"
const PAGE_TOKEN = "EAAP0KOQBsdkBP5ge4mZCDXZAedk2VimjiqgY51nDs2ARtU3rKDe2XZBSJIk0o7fJq4XI39OTYiKVLQ5q42Y5bQ7BqMv8R4ibUlZBIVVwpoRYcFUdCep3CExahObefYpDEfz6IAmnuS80pUekow6rgdRI8loUgvuiBm80RD8E9KcyntEAEGyoGlEoXWdKwpflVv1m1OIZD"

// Fixed schedule times for tomorrow (same as schedule.py)
const REEL_TIMES = ["00:00", "02:00", "04:00", "06:00"]
const POST_TIMES = ["00:30","01:00","01:30","02:30","03:00","03:30","04:30","05:00","05:30","06:30"]

async function schedulePost(item: any, scheduledTime: Date) {
  const timestamp = Math.floor(scheduledTime.getTime() / 1000)

  if ((item.media_type || "").toLowerCase() === "video") {
    const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/videos`
    const payload: any = new URLSearchParams()
    payload.append("description", item.description || "")
    payload.append("file_url", item.media_url || "")
    payload.append("published", "false")
    payload.append("scheduled_publish_time", String(timestamp))
    payload.append("access_token", PAGE_TOKEN)

    const res = await fetch(url, { method: "POST", body: payload })
    return res.json()
  } else {
    const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/feed`
    const payload = new URLSearchParams()
    payload.append("message", item.description || "")
    if (item.media_url) payload.append("link", item.media_url)
    payload.append("published", "false")
    payload.append("scheduled_publish_time", String(timestamp))
    payload.append("access_token", PAGE_TOKEN)

    const res = await fetch(url, { method: "POST", body: payload })
    return res.json()
  }
}

export async function POST(request: Request) {
  try {
    // use hard-coded PAGE_TOKEN as provided above

    const body = await request.json()
    const items: any[] = Array.isArray(body.items) ? body.items : []

    if (!items.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    // schedule date = tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0,0,0,0)

    const scheduledResults: any[] = []

    const reels = items.filter(i => (i.media_type || "").toLowerCase() === "video")
    const posts = items.filter(i => (i.media_type || "").toLowerCase() === "image")

    // schedule reels (use per-item scheduled_time if provided, otherwise default slots)
    for (let i = 0; i < reels.length; i++) {
      const item = reels[i]
      let scheduled: Date
      if (item.scheduled_time) {
        scheduled = new Date(item.scheduled_time)
      } else if (i < REEL_TIMES.length) {
        const [hourStr, minuteStr] = REEL_TIMES[i].split(":")
        scheduled = new Date(tomorrow)
        scheduled.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0)
      } else {
        // fallback: next available hour
        scheduled = new Date(tomorrow)
        scheduled.setHours(12 + i, 0, 0, 0)
      }

      const res = await schedulePost(item, scheduled)
      scheduledResults.push({ item, scheduled_time: scheduled.toISOString(), response: res })
    }

    // schedule posts (use per-item scheduled_time if provided, otherwise default slots)
    for (let i = 0; i < posts.length; i++) {
      const item = posts[i]
      let scheduled: Date
      if (item.scheduled_time) {
        scheduled = new Date(item.scheduled_time)
      } else if (i < POST_TIMES.length) {
        const [hourStr, minuteStr] = POST_TIMES[i].split(":")
        scheduled = new Date(tomorrow)
        scheduled.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0)
      } else {
        scheduled = new Date(tomorrow)
        scheduled.setHours(18 + i, 0, 0, 0)
      }

      const res = await schedulePost(item, scheduled)
      scheduledResults.push({ item, scheduled_time: scheduled.toISOString(), response: res })
    }

    return NextResponse.json({ success: true, scheduled: scheduledResults })
  } catch (error) {
    console.error("Schedule API error:", error)
    return NextResponse.json({ error: "Scheduling failed" }, { status: 500 })
  }
}

export const runtime = "nodejs"
