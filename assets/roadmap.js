// assets/roadmap.js
// Lightweight roadmap interactivity. Auto-initializes when a [data-roadmap] root exists.
(function () {
    'use strict';

    const DETAILS = {
        foundations: {
            title: 'Foundations: Heterogeneity & annotation noise',
            bullets: ['Site/scanner/protocol variability', 'Inter-observer label variability']
        },
        published_securefl: {
            title: 'Secure FL: privacy-preserving annotation peer-review',
            bullets: ['Secure architecture for collaborative labelling', 'Enables multi-site evaluation']
        },
        published_cia: {
            title: 'CIA: controllable image augmentation',
            bullets: ['Stable Diffusion-based synthetic patients', 'Quality filtering + ControlNet']
        },
        submitted_recon: {
            title: 'Recon-based UQ',
            bullets: ['Low-cost single-pass failure signal', 'Good clinical viability']
        },
        submitted_uq_eval: {
            title: 'UQ evaluation paradigm',
            bullets: ['Safety-constrained threshold calibration', 'Risk–coverage evaluation']
        },
        emerging: {
            title: 'Emerging: Clustering & coverage metrics',
            bullets: ['Feature-based patient subgroups', 'Sampling for coverage maximization']
        },
        future: {
            title: 'Future: Test-set protocol & QA dashboard',
            bullets: ['Systematic suite design + coverage metrics', 'Multi-site validation plan']
        }
    };

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function initRoadmap() {
        // Build interactive nodes from the DETAILS keys but bind to existing DOM containers
        const ids = Object.keys(DETAILS);
        const nodes = ids.map(id => document.querySelector(`[data-node-id="${id}"]`)).filter(Boolean);
        if (!nodes.length) return;

        const detailsTitle = document.getElementById('roadmap-status');
        const detailsBullets = document.getElementById('roadmap-bullets');

        let activeIndex = 0;
        let expandedEl = null;

        function renderDetails(nodeId) {
            const d = DETAILS[nodeId] || { title: nodeId, bullets: [] };
            if (detailsTitle) detailsTitle.textContent = d.title;
            if (detailsBullets) {
                detailsBullets.innerHTML = '';
                d.bullets.forEach(b => {
                    const el = document.createElement('div');
                    el.textContent = '• ' + b;
                    detailsBullets.appendChild(el);
                });
            }
        }

        function collapseCurrent() {
            if (expandedEl) {
                expandedEl.classList.remove('expanded');
                // manage aria if present
                if (expandedEl.getAttribute('aria-expanded') !== null) expandedEl.setAttribute('aria-expanded', 'false');
                // special-case foundation examples box
                if (expandedEl.id === 'box_found_examples') {
                    expandedEl.style.display = 'none';
                    const btn = document.getElementById('btn_show_foundation_examples');
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                    expandedEl.setAttribute('aria-hidden', 'true');
                }
                expandedEl = null;
            }
        }

        function expandFor(node) {
            collapseCurrent();
            if (!node) return;
            // If node itself is a container that can expand, toggle its 'expanded' class
            node.classList.add('active');
            const target = node;
            // if the node is a roadmap lane or item, try to find a nearby details box
            // special-case: foundations -> box_found_examples
            if (node.getAttribute('data-node-id') === 'foundations') {
                const box = document.getElementById('box_found_examples');
                if (box) {
                    box.style.display = '';
                    box.setAttribute('aria-hidden', 'false');
                    const btn = document.getElementById('btn_show_foundation_examples');
                    if (btn) btn.setAttribute('aria-expanded', 'true');
                    expandedEl = box;
                    return;
                }
            }

            // If the node itself is an expandable card or item, expand it visually
            node.classList.add('expanded');
            if (node.getAttribute('aria-expanded') !== null) node.setAttribute('aria-expanded', 'true');
            expandedEl = node;
        }

        function setActive(index, focusNode = false) {
            if (index < 0) index = 0;
            if (index >= nodes.length) index = nodes.length - 1;
            nodes.forEach(n => n.classList.remove('active'));
            const node = nodes[index];
            if (!node) return;
            node.classList.add('active');
            activeIndex = index;
            const nodeId = node.getAttribute('data-node-id');
            renderDetails(nodeId);
            expandFor(node);
            if (focusNode && node.focus) node.focus();
        }

        function jumpToNode(nodeId) {
            const el = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (el) {
                try {
                    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
                    el.focus && el.focus();
                } catch (e) { window.location.hash = `#${nodeId}`; }
            }
        }

        nodes.forEach((node, i) => {
            node.setAttribute('tabindex', node.getAttribute('tabindex') || '0');
            node.addEventListener('click', () => setActive(i, true));
            node.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActive(i, true);
                }
                if (e.key === 'ArrowRight') setActive(Math.min(i + 1, nodes.length - 1), true);
                if (e.key === 'ArrowLeft') setActive(Math.max(i - 1, 0), true);
            });
            node.addEventListener('focus', () => setActive(i, false));
        });

        // Attach toggle behavior to the foundation examples button if present
        const foundationBtn = document.getElementById('btn_show_foundation_examples');
        const foundationBox = document.getElementById('box_found_examples');
        if (foundationBtn && foundationBox) {
            foundationBtn.addEventListener('click', () => {
                const expanded = foundationBtn.getAttribute('aria-expanded') === 'true';
                foundationBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                foundationBox.style.display = expanded ? 'none' : '';
                foundationBox.setAttribute('aria-hidden', expanded ? 'true' : 'false');
            });
        }

        // Initialize first available node
        setActive(0, false);
    }

    // Auto-init on DOMContentLoaded: bind to existing containers with data-node-id
    document.addEventListener('DOMContentLoaded', () => {
        try { initRoadmap(); } catch (e) { console.warn('roadmap init failed', e); }
    });

    // Expose init function for manual initialization
    window.initRoadmap = initRoadmap;
})();
// changelog: rationale: add accessible roadmap JS to initialize roadmap UI; source: presentation_inline.html (~lines 1-400)
// Minimal vanilla module to initialize roadmap interactions and animations.
(function () {
    'use strict';

    function createButton(title, controlsId, id) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'roadmap-milestone-btn';
        btn.setAttribute('aria-controls', controlsId);
        btn.setAttribute('aria-label', title || 'Open milestone');
        btn.dataset.elementId = id;
        if (id) btn.id = id;
        return btn;
    }

    function makePopover(index, title, previewSrc) {
        const pop = document.createElement('div');
        pop.className = 'roadmap-popover';
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-modal', 'false');
        pop.innerHTML = `
      <div class="roadmap-popover-inner">
        <img loading="lazy" alt="${title || 'Preview'}" data-src="${previewSrc}" />
        <a class="roadmap-go" href="#section-${index + 1}">Go to section</a>
        <button class="roadmap-close" aria-label="Close">Close</button>
      </div>
    `;
        return pop;
    }

    function initRoadmap(root) {
        if (!root) return;
        const svg = root.querySelector('svg');
        const svgPaths = svg ? Array.from(svg.querySelectorAll('path')) : [];
        const milestones = Array.from(root.querySelectorAll('[data-milestone]'));

        // Prepare SVG stroke dash for draw animation and mark timeline class
        svgPaths.forEach((p) => {
            try {
                const len = p.getTotalLength();
                p.style.strokeDasharray = len;
                p.style.strokeDashoffset = len;
                p.style.transition = 'stroke-dashoffset 900ms ease';
                p.classList.add('timeline-dashed');
            } catch (e) { }
        });

        // Animate when roadmap becomes visible in viewport
        const io = new IntersectionObserver((entries) => {
            entries.forEach((ent) => {
                if (ent.isIntersecting) {
                    root.classList.add('roadmap--visible');
                    svgPaths.forEach((p) => {
                        try { p.style.strokeDashoffset = '0'; p.classList.add('path-animate'); } catch (e) { }
                    });
                } else {
                    root.classList.remove('roadmap--visible');
                    svgPaths.forEach((p) => {
                        try { p.style.strokeDashoffset = p.style.strokeDasharray || '0'; p.classList.remove('path-animate'); } catch (e) { }
                    });
                }
            });
        }, { threshold: 0.15 });
        io.observe(root);

        if (!milestones.length) return;

        const controls = document.createElement('div');
        controls.className = 'roadmap-controls';
        root.appendChild(controls);

        // Create a highlight indicator that will move along the path
        const highlight = document.createElement('div');
        highlight.className = 'roadmap-highlight';
        highlight.setAttribute('aria-hidden', 'true');
        root.appendChild(highlight);

        let active = 0;
        let currentPopover = null;
        let lastFocused = null;

        function focusButton(i) {
            const btn = controls.children[i];
            if (btn) btn.focus();
            moveHighlightToIndex(i);
        }

        function openMilestone(i) {
            closePopover();
            const node = milestones[i];
            const title = node.getAttribute('data-milestone') || `Milestone ${i + 1}`;
            const preview = node.getAttribute('data-preview') || `assets/previews/section-${i + 1}.png`;
            const popId = `milestone-popover-${i + 1}`;
            const pop = makePopover(i, title, preview);
            pop.id = popId;

            // Anchor and basic placement
            pop.style.position = 'absolute';
            pop.style.zIndex = 9999;
            const rect = node.getBoundingClientRect();
            const rootRect = root.getBoundingClientRect();
            pop.style.top = (rect.top - rootRect.top + rect.height + 8) + 'px';
            pop.style.left = (rect.left - rootRect.left) + 'px';

            // Lazy-load the image src when opening
            const img = pop.querySelector('img');
            if (img && img.dataset && img.dataset.src) img.src = img.dataset.src;

            // set aria-labelledby to the corresponding button id where possible
            const labelId = (buttons[i] && buttons[i].id) || node.getAttribute('data-element-id') || `milestone-${i + 1}`;
            pop.setAttribute('aria-labelledby', labelId);

            root.appendChild(pop);
            currentPopover = pop;

            // animate popover entrance
            requestAnimationFrame(() => pop.classList.add('open'));

            // announce to live region for screen readers
            try {
                const live = document.getElementById('roadmap-status');
                if (live) {
                    live.textContent = `Preview: ${title}`;
                    // clear after announce
                    setTimeout(() => { if (live.textContent === `Preview: ${title}`) live.textContent = ''; }, 2200);
                }
            } catch (e) { }

            // set focus to first interactive element in popover
            const firstInteractive = pop.querySelector('a,button');
            lastFocused = document.activeElement;
            if (firstInteractive) firstInteractive.focus();

            // close handler
            pop.querySelector('.roadmap-close').addEventListener('click', closePopover);
            moveHighlightToIndex(i);
        }

        function closePopover() {
            if (!currentPopover) return;
            // play exit transition then remove
            const pop = currentPopover;
            pop.classList.remove('open');
            const cleanup = () => { try { pop.remove(); } catch (e) { } };
            pop.addEventListener('transitionend', cleanup, { once: true });
            // fallback removal
            setTimeout(cleanup, 300);
            currentPopover = null;
            if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        }

        // Move highlight dot to the milestone index along the SVG path
        function moveHighlightToIndex(i) {
            if (!svg || !svgPaths.length) return;
            const path = svgPaths[0];
            let len = 0;
            try { len = path.getTotalLength(); } catch (e) { return; }
            const t = buttons.length === 1 ? 0.5 : (i / (buttons.length - 1));
            const point = path.getPointAtLength(t * len);
            const svgRect = svg.getBoundingClientRect();
            const rootRect = root.getBoundingClientRect();
            const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : { x: 0, y: 0, width: svgRect.width, height: svgRect.height };
            const px = svgRect.left + (point.x - vb.x) * (svgRect.width / vb.width);
            const py = svgRect.top + (point.y - vb.y) * (svgRect.height / vb.height);

            // If Motion Path API / offset-path supported, use it for smoother native motion
            const supportsOffsetPath = CSS && typeof CSS.supports === 'function' && (CSS.supports('offset-path', `path('${path.getAttribute('d') || ''}')`) || CSS.supports('motion-path', `path('${path.getAttribute('d') || ''}')`));
            if (supportsOffsetPath) {
                try {
                    // set the path for offset-path
                    highlight.style.offsetPath = `path('${path.getAttribute('d')}')`;
                    // offset-distance in percent
                    highlight.style.offsetDistance = (t * 100) + '%';
                    return;
                } catch (e) { /* fall back */ }
            }

            // Fallback: position by left/top relative to root
            highlight.style.left = Math.round(px - rootRect.left) + 'px';
            highlight.style.top = Math.round(py - rootRect.top) + 'px';
        }

        // Build or adopt buttons for each milestone. If DOM already contains milestone buttons
        // inside a `.roadmap-milestones` container, use them; otherwise create controls.
        const existingContainer = root.querySelector('.roadmap-milestones');
        let buttons = [];
        if (existingContainer && existingContainer.querySelectorAll('.roadmap-milestone').length) {
            buttons = Array.from(existingContainer.querySelectorAll('.roadmap-milestone'));
            // ensure styles/classes and ids
            buttons.forEach((b, idx) => {
                b.classList.add('milestone-button');
                // if an id is missing but a data-element-id exists, use it; otherwise create a stable id
                if (!b.id) {
                    const did = b.getAttribute('data-element-id');
                    if (did) b.id = did;
                    else b.id = `milestone-${idx + 1}`;
                }
            });
        } else {
            // Build buttons for each milestone element
            milestones.forEach((m, i) => {
                const title = m.getAttribute('data-milestone') || m.textContent.trim() || `Milestone ${i + 1}`;
                const controlsId = `milestone-popover-${i + 1}`;
                const id = `milestone-${i + 1}`;
                const btn = createButton(title, controlsId, id);
                btn.classList.add('milestone-button');
                btn.addEventListener('click', () => { active = i; openMilestone(i); });
                controls.appendChild(btn);
                buttons.push(btn);
            });
        }

        // Position buttons along the SVG path
        function positionButtons() {
            if (!svg || !svgPaths.length || !buttons.length) return;
            const path = svgPaths[0];
            let len = 0;
            try { len = path.getTotalLength(); } catch (e) { return; }
            const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : { x: 0, y: 0, width: svg.clientWidth, height: svg.clientHeight };
            const svgRect = svg.getBoundingClientRect();
            const rootRect = root.getBoundingClientRect();
            const n = buttons.length;
            buttons.forEach((btn, i) => {
                const t = n === 1 ? 0.5 : (i / (n - 1));
                const point = path.getPointAtLength(t * len);
                const px = svgRect.left + (point.x - vb.x) * (svgRect.width / vb.width);
                const py = svgRect.top + (point.y - vb.y) * (svgRect.height / vb.height);
                // position relative to root
                btn.style.position = 'absolute';
                // ensure button has layout
                const bw = btn.offsetWidth || 44;
                const bh = btn.offsetHeight || 44;
                btn.style.left = Math.round(px - rootRect.left - bw / 2) + 'px';
                btn.style.top = Math.round(py - rootRect.top - bh / 2) + 'px';
            });
        }

        // reposition on load/resize/scroll
        requestAnimationFrame(positionButtons);
        window.addEventListener('resize', () => requestAnimationFrame(positionButtons));
        window.addEventListener('scroll', () => requestAnimationFrame(positionButtons));

        // Keyboard navigation and actions
        root.addEventListener('keydown', (ev) => {
            const key = ev.key;
            if (key === 'ArrowRight') {
                ev.preventDefault();
                active = Math.min(active + 1, controls.children.length - 1);
                focusButton(active);
            } else if (key === 'ArrowLeft') {
                ev.preventDefault();
                active = Math.max(active - 1, 0);
                focusButton(active);
            } else if (key === 'Enter' || key === ' ') {
                ev.preventDefault();
                openMilestone(active);
            } else if (key === 'Escape') {
                ev.preventDefault();
                closePopover();
            }
        });

        // Click outside to close popover
        document.addEventListener('click', (e) => {
            if (!currentPopover) return;
            if (!currentPopover.contains(e.target) && !controls.contains(e.target)) closePopover();
        });
    }

    // expose function
    window.initRoadmap = initRoadmap;

    // Auto-init if a roadmap exists on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        const el = document.querySelector('[data-roadmap]');
        if (el) initRoadmap(el);
    });

})();

