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
        const select = document.getElementById('theme-select');
        if (select) select.value = theme;
    }

    // Init
    const savedTheme = getTheme();
    applyTheme(savedTheme);

    // Listen for system changes if system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (getTheme() === 'system') {
            applyTheme('system');
        }
    });

    // Wait for DOM to wire up selector
    window.addEventListener('DOMContentLoaded', () => {
        const select = document.getElementById('theme-select');
        if (select) {
            select.value = savedTheme;
            select.addEventListener('change', (e) => {
                setTheme(e.target.value);
            });
        }
    });

    // Expose for debugging if needed
    window.setAppTheme = setTheme;

})();
