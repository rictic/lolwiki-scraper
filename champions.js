var lib = require('./lib');
var fs = require('fs');
var champion_url_list = fs.readFileSync("champion_urls.txt", "utf8").split("\n");

var champions = [];
var abilities = [];
champion_url_list.slice(0).forEach(function(champion_url) {
  lib.wikiFetch(champion_url, function(body) {
    body = lib.htmlEntityExpansion(body);
    var statistics = body.match(/Statistics[^]*?Cost/)[0];
    var champion = {url: champion_url}
    champion.Name = body.match(/fbReturnToTitle="(.*?)"/)[1].replace(/_/g, " ").replace(/\\'/, "'");
    var optional_stats = ["Mana", "Mana regen\\.", "Energy", "Energy regen\\."]; //"Rage"?
    var stats = ["Health", "Health regen\\.", "Attack damage", "Attack speed", "Armor", "Magic res", "Mana", "Mana regen\\.", "Energy", "Energy regen\\."]
    stats.forEach(function(stat) {
      var statName = stat.replace("\\", "");
      var r = new RegExp(stat + "[^]*?((\\d+(\\.\\d+)?)|N/A)\\s*(\\(\\+?(\\d+(\\.\\d+)?%?)\\))?")
      var info = statistics.match(r)
      if (!info) {
        var na = statistics.match(new RegExp(stat + "[^]*?N/A"));
        if (na) {
          info = [null, "N/A", null, "N/A"];
        }
      }
      if (!info && optional_stats.indexOf(stat) !== -1) {
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


    var abilityTable = body.match(/class="abilities_table"[^]*?\<\/table\>/)[0];

    var passive = abilityTable.match(/<tr class="ability innate_ability"\>[^]*?\<\/tr\>/g)[0];
    var passiveName = passive.match(/title="(.*?)"/)[1];
    var passiveInfo = passive.match(/<td class="abilityinfo"[^]*?\<\/tr\>/)[0];

    abilities.push({
      Kind: "Champion Passive",
      Name: passiveName,
      "Champion": champion.Name,
      "Effect Text": clean(passiveInfo)
    });

    var abilitiesInfo = abilityTable.match(/\<tr class="ability (basic|ultimate)_ability"\>[^]*?\<\/tr\>/g);
    var abilityNames = abilityTable.match(/\<td id="(.*?)"/g);
    var abilityInfos = abilityTable.match(/\<td class="abilityinfo"[^]*?\<\/td\>/g);
    for (var i=0; i<abilitiesInfo.length; i++) {
      var ab = {
        "Champion": champion.Name
      }
      var ability = abilitiesInfo[i];
//       console.log("Ability: " + ability);
      
      //known bugs:
      //Lee sin has two abilities for each of his Q,W,E, we only capture the first
      //Heimer's ultimate, Upgrade!!! has two parts, a passive and an active, again we only get the active
      
      
      ab.Name = ability.match(/\<td id="(.*?)"/)[1].replace(/_/g, " ").replace(/\.27/g, "'").replace(/\.21/g, "!");
      var abilityInfo = ability.match(/\<td class="abilityinfo"[^]*?\<\/td\>/)[0];
      console.log(ab.Name);
      var cost1 = abilityInfo.match(/\<b\>Cost:\<\/b\>[^]*?\<\/li\>/);
      var cooldown1 = abilityInfo.match(/\<b\>Cooldown:\<\/b\>[^]*?\<\/li\>/);
//       console.log("Cooldown 1: " + cooldown1);
      var range1 = abilityInfo.match(/\<b\>Range:\<\/b\>[^]*?\<\/li\>/);
//       console.log("Range 1: " + range1);

      var abilityLevels = ability.match(/\<td class="abilitylevel"[^]*?\<\/td\>/)[0];
//       console.log("Ability levels: " + abilityLevels);
      var cost2 = abilityLevels.match(/\<b\>Cost:\<\/b\>[^]*?\<\/p\>/);
//       console.log("Ability cost: " + cost2);
      var cooldown2 = abilityLevels.match(/\<b\>Cooldown:\<\/b\>[^]*?\<\/p\>/);
//       console.log("Ability cooldown: " + cooldown2);
      var range2 = abilityLevels.match(/\<b\>Range:\<\/b\>[^]*?\<\/p\>/);
//       console.log("Ability range: " + range2);
      
      var fullInfo = abilityInfo + "\n" + abilityLevels;
      
      var cost = clean(cost1 || cost2);
      var cooldown = clean(cooldown1 || cooldown2);
      var range = clean(range1 || range2);
      console.log("Info: " + fullInfo);
      console.log("\n");
      console.log("cost: " + cost);
      console.log("range: " + range);
      console.log("cooldown: " + cooldown);

      ab["Effect Text"] = clean(fullInfo);
      abilities.push(ab);
      console.log("\n\n\n\n\n");
//       console.log(ab);
    }

    champions.push(champion);
//     console.log(champion);
  });
});


function clean(s) {
  if (!s) {
    return s;
  }
  if (Array.isArray(s)) {
    s = s[0];
  }
  return s.replace(/<.*?>/g, "").replace(/\n+/, "\n").trim();
}

var columns = ["Name"];
["Health", "Health regen.", "Mana", "Mana regen.", "Attack damage", "Attack speed", "Armor", "Magic res", ].forEach(function(st) {
  columns.push(st);
  columns.push(st + " Per Level");
})
columns = columns.concat(["Mov. speed", "Range", "Energy", "Energy regen."]);
columns = columns.concat(["passive", "ability 0", "ability 1", "ability 2", "ability 3"]);
setTimeout(function() {
  lib.writeToTsvFile("champions.tsv", columns, champions);
  lib.writeToTsvFile("abilities.tsv", ["Name", "Champion", "Kind", "Effect Text"], abilities);
}, 5000)