// --- Connector drawing & reduced-motion support (kept modular) ---
(function () {
    function prefersReducedMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

    function drawConnectorsFor(root) {
        if (!root) return;
        const svg = root.querySelector('svg.connectors') || root.querySelector('svg');
        if (!svg) return;
        // clear previous connectors
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        const overlay = root.querySelector('.overlay') || root;
        const milestones = Array.from(overlay.querySelectorAll('.milestone'));
        if (!milestones.length) return;

        function makeLine(id, x1, y1, x2, y2, color = '#0361bf') {
            let line = document.getElementById(id);
            if (!line) {
                line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('id', id);
                line.setAttribute('class', 'connector-line');
                line.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(line);
            }
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-opacity', '1');
        }

        function makeTip(id, cx, cy, r = 5, color = '#0361bf') {
            const tipId = id + '-tip';
            let circ = document.getElementById(tipId);
            if (!circ) {
                circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circ.setAttribute('id', tipId);
                circ.setAttribute('class', 'connector-tip');
                svg.appendChild(circ);
            }
            circ.setAttribute('cx', cx);
            circ.setAttribute('cy', cy);
            circ.setAttribute('r', String(r));
            circ.setAttribute('fill', color);
            circ.setAttribute('fill-opacity', '1');
        }

        const stageRect = root.getBoundingClientRect();
        milestones.forEach(m => {
            try {
                const id = m.dataset.nodeId || m.id || ('node-' + Math.random().toString(36).slice(2, 8));
                const rect = m.getBoundingClientRect();
                const x2 = rect.left + rect.width / 2 - stageRect.left;
                const y2 = rect.top + rect.height / 2 - stageRect.top;
                // anchor point on left side (10% of stage width)
                const x1 = Math.round(stageRect.width * 0.08);
                const y1 = Math.round(y2);
                makeLine('connector-' + id, x1, y1, x2, y2);
                makeTip('connector-' + id, x2, y2, 5);
            } catch (e) { /* ignore per-node failures */ }
        });
    }

    // Auto-update connectors on resize and DOM changes for roadmap stages
    function watchRoot(root) {
        if (!root) return;
        const observer = new ResizeObserver(() => drawConnectorsFor(root));
        observer.observe(root);
        window.addEventListener('resize', () => drawConnectorsFor(root));
        // initial draw
        requestAnimationFrame(() => drawConnectorsFor(root));
    }

    // Place milestone elements by their data-x / data-y percent attributes
    function placeMilestonesInStage(stage) {
        if (!stage) return;
        const overlay = stage.querySelector('.overlay') || stage;
        const milestones = Array.from(overlay.querySelectorAll('.milestone'));
        // Find the displayed SVG/image area to map percent coords to pixels
        const img = stage.querySelector('.roadmap-img');
        const imgRect = img ? img.getBoundingClientRect() : null;
        const stageRect = stage.getBoundingClientRect();

        milestones.forEach(m => {
            try {
                const x = parseFloat(m.dataset.x);
                const y = parseFloat(m.dataset.y);

                if (imgRect) {
                    // Position relative to the visible image area so coords match the SVG
                    const px = imgRect.left - stageRect.left + (x / 100) * imgRect.width;
                    const py = imgRect.top - stageRect.top + (y / 100) * imgRect.height;
                    m.style.left = Math.round(px) + 'px';
                    m.style.top = Math.round(py) + 'px';

                    // Scale milestone max-width relative to image width for consistent sizing
                    const base = Math.max(1, imgRect.width);
                    const mw = Math.max(80, Math.round(base * 0.12));
                    m.style.maxWidth = mw + 'px';
                } else {
                    // Fallback: set as percentage of the overlay/stage
                    if (!Number.isNaN(x)) m.style.left = x + '%';
                    if (!Number.isNaN(y)) m.style.top = y + '%';
                }
            } catch (e) { /* ignore */ }
        });
    }

    function placeAll() {
        const stages = Array.from(document.querySelectorAll('.stage, .roadmap-stage'));
        stages.forEach(s => placeMilestonesInStage(s));
    }

    // Auto-init for any `.stage` or `.roadmap-stage` present on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        // place milestones first so connectors compute from actual positions
        placeAll();
        const roots = Array.from(document.querySelectorAll('.roadmap-stage, .stage'));
        roots.forEach(r => watchRoot(r));
        // keep placement in sync with resize
        window.addEventListener('resize', () => { requestAnimationFrame(placeAll); });
    });
})();

