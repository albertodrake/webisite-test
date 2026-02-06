/**
 * Navigator Module
 * Handles breadcrumb navigation display
 */
export class Navigator {
  constructor(selector, onNavigate) {
    this.element = document.querySelector(selector);
    this.onNavigate = onNavigate;
    this.currentPath = '/';
  }

  /**
   * Set current path and render breadcrumbs
   */
  setPath(path) {
    this.currentPath = path;
    this.render();
  }

  /**
   * Get path segments with full paths
   */
  getSegmentsWithPaths(path) {
    const segments = path.split('/').filter(s => s.length > 0);
    const result = [];
    let currentPath = '';

    for (const segment of segments) {
      currentPath += '/' + segment;
      result.push({
        name: segment,
        path: currentPath
      });
    }

    return result;
  }

  /**
   * Render breadcrumbs
   */
  render() {
    this.element.innerHTML = '';

    // Root icon
    const rootItem = this.createBreadcrumbItem('~', '/', true);
    this.element.appendChild(rootItem);

    // Path segments
    const segments = this.getSegmentsWithPaths(this.currentPath);

    segments.forEach((segment, index) => {
      // Separator
      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.textContent = '/';
      this.element.appendChild(separator);

      // Segment
      const isLast = index === segments.length - 1;
      const item = this.createBreadcrumbItem(
        segment.name,
        segment.path,
        !isLast
      );

      if (isLast) {
        item.classList.add('current');
      }

      this.element.appendChild(item);
    });
  }

  /**
   * Create a breadcrumb item element
   */
  createBreadcrumbItem(name, path, clickable) {
    const item = document.createElement('span');
    item.className = 'breadcrumb-item';
    item.textContent = name;

    if (clickable) {
      item.classList.add('clickable');
      item.addEventListener('click', () => {
        if (this.onNavigate) {
          this.onNavigate(path);
        }
      });
    }

    return item;
  }

  /**
   * Navigate up one level
   */
  goUp() {
    const segments = this.currentPath.split('/').filter(s => s.length > 0);
    if (segments.length > 0) {
      segments.pop();
      const newPath = segments.length > 0 ? '/' + segments.join('/') : '/';
      if (this.onNavigate) {
        this.onNavigate(newPath);
      }
    }
  }
}
