(function () {
    // Simple presenter helper: tries to open a presenter window, falls back to fullscreen overlay
    const Presenter = {
        wnd: null,
        overlay: null,
        timer: null,
        openWindow() {
            try {
                // Resolve URL relative to current origin so it works whether served from root or nested
                const url = new URL('/phd_confirmation_slides/presenter.html', window.location.origin).toString();
                this.wnd = window.open(url, 'presenter_window', 'width=900,height=700');
                if (!this.wnd) return false;
                // When the window loads it'll send an 'ready' message; we also send initial state in a small delay
                setTimeout(() => this.sendState(), 300);
                return true;
            } catch (e) {
                console.warn('[presenter] openWindow failed', e);
                return false;
            }
        },
        closeWindow() {
            if (this.wnd && !this.wnd.closed) this.wnd.close();
            this.wnd = null;
        },
        sendState() {
            const slides = getSlidesData();
            const idx = getCurrentIndex();
            const payload = { type: 'state', slides, index: idx };
            if (this.wnd && !this.wnd.closed) this.wnd.postMessage(payload, '*');
            if (this.overlay) this.renderOverlay(payload);
        },
        sendUpdate(index) {
            const slides = getSlidesData();
            const payload = { type: 'update', slides, index };
            if (this.wnd && !this.wnd.closed) this.wnd.postMessage(payload, '*');
            if (this.overlay) this.renderOverlay(payload);
        },
        toggle() {
            if (this.wnd && !this.wnd.closed) {
                this.closeWindow();
                this.exitOverlay();
                return;
            }
            // Try popup first
            const ok = this.openWindow();
            if (!ok) {
                this.enterOverlay();
            }
        },
        enterOverlay() {
            if (this.overlay) return;
            this.overlay = document.createElement('div');
            this.overlay.id = 'presenter-overlay';
            this.overlay.innerHTML = `
        <div class="pane">
          <div class="controls"><button id="pr-prev">Prev</button><button id="pr-next">Next</button><button id="pr-close">Close</button></div>
          <div class="preview"><div id="pr-current-title" class="presenter-title"></div><div id="pr-current-notes" class="notes"></div></div>
        </div>
        <div class="pane"><div class="preview"><div id="pr-next-title" class="presenter-title"></div><div id="pr-next-notes" class="notes"></div></div></div>
      `;
            document.body.appendChild(this.overlay);
            document.getElementById('pr-next').addEventListener('click', () => Reveal.next());
            document.getElementById('pr-prev').addEventListener('click', () => Reveal.prev());
            document.getElementById('pr-close').addEventListener('click', () => this.exitOverlay());
            this.sendState();
        },
        exitOverlay() {
            if (!this.overlay) return;
            this.overlay.remove();
            this.overlay = null;
        },
        renderOverlay(payload) {
            const { slides, index } = payload;
            const cur = slides[index] || { title: '', notes: '' };
            const next = slides[index + 1] || { title: '', notes: '' };
            const elTitle = document.getElementById('pr-current-title');
            const elNotes = document.getElementById('pr-current-notes');
            const elNextTitle = document.getElementById('pr-next-title');
            const elNextNotes = document.getElementById('pr-next-notes');
            if (elTitle) elTitle.textContent = cur.title || '';
            if (elNotes) elNotes.innerHTML = cur.notes || '';
            if (elNextTitle) elNextTitle.textContent = next.title || '';
            if (elNextNotes) elNextNotes.innerHTML = next.notes || '';
        }
    };

    function getSlidesData() {
        const els = Array.from(document.querySelectorAll('.slides>section'));
        return els.map((el, i) => {
            const title = (el.querySelector('h1,h2,h3') || { textContent: `Slide ${i + 1}` }).textContent.trim();
            const noteEl = el.querySelector('aside.notes') || el.querySelector('.notes') || null;
            const notes = noteEl ? noteEl.innerHTML : '';
            // keep lightweight slide snippet (could send thumbnails later)
            return { index: i, title, notes };
        });
    }

    function getCurrentIndex() {
        try {
            if (window.Reveal && typeof Reveal.getIndices === 'function') {
                const ind = Reveal.getIndices();
                return (ind && typeof ind.h === 'number') ? ind.h : 0;
            }
        } catch (e) { }
        const present = document.querySelector('.slides>section.present');
        const els = Array.from(document.querySelectorAll('.slides>section'));
        return present ? els.indexOf(present) : 0;
    }

    // Listen for presenter -> audience commands
    window.addEventListener('message', (ev) => {
        const data = ev.data || {};
        if (data && data.type === 'nav') {
            if (typeof data.index === 'number') Reveal.slide(data.index);
        }
        if (data && data.type === 'control') {
            if (data.action === 'next') Reveal.next();
            if (data.action === 'prev') Reveal.prev();
            if (data.action === 'close') {
                if (Presenter.wnd && !Presenter.wnd.closed) Presenter.wnd.close();
                Presenter.exitOverlay();
            }
        }
    }, false);

    // Sync Reveal -> presenter
    function attachRevealListeners() {
        if (window.Reveal && typeof Reveal.on === 'function') {
            Reveal.on('slidechanged', (e) => {
                Presenter.sendUpdate(getCurrentIndex());
            });
            // also send initial state after ready
            Reveal.on('ready', () => Presenter.sendState());
        } else {
            // fallback: observe classes
            const observer = new MutationObserver(() => Presenter.sendUpdate(getCurrentIndex()));
            const slidesContainer = document.querySelector('.slides');
            if (slidesContainer) observer.observe(slidesContainer, { attributes: true, subtree: true, attributeFilter: ['class'] });
        }
    }

    // Keyboard shortcut: P to toggle presenter
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'p' || ev.key === 'P') {
            Presenter.toggle();
        }
    });

    // Expose for inline button
    window.Presenter = Presenter;

    // attempt to attach listeners on load
    setTimeout(attachRevealListeners, 200);
})();

