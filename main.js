//var game; //Outside for testing
var largeSuffixes = ["million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion", "decillion"];
var shortSuffixes = ["M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
var z = 0;

function onload() {
	var game = new Game();
	
	var build = document.getElementById("build-space");
	build.innerHTML = "";
	for (var i = 0; i < game.buildings.length; i++){
		var m_build = document.createElement("div");
		m_build.className = "building";
		m_build.addEventListener("click", (function (_i) {
			return function () {
				game.buy(_i);
			}
		})(i));
		
		var name = document.createElement("span");
		name.innerHTML = game.buildings[i].name;
		name.className = "build-name";
		m_build.appendChild(name);
		
		var num = document.createElement('span');
		num.innerHTML = game.buildings[i].num;
		num.className = "build-num";
		m_build.appendChild(num);
		m_build.appendChild(document.createElement('br'));
		
		var costbar = document.createElement('span');
		var cost = document.createElement('span');
		var format = game.formatlarge(game.buildings[i].cost);
		cost.innerHTML = format; //Will be changed for loading
		cost.className = "build-cost";
		var unit = document.createElement('span');
		unit.innerHTML = "notes";
		unit.className = "build-cost-unit";
		costbar.appendChild(unit);
		costbar.appendChild(cost);
		costbar.className = "build-cost-bar";
		m_build.appendChild(costbar);
		
		var hover = document.createElement('div');
		var flavor = document.createElement('span');
		flavor.innerHTML = game.buildings[i].description;
		flavor.className = "flavor";
		hover.appendChild(flavor);
		hover.innerHTML += "<br/>";
		hover.innerHTML += "Each building provides ";
		var mps = document.createElement('span');
		mps.innerHTML = game.buildingMps(i);
		mps.className = "build-mps";
		hover.appendChild(mps);
		hover.innerHTML += " notes/sec";
		hover.className = "hover";
		m_build.appendChild(hover);
		
		build.appendChild(m_build);
	}
	
	var selector = document.getElementById("clicktrack-dropdown");
	selector.addEventListener("change", function () {
		game.trackchange(this.value);
	});
	selector.style.display = "none"; //will be set when loading/when the upgrade is bought
	document.getElementById("consecutive-clicks").style.display = "none";
	
	var clicker = document.getElementById("clicker");
	clicker.addEventListener("mousedown", function () {
		game.click();
	});
	
	var specEl = document.getElementById("special");
	specEl.addEventListener("mousedown", function () {
		game.special.clicked(game);
		this.style.display = "none";
	});
	
	var tabs = document.getElementsByClassName("tab");
	for (var i = 0; i < tabs.length; i++){
		tabs[i].addEventListener("click", game.tabswitch);
	}
	var tabspaces = document.getElementsByClassName("tab-space");
	for (var i = 0; i < tabspaces.length; i++){
		if (i != 0){
			tabspaces[i].style.display =  "none";
		}
	}
	
	var saveEl = document.getElementById("save");
	saveEl.addEventListener("click", function () {game.save();});
	
	var importEl = document.getElementById("import");
	importEl.addEventListener("click", function () {game.importgame();});
	
	var exportEl = document.getElementById("export");
	exportEl.addEventListener("click", function () {game.exportgame();});
	
	var softResetEl = document.getElementById("soft-reset");
	softResetEl.addEventListener("click", function() {game.softreset();});
	
	var hardResetEl = document.getElementById("hard-reset");
	hardResetEl.addEventListener("click", function() {game.hardreset(1);});
	
	var mute = document.getElementById("mute");
	mute.addEventListener("click", function() {
		game.togglemute(mute);
	});
	
	game.uitick();
	
	game.timeoutPointer = setTimeout(game.gametick, 33, game);
}

function Game() {
	this.buildings = [
		{name: "Clickers", description: "Clicks the cowbell for you!", num: 0, cost: 10, growth: 1.15, mps: 0.2},
		{name: "Band", description: "A band to help bang the cowbell!", num: 0, cost: 150, growth: 1.15, mps: 2},
		{name: "Synthesizer", description: "Digitally construct more cowbell!", num: 0, cost: 1000, growth: 1.15, mps: 6},
		{name: "Mine", description: "Mine materials for more cowbells!", num: 0, cost: 40000, growth: 1.15, mps: 35},
		{name: "Virtual Reality", description: "Create new worlds to fill with cowbell!", num: 0, cost: 240000, growth: 1.15, mps: 75},
		{name: "Solar Panels", description: "Turn the sun's energy in to more cowbell!", num: 0, cost: 2000000, growth: 1.15, mps: 500},
		{name: "Amplifier", description: "Amplify old cowbells to faint to hear!", num: 0, cost: 36000000, growth: 1.15, mps: 3000},
		{name: "Magician", description: "Use magic to create more cowbell!", num: 0, cost: 1000000000, growth: 1.15, mps: 25000}
	];
	//Engineers/Scientists?
	
	//upgrades and achievements are essentially lists of listeners which will be notfied at every game tick
	//When unlocked/achieved, they will be removed from the original list as a deregistration from the notifier.
	this.upgrades = [
		{id: 1, disp: 1, cost: 50, name: "Faster Clickers", description: "Doubles the notes per second from Clickers", builds: [1,0,0,0,0,0,0,0]},
		{id: 2, disp: 2, cost: 200, name: "Harder Clickers", description: "Doubles the notes per second from Clickers", builds: [10,0,0,0,0,0,0,0], upgrades: [1]},
		{id: 3, disp: 3, cost: 10000, name: "Mechanical Clickers", description: "Doubles the notes per second from Clickers", builds: [25,0,0,0,0,0,0,0], upgrades: [2], flavor: "Much louder than the original kind, but I swear it's faster"},
		{id: 4, disp: 4, cost: 600000, name: "Robotic Clickers", description: "Doubles the notes per second from Clickers", builds: [50,0,0,0,0,0,0,0], upgrades: [3]},
		{id: 5, disp: 5, cost: 1500000000, name: "Intelligent Clickers", description: "Doubles the notes per second from Clickers", builds: [100,0,0,0,0,0,0,0], upgrades: [4]},
		{id: 6, disp: 6, cost: 2000000000000, name: "Sentient Clickers", description: "Doubles the notes per second from Clickers", builds: [150,0,0,0,0,0,0,0], upgrades: [5], flavor: "Has science gone too far?"},
		{id: 7, disp: 7, cost: 5000000000000000, name: "Overlord Clickers", description: "Doubles the notes per second from Clickers", builds: [200,0,0,0,0,0,0,0], upgrades: [6]},
		{id: 8, disp: 8, cost: 750, name: "We're an American Band", description: "Doubles the notes per second from Bands", builds: [0,1,0,0,0,0,0,0], flavor: "Grand Funk Railroad"},
		{id: 9, disp: 9, cost: 3000, name: "Don't Fear the Reaper", description: "Doubles the notes per second from Bands", builds: [0,10,0,0,0,0,0,0], upgrades: [8], flavor: "Blue Öyster Cult"},
		{id: 10, disp: 10, cost: 150000, name: "King of Rock", description: "Doubles the notes per second from Bands", builds: [0,25,0,0,0,0,0,0], upgrades: [9], flavor: "Run DMC"},
		{id: 11, disp: 11, cost: 10000000, name: "Hey Ladies", description: "Doubles the notes per second from Bands", builds: [0,50,0,0,0,0,0,0], upgrades: [10], flavor: "Beastie Boys"},
		{id: 12, disp: 12, cost: 20000000000, name: "Honky Tonk Woman", description: "Doubles the notes per second from Bands", builds: [0,100,0,0,0,0,0,0], upgrades: [11], flavor: "Rolling Stones"},
		{id: 13, disp: 13, cost: 50000000000000, name: "Hair of the Dog", description: "Doubles the notes per second from Bands", builds: [0,150,0,0,0,0,0,0], upgrades: [12], flavor: "Nazareth"},
		{id: 14, disp: 14, cost: 50000000000000000, name: "Low Rider", description: "Doubles the notes per second from Bands", builds: [0,200,0,0,0,0,0,0], upgrades: [13], flavor: "War"},
		{id: 15, disp: 15, cost: 5000, name: "1 Synth", description: "Doubles the notes per second from Synths", builds: [0,0,1,0,0,0,0,0]},
		{id: 16, disp: 16, cost: 50000, name: "10 Synth", description: "Doubles the notes per second from Synths", builds: [0,0,10,0,0,0,0,0], upgrades: [15]},
		{id: 17, disp: 17, cost: 1000000, name: "25 Synth", description: "Doubles blah balh", builds: [0,0,25,0,0,0,0,0], upgrades: [16]},
		{id: 18, disp: 18, cost: 60000000, name: "50 Synth", description: "Doubles blah again", builds: [0,0,50,0,0,0,0,0], upgrades: [17]},
		{id: 19, disp: 19, cost: 120000000000, name: "100 Synth", description: "Double you know the drill", builds: [0,0,100,0,0,0,0,0], upgrades: [18]},
		{id: 20, disp: 20, cost: 200000000000000, name: "150 Synth", description: "Ridiculous", builds: [0,0,150,0,0,0,0,0], upgrades: [19]},
		{id: 21, disp: 21, cost: 280000000000000000, name: "200 Synth", description: "Another One", builds: [0,0,200,0,0,0,0,0], upgrades: [20]},
		{id: 22, disp: 22, cost: 100000, name: "1 Mine", description: "Doubles the notes per second from Mines", builds: [0,0,0,1,0,0,0,0]},
		{id: 23, disp: 23, cost: 2000000, name: "10 Mine", description: "Doubles the notes per second from Mines", builds: [0,0,0,10,0,0,0,0], upgrades: [22]},
		{id: 24, disp: 24, cost: 35000000, name: "25 Mine", description: "Doubles blah balh", builds: [0,0,0,25,0,0,0,0], upgrades: [23]},
		{id: 25, disp: 25, cost: 2250000000, name: "50 Mine", description: "Doubles blah again", builds: [0,0,0,50,0,0,0,0], upgrades: [24]},
		{id: 26, disp: 26, cost: 4750000000000, name: "100 Mine", description: "Double you know the drill", builds: [0,0,0,100,0,0,0,0], upgrades: [25]},
		{id: 27, disp: 27, cost: 7700000000000000, name: "150 Mine", description: "Ridiculous", builds: [0,0,0,150,0,0,0,0], upgrades: [26]},
		{id: 28, disp: 28, cost: 11000000000000000000, name: "200 Mine", description: "Another One", builds: [0,0,0,200,0,0,0,0], upgrades: [27]},
		{id: 29, disp: 29, cost: 1000000, name: "1 Virtual Reality", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,1,0,0,0]},
		{id: 30, disp: 30, cost: 15000000, name: "10 Virtual Reality", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,10,0,0,0], upgrades: [29]},
		{id: 31, disp: 31, cost: 200000000, name: "25 Virtual Reality", description: "Doubles blah balh", builds: [0,0,0,0,25,0,0,0], upgrades: [30]},
		{id: 32, disp: 32, cost: 15000000000, name: "50 Virtual Reality", description: "Doubles blah again", builds: [0,0,0,0,50,0,0,0], upgrades: [31]},
		{id: 33, disp: 33, cost: 30000000000000, name: "100 Virtual Reality", description: "Double you know the drill", builds: [0,0,0,0,100,0,0,0], upgrades: [32]},
		{id: 34, disp: 34, cost: 50000000000000000, name: "150 Virtual Reality", description: "Ridiculous", builds: [0,0,0,0,150,0,0,0], upgrades: [33]},
		{id: 35, disp: 35, cost: 65000000000000000000, name: "200 Virtual Reality", description: "Another One", builds: [0,0,0,0,200,0,0,0], upgrades: [34]},
		{id: 36, disp: 36, cost: 7000000, name: "1 Solar Panels", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,1,0,0]},
		{id: 37, disp: 37, cost: 100000000, name: "10 Solar Panels", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,10,0,0], upgrades: [36]},
		{id: 38, disp: 38, cost: 2000000000, name: "25 Solar Panels", description: "Doubles blah balh", builds: [0,0,0,0,0,25,0,0], upgrades: [37]},
		{id: 39, disp: 39, cost: 125000000000, name: "50 Solar Panels", description: "Doubles blah again", builds: [0,0,0,0,0,50,0,0], upgrades: [38]},
		{id: 40, disp: 40, cost: 240000000000000, name: "100 Solar Panels", description: "Double you know the drill", builds: [0,0,0,0,0,100,0,0], upgrades: [39]},
		{id: 41, disp: 41, cost: 390000000000000000, name: "150 Solar Panels", description: "Ridiculous", builds: [0,0,0,0,0,150,0,0], upgrades: [40]},
		{id: 42, disp: 42, cost: 550000000000000000000, name: "200 Solar Panels", description: "Another One", builds: [0,0,0,0,0,200,0,0], upgrades: [41]},
		{id: 43, disp: 43, cost: 100000000, name: "1 Amplifiers", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,1,0]},
		{id: 44, disp: 44, cost: 1600000000, name: "10 Amplifiers", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,10,0], upgrades: [43]},
		{id: 45, disp: 45, cost: 35000000000, name: "25 Amplifiers", description: "Doubles blah balh", builds: [0,0,0,0,0,0,25,0], upgrades: [44]},
		{id: 46, disp: 46, cost: 2000000000000, name: "50 Amplifiers", description: "Doubles blah again", builds: [0,0,0,0,0,0,50,0], upgrades: [45]},
		{id: 47, disp: 47, cost: 4200000000000000, name: "100 Amplifiers", description: "Double you know the drill", builds: [0,0,0,0,0,0,100,0], upgrades: [46]},
		{id: 48, disp: 48, cost: 6666000000000000000, name: "150 Amplifiers", description: "Ridiculous", builds: [0,0,0,0,0,0,150,0], upgrades: [47]},
		{id: 49, disp: 49, cost: 10000000000000000000000, name: "200 Amplifiers", description: "Another One", builds: [0,0,0,0,0,0,200,0], upgrades: [48]},
		{id: 50, disp: 50, cost: 10000000000, name: "1 Magicians", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,1]},
		{id: 51, disp: 51, cost: 40000000000, name: "10 Magicians", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,10], upgrades: [50]},
		{id: 52, disp: 52, cost: 800000000000, name: "25 Magicians", description: "Doubles blah balh", builds: [0,0,0,0,0,0,0,25], upgrades: [51]},
		{id: 53, disp: 53, cost: 50000000000000, name: "50 Magicians", description: "Doubles blah again", builds: [0,0,0,0,0,0,0,50], upgrades: [52]},
		{id: 54, disp: 54, cost: 100000000000000000, name: "100 Magicians", description: "Double you know the drill", builds: [0,0,0,0,0,0,0,100], upgrades: [53]},
		{id: 55, disp: 55, cost: 190000000000000000000, name: "150 Magicians", description: "Ridiculous", builds: [0,0,0,0,0,0,0,150], upgrades: [54]},
		{id: 56, disp: 56, cost: 250000000000000000000000, name: "200 Magicians", description: "Another One", builds: [0,0,0,0,0,0,0,200], upgrades: [55]},
		{id: 57, disp: 100, cost: 1000000, name: "Click Track", description: "Unlocks the clicktrack to scale your click power!", builds:[50,10,10,0,0,0,0,0], clicks:[100,1000], upFunction: function(game) {game.clicktracks[0].unlocked = true;}},
		{id: 58, disp: 101, cost: 10000000, name: "New Track", description: "A new song for your clicktrack", builds: [60,20,15,0,0,0,0,0], clicks:[500,100000], upgrades:[57], flavor: "A machine could drum this pretty easy", upFunction: function(game) {game.clicktracks[1].unlocked = true;}},
		{id: 59, disp: 102, cost: 100000000, name: "New Track+ (TODO)", description: "A new song for your clicktrack", builds: [70,40,20,0,0,0,0,0], clicks:[500,200000], upgrades:[57], flavor: "Devil went down to Texas looking for a cow to steal...", upFunction: function(game) {game.clicktracks[2].unlocked = true;}},
		{id: 60, disp: 103, cost: 1000000000, name: "New Track++ (TODO)", description: "A new song for your clicktrack", builds: [80,80,25,0,0,0,0,0], clicks:[500,2000000], upgrades:[57], flavor:"'Through the Carpal Tunnel and the Broken Mice' on Expert", upFunction: function(game) {game.clicktracks[3].unlocked = true;}},
		{id: 61, disp: 90, cost: 10000, name: "Manual Clicker", description: "Cowbell clicks also earn 0.5% of your notes per second", clicks:[0,1000]},
		{id: 62, disp: 91, cost: 1000000, name: "Cowbell Expert", description: "Cowbell clicks also earn 1% of your notes per second", clicks:[0,10000]},
		{id: 63, disp: 92, cost: 100000000, name: "Cowbell Efficiando", description: "Cowbell clicks also earn 1.5% of your notes per second", clicks: [0,100000]},
		{id: 64, disp: 93, cost: 1000000000, name: "Cowbell God", description: "Cowbell clicks also earn 2% of your notes per second", clicks: [0,1000000], flavor:"My cowbell clangs are like thunder raining down from Mt. Olympus"}
	];
	this.unlockedUpgrades = [];
	this.boughtUpgrades = [];
	this.maxupgrades = this.upgrades.length;
	
	this.achievements = [
		{id: 1, disp: 1, name: "Clicker", description: "Click 100 notes from clicking", clicks: [0,100]},
		{id: 2, disp: 2, name: "Click Earner", description: "Gain 1000 notes from clicking", clicks: [0,1000]},
		{id: 3, disp: 3, name: "Click Entrepreneur", description: "Gain 10000 notes from clicking", clicks: [0,10000]}
	];
	this.earnedAchievements = [];
	this.maxachievements = this.achievements.length;
	//upgrades and achievements affected by load
	
	this.clicktracks = [
		{value: "base", name: "Basic Clicktrack", unlocked: false, bpm: 120, clicks: [1,2,3,4], length: 4, clicked: []}, //Generic Cowbell Song
		{value: "drummachine", name: "Intermediate Clicktrack", unlocked: false, bpm: 120, clicks: [1,2,3,4,5,6,7,9,11,12,12.75,13,14,15,16,16.75,17], length: 18, clicked: []}//Animusic - Drum Machine
		//Charlie Daniels Band - Devil Went down to Georgia (adaption for the cowbell)
		//Dragonforce - Through the Fire and the Flames (adaption for the cowbell)
	];
	
	this.money = 0; //Loadable
	this.mps = 0;
	this.clicks = 0; //Loadble
	this.clickmoney = 0; //Loadable
	this.moneythisgame = 0; //Loadable
	this.moneyalltime = 0; //Loadable
	
	this.special = undefined; //Only supports one special at a time?
	this.tonextspecial = this.getNextSpecialTime();
	this.totalspecials = 0; //Loadable
	
	this.currentclicktrack = -1;
	this.consecutiveclicktrack = 0;
	this.maxconsecutive = 0; //Loadable
	this.timeclicktrack = 0;
	this.canvas = document.getElementById("clicktrack-canvas");
	this.cheight = 400;
	this.cwidth = 200;
	
	this.prestige = 0; //Loadable
	this.prestigecount = 0; //Loadable
	
	this.sounds = [];
	this.muted = false;
	this.suffix = largeSuffixes; //Will be configurable setting TODO
	
	this.lastTick = Date.now();
	this.timeSinceLastUIUpdate = 0;
	
	if (this.load()){
		console.log("Load was successful");
	} else {
		console.log("Load was unsuccessful");
	}
	this.tonextsave = 60000;
	this.notifications = [];
	
	//Do some UI work here: Get the building costs/numbers to display the loaded values
	
	this.timeoutPointer;
}

