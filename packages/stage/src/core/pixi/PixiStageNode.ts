import * as PIXI from 'pixi.js'
import { gsap } from 'gsap'
import { PixiPlugin } from 'gsap/PixiPlugin'
import { DomBaseNode } from '../dom/DomBaseNode'
import { PixiBaseNode } from './PixiBaseNode'
import { BaseNode, type NodeProps } from '../base/BaseNode'

export class PixiStageNode extends DomBaseNode<HTMLCanvasElement> {
  private _pixiApp: PIXI.Application | null = null
  private _rootContainer: PIXI.Container

  constructor(props: Omit<NodeProps, 'type' | 'tagName'>) {
    super({
      ...props,
      type: 'pixi-stage',
      tagName: 'canvas',
    })

    this._rootContainer = new PIXI.Container()
    this._initPixi()
  }

  private async _initPixi() {
    gsap.registerPlugin(PixiPlugin)
    PixiPlugin.registerPIXI(PIXI)

    this._pixiApp = new PIXI.Application()

    await this._pixiApp.init({
      canvas: this._element,
      width: this.transform.width ?? 1920,
      height: this.transform.height ?? 1080,
      backgroundAlpha: 0,
      autoStart: false,
    })

    gsap.ticker.add(this._renderPixi)
  }

  private _renderPixi = () => {
    if (this._isDestroyed || !this._pixiApp) {
      gsap.ticker.remove(this._renderPixi)
      return
    }
    this._pixiApp.renderer.render(this._rootContainer)
  }

  protected override _onChildAdded(node: BaseNode<unknown>): void {
    if (node instanceof PixiBaseNode) {
      this._rootContainer.addChild(node.renderObject)
    } else if (node instanceof DomBaseNode) {
      super._onChildAdded(node)
    } else {
      console.error(`Cannot add node of type ${node.type} to PixiStageNode`)
    }
  }

  protected override _onChildRemoved(node: BaseNode<unknown>): void {
    if (node instanceof PixiBaseNode) {
      this._rootContainer.removeChild(node.renderObject)
    } else if (node instanceof DomBaseNode) {
      super._onChildRemoved(node)
    } else {
      console.error(`Cannot remove node of type ${node.type} from PixiStageNode`)
    }
  }

  protected override _onDestroy(): void {
    gsap.ticker.remove(this._renderPixi)
    if (this._pixiApp) {
      this._pixiApp.destroy(true, { children: true, texture: true })
      this._pixiApp = null
    }
    super._onDestroy()
  }
}
