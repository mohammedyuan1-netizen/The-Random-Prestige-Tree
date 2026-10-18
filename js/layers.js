addLayer("p", {
    name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
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
        if (hasUpgrade("p", 24)) mult = mult.times(upgradeEffect("p", 24))
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
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
            unlocked() { return hasUpgrade("u", 13) || getBuyableAmount(this.layer, this.id).gt(0) },
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
            description: "Boosts points by prestige points^0.4.",
            cost: new Decimal(16),
            unlocked() { return hasUpgrade(this.layer, 12) },
            effect() { return player[this.layer].points.pow(new Decimal(1).div(2.5)).max(1) },
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
            effect() { return player.points.pow(0.8).log10().max(1) },
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
    upgrades: {
        rows: 1,
        cols: 5,
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
            cost: new Decimal(10),
            unlocked() { return hasUpgrade(this.layer, 12) },
        },
        14: {
            title: "More upgrades",
            description: "Unlock prestige upgrade 24.",
            cost: new Decimal(20),
            unlocked() { return hasUpgrade(this.layer, 13) },
        },
        15: {
            title: "Alot of Boosts",
            description: "Point gain x10, Prestige point gain x3, and ultra point gain x1.5.",
            cost: new Decimal(400),
            unlocked() { return hasUpgrade(this.layer, 14) },
        },
    },
    gainMult() {
        let mult = new Decimal(1)
        if (hasUpgrade("u", 13)) mult = mult.times(buyableEffect("p", 11).ultra)
        if (hasUpgrade("p", 25)) mult = mult.times(upgradeEffect("p", 25))
        if (hasUpgrade("u", 15)) mult = mult.times(1.5)
        return mult
    },
})