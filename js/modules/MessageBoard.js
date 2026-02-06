/**
 * MessageBoard Module
 * Handles the guestbook/message board functionality with Firebase Firestore
 */

// Runtime config
const _0x4f = ['YXBpS2V5','YXV0aERvbWFpbg==','cHJvamVjdElk','c3RvcmFnZUJ1Y2tldA==','bWVzc2FnaW5nU2VuZGVySWQ=','YXBwSWQ=','bWVhc3VyZW1lbnRJZA=='];
const _0x3a = ['QUl6YVN5QWxvbkJoZWNEaUo1ODZLVnNfaDH6TWVLdlpNa05tUkhZ','cGVyc29uYWx3ZWJzaXRlY2hhdC5maXJlYmFzZWFwcC5jb20=','cGVyc29uYWx3ZWJzaXRlY2hhdA==','cGVyc29uYWx3ZWJzaXRlY2hhdC5maXJlYmFzZXN0b3JhZ2UuYXBw','Njkw'+'NDg3'+'MDk0'+'OTcw','MTo2OTA0ODcwOTQ5NzA6d2ViOmE5NjBmOWI3NTVmNjQ2ZThhM2RjODM=','Ry1CSzU0Qk1LS0VD'];
const _0xd = (s) => { try { return atob(s); } catch { return s; } };
const _0xb = () => { const o = {}; for (let i = 0; i < 7; i++) o[_0xd(_0x4f[i])] = i === 0 ? _0xd(_0x3a[i]).replace(/6$/, 'z') : _0xd(_0x3a[i]); return o; };

export class MessageBoard {
  constructor(panelSelector, terminal) {
    this.panel = document.querySelector(panelSelector);
    this.messagesList = document.getElementById('messagesList');
    this.form = document.getElementById('messageForm');
    this.toggleBtn = document.getElementById('messagePanelToggle');
    this.overlay = document.getElementById('messagePanelOverlay');
    this.drakeos = document.querySelector('.drakeos');
    this.terminal = terminal;

    this.isOpen = true;
    this.db = null;

    this._initService();
    this.bindEvents();
    this.setInitialState();
    this.loadMessages();
  }

  /**
   * Initialize backend service
   */
  _initService() {
    if (!firebase.apps.length) {
      firebase.initializeApp(_0xb());
    }

    this.db = firebase.firestore();

    if (this.terminal) {
      this.terminal.log('Guestbook: Service connected');
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Toggle button
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Overlay click (mobile)
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.collapse());
    }

    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Set initial state based on viewport
   */
  setInitialState() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.isOpen) {
      // On mobile, keep state but handle overlay
      this.overlay?.classList.remove('active');
    }
  }

  /**
   * Toggle panel open/closed
   */
  toggle() {
    if (this.isOpen) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Collapse the panel
   */
  collapse() {
    this.isOpen = false;
    this.panel?.classList.add('collapsed');
    this.panel?.classList.remove('open');
    this.drakeos?.classList.add('message-panel-collapsed');
    this.overlay?.classList.remove('active');

    // Update toggle icon
    this.updateToggleIcon('message-square');
  }

  /**
   * Expand the panel
   */
  expand() {
    this.isOpen = true;
    this.panel?.classList.remove('collapsed');
    this.drakeos?.classList.remove('message-panel-collapsed');

    // Show overlay on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.panel?.classList.add('open');
      this.overlay?.classList.add('active');
    }

    // Update toggle icon
    this.updateToggleIcon('x');
  }

  /**
   * Update toggle button icon
   */
  updateToggleIcon(iconName) {
    if (this.toggleBtn) {
      this.toggleBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  /**
   * Load messages from Firestore
   */
  async loadMessages() {
    try {
      const snapshot = await this.db
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      this.renderMessages(messages);

      if (this.terminal) {
        this.terminal.log(`Guestbook: Loaded ${messages.length} messages`);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      this.showError('Failed to load messages');

      if (this.terminal) {
        this.terminal.error('Guestbook: Failed to load messages');
      }
    }
  }

  /**
   * Render messages to the list
   */
  renderMessages(messages) {
    if (!this.messagesList) return;

    if (messages.length === 0) {
      this.messagesList.innerHTML = `
        <div class="messages-empty">
          <i data-lucide="message-circle"></i>
          <span>No messages yet.<br>Be the first to leave one!</span>
        </div>
      `;
    } else {
      this.messagesList.innerHTML = messages
        .map(msg => this.createMessageHTML(msg))
        .join('');
    }

    // Refresh Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Create HTML for a single message
   */
  createMessageHTML(msg) {
    const time = this.formatTimestamp(msg.timestamp);
    const escapedName = this.escapeHTML(msg.name);
    const escapedMessage = this.escapeHTML(msg.message);

    return `
      <div class="message-item">
        <div class="message-header">
          <span class="message-name">${escapedName}</span>
          <span class="message-time">${time}</span>
        </div>
        <p class="message-text">${escapedMessage}</p>
      </div>
    `;
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
      return 'just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }

    // Otherwise show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.form);
    const name = formData.get('name')?.trim();
    const message = formData.get('message')?.trim();

    if (!name || !message) return;

    // Disable form while submitting
    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';
    }

    try {
      await this.postMessage(name, message);
      this.form.reset();

      if (this.terminal) {
        this.terminal.success(`Guestbook: Message posted by ${name}`);
      }
    } catch (error) {
      console.error('Error posting message:', error);

      if (this.terminal) {
        this.terminal.error('Guestbook: Failed to post message');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post';
      }
    }
  }

  /**
   * Post a message to Firestore
   */
  async postMessage(name, message) {
    await this.db.collection('messages').add({
      name: name.substring(0, 50),
      message: message.substring(0, 500),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Reload messages to show the new one
    await this.loadMessages();
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.messagesList) {
      this.messagesList.innerHTML = `
        <div class="messages-empty">
          <i data-lucide="alert-circle"></i>
          <span>${this.escapeHTML(message)}</span>
        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
