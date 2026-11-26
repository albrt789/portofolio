// ==========================================================================
// PORTFOLIO JAVASCRIPT — ALBERT RAFAEL SINAGA
// 3D Physics Lanyard Badge (Three.js + Rapier) + Lenis Smooth Scroll
// ==========================================================================

import { createBadgeScene } from './assets/badge/badge-scene.js';

(() => {
    'use strict';

    // ==========================================================================
    // 1. LENIS SMOOTH SCROLL & NAVBAR SMOOTH NAVIGATION
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

    // Smooth scroll for navbar buttons & hash anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();

                const offset = href === '#home' ? 0 : -64;

                if (lenis) {
                    lenis.scrollTo(href === '#home' ? 0 : target, {
                        offset: offset,
                        duration: 1.2,
                    });
                } else {
                    const targetTop = href === '#home'
                        ? 0
                        : target.getBoundingClientRect().top + window.scrollY - 64;
                    window.scrollTo({
                        top: Math.max(0, targetTop),
                        behavior: 'smooth',
                    });
                }

                if (history.pushState) {
                    history.pushState(null, '', href);
                }
            }
        });
    });

    // ==========================================================================
    // 2. RECENT.DESIGN 3D PIXEL-PARTICLE THEME TOGGLE SWITCH ENGINE
    // ==========================================================================
    const toggleBtn = document.getElementById('theme-toggle');
    const toggleCanvas = document.getElementById('toggle-canvas');
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDarkMode = storedTheme === 'dark' || (!storedTheme && prefersDark);

    // Apply initial body theme & toggle state
    if (isDarkMode) {
        document.body.classList.add('dark');
        if (toggleBtn) toggleBtn.setAttribute('aria-checked', 'true');
    } else {
        document.body.classList.remove('dark');
        if (toggleBtn) toggleBtn.setAttribute('aria-checked', 'false');
    }

    if (toggleCanvas) {
        const ctx = toggleCanvas.getContext('2d');
        const SUN_PIXELS = [
            [7,2],[3,3],[7,3],[11,3],[4,4],[10,4],[6,5],[7,5],[8,5],
            [5,6],[6,6],[7,6],[8,6],[9,6],[2,7],[3,7],[5,7],[6,7],
            [7,7],[8,7],[9,7],[11,7],[12,7],[5,8],[6,8],[7,8],[8,8],
            [9,8],[6,9],[7,9],[8,9],[4,10],[10,10],[3,11],[7,11],[11,11],[7,12]
        ];

        const MOON_STAR_PIXELS = [
            [5,3],[6,3],[7,3],[11,3],[4,4],[5,4],[10,4],[11,4],[12,4],[3,5],[4,5],[5,5],[11,5],
            [3,6],[4,6],[5,6],[3,7],[4,7],[5,7],[3,8],[4,8],[5,8],[3,9],[4,9],[5,9],[6,9],
            [4,10],[5,10],[6,10],[7,10],[8,10],[5,11],[6,11],[7,11],[8,11]
        ];

        const particleCount = SUN_PIXELS.length; // 37
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const initialCoords = isDarkMode 
                ? (MOON_STAR_PIXELS[i] || MOON_STAR_PIXELS[i % MOON_STAR_PIXELS.length]) 
                : SUN_PIXELS[i];
            particles.push({
                x: initialCoords[0],
                y: initialCoords[1],
                targetX: initialCoords[0],
                targetY: initialCoords[1],
                originX: initialCoords[0],
                originY: initialCoords[1],
                scatterVx: 0,
                scatterVy: 0,
                alpha: 1,
            });
        }

        let animProgress = 1;
        let isAnimating = false;
        let animStartTime = 0;
        const ANIM_DURATION = 420; // ms

        const renderParticles = () => {
            ctx.clearRect(0, 0, toggleCanvas.width, toggleCanvas.height);
            const scale = toggleCanvas.width / 15; // ~3.2px per grid unit
            const pSize = 2.7;

            const isDarkNow = document.body.classList.contains('dark');
            ctx.fillStyle = isDarkNow ? 'rgba(255, 255, 255, 0.95)' : 'rgba(35, 36, 40, 0.95)';
            ctx.shadowColor = isDarkNow ? 'rgba(165, 180, 252, 0.85)' : 'rgba(245, 158, 11, 0.65)';
            ctx.shadowBlur = isDarkNow ? 4 : 2;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                if (p.alpha <= 0.02) continue;

                const drawX = p.x * scale;
                const drawY = p.y * scale;

                ctx.globalAlpha = p.alpha;
                ctx.fillRect(Math.round(drawX), Math.round(drawY), pSize, pSize);
            }
            ctx.globalAlpha = 1;
        };

        const updateAnimation = (now) => {
            if (!isAnimating) return;
            const elapsed = now - animStartTime;
            animProgress = Math.min(1, elapsed / ANIM_DURATION);

            // Phase 1 (0 -> 0.45): Dissolve & Scatter explosion
            // Phase 2 (0.45 -> 1.0): Snap to target with spring physics
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                if (animProgress < 0.45) {
                    const scatterT = animProgress / 0.45;
                    p.x = p.originX + p.scatterVx * scatterT;
                    p.y = p.originY + p.scatterVy * scatterT;
                } else {
                    const reassembleT = (animProgress - 0.45) / 0.55;
                    // Smooth spring interpolation
                    const springEase = (t) => Math.sin(t * Math.PI / 2);
                    const tClamped = springEase(reassembleT);
                    const scatterEndX = p.originX + p.scatterVx;
                    const scatterEndY = p.originY + p.scatterVy;

                    p.x = scatterEndX + (p.targetX - scatterEndX) * tClamped;
                    p.y = scatterEndY + (p.targetY - scatterEndY) * tClamped;
                }
            }

            renderParticles();

            if (animProgress < 1) {
                requestAnimationFrame(updateAnimation);
            } else {
                isAnimating = false;
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    p.x = p.targetX;
                    p.y = p.targetY;
                    p.originX = p.targetX;
                    p.originY = p.targetY;
                }
                renderParticles();
            }
        };

        const triggerMorph = (toDark) => {
            const targets = toDark ? MOON_STAR_PIXELS : SUN_PIXELS;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.originX = p.x;
                p.originY = p.y;
                const target = targets[i] || targets[i % targets.length];
                p.targetX = target[0];
                p.targetY = target[1];

                // Scatter vector radiating outward with random noise
                const dx = p.originX - 7;
                const dy = p.originY - 7;
                const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.8;
                const dist = 3.5 + Math.random() * 5.5;
                p.scatterVx = Math.cos(angle) * dist;
                p.scatterVy = Math.sin(angle) * dist;
            }

            isAnimating = true;
            animStartTime = performance.now();
            requestAnimationFrame(updateAnimation);
        };

        // Initial draw
        renderParticles();

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                isDarkMode = document.body.classList.toggle('dark');
                toggleBtn.setAttribute('aria-checked', isDarkMode ? 'true' : 'false');
                try {
                    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
                } catch (e) {}

                triggerMorph(isDarkMode);
            });
        }
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
        if (lenis) lenis.stop();
    };

    const closeDrawer = () => {
        if (!aboutDrawer) return;
        aboutDrawer.removeAttribute('open');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
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
                wear: 0.0,
                edgeDamage: 0.0,
                roughness: 0.002,
                transmission: 1,
                thickness: 0.006,
                metalRoughness: 0.16,
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
        ).catch(err => {
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

    // ==========================================================================
    // 7. CERTIFICATES ARCHIVE & IN-PAGE LIGHTBOX (STUDIO SEVEN STYLE)
    // ==========================================================================
    const archiveRows = document.querySelectorAll('.archive-row');
    const archiveList = document.getElementById('archive-list');
    const previewImg = document.getElementById('archive-preview-img');
    const previewDeck = document.querySelector('.preview-deck-stack');

    const certLightbox = document.getElementById('cert-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxMeta = document.getElementById('lightbox-meta');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');

    if (archiveRows.length > 0) {
        let currentImgSrc = archiveRows[0].dataset.img;

        const setPreview = (row) => {
            archiveRows.forEach(r => r.classList.remove('active'));
            row.classList.add('active');

            const newSrc = row.dataset.img;
            if (newSrc && previewImg && newSrc !== currentImgSrc) {
                currentImgSrc = newSrc;
                previewImg.style.opacity = '0';
                previewImg.style.transform = 'scale(0.96)';
                setTimeout(() => {
                    previewImg.src = newSrc;
                    previewImg.style.opacity = '1';
                    previewImg.style.transform = 'scale(1)';
                }, 120);
            }
        };

        const openLightbox = (row) => {
            if (!certLightbox) return;
            const imgSrc = row.dataset.img;
            const title = row.dataset.title;
            const meta = `${row.dataset.meta} · ${row.dataset.date}`;

            if (lightboxImg) lightboxImg.src = imgSrc;
            if (lightboxTitle) lightboxTitle.textContent = title;
            if (lightboxMeta) lightboxMeta.textContent = meta;

            certLightbox.setAttribute('open', '');
            document.body.style.overflow = 'hidden';
            if (lenis) lenis.stop();
        };

        const closeLightbox = () => {
            if (!certLightbox) return;
            certLightbox.removeAttribute('open');
            document.body.style.overflow = '';
            if (lenis) lenis.start();
        };

        archiveRows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                if (archiveList) archiveList.classList.add('is-hovering');
                setPreview(row);
            });

            row.addEventListener('click', () => {
                openLightbox(row);
            });

            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(row);
                }
            });
        });

        if (archiveList) {
            archiveList.addEventListener('mouseleave', () => {
                archiveList.classList.remove('is-hovering');
            });
        }

        if (previewDeck) {
            previewDeck.addEventListener('click', () => {
                const activeRow = document.querySelector('.archive-row.active') || archiveRows[0];
                openLightbox(activeRow);
            });
        }

        if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);
        if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && certLightbox && certLightbox.hasAttribute('open')) {
                closeLightbox();
            }
        });
    }

    // ==========================================================================
    // 8. MINIMALIST ALPHABET TO 'HI' MORPH LOADING SCREEN
    // ==========================================================================
    const soundLoader = document.getElementById('sound-loader');
    const morphStage = document.getElementById('morph-loader-stage');
    const abjadChars = document.querySelectorAll('.abjad-char');
    const btnReplayLoader = document.getElementById('btn-replay-loader');

    if (soundLoader && morphStage && abjadChars.length > 0) {
        let isLoaderFinished = false;
        let shuffleInterval = null;
        let timer1 = null;
        let timer2 = null;
        let timer3 = null;
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';

        const clearTimers = () => {
            clearInterval(shuffleInterval);
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };

        const finishLoader = () => {
            if (isLoaderFinished) return;
            isLoaderFinished = true;
            clearTimers();

            soundLoader.classList.add('is-exiting');
            setTimeout(() => {
                soundLoader.style.display = 'none';
            }, 550);
        };

        const startSequence = () => {
            isLoaderFinished = false;
            clearTimers();
            soundLoader.style.display = 'flex';
            soundLoader.classList.remove('is-exiting');

            morphStage.className = 'morph-loader-box initial';

            // Reset abjad letters content
            abjadChars.forEach((c) => {
                c.textContent = alphabet[Math.floor(Math.random() * alphabet.length)];
            });

            // Fast kinetic scramble during initial float
            shuffleInterval = setInterval(() => {
                abjadChars.forEach((c) => {
                    c.textContent = alphabet[Math.floor(Math.random() * alphabet.length)];
                });
            }, 110);

            // Stage 2: 0.9s -> Letters converge and merge into 'h' and 'i'
            timer1 = setTimeout(() => {
                if (isLoaderFinished) return;
                clearInterval(shuffleInterval);
                morphStage.classList.remove('initial');
                morphStage.classList.add('merging');
            }, 900);

            // Stage 3: 1.55s -> Letters fuse into solid 'hi' with bouncy blue dot
            timer2 = setTimeout(() => {
                if (isLoaderFinished) return;
                morphStage.classList.remove('merging');
                morphStage.classList.add('formed');
            }, 1550);

            // Stage 4: 2.65s -> Smooth exit
            timer3 = setTimeout(() => {
                finishLoader();
            }, 2650);
        };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !isLoaderFinished) {
                finishLoader();
            }
        });

        if (btnReplayLoader) {
            btnReplayLoader.addEventListener('click', () => {
                startSequence();
            });
        }

        // Start sequence on page load
        if (document.readyState !== 'loading') {
            startSequence();
        } else {
            document.addEventListener('DOMContentLoaded', startSequence);
        }
    }
})();
