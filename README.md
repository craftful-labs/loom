# Loom

A [loom](https://en.wikipedia.org/wiki/Loom) weaves threads into fabric. This one weaves Markdown into HTML — a markdown processor built on the unified pipeline, usable in any JavaScript project. Extensible with remark and rehype plugins, and ships with an optional Svelte preprocessor for teams that want `.md` files to compile to components.

## Highlights

- Full CommonMark support out of the box; add GFM or any other remark/rehype plugin as needed
- `createLoom()` renders markdown to HTML in any JavaScript project — no framework dependency
- Async pipeline — works with `rehype-shiki`, `rehype-pretty-code`, and other async plugins
- Optional Svelte preprocessor: `.md` files compile to components, with `<script>` blocks for inline components, filesystem-based prose tag replacement, and code-fence metadata forwarded as props
- Ships a Prettier plugin for formatting `.md` files containing `<script>` blocks

## Install

```bash
pnpm add @craftful/loom
```

## Quick start

**In a JavaScript project** — render Markdown to HTML directly:

```ts
import { createLoom } from '@craftful/loom'

const render = createLoom()
await render('# Hello **world**')
// '<h1>Hello <strong>world</strong></h1>'
```

**In a Svelte project** — register the preprocessor so `.md` files become Svelte components:

```js
// svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { loom } from '@craftful/loom/svelte'

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [loom(), vitePreprocess()]
}
```

```svelte
<script>
  import Post from './post.md'
</script>

<Post />
```

Jump to [JavaScript usage](#javascript-usage) or [Svelte usage](#svelte-usage) for the details.

## JavaScript usage

Use `createLoom()` for a plain markdown-to-HTML processor — no Svelte required.

```ts
import { createLoom } from '@craftful/loom'

const render = createLoom()

await render('# Hello **world**')
// '<h1>Hello <strong>world</strong></h1>'
```

### Plugins

Pass unified plugins via `remarkPlugins` and `rehypePlugins`. Each entry can be a plugin alone or a `[plugin, options]` tuple:

```ts
import { createLoom } from '@craftful/loom'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

const render = createLoom({
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypeSlug, { prefix: 'section-' }]]
})
```

### Security

Raw HTML is passed through unchanged. Loom does not sanitize HTML or URLs — sanitize user-supplied Markdown before rendering (for example, with `rehype-sanitize`).

## Svelte usage

Use `@craftful/loom/svelte` to turn `.md` files into Svelte components.

### Setup

```js
// svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { loom } from '@craftful/loom/svelte'

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [loom(), vitePreprocess()]
}
```

`remark-gfm` is enabled by default, so tables, strikethrough, task lists, autolinks, and footnotes all work out of the box.

### Using `.md` files

Import as a component:

```svelte
<script>
  import Post from './post.md'
</script>

<Post />
```

Or use directly as a SvelteKit route by creating `src/routes/about/+page.md`:

```md
# About

Plain markdown — no Svelte boilerplate required.
```

### Script blocks inside Markdown

Markdown files accept optional `<script>` and `<script module>` blocks at the top, so you can import and use your own Svelte components inline:

```md
<script>
  import Callout from '$lib/Callout.svelte'
</script>

# My post

<Callout tone="info">
Svelte components render inline.
</Callout>
```

### Prose components

Drop Svelte files into `src/lib/loom/prose/` to replace matching HTML tags:

```txt
src/lib/loom/prose/P.svelte      -> <p>
src/lib/loom/prose/H1.svelte     -> <h1>
src/lib/loom/prose/Pre.svelte    -> <pre>
src/lib/loom/prose/Img.svelte    -> <img>
src/lib/loom/prose/A.svelte      -> <a>
```

No config needed — loom scans the directory on startup.

Supported filenames: `A`, `Blockquote`, `Code`, `Em`, `H1`–`H6`, `Hr`, `Img`, `Li`, `Ol`, `P`, `Pre`, `Strong`, `Ul` (each with a `.svelte` suffix).

Scan a different directory with `dir`:

```js
loom({ dir: 'src/lib/components' })
```

### Code-fence metadata

When `Pre.svelte` exists, code-fence info is passed as props:

````md
```ts title="example.ts" showLineNumbers
console.log('hi')
```
````

`Pre.svelte` receives:

```svelte
<script>
  let { lang, code, title, showLineNumbers } = $props()
  // lang = 'ts'
  // code = "console.log('hi')"
  // title = 'example.ts'
  // showLineNumbers = true
</script>
```

`lang` comes from the language identifier. `code` is the fence body. Any `key="value"` or bare `key` that follows is forwarded as a prop.

`Img.svelte` receives `src`, `alt`, and `title` when present.

### Custom components

Drop any `.svelte` file directly in the loom directory (not inside `prose/`), reference it in your Markdown, and loom auto-imports it:

```txt
src/lib/loom/Callout.svelte
```

```md
<Callout tone="info">
Content inside the component.
</Callout>
```

### Custom unified plugins

Add remark or rehype plugins the same way as `createLoom`. The pipeline is async, so async plugins work:

```js
import { loom } from '@craftful/loom/svelte'
import remarkToc from 'remark-toc'
import rehypeShiki from 'rehype-shiki'

export default {
  preprocess: [
    loom({
      remarkPlugins: [[remarkToc, { tight: true }]],
      rehypePlugins: [[rehypeShiki, { theme: 'github-dark' }]]
    })
  ]
}
```

## Prettier plugin

Register the plugin in your Prettier config to format `.md` files that contain `<script>` blocks:

```json
{
  "plugins": ["@craftful/loom/prettier"]
}
```

## Exports

```ts
import { createLoom } from '@craftful/loom'
import type { LoomOptions } from '@craftful/loom'

import { loom } from '@craftful/loom/svelte'
import type { PreprocessorOptions } from '@craftful/loom/svelte'
```

## License

[MIT](./LICENSE)
