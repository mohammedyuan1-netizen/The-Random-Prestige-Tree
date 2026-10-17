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
    resource: "prestige points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        let mult = new Decimal(1)
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
        },
        13: {
            title: "Third Upgrade",
            description: "Boosts points by prestige points^0.4.",
            cost: new Decimal(16),
            effect() { return player[this.layer].points.pow(new Decimal(1).div(2.5)).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        14: {
            title: "Fourth Upgrade",
            description: "Boosts points by points^0.2.",
            cost: new Decimal(40),
            effect() { return player.points.pow(0.2).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        15: {
            title: "Fifth Upgrade",
            description: "Boost points by pi.",
            cost: new Decimal(100),
        },
        21: {
            title: "Sixth Upgrade",
            description: "Triple prestige point gain.",
            cost: new Decimal(150),
        },
        22: {
            title: "Seventh Upgrade",
            description: "Boost prestige points by prestige points^0.5.",
            cost: new Decimal(250),
            effect() { return player[this.layer].points.pow(new Decimal(1).div(2)).max(1) },
        },
        23: {
            title: "Eighth Upgrade",
            description: "Unlock a new layer.",
            cost: new Decimal(500),
            onPurchase() {
                player.s.unlocked = true
                needCanvasUpdate = true
            },
        },
    },
})

addLayer("s", {
    name: "second",
    symbol: "S",
    position: 0,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
    }},
    color: "#45b36b",
    requires: new Decimal(1000),
    resource: "second points",
    baseResource: "points",
    baseAmount() { return player.points },
    type: "normal",
    exponent: 0.5,
    row: 1,
    layerShown() { return player[this.layer].unlocked },
})