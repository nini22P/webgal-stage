import { Stage, BaseNode } from '../../src/index'

const stage = new Stage({
  container: document.getElementById('app')!,
  width: 1920,
  height: 1080,
  debug: true,
  tween: {
    backgroundColor: '#000000',
  }
})

const camera = new BaseNode({
  id: 'camera',
  tween: {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    opacity: 1,
    overflow: 'visible',
    zIndex: 1,
  }
})

stage.addNode(camera)

const background = new BaseNode({
  id: 'background',
  tween: {
    x: -400,
    y: -400,
    width: 2720,
    height: 1880,
    backgroundColor: '#1a1a2e',
    opacity: 0,
  }
})

camera.addNode(background)

background.container.style.background = `
  radial-gradient(ellipse at center, #2d3748 0%, #1a1a2e 70%)
`

const DEBUG_MODE = false
if (DEBUG_MODE) {
  const viewportBorder = new BaseNode({
    id: 'viewport-border',
    tween: {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      opacity: 1,
      zIndex: 100,
    }
  })
  camera.addNode(viewportBorder)
  viewportBorder.container.style.border = '3px dashed rgba(255, 0, 0, 0.5)'
  viewportBorder.container.style.pointerEvents = 'none'

  const label = document.createElement('div')
  label.textContent = '舞台可视区域 (1920x1080)'
  label.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    color: rgba(255, 0, 0, 0.8);
    font-size: 16px;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.5);
    padding: 5px 10px;
    border-radius: 3px;
  `
  viewportBorder.container.appendChild(label)
}

const characterLeft = new BaseNode({
  id: 'character-left',
  tween: {
    x: 200,
    y: 200,
    width: 400,
    height: 800,
    backgroundColor: '#4a5568',
    opacity: 0,
  }
})
camera.addNode(characterLeft)

const characterRight = new BaseNode({
  id: 'character-right',
  tween: {
    x: 1320,
    y: 200,
    width: 400,
    height: 800,
    backgroundColor: '#718096',
    opacity: 0,
  }
})
camera.addNode(characterRight)

const dialogBox = new BaseNode({
  id: 'dialog-box',
  tween: {
    x: 160,
    y: 780,
    width: 1600,
    height: 240,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    opacity: 0,
    zIndex: 10,
    overflow: 'visible',
  }
})
stage.addNode(dialogBox)

dialogBox.container.style.border = '3px solid rgba(255, 255, 255, 0.3)'
dialogBox.container.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)'

const nameBox = new BaseNode({
  id: 'name-box',
  tween: {
    x: 40,
    y: -40,
    width: 200,
    height: 50,
    backgroundColor: 'rgba(74, 85, 104, 0.9)',
    zIndex: 1,
  }
})
dialogBox.addNode(nameBox)

nameBox.container.style.border = '2px solid rgba(255, 255, 255, 0.3)'

const lightEffect1 = new BaseNode({
  id: 'light-1',
  tween: {
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0,
  }
})
camera.addNode(lightEffect1)
lightEffect1.container.style.borderRadius = '50%'
lightEffect1.container.style.filter = 'blur(40px)'

const lightEffect2 = new BaseNode({
  id: 'light-2',
  tween: {
    x: 1620,
    y: 780,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 200, 150, 0.05)',
    opacity: 0,
  }
})
camera.addNode(lightEffect2)
lightEffect2.container.style.borderRadius = '50%'
lightEffect2.container.style.filter = 'blur(40px)'

const textDiv = document.createElement('div')
textDiv.style.cssText = `
  position: absolute;
  left: 40px;
  top: 30px;
  width: 1520px;
  color: #fff;
  font-size: 28px;
  line-height: 1.8;
  padding: 20px;
