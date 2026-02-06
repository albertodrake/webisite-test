/**
 * Drake OS - Main Application
 * A premium file browser personal website
 */

// Import modules
import { FileSystem } from './modules/FileSystem.js';
import { Navigator } from './modules/Navigator.js';
import { FileGrid } from './modules/FileGrid.js';
import { WindowManager } from './modules/WindowManager.js';
import { Terminal } from './modules/Terminal.js';
import { Cursor } from './modules/Cursor.js';
import { AudioManager } from './modules/AudioManager.js';
import { MessageBoard } from './modules/MessageBoard.js';

// Import handlers
import { MarkdownHandler } from './handlers/MarkdownHandler.js';
import { LinkHandler } from './handlers/LinkHandler.js';
import { ShellHandler } from './handlers/ShellHandler.js';
import { AppHandler } from './handlers/AppHandler.js';
import { TextHandler } from './handlers/TextHandler.js';
import { ArchiveHandler } from './handlers/ArchiveHandler.js';

/**
 * Main Drake OS Application Class
 */
class DrakeOS {
  constructor() {
    this.filesystem = null;
    this.navigator = null;
    this.fileGrid = null;
    this.windowManager = null;
    this.terminal = null;
    this.audioManager = null;
    this.messageBoard = null;
    this.showHidden = false;
    this.currentPath = '/home/drake';

    // Handlers
    this.handlers = {};
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize filesystem
      this.filesystem = new FileSystem();
      const loaded = await this.filesystem.load('data/filesystem.json');

      if (!loaded) {
        console.error('Failed to load filesystem');
        return;
      }

      // Initialize terminal first for logging
      this.terminal = new Terminal('#terminalOutput');
      this.terminal.system('Drake OS v2.0 initialized');
      this.terminal.log('Loading filesystem...');

      // Initialize other modules
      this.navigator = new Navigator('#breadcrumbs', this.onNavigate.bind(this));
      this.fileGrid = new FileGrid('#fileGrid', this.onFileClick.bind(this));
      this.windowManager = new WindowManager('#windowsContainer', this.onWindowClose.bind(this));

      // Initialize audio manager (null for button - we'll handle it ourselves)
      this.audioManager = new AudioManager('#bgAudio', null);

      // Initialize handlers
      this.handlers = {
        markdown: new MarkdownHandler(),
        link: new LinkHandler(this.terminal),
        shell: new ShellHandler(),
        app: new AppHandler(this.audioManager),
        text: new TextHandler(),
        archive: new ArchiveHandler()
      };

      // Initialize custom cursor
      new Cursor();

      // Initialize message board (guestbook)
      this.messageBoard = new MessageBoard('#messagePanel', this.terminal);

      // Setup event listeners
      this.setupEventListeners();

      // Setup clock
      this.setupClock();

      // Setup draggable terminal
      this.setupDraggableTerminal();

      // Navigate to home directory
      this.navigate(this.currentPath);

      // Welcome message
      this.terminal.success('System ready');
      this.terminal.system('Welcome to Drake OS!');

      // Easter egg hint in console
      console.log('%c.', 'color: transparent');
      console.log('%cDrake OS v2.0', 'color: #8b5cf6; font-size: 14px; font-weight: bold;');
      console.log('%cSome files are hidden... just like in Linux.', 'color: #888; font-size: 11px;');

      // Initialize Lucide icons
      if (window.lucide) {
        window.lucide.createIcons();
      }

    } catch (error) {
      console.error('Drake OS initialization error:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+H: Toggle hidden files
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        this.toggleHidden();
      }
    });

    // Hidden files toggle button
    const toggleHiddenBtn = document.getElementById('toggleHidden');
    if (toggleHiddenBtn) {
      toggleHiddenBtn.addEventListener('click', () => this.toggleHidden());
    }

    // Clear terminal button
    const clearTerminalBtn = document.getElementById('clearTerminal');
    if (clearTerminalBtn) {
      clearTerminalBtn.addEventListener('click', () => this.terminal.clear());
    }

    // Status bar audio button - opens music player window
    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => this.openMusicPlayer());

      // Update icon based on audio state
      this.audioManager.onStateChange((isPlaying) => {
        // Replace the icon element entirely (Lucide converts <i> to <svg>)
        audioToggle.innerHTML = `<i data-lucide="${isPlaying ? 'volume-2' : 'volume-x'}"></i>`;
        if (window.lucide) {
          window.lucide.createIcons();
        }
        audioToggle.classList.toggle('active', isPlaying);
      });
    }

    // Terminal toggle
    const terminalToggle = document.getElementById('terminalToggle');
    const terminalWindow = document.getElementById('terminalWindow');
    if (terminalToggle && terminalWindow) {
      terminalToggle.addEventListener('click', () => {
        terminalWindow.classList.toggle('visible');
      });
    }

    // Desktop icon navigation
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        const path = icon.dataset.path;
        if (path) {
          this.navigate(path);
          // Switch to file grid view
          document.getElementById('desktopIcons').style.display = 'none';
          document.getElementById('fileGrid').style.display = 'grid';
        }
      });
    });

    // Start button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // Return to desktop view
        document.getElementById('desktopIcons').style.display = 'grid';
        document.getElementById('fileGrid').style.display = 'none';
        this.navigate('/home/drake');
      });
    }
  }

  /**
   * Navigate to a path
   */
  navigate(path) {
    if (!this.filesystem.exists(path)) {
      this.terminal.error(`Path not found: ${path}`);
      return;
    }

    if (!this.filesystem.isFolder(path)) {
      this.terminal.error(`Not a folder: ${path}`);
      return;
    }

    this.currentPath = path;
    this.terminal.logNav(path);

    // Update breadcrumbs
    this.navigator.setPath(path);

    // Update file grid
    const contents = this.filesystem.getContents(path, this.showHidden);
    this.fileGrid.render(contents);

    // Update page title
    document.title = `Drake OS ~ ${path}`;

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Handle navigation callback
   */
  onNavigate(path) {
    this.navigate(path);
  }

  /**
   * Handle file/folder click
   */
  onFileClick(item) {
    if (item.type === 'folder') {
      this.navigate(item.path);
    } else {
      this.openFile(item);
    }
  }

  /**
   * Handle window close
   */
  onWindowClose(file) {
    this.terminal.logClose(file.name);

    // Cleanup app handlers (like countdown intervals)
    if (file.fileType === 'app') {
      this.handlers.app.cleanup(file.path);
    }
  }

  /**
   * Open a file in a window
   */
  openFile(file) {
    this.terminal.logOpen(file.name);

    // Get appropriate handler
    const handler = this.getHandler(file);

    // Open window with handler
    this.windowManager.open(file, handler);

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Open the music player app
   */
  openMusicPlayer() {
    const musicPlayerPath = '/home/drake/Applications/music_player.app';
    const musicPlayerFile = this.filesystem.getItem(musicPlayerPath);

    if (musicPlayerFile) {
      this.openFile(musicPlayerFile);
    } else {
      this.terminal.error('Music player not found');
    }
  }

  /**
   * Get handler for file type
   */
  getHandler(file) {
    // Check by fileType first
    if (file.fileType) {
      switch (file.fileType) {
        case 'markdown':
          return this.handlers.markdown;
        case 'link':
          return this.handlers.link;
        case 'shell':
          return this.handlers.shell;
        case 'app':
          return this.handlers.app;
        case 'text':
          return this.handlers.text;
        case 'archive':
          return this.handlers.archive;
      }
    }

    // Check by extension
    const ext = this.filesystem.getExtension(file.name);
    switch (ext) {
      case 'md':
        return this.handlers.markdown;
      case 'sh':
      case 'bash':
        return this.handlers.shell;
      case 'txt':
        return this.handlers.text;
      case 'link':
        return this.handlers.link;
      case 'app':
        return this.handlers.app;
      case 'tar':
      case 'gz':
      case 'zip':
        return this.handlers.archive;
    }

    // Default to text handler
    return this.handlers.text;
  }

  /**
   * Toggle hidden files visibility
   */
  toggleHidden() {
    this.showHidden = !this.showHidden;
    this.terminal.logHiddenToggle(this.showHidden);

    // Update toggle button
    const btn = document.getElementById('toggleHidden');
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', this.showHidden ? 'eye' : 'eye-off');
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    }

    // Refresh current view
    this.navigate(this.currentPath);
  }

  /**
   * Setup status bar clock
   */
  setupClock() {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const statusTime = document.getElementById('statusTime');
      if (statusTime) {
        statusTime.textContent = timeString;
      }
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  /**
   * Setup draggable terminal
   */
  setupDraggableTerminal() {
    const terminal = document.getElementById('terminalWindow');
    const header = terminal?.querySelector('.terminal-header');
    
    if (!terminal || !header) return;

    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = terminal.offsetLeft;
      initialY = terminal.offsetTop;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });

    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      terminal.style.left = `${initialX + deltaX}px`;
      terminal.style.bottom = 'auto';
      terminal.style.top = `${initialY + deltaY}px`;
      terminal.style.transform = 'none';
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new DrakeOS();
  app.init();

  // Make app globally accessible for debugging
  window.drakeos = app;
});
