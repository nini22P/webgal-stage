import gsap from 'gsap'
import { Logger } from '../utils/Logger'

export type Tween = gsap.TweenVars

export interface BaseNodeProps {
  type?: string;
  id: string;
  tagName?: keyof HTMLElementTagNameMap,
  tween?: Tween;
}

export class BaseNode<T extends HTMLElement = HTMLElement> {
  public element: T
  public id: string

  private animationCount = 0
  private isDestroyed = false

  constructor({ type = 'base', id, tagName = 'div', tween }: BaseNodeProps) {
    this.id = id
    this.element = document.createElement(tagName) as T
    this.element.id = `${type}:${id}`
    this.element.style.position = 'absolute'
    this.element.style.display = 'block'
    this.element.style.boxSizing = 'border-box'
    this.element.style.margin = '0'
    this.element.style.padding = '0'

    if (tween) {
      this.set(tween)
    }

    Logger.debug(`Node created: ${this.element.id} `)
  }

  public set(tween: Tween): this {
    if (this.isDestroyed) {
      Logger.warn(`Attempting to set destroyed node: ${this.element.id} `)
      return this
    }

    Logger.debug(`Tween set: ${this.element.id} `, tween)

    gsap.set(this.element, tween)

    return this
  }

  public async to(tween: Tween): Promise<this> {
    if (this.isDestroyed) {
      Logger.warn(`Attempting to animate destroyed node: ${this.element.id} `)
      return this
    }

    Logger.debug(`Tween To: ${this.element.id} `, tween)

    this.enableWillChange()

    await gsap.to(this.element, {
      ...tween,
      overwrite: 'auto',
      onComplete: () => {
        this.disableWillChange()
        tween.onComplete?.()
      },
      onInterrupt: () => {
        this.disableWillChange()
        tween.onInterrupt?.()
      }
    })

    return this
  }

  public addNode(node: BaseNode): this {
    this.element.appendChild(node.element)
    Logger.debug(`Node added: ${node.element.id} to ${this.element.id} `)
    return this
  }

  public removeNode(node: BaseNode): this {
    if (node.element.parentElement === this.element) {
      this.element.removeChild(node.element)
      Logger.debug(`Node removed: ${node.element.id} from ${this.element.id} `)
    }
    return this
  }

  private enableWillChange(): void {
    if (this.animationCount === 0) {
      this.element.style.willChange = 'transform, opacity'
    }
    this.animationCount++
  }

  private disableWillChange(): void {
    this.animationCount--
    if (this.animationCount <= 0) {
      this.animationCount = 0
      this.element.style.willChange = 'auto'
    }
  }

  public destroy(): void {
    if (this.isDestroyed) {
      return
    }

    gsap.killTweensOf(this.element)

    this.element.remove()
    this.isDestroyed = true

    Logger.debug(`Node destroyed: ${this.element.id} `)
  }
}