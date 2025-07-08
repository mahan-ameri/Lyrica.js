class Lrc {
    constructor(path, options) {
        this.path = path;
        this.options = options;
        this.times = [];
        this.lyrics = [];
        this.metadata = {};
        this.audio = document.querySelector(this.options.audio_selector);

        this.validateInputs();
    }

    validateInputs() {
        this.validatePath();
        this.validateOptions();
        this.validateSelectors();
        this.validateAnimation();

        this.init();
    }

    validatePath() {
        if (typeof this.path !== "string" || this.path === "" && !this.options.isRaw) {
            throw new Error("File's path is required and should be a string.");
        }
        if (!this.path.endsWith(".lrc") && !this.options.isRaw) {
            throw new Error("File's path should have a valid '.lrc' format.");
        }
    }

    validateOptions() {
        if (!this.options || Object.keys(this.options).length === 0) {
            throw new Error("Options object is required.");
        }

        const validTypes = ["static-text", "static-view", "scrollable", "print", "extract"];
        if (!this.options.type || !validTypes.includes(this.options.type)) {
            throw new Error(`"${this.options.type}" is not a valid type.
+(Valid types: "${validTypes.join('", "')}")`);
        }

        const requiredOptions = this.getRequiredOptionsByType();
        const missingOptions = requiredOptions.filter(option => !this.options[option]);
        if (missingOptions.length > 0) {
            throw new Error(`Required attributes are missing: "${missingOptions.join('", "')}"`);
        }
    }

    getRequiredOptionsByType() {
        switch (this.options.type) {
            case "extract":
                return [];
            case "print":
                return ['container_selector'];
            default:
                return ['audio_selector', 'container_selector', 'monitor_selector'];
        }
    }

    validateSelectors() {
        const selectors = this.getRequiredOptionsByType();
        selectors.forEach(selector => {
            const value = this.options[selector];
            if (value && !["#", "."].includes(value.charAt(0))) {
                throw new Error(`Element selector for "${selector}" must start with "#" or ".".`);
            }
        });
    }

    validateAnimation() {
        const validAnimations = ["normal", "write", "progress"];
        if (this.options.animation && !validAnimations.includes(this.options.animation.animation_type)) {
            throw new Error(`"${this.options.animation.animation_type}" is not a valid animation type.
+(Valid animations: "${validAnimations.join('", "')}")`);
        }
    }

    static async load(path, options) {
        const LrcAsync = new Lrc(path, options);
        await LrcAsync.init();
        return LrcAsync;
    }
    async init() {
        if (!this.options.isRaw) {
            try {
                const response = await fetch(this.path);
                const lrcText = await response.text();
                this.extractLrc(lrcText);
            } catch (error) {
                console.error('Error fetching LRC:', error);
            }
        } else {
            this.extractLrc(this.path)
        }

    }

    extractLrc(lrcText) {
        this.times = [];
        this.lyrics = [];
        this.metadata = {};
        let entries = [];

        const lines = lrcText.split(/\r?\n|\r|\n/g);

        lines.forEach(line => {
            const { times, text } = this.extractTimeAndText(line);
            if (text && times.length > 0) {
                for (const timeArr of times) {
                    const millis = this.timeToMilliseconds(timeArr);
                    if (!isNaN(millis)) {
                        entries.push({ time: millis, lyric: text });
                    }
                }
            }else {
                
            }
        });

        entries.sort((a, b) => a.time - b.time);

        this.times = entries.map(entry => entry.time);
        this.lyrics = entries.map(entry => entry.lyric);

        if (this.options.type === "extract") {
            // Perform actions for 'extract' type
        } else if (this.options.type === "static-text") {
            this.syncLyrics()
        } else {
            this.renderLyrics();
        }
    }
    

    extractTimeAndText(line) {
        const timeRegex = /\[(\d+):(\d{2})\.(\d{2})\]/g;
        const metaRegex = /\[([a-zA-Z0-9]+):\s*([^\]]+)\]/;
        const times = [];
        let match, metaMatch;

        while ((match = timeRegex.exec(line)) !== null) {
            const [_, min, sec, ms] = match;
            times.push([min, sec, ms]);
        }

        const lastMatch = [...line.matchAll(timeRegex)].pop();
        const text = lastMatch ? line.slice(lastMatch.index + lastMatch[0].length) : line;

        if (!timeRegex.exec(line) && line !== '') {
            const meta = metaRegex.exec(line);
            if (meta) {
                this.metadata[meta[1]] = meta[2]
            }
    }


        return { times, text };
    }

    timeToMilliseconds([min, sec, ms]) {
        return (
            parseInt(min) * 60 * 1000 +
            parseInt(sec) * 1000 +
            parseInt(ms) * 10
        );
    }

    renderLyrics() {
        const container = document.querySelector(this.options.container_selector);
        this.lyrics.forEach(lyric => {
            const p = document.createElement("p");
            p.textContent = lyric;
            container.appendChild(p);
        });
    }

    syncLyrics() {
        const monitor = document.querySelector(this.options.monitor_selector);
        const { times, lyrics, audio } = this;
        let lastIndex = [0, 0];
        let interval;

        function CheckAll() {
            let currentTime = audio.currentTime * 1000;
                for (let i = 0; i < times.length; i++) {
                    if (times[i] <= (currentTime-700)) {
                        if (i === lastIndex[0] + 1 || i === 0) {
                            monitor.textContent = lyrics[i];
                            lastIndex[0] = i;
                        }
                    } else {
                        break;
                    }
                }
        }

        audio.addEventListener("play", () => {
            interval = setInterval(() => {
                let currentTimeMs = audio.currentTime * 1000;
                if (Math.abs(currentTimeMs-lastIndex[1])<400) {
                    if (times[lastIndex[0]]+400<=currentTimeMs) {
                        monitor.textContent = lyrics[lastIndex[0]]
                        lastIndex=[lastIndex[0]+1, currentTimeMs]
                    }else{
                        lastIndex=[lastIndex[0], currentTimeMs]
                    }
                }else {
                    lastIndex=[lastIndex[0], currentTimeMs]
                    CheckAll()
                }
            }, 10);
        });
        audio.addEventListener("pause", () => {
            clearInterval(interval)
        })
        audio.addEventListener("seeked", ()=>{
            CheckAll()
        })
    }

    searchLyric(time, exact, index) {
        const { times, lyrics } = this;
        
        function findLyric(time, index) {
            for (let i = 0; i < times.length; i++) {
                if (times[i] > (time)) {
                    return index ? [lyrics[(i-1)], i-1] : lyrics[(i-1)]
                }
            }
        }
        function findExactLyric(time, index) {
            let i = times.indexOf(time);
            let text = (i>0 ? lyrics[i] : false)
            return index ? [text, i] : text
        }

        const timeRegex = /(\d+):(\d{2})\.(\d{2})/;
        let match = timeRegex.exec(time), askedTime;
        if (!(match)) {
            askedTime = time
        }else {
            const [_, min, sec, ms] = match;
            askedTime = this.timeToMilliseconds([min, sec, ms])
        }
        if (exact) {
            return findExactLyric(askedTime, index)
        }else {
            return findLyric(askedTime, index)
        }
    }

    searchTime(lyric, index) {
        console.time("ehem")
        const { times, lyrics } = this;
        let matchedTimes = [];
        let matchedTimesIndexes = [];
        for (let i=0; i<=lyrics.length; i++) {
            if (lyrics[i] === lyric) {
                matchedTimes.push(times[i]);
                matchedTimesIndexes.push(i);
            }
        }
        let mtr = matchedTimes.length>1 ? matchedTimes : matchedTimes[0];
        let mtir = matchedTimesIndexes.length>1 ? matchedTimesIndexes : matchedTimesIndexes[0];
        return index ? [mtr, mtir] : mtr
    }

    getData() {
        return {"lyrics": this.lyrics, "times": this.times, "metadata": this.metadata}
    }
}
