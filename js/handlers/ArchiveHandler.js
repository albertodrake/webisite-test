/**
 * ArchiveHandler
 * Shows info for archive files (cannot be opened)
 */
export class ArchiveHandler {
  /**
   * Render archive info
   */
  render(container, file) {
    container.classList.add('archive');

    const description = file.description || 'Archive file';

    container.innerHTML = `
      <div class="archive-info" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: var(--space-lg);
      ">
        <i data-lucide="file-archive" style="
          width: 64px;
          height: 64px;
          color: var(--text-tertiary);
          margin-bottom: var(--space-md);
        "></i>
        <div style="
          font-size: var(--font-size-md);
          color: var(--text-primary);
          margin-bottom: var(--space-sm);
        ">${file.name}</div>
        <div style="
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
        ">${description}</div>
        <div style="
          margin-top: var(--space-lg);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border-radius: 4px;
          color: var(--text-tertiary);
          font-size: var(--font-size-xs);
        ">
          Archive files cannot be extracted in the browser
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Check if this handler can handle the file
   */
  static canHandle(file) {
    return file.fileType === 'archive' ||
           file.name.endsWith('.tar') ||
           file.name.endsWith('.gz') ||
           file.name.endsWith('.zip') ||
           file.name.endsWith('.tar.gz');
  }
}
