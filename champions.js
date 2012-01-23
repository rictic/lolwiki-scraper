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