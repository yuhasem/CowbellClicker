testPasses = 0;
testFailures = 0;
failureLog = [];
	
function test() {
	clearTimeout(game.timeoutPointer);
	
	var upgradeCopy = game.upgrades.slice();
	var achievementsCopy = game.achievements.slice();
	
	game.money = 0;
	for (var i = 0; i < game.buildings.length; i++){
		game.buildings[i].num = 0;
		game.money = game.buildings[i].cost - 1;
		if (game.buy(i)){
			failureLog.push("Able to buy building " + i + " without enough money");
			testFailures++;
		} else {
			testPasses++;
		}
		game.money += 1;
		if (!game.buy(i)){
			failureLog.push("Unable to buy building " + i + " with enough money");
			testFailures++;
 		} else {
			testPasses++;
		}
		game.timeSinceLastUIUpdate = 0;
		game.recalcmps();
		if (game.mps !== game.buildings[i].mps){
			failureLog.push("Building " + i + " granting wrong amount of mps");
			testFailures++;
		} else {
			testPasses++;
		}
		game.money = game.buildings[i].cost;
		if (game.buy(i)){
			failureLog.push("Growth of building " + i + " incorrect");
			testFailures++;
		} else {
			testPasses++;
		}
		game.money = game.buildings[i].cost * game.buildings[i].growth;
		if (!game.buy(i)){
			failureLog.push("Growth of building " + i + " incorrect");
			testFailures++;
		} else {
			testPasses++;
		}
		game.timeSinceLastUIUpdate = 0;
		game.recalcmps();
		if (game.mps !== game.buildings[i].mps * 2) {
			failureLog.push("Building " + i + " granting wrong amount of mps");
			testFailures++;
		} else {
			testPasses++;
		}
		game.buildings[i].num = 0;
	}
	
	for (var i = 0; i < upgradeCopy.length; i++){
		var up = upgradeCopy[i];
		if (up.builds){
			for (var j = 0; j < up.builds.length; j++){
				game.buildings[j].num = up.builds[j];
			}
		}
		if (up.upgrades){
			for (var j = 0; j < up.upgrades.length; j++){
				for (var k = 0; k < game.upgrades.length; k++){
					if (game.upgrades[k].id == up.upgrades[j]){
						game.boughtUpgrades.push(game.upgrades.splice(k, 1)[0]);
						k--;
					}
				}
			}
		}
		if (up.clicks){
			game.clicks = up.clicks[0];
			game.clickmoney = up.clicks[1];
		}
		if (up.money){
			game.money = up.money[0];
			game.moneythisgame = up.money[1];
			game.moneyalltime = up.money[2];
		}
		game.timeSinceLastUIUpdate = 0;
		game.recalcmps();
		var testVal = game.mps;
		game.uitick();
		var success = false;
		for (var j = 0; j < game.unlockedUpgrades.length; j++){
			if (game.unlockedUpgrades[j].id == up.id){
				success = true;
				break;
			}
		}
		if (success){
			testPasses++;
		} else {
			testFailures++;
			failureLog.push("Upgrade " + up.id + " did not unlock correctly");
		}
		game.money = up.cost;
		game.upgrade(up.id);
		if (game.money != 0){
			testFailures++;
			failureLog.push("Upgrade " + up.id + " did not reduce money on purchase");
		} else {
			testPasses++;
		}
		game.timeSinceLastUIUpdate = 0;
		game.recalcmps();
		if (game.mps > testVal){
			testPasses++;
		} else {
			testFailures++;
			failureLog.push("Upgrade " + up.id + " did not increase mps after purchase " + game.mps + ", " + testVal);
		}
	}
	
	for (var i = 0; i < achievementsCopy.length; i++){
		var up = achievementsCopy[i];
		if (up.builds){
			for (var j = 0; j < up.builds.length; j++){
				game.buildings[j].num = up.builds[j];
			}
		}
		if (up.upgrades){
			for (var j = 0; j < up.upgrades.length; j++){
				for (var k = 0; k < game.upgrades.length; k++){
					if (game.upgrades[k].id == up.upgrades[j]){
						game.boughtUpgrades.push(game.upgrades.splice(k, 1));
						k--;
					}
				}
			}
		}
		if (up.clicks){
			game.clicks = up.clicks[0];
			game.clickmoney = up.clicks[1];
		}
		if (up.money){
			game.money = up.money[0];
			game.moneythisgame = up.money[1];
			game.moneyalltime = up.money[2];
		}
		game.uitick();
		var success = false;
		for (var j = 0; j < game.earnedAchievements.length; j++){
			if (game.earnedAchievements[j].id == up.id){
				success = true;
				break;
			}
		}
		if (success){
			testPasses++;
		} else {
			testFailures++;
			failureLog.push("Achievement " + up.id + " did not get awarded correctly");
		}
	}
	
	for (var i = 0; i < failureLog; i++){
		console.log(failureLog[i]);
	}
	console.log("Passes: " + testPasses);
	console.log("Fails: " + testFailures);
}