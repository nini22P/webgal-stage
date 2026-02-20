import { SceneNode, type SceneNodeProps } from './SceneNode';
import { SceneManager } from '../manager/SceneManager';
import { ButtonNode } from '../ui/components/ButtonNode';
import { DomBaseNode } from 'tiny-stage';
import { ScenarioScene } from './ScenarioScene';
import { UIManager } from '../manager/UIManager';
import { script } from '../config/Script';

export class MainMenuScene extends SceneNode {
  constructor(props: SceneNodeProps) {
    super(props);

    this._element.style.backgroundColor = '#333';

    this.addImage({
      id: 'bg',
      src: './image/bg/main_menu.webp',
      transform: { width: this.stage.data.width, height: this.stage.data.height }
    });

    this.bgm.play({ src: './audio/bgm/pure_morning_0.mp3', fade: 1, loop: true });

    const btnGroup = new DomBaseNode({
      id: 'btn-group',
      type: 'container',
      transform: {
        x: this.stage.data.width / 2,
        y: 600,
        width: 300,
        height: 300,
        anchorX: 0.5,
      }
    });
    this.addNode(btnGroup);

    const startBtn = new ButtonNode({
      id: 'start-btn',
      data: { text: '开始游戏' },
      transform: { y: 0, opacity: 0 },
      onClick: () => this.startGame()
    });

    const loadBtn = new ButtonNode({
      id: 'load-btn',
      data: { text: '继续游戏' },
      transform: { y: 100, opacity: 0 },
      onClick: () => this.loadGame()
    });

    const settingsBtn = new ButtonNode({
      id: 'settings-btn',
      data: { text: '设置' },
      transform: { y: 200, opacity: 0 },
      onClick: () => this.openSettings()
    });

    btnGroup.addNode(startBtn);
    btnGroup.addNode(loadBtn);
    btnGroup.addNode(settingsBtn);

    startBtn.to({ opacity: 1, y: 0, duration: 0.5, delay: 0.5 } as any);
    loadBtn.to({ opacity: 1, y: 100, duration: 0.5, delay: 0.7 } as any);
    settingsBtn.to({ opacity: 1, y: 200, duration: 0.5, delay: 0.9 } as any);
  }

  async onStart() { }

  async onEnd() {
    await this.to({ opacity: 0, duration: 1 });
  }

  private async startGame() {
    this.sfx.play({ src: './click.mp3' });
    await this.bgm.stop(1);
    SceneManager.instance.switch(ScenarioScene, { id: 'scenario-scene', data: { script } });
  }

  private loadGame() {
    alert('未实现');
  }

  private openSettings() {
    UIManager.confirm('确认打开设置吗？').then(result => {
      if (result) {
        UIManager.show('settings');
      }
    });
  }
}
