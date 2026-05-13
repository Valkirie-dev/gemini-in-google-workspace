document.addEventListener("DOMContentLoaded", function() {

    // --- CONFIGURATION ---
    const firstSlideName = "Start Point"; // Name for the first actual content slide

    // --- 1. INJECT STYLES ---
    const style = document.createElement('style');
    style.innerHTML = `
        /* =========================================
           USER PROVIDED STYLES (Bottom Player & Logic)
           ========================================= */
        
        /* 
           UPDATED: Only hide sections (.sect1). 
           The #header remains visible at the top of the page permanently.
        */
        .sect1 {
            display: none;
        }

        #header {
            display: block;
            text-align: center;
            margin-bottom: 40px;
            /* Ensure it doesn't overlap with the fixed top controls */
            padding-top: 60px; 
        }

        /* Active slide visibility */
        .slide-active {
            display: block !important;
            animation: fadeEffect 0.5s;
        }

        @keyframes fadeEffect {
            from {opacity: 0;}
            to {opacity: 1;}
        }

        /* Ensure content doesn't hide behind the fixed player */
        body {
            padding-bottom: 100px !important;
        }

        /* --- PLAYER PANEL STYLES --- */
        #sticky-player {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 80px;
            background: #ffffff;
            border-top: 4px solid var(--primary, #00a6eb);
            box-shadow: 0 -5px 20px rgba(0,0,0,0.1);
            z-index: 2147483647; 
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Manrope', sans-serif;
            padding: 0 20px;
            box-sizing: border-box;
        }

        .player-inner {
            width: 100%;
            max-width: 900px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .player-btn {
            background-color: var(--primary, #00a6eb);
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s, transform 0.1s;
            min-width: 130px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .player-btn:hover {
            background-color: var(--header-dark, #2a668e);
            transform: translateY(-2px);
        }

        .player-btn:active {
            transform: translateY(0);
        }

        .player-btn:disabled {
            background-color: #e0e0e0;
            color: #a0a0a0;
            cursor: default;
            transform: none;
            box-shadow: none;
        }

        .slide-info {
            text-align: center;
        }

        .slide-number {
            font-size: 1.2rem;
            font-weight: 800;
            color: var(--text-main, #333);
            display: block;
        }

        .slide-progress-bg {
            width: 200px;
            height: 6px;
            background: #eee;
            border-radius: 3px;
            margin-top: 8px;
            overflow: hidden;
        }

        #progress-fill { 
            height: 100%;
            background: linear-gradient(90deg, var(--primary, #00a6eb) 0%, var(--accent, #e60036) 100%);
            width: 0%;
            transition: width 0.3s ease;
        }

        @media (max-width: 600px) {
            #sticky-player { height: auto; padding: 15px; }
            .player-inner { flex-wrap: wrap; justify-content: center; gap: 10px; }
            .slide-progress-bg { display: none; }
            .player-btn { flex: 1; padding: 10px; min-width: auto; }
            .slide-info { width: 100%; order: -1; margin-bottom: 5px; }
        }

        /* =========================================
           NEW STYLES (Top Controls & Menu)
           ========================================= */
        
        #top-controls {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 15px 20px;
            display: flex;
            justify-content: flex-end; 
            align-items: center;
            z-index: 9999;
            pointer-events: none; 
        }
        
        .top-btn-group {
            pointer-events: auto;
            display: flex;
            gap: 10px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(5px);
            padding: 8px 12px;
            border-radius: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #eee;
        }

        .nav-icon-btn, .menu-toggle-btn {
            background: transparent;
            color: #333;
            border: 1px solid transparent;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .menu-toggle-btn {
            border-radius: 20px;
            width: auto;
            padding: 0 15px;
            font-weight: 600;
            font-size: 14px;
            font-family: 'Manrope', sans-serif;
            background: #f5f5f5;
        }

        .nav-icon-btn:hover { background: #e0e0e0; transform: scale(1.05); }
        .menu-toggle-btn:hover { background: #e0e0e0; }
        .nav-icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Fullscreen Menu Overlay */
        #slide-menu-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding-top: 60px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
        }

        #slide-menu-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .menu-close {
            position: absolute;
            top: 20px;
            right: 30px;
            background: none;
            border: none;
            color: #fff;
            font-size: 40px;
            cursor: pointer;
        }

        .menu-list-container {
            width: 100%;
            max-width: 700px;
            height: 80vh;
            overflow-y: auto;
            padding: 0 20px;
        }

        .menu-list {
            list-style: none;
            padding: 0;
            text-align: left;
        }

        .menu-list li {
            margin: 10px 0;
            opacity: 0;
            transform: translateY(20px);
            transition: 0.4s;
            border-bottom: 1px solid #333;
        }
        
        #slide-menu-overlay.active .menu-list li {
            opacity: 1;
            transform: translateY(0);
        }

        .menu-list button {
            background: none;
            border: none;
            color: #aaa;
            font-size: 18px;
            cursor: pointer;
            transition: color 0.2s, padding-left 0.2s;
            font-family: inherit;
            padding: 15px 5px;
            width: 100%;
            text-align: left;
            display: block;
        }

        .menu-list button:hover { 
            color: #fff; 
            padding-left: 10px;
        }
        
        .menu-list button.active-item { 
            color: var(--primary, #00a6eb); 
            font-weight: bold; 
            padding-left: 10px;
        }

        .menu-list-container::-webkit-scrollbar { width: 6px; }
        .menu-list-container::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
    `;
    document.head.appendChild(style);

    // --- 2. HTML STRUCTURE INJECTION ---
    const uiHTML = `
    <!-- Top Header Controls -->
    <div id="top-controls">
        <div class="top-btn-group">
            <button id="top-prev" class="nav-icon-btn" title="Back">←</button>
            <button id="menu-toggle" class="menu-toggle-btn">☰ Menu</button>
            <button id="top-next" class="nav-icon-btn" title="Forward">→</button>
        </div>
    </div>

    <!-- Fullscreen Menu Overlay -->
    <div id="slide-menu-overlay">
        <button id="menu-close" class="menu-close">×</button>
        <div class="menu-list-container">
            <ul id="menu-list" class="menu-list"></ul>
        </div>
    </div>

    <!-- Bottom Sticky Player -->
    <div id="sticky-player">
        <div class="player-inner">
            <button id="btn-prev" class="player-btn">← Previous</button>
            <div class="slide-info">
                <span id="slide-count" class="slide-number">${firstSlideName}</span>
                <div class="slide-progress-bg">
                    <div id="progress-fill"></div>
                </div>
            </div>
            <button id="btn-next" class="player-btn">Next →</button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', uiHTML);

    // --- 3. DOM ELEMENTS ---
    // UPDATED LOGIC: Header is separate, slides are only sections
    const sections = Array.from(document.querySelectorAll('.sect1'));
    
    // We do NOT add the header to the slides array anymore.
    // The header will remain static in DOM flow.
    const slides = sections;

    const totalSlides = slides.length;
    let currentIndex = 0;

    // Elements
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const txtCount = document.getElementById('slide-count');
    const barFill = document.getElementById('progress-fill');
    const player = document.getElementById('sticky-player');

    const topPrev = document.getElementById('top-prev');
    const topNext = document.getElementById('top-next');
    const menuBtn = document.getElementById('menu-toggle');
    const topControls = document.getElementById('top-controls');
    
    const menuOverlay = document.getElementById('slide-menu-overlay');
    const menuClose = document.getElementById('menu-close');
    const menuList = document.getElementById('menu-list');

    // --- 4. GENERATE MENU ITEMS ---
    function generateMenu() {
        menuList.innerHTML = '';
        slides.forEach((slide, index) => {
            let titleText;

            // First CONTENT slide is named specifically
            if (index === 0) {
                titleText = firstSlideName; 
            } else {
                let titleEl = slide.querySelector('h2') || slide.querySelector('h1');
                titleText = titleEl ? titleEl.innerText : `Slide ${index + 1}`;
            }
            
            if(titleText.length > 60) titleText = titleText.substring(0, 60) + '...';

            const li = document.createElement('li');
            const btn = document.createElement('button');
            
            btn.innerText = `${index + 1}. ${titleText}`;
            
            btn.onclick = () => {
                showSlide(index); 
                closeMenu(); 
            };

            li.appendChild(btn);
            menuList.appendChild(li);
        });
    }

    // --- 5. CORE LOGIC ---
    function showSlide(index) {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;
        currentIndex = index;

        // Toggle visibility of content sections
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('slide-active');
                window.scrollTo(0, 0);
            } else {
                slide.classList.remove('slide-active');
            }
        });

        // Update UI
        if (txtCount) txtCount.innerText = `Section ${index + 1} / ${totalSlides}`;
        if (barFill) {
            const pct = ((index + 1) / totalSlides) * 100;
            barFill.style.width = `${pct}%`;
        }

        const isFirst = (index === 0);
        const isLast = (index === totalSlides - 1);

        if(btnPrev) btnPrev.disabled = isFirst;
        if(btnNext) btnNext.disabled = isLast;
        if(topPrev) topPrev.disabled = isFirst;
        if(topNext) topNext.disabled = isLast;

        // Update Active Menu Item
        const menuButtons = menuList.querySelectorAll('button');
        menuButtons.forEach((btn, i) => {
            if (i === index) btn.classList.add('active-item');
            else btn.classList.remove('active-item');
        });
    }

    function openMenu() {
        menuOverlay.classList.add('active');
        const items = menuList.querySelectorAll('li');
        items.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.03}s`;
        });
    }

    function closeMenu() {
        menuOverlay.classList.remove('active');
        const items = menuList.querySelectorAll('li');
        items.forEach((item) => {
            item.style.transitionDelay = '0s';
        });
    }

    // --- 6. EVENT LISTENERS ---
    const goPrev = () => { if (currentIndex > 0) showSlide(currentIndex - 1); };
    const goNext = () => { if (currentIndex < totalSlides - 1) showSlide(currentIndex + 1); };

    if(btnPrev) btnPrev.addEventListener('click', goPrev);
    if(btnNext) btnNext.addEventListener('click', goNext);
    if(topPrev) topPrev.addEventListener('click', goPrev);
    if(topNext) topNext.addEventListener('click', goNext);

    if(menuBtn) menuBtn.addEventListener('click', openMenu);
    if(menuClose) menuClose.addEventListener('click', closeMenu);
    
    if(menuOverlay) {
        menuOverlay.addEventListener('click', (e) => {
            if(e.target === menuOverlay || e.target.classList.contains('menu-list-container')) {
                closeMenu();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === "ArrowRight") goNext();
        else if (e.key === "ArrowLeft") goPrev();
        else if (e.key === "Escape") closeMenu();
    });

    // --- 7. INITIALIZATION ---
    if (totalSlides > 0) {
        generateMenu();
        showSlide(0);
    } else {
        if(player) player.style.display = 'none';
        if(topControls) topControls.style.display = 'none';
    }
    // --- 8. INTEGRATION WITH TRACKER (Global Function) ---
    window.goToSlideWithElement = function(elementId) {
        const el = document.getElementById(elementId);
        if (!el) {
            console.warn("[Slides] Target element not found in DOM:", elementId);
            return false;
        }
        
        // Find the parent slide section (.sect1)
        const targetSlide = el.closest('.sect1');
        
        if (targetSlide) {
            // Re-query all slides to guarantee we get the correct index
            const allSlides = Array.from(document.querySelectorAll('.sect1'));
            const index = allSlides.indexOf(targetSlide);
            
            if (index !== -1) {
                console.log("[Slides] Switching to slide index:", index);
                showSlide(index); // Trigger the slide change
                
                // Wait for the slide to become visible, then scroll
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
                return true;
            }
        }
        console.warn("[Slides] Element is not inside a .sect1 container.");
        return false;
    };
});