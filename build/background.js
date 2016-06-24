chrome.app.runtime.onLaunched.addListener(function () {
    chrome.app.window.create('index.html', {
        id: 'main',
        bounds: { width: 620, height: 500 }
    });
});
//# sourceMappingURL=background.js.map