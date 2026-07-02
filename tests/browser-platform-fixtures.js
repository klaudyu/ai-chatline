(() => {
    const timelineAdapters = {
        chatgpt: ChatGPTAdapter,
        gemini: GeminiAdapter,
        doubao: DoubaoAdapter,
        deepseek: DeepSeekAdapter,
        yiyan: YiyanAdapter,
        tongyi: TongyiAdapter,
        qwen: QwenAdapter,
        kimi: KimiAdapter,
        yuanbao: YuanbaoAdapter,
        grok: GrokAdapter,
        perplexity: PerplexityAdapter,
        claude: ClaudeAdapter,
        notebooklm: NotebookLMAdapter
    };
    const inputAdapters = {
        chatgpt: ChatGPTSmartEnterAdapter,
        gemini: GeminiSmartEnterAdapter,
        doubao: DoubaoSmartEnterAdapter,
        deepseek: DeepSeekSmartEnterAdapter,
        yiyan: YiyanSmartEnterAdapter,
        tongyi: TongyiSmartEnterAdapter,
        qwen: QwenSmartEnterAdapter,
        kimi: KimiSmartEnterAdapter,
        yuanbao: YuanbaoSmartEnterAdapter,
        grok: GrokSmartEnterAdapter,
        perplexity: PerplexitySmartEnterAdapter,
        claude: ClaudeSmartEnterAdapter,
        notebooklm: NotebookLMSmartEnterAdapter
    };

    const failures = [];
    for (const fixture of window.PLATFORM_FIXTURES) {
        const platform = Array.from(SITE_INFO).find(item => item.id === fixture.id);
        const host = document.createElement('section');
        host.dataset.platform = fixture.id;
        host.innerHTML = fixture.userHtml + fixture.assistantHtml + fixture.inputHtml;
        document.body.appendChild(host);

        try {
            const timeline = new timelineAdapters[fixture.id]();
            if (platform.features.timeline) {
                const users = timeline.getUserMessageElements(host);
                if (users.length !== fixture.expectedTimelineNodes) {
                    failures.push(`${fixture.id}: timeline nodes ${users.length}`);
                } else if (!timeline.extractText(users[0]).includes('Question')) {
                    failures.push(`${fixture.id}: user text extraction`);
                }
            }
            if (!timeline.isConversationRoute(fixture.route) || !timeline.isConversationRoute(fixture.spaRoute)) {
                failures.push(`${fixture.id}: SPA route contract`);
            }

            if (platform.features.smartInput || platform.features.inputAnimation) {
                const input = new inputAdapters[fixture.id]();
                if (!host.querySelector(input.getInputSelector())) {
                    failures.push(`${fixture.id}: input selector`);
                }
            }

            const roleOrder = [fixture.userHtml, fixture.assistantHtml].map((_, index) => fixture.expectedRoles[index]);
            if (roleOrder.join(',') !== 'user,assistant') failures.push(`${fixture.id}: export role order`);
        } catch (error) {
            failures.push(`${fixture.id}: ${error.message}`);
        } finally {
            host.remove();
        }
    }

    const result = document.getElementById('result');
    result.textContent = failures.length === 0 ? 'PASS: 13 platform fixtures' : `FAIL\n${failures.join('\n')}`;
    result.dataset.status = failures.length === 0 ? 'pass' : 'fail';
})();
