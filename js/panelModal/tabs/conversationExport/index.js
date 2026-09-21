/**
 * Conversation Export Tab - 对话导出Settings
 *
 * 第一版只提供全局Toggle。导出入口和具体流程由 timeline/export 模块处理。
 */

function conversationExportTabI18n(key, fallback = '', substitutions) {
    try {
        return chrome.i18n.getMessage(key, substitutions) || fallback;
    } catch {
        return fallback;
    }
}

class ConversationExportTab extends BaseTab {
    constructor() {
        super();
        this.id = 'conversation-export';
        this.name = conversationExportTabI18n('conversationExportTabName', '对话导出');
        this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M12 18v-6"/>
            <path d="m9 15 3 3 3-3"/>
        </svg>`;
    }

    shouldShow() {
        return getCurrentPlatform()?.features?.conversationExport === true;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'conversation-export-settings';

        container.innerHTML = `
            <div class="setting-section">
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-label">${conversationExportTabI18n('conversationExportToggleTitle', '开启对话导出')}</div>
                        <div class="setting-hint">${conversationExportTabI18n('conversationExportToggleHint', '开启后，在Supported platforms对话页Timeline上方显示导出入口。')}</div>
                    </div>
                    <label class="ait-toggle-switch">
                        <input type="checkbox" id="conversation-export-toggle">
                        <span class="ait-toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;

        return container;
    }

    async mounted() {
        super.mounted();

        const checkbox = document.getElementById('conversation-export-toggle');
        if (!checkbox) return;

        try {
            const result = await chrome.storage.local.get('conversationExportEnabled');
            checkbox.checked = result.conversationExportEnabled !== false;
        } catch {
            checkbox.checked = true;
        }

        this.addEventListener(checkbox, 'change', async (event) => {
            const enabled = event.target.checked;
            try {
                await chrome.storage.local.set({ conversationExportEnabled: enabled });
                if (window.timelineManager?.updateConversationExportButtonVisibility) {
                    window.timelineManager.conversationExportEnabled = enabled;
                    window.timelineManager.updateConversationExportButtonVisibility();
                }
            } catch {
                event.target.checked = !enabled;
            }
        });
    }
}