Game.prototype.buy = function (i) {
	if (this.buildings[i]){
		var cost = this.buildings[i].cost*Math.pow(this.buildings[i].growth, this.buildings[i].num);
		if (this.money >= cost){
			this.buildings[i].num++;
			this.money -= cost;
			var buildEl = document.getElementsByClassName('building');
			buildEl[i].childNodes[1].innerHTML = this.buildings[i].num;
			var format = this.formatlarge(cost*this.buildings[i].growth);
			buildEl[i].childNodes[3].childNodes[1].innerHTML = isNaN(format) ? format : Math.ceil(format);
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

Game.prototype.upgrade = function (i) {
	var toUpgrade = false;
	var ind = 0;
	for (var j = 0; j < this.unlockedUpgrades.length; j++){
		if (this.unlockedUpgrades[j].id == i){
			toUpgrade = this.unlockedUpgrades[j];
			ind = j;
			break;
		}
	}
	if (!toUpgrade){
		return false;
	}
	if (this.money >= toUpgrade.cost){
		this.boughtUpgrades.push(this.unlockedUpgrades.splice(j, 1)[0]);
		this.money -= toUpgrade.cost;
		if (toUpgrade.upFunction){
			toUpgrade.upFunction(this);
		}
		return true;
	} else {
		return false;
	}
}

Game.prototype.hasUpgrade = function (i) {
	for (var j = 0; j < this.boughtUpgrades.length; j++){
		if (this.boughtUpgrades[j].id == i){
			return true;
		}
	}
	return false;
}

Game.prototype.recalcmps = function(){
	this.mps = 0;
	for (var i = 0; i < this.buildings.length; i++){
		this.mps += this.buildings[i].num * this.buildingMps(i);
	}
	this.mps *= this.globalMulti();
}

Game.prototype.buildingMps = function (i){
	if (i == 0){ //Cowbells
		var ret = this.buildings[0].mps;
		ret *= (this.hasUpgrade(1) ? 2 : 1);
		ret *= (this.hasUpgrade(2) ? 2 : 1);
		ret *= (this.hasUpgrade(3) ? 2 : 1);
		ret *= (this.hasUpgrade(4) ? 2 : 1);
		ret *= (this.hasUpgrade(5) ? 2 : 1);
		ret *= (this.hasUpgrade(6) ? 2 : 1);
		ret *= (this.hasUpgrade(7) ? 2 : 1);
		return ret;
	} else if (i == 1){ //Bands
		var ret = this.buildings[1].mps;
		ret *= (this.hasUpgrade(8) ? 2 : 1);
		ret *= (this.hasUpgrade(9) ? 2 : 1);
		ret *= (this.hasUpgrade(10) ? 2 : 1);
		ret *= (this.hasUpgrade(11) ? 2 : 1);
		ret *= (this.hasUpgrade(12) ? 2 : 1);
		ret *= (this.hasUpgrade(13) ? 2 : 1);
		ret *= (this.hasUpgrade(14) ? 2 : 1);
		return ret;
	} else if (i == 2){ //Synthesizer
		var ret = this.buildings[2].mps;
		ret *= (this.hasUpgrade(15) ? 2 : 1);
		ret *= (this.hasUpgrade(16) ? 2 : 1);
		ret *= (this.hasUpgrade(17) ? 2 : 1);
		ret *= (this.hasUpgrade(18) ? 2 : 1);
		ret *= (this.hasUpgrade(19) ? 2 : 1);
		ret *= (this.hasUpgrade(20) ? 2 : 1);
		ret *= (this.hasUpgrade(21) ? 2 : 1);
		return ret;
	} else if (i == 3){ //Mine
		var ret = this.buildings[3].mps;
		ret *= (this.hasUpgrade(22) ? 2 : 1);
		ret *= (this.hasUpgrade(23) ? 2 : 1);
		ret *= (this.hasUpgrade(24) ? 2 : 1);
		ret *= (this.hasUpgrade(25) ? 2 : 1);
		ret *= (this.hasUpgrade(26) ? 2 : 1);
		ret *= (this.hasUpgrade(27) ? 2 : 1);
		ret *= (this.hasUpgrade(28) ? 2 : 1);
		return ret;
	} else if (i == 4){ //Virtual Reality
		var ret = this.buildings[4].mps;
		ret *= (this.hasUpgrade(29) ? 2 : 1);
		ret *= (this.hasUpgrade(30) ? 2 : 1);
		ret *= (this.hasUpgrade(31) ? 2 : 1);
		ret *= (this.hasUpgrade(32) ? 2 : 1);
		ret *= (this.hasUpgrade(33) ? 2 : 1);
		ret *= (this.hasUpgrade(34) ? 2 : 1);
		ret *= (this.hasUpgrade(35) ? 2 : 1);
		return ret;
	} else if (i == 5){ //Solar Panels
		var ret = this.buildings[5].mps;
		ret *= (this.hasUpgrade(36) ? 2 : 1);
		ret *= (this.hasUpgrade(37) ? 2 : 1);
		ret *= (this.hasUpgrade(38) ? 2 : 1);
		ret *= (this.hasUpgrade(39) ? 2 : 1);
		ret *= (this.hasUpgrade(40) ? 2 : 1);
		ret *= (this.hasUpgrade(41) ? 2 : 1);
		ret *= (this.hasUpgrade(42) ? 2 : 1);
		return ret;
	} else if (i == 6){ //Amplifier
		var ret = this.buildings[6].mps;
		ret *= (this.hasUpgrade(43) ? 2 : 1);
		ret *= (this.hasUpgrade(44) ? 2 : 1);
		ret *= (this.hasUpgrade(45) ? 2 : 1);
		ret *= (this.hasUpgrade(46) ? 2 : 1);
		ret *= (this.hasUpgrade(47) ? 2 : 1);
		ret *= (this.hasUpgrade(48) ? 2 : 1);
		ret *= (this.hasUpgrade(49) ? 2 : 1);
		return ret;
	} else if (i == 7){ //Magician
		var ret = this.buildings[7].mps;
		ret *= (this.hasUpgrade(50) ? 2 : 1);
		ret *= (this.hasUpgrade(51) ? 2 : 1);
		ret *= (this.hasUpgrade(52) ? 2 : 1);
		ret *= (this.hasUpgrade(53) ? 2 : 1);
		ret *= (this.hasUpgrade(54) ? 2 : 1);
		ret *= (this.hasUpgrade(55) ? 2 : 1);
		ret *= (this.hasUpgrade(56) ? 2 : 1);
		return ret;
	} else {
		return 0; //building does not exist
	}
}

Game.prototype.globalMulti = function () {
	var ret = 1;
	if (this.special && this.special.started && !this.special.ended){
		if (this.special.effect === "production"){
			ret *= 5;
		}
	}
	ret *= (1 + this.prestigeBonus());
	return ret;
}

Game.prototype.prestigeBonus = function () {
	return this.prestige * 0.02;
}

Game.prototype.moneyPerClick = function () {
	var ret = 1;
	if (this.currentclicktrack == 0){
		ret += this.consecutiveclicktrack;
	}
	if (this.currentclicktrack == 1){
		ret += this.consecutiveclicktrack * (this.consecutiveclicktrack + 1) / 2;
	}
	if (this.currentclicktrack > 1){
		ret *= Math.pow(1.1, this.consecutiveclicktrack);
	}
	ret += this.hasUpgrade(61) ? this.mps*0.005 : 0;
	ret += this.hasUpgrade(62) ? this.mps*0.01 : 0;
	ret += this.hasUpgrade(63) ? this.mps*0.015 : 0;
	ret += this.hasUpgrade(64) ? this.mps*0.02 : 0;
	if (this.special && this.special.started && !this.special.ended){
		if (this.special.effect == "click"){
			ret *= 20;
		}
	}
	return ret;
}

Game.prototype.click = function(){
	this.clicks++;
	var deltaMoney = this.moneyPerClick();
	this.money += deltaMoney;
	this.clickmoney += deltaMoney;
	this.moneythisgame += deltaMoney;
	this.moneyalltime += deltaMoney;
	if (!this.muted){
		var found = false;
		for (var i = 0; i < this.sounds.length; i++){
			if (this.sounds[i].ended){
				this.sounds[i].currentTime = 0;
				this.sounds[i].play();
				found = true;
				break;
			}
		}
		if (!found){
			var aud = new Audio("cowbell3.mp3");
			this.sounds.push(aud);
			aud.play();
		}
	}
	this.clicktrackcheck();
}

Game.prototype.gametick = function(game){
	//Add to money
	game.recalcmps();
	var delta = Date.now() - game.lastTick;
	game.lastTick = Date.now();
	var secs = delta / 1000;
	var moneyChange = secs * game.mps;
	game.money += moneyChange;
	game.moneythisgame += moneyChange;
	game.moneyalltime += moneyChange;
	
	if (!game.special) {
		var specEl = document.getElementById("special");
		game.tonextspecial -= delta;
		if (game.tonextspecial <= 0){
			game.special = new Special();
			game.special.updateTime(-game.tonextspecial);
			specEl.style.display = "block";
		} else {
			specEl.style.display = "none";
		}
	}
	if (game.special){
		var specEl = document.getElementById("special");
		specEl.style.left = game.special.getPosition();
		game.special.updateTime(delta);
		if (game.special.ended){
			game.special = undefined;
			specEl.style.display = "none";
			game.tonextspecial = game.getNextSpecialTime();
		}
	}
	
	//clear the canvas here
	var ctx = game.canvas.getContext("2d");
	ctx.clearRect(0,0,game.cwidth,game.cheight);
	game.clicktracktick(delta);
	
	var monEl = document.getElementById("money-el");
	var format = game.formatlarge(game.money);
	monEl.innerHTML = isNaN(format) ? format : game.money.toFixed(0);
	var mpsEl = document.getElementById("mps-el");
	format = game.formatlarge(game.mps);
	mpsEl.innerHTML = isNaN(format) ? format : game.mps.toFixed(2);
	var mpcEl = document.getElementById("mpc-el");
	format = game.formatlarge(game.moneyPerClick());
	mpcEl.innerHTML = isNaN(format) ? format : format.toFixed(2);
	
	game.timeSinceLastUIUpdate += delta;
	game.tonextsave -= delta;
	
	var buildEl = document.getElementById("build-space");
	for (var i = 0; i < game.buildings.length; i++){
		var cost = game.buildings[i].cost*Math.pow(game.buildings[i].growth, game.buildings[i].num);
		format = game.formatlarge(cost);
		buildEl.childNodes[i].childNodes[3].childNodes[1].innerHTML = (isNaN(format) ? format : Math.ceil(format));
		if (game.money >= cost){
			buildEl.childNodes[i].className = "building on";
		} else {
			buildEl.childNodes[i].className = "building off";
		}
		if (i > 0 && game.buildings[i].num == 0 && game.moneythisgame < cost){
			buildEl.childNodes[i].className = "building total-off";
		}
	}
	
	//Upgrade Update
	game.unlockedUpgrades.sort(function (a, b) {
		return a.cost - b.cost;
	});
	var upgradeEl = document.getElementById('upgrade-space');
	upgradeEl.innerHTML = "";
	for (var i = 0; i < game.unlockedUpgrades.length; i++){
		var upEl = document.createElement('div');
		upEl.className = "upgrade" + (game.money > game.unlockedUpgrades[i].cost ? " on" : " off");
		var name = document.createElement('span');
		name.innerHTML = game.unlockedUpgrades[i].name;
		name.className = "up-name";
		upEl.appendChild(name);
		var id = game.unlockedUpgrades[i].id;
		upEl.addEventListener("mousedown", (function (_id) {
			return function () {
				game.upgrade(_id);
			}
		})(id));
		var hover = document.createElement('div');
		format = game.formatlarge(game.unlockedUpgrades[i].cost);
		hover.innerHTML = isNaN(format) ? format : Math.ceil(format);
		hover.innerHTML += " notes <br/>";
		hover.innerHTML += game.unlockedUpgrades[i].description;
		if (game.unlockedUpgrades[i].flavor){
			hover.innerHTML += "<br/>";
			var flavor = document.createElement('span');
			flavor.innerHTML = game.unlockedUpgrades[i].flavor;
			flavor.className = "flavor";
			hover.appendChild(flavor);
		}
		hover.className = "hover";
		upEl.appendChild(hover);
		upgradeEl.appendChild(upEl);
	}
	game.boughtUpgrades.sort(function (a, b){
		return a.disp - b.disp;
	});
	var boughtEl = document.getElementById('purchased-upgrades');
	boughtEl.innerHTML = "";
	for (var i = 0; i < game.boughtUpgrades.length; i++){
		var upEl = document.createElement('div');
		upEl.className = "upgrade on";
		var name = document.createElement('span');
		name.innerHTML = game.boughtUpgrades[i].name;
		name.className = "up-name";
		upEl.appendChild(name);
		var hover = document.createElement('div');
		format = game.formatlarge(game.boughtUpgrades[i].cost);
		hover.innerHTML = isNaN(format) ? format : Math.ceil(format);
		hover.innerHTML += " notes <br/>";
		hover.innerHTML += game.boughtUpgrades[i].description;
		if (game.boughtUpgrades[i].flavor){
			hover.innerHTML += "<br/>";
			var flavor = document.createElement('span');
			flavor.innerHTML = game.boughtUpgrades[i].flavor;
			flavor.className = "flavor";
			hover.appendChild(flavor);
		}
		hover.className = "hover";
		upEl.appendChild(hover);
		boughtEl.appendChild(upEl);
	}
	
	//Notification Updates
	var notes = document.getElementById("notifications");
	for (var i = 0; i < game.notifications.length; i++){
		game.notifications[i].time -= delta;
		if (game.notifications[i].time <= 0){
			var toRem = document.getElementById(game.notifications[i].note);
			if (!toRem){
				//The notification has already been removed, go to the next one.
				continue;
			}
			notes.removeChild(toRem);
			game.notifications.splice(i,1);
			i--;
		}
	}
	
	if (game.tonextsave < 0){
		game.save();
		game.tonextsave = 60000;
	}
	
	if (game.timeSinceLastUIUpdate > 1000){
		game.uitick();
		game.timeSinceLastUIUpdate = 0;
	}
	
	game.timeoutPointer = setTimeout(game.gametick, 33, game); //God Bless Functional Programming
}

Game.prototype.uitick = function(){
	//Unlock upgrades
	for (var i = 0; i < this.upgrades.length; i++){
		var canUnlock = true;
		if (this.upgrades[i].builds){
			for (var j = 0; j < this.upgrades[i].builds.length; j++){
				if (this.buildings[j].num < this.upgrades[i].builds[j]){
					canUnlock = false;
					break;
				}
			}
		}
		if (!canUnlock){
			continue;
		}
		if (this.upgrades[i].upgrades){
			for (var j = 0; j < this.upgrades[i].upgrades.length; j++){
				if (!this.hasUpgrade(this.upgrades[i].upgrades[j])){
					canUnlock = false;
					break;
				}
			}
		}
		if (!canUnlock){
			continue;
		}
		if (this.upgrades[i].clicks){
			if (this.clicks < this.upgrades[i].clicks[0]){
				canUnlock = false;
			}
			if (this.clickmoney < this.upgrades[i].clicks[1]){
				canUnlock = false;
			}
		}
		if (this.upgrades[i].money){
			if (this.money < this.upgrades[i].money[0]){
				canUnlock = false;
			}
			if (this.moneythisthis < this.upgrades[i].money[1]){
				canUnlock = false;
			}
			if (this.moneyalltime < this.upgrades[i].money[2]){
				canUnlock = false;
			}
		}
		if (!canUnlock){
			continue;
		}
		this.unlockedUpgrades.push(this.upgrades.splice(i, 1)[0]);
		i--;
	}
	
	//Achieve Achievements
	for (var i = 0; i < this.achievements.length; i++){
		var canUnlock = true;
		if (this.achievements[i].builds){
			for (var j = 0; j < this.achievements[i].builds.length; j++){
				if (this.buildings[j].num < this.achievements[i].builds[j]){
					canUnlock = false;
					break;
				}
			}
		}
		if (!canUnlock){
			continue;
		}
		if (this.achievements[i].achievements){
			for (var j = 0; j < this.achievements[i].achievements.length; j++){
				if (!this.hasUpgrade(this.achievements[i].achievements[j])){
					canUnlock = false;
					break;
				}
			}
		}
		if (!canUnlock){
			continue;
		}
		if (this.achievements[i].clicks){
			if (this.clicks < this.achievements[i].clicks[0]){
				canUnlock = false;
			}
			if (this.clickmoney < this.achievements[i].clicks[1]){
				canUnlock = false;
			}
		}
		if (this.achievements[i].money){
			if (this.money < this.achievements[i].money[0]){
				canUnlock = false;
			}
			if (this.moneythisthis < this.achievements[i].money[1]){
				canUnlock = false;
			}
			if (this.moneyalltime < this.achievements[i].money[2]){
				canUnlock = false;
			}
		}
		if (!canUnlock){
			continue;
		}
		this.addnotification("You earned a new achievement: " + this.achievements[i].name + "!", 10000);
		this.earnedAchievements.push(this.achievements.splice(i, 1)[0]);
		i--;
	}
	
	//Stat Update
	//We should only update these if the stats tab is active (save the cycles!) TODO
	var format;
	format = this.formatlarge(this.money);
	document.getElementById("money-stat").innerHTML = (isNaN(format) ? format : format.toFixed(2));
	format = this.formatlarge(this.moneythisgame);
	document.getElementById("money-this-game-stat").innerHTML = (isNaN(format) ? format : format.toFixed(2));
	format = this.formatlarge(this.moneyalltime);
	document.getElementById("money-all-time-stat").innerHTML = (isNaN(format) ? format : format.toFixed(2));
	format = this.formatlarge(this.clicks);
	document.getElementById("click-stat").innerHTML = (isNaN(format) ? format : format.toFixed(2));
	format = this.formatlarge(this.clickmoney);
	document.getElementById("click-money-stat").innerHTML = (isNaN(format) ? format : format.toFixed(2));
	format = this.formatlarge(this.prestigeonreset());
	document.getElementById("prestige-gain").innerHTML = (isNaN(format) ? format : format.toFixed(0));
	document.getElementById("prestige-on-reset").innerHTML = (isNaN(format) ? format : format.toFixed(0));
	format = this.formatlarge(this.prestige);
	document.getElementById("prestige").innerHTML = (isNaN(format) ? format : format.toFixed(0));
	format = this.formatlarge(this.prestigeBonus() * 100);
	document.getElementById("prestige-bonus").innerHTML = (isNaN(format) ? format : format.toFixed(0));
	format = this.formatlarge(this.maxconsecutive);
	document.getElementById("consec-stat").innerHTML = (isNaN(format) ? format : format.toFixed(0));
	format = this.formatlarge(this.totalspecials);
	document.getElementById("special-stat").innerHTML = (isNaN(format) ? format : format.toFixed(0));
	
	var buildEls = document.getElementsByClassName("building");
	var multi = this.globalMulti();
	for (var i = 0; i < this.buildings.length; i++){
		buildEls[i].childNodes[1].innerHTML = this.buildings[i].num;
		buildEls[i].childNodes[4].childNodes[3].innerHTML = this.formatlarge(this.buildingMps(i) * multi);
	}
	
	//Achievement Update
	this.earnedAchievements.sort(function (a, b) {
		return a.disp - b.disp;
	});
	var achieveEl = document.getElementById('achievements');
	achieveEl.innerHTML = "";
	for (var i = 0; i < this.earnedAchievements.length; i++){
		var achEl = document.createElement('div');
		achEl.className = "achievement on";
		var name = document.createElement('span');
		name.innerHTML = this.earnedAchievements[i].name;
		achEl.appendChild(name);
		var hover = document.createElement('div');
		var descrip = document.createElement('span');
		descrip.innerHTML = this.earnedAchievements[i].description;
		hover.appendChild(descrip);
		if (this.earnedAchievements[i].flavor){
			hover.innerHTML += "<br/>";
			var flavor = document.createElement('span');
			flavor.innerHTML = this.earnedAchievements[i].flavor;
			flavor.className = "flavor";
			hover.appendChild(flavor);
		}
		hover.className = "hover";
		achEl.appendChild(hover);
		achieveEl.appendChild(achEl);
	}
	
	if (this.hasUpgrade(57)){
		document.getElementById("clicktrack-wrapper").style.display = "block";
		var dropEl = document.getElementById("clicktrack-dropdown");
		dropEl.innerHTML = "";
		var optionEl = document.createElement("option");
		optionEl.innerHTML = "None";
		optionEl.value = "none";
		dropEl.appendChild(optionEl);
		var selectEl = document.createElement("option");
		selectEl.innerHTML = "Basic Clicktrack";
		selectEl.value = "base";
		dropEl.appendChild(selectEl);
		dropEl.style.display = "inline";
		if (this.hasUpgrade(58)){
			selectEl = document.createElement("option");
			selectEl.innerHTML = "Drum Machine";
			selectEl.value = "drummachine";
			dropEl.appendChild(selectEl);
		}
		document.getElementById("consecutive-clicks").style.display = "inline";
	} else {
		document.getElementById("clicktrack-wrapper").style.display = "none";
	}
}

Game.prototype.trackchange = function (value) {
	for (var i = 0; i < this.clicktracks.length; i++){
		if (this.clicktracks[i].value == value){
			this.currentclicktrack = i;
			this.timeclicktrack = -4;
			this.consecutiveclicktrack = 0;
			return;
		}
	}
	this.currentclicktrack = -1;
	this.timeclicktrack = 0;
	this.consecutiveclicktrack = 0;
}

Game.prototype.tabswitch = function () {
	var tabs = document.getElementsByClassName("tab-space");
	for (var i = 0; i < tabs.length; i++){
		if (tabs[i].id == this.id + "-div"){
			tabs[i].style.display = "block";
		} else {
			tabs[i].style.display = "none";
		}
	}
}

Game.prototype.togglemute = function (mute) {
	if (mute.value == 0){
		this.muted = true;
		mute.value = 1;
		mute.innerHTML = "Unmute";
	} else if (mute.value == 1){
		this.muted = false;
		mute.value = 0;
		mute.innerHTML = "Mute";
	}
}

Game.prototype.formatlarge = function(number) {
	if (number < 1000000){ // < 1 million -> Don't format
		return number;
	}
	var threes = Math.log(number)/Math.log(1000);
	var place = Math.floor(threes) - 2;
	if (this.suffix[place]){
		return (number / Math.pow(1000, place+2)).toFixed(3) + " " + this.suffix[place];
	}
}

Game.prototype.getNextSpecialTime = function () {
	return 1000 * (240 + Math.random() * 120);
}

Game.prototype.clicktracktick = function(delta){
	//Lots of canvas drawing
	if (this.clicktracks[this.currentclicktrack]){
		var cc = this.clicktracks[this.currentclicktrack];
		this.timeclicktrack += (cc.bpm * delta / 60000);
		var lastnote = 0;
		var lastindex = -1;
		for (var i = 0; i < cc.clicks.length; i++){
			if (cc.clicks[i] < this.timeclicktrack){
				lastnote = cc.clicks[i];
				lastindex = i;
			}
			if (this.timeclicktrack - cc.clicks[i] > 2){
				cc.clicked[i] = 0;
			} else if (cc.clicks[i] - this.timeclicktrack > 2){
				cc.clicked[i] = 0;
				break;
			}
		}
		if (Math.abs(this.timeclicktrack - lastnote) > 0.2){
			if (lastindex > -1){
				if (!cc.clicked[lastindex]){
					this.consecutiveclicktrack = 0;
					document.getElementById("consecutive-clicks").innerHTML = "0";
				}
			}
		}
		if (this.timeclicktrack > cc.length){
			this.timeclicktrack -= this.timeclicktrack;
		}
		//console.log(this.timeclicktrack);
		//Here's where we draw on the canvas the next 5 beats of the click track (at least 4 beats visible)
		var ctx = this.canvas.getContext("2d");
		ctx.strokeStyle = "#999999";
		ctx.moveTo(0,this.cheight*0.9);
		ctx.lineTo(this.cwidth,this.cheight*0.9);
		ctx.stroke();
		ctx.storkeStyle = "#FFFFFF";
		var x = this.cwidth/2;
		var found = false;
		for (var i = 0; i < cc.clicks.length; i++){
			if (cc.clicks[i] - this.timeclicktrack < 6 && cc.clicks[i] - this.timeclicktrack >= 0){
				var dif = cc.clicks[i] - this.timeclicktrack;
				var y = this.cheight*(0.9 - 0.2*dif);
				ctx.beginPath();
				ctx.arc(x, y, this.cwidth/10, 0, 2*Math.PI);
				ctx.stroke();
			}
			if ((cc.clicks[i] + cc.length) - this.timeclicktrack < 6 && (cc.clicks[i] + cc.length) - this.timeclicktrack >= 0){
				var dif = (cc.clicks[i] + cc.length) - this.timeclicktrack;
				var y = this.cheight*(0.9 - 0.2*dif);
				ctx.beginPath();
				ctx.arc(x, y, this.cwidth/10, 0, 2*Math.PI);
				ctx.stroke();
			}
		}
	}
}

Game.prototype.clicktrackcheck = function () {
	//If there's a note near (within 0.1 time + or - how about) that current time, click
	if (this.clicktracks[this.currentclicktrack]){
		var cc = this.clicktracks[this.currentclicktrack];
		var delta = Date.now() - this.lastTick;
		var actualTime = this.timeclicktrack + (cc.bpm * delta / 60000); //Because the click probably happened between ticks
		var found = false;
		for (var i = 0; i < cc.clicks.length; i++){
			if (!cc.clicked[i]){
				if (Math.abs(cc.clicks[i] - actualTime) < 0.2){
					this.consecutiveclicktrack++;
					if (this.consecutiveclicktrack > this.maxconsecutive){
						this.maxconsecutive = this.consecutiveclicktrack;
					}
					document.getElementById("consecutive-clicks").innerHTML = this.consecutiveclicktrack;
					cc.clicked[i] = 1;
					found = true;
					break;
				}
			}
		}
		if (!found){
			this.consecutiveclicktrack = 0;
		}
	}
	
}

Game.prototype.softreset = function () {
	if (confirm("Do you want to rest and gain " + this.formatlarge(this.prestigeonreset()) + " prestige points?")){
		//reset stats, buildings, upgrades and such
		for (var i = 0; i < this.buildings.length; i++){
			this.buildings[i].num = 0;
		}
		for (var i = this.unlockedUpgrades.length - 1; i >= 0; i--){
			this.upgrades.push(this.unlockedUpgrades.splice(i,1)[0]);
		}
		for (var i = this.boughtUpgrades.length - 1; i >= 0; i--){
			this.upgrades.push(this.boughtUpgrades.splice(i,1)[0]);
		}
		this.money = 0;
		this.mps = 0;
		this.clicks = 0;
		this.clickpower = 1;
		this.clickmoney = 0;
		this.moneythisgame = 0;
		this.special = undefined;
		this.tonextspecial = this.getNextSpecialTime();
		//grant prestige
		this.prestige = Math.floor(Math.sqrt(this.moneyalltime / 1000000000000));
		this.prestigecount++;
		this.lastTick = Date.now();
		this.timeSinceLastUIUpdate = 5000;
		this.gametick(this); //Redraw the UI
	}
}

Game.prototype.hardreset = function(l) {
	if (l == 1){
		if (confirm("WARNING: If you press OK here, you will lose ALL of your progress, including prestige. If you want to gain prestige, use the soft reset!")){
			console.log("in here");
			this.hardreset(2);
		}
	} else if (l > 1){
		//reset
		console.log("resetting");
		for (var i = 0; i < this.buildings.length; i++){
			this.buildings[i].num = 0;
		}
		for (var i = this.unlockedUpgrades.length - 1; i >= 0; i--){
			this.upgrades.push(this.unlockedUpgrades.splice(i,1)[0]);
		}
		for (var i = this.boughtUpgrades.length - 1; i >= 0; i--){
			this.upgrades.push(this.boughtUpgrades.splice(i,1)[0]);
		}
		for (var i = this.earnedAchievements.length - 1; i >= 0; i--){
			this.achievements.push(this.earnedAchievements.splice(i,1)[0]);
		}
		for (var i = 0; i < this.clicktracks.length; i++){
			this.clicktracks[i].unlocked = false;
		}
		this.money = 0;
		this.mps = 0;
		this.clicks = 0;
		this.clickpower = 1;
		this.clickmoney = 0;
		this.moneythisgame = 0;
		this.moneyalltime = 0;
		this.special = undefined;
		this.tonextspecial = this.getNextSpecialTime();
		this.currentclicktrack = -1;
		this.consecutiveclicktrack = 0;
		this.timeclicktrack = 0;
		this.maxconsecutive = 0;
		this.totalspecials = 0;
		this.prestige = 0;
		this.prestigecount = 0;
		this.lastTick = Date.now();
		this.timeSinceLastUIUpdate = 5000;
		this.gametick(this); //Redraw the UI
	}
}

Game.prototype.prestigeonreset = function () {
	var total = Math.floor(Math.sqrt(this.moneyalltime / 1000000000000));
	return total - this.prestige;
}

Game.prototype.save = function() {
	var gameState = this.generateSaveState();
	localStorage.setItem('save', JSON.stringify(gameState));
	this.addnotification("Game Saved", 3000);
}

Game.prototype.load = function () {
	var gameState = JSON.parse(localStorage.getItem('save'));
	if (gameState){
		if (gameState.version == 1){
			//load 'er up
			//We'll start by verifying the upgrade/achieve ids
			//We verify first, so that we don't have to undo all changes once we find an invalid entry
			if (gameState.buildings.length != this.buildings.length){
				return false;
			}
			for (var i = 0; i < gameState.unlockedUps.length; i++){
				var found = false;
				for (var j = 0; j < this.upgrades.length; j++){
					if (gameState.unlockedUps[i] == this.upgrades[j].id){
						found = true;
						break;
					}
				}
				if (!found){
					return false;
				}
			}
			for (var i = 0; i < gameState.boughtUps.length; i++){
				var found = false;
				for (var j = 0; j < this.upgrades.length; j++){
					if (gameState.boughtUps[i] == this.upgrades[j].id){
						found = true;
						break;
					}
				}
				if (!found){
					return false;
				}
			}
			for (var i = 0; i < gameState.achieves.length; i++){
				var found = false;
				for (var j = 0; j < this.achievements.length; j++){
					if (gameState.achieves[i] == this.achievements[j].id){
						found = true;
						break;
					}
				}
				if (!found){
					return false;
				}
			}
			//After that we'll unlock/buy/earn all upgrade/achieves
			for (var i = 0; i < gameState.buildings.length; i++){
				this.buildings[i].num = gameState.buildings[i];
			}
			for (var i = 0; i < gameState.unlockedUps.length; i++){
				for (var j = this.upgrades.length - 1; j >= 0; j--){
					if (this.upgrades[j].id == gameState.unlockedUps[i]){
						this.unlockedUpgrades.push(this.upgrades.splice(j,1)[0]);
					}
				}
			}
			for (var i = 0; i < gameState.boughtUps.length; i++){
				for (var j = this.upgrades.length - 1; j >= 0; j--){
					if (this.upgrades[j].id == gameState.boughtUps[i]){
						this.boughtUpgrades.push(this.upgrades.splice(j,1)[0]);
					}
				}
			}
			for (var i = 0; i < gameState.achieves.length; i++){
				for (var j = this.achievements.length - 1; j >= 0; j--){
					if (this.achievements[j].id == gameState.achieves[i]){
						this.earnedAchievements.push(this.achievements.splice(j,1)[0]);
					}
				}
			}
			//Then we'll load stats
			this.money = gameState.money;
			this.clicks = gameState.clicks;
			this.clickmoney = gameState.clickmoney;
			this.moneythisgame = gameState.moneythisgame;
			this.moneyalltime = gameState.moneyalltime;
			if (gameState.maxconsecutive){
				this.maxconsecutive = gameState.maxconsecutive;
			} else {
				this.maxconsecutive = 0;
			}
			if (gameState.totalspecials){
				this.totalspecials = gameState.totalspecials;
			} else {
				this.totalspecials = 0;
			}
			if (gameState.prestige){
				this.prestige = gameState.prestige;
			} else {
				this.prestige = 0;
			}
			if (gameState.prestigecount){
				this.prestigecount = gameState.prestigecount;
			} else {
				this.prestigecount = 0;
			}
			gameState = undefined;
			return true;
		} else {
			console.log("Your save file has an invalid version");
			return false;
		}
	}
	return false;
}

Game.prototype.importgame = function (encoded) {
	//Store a temporary save, in case the import string is bad.
	this.save();
	var tempSave = localStorage.getItem('save');
	//Need a prompt to input encoded, instead of parameter
	if (!encoded){
		encoded = prompt("Copy and Paste you backed up save file below.");
		if (encoded === null){
			return;
		}
	}
	localStorage.setItem('save', window.atob(encoded));
	//Get the game object ready for load
	for (var i = this.unlockedUpgrades.length - 1; i >= 0; i--){
		this.upgrades.push(this.unlockedUpgrades.splice(i,1)[0]);
	}
	for (var i = this.boughtUpgrades.length - 1; i >= 0; i--){
		this.upgrades.push(this.boughtUpgrades.splice(i,1)[0]);
	}
	for (var i = this.earnedAchievements.length - 1; i >= 0; i--){
		this.achievements.push(this.earnedAchievements.splice(i,1)[0]);
	}
	for (var i = 0; i < this.clicktracks.length; i++){
		this.clicktracks[i].unlocked = false;
	}
	this.special = undefined;
	this.tonextspecial = this.getNextSpecialTime();
	//Attempt a load
	if (this.load()){
		console.log("Import was successful.");
	} else {
		console.log("Your import string may have been bad (e.g. not a valid game state). We're going to try to reload your old game.");
		localStorage.setItem('save', tempSave);
		if (this.load()){
			console.log("Import aborted successfully.");
		} else {
			console.log("We were unable to load your old game. Results are undefined, we suggest hard resetting.");
		}
	}
}

Game.prototype.exportgame = function (hide) {
	var gameState = this.generateSaveState();
	var encoded = window.btoa(JSON.stringify(gameState));
	console.log(encoded);
	//Need a prompt to display encoded to the user
	if (!hide){
		prompt("Copy and Paste this text into a document and save it somewhere on your computer. You can use the Import button to bring this save back if you accidentally delete cookies or clear your browsers cache.", encoded);
	}
	return encoded;
}

Game.prototype.generateSaveState = function () {
	var buildSave = [];
	for (var i = 0; i < this.buildings.length; i++){
		buildSave.push(this.buildings[i].num);
	}
	var unlockedSave = [];
	for (var i = 0; i < this.unlockedUpgrades.length; i++){
		unlockedSave.push(this.unlockedUpgrades[i].id);
	}
	var boughtSave = [];
	for (var i = 0; i < this.boughtUpgrades.length; i++){
		boughtSave.push(this.boughtUpgrades[i].id);
	}
	var achieveSave = [];
	for (var i = 0; i < this.earnedAchievements.length; i++){
		achieveSave.push(this.earnedAchievements[i].id);
	}
	var clicktrackSave = [];
	for (var i = 0; i < this.clicktracks.length; i++){
		clicktrackSave.push(this.clicktracks[i].unlocked);
	}
	var gameState = {
		buildings: buildSave,
		unlockedUps: unlockedSave,
		boughtUps: boughtSave,
		achieves: achieveSave,
		tracks: clicktrackSave,
		money: this.money,
		clicks: this.clicks,
		clickmoney: this.clickmoney,
		moneythisgame: this.moneythisgame,
		moneyalltime: this.moneyalltime,
		maxconsecutive: this.maxconsecutive,
		totalspecials: this.totalspecials,
		prestige: this.prestige,
		prestigecount: this.prestigecount,
		version: 1
	}
	return gameState;
}

Game.prototype.addnotification = function (words, timeout) {
	var notifEl = document.createElement('div');
	notifEl.className = "notification";
	notifEl.timeout = timeout;
	var id = this.getnoteid();
	notifEl.id = id;
	
	var dispEl = document.createElement('span');
	dispEl.innerHTML = words;
	dispEl.className = "notif-words";
	notifEl.appendChild(dispEl);
	
	var closeEl = document.createElement('button');
	closeEl.innerHTML = "x";
	closeEl.className = "notif-close";
	closeEl.addEventListener("click", (function (_notifEl) {
		return function () {
			_notifEl.parentElement.removeChild(_notifEl);
		}
	})(notifEl));
	notifEl.appendChild(closeEl);
	
	document.getElementById("notifications").appendChild(notifEl);
	this.notifications.push({note: id, time: timeout});
}

Game.prototype.getnoteid = function () {
	return z++;
}

function Special () {
	var choose = Math.random();
	this.effect = "";
	this.maxEffectTime = 0;
	if (choose < 0.5) {
		this.effect = "click";
		this.maxEffectTime = 40000;
	} else {
		this.effect = "production";
		this.maxEffectTime = 40000;
	}
	this.maxScreenTime = 20000;
	this.screenTime = 20000; //20 seconds on screen
	this.effectTime = this.maxEffectTime;
	this.started = false;
	this.ended = false;
}

Special.prototype.updateTime = function (delta){
	if (delta < 0){
		return; //Nice try
	}
	if (this.started){
		this.effectTime -= delta;
		if (this.effectTime <= 0){
			this.ended = true;
		}
	} else {
		this.screenTime -= delta;
		if (this.screenTime <= 0){
			this.ended = true;
		}
	}
}

Special.prototype.getPosition = function () {
	if (this.effect === "click"){
		return (100 * this.screenTime / this.maxScreenTime) + "%";
	}
	if (this.effect === "production"){
		return 100 - (100 * this.screenTime / this.maxScreenTime) + "%";
	}
}

Special.prototype.clicked = function (game) {
	this.started = true;
	game.totalspecials++;
	console.log(this.effect);
	if (this.effect === "click"){
		game.addnotification("Special Cowbell! Clicking the cowbell is 20x effective over the next 40 seconds.", 10000);
	} else if (this.effect === "production"){
		game.addnotification("Special Cowbell! You earn 5x notes per second for the next 40 seconds.", 10000);
	}
}