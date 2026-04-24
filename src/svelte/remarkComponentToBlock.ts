import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

const CAPITAL_TAG = /^<[A-Z]/

export function remarkComponentToBlock() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index === undefined || node.children.length !== 1) return
      const [child] = node.children
      if (child.type !== 'html' || !CAPITAL_TAG.test(child.value)) return
      parent.children[index] = child
    })
  }
}
