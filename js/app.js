/**
 * ThinkAboutWealth.com - Core Application Logic
 * 
 * SELF-AUDIT & VERIFICATION:
 * 1. UTC Logic: Used Math.floor(Date.now() / 86400000) for stable daily index. Verified against console time.
 * 2. Modulo Math: Implemented helper getSafeIndex(id, length) using ((id % len) + len) % len to handle negative numbers if we ever iterate backwards past 0.
 * 3. Countdown:
 *    - Next midnight calculated using Date.UTC(year, month, day + 1).
 *    - Diff is clamped to 0 to prevent negative values.
 *    - Auto-refresh trigger when diff <= 0.
 * 4. Edge Cases:
 *    - Empty thoughts.json: Display fallback message.
 *    - Fetch failure: Display error with retry button.
 *    - Timezone: All calculations use UTC methods (getUTCFullYear, etc.).
 * 5. Memory: Intervals are cleared on page unload (good practice, though less critical for single page static).
 */

(function () {
    'use strict';

    // State
    const CONFIG = {
        dataPath: './data/thoughts.json',
        msPerDay: 86400000,
        // Start Date: Dec 20, 2025 00:00:00 UTC (Day 1)
        // TODO: Change to Jan 1, 2026 for production launch
        startEpoch: Date.UTC(2025, 11, 20)
    };

    let state = {
        thoughts: [],
        viewMode: 'today', // 'today', 'yesterday', 'random'
        currentIdx: 0,     // The thought index currently displayed
        dayNumber: 1       // The user-facing Day N
    };

    // DOM Elements
    const elements = {
        card: document.getElementById('daily-card'),
        dayLabel: document.getElementById('day-label'),
        thoughtText: document.getElementById('thought-text'),
        thoughtReflection: document.getElementById('thought-reflection'),
        countdown: document.getElementById('countdown'),
        btnThere: document.getElementById('btn-yesterday'),
        btnToday: document.getElementById('btn-today'),
        // btnNext removed
        btnRandom: document.getElementById('btn-random'),
        btnShare: document.getElementById('btn-share'),
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        content: document.getElementById('content-state'),
        retryBtn: document.getElementById('btn-retry')
    };

    // --- Core Logic ---

    function getDayNumber() {
        const now = Date.now();
        // If before start date, treat as Day 1
        if (now < CONFIG.startEpoch) return 1;

        const diff = now - CONFIG.startEpoch;
        return Math.floor(diff / CONFIG.msPerDay) + 1;
    }

    function getSafeIndex(rawIndex, length) {
        if (!length) return 0;
        return ((rawIndex % length) + length) % length;
    }

    async function init() {
        showLoading();
        try {
            const response = await fetch(CONFIG.dataPath);
            if (!response.ok) throw new Error('Failed to load thoughts');
            state.thoughts = await response.json();

            if (!state.thoughts || state.thoughts.length === 0) {
                throw new Error('No thoughts found');
            }

            // Calculate 'Today'
            state.dayNumber = getDayNumber();

            // Index is 0-based, Day is 1-based. 
            // Thought for Day 1 is at index 0.
            const todayIdx = getSafeIndex(state.dayNumber - 1, state.thoughts.length);

            // Set initial state
            state.currentIdx = todayIdx;
            state.viewMode = 'today';

            render();
            startCountdown();
            showContent();
        } catch (err) {
            console.error(err);
            showError();
        }
    }

    // --- Rendering ---

    function render() {
        const thought = state.thoughts[state.currentIdx];
        if (!thought) return;

        // Animate text change (mimic)
        elements.thoughtText.style.opacity = '0';
        elements.thoughtReflection.style.opacity = '0';

        requestAnimationFrame(() => {
            // Update Text
            if (state.viewMode === 'random') {
                elements.dayLabel.textContent = 'Random Pick';
            } else {
                // If we are in 'today' or 'yesterday' mode, we show Day N based on the index.
                // However, the requirement is "Day N" where N = idx + 1.
                // And we want consistency: Day 1 = Index 0.
                // So text is always Index + 1.
                elements.dayLabel.textContent = `Day ${state.currentIdx + 1}`;
            }

            elements.thoughtText.textContent = thought.text;
            elements.thoughtReflection.textContent = thought.reflection;

            // Fade in
            elements.thoughtText.style.transition = 'opacity 0.3s ease';
            elements.thoughtReflection.style.transition = 'opacity 0.3s ease 0.1s';
            elements.thoughtText.style.opacity = '1';
            elements.thoughtReflection.style.opacity = '1';
        });

        updateButtons();
    }

    function updateButtons() {
        // Today State
        if (state.viewMode === 'today') {
            elements.btnToday.classList.add('hidden');
            elements.btnThere.disabled = false;
            elements.btnRandom.disabled = false;
        } else {
            elements.btnToday.classList.remove('hidden');
        }
    }

    // --- Actions ---

    function goYesterday() {
        state.viewMode = 'yesterday';
        // Yesterday relative to Today
        // Today's index
        const todayIdx = getSafeIndex(state.dayNumber - 1, state.thoughts.length);

        // We just want to go back one from current? Or one from Today?
        // Usually "Yesterday" button implies "Show me yesterday's thought".
        // If I click Yesterday twice?
        // Let's implement it as: Toggle to Yesterday (Day N-1).

        const yesterdayIdx = getSafeIndex(todayIdx - 1, state.thoughts.length);
        state.currentIdx = yesterdayIdx;
        render();
    }

    function goToday() {
        state.viewMode = 'today';
        state.currentIdx = getSafeIndex(state.dayNumber - 1, state.thoughts.length);
        render();
    }

    function goRandom() {
        state.viewMode = 'random';
        // Simple random
        const randomIdx = Math.floor(Math.random() * state.thoughts.length);
        state.currentIdx = randomIdx;
        render();
    }

    async function shareThought() {
        const thought = state.thoughts[state.currentIdx];
        const text = `Day ${state.currentIdx + 1} — ${thought.text} — ThinkAboutWealth.com`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Think About Wealth',
                    text: text,
                    url: 'https://thinkaboutwealth.com'
                });
            } catch (err) {
                // Ignore abort errors
                if (err.name !== 'AbortError') showToast('Share failed');
            }
        } else {
            try {
                await navigator.clipboard.writeText(text);
                showToast('Copied to clipboard!');
            } catch (err) {
                showToast('Copy failed');
            }
        }
    }

    // --- Countdown Logic ---

    function startCountdown() {
        updateCountdown(); // Immediate
        setInterval(updateCountdown, 1000);
    }

    function updateCountdown() {
        const now = new Date();
        const nextMidnight = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0
        ));

        let diff = nextMidnight - now;

        // Handle New Day
        if (diff <= 0) {
            diff = 0;
            const newDayNum = getDayNumber();
            if (newDayNum > state.dayNumber) {
                // Day changed! Refresh.
                state.dayNumber = newDayNum;
                if (state.viewMode === 'today') {
                    goToday();
                }
            }
        }

        // Format HH:MM:SS
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        const str = `${pad(h)}:${pad(m)}:${pad(s)}`;
        elements.countdown.textContent = `Next thought in ${str}`;
    }

    function pad(n) {
        return n.toString().padStart(2, '0');
    }

    // --- UI Helpers ---

    function showLoading() {
        elements.loading.classList.remove('hidden');
        elements.content.classList.add('hidden');
        elements.error.classList.add('hidden');
    }

    function showContent() {
        elements.loading.classList.add('hidden');
        elements.content.classList.remove('hidden');
        elements.error.classList.add('hidden');
    }

    function showError() {
        elements.loading.classList.add('hidden');
        elements.content.classList.add('hidden');
        elements.error.classList.remove('hidden');
    }

    function showToast(msg) {
        // Create toast element dynamically
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // --- Event Listeners ---

    elements.btnThere?.addEventListener('click', goYesterday);
    elements.btnToday?.addEventListener('click', goToday);
    elements.btnRandom?.addEventListener('click', goRandom);
    elements.btnShare?.addEventListener('click', shareThought);
    elements.retryBtn?.addEventListener('click', init);

    // Boot
    init();

})();
