import { MainMenuScene } from './MainMenuScene';
import { SceneNode, type SceneNodeProps } from './SceneNode';
import { SceneManager } from '../manager/SceneManager';
import { DomTextNode } from 'tiny-stage';

export class SplashScene extends SceneNode {
  constructor(props: SceneNodeProps) {
    super(props);

    this._element.style.backgroundColor = '#f2f2f2';

    const tip = new DomTextNode({
      id: 'tip',
      data: { text: 'Press Any Key To Start' },
      transform: {
        x: this.stage.data.width / 2,
        y: this.stage.data.height - 100,
        width: 400,
        anchorX: 0.5,
        opacity: 0
      },
      dom: {
        styles: {
          fontSize: '32px',
          color: '#333',
        }
      }
    });
    this.addNode(tip);

    tip.to({
      opacity: 0.5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    } as any);
  }

  async onStart() {
    await this.waitClick(
      this.stage,
      () => {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        silentAudio.play();
        silentAudio.remove();
        return false;
      }
    );

    SceneManager.instance.switch(MainMenuScene, { id: 'main-menu' });
  }

  async onEnd() { }
}
