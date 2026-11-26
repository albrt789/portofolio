// ==========================================================================
// PORTFOLIO SCRIPT — ALBERT RAFAEL SINAGA
// Features: Physics-Driven Lanyard Badge, Theme Toggle, Smooth UX
// ==========================================================================

(() => {
    'use strict';

    // ==========================================================================
    // 1. THEME TOGGLE WITH LOCALSTORAGE PERSISTENCE
    // ==========================================================================
    const themeBtn = document.querySelector('#theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');

    // Default: light mode (editorial vibe), or respect stored preference
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        document.body.classList.add('dark');
        if (themeBtn) themeBtn.textContent = '☀';
    } else {
        document.body.classList.remove('dark');
        if (themeBtn) themeBtn.textContent = '☾';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            themeBtn.textContent = isDark ? '☀' : '☾';
            try {
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            } catch (e) {}
            // Update canvas strap color on theme change
            if (window.renderLanyardStrap) window.renderLanyardStrap();
        });
    }

    // ==========================================================================
    // 2. MOBILE NAVIGATION MENU
    // ==========================================================================
    const menuBtn = document.querySelector('#menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            menuBtn.setAttribute('aria-expanded', navLinks.classList.contains('open'));
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ==========================================================================
    // 3. FOOTER YEAR
    // ==========================================================================
    const yearEl = document.querySelector('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ==========================================================================
    // 4. ANIMATED STATS COUNTER
    // ==========================================================================
    const countObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('[data-count]').forEach(el => {
                const target = +el.dataset.count;
                const suffix = el.dataset.suffix || '';
                let startTimestamp = null;
                const duration = 1400;

                const step = (now) => {
                    if (!startTimestamp) startTimestamp = now;
                    const progress = Math.min((now - startTimestamp) / duration, 1);
                    // Ease out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(target * eased) + suffix;
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            });
            countObserver.unobserve(entry.target);
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.stats-strip').forEach(el => countObserver.observe(el));

    // ==========================================================================
    // 5. CERTIFICATE LIGHTBOX MODAL
    // ==========================================================================
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.innerHTML = '<button aria-label="Close modal">×</button><img alt="Preview Certificate">';
    document.body.append(lightbox);
    const lbImg = lightbox.querySelector('img');

    document.querySelectorAll('.cert-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            const img = card.querySelector('img');
            if (img) {
                lbImg.src = img.src;
                lightbox.classList.add('open');
            }
        });
    });

    lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') lightbox.classList.remove('open');
    });

    // ==========================================================================
    // 6. BACK TO TOP BUTTON
    // ==========================================================================
    const topBtn = document.createElement('button');
    topBtn.id = 'top';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.textContent = '↑';
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.append(topBtn);

    window.addEventListener('scroll', () => {
        topBtn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });

    // ==========================================================================
    // 7. CONTACT FORM (AJAX VIA FETCH)
    // ==========================================================================
    const contactForm = document.querySelector('#form');
    if (contactForm) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Send Message ↗';

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Sending...</span> ⏳';
            }

            try {
                const formData = new FormData(contactForm);
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    contactForm.reset();
                    if (submitBtn) submitBtn.innerHTML = '<span>Message Sent!</span> ✓';
                    setTimeout(() => {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalBtnHTML;
                        }
                    }, 4000);
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (err) {
                if (submitBtn) submitBtn.innerHTML = '<span>Failed to send. Try again!</span> ✕';
                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnHTML;
                    }
                }, 4000);
            }
        });
    }

    // ==========================================================================
    // 8. PHYSICS-DRIVEN INTERACTIVE LANYARD BADGE ENGINE
    // ==========================================================================
    const stage = document.getElementById('lanyard-stage');
    const canvas = document.getElementById('lanyard-canvas');
    const badge = document.getElementById('lanyard-badge');
    const hint = document.querySelector('.lanyard-hint');

    if (stage && canvas && badge) {
        const ctx = canvas.getContext('2d');
        let width = stage.clientWidth;
        let height = stage.clientHeight;

        const resize = () => {
            width = stage.clientWidth;
            height = stage.clientHeight;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        // Simulation parameters
        const restLength = 145; // resting strap length
        let anchorX = width / 2;
        let anchorY = 0;

        let posX = anchorX;
        let posY = restLength;
        let velX = 0;
        let velY = 0;

        let angle = 0;
        let angleVel = 0;

        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;
        let lastPointerX = 0;
        let lastPointerY = 0;
        let lastPointerTime = 0;

        // Reset badge rest position relative to anchor
        const updateAnchor = () => {
            anchorX = width / 2;
            anchorY = 0;
        };

        // Pointer event handlers
        const onPointerDown = (e) => {
            isDragging = true;
            badge.setPointerCapture(e.pointerId);

            const rect = stage.getBoundingClientRect();
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;

            dragOffsetX = posX - pointerX;
            dragOffsetY = posY - pointerY;

            lastPointerX = pointerX;
            lastPointerY = pointerY;
            lastPointerTime = performance.now();

            velX = 0;
            velY = 0;

            if (hint) {
                hint.style.opacity = '0';
                setTimeout(() => hint.remove(), 400);
            }
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const rect = stage.getBoundingClientRect();
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;

            const now = performance.now();
            const dt = Math.max((now - lastPointerTime) / 1000, 0.016);

            // Compute throw velocity
            velX = (pointerX - lastPointerX) / dt * 0.035;
            velY = (pointerY - lastPointerY) / dt * 0.035;

            lastPointerX = pointerX;
            lastPointerY = pointerY;
            lastPointerTime = now;

            posX = pointerX + dragOffsetX;
            posY = Math.max(pointerY + dragOffsetY, 35); // prevent badge going way above ceiling
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            try { badge.releasePointerCapture(e.pointerId); } catch (_) {}
        };

        badge.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        // Lanyard render function for strap ribbon
        const drawStrap = (ax, ay, bx, by) => {
            ctx.clearRect(0, 0, width, height);

            const isDark = document.body.classList.contains('dark');
            const strapMainColor = isDark ? '#e2e4e8' : '#141517';
            const strapAccentColor = isDark ? '#141517' : '#ffffff';

            const strapWidth = 14;

            // Draw shadow of strap
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(ax, ay);

            // Curve control point based on sag/stretch
            const midX = (ax + bx) / 2 + (bx - ax) * 0.08;
            const midY = (ay + by) / 2 + 10;

            ctx.quadraticCurveTo(midX, midY, bx, by);
            ctx.lineWidth = strapWidth;
            ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)';
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();

            // Draw main ribbon
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.quadraticCurveTo(midX, midY, bx, by);
            ctx.lineWidth = strapWidth;
            ctx.strokeStyle = strapMainColor;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Stitching / woven stripe line in the center
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.quadraticCurveTo(midX, midY, bx, by);
            ctx.lineWidth = 2;
            ctx.strokeStyle = strapAccentColor;
            ctx.setLineDash([4, 4]);
            ctx.stroke();

            // Top mount clasp bracket at ceiling
            ctx.fillStyle = isDark ? '#8e929b' : '#3c4048';
            ctx.fillRect(ax - 12, 0, 24, 7);
            ctx.restore();
        };

        window.renderLanyardStrap = () => drawStrap(anchorX, anchorY, posX, posY);

        // Physics step & animation loop
        let lastFrameTime = performance.now();

        const animate = (currentTime) => {
            updateAnchor();

            const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.04);
            lastFrameTime = currentTime;

            if (!isDragging) {
                // Vector from anchor to badge
                const dx = posX - anchorX;
                const dy = posY - anchorY;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                // Hooke's Spring Law
                const stretch = dist - restLength;
                const springStrength = 0.08;
                const force = -springStrength * stretch;

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force + 0.9; // Gravity pull

                velX = (velX + fx) * 0.94; // Air damping
                velY = (velY + fy) * 0.94;

                posX += velX;
                posY += velY;

                // Pendulum angle physics
                const targetAngle = Math.atan2(dx, dy);
                const angleDiff = targetAngle - angle;
                const angleForce = angleDiff * 0.12;

                angleVel = (angleVel + angleForce) * 0.91;
                angle += angleVel;
            } else {
                // When dragging, tilt card according to displacement & speed
                const dx = posX - anchorX;
                const dy = Math.max(posY - anchorY, 40);
                const targetAngle = Math.atan2(dx, dy) * 0.85;

                angleVel = (targetAngle - angle) * 0.3;
                angle += angleVel;
            }

            // Draw the strap
            drawStrap(anchorX, anchorY, posX, posY);

            // Transform Badge Card DOM element
            const badgeWidth = badge.offsetWidth || 250;
            const tx = posX - badgeWidth / 2;
            const ty = posY;
            const deg = (angle * 180) / Math.PI;

            badge.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${deg}deg)`;

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }
})();
