/**
 * ShellHandler
 * Renders shell script files with syntax highlighting
 */
export class ShellHandler {
  /**
   * Render shell script content
   */
  render(container, file) {
    container.classList.add('shell');

    const content = file.content || '# Empty script';
    const lines = content.split('\n');

    const html = lines.map((line, index) => {
      const lineNum = index + 1;
      const highlightedLine = this.highlightSyntax(line);
      return `
        <div class="shell-line">
          <span class="shell-line-number">${lineNum}</span>
          <span class="shell-line-content">${highlightedLine}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Apply syntax highlighting to a line
   */
  highlightSyntax(line) {
    // Escape HTML first
    let highlighted = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments
    if (highlighted.trim().startsWith('#')) {
      return `<span class="shell-comment">${highlighted}</span>`;
    }

    // Strings (double quotes)
    highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="shell-string">"$1"</span>');

    // Strings (single quotes)
    highlighted = highlighted.replace(/'([^']*)'/g, '<span class="shell-string">\'$1\'</span>');

    // Variables
    highlighted = highlighted.replace(/\$(\w+)/g, '<span class="shell-variable">$$$1</span>');
    highlighted = highlighted.replace(/\$\{([^}]+)\}/g, '<span class="shell-variable">${$1}</span>');

    // Keywords
    const keywords = ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'export', 'echo', 'exit', 'cd', 'pwd', 'ls', 'cat', 'grep', 'awk', 'sed', 'chmod', 'chown', 'mkdir', 'rm', 'cp', 'mv', 'sleep'];

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlighted = highlighted.replace(regex, '<span class="shell-keyword">$1</span>');
    });

    return highlighted;
  }

  /**
   * Check if this handler can handle the file
   */
  static canHandle(file) {
    return file.fileType === 'shell' ||
           file.name.endsWith('.sh') ||
           file.name.endsWith('.bash');
  }
}
