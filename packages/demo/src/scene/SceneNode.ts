import { DomBaseNode, BgmNode, SfxNode, DomImageNode, Stage, type NodeProps } from 'tiny-stage'
import type { ScriptTransform } from './ScenarioScene'

export interface SceneNodeProps<TData = any> extends Omit<NodeProps<TData>, 'type' | 'renderer'> {
  stage: Stage;
}

export abstract class SceneNode<TData = any> extends DomBaseNode<HTMLElement, TData> {
  protected camera: DomBaseNode
  protected bgm: BgmNode
  protected sfx: SfxNode
  protected stage: Stage

  constructor(props: SceneNodeProps<TData>) {
    const { stage, ...rest } = props;
    super({
      ...rest,
      type: 'scene',
      transform: {
        width: stage.data.width,
        height: stage.data.height,
        ...rest.transform
      }
    });

    this.stage = stage;

    this.camera = new DomBaseNode({
      id: `${props.id}-camera`,
      type: 'camera',
      transform: { width: this.stage.data.width, height: this.stage.data.height }
    });
    this.addNode(this.camera);

    this.bgm = new BgmNode({ id: `${props.id}-bgm` });
    this.sfx = new SfxNode({ id: `${props.id}-sfx` });

    this.addNode(this.bgm as any)
      .addNode(this.sfx as any);
  }

  abstract onStart(): Promise<void>;
  abstract onEnd(): Promise<void>;

  protected async waitClick(
    target: DomBaseNode<any, any> | HTMLElement | Stage = this.stage,
    callback?: () => boolean | void
  ): Promise<void> {
    const element = target instanceof DomBaseNode ? target.renderObject : (target as any);
    return new Promise<void>(resolve => {
      const handler = (_event: MouseEvent | TouchEvent) => {
        if (callback?.() === true) return;
        element.removeEventListener('click', handler);
        element.removeEventListener('touchstart', (handler as any));
        resolve();
      };
      element.addEventListener('click', handler);
      element.addEventListener('touchstart', (handler as any), { passive: false });
    });
  }

  protected addImage(
    { id, src, target = this.camera, transform }
      : { id: string, src: string, target?: DomBaseNode, transform?: ScriptTransform }
  ): DomImageNode {
    const node = new DomImageNode({
      id,
      renderer: 'dom',
      data: { src },
      transform: {
        x: this.stage.data.width / 2,
        y: this.stage.data.height / 2,
        anchorX: 0.5,
        anchorY: 0.5,
        ...transform,
      }
    })
    target.addNode(node)
    return node
  }

  public override destroy(): void {
    super.destroy();
    this.bgm.destroy();
    this.sfx.destroy();
  }
}
