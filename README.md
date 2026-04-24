# Loom

Opinionated markdown preprocessor for Svelte, built on the unified pipeline.

## Features

- `.md` files compile to Svelte components — import them, or use as `+page.md` routes
- Drop a `<script>` block in markdown to import and render Svelte components inline
- Replace any prose tag (`<p>`, `<h1>`, `<pre>`, ...) with your own Svelte component via filesystem convention
- Code-fence metadata forwarded to your `Pre` component as props
- Async pipeline — works with `rehype-shiki`, `rehype-pretty-code`, and other async plugins
- `{` and `}` auto-escaped in rendered output so Svelte doesn't interpret them
- Prettier plugin included

## Install

```bash
pnpm add @craftful/loom
```

## Core API

Use `createLoom()` for markdown → HTML without the Svelte layer.

```ts
import { createLoom } from '@craftful/loom'

const render = createLoom()

await render('# Hello **world**')
// '<h1>Hello <strong>world</strong></h1>'
```

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

Raw HTML is passed through unchanged. Loom does not sanitize HTML or URLs — sanitize before rendering user-supplied markdown.

## Svelte

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

`remark-gfm` is enabled by default, so tables, strikethrough, task lists, autolinks, and footnotes work out of the box.

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

### Script blocks inside markdown

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

Drop any `.svelte` file directly in the loom directory (not inside `prose/`), reference it in your markdown, and loom auto-imports it:

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

## How it works

For every `.md` file the preprocessor:

1. Extracts leading `<script module>` and `<script>` blocks.
2. Parses the remaining markdown with `remark-parse`.
3. Applies `remark-gfm` and any user-provided remark plugins.
4. Converts mdast → hast with `remark-rehype`.
5. Replaces matched prose tags with your Svelte components (`<pre>` becomes `<Pre code="..." lang="..." />`; everything else is renamed in place).
6. Runs any user-provided rehype plugins.
7. Escapes `{` and `}` in text nodes so Svelte doesn't interpret them.
8. Serializes the hast tree to HTML via `rehype-stringify`.
9. Injects the required component imports into the instance `<script>` (creating one if the file doesn't have one).

## Prettier

Loom exposes a Prettier plugin entry:

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

MIT
