 // TODO:
// IMPLEMENTATION NOT DONE (CTRL+F)
// l.legs == light legs; h.fireball = 236HP not 236*P etc
// [state] [strength] [attack] (crouching heavy punch, standing light kick, standing short, towards fierce?)
// numOfHits (1)
const notation = require("./notation.json")

// custom user defined moves; special moves, unique attacks, game-specific information...
// objects of movelists from specific fighting games could be added (sfv)
let customTranslations = {
    "Shoryuken": {
        "input" : {
            "numpadInput" : "623",
            "strength" : "*",
            "attack" : "Punch"
        },
        "moveType" : "motion",
        "aliases" : ["dp", "shoryu"]
    },
    "Tatsumaki Senpukyaku": {
        "input" : {
            "numpadInput" : "214",
            "strength" : "*",
            "attack" : "Kick"
        },
        "moveType" : "motion",
        "aliases" : ["tatsu", "hurricane"]
    },
    "Spinning Bird Kick": {
        "input" : {
            "numpadInput" : "[2]8",
            "strength" : "*",
            "attack" : "Kick"
        },
        "moveType" : "charge",
        "aliases" : ["sbk"]
    },
    "Lightning Legs": {
        "input" : {
            "numpadInput" : "236",
            "strength" : "*",
            "attack" : "Kick"
        },
        "moveType" : "motion",
        "aliases" : ["legs", "hyak"]
    },
    "Donkey Kick": {
        "input" : {
            "numpadInput" : "41236",
            "strength" : "*",
            "attack" : "Kick"
        },
        "moveType" : "motion",
        "aliases" : ["dk"]
    },
    "Hadoken": {
        "input" : {
            "numpadInput" : "236",
            "strength" : "*",
            "attack" : "Punch"
        },
        "moveType" : "motion",
        "aliases" : ["fireball", "fb", "hadouken"]
    }
}

function syntaxChecking(string) {
    if (string.includes("(") || string.includes(")")) {
        let lpc = (string.match(/\(/g) || []).length
        let rpc = (string.match(/\)/g) || []).length

        if (lpc != rpc) {
            // exception later/if necessary
            console.log("Syntax error; uneven amount of parentheses in string \"" + string + "\", exiting")
            return;
        }
    }

    if (string.includes("[") || string.includes("]")) {
        let lbc = (string.match(/\[/g) || []).length
        let rbc = (string.match(/\]/g) || []).length

        if (lbc != rbc) {
            // exception later/if necessary
            console.log("Syntax error; uneven amount of brackets in string \"" + string + "\", exiting")
            return;
        }
    }
}

function parseMoveNotation(move) {
    if (move == "xx" || move == ">") {
        return("cancel")
    }
    else if (move == ",") {
        return("link")
    }

    if (!isNaN(move[0]) || !isNaN(move[1])) {
        return("numpad")
    }
    else {
        return("capcom")
    }
}

function parseMoveType(move) {
    if (move == "xx" || move == ">") {
        return("cancel")
    }
    else if (move == ",") {
        return("link")
    }

    let moveNotation = parseMoveNotation(move)
    // if there are brackets in this move, this is a charge move ("[2]8LK... or [d]u+lk?")
    if (move.includes("[") || move.includes("]")) {
        return("charge")
    }
    else {
        if (moveNotation == "numpad") {
            // else, if we're in numpad notation and the second character of this move is a number, this is a motion (ie. 236HP)
            if (!isNaN(move[1])) {
                return("motion")
            }
            // else, it's numpad notation for a direction + a button (ie. 2MK)
            else {
                return("button")
            }
        }
        else if (moveNotation == "capcom") {

            for (motionIndex = 0; motionIndex < Object.keys(notation["motions"]).length; motionIndex++) {
                let motionKey = Object.keys(notation["motions"])[motionIndex]
                // if the first letters of the move match up to a possible motion written in capcom, this is a motion (ie. qcf+lk)
                if (notation["motions"][motionKey]["abbreviation"] == move.substring(0, notation["motions"][motionKey]["abbreviation"].length)) {
                    return("motion")
                }
            }

            for (buttonIndex = 0; buttonIndex < Object.keys(notation["buttons"]["sf"]).length; buttonIndex++) {
                let btnKey = Object.keys(notation["buttons"]["sf"])[buttonIndex]

                if (move.includes("(") || move.includes(")")) {
                    move = move.substring(0, move.indexOf("("))
                }

                let btnLength = btnKey.length
                // if the last letters of the move match up to a possible button written in capcom, this is a button (ie. cr.mk)
                if (btnKey.toLowerCase() == move.substring(move.length-btnLength, move.length).toLowerCase()) {
                    return("button")
                }
            }
        }

        // all else fails
        return("custom?")
    }
}

