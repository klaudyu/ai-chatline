/**
 * Loads advanced features only after the user explicitly enables them.
 * The settings tabs stay lightweight and are part of the core content script.
 */
(function () {
    'use strict';

    const FEATURE_CONFIG = {
        runner: { keys: [
            'runnerJsEnabled',
            'runnerTypeScriptEnabled',
            'runnerSQLEnabled',
            'runnerHtmlEnabled',
            'runnerJsonEnabled',
            'runnerMarkdownEnabled',
            'mermaidRendererEnabled'
        ] },
        formula: { keys: ['formulaLatexEnabled', 'formulaMathMLEnabled'] },
        quickAsk: { keys: ['quickAskEnabled'] },
        scrollToBottom: { keys: ['scrollToBottomEnabled'] },
        animation: {
            keys: ['activeAnimation'],
            isEnabled: settings => typeof settings.activeAnimation === 'string' && settings.activeAnimation.length > 0
        }
    };

    const loaded = new Set();
    const loading = new Map();

    async function loadFeature(feature) {
        if (loaded.has(feature)) return true;
        if (loading.has(feature)) return loading.get(feature);

        const request = chrome.runtime.sendMessage({
            type: 'LOAD_OPTIONAL_FEATURE',
            feature
        }).then(response => {
            if (!response?.success) {
                throw new Error(response?.error || `Failed to load ${feature}`);
            }
            if (feature === 'animation') {
                return window.inputBoxAnimationManager?.init?.().then(() => true) || true;
            }
            loaded.add(feature);
            return true;
        }).then(result => {
            loaded.add(feature);
            return result;
        }).catch(error => {
            console.warn(`[OptionalFeatureLoader] ${feature}:`, error.message);
            return false;
        }).finally(() => {
            loading.delete(feature);
        });

        loading.set(feature, request);
        return request;
    }

    async function loadEnabledFeatures() {
        const keys = Object.values(FEATURE_CONFIG).flatMap(config => config.keys);
        const settings = await chrome.storage.local.get(keys);
        for (const [feature, config] of Object.entries(FEATURE_CONFIG)) {
            const enabled = config.isEnabled
                ? config.isEnabled(settings)
                : config.keys.some(key => settings[key] === true);
            if (enabled) {
                await loadFeature(feature);
            }
        }
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        for (const [feature, config] of Object.entries(FEATURE_CONFIG)) {
            const enabled = config.isEnabled
                ? config.isEnabled(Object.fromEntries(config.keys.map(key => [key, changes[key]?.newValue])))
                : config.keys.some(key => changes[key]?.newValue === true);
            if (enabled) {
                loadFeature(feature);
            }
        }
    });

    loadEnabledFeatures().catch(error => {
        console.warn('[OptionalFeatureLoader] Initialization failed:', error.message);
    });
})();
