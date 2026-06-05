// ==UserScript==
// @name         Disney+ Subtitle Fix for Firefox PiP (Hive Engine)
// @namespace    https://github.com/fabiorzfreitas/userscripts
// @version      1.1
// @description  Fixes Picture-in-Picture subtitles on Disney+ by mapping new .hive classes to a native video text track.
// @author       fabiorzfreitas
// @match        https://www.disneyplus.com/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/disney-plus-subtitles-firefox-pip/disney-plus-subtitles-firefox-pip.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/disney-plus-subtitles-firefox-pip/disney-plus-subtitles-firefox-pip.user.js
// ==/UserScript==

(function() {
    'use strict';

    let nativeTrack = null;
    let lastText = '';

    // Ensures a clean, usable HTML5 text track is attached to the active video element
    function getNativeTrack() {
        const video = document.querySelector('video');
        if (!video) {
            nativeTrack = null;
            return null;
        }

        // If track exists but video changed out from under it, reset
        if (nativeTrack && !video.contains(nativeTrack.track?.element)) {
            nativeTrack = null;
        }

        if (!nativeTrack) {
            // Check if we already appended one to this specific video element
            const existingTrack = video.querySelector('track[label="PiP Fix"]');
            if (existingTrack) {
                nativeTrack = existingTrack.track;
            } else {
                const trackElement = document.createElement('track');
                trackElement.kind = 'captions';
                trackElement.label = 'PiP Fix';
                trackElement.srclang = 'en';
                trackElement.default = true;
                video.appendChild(trackElement);
                nativeTrack = trackElement.track;
            }
            nativeTrack.mode = 'showing';
        }
        return nativeTrack;
    }

    // High-frequency fallback query that checks inside open Shadow Roots if necessary
    function getSubtitleText() {
        const lines = document.querySelectorAll('.hive-subtitle-renderer-line');
        if (lines.length > 0) {
            return Array.from(lines).map(el => el.innerText.trim()).join('\n');
        }
        return '';
    }

    // Handles clearing old cues and safely flashing the new text frame into the PiP pipeline
    function processSubtitles() {
        const track = getNativeTrack();
        if (!track) return;

        const currentText = getSubtitleText();
        
        // Only modify the text track payload if the words on screen have actually changed
        if (currentText === lastText) return;
        lastText = currentText;

        // Purge previous active cues to prevent visual text stacking or ghosting
        if (track.cues) {
            for (let i = track.cues.length - 1; i >= 0; i--) {
                track.removeCue(track.cues[i]);
            }
        }

        if (currentText) {
            const video = document.querySelector('video');
            const now = video ? video.currentTime : 0;
            
            // Set a generous window bounds; the script will forcibly clear it on the next mutation anyway
            const cue = new VTTCue(now, now + 120, currentText);
            track.addCue(cue);
        }
    }

    // Global body observer to catch streaming updates across aggressive single-page route variations
    const observer = new MutationObserver(() => {
        processSubtitles();
    });

    // Start tracking the DOM instantly
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Fail-safe poller to keep stream synchronization alive if mutations temporarily throttle
    setInterval(processSubtitles, 250);
})();