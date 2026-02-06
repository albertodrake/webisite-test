/**
 * AudioManager Module
 * Handles background music playback with playlist support
 */
export class AudioManager {
  constructor(audioSelector, buttonSelector) {
    this.audio = document.querySelector(audioSelector);
    this.button = document.querySelector(buttonSelector);
    this.playing = false;
    this.listeners = [];
    this.trackListeners = [];

    // Playlist
    this.tracks = [];
    this.currentTrackIndex = 0;
    this.assetsPath = 'assets/';

    if (!this.audio) return;

    this.init();
  }

  init() {
    // Start muted
    this.audio.volume = 0.3;
    this.audio.muted = true;
    this.audio.loop = false; // Disable native looping to allow playlist support

    // Button click handler
    if (this.button) {
      this.button.addEventListener('click', () => this.toggle());
    }

    // Update UI on state change
    this.audio.addEventListener('play', () => {
      this.playing = true;
      this.updateUI(true);
      this.notifyListeners(true);
    });
    this.audio.addEventListener('pause', () => {
      this.playing = false;
      this.updateUI(false);
      this.notifyListeners(false);
    });

    // Auto-advance to next track when song ends
    this.audio.addEventListener('ended', () => {
      this.next();
    });

    // Initial UI state
    this.updateUI(false);
  }

  /**
   * Set the playlist
   */
  setPlaylist(tracks, assetsPath = 'assets/') {
    // Check if this is the same playlist already loaded (don't reset if so)
    const isSamePlaylist = this.tracks.length === tracks.length &&
      this.tracks.every((t, i) => t.file === tracks[i].file);

    if (isSamePlaylist && this.tracks.length > 0) {
      // Playlist already set, don't reset - keep current position
      return;
    }

    this.tracks = tracks;
    this.assetsPath = assetsPath;
    this.currentTrackIndex = 0;
    if (tracks.length > 0) {
      this.loadTrack(0, false);
    }
  }

  /**
   * Load a track by index
   */
  loadTrack(index, autoPlay = true) {
    if (index < 0 || index >= this.tracks.length) return;

    this.currentTrackIndex = index;
    const track = this.tracks[index];
    const wasPlaying = this.playing;

    this.audio.src = this.assetsPath + track.file;
    this.audio.load();

    // Notify track change listeners
    this.notifyTrackListeners(track, index);

    if (autoPlay && wasPlaying) {
      this.play();
    }
  }

  /**
   * Get current track info
   */
  getCurrentTrack() {
    if (this.tracks.length === 0) return null;
    return {
      ...this.tracks[this.currentTrackIndex],
      index: this.currentTrackIndex,
      total: this.tracks.length
    };
  }

  /**
   * Play next track
   */
  next() {
    if (this.tracks.length === 0) return;
    const nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.loadTrack(nextIndex, true);
  }

  /**
   * Play previous track
   */
  prev() {
    if (this.tracks.length === 0) return;
    const prevIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.loadTrack(prevIndex, true);
  }

  /**
   * Add a listener for play/pause state changes
   */
  onStateChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a state change listener
   */
  offStateChange(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all state listeners
   */
  notifyListeners(isPlaying) {
    this.listeners.forEach(cb => cb(isPlaying));
  }

  /**
   * Add a listener for track changes
   */
  onTrackChange(callback) {
    this.trackListeners.push(callback);
  }

  /**
   * Remove a track change listener
   */
  offTrackChange(callback) {
    this.trackListeners = this.trackListeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all track listeners
   */
  notifyTrackListeners(track, index) {
    this.trackListeners.forEach(cb => cb(track, index));
  }

  /**
   * Toggle play/pause
   */
  toggle() {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Play audio
   */
  play() {
    this.audio.muted = false;
    this.audio.play().catch(err => {
      console.log('Audio playback failed:', err);
    });
  }

  /**
   * Pause audio
   */
  pause() {
    this.audio.pause();
  }

  /**
   * Check if playing
   */
  isPlaying() {
    return this.playing && !this.audio.paused;
  }

  /**
   * Update button UI
   */
  updateUI(isPlaying) {
    if (!this.button) return;

    const icon = this.button.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', isPlaying ? 'volume-2' : 'volume-x');

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }

    if (isPlaying) {
      this.button.classList.add('active');
    } else {
      this.button.classList.remove('active');
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(level) {
    this.audio.volume = Math.max(0, Math.min(1, level));
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.audio.volume;
  }
}
