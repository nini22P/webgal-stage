export type EventCallback = (...args: unknown[]) => void

export class EventEmitter {
  private events = new Map<string, Set<EventCallback>>()

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)

    return () => this.off(event, callback)
  }

  once(event: string, callback: EventCallback): () => void {
    const wrappedCallback = (...args: unknown[]) => {
      callback(...args)
      this.off(event, wrappedCallback)
    }
    return this.on(event, wrappedCallback)
  }

  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback)
  }

  emit(event: string, ...args: unknown[]): void {
    this.events.get(event)?.forEach(cb => {
      try {
        cb(...args)
      } catch (error) {
        console.error(`[EventEmitter] Error in event handler for "${event}":`, error)
      }
    })
  }

  clear(): void {
    this.events.clear()
  }

  clearEvent(event: string): void {
    this.events.delete(event)
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0
  }
}

