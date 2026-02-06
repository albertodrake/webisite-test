/**
 * Terminal Module
 * Handles terminal output logging
 */
export class Terminal {
  constructor(selector) {
    this.element = document.querySelector(selector);
    this.output = this.element;
    this.maxLines = 100;
    this.lines = [];
  }

  /**
   * Get current timestamp
   */
  getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Log a message to the terminal
   */
  log(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;

    const timestamp = document.createElement('span');
    timestamp.className = 'terminal-timestamp';
    timestamp.textContent = `[${this.getTimestamp()}]`;

    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = '$';

    const content = document.createElement('span');
    content.className = 'terminal-content';
    content.textContent = message;

    line.appendChild(timestamp);
    line.appendChild(prompt);
    line.appendChild(content);

    this.output.appendChild(line);
    this.lines.push(line);

    // Trim old lines
    while (this.lines.length > this.maxLines) {
      const oldLine = this.lines.shift();
      oldLine.remove();
    }

    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Log system message
   */
  system(message) {
    this.log(message, 'system');
  }

  /**
   * Log success message
   */
  success(message) {
    this.log(message, 'success');
  }

  /**
   * Log error message
   */
  error(message) {
    this.log(message, 'error');
  }

  /**
   * Clear terminal output
   */
  clear() {
    this.output.innerHTML = '';
    this.lines = [];
    this.system('Terminal cleared');
  }

  /**
   * Scroll to bottom of terminal
   */
  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  /**
   * Log navigation
   */
  logNav(path) {
    this.log(`cd ${path}`);
  }

  /**
   * Log file open
   */
  logOpen(filename) {
    this.log(`open ${filename}`);
  }

  /**
   * Log external link
   */
  logExternal(url) {
    this.log(`exec: opening ${url}`, 'success');
  }

  /**
   * Log window close
   */
  logClose(filename) {
    this.log(`close ${filename}`);
  }

  /**
   * Log hidden files toggle
   */
  logHiddenToggle(show) {
    this.log(show ? 'show hidden files' : 'hide hidden files', 'system');
  }
}
