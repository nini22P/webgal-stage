import { BaseNode, type BaseNodeProps } from './BaseNode'
import gsap from 'gsap'

export interface TypewriterNodeProps extends BaseNodeProps {
  text?: string;
}

export interface TypewriterOptions {
  speed?: number;
  loop?: boolean;
  onChar?: (char: string, index: number) => void;
}

export class TypewriterNode extends BaseNode<HTMLParagraphElement> {
  private _text: string = ''
  private _typeTween?: gsap.core.Tween
  private _onCharCallback?: (char: string, index: number) => void

  constructor({ type = 'text', id, tagName = 'p', text = '', tween }: TypewriterNodeProps) {
    super({
      type,
      id,
      tagName,
      tween: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...tween,
      }
    })

    this._text = text
    this.element.textContent = ''
  }

  public get text(): string {
    return this._text
  }

  public set text(text: string) {
    this._text = text
    this._typeTween?.kill()
    this.element.textContent = text
  }

  public setText(text: string): this {
    this._text = text
    return this
  }

  public showText(text?: string): this {
    if (text !== undefined) this._text = text
    this._typeTween?.kill()
    this.element.textContent = this._text
    return this
  }

  public isTypingActive(): boolean {
    return this._typeTween?.isActive() ?? false
  }

  public onChar(callback: (char: string, index: number) => void): this {
    this._onCharCallback = callback
    return this
  }

  public play(text?: string, speedOrOptions?: TypewriterOptions): Promise<this> {
    const speed = speedOrOptions?.speed ?? 0.025
    const onChar = speedOrOptions?.onChar

    if (text !== undefined) this._text = text

    this._typeTween?.kill()

    this.element.textContent = ''

    if (!this._text) return Promise.resolve(this)

    const chars = Array.from(this._text)
    const total = chars.length

    return new Promise((resolve) => {
      const obj = { count: 0 }

      this._typeTween = gsap.to(obj, {
        count: total,
        duration: total * speed,
        ease: 'none',
        onUpdate: () => {
          const progress = Math.floor(obj.count)
          const currentText = chars.slice(0, progress).join('')
          this.element.textContent = currentText

          if (progress > 0) {
            const callback = onChar ?? this._onCharCallback
            callback?.(chars[progress - 1], progress - 1)
          }
        },
        onComplete: () => {
          this.element.textContent = this._text
          this._typeTween = undefined
          resolve(this)
        },
        onInterrupt: () => {
          this._typeTween = undefined
          resolve(this)
        }
      })
    })
  }

  public skip(): this {
    if (this._typeTween?.isActive()) {
      this._typeTween.progress(1)
    } else {
      this.element.textContent = this._text
    }
    return this
  }

  public override destroy(): void {
    this._typeTween?.kill()
    super.destroy()
  }
}