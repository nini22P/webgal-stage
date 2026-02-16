import { Howl } from 'howler'
import gsap from 'gsap'
import { BaseNode, type BaseNodeProps } from './BaseNode'

export type SfxNodeProps = Omit<BaseNodeProps, 'type' | 'tagName'> & {
  poolSize?: number
  maxConcurrent?: number
}

export class SfxNode extends BaseNode {
  private howls: Map<string, Howl> = new Map()
  private cacheQueue: string[] = []
  private activeInstances: Set<{ id: number; src: string }> = new Set()
  private pendingTimeouts: Set<number> = new Set()

  private poolSize: number
  private maxConcurrent: number

  constructor(props: SfxNodeProps) {
    super({ ...props, type: 'sfx' })
    this.poolSize = props.poolSize ?? 20
    this.maxConcurrent = props.maxConcurrent ?? 20
  }

  private getOrCreateHowl(src: string): Howl {
    if (this.howls.has(src)) {
      const idx = this.cacheQueue.indexOf(src)
      if (idx !== -1)
        this.cacheQueue.push(this.cacheQueue.splice(idx, 1)[0])
      return this.howls.get(src)!
    }

    if (this.cacheQueue.length >= this.poolSize) {
      const oldest = this.cacheQueue.shift()
      if (oldest) {
        const isPlaying = Array
          .from(this.activeInstances)
          .some(instance => instance.src === oldest)
        if (!isPlaying) {
          this.howls.get(oldest)?.unload()
          this.howls.delete(oldest)
        }
      }
    }

    const howl = new Howl({ src: [src], html5: false, preload: true })
    this.howls.set(src, howl)
    this.cacheQueue.push(src)
    return howl
  }

  public play(options: {
    src: string
    volume?: number
    loop?: number
    delay?: number | (() => number)
  }): number | null {
    const { delay = 0, loop = 1, volume = 1 } = options
    const waitTime = typeof delay === 'function' ? delay() : delay

    if (waitTime > 0) {
      const timeoutId = window.setTimeout(() => {
        this.playSfx(options.src, loop, volume)
        this.pendingTimeouts.delete(timeoutId)
      }, waitTime)
      this.pendingTimeouts.add(timeoutId)
      return null
    }

    return this.playSfx(options.src, loop, volume)
  }

  private playSfx(src: string, loopCount: number, volume: number): number | null {
    const howl = this.getOrCreateHowl(src)

    if (this.activeInstances.size >= this.maxConcurrent) {
      const oldest = this.activeInstances.values().next().value
      if (oldest) this.stop(oldest.id)
    }

    const soundId = howl.play()
    const isInfinite = loopCount === -1 || loopCount === Infinity

    howl.volume(volume, soundId)
    howl.loop(isInfinite, soundId)

    const instance = { id: soundId, src }
    this.activeInstances.add(instance)

    if (!isInfinite && loopCount > 1) {
      let remaining = loopCount - 1
      const onEnd = (id: number) => {
        if (id !== soundId)
          return
        if (remaining > 0) {
          remaining--
          howl.play(soundId)
        }
      }
      howl.on('end', onEnd, soundId)
    }

    howl.once('end', () => {
      if (!isInfinite && (howl.loop(soundId) === false)) {
        this.activeInstances.delete(instance)
      }
    }, soundId)

    return soundId
  }

  public stop(target: number | string, fade: number = 0) {
    if (typeof target === 'number') {
      const instance = Array
        .from(this.activeInstances)
        .find(instance => instance.id === target)
      if (instance)
        this.stopInstance(instance, fade)
    } else {
      const instances = Array
        .from(this.activeInstances)
        .filter(instance => instance.src === target)
      instances.forEach(instance => this.stopInstance(instance, fade))
    }
  }

  private stopInstance(instance: { id: number; src: string }, fade: number = 0) {
    const howl = this.howls.get(instance.src)
    if (!howl) return

    if (fade > 0) {
      const proxy = { volume: howl.volume(instance.id) as number }
      gsap.to(proxy, {
        volume: 0,
        duration: fade,
        ease: 'power2.in',
        onUpdate: () => { howl.volume(proxy.volume, instance.id) },
        onComplete: () => {
          howl.stop(instance.id)
          this.activeInstances.delete(instance)
        }
      })
    } else {
      howl.stop(instance.id)
      this.activeInstances.delete(instance)
    }
  }

  public stopAll(fade: number = 0) {
    this.pendingTimeouts.forEach(id => clearTimeout(id))
    this.pendingTimeouts.clear()

    if (fade <= 0) {
      this.howls.forEach(h => h.stop())
      this.activeInstances.clear()
    } else {
      this.activeInstances.forEach(instance => this.stopInstance(instance, fade))
    }
  }

  public clearCache() {
    this.stopAll()
    this.howls.forEach(h => h.unload())
    this.howls.clear()
    this.cacheQueue = []
  }

  public override destroy(): void {
    this.clearCache()
    super.destroy()
  }
}