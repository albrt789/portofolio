const menu = document.querySelector('#menu');
const nav = document.querySelector('nav');
const theme = document.querySelector('#theme');
const form = document.querySelector('#form');


// =========================
// MOBILE MENU
// =========================

menu.onclick = () => {
    nav.classList.toggle('open');
};

nav.querySelectorAll('a').forEach(link => {
    link.onclick = () => {
        nav.classList.remove('open');
    };
});


// =========================
// DARK / LIGHT MODE
// =========================

theme.onclick = () => {
    document.body.classList.toggle('light');

    theme.textContent =
        document.body.classList.contains('light')
            ? '☀'
            : '☾';
};


// =========================
// FOOTER YEAR
// =========================

const year = document.querySelector('#year');

if (year) {
    year.textContent = new Date().getFullYear();
}


// =========================
// SCROLL REVEAL ANIMATION
// =========================

document.addEventListener('DOMContentLoaded', () => {

    const sections = document.querySelectorAll('.section');

    sections.forEach(section => {
        section.classList.add('reveal');
    });

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }

        });

    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });

});


// Progress bar scroll
const bar = document.createElement('div');
bar.id = 'progress';
document.body.prepend(bar);
addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
});

// Efek mengetik
const typed = document.querySelector('#typed');
if (typed) {
    const words = ['Software Development', 'Web Development', 'Problem Solving'];
    let w = 0, c = 0, del = false;
    (function tick() {
        const word = words[w];
        typed.textContent = word.slice(0, c);
        if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
        if (del && c === 0) { del = false; w = (w + 1) % words.length; }
        c += del ? -1 : 1;
        setTimeout(tick, del ? 40 : 80);
    })();
}

// Nav aktif saat scroll
const links = [...document.querySelectorAll('nav a')];
const navObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach(s => navObs.observe(s));

// Muncul berurutan
const staggerObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('show'); staggerObs.unobserve(e.target); }
    });
}, { threshold: 0.15 });
document.querySelectorAll('.skills, .certs, .timeline').forEach(el => {
    el.classList.add('stagger');
    [...el.children].forEach((child, i) => child.style.setProperty('--i', i));
    staggerObs.observe(el);
});

// Spotlight kursor
document.querySelectorAll('.card, .project, .cert').forEach(el => {
    el.classList.add('spot');
    el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', e.clientX - r.left + 'px');
        el.style.setProperty('--my', e.clientY - r.top + 'px');
    });
});

// Lightbox sertifikat
const lb = document.createElement('div');
lb.id = 'lightbox';
lb.innerHTML = '<button aria-label="Tutup">×</button><img alt="">';
document.body.append(lb);
const lbImg = lb.querySelector('img');
document.querySelectorAll('.cert').forEach(card => {
    card.onclick = (e) => {
        if (e.target.closest('a')) return;
        lbImg.src = card.dataset.full || card.querySelector('img').src;
        lb.classList.add('open');
    };
});
lb.onclick = () => lb.classList.remove('open');
addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('open'); });


// ===== TEMPEL DI AKHIR script.js (setelah additions.js) =====

// Tilt 3D pada kartu project
document.querySelectorAll('.project').forEach(card => {
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', x * 6 + 'deg');
        card.style.setProperty('--rx', -y * 6 + 'deg');
    });
    card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
    });
});

// Tombol kembali ke atas
const topBtn = document.createElement('button');
topBtn.id = 'top';
topBtn.setAttribute('aria-label', 'Kembali ke atas');
topBtn.textContent = '↑';
topBtn.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
document.body.append(topBtn);
addEventListener('scroll', () => topBtn.classList.toggle('show', scrollY > 500));



// ===== TEMPEL DI AKHIR script.js (setelah upgrade.js) =====
(() => {
    // Loader
    const loader = document.querySelector('#loader');
    const hideLoader = () => loader && loader.classList.add('hide');
    addEventListener('load', () => setTimeout(hideLoader, 500));
    setTimeout(hideLoader, 3500);

    // Angka statistik menghitung naik
    const countObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.querySelectorAll('[data-count]').forEach(el => {
                const to = +el.dataset.count, suffix = el.dataset.suffix || '';
                let start;
                const step = t => {
                    start = start ?? t;
                    const p = Math.min((t - start) / 1400, 1);
                    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            });
            countObs.unobserve(e.target);
        });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stats').forEach(s => countObs.observe(s));

    // Aksesibilitas tombol
    const th = document.querySelector('#theme');
    const mn = document.querySelector('#menu');
    const nv = document.querySelector('nav');
    th.setAttribute('aria-label', 'Ganti tema terang/gelap');
    mn.setAttribute('aria-label', 'Buka menu');
    mn.setAttribute('aria-expanded', 'false');
    mn.addEventListener('click', () => mn.setAttribute('aria-expanded', nv.classList.contains('open')));

    // Ingat pilihan tema
    try {
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light');
            th.textContent = '☀';
        }
    } catch (e) {}
    th.addEventListener('click', () => {
        try { localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch (e) {}
    });

    // Link eksternal lebih aman
    document.querySelectorAll('a[target="_blank"]').forEach(a => a.rel = 'noopener noreferrer');
})();
