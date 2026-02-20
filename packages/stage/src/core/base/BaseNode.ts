import gsap from 'gsap'
import type { DomBaseNode } from '../dom/DomBaseNode'
import type { PixiBaseNode } from '../pixi/PixiBaseNode'

export const DEFAUL_TRANSFORM: NodeTransform | PixiNodeTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
  visible: true,
}

export interface NodeTransform {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  opacity?: number;
  width?: number;
  height?: number;
  anchorX?: number;
  anchorY?: number;
  zIndex?: number;
  visible?: boolean;
}

export type PixiNodeTransform = Omit<NodeTransform, 'width' | 'height'>

export interface NodeProps<TData = Record<string, unknown>> {
  id: string;
  type: string;
  renderer?: 'dom' | 'pixi';
  data?: TData;
  transform?: NodeTransform | PixiNodeTransform;
  children?: NodeProps<TData>[];
  dom?: DomConfig;
  pixi?: PixiConfig;
}

export interface DomConfig {
  classNames?: string[];
  styles?: Record<string, string | number>;
}

export interface PixiConfig {
  [key: string]: unknown;
}

export interface NodeKeyframe extends NodeTransform {
  duration: number;
}

export abstract class BaseNode<TData = Record<string, unknown>> {
  public id: string
  public type: string
  public renderer: 'dom' | 'pixi'

  public data: TData
  public transform: NodeTransform | PixiNodeTransform

  public domConfig?: DomConfig
  public pixiConfig?: PixiConfig

  protected _children: BaseNode<unknown>[] = []
  protected _parent: BaseNode<unknown> | null = null
  protected _isDestroyed = false

  constructor(props: NodeProps<TData>) {
    this.id = props.id
    this.type = props.type
    this.renderer = props.renderer ?? 'dom'
    this.data = (props.data ?? {}) as TData
    this.transform = {
      ...DEFAUL_TRANSFORM,
      ...props.transform
    }
    this.domConfig = props.dom
    this.pixiConfig = props.pixi
  }

  public abstract get renderObject(): unknown

  public updateData(partialData: Partial<TData>): void {
    if (this._isDestroyed) return
    this.data = { ...this.data, ...partialData }
    this._applyData(partialData)
  }

  public set(transform: NodeTransform | PixiNodeTransform): this {
    if (this._isDestroyed)
      return this

    Object.assign(this.transform, transform)
    this._syncToRenderer(transform, true)
    return this
  }

  public async to(transform: (NodeTransform | PixiNodeTransform) & (gsap.TweenVars | gsap.TweenVars['pixi'])): Promise<this> {
    if (this._isDestroyed)
      return this

    return new Promise((resolve) => {
      gsap.to(this.transform, {
        ...transform,
        overwrite: 'auto',
        onComplete: () => {
          transform.onComplete?.()
          resolve(this)
        }
      })
      this._syncToRenderer(transform, false)
    })
  }

  public addNode(node: BaseNode<unknown>): this {
    if (node._parent) node._parent.removeNode(node)
    this._children.push(node)
    node._parent = this
    this._onChildAdded(node)
    return this
  }

  public removeNode(node: BaseNode<unknown>): this {
    const index = this._children.indexOf(node)
    if (index !== -1) {
      this._children.splice(index, 1)
      node._parent = null
      this._onChildRemoved(node)
    }
    return this
  }

  public serialize(): NodeProps<unknown> {
    return {
      id: this.id,
      type: this.type,
      renderer: this.renderer,
      data: { ...this.data },
      transform: { ...this.transform },
      dom: this.domConfig,
      pixi: this.pixiConfig,
      children: this._children.map(c => c.serialize())
    }
  }

  public isDomNode(): this is DomBaseNode {
    return this.renderer === 'dom'
  }

  public isPixiNode(): this is PixiBaseNode {
    return this.renderer === 'pixi'
  }

  public destroy(): void {
    if (this._isDestroyed)
      return

    if (this._parent) {
      this._parent.removeNode(this)
    }

    [...this._children].forEach(child => child.destroy())

    this._children = []
    this._onDestroy()
    this._isDestroyed = true
  }

  protected _applyData(_data: Partial<TData>): void { }
  protected _syncToRenderer(_transform: (NodeTransform | PixiNodeTransform) & (gsap.TweenVars | gsap.TweenVars['pixi']), _immediate: boolean): void { }
  protected _onChildAdded(_node: BaseNode<unknown>): void { }
  protected _onChildRemoved(_node: BaseNode<unknown>): void { }
  protected _onDestroy(): void { }
}
