/**
 * MOODLE ACTIVITY TRACKER
 * Handles communication between inner iframes and the Moodle parent window.
 */

(function() {
    const pageUrlId = (window.location.pathname + window.location.search)
        .replace(/[^a-zA-Z0-9]/g, '_');

    const CONFIG = {
        storageKey: 'moodle_tracker_v2_' + pageUrlId,
        debug: true
    };
    // -----------------------

    let state = { 
        activities: {}, 
        totalScore: 0, 
        totalMaxScore: 0 
    };

    function init() {
        if (CONFIG.debug) console.log("[Tracker] Initialized with key:", CONFIG.storageKey);
        loadState();
        setupListeners();
    }

    function loadState() {
        const saved = sessionStorage.getItem(CONFIG.storageKey);
        if (saved) {
            try {
                state = JSON.parse(saved);
            } catch (e) { console.error(e); }
        }
    }

    function saveState() {
        sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
        calculateTotals();
    }

    function calculateTotals() {
        let score = 0;
        let max = 0;
        Object.values(state.activities).forEach(act => {
            score += (parseFloat(act.score) || 0);
            max += (parseFloat(act.max) || parseFloat(act.maxScore) || 0);
        });
        state.totalScore = score;
        state.totalMaxScore = max;
    }

    function broadcastToAllFrames() {
        const iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {
            try {
                iframes[i].contentWindow.postMessage({
                    type: 'SUMMARY_DATA',
                    payload: state
                }, '*');
            } catch (e) {}
        }
    }

   /**
     * Finds the iframe that sent the message and gives it a permanent, 
     * stable HTML ID based on the activity's own ID.
     * NEW: Also returns the physical index of the iframe on the page.
     */
    function tagIframeAndGetId(sourceWindow, activityId) {
        const iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {
            if (iframes[i].contentWindow === sourceWindow) {
                // Create a stable ID that will always be the same for this specific activity
                const stableId = 'activity-frame-' + activityId;
                iframes[i].id = stableId;
            
                return { id: stableId, index: i }; 
            }
        }
        return { id: null, index: 999 };
    }

    /**
     * Scrolls the parent window to the specific element ID.
     * Integrates with slides.js to reveal hidden slides before scrolling.
     */
    function scrollToAnchor(id) {
        // First, check if the presentation logic (slides.js) exists on the page
        if (typeof window.goToSlideWithElement === 'function') {
            // If the function successfully finds and shows the slide, stop execution
            if (window.goToSlideWithElement(id)) {
                return;
            }
        }

        // Fallback if slides do not exist, are disabled, or the element isn't in a slide
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.warn("[Tracker] Anchor not found:", id);
        }
    }

    function setupListeners() {
        window.addEventListener('message', function(event) {
            const data = event.data;
            if (!data || !data.type) return;

            switch (data.type) {
                case 'REGISTER_ACTIVITY':
                    // Pass event.source to identify WHERE the activity is
                    handleRegistration(data.payload, event.source);
                    break;
                case 'ACTIVITY_UPDATE':
                    handleActivityUpdate(data.payload, event.source);
                    break;
                case 'REQUEST_SUMMARY':
                    sendSummaryToFrame(event.source);
                    break;
                case 'SCROLL_TO_ANCHOR': // Handle scroll requests from Summary
                    scrollToAnchor(data.payload);
                    break;
                case 'FORCE_SUBMIT_MOODLE':
                    sendToMoodle();
                    break;
            }
        });
    }

    function handleRegistration(payload, sourceWindow) {
        if (!payload.id) return;
        
        // Tag the iframe with a permanent ID and get its page index
        const anchorData = tagIframeAndGetId(sourceWindow, payload.id);
        const anchorId = anchorData.id;
        const pageOrder = anchorData.index;

        if (!state.activities[payload.id]) {
            state.activities[payload.id] = {
                id: payload.id,
                title: payload.title,
                max: payload.maxScore,
                score: 0,
                passScore: payload.passScore, // Store the passing score
                filename: payload.filename,
                anchorId: anchorId, // Store the stable ID
                pageOrder: pageOrder, // NEW: Store the physical layout order
                isComplete: false
            };
        } else {
            // Update anchorId in case the iframe was re-rendered
            if (anchorId) state.activities[payload.id].anchorId = anchorId;
            // Update pageOrder
            if (pageOrder !== 999) state.activities[payload.id].pageOrder = pageOrder;
            
            // Optionally update passScore if it was provided during a re-registration
            if (payload.passScore !== undefined) {
                state.activities[payload.id].passScore = payload.passScore;
            }
        }
        
        saveState();
        broadcastToAllFrames();
    }

    function handleActivityUpdate(payload, sourceWindow) {
        if (!payload.id) return;
        
        const anchorData = tagIframeAndGetId(sourceWindow, payload.id);
        const anchorId = anchorData.id;
        const pageOrder = anchorData.index;
        const currentData = state.activities[payload.id] || {};

        state.activities[payload.id] = {
            ...currentData,
            score: payload.score,
            max: payload.max,
            // Update passScore if provided, otherwise keep the old one
            passScore: payload.passScore !== undefined ? payload.passScore : currentData.passScore,
            title: payload.title,
            filename: payload.filename,
            anchorId: anchorId || currentData.anchorId,
            pageOrder: pageOrder !== 999 ? pageOrder : currentData.pageOrder, // NEW
            isComplete: true
        };
        
        saveState();
        broadcastToAllFrames();
        sendToMoodle();
    }

    function sendSummaryToFrame(targetWindow) {
        calculateTotals();
        targetWindow.postMessage({
            type: 'SUMMARY_DATA',
            payload: state
        }, '*');
    }

    function sendToMoodle() {
        calculateTotals();
        const message = {
            type: 'moodleSubmitGrade',
            score: state.totalScore,
            maxScore: state.totalMaxScore
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
            if (CONFIG.debug) console.log("[Tracker] >> Sent to Moodle:", message);
        }
    }

    init();
})();