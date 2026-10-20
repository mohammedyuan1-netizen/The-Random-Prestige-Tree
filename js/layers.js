addLayer("p", {
    name: "prestige", 
    symbol: "P", 
    position: 0, 
    startData() { return {
        unlocked: true,
        points: new Decimal(0),
        challengesUnlocked: false,
    }},
    color: "#2383dcd3",
    branches: ["u","r"],
    requires: new Decimal(10), 
    resource: "Prestige Points", 
    baseResource: "points", 
    baseAmount() { return player.points }, 
    type: "normal", 
    exponent: 0.5, 
    gainMult() { 
        let mult = new Decimal(1)
        if (hasUpgrade("p", 21)) mult = mult.times(3)
        if (hasUpgrade("u", 11)) mult = mult.times(3)
        if (hasUpgrade("u", 12)) mult = mult.times(5)
        if (hasUpgrade("u", 13)) mult = mult.times(buyableEffect("p", 11).prestige)
        if (hasUpgrade("u", 15)) mult = mult.times(3)
        if (hasUpgrade("u", 21)) mult = mult.times(player.u.points.max(1).log10().max(1))    
        if (hasUpgrade("u", 22)) mult = mult.times(2.5)
        if (hasUpgrade("p", 24)) mult = mult.times(upgradeEffect("p", 24))
        if (hasChallenge("p", 11)) mult = mult.times(10)
        if (hasUpgrade("m", 11)) mult = mult.times(5)
        if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) mult = mult.times(buyableEffect("p", 12).prestige)
        if (player.m && player.m.unlocked) {
            mult = mult.times(layers.m.effect().pMult)
            if (hasUpgrade("p", 33)) mult = mult.times(10000)
            if (hasUpgrade("p", 34)) mult = mult.times(player.p.points.max(1).log10().max(1))
            if (hasUpgrade("u", 32)) mult = mult.times(upgradeEffect("u", 32))
            if (hasUpgrade("p", 41)) mult = mult.times(1000)            
        }    
        return mult
    },

    update(diff) {
        if (hasUpgrade("auto", 11)) {
            let resetGain = tmp.p && tmp.p.resetGain ? tmp.p.resetGain : new Decimal(0);
            let percentage = upgradeEffect("auto", 11).div(100);
            let ppGain = resetGain.times(percentage).times(diff);
            
            player.p.points = player.p.points.add(ppGain);
            if (player.p.points.gt(player.p.best)) {
                player.p.best = player.p.points;
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
    row: 0, 
    _hotkeys: [
        { key: "p", description: "P: Reset for prestige points", onPress() { if (canReset(this.layer)) doReset(this.layer) } },
        { key: "u", description: "U: Reset for ultra points", onPress() { if (canReset("u")) doReset("u") } },
        { key: "m", description: "M: Reset for mega points", onPress() { if (canReset("m")) doReset("m") } },
    ],
    get hotkeys() {
        return this._hotkeys
    },
    set hotkeys(value) {
        this._hotkeys = value
    },
    layerShown() { return true },
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
            goalDescription: "1e8 Prestige Points",
            rewardDescription: "Points x50, Prestige Point gain x10, Ultra Point gain x5, and unlock Prestige upgrade 31.",
            canComplete() { return player.p.points.gte(1e8) },
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
                    "Ultra Point gain: x" + format(data.effect.ultra) + "\n"
            },
            unlocked() { return hasUpgrade("u", 24) || (getBuyableAmount(this.layer, this.id) && getBuyableAmount(this.layer, this.id).gt(0)) },
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
                    ? "Boosts points by prestige points^0.5. Hardcap increased to 1e50." 
                    : "Boosts points by prestige points^0.5. First hardcap at 1e12.";
            },
            cost: new Decimal(16),
            unlocked() { return hasUpgrade(this.layer, 12) },
            effect() { 
                let cap = hasUpgrade("p", 35) ? 1e50 : 1e12;
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
            cost: new Decimal("1e33"),
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
            description: "Increases the hardcap of the Third Upgrade from 1.00e12 to 1.00e50.",
            cost: new Decimal("1e60"),
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
    },
})
// --- End of Prestige Layer ---

