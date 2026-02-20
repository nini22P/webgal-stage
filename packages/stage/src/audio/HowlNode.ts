import gsap from 'gsap'
import { Howl } from 'howler'
import { DomBaseNode } from '../core/dom/DomBaseNode'
import type { NodeProps } from '../core/base/BaseNode'

export interface SoundInstance {
  id: number;
  src: string;
  speakerId?: string;
  startTime: number;
}

export interface HowlInstance {
  howl: Howl;
  src: string;
  sounds: Map<number, SoundInstance>;
  lastUsed: number;
}

export interface HowlNodeProps extends NodeProps {
  poolSize?: number
}

export abstract class HowlNode extends DomBaseNode {
  protected _howls: Map<string, HowlInstance> = new Map()
  protected _poolSize: number

  private _howlTweens: Map<string, { proxy: { volume: number } }> = new Map()

  constructor(props: HowlNodeProps) {
    super(props)
    this._poolSize = props.poolSize ?? 10
  }

  protected _getHowlInstance({ src, html5 = false, volume = 1 }: { src: string, html5?: boolean, volume?: number }): HowlInstance {
    const howlInstance = this._howls.get(src)

    if (howlInstance) {
      howlInstance.lastUsed = Date.now()
      return howlInstance
    }

    this._purgeCache()

    const howl = new Howl({ src: [src], html5, preload: true, volume })

    const instance: HowlInstance = {
      howl,
      src,
      sounds: new Map(),
      lastUsed: Date.now()
    }

    this._howls.set(src, instance)
    return instance
  }

  protected _removeAudioInstance(howl: HowlInstance, soundId: number) {
    howl.sounds.delete(soundId)
    howl.lastUsed = Date.now()
  }

  private _purgeCache() {
    if (this._howls.size < this._poolSize) {
      return
    }

    const idleHowls = Array.from(this._howls.values())
      .filter(howl => howl.sounds.size === 0)
      .sort((a, b) => a.lastUsed - b.lastUsed)

    const oldest = idleHowls.shift()
    if (oldest) {
      oldest.howl.unload()
      this._howls.delete(oldest.src)
    }
  }

  protected async _waitLoaded(howl: Howl): Promise<void> {
    if (howl.state() === 'loaded')
      return

    let timeoutId: number | undefined = undefined
    const cleanup = () => {
      howl.off('load')
      howl.off('loaderror')
      clearTimeout(timeoutId)
    }

    try {
      await Promise.race([
        new Promise<void>((resolve) => howl.once('load', () => resolve())),
        new Promise<void>((_, reject) => howl.once('loaderror', (_, e) => reject(e))),
        new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Audio load timeout')), 8000)
        })
      ])
    } finally {
      cleanup()
    }
  }

  protected async _fadeHowl(
    howlInstance: HowlInstance,
    options: {
      volume: number;
      fade: number;
      soundId: number;
      onComplete?: () => void;
    }
  ): Promise<void> {
    const { volume, fade, soundId, onComplete } = options
    const howl = howlInstance.howl

    const tweenKey = `${howlInstance.src}_${soundId}`

    const existing = this._howlTweens.get(tweenKey)
    if (existing) {
      gsap.killTweensOf(existing.proxy)
      this._howlTweens.delete(tweenKey)
    }

    const currentVolume = howl.volume(soundId) as number
    const targetVolume = Math.max(0, Math.min(1, volume))

    if (fade <= 0) {
      howl.volume(targetVolume, soundId)
      onComplete?.()
      return Promise.resolve()
    }

    const proxy = { volume: currentVolume }
    this._howlTweens.set(tweenKey, { proxy })

    return new Promise((resolve) => {
      gsap.to(proxy, {
        volume: targetVolume,
        duration: fade,
        ease: targetVolume > currentVolume ? 'sine.out' : 'sine.in',
        overwrite: 'auto',
        onUpdate: () => {
          if (howl.state() === 'unloaded')
            return
          howl.volume(proxy.volume, soundId)
        },
        onComplete: () => {
          onComplete?.()
          resolve()
        },
        onInterrupt: resolve
      })
    })
  }

  public abstract play(...args: unknown[]): Promise<SoundInstance>

  public abstract stop(...args: unknown[]): Promise<void>

  public stopAll(fade: number = 0) {
    this._howls.forEach(howlInstance => {
      if (fade <= 0) {
        this._killTweensBySrc(howlInstance.src)
        howlInstance.howl.stop()
        howlInstance.sounds.clear()
      } else {
        Array.from(howlInstance.sounds.values()).forEach(sound => {
          this._fadeHowl(howlInstance, {
            volume: 0,
            fade,
            soundId: sound.id,
            onComplete: () => {
              howlInstance.howl.stop(sound.id)
              this._removeAudioInstance(howlInstance, sound.id)
            }
          })
        })
      }
    })
  }

  protected _killTweensBySrc(src: string) {
    this._howlTweens.forEach((val, key) => {
      if (key.startsWith(`${src}_`)) {
        gsap.killTweensOf(val.proxy)
        this._howlTweens.delete(key)
      }
    })
  }

  protected *_activeSoundsIterator() {
    for (const howlInstance of this._howls.values()) {
      for (const sound of howlInstance.sounds.values()) {
        yield { howlInstance, sound }
      }
    }
  }

  protected get _totalActiveCount(): number {
    let count = 0
    for (const howlInstance of this._howls.values()) {
      count += howlInstance.sounds.size
    }
    return count
  }

  public override destroy(): void {
    this._howlTweens.forEach(val => {
      gsap.killTweensOf(val.proxy)
    })
    this._howlTweens.clear()
    this.stopAll()
    this._howls.forEach(h => h.howl.unload())
    this._howls.clear()
    super.destroy()
  }
}