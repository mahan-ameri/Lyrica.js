class Lyrica {
    constructor(lyrics, options) {
        this.lyricsText = lyrics;
        this.options = options;

        this.times = [];
        this.lines = [];
        this.linesCounts = []
        this.metadata = {};

        this.gCurrentLyric, this.lastPlayedLyric;
        this.contaScroll = true;

        this.validateInputs();
        this.parseLrc(lyrics);
    }

    validateInputs() {
        const { lyricsText } = this;
        let { options } = this;
        const validTypes = ["sync", "print", "parse"];
        const validAnimationTypes = ["scroll", "solid"];
        const defaults = {
            type: "parse",
            offset: 0,
            isAdvanced: false,
            doAdvanced: undefined,
            autoStart: true,
            animations: {
                type: "solid",
                autoScroll: true,
                wheelScroll: true,
                touchScroll: true,
                changeOnclick: true
            }
        }
        const optionsDataTypes = {
            boolean: ["isAdvanced", "doAdvanced", "autoStart"],
            string: ["type"],
            object: ["animations", "audioElement", "containerElement"],
            number: ["offset"]
        }
        const animationsDataTypes = {
            boolean: ["autoScroll", "wheelScroll", "touchScroll"],
            string: ["type", "keyframeId", "parameters"]
        }

        const checkConds = function(consArray) {
            consArray.forEach(cond => {
                if (cond[0]) {
                    throw new Error(cond[1])
                }
            })
        }
        const getRequiredOptionsByType = function() {
            switch (options.type) {
                case "parse":
                    return [];
                case "print":
                    return ['containerElement'];
                default:
                    return ['audioElement', 'containerElement'];
            }
        }


        const basicConds = [
            /*lyric*/ [typeof lyricsText !== "string", "Lyric is required and should be a string."],
            /*options*/ [!options, "Options object is required."]
        ]
        checkConds(basicConds)

        //  Validating options data types.
        for (let dtyp in optionsDataTypes) {
            optionsDataTypes[dtyp].forEach(optn => {
                if (options[optn] !== undefined && typeof options[optn] !== dtyp) {
                    throw new Error(`${optn} has to be a/an ${dtyp}.`)
                }
            })
        }

        //  Handling Default Options.
        const mergedOptions = {...defaults, ...options, animations: {...defaults.animations, ...options.animations}}
        
        options = mergedOptions;
        options.doAdvanced = options.doAdvanced === undefined ? options.isAdvanced : options.doAdvanced;

        this.options = options;
        
        //  Validating options.
        const optionsConds = [
            /*options-type*/ [options.type && !validTypes.includes(options.type), `"${options.type}" is not a valid type.\n- (Valid Types: "${validTypes.join('", "')}")`],
            /*options-animations*/ [options.animations && !validAnimationTypes.includes(options.animations.type), `"${this.options.animations.type}" is not a valid animation type.\n- (Valid Animations: "${validAnimationTypes.join('", "')}")`],
            /*options-audioElement*/ [options.audioElement && !(options.audioElement instanceof HTMLAudioElement), "Invalid audio element: Please provide a valid `<audio>` HTML element."]
        ]
        checkConds(optionsConds)

        //  Checking required options.
        const requiredOptions = getRequiredOptionsByType();
        const missingOptions = requiredOptions.filter(option => !options[option]);
        if (missingOptions.length > 0) {
            throw new Error(`Required attributes are missing: "${missingOptions.join('", "')}"`);
        }
    }

    parseLrc(lrcText) {
        const { options } = this;
        this.times = [];
        this.lines = [];
        this.metadata = {};
        let linesCounts = [];
        const entries = [];

        const lines = lrcText.split(/\r?\n|\r|\n/g);

        for (const line of lines) {
            const parsedTimeAndText = this.parseTimeAndText(line);

            if (parsedTimeAndText) {
                const { times, text, counter } = parsedTimeAndText;

                if (options.isAdvanced && options.doAdvanced) {
                    const advancedTimes = times.pop();
                    for (const time of advancedTimes) {
                        const millis = this.timeToMilliseconds(time);
                        if (!isNaN(millis)) {
                            entries.push({ time: millis })
                        }

                    }
                }

                for (const time of times) {
                    const millis = this.timeToMilliseconds(time)
                    if (!isNaN(millis)) {
                        entries.push({ time: millis, lyric: text, counter: counter })
                    }
                }
            }
        }

        entries.sort((a, b) => a.time - b.time);
        this.times = entries.map(entry => entry.time);
        this.lines = entries.filter(entry => entry.lyric !== undefined).map(entry => entry.lyric);
        linesCounts = entries.filter(entry => entry.counter !== undefined && entry.counter !== null).map(entry => entry.counter);
                
        const result = [];
        linesCounts.reduce((sum, count)=>{
            result.push([count, sum])
            return sum+=count
        }, 0)
        
        this.linesCounts = result;

        this.offset = this.options.offset ?? (Number(this.metadata.offset) || 0);

        this.typesHandler()
    }

    typesHandler() {
        const { options, times } = this;

        if (times.length == 0) return

        switch (this.options.type) {
            case "parse":
                break
            case "print":
                this.container = options.containerElement
                this.renderLyrics()
                break
            case "sync":
                this.container = options.containerElement
                this.audio = options.audioElement
                if (options.animations.type === "scroll") {
                    this.scrollSyncHandler()
                }
                this.syncLyrics()
                break
        }
    }

    scrollSyncHandler() {
        this.container.scrollTo({ top: 0 });
        let scrollEndTimer, waitToSureTimer;
        const wheel_scroll = this.options.animations.wheelScroll, touch_scroll = this.options.animations.touchScroll, change_onclick = this.options.animations.changeOnclick;

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
                        const lyricEl = this.container.querySelector(`.lyric:nth-child(${(currentIndex + 1)})`);
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
                        const lyricEl = this.container.querySelector(`.lyric:nth-child(${(currentIndex + 1)})`);
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
                    this.audio.currentTime = (Number(time) / 1000) + 0.2;
                }
            })
        }

        this.renderLyrics()
        if (this.options.animations.autoScroll) {
            let segap = this.container.querySelectorAll(".segap")
            
            segap.forEach(el => {
                el.style.height = '55.5%'
                el.style.width = "100%"
            })
        }
    }
    
    parseTimeAndText(line) {
        const { options } = this
        const timeRegex = /\[(\d+):(\d{2})\.(\d{1,5})\]/g;
        const metaRegex = /\[([a-zA-Z0-9]+):\s*([^\]]+)\]/;
        const advancedRegex = /<(\d{2}):(\d{2})\.(\d{2,3})>([^<]*)/g;
        const times = [], advancedTimes = [], texts = [];
        let match, hasTime = false, lineText, counter = null;

        //  Storing multiple line-times(not word-times)
        while ((match = timeRegex.exec(line)) !== null) {
            hasTime = true
            const [_, min, sec, ms] = match;
            times.push([min, sec, ms])
        }

        if (hasTime) {
            const lastMatch = [...line.matchAll(timeRegex)].pop();
            lineText = lastMatch ? line.slice(lastMatch.index + lastMatch[0].length) : false;            

            //  Storing word-times(advanced)
            if (lineText !== false && options.isAdvanced) {
                let match;
                
                while ((match = advancedRegex.exec(lineText)) !== null) {
                    const [_, min, sec, ms] = match;
                    advancedTimes.push([min, sec, ms]);
                    texts.push(match[4]);
                }
                if (options.doAdvanced) {
                    times.push(advancedTimes)
                }


                counter = options.doAdvanced ? texts.length + 1 : null

                if (texts.length === 0) texts.push(lineText)
            }
            const text = options.isAdvanced ? options.doAdvanced ? texts : String(texts.join('')) : lineText
            
            return { times, text, counter };
        }else if (line !== '') {
            const metaMatch = metaRegex.exec(line)
            if (metaMatch) {
                this.metadata[metaMatch[1]] = metaMatch[2];
            }
        }
        return false
    }

    timeToMilliseconds([min, sec, ms]) {
        const paddedMs = ms.padEnd(3, '0').slice(0, 3);
        return ( parseInt(min) * 60 * 1000 + parseInt(sec) * 1000 + parseInt(paddedMs) );
    }

    renderLyrics() {
        const { options, times, lines, linesCounts, offset, container} = this;
        const fragment = document.createDocumentFragment();
        
        if (options.isAdvanced) {
            for (const i in lines) {
                const elementType = options.doAdvanced ? "div" : "p"
                const p = document.createElement(elementType);
                
                if (options.doAdvanced) {
                    for (const element of lines[i]) {
                        const litt = document.createElement("p");
                        litt.textContent = element;
                        p.appendChild(litt)
                    }
                    p.setAttribute("data-time", (times[linesCounts[i][1]] - offset));
                }else {
                    p.textContent = lines[i]
                    p.setAttribute("data-time", (times[i] - offset));
                }
                p.classList.add("lyric");
                p.setAttribute("index", i);
                fragment.appendChild(p);
            }
        }else {
            for (const i in lines) {
                const p = document.createElement("p");
                p.textContent = lines[i];
                p.classList.add("lyric");
                p.setAttribute("data-time", (times[i] - offset));
                fragment.appendChild(p);
            }
        }

        container.appendChild(fragment);
    }

    syncLyrics() {
        const { options, times, lines, audio, offset } = this;
        const animationType = options.animations.type;
        const advancedState = options.isAdvanced && options.doAdvanced;
        let currentIndex = [0, 0];
        let interval;

        if (times[0] == 0) {
            this.gCurrentLyric = [lines[0], times[0], 0];
        }

        const findIndex = () => {
            const currentTime = audio.currentTime * 1000;
            let left = 0, right = times.length - 1, index = 0

            while (left <= right) {
                const mid = Math.floor((left + right) / 2)

                if ((times[mid] - offset) <= currentTime) {
                    index = mid
                    left = mid + 1
                } else {
                    right = mid - 1
                }
            }

            this.sendLyric(animationType, index, "", advancedState, true);

            currentIndex = [index, currentTime];
        };

        const sync = () => {
            clearInterval(interval);
            findIndex();
            interval = setInterval(() => {
                let currentTime = audio.currentTime * 1000;
                if (Math.abs(currentTime - currentIndex[1]) < 70) {
                    if (times[currentIndex[0]] - offset <= currentTime) {
                        this.sendLyric(animationType, currentIndex[0], currentTime, advancedState, false);
                        currentIndex = [currentIndex[0] + 1, currentTime];
                    } else {
                        currentIndex = [currentIndex[0], currentTime];
                    }
                } else {
                    findIndex();
                }
            }, 10);
        };

        const stopSync = () => {
            clearInterval(interval);
            interval = null;
        };

        this.start = () => sync();
        this.pause = () => stopSync();

        if (options.autoStart) {
            audio.addEventListener("play", sync);
            audio.addEventListener("pause", stopSync);
        }

        audio.addEventListener("seeked", findIndex);
    }

    sendLyric(mode, lineIndex, currentTime, advanced, fromFindIndex) {
        const {lines, times, container, options} = this
        const defaultSendType = () => {
            const prevLyric = container.querySelector(`.lyric`);
            if (prevLyric) { prevLyric.remove(); }
            const element = document.createElement('p');
            element.classList.add("lyric");
            element.textContent = lines[lineIndex];
            container.appendChild(element);

            clearTimeout()
        }
        const advancedDefaultSendType = () => {
            const on = container.querySelector(`.lyric`);
            let over;
            over = on ? on.getAttribute("index") : null;

            if (matched[1] == -1 || Number(over) !== matched[0]) {
                const prevLyric = container.querySelector(`.lyric`)
                if (prevLyric) { prevLyric.remove() }
                const element = document.createElement('div');
                element.classList.add("lyric")
                element.setAttribute("index", matched[0])
                for (const elc of lines[matched[0]]) {
                    const litt = document.createElement("p")
                    litt.textContent = elc
                    element.appendChild(litt)
                };
                container.appendChild(element)
            }else {
                for (let i=0; i<=matched[1]; i++) {
                    container.querySelector(`.lyric p:nth-child(${(i+1)})`).classList.add("active")
                }
            }
        }

        const scrollSendType = (isAdvanced) => {
            const pervLyric = container.querySelectorAll(".active")
            for (const lyric of pervLyric) {
                lyric.classList.add("passed");
                lyric.classList.remove("active");
            };
            const lyricI = isAdvanced ? matched[0] : lineIndex;
            if (fromFindIndex) {
                const children = container.children;
                const passed = container.querySelectorAll('.passed');
                passed.forEach(psd => {
                    psd.classList.remove("passed");
                })
                for (let i=0; i < lyricI; i++) {
                    children[i].classList.add("passed")
                }
            }
            const index = options.animations.autoScroll ? (lyricI + 1) : (lyricI);
            container.querySelector(`.lyric:nth-child(${index})`).classList.add("active")

            if (options.animations.autoScroll && this.contaScroll) {
                const containerHeight = container.offsetHeight;
                const lyricHeight = container.querySelector(`.lyric:nth-child(${(lyricI+1)})`).offsetHeight;
                const lyricTop = container.querySelector(`.lyric:nth-child(${(lyricI+1)})`).offsetTop;
                const calcTop = (lyricTop - ((containerHeight/2) - (lyricHeight/2)))
                
                container.scrollTo({
                    top: calcTop,
                    behavior: 'smooth'
                })
            }
        }
        const advancedScrollSendType = function() {
            const active = container.querySelector(`div.active`);
            let over;
            over = active ? active.getAttribute("index") : null;
            if (matched[1] == -1 || Number(over) !== matched[0]) {
                scrollSendType(true)
            }else {
                for (let i=0; i<=matched[1]; i++) {
                    container.querySelector(`.active p:nth-child(${(i+1)})`).classList.add("active")
                }
            }
        }

        const matched = advanced ? this.advancedMatchIndex(lineIndex) : false;
        if (advanced) {
            if (matched[1] == -1) {
                this.lastPlayedLyric = this.gCurrentLyric;
            }
            this.gCurrentLyric = [lines[matched[0]], times[lineIndex], matched[0]];
        }else {
            this.lastPlayedLyric = this.gCurrentLyric;
            this.gCurrentLyric = [lines[lineIndex], times[lineIndex], lineIndex];
        }

        switch (mode) {
            case "solid":
                if (advanced) {
                    advancedDefaultSendType();
                }else {
                    defaultSendType();
                }
                break;
            case "scroll":
                if (advanced) {
                    advancedScrollSendType();
                }else {
                    scrollSendType(false);
                }
                break;
        }
    }

    advancedMatchIndex(index) {
        const { times, linesCounts } = this
        
        let sum=0, resultIndex=0
        
        while (sum + linesCounts[resultIndex][0] <= index) {
            sum += linesCounts[resultIndex][0]
            resultIndex += 1
        }
        
        return [ resultIndex, (index - sum - 1) ]
        //     [line's index, word index]
    }

    searchLyric(time, exact, index) {
        const { times, lyrics, lyricsCounts, karaoke, actKaraoke } = this;
        
        function findLyric(time, index) {
            for (let i = 0; i < lyrics.length; i++) {
                const indx = karaoke && actKaraoke ? lyricsCounts[i][1] : i
                if (times[indx] > (time)) {
                    const text = karaoke && actKaraoke ? String(lyrics[(i-1)].join('')) : lyrics[(i-1)]
                    return index ? [text, i-1] : [text]
                }
            }
        }
        function findExactLyric(time, index) {
            const i = times.indexOf(time);
            const indx = karaoke && actKaraoke ? lyricsCounts[i][1] : i
            const text = (i>0 ? lyrics[indx] : false)
            return index ? [text, indx] : [text]
        }

        const timeRegex = /(\d+):(\d{2})\.(\d{2})/ , match = timeRegex.exec(time);
        let askedTime;
        if (!(match)) {
            askedTime = time;
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
        const { times, lyrics, lyricsCounts, karaoke, actKaraoke } = this;
        let matchedTimes = [];
        let matchedTimesIndexes = [];
        for (let i=0; i<lyrics.length; i++) {
            const index = karaoke && actKaraoke ? lyricsCounts[i][1] : i;
            const wanted = karaoke && actKaraoke ? String(lyrics[i].join('')) : lyrics[i];

            if (wanted === lyric) {
                matchedTimes.push(times[index]);
                matchedTimesIndexes.push(index);
            }
        }

        return index ? [matchedTimes, matchedTimesIndexes] : [matchedTimes]
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
            const { times, lyrics, lyricsCounts, audio, karaoke, actKaraoke, offset } = this;
            const currentIndex = this.gCurrentLyric?.[2] || 0;
            const dist = dis || 1;
            if (currentIndex < lyrics.length - dist) {
                const index = karaoke && actKaraoke? lyricsCounts[currentIndex + dist][1] : currentIndex + dist;
                audio.currentTime = ((times[index] - offset) / 1000) + 0.2;
                const wanted = karaoke && actKaraoke ? String(lyrics[currentIndex + dist].join('')) : lyrics[currentIndex + dist]
                return [wanted, (times[index] - offset), (currentIndex + dist)];
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
            const { times, lyrics, lyricsCounts, audio, karaoke, actKaraoke, offset } = this
            const currentIndex = this.gCurrentLyric?.[2] || 0;
            const dist = dis || 1;
            if (currentIndex >= dist) {
                const index = karaoke && actKaraoke? lyricsCounts[currentIndex - dist][1] : currentIndex - dist;
                audio.currentTime = ((times[index] - offset) / 1000) + 0.2;
                const wanted = karaoke && actKaraoke ? String(lyrics[currentIndex + dist].join('')) : lyrics[currentIndex + dist]
                return [wanted, (times[index] - offset), (currentIndex + dist)];
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
            const { times, lyrics, lyricsCounts, audio, karaoke, actKaraoke, offset} = this
            if (place.time) {
                if (place.time !== '') {
                    const lyric = this.searchLyric(place.time, false, true);
                    const index = karaoke && actKaraoke ? lyricsCounts[lyric[1]][1] : lyric[1];
                    audio.currentTime = ((times[index] - offset) / 1000) + 0.2;
                    return [lyric[0], (times[index] - offset), lyric[1]]
                }else {
                    return undefined
                }
            }else if (place.lyric) {
                let lyricText, lyricIndex;
                if (Array.isArray(place.lyric)) {
                    lyricText = String(place.lyric[0]);
                    lyricIndex = place.lyric[1] ?? 0;
                } else {
                    lyricText = String(place.lyric);
                    lyricIndex = 0;
                }
                const lyricsIndexes = this.searchTime(lyricText, true);
                if (lyricsIndexes[1].length >= 0 && lyricsIndexes[1][lyricIndex] !== undefined) {
                    audio.currentTime = ((times[lyricsIndexes[1][lyricIndex]] - offset) / 1000) + 0.2;
                    return [lyricText, (times[lyricsIndexes[1][lyricIndex]] - offset), this.karaokeMatchIndex(lyricsIndexes[1][lyricIndex])[0]];
                }else {
                    return undefined;
                }
                
            }else if (place.index) {
                if (place.index !== '' && !isNaN(place.index)) {
                    const index = karaoke && actKaraoke ? lyricsCounts[Number(place.index)][1] : Number(place.index)
                    audio.currentTime = ((times[index] - offset) / 1000) + 0.2;
                    const wanted = karaoke && actKaraoke ? String(lyrics[place.index].join('')) : lyrics[place.index]
                    return [wanted, (times[index] - offset), place.index]
                }else {
                    return undefined
                }
            }
        }else {
            console.warn("This method is only available for 'sync' type LRCs.");
        }
    }

    getData() {
        return {"lyrics": this.lyrics, "lyricsCounter": this.lyricsCounts, "times": this.times, "metadata": this.metadata}
    }
}

export default Lyrica