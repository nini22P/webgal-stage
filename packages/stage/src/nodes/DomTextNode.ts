import { DomBaseNode } from '../core/dom/DomBaseNode'
import type { NodeProps } from '../core/base/BaseNode'

export interface DomTextNodeData {
  text: string;
}

export class DomTextNode extends DomBaseNode<HTMLDivElement, DomTextNodeData> {
  constructor(props: Omit<NodeProps<DomTextNodeData>, 'type' | 'tagName'>) {
    super({
      ...props,
      type: 'text',
      dom: {
        ...props.dom,
        styles: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '24px',
          ...props.dom?.styles,
        }
      }
    })

    this._applyData(this.data)
  }

  protected override _applyData(data: Partial<DomTextNodeData>): void {
    if (data.text !== undefined) {
      this._element.textContent = data.text
    }
  }

  public get text(): string {
    return this.data.text
  }

  public set text(value: string) {
    this.updateData({ text: value })
  }
}