`
dialogBox.container.appendChild(textDiv)

const nameDiv = document.createElement('div')
nameDiv.style.cssText = `
  position: absolute;
  width: 200px;
  height: 50px;
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
`
nameBox.container.appendChild(nameDiv)

function cameraEffect(effect: 'shake' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'reset') {
  if (effect === 'shake') {
    camera.to({
      keyframes: [
        { rotation: 2, duration: 0.05 },
        { rotation: -2, duration: 0.05 },
        { rotation: 1, duration: 0.05 },
        { rotation: -1, duration: 0.05 },
        { rotation: 0, duration: 0.1 },
      ]
    })
  } else if (effect === 'zoom-in') {
    camera.to({ scale: 1.2, duration: 0.5 })
  } else if (effect === 'zoom-out') {
    camera.to({ scale: 0.85, duration: 0.5 })
  } else if (effect === 'pan-left') {
    camera.to({ x: 180, duration: 0.5 })
  } else if (effect === 'pan-right') {
    camera.to({ x: -180, duration: 0.5 })
  } else if (effect === 'reset') {
    camera.to({ scale: 1, x: 0, y: 0, rotation: 0, duration: 0.5 })
  }
}

interface ScriptLine {
  name: string;
  text: string;
  left?: 'show' | 'hide' | 'dim';
  right?: 'show' | 'hide' | 'dim';
  camera?: 'shake' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'reset';
  bgColor?: string;
}

const script: ScriptLine[] = [
  {
    name: '旁白',
    text: '这是一个宁静的午后，阳光透过窗户洒进房间...',
    left: 'hide',
    right: 'hide',
    camera: 'zoom-out'
  },
  {
    name: '小明',
    text: '你好！很高兴见到你。',
    left: 'show',
    right: 'hide',
    camera: 'reset'
  },
  {
    name: '小红',
    text: '啊！你好！我也很高兴见到你。',
    left: 'dim',
    right: 'show',
    camera: 'pan-right'
  },
  {
    name: '小明',
    text: '今天天气真不错呢。',
    left: 'show',
    right: 'dim',
    camera: 'pan-left'
  },
  {
    name: '小红',
    text: '是啊，要不要一起去散步？',
    left: 'dim',
    right: 'show',
    camera: 'zoom-in'
  },
  {
    name: '小明',
    text: '好啊！走吧！',
    left: 'show',
    right: 'dim',
    camera: 'shake'
  },
  {
    name: '旁白',
    text: '两人一起走向了夕阳...',
    left: 'hide',
    right: 'hide',
    camera: 'reset',
    bgColor: '#ff9a76'
  },
]

let currentLine = 0

function showDialog(index: number) {
  if (index >= script.length) {
    textDiv.textContent = '故事结束 - 点击刷新重新开始'
    nameDiv.textContent = ''
    stage.container.addEventListener('click', () => location.reload(), { once: true })
    return
  }

  const line = script[index]
  nameDiv.textContent = line.name
  textDiv.textContent = line.text

  if (line.left === 'show') {
    characterLeft.to({ opacity: 1, scale: 1.05, duration: 0.3 })
    characterRight.to({ opacity: 0.5, scale: 1, duration: 0.3 })
  } else if (line.left === 'dim') {
    characterLeft.to({ opacity: 0.5, scale: 1, duration: 0.3 })
  } else if (line.left === 'hide') {
    characterLeft.to({ opacity: 0, duration: 0.3 })
  }

  if (line.right === 'show') {
    characterRight.to({ opacity: 1, scale: 1.05, duration: 0.3 })
    characterLeft.to({ opacity: 0.5, scale: 1, duration: 0.3 })
  } else if (line.right === 'dim') {
    characterRight.to({ opacity: 0.5, scale: 1, duration: 0.3 })
  } else if (line.right === 'hide') {
    characterRight.to({ opacity: 0, duration: 0.3 })
  }

  if (line.camera) {
    cameraEffect(line.camera)
  }

  if (line.bgColor) {
    background.to({ background: line.bgColor, duration: 1 })
  }
}

background.to({ opacity: 1, duration: 1 })
setTimeout(() => {
  lightEffect1.to({ opacity: 1, duration: 2 })
  lightEffect2.to({ opacity: 1, duration: 2 })
}, 300)
setTimeout(() => {
  dialogBox.to({ opacity: 1, duration: 2 })
}, 500)
setTimeout(() => showDialog(0), 1000)

stage.container.addEventListener('click', () => {
  currentLine++
  showDialog(currentLine)
})
