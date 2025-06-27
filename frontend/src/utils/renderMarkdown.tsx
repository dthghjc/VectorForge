import markdownit from 'markdown-it';


const md = markdownit({ html: true, breaks: true });

export function renderMarkdown(content: string): string {
  return md.render(content);
}