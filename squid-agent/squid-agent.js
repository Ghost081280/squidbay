/* ============================================
   SQUID AGENT LANDING PAGE JS
   Contact form (Web3Forms), smooth scroll,
   scroll-triggered animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ===================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ===================================
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ===================================
    // SCROLL-TRIGGERED FADE-IN
    // ===================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('sa-visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all cards, steps, features
    const animateTargets = [
        '.sa-pitch-card',
        '.sa-feature',
        '.sa-step',
        '.sa-spawn-step',
        '.sa-compare-card',
        '.sa-support-card',
        '.sa-math-card'
    ].join(',');

    document.querySelectorAll(animateTargets).forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${i % 4 * 0.08}s, transform 0.5s ease ${i % 4 * 0.08}s`;
        fadeObserver.observe(el);
    });

    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `.sa-visible { opacity: 1 !important; transform: translateY(0) !important; }`;
    document.head.appendChild(style);

    // ===================================
    // CONTACT FORM — WEB3FORMS
    // ===================================
    const form = document.getElementById('saContactForm');
    const result = document.getElementById('saFormResult');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const formData = new FormData(form);
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    result.textContent = 'Message sent! We\'ll get back to you soon. 🦑';
                    result.className = 'sa-form-result success';
                    form.reset();
                } else {
                    result.textContent = 'Something went wrong. Try again or email contact&#64;squidbay.io';
                    result.className = 'sa-form-result error';
                }
            } catch (err) {
                result.textContent = 'Network error. Try again or email contact&#64;squidbay.io';
                result.className = 'sa-form-result error';
            }

            btn.textContent = originalText;
            btn.disabled = false;

            setTimeout(() => {
                result.textContent = '';
                result.className = 'sa-form-result';
            }, 5000);
        });
    }

    // ===================================
    // HERO BADGE ANIMATION
    // ===================================
    const badge = document.querySelector('.sa-hero-badge');
    if (badge) {
        badge.style.opacity = '0';
        badge.style.transform = 'translateY(-10px)';
        badge.style.transition = 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s';
        requestAnimationFrame(() => {
            badge.style.opacity = '1';
            badge.style.transform = 'translateY(0)';
        });
    }

    // ===================================
    // HERO TITLE ANIMATION
    // ===================================
    const title = document.querySelector('.sa-hero-title');
    if (title) {
        title.style.opacity = '0';
        title.style.transform = 'translateY(15px)';
        title.style.transition = 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s';
        requestAnimationFrame(() => {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        });
    }

    // ===================================
    // HERO SUB + CTA ANIMATION
    // ===================================
    const heroSub = document.querySelector('.sa-hero-sub');
    const heroCtas = document.querySelector('.sa-hero-ctas');
    [heroSub, heroCtas].forEach((el, i) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(15px)';
            el.style.transition = `opacity 0.6s ease ${0.6 + i * 0.15}s, transform 0.6s ease ${0.6 + i * 0.15}s`;
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        }
    });

});