addLayer("u", {
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
    tabFormat: ["main-display", "prestige-button", "resource-display", "upgrades"],
    update(diff) {
        if (hasUpgrade("auto", 12)) {
            let resetGain = tmp.u && tmp.u.resetGain ? tmp.u.resetGain : new Decimal(0);
            let percentage = upgradeEffect("auto", 12).div(100); // Fixed from .div(50) to .div(100)
            let upGain = resetGain.times(percentage).times(diff);
            player.u.points = player.u.points.add(upGain);
            if (player.u.points.gt(player.u.best)) {
                player.u.best = player.u.points;
            }
        }
    },
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
            description: "Point gain x10, Prestige point gain x3, and ultra point gain x1.5.",
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
            description: "Point gain x5, Prestige point gain x2.5, and Ultra Point gain x2.",
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
            unlocked() { return hasUpgrade(this.layer, 25) },
            effect() { return player.u.points.max(1).pow(0.2) },
            effectDisplay() { return format(this.effect()) + "x" },
        },
        32: {
            title: "That is quite a lot of boosts",
            description: "Multiplies points, prestige points, and ultra points gain by (ultra upgrades)^1.5.",
            cost: new Decimal("1e43"),
            effect() { return new Decimal(player.u.upgrades.length).pow(1.5).max(1) },
            effectDisplay() { return format(this.effect()) + "x" },
            unlocked() { return hasUpgrade(this.layer, 31) },
        }
    },
    gainMult() {
        let mult = new Decimal(1)
        if (hasUpgrade("u", 13)) mult = mult.times(buyableEffect("p", 11).ultra)
        if (hasUpgrade("p", 25)) mult = mult.times(upgradeEffect("p", 25))
        if (hasUpgrade("p", 31)) mult = mult.times(25) 
        if (hasUpgrade("p", 32)) mult = mult.times(upgradeEffect("p", 32))
        if (hasUpgrade("u", 15)) mult = mult.times(1.5)
        if (hasUpgrade("u", 22)) mult = mult.times(2)
        if (hasUpgrade("u", 23)) mult = mult.times(15)
        if (hasChallenge("p", 11)) mult = mult.times(5)
        if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) mult = mult.times(buyableEffect("p", 12).ultra)
        if (player.m && player.m.unlocked) {
            mult = mult.times(layers.m.effect().uMult)
        }
        if (hasUpgrade("p", 33)) mult = mult.times(10000)
        if (hasUpgrade("u", 32)) mult = mult.times(upgradeEffect("u", 32))    
        return mult
    },
})
// --- End of Ultra Layer ---
 addLayer("r", {
    name: "Replicanti",
    symbol: "R",
    position: 1,
    branches: ["m"],
    startData() { return {
        unlocked: false,
        points: new Decimal(1), // Starts at 1 Replicanti
    }},
    color: "#a124db",
    resource: "Replicanti",
    type: "none", // Passive layer: no manual reset or prestige button
    row: 1, // Row 1

    // Layer unlocks when Mega Upgrade 13 is purchased
    layerShown() { 
        return hasUpgrade("m", 13) || player.r.unlocked; 
    },

    // Automatically unlocks the layer when Mega Upgrade 13 is bought
    update(diff) {
        if (hasUpgrade("m", 13) && !player.r.unlocked) {
            player.r.unlocked = true;
        }

        if (!player.r.unlocked) return;

        // Requires at least 4 Mega Points to generate Replicanti
        if (player.m && player.m.points.gte(4)) {
            // Base multiplier from gainMult()
            let mult = tmp.r.gainMult;
            let rate = mult.pow(1);

            // Multiply Replicanti points over time: points = points * (rate ^ diff)
            player.r.points = player.r.points.times(rate.pow(diff));
        }

        // Ensure Replicanti never drops below 1
        if (player.r.points.lt(1)) {
            player.r.points = new Decimal(1);
        }
    },

    // Calculate base multiplier before Replicanti's own growth
    gainMult() {
        let mult = new Decimal(1);
        if (hasUpgrade("r", 11)) mult = mult.times(1.05);
        if (hasUpgrade("r", 12)) mult = mult.times(1.1);
        if (hasUpgrade("r", 13)) mult = mult.times(upgradeEffect("r", 13));

        // Softcap: If past the cap (100 normally, 10,000 with Upgrade 14)
        let cap = hasUpgrade("r", 14) ? 10000 : 100;
        if (player.r.points.gt(cap)) {
            let debuff = player.r.points.pow(0.5);
            if (hasUpgrade("r", 14)) {
                debuff = debuff.div(10);
            }
            mult = mult.sub(1).div(debuff).add(1);
        }

        return mult;
    },

    // Prevents this layer's data from being reset when resetting other layers
    doReset(resettingLayer) {
        return;
    },

    tabFormat: [
        ["display-text", function() {
            // Displays Replicanti amount to 2 decimal places
            return `You have <h2 style="color: #a124db; text-shadow: 0 0 10px #a124db;">${format(player.r.points, 2)}</h2> Replicanti`;
        }],
        "blank",
        ["display-text", function() {
            let hasMinMega = player.m && player.m.points.gte(4);
            let rate = hasMinMega ? tmp.r.gainMult.pow(1) : new Decimal(1);
            
            // Displays multiplier rate per second to 3 decimal places
            let text = `Your Replicanti is multiplying by <b>x${format(rate, 3)}</b>/sec.`;
            
            if (!hasMinMega) {
                text += `<br><span style="color: #ffaa00;">(Requires at least 4 Mega Points to gain Replicanti)</span>`;
            } else {
                let cap = hasUpgrade("r", 14) ? 10000 : 100;
                if (player.r.points.gt(cap)) {
                    let debuffVal = player.r.points.pow(0.5);
                    if (hasUpgrade("r", 14)) debuffVal = debuffVal.div(10);
                    text += `<br><span style="color: #888888;">Replicanti softcap: ${format(cap, 3)}</span>`;
                    text += `<br><span style="color: #ff4444;">(Softcapped: (mult-1) / ${format(debuffVal, 3)} + 1)</span>`;
                }
            }
            return text;
        }],
        "blank",
        "upgrades"
    ],

    upgrades: {
        rows: 1,
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
            cost: new Decimal(1000),
            unlocked() { return hasUpgrade("r", 13) },
        }
    },
});
// --- End of Replicanti Layer ---
addLayer("m", {
    name: "Mega",
    symbol: "M",
    position: 0,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
    }},
    color: "#040447",
    
    requires() {
        let baseReq = new Decimal("1e21");

        if (hasUpgrade('u', 31)) {
            let reduction = player.points.pow(0.3);
            
            if (reduction.lt(1)) {
                reduction = new Decimal(1);
            }

            baseReq = baseReq.div(reduction);

            if (baseReq.lt("1e21")) {
                baseReq = new Decimal("1e21");
            }
        }

        return baseReq;
    },
    resource: "Mega Points",
    baseResource: "Ultra Points",
    baseAmount() { return player.u.points },
    type: "static",
    base: 100,
    exponent: 3,
    
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

    row: 2,
    layerShown() { return (player.m && player.m.unlocked) || hasUpgrade("u", 25) },
    
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
            title: "Unlock a new layer.",
            description: "Unlocks the replicanti layer.",
            cost: new Decimal(4),
            unlocked() { return hasUpgrade("m", 12) },

    },
}})
// --- End of Mega Layer ---

addLayer("auto", {
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
            cost: new Decimal(50),
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
        }
    }
})
// --- End of Automation Layer ---
addLayer("i", {
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

