import type { NodeProps } from '../core/base/BaseNode'
import { DomBaseNode } from '../core/dom/DomBaseNode'

export interface DomImageNodeData {
  src: string;
}

export class DomImageNode extends DomBaseNode<HTMLDivElement, DomImageNodeData> {
  constructor(props: Omit<NodeProps<DomImageNodeData>, 'type' | 'tagName'>) {
    super({
      ...props,
      type: 'image',
      tagName: 'div',
      dom: {
        ...props.dom,
        styles: {
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          imageRendering: 'auto',
          ...props.dom?.styles,
        }
      }
    })

    this._applyData(this.data)
  }

  protected override _applyData(data: Partial<DomImageNodeData>): void {
    if (data.src) {
      this._element.style.backgroundImage = `url(${data.src})`
    }
  }

  public get src(): string {
    return this.data.src
  }

  public set src(value: string) {
    this.updateData({ src: value })
  }
}