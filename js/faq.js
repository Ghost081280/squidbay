/**
 * SquidBay FAQ Page JS
 * js/faq.js
 */

(function() {
    'use strict';

// FAQ nav badge clicks — scroll to category
        document.querySelectorAll('.faq-nav-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.faq-nav-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var target = document.getElementById(btn.dataset.section);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Accordion toggle
        document.querySelectorAll('.faq-question').forEach(function(question) {
            question.addEventListener('click', function() {
                var item = question.parentElement;
                var wasOpen = item.classList.contains('open');
                item.parentElement.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
                if (!wasOpen) { item.classList.add('open'); }
            });
        });
        
        // Live sat price from CoinGecko
        (async function() {
            try {
                var res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
                var data = await res.json();
                var btc = data.bitcoin.usd;
                var sat = btc / 100000000;
                var el = document.getElementById('sat-prices');
                if (el) {
                    el.innerHTML = 
                        '<span>100 sats ≈ <strong style="color:var(--primary)">$' + (sat * 100).toFixed(3) + '</strong></span>' +
                        '<span style="margin: 0 16px; opacity: 0.3;">·</span>' +
                        '<span>1,000 sats ≈ <strong style="color:var(--primary)">$' + (sat * 1000).toFixed(2) + '</strong></span>' +
                        '<span style="margin: 0 16px; opacity: 0.3;">·</span>' +
                        '<span>10,000 sats ≈ <strong style="color:var(--primary)">$' + (sat * 10000).toFixed(2) + '</strong></span>';
                }
            } catch(e) {
                var el = document.getElementById('sat-prices');
                if (el) el.innerHTML = '100 sats ≈ $0.07 · 1,000 sats ≈ $0.68 · 10,000 sats ≈ $6.80 <span style="opacity:0.5">(approximate)</span>';
            }
        })();

})();
