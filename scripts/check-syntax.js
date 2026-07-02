const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', '.codegraph', 'node_modules']);

function collectJavaScript(directory, output = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (ignoredDirectories.has(entry.name)) continue;
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            collectJavaScript(fullPath, output);
        } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
            output.push(fullPath);
        }
    }
    return output;
}

for (const file of collectJavaScript(ROOT)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
        process.stderr.write(result.stderr || result.stdout);
        process.exit(result.status || 1);
    }
}

const jsonFiles = [
    path.join(ROOT, 'manifest.json'),
    ...fs.readdirSync(path.join(ROOT, '_locales')).map(locale =>
        path.join(ROOT, '_locales', locale, 'messages.json')
    )
];
for (const file of jsonFiles) JSON.parse(fs.readFileSync(file, 'utf8'));

console.log(`Syntax check passed (${collectJavaScript(ROOT).length} JavaScript files, ${jsonFiles.length} JSON files).`);
