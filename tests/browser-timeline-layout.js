(() => {
    const wrapper = document.querySelector('.ait-chat-timeline-wrapper');
    const timeline = document.querySelector('.ait-chat-timeline-bar');
    const result = document.getElementById('result');
    const wrapperRect = wrapper.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();
    const bottomGap = window.innerHeight - wrapperRect.bottom;
    const passed = bottomGap >= 19 && timelineRect.height >= 95 && wrapperRect.right <= window.innerWidth;

    result.dataset.status = passed ? 'pass' : 'fail';
    result.textContent = JSON.stringify({
        status: passed ? 'PASS' : 'FAIL',
        viewport: [window.innerWidth, window.innerHeight],
        bottomGap: Math.round(bottomGap),
        timelineHeight: Math.round(timelineRect.height),
        wrapperTop: Math.round(wrapperRect.top)
    });
})();
