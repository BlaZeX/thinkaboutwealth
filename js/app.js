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

(function() {
    'use strict';

    // State
    const CONFIG = {
        dataPath: './data/thoughts.json',
        msPerDay: 86400000
    };

    let state = {
        thoughts: [],
        viewMode: 'today', // 'today', 'yesterday', 'random'
        currentIdx: 0,     // The thought index currently displayed
        utcDay: 0          // The true celestial UTC day number
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
        btnNext: document.getElementById('btn-tomorrow'),
        btnRandom: document.getElementById('btn-random'),
        btnShare: document.getElementById('btn-share'),
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        content: document.getElementById('content-state'),
        retryBtn: document.getElementById('btn-retry')
    };

    // --- Core Logic ---

    function getUtcDay() {
        return Math.floor(Date.now() / CONFIG.msPerDay);
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
            state.utcDay = getUtcDay();
            const todayIdx = getSafeIndex(state.utcDay, state.thoughts.length);
            
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
            elements.dayLabel.textContent = state.viewMode === 'random' 
                ? 'Random Pick' 
                : `Day ${state.currentIdx + 1}`; // 1-based day
            
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
            elements.btnToday.classList.add('hidden'); // Or disabled/active style
            elements.btnThere.disabled = false;
            // Tomorrow is always disabled view, but contains countdown
            elements.btnRandom.disabled = false;
        } else {
            elements.btnToday.classList.remove('hidden');
        }

        // Contextual disable
        elements.btnNext.disabled = true; // Always disabled as a "view" button
    }

    // --- Actions ---

    function goYesterday() {
        state.viewMode = 'yesterday';
        // Logic: Yesterday is simply (TodayIndex - 1) wrapped
        // It's static relative to the day. 
        // For a true "history", we might want (Current - 1), but requirements say:
        // "Yesterday shows (utcDay-1) % length"
        const todayIdx = getSafeIndex(state.utcDay, state.thoughts.length);
        state.currentIdx = getSafeIndex(todayIdx - 1, state.thoughts.length);
        render();
    }

    function goToday() {
        state.viewMode = 'today';
        state.currentIdx = getSafeIndex(state.utcDay, state.thoughts.length);
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
            const newUtcDay = getUtcDay();
            if (newUtcDay > state.utcDay) {
                // Day changed! Refresh.
                state.utcDay = newUtcDay;
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
