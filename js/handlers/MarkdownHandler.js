/**
 * MarkdownHandler
 * Renders markdown content in windows
 */
export class MarkdownHandler {
  /**
   * Render markdown content to container
   */
  render(container, file) {
    container.classList.add('markdown');

    const content = file.content || 'No content available.';
    const html = this.parseMarkdown(content);

    container.innerHTML = html;
  }

  /**
   * Simple markdown parser
   */
  parseMarkdown(text) {
    let html = text;

    // Escape HTML
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Blockquotes
    html = html.replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>');

    // Lists
    html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (para.startsWith('<h') || para.startsWith('<ul') ||
          para.startsWith('<blockquote') || para.startsWith('<hr')) {
        return para;
      }
      return `<p>${para}</p>`;
    }).join('\n');

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');

    // Line breaks
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<br><br>/g, '');

    return html;
  }
}
