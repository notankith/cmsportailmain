"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const REEL_TIMES = ["00:00", "02:00", "04:00", "06:00"]
const POST_TIMES = ["00:30","01:00","01:30","02:30","03:00","03:30","04:30","05:00","05:30","06:30"]

function parseCSV(csvText: string) {
  // Very small CSV parser: headers in first row, simple comma split, handles quoted fields
  const lines = csvText.split(/\r?\n/).filter(Boolean)
  if (!lines.length) return []
  const headers = lines[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(h => h.replace(/(^\s+|\s+$|^"|"$)/g, ""))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/(^\s+|\s+$|^"|"$)/g, ""))
    const obj: any = {}
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = cols[j] ?? ""
    }
    rows.push(obj)
  }
  return rows
}

export function ScheduleManagement() {
  const [items, setItems] = useState<any[]>([])
  const [isScheduling, setIsScheduling] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  // load uploads on mount by default
  useEffect(() => {
    fetchUploads()
  }, [])

  // Fetch uploads from the existing admin API and populate items
  const fetchUploads = async () => {
    try {
      const res = await fetch('/api/admin/all-uploads')
      const data = await res.json()
      if (!Array.isArray(data)) {
        setResult({ error: 'Failed to load uploads' })
        return
      }

      // Infer media type from URL/file name, preserve order: videos first then images
  const videos: any[] = []
  const images: any[] = []
      for (const u of data) {
        const url = (u.media_url || u.media_url || u.media_url_link || '') as string
        const fname = (u.file_name || '') as string
        const lower = (url + ' ' + fname).toLowerCase()
        const isVideo = lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.webm') || lower.includes('video')
        const item = {
          file_name: fname || url,
          media_type: isVideo ? 'video' : 'image',
          media_url: url,
          description: u.caption || u.description || '',
          selected: true,
          // time will be filled below
        }
        if (isVideo) videos.push(item)
        else images.push(item)
      }

      // assign default times per index
      const normalized: any[] = []
      videos.forEach((v, idx) => normalized.push({ ...v, time: REEL_TIMES[idx] ?? '00:00' }))
      images.forEach((p, idx) => normalized.push({ ...p, time: POST_TIMES[idx] ?? '12:00' }))

      setItems(normalized)
      setResult({ loaded: normalized.length })
    } catch (err) {
      setResult({ error: (err as Error).message })
    }
  }

  const handleSchedule = async () => {
    setIsScheduling(true)
    setResult(null)
    try {
      // Build payload: only include selected items and compute scheduled_time for those with a time set
      const selectedItems = items.filter(it => it.selected)
      if (!selectedItems.length) {
        setResult({ error: 'No items selected' })
        setIsScheduling(false)
        return
      }

      const payloadItems = selectedItems.map((it) => {
        if (it.time) {
          // scheduled for tomorrow at the provided time
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          const [h, m] = it.time.split(":").map((s: string) => parseInt(s, 10) || 0)
          tomorrow.setHours(h, m, 0, 0)
          return { ...it, scheduled_time: tomorrow.toISOString() }
        }
        return it
      })

      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      })
      const json = await res.json()
      setResult(json)
    } catch (err) {
      setResult({ error: (err as Error).message })
    } finally {
      setIsScheduling(false)
    }
  }

  function defaultTimeForIndex(mediaType: string, index: number) {
    const REEL_TIMES = ["00:00", "02:00", "04:00", "06:00"]
    const POST_TIMES = ["00:30","01:00","01:30","02:30","03:00","03:30","04:30","05:00","05:30","06:30"]
    if ((mediaType || "").toLowerCase() === "video") {
      return REEL_TIMES[index] ?? "00:00"
    }
    return POST_TIMES[index] ?? "12:00"
  }

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-semibold mb-2">Schedule posts and reels</h2>

        <p className="text-sm text-gray-600 mb-4">Items are loaded from Uploads by default. Use the checkboxes to pick items and edit per-item time if needed.</p>

        <div className="flex gap-2 mb-4">
          <Button onClick={fetchUploads}>Reload uploads</Button>
          <Button variant="outline" onClick={() => { setItems([]); setResult(null) }}>Clear</Button>
        </div>

        {items.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium">Parsed items ({items.length})</h3>
            <div className="overflow-auto max-h-56 mt-2 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left"><input type="checkbox" onChange={(e) => {
                      const checked = e.target.checked
                      setItems(items.map(it => ({ ...it, selected: checked })))
                    }} checked={items.length > 0 && items.every(it => it.selected)} /></th>
                    <th className="p-2 text-left">File</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">Time (edit)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">
                        <input type="checkbox" checked={!!it.selected} onChange={(e) => {
                          const copy = [...items]
                          copy[idx] = { ...copy[idx], selected: e.target.checked }
                          setItems(copy)
                        }} />
                      </td>
                      <td className="p-2">{it.file_name}</td>
                      <td className="p-2">{it.media_type}</td>
                      <td className="p-2">
                        <div className="font-medium text-sm text-gray-900">{it.description || it.file_name}</div>
                        {it.media_url && (
                          <div className="text-xs text-gray-500 mt-1">{it.media_url}</div>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="time"
                          value={it.time || defaultTimeForIndex(it.media_type, idx)}
                          onChange={(e) => {
                            const copy = [...items]
                            copy[idx] = { ...copy[idx], time: e.target.value }
                            setItems(copy)
                          }}
                          className="border px-2 py-1 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSchedule} disabled={!items.some(it => it.selected) || isScheduling}>{isScheduling ? "Scheduling..." : "Schedule selected"}</Button>
          <Button onClick={async () => {
            // Schedule all currently loaded items
            if (!items.length) return
            setIsScheduling(true)
            setResult(null)
            try {
              const payloadItems = items.map((it) => {
                if (it.time) {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  const [h, m] = it.time.split(":").map((s: string) => parseInt(s, 10) || 0)
                  tomorrow.setHours(h, m, 0, 0)
                  return { ...it, scheduled_time: tomorrow.toISOString() }
                }
                return it
              })
              const res = await fetch("/api/admin/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: payloadItems }),
              })
              const json = await res.json()
              setResult(json)
            } catch (err) {
              setResult({ error: (err as Error).message })
            } finally {
              setIsScheduling(false)
            }
          }} disabled={!items.length || isScheduling}>
            {isScheduling ? 'Scheduling...' : 'Schedule all'}
          </Button>
          <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(JSON.stringify(items, null, 2)) }}>Copy JSON</Button>
        </div>

        {result && (
          <pre className="mt-4 max-h-64 overflow-auto bg-gray-50 p-3 text-xs rounded">{JSON.stringify(result, null, 2)}</pre>
        )}
      </CardContent>
    </Card>
  )
}

export default ScheduleManagement
