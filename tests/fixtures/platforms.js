const fixtures = [
    { id: 'chatgpt', url: 'https://chatgpt.com/c/demo', route: '/c/demo', selectorEvidence: 'data-turn', userHtml: '<article data-turn="user" data-turn-id="u1"><div class="whitespace-pre-wrap">Question</div></article>', assistantHtml: '<article data-turn="assistant" data-turn-id="a1">Answer</article>', inputHtml: '<div id="prompt-textarea" contenteditable="true"></div>' },
    { id: 'gemini', url: 'https://gemini.google.com/app/demo', route: '/app/demo', selectorEvidence: 'user-query', userHtml: '<user-query><div class="query-text-line">Question</div></user-query>', assistantHtml: '<model-response>Answer</model-response>', inputHtml: '<div class="ql-editor textarea" contenteditable="true"></div>' },
    { id: 'doubao', url: 'https://www.doubao.com/chat/123', route: '/chat/123', selectorEvidence: 'data-message-id', userHtml: '<div data-message-id="u1" data-role="user" class="justify-end">Question</div>', assistantHtml: '<div data-message-id="a1" data-role="assistant">Answer</div>', inputHtml: '<textarea class="semi-input-textarea"></textarea>' },
    { id: 'deepseek', url: 'https://chat.deepseek.com/a/chat/s/demo', route: '/a/chat/s/demo', selectorEvidence: 'ds-message', userHtml: '<div class="ds-message" data-role="user">Question</div>', assistantHtml: '<div class="ds-message" data-role="assistant"><div class="ds-markdown">Answer</div></div>', inputHtml: '<textarea class="ds-scroll-area" rows="2"></textarea>' },
    { id: 'yiyan', url: 'https://yiyan.baidu.com/chat/demo', route: '/chat/demo', selectorEvidence: 'question', userHtml: '<div data-message-id="u1" class="questionText">Question</div>', assistantHtml: '<div data-message-id="a1" class="answer">Answer</div>', inputHtml: '<textarea></textarea>' },
    { id: 'tongyi', url: 'https://tongyi.com/chat/demo', route: '/chat/demo', selectorEvidence: 'question', userHtml: '<div data-msgid="u1" class="questionItem">Question</div>', assistantHtml: '<div data-msgid="a1" class="answerItem">Answer</div>', inputHtml: '<div data-slate-editor="true" contenteditable="true"></div>' },
    { id: 'qwen', url: 'https://chat.qwen.ai/c/demo', route: '/c/demo', selectorEvidence: 'user', userHtml: '<div data-message-author-role="user" class="user-message">Question</div>', assistantHtml: '<div data-message-author-role="assistant" class="assistant-message">Answer</div>', inputHtml: '<textarea class="message-input-textarea"></textarea>' },
    { id: 'kimi', url: 'https://kimi.com/chat/demo', route: '/chat/demo', selectorEvidence: 'user-content', userHtml: '<div class="chat-content-item"><div class="user-content">Question</div></div>', assistantHtml: '<div class="chat-content-item"><div class="assistant-content">Answer</div></div>', inputHtml: '<div class="chat-input-editor" contenteditable="true"></div>' },
    { id: 'yuanbao', url: 'https://yuanbao.tencent.com/chat/demo', route: '/chat/demo', selectorEvidence: 'human', userHtml: '<div class="agent-chat__bubble--human">Question</div>', assistantHtml: '<div class="agent-chat__bubble--ai">Answer</div>', inputHtml: '<div data-lexical-editor="true" contenteditable="true"></div>' },
    { id: 'grok', url: 'https://grok.com/c/demo', route: '/c/demo', selectorEvidence: 'items-end', userHtml: '<div id="u1" class="items-end"><p class="break-words">Question</p></div>', assistantHtml: '<div id="a1" class="items-start"><p>Answer</p></div>', inputHtml: '<div class="ProseMirror" contenteditable="true"></div>' },
    { id: 'perplexity', url: 'https://perplexity.ai/search/demo', route: '/search/demo', selectorEvidence: 'select-text', userHtml: '<span class="select-text">Question</span>', assistantHtml: '<div class="prose">Answer</div>', inputHtml: '<div id="ask-input" contenteditable="true"></div>' },
    { id: 'claude', url: 'https://claude.ai/chat/123e4567-e89b-12d3-a456-426614174000', route: '/chat/123e4567-e89b-12d3-a456-426614174000', selectorEvidence: 'data-testid', userHtml: '<div data-test-render-count="1"><div data-testid="user-message">Question</div></div>', assistantHtml: '<div data-testid="assistant-message">Answer</div>', inputHtml: '<div class="ProseMirror" contenteditable="true"></div>' },
    { id: 'notebooklm', url: 'https://notebooklm.google.com/notebook/demo', route: '/notebook/demo', selectorEvidence: 'user-message', userHtml: '<div data-testid="user-message">Question</div>', assistantHtml: '<div data-testid="assistant-message">Answer</div>', inputHtml: '<div class="message-container"><textarea></textarea></div>' }
];

const spaRoutes = {
    chatgpt: '/c/demo-next',
    gemini: '/app/demo-next',
    doubao: '/chat/456',
    deepseek: '/a/chat/s/demo-next',
    yiyan: '/chat/demo-next',
    tongyi: '/chat/demo-next',
    qwen: '/c/demo-next',
    kimi: '/chat/demo-next',
    yuanbao: '/chat/demo-next',
    grok: '/c/demo-next',
    perplexity: '/search/demo-next',
    claude: '/chat/223e4567-e89b-12d3-a456-426614174001',
    notebooklm: '/notebook/demo-next'
};

for (const fixture of fixtures) {
    fixture.expectedRoles = ['user', 'assistant'];
    fixture.expectedTimelineNodes = fixture.id === 'notebooklm' ? 0 : 1;
    fixture.spaRoute = spaRoutes[fixture.id];
    fixture.fixtureType = 'sanitized-contract';
    fixture.liveStatus = 'pending-live';
}

if (typeof window !== 'undefined') window.PLATFORM_FIXTURES = fixtures;
if (typeof module !== 'undefined') module.exports = fixtures;
