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
	specEl.addEventListener("mousedown", function (event) {
		if (event.buttons && event.buttons === 1){
			game.special.clicked(game);
			this.style.display = "none";
			return;
		}
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
	
	var suffixEl = document.getElementById("suffix");
	suffixEl.addEventListener("click", function () {
		game.togglesuffix(suffixEl);
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
	this.engineers = {name: "Engineers", description: "Hire Engineers to help you synergize your buildings", num: 0, cost: 100000, growth: 1.1};
	this.scientists = {name: "Scientists", description: "Hire Scientists to discover new materials ti improve some buildings", num: 0, cost: 100000, growth: 1.1};
	//Engineers/Scientists cost notes per second instead of just notes
	//Should we experiment with different growth rates beside exponential?
	this.tech = [
		{},
		{}
	];
	
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
		{id: 15, disp: 15, cost: 5000, name: "Auto Tune", description: "Doubles the notes per second from Synths", builds: [0,0,1,0,0,0,0,0]},
		{id: 16, disp: 16, cost: 50000, name: "Tweak the Reverb", description: "Doubles the notes per second from Synths", builds: [0,0,10,0,0,0,0,0], upgrades: [15]},
		{id: 17, disp: 17, cost: 1000000, name: "Remix", description: "Doubles the notes per second from Synths", builds: [0,0,25,0,0,0,0,0], upgrades: [16]},
		{id: 18, disp: 18, cost: 60000000, name: "Automation", description: "Doubles the notes per second from Synths", builds: [0,0,50,0,0,0,0,0], upgrades: [17]},
		{id: 19, disp: 19, cost: 120000000000, name: "Fourier Series", description: "Doubles the notes per second from Synths", builds: [0,0,100,0,0,0,0,0], upgrades: [18], flavor: "No, it's simple! Everything is made out of sinusoids! That makes it easier to understand, right?"},
		{id: 20, disp: 20, cost: 200000000000000, name: "Re-remix", description: "Doubles the notes per second from Synths", builds: [0,0,150,0,0,0,0,0], upgrades: [19], flavor: "As long as you're the first to copy the copy, you're still original."},
		{id: 21, disp: 21, cost: 280000000000000000, name: "Funky Beats", description: "Doubles the notes per second from Synths", builds: [0,0,200,0,0,0,0,0], upgrades: [20], flavor: "Won't you take me to Funky Town?"},
		{id: 22, disp: 22, cost: 100000, name: "Work Harder, Not Smarter", description: "Doubles the notes per second from Mines", builds: [0,0,0,1,0,0,0,0]},
		{id: 23, disp: 23, cost: 2000000, name: "Minor Miners", description: "Doubles the notes per second from Mines", builds: [0,0,0,10,0,0,0,0], upgrades: [22], flavor: "Kids these days are coming into the mining workforce with a lot of experience!"},
		{id: 24, disp: 24, cost: 35000000, name: "Longer Hours", description: "Doubles the notes per second from Mines", builds: [0,0,0,25,0,0,0,0], upgrades: [23]},
		{id: 25, disp: 25, cost: 2250000000, name: "Exoskeletons", description: "Doubles the notes per second from Mines", builds: [0,0,0,50,0,0,0,0], upgrades: [24]},
		{id: 26, disp: 26, cost: 4750000000000, name: "Cyborg Miners", description: "Doubles the notes per second from Mines", builds: [0,0,0,100,0,0,0,0], upgrades: [25]},
		{id: 27, disp: 27, cost: 7700000000000000, name: "Deeper Mines", description: "Doubles the notes per second from Mines", builds: [0,0,0,150,0,0,0,0], upgrades: [26]},
		{id: 28, disp: 28, cost: 11000000000000000000, name: "Heat Resistant Robots", description: "Doubles the notes per second from Mines", builds: [0,0,0,200,0,0,0,0], upgrades: [27]},
		{id: 29, disp: 29, cost: 1000000, name: "A Whole New World", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,1,0,0,0], flavor: "This is one of the few songs I reference that does not have cowbell in it."},
		{id: 30, disp: 30, cost: 15000000, name: "Three Dimensional Technology", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,10,0,0,0], upgrades: [29], flavor: "Listen to cowbell...IN 3D!"},
		{id: 31, disp: 31, cost: 200000000, name: "The Way of the Future", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,25,0,0,0], upgrades: [30]},
		{id: 32, disp: 32, cost: 15000000000, name: "VR Headsets inside VR", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,50,0,0,0], upgrades: [31], flavor: "We need to go deeper."},
		{id: 33, disp: 33, cost: 30000000000000, name: "Social Media Integration", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,100,0,0,0], upgrades: [32]},
		{id: 34, disp: 34, cost: 50000000000000000, name: "The Matrix", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,150,0,0,0], upgrades: [33]},
		{id: 35, disp: 35, cost: 65000000000000000000, name: "Universe Simulation", description: "Doubles the notes per second from Virtual Realities", builds: [0,0,0,0,200,0,0,0], upgrades: [34], flavor: "If you want to make the world a better place, just make a new one!"},
		{id: 36, disp: 36, cost: 7000000, name: "Tax Credits", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,1,0,0]},
		{id: 37, disp: 37, cost: 100000000, name: "Improved Efficiency", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,10,0,0], upgrades: [36]},
		{id: 38, disp: 38, cost: 2000000000, name: "Graphite Layering", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,25,0,0], upgrades: [37]},
		{id: 39, disp: 39, cost: 125000000000, name: "Leafed Wires", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,50,0,0], upgrades: [38]},
		{id: 40, disp: 40, cost: 240000000000000, name: "Fossil Fuel Smear Campaign", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,100,0,0], upgrades: [39]},
		{id: 41, disp: 41, cost: 390000000000000000, name: "Hipster Craze", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,150,0,0], upgrades: [40]},
		{id: 42, disp: 42, cost: 550000000000000000000, name: "Full Spectrum Absorption", description: "Doubles the notes per second from Solar Panels", builds: [0,0,0,0,0,200,0,0], upgrades: [41], flavor: "My Wifi!"},
		{id: 43, disp: 43, cost: 100000000, name: "Turned Up To 11", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,1,0]},
		{id: 44, disp: 44, cost: 1600000000, name: "Electric Cowbells", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,10,0], upgrades: [43]},
		{id: 45, disp: 45, cost: 35000000000, name: "Earplugs for the band", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,25,0], upgrades: [44]},
		{id: 46, disp: 46, cost: 2000000000000, name: "This One Goes Up To 12", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,50,0], upgrades: [45], flavor: "It's 1 louder."},
		{id: 47, disp: 47, cost: 4200000000000000, name: "Principia Amplifica", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,100,0], upgrades: [46]},
		{id: 48, disp: 48, cost: 6666000000000000000, name: "Heard from the ISS", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,150,0], upgrades: [47], flavor: "Actually we just used a grapevine to carry the sound up there."},
		{id: 49, disp: 49, cost: 10000000000000000000000, name: "Cowbell Resurrection", description: "Doubles the notes per second from Amplifiers", builds: [0,0,0,0,0,0,200,0], upgrades: [48], flavor:"Cowbell Jesus died for you cheap wood block knock-off."},
		{id: 50, disp: 50, cost: 10000000000, name: "Sleight of Hand", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,1]},
		{id: 51, disp: 51, cost: 40000000000, name: "ESP", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,10], upgrades: [50]},
		{id: 52, disp: 52, cost: 800000000000, name: "Fantasy Novel", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,25], upgrades: [51], flavor: "With vampires, or orcs, or whatever you kids are into these days."},
		{id: 53, disp: 53, cost: 50000000000000, name: "Blockbuster Movie", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,50], upgrades: [52], flavor: "Now you see me, now you're in jail 'cause you pickpocketed everybody."},
		{id: 54, disp: 54, cost: 100000000000000000, name: "David Blane", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,100], upgrades: [53]},
		{id: 55, disp: 55, cost: 190000000000000000000, name: "Penn and Teller", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,150], upgrades: [54]},
		{id: 56, disp: 56, cost: 250000000000000000000000, name: "Houdini", description: "Doubles the notes per second from Magicians", builds: [0,0,0,0,0,0,0,200], upgrades: [55]},
		{id: 57, disp: 100, cost: 200000, name: "Click Track", description: "Unlocks the clicktrack to scale your click power!", builds:[40,30,0,0,0,0,0,0], clicks:[100,1000],
			upFunction: function(game) {
				game.clicktracks[0].unlocked = true;
				var selectEl = document.createElement("option");
				selectEl.innerHTML = game.clicktracks[0].name;
				selectEl.value = game.clicktracks[0].value;
				document.getElementById("clicktrack-dropdown").appendChild(selectEl);}},
		{id: 58, disp: 101, cost: 10000000, name: "New Track", description: "A new song for your clicktrack", builds: [40,45,0,0,0,0,0,0], clicks:[500,100000], upgrades:[57], flavor: "A machine could drum this pretty easy",
			upFunction: function(game) {
				game.clicktracks[1].unlocked = true;
				var selectEl = document.createElement("option");
				selectEl.innerHTML = game.clicktracks[1].name;
				selectEl.value = game.clicktracks[1].value;
				document.getElementById("clicktrack-dropdown").appendChild(selectEl);}},
		{id: 59, disp: 102, cost: 100000000, name: "New Track+", description: "A new song for your clicktrack", builds: [40,60,0,0,0,0,0,0], clicks:[1000,1000000], upgrades:[57], flavor: "Devil went down to Texas looking for a cow to steal...",
			upFunction: function(game) {
				game.clicktracks[2].unlocked = true;
				var selectEl = document.createElement("option");
				selectEl.innerHTML = game.clicktracks[2].name;
				selectEl.value = game.clicktracks[2].value;
				document.getElementById("clicktrack-dropdown").appendChild(selectEl);}},
		//{id: 60, disp: 103, cost: 1000000000, name: "New Track++ (TODO)", description: "A new song for your clicktrack", builds: [40,75,0,0,0,0,0,0], clicks:[1500,2000000], upgrades:[57], flavor:"'Through the Carpal Tunnel and the Broken Mice' on Expert",
		//	upFunction: function(game) {
		//		game.clicktracks[3].unlocked = true;
		//		var selectEl = document.createElement("option");
		//		selectEl.innerHTML = game.clicktracks[3].name;
		//		selectEl.value = game.clicktracks[3].value;
		//		document.getElementById("clicktrack-dropdown").appendChild(selectEl);}},
		{id: 61, disp: 90, cost: 10000, name: "Manual Clicker", description: "Cowbell clicks also earn 0.5% of your notes per second", clicks:[0,500]},
		{id: 62, disp: 91, cost: 1000000, name: "Cowbell Expert", description: "Cowbell clicks also earn 1% of your notes per second", clicks:[0,10000]},
		{id: 63, disp: 92, cost: 100000000, name: "Cowbell Efficiando", description: "Cowbell clicks also earn 1.5% of your notes per second", clicks: [0,1000000]},
		{id: 64, disp: 93, cost: 10000000000, name: "Cowbell God", description: "Cowbell clicks also earn 2% of your notes per second", clicks: [0,100000000], flavor:"My cowbell clangs are like thunder raining down from Mt. Olympus"}
	];
	this.unlockedUpgrades = [];
	this.boughtUpgrades = [];
	this.maxupgrades = this.upgrades.length;
	this.shownunlockedupgrades = 0;
	this.shownboughtupgrades = 0;
	
	this.achievements = [
		{id: 1, disp: 7, name: "Clicker", description: "Click 100 notes from clicking", clicks: [0,100]},
		{id: 2, disp: 8, name: "Click Earner", description: "Gain 1000 notes from clicking", clicks: [0,1000]},
		{id: 3, disp: 9, name: "Click Businessman", description: "Gain 10,000 notes from clicking", clicks: [0,10000]},
		{id: 4, disp: 10, name: "Click Entrepreneur", description: "Gain 100,000 notes from clicking", clicks: [0,100000]},
		{id: 5, disp: 11, name: "Click Tycoon", description: "Gain 1 million notes from clicking", clicks: [0,1000000]},
		{id: 6, disp: 12, name: "Click Emperor", description: "Gain 10 million notes from clicking", clicks: [0,10000000], flavor: "King with a Plastic Scepter"},
		{id: 7, disp: 13, name: "Click Entrepreneur", description: "Gain 100 million notes from clicking", clicks: [0,100000000]},
		{id: 21, disp: 1, name: "Perucssion Newbie", description: "Gain 100 notes all time", money: [0,0,100]},
		{id: 22, disp: 2, name: "Musician", description: "Gain 10,000 notes all time", money: [0,0,10000]},
		{id: 23, disp: 3, name: "Drum Major", description: "Gain 1 million notes all time", money: [0,0,1000000]},
		{id: 24, disp: 4, name: "Percussion Master", description: "Gain 100 million notes all time", money: [0,0,100000000]},
		{id: 25, disp: 5, name: "Rising Talent", description: "Gain 10 billion notes all time", money: [0,0,10000000000]},
		{id: 26, disp: 6, name: "Superstar", description: "Gain 1 trillion notes all time", money: [0,0,1000000000000]},
		{id: 51, disp: 14, name: "Click-mania", description: "Build 10 Clickers", builds: [10,0,0,0,0,0,0,0]},
		{id: 52, disp: 15, name: "Click-aholic", description: "Build 25 Clickers", builds: [25,0,0,0,0,0,0,0]},
		{id: 53, disp: 16, name: "Click-tacular", description: "Build 50 Clickers", builds: [50,0,0,0,0,0,0,0]},
		{id: 54, disp: 17, name: "Click-amanjaro", description: "Build 100 Clickers", builds: [100,0,0,0,0,0,0,0]},
		{id: 55, disp: 18, name: "Click-pocalypse", description: "Build 200 Clickers", builds: [200,0,0,0,0,0,0,0], flavor: "Likeness to other incrementals is purely coincidental."},
		{id: 61, disp: 19, name: "Creedence Cowbell Revival", description: "Build 10 Bands", builds: [0,10,0,0,0,0,0,0], flavor: "What, were you born on a bayou?"},
		{id: 62, disp: 20, name: "Mississippi Queen", description: "Build 25 Bands", builds: [0,25,0,0,0,0,0,0], flavor: "If you know what I mean. ( ͡° ͜ʖ ͡°)"},
		{id: 63, disp: 21, name: "Def Cowbell", description: "Build 50 Bands", builds: [0,50,0,0,0,0,0,0], flavor: "Cowbell forged from the Rock of Ages"},
		{id: 64, disp: 22, name: "Crosseyed and Painless", description: "Build 100 Bands", builds: [0,100,0,0,0,0,0,0], flavor: "Talking Heads"},
		{id: 65, disp: 23, name: "Wild Cowbell", description: "Build 200 Bands", builds: [0,200,0,0,0,0,0,0], flavor: "Play that Funky Cowbell"},
		{id: 71, disp: 24, name: "Not Just a Phase (Shift)", description: "Build 10 Synthesizers", builds: [0,0,10,0,0,0,0,0]},
		{id: 72, disp: 25, name: "Genre Starter", description: "Build 25 Synthesizers", builds: [0,0,25,0,0,0,0,0]},
		{id: 73, disp: 26, name: "The Synth-miser", description: "Build 50 Synthesizers", builds: [0,0,50,0,0,0,0,0]},
		{id: 74, disp: 27, name: "All-Natural Artificial Cowbell", description: "Build 100 Synthesizers", builds: [0,0,100,0,0,0,0,0]},
		{id: 75, disp: 28, name: "Harmonic Bliss", description: "Build 200 Synthesizers", builds: [0,0,200,0,0,0,0,0]},
		{id: 81, disp: 29, name: "We Need to Go Deeper", description: "Build 10 Mines", builds: [0,0,0,10,0,0,0,0]},
		{id: 82, disp: 30, name: "Tunnel Networks", description: "Build 25 Mines", builds: [0,0,0,25,0,0,0,0]},
		{id: 83, disp: 31, name: "Make the Ants Jealous", description: "Build 50 Mines", builds: [0,0,0,50,0,0,0,0]},
		{id: 84, disp: 32, name: "Deeper than Diamonds", description: "Build 100 Mines", builds: [0,0,0,100,0,0,0,0]},
		{id: 85, disp: 33, name: "Journey to the Center of the Earth", description: "Build 200 Mines", builds: [0,0,0,200,0,0,0,0]},
		{id: 91, disp: 34, name: "Really Virtual", description: "Build 10 Virtual Realities", builds: [0,0,0,0,10,0,0,0]},
		{id: 92, disp: 35, name: "More Than Just a Game Console", description: "Build 25 Virtual Realities", builds: [0,0,0,0,25,0,0,0]},
		{id: 93, disp: 36, name: "Virtual Monopoly", description: "Build 50 Virtual Realities", builds: [0,0,0,0,50,0,0,0]},
		{id: 94, disp: 37, name: "Virtaully Unstoppable", description: "Build 100 Virtual Realities", builds: [0,0,0,0,100,0,0,0]},
		{id: 95, disp: 38, name: "Master of the Multiverse", description: "Build 200 Virtual Realities", builds: [0,0,0,0,200,0,0,0]},
		{id: 101, disp: 39, name: "Green Thumb", description: "Build 10 Solar Panels", builds: [0,0,0,0,0,10,0,0]},
		{id: 102, disp: 40, name: "Eco-Freak", description: "Build 25 Solar Panels", builds: [0,0,0,0,0,25,0,0]},
		{id: 103, disp: 41, name: "Earth Saver", description: "Build 50 Solar Panels", builds: [0,0,0,0,0,50,0,0]},
		{id: 104, disp: 42, name: "Pollution Stopper", description: "Build 100 Solar Panels", builds: [0,0,0,0,0,100,0,0]},
		{id: 105, disp: 43, name: "Earth Renewer", description: "Build 200 Solar Panels", builds: [0,0,0,0,0,200,0,0]},
		{id: 111, disp: 44, name: "Needs More Cowbell", description: "Build 10 Amplifiers", builds: [0,0,0,0,0,0,10,0]},
		{id: 112, disp: 45, name: "Better than Ibuprofen", description: "Build 25 Amplifiers", builds: [0,0,0,0,0,0,25,0]},
		{id: 113, disp: 46, name: "Golden Diapers", description: "Build 50 Amplifiers", builds: [0,0,0,0,0,0,50,0]},
		{id: 114, disp: 47, name: "The Cowbell Heard 'Round the World", description: "Build 100 Amplifiers", builds: [0,0,0,0,0,0,100,0]},
		{id: 115, disp: 48, name: "Amplification Manifestation", description: "Build 200 Amplifiers", builds: [0,0,0,0,0,0,200,0]},
		{id: 121, disp: 49, name: "It's Just Math", description: "Build 10 Magicians", builds: [0,0,0,0,0,0,0,10]},
		{id: 122, disp: 50, name: "It's Just Science", description: "Build 25 Magicians", builds: [0,0,0,0,0,0,0,25]},
		{id: 123, disp: 51, name: "It's Just Optical Illusions", description: "Build 50 Magicians", builds: [0,0,0,0,0,0,0,50]},
		{id: 124, disp: 52, name: "It's Just Psychology", description: "Build 100 Magicians", builds: [0,0,0,0,0,0,0,100]},
		{id: 125, disp: 53, name: "It's Just Magic", description: "Build 200 Magicians", builds: [0,0,0,0,0,0,0,200], flavor: "It's just a prank, bro!"},
		{id: 131, disp: 54, name: "Cowbell Hero I", description: "Hit 100 consecutive notes on the Basic Clicktrack", tracks: [0, 100]},
		{id: 132, disp: 55, name: "Cowbell Hero II", description: "Hit 100 consecutive notes on the Intermidiate Clicktrack", tracks: [1, 100]},
		{id: 133, disp: 56, name: "Cowbell Hero III", description: "Hit 100 consecutive notes on the Advanced Clicktrack", tracks: [2, 100], flavor: "Well you're pretty good 'ol son."},
	];
	this.earnedAchievements = [];
	this.maxachievements = this.achievements.length;
	document.getElementById("max-achievements").innerHTML = this.maxachievements;
	this.shownachievements = 0;
	
	this.clicktracks = [
		{value: "base", name: "Basic Clicktrack", unlocked: false, bpm: 120, clicks: [0,1,2,3], length: 4, clicked: []}, //Generic Cowbell Song
		{value: "drummachine", name: "Intermediate Clicktrack", unlocked: false, bpm: 120, clicks: [1,2,3,4,5,6,7,9,11,12,12.75,13,14,15,16,16.75,17], length: 18, clicked: []}, //Animusic - Drum Machine
		{value: "devilwent", name: "Advanced Clicktrack", unlocked: false, bpm: 120, clicks: [0,1,2,2.5,3,3.25,3.5,4,5,6,6.5,7,7.25,7.5,8,9,10,10.5,11,11.25,11.5,12,13,14,14.5,15,15.25,15.5,
		                                                                                      16,16.5,17,17.5,18,18.5,19,19.5,20,20.5,21,21.5,22,22.5,23,23.5,24,24.5,25,25.5,26,26.5,27,27.5,28,28.5,29,29.5,30,30.5,31,31.5,
																							  32,32.25,32.5,32.75,33,33.25,33.5,33.75,34,34.25,34.5,34.75,35,35.25,35.5,36,36.25,36.5,36.75,37,37.25,37.5,37.75,38,38.25,38.5,38.75,39,39.25,39.5,40,40.25,40.5,40.75,41,41.25,41.5,41.75,42,42.25,42.5,42.75,43,43.25,43.5,44,44.25,44.5,44.75,45,45.25,45.5,45.75,46,46.25,46.5,46.75,47,47.25,47.5,
																							  48,51,51.25,51.5,52,52.25,52.5,52.75,53.5,53.75,54,54.25,54.5,55,55.25,55.5,55.75,56,56.25,56.5,57,57.25,57.5,58,58.25,58.5,59,59.25,59.5,60,60.25,60.75,61,61.5,61.75,62,62.25,62.5,63,63.25,63.75,
																							  64,65,66,66.5,67,68,72,72.5,73,
																							  76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,
																							  92,92.25,93,93.25,93.5,94,94.5,95,96,97,97.25,97.5,98,98.5,98.75,99,100,100.25,100.5,101,101.5,101.75,102,102.5,103,104,105,105.25,105.5,105.75,106,106.25,106.5,107,107.5,
																							  108,108.25,108.5,108.75,109,109.5,110,110.25,110.5,111,112,113,113.25,113.5,113.75,114,114.25,114.5,115,115.5,116,116.25,116.5,116.75,117,117.5,118,118.5,118.75,119,120,121,121.25,121.5,122,122.25,122.5,123,123.25,123.5,
																							  124,124.5,124.75,125,125.5,125.75,126,126.5,126.75,127,127.25,127.5,128,128.5,128.75,129,129.5,129.75,130,130.5,130.75,131,131.5,131.75,
																							  132,132.25,132.75,133,133.25,133.75,134,134.25,134.5,135,135.25,135.75,136,136.5,136.75,137,137.5,137.75,138,138.5,138.75,139,139.25,139.5,
																							  140,140.5,140.75,141,141.5,141.75,142,142.5,142.75,143,143.25,143.5,144,145,145.5,146,148,149,149.5,150,
																							  152,152.5,153,153.5,154,154.5,155,155.5,156,158,158.5], length: 164, clicked: []}//Charlie Daniels Band - Devil Went down to Georgia (adaption for the cowbell)
		//Dragonforce - Through the Fire and the Flames (adaption for the cowbell)
	];
	
	this.money = 0;
	this.mps = 0;
	this.clicks = 0;
	this.clickmoney = 0;
	this.moneythisgame = 0; 
	this.moneyalltime = 0;
	
	this.special = undefined; //Only supports one special at a time
	this.tonextspecial = this.getNextSpecialTime();
	this.totalspecials = 0;
	
	this.currentclicktrack = -1;
	this.consecutiveclicktrack = 0;
	this.maxconsecutive = 0;
	this.timeclicktrack = 0;
	this.canvas = document.getElementById("clicktrack-canvas");
	this.cheight = 400;
	this.cwidth = 200;
	
	this.prestige = 0;
	this.prestigecount = 0;
	this.prestigepivot = 100000000;
	
	this.sounds = [];
	this.muted = false;
	this.suffix = largeSuffixes;
	
	this.lastTick = Date.now();
	this.timeSinceLastUIUpdate = 0;
	
	if (this.load()){
		console.log("Load was successful");
	} else {
		console.log("Load was unsuccessful");
	}
	this.tonextsave = 60000;
	this.notifications = [];
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
	ret += this.hasUpgrade(61) ? this.mps*0.005 : 0;
	ret += this.hasUpgrade(62) ? this.mps*0.01 : 0;
	ret += this.hasUpgrade(63) ? this.mps*0.015 : 0;
	ret += this.hasUpgrade(64) ? this.mps*0.02 : 0;
	if (this.currentclicktrack == 2){
		ret *= 1 + (0.01 * this.consecutiveclicktrack);
	}
	if (this.currentclicktrack > 2){
		ret *= Math.pow(1.01, this.consecutiveclicktrack);
	}
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
	var upgradeEl = document.getElementById('upgrade-space');
	var upgrade2El = document.getElementById('upgrade-space2');
	if (game.unlockedUpgrades.length != game.shownunlockedupgrades){
		game.unlockedUpgrades.sort(function (a, b) {
			return a.cost - b.cost;
		});
		upgradeEl.innerHTML = "";
		upgrade2El.innerHTML = "";
		game.shownunlockedupgrades = 0;
		for (var i = 0; i < game.unlockedUpgrades.length; i++){
			var upEl = document.createElement('div');
			upEl.className = "upgrade" + (game.money > game.unlockedUpgrades[i].cost ? " on" : " off");
			var name = document.createElement('span');
			name.innerHTML = game.unlockedUpgrades[i].name;
			name.className = "up-name";
			upEl.appendChild(name);
			var id = game.unlockedUpgrades[i].id;
			upEl.addEventListener("mousedown", (function (_id) {
				return function (event) {
					if (event.buttons && event.buttons === 1){
						game.upgrade(_id);
						return;
					}
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
			up2El = upEl.cloneNode(true);
			upEl.id = "1uu"+game.unlockedUpgrades[i].id;
			up2El.id = "2uu"+game.unlockedUpgrades[i].id;
			up2El.addEventListener("mousedown", (function (_id) {
				return function (event) {
					if (event.buttons && event.buttons === 1){
						game.upgrade(_id);
						return;
					}
				}
			})(id));
			upgradeEl.appendChild(upEl);
			upgrade2El.appendChild(up2El);
			game.shownunlockedupgrades++;
		}
	}
	for (var i = 0; i < game.unlockedUpgrades.length; i++){
		var upEl = upgradeEl.childNodes[i];
		var up2El = upgrade2El.childNodes[i];
		if (game.money > game.unlockedUpgrades[i].cost){
			upEl.className = "upgrade on";
			up2El.className = "upgrade on";
		} else {
			upEl.className = "upgrade off";
			up2El.className = "upgrade off";
		}
	}
	game.boughtUpgrades.sort(function (a, b){
		return a.disp - b.disp;
	});
	var boughtEl = document.getElementById('purchased-upgrades');
	if (game.boughtUpgrades.length < game.shownboughtupgrades){
		 boughtEl.innerHTML = "";
		 this.shownboughtupgrades = 0;
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
			 upEl.id = "bu"+game.boughtUpgrades[i].id;
			 boughtEl.appendChild(upEl);
			 game.shownboughtupgrades++;
		 }
	} else if (game.boughtUpgrades.length > game.shownboughtupgrades){
		for (var i = 0; i < game.boughtUpgrades.length; i++){
			var el = document.getElementById("bu"+game.boughtUpgrades[i].id);
			if (!el){
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
				upEl.id = "bu"+game.boughtUpgrades[i].id;
				boughtEl.insertBefore(upEl, boughtEl.childNodes[i]);
				game.shownboughtupgrades++;
			}
		}
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
			if (this.moneythisgame < this.upgrades[i].money[1]){
				canUnlock = false;
			}
			if (this.moneyalltime < this.upgrades[i].money[2]){
				canUnlock = false;
			}
		}
		if (this.upgrades[i].tracks){
			if (this.currentclicktrack != this.achievements[i].tracks[0] || this.consecutiveclicktrack < this.achievements[i].tracks[1]){
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
			if (this.moneythisgame < this.achievements[i].money[1]){
				canUnlock = false;
			}
			if (this.moneyalltime < this.achievements[i].money[2]){
				canUnlock = false;
			}
		}
		if (this.achievements[i].tracks){
			if (this.currentclicktrack != this.achievements[i].tracks[0] || this.consecutiveclicktrack < this.achievements[i].tracks[1]){
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
	//If there are less earned achievements, a reset happened, let's refresh everything
	if (this.earnedAchievements.length < this.shownachievements){
		achieveEl.innerHTML = "";
		this.shownachievements = 0;
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
			achEl.id = "a"+this.earnedAchievements[i].id;
			achieveEl.appendChild(achEl);
			this.shownachievements++;
		}
	} else if (this.earnedAchievements.length > this.shownachievements){
		//There are some new achievements, let's display them
		for (var i = 0; i < this.earnedAchievements.length; i++){
			var ach = document.getElementById("a"+this.earnedAchievements[i].id);
			if (!ach){
				//This achievement does not have a corresponding element, let's create it now
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
				achEl.id = "a"+this.earnedAchievements[i].id;
				achieveEl.insertBefore(achEl, achieveEl.childNodes[i]);
				this.shownachievements++;
			}
		}
	}
	
	document.getElementById("earned-achievements").innerHTML = this.earnedAchievements.length;
	
	if (this.hasUpgrade(57)){
		document.getElementById("clicktrack-wrapper").style.display = "block";
		document.getElementById("clicktrack-dropdown").style.display = "inline";
		document.getElementById("consecutive-clicks").style.display = "inline";
		document.getElementById("clicktrack-canvas").style.display = "block";
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

Game.prototype.togglesuffix = function (setting) {
	if (setting.value === "long"){
		this.suffix = shortSuffixes;
		setting.value = "short";
		setting.innerHTML = "Short Words";
	} else if (setting.value === "short"){
		this.suffix = undefined;
		setting.value = "none";
		setting.innerHTML = "None";
	} else if (setting.value === "none") {
		this.suffix = largeSuffixes;
		setting.value = "long";
		setting.innerHTML = "Long Words";
	}
}

Game.prototype.formatlarge = function(number) {
	if (number < 1000000 || !this.suffix){ // < 1 million -> Don't format
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
			if (this.timeclicktrack - cc.clicks[i] > 2 && cc.clicks[i] + cc.length - this.timeclicktrack > 1){
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
			this.timeclicktrack -= cc.length;
		}
		//Here's where we draw on the canvas the next 6 beats of the click track (at least 4 beats visible)
		var ctx = this.canvas.getContext("2d");
		ctx.beginPath();
		ctx.strokeStyle = "#999999";
		ctx.moveTo(0,this.cheight*0.9);
		ctx.lineTo(this.cwidth,this.cheight*0.9);
		ctx.stroke();
		ctx.closePath();
		ctx.strokeStyle = "#FFFFFF";
		var x = this.cwidth/2;
		for (var i = 0; i < cc.clicks.length; i++){
			if (cc.clicks[i] - this.timeclicktrack < 6 && cc.clicks[i] - this.timeclicktrack >= 0){
				var dif = cc.clicks[i] - this.timeclicktrack;
				var y = this.cheight*(0.9 - 0.2*dif);
				ctx.beginPath();
				ctx.arc(x, y, this.cwidth/10, 0, 2*Math.PI);
				ctx.stroke();
				ctx.closePath();
			}
			if ((cc.clicks[i] + cc.length) - this.timeclicktrack < 6){
				var dif = (cc.clicks[i] + cc.length) - this.timeclicktrack;
				var y = this.cheight*(0.9 - 0.2*dif);
				ctx.beginPath();
				ctx.arc(x, y, this.cwidth/10, 0, 2*Math.PI);
				ctx.stroke();
				ctx.closePath();
			}
			if (cc.clicks[i] - this.timeclicktrack < 0 && cc.clicks[i] - this.timeclicktrack > -1){
				var dif = cc.clicks[i] - this.timeclicktrack;
				var y = this.cheight*(0.9 - 0.2*dif);
				if (cc.clicked[i]){
					ctx.strokeStyle = "#00FF00";
				} else {
					ctx.strokeStyle = "#FFFFFF";
				}
				ctx.beginPath();
				ctx.arc(x, y, this.cwidth/10, 0, 2*Math.PI);
				ctx.stroke();
				ctx.closePath();
			} else if (this.timeclicktrack < 1 && this.timeclicktrack >= 0 && cc.clicks[i] - cc.length - this.timeclicktrack < 0 && cc.clicks[i] - cc.length - this.timeclicktrack > -1) { //One hell of an if statement
				var dif = cc.clicks[i] - cc.length - this.timeclicktrack;
				var y = this.cheight*(0.9 - 0.2*dif);
				if (cc.clicked[i]){
					ctx.strokeStyle = "#00FF00";
				} else {
					ctx.strokeStyle = "#FFFFFF";
				}
				ctx.beginPath();
				ctx.arc(x, y, this.cwidth/10, 0, 2*Math.PI);
				ctx.stroke();
				ctx.closePath();
			}
			ctx.strokeStyle = "#FFFFFF";
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
				if (Math.abs(cc.clicks[i] - actualTime) < 0.2 || Math.abs(cc.clicks[i] + cc.length - actualTime) < 0.2){
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
		for (var i = 0; i < this.clicktracks.length; i++){
			this.clicktracks[i].unlocked = false;
		}
		var clicktrackDropdown = document.getElementById("clicktrack-dropdown");
		for (var i = 1; i < 4; i++){
			if (clicktrackDropdown.children[1]){
				clicktrackDropdown.removeChild(clicktrackDropdown.children[1]);
			}
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
		this.prestige = Math.floor((-1+Math.sqrt(1+(8*this.moneyalltime/this.prestigepivot)))/2);
		this.prestigecount++;
		this.lastTick = Date.now();
		this.timeSinceLastUIUpdate = 5000;
		this.gametick(this); //Redraw the UI
	}
}

Game.prototype.hardreset = function(l) {
	if (l == 1){
		if (confirm("WARNING: If you press OK here, you will lose ALL of your progress, including prestige. If you want to gain prestige, use the soft reset!")){
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
		var clicktrackDropdown = document.getElementById("clicktrack-dropdown");
		for (var i = 1; i < 4; i++){
			if (clicktrackDropdown.children[1]){
				clicktrackDropdown.removeChild(clicktrackDropdown.children[1]);
			}
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
	//var total = Math.floor(Math.sqrt(this.moneyalltime / 1000000000000));
	var total = Math.floor((-1+Math.sqrt(1+(8*this.moneyalltime/this.prestigepivot)))/2);
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
						//if (this.upgrades[j].upFunction){
						//	this.upgrades[j].upFunction(this);
						//} We need to test this at some point
						if (this.upgrades[j].id == 57){
							var selectEl = document.createElement("option");
							selectEl.innerHTML = this.clicktracks[0].name; 
							selectEl.value = this.clicktracks[0].value; 
							document.getElementById("clicktrack-dropdown").appendChild(selectEl);
						}
						if (this.upgrades[j].id == 58){
							var selectEl = document.createElement("option");
							selectEl.innerHTML = this.clicktracks[1].name; 
							selectEl.value = this.clicktracks[1].value; 
							document.getElementById("clicktrack-dropdown").appendChild(selectEl);
						}
						if (this.upgrades[j].id == 59){
							var selectEl = document.createElement("option");
							selectEl.innerHTML = this.clicktracks[2].name; 
							selectEl.value = this.clicktracks[2].value; 
							document.getElementById("clicktrack-dropdown").appendChild(selectEl);
						}
						if (this.upgrades[j].id == 60){
							var selectEl = document.createElement("option");
							selectEl.innerHTML = this.clicktracks[3].name; 
							selectEl.value = this.clicktracks[3].value; 
							document.getElementById("clicktrack-dropdown").appendChild(selectEl);
						}
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
