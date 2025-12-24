/**
 * Theme Management
 */
(function () {
    const STORAGE_KEY = 'taw-theme';

    function getTheme() {
        return localStorage.getItem(STORAGE_KEY) || 'system';
    }

    function setTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme);
        updateSelector(theme);
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', isDark ? 'dark' : 'light');
            // Remove override if system
            root.removeAttribute('data-theme-override');
        } else {
            root.setAttribute('data-theme-override', theme);
        }
    }

    function updateSelector(theme) {
        // Toggle active class on buttons
        document.querySelectorAll('.theme-opt').forEach(btn => {
            if (btn.dataset.theme === theme) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    // Init
    const savedTheme = getTheme();
    applyTheme(savedTheme);

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (getTheme() === 'system') applyTheme('system');
    });

    // Wire up buttons
    window.addEventListener('DOMContentLoaded', () => {
        updateSelector(savedTheme);

        document.querySelectorAll('.theme-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                setTheme(theme);
            });
        });
    });

    // Expose for debugging if needed
    window.setAppTheme = setTheme;

})();
