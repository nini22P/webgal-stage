import gsap from 'gsap'
import { Logger, LogLevel } from '../utils/Logger'
import { BaseNode, type NodeKeyframe, type NodeProps, type NodeTransform } from './base/BaseNode'
import { DomBaseNode } from './dom/DomBaseNode'
import * as PIXI from 'pixi.js'
import { PixiBaseNode } from './pixi/PixiBaseNode'

export interface SceneProps {
  id: string;
  config: StageConfig;
  nodes: NodeProps<Record<string, unknown>>[];
  animations?: Record<string, NodeKeyframe[]>;
}

export interface NodeAction {
  action: string;
  params?: Record<string, unknown>;
}

export type AnyNode = DomBaseNode<HTMLElement, unknown> | PixiBaseNode<PIXI.Container, unknown>

type NodeConstructor = new (props: NodeProps<unknown>) => AnyNode

export interface StageConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  debug?: boolean;
}

export class Stage extends DomBaseNode<HTMLElement, StageConfig> {
  private static _domRegistry = new Map<string, NodeConstructor>()
  private static _pixiRegistry = new Map<string, NodeConstructor>()

  private _allNodes = new Map<string, AnyNode>()

  public static registerNode(
    type: string,
    nodeClass: NodeConstructor,
    renderer: 'dom' | 'pixi' = 'dom'
  ): void {
    if (renderer === 'dom') {
      if (!(nodeClass.prototype instanceof DomBaseNode)) {
        Logger.warn(`Registering DOM node ${type} but class does not extend DomBaseNode`)
      }
      this._domRegistry.set(type, nodeClass)
    } else {
      if (!(nodeClass.prototype instanceof PixiBaseNode)) {
        Logger.warn(`Registering Pixi node ${type} but class does not extend PixiBaseNode`)
      }
      this._pixiRegistry.set(type, nodeClass)
    }
    Logger.info(`Node registered: [${renderer}] ${type}`)
  }

  public container: HTMLElement
  private _resizeObserver: ResizeObserver
  private _resizeTimer: number | null = null

  constructor(
    props: {
      id: string;
      container: HTMLElement;
      data?: Partial<StageConfig>;
      transform?: NodeTransform;
    }) {
    const config: StageConfig = {
      width: 1920,
      height: 1080,
      debug: false,
      ...props.data,
    }

    super({
      id: props.id,
      type: 'stage',
      tagName: 'div',
      data: config,
      transform: {
        width: config.width,
        height: config.height,
        ...props.transform
      },
      dom: {
        styles: {
          overflow: 'hidden',
          userSelect: 'none',
          transformOrigin: '0 0',
          position: 'relative',
        }
      }
    })

    this.container = props.container
    this._allNodes.set(this.id, this)

    if (config.debug) {
      Logger.setLevel(LogLevel.DEBUG)
    }

    this.container.appendChild(this._element)

    this._updateLayout()
    this._resizeObserver = new ResizeObserver(() => {
      if (this._resizeTimer !== null)
        cancelAnimationFrame(this._resizeTimer)
      this._resizeTimer = requestAnimationFrame(() => {
        this._updateLayout()
        this._resizeTimer = null
      })
    })
    this._resizeObserver.observe(this.container)

    Logger.info('Stage initialized', { size: `${config.width}x${config.height}` })
  }

  public load(scene: SceneProps): void {
    const startTime = performance.now()
    const seenIds = new Set<string>()
    seenIds.add(this.id)

    if (scene.config) {
      this.updateData(scene.config)
      if (scene.config.backgroundColor) {
        this._element.style.backgroundColor = scene.config.backgroundColor
      }
    }

    if (scene.nodes) {
      this._reconcileNodes(scene.nodes, this, seenIds)
    }

    for (const [id, node] of this._allNodes.entries()) {
      if (!seenIds.has(id)) {
        node.destroy()
        this._allNodes.delete(id)
      }
    }

    const duration = performance.now() - startTime
    Logger.debug(`Scene applied in ${duration.toFixed(2)}ms, active nodes: ${this._allNodes.size}`)
  }

  private _reconcileNodes(schemas: NodeProps[], parent: BaseNode<unknown>, seenIds: Set<string>): void {
    schemas.forEach(schema => {
      seenIds.add(schema.id)
      let node = this._allNodes.get(schema.id)

      if (node) {
        if (node.type !== schema.type) {
          node.destroy()
          node = this.createNode(schema)
          parent.addNode(node)
          this._allNodes.set(node.id, node)
        } else {
          if (schema.data) node.updateData(schema.data)
          if (schema.transform) node.set(schema.transform)

          if (node['_parent'] !== parent) {
            parent.addNode(node)
          }
        }
      } else {
        node = this.createNode(schema)
        parent.addNode(node)
      }

      if (schema.children) {
        this._reconcileNodes(schema.children, node, seenIds)
      }
    })
  }

  public createNode(schema: NodeProps): AnyNode {
    const renderer = schema.renderer || 'dom'

    let NodeClass: NodeConstructor | undefined

    if (renderer === 'dom') {
      NodeClass = Stage._domRegistry.get(schema.type)
      if (!NodeClass) NodeClass = DomBaseNode
    } else {
      NodeClass = Stage._pixiRegistry.get(schema.type)
      if (!NodeClass) NodeClass = PixiBaseNode as unknown as NodeConstructor
    }

    const node = new NodeClass({
      id: schema.id,
      type: schema.type,
      renderer: renderer,
      data: schema.data,
      transform: schema.transform,
      dom: schema.dom,
      pixi: schema.pixi
    })

    this._allNodes.set(node.id, node)

    return node
  }

  public findNodeById(id: string): AnyNode | undefined {
    return this._allNodes.get(id)
  }

  private _updateLayout(): void {
    const container = this.container
    const { width, height } = this.data
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const scale = Math.min(containerWidth / width, containerHeight / height)
    const offsetX = Math.round((containerWidth - width * scale) / 2)
    const offsetY = Math.round((containerHeight - height * scale) / 2)

    gsap.set(this._element, {
      x: offsetX,
      y: offsetY,
      scale: scale
    })

    this.transform.x = offsetX
    this.transform.y = offsetY
    this.transform.scaleX = scale
    this.transform.scaleY = scale
  }

  protected override _onDestroy(): void {
    Logger.info('Stage destroying...')
    if (this._resizeTimer !== null)
      cancelAnimationFrame(this._resizeTimer)
    this._resizeObserver.disconnect()
    this._allNodes.clear()
    super._onDestroy()
    Logger.info('Stage destroyed')
  }
}