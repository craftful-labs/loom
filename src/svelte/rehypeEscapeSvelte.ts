import type { Root } from 'hast'
import { visit } from 'unist-util-visit'
import { escapeSvelte } from './components'

export function rehypeEscapeSvelte() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!/[{}]/.test(node.value) || !parent || index === undefined) return
      parent.children[index] = { type: 'raw', value: escapeSvelte(node.value) }
    })
  }
}
