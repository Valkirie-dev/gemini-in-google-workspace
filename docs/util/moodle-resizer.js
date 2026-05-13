let lastHeight = 0;

  const updateHeight = () => {
    if (window.self !== window.top) {
        document.documentElement.style.height = 'auto';
        document.body.style.height = 'auto';
        document.documentElement.style.overflowY = 'hidden';
        document.body.style.overflowY = 'hidden';
    }

    const contentHeight = document.body.scrollHeight;
    const newHeight = contentHeight + 30;

    if (Math.abs(newHeight - lastHeight) < 10) {
        return;
    }

    window.parent.postMessage({
        type: 'moodleIframeResize',
        height: newHeight
    }, '*');
    
    lastHeight = newHeight;
  };

  window.addEventListener('load', updateHeight);
  window.addEventListener('resize', updateHeight);

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      updateHeight();
    });
    ro.observe(document.body);
  }