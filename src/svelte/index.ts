import { join } from 'node:path'
import remarkGfm from 'remark-gfm'
import type { PluggableList } from 'unified'
import { createLoom } from '../core'
import { svelteComponents } from './components'
import { rehypeEscapeSvelte } from './rehypeEscapeSvelte'
import { remarkComponentToBlock } from './remarkComponentToBlock'
import { scanLoomDir } from './scanProse'

export interface PreprocessorOptions {
  dir?: string
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
}

const moduleScriptRe = /^(<script\b[^>]*\bmodule\b[^>]*>)([\s\S]*?)<\/script>\n*/
const instanceScriptRe = /^(<script(?![^>]*\bmodule\b)[^>]*>)([\s\S]*?)<\/script>\n*/

export function loom(options: PreprocessorOptions = {}) {
  const { dir = 'src/lib/loom' } = options
  const { prose, proseImports, customRegistry } = scanLoomDir(join(process.cwd(), dir), dir)

  const render = createLoom({
    remarkPlugins: [remarkComponentToBlock, remarkGfm, ...(options.remarkPlugins ?? [])],
    rehypePlugins: [svelteComponents(prose), ...(options.rehypePlugins ?? []), rehypeEscapeSvelte]
  })

  return {
    async markup({ content, filename }: { content: string; filename: string }) {
      if (!filename.endsWith('.md')) return

      const mod = moduleScriptRe.exec(content)
      const afterMod = mod ? content.slice(mod[0].length) : content
      const inst = instanceScriptRe.exec(afterMod)
      const body = inst ? afterMod.slice(inst[0].length) : afterMod
      const rendered = await render(body)

      const customImports = Object.entries(customRegistry)
        .filter(([name]) => new RegExp(`<${name}[\\s/>]`).test(content))
        .map(([name, path]) => `import ${name} from '${path}'`)
      const imports = [...proseImports, ...customImports].join('\n')

      if (!imports) {
        return { code: (mod?.[0] ?? '') + (inst?.[0] ?? '') + rendered }
      }

      const script = inst
        ? `${inst[1]}\n${imports}\n${inst[2].trimStart()}</script>`
        : `<script>\n${imports}\n</script>`

      const parts = [...(mod ? [mod[0].trimEnd()] : []), script, rendered]
      return { code: parts.join('\n\n') }
    }
  }
}
