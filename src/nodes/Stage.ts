import gsap from 'gsap'
import { Logger, LogLevel } from '../utils/Logger'
import { BaseNode, type BaseNodeProps } from './BaseNode'

export interface StageConfig extends Omit<BaseNodeProps, 'id' | 'type'> {
  container: HTMLElement;
  width: number;
  height: number;
  debug?: boolean;
}

export class Stage extends BaseNode {
  private config: StageConfig
  private resizeObserver: ResizeObserver
  private resizeTimer: number | null = null

  constructor(config: StageConfig) {
    super({
      type: 'stage',
      id: 'root',
      tween: {
        x: 0,
        y: 0,
        width: config.width,
        height: config.height,
        overflow: 'hidden',
        userSelect: 'none',
      }
    })

    if (config.debug) {
      Logger.setLevel(LogLevel.DEBUG)
    }

    Logger.info('Stage initializing...', {
      width: config.width,
      height: config.height,
      debug: config.debug
    })

    this.config = config
    this.setupStage()
    this.updateLayout()

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimer !== null) {
        cancelAnimationFrame(this.resizeTimer)
      }
      this.resizeTimer = requestAnimationFrame(() => {
        this.updateLayout()
        this.resizeTimer = null
      })
    })
    this.resizeObserver.observe(config.container)

    this.emit('stageCreated', this)
    Logger.info('Stage initialized successfully')
  }

  private setupStage(): void {
    this.element.style.position = 'absolute'
    this.element.style.transformOrigin = 'top left'
    this.config.container.appendChild(this.element)
  }

  private updateLayout(): void {
    const { container, width, height } = this.config
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const scaleX = containerWidth / width
    const scaleY = containerHeight / height
    const scale = Math.min(scaleX, scaleY)

    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const offsetX = (containerWidth - scaledWidth) / 2
    const offsetY = (containerHeight - scaledHeight) / 2

    gsap.set(this.element, {
      width: width,
      height: height,
      x: offsetX,
      y: offsetY,
      scale: scale
    })

    this.emit('layoutUpdated', { scale, offsetX, offsetY })
    Logger.debug('Layout updated', { scale, offsetX, offsetY })
  }

  public destroy(): void {
    this.emit('beforeDestroy', this)
    Logger.info('Destroying stage...')

    if (this.resizeTimer !== null) {
      cancelAnimationFrame(this.resizeTimer)
      this.resizeTimer = null
    }

    this.resizeObserver.disconnect()

    super.destroy()

    Logger.info('Stage destroyed')
  }
}

