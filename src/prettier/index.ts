import type { AstPath, Doc, Options, Parser, Plugin, Printer } from 'prettier'

interface MdSvelteNode {
  type: 'md-svelte'
  scriptAttrs: string
  script: string
  markdown: string
}

const scriptRe = /^(<script([^>]*)>)([^<]*(?:<(?!\/script>)[^<]*)*)(<\/script>)\n*/
const svelteOpenLineRe = /^ {0,3}<[A-Z][\w-]*/

function parse(text: string): MdSvelteNode {
  const match = scriptRe.exec(text)
  if (!match) {
    return { type: 'md-svelte', scriptAttrs: '', script: '', markdown: text }
  }
  return {
    type: 'md-svelte',
    scriptAttrs: match[2].trim(),
    script: match[3],
    markdown: text.slice(match[0].length)
  }
}

function splitMarkdown(markdown: string): Array<{ type: 'md' | 'component'; text: string }> {
  const parts: Array<{ type: 'md' | 'component'; text: string }> = []
  const lines = markdown.split('\n')
  let mdLines: string[] = []
  let componentLines: string[] | null = null

  for (const line of lines) {
    if (componentLines !== null) {
      componentLines.push(line)
      if (/^\s*\/>/.test(line) || /^\s*<\/[A-Z]/.test(line)) {
        parts.push({ type: 'component', text: componentLines.join('\n') })
        componentLines = null
      }
    } else if (svelteOpenLineRe.test(line)) {
      if (mdLines.length) {
        parts.push({ type: 'md', text: mdLines.join('\n') })
        mdLines = []
      }
      if (/\/>\s*$/.test(line) || /<\/[A-Z]/.test(line)) {
        parts.push({ type: 'component', text: line })
      } else {
        componentLines = [line]
      }
    } else {
      mdLines.push(line)
    }
  }

  if (componentLines !== null) {
    parts.push({ type: 'component', text: componentLines.join('\n') })
  } else if (mdLines.length) {
    parts.push({ type: 'md', text: mdLines.join('\n') })
  }

  return parts
}

function reformatComponent(text: string): string {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return text
  const result = [lines[0]]
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    result.push(line === '/>' || /^<\/[A-Z]/.test(line) ? line : '  ' + line)
  }
  return result.join('\n')
}

type TextToDoc = (text: string, options: Options) => Promise<Doc>

const printer: Printer<MdSvelteNode> = {
  print() {
    return ''
  },
  embed(path: AstPath<MdSvelteNode>) {
    return async (textToDoc: TextToDoc) => {
      const node = path.node
      const parts: Doc[] = []

      if (node.script) {
        const attrs = node.scriptAttrs ? ` ${node.scriptAttrs}` : ''
        const scriptDoc = await textToDoc(node.script, { parser: 'babel-ts' })
        parts.push(`<script${attrs}>\n`, scriptDoc, '\n</script>')
      }

      if (node.markdown) {
        const segments = splitMarkdown(node.markdown.trimStart())
        const mdParts: Doc[] = []

        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i]
          if (i > 0) mdParts.push('\n\n')
          if (seg.type === 'component') {
            mdParts.push(reformatComponent(seg.text))
          } else if (seg.text.trim()) {
            const doc = await textToDoc(seg.text, { parser: 'markdown' })
            mdParts.push(doc)
          }
        }

        if (parts.length) parts.push('\n\n')
        parts.push(...mdParts)
      }

      return parts
    }
  }
}

const parser: Parser<MdSvelteNode> = {
  parse,
  astFormat: 'md-svelte',
  locStart: () => 0,
  locEnd: (node) => node.script.length + node.markdown.length
}

const plugin: Plugin<MdSvelteNode> = {
  languages: [
    {
      name: 'MdSvelte',
      parsers: ['md-svelte'],
      extensions: ['.md'],
      vscodeLanguageIds: ['markdown']
    }
  ],
  parsers: { 'md-svelte': parser },
  printers: { 'md-svelte': printer }
}

export default plugin
