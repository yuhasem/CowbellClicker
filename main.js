var game; //Outside for testing
var largeSuffixes = ["million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion", "decillion"];
var shortSuffixes = ["M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

function onload() {
	game = new Game();
	
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
	
	var clicker = document.getElementById("clicker");
	clicker.addEventListener("mousedown", function () {
		game.click();
	});
	
	var specEl = document.getElementById("special");
	specEl.addEventListener("mousedown", function () {
		game.special.clicked();
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
	
	var mute = document.getElementById("mute");
	mute.addEventListener("click", function() {
		game.togglemute(mute);
	});
	
	game.uitick();
	
	game.timeoutPointer = setTimeout(game.gametick, 100, game);
}

function Game() {
	this.buildings = [
		{name: "Cowbell", description: "More cowbells to click!", num: 0, cost: 10, growth: 1.15, mps: 0.2},
		{name: "Band", description: "A band to help bang the cowbell!", num: 0, cost: 150, growth: 1.15, mps: 2},
		{name: "Synthesizer", description: "Digitally construct more cowbell!", num: 0, cost: 1000, growth: 1.15, mps: 6},
		{name: "Mine", description: "Mine materials for more cowbells!", num: 0, cost: 75000, growth: 1.15, mps: 30},
		{name: "Virtual Reality", description: "Fill other worlds with cowbell!", num: 0, cost: 420000, growth: 1.15, mps: 60},
		{name: "Solar Panels", description: "Turn solar enery in to acoustics!", num: 0, cost: 6000000, growth: 1.15, mps: 300},
		{name: "Amplifier", description: "Amplify old cowbells to faint to hear!", num: 0, cost: 100000000, growth: 1.15, mps: 2000},
		{name: "Magician", description: "Use magic to create more cowbell!", num: 0, cost: 5000000000, growth: 1.15, mps: 25000}
	];
	//Engineers/Scientists?
	
	//upgrades and achievements are essentially lists of listeners which will be notfied at every game tick
	//When unlocked/achieved, they will be removed from the original list as a deregistration from the notifier.
	this.upgrades = [
		{id: 1, disp: 1, cost: 50, name: "Double or Nothing", description: "Doubles the notes per second from Cowbells", builds: [1,0,0,0,0,0,0,0]},
		{id: 2, disp: 2, cost: 200, name: "Robotic Cowbells", description: "Doubles the notes per second from Cowbells", builds: [10,0,0,0,0,0,0,0], upgrades: [1]},
		{id: 3, disp: 3, cost: 50000, name: "25 Cowbells", description: "Doubles blah balh", builds: [25,0,0,0,0,0,0,0], upgrades: [2]},
		{id: 4, disp: 4, cost: 200000, name: "50 Cowbells", description: "Doubles blah again", builds: [50,0,0,0,0,0,0,0], upgrades: [3]},
		{id: 5, disp: 5, cost: 5000000, name: "100 Cowbells", description: "Double you know the drill", builds: [100,0,0,0,0,0,0,0], upgrades: [4]},
		{id: 6, disp: 6, cost: 20000000, name: "150 Cowbells", description: "Ridiculous", builds: [150,0,0,0,0,0,0,0], upgrades: [5]},
		{id: 7, disp: 7, cost: 500000000, name: "200 Cowbells", description: "Another One", builds: [200,0,0,0,0,0,0,0], upgrades: [6]},
		{id: 8, disp: 8, cost: 50, name: "1 Band", description: "Doubles the notes per second from Band", builds: [0,1,0,0,0,0,0,0]},
		{id: 9, disp: 9, cost: 200, name: "10 Band", description: "Doubles the notes per second from Band", builds: [0,10,0,0,0,0,0,0], upgrades: [8]},
		{id: 10, disp: 10, cost: 50000, name: "25 Band", description: "Doubles blah balh", builds: [0,25,0,0,0,0,0,0], upgrades: [9]},
		{id: 11, disp: 11, cost: 200000, name: "50 Band", description: "Doubles blah again", builds: [0,50,0,0,0,0,0,0], upgrades: [10]},
		{id: 12, disp: 12, cost: 5000000, name: "100 Band", description: "Double you know the drill", builds: [0,100,0,0,0,0,0,0], upgrades: [11]},
		{id: 13, disp: 13, cost: 20000000, name: "150 Band", description: "Ridiculous", builds: [0,150,0,0,0,0,0,0], upgrades: [12]},
		{id: 14, disp: 14, cost: 500000000, name: "200 Band", description: "Another One", builds: [0,200,0,0,0,0,0,0], upgrades: [13]},
		{id: 15, disp: 15, cost: 50, name: "1 Synth", description: "Doubles the notes per second from Synth", builds: [0,0,1,0,0,0,0,0]},
		{id: 16, disp: 16, cost: 200, name: "10 Synth", description: "Doubles the notes per second from Synth", builds: [0,0,10,0,0,0,0,0], upgrades: [15]},
		{id: 17, disp: 17, cost: 50000, name: "25 Synth", description: "Doubles blah balh", builds: [0,0,25,0,0,0,0,0], upgrades: [16]},
		{id: 18, disp: 18, cost: 200000, name: "50 Synth", description: "Doubles blah again", builds: [0,0,50,0,0,0,0,0], upgrades: [17]},
		{id: 19, disp: 19, cost: 5000000, name: "100 Synth", description: "Double you know the drill", builds: [0,0,100,0,0,0,0,0], upgrades: [18]},
		{id: 20, disp: 20, cost: 20000000, name: "150 Synth", description: "Ridiculous", builds: [0,0,150,0,0,0,0,0], upgrades: [19]},
		{id: 21, disp: 21, cost: 500000000, name: "200 Synth", description: "Another One", builds: [0,0,200,0,0,0,0,0], upgrades: [20]},
		{id: 22, disp: 22, cost: 50, name: "1 Mine", description: "Doubles the notes per second from Mine", builds: [0,0,0,1,0,0,0,0]},
		{id: 23, disp: 23, cost: 200, name: "10 Mine", description: "Doubles the notes per second from Mine", builds: [0,0,0,10,0,0,0,0], upgrades: [22]},
		{id: 24, disp: 24, cost: 50000, name: "25 Mine", description: "Doubles blah balh", builds: [0,0,0,25,0,0,0,0], upgrades: [23]},
		{id: 25, disp: 25, cost: 200000, name: "50 Mine", description: "Doubles blah again", builds: [0,0,0,50,0,0,0,0], upgrades: [24]},
		{id: 26, disp: 26, cost: 5000000, name: "100 Mine", description: "Double you know the drill", builds: [0,0,0,100,0,0,0,0], upgrades: [25]},
		{id: 27, disp: 27, cost: 20000000, name: "150 Mine", description: "Ridiculous", builds: [0,0,0,150,0,0,0,0], upgrades: [26]},
		{id: 28, disp: 28, cost: 500000000, name: "200 Mine", description: "Another One", builds: [0,0,0,200,0,0,0,0], upgrades: [27]},
		{id: 29, disp: 29, cost: 50, name: "1 Virtual Reality", description: "Doubles the notes per second from Virtual Reality", builds: [0,0,0,0,1,0,0,0]},
		{id: 30, disp: 30, cost: 200, name: "10 Virtual Reality", description: "Doubles the notes per second from Virtual Reality", builds: [0,0,0,0,10,0,0,0], upgrades: [29]},
		{id: 31, disp: 31, cost: 50000, name: "25 Virtual Reality", description: "Doubles blah balh", builds: [0,0,0,0,25,0,0,0], upgrades: [30]},
		{id: 32, disp: 32, cost: 200000, name: "50 Virtual Reality", description: "Doubles blah again", builds: [0,0,0,0,50,0,0,0], upgrades: [31]},
		{id: 33, disp: 33, cost: 5000000, name: "100 Virtual Reality", description: "Double you know the drill", builds: [0,0,0,0,100,0,0,0], upgrades: [32]},
		{id: 34, disp: 34, cost: 20000000, name: "150 Virtual Reality", description: "Ridiculous", builds: [0,0,0,0,150,0,0,0], upgrades: [33]},
		{id: 35, disp: 35, cost: 500000000, name: "200 Virtual Reality", description: "Another One", builds: [0,0,0,0,200,0,0,0], upgrades: [34]},
		{id: 36, disp: 36, cost: 50, name: "1 Solar Panels", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,1,0,0]},
		{id: 37, disp: 37, cost: 200, name: "10 Solar Panels", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,10,0,0], upgrades: [36]},
		{id: 38, disp: 38, cost: 50000, name: "25 Solar Panels", description: "Doubles blah balh", builds: [0,0,0,0,0,25,0,0], upgrades: [37]},
		{id: 39, disp: 39, cost: 200000, name: "50 Solar Panels", description: "Doubles blah again", builds: [0,0,0,0,0,50,0,0], upgrades: [38]},
		{id: 40, disp: 40, cost: 5000000, name: "100 Solar Panels", description: "Double you know the drill", builds: [0,0,0,0,0,100,0,0], upgrades: [39]},
		{id: 41, disp: 41, cost: 20000000, name: "150 Solar Panels", description: "Ridiculous", builds: [0,0,0,0,0,150,0,0], upgrades: [40]},
		{id: 42, disp: 42, cost: 500000000, name: "200 Solar Panels", description: "Another One", builds: [0,0,0,0,0,200,0,0], upgrades: [41]},
		{id: 43, disp: 43, cost: 50, name: "1 Amplifiers", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,1,0]},
		{id: 44, disp: 44, cost: 200, name: "10 Amplifiers", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,10,0], upgrades: [43]},
		{id: 45, disp: 45, cost: 50000, name: "25 Amplifiers", description: "Doubles blah balh", builds: [0,0,0,0,0,0,25,0], upgrades: [44]},
		{id: 46, disp: 46, cost: 200000, name: "50 Amplifiers", description: "Doubles blah again", builds: [0,0,0,0,0,0,50,0], upgrades: [45]},
		{id: 47, disp: 47, cost: 5000000, name: "100 Amplifiers", description: "Double you know the drill", builds: [0,0,0,0,0,0,100,0], upgrades: [46]},
		{id: 48, disp: 48, cost: 20000000, name: "150 Amplifiers", description: "Ridiculous", builds: [0,0,0,0,0,0,150,0], upgrades: [47]},
		{id: 49, disp: 49, cost: 500000000, name: "200 Amplifiers", description: "Another One", builds: [0,0,0,0,0,0,200,0], upgrades: [48]},
		{id: 50, disp: 50, cost: 50, name: "1 Magicians", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,1]},
		{id: 51, disp: 51, cost: 200, name: "10 Magicians", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,10], upgrades: [50]},
		{id: 52, disp: 52, cost: 50000, name: "25 Magicians", description: "Doubles blah balh", builds: [0,0,0,0,0,0,0,25], upgrades: [51]},
		{id: 53, disp: 53, cost: 200000, name: "50 Magicians", description: "Doubles blah again", builds: [0,0,0,0,0,0,0,50], upgrades: [52]},
		{id: 54, disp: 54, cost: 5000000, name: "100 Magicians", description: "Double you know the drill", builds: [0,0,0,0,0,0,0,100], upgrades: [53]},
		{id: 55, disp: 55, cost: 20000000, name: "150 Magicians", description: "Ridiculous", builds: [0,0,0,0,0,0,0,150], upgrades: [54]},
		{id: 56, disp: 56, cost: 500000000, name: "200 Magicians", description: "Another One", builds: [0,0,0,0,0,0,0,200], upgrades: [55]},
	];
	this.unlockedUpgrades = [];
	this.boughtUpgrades = [];
	this.maxupgrades = this.upgrades.length;
	
	this.achievements = [
		{id: 1, disp: 1, name: "Clicker", description: "Click 10 times", clicks: [10,0]},
		{id: 2, disp: 2, name: "Click Earner", description: "Gain 100 notes from clicking", clicks: [0,100]}
	];
	this.earnedAchievements = [];
	this.maxachievements = this.achievements.length;
	//upgrades and achievements affected by load
	
	this.clicktracks = [
		{id: 1, name: "Basic Clicktrack", bpm: 120, clicks: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
	];
	
	this.money = 0; //Loadable
	this.mps = 0;
	this.clicks = 0; //Loadble
	this.clickpower = 1;
	this.clickmoney = 0; //Loadable
	this.moneythisgame = 0; //Loadable
	this.moneyalltime = 0; //Loadable
	
	this.special = undefined; //Only supports one special at a time?
	this.tonextspecial = this.getNextSpecialTime();
	
	this.sounds = [];
	this.muted = false;
	this.suffix = largeSuffixes; //Will be configurable setting TODO
	
	this.lastTick = Date.now();
	this.timeSinceLastUIUpdate = 0;
	
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
			ret *= 3;
		}
	}
	return ret;
}

Game.prototype.moneyPerClick = function () {
	var ret = this.clickpower;
	if (this.special && this.special.started && !this.special.ended){
		if (this.special.effect == "click"){
			ret += this.mps*0.15;
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
	
	var buildEl = document.getElementById("build-space");
	for (var i = 0; i < game.buildings.length; i++){
		var cost = game.buildings[i].cost*Math.pow(game.buildings[i].growth, game.buildings[i].num);
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
	
	if (game.timeSinceLastUIUpdate > 1000){
		game.uitick();
		game.timeSinceLastUIUpdate = 0;
	}
	
	game.timeoutPointer = setTimeout(game.gametick, 100, game); //God Bless Functional Programming
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
	
	var buildEls = document.getElementsByClassName("building");
	var multi = this.globalMulti();
	for (var i = 0; i < this.buildings.length; i++){
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

function Special () {
	var choose = Math.random();
	this.effect = "";
	this.maxEffectTime = 0;
	if (choose < 0.5) {
		this.effect = "click";
		this.maxEffectTime = 20000;
	} else {
		this.effect = "production";
		this.maxEffectTime = 60000;
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

Special.prototype.clicked = function () {
	this.started = true;
	console.log(this.effect);
}