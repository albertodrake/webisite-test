/**
 * LinkHandler
 * Handles external link files
 */
export class LinkHandler {
  constructor(terminal) {
    this.terminal = terminal;
  }

  /**
   * Render link content and open external URL
   */
  render(container, file) {
    container.classList.add('link');

    const icon = file.icon || 'external-link';
    const description = file.description || 'Opening external link...';
    const url = file.url || '#';

    container.innerHTML = `
      <i data-lucide="${icon}" class="link-icon"></i>
      <div class="link-message">${description}</div>
      <div class="link-url">${url}</div>
      <div class="link-executing">Executing...</div>
    `;

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Open link after delay
    setTimeout(() => {
      if (this.terminal) {
        this.terminal.logExternal(url);
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 800);
  }

  /**
   * Check if this handler can handle the file
   */
  static canHandle(file) {
    return file.fileType === 'link' || file.external === true;
  }
}
