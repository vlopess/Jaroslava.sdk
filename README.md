# Jaroslava SDK

A framework-agnostic toolkit for parsing, validating, serializing, and
rendering the **Jaroslava** markup language — the syntax used to author
Jaroslava websites (`.jaro` files).

```jaro
@page
  title: "Sarah Okonkwo"
  layout: linkhub
  theme: dark

@profile
  name: Sarah Okonkwo
  role: Designer & Maker
  avatar: "sarah.jpg"

@list
  direction: column
  img("link.com") + Portfolio -> "sarahokonkwo.com"
```

The AST produced by this SDK is the single source of truth for the entire
Jaroslava ecosystem — editors, previews, exports, all build on top of it.

## Packages

| Package | Purpose |
|---|---|
| [`@jaroslava/types`](./packages/types) | AST node shapes + plugin contracts |
| [`@jaroslava/utils`](./packages/utils) | AST traversal, id/string helpers, inline parser |
| [`@jaroslava/core`](./packages/core) | Plugin registry, context |
| [`@jaroslava/parser`](./packages/parser) | `.jaro` source → AST |
| [`@jaroslava/serializer`](./packages/serializer) | AST → standardized `.jaro` source |
| [`@jaroslava/validator`](./packages/validator) | AST → validation diagnostics |
| [`@jaroslava/renderer-html`](./packages/renderer-html) | AST → HTML + CSS |
| [`@jaroslava/plugin-core-components`](./packages/plugin-core-components) | Standard component set (`@page`, `@hero`, `@card`, ...), shipped as an ordinary plugin |
| [`@jaroslava/sdk`](./packages/sdk) | Convenience facade bundling the above |


## Getting started

```bash
npm i @jaroslava/sdk
```

## Quick usage

```ts
import { createDefaultSdk } from "@jaroslava/sdk";

const sdk = await createDefaultSdk();

const { value: ast, diagnostics } = sdk.parse(jaroSource);
const { ok } = sdk.validate(ast);
const { value: jaroOut } = sdk.serialize(ast);
const { pages } = sdk.renderHtml(ast);
```

## Runtime support

- **Browser** — all packages are plain ESM with no Node-only APIs in
  their public surface.
- **Node.js** — works out of the box; written and built in TypeScript.
- **SSR** — `renderHtml()` is a pure function of `(ast, registry,
  options)`; call it on the server per-request with no shared mutable
  state beyond the registry you choose to reuse.
- **Static generation** — call `parse()` + `renderHtml()` at build time
  and write `pages[i].html` to disk; no browser APIs are required.

## Monorepo tooling

- **pnpm workspaces** for strict, enforced inter-package dependencies.
- **Turborepo** for cached, parallelized builds/tests across packages.
- **TypeScript project references** so `tsc -b` builds packages in
  dependency order with full cross-package type-checking.
- **Changesets** for independent per-package semver releases.

## Notes
> This software was built with the help of Claude. Once the requirements, architecture, features, and modularity were defined, the AI ​​was |used to create the project. After the boilerplate was generated, I extended and continued the work manually, just as a software developer does.

## License

MIT
