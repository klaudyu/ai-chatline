/**
 * Conversation Export Panel
 *
 * 轻量面板，负责选择Export mode、格式并触发Copy/下载。
 */

const ConversationExportPanel = {
    _overlay: null,
    _service: null,
    _selectedFormat: 'markdown',
    _selectedMode: 'full',
    _previewMessages: [],
    _selectedMessageIndexes: new Set(),
    _previewError: '',
    _loadingPreview: false,
    _previewRequestId: 0,
    _exporting: false,

    show({ adapter } = {}) {
        this.hide();
        this._service = new ConversationExportService({ adapter });
        this._selectedFormat = 'markdown';
        this._selectedMode = 'full';
        this._previewMessages = [];
        this._selectedMessageIndexes.clear();
        this._previewError = '';
        this._loadingPreview = false;
        this._previewRequestId = 0;
        this._exporting = false;

        const overlay = document.createElement('div');
        overlay.className = 'ait-export-panel-overlay';
        overlay.innerHTML = `
            <div class="ait-export-panel" role="dialog" aria-modal="true" aria-label="Export conversation">
                <div class="ait-export-panel-header">
                    <div class="ait-export-panel-title">Export conversation</div>
                    <button class="ait-export-panel-close" type="button" aria-label="Close">×</button>
                </div>
                <div class="ait-export-panel-body">
                    <div class="ait-export-section-title">Export mode</div>
                    <div class="ait-export-mode-list" role="radiogroup" aria-label="Export mode">
                        ${this._modeOption('full', 'Export all', 'Export all content from the current conversation')}
                        ${this._modeOption('selected', 'Select items', 'Choose the conversation items to export')}
                    </div>
                    <div class="ait-export-selection-section" hidden>
                        <div class="ait-export-selection-header">
                            <span class="ait-export-selection-count">0 selected</span>
                            <div class="ait-export-selection-tools">
                                <button class="ait-export-link-btn" type="button" data-selection-command="select-all">Select all</button>
                                <button class="ait-export-link-btn" type="button" data-selection-command="clear">CancelSelect all</button>
                            </div>
                        </div>
                        <div class="ait-export-selection-list" role="group" aria-label="Select conversations to export"></div>
                    </div>
                    <div class="ait-export-section-title">Export format</div>
                    <div class="ait-export-format-list" role="radiogroup" aria-label="Export format">
                        ${this._formatOption('markdown', 'Markdown', '.md')}
                        ${this._formatOption('obsidian', 'Obsidian', '.md + YAML')}
                        ${this._formatOption('txt', 'TXT', '.txt')}
                        ${this._formatOption('json', 'JSON', '.json')}
                    </div>
                </div>
                <div class="ait-export-panel-actions">
                    <button class="ait-export-action-btn" type="button" data-action="copy">Copy to clipboard</button>
                    <button class="ait-export-action-btn primary" type="button" data-action="download">Download file</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this._overlay = overlay;
        this._bindEvents(overlay);
        this._syncModeUI();
    },

    hide() {
        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
        }
        this._service = null;
        this._previewMessages = [];
        this._selectedMessageIndexes.clear();
        this._previewError = '';
        this._loadingPreview = false;
        this._previewRequestId += 1;
        this._exporting = false;
    },

    _modeOption(value, label, hint) {
        const checked = value === this._selectedMode ? 'checked' : '';
        return `
            <label class="ait-export-mode-item">
                <input type="radio" name="ait-export-mode" value="${value}" ${checked}>
                <span class="ait-export-format-check"></span>
                <span class="ait-export-format-text">
                    <span class="ait-export-format-label">${label}</span>
                    <span class="ait-export-format-hint">${hint}</span>
                </span>
            </label>
        `;
    },

    _formatOption(value, label, hint) {
        const checked = value === this._selectedFormat ? 'checked' : '';
        return `
            <label class="ait-export-format-item">
                <input type="radio" name="ait-export-format" value="${value}" ${checked}>
                <span class="ait-export-format-check"></span>
                <span class="ait-export-format-text">
                    <span class="ait-export-format-label">${label}</span>
                    <span class="ait-export-format-hint">${hint}</span>
                </span>
            </label>
        `;
    },

    _bindEvents(overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.hide();
                return;
            }

            const actionButton = event.target.closest?.('[data-action]');
            if (actionButton) {
                this._handleAction(actionButton);
                return;
            }

            const commandButton = event.target.closest?.('[data-selection-command]');
            if (commandButton) {
                this._handleSelectionCommand(commandButton.dataset.selectionCommand);
            }
        });

        overlay.addEventListener('change', (event) => {
            const input = event.target;
            if (!input?.matches?.('input')) return;

            if (input.name === 'ait-export-mode' && input.checked) {
                this._selectedMode = input.value;
                this._syncModeUI();
                return;
            }

            if (input.name === 'ait-export-format' && input.checked) {
                this._selectedFormat = input.value;
                return;
            }

            if (input.name === 'ait-export-message') {
                const index = Number(input.value);
                if (input.checked) {
                    this._selectedMessageIndexes.add(index);
                } else {
                    this._selectedMessageIndexes.delete(index);
                }
                this._updateSelectionSummary();
            }
        });

        overlay.querySelector('.ait-export-panel-close')?.addEventListener('click', () => this.hide());
    },

    async _handleAction(button) {
        if (!this._service || !button) return;
        if (this._exporting) return;

        const action = button.dataset.action;
        const label = button.textContent;
        const options = {};

        if (this._selectedMode === 'selected') {
            if (this._loadingPreview) {
                this._toast('info', '对话列表加载中，请稍候', button);
                return;
            }
            if (this._previewError) {
                this._toast('error', this._previewError, button);
                return;
            }
            if (this._selectedMessageIndexes.size === 0) {
                this._toast('warning', 'Please select at least one conversation item', button);
                return;
            }
            options.selectedMessageIndexes = Array.from(this._selectedMessageIndexes).sort((a, b) => a - b);
        }

        this._exporting = true;
        this._overlay?.querySelectorAll('[data-action]').forEach(actionButton => {
            actionButton.disabled = true;
        });
        button.textContent = action === 'copy' ? 'Copying...' : 'Exporting...';

        try {
            if (action === 'copy') {
                await this._service.copy(this._selectedFormat, options);
                this._toast('success', this._selectedMode === 'selected' ? 'Selected content copied' : 'Copied to clipboard', button);
            } else {
                await this._service.download(this._selectedFormat, options);
                this._toast('success', this._selectedMode === 'selected' ? 'Selected content download started' : 'Download started', button);
            }
            this.hide();
        } catch (error) {
            this._toast('error', error?.message || 'Export failed', button);
        } finally {
            this._exporting = false;
            if (button.isConnected) {
                this._overlay?.querySelectorAll('[data-action]').forEach(actionButton => {
                    actionButton.disabled = false;
                });
                button.textContent = label;
            }
        }
    },

    _syncModeUI() {
        const section = this._overlay?.querySelector('.ait-export-selection-section');
        if (!section) return;

        const selected = this._selectedMode === 'selected';
        section.hidden = !selected;
        this._overlay?.querySelector('.ait-export-panel')?.classList.toggle('has-selection-list', selected);
        this._syncActionLabels();

        if (selected) {
            this._loadPreviewMessages();
        } else {
            this._previewMessages = [];
            this._selectedMessageIndexes.clear();
            this._previewError = '';
            this._loadingPreview = false;
            this._previewRequestId += 1;
            this._updateSelectionSummary();
        }
    },

    _syncActionLabels() {
        const copyBtn = this._overlay?.querySelector('[data-action="copy"]');
        const downloadBtn = this._overlay?.querySelector('[data-action="download"]');
        if (copyBtn) copyBtn.textContent = this._selectedMode === 'selected' ? 'Copy selected' : 'Copy to clipboard';
        if (downloadBtn) downloadBtn.textContent = this._selectedMode === 'selected' ? 'Download selected' : 'Download file';
    },

    async _loadPreviewMessages() {
        if (!this._service || this._loadingPreview || this._previewMessages.length || this._previewError) {
            this._renderSelectionList();
            return;
        }

        const requestId = ++this._previewRequestId;
        this._loadingPreview = true;
        this._renderSelectionList();

        try {
            const payload = await this._service.extractor.extract();
            if (requestId !== this._previewRequestId) return;
            this._previewMessages = Array.isArray(payload.messages) ? payload.messages : [];
            this._selectedMessageIndexes.clear();
        } catch (error) {
            if (requestId !== this._previewRequestId) return;
            this._previewError = error?.message || 'No exportable conversation content was recognized';
            this._previewMessages = [];
            this._selectedMessageIndexes.clear();
        } finally {
            if (requestId === this._previewRequestId) {
                this._loadingPreview = false;
                this._renderSelectionList();
            }
        }
    },

    _renderSelectionList() {
        const list = this._overlay?.querySelector('.ait-export-selection-list');
        if (!list) return;

        if (this._loadingPreview) {
            list.innerHTML = '<div class="ait-export-selection-state">Detecting conversations on this page...</div>';
            this._updateSelectionSummary();
            return;
        }

        if (this._previewError) {
            list.innerHTML = `<div class="ait-export-selection-state error">${this._escapeHtml(this._previewError)}</div>`;
            this._updateSelectionSummary();
            return;
        }

        if (!this._previewMessages.length) {
            list.innerHTML = '<div class="ait-export-selection-state">No exportable conversation content was recognized</div>';
            this._updateSelectionSummary();
            return;
        }

        list.innerHTML = this._previewMessages.map(message => this._messageOption(message)).join('');
        this._updateSelectionSummary();
    },

    _messageOption(message) {
        const index = Number(message.index);
        const checked = this._selectedMessageIndexes.has(index) ? 'checked' : '';
        const role = this._roleLabel(message.role);
        const turn = Number.isFinite(message.turnIndex) ? message.turnIndex + 1 : index + 1;
        const summary = this._summarize(message.content);

        return `
            <label class="ait-export-message-item">
                <input type="checkbox" name="ait-export-message" value="${index}" ${checked}>
                <span class="ait-export-message-check"></span>
                <span class="ait-export-message-content">
                    <span class="ait-export-message-meta">${this._escapeHtml(role)} ${turn}</span>
                    <span class="ait-export-message-summary">${this._escapeHtml(summary)}</span>
                </span>
            </label>
        `;
    },

    _handleSelectionCommand(command) {
        if (!this._previewMessages.length) return;

        if (command === 'select-all') {
            this._previewMessages.forEach(message => {
                this._selectedMessageIndexes.add(Number(message.index));
            });
            this._renderSelectionList();
            return;
        }

        if (command === 'clear') {
            this._selectedMessageIndexes.clear();
            this._renderSelectionList();
        }
    },

    _updateSelectionSummary() {
        const count = this._selectedMessageIndexes.size;
        const total = this._previewMessages.length;
        const countEl = this._overlay?.querySelector('.ait-export-selection-count');
        if (countEl) countEl.textContent = total ? `${count} / ${total} selected` : '0 selected';

        this._overlay?.querySelectorAll('input[name="ait-export-message"]').forEach(input => {
            const checked = this._selectedMessageIndexes.has(Number(input.value));
            input.checked = checked;
            input.closest?.('.ait-export-message-item')?.classList.toggle('selected', checked);
        });
    },

    _roleLabel(role) {
        return role === 'assistant' ? 'AI' : 'User';
    },

    _summarize(content) {
        const lines = String(content || '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .slice(0, 2);
        const summary = lines.join(' / ').replace(/\s+/g, ' ').trim();
        return summary.length > 120 ? `${summary.slice(0, 120)}...` : summary || '（空内容）';
    },

    _escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    _toast(type, message, target) {
        const manager = window.globalToastManager;
        if (manager?.[type]) {
            manager[type](message, target);
            return;
        }
        console[type === 'error' ? 'error' : 'log'](`[ConversationExport] ${message}`);
    }
};
