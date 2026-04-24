import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { type PluggableList, unified } from 'unified'

export interface LoomOptions {
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
}

export function createLoom(options: LoomOptions = {}): (src: string) => Promise<string> {
  const pipeline = unified()
    .use(remarkParse)
    .use(options.remarkPlugins ?? [])
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(options.rehypePlugins ?? [])
    .use(rehypeStringify, { allowDangerousHtml: true })

  return async (src: string) => String(await pipeline.process(src))
}
