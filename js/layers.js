// ==========================================
// PRESTIGE LAYER ("p")
// ==========================================
addLayer("p", {
    // 1. BASIC LAYER PROPERTIES
    name: "prestige", 
    symbol: "P", 
    position: 0, 
    startData() { return {
        unlocked: true,
        points: new Decimal(0),
        challengesUnlocked: false,
    }},
    color: "#2383dcd3",
    branches: ["u", "r", "s"],
    requires: new Decimal(10), 
    resource: "Prestige Points", 
    baseResource: "points", 
    baseAmount() { return player.points }, 
    type: "normal", 
    exponent: 0.5, 
    row: 0, 
    layerShown() { return true },

    // 2. GAIN MULTIPLIER (Ordered: p upgrades, u upgrades, m upgrades, buyables, challenges)
    gainMult() { 
        let mult = new Decimal(1)

        // --- Prestige (p) Upgrades ---
        if (hasUpgrade("p", 21)) mult = mult.times(3)
        if (hasUpgrade("p", 22)) mult = mult.times(2)
        if (hasUpgrade("p", 24)) mult = mult.times(upgradeEffect("p", 24))
        if (hasUpgrade("p", 33)) mult = mult.times(10000)
        if (hasUpgrade("p", 34)) mult = mult.times(player.p.points.max(1).log10().max(1))
        if (hasUpgrade("p", 41)) mult = mult.times(1000)

        // --- Ultra (u) Upgrades ---
        if (hasUpgrade("u", 11)) mult = mult.times(3)
        if (hasUpgrade("u", 12)) mult = mult.times(5)
        if (hasUpgrade("u", 15)) mult = mult.times(3)
        if (hasUpgrade("u", 21)) mult = mult.times(player.u.points.max(1).log10().max(1))
        if (hasUpgrade("u", 22)) mult = mult.times(2.5)
        if (hasUpgrade("u", 32) && player.m && player.m.unlocked) mult = mult.times(upgradeEffect("u", 32))
        if (hasUpgrade("u", 33) && player.m && player.m.unlocked) mult = mult.times(upgradeEffect("u", 33))

        // --- Mega (m) Effects / Upgrades ---
        if (hasUpgrade("m", 11)) mult = mult.times(5)
        if (hasUpgrade("m", 13)) mult = mult.times(1e9)
        if (player.m && player.m.unlocked) {
            mult = mult.times(layers.m.effect().pMult)
        }

        // --- Replicanti (r) Upgrades ---
        if (hasUpgrade("r", 24) && player.m && player.m.unlocked) mult = mult.times(upgradeEffect("r", 24))

        // --- Buyables ---
        if (getBuyableAmount("p", 11) && getBuyableAmount("p", 11).gt(0)) mult = mult.times(buyableEffect("p", 11).prestige)
        if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) mult = mult.times(buyableEffect("p", 12).prestige)

        // --- Challenges ---
        if (hasChallenge("p", 11)) mult = mult.times(10)
         
        // --- Super (s) Effects/Upgrades ---
        if (player.s && player.s.unlocked) mult = mult.times(tmp.s.effect.prestige);

        return mult
    },

    // 3. CHALLENGE CODE
    challenges: {
        11: {
            name: "Challenge 1",
            challengeDescription: "Square root your point gain",
            goalDescription: "1e9 Prestige Points",
            rewardDescription: "Points x50, Prestige Point gain x10, Ultra Point gain x5, and unlock Prestige upgrade 11.",
            canComplete() { return player.p.points.gte(1e9) },
            rewardEffect() {
                return {
                    points: new Decimal(50),
                    prestige: new Decimal(10),
                    ultra: new Decimal(5),
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

   // 4. BUYABLE CODE
   // 4. BUYABLE CODE
buyables: {
    11: {
        title: "A new buyable!",
        cost(x) { return new Decimal(100000).times(Decimal.pow(4, x)) },
        effect(x) {
            return {
                prestige: Decimal.pow(1.2, x),
            }
        },
        display() {
            let data = tmp[this.layer].buyables[this.id]
            return "Cost: " + format(data.cost) + " Prestige Points\n" +
                "Amount: " + formatWhole(getBuyableAmount(this.layer, this.id)) + "\n" +
                "Prestige point gain: x" + format(data.effect.prestige) + "\n"
        },
        unlocked() { return hasUpgrade("u", 13) || (getBuyableAmount(this.layer, this.id) && getBuyableAmount(this.layer, this.id).gt(0)) },
        canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
        buy() {
            let amount = getBuyableAmount(this.layer, this.id);
            let points = player[this.layer].points;
            let baseCost = new Decimal(100000);
            let ratio = new Decimal(4);

            let currentCost = baseCost.times(Decimal.pow(ratio, amount));
            if (points.lt(currentCost)) return;

            // O(1) calculation for extra levels: n = floor( log_r( 1 + (P * (r - 1)) / (C * r^x) ) )
            let extraLevels = points.times(ratio.sub(1))
                                    .div(currentCost)
                                    .add(1)
                                    .log(ratio)
                                    .floor();

            if (extraLevels.gte(1)) {
                if (!hasUpgrade("auto", 13)) {
                    let totalCost = currentCost.times(Decimal.pow(ratio, extraLevels).sub(1)).div(ratio.sub(1));
                    player[this.layer].points = player[this.layer].points.sub(totalCost);
                    player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(totalCost);
                }
                setBuyableAmount(this.layer, this.id, amount.add(extraLevels));
            }
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
                "Ultra Point gain: x" + format(data.effect.ultra) + "\n"
        },
        unlocked() { return hasUpgrade("u", 24) || (getBuyableAmount(this.layer, this.id) && getBuyableAmount(this.layer, this.id).gt(0)) },
        canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
        buy() {
            let amount = getBuyableAmount(this.layer, this.id);
            let points = player[this.layer].points;
            let baseCost = new Decimal("1e14");
            let ratio = new Decimal(10);

            let currentCost = baseCost.times(Decimal.pow(ratio, amount));
            if (points.lt(currentCost)) return;

            // O(1) calculation for extra levels
            let extraLevels = points.times(ratio.sub(1))
                                    .div(currentCost)
                                    .add(1)
                                    .log(ratio)
                                    .floor();

            if (extraLevels.gte(1)) {
                if (!hasUpgrade("auto", 13)) {
                    let totalCost = currentCost.times(Decimal.pow(ratio, extraLevels).sub(1)).div(ratio.sub(1));
                    player[this.layer].points = player[this.layer].points.sub(totalCost);
                    player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(totalCost);
                }
                setBuyableAmount(this.layer, this.id, amount.add(extraLevels));
            }
        },
    },
},
    // 5. UPGRADES
    upgrades: {
        rows: 4,
        cols: 5,
        11: {
            title: "First Upgrade",
            description: "Increases your point gain by x3.",
            cost: new Decimal(2),
        },
        12: {
            title: "Second Upgrade",
            description: "Quadruple your point gain.",
            cost: new Decimal(6),
            unlocked() { return hasUpgrade(this.layer, 11) },
        },
        13: {
            title: "Third Upgrade",
            description() {
                return hasUpgrade("p", 35) 
                    ? "Boosts points by prestige points^0.5. Hardcap increased to 1e20." 
                    : "Boosts points by prestige points^0.5. First hardcap at 1e12.";
            },
            cost: new Decimal(16),
            unlocked() { return hasUpgrade(this.layer, 12) },
            effect() { 
                let cap = hasUpgrade("p", 35) ? 1e20 : 1e12;
                return player[this.layer].points.pow(0.5).max(1).min(cap);
            },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        14: {
            title: "Fourth Upgrade",
            description: "Boosts points by points^0.25. First hardcap at 1e9.",
            cost: new Decimal(40),
            unlocked() { return hasUpgrade(this.layer, 13) },
            effect() { return player.points.pow(0.25).max(1).min(1e9) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        15: {
            title: "Fifth Upgrade",
            description: "Boost points by x5.",
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
            description: "Boost points and prestige points by x2.",
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
            description: "Boost ultra point gain by x25.",
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
        33: {
            title: "Thirteenth Upgrade",
            description: "Boost prestige point and ultra point gain by x10,000.",
            cost: new Decimal("1e29"),
            unlocked() { return hasUpgrade("p", 32) },
            effect() { return new Decimal(10000) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        34: {
            title: "Fourteenth Upgrade",
            description: "Boost prestige point gain by log10(Prestige points)",
            cost: new Decimal("1e41"),
            unlocked() { return hasUpgrade("p", 33) },
            effect() { return player.p.points.max(1).log10().max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        35: {
            title: "Fifteenth Upgrade",
            description: "Increases the hardcap of the Third Upgrade from 1.00e12 to 1.00e20.",
            cost: new Decimal("2.5e45"),
            unlocked() { return hasUpgrade("p", 34) },
        },
        41: {
            title: "Sixteenth Upgrade",
            description: "Boost prestige point gain by x1,000.",
            cost: new Decimal("1e92"),
            unlocked() { return hasUpgrade("p", 35) },
            effect() { return new Decimal(1000) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        42: {
            title: "Seventeenth Upgrade",
            description: "Boost point gain by x1,000,000.",
            cost: new Decimal("1e155"),
            unlocked() { return hasUpgrade("p", 41) },
        },
        43: {
            title: "Eighteenth Upgrade",
            description: "Boost point gain by x10,000,000.",
            cost: new Decimal("1e185"),
            unlocked() { return hasUpgrade("p", 42) },
        },
        44: {
            title: "Nineteenth Upgrade",
            description: "Unlock a new layer.",
            cost: new Decimal("1e200"),
            unlocked() { return hasUpgrade("p", 43) },
        },
    },

    // 6. EVERYTHING ELSE (Updates, Hotkeys, Tab Formats, Reset logic, etc.)
    update(diff) {
        // Automated Prestige Points passive gain
        if (hasUpgrade("auto", 11)) {
            let resetGain = tmp.p && tmp.p.resetGain ? tmp.p.resetGain : new Decimal(0);
            let percentage = upgradeEffect("auto", 11).div(100);
            let ppGain = resetGain.times(percentage).times(diff);
            
            player.p.points = player.p.points.add(ppGain);
            if (player.p.points.gt(player.p.best)) {
                player.p.best = player.p.points;
            }
        }

        // Automated buying of Prestige upgrades and buyables
        if (hasUpgrade("auto", 13)) {
            for (let r = 1; r <= 4; r++) {
                for (let c = 1; c <= 5; c++) {
                    let id = r * 10 + c;
                    if (layers.p.upgrades[id] && !hasUpgrade("p", id)) {
                        buyUpgrade("p", id);
                    }
                }
            }

            let buyablesList = [11, 12];
            for (let i = 0; i < buyablesList.length; i++) {
                let id = buyablesList[i];
                let buyableData = layers.p.buyables[id];
                if (buyableData && buyableData.canAfford && buyableData.canAfford()) {
                    buyableData.buy();
                }
            }
        }
    },

    gainExp() { 
        return new Decimal(1)
    },
    keepChallengeOnReset: true,
    doReset(resettingLayer) {
        if (layers[resettingLayer].row > this.row)
            layerDataReset(this.layer, ["challengesUnlocked", "activeChallenge", "challenges"])
    },
    _hotkeys: [
        { key: "p", description: "P: Reset for prestige points", onPress() { if (canReset(this.layer)) doReset(this.layer) } },
        { key: "u", description: "U: Reset for ultra points", onPress() { if (canReset("u")) doReset("u") } },
        { key: "m", description: "M: Reset for mega points", onPress() { if (canReset("m")) doReset("m") } },
        { key: "s", description: "S: Reset for super generators", onPress() { if (canReset("s")) doReset("s") } },
    ],
    get hotkeys() { return this._hotkeys },
    set hotkeys(value) { this._hotkeys = value },
    tabFormat: {
        "Upgrades": {
            content: ["main-display", "prestige-button", "resource-display", "milestones", "upgrades"],
        },
        "Buyables": {
            unlocked() { return hasUpgrade("u", 13) },
            content: ["buyables"],
        },
        "Challenges": {
            unlocked() { return player.p.challengesUnlocked && hasUpgrade("u", 23) },
            content: ["challenges"],
        },
    },
});





// ==========================================
// ULTRA LAYER ("u")
// ==========================================
addLayer("u", {
    // 1. BASIC LAYER PROPERTIES
    name: "Ultra",
    symbol: "U",
    position: 0,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
    }},
    color: "#45b36b",
    branches: ["m"],
    requires: new Decimal(500),
    resource: "Ultra Points",
    baseResource: "Prestige Points",
    baseAmount() { return player.p.points },
    type: "normal",
    exponent: 0.5,
    row: 1,
    layerShown() { return player[this.layer].unlocked },

    // 2. GAIN MULTIPLIER
    gainMult() {
        let mult = new Decimal(1)

        // --- Prestige (p) Upgrades ---
        if (hasUpgrade("p", 25)) mult = mult.times(upgradeEffect("p", 25))
        if (hasUpgrade("p", 31)) mult = mult.times(25) 
        if (hasUpgrade("p", 32)) mult = mult.times(upgradeEffect("p", 32))
        if (hasUpgrade("p", 33)) mult = mult.times(10000)

        // --- Ultra (u) Upgrades ---
        if (hasUpgrade("u", 15)) mult = mult.times(1.5)
        if (hasUpgrade("u", 22)) mult = mult.times(2)
        if (hasUpgrade("u", 23)) mult = mult.times(15)
        if (hasUpgrade("u", 32)) mult = mult.times(upgradeEffect("u", 32))    

        // --- Replicanti (r) Upgrades ---
        if (hasUpgrade("r", 24)) mult = mult.times(upgradeEffect("r", 24))

        // --- Mega (m) Effects ---
        if (player.m && player.m.unlocked) {
            mult = mult.times(layers.m.effect().uMult)
            if (hasUpgrade("m", 13)) mult = mult.times(1e9)
        }
        // --- Super (s) Effects/Upgrades ---
        if (player.s && player.s.unlocked) mult = mult.times(tmp.s.effect.ultra);

        // --- Buyables ---
        if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) mult = mult.times(buyableEffect("p", 12).ultra)

        // --- Challenges ---
        if (hasChallenge("p", 11)) mult = mult.times(5)

        return mult
    },

    // 3. UPGRADES
    upgrades: {
        rows: 4,
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
            title: "Unlock a buyable :O",
            description: "Unlocks a new tab with a repeatable buyable.",
            cost: new Decimal(100),
            unlocked() { return hasUpgrade(this.layer, 12) },
        },
        14: {
            title: "More upgrades",
            description: "Unlock prestige upgrade 24.",
            cost: new Decimal(500),
            unlocked() { return hasUpgrade(this.layer, 13) },
        },
        15: {
            title: "A lot of Boosts",
            description: "Point gain exponent x1.05, Prestige point gain x3, and ultra point gain x1.5.",
            cost: new Decimal(20000),
            unlocked() { return hasUpgrade(this.layer, 14) },
        },
        21: {
            title: "More prestige points",
            description: "Multiply prestige points by log10(ultra points).",
            cost: new Decimal(300000),
            unlocked() { return hasUpgrade(this.layer, 15) },
            effect() { return player.u.points.max(1).log10().max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        22: {
            title: "Some more boosts",
            description: "Point gain exponent x1.05, Prestige point gain x2.5, and Ultra Point gain x2.",
            cost: new Decimal(2e6),
            unlocked() { return hasUpgrade(this.layer, 21) },
        },
        23: {
            title: "Unlock a challenge.",
            description: "Unlocks the Challenges tab in the Prestige layer, and boost ultra point gain by x15.",
            cost: new Decimal(3e7),
            unlocked() { return hasUpgrade(this.layer, 22) },
            onPurchase() {
                player.p.challengesUnlocked = true
                needCanvasUpdate = true
            },
        },
        24: {
            title: "Another Buyable?",
            description: "Unlocks a new buyable in the Prestige layer.",
            cost: new Decimal(1e9),
            unlocked() { return hasUpgrade(this.layer, 23) },
            onPurchase() { needCanvasUpdate = true },
        },
        25: {
            title: "Unlock Mega",
            description: "Unlocks the Mega layer.",
            cost: new Decimal("1e21"),
            unlocked() { return hasUpgrade(this.layer, 24) },
            onPurchase() {
                if (!player.m) player.m = { unlocked: true, points: new Decimal(0) };
                player.m.unlocked = true
                needCanvasUpdate = true
            },
        },
        31: {
            title: "Ultra points boost points",
            description: "Multiplies point gain by (ultra points)^0.2.",
            cost: new Decimal("5e37"),
            unlocked() { return hasUpgrade(this.layer, 25) && hasUpgrade("m", 12) },
            effect() { return player.u.points.max(1).pow(0.2) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        32: {
            title: "That is quite a lot of boosts",
            description: "Multiplies points, prestige points, and ultra points gain by (ultra upgrades)^1.5.",
            cost: new Decimal(2e45),
            effect() { return new Decimal(player.u.upgrades.length).pow(1.5).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
            unlocked() { return hasUpgrade(this.layer, 31) },
        },
        33: {
            title: "Ultra points boost prestige points again",
            description: "Multiplies prestige points gain by 5th root of Ultra points.",
            cost: new Decimal(1e52),
            unlocked() { return hasUpgrade(this.layer, 32) },
            effect() { return player.u.points.max(1).root(5).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        34: {
            title: "small replicanti boost",
            description: "Boost Replicanti gain multiplier by 10x.",
            cost: new Decimal(1e106),
            unlocked() { return hasUpgrade(this.layer, 33) },
            effect() { return new Decimal(10) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        35: {
            title: "Ultra points boost Replicanti gain multiplier",
            description: "Boost Replicanti gain multiplier by 25th root of Ultra points.",
            cost: new Decimal(1e126),
            unlocked() { return hasUpgrade(this.layer, 34) },
            effect() { return player.u.points.max(1).root(25).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        41: {
            title: "Another Exponent",
            description: "Point Gain Exponent x1.075",
            cost: new Decimal(1e147),
            unlocked() { return hasUpgrade(this.layer, 35) },
        },
    },

    // 4. EVERYTHING ELSE (Updates, Tab Formats, etc.)
    update(diff) {
        if (hasUpgrade("auto", 12)) {
            let resetGain = tmp.u && tmp.u.resetGain ? tmp.u.resetGain : new Decimal(0);
            let percentage = upgradeEffect("auto", 12).div(100);
            let upGain = resetGain.times(percentage).times(diff);
            player.u.points = player.u.points.add(upGain);
            if (player.u.points.gt(player.u.best)) {
                player.u.best = player.u.points;
            }
        }
    },
    tabFormat: ["main-display", "prestige-button", "resource-display", "upgrades"],
});





// ==========================================
// REPLICANTI LAYER ("r")
// ==========================================
addLayer("r", {
    // 1. BASIC LAYER PROPERTIES
    name: "Replicanti",
    symbol: "R",
    position: 1,
    branches: ["m"],
    startData() { return {
        unlocked: false,
        points: new Decimal(1),
        spentOnBuyables: new Decimal(0),
    }},
    color: "#a124db",
    resource: "Replicanti",
    type: "none",
    row: 1,
    layerShown() { 
        return hasUpgrade("m", 13) || player.r.unlocked; 
    },
    doReset(resettingLayer) {
        return;
    },

    // 2. GAIN MULTIPLIER & MULTIPLIER LOGIC
    preSoftcapMult() {
        let mult = new Decimal(1);
        // --- Replicanti (r) Upgrades ---
        if (hasUpgrade("r", 11)) mult = mult.times(1.05);
        if (hasUpgrade("r", 12)) mult = mult.times(1.1);
        if (hasUpgrade("r", 13)) mult = mult.times(upgradeEffect("r", 13));
        if (hasUpgrade("r", 15)) mult = mult.times(upgradeEffect("r", 15));
        if (hasUpgrade("r", 21)) mult = mult.times(upgradeEffect("r", 21));
        if (hasUpgrade("r", 22)) mult = mult.times(upgradeEffect("r", 22));

        // --- Ultra (u) Upgrades ---
        if (hasUpgrade("u", 34)) mult = mult.times(upgradeEffect("u", 34));
        if (hasUpgrade("u", 35)) mult = mult.times(upgradeEffect("u", 35));

        // --- Buyables ---
        if (getBuyableAmount("r", 11).gt(0)) mult = mult.times(buyableEffect("r", 11).replicanti);

        // --- Super (s) Effects/Upgrades ---
        if (player.s && player.s.unlocked) mult = mult.times(tmp.s.effect.replicanti);
        
        return mult;
    },

    gainMult() {
        let mult = this.preSoftcapMult();
        let baseCap = hasUpgrade("r", 14) ? 10000 : 100;
        let capMult = getBuyableAmount("r", 11).gt(0) ? buyableEffect("r", 11).softcapDelay : new Decimal(1);
        let cap = new Decimal(baseCap).times(capMult);

        if (player.r.points.gt(cap)) {
            let debuff = player.r.points.pow(0.5);
            if (hasUpgrade("r", 14)) {
                debuff = debuff.div(10);
            }
            if (getBuyableAmount("r", 11).gt(0)) {
                debuff = debuff.div(buyableEffect("r", 11).debuffDiv);
            }
            if (hasUpgrade("r", 32)) {
                debuff = debuff.div(new Decimal(1000).sqrt());
            }    
            if (hasUpgrade("r", 33)) {
                debuff = debuff.div(10);
            }
            mult = mult.sub(1).div(debuff).add(1);
        }

        return mult;
    },

    // 3. BUYABLE CODE
    buyables: {
        11: {
            title: "Replicanti Accelerator",
            cost(x) { return new Decimal(1e9).times(Decimal.pow(10, x)) },
            display() {
                let data = tmp[this.layer].buyables[this.id]
                return "Cost: " + format(data.cost) + " Replicanti Points\n" +
                    "Amount: " + formatWhole(getBuyableAmount(this.layer, this.id)) + "\n" +
                    "Replicanti point gain: x" + format(data.effect.replicanti) + "\n" +
                    "Softcap delay: x" + format(data.effect.softcapDelay) + "\n" +
                    "Debuff reduction: /" + format(data.effect.debuffDiv)
            },
            unlocked() { return hasUpgrade("r", 23) || (getBuyableAmount(this.layer, this.id) && getBuyableAmount(this.layer, this.id).gt(0)) },
            canAfford() { return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                let cost = tmp[this.layer].buyables[this.id].cost
                player[this.layer].points = player[this.layer].points.sub(cost)
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                player[this.layer].spentOnBuyables = player[this.layer].spentOnBuyables.add(cost)
            },
            effect(x) {
                return {
                    replicanti: Decimal.pow(1.1, x),
                    softcapDelay: Decimal.pow(1.25, x),
                    debuffDiv: Decimal.pow(Math.sqrt(1.25), x),
                }
            },
        }
    },

    // 4. UPGRADES
    upgrades: {
        rows: 3,
        cols: 5,
        11: {
            title: "Is this layer a reference to something",
            description: "Increases Replicanti growth multiplier by 5%.",
            cost: new Decimal(0),
        },
        12: {
            title: "More growth",
            description: "Increases Replicanti growth multiplier by 10%.",
            cost: new Decimal(99),
            unlocked() { return hasUpgrade("r", 11) },
        },
        13: {
            title: "Points boost replicanti growth",
            description: "Boosts replicanti growth multiplier by log10(points^0.01).",
            cost: new Decimal(250),
            unlocked() { return hasUpgrade("r", 12) },
            effect() { return player.points.max(1).log10().times(0.01).add(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        14: {
            title: "Softcap Delay",
            description: "Increases the start of the Replicanti softcap from 100 to 10,000.",
            cost: new Decimal(100000),
            unlocked() { return hasUpgrade("r", 13) },
        },
        15: {
            title: "Prestige points boost Replicanti growth",
            description: "Boosts Replicanti growth multiplier by Log10(Prestige points^0.015).",
            cost: new Decimal(1e8),
            unlocked() { return hasUpgrade("r", 14) },
            effect() { return player.p.points.max(1).log10().times(0.015).add(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        21: {
            title: "Ultra points boost Replicanti growth",
            description: "Boosts Replicanti growth multiplier by Log10(Ultra points^0.025).",
            cost: new Decimal(8e8),
            unlocked() { return hasUpgrade("r", 15) },
            effect() { return player.u.points.max(1).log10().times(0.025).add(1) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        22: {
            title: "Mega points boost Replicanti growth",
            description: "Boosts replicanti growth multiplier by mega points^2.",
            cost: new Decimal(1e10),
            unlocked() { return hasUpgrade("r", 21) },
            effect() { return player.m.points.max(1).pow(2) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        23: {
            title: "Unlock a buyable.",
            description: "Unlocks a new buyable in the replicanti layer.",
            cost: new Decimal(1e12),
            unlocked() { return hasUpgrade("r", 22) },
            onPurchase() { needCanvasUpdate = true },
        },
        24: {
            title: "Finally, replicanti boosts something else!",
            description: "Boosts Points, Prestige points, and Ultra points gain by log(replicanti)^2.",
            cost: new Decimal(5e12),
            unlocked() { return hasUpgrade("r", 23) },
            effect() { 
                let logVal = player.r.points.max(1).log(2).add(1);
                return logVal.times(logVal); 
            },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        25: {
            title: "Replicanti decreases mega requirement",
            description: "Decreases the requirement for Mega by sqrt(Replicanti).",
            cost: new Decimal(1e13),
            unlocked() { return hasUpgrade("r", 24) },
            effect() { return player.r.points.max(1).pow(0.5) },
            effectDisplay() { return "/" + format(this.effect()) },
        },
        31: {
            title: "Replicanti boost points gain",
            description: "Boosts Points gain by (Replicanti)^0.2.",
            cost: new Decimal(1e25),
            unlocked() { return hasUpgrade("r", 25) },
            effect() { return player.r.points.max(1).pow(0.2) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        32: {
            title: "Softcap Delay 2",
            description: "Increases the start of the Replicanti softcap by x1,000.",
            cost: new Decimal(1e26),
            unlocked() { return hasUpgrade("r", 31) },
        },
        33: {
            title: "Debuff nerf",
            description: "Decreases the debuff from Replicanti softcap by x10.",
            cost: new Decimal(1e32),
            unlocked() { return hasUpgrade("r", 32) },
        },
        34: {
            title: "Super boost",
            description: "Boosts Super point gain by x10.",
            cost: new Decimal(1e36),
            unlocked() { return hasUpgrade("r", 33) },
        },
    },

    // 5. EVERYTHING ELSE (Updates, Tab Formats, etc.)
    update(diff) {
        if (hasUpgrade("m", 13) && !player.r.unlocked) {
            player.r.unlocked = true;
        }

        if (!player.r.unlocked) return;

        if (player.m && player.m.points.gte(4)) {
            let mult = tmp.r.gainMult;
            let rate = mult.pow(1);
            player.r.points = player.r.points.times(rate.pow(diff));
        }

        if (player.r.points.lt(1)) {
            player.r.points = new Decimal(1);
        }
    },

    tabFormat: [
        ["display-text", function() {
            return `You have <h2 style="color: #a124db; text-shadow: 0 0 10px #a124db;">${format(player.r.points, 2)}</h2> Replicanti`;
        }],
        "blank",
        ["display-text", function() {
            let hasMinMega = player.m && player.m.points.gte(4);
            let rawRate = hasMinMega ? layers.r.preSoftcapMult() : new Decimal(1);
            let finalRate = hasMinMega ? tmp.r.gainMult : new Decimal(1);
            
            let text = `Your Replicanti is multiplying by <b>x${format(finalRate, 4)}</b>/sec.`;
            
            if (!hasMinMega) {
                text += `<br><span style="color: #ffaa00;">(Requires at least 4 Mega Points to gain Replicanti)</span>`;
            } else {
                let baseCap = hasUpgrade("r", 14) ? 10000 : 100;
                let capMult = getBuyableAmount("r", 11).gt(0) ? buyableEffect("r", 11).softcapDelay : new Decimal(1);
                let cap = new Decimal(baseCap).times(capMult);

                text += `<br><span style="color: #3cedfa;">Multiplier (before softcap): x${format(rawRate, 3)}</span>`;
                text += `<br><span style="color: #888888;">Replicanti softcap threshold: ${format(cap, 2)}</span>`;
                
                if (player.r.points.gt(cap)) {
                    let debuffVal = player.r.points.pow(0.5);
                    if (hasUpgrade("r", 14)) debuffVal = debuffVal.div(10);
                    if (hasUpgrade("r", 32)) debuffVal = debuffVal.div(new Decimal(1000).sqrt());
                    if (hasUpgrade("r", 33)) debuffVal = debuffVal.div(10);
                    if (getBuyableAmount("r", 11).gt(0)) {
                        debuffVal = debuffVal.div(buyableEffect("r", 11).debuffDiv);
                    }
                    text += `<br><span style="color: #ff4444;">(Softcapped: (mult - 1) / ${format(debuffVal, 3)} + 1)</span>`;
                }
            }
            return text;
        }],
        "blank",
        "upgrades",
        "buyables",
    ],
});





// ==========================================
// MEGA LAYER ("m")
// ==========================================
addLayer("m", {
    // 1. BASIC LAYER PROPERTIES & FUNCTIONS
    name: "Mega",
    symbol: "M",
    position: 0,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
    }},
    color: "#040447",
    resource: "Mega Points",
    baseResource: "Ultra Points",
    baseAmount() { return player.u.points },
    type: "static",
    base: 100,
    exponent: 3,
    row: 2,
    layerShown() { return (player.m && player.m.unlocked) || hasUpgrade("u", 25) },

    requires() {
        let baseReq = new Decimal("1e21");
        //---Replicanti (r) Upgrades ---
        if (hasUpgrade('r', 25)) baseReq = baseReq.div(upgradeEffect("r", 25));

        //---Super (s) Effects/Upgrades ---
        if (player.s && player.s.unlocked) baseReq = baseReq.div(tmp.s.effect.mega);
        

        return baseReq;
    },

    effect() {
        let m = player[this.layer].points;
        return {
            pMult: m.add(1).pow(2),
            uMult: m.add(1).pow(1.5)
        };
    },

    effectDescription() {
        if (!player[this.layer].unlocked) return "";
        let eff = this.effect();
        return `boosting Prestige Points by x${format(eff.pMult)} and Ultra Points by x${format(eff.uMult)}`;
    },

    // 2. UPGRADES
    upgrades: {
        rows: 1,
        cols: 8,
        11: {
            title: "First Mega Upgrade :O",
            description: "Boosts point gain by x10 and prestige point gain by x5.",
            cost: new Decimal(1),
        },
        12: {
            title: "Took some time...?",
            description: "Unlocks a new upgrade in the ultra layer.",
            cost: new Decimal(3),
            unlocked() { return hasUpgrade("m", 11) },
        },
        13: {
            title: "Unlock a new layer. And some buffs too",
            description: "Unlocks the replicanti layer. Multiply Prestige points and Ultra points by 1e9.",
            cost: new Decimal(4),
            unlocked() { return hasUpgrade("m", 12) },
        },
    },

    // 3. EVERYTHING ELSE (Resets, etc.)
    doReset(resettingLayer) {
        let keep = [];
        if (layers[resettingLayer].row > this.row) {
            layerDataReset(this.layer, keep);
        }

        let keepUpgs = ["upgrades"];
        layerDataReset("u", keepUpgs);

        if (player.u && player.u.upgrades) {
            player.u.upgrades = player.u.upgrades.filter(id => id === 25);
        }

        if (player.p) {
            if (player.p.challenges) {
                Vue.set(player.p.challenges, 11, 0);
            }
            if (player.p.activeChallenge === 11) {
                player.p.activeChallenge = null;
            }
        }
    },
});





// ==========================================
// SUPER LAYER ("s")
// ==========================================
addLayer("s", {
    // 1. BASIC LAYER PROPERTIES
    name: "Super",
    symbol: "S",
    position: 1, 
    row: 2, 
    color: "#0e3f0a",
    resource: "Super Generator",
    baseResource: "Prestige Points",
    baseAmount() { return player.p.points },
    
    // Static layer configuration
    type: "static",
    requires: new Decimal("1e200"), // Initial cost: 1e200 Prestige Points
    base: 100,                      // Standard base scaling for static cost steps
    exponent: 2.5,                  // Static scaling exponent
    
    startData() { return {
        unlocked: false,
        points: new Decimal(0),       // "Super" amount from static resets
        superPoints: new Decimal(0),  // "Super Points" generated passively
    }},

    // Layer unlocks when Prestige Upgrade 44 is owned
    unlocked() { return hasUpgrade("p", 44) },
    layerShown() { return hasUpgrade("p", 44) || player.s.unlocked },

    // 2. GAIN MULTIPLIER & AFFECTING CHECKS
    getSuperPointMult() {
        let mult = new Decimal(1);
        if (hasUpgrade("s", 11)) mult = mult.times(3);
        if (hasUpgrade("s", 12)) mult = mult.times(10);
        if (hasUpgrade("r", 34)) mult = mult.times(10);
        return mult;
    },

    // 3. CHALLENGES (If present)
    // challenges: {},

    // 4. BUYABLES (If present)
    // buyables: {},

    // 5. UPGRADES
    upgrades: {
        rows: 1,
        cols: 5,
        11: {
            title: "Super points boost alot of things...",
            description: "Boosts Super Points gain by x3.",
            cost: new Decimal(1),
            unlocked() { return true },
        },
        12: {
            title: "More boosts",
            description: "Boosts Super Points gain by x10.",
            cost: new Decimal(2),
            unlocked() { return hasUpgrade("s", 11) },
        },
    },

    // 6. EVERYTHING ELSE (Effects, Updates, Tab Format)
    effect() {
        let sp = player[this.layer].superPoints;
        return {
            points: sp.max(1).pow(0.075),
            prestige: sp.max(1).pow(0.05),
            ultra: sp.max(1).pow(0.03),
            replicanti: sp.max(1).pow(0.0175),
            mega: sp.max(1).pow(1.25),
        };
    },

    effectDescription() {
        if (!player[this.layer].unlocked) return "";
        let eff = this.effect();
        return `Super points are: Boosting Points by x${format(eff.points)}, Prestige Points by x${format(eff.prestige)}, Ultra Points by x${format(eff.ultra)}, Replicanti multiplier by x${format(eff.replicanti)}, and Mega decreasing Mega Requirement by x${format(eff.mega)}`;
    },

    update(diff) {
        if (!player.s.unlocked) return;

        // Only generate Super Points if Super amount is at least 1
        let genRate = player.s.points.gte(1) 
            ? new Decimal(2).pow(player.s.points.pow(2)).times(layers.s.getSuperPointMult()) 
            : new Decimal(0);

        player.s.superPoints = player.s.superPoints.add(genRate.times(diff));
    },

    tabFormat: [
        ["display-text", function() {
            return `You have <h2 style="color: #ff3366; text-shadow: 0 0 10px #ff3366;">${format(player.s.superPoints, 2)}</h2> Super Points`;
        }],
        ["display-text", function() {
            let genRate = player.s.points.gte(1) 
                ? new Decimal(2).pow(player.s.points.pow(2)).times(layers.s.getSuperPointMult()) 
                : new Decimal(0);
            return `Gaining <b>+${format(genRate)}</b> Super Points/sec ${player.s.points.gte(1) ? "(based on your Super amount)" : "(Requires at least 1 Super)"}`;
        }],
        "blank",
        "main-display",
        "prestige-button",
        "resource-display",
        "blank",
        "upgrades",
    ],
});



// ==========================================
// AUTOMATION LAYER ("auto")
// ==========================================
addLayer("auto", {
    // 1. BASIC LAYER PROPERTIES & FUNCTIONS
    name: "Automation",
    symbol: "A",
    position: 0,
    row: "side",
    color: "#44baff",
    resource: "Auto Points",
    baseResource: "points",
    baseAmount() { return player.points },
    type: "static",
    base: 2,
    exponent: 1.5,
    requires: new Decimal(1),
    startData() { return {
        unlocked: true,
        points: new Decimal(0),
        best: new Decimal(0),
        total: new Decimal(0),
    }},
    layerShown() { return true },

    // 2. UPGRADES
    upgrades: {
        rows: 1,
        cols: 8,
        11: {
            title: "Automated Prestige Gain",
            description: "Automatically gain Prestige Points based on Auto Point Amount.",
            cost: new Decimal(21),
            display() {
                return this.description + "<br><br>Cost: " + this.cost.toFixed(2) + " Auto Points";
            },
            effect() {
                let gain = player.auto.points.pow(2).div(33.33);
                return gain.max(10);
            },
            effectDisplay() {
                return "+" + format(upgradeEffect("auto", 11)) + "%/sec";
            },
        },
        12: {
            title: "Automated Ultra Gain",
            description: "Automatically gain Ultra Points based on Auto Point Amount.",
            cost: new Decimal(29),
            display() {
                return this.description + "<br><br>Cost: " + this.cost.toFixed(2) + " Auto Points";
            },
            effect() {
                let gain = player.auto.points.pow(2).div(50);
                return gain.max(10);
            },
            effectDisplay() {
                return "+" + format(upgradeEffect("auto", 12)) + "%/sec";
            },
        },
        13: {
            title: "Automated Prestige Upgrades/Buyables.",
            description: "Automatically buys Prestige Upgrades and Buyables.",
            cost: new Decimal(54),
        },
    },

    // 3. EVERYTHING ELSE (Updates, Tab Formats, Resets)
    doReset(resettingLayer) {
        return;
    },

    update(diff) {
        if (!player.auto.unlocked) return;

        if (canReset("auto")) {
            let passiveGain = new Decimal(1);
            player.auto.points = player.auto.points.add(passiveGain);
            
            if (player.auto.points.gt(player.auto.best)) {
                player.auto.best = player.auto.points;
            }
        }
    },

    tabFormat: [
        ["display-text", function() {
            let req = getNextAt("auto");
            let ppPerSec = new Decimal(0);
            if (hasUpgrade("auto", 11)) {
                let resetGain = tmp.p && tmp.p.resetGain ? tmp.p.resetGain : new Decimal(0);
                let effectVal = upgradeEffect("auto", 11);
                ppPerSec = resetGain.times(effectVal).div(100);
            }
            let upPerSec = new Decimal(0);
            if (hasUpgrade("auto", 12)) {
                let resetGain = tmp.u && tmp.u.resetGain ? tmp.u.resetGain : new Decimal(0);
                let effectVal = upgradeEffect("auto", 12);
                upPerSec = resetGain.times(effectVal).div(100);
            }

            return `<h2 style="color: #616161; text-shadow: 0 0 10px #616161; font-weight: normal;">You have <span style="font-size: 1.2em; font-weight: normal; color: #616161;">${format(player.auto.points, 2)}</span> Auto Points</h2>` +
                    `<p style="color: #616161; font-weight: normal; margin-top: 5px;">Next: <b>${format(req)}</b> Points</p>` +
                    `<p style="color: #616161; font-weight: normal; margin-top: 5px;">Gaining <b>+${format(ppPerSec)}</b> PP/sec</p>` +
                    `<p style="color: #616161; font-weight: normal; margin-top: 5px;">Gaining <b>+${format(upPerSec)}</b> UP/sec</p>`;
        }],
        "blank",
        "blank",
        "blank",
        "upgrades",
    ],
});





// ==========================================
// INFORMATION LAYER ("i")
// ==========================================
addLayer("i", {
    // 1. BASIC LAYER PROPERTIES
    name: "Information",
    symbol: "I",
    position: 0,
    row: "side",
    color: "#ffcc00",
    resource: "Info Points", // Not used for currencies, but required by TMT
    baseResource: "points",
    baseAmount() { return player.points },
    type: "none",
    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},
    layerShown() { return true },

    // 2. EVERYTHING ELSE (Tab Formats, etc.)
    tabFormat: [
        ["display-text", function() {
            return `
                <div style="border: 2px solid #ffcc00; padding: 15px; border-radius: 10px; background-color: rgba(255, 204, 0, 0.1);">
                    <h3 style="color: #ffcc00; margin-top: 0;">Game Information</h3>
                    <p style="font-size: 1.1em; color: #dfdfdf;">There is no offline progress in this game.</p>
                </div>
            `;
        }],
    ],
});
// --- End of Info Layer ---