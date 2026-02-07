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

    // Terminal state
    this.commandHistory = [];
    this.historyIndex = -1;
    this.terminalPath = '/home/drake';

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

      // Setup terminal input
      this.setupTerminalInput();

      // Setup terminal resize
      this.setupTerminalResize();

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

    // Desktop view toggle
    const toggleDesktopView = document.getElementById('toggleDesktopView');
    if (toggleDesktopView) {
      toggleDesktopView.addEventListener('click', () => {
        const desktopIcons = document.getElementById('desktopIcons');
        const fileGrid = document.getElementById('fileGrid');
        
        if (desktopIcons.style.display === 'none') {
          desktopIcons.style.display = 'grid';
          fileGrid.style.display = 'none';
        } else {
          desktopIcons.style.display = 'none';
          fileGrid.style.display = 'grid';
        }
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
    this.terminalPath = path;
    this.terminal.logNav(path);

    // Update terminal prompt
    this.updateTerminalPrompt();

    // Show navigation in terminal
    const shortPath = path.replace('/home/drake', '~');
    this.terminal.output(`Navigated to: ${shortPath}`);

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
      // Show terminal action for folder navigation
      this.terminal.logCommand(this.terminalPath, `cd "${item.name}"`);
      this.navigate(item.path);
    } else {
      // Show terminal action for file opening
      this.terminal.logCommand(this.terminalPath, `cat "${item.name}"`);
      
      // Read file content in terminal
      if (item.content) {
        this.terminal.output('--- File Content ---');
        this.terminal.output(item.content);
        this.terminal.output('--- End of File ---');
      } else {
        this.terminal.error(`Cannot read file: ${item.name}`);
      }
      
      // Also open in window for certain file types
      if (item.fileType === 'markdown' || item.fileType === 'link' || item.fileType === 'app') {
        this.openFile(item);
      }
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
   * Setup terminal input handling
   */
  setupTerminalInput() {
    const terminalInput = document.getElementById('terminalInput');
    const terminalOutput = document.getElementById('terminalOutput');

    if (!terminalInput || !terminalOutput) return;

    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = terminalInput.value.trim();
        if (command) {
          this.executeCommand(command);
          this.commandHistory.push(command);
          this.historyIndex = this.commandHistory.length;
          terminalInput.value = '';
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          terminalInput.value = this.commandHistory[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          terminalInput.value = this.commandHistory[this.historyIndex];
        } else {
          this.historyIndex = this.commandHistory.length;
          terminalInput.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.autocompleteCommand(terminalInput.value);
      }
    });

    // Auto focus terminal input when clicking on terminal
    document.getElementById('terminalWindow')?.addEventListener('click', () => {
      terminalInput.focus();
    });

    // Initial focus
    terminalInput.focus();
  }

  /**
   * Execute terminal command
   */
  executeCommand(command) {
    const [cmd, ...args] = command.trim().split(' ');
    const fullCommand = command.trim();
    
    // Show command in terminal
    this.terminal.logCommand(this.terminalPath, fullCommand);
    
    // Update terminal path to match current path
    this.updateTerminalPrompt();

    // Execute command
    switch (cmd.toLowerCase()) {
      case 'ls':
      case 'll':
        this.handleLs(args);
        break;
      case 'cd':
        this.handleCd(args);
        break;
      case 'cat':
        this.handleCat(args);
        break;
      case 'less':
      case 'more':
        this.handleCat(args); // Alias for cat
        break;
      case 'pwd':
        this.terminal.output(this.terminalPath);
        break;
      case 'clear':
        this.terminal.clear();
        break;
      case 'help':
        this.handleHelp();
        break;
      case 'whoami':
        this.terminal.output('drake');
        break;
      case 'date':
        this.terminal.output(new Date().toString());
        break;
      case 'neofetch':
        this.handleNeofetch();
        break;
      case 'echo':
        this.terminal.output(args.join(' '));
        break;
      case 'mkdir':
        this.handleMkdir(args);
        break;
      case 'touch':
        this.handleTouch(args);
        break;
      case 'rm':
        this.handleRm(args);
        break;
      case 'find':
        this.handleFind(args);
        break;
      case 'grep':
        this.handleGrep(args);
        break;
      case 'exit':
        this.terminal.output('Goodbye!');
        break;
      case 'history':
        this.handleHistory();
        break;
      case 'submit':
        this.handleSubmit(args);
        break;
      case 'discord':
        this.handleDiscord();
        break;
      case 'hackerman':
        this.handleHackerman();
        break;
      default:
        if (cmd) {
          this.terminal.error(`Command not found: ${cmd}. Type 'help' for available commands.`);
        }
    }
    }
  }

  /**
   * Update terminal prompt to show current path
   */
  updateTerminalPrompt() {
    const prompt = document.getElementById('terminalPrompt');
    if (prompt) {
      const shortPath = this.terminalPath.replace('/home/drake', '~');
      prompt.textContent = `drake@drakeos:${shortPath}$`;
    }
  }

  /**
   * Handle ls command
   */
  handleLs(args) {
    const showAll = args.includes('-a') || args.includes('-la') || cmd === 'll';
    const path = args.find(arg => !arg.startsWith('-')) || this.terminalPath;
    
    if (!this.filesystem.exists(path)) {
      this.terminal.error(`Directory not found: ${path}`);
      return;
    }

    const contents = this.filesystem.getContents(path, showAll);
    if (contents.length === 0) {
      this.terminal.output('(empty directory)');
      return;
    }

    // Format output like real ls
    const output = contents.map(item => {
      const icon = item.type === 'folder' ? '📁' : '📄';
      const name = item.hidden ? '.' + item.name : item.name;
      const color = item.type === 'folder' ? 'var(--folder-color)' : 'var(--file-color)';
      return `<span style="color: ${color}">${icon} ${name}</span>`;
    }).join('  ');

    this.terminal.outputHTML(output);
  }

  /**
   * Handle cd command
   */
  handleCd(args) {
    if (args.length === 0) {
      this.terminalPath = '/home/drake';
    } else {
      const target = args[0];
      if (target === '..') {
        this.terminalPath = this.terminalPath.split('/').slice(0, -1).join('/') || '/';
      } else if (target.startsWith('/')) {
        this.terminalPath = target;
      } else {
        this.terminalPath = this.terminalPath + '/' + target;
      }

      // Normalize path
      this.terminalPath = this.terminalPath.replace(/\/+/g, '/');
      if (this.terminalPath !== '/' && this.terminalPath.endsWith('/')) {
        this.terminalPath = this.terminalPath.slice(0, -1);
      }
    }

    // Sync with main navigation
    if (this.currentPath !== this.terminalPath && this.filesystem.exists(this.terminalPath)) {
      this.navigate(this.terminalPath);
    }
  }

  /**
   * Handle cat command
   */
  handleCat(args) {
    if (args.length === 0) {
      this.terminal.error('cat: missing file operand');
      return;
    }

    const filename = args[0];
    const filepath = this.terminalPath + '/' + filename;
    
    if (!this.filesystem.exists(filepath)) {
      this.terminal.error(`cat: ${filename}: No such file or directory`);
      return;
    }

    const item = this.filesystem.getItem(filepath);
    if (item.type === 'folder') {
      this.terminal.error(`cat: ${filename}: Is a directory`);
      return;
    }

    if (item.content) {
      this.terminal.output(item.content);
    } else {
      this.terminal.error(`cat: ${filename}: Cannot read file`);
    }
  }

  /**
   * Handle help command
   */
  handleHelp() {
    const helpText = `
🚀 Drake OS Terminal Commands v2.0

📁 Navigation:
  ls, ll                 List directory contents (ll shows hidden files)
  cd [dir]               Change directory (cd .. to go back)
  pwd                    Print working directory

📄 File Operations:
  cat [file]             Display file contents
  less [file], more [file] Display file contents (alias for cat)
  touch [file]           Create empty file
  mkdir [dir]            Create directory
  rm [file]              Remove file
  find [pattern]          Find files by name

🔧 System:
  clear                  Clear terminal screen
  help                   Show this help message
  whoami                 Display current user (drake)
  date                   Show current date and time
  neofetch               Display system information
  echo [text]            Display text
  history                Show command history

🔍 Advanced:
  grep [pattern] [file]  Search for patterns in files
  find [pattern]          Find files by name pattern
  submit [flag]           Submit CTF flag
  history                Show command history
  discord                Show Discord contact info
  hackerman              🟣 Activate elite hacker mode

🚀 CTF Challenge:
  • Hidden flag somewhere in the system
  • Use 'ls -la' to find hidden directories
  • Try 'find flag' or 'grep DRAKE'
  • Submit your flag with the submit command
  • Unlock special rewards!

💡 Tips:
  • Use Tab for autocomplete
  • Use ↑/↓ arrows for command history
  • Click files/folders in UI to see terminal commands
  • Try 'neofetch' for cool system info
  • Hidden files start with '.'

🎯 Examples:
  cd Projects             Go to Projects folder
  ls -la                 List all files including hidden
  cat About_Me.md         Read your about file
  find . -name "*flag*"   Search for flag files
  grep -r "DRAKE" .      Search for DRAKE in all files
  discord                Show Discord connection info
  hackerman              🟣 Try this command ;)
    `.trim();
    
    this.terminal.output(helpText);
  }

  /**
   * Handle neofetch command
   */
  handleNeofetch() {
    const neofetch = `
       ███████╗     ██████╗ ███████╗
       ██╔════╝    ██╔══██╗██╔════╝
       ███████╗    ██████╔╝█████╗  
       ╚════██║    ██╔══██╗██╔══╝  
       ███████║    ██║  ██║███████╗
       ╚══════╝    ╚═╝  ╚═╝╚══════╝
       
       🟣 drake@drakeos 🟣
       -----------------
       OS: Drake OS v2.0
       Theme: Hacker Purple Glassmorphism
       Shell: Drake Shell
       Terminal: Advanced Web Terminal
       CPU: Elite (8) @ 3.2GHz
       Memory: 16GB DDR5
       User: Alberto Drake
       Location: /home/drake
       Discord: 🟣 alberto_drake
       Contact: discord.com/users/809729227964284959
    `.trim();
    
    this.terminal.output(neofetch);
  }

  /**
   * Handle mkdir command
   */
  handleMkdir(args) {
    if (args.length === 0) {
      this.terminal.error('mkdir: missing operand');
      return;
    }
    
    this.terminal.output(`Directory '${args[0]}' created (simulated)`);
  }

  /**
   * Handle touch command
   */
  handleTouch(args) {
    if (args.length === 0) {
      this.terminal.error('touch: missing file operand');
      return;
    }
    
    this.terminal.output(`File '${args[0]}' created (simulated)`);
  }

  /**
   * Handle rm command
   */
  handleRm(args) {
    if (args.length === 0) {
      this.terminal.error('rm: missing operand');
      return;
    }
    
    this.terminal.output(`File '${args[0]}' removed (simulated)`);
  }

  /**
   * Handle find command (CTF enhanced)
   */
  handleFind(args) {
    if (args.length === 0) {
      this.terminal.error('find: missing pattern');
      this.terminal.output('Usage: find [pattern] or find . -name \"[pattern]\"');
      return;
    }

    // Check if they're searching for flag
    const pattern = args.join(' ').toLowerCase();
    if (pattern.includes('flag') || pattern.includes('drake') || pattern.includes('challenge')) {
      this.terminal.output('🔍 Searching system for matching files...');
      
      // Simulate search with actual path to challenge
      setTimeout(() => {
        this.terminal.output('./.challenge');
        this.terminal.output('./.challenge/.config/system.json');
        this.terminal.output('');
        this.terminal.output('💡 Found potential flag location! Check the hidden directories.');
      }, 1000);
    } else {
      this.terminal.output(`Searching for '${args[0]}'...`);
      setTimeout(() => {
        this.terminal.output('No matching files found.');
      }, 500);
    }
  }

  /**
   * Handle grep command (CTF enhanced)
   */
  handleGrep(args) {
    if (args.length < 2) {
      this.terminal.error('grep: missing pattern and file');
      this.terminal.output('Usage: grep [pattern] [file]');
      return;
    }

    const [pattern, file] = args;
    
    // Check if they're searching for flag content
    if (pattern.includes('DRAKE') || pattern.includes('flag') || pattern.includes('QENFGV')) {
      this.terminal.output(`🔍 Searching for '${pattern}' in files...`);
      
      setTimeout(() => {
        if (file && file.includes('system.json')) {
          this.terminal.output('./.challenge/.config/system.json:"QENFGV{DR4K3_0S_EXPL0R3R_W3LC0M3}"');
          this.terminal.output('');
          this.terminal.output('🎯 Found encoded flag! This looks like ROT13 encoding...');
          this.terminal.output('💡 Try decoding it and use the submit command!');
        } else {
          this.terminal.output(`Found matches in: .challenge/.config/system.json`);
          this.terminal.output('💡 Check that file for the encoded flag!');
        }
      }, 1000);
    } else {
      this.terminal.output(`Searching for '${pattern}' in '${file}'...`);
      setTimeout(() => {
        this.terminal.output('No matches found.');
      }, 500);
    }
  }

  /**
   * Handle flag submission
   */
  handleSubmit(args) {
    if (args.length === 0) {
      this.terminal.error('submit: missing flag');
      this.terminal.output('Usage: submit [flag]');
      this.terminal.output('Example: submit DRAKE{some_flag_here}');
      return;
    }

    const submittedFlag = args.join(' ');
    
    // Check if they submitted the correct flag (decoded ROT13)
    if (submittedFlag === 'DRAKE{DR4K3_0S_EXPL0R3R_W3LC0M3}') {
      this.terminal.output('');
      this.terminal.output('🎉🎉🎉 CORRECT FLAG! 🎉🎉🎉');
      this.terminal.output('');
      this.terminal.output('🏆 Congratulations! You have completed the Drake OS CTF Challenge!');
      this.terminal.output('');
      this.terminal.output('🎖️  Title: Certified Drake OS Explorer');
      this.terminal.output('🔑 Achievement: Flag Captured');
      this.terminal.output('📊 Score: 1337/1337');
      this.terminal.output('');
      this.terminal.output('💝 Thanks for exploring Drake OS, Alberto!');
      this.terminal.output('You are truly a digital explorer! 🚀');
      this.terminal.output('');
      
      // Special reward - unlock secret theme
      this.unlockSecretTheme();
      
      // Log to console for fun
      console.log('%c🎉 CTF COMPLETED! 🎉', 'color: #8b5cf6; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px rgba(139, 92, 246, 0.8);');
      console.log('%cUser has proven their hacking skills!', 'color: #fbbf24; font-size: 14px;');
      
    } else {
      this.terminal.output(`❌ Incorrect flag: ${submittedFlag}`);
      this.terminal.output('💡 Hint: The flag uses ROT13 encoding...');
      this.terminal.output('💡 Look for the encoded string in the system files!');
      this.terminal.output('💡 Remember the format: DRAKE{...}');
    }
  }

  /**
   * Handle discord command
   */
  handleDiscord() {
    this.terminal.output('');
    this.terminal.output('🟣 Discord Connection Information 🟣');
    this.terminal.output('──────────────────────────────────');
    this.terminal.output('👤 User: alberto_drake');
    this.terminal.output('🔗 Profile: discord.com/users/809729227964284959');
    this.terminal.output('💬 Status: Hacker Mode Active');
    this.terminal.output('🎨 Theme: Purple Elite');
    this.terminal.output('──────────────────────────────────');
    this.terminal.output('💜 Thanks for exploring Drake OS!');
    this.terminal.output('');
    
    // Try to open Discord
    setTimeout(() => {
      window.open('https://discord.com/users/809729227964284959', '_blank');
      this.terminal.logExternal('discord.com/users/809729227964284959');
    }, 2000);
  }

  /**
   * Handle hackerman easter egg
   */
  handleHackerman() {
    const hackerman = `
    ╔═════════════════════════════════════════╗
    ║         HACKERMAN MODE ACTIVATED!         ║
    ╚═════════════════════════════════════════╝
    
    🟣 ACCESSED: Mainframe 🟣
    🗝️  ENCRYPTION: Broken
    💻 SYSTEM: Compromised
    🌐 NETWORK: Infiltrated
    
    💜 Discord is the only way to contact me!
    💜 discord.com/users/809729227964284959
    `;
    
    this.terminal.output(hackerman);
    
    // Apply hacker mode visual effects
    document.body.classList.add('hacker-mode');
    setTimeout(() => {
      document.body.classList.remove('hacker-mode');
    }, 5000);
  }

  /**
   * Unlock secret theme as reward
   */
  unlockSecretTheme() {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', '#FFD700');
    root.style.setProperty('--accent-secondary', '#FF6B35');
    root.style.setProperty('--accent-glow', 'rgba(255, 215, 0, 0.4)');
    
    this.terminal.output('🌟 Secret Theme Unlocked: Golden Elite Mode!');
    this.terminal.output('Your Drake OS has been upgraded with special colors!');
    this.terminal.output('💜 Still keeping Discord purple though!');
  }
}

  /**
   * Handle history command
   */
  handleHistory() {
    if (this.commandHistory.length === 0) {
      this.terminal.output('No command history yet');
      return;
    }

    this.terminal.output('Command History:');
    this.commandHistory.forEach((cmd, index) => {
      this.terminal.output(`  ${index + 1}: ${cmd}`);
    });
  }

  /**
   * Simple autocomplete for commands
   */
  autocompleteCommand(partial) {
    const commands = ['ls', 'll', 'cd', 'cat', 'less', 'more', 'pwd', 'clear', 'help', 'whoami', 'date', 'neofetch', 'echo', 'mkdir', 'touch', 'rm', 'find', 'grep', 'exit', 'history', 'submit', 'discord', 'hackerman'];
    const matches = commands.filter(cmd => cmd.startsWith(partial));
    
    if (matches.length === 1) {
      document.getElementById('terminalInput').value = matches[0];
    } else if (matches.length > 1) {
      this.terminal.output('Available commands: ' + matches.join(', '));
    }
  }

  /**
   * Setup terminal resize functionality
   */
  setupTerminalResize() {
    const resizeBtn = document.getElementById('resizeTerminal');
    const terminal = document.getElementById('terminalWindow');
    
    if (!resizeBtn || !terminal) return;

    let isResizing = false;
    let startY, startHeight;

    resizeBtn.addEventListener('click', () => {
      const currentHeight = terminal.offsetHeight;
      
      if (currentHeight > 150) {
        // Minimize
        terminal.style.height = '80px';
        resizeBtn.innerHTML = '<i data-lucide="maximize-2"></i>';
      } else {
        // Maximize
        terminal.style.height = '300px';
        resizeBtn.innerHTML = '<i data-lucide="minimize-2"></i>';
      }
      
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new DrakeOS();
  app.init();

  // Make app globally accessible for debugging
  window.drakeos = app;
});
