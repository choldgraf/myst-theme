---
description: Test for hover cards
thumbnail: _static/myst-logo-light.svg
---
# Permalinks and URLs

Configuration options for controlling site navigation and URL structure.

## URL Structure

By default, MyST flattens the directory structure when generating URLs.
For example:

A file at

```
a/b/page.md
```

renders at URL

```
/page
```

### Folder structure URLs

To make URLs respect nested folder structure: 

```yaml
site:
  options:
    folders: true
```

For example, a file at

```
a/b/page.md
```

renders at URL 

```
/a/b/page
```

## External and Internal URLs

The following config makes any external URL behave as if it were an internal URL if it matches the patterns:

```yaml
site:
  options:
    internal_domains: "mystmd.org *.mystmd.org"
```

For example:

- <https://mystmd.org> - external URL but treated internal
- <https://spec.mystmd.org> - external URL but treated internal
- <https://jupyterbook.org> - external URL treated external