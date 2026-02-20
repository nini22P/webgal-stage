import { DomBaseNode, Stage, type NodeProps } from "tiny-stage";

export interface OverlayNodeProps extends Omit<NodeProps, 'type' | 'renderer'> {
  stage: Stage;
}

export class OverlayNode extends DomBaseNode {
  protected stage: Stage

  constructor(props: OverlayNodeProps) {
    const { stage, ...rest } = props;
    super({
      ...rest,
      type: 'overlay',
      transform: {
        width: stage.data.width,
        height: stage.data.height,
        zIndex: 100,
        opacity: 0,
        ...rest.transform
      },
      dom: {
        styles: {
          display: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          pointerEvents: 'auto',
          ...rest.dom?.styles
        }
      }
    });
    this.stage = stage;
  }

  async show() {
    this.renderObject.style.display = 'block';
    await this.to({ opacity: 1, duration: 0.3 } as any);
  }

  async hide() {
    await this.to({ opacity: 0, duration: 0.3 } as any);
    this.renderObject.style.display = 'none';
  }
}
