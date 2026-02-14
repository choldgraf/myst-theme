# Design: Listing Plugin + Blog Plugin

## Overview

Split the concept of "blog" into two layers:

1. **`myst-ext-listing`** — A generic directive and JS API for generating MyST output from structured data and file metadata. Knows nothing about blogs.
2. **`myst-ext-blog`** — A blog plugin that consumes the listing API to provide blog-specific directives, defaults, and features (RSS, date archives, etc.).

This document proposes the design for the **listing plugin**, with a brief sketch of how the blog plugin would consume it.

---

## Design Principles

- **One line to start.** The simplest listing is a glob pattern — everything else has defaults.
- **Metadata-driven.** Items come from document frontmatter. No special schema required.
- **Declarative.** Users configure listings in YAML/directive options, not code.
- **Extensible via JS API.** Other plugins (like blog) can define new directives that delegate to the listing engine under the hood.

---

## User-Facing Directive: `{listing}`

### Minimal usage

````md
:::{listing} posts/*
:::
````

This finds all MyST documents matching `posts/*`, extracts their frontmatter, and renders a list of items showing `title`, `date`, `description`, and `image` (the defaults).

### Full options

````md
:::{listing} posts/**
:sort: date desc
:limit: 10
:fields: title, date, author, description
:type: list
:filter: category == "analysis"
:::
````

### Option reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contents` (positional) | glob or list | `./*` | Glob pattern(s) for source documents, or inline YAML items |
| `sort` | string | `title asc` | Sort field and direction (`asc`/`desc`). Multiple: `date desc, title asc` |
| `limit` | number | none | Maximum items to display |
| `fields` | comma-sep list | `title, date, description, image` | Which frontmatter fields to display, in order |
| `type` | `list` \| `grid` \| `table` | `list` | Built-in layout |
| `filter` | string | none | Simple field-based filter expression |
| `image-height` | CSS value | `auto` | Constrain item image height |
| `page-size` | number | `25` | Items per page (0 = no pagination) |

### Content sources

The positional argument accepts:

1. **Glob patterns** — resolved relative to the directive's file location:
   ```
   :::{listing} posts/**
   ```

2. **Multiple patterns** — comma-separated:
   ```
   :::{listing} posts/**, reports/*.md
   ```

3. **Inline YAML data** — for items that aren't MyST documents:
   ````md
   :::{listing}
   - title: External Post
     url: https://example.com/post
     date: 2025-01-15
     description: A post hosted elsewhere
   - title: Another Item
     url: https://example.com/other
     date: 2025-02-01
   :::
   ````

4. **Mixed** — glob patterns in the option, inline items in the body:
   ````md
   :::{listing} posts/**
   - title: Pinned Post
     url: /announcements/welcome
     date: 2025-01-01
     pinned: true
   :::
   ````

### Filter expressions

A minimal filter syntax for common cases:

```
:filter: category == "analysis"
:filter: date >= "2025-01-01"
:filter: author != "Draft"
:filter: tags contains "python"
```

No boolean combinators in v1. Just single field comparisons. Operators: `==`, `!=`, `>=`, `<=`, `>`, `<`, `contains`.

---

## Layout Types

### `list` (default)

Vertical list. Each item is a row:

```
┌─────────────────────────────────────────┐
│ [image]  Title                          │
│          Author · Jan 15, 2025          │
│          Description text here...       │
└─────────────────────────────────────────┘
```

### `grid`

Card grid (responsive columns):

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  [image]  │  │  [image]  │  │  [image]  │
│  Title    │  │  Title    │  │  Title    │
│  Date     │  │  Date     │  │  Date     │
└──────────┘  └──────────┘  └──────────┘
```

### `table`

Tabular layout with columns matching `fields`:

```
| Title          | Author    | Date       |
|----------------|-----------|------------|
| My Post        | Alice     | 2025-01-15 |
| Another Post   | Bob       | 2025-02-01 |
```

---

## JS API (for plugin authors)

This is how the blog plugin (or any other plugin) would use the listing engine programmatically.

### Core types

```typescript
/** A single item in a listing, derived from document frontmatter or inline data */
interface ListingItem {
  /** Resolved URL/path to the source document (null for inline items) */
  slug: string | null;
  /** The full frontmatter record */
  frontmatter: Record<string, any>;
  /** Convenience accessors for common fields */
  title: string;
  date?: string;
  description?: string;
  image?: string;
  authors?: string[];
}

/** Configuration for a listing instance */
interface ListingOptions {
  contents: string[];          // glob patterns
  sort?: string;               // e.g. "date desc"
  limit?: number;
  fields?: string[];
  type?: 'list' | 'grid' | 'table' | string;  // string = custom renderer key
  filter?: string;
  pageSize?: number;
}
```

### Creating a derived directive

The key API surface — lets another plugin define a new directive that is powered by the listing engine:

```typescript
import { createListingDirective } from 'myst-ext-listing';

