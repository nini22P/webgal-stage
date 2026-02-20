import { ButtonNode } from "../components/ButtonNode";
import { OverlayNode, type OverlayNodeProps } from "../components/OverlayNode";

export class SettingsOverlay extends OverlayNode {
  constructor(props: OverlayNodeProps) {
    super(props);
    const closeBtn = new ButtonNode({
      id: 'close-settings',
      data: { text: '返回游戏' },
      onClick: () => this.hide(),
      transform: { x: this.stage.data.width - 340, y: 40 }
    });
    this.addNode(closeBtn);
  }
}
