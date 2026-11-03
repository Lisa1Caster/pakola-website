/**
 * PAKOLA ROSE — FULL SCREEN FULL HD (1920x1080) SCROLL ANIMATION
 * Seamless sticky pinned scroll sequence with smooth transition to content below.
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 283;
  const FRAME_DIR = 'frames/';
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.jpg';

  // Standard Full HD resolution (1080p 16:9)
  const HD_WIDTH = 1920;
  const HD_HEIGHT = 1080;

  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderNum = document.getElementById('loader-num');
  const canvas = document.getElementById('sequence-canvas');
  const animSection = document.getElementById('animation-section');
  const scrollCue = document.querySelector('.scroll-cue');
  const animHeroHeader = document.getElementById('anim-hero-header');

  if (!canvas) return;

  // Set canvas internal resolution to true Full HD (1920x1080)
  canvas.width = HD_WIDTH;
  canvas.height = HD_HEIGHT;

  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true
  });

  // High-quality image smoothing for ultra crisp scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let lastRenderedIndex = -1;

  function getFrameSrc(index) {
    const padded = String(index).padStart(3, '0');
    return `${FRAME_DIR}${FRAME_PREFIX}${padded}${FRAME_EXT}`;
  }

  // Preload and decode all 283 frames into GPU memory
  async function preloadAllFrames() {
    const promises = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);

      const promise = new Promise((resolve) => {
        img.onload = () => {
          frames[i - 1] = img;
          loadedCount++;
          const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
          if (loaderBar) loaderBar.style.width = `${pct}%`;
          if (loaderNum) loaderNum.textContent = `${pct}%`;

          // If frame 1, draw immediately
          if (i === 1) {
            ctx.drawImage(img, 0, 0, HD_WIDTH, HD_HEIGHT);
            lastRenderedIndex = 0;
          }

          // Pre-decode for zero latency scroll scrubbing
          if (img.decode) {
            img.decode().then(resolve).catch(resolve);
          } else {
            resolve();
          }
        };

        img.onerror = () => {
          loadedCount++;
          resolve();
        };
      });

      promises.push(promise);
    }

    await Promise.all(promises);

    // Hide loader smoothly once all frames are decoded
    if (loader) {
      loader.classList.add('hidden');
    }
    render();
  }

  // Get frame or nearest loaded fallback
  function getBestFrame(index) {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    if (frames[idx] && frames[idx].complete && frames[idx].naturalWidth > 0) {
      return { img: frames[idx], index: idx };
    }
    for (let i = idx - 1; i >= 0; i--) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
        return { img: frames[i], index: i };
      }
    }
    if (frames[0]) return { img: frames[0], index: 0 };
    return null;
  }

  function render() {
    const desiredIndex = Math.round(currentFrame);
    if (desiredIndex === lastRenderedIndex) return;

    const frameData = getBestFrame(desiredIndex);
    if (!frameData) return;

    // DIRECT FULL HD DRAW (1920x1080)
    ctx.drawImage(frameData.img, 0, 0, HD_WIDTH, HD_HEIGHT);
    lastRenderedIndex = frameData.index;
  }

  // Smooth lerping loop
  function animate() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.005) {
      currentFrame += diff * 0.2;
      render();
    }
    requestAnimationFrame(animate);
  }

  // Pinned scroll section progress calculation
  function updateScroll() {
    if (!animSection) return;
    const rect = animSection.getBoundingClientRect();
    const scrollableDistance = animSection.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return;

    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
    targetFrame = progress * (TOTAL_FRAMES - 1);

    // Fade away header (Pakola / The taste of Pakistan) when person scrolls 20% of scroll animation
    if (animHeroHeader) {
      const FADE_LIMIT = 0.20;
      if (progress <= 0) {
        animHeroHeader.style.opacity = '1';
        animHeroHeader.style.transform = 'translate(-50%, -50%)';
        animHeroHeader.style.visibility = 'visible';
      } else if (progress < FADE_LIMIT) {
        const ratio = progress / FADE_LIMIT;
        const opacity = Math.max(0, 1 - ratio);
        const translateY = -ratio * 25; // Subtle upward float as it fades
        animHeroHeader.style.opacity = opacity.toFixed(3);
        animHeroHeader.style.transform = `translate(-50%, calc(-50% + ${translateY.toFixed(1)}px))`;
        animHeroHeader.style.visibility = 'visible';
      } else {
        animHeroHeader.style.opacity = '0';
        animHeroHeader.style.transform = 'translate(-50%, calc(-50% - 25px))';
        animHeroHeader.style.visibility = 'hidden';
      }
    }

    // Fade out scroll cue as user starts scrolling
    if (scrollCue) {
      if (progress > 0.05) {
        scrollCue.style.opacity = '0';
        scrollCue.style.transform = 'translateX(-50%) translateY(12px)';
      } else {
        scrollCue.style.opacity = '1';
        scrollCue.style.transform = 'translateX(-50%) translateY(0)';
      }
    }

  }

  // Mobile menu dropdown handling
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      if (menuIcon) {
        menuIcon.textContent = isHidden ? 'menu' : 'close';
      }
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        if (menuIcon) menuIcon.textContent = 'menu';
      });
    });
  }

  // Double click toggles between cover (full bleed) and contain (full image framing)
  window.addEventListener('dblclick', () => {
    canvas.style.objectFit = canvas.style.objectFit === 'contain' ? 'cover' : 'contain';
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      window.scrollBy({ top: window.innerHeight * 0.35, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      window.scrollBy({ top: -window.innerHeight * 0.35, behavior: 'smooth' });
    }
  });

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });

  // Init
  preloadAllFrames();
  requestAnimationFrame(animate);
  updateScroll();

})();
