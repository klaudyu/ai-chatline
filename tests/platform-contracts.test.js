const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fixtures = require('./fixtures/platforms');

const ROOT = path.resolve(__dirname, '..');
const constantsSource = fs.readFileSync(path.join(ROOT, 'js/global/constants.js'), 'utf8');
const context = {
    URL,
    chrome: {
        runtime: { getURL: value => value },
        i18n: { getMessage: () => '' }
    }
};
vm.createContext(context);
vm.runInContext(`${constantsSource}\nthis.__platformTestApi = { SITE_INFO, getPlatformByUrl };`, context);
const { SITE_INFO, getPlatformByUrl } = context.__platformTestApi;

function createTimelineAdapter(fixture) {
    const adapterSource = fs.readFileSync(
        path.join(ROOT, `js/timeline/adapters/${fixture.id}.js`),
        'utf8'
    );
    const className = adapterSource.match(/class\s+(\w+)\s+extends\s+SiteAdapter/)?.[1];
    assert.ok(className, `Missing adapter class for ${fixture.id}`);
    const adapterContext = {
        URL,
        URLSearchParams,
        location: { href: fixture.url, pathname: fixture.route, search: '' },
        document: { body: {}, querySelector: () => null, querySelectorAll: () => [] },
        window: {},
        Node: { ELEMENT_NODE: 1, TEXT_NODE: 3, DOCUMENT_POSITION_FOLLOWING: 4 },
        SiteAdapter: class {},
        matchesPlatform: () => true,
        ContainerFinder: { findConversationContainer: () => null }
    };
    vm.createContext(adapterContext);
    vm.runInContext(`${adapterSource}\nthis.__Adapter = ${className};`, adapterContext);
    return new adapterContext.__Adapter();
}

test('13 platform fixtures match the declared capability table', () => {
    assert.equal(fixtures.length, 13);
    assert.deepEqual(
        fixtures.map(item => item.id).sort(),
        Array.from(SITE_INFO, item => item.id).sort()
    );
    for (const fixture of fixtures) {
        assert.equal(getPlatformByUrl(fixture.url)?.id, fixture.id);
    }
    assert.equal(getPlatformByUrl('https://evilchatgpt.com/c/demo'), null);
});

test('fixtures provide message, input, export-order, and SPA route samples', () => {
    for (const fixture of fixtures) {
        assert.match(fixture.userHtml, /Question/);
        assert.match(fixture.assistantHtml, /Answer/);
        assert.ok(fixture.inputHtml.length > 0);
        assert.deepEqual(fixture.expectedRoles, ['user', 'assistant']);
        assert.equal(fixture.fixtureType, 'sanitized-contract');
        assert.equal(fixture.liveStatus, 'pending-live');

        const adapterPath = path.join(ROOT, `js/timeline/adapters/${fixture.id}.js`);
        const adapterSource = fs.readFileSync(adapterPath, 'utf8');
        assert.match(adapterSource, /getUserMessageSelector\s*\(/);
        assert.match(adapterSource, /isConversationRoute\s*\(/);
        assert.ok(adapterSource.includes(fixture.selectorEvidence));
        assert.ok(fixture.route.startsWith('/'));

        const adapter = createTimelineAdapter(fixture);
        assert.equal(adapter.isConversationRoute(fixture.route), true);
        assert.equal(adapter.isConversationRoute(fixture.spaRoute), true);
        assert.ok(adapter.getUserMessageSelector().includes(fixture.selectorEvidence));

        const platform = SITE_INFO.find(item => item.id === fixture.id);
        if (platform.features.smartInput || platform.features.inputAnimation) {
            const inputAdapter = fs.readFileSync(
                path.join(ROOT, `js/smartInputBox/adapters/${fixture.id}.js`),
                'utf8'
            );
            assert.match(inputAdapter, /getInputSelector\s*\(/);
        }
    }
});

test('fixtures declare timeline and capability expectations without claiming live coverage', () => {
    for (const fixture of fixtures) {
        const platform = SITE_INFO.find(item => item.id === fixture.id);
        assert.equal(fixture.expectedTimelineNodes, platform.features.timeline ? 1 : 0);
        assert.equal(fixture.liveStatus, 'pending-live');
        assert.notEqual(fixture.spaRoute, fixture.route);
    }
});

test('capability differences are explicit for known partial platforms', () => {
    const byId = Object.fromEntries(Array.from(SITE_INFO, item => [item.id, item.features]));
    assert.equal(byId.notebooklm.timeline, false);
    assert.equal(byId.notebooklm.conversationExport, true);
    assert.equal(byId.yiyan.smartInput, false);
    assert.equal(byId.gemini.scrollToBottom, true);
});
