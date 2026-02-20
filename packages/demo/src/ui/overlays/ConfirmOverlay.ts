import { OverlayNode, type OverlayNodeProps } from '../components/OverlayNode';
import { ButtonNode } from '../components/ButtonNode';
import { DomBaseNode, DomTextNode } from 'tiny-stage';

export class ConfirmOverlay extends OverlayNode {
  private _message: DomTextNode;
  private _resolvePromise: ((value: boolean) => void) | null = null;

  constructor(props: OverlayNodeProps) {
    super(props);

    const panel = new DomBaseNode({
      id: 'confirm-panel',
      type: 'container',
      transform: {
        x: this.stage.data.width / 2,
        y: this.stage.data.height / 2,
        anchorX: 0.5,
        anchorY: 0.5,
        width: this.stage.data.width / 2,
        height: this.stage.data.width / 2 * 0.5,
      },
      dom: {
        styles: {
          backgroundColor: '#2D3748',
          border: '2px solid #fff',
        }
      }
    });
    this.addNode(panel);

    this._message = new DomTextNode({
      id: 'confirm-msg',
      data: { text: '确认文字内容' },
      transform: {
        y: 128,
        width: this.stage.data.width / 2,
        height: 72,
      },
      dom: {
        styles: {
          color: '#fff',
          fontSize: '32px',
          textAlign: 'center',
        }
      }
    });
    panel.addNode(this._message);

    const cancelBtn = new ButtonNode({
      id: 'confirm-cancel',
      data: { text: '取消' },
      transform: { x: 50, y: 180 },
      onClick: () => this._handleResult(false)
    });
    const okBtn = new ButtonNode({
      id: 'confirm-ok',
      data: { text: '确定' },
      transform: { x: 300, y: 180 },
      onClick: () => this._handleResult(true)
    });

    panel.addNode(cancelBtn);
    panel.addNode(okBtn);
  }

  public ask(text: string): Promise<boolean> {
    this._message.text = text;
    this.show();

    return new Promise((resolve) => {
      this._resolvePromise = resolve;
    });
  }

  private _handleResult(result: boolean) {
    if (this._resolvePromise) {
      this._resolvePromise(result);
      this._resolvePromise = null;
    }
    this.hide();
  }
}
