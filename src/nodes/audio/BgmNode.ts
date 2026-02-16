import { Logger } from '../../utils/Logger'
import { HowlNode, type HowlNodeProps } from './HowlNode'

export type BgmNodeProps = Omit<HowlNodeProps, 'type' | 'tagName'>

export class BgmNode extends HowlNode {
  private currentSrc: string | null = null
  private targetVolume: number = 1

  constructor(props: BgmNodeProps) {
    super({ ...props, type: 'bgm' })
  }

  public preload(src: string): void {
    if (!src || src === this.currentSrc) return
    Logger.info(`Preloading BGM: ${src}`)
    this.getHowlInstance(src, true)
  }

  public async play(options: {
    src?: string;
    loop?: boolean;
    volume?: number;
    fade?: number;
  } = {}): Promise<number> {
    const fadeTime = options.fade ?? 0
    const volume = options.volume ?? this.targetVolume
    if (options.volume !== undefined)
      this.targetVolume = volume

    if (!options.src || options.src === this.currentSrc) {
      const currentHowl = this.currentHowl
      if (currentHowl) {
        currentHowl.howl.loop(options.loop ?? currentHowl.howl.loop())
        if (!currentHowl.howl.playing()) {
          currentHowl.howl.volume(0)
          currentHowl.howl.play()
        }
        await this.fadeHowl(currentHowl, { volume, fade: fadeTime })
        return currentHowl.sounds.values().next().value?.id ?? 0
      }
      return 0
    }

    const oldSrc = this.currentSrc
    const newSrc = options.src
    const newHowl = this.getHowlInstance(newSrc, true)

    try {
      await this.waitLoaded(newHowl.howl)

      const soundId = newHowl.howl.play()
      newHowl.sounds.clear()
      newHowl.sounds.add({ id: soundId, startTime: Date.now() })
      newHowl.howl.volume(0, soundId)
      newHowl.howl.loop(options.loop ?? true, soundId)

      const fadeTasks: Promise<void>[] = []

      this.currentSrc = newSrc

      if (oldSrc) {
        const oldHowl = this.howls.get(oldSrc)
        if (oldHowl) {
          fadeTasks.push(this.fadeHowl(oldHowl, {
            volume: 0,
            fade: fadeTime,
            onComplete: () => {
              oldHowl.howl.stop()
              oldHowl.sounds.clear()
            }
          }))
        }
      }

      fadeTasks.push(this.fadeHowl(newHowl, {
        volume,
        fade: fadeTime,
        soundId
      }))

      await Promise.all(fadeTasks)

      return soundId
    } catch (e) {
      Logger.error('BGM Switch Error:', e)
      return 0
    }
  }

  public async pause(fade: number = 0): Promise<void> {
    const currentHowl = this.currentHowl
    if (currentHowl) {
      await this.fadeHowl(currentHowl, {
        volume: 0,
        fade,
        onComplete: () => currentHowl.howl.pause()
      })
    }
  }

  public async stop(fade: number = 0): Promise<void> {
    const currentHowl = this.currentHowl
    if (currentHowl) {
      await this.fadeHowl(currentHowl, {
        volume: 0,
        fade,
        onComplete: () => {
          currentHowl.howl.stop()
          currentHowl.sounds.clear()
          this.currentSrc = null
        }
      })
    }
  }

  public async resume(fade: number = 0): Promise<number> {
    return await this.play({ fade })
  }

  public async fade(volume: number, fade: number = 0): Promise<void> {
    this.targetVolume = volume
    const currentHowl = this.currentHowl
    if (currentHowl) {
      await this.fadeHowl(currentHowl, {
        volume,
        fade
      })
    }
  }

  public async seek(time: number): Promise<void> {
    const currentHowl = this.currentHowl
    if (currentHowl && currentHowl.howl.playing()) {
      currentHowl.howl.seek(time)
    }
  }

  private get currentHowl() {
    return this.currentSrc ? this.howls.get(this.currentSrc) : null
  }

  public get volume() {
    return this.currentHowl?.howl.volume() ?? this.targetVolume
  }

  public set volume(value: number) {
    this.targetVolume = value
    const currentHowl = this.currentHowl
    if (currentHowl) {
      gsap.killTweensOf(currentHowl.howl)
      currentHowl.howl.volume(value)
    }
  }

  public get loop() {
    return this.currentHowl?.howl.loop() ?? false
  }

  public set loop(value: boolean) {
    this.currentHowl?.howl.loop(value)
  }

  public destroy(): void {
    super.destroy()
  }
}