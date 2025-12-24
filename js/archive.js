/**
 * ThinkAboutWealth.com - Archive Logic
 */

(function () {
    'use strict';

    const CONFIG = {
        dataPath: './data/thoughts.json'
    };

    let thoughts = [];

    const elements = {
        grid: document.getElementById('archive-grid'),
        searchInput: document.getElementById('search-input'),
        tagContainer: document.getElementById('tag-filters'),
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        count: document.getElementById('archive-count')
    };

    let activeTag = null;

    async function init() {
        try {
            const res = await fetch(CONFIG.dataPath);
            if (!res.ok) throw new Error('Fetch error');
            thoughts = await res.json();

            renderTags();
            filterAndRender();

            elements.loading.classList.add('hidden');
        } catch (err) {
            console.error(err);
            elements.loading.classList.add('hidden');
            elements.error.classList.remove('hidden');
        }
    }

    function renderTags() {
        // Collect all unique tags
        const allTags = new Set();
        thoughts.forEach(t => {
            if (t.tags && Array.isArray(t.tags)) {
                t.tags.forEach(tag => allTags.add(tag));
            }
        });

        const sortedTags = Array.from(allTags).sort();

        // Add "All" default
        // Clear container
        elements.tagContainer.innerHTML = '';

        const createChip = (label, value) => {
            const btn = document.createElement('button');
            btn.className = 'tag-chip';
            if (value === activeTag) btn.classList.add('active');
            btn.textContent = label;
            btn.onclick = () => {
                // Toggle
                if (activeTag === value) activeTag = null;
                else activeTag = value;

                updateTagVisuals();
                filterAndRender();
            };
            return btn;
        };

        elements.tagContainer.appendChild(createChip('All', null));
        sortedTags.forEach(tag => {
            elements.tagContainer.appendChild(createChip(`#${tag}`, tag));
        });
    }

    function updateTagVisuals() {
        const chips = elements.tagContainer.querySelectorAll('.tag-chip');
        chips.forEach(chip => {
            const val = chip.textContent === 'All' ? null : chip.textContent.replace('#', '');
            if (val === activeTag) chip.classList.add('active');
            else chip.classList.remove('active');

            // Special case for 'All' visual state when activeTag is null
            if (activeTag === null && chip.textContent === 'All') chip.classList.add('active');
        });
    }

    function filterAndRender() {
        const query = elements.searchInput.value.toLowerCase().trim();

        const filtered = thoughts.filter(t => {
            // Text search
            const textMatch = t.text.toLowerCase().includes(query) ||
                t.reflection.toLowerCase().includes(query);

            // Tag filter
            const tagMatch = activeTag ? (t.tags && t.tags.includes(activeTag)) : true;

            return textMatch && tagMatch;
        });

        renderGrid(filtered);
    }

    function renderGrid(items) {
        elements.grid.innerHTML = '';
        elements.count.textContent = `${items.length} thoughts found`;

        items.forEach(item => {
            const card = document.createElement('article');
            card.className = 'archive-card';
            card.innerHTML = `
                <div class="archive-header">
                    <span class="day-num">Day ${item.id}</span>
                    <div class="tags">
                        ${(item.tags || []).slice(0, 2).map(t => `<span class="mini-tag">#${t}</span>`).join('')}
                    </div>
                </div>
                <p class="archive-text">${item.text}</p>
                <p class="archive-reflection">${item.reflection}</p>
            `;
            elements.grid.appendChild(card);
        });

        if (items.length === 0) {
            elements.grid.innerHTML = '<div class="empty-state">No thoughts found.</div>';
        }
    }

    // Event Listeners
    elements.searchInput.addEventListener('input', () => {
        filterAndRender();
    });

    init();

})();
