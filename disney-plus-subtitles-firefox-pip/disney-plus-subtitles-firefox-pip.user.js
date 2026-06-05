
// ==UserScript==
// @name         Disney+ Subtitle Fix for Firefox PiP (Hive Engine)
// @namespace    https://github.com/fabiorzfreitas/userscripts
// @version      1.0
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
    let currentCue = null;
    let observer = null;

    // Helper to find the video element and set up the native track
    function setupNativeTrack() {
        const video = document.querySelector('video');
        if (!video) return null;

        // Avoid adding multiple tracking lines if the user switches videos
        if (!nativeTrack || !video.contains(nativeTrack)) {
            const trackElement = document.createElement('track');
            trackElement.kind = 'captions';
            trackElement.label = 'PiP Fix';
            trackElement.srclang = 'en';
            trackElement.default = true;
            video.appendChild(trackElement);
            nativeTrack = trackElement.track;
            nativeTrack.mode = 'showing';
        }
        return video;
    }

    // Scrapes the text layers from the new Hive element structure
    function updateSubtitles() {
        setupNativeTrack();
        if (!nativeTrack) return;

        // Clear out the previous active cue
        if (currentCue) {
            try { nativeTrack.removeCue(currentCue); } catch(e) {}
            currentCue = null;
        }

        // Target the individual line elements inside the Hive container
        const lineElements = document.querySelectorAll('.hive-subtitle-renderer-line');
        if (lineElements.length === 0) return;

        // Extract and combine text segments (preserving line breaks)
        const textLines = Array.from(lineElements).map(el => el.innerText.trim());
        const combinedText = textLines.join('\n');

        if (combinedText) {
            const video = document.querySelector('video');
            const now = video ? video.currentTime : 0;
            
            // Create an active cue that stays alive until the next mutation replaces it
            currentCue = new VTTCue(now, now + 10, combinedText);
            nativeTrack.addCue(currentCue);
        }
    }

    // Watch the DOM tree for subtitle injections
    function initObserver() {
        if (observer) {
            observer.disconnect();
        }

        // We look for the main override wrapper region
        const targetNode = document.querySelector('timed-text-override-region');
        
        if (!targetNode) {
            // Keep looking if the stream hasn't fully buffed/loaded into view yet
            setTimeout(initObserver, 1000);
            return;
        }

        observer = new MutationObserver((mutations) => {
            updateSubtitles();
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Handle single-page app state transitions when switching videos/shows
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            initObserver();
        }
    }, 2000);

    // Initial launch execution
    initObserver();
})();