(function () {
    // changelog: rationale: add accessible toggle+reveal behavior for Slide 4; source: presentation_inline.html (Slide 4 markup)
    try {
        const btn = document.getElementById('btn_show_foundation_examples');
        const box = document.getElementById('box_found_examples');
        if (!btn || !box) return;

        const live = document.getElementById('slide4-live');

        // ensure sensible initial aria/display state
        if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
        if (!box.hasAttribute('aria-hidden')) box.setAttribute('aria-hidden', 'true');
        box.style.display = box.getAttribute('aria-hidden') === 'true' ? 'none' : '';

        function reveal() {
            btn.setAttribute('aria-expanded', 'true');
            box.setAttribute('aria-hidden', 'false');
            box.style.display = '';

            const firstCard = box.querySelector('.foundation-card');
            if (firstCard) {
                // make focusable if not naturally focusable, then focus
                if (!firstCard.hasAttribute('tabindex')) firstCard.setAttribute('tabindex', '-1');
                try { firstCard.focus({ preventScroll: true }); } catch (e) { firstCard.focus(); }
            }

            if (live) live.textContent = 'Foundation examples revealed.';
        }

        function conceal() {
            btn.setAttribute('aria-expanded', 'false');
            box.setAttribute('aria-hidden', 'true');
            box.style.display = 'none';
            if (live) live.textContent = 'Foundation examples hidden.';
            try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); }
        }

        function toggle() {
            if (box.getAttribute('aria-hidden') === 'true') reveal(); else conceal();
        }

        btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            toggle();
        }, { passive: false });

        btn.addEventListener('keydown', (ev) => {
            const key = ev.key;
            if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Space') {
                ev.preventDefault();
                toggle();
            }
        });
    } catch (err) {
        // Defensive: never throw from this script
        console.warn('[presenter] slide4 toggle handler failed', err);
    }
})();
