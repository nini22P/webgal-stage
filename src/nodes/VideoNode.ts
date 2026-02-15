import { Logger } from '../utils/Logger';
import { BaseNode, type BaseNodeProps } from './BaseNode'

export interface VideoNodeProps extends Omit<BaseNodeProps, 'type'> {
  src: string;
  muted?: boolean;
  loop?: boolean;
}

export class VideoNode extends BaseNode<HTMLVideoElement> {
  constructor(props: VideoNodeProps) {
    super({
      type: 'video',
      id: props.id,
      tagName: 'video',
      tween: props.tween,
    })

    this.element.playsInline = true
    this.element.autoplay = true
    this.element.controls = false
    this.element.disablePictureInPicture = true
    this.element.muted = props.muted ?? false
    this.element.loop = props.loop ?? false

    this.element.src = props.src
  }

  public set src(src: string) {
    this.element.src = src
  }

  public get src(): string {
    return this.element.src
  }

  public waitEnded(): Promise<void> {
    if (this.element.ended || this.element.error) {
      if (this.element.error) {
        Logger.error('Video error:', this.element.error)
      }
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const cleanup = () => {
        this.element.removeEventListener('ended', handler)
        this.element.removeEventListener('error', handler)
        this.element.removeEventListener('emptied', handler)
      }

      const handler = () => {
        cleanup()
        resolve()
      }

      this.element.addEventListener('ended', handler, { once: true })
      this.element.addEventListener('error', handler, { once: true })
      this.element.addEventListener('emptied', handler, { once: true })
    })
  }

  public override destroy(): void {
    this.element.pause()
    this.element.src = ''
    super.destroy()
  }
}