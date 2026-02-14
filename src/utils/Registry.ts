import { BaseNode } from '../nodes/BaseNode'

type NodeConstructor = new (id: string) => BaseNode;

export class Registry {
  private static map = new Map<string, NodeConstructor>()

  static register(type: string, ctor: NodeConstructor) {
    this.map.set(type, ctor)
  }

  static create(type: string, id: string): BaseNode {
    const Ctor = this.map.get(type)
    if (!Ctor) throw new Error(`Unknown type: ${type}`)
    return new Ctor(id)
  }
}