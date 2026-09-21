/**
 * Export Service
 *
 * 统一导出流程：采集当前会话 -> 格式化 -> Copy或下载。
 */

class ConversationExportService {
    constructor({ adapter, extractor, formatters, fileDownloadService, clipboardService } = {}) {
        this.adapter = adapter || window.timelineManager?.adapter || null;
        this.extractor = extractor || new ConversationExtractor(this.adapter);
        this.formatters = formatters || ConversationExportFormatters;
        this.fileDownloadService = fileDownloadService || FileDownloadService;
        this.clipboardService = clipboardService || ClipboardService;
    }

    async build(format, options = {}) {
        const isSelectedExport = Array.isArray(options.selectedMessageIndexes) ||
            Array.isArray(options.selectedTurnIndexes);
        const selectedCount = (options.selectedMessageIndexes?.length || 0) +
            (options.selectedTurnIndexes?.length || 0);

        if (isSelectedExport && selectedCount === 0) {
            throw new Error('Please select at least one conversation item');
        }

        const buildPayload = async () => {
            const payload = await this.extractor.extract(options);
            if (!payload.messages || payload.messages.length === 0) {
                throw new Error(isSelectedExport
                    ? 'No selected conversation content was recognized'
                    : 'No exportable conversation content was recognized');
            }

            const content = this.formatters.format(payload, format);
            const extension = this.formatters.extension(format);
            const filename = this._buildFilename(payload, extension);
            return { payload, content, filename };
        };

        const optimizer = window.timelineManager?.longConversationOptimizer;
        if (!isSelectedExport && optimizer?.withAllRestored) {
            return optimizer.withAllRestored(buildPayload, { reapply: true });
        }
        return buildPayload();
    }

    async copy(format, options = {}) {
        const result = await this.build(format, options);
        await this.clipboardService.copy(result.content);
        return result;
    }

    async download(format, options = {}) {
        const result = await this.build(format, options);
        this.fileDownloadService.download(result.content, result.filename, this._mimeType(format));
        return result;
    }

    _buildFilename(payload, extension) {
        const platform = payload.platformName || payload.platform || 'AI';
        const title = payload.title || 'Conversation';
        const exportedAt = typeof ConversationExportDateUtils !== 'undefined'
            ? ConversationExportDateUtils.formatForFilename(payload.exportedAt)
            : String(payload.exportedAt || '').replace(/[\\/:*?"<>|\s]+/g, '_');

        return `${this._sanitizeFilename(platform)}_${this._sanitizeFilename(title)}_${exportedAt}.${extension}`;
    }

    _sanitizeFilename(value) {
        return String(value || '')
            .replace(/[\\/:*?"<>|]+/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 80) || 'conversation';
    }

    _mimeType(format) {
        if (format === 'json') return 'application/json;charset=utf-8';
        if (format === 'markdown' || format === 'obsidian') return 'text/markdown;charset=utf-8';
        return 'text/plain;charset=utf-8';
    }
}
