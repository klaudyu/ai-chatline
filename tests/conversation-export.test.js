const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'js/conversationExport/conversation-extractor.js'), 'utf8');
const context = {
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3, DOCUMENT_POSITION_FOLLOWING: 4 },
    document: { body: null },
    window: {}
};
vm.createContext(context);
vm.runInContext(`${source}\nthis.__ConversationExtractor = ConversationExtractor;`, context);

function text(value) {
    return { nodeType: 3, textContent: value };
}

function element(tagName, children = [], classNames = []) {
    const classSet = new Set(classNames);
    return {
        nodeType: 1,
        tagName: tagName.toUpperCase(),
        childNodes: children,
        classList: { contains: name => classSet.has(name) }
    };
}

test('Markdown export keeps highlight markers tight to highlighted text', () => {
    const extractor = new context.__ConversationExtractor({});
    const root = element('p', [
        text('Before '),
        element('mark', [text(' highlighted text ')], ['ait-highlight']),
        text(' after')
    ]);

    const output = extractor._walkNode(root, { inPre: false, inCode: false });

    assert.equal(output, '\nBefore  ==highlighted text==  after\n');
    assert.equal((output.match(/==/g) || []).length, 2);
    assert.match(output, /==highlighted text==/);
    assert.equal(output.includes('== highlighted'), false);
    assert.equal(output.includes('text =='), false);
});