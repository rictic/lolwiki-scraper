var lib = require('./lib');
var fs = require('fs');
var champion_url_list = fs.readFileSync("champion_urls.txt", "utf8").split("\n");

var champions = [];
champion_url_list.forEach(function(champion_url) {
  lib.wikiFetch(champion_url, function(body) {
//     var infobox = body.match(/"infobox"[^]*?<\/table>/)[0];
    var statistics = body.match(/Statistics[^]*?Cost/)[0];
    var champion = {url: champion_url}
    champion.Name = body.match(/fbReturnToTitle="(.*?)"/)[1];
    var optional_stats = ["Mana", "Mana regen\\.", "Energy", "Energy regen\\."]; //"Rage"?
    var stats = ["Health", "Health regen\\.", "Attack damage", "Attack speed", "Armor", "Magic res", "Mana", "Mana regen\\.", "Energy", "Energy regen\\."]
    stats.forEach(function(stat) {
      var statName = stat.replace("\\", "");
//       console.log(statName);
      var r = new RegExp(stat + "[^]*?((\\d+(\\.\\d+)?)|N/A)\\s*(\\(\\+?(\\d+(\\.\\d+)?%?)\\))?")
      var info = statistics.match(r)
//       console.log(info);
      if (!info) {
        var na = statistics.match(new RegExp(stat + "[^]*?N/A"));
        if (na) {
          info = [null, "N/A", null, "N/A"];
        }
      }
      if (!info && optional_stats.indexOf(stat) !== -1) {
//         console.log("skipping " + stat + " on " + champion_url);
      } else {
        champion[statName] = info[1];
        champion[statName + " Per Level"] = info[5] || "";
      }
    });
    var static_stats = ["Mov\\. speed", "Range"];
    static_stats.forEach(function(stat) {
      var r = new RegExp(stat + "[^]*?(\\d+)")
      var info = statistics.match(r)
      champion[stat.replace("\\", "")] = info[1];
    });

	var abilitiesMap = {}
	var abilityTable = body.match(/class="abilities_table"[^]*?\<\/table\>/)[0];
	
	var passive = abilityTable.match(/\<tr class="ability innate_ability"\>[^]*?\<\/tr\>/g)[0];
	var passiveName = passive.match(/\<td id="(.*?)"/)[0];
	var passiveInfo = passive.match(/\<td class="abilityinfo"[^]*?\<\/tr\>/)[0];
	abilitiesMap[passiveName] = passiveInfo;
	
	var abilities = abilityTable.match(/\<tr class="ability (basic|ultimate)_ability"\>[^]*?\<\/tr\>/g);
	var abilityNames = abilityTable.match(/\<td id="(.*?)"/g);
	var abilityInfos = abilityTable.match(/\<td class="abilityinfo"[^]*?\<\/td\>/g);
	
	for (var i=0; i<abilities.length; i++) {
		var ability = abilities[i];
		console.log("Ability: " + ability);
		
		var name = ability.match(/\<td id="(.*?)"/)[1];
		console.log("Ability name: " + name);
		
		var abilityInfo = ability.match(/\<td class="abilityinfo"[^]*?\<\/td\>/)[0];
		console.log("Ability Info: " + abilityInfo);
		var cost1 = abilityInfo.match(/\<b\>Cost:\<\/b\>[^]*?\<\/li\>/);
		console.log("Cost 1: " + cost1);
		var cooldown1 = abilityInfo.match(/\<b\>Cooldown:\<\/b\>[^]*?\<\/li\>/);
		console.log("Cooldown 1: " + cooldown1);
		var range1 = abilityInfo.match(/\<b\>Range:\<\/b\>[^]*?\<\/li\>/);
		console.log("Range 1: " + range1);
		
		var abilityLevels = ability.match(/\<td class="abilitylevel"[^]*?\<\/td\>/)[0];
		console.log("Ability levels: " + abilityLevels);
		var cost2 = abilityLevels.match(/\<b\>Cost:\<\/b\>[^]*?\<\/p\>/);
		console.log("Ability cost: " + cost2);
		var cooldown2 = abilityLevels.match(/\<b\>Cooldown:\<\/b\>[^]*?\<\/p\>/);
		console.log("Ability cooldown: " + cooldown2);
		var range2 = abilityLevels.match(/\<b\>Range:\<\/b\>[^]*?\<\/p\>/);
		console.log("Ability range: " + range2);
		
		if (cost1 != null) {
			abilitiesMap[name] = cost1;
		} else {
			abilitiesMap[name] = cost2;
		}
		
		if (cooldown1 != null) {
			abilitiesMap[name] = cooldown1;
		} else {
			abilitiesMap[name] = cooldown2;
		}
		
		if (range1 != null) {
			abilitiesMap[name] = range1;
		} else {
			abilitiesMap[name] = range2;
		}
	}
	champion.abilities = abilitiesMap;

    champions.push(champion);
//     console.log(champion);
  });
});


var columns = ["Name"];
["Health", "Health regen.", "Mana", "Mana regen.", "Attack damage", "Attack speed", "Armor", "Magic res", ].forEach(function(st) {
  columns.push(st);
  columns.push(st + " Per Level");
})
columns = columns.concat(["Mov. speed", "Range", "Energy", "Energy regen."]);
setTimeout(function() {
  lib.writeToTsvFile("champions.tsv", columns, champions);
}, 5000)