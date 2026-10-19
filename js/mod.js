let modInfo = {
	name: "The Random Prestige Tree",
	author: "yuky",
	pointsName: "points",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal (0), // Used for hard resets and new players
	offlineLimit: 1,  // In hours
}

// Set your version in num and name
let VERSION = {
	num: "1.4",
	name: "Getting somewhere..?",
}

let changelog = `<h1>Changelog:</h1><br>
    <h3>v1.3</h3><br>
	-Added some balancing (might still be unbalanced)<br>
	-Remade the mega layer (Now is a static layer)<br>
	-Added hotkeys for Prestige, Ultra, and Mega layers<br>
	-Added More Upgrades to the three layers<br>
	-Temporarily removed automation layer (Will be added back in the future)<br>
	-Upgrades in each layer:<br>
	&nbsp;&nbsp;Prestige: 14<br>
	&nbsp;&nbsp;Ultra: 10<br>
	&nbsp;&nbsp;Mega: 2<br>


	<h3>v1.2</h3><br>
		- Added 2 New Layers (Mega Unfinished)<br>
		- Upgrades in each layer:<br>
		&nbsp;&nbsp;Prestige: 12<br>
		&nbsp;&nbsp;Ultra: 10<br>
		&nbsp;&nbsp;Automation: 3<br>
		&nbsp;&nbsp;Mega: 1<br>
		- New endgame: Mega Upgrade 1, 5e23 Points.<br><br>
	<h3>v1.1</h3><br>
		- Added 5 Upgrades to the second layer (Renamed Ultra)<br>
		- Added a Buyable to the prestige layer<br>
		- Added 2 New Upgrades to the prestige layer<br>
		- Endgame: 1.00e9 Prestige Points<br><br>
	<h3>v1.0</h3><br>
		- Added 8 Upgrades and a temporary empty layer.<br>
		- Endgame: Upgrade 8.<br><br>
	<h3>v0.0</h3><br>
		- Added things.<br>
		- Added stuff.`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints(){
	return true
}

// Calculate points/sec!
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(1)
	if (hasUpgrade("p", 11)) gain = gain.times(3)
	if (hasUpgrade("p", 12)) gain = gain.times(4)
	if (hasUpgrade("p", 13)) gain = gain.times(player.p.points.pow(new Decimal(1).div(2)).max(1).min(1e12))
	if (hasUpgrade("p", 14)) gain = gain.times(player.points.pow(0.25).max(1).min(1e9))
	if (hasUpgrade("p", 15)) gain = gain.times(5)
	if (hasUpgrade("p", 22)) gain = gain.times(2)
	if (hasUpgrade("u", 11)) gain = gain.times(5)
	if (hasUpgrade("u", 12)) gain = gain.times(10)
	if (hasUpgrade("u", 15)) gain = gain.times(10)
	if (hasUpgrade("u", 17)) gain = gain.times(5)
	if (hasChallenge("p", 11)) gain = gain.times(50)
	if (hasUpgrade("m", 11)) gain = gain.times(10)
	if (getBuyableAmount("p", 12) && getBuyableAmount("p", 12).gt(0)) gain = gain.times(buyableEffect("p", 12).points)
	if (inChallenge("p", 11)) gain = gain.pow(0.5)
	return gain
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
}}

// Display extra things at the top of the page
var displayThings = [
    performanceDisplay,
]

// Determines when the game "ends"
function isEndgame() {
	return player.points.gte(new Decimal("e280000000"))
}



// Less important things beyond this point!

// Style for the background, can be a function
var backgroundStyle = {

}

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(3600) // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
	if (player.s) {
		player.u = Object.assign(player.u, player.s)
		fixData(getStartLayerData("u"), player.u)
		delete player.s
	}
	if (player.tab === "s") player.tab = "u"
	if (player.navTab === "s") player.navTab = "u"
	if (player.lastSafeTab === "s") player.lastSafeTab = "u"
	if (player.p.upgrades.includes(23)) player.u.unlocked = true
}
// ==========================================
// Ticks per second (TPS) tracking and display
// ==========================================

// 1. Tracking variables (place near the top of mod.js)
let frameCount = 0;
let tps = 0;
let lastTime = performance.now();

// 2. Function to update stats (call inside your gameLoop(diff))
function updatePerformanceStats(diff) {
    frameCount++;
    let currentTime = performance.now();
    
    // Every 1 second (1000ms), calculate actual TPS
    if (currentTime - lastTime >= 1000) {
        tps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }
}

// 3. UI Display function (you can put this directly inside a layer's tabFormat array)
function performanceDisplay() {
    return "<b>TPS:</b> " + tps;
}