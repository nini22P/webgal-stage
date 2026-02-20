import { DomBaseNode, DomImageNode, TypewriterNode, DomVideoNode, type NodeTransform } from "tiny-stage";
import { SceneNode, type SceneNodeProps } from "./SceneNode";

export type ScriptTransform = NodeTransform & gsap.TweenVars;

export type ScriptCommand =
  | { cmd: 'bg'; src: string; fade?: number }
  | { cmd: 'image'; id: string; src: string; transform?: ScriptTransform }
  | { cmd: 'image.to'; id: string; transform: ScriptTransform; wait?: boolean }
  | { cmd: 'say'; name: string; text: string; }
  | { cmd: 'bgm'; src: string; volume?: number; loop?: boolean; fade?: number }
  | { cmd: 'video'; src: string; skip?: boolean }
  | { cmd: 'wait'; time: number }
  | { cmd: 'exec'; func: () => Promise<void> | void };

export interface ScenarioSceneData {
  script: ScriptCommand[];
}

export interface ScenarioSceneProps extends SceneNodeProps<ScenarioSceneData> { }

export class ScenarioScene extends SceneNode<ScenarioSceneData> {
  protected dialogBox: DomBaseNode;
  protected typewriter: TypewriterNode;
  protected nameElement: HTMLElement;
  protected nameBox: DomBaseNode;

  constructor(props: ScenarioSceneProps) {
    super(props);

    const dialogBox = new DomBaseNode({
      id: 'dialog-box',
      type: 'container',
      transform: {
        x: this.stage.data.width / 2,
        width: this.stage.data.width * 0.7,
        height: 240,
        opacity: 0,
        zIndex: 10,
        anchorX: 0.5,
      },
      dom: {
        styles: {
          bottom: '32px',
          backgroundColor: 'rgba(228, 228, 228, 0.8)',
        }
      }
    })
    this.addNode(dialogBox)

    const typewriter = new TypewriterNode({
      id: 'typewriter',
      renderer: 'dom',
      dom: {
        styles: {
          top: '20px', right: '40px', bottom: '20px', left: '40px',
          fontSize: '32px', letterSpacing: '4px', color: '#000000'
        }
      }
    })
    dialogBox.addNode(typewriter)

    const nameBox = new DomBaseNode({
      id: 'name-box',
      type: 'container',
      transform: { x: 40, y: -40, width: 200, height: 50 },
      dom: {
        styles: { backgroundColor: 'rgba(74, 85, 104, 0.9)' }
      }
    })
    dialogBox.addNode(nameBox)

    const nameElement = document.createElement('div')
    nameElement.style.cssText = 'position:absolute; width:100%; height:100%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold;'
    nameBox.renderObject.appendChild(nameElement)

    this.nameElement = nameElement;
    this.dialogBox = dialogBox;
    this.typewriter = typewriter;
    this.nameBox = nameBox;
  }

  async onStart() {
    await this.runScript();
  }

  async onEnd() { }

  private async runScript() {
    for (const cmd of this.data.script) {
      switch (cmd.cmd) {
        case 'bg': await this.execBg(cmd); break;
        case 'image': await this.execImage(cmd); break;
        case 'image.to': await this.execImageTo(cmd); break;
        case 'say': await this.execSay(cmd); break;
        case 'bgm':
          this.bgm.play({ src: cmd.src, volume: cmd.volume ?? 1, fade: cmd.fade ?? 0, loop: cmd.loop ?? true });
          break;
        case 'video': await this.execVideo(cmd); break;
        case 'wait': await new Promise(r => setTimeout(r, cmd.time)); break;
        case 'exec': if (cmd.func) await cmd.func(); break;
      }
    }
  }

  private async execBg(cmd: { src: string, fade?: number }) {
    let bg = this.findImage('bg');
    if (!bg) {
      bg = this.createImage('bg', cmd.src, { width: this.stage.data.width, height: this.stage.data.height, opacity: 0 });
    }
    await bg.to({ opacity: 1, duration: cmd.fade ?? 1 });
  }

  private async execImage(cmd: { id: string, src: string, transform?: ScriptTransform }) {
    let image = this.findImage(cmd.id);
    if (!image) {
      const defaultTransform: ScriptTransform = {
        x: this.stage.data.width / 2,
        y: this.stage.data.height / 2,
        anchorX: 0.5,
        anchorY: 0.5,
        ...cmd.transform
      };
      this.createImage(cmd.id, cmd.src, defaultTransform);
    } else {
      if (cmd.transform) await image.to(cmd.transform);
    }
  }

  private async execImageTo(cmd: { id: string, transform: ScriptTransform, wait?: boolean }) {
    const image = this.findImage(cmd.id);
    if (image) {
      const anim = image.to(cmd.transform);
      if (cmd.wait) await anim;
    }
  }

  private async execSay(cmd: { name: string, text: string }) {
    if (this.dialogBox.transform.opacity === 0) {
      await this.dialogBox.to({ opacity: 1, duration: 0.3 });
    }

    this.nameElement.textContent = cmd.name;
    this.nameBox.to({ opacity: cmd.name ? 1 : 0, duration: 0.2 });

    await this.typewriter.play(cmd.text, { speed: 0.05 });

    await this.waitClick(this, () => {
      if (this.typewriter.isTypingActive()) {
        this.typewriter.skip();
        return true;
      }
      return false;
    });
  }

  private async execVideo(cmd: { src: string, skip?: boolean }) {
    const videoNode = new DomVideoNode({
      id: 'video-overlay',
      renderer: 'dom',
      data: { src: cmd.src },
      transform: {
        width: this.stage.data.width,
        height: this.stage.data.height,
        opacity: 0,
        zIndex: 999,
      },
      dom: {
        styles: { backgroundColor: '#000' }
      }
    });
    this.addNode(videoNode);

    await videoNode.to({ opacity: 1, duration: 0.5 });
    const playPromise = videoNode.waitEnded();

    if (cmd.skip) {
      await Promise.race([playPromise, this.waitClick()]);
    } else {
      await playPromise;
    }

    await videoNode.to({ opacity: 0, duration: 0.5 });
    videoNode.destroy();
  }

  private createImage(id: string, src: string, transform: ScriptTransform) {
    const node = new DomImageNode({
      id,
      renderer: 'dom',
      data: { src },
      transform
    });
    this.camera.addNode(node);
    return node;
  }

  private findImage(id: string): DomImageNode | undefined {
    return (this.camera as any)._children.find((c: any) => c.id === id);
  }
}
