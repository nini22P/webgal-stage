import gsap from 'gsap'
import { DomBaseNode } from '../core/dom/DomBaseNode'
import type { NodeProps } from '../core/base/BaseNode'

export interface TypewriterNodeData {
  text?: string;
}

export interface TypewriterOptions {
  speed?: number;
  onChar?: (char: string, index: number) => void;
}

export class TypewriterNode extends DomBaseNode<HTMLParagraphElement, TypewriterNodeData> {
  private _typeTween?: gsap.core.Tween

  constructor(props: Omit<NodeProps<TypewriterNodeData>, 'type' | 'tagName'>) {
    super({
      ...props,
      type: 'typewriter',
      tagName: 'p',
      dom: {
        ...props.dom,
        styles: {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...props.dom?.styles,
        }
      }
    })

    this._applyData(this.data)
  }

  protected override _applyData(data: Partial<TypewriterNodeData>): void {
    if (data.text !== undefined) {
      this._typeTween?.kill()
      this._element.textContent = data.text
    }
  }

  public get text(): string {
    return this.data.text || ''
  }

  public set text(value: string) {
    this.updateData({ text: value })
  }

  public isTypingActive(): boolean {
    return this._typeTween?.isActive() ?? false
  }

  public async play(text?: string, options?: TypewriterOptions): Promise<this> {
    const speed = options?.speed ?? 0.025
    const onChar = options?.onChar

    if (text !== undefined) {
      this.data.text = text
    }

    const fullText = this.text
    this._typeTween?.kill()
    this._element.textContent = ''

    if (!fullText) return this

    const chars = Array.from(fullText)
    const total = chars.length
    const obj = { count: 0 }
    let lastProgress = 0

    return new Promise((resolve) => {

      this._typeTween = gsap.to(obj, {
        count: total,
        duration: total * speed,
        ease: 'none',
        onUpdate: () => {
          const progress = Math.floor(obj.count)

          if (progress !== lastProgress) {
            const currentText = chars.slice(0, progress).join('')
            this._element.textContent = currentText

            for (let i = lastProgress; i < progress; i++) {
              if (this._typeTween?.isActive()) {
                onChar?.(chars[i], i)
              }
            }

            lastProgress = progress
          }
        },
        onComplete: () => {
          this._element.textContent = fullText
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
      this._element.textContent = this.text
    }
    return this
  }

  protected override _onDestroy(): void {
    this._typeTween?.kill()
    super._onDestroy()
  }
}
