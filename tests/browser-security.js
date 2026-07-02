(async function () {
    const result = document.getElementById('result');
    const preview = document.getElementById('preview');
    const runner = new MarkdownRunner();
    let rendered = '';

    await runner.execute(`
# Safe heading

<script>document.body.dataset.xss = '1'</script>
<img src="missing-image" onerror="document.body.dataset.xss = '1'" style="position:fixed">
[unsafe](javascript:document.body.dataset.xss='1')
<iframe srcdoc="<script>document.body.dataset.xss='1'</script>"></iframe>
<form action="javascript:document.body.dataset.xss='1'"><button>Submit</button></form>
`, {
        onOutput(output) {
            if (output.level === 'markdown-preview') rendered = output.data.html;
        }
    });

    preview.innerHTML = rendered;
    await new Promise(resolve => setTimeout(resolve, 50));

    const forbiddenNode = preview.querySelector('script, iframe, form, base, object, embed');
    const forbiddenAttribute = preview.querySelector('[onerror], [onclick], [style], [srcdoc]');
    const unsafeUrl = Array.from(preview.querySelectorAll('[href], [src], [formaction]')).some(element =>
        /^(javascript|vbscript):/i.test(
            element.getAttribute('href') ||
            element.getAttribute('src') ||
            element.getAttribute('formaction') ||
            ''
        )
    );
    const passed = document.body.dataset.xss === '0' &&
        !forbiddenNode &&
        !forbiddenAttribute &&
        !unsafeUrl &&
        preview.querySelector('h1')?.textContent === 'Safe heading';

    result.dataset.status = passed ? 'pass' : 'fail';
    result.textContent = passed ? 'PASS' : 'FAIL';
})();
