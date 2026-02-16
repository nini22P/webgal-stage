import { Howl } from 'howler'
import gsap from 'gsap'
import { Logger } from '../utils/Logger'
import { BaseNode, type BaseNodeProps } from './BaseNode'

export type BgmNodeProps = Omit<BaseNodeProps, 'type' | 'tagName'>

export class BgmNode extends BaseNode {
  private howls: [Howl | null, Howl | null] = [null, null]
  private howlSrcs: [string | null, string | null] = [null, null]

  private currentIndex: number = 0
  private targetVolume: number = 1

  private preloadedHowl: Howl | null = null
  private preloadedSrc: string | null = null

  constructor(props: BgmNodeProps) {
    super({ ...props, type: 'bgm' })
  }

  public preload(src: string): void {
    if (!src || src === this.howlSrcs[this.currentIndex] || src === this.preloadedSrc) return

    if (this.preloadedHowl) {
      this.preloadedHowl.unload()
    }

    Logger.info(`Preloading BGM: ${src}`)
    this.preloadedHowl = new Howl({
      src: [src],
      html5: true,
      preload: true,
      autoplay: false
    })
    this.preloadedSrc = src
  }

  public async play(options: {
    src?: string;
    loop?: boolean;
    volume?: number;
    fade?: number;
  } = {}): Promise<void> {
    const fade = options.fade ?? 0
    const volume = options.volume ?? this.targetVolume
    if (options.volume !== undefined)
      this.targetVolume = options.volume

    if (!options.src) {
      const current = this.activeHowl
      if (current) {
        current.loop(options.loop ?? current.loop())
        if (!current.playing()) {
          current.volume(0)
          current.play()
        }
        return await this.setHowl(current, volume, fade)
      }
      return
    }

    const oldIndex = this.currentIndex
    const newIndex = (this.currentIndex + 1) % 2
    const oldHowl = this.howls[oldIndex]

    let newHowl: Howl

    if (options.src === this.preloadedSrc && this.preloadedHowl) {
      newHowl = this.preloadedHowl
      this.preloadedHowl = null
      this.preloadedSrc = null
    } else {
      if (this.preloadedHowl) {
        this.preloadedHowl.unload()
        this.preloadedHowl = null
        this.preloadedSrc = null
      }

      newHowl = new Howl({
        src: [options.src],
        html5: true,
        preload: true,
        autoplay: false
      })
    }

    newHowl.loop(options.loop ?? true)
    newHowl.volume(fade > 0 ? 0 : volume)

    try {
      await new Promise((resolve, reject) => {
        if (newHowl.state() === 'loaded')
          resolve(true)
        else {
          newHowl.once('load', () => resolve(true))
          newHowl.once('loaderror', (_, e) => reject(e))
          setTimeout(() => reject(new Error('BGM Load Timeout')), 10000)
        }
      })
      newHowl.play()
    } catch (e) {
      Logger.error('Playback error:', e)
      newHowl.unload()
      return
    }

    this.howls[newIndex] = newHowl
    this.howlSrcs[newIndex] = options.src
    this.currentIndex = newIndex

    if (fade > 0) {
      if (oldHowl)
        this.setHowl(oldHowl, 0, fade, true)
      this.setHowl(newHowl, volume, fade)
    } else {
      if (oldHowl)
        this.destroyHowl(oldIndex)
      newHowl.volume(volume)
    }
  }

  public async pause(fade: number = 0): Promise<void> {
    if (this.activeHowl) {
      await this.setHowl(this.activeHowl, 0, fade, false, true)
    }
  }

  public async stop(fade: number = 0): Promise<void> {
    if (this.activeHowl) {
      await this.setHowl(this.activeHowl, 0, fade, true)
    }
  }

  public async fade(volume: number, fade: number = 0): Promise<void> {
    this.targetVolume = volume
    if (this.activeHowl) {
      return await this.setHowl(this.activeHowl, volume, fade)
    }
  }

  public async resume(fade: number = 0): Promise<void> {
    return await this.play({ fade })
  }

  public async seek(time: number): Promise<void> {
    this.activeHowl?.seek(time)
  }

  private get activeHowl() { return this.howls[this.currentIndex] }

  public get volume() { return this.activeHowl?.volume() ?? 0 }
  public set volume(v: number) {
    this.targetVolume = v
    if (this.activeHowl) {
      gsap.killTweensOf(this.activeHowl)
      this.activeHowl.volume(v)
    }
  }

  public get loop() { return this.activeHowl?.loop() ?? false }
  public set loop(v: boolean) { this.activeHowl?.loop(v) }

  private setHowl(
    howl: Howl,
    targetVol: number,
    fade: number,
    stopOnEnd: boolean = false,
    pauseOnEnd: boolean = false
  ): Promise<void> {
    gsap.killTweensOf(howl)

    const currentVol = howl.volume()
    const target = Math.max(0, Math.min(1, targetVol))

    if (fade <= 0) {
      howl.volume(target)
      if (stopOnEnd)
        this.destroyHowlByInstance(howl)
      else if (pauseOnEnd)
        howl.pause()
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const proxy = { val: currentVol }

      gsap.to(proxy, {
        val: target,
        duration: fade,
        ease: target > currentVol ? 'power1.out' : 'power2.in',
        onUpdate: () => {
          howl.volume(proxy.val)
        },
        onComplete: () => {
          if (stopOnEnd)
            this.destroyHowlByInstance(howl)
          else if (pauseOnEnd)
            howl.pause()
          resolve()
        },
        onInterrupt: resolve
      })
    })
  }

  private destroyHowl(index: number) {
    const howl = this.howls[index]
    if (howl) {
      howl.stop()
      howl.unload()
      this.howls[index] = null
      this.howlSrcs[index] = null
    }
  }

  private destroyHowlByInstance(howl: Howl) {
    const index = this.howls.indexOf(howl)
    if (index !== -1) {
      this.destroyHowl(index)
    } else {
      howl.stop()
      howl.unload()
    }
  }

  public override destroy(): void {
    this.stop()
    if (this.preloadedHowl)
      this.preloadedHowl.unload()
    super.destroy()
  }
}