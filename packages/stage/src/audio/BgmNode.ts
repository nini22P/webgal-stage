import gsap from 'gsap'
import { Logger } from '../utils/Logger'
import type { NodeProps } from '../core/base/BaseNode'
import { DomBaseNode } from '../core/dom/DomBaseNode'

export class BgmNode extends DomBaseNode {

  private _audios: [HTMLAudioElement, HTMLAudioElement]
  private _currentIndex: number = 0
  private _targetVolume: number = 1

  constructor(props: Omit<NodeProps, 'type' | 'tagName'>) {
    super({ ...props, type: 'bgm' })

    this._audios = [new Audio(), new Audio()]
    this._audios.forEach(audio => {
      audio.loop = true
      audio.preload = 'auto'
      audio.crossOrigin = 'anonymous'
    })
  }

  public async play(options: { src?: string, loop?: boolean; volume?: number; fade?: number } = {}): Promise<void> {
    const fade = options.fade ?? 0
    if (options.volume !== undefined)
      this._targetVolume = options.volume

    if (!options.src) {
      if (this._audio.src) {
        this._audio.loop = options.loop ?? this.loop
        if (this._audio.paused) {
          this._audio.volume = 0
          await this._audio.play()
        }
        return await this._setVolume({ index: this._currentIndex, volume: this._targetVolume, fade })
      }
      return
    }

    const oldIndex = this._currentIndex
    const newIndex = (this._currentIndex + 1) % 2

    const oldAudio = this._audios[oldIndex]
    const newAudio = this._audios[newIndex]

    newAudio.src = options.src
    newAudio.loop = options.loop ?? this.loop
    newAudio.volume = fade > 0 ? 0 : this._targetVolume

    try {
      newAudio.load()
      await new Promise((resolve) => {
        newAudio.addEventListener('canplaythrough', resolve, { once: true })
      })
      await newAudio.play()
      this._currentIndex = newIndex
    } catch (e) {
      Logger.error('Playback error:', e)
      this._stopAudio(newAudio)
      return
    }

    if (fade > 0) {
      await Promise.all([
        this._setVolume({ index: oldIndex, volume: 0, fade, stopOnEnd: true }),
        this._setVolume({ index: newIndex, volume: this._targetVolume, fade })
      ])
    } else {
      this._stopAudio(oldAudio)
    }
  }

  public async pause(fade: number = 0): Promise<void> {
    if (fade > 0) {
      await this._setVolume({ index: this._currentIndex, volume: 0, fade, pauseOnEnd: true })
    } else {
      this._audio.pause()
    }
  }

  public async stop(fade: number = 0): Promise<void> {
    if (fade > 0) {
      await this._setVolume({ index: this._currentIndex, volume: 0, fade, stopOnEnd: true })
    } else {
      this._audios.forEach((_, i) => this._stopAudio(this._audios[i]))
    }
  }

  public async fade(volume: number, fade: number = 0): Promise<void> {
    this._targetVolume = volume
    return this._setVolume({ index: this._currentIndex, volume, fade })
  }

  public async resume(fade: number = 0): Promise<void> {
    return this.play({ fade })
  }

  private get _audio() { return this._audios[this._currentIndex] }

  public get currentTime() { return this._audio.currentTime }
  public set currentTime(value: number) { this._audio.currentTime = value }

  public get duration() { return this._audio.duration }

  public get paused() { return this._audio.paused }

  public get volume() { return this._audio.volume }
  public set volume(value: number) {
    this._targetVolume = value
    gsap.killTweensOf(this._audio, 'volume')
    this._audio.volume = Math.max(0, Math.min(1, value))
  }

  public get loop() { return this._audio.loop }
  public set loop(value: boolean) { this._audios.forEach(a => a.loop = value) }

  public get muted() { return this._audio.muted }
  public set muted(value: boolean) { this._audios.forEach(a => a.muted = value) }

  private _setVolume(
    { index, volume, fade, stopOnEnd, pauseOnEnd }
      : { index: number, volume: number, fade: number, stopOnEnd?: boolean, pauseOnEnd?: boolean }
  ): Promise<void> {
    const audio = this._audios[index]

    if (!audio.src) return Promise.resolve()

    gsap.killTweensOf(audio, 'volume')

    return new Promise((resolve) => {
      if (fade <= 0) {
        audio.volume = volume
        if (stopOnEnd) this._stopAudio(audio)
        resolve()
        return
      }

      gsap.to(audio, {
        volume,
        duration: fade,
        ease: volume > audio.volume ? 'sine.out' : 'sine.in',
        overwrite: 'auto',
        onComplete: () => {
          if (stopOnEnd)
            this._stopAudio(audio)
          else if (pauseOnEnd)
            audio.pause()
          resolve()
        },
        onInterrupt: () => resolve(),
      })
    })
  }

  private _stopAudio(audio: HTMLAudioElement) {
    gsap.killTweensOf(audio, 'volume')
    audio.pause()
    audio.src = ''
    audio.removeAttribute('src')
    audio.load()
  }

  public override destroy(): void {
    this.stop()
    super.destroy()
  }
}