import { Logger } from '../utils/Logger'
import { DomBaseNode } from '../core/dom/DomBaseNode'
import type { NodeProps } from '../core/base/BaseNode'

export interface DomVideoNodeData {
  src: string;
  muted?: boolean;
  loop?: boolean;
  autoplay?: boolean;
}

export class DomVideoNode extends DomBaseNode<HTMLVideoElement, DomVideoNodeData> {
  constructor(props: Omit<NodeProps<DomVideoNodeData>, 'type' | 'tagName'>) {
    super({
      ...props,
      type: 'video',
      tagName: 'video',
      data: {
        src: '',
        muted: false,
        loop: false,
        autoplay: true,
        ...props.data,
      }
    })

    const el = this._element
    el.playsInline = true
    el.controls = false
    el.disablePictureInPicture = true

    this._applyData(this.data)
  }

  protected override _applyData(data: Partial<DomVideoNodeData>): void {
    const el = this._element
    if (data.src !== undefined) el.src = data.src
    if (data.muted !== undefined) el.muted = data.muted
    if (data.loop !== undefined) el.loop = data.loop
    if (data.autoplay !== undefined) el.autoplay = data.autoplay
  }

  public get src(): string {
    return this.data.src
  }

  public set src(value: string) {
    this.updateData({ src: value })
  }

  public async waitEnded(): Promise<void> {
    const el = this._element
    if (el.ended || el.error) {
      if (el.error) Logger.error('Video error:', el.error)
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const handler = () => {
        el.removeEventListener('ended', handler)
        el.removeEventListener('error', handler)
        el.removeEventListener('emptied', handler)
        resolve()
      }

      el.addEventListener('ended', handler, { once: true })
      el.addEventListener('error', handler, { once: true })
      el.addEventListener('emptied', handler, { once: true })
    })
  }

  protected override _onDestroy(): void {
    this._element.pause()
    this._element.src = ''
    super._onDestroy()
  }
}
