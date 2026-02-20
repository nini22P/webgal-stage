import gsap from 'gsap'
import { BaseNode, DEFAUL_TRANSFORM, type NodeProps, type NodeTransform } from '../base/BaseNode'
import { Logger } from '../../utils/Logger'

export class DomBaseNode<T extends HTMLElement = HTMLDivElement, TData = Record<string, unknown>> extends BaseNode<TData> {
  public transform: NodeTransform
  protected _element: T

  constructor(props: Omit<NodeProps<TData>, 'renderer'> & { tagName?: keyof HTMLElementTagNameMap }) {
    super(props)
    this.renderer = 'dom'
    this.transform = {
      ...DEFAUL_TRANSFORM,
      ...props.transform
    }

    this._element = document.createElement(props.tagName ?? 'div') as T
    this._element.dataset.nodeId = this.id
    this._element.dataset.nodeType = this.type

    if (this.domConfig?.classNames)
      this._element.className = this.domConfig.classNames.join(' ')

    Object.assign(this._element.style, {
      position: 'absolute',
      display: 'block',
      boxSizing: 'border-box',
      margin: '0',
      padding: '0',
      ...this.domConfig?.styles
    })

    this._syncToRenderer(this.transform, true)
  }

  public get renderObject(): T {
    return this._element
  }

  public override set(transform: NodeTransform): this {
    return super.set(transform)
  }

  public override to(transform: NodeTransform & gsap.TweenVars): Promise<this> {
    return super.to(transform)
  }

  protected _applyData(_data: Partial<TData>): void { }

  protected _syncToRenderer(
    transform: NodeTransform & gsap.TweenVars,
    immediate: boolean,
  ): void {
    const vars = this._mapToGsapVars(transform)
    if (immediate) {
      gsap.set(this._element, vars)
    } else {
      gsap.to(this._element, { ...vars, overwrite: 'auto' })
    }
  }

  protected _onChildAdded(node: BaseNode<unknown>): void {
    if (node instanceof DomBaseNode) {
      this._element.appendChild(node.renderObject)
    } else {
      Logger.error(`Cannot add non-DomBaseNode to DomBaseNode: ${node.type}`)
    }
  }

  protected _onChildRemoved(node: BaseNode<unknown>): void {
    if (node instanceof DomBaseNode) {
      this._element.removeChild(node.renderObject)
    } else {
      Logger.error(`Cannot remove non-DomBaseNode from DomBaseNode: ${node.type}`)
    }
  }

  protected _onDestroy(): void {
    gsap.killTweensOf(this.transform)
    gsap.killTweensOf(this._element)
    this._element.remove()
  }

  private _mapToGsapVars(transform: NodeTransform): gsap.TweenVars {
    const vars: gsap.TweenVars = { ...transform }
    if (transform.visible === false) vars.autoAlpha = 0
    if (transform.anchorX !== undefined || transform.anchorY !== undefined) {
      const aX = transform.anchorX ?? 0
      const aY = transform.anchorY ?? 0
      vars.transformOrigin = `${aX * 100}% ${aY * 100}%`
      vars.xPercent = -aX * 100
      vars.yPercent = -aY * 100
    }
    return vars
  }
}
