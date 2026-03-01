/**
 * Squid Agent Landing Page JS
 * Carousel, contact form, interactions
 */

(function() {
    'use strict';

    // --------------------------------------------------------------------------
    // Feature Carousel
    // --------------------------------------------------------------------------

    function initCarousel() {
        const track = document.getElementById('carousel-track');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const dotsContainer = document.getElementById('carousel-dots');

        if (!track || !prevBtn || !nextBtn) return;

        const cards = Array.from(track.children);
        const totalCards = cards.length;
        let currentIndex = 0;
        let autoTimer = null;
        let touchStartX = 0;
        let touchEndX = 0;

        function getVisibleCount() {
            if (window.innerWidth <= 480) return 1;
            if (window.innerWidth <= 768) return 2;
            return 3;
        }

        function getMaxIndex() {
            return Math.max(0, totalCards - getVisibleCount());
        }

        function buildDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            const maxIdx = getMaxIndex();
            for (let i = 0; i <= maxIdx; i++) {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                dot.addEventListener('click', function() { goTo(i); });
                dotsContainer.appendChild(dot);
            }
        }

        function updateDots() {
            if (!dotsContainer) return;
            dotsContainer.querySelectorAll('.carousel-dot').forEach(function(dot, i) {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        function goTo(index) {
            const maxIdx = getMaxIndex();
            currentIndex = Math.max(0, Math.min(index, maxIdx));

            const card = cards[0];
            if (!card) return;
            const cardStyle = getComputedStyle(card);
            const cardWidth = card.offsetWidth + parseInt(cardStyle.marginRight || 0);
            // Account for gap
            const gap = parseInt(getComputedStyle(track).gap) || 16;
            const slideWidth = card.offsetWidth + gap;

            track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + 'px)';
            updateDots();
        }

        function next() {
            if (currentIndex >= getMaxIndex()) {
                goTo(0);
            } else {
                goTo(currentIndex + 1);
            }
        }

        function prev() {
            if (currentIndex <= 0) {
                goTo(getMaxIndex());
            } else {
                goTo(currentIndex - 1);
            }
        }

        function startAuto() {
            stopAuto();
            autoTimer = setInterval(next, 4000);
        }

        function stopAuto() {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        }

        // Buttons
        prevBtn.addEventListener('click', function() { prev(); startAuto(); });
        nextBtn.addEventListener('click', function() { next(); startAuto(); });

        // Pause on hover
        var carouselWrap = track.closest('.sa-carousel');
        if (carouselWrap) {
            carouselWrap.addEventListener('mouseenter', stopAuto);
            carouselWrap.addEventListener('mouseleave', startAuto);
        }

        // Touch/swipe
        track.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            stopAuto();
        }, { passive: true });

        track.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            var diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) next(); else prev();
            }
            startAuto();
        }, { passive: true });

        // Resize
        window.addEventListener('resize', function() {
            goTo(Math.min(currentIndex, getMaxIndex()));
            buildDots();
        });

        // Init
        buildDots();
        goTo(0);
        startAuto();
    }

    // --------------------------------------------------------------------------
    // Contact Form (Web3Forms)
    // --------------------------------------------------------------------------

    function initContactForm() {
        var form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var btn = form.querySelector('button[type="submit"]');
            var originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                var response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form)
                });
                var data = await response.json();
                if (data.success) {
                    form.reset();
                    btn.textContent = 'Sent ✓';
                    setTimeout(function() { btn.textContent = originalText; btn.disabled = false; }, 3000);
                } else {
                    btn.textContent = 'Error — try again';
                    setTimeout(function() { btn.textContent = originalText; btn.disabled = false; }, 3000);
                }
            } catch (err) {
                btn.textContent = 'Error — try again';
                setTimeout(function() { btn.textContent = originalText; btn.disabled = false; }, 3000);
            }
        });
    }

    // --------------------------------------------------------------------------
    // Init
    // --------------------------------------------------------------------------

    function init() {
        initCarousel();
        initContactForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
