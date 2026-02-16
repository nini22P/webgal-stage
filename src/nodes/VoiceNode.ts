import { Howl } from 'howler'
import gsap from 'gsap'
import { BaseNode, type BaseNodeProps } from './BaseNode'
import { Logger } from '../utils/Logger'

export type VoiceNodeProps = Omit<BaseNodeProps, 'type' | 'tagName'> & {
  poolSize?: number
}

interface VoiceInstance {
  speaker: string
  src: string
  onComplete?: () => void
  onUpdate?: (progress: number, currentTime: number) => void
}

export class VoiceNode extends BaseNode {
  private howls: Map<string, Howl> = new Map()
  private cacheQueue: string[] = []
  private activeInstances: Map<number, VoiceInstance> = new Map()
  private poolSize: number

  constructor(props: VoiceNodeProps) {
    super({ ...props, type: 'voice' })
    this.poolSize = props.poolSize ?? 10
  }

  private getOrCreateHowl(src: string): Howl {
    if (this.howls.has(src)) {
      const idx = this.cacheQueue.indexOf(src)
      if (idx !== -1) this.cacheQueue.push(this.cacheQueue.splice(idx, 1)[0])
      return this.howls.get(src)!
    }

    if (this.cacheQueue.length >= this.poolSize) {
      const oldest = this.cacheQueue.shift()
      if (oldest) {
        this.howls.get(oldest)?.unload()
        this.howls.delete(oldest)
      }
    }

    const howl = new Howl({ src: [src], html5: true, preload: true })
    this.howls.set(src, howl)
    this.cacheQueue.push(src)
    return howl
  }

  public async play(options: {
    src: string
    volume?: number
    speaker?: string
    interrupt?: 'all' | 'self' | 'none'
    onComplete?: () => void
    onUpdate?: (progress: number, currentTime: number) => void
  }): Promise<number | null> {
    const {
      src,
      volume = 1,
      speaker = 'default',
      interrupt = 'all',
      onComplete,
      onUpdate,
    } = options

    for (const [id, instance] of this.activeInstances) {
      if (instance.speaker === speaker && instance.src === src) {
        const howl = this.howls.get(src)
        if (howl?.playing(id)) {
          howl.seek(0, id)
          howl.volume(volume, id)
          instance.onComplete = onComplete
          return id
        }
      }
    }

    if (interrupt === 'all') {
      this.stopAll(0.1)
    } else if (interrupt === 'self') {
      this.stop(speaker, 0.1)
    }

    const howl = this.getOrCreateHowl(src)

    try {
      if (howl.state() !== 'loaded') {
        await new Promise<void>((resolve, reject) => {
          howl.once('load', () => resolve())
          howl.once('loaderror', (_, e) => reject(e))
          setTimeout(() => reject(new Error('Voice load timeout')), 8000)
        })
      }

      const soundId = howl.play()
      howl.volume(volume, soundId)

      const instance: VoiceInstance = { speaker, src, onComplete, onUpdate }
      this.activeInstances.set(soundId, instance)

      howl.once('end', () => {
        instance.onComplete?.()
        this.activeInstances.delete(soundId)
      }, soundId)

      return soundId
    } catch (error) {
      Logger.error('VoiceNode Play Error:', error)
      onComplete?.()
      return null
    }
  }

  public stop(speaker: string, fade: number = 0) {
    this.activeInstances.forEach((instance, id) => {
      if (instance.speaker === speaker) {
        this.stopInstance(id, fade)
      }
    })
  }

  public stopAll(fade: number = 0) {
    if (fade <= 0) {
      this.howls.forEach(h => h.stop())
      this.activeInstances.clear()
    } else {
      const ids = Array.from(this.activeInstances.keys())
      ids.forEach(id => this.stopInstance(id, fade))
    }
  }

  private stopInstance(id: number, fade: number = 0) {
    const instance = this.activeInstances.get(id)
    if (!instance) return

    const howl = this.howls.get(instance.src)
    if (!howl) return

    if (fade > 0) {
      const proxy = { volume: howl.volume(id) as number }
      gsap.to(proxy, {
        volume: 0,
        duration: fade,
        onUpdate: () => { howl.volume(proxy.volume, id) },
        onComplete: () => {
          howl.stop(id)
          this.activeInstances.delete(id)
        }
      })
    } else {
      howl.stop(id)
      this.activeInstances.delete(id)
    }
  }

  public override destroy(): void {
    this.stopAll()
    this.howls.forEach(h => h.unload())
    this.howls.clear()
    this.cacheQueue = []
    super.destroy()
  }
}