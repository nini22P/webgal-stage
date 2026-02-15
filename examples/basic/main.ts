import { Stage, BaseNode, SpriteNode, TypewriterNode, type Tween, VideoNode } from '../../src/index'

const Animation = {
  shake: () => [
    { rotation: 2, duration: 0.05 },
    { rotation: -2, duration: 0.05 },
    { rotation: 1, duration: 0.05 },
    { rotation: -1, duration: 0.05 },
    { rotation: 0, duration: 0.1 },
  ],
  zoomIn: () => [{ scale: 1.1, duration: 0.5 }],
  zoomOut: () => [{ scale: 1, duration: 0.5 }],
  panLeft: () => [{ x: -100, duration: 0.5 }],
  panRight: () => [{ x: 100, duration: 0.5 }],
  reset: () => [{ x: 0, y: 0, scale: 1, rotation: 0, duration: 0.5 }]
}

interface CommandContext {
  camera: BaseNode;
  stage: Stage;
  typewriter: TypewriterNode;
  nameElement: HTMLElement;
}

function initCommands({ stage, camera, typewriter, nameElement }: CommandContext) {

  const waitClick = (callback?: () => boolean | void) => new Promise<void>(resolve => {
    const handler = (_: MouseEvent | TouchEvent) => {
      if (callback?.() === true) return
      stage.element.removeEventListener('click', handler)
      stage.element.removeEventListener('touchstart', handler)
      resolve()
    }
    stage.element.addEventListener('click', handler)
    stage.element.addEventListener('touchstart', handler, { passive: false })
  })

  return {
    say: async ({ name, text }: { name: string, text: string }) => {
      nameElement.textContent = name
      typewriter.play(text, { speed: 0.025 })
      await waitClick(() => {
        if (typewriter.isTypingActive()) {
          typewriter.skip()
          return true
        }
      })
    },

    addSprite: ({ id, src, tween, target = camera }: { id: string, src: string, target?: BaseNode, tween?: Tween }) => {
      const node = new SpriteNode({
        id, src,
        tween: { x: stage.config.width / 2, y: stage.config.height / 2, xPercent: -50, yPercent: -50, ...tween }
      })
      target.addNode(node)
      return node
    },

    video: async ({ src, skip, tween }: { src: string, skip: boolean, tween?: Tween }) => {
      const videoNode = new VideoNode({
        id: 'video', src,
        tween: { width: stage.config.width, height: stage.config.height, opacity: 0, zIndex: 100, backgroundColor: '#000000', ...tween }
      })
      camera.addNode(videoNode)
      await videoNode.to({ opacity: 1, duration: 0.5 })

      if (skip) {
        await Promise.race([videoNode.waitEnded(), waitClick()])
      } else {
        await videoNode.waitEnded()
      }

      await videoNode.to({ opacity: 0, duration: 0.5 })
      videoNode.destroy()
    },

    waitClick
  }
}

async function run() {
  const stage = new Stage({
    container: document.getElementById('app')!,
    id: 'root',
    width: 2560,
    height: 1080,
    debug: true,
    tween: { backgroundColor: '#000000' }
  })

  const camera = new BaseNode({
    id: 'camera',
    tween: { x: 0, y: 0, width: stage.config.width, height: stage.config.height, opacity: 1, overflow: 'visible', zIndex: 1 }
  })
  stage.addNode(camera)

  const dialogBox = new BaseNode({
    id: 'dialog-box',
    tween: {
      x: stage.config.width / 2,
      bottom: 32,
      width: stage.config.width * 0.7,
      height: 240,
      backgroundColor: 'rgba(228, 228, 228, 0.8)',
      opacity: 0,
      zIndex: 10,
      xPercent: -50,
    }
  })
  stage.addNode(dialogBox)

  const typewriter = new TypewriterNode({
    id: 'typewriter',
    tween: { top: 20, right: 40, bottom: 20, left: 40, fontSize: 32, letterSpacing: '4px', color: '#000000' }
  })
  dialogBox.addNode(typewriter)

  const nameBox = new BaseNode({
    id: 'name-box',
    tween: { x: 40, y: -40, width: 200, height: 50, backgroundColor: 'rgba(74, 85, 104, 0.9)' }
  })
  dialogBox.addNode(nameBox)

  const nameElement = document.createElement('div')
  nameElement.style.cssText = 'position:absolute; width:100%; height:100%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold;'
  nameBox.element.appendChild(nameElement)

  const { say, addSprite, video, waitClick } = initCommands({ stage, camera, typewriter, nameElement })

  const bg = addSprite({
    id: 'bg',
    src: './bg.webp',
    tween: {
      width: stage.config.width,
      height: stage.config.height,
      opacity: 0,
    }
  })
  bg.to({ opacity: 1, duration: 1 })

  dialogBox.to({ opacity: 1, duration: 0.5 })

  const char = addSprite({
    id: 'character',
    src: './char.webp',
    tween: {
      y: 960,
      width: 700,
      height: 1400,
      opacity: 0,
      scale: 1.2,
    }
  })
  await char.to({ opacity: 1, scale: 1.3, duration: 0.5 })

  await say({ name: '？？', text: '你好！很高兴见到你。' })

  camera.to({ keyframes: Animation.zoomIn() })
  await say({ name: '？？', text: '超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试' })

  char.to({ keyframes: Animation.zoomIn() })
  await camera.to({ keyframes: Animation.reset() })

  say({ name: '？？', text: '正在播放视频。' })
  await video({ src: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/1080/Big_Buck_Bunny_1080_10s_5MB.webm', skip: true })
  await say({ name: '？？', text: '视频播放结束。' })

  say({ name: '', text: '点击画面重新开始' })
  await waitClick(() => {
    stage.destroy()
    run()
  })
}

run()