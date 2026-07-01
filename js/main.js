document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = Array.from(document.querySelectorAll('[data-slide]'));
  const slides = Array.from(document.querySelectorAll('.slide[data-index]'));
  const slideDots = document.getElementById('slideDots');
  const scrollProgress = document.getElementById('scrollProgress');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = 0;

  requestAnimationFrame(() => body.classList.remove('is-loading'));

  function closeMobileNav() {
    navToggle.classList.remove('navbar__toggle--active');
    navMenu.classList.remove('navbar__nav--open');
    navToggle.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
  }

  function updateActive(index) {
    activeIndex = index;
    slides.forEach((slide) => {
      const isActive = Number(slide.dataset.index) === index;
      slide.classList.toggle('slide--active', isActive);
      if (isActive) slide.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    });

    document.querySelectorAll('[data-slide]').forEach((link) => {
      link.classList.toggle('active', Number(link.dataset.slide) === index);
      if (link.classList.contains('slide-dot')) {
        link.setAttribute('aria-current', Number(link.dataset.slide) === index ? 'true' : 'false');
      }
    });
  }

  function goToSlide(index, options = {}) {
    const target = slides.find((slide) => Number(slide.dataset.index) === index);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - (navbar.offsetHeight || 0) + 1;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion || options.instant ? 'auto' : 'smooth'
    });

    if (options.updateHash !== false && target.id) {
      history.pushState(null, '', `${window.location.pathname}${window.location.search}#${target.id}`);
    }

    updateActive(index);
    closeMobileNav();
  }

  // Slide dots (hidden but still functional for data-slide clicks)
  if (slideDots) {
    slides.forEach((slide) => {
      const index = Number(slide.dataset.index);
      const title = slide.dataset.title || `Section ${index + 1}`;
      const dot = document.createElement('a');
      dot.href = `#${slide.id}`;
      dot.className = 'slide-dot';
      dot.dataset.slide = String(index);
      dot.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${title}</strong>`;
      dot.setAttribute('aria-label', `Go to ${title}`);
      slideDots.appendChild(dot);
    });
  }

  document.querySelectorAll('[data-slide]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      const index = Number(trigger.dataset.slide);
      if (Number.isNaN(index)) return;
      event.preventDefault();
      goToSlide(index);
    });
  });

  document.querySelectorAll('a[href="#"]:not([data-slide])').forEach((link) => {
    link.addEventListener('click', (event) => event.preventDefault());
  });

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('navbar__nav--open');
    navToggle.classList.toggle('navbar__toggle--active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    body.style.overflow = isOpen ? 'hidden' : '';
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    updateActive(Number(visible.target.dataset.index));
  }, { threshold: [0.35, 0.55, 0.75], rootMargin: '-20% 0px -35% 0px' });

  slides.forEach((slide) => sectionObserver.observe(slide));

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
  }, { passive: true });

  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (event.key === 'PageDown' || event.key === 'ArrowDown') {
      event.preventDefault();
      goToSlide(Math.min(activeIndex + 1, slides.length - 1));
    }
    if (event.key === 'PageUp' || event.key === 'ArrowUp') {
      event.preventDefault();
      goToSlide(Math.max(activeIndex - 1, 0));
    }
  });

  window.addEventListener('hashchange', () => {
    const target = document.querySelector(window.location.hash);
    if (target && target.classList.contains('slide')) {
      goToSlide(Number(target.dataset.index), { updateHash: false });
    }
  });

  const initialHashTarget = window.location.hash && document.querySelector(window.location.hash);
  if (initialHashTarget && initialHashTarget.classList.contains('slide')) {
    goToSlide(Number(initialHashTarget.dataset.index), { instant: true, updateHash: false });
  } else {
    updateActive(0);
  }

  // ── Stat Counters ──
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, Number(el.dataset.target), el.dataset.suffix || '+');
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.55 });

  statNumbers.forEach((el) => counterObserver.observe(el));

  function animateCounter(el, target, suffix) {
    const duration = prefersReducedMotion ? 1 : 1600;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = `${Math.round(eased * target)}${suffix}`;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ── Product Tabs ──
  const productTabs = Array.from(document.querySelectorAll('.product-tab'));
  const productPanels = Array.from(document.querySelectorAll('.product-panel'));

  productTabs.forEach((tab) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
    tab.addEventListener('click', () => {
      const product = tab.dataset.product;
      productTabs.forEach((item) => {
        const isActive = item.dataset.product === product;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      productPanels.forEach((panel) => {
        panel.classList.toggle('product-panel--active', panel.dataset.product === product);
      });
    });
  });

  // ── Contact Form ──
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const formData = new FormData(contactForm);
    const subject = formData.get('subject') || 'New SCHELLES project inquiry';
    const message = [
      `Name: ${formData.get('name')}`,
      `Email: ${formData.get('email')}`,
      '',
      String(formData.get('message'))
    ].join('\n');
    window.location.href = `mailto:schellesllp@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    showToast('Opening your email app to send the message.');
  });

  function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast--hide');
      setTimeout(() => toast.remove(), 450);
    }, 3500);
  }

  // ══════════════════════════════════════
  // AI ANIMATIONS (non-reduced-motion)
  // ══════════════════════════════════════
  if (!prefersReducedMotion) {
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });

    function smoothCursor() {
      cursorX += (targetX - cursorX) * 0.08;
      cursorY += (targetY - cursorY) * 0.08;
      body.style.setProperty('--cursor-x', `${cursorX}px`);
      body.style.setProperty('--cursor-y', `${cursorY}px`);
      requestAnimationFrame(smoothCursor);
    }
    smoothCursor();

    // 3D card tilt
    document.querySelectorAll('.card, .product-block__mockup, .vision__pillar').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        card.style.transform = `perspective(800px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg) translateY(-8px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });

    // ── AI BRAIN: Neural Network + Data Flow ──
    const brainCanvas = document.getElementById('aiBrainCanvas');
    if (brainCanvas && window.innerWidth > 600) {
      const ctx = brainCanvas.getContext('2d');
      let nodes = [];
      let pulses = [];

      function resizeBrain() {
        const hero = brainCanvas.parentElement;
        brainCanvas.width = hero.offsetWidth;
        brainCanvas.height = hero.offsetHeight;
        initBrainNodes();
      }

      function initBrainNodes() {
        nodes = [];
        const cx = brainCanvas.width / 2;
        const cy = brainCanvas.height / 2;
        const count = Math.min(Math.floor((brainCanvas.width * brainCanvas.height) / 12000), 120);

        // Create brain-shaped cluster: denser in center, sparser at edges
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.pow(Math.random(), 0.6) * Math.min(cx, cy) * 0.85;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          const layer = radius < Math.min(cx, cy) * 0.3 ? 0 : radius < Math.min(cx, cy) * 0.6 ? 1 : 2;

          nodes.push({
            x, y,
            baseX: x,
            baseY: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: layer === 0 ? 2.5 : layer === 1 ? 2 : 1.2,
            pulse: Math.random() * Math.PI * 2,
            layer,
            connections: []
          });
        }

        // Pre-compute connections
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = nodes[i].layer === 0 && nodes[j].layer === 0 ? 200 : 130;
            if (dist < maxDist) {
              nodes[i].connections.push(j);
            }
          }
        }
      }

      function spawnPulse() {
        if (nodes.length < 2) return;
        const startIdx = Math.floor(Math.random() * nodes.length);
        const startNode = nodes[startIdx];
        if (startNode.connections.length === 0) return;
        const endIdx = startNode.connections[Math.floor(Math.random() * startNode.connections.length)];
        const colors = ['0, 212, 170', '124, 92, 252', '93, 230, 214'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        pulses.push({
          x: startNode.x, y: startNode.y,
          tx: nodes[endIdx].x, ty: nodes[endIdx].y,
          progress: 0, speed: 0.02 + Math.random() * 0.03,
          color, size: 3 + Math.random() * 3
        });
      }

      function drawBrain() {
        ctx.clearRect(0, 0, brainCanvas.width, brainCanvas.height);

        // Mouse influence
        const mouseInfluence = 250;

        // Update & draw nodes
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.pulse += 0.015;

          // Gentle float
          n.x = n.baseX + Math.sin(n.pulse * 0.5 + i) * 3;
          n.y = n.baseY + Math.cos(n.pulse * 0.7 + i) * 3;

          // Mouse repulsion
          const dx = cursorX - n.x;
          const dy = (cursorY - brainCanvas.getBoundingClientRect().top) - n.y;
          const mouseDist = Math.sqrt(dx * dx + dy * dy);
          if (mouseDist < mouseInfluence && mouseDist > 0) {
            const force = (1 - mouseDist / mouseInfluence) * 15;
            n.x -= (dx / mouseDist) * force;
            n.y -= (dy / mouseDist) * force;
          }

          // Draw connections
          for (const j of n.connections) {
            const m = nodes[j];
            const ddx = n.x - m.x;
            const ddy = n.y - m.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            const maxDist = n.layer === 0 && m.layer === 0 ? 200 : 130;
            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * (n.layer === 0 ? 0.25 : 0.12);
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(m.x, m.y);
              const isCore = n.layer === 0 || m.layer === 0;
              ctx.strokeStyle = isCore
                ? `rgba(0, 212, 170, ${alpha})`
                : `rgba(124, 92, 252, ${alpha * 0.7})`;
              ctx.lineWidth = isCore ? 0.8 : 0.4;
              ctx.stroke();
            }
          }

          // Draw node
          const glow = 0.3 + Math.sin(n.pulse) * 0.25;
          const r = n.radius + Math.sin(n.pulse) * 0.4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = n.layer === 0
            ? `rgba(0, 212, 170, ${glow + 0.3})`
            : n.layer === 1
              ? `rgba(93, 230, 214, ${glow})`
              : `rgba(124, 92, 252, ${glow * 0.7})`;
          ctx.fill();

          // Core glow
          if (n.layer === 0 && n.radius > 2) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 170, ${glow * 0.06})`;
            ctx.fill();
          }
        }

        // Draw pulses (data flowing through network)
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.progress += p.speed;
          if (p.progress > 1) { pulses.splice(i, 1); continue; }

          const x = p.x + (p.tx - p.x) * p.progress;
          const y = p.y + (p.ty - p.y) * p.progress;
          const alpha = Math.sin(p.progress * Math.PI);

          ctx.beginPath();
          ctx.arc(x, y, p.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.8})`;
          ctx.fill();

          // Pulse trail
          ctx.beginPath();
          ctx.arc(x, y, p.size * alpha * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.12})`;
          ctx.fill();
        }

        // Spawn new pulses
        if (Math.random() < 0.08) spawnPulse();

        requestAnimationFrame(drawBrain);
      }

      resizeBrain();
      drawBrain();
      window.addEventListener('resize', resizeBrain);
    }

    // ── MATRIX RAIN ──
    const matrixHeroCanvas = document.getElementById('aiMatrixCanvas');
    if (matrixHeroCanvas && window.innerWidth > 600) {
      const mCtx = matrixHeroCanvas.getContext('2d');
      const chars = 'SCHELLES AI ML NLP NEURAL DEEP TENSOR GPU CLOUD DATA 01 10 1101 0010'.split(' ');
      let columns = [];

      function resizeMatrixHero() {
        const parent = matrixHeroCanvas.parentElement;
        matrixHeroCanvas.width = parent.offsetWidth;
        matrixHeroCanvas.height = parent.offsetHeight;
        const colW = 32;
        columns = Array.from({ length: Math.floor(matrixHeroCanvas.width / colW) }, () =>
          Math.floor(Math.random() * matrixHeroCanvas.height / 18)
        );
      }

      function drawMatrixHero() {
        mCtx.fillStyle = 'rgba(5, 5, 8, 0.06)';
        mCtx.fillRect(0, 0, matrixHeroCanvas.width, matrixHeroCanvas.height);
        mCtx.font = '14px "Courier New", monospace';

        columns.forEach((y, i) => {
          const text = chars[Math.floor(Math.random() * chars.length)];
          const x = i * 32;
          mCtx.globalAlpha = 0.15 + Math.random() * 0.2;
          mCtx.fillStyle = Math.random() > 0.8 ? '#7c5cfc' : '#00d4aa';
          mCtx.fillText(text, x, y * 18);
          columns[i] = y * 18 > matrixHeroCanvas.height && Math.random() > 0.975 ? 0 : y + 1;
        });

        mCtx.globalAlpha = 1;
        requestAnimationFrame(drawMatrixHero);
      }

      resizeMatrixHero();
      drawMatrixHero();
      window.addEventListener('resize', resizeMatrixHero);
    }

    // ── Global Particle Canvas (unified flowing background) ──
    const globalCanvas = document.getElementById('globalParticleCanvas');
    if (globalCanvas && window.innerWidth > 600) { // skip on small viewports for performance
      const gCtx = globalCanvas.getContext('2d');
      let gNodes = [];
      const PARTICLE_COUNT = 120;
      const CONNECTION_DIST = 150;
      let mouseX = -9999, mouseY = -9999;

      function resizeGlobal() {
        globalCanvas.width = window.innerWidth;
        globalCanvas.height = window.innerHeight;
      }

      function initGlobalNodes() {
        gNodes = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const isTeal = Math.random() > 0.2;
          gNodes.push({
            x: Math.random() * globalCanvas.width,
            y: Math.random() * globalCanvas.height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            r: 0.6 + Math.random() * 2.2,
            pulse: Math.random() * Math.PI * 2,
            color: isTeal ? 'teal' : 'purple',
            baseAlpha: 0.25 + Math.random() * 0.45
          });
        }
      }

      function drawGlobal() {
        gCtx.clearRect(0, 0, globalCanvas.width, globalCanvas.height);

        for (let i = 0; i < gNodes.length; i++) {
          const n = gNodes[i];
          n.x += n.vx;
          n.y += n.vy;
          n.pulse += 0.015;

          // Wrap around edges for seamless flow
          if (n.x < -10) n.x = globalCanvas.width + 10;
          if (n.x > globalCanvas.width + 10) n.x = -10;
          if (n.y < -10) n.y = globalCanvas.height + 10;
          if (n.y > globalCanvas.height + 10) n.y = -10;

          // Mouse repulsion for interactivity
          const mdx = n.x - mouseX;
          const mdy = n.y - mouseY;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 120) {
            const force = (120 - mDist) / 120 * 0.8;
            n.vx += (mdx / mDist) * force * 0.15;
            n.vy += (mdy / mDist) * force * 0.15;
          }

          // Dampen velocity
          n.vx *= 0.998;
          n.vy *= 0.998;

          // Draw connections
          for (let j = i + 1; j < gNodes.length; j++) {
            const m = gNodes[j];
            const dx = n.x - m.x;
            const dy = n.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECTION_DIST) {
              const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
              gCtx.beginPath();
              gCtx.moveTo(n.x, n.y);
              gCtx.lineTo(m.x, m.y);
              gCtx.strokeStyle = n.color === 'purple'
                ? `rgba(124, 92, 252, ${alpha})`
                : `rgba(0, 212, 170, ${alpha})`;
              gCtx.lineWidth = 0.5;
              gCtx.stroke();
            }
          }

          // Draw particle with glow
          const glow = n.baseAlpha + Math.sin(n.pulse) * 0.2;
          const r = n.r + Math.sin(n.pulse * 0.7) * 0.4;

          // Soft glow (simple arc, no radial gradient for performance)
          gCtx.beginPath();
          gCtx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
          gCtx.fillStyle = n.color === 'purple'
            ? `rgba(124, 92, 252, ${glow * 0.12})`
            : `rgba(0, 212, 170, ${glow * 0.12})`;
          gCtx.fill();

          // Core dot
          gCtx.beginPath();
          gCtx.arc(n.x, n.y, r, 0, Math.PI * 2);
          gCtx.fillStyle = n.color === 'purple'
            ? `rgba(124, 92, 252, ${glow})`
            : `rgba(0, 212, 170, ${glow})`;
          gCtx.fill();
        }

        requestAnimationFrame(drawGlobal);
      }

      resizeGlobal();
      initGlobalNodes();
      drawGlobal();

      window.addEventListener('resize', () => {
        resizeGlobal();
        // Re-distribute particles that ended up out of bounds
        gNodes.forEach(n => {
          if (n.x > globalCanvas.width) n.x = Math.random() * globalCanvas.width;
          if (n.y > globalCanvas.height) n.y = Math.random() * globalCanvas.height;
        });
      });

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      window.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
      });
    }

    // ── Floating Particles (Hero) ──
    const particleContainer = document.getElementById('aiParticles');
    if (particleContainer) {
      const types = ['dot', 'ring', 'square', 'hex'];
      for (let i = 0; i < 35; i++) {
        const p = document.createElement('div');
        const type = types[Math.floor(Math.random() * types.length)];
        p.className = `ai-particle ai-particle--${type}`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.animationDuration = `${6 + Math.random() * 10}s`;
        p.style.animationDelay = `${Math.random() * 8}s`;
        p.style.opacity = `${0.2 + Math.random() * 0.5}`;
        particleContainer.appendChild(p);
      }
    }

    // ── Floating Binary (Products) ──
    const binaryContainer = document.querySelector('.ai-binary-float');
    if (binaryContainer) {
      for (let i = 0; i < 25; i++) {
        const span = document.createElement('span');
        span.className = 'ai-binary-char';
        span.textContent = Math.random() > 0.5 ? '1' : '0';
        span.style.left = `${Math.random() * 100}%`;
        span.style.animationDuration = `${8 + Math.random() * 12}s`;
        span.style.animationDelay = `${Math.random() * 10}s`;
        span.style.fontSize = `${10 + Math.random() * 14}px`;
        binaryContainer.appendChild(span);
      }
    }

    // ── Magnetic Button Effect ──
    document.querySelectorAll('.btn-primary').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }
});
