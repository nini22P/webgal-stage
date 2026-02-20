import { DomBaseNode, type NodeProps } from 'tiny-stage'
import gsap from 'gsap'

export interface ButtonNodeData {
  text?: string;
}

export interface ButtonNodeProps extends Omit<NodeProps<ButtonNodeData>, 'type' | 'renderer'> {
  onClick: () => void;
}

export class ButtonNode extends DomBaseNode<HTMLElement, ButtonNodeData> {
  constructor(props: ButtonNodeProps) {
    super({
      ...props,
      type: 'button',
      transform: {
        width: 300,
        height: 80,
        ...props.transform
      },
      dom: {
        styles: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          border: '2px solid #fff',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          cursor: 'pointer',
          userSelect: 'none',
          ...props.dom?.styles,
        }
      }
    });

    this._applyData(this.data);

    const el = this.renderObject;
    el.addEventListener('mouseenter', () => {
      this.to({ scaleX: 1.05, scaleY: 1.05, duration: 0.2 } as any);
      gsap.to(el, { backgroundColor: 'rgba(0, 0, 0, 0.4)', duration: 0.2 });
    });

    el.addEventListener('mouseleave', () => {
      this.to({ scaleX: 1, scaleY: 1, duration: 0.2 } as any);
      gsap.to(el, { backgroundColor: 'rgba(0, 0, 0, 0.2)', duration: 0.2 });
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      gsap.to(el, { scaleX: 0.9, scaleY: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
      props.onClick();
    });
  }

  protected override _applyData(data: Partial<ButtonNodeData>): void {
    if (data.text !== undefined) {
      this.renderObject.textContent = data.text;
    }
  }
}