/**
 * Create a directive that behaves like {listing} but with different
 * defaults, a different name, and optional item transforms.
 */
function createListingDirective(config: {
  /** Directive name, e.g. "blog-posts" */
  name: string;

  /** Default options (user options override these) */
  defaults?: Partial<ListingOptions>;

  /** Transform each item after resolution (add computed fields, etc.) */
  itemTransform?: (item: ListingItem) => ListingItem;

  /** Additional directive options beyond the standard listing ones */
  extraOptions?: Record<string, DirectiveOptionSpec>;

  /** Validate/transform the full resolved options before execution */
  optionsTransform?: (opts: ListingOptions, extraOpts: Record<string, any>) => ListingOptions;
}): DirectiveSpec;
```

### Resolving items programmatically

For plugins that need to work with listing data outside of a directive context:

```typescript
import { resolveListingItems } from 'myst-ext-listing';

/** Resolve glob patterns to listing items */
function resolveListingItems(
  patterns: string[],
  options?: {
    basePath?: string;
    sort?: string;
    limit?: number;
    filter?: string;
  }
): ListingItem[];
```

### Registering custom layout types

```typescript
import { registerListingType } from 'myst-ext-listing';

/**
 * Register a named layout type that can be referenced via :type: in the directive.
 * The renderer receives the resolved items and layout config.
 */
function registerListingType(
  name: string,
  renderer: NodeRenderer<ListingNode>
): void;
```

---

## How the Blog Plugin Would Use This

The blog plugin becomes a thin layer over the listing plugin:

```typescript
import { createListingDirective } from 'myst-ext-listing';

// The {blog-posts} directive is just a listing with blog defaults
export const blogPostsDirective = createListingDirective({
  name: 'blog-posts',
  defaults: {
    sort: 'date desc',
    fields: ['title', 'date', 'authors', 'description', 'image'],
    type: 'list',
    pageSize: 10,
  },
  itemTransform: (item) => ({
    ...item,
    // Add reading time estimate
    frontmatter: {
      ...item.frontmatter,
      readingTime: estimateReadingTime(item),
    },
  }),
});
```

The blog plugin would then add its own features on top:

- RSS/Atom feed generation (a build transform, not a directive)
- Category index pages
- Date-based archive pages
- `{blog-post}` directive for individual post metadata/layout
- Blog-specific renderers (post header with date/author, category pills, etc.)

---

## AST Output

The listing directive produces a single `listing` node in the MDAST:

```json
{
  "type": "listing",
  "kind": "list",
  "options": {
    "sort": "date desc",
    "fields": ["title", "date", "description", "image"],
    "pageSize": 25
  },
  "children": [
    {
      "type": "listingItem",
      "slug": "/posts/my-post",
      "data": {
        "title": "My Post",
        "date": "2025-01-15",
        "description": "A post about things",
        "image": "/images/post.png"
      }
    }
  ]
}
```

This is what the renderer layer (myst-theme) receives. The renderer maps `listing` → React component, `listingItem` → item component.

---

## Renderer Side (myst-theme)

A new `@myst-theme/listing` package would provide:

```typescript
import type { NodeRenderers } from '@myst-theme/providers';

export const LISTING_RENDERERS: NodeRenderers = {
  listing: {
    base: ListingDefault,                    // list layout
    'listing[kind=grid]': ListingGrid,       // grid layout
    'listing[kind=table]': ListingTable,     // table layout
  },
  listingItem: {
    base: ListingItemDefault,
  },
};
```

Themes opt in by merging these renderers:

```typescript
import { LISTING_RENDERERS } from '@myst-theme/listing';
const RENDERERS = mergeRenderers([defaultRenderers, LISTING_RENDERERS]);
```

The blog plugin can override or extend these renderers for blog-specific styling.

---

## What's NOT in v1

To keep scope minimal:

- **No reader-side sort/filter UI** — author controls only. Reader interactivity comes later.
- **No custom EJS/template system** — use custom renderer types via the JS API instead.
- **No boolean filter combinators** — single field comparisons only.
- **No feed generation** — that's the blog plugin's job.
- **No category taxonomy system** — the listing plugin just passes through whatever fields exist. The blog plugin can interpret `categories` specially.

---

## Summary

| Concern | Listing Plugin | Blog Plugin |
|---------|---------------|-------------|
| Directive | `{listing}` | `{blog-posts}`, `{blog-post}` |
| Content resolution | Glob patterns, inline YAML | Delegates to listing |
| Item schema | Generic frontmatter | Adds reading time, categories display |
| Layouts | list, grid, table | Can register blog-specific layouts |
| Sorting/filtering | Declarative, author-side | Sets blog defaults (date desc) |
| RSS/feeds | No | Yes |
| Archives/categories | No | Yes |
| JS API | `createListingDirective`, `resolveListingItems` | Consumes listing API |
