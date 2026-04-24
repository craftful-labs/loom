import type { Element, Root } from 'hast'
import { SKIP, visit } from 'unist-util-visit'

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '{': '&#123;',
  '}': '&#125;'
}

export function escapeSvelte(str: string): string {
  return str.replace(/[&<>"'{}]/g, (c) => ESC[c])
}

type MetaValue = string | true

function parseMeta(meta: string): Record<string, MetaValue> {
  const result: Record<string, MetaValue> = {}
  const re = /([A-Za-z_][\w-]*)(?:\s*=\s*(?:"([^"]*)"|([^\s]+)))?/g
  for (const [, key, quoted, unquoted] of meta.matchAll(re)) {
    result[key] = quoted ?? unquoted ?? true
  }
  return result
}

function buildCodeProps(pre: Element): string {
  const codeEl = pre.children.find(
    (c): c is Element => c.type === 'element' && c.tagName === 'code'
  )
  if (!codeEl) return ''

  const attrs: Record<string, MetaValue> = {}
  const cls = (codeEl.properties?.className as string[] | undefined)?.find((c) =>
    c.startsWith('language-')
  )
  const lang = cls?.slice('language-'.length)
  if (lang) attrs.lang = lang

  const value = codeEl.children.map((c) => (c.type === 'text' ? c.value : '')).join('')
  if (value) attrs.code = value

  const meta = codeEl.data?.meta as string | undefined
  if (meta) {
    for (const [k, v] of Object.entries(parseMeta(meta))) {
      if (!(k in attrs)) attrs[k] = v
    }
  }

  const parts = Object.entries(attrs).map(([k, v]) =>
    v === true ? k : `${k}="${escapeSvelte(v)}"`
  )
  return parts.length ? ' ' + parts.join(' ') : ''
}

export function svelteComponents(components: Record<string, string>) {
  return () => (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'pre') {
        const name = components.pre
        if (name && parent && index !== undefined) {
          parent.children[index] = { type: 'raw', value: `<${name}${buildCodeProps(node)} />` }
        }
        return SKIP
      }

      const name = components[node.tagName]
      if (name) node.tagName = name
    })
  }
}
