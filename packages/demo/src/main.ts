import { SplashScene } from './scene/SplashScene';
import { SceneManager } from './manager/SceneManager';
import './style.css'
import { Stage, DomBaseNode } from 'tiny-stage'
import { UIManager } from './manager/UIManager';
import CONFIG from './config/Config';

const run = async () => {
  const stage = new Stage({
    id: 'root',
    container: document.getElementById('app')!,
    data: CONFIG,
  });

  const sceneContainer = new DomBaseNode({
    id: 'scene-container',
    type: 'container',
    transform: { width: stage.data.width, height: stage.data.height }
  });
  stage.addNode(sceneContainer);

  new SceneManager(stage, sceneContainer);

  const uiContainer = new DomBaseNode({
    id: 'ui-container',
    type: 'container',
    transform: {
      width: stage.data.width,
      height: stage.data.height,
      zIndex: 999
    },
    dom: {
      styles: { pointerEvents: 'none' }
    }
  });
  stage.addNode(uiContainer);

  new UIManager(stage, uiContainer);

  SceneManager.instance.switch(SplashScene, { id: 'splash' });
};

run();
