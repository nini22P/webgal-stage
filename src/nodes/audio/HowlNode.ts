import gsap from 'gsap'
import { Howl } from 'howler'
import { BaseNode, type BaseNodeProps } from '../BaseNode'

export interface SoundInstance {
  id: number;
  speakerId?: string;
  startTime: number;
}

export interface HowlInstance {
  howl: Howl;
  src: string;
  sounds: Set<SoundInstance>;
  lastUsed: number;
}

export interface HowlNodeProps extends BaseNodeProps {
  poolSize?: number
}

export abstract class HowlNode extends BaseNode {
  protected howls: Map<string, HowlInstance> = new Map()
  protected poolSize: number

  constructor(props: BaseNodeProps & { poolSize?: number }) {
    super(props)
    this.poolSize = props.poolSize ?? 10
  }

  protected getHowlInstance(src: string, html5 = false): HowlInstance {
    const howlInstance = this.howls.get(src)

    if (howlInstance) {
      howlInstance.lastUsed = Date.now()
      return howlInstance
    }

    this.purgeCache()

    const howl = new Howl({ src: [src], html5, preload: true })

    const instance: HowlInstance = {
      howl,
      src,
      sounds: new Set(),
      lastUsed: Date.now()
    }

    this.howls.set(src, instance)
    return instance
  }

  protected removeAudioInstance(howl: HowlInstance, soundId: number) {
    howl.sounds.forEach(sound => {
      if (sound.id === soundId)
        howl.sounds.delete(sound)
    })
    howl.lastUsed = Date.now()
  }

  private purgeCache() {
    if (this.howls.size < this.poolSize) {
      return
    }

    const idleHowls = Array.from(this.howls.values())
      .filter(howl => howl.sounds.size === 0)
      .sort((a, b) => a.lastUsed - b.lastUsed)

    const oldest = idleHowls.shift()
    if (oldest) {
      oldest.howl.unload()
      this.howls.delete(oldest.src)
    }
  }

  protected async waitLoaded(howl: Howl): Promise<void> {
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

  protected async fadeHowl(
    howlInstance: HowlInstance,
    options: {
      volume: number;
      fade: number;
      soundId?: number;
      onComplete?: () => void;
    }
  ): Promise<void> {
    const { volume, fade, soundId, onComplete } = options
    const howl = howlInstance.howl

    gsap.killTweensOf(howl)

    const currentVolume = soundId !== undefined ? howl.volume(soundId) as number : howl.volume()
    const targetVolume = Math.max(0, Math.min(1, volume))

    if (fade <= 0) {
      if (soundId !== undefined)
        howl.volume(targetVolume, soundId)
      else
        howl.volume(targetVolume)
      onComplete?.()
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const proxy = { volume: currentVolume }
      gsap.to(proxy, {
        volume: targetVolume,
        duration: fade,
        ease: targetVolume > currentVolume ? 'power1.out' : 'power2.in',
        overwrite: 'auto',
        onUpdate: () => {
          if (soundId !== undefined)
            howl.volume(proxy.volume, soundId)
          else
            howl.volume(proxy.volume)
        },
        onComplete: () => {
          onComplete?.()
          resolve()
        },
        onInterrupt: resolve
      })
    })
  }

  public abstract play(...args: unknown[]): Promise<number>

  public abstract stop(...args: unknown[]): Promise<void>

  public stopAll(fade: number = 0) {
    this.howls.forEach(howlInstance => {
      if (fade <= 0) {
        howlInstance.howl.stop()
        howlInstance.sounds.clear()
      } else {
        Array.from(howlInstance.sounds).forEach(sound => {
          this.fadeHowl(howlInstance, {
            volume: 0,
            fade,
            soundId: sound.id,
            onComplete: () => {
              howlInstance.howl.stop(sound.id)
              this.removeAudioInstance(howlInstance, sound.id)
            }
          })
        })
      }
    })
  }

  public destroy(): void {
    this.stopAll()
    this.howls.forEach(h => h.howl.unload())
    this.howls.clear()
    super.destroy()
  }
}