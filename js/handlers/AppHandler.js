/**
 * AppHandler
 * Handles special .app files like countdown, settings, etc.
 */
export class AppHandler {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.intervals = new Map();
  }

  /**
   * Render app content based on appType
   */
  render(container, file) {
    container.classList.add('app');

    const appType = file.appType || 'unknown';

    switch (appType) {
      case 'countdown':
        this.renderCountdown(container, file);
        break;
      case 'audio':
        this.renderAudioPlayer(container, file);
        break;
      default:
        this.renderUnknown(container, file);
    }
  }

  /**
   * Render countdown app
   */
  renderCountdown(container, file) {
    const config = file.config || {};
    const targetDate = new Date(config.targetDate || 'December 31, 2025');
    const title = config.title || 'Countdown';
    const message = config.message || 'Time\'s up!';

    container.innerHTML = `
      <div class="countdown-display">
        <div class="countdown-title">${title}</div>
        <div class="countdown-timer">
          <div class="countdown-unit">
            <span class="countdown-value" data-unit="days">--</span>
            <span class="countdown-label">Days</span>
          </div>
          <div class="countdown-unit">
            <span class="countdown-value" data-unit="hours">--</span>
            <span class="countdown-label">Hours</span>
          </div>
          <div class="countdown-unit">
            <span class="countdown-value" data-unit="minutes">--</span>
            <span class="countdown-label">Minutes</span>
          </div>
          <div class="countdown-unit">
            <span class="countdown-value" data-unit="seconds">--</span>
            <span class="countdown-label">Seconds</span>
          </div>
        </div>
        <div class="countdown-message" style="display: none;">${message}</div>
      </div>
    `;

    // Get elements from container (not document - window isn't in DOM yet)
    const daysEl = container.querySelector('[data-unit="days"]');
    const hoursEl = container.querySelector('[data-unit="hours"]');
    const minutesEl = container.querySelector('[data-unit="minutes"]');
    const secondsEl = container.querySelector('[data-unit="seconds"]');
    const messageEl = container.querySelector('.countdown-message');

    // Update countdown
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const diff = target - now;

      if (diff <= 0) {
        daysEl.textContent = '0';
        hoursEl.textContent = '0';
        minutesEl.textContent = '0';
        secondsEl.textContent = '0';
        messageEl.style.display = 'block';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = days;
      hoursEl.textContent = hours.toString().padStart(2, '0');
      minutesEl.textContent = minutes.toString().padStart(2, '0');
      secondsEl.textContent = seconds.toString().padStart(2, '0');
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    this.intervals.set(file.path, intervalId);
  }

  /**
   * Render audio player app
   */
  renderAudioPlayer(container, file) {
    const config = file.config || {};
    const tracks = config.tracks || [{ name: 'Unknown', file: '' }];
    const assetsPath = config.assetsPath || 'assets/';
    const hasMultipleTracks = tracks.length > 1;

    // Set playlist in audio manager (won't reset if same playlist)
    if (this.audioManager) {
      this.audioManager.setPlaylist(tracks, assetsPath);
    }

    // Get current track from audio manager (preserves position on reopen)
    const currentTrackInfo = this.audioManager?.getCurrentTrack();
    const currentTrackIndex = currentTrackInfo?.index ?? 0;
    const currentTrack = tracks[currentTrackIndex] || tracks[0];
    const albumArt = assetsPath + currentTrack.name + '.png';

    container.innerHTML = `
      <div class="audio-player-app">
        <div class="audio-album-art">
          <img src="${albumArt}" alt="${currentTrack.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="audio-album-fallback" style="display: none;">
            <i data-lucide="music"></i>
          </div>
        </div>
        <div class="audio-info">
          <div class="audio-track-name">${currentTrack.name}</div>
          <div class="audio-track-count">${hasMultipleTracks ? `Track ${currentTrackIndex + 1} of ${tracks.length}` : 'Background Music'}</div>
        </div>
        <div class="audio-controls">
          <button class="audio-nav-btn audio-prev-btn" ${hasMultipleTracks ? '' : 'style="visibility: hidden;"'}>
            <i data-lucide="skip-back"></i>
          </button>
          <button class="audio-play-btn" data-playing="false">
            <i data-lucide="play"></i>
          </button>
          <button class="audio-nav-btn audio-next-btn" ${hasMultipleTracks ? '' : 'style="visibility: hidden;"'}>
            <i data-lucide="skip-forward"></i>
          </button>
        </div>
        <div class="audio-status">Click to play</div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .audio-player-app {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-xl);
        gap: var(--space-md);
        height: 100%;
      }

      .audio-album-art {
        width: 180px;
        height: 180px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        position: relative;
      }

      .audio-album-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .audio-album-art.spinning img {
        animation: spin 8s linear infinite;
      }

      .audio-album-fallback {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .audio-album-fallback svg {
        width: 64px;
        height: 64px;
        color: var(--accent-primary);
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .audio-info {
        text-align: center;
        margin-top: var(--space-sm);
      }

      .audio-track-name {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
      }

      .audio-track-count {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        margin-top: 4px;
      }

      .audio-controls {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin: var(--space-md) 0;
      }

      .audio-nav-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        transition: all 0.2s ease;
      }

      .audio-nav-btn:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }

      .audio-nav-btn svg {
        width: 18px;
        height: 18px;
      }

      .audio-play-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--bg-secondary);
        border: 2px solid var(--border-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: var(--text-primary);
      }

      .audio-play-btn:hover {
        border-color: var(--accent-primary);
        transform: scale(1.05);
      }

      .audio-play-btn[data-playing="true"] {
        background: var(--accent-gradient);
        border-color: transparent;
        color: var(--bg-primary);
        box-shadow: 0 0 20px var(--accent-glow);
      }

      .audio-play-btn svg {
        width: 28px;
        height: 28px;
      }

      .audio-status {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
      }

      .audio-status.playing {
        color: var(--accent-primary);
      }
    `;
    container.appendChild(style);

    // Get elements from container
    const playBtn = container.querySelector('.audio-play-btn');
    const prevBtn = container.querySelector('.audio-prev-btn');
    const nextBtn = container.querySelector('.audio-next-btn');
    const status = container.querySelector('.audio-status');
    const albumArtEl = container.querySelector('.audio-album-art');
    const trackNameEl = container.querySelector('.audio-track-name');
    const trackCountEl = container.querySelector('.audio-track-count');
    const albumImg = container.querySelector('.audio-album-art img');
    const albumFallback = container.querySelector('.audio-album-fallback');

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    if (this.audioManager && playBtn && status) {
      const updatePlayState = (isPlaying) => {
        playBtn.dataset.playing = isPlaying;
        playBtn.innerHTML = `<i data-lucide="${isPlaying ? 'pause' : 'play'}"></i>`;
        status.textContent = isPlaying ? 'Now playing' : 'Paused';
        status.classList.toggle('playing', isPlaying);
        albumArtEl.classList.toggle('spinning', isPlaying);
        if (window.lucide) {
          window.lucide.createIcons();
        }
      };

      const updateTrackInfo = (track, index) => {
        trackNameEl.textContent = track.name;
        trackCountEl.textContent = hasMultipleTracks ? `Track ${index + 1} of ${tracks.length}` : 'Background Music';
        const newArt = assetsPath + track.name + '.png';
        albumImg.src = newArt;
        albumImg.style.display = '';
        albumFallback.style.display = 'none';
      };

      // Listen for state and track changes
      this.audioManager.onStateChange(updatePlayState);
      this.audioManager.onTrackChange(updateTrackInfo);

      // Button handlers
      playBtn.addEventListener('click', () => {
        this.audioManager.toggle();
      });

      if (hasMultipleTracks) {
        prevBtn.addEventListener('click', () => {
          this.audioManager.prev();
        });
        nextBtn.addEventListener('click', () => {
          this.audioManager.next();
        });
      }

      // Auto-start playback when opening music player
      if (!this.audioManager.isPlaying()) {
        this.audioManager.play();
      }

      // Initial state
      updatePlayState(this.audioManager.isPlaying());
    }
  }

  /**
   * Render unknown app type
   */
  renderUnknown(container, file) {
    container.innerHTML = `
      <div class="unknown-app">
        <i data-lucide="help-circle" style="width: 64px; height: 64px; color: var(--text-tertiary);"></i>
        <p style="color: var(--text-secondary); margin-top: var(--space-md);">
          Unknown application type: ${file.appType || 'none'}
        </p>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Cleanup when window closes
   */
  cleanup(path) {
    if (this.intervals.has(path)) {
      clearInterval(this.intervals.get(path));
      this.intervals.delete(path);
    }
  }

  /**
   * Check if this handler can handle the file
   */
  static canHandle(file) {
    return file.fileType === 'app' || file.name.endsWith('.app');
  }
}
