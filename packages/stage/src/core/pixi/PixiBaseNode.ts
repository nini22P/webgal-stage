import gsap from 'gsap'
import { BaseNode, DEFAUL_TRANSFORM, type NodeProps, type PixiNodeTransform } from '../base/BaseNode'
import * as PIXI from 'pixi.js'
import { Logger } from '../../utils/Logger'

export class PixiBaseNode<T extends PIXI.Container = PIXI.Container, TData = Record<string, unknown>> extends BaseNode<TData> {
  public transform: PixiNodeTransform
  protected _container: T

  constructor(props: Omit<NodeProps<TData>, 'renderer'>, container: T) {
    super(props)
    this.renderer = 'pixi'
    this.transform = {
      ...DEFAUL_TRANSFORM,
      ...props.transform
    }
    this._container = container
    this._container.sortChildren()
    this._syncToRenderer(this.transform, true)
  }

  public get renderObject(): T {
    return this._container
  }

  public override set(transform: PixiNodeTransform): this {
    const result = super.set(transform)
    this._container.sortChildren()
    return result
  }

  public override async to(transform: PixiNodeTransform & gsap.TweenVars['pixi']): Promise<this> {
    const result = await super.to(transform)
    this._container.sortChildren()
    return result
  }

  protected _applyData(_data: Partial<TData>): void { }

  protected _syncToRenderer(transform: PixiNodeTransform & gsap.TweenVars['pixi'], immediate: boolean): void {
    const vars = this._transformToGsapVars(transform)
    if (immediate) {
      gsap.set(this._container, { pixi: vars })
    } else {
      gsap.to(this._container, { pixi: vars, overwrite: 'auto' })
    }
  }

  protected _onChildAdded(node: BaseNode<unknown>): void {
    if (node instanceof PixiBaseNode) {
      this._container.addChild(node.renderObject)
    } else {
      Logger.error(`Cannot add non-PixiBaseNode to PixiBaseNode: ${node.type}`)
    }
  }

  protected _onChildRemoved(node: BaseNode<unknown>): void {
    if (node instanceof PixiBaseNode) {
      this._container.removeChild(node.renderObject)
    } else {
      Logger.error(`Cannot remove non-PixiBaseNode from PixiBaseNode: ${node.type}`)
    }
  }

  protected _onDestroy(): void {
    gsap.killTweensOf(this.transform)
    gsap.killTweensOf(this._container)
    if (this._container.destroy) {
      this._container.destroy({ children: true, texture: false, textureSource: false })
    }
  }

  private _transformToGsapVars(transform: PixiNodeTransform): gsap.TweenVars['pixi'] {
    const vars: gsap.TweenVars['pixi'] = {}

    const keyMap: Partial<Record<keyof PixiNodeTransform, string>> = {
      x: 'x',
      y: 'y',
      scaleX: 'scaleX',
      scaleY: 'scaleY',
      rotation: 'rotation',
      opacity: 'alpha',
      visible: 'visible',
      anchorX: 'anchorX',
      anchorY: 'anchorY',
      zIndex: 'zIndex',
    }

    for (const [tKey, pKey] of Object.entries(keyMap)) {
      const value = transform[tKey as keyof PixiNodeTransform]
      if (value !== undefined) {
        (vars)[pKey] = value
      }
    }

    return vars
  }
}
