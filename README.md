<h4 align="center">
  <a href="https://mahan-ameri.github.io/Lyrica.js/">Demo</a> |
  <a href="https://www.npmjs.com/package/lyrica">npm</a> |
  <a href="#basic-usage">Documentation</a>
</h4>

# Lyrica.js

Lyrica.js is an open-source JavaScript library for working with `.lrc` lyric text.
It can parse lyrics, synchronize them with audio, render them in the browser, and extract structured lyric data.

The API is still evolving, so some details may continue to change.
This README matches the current `Lyrica.js` source in the repository.

![preview](https://github.com/user-attachments/assets/3f9ba634-4e7e-432e-9863-c7f9bd199531)

## Features
* Sync: render lyrics and synchronize them with an HTML `<audio>` element.
* Print: render lyrics from `.lrc` text without syncing playback.
* Parse: extract structured lyric, timing, and metadata data.
* Rendering: supports `solid` and `scroll` modes, with optional auto-scroll, wheel/touch scroll handling, and click-to-seek.
* Playback control: start, pause, move to the next or previous lyric, jump to a lyric or time, and read the current lyric state.
* Search: find a lyric by time or locate one or more timestamps for a given lyric.

## Installation
#### via npm
```console
npm i lyrica
```

#### Manual

Download `Lyrica.umd.js` from the latest release in the **Releases** section [here](https://github.com/mahan-ameri/Lyrica.js/releases).
```html
<script src="./Lyrica.umd.js"></script>
```

# Quick Start
HTML:
```html
<audio id="my-audio" src="song.mp3" controls></audio>
<div class="lyrica-container"></div>
```

JavaScript:
```javascript
const response = await fetch("./example.lrc");
const rawLyrics = await response.text();
//  Or any other way to get the raw text

const player = document.querySelector("#my-audio");
const lyricsBox = document.querySelector(".lyrica-container");

const example = new Lyrica(rawLyrics, {
    type: "sync",
    audioElement: player,
    containerElement: lyricsBox,
    animations: {
        type: "scroll",
        autoScroll: true
    }
});
```

# Basic Usage
```javascript
const example = new Lyrica(lyrics, options)
```

## Input
The first parameter is raw `.lrc` text.
If you want to use a file, load the file yourself first and pass its contents into the constructor.

## Options
The second parameter is an options object that configures the class.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| type | string | `"parse"` | `"sync"`, `"print"`, or `"parse"` |
| audioElement | HTMLAudioElement | - | The `<audio>` element used for sync mode; required for `sync` |
| containerElement | HTMLElement | - | The lyrics container element; required for `print` and `sync` |
| isAdvanced | boolean | false | Enable advanced timing parsing for word-level lyrics |
| doAdvanced | boolean | `isAdvanced` value | Render advanced timing segments as separate lyric parts |
| offset | number | inset `.lrc` offset / `0` | Adjust lyric timing in milliseconds |
| autoStart | boolean | true | Automatically start syncing when the audio plays |
| animations | object | - | Animation settings used by sync rendering |

### Animations

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| type | string | `"solid"` | `solid` or `scroll` |
| autoScroll | boolean | true | Automatically scroll to the active lyric |
| wheelScroll | boolean | true | ... |
| touchScroll | boolean | true | ... |
| changeOnclick | boolean | true | Clicking a lyric seeks the audio to that lyric |

### Options Object Structure

```javascript
{
  type: "sync" | "print" | "parse", // Required
  audioElement: htmlAudio, // Required for "sync"
  containerElement: lyricsBox, // Required for "print" and "sync"
  isAdvanced: false, // Optional
  doAdvanced: false, // Optional
  autoStart: true, // Optional
  offset: 0, // Optional
  animations: { // Optional
    type: "solid" | "scroll",
    autoScroll: true,
    wheelScroll: true,
    touchScroll: true,
    changeOnclick: true
  }
}
```

---------
## Methods
### Core Methods

| Method | Parameters | Return Value | Description | Example |
|--------|------------|--------------|-------------|----------|
| `getData()` | None | Object | Returns the parsed lyric data: `lines`, `linesCounts`, `times`, and `metadata` | `example.getData()` |
| `getCurrent()` | None | Array | Returns the current lyric info as `[text, time, index]`. Only works in `sync` mode | `example.getCurrent()` |
| `start()` | None | None | Starts syncing lyrics with audio. Only works in `sync` mode | `example.start()` |
| `pause()` | None | None | Pauses lyric syncing. Only works in `sync` mode | `example.pause()` |

### Navigation Methods

| Method | Parameters | Return Value | Description | Example |
|--------|------------|--------------|-------------|----------|
| `next(distance)` | `distance`: Number (optional) | Array/undefined | Jumps to the next lyric. Returns `[text, time, index]` or `undefined` | `example.next()` or `example.next(2)` |
| `previous(distance)` | `distance`: Number (optional) | Array/undefined | Jumps to the previous lyric. Returns `[text, time, index]` or `undefined` | `example.previous()` or `example.previous(2)` |
| `last()` | None | Array/undefined | Returns to the last played lyric. Returns `[text, time, index]` or `undefined` | `example.last()` |
| `goTo(place)` | `place`: Object | Array/undefined | Jumps to a specific position by `time`, `lyric` text, or `index` | `example.goTo({time: "1:30.00"})` |

### Search Methods

| Method | Parameters | Return Value | Description | Example |
|--------|------------|--------------|-------------|----------|
| `searchLyric(time, exact, index)` | `time`: String/Number<br>`exact`: Boolean<br>`index`: Boolean | Array | Finds the lyric that matches or precedes a timestamp | `example.searchLyric("1:30.00", false, true)` |
| `searchTime(lyric, index)` | `lyric`: String<br>`index`: Boolean | Array | Finds the timestamp(s) for a given lyric text | `example.searchTime("Hello", true)` |

---------
## CSS Classes
* Each lyric line is rendered inside an element with the class `.lyric` (applies to both solid and scroll modes).
* Active state:
    * In scroll mode: the current line or current word (in advanced) receives the `.active` class.
    * In solid mode: only the current word receives the `.active` class.
* Passed lines: any line that has already been played is marked with the `.passed` class. (only in "scroll")
* Tag types:
    * By default (no advanced), each line is a `<p>` element in both solid and scroll modes.
    * When `isAdvanced: true` and `doAdvanced: true`, each word inside the line is wrapped in a `<p>` for fine-grained advanced highlighting.
* In `advanced + doAdvanced`, the line itself still has the `.lyric` class, but instead of plain text, its words are split into `<p>`s so timing can highlight each word individually.

---------
# License
MIT License © mahan-ameri

---
