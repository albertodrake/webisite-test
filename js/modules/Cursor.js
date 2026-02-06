/**
 * Cursor Module
 * Custom cursor implementation
 */
export class Cursor {
  constructor() {
    this.dot = document.querySelector('.cursor-dot');
    this.outline = document.querySelector('.cursor-outline');

    if (!this.dot || !this.outline) return;

    this.init();
  }

  init() {
    // Check for touch device
    if (this.isTouchDevice()) {
      document.body.classList.remove('custom-cursor');
      return;
    }

    // Track mouse position
    let mouseX = 0;
    let mouseY = 0;
    let outlineX = 0;
    let outlineY = 0;

    // Update cursor position on mouse move
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Move dot immediately
      this.dot.style.left = `${mouseX}px`;
      this.dot.style.top = `${mouseY}px`;
    });

    // Smooth outline following
    const animate = () => {
      outlineX += (mouseX - outlineX) * 0.15;
      outlineY += (mouseY - outlineY) * 0.15;

      this.outline.style.left = `${outlineX}px`;
      this.outline.style.top = `${outlineY}px`;

      requestAnimationFrame(animate);
    };

    animate();

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      this.dot.classList.add('hidden');
      this.outline.classList.add('hidden');
    });

    document.addEventListener('mouseenter', () => {
      this.dot.classList.remove('hidden');
      this.outline.classList.remove('hidden');
    });

    // Scale on click
    document.addEventListener('mousedown', () => {
      this.dot.style.transform = 'translate(-50%, -50%) scale(0.8)';
      this.outline.style.transform = 'translate(-50%, -50%) scale(0.8)';
    });

    document.addEventListener('mouseup', () => {
      this.dot.style.transform = 'translate(-50%, -50%) scale(1)';
      this.outline.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  }

  isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }
}
