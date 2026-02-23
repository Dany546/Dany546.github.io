/* Lightweight controller for Papers interactive slide */
(function () {
    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $all(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

    const tabs = $all('#papers-tabs [role="tab"]');
    const pages = $all('.paper-page');
    let current = 0;

    function init() {
        tabs.forEach((t, i) => {
            t.addEventListener('click', () => show(i));
            t.dataset.index = i;
            t.setAttribute('tabindex', i === 0 ? '0' : '-1');
        });
        document.addEventListener('keydown', onKey);
        // collapse toggles
        $all('.collapse-toggle').forEach(btn => {
            btn.addEventListener('click', () => btn.nextElementSibling.classList.toggle('hidden'));
        });
        // show initial
        show(0, false);
        // read hash
        const m = location.hash.match(/papers=([^&]+)/);
        if (m) { const idx = tabs.findIndex(t => t.dataset.pageId === m[1] || t.dataset.page === m[1]); if (idx >= 0) show(idx); }
    }

    function show(index, updateHash = true) {
        index = Math.max(0, Math.min(pages.length - 1, index));
        pages.forEach((p, i) => p.classList.toggle('active', i === index));
        tabs.forEach((t, i) => {
            t.setAttribute('aria-selected', String(i === index));
            t.setAttribute('tabindex', i === index ? '0' : '-1');
        });
        current = index;
        // lazy-load pdf iframe if present
        const active = pages[index];
        if (!active) return;
        const pdfWrap = active.querySelector('.pdf-wrap');
        if (pdfWrap && !pdfWrap.querySelector('iframe')) {
            const src = pdfWrap.dataset.pdfSrc;
            if (src) {
                const iframe = document.createElement('iframe');
                iframe.src = src + '#view=FitH';
                iframe.title = 'Paper PDF preview';
                pdfWrap.innerHTML = '';
                pdfWrap.appendChild(iframe);
            }
        }
        // lazy-render a demo Plotly if requested
        const fig = active.querySelector('[data-plotly]');
        if (fig && fig.innerHTML.trim() === '') {
            const spec = fig.dataset.plotly ? JSON.parse(fig.dataset.plotly) : null;
            // load Plotly if demo
            if (spec && spec.demo) {
                loadPlotly().then(() => {
                    const data = [{ x: [1, 2, 3, 4], y: [2, 6, 3, 8], type: 'scatter', mode: 'lines+markers' }];
                    const layout = { margin: { t: 10, b: 30 } };
                    Plotly.newPlot(fig, data, layout, { responsive: true });
                }).catch(() => { fig.textContent = 'Plotly failed to load'; });
            }
        }
        if (updateHash) history.replaceState(null, '', '#papers=' + (active.id || index));
    }

    function onKey(e) {
        if (e.key === 'ArrowRight') { show(current + 1); }
        else if (e.key === 'ArrowLeft') { show(current - 1); }
        else if (/^[1-9]$/.test(e.key)) { const n = parseInt(e.key, 10) - 1; if (n < tabs.length) show(n); }
    }

    function loadPlotly() {
        if (window.Plotly) return Promise.resolve();
        return new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.plot.ly/plotly-latest.min.js';
            s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
    }

    // expose for manual use
    window.Papers = { init, show };
    // auto-init when DOM ready
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
