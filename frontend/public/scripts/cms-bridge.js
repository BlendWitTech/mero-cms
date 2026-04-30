/**
 * Mero CMS - Static Bridge v1.0
 * Link your hand-coded designs to CMS content seamlessly.
 */

class CMSBridge {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'http://127.0.0.1:3001';
        this.debug = options.debug || false;
        this.init();
    }

    async init() {
        if (this.debug) console.log('CMS Bridge initialized.');
        await this.syncAll();
    }

    async syncAll() {
        const containers = document.querySelectorAll('[data-cms-singleton]');
        for (const container of containers) {
            const slug = container.getAttribute('data-cms-singleton');
            await this.syncSingleton(slug, container);
        }
    }

    async syncSingleton(slug, container) {
        try {
            const response = await fetch(`${this.apiUrl}/content-items/slug/${slug}`);
            const items = await response.json();

            // Singletons should only have one item
            if (items && items.length > 0) {
                const data = items[0].data;
                this.populateContainer(container, data);
            }
        } catch (error) {
            console.error(`CMS Bridge Error [${slug}]:`, error);
        }
    }

    populateContainer(container, data) {
        const fields = container.querySelectorAll('[data-cms-field]');
        fields.forEach(el => {
            const fieldKey = el.getAttribute('data-cms-field');
            const value = data[fieldKey];

            if (value !== undefined && value !== null) {
                this.applyContent(el, value);
            }
        });
    }

    applyContent(el, value) {
        const tag = el.tagName.toLowerCase();

        // Handle Images
        if (tag === 'img') {
            el.src = value;
            return;
        }

        // Handle Videos
        if (tag === 'video' || tag === 'source') {
            el.src = value;
            if (tag === 'video') el.load();
            return;
        }

        // Handle Anchors
        if (tag === 'a') {
            // If it's a CMS URL field, update href
            if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
                el.href = value;
            } else {
                el.innerHTML = value;
            }
            return;
        }

        // Handle Background Images
        if (el.hasAttribute('data-cms-bg')) {
            el.style.backgroundImage = `url(${value})`;
            return;
        }

        // Default: InnerHTML
        el.innerHTML = value;
    }
}

// Auto-init if global config exists
window.addEventListener('DOMContentLoaded', () => {
    if (window.CMS_CONFIG) {
        window.cms = new CMSBridge(window.CMS_CONFIG);
    }
});
