/**
 * TextHandler
 * Renders plain text files
 */
export class TextHandler {
  /**
   * Render text content
   */
  render(container, file) {
    container.classList.add('text');

    const content = file.content || 'No content available.';

    // Escape HTML
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    container.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: var(--font-mono); line-height: 1.6;">${escaped}</pre>`;
  }

  /**
   * Check if this handler can handle the file
   */
  static canHandle(file) {
    return file.fileType === 'text' || file.name.endsWith('.txt');
  }
}
