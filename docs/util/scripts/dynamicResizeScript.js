
window.addEventListener('message', function(e) {
    // Verify that the message came from our iframes
    if (e.data && e.data.type === 'resize') {
        const iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {
            if (iframes[i].contentWindow === e.source) {
                // Set the height sent by the iframe
                iframes[i].style.height = e.data.height + 'px';
                iframes[i].style.transition = 'height 0.2s ease-out';
                break;
            }
        }
    }
});
