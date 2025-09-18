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
```console
npm i lyrica
```
#### Manual

 Download `Lyrica.umd.js` from `dist` folder and include it in your project:
```html
<script src="./Lyrica.umd.js"></script>
```

# ☄️ Quick Start
HTML:
```html
<audio id="my-audio" src="song.mp3" controls></audio>
<div class="lyrica-container"></div>
```
JavaScript
```javascript
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

### Animations

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| animation_type | string | "normal" | "normal" or "slide" |  
| auto_scroll | boolean | false | Automatically scroll to the active lyric (only in "slide") |
| wheel_scroll | boolean | true | Enable mouse-wheel scrolling within sync scroll constraints (only in "slide") |
| touch_scroll | boolean | true | Enable touch scrolling within sync scroll constraints (only in "slide") |
| change_onclick | boolean | true | Clicking a lyric seeks audio (only in "slide") |
| keyframe_id | string | "LyricaLyricIn" | The name of a CSS keyframe animation that will be applied only when a lyric becomes active in "normal" mode. |
| animation_parameters | string | 'ease-out 0.2s' | Additional parameters passed to the animation call |

### Options Object Structure

```javascript
{
  type: "sync" | "print" | "extract", // Required
  audio_selector: "#audio", // Required for "sync" type
  container_selector: "#lyrics", // Required for "sync" and "print" types
  isKaraoke: false, // Optional
  actKaraoke: false, // Optional
  isRaw: false, // Optional
  autoStart: true, // Optional
  offset: 0, // Optional
  animations: { // Optional
    animation_type: "normal" | "slide",
    animation_parameters: "ease-out 0.2s",
    keyframe_id: "LyricaLyricIn",
    auto_scroll: true,
    wheel_scroll: true,
    touch_scroll: true
  }
}
``` 
---------
## Methods

### Constructor and Static Methods

| Method | Parameters | Description | Example |
|--------|------------|-------------|----------|
| `constructor(path, options)` | `path`: String<br>`options`: Object | Initializes a new Lyrica instance with the given LRC file path and options | `new Lyrica("lyrics.lrc", {type: "sync"})` |
| `static load(path, options)` | `path`: String<br>`options`: Object | Asynchronously creates and initializes a Lyrica instance | `await Lyrica.load("lyrics.lrc", {type: "sync"})` |

### Core Methods

| Method | Parameters | Return Value | Description | Example |
|--------|------------|--------------|-------------|----------|
| `getData()` | None | Object | Returns all lyrics data including times, lyrics text, and metadata | `example.getData()` |
| `getCurrent()` | None | Array | Returns current lyric info `[text, time, index]`. Only works in "sync" mode | `example.getCurrent()` |
| `start()` | None | None | Starts syncing lyrics with audio. Only works in "sync" mode | `example.start()` |
| `pause()` | None | None | Pauses lyric syncing. Only works in "sync" mode | `example.pause()` |

### Navigation Methods

| Method | Parameters | Return Value | Description | Example |
|--------|------------|--------------|-------------|----------|
| `next(distance)` | `distance`: Number (optional) | Array/undefined | Jumps to next lyric. Returns `[text, time, index]` or `undefined` | `example.next()` or `example.next(2)` |
| `previous(distance)` | `distance`: Number (optional) | Array/undefined | Jumps to previous lyric. Returns `[text, time, index]` or `undefined` | `example.previous()` or `example.previous(2)` |
| `last()` | None | Array/undefined | Returns to last played lyric. Returns `[text, time, index]` or `undefined` | `example.last()` |

### Search Methods

| Method | Parameters | Return Value | Description | Example |
|--------|------------|--------------|-------------|----------|
| `searchLyric(time, exact, index)` | `time`: String/Number<br>`exact`: Boolean<br>`index`: Boolean | Array | Finds lyrics by timestamp | `example.searchLyric("1:30.00", false, true)` |
| `searchTime(lyric, index)` | `lyric`: String<br>`index`: Boolean | Array | Finds timestamp(s) for given lyric text | `example.searchTime("Hello", true)` |
| `goTo(place)` | `place`: Object | Array/undefined | Jumps to specific position by time, lyric text, or index | `example.goTo({time: "1:30.00"})` |

--------
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

---------
# 🎁 Support This Project

If you find this project useful and would like to support its journey, consider sending a small donation— I’d be truly grateful. ✨

### EVM Wallet (MetaMask):

```
0x22aDc02620D92973705F0274F6b0A5D8718b54B7
```
\- ✅ Supports Ethereum, Polygon, BNB Chain, and other EVM networks

### Bitcoin:
```
bc1ql3p5a9fgssrqqsu4mf6ckqk4xxkn74p6gqpqj9
```


# 📝 License
MIT License © mahan-ameri

---
