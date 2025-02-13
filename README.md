This is a local-storage live markdown-editor that uses [markdown-it](https://github.com/markdown-it/markdown-it) and several plugins.

The following plugins are currently installed:
- [markdown-it-collapsible](https://github.com/Bioruebe/markdown-it-collapsible)
- [markdown-it-katex](https://github.com/waylonflinn/markdown-it-katex)
- [markdown-it-fancy-lists](https://github.com/Moxio/markdown-it-fancy-lists)
- [markdown-it-mermaid](https://github.com/wekan/markdown-it-mermaid)

To add a new plugin:

1. Run `npm install markdown-it-{plugin-name}`.
2. Go to `src/components/MarkdownEditor.jsx` and import the plugin.
3. Add the plugin to the `markdownIt` instance:

```
md.use(markdownItCollapsible).use(markdownItKatex).use(markdownItFancyLists).use(markdownItMermaid).use(markdownIt{Plugin});
```
