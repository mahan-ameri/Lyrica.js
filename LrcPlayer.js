class Lrc {
    constructor(path, options) {
        this.path = path;
        this.options = options;
        this.times = [];
        this.lyrics = [];
        this.metadata = {};
        this.gCurrentLyric;
        this.contaScroll = true, this.IsSystemScroll = false;
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

        const validTypes = ["sync", "print", "extract"];
        if (!this.options.type || !validTypes.includes(this.options.type)) {
            throw new Error(`"${this.options.type}" is not a valid type.\n- (Valid types: "${validTypes.join('", "')}")`);
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
                return ['audio_selector', 'container_selector'];
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
        const validAnimations = ["normal", "write", "progress", "slide"];
        if (this.options.animations && !validAnimations.includes(this.options.animations.animation_type)) {
            throw new Error(`"${this.options.animations.animation_type}" is not a valid animation type.\n- (Valid animations: "${validAnimations.join('", "')}")`);
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
            if (times.length > 0) {
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

        let type = this.options.type;

        if (type === "extract") {
            // Perform actions for 'extract' type
        } else if (type === "sync" && this.options.animations && this.options.animations.animation_type === "slide") {
            this.container = document.querySelector(this.options.container_selector)
            this.container.scrollTo({ top: 0 });
            let scrollEndTimer, waitToSureTimer;

            this.container.addEventListener("scroll", () => {
                clearTimeout(scrollEndTimer);
                clearTimeout(waitToSureTimer);
                
                if (this.contaScroll && !this.IsSystemScroll) {
                    this.contaScroll = false;
                };
                
                scrollEndTimer = setTimeout(() => {
                    waitToSureTimer = setTimeout(() => {
                        let contaHeight = this.container.offsetHeight;
                        let lyricHeight = this.container.querySelector(".lyric").offsetHeight;
                        let calcTop = (((((this.gCurrentLyric?.[2] || 0)+0.6)*lyricHeight) + contaHeight/1.8) - (contaHeight/2));

                        this.container.scrollTo({
                            top: calcTop,
                            behavior: 'smooth'
                        })

                        this.contaScroll = true;
                    }, 2000);
                }, 150);
            });

            this.renderLyrics()
            if (this.options.animations && this.options.animations.auto_scroll) {
                let segapHeight = (this.container.offsetHeight)/1.8;
                let segap = this.container.querySelectorAll(".segap")
                segap.forEach(el => {
                    el.style.height = segapHeight+'px'
                    el.style.width = "100%"
                })
            }

            this.syncLyrics()
        } else if (type === "sync") {
            this.container = document.querySelector(this.options.container_selector);
            this.syncLyrics();
        } else if (type === "print") {
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
        let isAutoScroll = this.options.animations && this.options.animations.auto_scroll
        if (isAutoScroll) {
            let start = document.createElement('span')
            start.classList.add("segap");
            container.appendChild(start);
        }
        
        this.lyrics.forEach(lyric => {
            const p = document.createElement("p");
            p.textContent = lyric;
            p.classList.add("lyric");
            container.appendChild(p);
        });

        if (isAutoScroll) {
            let end = document.createElement('span');
            end.classList.add("segap");
            container.appendChild(end)
        }
    }

    syncLyrics() {
        const { times, lyrics, audio} = this;
        const animationType = this.options?.animations?.animation_type || "normal";
        let lastIndex = [0, 0];
        let interval;

        if (times[0]==0) {
            this.gCurrentLyric=[lyrics[0], times[0], 0]
        }

        const CheckAll = () => {
            console.log("called");
            
            let currentTime = audio.currentTime * 1000;
                for (let i = 0; i < times.length; i++) {
                    if (times[(i+1)] >= (currentTime)) {
                        this.sendLyric(animationType, [lyrics[i], i])
                        this.gCurrentLyric = [lyrics[i], times[i], i];
                        lastIndex=[lastIndex[0], currentTime];
                        lastIndex[0] = i;
                        break
                    }
                }
        }

        audio.addEventListener("play", () => {
            interval = setInterval(() => {
                let currentTime = audio.currentTime * 1000;
                if (Math.abs(currentTime-lastIndex[1])<70) {
                    if (times[lastIndex[0]]+400<=currentTime) {

                        console.log(Math.floor(Math.abs(currentTime-lastIndex[1])), `| ${currentTime} - ${lastIndex[1]}`);

                        this.sendLyric(animationType, [lyrics[lastIndex[0]], lastIndex[0]], currentTime);
                        this.gCurrentLyric = [lyrics[lastIndex[0]], times[lastIndex[0]], lastIndex[0]];
                        lastIndex=[lastIndex[0]+1, currentTime];
                    }else{
                        lastIndex=[lastIndex[0], currentTime];
                    }
                }else {
                    CheckAll(currentTime);
                }
            }, 10);
        });
        audio.addEventListener("pause", () => {
            clearInterval(interval);
        });
        audio.addEventListener("seeked", () => {
            CheckAll()
        })

    }

    sendLyric(mode, lyric, currentTime) {
        const defaultSendType = () => {
            const prevLyric = this.container.querySelector(`.lyric`);
            if (prevLyric) { prevLyric.remove(); }
            const el = document.createElement('p');
            el.classList.add("lyric");
            el.textContent = lyric[0];
            this.container.appendChild(el);
            el.style.animation=`${this.options?.animations?.keyframe_id || 'LrcLyricIn'} ${this.options?.animations?.animation_parameters || 'ease-out 0.2s'}`;

            clearTimeout()
            /*
            let wait = ((Number(this.times[(lyric[1]+1)]) - Number(currentTime)))
            setTimeout(()=>{
                el.style.animation="0.2s LrcLyricOut ease-in forwards"
            }, wait)*/
        }

        const slideSendType = () => {
            let pervLyric = this.container.querySelectorAll(".active")
            pervLyric.forEach(lyric => {
                lyric.classList.remove("active")
            });

            this.container.querySelector(`.lyric:nth-child(${(lyric[1] + 2)})`).classList.add("active")

            if (this.options.animations.auto_scroll && this.contaScroll) {
                let contaHeight = this.container.offsetHeight;
                let lyricHeight = this.container.querySelector(".lyric").offsetHeight;

                let calcTop = ((((lyric[1]+0.6)*lyricHeight) + contaHeight/1.8) - (contaHeight/2))

                this.IsSystemScroll = true;
                
                this.container.scrollTo({
                    top: calcTop,
                    behavior: 'smooth'
                })
                setTimeout(()=>{this.IsSystemScroll = false}, 1000)
            }
        }

        switch (mode) {
            case "normal":
                defaultSendType();
                break;
            case "slide":
                slideSendType();
                break;
        }
    }

    /**
     * Searches for a lyric line based on the provided time.
     *
     * @param {number|string} time - The time to search for. Can be a number (milliseconds) or a string in the format "mm:ss.xx".
     * @param {boolean} exact - If true, searches for an exact match of the time; otherwise, finds the closest previous lyric.
     * @param {boolean} [index=false] - If true, returns an array with the lyric and its index; otherwise, returns only the lyric text.
     * @returns {string|[string, number]|false} The lyric text, or an array [lyric, index] if `index` is true. Returns `false` if no exact match is found.
     */
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

    getCurrent() {
        //debugger
        if (this.options.type === "sync") {
            return this.gCurrentLyric
        }
    }

    getData() {
        return {"lyrics": this.lyrics, "times": this.times, "metadata": this.metadata}
    }
}
