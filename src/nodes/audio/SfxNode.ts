import { Logger } from '../../utils/Logger'
import { HowlNode, type HowlNodeProps, type HowlInstance, type SoundInstance } from './HowlNode'

export type SfxNodeProps = Omit<HowlNodeProps, 'type' | 'tagName'> & {
  maxConcurrent?: number
}

export class SfxNode extends HowlNode {
  private maxConcurrent: number
  private pendingTimeouts: Set<number> = new Set()

  constructor(props: SfxNodeProps) {
    super({ ...props, type: 'sfx' })
    this.maxConcurrent = props.maxConcurrent ?? 20
  }

  public async play(options: {
    src: string
    volume?: number
    loop?: number
    delay?: number | (() => number)
  }): Promise<number> {
    const { delay = 0, loop = 1, volume = 1, src } = options
    const waitTime = typeof delay === 'function' ? delay() : delay

    if (waitTime > 0) {
      return new Promise((resolve) => {
        const timeoutId = window.setTimeout(async () => {
          this.pendingTimeouts.delete(timeoutId)
          resolve(await this.playSfx(src, loop, volume))
        }, waitTime)
        this.pendingTimeouts.add(timeoutId)
      })
    }

    return this.playSfx(src, loop, volume)
  }

  private async playSfx(src: string, loopCount: number, volume: number): Promise<number> {
    const howlInstance = this.getHowlInstance(src)

    this.checkMaxConcurrent()

    try {
      await this.waitLoaded(howlInstance.howl)

      const soundId = howlInstance.howl.play()
      const isInfinite = loopCount === -1 || loopCount === Infinity

      howlInstance.howl.volume(volume, soundId)
      howlInstance.howl.loop(isInfinite, soundId)

      const instance: SoundInstance = {
        id: soundId,
        startTime: Date.now()
      }
      howlInstance.sounds.add(instance)

      if (!isInfinite && loopCount > 1) {
        let remaining = loopCount - 1
        const onEnd = (id: number) => {
          if (id !== soundId) return
          if (remaining > 0) {
            remaining--
            howlInstance.howl.play(soundId)
          }
        }
        howlInstance.howl.on('end', onEnd, soundId)
      }

      howlInstance.howl.once('end', () => {
        if (!isInfinite) {
          this.removeAudioInstance(howlInstance, soundId)
        }
      }, soundId)

      return soundId
    } catch (error) {
      Logger.error('Sfx Node Play Error:', error)
      return Promise.reject(error)
    }
  }

  private checkMaxConcurrent() {
    const allActiveSounds: { howlInstance: HowlInstance; sound: SoundInstance }[] = []

    this.howls.forEach(howlInstance => {
      howlInstance.sounds.forEach(sound => {
        allActiveSounds.push({ howlInstance, sound })
      })
    })

    if (allActiveSounds.length >= this.maxConcurrent) {
      const oldest = allActiveSounds.sort((a, b) => a.sound.startTime - b.sound.startTime)[0]
      if (oldest) {
        this.stop(oldest.sound.id)
      }
    }
  }

  public async stop(target: number | string, fade: number = 0) {
    this.howls.forEach(howlRes => {
      const soundsToStop = Array.from(howlRes.sounds).filter(s =>
        typeof target === 'number' ? s.id === target : howlRes.src === target
      )

      soundsToStop.forEach(async sound => {
        await this.fadeHowl(howlRes, {
          volume: 0,
          fade,
          soundId: sound.id,
          onComplete: () => {
            howlRes.howl.stop(sound.id)
            this.removeAudioInstance(howlRes, sound.id)
          }
        })
      })
    })
  }

  public override stopAll(fade: number = 0) {
    this.pendingTimeouts.forEach(id => clearTimeout(id))
    this.pendingTimeouts.clear()
    super.stopAll(fade)
  }

  public override destroy(): void {
    this.pendingTimeouts.forEach(id => clearTimeout(id))
    super.destroy()
  }
}