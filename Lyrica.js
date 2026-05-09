class Lyrica {
    constructor(lyrics, options) {
        this.lyricsText = lyrics;
        this.options = options;

        this.validateInputs()
    }
    validateInputs() {
        const {lyricsText, options} = this;
        const validTypes = ["sync", "print", "parse"];
        const validAnimationTypes = ["scroll", "solid"];
        const defaults = {
            type: "parse",
            offset: 0,
            isAdvanced: false,
            actAdvanced: false,
            animations: {
                type: "solid"
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
}

export default Lyrica