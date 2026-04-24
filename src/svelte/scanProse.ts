import { existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'

const PROSE_TAGS: Record<string, string> = {
  A: 'a',
  Blockquote: 'blockquote',
  Code: 'code',
  Em: 'em',
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  H5: 'h5',
  H6: 'h6',
  Hr: 'hr',
  Img: 'img',
  Li: 'li',
  Ol: 'ol',
  P: 'p',
  Pre: 'pre',
  Strong: 'strong',
  Ul: 'ul'
}

function listSvelteFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.svelte'))
    .map((d) => d.name)
}

export function scanLoomDir(fullPath: string, relativePath: string) {
  const libPath = relativePath.replace(/^src\/lib\//, '$lib/')
  const prose: Record<string, string> = {}
  const proseImports: string[] = []
  const customRegistry: Record<string, string> = {}

  for (const filename of listSvelteFiles(join(fullPath, 'prose'))) {
    const name = basename(filename, '.svelte')
    const tag = PROSE_TAGS[name]
    if (!tag) continue
    prose[tag] = name
    proseImports.push(`import ${name} from '${libPath}/prose/${filename}'`)
  }

  for (const filename of listSvelteFiles(fullPath)) {
    const name = basename(filename, '.svelte')
    customRegistry[name] = `${libPath}/${filename}`
  }

  return { prose, proseImports, customRegistry }
}