// Slide zoom-in/out transitions focused on milestone coordinates
(function () {
    'use strict';

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function setupZoomForSlide(slide) {
        const stage = slide.querySelector('.stage');
        if (!stage) return null;
        const nodeId = slide.getAttribute('data-node-id') || '';
        let focus = null;
        if (nodeId && nodeId.startsWith('milestone-')) {
            focus = stage.querySelector(`.milestone[data-node-id="${nodeId}"]`);
        }
        if (!focus) focus = stage.querySelector('.milestone.active') || stage.querySelector('.milestone[data-slide]') || stage.querySelector('.milestone');
        if (!focus) return null;
        const x = parseFloat(focus.dataset.x);
        const y = parseFloat(focus.dataset.y);
        if (Number.isNaN(x) || Number.isNaN(y)) return null;
        const zoom = 1.6;
        // translate percentages to keep the focused point centered-ish
        const tx = 50 - x;
        const ty = 50 - y;
        return {
            apply() {
                stage.style.transformOrigin = `${x}% ${y}%`;
                stage.style.transform = `translate(${tx}%, ${ty}%) scale(${zoom})`;
            },
            reset() {
                stage.style.transform = '';
            }
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (prefersReducedMotion()) return;
        const slides = Array.from(document.querySelectorAll('.slide-container'));
        if (!slides.length) return;
        const activeMap = new Map();
        const io = new IntersectionObserver((entries) => {
            entries.forEach(ent => {
                const slide = ent.target;
                if (ent.isIntersecting && ent.intersectionRatio > 0.45) {
                    if (!activeMap.has(slide)) {
                        const z = setupZoomForSlide(slide);
                        if (z) { z.apply(); activeMap.set(slide, z); }
                    }
                } else {
                    if (activeMap.has(slide)) {
                        const z = activeMap.get(slide);
                        z.reset();
                        activeMap.delete(slide);
                    }
                }
            });
        }, { threshold: [0.4, 0.6] });
        slides.forEach(s => io.observe(s));
    });
})();

