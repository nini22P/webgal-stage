import { Stage, BaseNode, SpriteNode, TypewriterNode } from '../../src/index'
import { type Tween } from '../../src/nodes/BaseNode'

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

async function run() {
  const stage = new Stage({
    container: document.getElementById('app')!,
    id: 'root',
    width: 1920,
    height: 1080,
    debug: true,
    tween: { backgroundColor: '#000000' }
  })

  const camera = new BaseNode({
    id: 'camera',
    tween: { x: 0, y: 0, width: 1920, height: 1080, opacity: 1, overflow: 'visible', zIndex: 1 }
  })
  stage.addNode(camera)

  const background = new BaseNode({
    id: 'background',
    tween: { x: 0, y: 0, width: 1920, height: 1080, opacity: 0, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }
  })
  camera.addNode(background)

  const dialogBox = new BaseNode({
    id: 'dialog-box',
    tween: { x: 160, y: 780, width: 1600, height: 240, backgroundColor: 'rgba(228, 228, 228, 0.8)', opacity: 0, zIndex: 10 }
  })
  stage.addNode(dialogBox)

  const typewriterNode = new TypewriterNode({
    id: 'typewriter-node',
    text: '',
    tween: { top: 20, right: 40, bottom: 20, left: 40, fontSize: 32, letterSpacing: '4px', color: '#000000' }
  })
  dialogBox.addNode(typewriterNode)

  const nameBox = new BaseNode({
    id: 'name-box',
    tween: { x: 40, y: -40, width: 200, height: 50, backgroundColor: 'rgba(74, 85, 104, 0.9)' }
  })
  dialogBox.addNode(nameBox)

  const nameDiv = document.createElement('div')
  nameDiv.style.cssText = 'position:absolute; width:100%; height:100%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold;'
  nameBox.element.appendChild(nameDiv)

  const waitClick = () => new Promise<void>(resolve => {
    const handler = () => {
      if (typewriterNode.isTypingActive()) {
        typewriterNode.skip()
      } else {
        stage.element.removeEventListener('click', handler)
        resolve()
      }
    }
    stage.element.addEventListener('click', handler)
  })

  async function say(name: string, text: string) {
    nameDiv.textContent = name
    typewriterNode.play(text, { speed: 0.025 })
    await waitClick()
  }

  function addChar(src: string, side: 'left' | 'center' | 'right', tween?: Tween): SpriteNode & { promise: Promise<SpriteNode> } {
    const charNode = new SpriteNode({
      id: `character-${side}`,
      src,
      tween: {
        x: side === 'left' ? 480 : side === 'right' ? 1440 : 960,
        y: 960,
        width: 700,
        height: 1400,
        opacity: 0,
        xPercent: -50,
        yPercent: -50,
        scale: 1.2,
        ...tween,
      }
    })

    camera.addNode(charNode)

    const promise = charNode.to({ opacity: 1, duration: 0.5, scale: 1.3 });

    (charNode as SpriteNode & { promise: Promise<SpriteNode> }).promise = promise

    return charNode as SpriteNode & { promise: Promise<SpriteNode> }
  }

  async function setBg(src: string) {
    await background.to({ backgroundImage: `url(${src})`, opacity: 1, duration: 1 })
  }

  setBg('./bg.webp')
  dialogBox.to({ opacity: 1, duration: 0.5 })

  const char = addChar('./char.webp', 'center')
  await say('？？', '你好！很高兴见到你。')
  camera.to({ keyframes: Animation.zoomIn() })
  await say('？？', '超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试超长文字测试')
  await say('??', 'Hello World!')
  char.to({ keyframes: Animation.shake() })
  await camera.to({ keyframes: Animation.reset() })
  nameDiv.textContent = ''
  typewriterNode.text = '点击画面重新开始'
  stage.element.addEventListener('click',
    () => {
      stage.destroy()
      run()
    },
    { once: true }
  )
}

run()