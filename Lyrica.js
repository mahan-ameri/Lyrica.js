class Lyrica {
    constructor(path, options) {
        this.path = path;
        this.options = options;
        this.isRaw = this.options.isRaw || false;
        this.times = [];
        this.lyrics = [];
        this.metadata = {};
        this.gCurrentLyric, this.lastPlayedLyric;
        this.contaScroll = true;
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
        if (typeof this.path !== "string" || this.path === "" && !this.isRaw) {
            throw new Error("File's path is required and should be a string.");
        }
        if (!this.path.endsWith(".lrc") && !this.isRaw) {
            throw new Error("File's path should have a valid '.lrc' format.");
        }
    }

    validateOptions() {
        if (!this.options) {
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
        const validAnimations = ["normal", "slide"];
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
        if (!this.isRaw) {
            try {
                const response = await fetch(this.path);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
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
            }
        });

        entries.sort((a, b) => a.time - b.time);

        this.times = entries.map(entry => entry.time);
        this.lyrics = entries.map(entry => entry.lyric);

        const type = this.options.type;
        this.offset = this.options.offset ?? (Number(this.metadata?.offset) || 0);

        if (this.times.length !== 0) {
            if (type === "extract") {
                // Perform actions for 'extract' type
            } else if (type === "sync") {
                this.container = document.querySelector(this.options.container_selector)
                if (this.options.animations && this.options.animations.animation_type === "slide") {
                    this.container.scrollTo({ top: 0 });
                    let scrollEndTimer, waitToSureTimer;
                    const wheel_scroll = this.options.animations?.wheel_scroll ?? true, touch_scroll = this.options.animations?.touch_scroll ?? true, change_onclick = this.options.animations?.change_onclick ?? true;

                    if (wheel_scroll) {
                        this.container.addEventListener("wheel", () => {
                            clearTimeout(scrollEndTimer);
                            clearTimeout(waitToSureTimer);

                            if (this.contaScroll) {
                                this.contaScroll = false;
                            }

                            scrollEndTimer = setTimeout(() => {
                                waitToSureTimer = setTimeout(() => {
                                    const currentIndex = this.gCurrentLyric?.[2] || 0;
                                    const contaHeight = this.container.offsetHeight;
                                    const lyricEl = this.container.querySelector(`.lyric:nth-child(${(currentIndex + 2)})`);
                                    const lyricHeight = lyricEl.offsetHeight;
                                    const lyricTop = lyricEl.offsetTop;
                                    const calcTop = (lyricTop - ((contaHeight/2.19) - (lyricHeight/2)));

                                    this.container.scrollTo({
                                        top: calcTop,
                                        behavior: 'smooth'
                                    });
                                    this.contaScroll = true;
                                }, 2000);
                            }, 150);
                        });
                    }

                    if (touch_scroll) {
                        this.container.addEventListener("touchstart", () => {
                            clearTimeout(waitToSureTimer)
                            if (this.contaScroll) {
                                this.contaScroll = false;
                            }
                        });
                        this.container.addEventListener("touchend", () => {
                            waitToSureTimer = setTimeout(() => {
                                    const currentIndex = this.gCurrentLyric?.[2] || 0;
                                    const contaHeight = this.container.offsetHeight;
                                    const lyricEl = this.container.querySelector(`.lyric:nth-child(${(currentIndex + 2)})`);
                                    const lyricHeight = lyricEl.offsetHeight;
                                    const lyricTop = lyricEl.offsetTop;
                                    const calcTop = (lyricTop - ((contaHeight/2.19) - (lyricHeight/2)));

                                    this.container.scrollTo({
                                        top: calcTop,
                                        behavior: 'smooth'
                                    });
                                    this.contaScroll = true;
                                }, 2000);
                        });
                    }

                    if (change_onclick) {
                        this.container.addEventListener("click", (e) => {
                            const lyric = e.target.closest(".lyric");
                            if (lyric !== null) {
                                let time = lyric.getAttribute("data-time");
                                this.audio.currentTime = (time / 1000) + 0.2;
                            }
                        })
                    }

                    this.renderLyrics()
                    if (this.options.animations && this.options.animations.auto_scroll) {
                        let segap = this.container.querySelectorAll(".segap")
                        segap.forEach(el => {
                            el.style.height = '55.5%'
                            el.style.width = "100%"
                        })
                    }
                }
                this.syncLyrics()
            } else if (type === "sync") {
                this.container = document.querySelector(this.options.container_selector);
                this.syncLyrics();
            } else if (type === "print") {
                this.renderLyrics();
            }
        }else {
            console.warn("No valid lyrics found in the provided LRC file.");
        }
    }
    
    extractTimeAndText(line) {
        const timeRegex = /\[(\d+):(\d{2})\.(\d{1,5})\]/g;
        const metaRegex = /\[([a-zA-Z0-9]+):\s*([^\]]+)\]/;
        const times = [];
        let match;

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
            parseInt(min) * 60 * 1000 + parseInt(sec) * 1000 + parseInt(ms) * 10
        );
    }

    renderLyrics() {
        const { times, lyrics, offset} = this;
        const container = document.querySelector(this.options.container_selector);
        const isAutoScroll = this.options.animations && this.options.animations.auto_scroll;
        const fragment = document.createDocumentFragment();

        if (isAutoScroll) {
            const start = document.createElement('span')
            start.classList.add("segap");
            fragment.appendChild(start);
        }
        
        for (let i = 0; i < lyrics.length; i++) {
            const p = document.createElement("p");
            p.textContent = lyrics[i];
            p.classList.add("lyric");
            p.setAttribute("data-time", (times[i] - offset));
            fragment.appendChild(p);
        }

        if (isAutoScroll) {
            const end = document.createElement('span');
            end.classList.add("segap");
            fragment.appendChild(end)
        }

        container.appendChild(fragment);
    }

    syncLyrics() {
        const { times, lyrics, audio, offset} = this;
        const animationType = this.options?.animations?.animation_type || "normal";
        let lastIndex = [0, 0];
        let interval;

        if (times[0]==0) {
            this.gCurrentLyric=[lyrics[0], times[0], 0]
        }

        const CheckAll = () => {
            let currentTime = audio.currentTime * 1000;
                for (let i = 0; i < times.length; i++) {
                    if (times[(i+1)] - offset >= (currentTime) || i === (times.length - 1)) {
                        this.sendLyric(animationType, [lyrics[i], i])
                        lastIndex=[lastIndex[0], currentTime];
                        lastIndex[0] = i;
                        break;
                    }
                }
        }

        audio.addEventListener("play", () => {
            interval = setInterval(() => {
                let currentTime = audio.currentTime * 1000;
                if (Math.abs(currentTime-lastIndex[1])<70) {
                    if (times[lastIndex[0]] - offset  <=currentTime) {

                        //console.log(Math.floor(Math.abs(currentTime-lastIndex[1])), `| ${currentTime} - ${lastIndex[1]}`);

                        this.sendLyric(animationType, [lyrics[lastIndex[0]], lastIndex[0]], currentTime);
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
            const pervLyric = this.container.querySelectorAll(".active")
            pervLyric.forEach(lyric => {
                lyric.classList.remove("active")
            });
            const index = this.options.animations?.auto_scroll? (lyric[1] + 2) : (lyric[1] + 1);
            this.container.querySelector(`.lyric:nth-child(${index})`).classList.add("active")

            if (this.options.animations.auto_scroll && this.contaScroll) {
                const contaHeight = this.container.offsetHeight;
                const lyricHeight = this.container.querySelector(`.lyric:nth-child(${(lyric[1] + 2)})`).offsetHeight;
                const lyricTop = this.container.querySelector(`.lyric:nth-child(${(lyric[1] + 2)})`).offsetTop;
                const calcTop = (lyricTop - ((contaHeight/2.19) - (lyricHeight/2)))
                
                this.container.scrollTo({
                    top: calcTop,
                    behavior: 'smooth'
                })
            }
        }

        this.lastPlayedLyric = this.gCurrentLyric;
        this.gCurrentLyric = [this.lyrics[lyric[1]], this.times[lyric[1]], lyric[1]];
        switch (mode) {
            case "normal":
                defaultSendType();
                break;
            case "slide":
                slideSendType();
                break;
        }
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
            const i = times.indexOf(time);
            const text = (i>0 ? lyrics[i] : false)
            return index ? [text, i] : text
        }

        const timeRegex = /(\d+):(\d{2})\.(\d{2})/ , match = timeRegex.exec(time);
        let askedTime;
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
        const { times, lyrics } = this;
        let matchedTimes = [];
        let matchedTimesIndexes = [];
        for (let i=0; i<=lyrics.length; i++) {
            if (lyrics[i] === lyric) {
                matchedTimes.push(times[i]);
                matchedTimesIndexes.push(i);
            }
        }
        const mtr = matchedTimes;
        const mtir = matchedTimesIndexes;
        return index ? [mtr, mtir] : mtr
    }

    getCurrent() {
        if (this.options.type === "sync") {
            return this.gCurrentLyric
        } else {
            console.warn("This method is only available for 'sync' type LRCs.");
        }
    }

    next(dis) {
        if (this.options.type === "sync") {
            const currentIndex = this.gCurrentLyric?.[2] || 0;
            const dist = dis || 1;
            if (currentIndex < this.lyrics.length - dist) {
                const i =currentIndex + dist
                this.audio.currentTime = (this.times[i] / 1000) + 0.2;
                return [this.lyrics[i], this.times[i], i];
                // this.sendLyric(this.options.animations.animation_type, [this.lyrics[currentIndex + 1], currentIndex + 1]);
                // this.gCurrentLyric = [this.lyrics[currentIndex + 1], this.times[currentIndex + 1], currentIndex + 1];
            }else {
                return undefined
            }
        } else {
            console.warn("This method is only available for 'sync' type LRCs.");
        }
    }

    previous(dis) {
        if (this.options.type === "sync") {
            const currentIndex = this.gCurrentLyric?.[2] || 0;
            const dist = dis || 1;
            if (currentIndex >= dist) {
                const i = currentIndex - dist;
                this.audio.currentTime = (this.times[i] / 1000) + 0.2;
                return [this.lyrics[i], this.times[i], i];
                // this.sendLyric(this.options.animations.animation_type, [this.lyrics[currentIndex - 1], currentIndex - 1]);
                // this.gCurrentLyric = [this.lyrics[currentIndex - 1], this.times[currentIndex - 1], currentIndex - 1];
            }else {
                return undefined
            }
        } else {
            console.warn("This method is only available for 'sync' type LRCs.");
        }
    }

    last() {
        if (this.options.type === "sync") {
            if (this.lastPlayedLyric === undefined || this.lastPlayedLyric === null) {
                return undefined;
            }else {
                this.audio.currentTime = (this.lastPlayedLyric[1] / 1000) + 0.2;
                return this.lastPlayedLyric;
            }
        }else {
            console.warn("This method is only available for 'sync' type LRCs.");
        }
    }

    goTo(place) {
        if (this.options.type === "sync") {
            if (place.time) {
                if (place.time !== '') {
                   const lyric = this.searchLyric(place.time, false, true);
                    this.audio.currentTime = (this.times[lyric[1]] / 1000) + 0.2;
                    return [lyric[0], this.times[lyric[1]], lyric[1]]
                }else {
                    return undefined
                }
            }else if (place.lyric) {
                let lyricText, lyricIndex;
                if (Array.isArray(place.lyric)) {
                    lyricText = String(place.lyric[0]);
                    lyricIndex = place.lyric[1] || 0;
                } else {
                    lyricText = String(place.lyric);
                    lyricIndex = 0;
                }
                const lyricsIndexes = this.searchTime(lyricText, true);
                if (lyricsIndexes[1].length >= 0 && lyricsIndexes[1][lyricIndex] !== undefined) {
                    this.audio.currentTime = (this.times[lyricsIndexes[1][lyricIndex]] / 1000) + 0.2;
                    return [lyricText, this.times[lyricsIndexes[1][lyricIndex]], lyricsIndexes[1][lyricIndex]];
                }else {
                    return undefined;
                }
                
            }else if (place.index) {
                if (place.index !== '' && !isNaN(place.index)) {
                    this.audio.currentTime = (this.times[Number(place.index)] / 1000) + 0.2;
                    return [this.lyrics[place.index], this.times[place.index], place.index]
                }else {
                    return undefined
                }
            }
        }else {
            console.warn("This method is only available for 'sync' type LRCs.");
        }
    }

    getData() {
        return {"lyrics": this.lyrics, "times": this.times, "metadata": this.metadata}
    }
}