// --- Debug helpers: log milestone placement and connector counts, and show overlay ---
(function () {
    'use strict';
    const DEBUG = false;

    function debugRoadmapRoots() {
        const roots = Array.from(document.querySelectorAll('.stage, .roadmap-stage'));
        roots.forEach((root, idx) => {
            const overlay = root.querySelector('.overlay') || root;
            const milestones = Array.from(overlay.querySelectorAll('.milestone'));
            console.group(`Roadmap debug root ${idx}`);
            console.log('milestones count:', milestones.length);
            milestones.forEach((m, i) => {
                const rect = m.getBoundingClientRect();
                console.log(i, (m.dataset.nodeId || m.getAttribute('data-node-id') || m.id || ''), 'data-x', m.dataset.x, 'data-y', m.dataset.y, 'pos', Math.round(rect.left), Math.round(rect.top), 'size', Math.round(rect.width), Math.round(rect.height));
            });
            const svg = root.querySelector('svg.connectors') || root.querySelector('svg');
            const connectorCount = svg ? svg.querySelectorAll('.connector-line, .connector-tip').length : 0;
            console.log('connector elements:', connectorCount);
            console.groupEnd();
        });
    }

    function updateDebugOverlay() {
        const roots = Array.from(document.querySelectorAll('.stage, .roadmap-stage'));
        let body = '';
        roots.forEach((root, i) => {
            const overlay = root.querySelector('.overlay') || root;
            const ms = Array.from(overlay.querySelectorAll('.milestone'));
            const svg = root.querySelector('svg.connectors') || root.querySelector('svg');
            const conn = svg ? svg.querySelectorAll('.connector-line, .connector-tip').length : 0;
            body += `<div style="margin-bottom:6px"><strong>root ${i}</strong>: milestones=${ms.length} connectors=${conn}</div>`;
        });
        const el = document.getElementById('roadmap-debug-body');
        if (el) el.innerHTML = body || 'no roadmap roots found';
    }

    function createDebugOverlay() {
        if (!DEBUG) return;
        if (document.getElementById('roadmap-debug-overlay')) return;
        const dbg = document.createElement('div');
        dbg.id = 'roadmap-debug-overlay';
        dbg.style.position = 'fixed';
        dbg.style.right = '12px';
        dbg.style.bottom = '12px';
        dbg.style.zIndex = '99999';
        dbg.style.background = 'rgba(0,0,0,0.7)';
        dbg.style.color = '#fff';
        dbg.style.fontSize = '13px';
        dbg.style.padding = '8px';
        dbg.style.borderRadius = '6px';
        dbg.style.maxWidth = '320px';
        dbg.innerHTML = '<div style="font-weight:600;margin-bottom:6px">Roadmap debug</div><div id="roadmap-debug-body">loading…</div><button id="roadmap-debug-refresh" style="margin-top:6px">Refresh</button>';
        document.body.appendChild(dbg);
        document.getElementById('roadmap-debug-refresh').addEventListener('click', () => { updateDebugOverlay(); debugRoadmapRoots(); });
        updateDebugOverlay();
    }

    document.addEventListener('DOMContentLoaded', () => {
        try {
            if (DEBUG) {
                debugRoadmapRoots();
                createDebugOverlay();
            }
        } catch (e) { console.warn('roadmap debug failed', e); }
    });

    // expose helpers for manual invocation from console
    window.debugRoadmapRoots = debugRoadmapRoots;
    window.updateRoadmapDebug = updateDebugOverlay;
})();
