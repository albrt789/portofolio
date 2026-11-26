// ==========================================================================
// PORTFOLIO JAVASCRIPT — ALBERT RAFAEL SINAGA
// 3D Physics Lanyard Badge (Three.js + Rapier) + Lenis Smooth Scroll
// ==========================================================================

import { createBadgeScene } from './assets/badge/badge-scene.js';

(() => {
    'use strict';

    // ==========================================================================
    // 1. LENIS SMOOTH SCROLL
    // ==========================================================================
    let lenis = null;
    try {
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                touchMultiplier: 1.5,
            });

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    } catch (e) {
        console.warn('Lenis scroll error:', e);
    }

    // ==========================================================================
    // 2. THEME TOGGLE (LIGHT / DARK)
    // ==========================================================================
    const themeBtn = document.querySelector('#theme');
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

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
        });
    }

    // ==========================================================================
    // 3. ABOUT DRAWER MODAL ([MORE] BUTTON)
    // ==========================================================================
    const aboutDrawer = document.getElementById('about-drawer');
    const openAboutBtns = [
        document.getElementById('btn-open-about'),
        document.getElementById('btn-open-about-nav'),
        document.getElementById('btn-open-about-mobile'),
    ].filter(Boolean);
    const closeAboutBtn = document.getElementById('btn-close-about');

    const openDrawer = () => {
        if (!aboutDrawer) return;
        aboutDrawer.setAttribute('open', '');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        if (!aboutDrawer) return;
        aboutDrawer.removeAttribute('open');
        document.body.style.overflow = '';
    };

    openAboutBtns.forEach(btn => btn.addEventListener('click', openDrawer));
    if (closeAboutBtn) closeAboutBtn.addEventListener('click', closeDrawer);

    if (aboutDrawer) {
        aboutDrawer.addEventListener('click', (e) => {
            if (e.target === aboutDrawer) closeDrawer();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && aboutDrawer && aboutDrawer.hasAttribute('open')) {
            closeDrawer();
        }
    });

    // ==========================================================================
    // 4. FOOTER YEAR & FORM (AJAX VIA FETCH)
    // ==========================================================================
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const contactForm = document.getElementById('form');
    if (contactForm) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : 'Send ↗';

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending... ⏳';
            }

            try {
                const formData = new FormData(contactForm);
                const res = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (res.ok) {
                    contactForm.reset();
                    if (submitBtn) submitBtn.textContent = 'Sent! ✓';
                    setTimeout(() => {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                        }
                    }, 4000);
                } else {
                    throw new Error('Error sending message');
                }
            } catch (err) {
                if (submitBtn) submitBtn.textContent = 'Failed ✕';
                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                }, 4000);
            }
        });
    }

    // ==========================================================================
    // 5. 3D PHYSICS LANYARD BADGE ENGINE (THREE.JS + RAPIER3D)
    // ==========================================================================
    const canvas = document.getElementById('lanyard-canvas');
    const stillImg = document.getElementById('badge-still-img');
    const hint = document.getElementById('lanyard-hint');

    if (canvas && createBadgeScene) {
        const config = {
            physics: {
                gravity: 9.81,
                mass: 0.72,
                damping: 0.45,
                mouseForce: 1,
                grip: 100,
                strapStiffness: 90,
                antiTwist: 2.2,
                twistProgression: 3,
                swivelDamping: 0.15
            },
            material: {
                unlitArtwork: true,
                wear: 0.2,
                edgeDamage: 0.55,
                roughness: 0.012,
                transmission: 1,
                thickness: 0.006,
                metalRoughness: 0.2,
                strapColor: '#1c1e22'
            },
            lighting: {
                exposure: 1,
                keyLight: 2.5,
                reflections: 0.9,
                shadow: 0.13
            },
            background: {
                color: '#fafafa',
                transparent: true,
                filterBackground: false
            },
            filters: { enabled: false },
            plotter: { enabled: false },
            view: { angle: 0, zoom: 1 },
            paused: false
        };

        let hasInteracted = false;
        const onStateChange = (state) => {
            if (state === 'live') {
                requestAnimationFrame(() => {
                    if (stillImg) stillImg.classList.add('hidden');
                });
            }
            if (state === 'dragging' && !hasInteracted) {
                hasInteracted = true;
                if (hint) {
                    hint.style.opacity = '0';
                    setTimeout(() => hint.remove(), 400);
                }
            }
        };

        createBadgeScene(
            canvas,
            () => config,
            onStateChange,
            'assets/badge/badge-artwork.png'
        ).then(scene => {
            // Subtle pendulum swing on page scroll
            let lastScrollY = window.scrollY;
            window.addEventListener('scroll', () => {
                const dy = window.scrollY - lastScrollY;
                lastScrollY = window.scrollY;
                if (window.scrollY < window.innerHeight && Math.abs(dy) > 10 && scene?.nudge) {
                    scene.nudge();
                }
            }, { passive: true });
        }).catch(err => {
            console.warn('3D Badge initialized with fallback:', err);
        });
    }

    // ==========================================================================
    // 6. TOUCH SUPPORT FOR PROJECT FAN-OUT PREVIEWS ON MOBILE
    // ==========================================================================
    const projectRows = document.querySelectorAll('.project-row');
    projectRows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            projectRows.forEach(r => { if (r !== row) r.classList.remove('active'); });
            row.classList.toggle('active');
        });
    });
})();
