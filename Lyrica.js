class Lyrica {
    constructor(lyrics, options) {
        this.lyricsText = lyrics;
        this.options = options;

        this.times = [];
        this.lines = [];
        this.metadata = {};
        this.linesCounts = [];

        this.validateInputs()
        this.parseLrc(lyrics)   
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
            actAdvanced: 'isAdvanced value',
            animations: {
                type: "solid",
                autoScroll: true,
                wheelScroll: true,
                touchScroll: true,
                changeOnclick: true
            }
        }
        const optionsDataTypes = {
            boolean: ["isAdvanced", "actAdvanced", "autoStart"],
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
        options.actAdvanced = options.isAdvanced;

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

        for (const line in lines) {
            const parsedTimeAndText = this.parseTimeAndText(lines[line]);

            if (parsedTimeAndText) {
                const { times, text, counter } = parsedTimeAndText;

                if (options.isAdvanced && options.actAdvanced) {
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
        
        this.offset = this.options.offset ?? (Number(this.metadata?.offset) || 0);
        
        const result = [];
        linesCounts.reduce((sum, count)=>{
            result.push([count, sum])
            return sum+=count
        }, 0)
        console.log(result);
        
        this.linesCounts = result;

        this.typesHandler()
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
                if (texts.length === 0) texts.push(lineText)
                if (options.actAdvanced) {
                    times.push(advancedTimes)
                }

                counter = options.actAdvanced ? texts.length + 1 : null
            }
            const text = options.isAdvanced ? options.actAdvanced ? texts : String(texts.join('')) : lineText
            
            return { times, text, counter };
        }else if (line !== '') {
            const metaMatch = metaRegex.exec(line)
            if (metaMatch) {
                this.metadata[metaMatch[1]] = metaMatch[2];
                return false
            }
        }
    }

    timeToMilliseconds([min, sec, ms]) {
        const paddedMs = ms.padEnd(3, '0').slice(0, 3);
        return ( parseInt(min) * 60 * 1000 + parseInt(sec) * 1000 + parseInt(paddedMs) );
    }

    typesHandler() {
        const { type, containerElement, audioElement, animations } = this.options, { times } = this
        if (times.length === 0 || type === 'parse') return

        this.container = containerElement
        this.audio = audioElement

        switch(type) {
            case 'sync':
                if (animations.type === 'slide') this.syncScrollHnadler()
                this.renderLyrics()
                break
            case 'print':
                this.renderLyrics()
                break
        }
    }

    syncScrollHnadler() {
        const { wheelScroll, touchScroll, changeOnclick} = this.options.animations 

        this.container.scrollTo({ top: 0 });

        if (wheel_scroll) {
            let scrollEndTimer, waitToSureTimer;

        }
    }

    renderLyrics() {
        const { times, lines, linesCounts, container, offset} = this, { isAdvanced, actAdvanced } = this.options;
        const fragment = document.createDocumentFragment();

        //there's a bug here
        if (isAdvanced) {
            const elementType = actAdvanced ? 'div' : 'p';
            for (const lineNumber in lines) {
                const line = document.createElement(elementType);
                if (actAdvanced) {
                    lines[lineNumber].forEach(element => {
                        const wordP = document.createElement('p')
                        wordP.textContent = element
                        line.appendChild(wordP)
                    })
                    line.setAttribute("data-time", (times[linesCounts[lineNumber][1]] - offset))
                }else {
                    line.textContent = lyrics[lineNumber]
                    line.setAttribute("data-time", (times[lineNumber] - offset))
                }
                line.classList.add('line')
                line.setAttribute("index", lineNumber)
                this.container.appendChild(line)
            }
        }else {
            for (const lineNumber in lines) {
                const line = document.createElement("p")
                line.textContent = lyrics[lineNumber];
                line.classList.add("lyric");
                line.setAttribute("data-time", (times[lineNumber] - offset));
                container.appendChild(p);
            }
        }
    }
}
export default Lyrica