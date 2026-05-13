/**
 * ACTIVITY CLIENT
 * Put this file IN THE SAME FOLDER as your HTML files.
 */

window.ActivityClient = {
    /**
     * Generates a clean ID based on document title.
     */
    generateAutoId: function() {
        try {
            let rawTitle = document.title;
            if (rawTitle && rawTitle.trim() !== "") {
                return rawTitle.trim()
                    .replace(/[^a-zA-Z0-9\s]/g, '')
                    .replace(/\s+/g, '_')
                    .toLowerCase();
            }
            let path = window.location.pathname;
            path = path.replace(/\.[^/.]+$/, "");
            let urlId = path.replace(/[^a-zA-Z0-9]/g, "_");
            return urlId.replace(/^_+|_+$/g, "");
        } catch (e) {
            return "unknown_" + Math.random().toString(36).substr(2, 5);
        }
    },

    getFilename: function() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1);
    },

    /**
     * Registers activity metadata immediately (without sending a score).
     * This allows the Tracker to know the max score before the user finishes.
     */
    registerActivity: function(maxScore) {
        const id = this.generateAutoId();
        const message = {
            type: 'REGISTER_ACTIVITY',
            payload: {
                id: id,
                title: document.title,
                maxScore: parseFloat(maxScore),
                filename: this.getFilename()
            }
        };
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
        }
    },

    /**
     * Sends the calculated score when the user submits.
     */
    sendScore: function(id, score, maxScore) {
        const finalId = id ? id : this.generateAutoId();
        const message = {
            type: 'ACTIVITY_UPDATE',
            payload: {
                id: finalId,
                score: parseFloat(score),
                max: parseFloat(maxScore), // Sending as 'max' for tracker compatibility
                title: document.title,
                filename: this.getFilename()
            }
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
            console.log(`[Client] Sent score for [${finalId}]: ${score}/${maxScore}`);
        } else {
            console.warn("[Client] No parent window detected.");
        }
    }
};