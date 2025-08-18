# 🎵 Lyrica.js
Lyrica is a lightweight and optimized JavaScript library for working with both standard and advanced `.lrc` lyric files — perfect for music players, karaoke apps, or any project that needs lyric synchronization and `.lrc` data extraction.

![preview](https://github.com/user-attachments/assets/3f9ba634-4e7e-432e-9863-c7f9bd199531)
## ✨ Features
* Modes:
    * Sync - Render lyrics and synchronize them in real time with an HTML `<audio>` element.

    * Print - Render lyrics from `.lrc` files without syncing.

    * Extract - Parse .lrc files to get structured lyric, timing, and metadata data.

* Animations - Two styles: `normal` (static) and `slide`. Optional auto-scroll, wheel/touch scroll handling, and click-to-seek.

* Full-control - Start, pause, next, previous, go to a specific lyric/time, retrieve current lyric info in real-time.

* Search - Find a lyric by time or find the timestamp(s) for a given lyric.

## 📦 Installation
#### via npm
```
npm i lyrica
```
#### Manual

 Download `Lyrica.umd.js` from `dist` folder and include it in your project:
```
<script src="./Lyrica.umd.js"></script>
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

# 🏫 Basic Usage
## Path
The first parameter is a string that can be either a `.lrc` file path or raw `.lrc` text. (required)

## Options
The second parameter is an options object that configures the class.(required)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| type | string | - | "sync", "print, "extract" (required) |
| isRaw | boolean | false | Pass raw `.lrc` text instead of file path |
| offset | number | inset `.lrc` offset / 0 | Adjust lyric timing in millisecond |
| audio_selector | string | - | CSS selector for `<audio>` element (required for "sync") |
| container_selector | string | - | CSS selector for lyrics container (required for "sync")|
| animations | object | - | Animation settings (see below) |
| isKaraoke | boolean | false | Enable advanced timing parse |
| actKaraoke | boolean | isKaraoke's value | Whether to actively display karaoke segment |

## Animations

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| animation_type | string | "normal" | "normal" or "slide" |  
| auto_scroll | boolean | false | Automatically scroll to the active lyric (only in "slide") |
| wheel_scroll | boolean | true | Enable mouse-wheel scrolling within sync scroll constraints (only in "slide") |
| touch_scroll | boolean | true | Enable touch scrolling within sync scroll constraints (only in "slide") |
| change_onclick | boolean | true | Clicking a lyric seeks audio (only in "slide") |
| keyframe_id | string | "LyricaLyricIn" | The name of a CSS keyframe animation that will be applied only when a lyric becomes active in "normal" mode. |
| animation_parameters | string | 'ease-out 0.2s' | Additional parameters passed to the animation call |

## CSS Classes
* Each lyric line is rendered inside an element with the class `.lyric` (applies to both normal and slide modes).
* Active state:
    * In slide mode: the current line or current word (in karaoke) receives the `.active` class.
    * In normal mode: only the current word receives the `.active` class.
* Passed lines: any line that has already been played is marked with the `.passed` class. (only in "slide")
* Tag types:
    * By default (no karaoke), each line is a `<p>` element in both normal and slide modes.
    * When `isKaraoke: true` and `actKaraoke: true`, each word inside the line is wrapped in a `<span>` for fine-grained karaoke highlighting.
* In `karaoke + actKaraoke`, the line itself still has the `.lyric` class, but instead of plain text, its words are split into `<span>`s so timing can highlight each word individually.
# 📝 License
MIT License © mahan-ameri

---