import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useRef } from 'react'

type Handlers = Record<string, (data: unknown) => void>

function getToken() {
  return localStorage.getItem('accessToken')
}

export function useSSE(url: string | null, handlers: Handlers) {
  const handlersRef = useRef<Handlers>(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!url) return

    const controller = new AbortController()

    fetchEventSource(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      // Reconnect on transient failures
      onopen: async (res) => {
        if (!res.ok) throw new Error(`SSE open failed: ${res.status}`)
      },
      onmessage: (msg) => {
        if (!msg.event || msg.event === 'ping') return
        try {
          handlersRef.current[msg.event]?.(JSON.parse(msg.data))
        } catch {
          /* ignora payloads SSE malformados */
        }
      },
      onerror: (err) => {
        // Let the library retry on network errors; stop on auth errors
        if (err instanceof Error && err.message.includes('401')) {
          controller.abort()
        }
      },
    })

    return () => controller.abort()
  }, [url])
}
