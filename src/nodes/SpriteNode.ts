import { BaseNode, type BaseNodeProps } from './BaseNode'

export interface SpriteNodeProps extends Omit<BaseNodeProps, 'type'> {
  src: string;
}

export class SpriteNode extends BaseNode {
  constructor(props: SpriteNodeProps) {
    super({
      type: 'sprite',
      id: props.id,
      tween: {
        backgroundImage: `url(${props.src})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        imageRendering: 'auto',
        ...props.tween,
      }
    })
  }

  public set src(src: string) {
    this.set({
      backgroundImage: `url(${src})`
    })
  }

  public get src(): string {
    const match = this.element.style.backgroundImage.match(/url\("?(.*?)"?\)/)
    return match ? match[1] : ''
  }

  public override destroy(): void {
    super.destroy()
  }
}