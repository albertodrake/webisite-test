/**
 * WindowManager Module
 * Creates and manages modal windows
 */
export class WindowManager {
  constructor(containerSelector, onClose = null) {
    this.container = document.querySelector(containerSelector);
    this.windows = new Map();
    this.zIndexCounter = 100;
    this.positionOffset = 0;
    this.onClose = onClose;
  }

  /**
   * Open a new window for a file
   */
  open(file, handler) {
    try {
      // Check if window already exists
      if (this.windows.has(file.path)) {
        this.bringToFront(file.path);
        return this.windows.get(file.path);
      }

      const windowId = this.generateId();
      const windowEl = this.createWindow(windowId, file);

      // Render content using handler
      const content = windowEl.querySelector('.window-content');
      if (handler) {
        handler.render(content, file);
      }

      if (!this.container) {
        console.error('WindowManager: container not found');
        return null;
      }

      this.container.appendChild(windowEl);
      this.windows.set(file.path, { id: windowId, element: windowEl, file });

      // Position window (pass file for custom sizing)
      this.positionWindow(windowEl, file);

      // Make draggable
      this.makeDraggable(windowEl);

      // Make resizable
      this.makeResizable(windowEl);

      // Bring to front
      this.bringToFront(file.path);

      // Refresh icons
      if (window.lucide) {
        window.lucide.createIcons();
      }

      return { id: windowId, element: windowEl };
    } catch (error) {
      console.error('WindowManager.open error:', error);
      return null;
    }
  }

  /**
   * Create window HTML element
   */
  createWindow(id, file) {
    const win = document.createElement('div');
    win.className = 'window';
    win.id = `window-${id}`;
    win.dataset.path = file.path;

    win.innerHTML = `
      <div class="window-titlebar">
        <div class="window-title">
          <i data-lucide="${file.icon || 'file'}"></i>
          <span>${file.name}</span>
        </div>
        <div class="window-controls">
          <button class="window-btn close" title="Close">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="window-content"></div>
      <div class="window-statusbar">
        <span class="window-status">${file.path}</span>
        <div class="window-resize" title="Resize">
          <i data-lucide="grip-horizontal"></i>
        </div>
      </div>
    `;

    // Close button handler
    const closeBtn = win.querySelector('.window-btn.close');
    closeBtn.addEventListener('click', () => this.close(file.path));

    // Click to bring to front
    win.addEventListener('mousedown', () => this.bringToFront(file.path));

    return win;
  }

  /**
   * Position window with cascade effect
   */
  positionWindow(windowEl, file = null) {
    const baseX = 100;
    const baseY = 80;
    const offset = 30;

    const x = baseX + (this.positionOffset * offset);
    const y = baseY + (this.positionOffset * offset);

    // Custom sizes for specific app types
    let width = 500;
    let height = 400;

    if (file && file.appType === 'audio') {
      width = 380;
      height = 520;
    }

    windowEl.style.left = `${x}px`;
    windowEl.style.top = `${y}px`;
    windowEl.style.width = `${width}px`;
    windowEl.style.height = `${height}px`;

    this.positionOffset = (this.positionOffset + 1) % 5;
  }

  /**
   * Make window draggable
   */
  makeDraggable(windowEl) {
    const titlebar = windowEl.querySelector('.window-titlebar');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    const onMouseDown = (e) => {
      if (e.target.closest('.window-controls')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = windowEl.offsetLeft;
      initialY = windowEl.offsetTop;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      windowEl.style.transition = 'none';
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newX = initialX + dx;
      let newY = initialY + dy;

      // Constrain to viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - windowEl.offsetWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - windowEl.offsetHeight));

      windowEl.style.left = `${newX}px`;
      windowEl.style.top = `${newY}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      windowEl.style.transition = '';
    };

    titlebar.addEventListener('mousedown', onMouseDown);

    // Touch support
    titlebar.addEventListener('touchstart', (e) => {
      if (e.target.closest('.window-controls')) return;
      const touch = e.touches[0];
      onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    });

    document.addEventListener('touchend', onMouseUp);
  }

  /**
   * Make window resizable
   */
  makeResizable(windowEl) {
    const resizeHandle = windowEl.querySelector('.window-resize');
    if (!resizeHandle) return;

    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    const onMouseDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = windowEl.offsetWidth;
      startHeight = windowEl.offsetHeight;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      windowEl.style.transition = 'none';
    };

    const onMouseMove = (e) => {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newWidth = Math.max(320, startWidth + dx);
      const newHeight = Math.max(200, startHeight + dy);

      windowEl.style.width = `${newWidth}px`;
      windowEl.style.height = `${newHeight}px`;
    };

    const onMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      windowEl.style.transition = '';
    };

    resizeHandle.addEventListener('mousedown', onMouseDown);

    // Touch support for resize
    resizeHandle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      onMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
      });
    });

    document.addEventListener('touchmove', (e) => {
      if (!isResizing) return;
      const touch = e.touches[0];
      onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    });
  }

  /**
   * Close a window
   */
  close(path) {
    const windowData = this.windows.get(path);
    if (!windowData) return;

    const { element, file } = windowData;

    // Add closing animation
    element.classList.add('closing');

    // Call onClose callback
    if (this.onClose) {
      this.onClose(file);
    }

    // Remove after animation
    setTimeout(() => {
      element.remove();
      this.windows.delete(path);
    }, 150);

    return file;
  }

  /**
   * Bring window to front
   */
  bringToFront(path) {
    const windowData = this.windows.get(path);
    if (!windowData) return;

    this.zIndexCounter++;
    windowData.element.style.zIndex = this.zIndexCounter;
  }

  /**
   * Close all windows
   */
  closeAll() {
    for (const path of this.windows.keys()) {
      this.close(path);
    }
  }

  /**
   * Generate unique window ID
   */
  generateId() {
    return `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if window is open
   */
  isOpen(path) {
    return this.windows.has(path);
  }

  /**
   * Get window by path
   */
  getWindow(path) {
    return this.windows.get(path);
  }
}
