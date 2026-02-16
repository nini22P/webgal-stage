import { Logger } from '../../utils/Logger'
import { HowlNode, type SoundInstance, type HowlNodeProps } from './HowlNode'

export type VoiceNodeProps = Omit<HowlNodeProps, 'type' | 'tagName'>

interface VoiceSoundInstance extends SoundInstance {
  onComplete?: () => void;
}

export class VoiceNode extends HowlNode {
  constructor(props: VoiceNodeProps) {
    super({ ...props, type: 'voice' })
  }

  public async play(options: {
    src: string
    volume?: number
    speakerId?: string
    interrupt?: 'all' | 'self' | 'none'
    onComplete?: () => void
  }) {
    const {
      src,
      volume = 1,
      speakerId = 'default',
      interrupt = 'all',
      onComplete,
    } = options

    const targetHowlInstance = this.howls.get(src)
    if (targetHowlInstance) {
      const existing = Array.from(targetHowlInstance.sounds).find(i => i.speakerId === speakerId) as VoiceSoundInstance
      if (existing && targetHowlInstance.howl.playing(existing.id)) {
        targetHowlInstance.howl.seek(0, existing.id)
        targetHowlInstance.howl.volume(volume, existing.id);
        existing.onComplete = onComplete
        targetHowlInstance.lastUsed = Date.now()
        return existing.id
      }
    }

    if (interrupt === 'all') {
      this.stopAll(0.1)
    } else if (interrupt === 'self') {
      this.stop(speakerId, 0.1)
    }

    const howlInstance = this.getHowlInstance(src, true)

    try {
      await this.waitLoaded(howlInstance.howl)

      const soundId = howlInstance.howl.play()
      howlInstance.howl.volume(volume, soundId)

      const voiceInstance: VoiceSoundInstance = {
        id: soundId,
        speakerId,
        onComplete,
        startTime: Date.now()
      }
      howlInstance.sounds.add(voiceInstance)

      howlInstance.howl.once('end', () => {
        voiceInstance.onComplete?.()
        this.removeAudioInstance(howlInstance, soundId)
      }, soundId)

      return soundId
    } catch (error) {
      Logger.error('Voice Node Play Error:', error)
      onComplete?.()
      return Promise.reject(error)
    }
  }

  public async stop(speakerId: string, fade: number = 0): Promise<void> {
    this.howls.forEach(howlInstance => {
      Array.from(howlInstance.sounds).forEach(async sound => {
        if (sound.speakerId === speakerId) {
          await this.fadeHowl(
            howlInstance,
            {
              volume: 0,
              fade,
              soundId: sound.id,
              onComplete: () => {
                howlInstance.howl.stop(sound.id)
                this.removeAudioInstance(howlInstance, sound.id)
              }
            }
          )
        }
      })
    })
  }

  public destroy(): void {
    super.destroy()
  }
}