function parseInput(input) {
    let moveObj = {}  // object of input split move by move with all relevant information stored
    let resultArr = [] // array of moves to combine into string once text processing has finished

    console.log(`Input: ${input}\n----`)
    syntaxChecking(input)

    // object population
    input = input.replace(/,/g, ' ,') // splitting commas to be their own element of an object; commas denote links, ">", "xx" denote cancels
    let split = input.split(" ")
    for (splitIndex = 0; splitIndex < split.length; splitIndex++) {
        let move = split[splitIndex]
        let moveType = parseMoveType(move)
        moveObj[splitIndex] = {}
        moveObj[splitIndex]["move"] = move
        moveObj[splitIndex]["moveType"] = moveType
        if (moveObj[splitIndex]["moveType"] == "custom?") {
            moveObj[splitIndex]["moveNotation"] = "custom"
        }
        else {
            moveObj[splitIndex]["moveNotation"] = parseMoveNotation(move)
        }
    }

    console.log("moveObj after initialization and population:")
    Object.keys(moveObj).forEach(i => console.log(`    ${i}: ${JSON.stringify(moveObj[i])}`))

    // if there are any custom move definitions that need to be turned into notation,
    // their indexes in moveObj are stored in the object "cmi"
    let cmi = {}
    let customPhraseNum = 0 // goes up when the next word being inspected in moveObj is not a custom word, so we know when to start categorizing the next custom move
    // if there are multiple moves with moveType "custom?" occuring in moveObj sequentially, they must be referencing one move with multiple words (ie. "lightning legs")
    // to catch this, a "streak" is kept for as long as we keep running into concurrent "custom" values
    let customStreak = false
    let streakJustIncremented = false
    // when the streak ends, continue combing the list for the next occurence of a custom definition
    for (moveObjIndex = 0; moveObjIndex < Object.keys(moveObj).length; moveObjIndex++) {
        move = moveObj[moveObjIndex]
        moveNotation = moveObj[moveObjIndex]["moveNotation"]

        if (moveNotation == "custom") {
            // console.log(`    Custom streak?: ${customStreak}`)
            // console.log(`    Streak just incremented?: ${streakJustIncremented}`)
            // console.log(`    Custom phrase num?: ${customPhraseNum}`)

            if (!streakJustIncremented) {
                customPhraseNum++
                streakJustIncremented = true
            }
            else if (streakJustIncremented) {
                streakJustIncremented = false
            }

            if (customStreak) {
                cmi[`custom${customPhraseNum}`]["indexes"].push(moveObjIndex)
            }
            else {
                try {
                    cmi[`custom${customPhraseNum}`]["indexes"].push(moveObjIndex)
                }
                catch {
                    cmi[`custom${customPhraseNum}`] = { "indexes": [], "moveName": "" }
                    cmi[`custom${customPhraseNum}`]["indexes"].push(moveObjIndex)
                }
                customStreak = true
            }
        }
        else {
            customStreak = false
            if (streakJustIncremented) {
                streakJustIncremented = false
            }
        }
    }

    customPhraseNum--

    // after looping through moveObj move types to populate cmi with custom move definition instances and list indexes, this loop is for
    // finding which custom moves are meant to take the space of those indexes by checking to see if there are any matches between
    // keys in customTranslations and words in moveObj

    for (cmiki = 0; cmiki < Object.keys(cmi).length; cmiki++) {
        let cmiKey = Object.keys(cmi)[cmiki] // custom1, custom2...
        let customMovePiecedFromMoveObj = ""
        for (cmicmiki = 0; cmicmiki < cmi[cmiKey]["indexes"].length; cmicmiki++) {
            let cmiKeyIndex = cmi[cmiKey]["indexes"][cmicmiki] // ["4", "5"], ["6"]...
            customMovePiecedFromMoveObj += moveObj[cmiKeyIndex]["move"]  + " "
            for (cti = 0; cti < Object.keys(customTranslations).length; cti++) {
                let customMove = Object.keys(customTranslations)[cti] // "Shoryuken", "Hadoken"...
                if (customMove.toLowerCase() == customMovePiecedFromMoveObj.substring(0, customMovePiecedFromMoveObj.length-1).toLowerCase()) {
                    cmi[cmiKey]["moveName"] = customMove
                }

                for (aliasIndex = 0; aliasIndex < customTranslations[customMove]["aliases"].length; aliasIndex++) {
                    alias = customTranslations[customMove]["aliases"][aliasIndex]
                    if (alias.toLowerCase() == customMovePiecedFromMoveObj.substring(0, customMovePiecedFromMoveObj.length-1).toLowerCase()) {
                        cmi[cmiKey]["moveName"] = customMove
                        moveObj[cmi[cmiKey]["indexes"][0]]["move"] = customMove
                    }
                }
            }
        }
    }

    // next, custom move definitions that have move names containing spaces or multiple words that take up
    // multiple elements of the moveObj are combined into one entry, the extras being deleted.
    // this is also where move types are changed from "custom?" to "custom"

    function trimObj(customPhraseNum) {
        for (cpni = 1; cpni < customPhraseNum; cpni++) {
            let numOfCustoms = cmi[`custom${cpni}`]["indexes"].length
            let indexFirstElement = cmi[`custom${cpni}`]["indexes"][0]
            let indexLastElement = cmi[`custom${cpni}`]["indexes"][cmi[`custom${cpni}`]["indexes"].length-1]
            let objIndex = ""

            if (indexFirstElement != indexFirstElement) {
                for (noci = 0; noci < numOfCustoms; noci++) {
                    objIndex = cmi[`custom${cpni}`]["indexes"][noci]
                    if (noci = 0) {
                        moveObj[objIndex]["move"] = cmi[`custom${cpni}`]["moveName"]
                        moveObj[objIndex]["moveType"] = "custom"
                    }
                    else {
                        moveObj[objIndex] = "toDel"
                    }
                }
            }
            else {
                objIndex = indexFirstElement
                moveObj[objIndex]["move"] = cmi[`custom${cpni}`]["moveName"]
                moveObj[objIndex]["moveType"] = "custom"
            }
        }

        return(moveObj)
    }

    // if any custom move definition still has no move name attached...
    for (cmiIndex = 0; cmiIndex < Object.keys(cmi).length; cmiIndex++) {
        c = Object.keys(cmi)[cmiIndex]
        if (cmi[c]["moveName"] == "") {
            console.log(`no move name found for index(es): ${cmi[c]['indexes']}`)
        }
    }

    if (!Object.entries(cmi).length == 0) {
        moveObj = trimObj(customPhraseNum)
    }

    // remove null'd elements from after trimObj function. fix indexes later?
    for (moi = 0; moi < Object.keys(moveObj).length; moi++) {
        if (moveObj[moi] == "toDel") {
            delete (moveObj[moi])
        }
    }

    for (moi = 0; moi < Object.keys(moveObj).length; moi++) {
        function findBtn(move) {
            // second last character
            let slc = move.substring(move.length-2, move.length-1)
            if (slc == "*") {
                return(move.substring(move.indexOf(slc)))
            }

            for (btnKeyIndex = 0; btnKeyIndex < Object.keys(notation["buttons"]["sf"]).length; btnKeyIndex++) {
                let btnKey = Object.keys(notation["buttons"]["sf"])[btnKeyIndex]
                let btnLength = btnKey.length
                // if the last letters of the move match up to a possible button written in capcom, this is a button (ie. cr.mk)
                if (btnKey.toLowerCase() == move.substring(move.length-btnLength).toLowerCase()) {
                    return(btnKey)
                }
            }
        }

        let move = moveObj[moi]["move"]
        let moveType = moveObj[moi]["moveType"]
        let moveNotation = moveObj[moi]["moveNotation"]
        moveObj[moi]["input"] = {}

        if (moveNotation == "custom") {
            let m = move
            move = customTranslations[m]["input"]["numpadInput"] + customTranslations[m]["input"]["strength"][0] + customTranslations[m]["input"]["attack"][0]
            move = move.toUpperCase()
            let customMoveType = customTranslations[m]["moveType"]
            moveObj[moi]["moveType"] = customMoveType

            switch(customMoveType) {
                case "motion":
                    let attackStrengths = ["L", "M", "H", "*", "EX", "l", "m", "h", "Ex", "eX", "ex"]
                    attackStrengths.forEach(attstr => {
                        if (move.split(attstr)[1]) {
                            let motionNum = move.split(attstr)[0]
                            moveObj[moi]["input"]["motions"] = {}
                            moveObj[moi]["input"]["motions"]["num"] = motionNum
                            moveObj[moi]["input"]["motions"]["abv"] = notation["motions"][motionNum]["abbreviation"]
                            moveObj[moi]["input"]["motions"]["word"] = notation["motions"][motionNum]["full"]
                        }
                    })

                    moveObj[moi]["input"]["button"] = {}
                    btn = findBtn(move)
                    moveObj[moi]["input"]["button"]["shortform"] = btn
                    if (btn[0] == "*") {
                        moveObj[moi]["input"]["button"]["strWord"] = "Any"
                        moveObj[moi]["input"]["button"]["attWord"] = customTranslations[m]["input"]["attack"]
                    }
                    else {
                        moveObj[moi]["input"]["button"]["strWord"] = notation["buttons"]["sf"][btn]["strength"]
                        moveObj[moi]["input"]["button"]["attWord"] = notation["buttons"]["sf"][btn]["attack"]
                    }
                    moveObj[moi]["input"]["button"]["strAbv"] = btn[0]
                    moveObj[moi]["input"]["button"]["attAbv"] = btn[1]
                    moveObj[moi]["input"]["button"]["fullWords"] = moveObj[moi]["input"]["button"]["strWord"] + " " + moveObj[moi]["input"]["button"]["attWord"]
                    moveObj[moi]["input"]["button"]["attBoomer"] = null
                    break;
                default:
                    console.log("not adding additional data to moveObj for custom, functionality not implemented yet")
                    break
            }
        }

        if (moveNotation == "numpad") {
            if (moveType == "charge") {
                let lbi = move.indexOf("[")+1
                let rbi = move.indexOf("]")

                let hold = move.substring(lbi, rbi)
                let release = move.substring(rbi+1, rbi+2)

                let holdDirections = []
                let releaseDirections = []
                for (npd = 0; npd < Object.keys(notation["directions"]).length; npd++) {
                    numpadDirection = Object.keys(notation["directions"])[npd]

                    if (hold == numpadDirection) {
                        holdDirections.push(numpadDirection)
                    }

                    if (release == numpadDirection) {
                        releaseDirections.push(numpadDirection)
                    }
                }

                moveObj[moi]["input"]["directions"] = {}
                moveObj[moi]["input"]["directions"]["hold"] = {}
                moveObj[moi]["input"]["directions"]["hold"]["dirNums"] = holdDirections
                moveObj[moi]["input"]["directions"]["hold"]["dirAbvs"] = []
                moveObj[moi]["input"]["directions"]["hold"]["dirWords"] = []
                moveObj[moi]["input"]["directions"]["hold"]["dirStates"] = []
                moveObj[moi]["input"]["directions"]["hold"]["dirStateAbvs"] = []

                for (hdi = 1; hdi < holdDirections.length+1; hdi++) {
                    moveObj[moi]["input"]["directions"]["hold"]["dirAbvs"].push(notation["directions"][hdi]["abbreviation"])
                    moveObj[moi]["input"]["directions"]["hold"]["dirWords"].push(notation["directions"][hdi]["full"])
                    moveObj[moi]["input"]["directions"]["hold"]["dirStates"].push(notation["directions"][hdi]["state"])
                    moveObj[moi]["input"]["directions"]["hold"]["dirStateAbvs"].push(notation["directions"][hdi]["stateAbv"])
                }

                moveObj[moi]["input"]["directions"]["release"] = {}
                moveObj[moi]["input"]["directions"]["release"]["dirNums"] = releaseDirections
                moveObj[moi]["input"]["directions"]["release"]["dirAbvs"] = []
                moveObj[moi]["input"]["directions"]["release"]["dirWords"] = []
                moveObj[moi]["input"]["directions"]["release"]["dirStates"] = []
                moveObj[moi]["input"]["directions"]["release"]["dirStateAbvs"] = []

                for (rdi = 1; rdi < releaseDirections.length+1; rdi++) {
                    moveObj[moi]["input"]["directions"]["release"]["dirAbvs"].push(notation["directions"][rdi]["abbreviation"])
                    moveObj[moi]["input"]["directions"]["release"]["dirWords"].push(notation["directions"][rdi]["full"])
                    moveObj[moi]["input"]["directions"]["release"]["dirStates"].push(notation["directions"][rdi]["state"])
                    moveObj[moi]["input"]["directions"]["release"]["dirStateAbvs"].push(notation["directions"][rdi]["stateAbv"])
                }

                btn = (move[4] + move[5]).toUpperCase()
                moveObj[moi]["input"]["button"] = {}
                moveObj[moi]["input"]["button"]["shortform"] = btn
                moveObj[moi]["input"]["button"]["strWord"] = notation["buttons"]["sf"][btn]["strength"]
                moveObj[moi]["input"]["button"]["strAbv"] = btn[0]
                moveObj[moi]["input"]["button"]["attWord"] = notation["buttons"]["sf"][btn]["attack"]
                moveObj[moi]["input"]["button"]["attAbv"] = btn[1]
                moveObj[moi]["input"]["button"]["fullWords"] = moveObj[moi]["input"]["button"]["strWord"] + " " + moveObj[moi]["input"]["button"]["attWord"]
                moveObj[moi]["input"]["button"]["attBoomer"] = notation["buttons"]["sf"][btn]["boomer"]
            }
            else if (moveType == "motion") {
                if (move.length != 3 && Number(move.substring(0, 2)) > 10) {
                    let attackStrengths = ["L", "M", "H", "*", "EX", "l", "m", "h", "Ex", "eX", "ex"]
                    attackStrengths.forEach(attstr => {
                        if (move.split(attstr)[1]) {
                            let motionNum = move.split(attstr)[0]
                            moveObj[moi]["input"]["motions"] = {}
                            moveObj[moi]["input"]["motions"]["num"] = motionNum
                            moveObj[moi]["input"]["motions"]["abv"] = notation["motions"][motionNum]["abbreviation"]
                            moveObj[moi]["input"]["motions"]["word"] = notation["motions"][motionNum]["full"]

                            btn = (attstr + move.split(attstr)[1]).toUpperCase()
                            moveObj[moi]["input"]["button"] = {}
                            moveObj[moi]["input"]["button"]["shortform"] = btn
                            moveObj[moi]["input"]["button"]["strWord"] = notation["buttons"]["sf"][btn]["strength"]
                            moveObj[moi]["input"]["button"]["strAbv"] = btn[0]
                            moveObj[moi]["input"]["button"]["attWord"] = notation["buttons"]["sf"][btn]["attack"]
                            moveObj[moi]["input"]["button"]["attAbv"] = btn[1]
                            moveObj[moi]["input"]["button"]["fullWords"] = moveObj[moi]["input"]["button"]["strWord"] + " " + moveObj[moi]["input"]["button"]["attWord"]
                            moveObj[moi]["input"]["button"]["attBoomer"] = notation["buttons"]["sf"][btn]["boomer"]
                        }

                    })
                }
            }
            else if (moveType == "button") {
                if (move.includes("(") || move.includes(")")) {
                    numOfHits = move[4]
                }
                else {
                    numOfHits = 0
                }

                let direction = move[0]
                let btn = move[1]+move[2]
                moveObj[moi]["input"]["directions"] = {}
                moveObj[moi]["input"]["directions"]["dirNums"] = [direction]
                moveObj[moi]["input"]["directions"]["dirAbvs"] = []
                moveObj[moi]["input"]["directions"]["dirWords"] = []
                moveObj[moi]["input"]["directions"]["dirStates"] = []
                moveObj[moi]["input"]["directions"]["dirStateAbvs"] = []

                moveObj[moi]["input"]["directions"]["dirAbvs"].push(notation["directions"][direction]["abbreviation"])
                moveObj[moi]["input"]["directions"]["dirWords"].push(notation["directions"][direction]["full"])
                moveObj[moi]["input"]["directions"]["dirStates"].push(notation["directions"][direction]["state"])
                moveObj[moi]["input"]["directions"]["dirStateAbvs"].push(notation["directions"][direction]["stateAbv"])

                moveObj[moi]["input"]["button"] = {}
                moveObj[moi]["input"]["button"]["shortform"] = btn
                moveObj[moi]["input"]["button"]["strWord"] = notation["buttons"]["sf"][btn]["strength"]
                moveObj[moi]["input"]["button"]["strAbv"] = btn[0]
                moveObj[moi]["input"]["button"]["attWord"] = notation["buttons"]["sf"][btn]["attack"]
                moveObj[moi]["input"]["button"]["attAbv"] = btn[1]
                moveObj[moi]["input"]["button"]["fullWords"] = moveObj[moi]["input"]["button"]["strWord"] + " " + moveObj[moi]["input"]["button"]["attWord"]
                moveObj[moi]["input"]["button"]["attBoomer"] = notation["buttons"]["sf"][btn]["boomer"]
                moveObj[moi]["input"]["numOfHits"] = numOfHits
            }
        }
        else if (moveNotation == "capcom") {
            if (moveType == "button") {
                let numOfHits = 0
                if (move.includes("(") || move.includes(")")) {
                    numOfHits = move.substring(move.indexOf("(")+1,move.indexOf(")"))
                    let lpc = (move.match(/\(/g) || []).length
                    move = move.substring(0, move.indexOf(lpc)-1)
                }
                moveObj[moi]["input"]["button"] = {}
                btn = findBtn(move)
                moveObj[moi]["input"]["button"]["shortform"] = btn
                moveObj[moi]["input"]["button"]["strWord"] = notation["buttons"]["sf"][btn]["strength"]
                moveObj[moi]["input"]["button"]["strAbv"] = btn[0]
                moveObj[moi]["input"]["button"]["attWord"] = notation["buttons"]["sf"][btn]["attack"]
                moveObj[moi]["input"]["button"]["attAbv"] = btn[1]
                moveObj[moi]["input"]["button"]["fullWords"] = moveObj[moi]["input"]["button"]["strWord"] + " " + moveObj[moi]["input"]["button"]["attWord"]
                moveObj[moi]["input"]["button"]["attBoomer"] = notation["buttons"]["sf"][btn]["boomer"]

                moveObj[moi]["input"]["directions"] = {}
                let directions = []
                if (move.length == 2) {
                    directions = ["5"]
                }
                else if (move.includes(".")) {
                    let dotIndex = move.indexOf(".")
                    let directionStateAbv = ""
                    directions = []
                    for (ndk = 0; ndk < Object.keys(notation["directions"]).length; ndk++) {
                        let key = Object.keys(notation["directions"])[ndk]
                        if (notation["directions"][key]["stateAbv"] == move.substring(0, dotIndex+1)) {
                            directions.push(key)
                        }
                    }
                    if (directions == "1,2,3") {
                        directions == ["2"]
                    }
                }
                else {
                    console.log("failed to parse button with no period")
                }

                moveObj[moi]["input"]["directions"]["dirNums"] = directions
                moveObj[moi]["input"]["directions"]["dirAbvs"] = []
                moveObj[moi]["input"]["directions"]["dirWords"] = []
                moveObj[moi]["input"]["directions"]["dirStates"] = []
                moveObj[moi]["input"]["directions"]["dirStateAbvs"] = []

                for (dk = 0; dk < directions.length; dk++) {
                    let dkk = directions[dk]
                    moveObj[moi]["input"]["directions"]["dirAbvs"].push(notation["directions"][dkk]["abbreviation"])
                    moveObj[moi]["input"]["directions"]["dirWords"].push(notation["directions"][dkk]["full"])
                    moveObj[moi]["input"]["directions"]["dirStates"].push(notation["directions"][dkk]["state"])
                    moveObj[moi]["input"]["directions"]["dirStateAbvs"].push(notation["directions"][dkk]["stateAbv"])
                }

                moveObj[moi]["input"]["numOfHits"] = numOfHits
            }
            else if (moveType == "motion") {
                moveObj[moi]["input"]["button"] = {}
                btn = findBtn(move)
                moveObj[moi]["input"]["button"]["shortform"] = btn
                moveObj[moi]["input"]["button"]["strWord"] = notation["buttons"]["sf"][btn]["strength"]
                moveObj[moi]["input"]["button"]["strAbv"] = btn[0]
                moveObj[moi]["input"]["button"]["attWord"] = notation["buttons"]["sf"][btn]["attack"]
                moveObj[moi]["input"]["button"]["attAbv"] = btn[1]
                moveObj[moi]["input"]["button"]["fullWords"] = moveObj[moi]["input"]["button"]["strWord"] + " " + moveObj[moi]["input"]["button"]["attWord"]
                moveObj[moi]["input"]["button"]["attBoomer"] = notation["buttons"]["sf"][btn]["boomer"]

                moveObj[moi]["input"]["motions"] = {}

                let motionNum = ""
                for (mki = 0; mki < Object.keys(notation["motions"]).length; mki++) {
                    let motionKey = Object.keys(notation["motions"])[mki]
                    // if the first letters of the move match up to a possible motion written in capcom, this is a motion (ie. qcf+lk)
                    if ((notation["motions"][motionKey]["abbreviation"]) == (move.substring(0,notation["motions"][motionKey]["abbreviation"].length))) {
                        motionNum = motionKey
                    }
                }

                moveObj[moi]["input"]["motions"]["num"] = motionNum
                moveObj[moi]["input"]["motions"]["abv"] = notation["motions"][motionNum]["abbreviation"]
                moveObj[moi]["input"]["motions"]["word"] = notation["motions"][motionNum]["full"]
            }
            else if (moveType == "charge") {
                moveObj[moi]["input"]["button"] = {}
                btn = findBtn(move)
                moveObj[moi]["input"]["button"]["shortform"] = btn
                moveObj[moi]["input"]["button"]["strWord"] = notation["buttons"]["sf"][btn]["strength"]
                moveObj[moi]["input"]["button"]["strAbv"] = btn[0]
                moveObj[moi]["input"]["button"]["attWord"] = notation["buttons"]["sf"][btn]["attack"]
                moveObj[moi]["input"]["button"]["attAbv"] = btn[1]
                moveObj[moi]["input"]["button"]["fullWords"] = moveObj[moi]["input"]["button"]["strWord"] + " " + moveObj[moi]["input"]["button"]["attWord"]
                moveObj[moi]["input"]["button"]["attBoomer"] = notation["buttons"]["sf"][btn]["boomer"]

                let lbi = move.indexOf("[")+1
                let rbi = move.indexOf("]")

                let hold = move.substring(lbi, rbi)
                let holdNum = ""
                let release = move.substring(rbi+1, rbi+2)
                let releaseNum = ""

                for (hn = 1; hn < Object.keys(notation["directions"]).length+1; hn++) {
                    if (hold == notation["directions"][hn]["abbreviation"]) {
                        holdNum = hn
                    }
                }

                for (rn = 1; rn < Object.keys(notation["directions"]).length+1; rn++) {
                    if (release == notation["directions"][rn]["abbreviation"]) {
                        releaseNum = rn
                    }
                }

                let holdDirections = []
                let releaseDirections = []
                for (npd = 0; npd < Object.keys(notation["directions"]).length; npd++) {
                    numpadDirection = Object.keys(notation["directions"])[npd]

                    if (holdNum == numpadDirection) {
                        holdDirections.push(numpadDirection)
                    }

                    if (releaseNum == numpadDirection) {
                        releaseDirections.push(numpadDirection)
                    }
                }

                moveObj[moi]["input"]["directions"] = {}
                moveObj[moi]["input"]["directions"]["hold"] = {}
                moveObj[moi]["input"]["directions"]["hold"]["dirNums"] = holdDirections
                moveObj[moi]["input"]["directions"]["hold"]["dirAbvs"] = []
                moveObj[moi]["input"]["directions"]["hold"]["dirWords"] = []
                moveObj[moi]["input"]["directions"]["hold"]["dirStates"] = []
                moveObj[moi]["input"]["directions"]["hold"]["dirStateAbvs"] = []

                for (hdi = 1; hdi < holdDirections.length+1; hdi++) {
                    moveObj[moi]["input"]["directions"]["hold"]["dirAbvs"].push(notation["directions"][hdi]["abbreviation"])
                    moveObj[moi]["input"]["directions"]["hold"]["dirWords"].push(notation["directions"][hdi]["full"])
                    moveObj[moi]["input"]["directions"]["hold"]["dirStates"].push(notation["directions"][hdi]["state"])
                    moveObj[moi]["input"]["directions"]["hold"]["dirStateAbvs"].push(notation["directions"][hdi]["stateAbv"])
                }

                moveObj[moi]["input"]["directions"]["release"] = {}
                moveObj[moi]["input"]["directions"]["release"]["dirNums"] = releaseDirections
                moveObj[moi]["input"]["directions"]["release"]["dirAbvs"] = []
                moveObj[moi]["input"]["directions"]["release"]["dirWords"] = []
                moveObj[moi]["input"]["directions"]["release"]["dirStates"] = []
                moveObj[moi]["input"]["directions"]["release"]["dirStateAbvs"] = []

                for (rdi = 1; rdi < releaseDirections.length+1; rdi++) {
                    moveObj[moi]["input"]["directions"]["release"]["dirAbvs"].push(notation["directions"][rdi]["abbreviation"])
                    moveObj[moi]["input"]["directions"]["release"]["dirWords"].push(notation["directions"][rdi]["full"])
                    moveObj[moi]["input"]["directions"]["release"]["dirStates"].push(notation["directions"][rdi]["state"])
                    moveObj[moi]["input"]["directions"]["release"]["dirStateAbvs"].push(notation["directions"][rdi]["stateAbv"])
                }
            }
        }
    }

    for (mdi = 0; mdi < Object.keys(moveObj).length; mdi++) {
        let moveObjEntry = moveObj[mdi]
        let move = moveObj[mdi]["move"]
        let currentMoveType = moveObj[mdi]["moveType"]
        try {
            let nextMoveType = moveObj[mdi+1]["moveType"]
        }
        catch {
            let nextMoveType = null
        }

        switch(currentMoveType) {
            case "button":
                let direction = ""
                let validDirections = moveObjEntry["input"]["directions"]["dirNums"]

                if (typeof(validDirections) == 'object') {
                    if (validDirections == "1,2,3") {
                        direction = "2"
                    }
                    else if (validDirections.length == 1) {
                        direction = validDirections[0]
                    }
                }
                else {
                    direction = validDirections
                }

                let btn = moveObjEntry["input"]["button"]["shortform"].toLowerCase()
                let numOfHits = moveObjEntry["input"]["numOfHits"]

                let dirAbv = notation["directions"][direction]["abbreviation"]

                if (dirAbv.toLowerCase() != "n") {
                    resultArr.push(`[[File:${dirAbv}.png]] `)
                    resultArr.push("+ ")
                }

                resultArr.push(`[[File:${btn}.png]] `)
                if (numOfHits != 0) {
                    resultArr.push(`(${numOfHits}) `)
                }
                break;
            case "motion":
                let motionNum = moveObjEntry["input"]["motions"]["num"]
                let motionAbv = notation["motions"][motionNum]["abbreviation"]
                let motBtn = moveObjEntry["input"]["button"]["shortform"].toLowerCase()
                let isPreviousElementBtn = false
                let newBtn = ""

                if (motBtn[0] == "*") {
                    for (nbsf = 0; nbsf < Object.keys(notation["buttons"]["sf"]).length; nbsf++) {
                        let nbsfk = Object.keys(notation["buttons"]["sf"])[nbsf]
                        if (resultArr.length != 0) {
                            if (nbsfk.toLowerCase() == resultArr[resultArr.length - 1].toLowerCase()) {
                                isPreviousElementBtn = true;
                                newBtn = resultArr[resultArr.length - 1].substring(7,9)
                                resultArr.pop()
                            }
                        }
                    }
                }

                resultArr.push(`[[File:${motionAbv}.png]] `)
                resultArr.push("+ ")
                if (isPreviousElementBtn) {
                    resultArr.push(`[[File:${newBtn}.png]] `)
                }
                else {
                    if (motBtn[0] == "*") {
                        motBtn = motBtn[motBtn.length - 1]
                    }
                    resultArr.push(`[[File:${motBtn}.png]] `)
                }
                break;
            case "charge":
                let hold = moveObjEntry["input"]["directions"]["hold"]["dirNums"][0]
                let release = moveObjEntry["input"]["directions"]["release"]["dirNums"][0]
                let chrBtn = moveObjEntry["input"]["button"]["shortform"].toLowerCase()

                let holdAbv = ""
                let releaseAbv = ""

                if (!isNaN(hold)) {
                    holdAbv = notation["directions"][hold]["abbreviation"]
                }
                else {
                    holdAbv = hold
                }

                if (!isNaN(release)) {
                    releaseAbv = notation["directions"][release]["abbreviation"]
                }
                else {
                    releaseAbv = release
                }

                resultArr.push(`[ [[File:${holdAbv}.png]] ] `)
                resultArr.push(`[[File:${releaseAbv}.png]] `)
                resultArr.push(`+ `)
                resultArr.push(`[[File:${chrBtn}.png]] `)
                break;
            case ",":
                // resultArr[-1] = (resultArr[-1])[0:len(resultArr[-1])-1]
                resultArr[resultArr.length - 1] = (resultArr[resultArr.length - 1]).substring(0, (resultArr[resultArr.length - 1])-1)
                resultArr.push(", ")
                break;
            default:
                resultArr.push(`${move} `)

        }
    }
    let finalResult = ""
    for (fr = 0; fr < resultArr.length; fr++) {
        finalResult += resultArr[fr]
    }

    console.log("--")
    console.log(finalResult)
    console.log("----\n")
    console.log(`moveObj: ${JSON.stringify(moveObj)}`)
}

// let input = "cr.hp(1) > legs, [b]f+hk, cr.lp > 4HP, qcf+mk > [2]8lk > 236lp, tatsu"
let input = "6HP"
parseInput(input)
