# 🎵 Lyrica.js
Lyrica is a lightweight and optimized JavaScript library for working with both standard and advanced `.lrc` lyric files — perfect for music players, karaoke apps, or any project that needs lyric synchronization and `.lrc` data extraction.
## ✨ Features
* Modes:
    * Sync - Render lyrics and synchronize them in real time with an HTML `<audio>` element.

    * Print - Render lyrics from `.lrc` files without syncing.

    * Extract - Parse .lrc files to get structured lyric, timing, and metadata data.

* Animations - Two styles: `normal` (static) and `slide`. Optional auto-scroll, wheel/touch scroll handling, and click-to-seek.

* Full-control - Start, pause, next, previous, go to a specific lyric/time, retrieve current lyric info in real-time.

* Search - Find a lyric by time or find the timestamp(s) for a given lyric.

## 📦 Installation
via npm
```
npm install lyrica.js
```
via CDN
```
<script src=""></script>
```
Manual

Download 'Lyrica.js' and include it in your project:
```
<script src="./Lyrica.js"></script>
```

# ☄️ Quick Start
HTML:
```
<audio id="my-audio" src="song.mp3" controls></audio>
<div class="lyrica-container"></div>
```
JavaScript
```
const example = new Lyrica("./example.lrc", {
    type: "sync",
    audio_selector: "#my-audio",
    container_selector: ".lyrica-container",
    animations: {
        animation_type: "slide",
        auto_scroll: true
    }
});
```
