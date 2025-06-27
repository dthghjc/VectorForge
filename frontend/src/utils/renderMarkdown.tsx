import markdownit from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';      // ← 代码配色主题，可换

/* 创建 md 实例，接入 highlight.js */
const md = markdownit({
  html: true,
  breaks: true,
  highlight(code, lang) {
    // 指定语言且存在于 HLJS
    if (lang && hljs.getLanguage(lang)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`;
    }
    // 自动检测语言
    return `<pre class="hljs"><code>${hljs.highlightAuto(code).value}</code></pre>`;
  },
});

export function renderMarkdown(content: string): string {
  return md.render(content);
}