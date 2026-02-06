/**
 * FileGrid Module
 * Renders files and folders in a grid layout
 */
export class FileGrid {
  constructor(selector, onClick) {
    this.element = document.querySelector(selector);
    this.onClick = onClick;
    this.items = [];
  }

  /**
   * Render items in the grid
   */
  render(items) {
    this.element.innerHTML = '';
    this.items = items;

    if (items.length === 0) {
      this.renderEmpty();
      return;
    }

    items.forEach(item => {
      const element = this.createFileItem(item);
      this.element.appendChild(element);
    });

    // Refresh Lucide icons for new elements
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Render empty state
   */
  renderEmpty() {
    const empty = document.createElement('div');
    empty.className = 'file-grid-empty';
    empty.innerHTML = `
      <i data-lucide="folder-open"></i>
      <span>This folder is empty</span>
    `;
    this.element.appendChild(empty);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Create a file/folder item element
   */
  createFileItem(item) {
    const element = document.createElement('div');
    element.className = 'file-item';

    // Add type class
    if (item.type === 'folder') {
      element.classList.add('folder');
    } else {
      const ext = this.getExtension(item.name);
      element.classList.add(`file-${ext}`);
    }

    // Add hidden class
    if (item.hidden || item.name.startsWith('.')) {
      element.classList.add('hidden');
    }

    // Icon
    const icon = document.createElement('div');
    icon.className = 'file-icon';
    icon.innerHTML = `<i data-lucide="${this.getIcon(item)}"></i>`;
    element.appendChild(icon);

    // Name
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = item.name;
    element.appendChild(name);

    // Click handler
    element.addEventListener('click', () => {
      if (this.onClick) {
        this.onClick(item);
      }
    });

    return element;
  }

  /**
   * Get icon name for item
   */
  getIcon(item) {
    // Use custom icon if specified
    if (item.icon) {
      return item.icon;
    }

    // Folder icons
    if (item.type === 'folder') {
      if (item.name.startsWith('.')) {
        return 'folder-lock';
      }
      return 'folder';
    }

    // File icons based on extension
    const ext = this.getExtension(item.name);
    const iconMap = {
      'md': 'file-text',
      'txt': 'file-text',
      'sh': 'terminal',
      'app': 'app-window',
      'link': 'external-link',
      'mp4': 'film',
      'mov': 'film',
      'mp3': 'music',
      'wav': 'music',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'tar': 'file-archive',
      'gz': 'file-archive',
      'zip': 'file-archive',
      'json': 'file-code',
      'js': 'file-code',
      'css': 'file-code',
      'html': 'file-code',
      'pdf': 'file-text'
    };

    return iconMap[ext] || 'file';
  }

  /**
   * Get file extension
   */
  getExtension(filename) {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Select an item
   */
  selectItem(path) {
    // Remove previous selection
    this.element.querySelectorAll('.file-item.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Find and select item
    const item = this.items.find(i => i.path === path);
    if (item) {
      const index = this.items.indexOf(item);
      const element = this.element.children[index];
      if (element) {
        element.classList.add('selected');
      }
    }
  }
}
