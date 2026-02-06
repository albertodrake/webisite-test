/**
 * FileSystem Module
 * Manages the virtual file system loaded from JSON
 */
export class FileSystem {
  constructor() {
    this.data = null;
    this.cache = new Map();
  }

  /**
   * Load filesystem from JSON file
   */
  async load(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load filesystem: ${response.status}`);
      }
      this.data = await response.json();
      this.buildCache(this.data);
      return true;
    } catch (error) {
      console.error('FileSystem load error:', error);
      return false;
    }
  }

  /**
   * Build path cache for quick lookups
   */
  buildCache(node, parent = null) {
    if (node.path) {
      this.cache.set(node.path, { node, parent });
    }
    if (node.children) {
      node.children.forEach(child => this.buildCache(child, node));
    }
  }

  /**
   * Get item by path
   */
  getItem(path) {
    const cached = this.cache.get(path);
    return cached ? cached.node : null;
  }

  /**
   * Get parent of item
   */
  getParent(path) {
    const cached = this.cache.get(path);
    return cached ? cached.parent : null;
  }

  /**
   * Get contents of a folder
   */
  getContents(path, showHidden = false) {
    const item = this.getItem(path);
    if (!item || item.type !== 'folder') {
      return [];
    }

    let children = item.children || [];

    if (!showHidden) {
      children = children.filter(child => !child.hidden && !child.name.startsWith('.'));
    }

    // Sort: folders first, then files, alphabetically
    return children.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Check if path exists
   */
  exists(path) {
    return this.cache.has(path);
  }

  /**
   * Check if path is a folder
   */
  isFolder(path) {
    const item = this.getItem(path);
    return item && item.type === 'folder';
  }

  /**
   * Get path segments
   */
  getPathSegments(path) {
    return path.split('/').filter(segment => segment.length > 0);
  }

  /**
   * Get parent path
   */
  getParentPath(path) {
    const segments = this.getPathSegments(path);
    if (segments.length <= 1) return '/';
    segments.pop();
    return '/' + segments.join('/');
  }

  /**
   * Resolve relative path
   */
  resolvePath(basePath, relativePath) {
    if (relativePath.startsWith('/')) {
      return relativePath;
    }

    const baseSegments = this.getPathSegments(basePath);
    const relativeSegments = relativePath.split('/');

    for (const segment of relativeSegments) {
      if (segment === '..') {
        baseSegments.pop();
      } else if (segment !== '.' && segment !== '') {
        baseSegments.push(segment);
      }
    }

    return '/' + baseSegments.join('/');
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
   * Get file type class for styling
   */
  getFileTypeClass(item) {
    if (item.type === 'folder') return 'folder';

    const ext = this.getExtension(item.name);
    return `file-${ext}`;
  }
}
