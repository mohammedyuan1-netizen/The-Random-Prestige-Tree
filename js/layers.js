addLayer("p", {
    name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
        challengesUnlocked: false,
    }},
    color: "#2383dcd3",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "Prestige Points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        let mult = new Decimal(1)
        if (hasUpgrade("p", 21)) mult = mult.times(3)
        if (hasUpgrade("u", 11)) mult = mult.times(3)
        if (hasUpgrade("u", 12)) mult = mult.times(5)
        if (hasUpgrade("u", 13)) mult = mult.times(buyableEffect("p", 11).prestige)
        if (hasUpgrade("u", 15)) mult = mult.times(3)
        if (hasUpgrade("u", 17)) mult = mult.times(2.5)
        if (hasUpgrade("p", 24)) mult = mult.times(upgradeEffect("p", 24))
        if (hasChallenge("p", 11)) mult = mult.times(10)
        if (hasUpgrade("m", 11)) mult = mult.times(5)
        if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) mult = mult.times(buyableEffect("p", 12).prestige)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    autoUpgrade() { return hasUpgrade("a", 12) && !inChallenge("p", 11) },
    passiveGeneration() {
        if (!hasUpgrade("a", 11) || inChallenge("p", 11)) return 0
        return hasUpgrade("a", 13) ? 0.25 : 0.1
    },
    keepChallengeOnReset: true,
    doReset(resettingLayer) {
        if (layers[resettingLayer].row > this.row)
            layerDataReset(this.layer, ["challengesUnlocked", "activeChallenge", "challenges"])
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    _hotkeys: [
        { key: "p", description: "P: Reset for prestige points", onPress() { if (canReset(this.layer)) doReset(this.layer) } },
    ],
    get hotkeys() {
        return this._hotkeys
    },
    set hotkeys(value) {
        this._hotkeys = value
    },
    // Display properties can be added after this point, e.g.:
    // display() { return `You have ${format(player[this.layer].points)} prestige points.` },
    layerShown(){return true},
    tabFormat: {
        "Upgrades": {
            content: ["main-display", "prestige-button", "resource-display", "milestones", "upgrades"],
        },
        "Buyables": {
            unlocked() { return hasUpgrade("u", 13) },
            content: ["buyables"],
        },
        "Challenges": {
            unlocked() { return player.p.challengesUnlocked },
            content: ["challenges"],
        },
    },
    challenges: {
        11: {
            name: "Challenge 1",
            challengeDescription: "Square root your point gain",
            goalDescription: "1e6 Prestige Points",
            rewardDescription: "Points x50, Prestige Point gain x10, Ultra Point gain x5, Automation Point gain x3, and unlock Prestige upgrade 31.",
            canComplete() { return player.p.points.gte(1e6) },
            rewardEffect() {
                return {
                    points: new Decimal(50),
                    prestige: new Decimal(10),
                    ultra: new Decimal(5),
                    automation: new Decimal(3),
                }
            },
            unlocked() { return player.p.challengesUnlocked },
            onEnter() {
                let activeChallenge = player[this.layer].activeChallenge
                Vue.set(player[this.layer], "activeChallenge", null)
                doReset("u", !canReset("u"))
                Vue.set(player[this.layer], "activeChallenge", activeChallenge)
                updateTemp()
            },
        },
    },
    buyables: {
        11: {
            title: "A new buyable!",
            cost(x) { return new Decimal(100000).times(Decimal.pow(5, x)) },
            effect(x) {
                return {
                    ultra: Decimal.pow(1.1, x),
                    prestige: Decimal.pow(1.25, x),
                }
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                return "Cost: " + format(data.cost) + " Prestige Points\n" +
                    "Amount: " + formatWhole(getBuyableAmount(this.layer, this.id)) + "\n" +
                    "Ultra point gain: x" + format(data.effect.ultra) + "\n" +
                    "Prestige point gain: x" + format(data.effect.prestige)
            },
            unlocked() { return hasUpgrade("u", 13) || (getBuyableAmount(this.layer, this.id) && getBuyableAmount(this.layer, this.id).gt(0)) },
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
        },
        12: {
            title: "Another Buyable?",
            cost(x) { return new Decimal("1e14").times(Decimal.pow(10, x)) },
            effect(x) {
                return {
                    points: Decimal.pow(2, x),
                    prestige: Decimal.pow(1.5, x),
                    ultra: Decimal.pow(1.25, x),
                    automation: Decimal.pow(1.1, x),
                }
            },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                return "Cost: " + format(data.cost) + " Prestige Points\n" +
                    "Amount: " + formatWhole(getBuyableAmount(this.layer, this.id)) + "\n" +
                    "Point gain: x" + format(data.effect.points) + "\n" +
                    "Prestige Point gain: x" + format(data.effect.prestige) + "\n" +
                    "Ultra Point gain: x" + format(data.effect.ultra) + "\n" +
                    "Automation Point gain: x" + format(data.effect.automation)
            },
            unlocked() { return hasUpgrade("u", 19) || (getBuyableAmount(this.layer, this.id) && getBuyableAmount(this.layer, this.id).gt(0)) },
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
        },
    },
    upgrades: {
        rows: 4,
        cols: 5,

        11: {
            title: "First Upgrade",
            description: "Increases your point gain by x2.5.",
            cost: new Decimal(2),
        },
        12: {
            title: "Second Upgrade",
            description: "Triple your point gain.",
            cost: new Decimal(8),
            unlocked() { return hasUpgrade(this.layer, 11) },
        },
        13: {
            title: "Third Upgrade",
            description: "Boosts points by prestige points^0.5.",
            cost: new Decimal(16),
            unlocked() { return hasUpgrade(this.layer, 12) },
            effect() { return player[this.layer].points.pow(0.5).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        14: {
            title: "Fourth Upgrade",
            description: "Boosts points by points^0.2.",
            cost: new Decimal(40),
            unlocked() { return hasUpgrade(this.layer, 13) },
            effect() { return player.points.pow(0.2).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        15: {
            title: "Fifth Upgrade",
            description: "Boost points by pi.",
            cost: new Decimal(100),
            unlocked() { return hasUpgrade(this.layer, 14) },
        },
        21: {
            title: "Sixth Upgrade",
            description: "Triple prestige point gain.",
            cost: new Decimal(150),
            unlocked() { return hasUpgrade(this.layer, 15) },
        },
        22: {
            title: "Seventh Upgrade",
            description: "Boost points by x2.",
            cost: new Decimal(250),
            unlocked() { return hasUpgrade(this.layer, 21) },
            effect() { return new Decimal(2) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        23: {
            title: "Eighth Upgrade",
            description: "Unlock a new layer.",
            cost: new Decimal(500),
            unlocked() { return hasUpgrade(this.layer, 22) },
            onPurchase() {
                player.u.unlocked = true
                needCanvasUpdate = true
            },
        },
        24: {
            title: "Ninth Upgrade",
            description: "Boosts prestige point gain by log10(points^0.8).",
            cost: new Decimal(100000),
            unlocked() { return hasUpgrade("p", 23) && hasUpgrade("u", 14) },
            effect() { return player.points.max(1).log10().times(0.8).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        25: {
            title: "Tenth Upgrade",
            description: "Boost Ultra Point gain by x5.",
            cost: new Decimal(25000000),
            unlocked() { return hasUpgrade("p", 24) && hasUpgrade("u", 14) },
            effect() { return new Decimal(5) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        31: {
            title: "Eleventh Upgrade",
            description: "Unlock a new Automation upgrade.",
            cost: new Decimal("1e12"),
            unlocked() { return hasChallenge("p", 11) },
        },
        32: {
            title: "Twelfth Upgrade",
            description: "Boost ultra point gain by log5(prestige points).",
            cost: new Decimal("1e15"),
            unlocked() { return hasUpgrade("p", 31) },
            effect() { return player.p.points.max(1).log(5).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
    },
})

addLayer("u", {
    name: "Ultra",
    symbol: "U",
    position: 0,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
    }},
    color: "#45b36b",
    requires: new Decimal(500),
    resource: "Ultra Points",
    baseResource: "Prestige Points",
    baseAmount() { return player.p.points },
    type: "normal",
    exponent: 0.5,
    row: 1,
    layerShown() { return player[this.layer].unlocked },
    tabFormat: ["main-display", "prestige-button", "resource-display", "upgrades", ["upgrade", 20]],
    upgrades: {
        rows: 2,
        cols: 9,
        11: {
            title: "Wow a second layer",
            description: "Boosts point gain by x5 and prestige point gain by x3.",
            cost: new Decimal(1),
        },
        12: {
            title: "More boosts",
            description: "Boosts point gain by x10 and prestige point gain by x5.",
            cost: new Decimal(4),
            unlocked() { return hasUpgrade(this.layer, 11) },
        },
        13: {
            title: "Unlock Ultra Boosts",
            description: "Unlocks a new tab with a repeatable buyable.",
            cost: new Decimal(25),
            unlocked() { return hasUpgrade(this.layer, 12) },
        },
        14: {
            title: "More upgrades",
            description: "Unlock prestige upgrade 24.",
            cost: new Decimal(50),
            unlocked() { return hasUpgrade(this.layer, 13) },
        },
        15: {
            title: "Alot of Boosts",
            description: "Point gain x10, Prestige point gain x3, and ultra point gain x1.5.",
            cost: new Decimal(1000),
            unlocked() { return hasUpgrade(this.layer, 14) },
        },
        16: {
            title: "Unlock a new layer (row 2)",
            description: "Permanently unlocks the Automation layer.",
            cost: new Decimal(20000),
            unlocked() { return hasUpgrade(this.layer, 15) },
            onPurchase() {
                player.a.unlocked = true
                needCanvasUpdate = true
            },
        },
        17: {
            title: "Point gain x5, Prestige point gain x2.5, and Ultra Point gain x2",
            cost: new Decimal(50000),
            unlocked() { return hasUpgrade(this.layer, 16) },
        },
        18: {
            title: "Unlock a challenge.",
            description: "Unlocks the Challenges tab in the Prestige layer, and boost ultra point gain by x15.",
            cost: new Decimal(100000),
            unlocked() { return hasUpgrade(this.layer, 17) },
            onPurchase() {
                player.p.challengesUnlocked = true
                needCanvasUpdate = true
            },
        },
        19: {
            title: "Another Buyable?",
            description: "Unlocks a new buyable in the Prestige layer.",
            cost: new Decimal(250000),
            unlocked() { return hasUpgrade(this.layer, 18) },
            onPurchase() { needCanvasUpdate = true },
        },
        20: {
            title: "Unlock Mega",
            description: "Unlocks the Mega layer.",
            cost: new Decimal("1e12"),
            unlocked() { return hasUpgrade(this.layer, 19) },
            onPurchase() {
                player.m.unlocked = true
                needCanvasUpdate = true
            },
        },
    },
    gainMult() {
        let mult = new Decimal(1)
        if (hasUpgrade("u", 13)) mult = mult.times(buyableEffect("p", 11).ultra)
        if (hasUpgrade("p", 25)) mult = mult.times(upgradeEffect("p", 25))
        if (hasUpgrade("u", 15)) mult = mult.times(1.5)
        if (hasUpgrade("u", 17)) mult = mult.times(2)
        if (hasUpgrade("u", 18)) mult = mult.times(15)
        if (hasChallenge("p", 11)) mult = mult.times(5)
        if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) mult = mult.times(buyableEffect("p", 12).ultra)
        return mult
    },
    passiveGeneration() { return hasUpgrade("a", 13) ? 0.1 : 0 },
})

addLayer("a", {
    name: "Automation",
    symbol: "A",
    position: 1,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
    }},
    color: "#9F5623",
    requires: new Decimal(10),
    resource: "Automation Points",
    baseResource: "Ultra Points",
    baseAmount() { return player.u.points },
    type: "normal",
    exponent: 0.5,
    passiveGeneration() { return player[this.layer].unlocked ? 1 : 0 },
    gainMult() {
        let mult = new Decimal(1)
        if (hasChallenge("p", 11)) mult = mult.times(3)
        if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) mult = mult.times(buyableEffect("p", 12).automation)
        return mult
    },
    row: 1,
    layerShown() { return player[this.layer].unlocked },
    upgrades: {
        rows: 1,
        cols: 3,
        11: {
            title: "Automated Prestige",
            description: "Gain 10% of your Prestige Point gain every second.",
            cost: new Decimal(25),
        },
        12: {
            title: "Automated Prestige Upgrades (1-10)",
            description: "Automatically buy Prestige Upgrades 1-10.",
            cost: new Decimal(10000),
            unlocked() { return hasUpgrade(this.layer, 11) },
        },
        13: {
            title: "Automated Ultra and Prestige",
            description: "Gain 10% of your Ultra Point gain every second and increase passive Prestige Point gain from 10% to 25%.",
            cost: new Decimal(250000),
            unlocked() { return hasUpgrade("p", 31) },
        },
    },
})

addLayer("m", {
    name: "Mega",
    symbol: "M",
    position: 0,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
    }},
    color: "#00008B",
    requires: new Decimal("1e12"),
    resource: "Mega Points",
    baseResource: "Ultra Points",
    baseAmount() { return player.u.points },
    type: "normal",
    exponent: new Decimal(1).div(3),
    row: 2,
    layerShown() { return player[this.layer].unlocked },
    upgrades: {
        rows: 1,
        cols: 1,
        11: {
            title: "First Mega Upgrade :O",
            description: "Boosts point gain by x10 and prestige point gain by x5.",
            cost: new Decimal(1),
        },
    },
})

