// ==========================================================================
// PORTFOLIO JAVASCRIPT — ALBERT RAFAEL SINAGA
// Matter.js (Physics Lanyard Badge) + GSAP (Motion) + Lenis (Smooth Scroll)
// ==========================================================================

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

    // Default to clean light mode (Sam Cheng aesthetic), or respect preference
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
    // 5. MATTER.JS PHYSICS-DRIVEN INTERACTIVE LANYARD BADGE ENGINE
    // ==========================================================================
    const canvas = document.getElementById('lanyard-canvas');
    const badgeCard = document.getElementById('lanyard-badge');
    const viewport = document.getElementById('lanyard-viewport');
    const hint = document.querySelector('.lanyard-drag-hint');

    if (canvas && badgeCard && viewport && typeof Matter !== 'undefined') {
        const { Engine, Bodies, Composite, Constraint, Mouse, MouseConstraint, Runner } = Matter;

        const engine = Engine.create({
            gravity: { x: 0, y: 1.1, scale: 0.001 }
        });

        const ctx = canvas.getContext('2d');
        let width = viewport.clientWidth;
        let height = viewport.clientHeight;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const updateCanvasSize = () => {
            width = viewport.clientWidth;
            height = viewport.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.resetTransform();
            ctx.scale(dpr, dpr);
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        // Rope & Badge Physics Bodies
        const anchorX = () => width > 768 ? width * 0.54 : width * 0.5;
        let anchor = { x: anchorX(), y: -10 };

        const segments = 6;
        const segmentLen = 28;
        const group = Matter.Body.nextGroup(true);

        const ropeLinks = [];
        for (let i = 0; i < segments; i++) {
            const link = Bodies.circle(anchor.x, (i + 1) * segmentLen, 6, {
                collisionFilter: { group: group },
                frictionAir: 0.06,
                density: 0.002,
                render: { visible: false }
            });
            ropeLinks.push(link);
            Composite.add(engine.world, link);
        }

        // Anchor constraint to first link
        const anchorConstraint = Constraint.create({
            pointA: anchor,
            bodyB: ropeLinks[0],
            stiffness: 0.95,
            damping: 0.08,
            length: segmentLen
        });
        Composite.add(engine.world, anchorConstraint);

        // Constraints between links
        for (let i = 0; i < segments - 1; i++) {
            Composite.add(engine.world, Constraint.create({
                bodyA: ropeLinks[i],
                bodyB: ropeLinks[i + 1],
                stiffness: 0.95,
                damping: 0.08,
                length: segmentLen
            }));
        }

        // Badge Rigid Body
        const cardWidth = 236;
        const cardHeight = 340;
        const cardHalfH = cardHeight / 2;

        const badgeBody = Bodies.rectangle(
            anchor.x,
            segments * segmentLen + cardHalfH + 20,
            cardWidth,
            cardHeight,
            {
                collisionFilter: { group: group },
                chamfer: { radius: 16 },
                density: 0.006,
                frictionAir: 0.045,
                render: { visible: false }
            }
        );
        Composite.add(engine.world, badgeBody);

        // Constraint connecting last rope link to top attachment of badge
        const badgeConstraint = Constraint.create({
            bodyA: ropeLinks[segments - 1],
            bodyB: badgeBody,
            pointB: { x: 0, y: -cardHalfH + 12 },
            stiffness: 0.92,
            damping: 0.08,
            length: 12
        });
        Composite.add(engine.world, badgeConstraint);

        // Mouse Constraint for grabbing & dragging
        const mouse = Mouse.create(viewport);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.25,
                damping: 0.1,
                render: { visible: false }
            }
        });
        Composite.add(engine.world, mouseConstraint);

        // Hide hint once interacted
        let hasInteracted = false;
        Matter.Events.on(mouseConstraint, 'startdrag', () => {
            if (!hasInteracted && hint) {
                hasInteracted = true;
                hint.style.opacity = '0';
                setTimeout(() => hint.remove(), 400);
            }
        });

        // Run the physics engine
        const runner = Runner.create();
        Runner.run(runner, engine);

        // Handle window resize dynamically adjusting anchor
        window.addEventListener('resize', () => {
            anchor.x = anchorX();
            anchorConstraint.pointA.x = anchor.x;
        });

        // Draw Ribbon & Sync Badge position in Render Loop
        const renderLoop = () => {
            ctx.clearRect(0, 0, width, height);

            const isDark = document.body.classList.contains('dark');
            const ribbonColor = isDark ? '#e4e5e7' : '#111214';
            const stitchColor = isDark ? '#111214' : '#f5f5f5';

            // 1. Gather spine points along the lanyard
            const points = [
                { x: anchor.x, y: anchor.y }
            ];
            for (let i = 0; i < segments; i++) {
                points.push(ropeLinks[i].position);
            }
            // Badge attachment point
            const attachPoint = {
                x: badgeBody.position.x + Math.sin(badgeBody.angle) * (-cardHalfH + 12),
                y: badgeBody.position.y + Math.cos(badgeBody.angle) * (-cardHalfH + 12)
            };
            points.push(attachPoint);

            // 2. Draw shadow ribbon
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.12)';
            ctx.stroke();
            ctx.restore();

            // 3. Draw main lanyard strap
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = ribbonColor;
            ctx.stroke();

            // 4. Center stitching on ribbon
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = stitchColor;
            ctx.stroke();

            // 5. Ceiling Mount Hardware
            ctx.fillStyle = isDark ? '#71717a' : '#27272a';
            ctx.fillRect(anchor.x - 14, 0, 28, 8);
            ctx.restore();

            // 6. Transform Badge DOM Element with matrix / 3D transform
            const bx = badgeBody.position.x - cardWidth / 2;
            const by = badgeBody.position.y - cardHalfH;
            const deg = (badgeBody.angle * 180) / Math.PI;

            badgeCard.style.transform = `translate3d(${bx}px, ${by}px, 0) rotate(${deg}deg)`;

            requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    }
})();
