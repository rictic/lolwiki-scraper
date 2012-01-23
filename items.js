var lib = require('./lib');
var fs = require('fs');
var item_url_list = fs.readFileSync("item_url_list.txt", "utf8").split("\n");

var items = [];
item_url_list.forEach(function(item_url) {
  lib.wikiFetch(item_url, function(body) {
    var item = {};
    var infobox = body.match(/infobox.*?>([^]*?)<\/table>/m)[1];
    infobox = lib.htmlEntityExpansion(infobox);
    infobox = infobox.replace(/<td.*?>/g, "<td>");
    infobox = infobox.replace(/<a.*?>/g, "");
    infobox = infobox.replace(/<\/a.*?>/g, "");
    infobox = infobox.replace(/<\s*br\s*\/?>/g, "\n");
    item.name = infobox.match(/<b>(.*?)<\/b>/)[1]
    var effects = infobox.match(/(Effects|Passive|Aura)([^]*?)Menu<\/th>/)[2];
    effects = effects.replace(/<\/?(th|tr|p|img|span).*?>/g, "");
    effects = effects.replace(/<\/td>/g, "\n");
    effects = effects.replace(/<td>/g, "");
    effects = effects.replace(/<sup[^]*?<\/sup>/g, "");
    effects = effects.replace(/\n\s*/g, "\n");
    effects = effects.replace(/ \)/g, ")");
    effects = effects.trim();
    item.effects = effects;
    var cost_matches = infobox.match(/Item cost[^]*?"gold">(\d+)g( \((\d+)g\))?/);
    if (!cost_matches) {
      item.cost = "0";
    } else {
      item.cost = cost_matches[1];
      if (cost_matches[3]) {
        item.combine_cost = cost_matches[3];
      }
    }
    items.push(item);
  });
});

setTimeout(function() {
  lib.writeToTsvFile("items.tsv", ["name", "effects", "cost", "combine_cost"], items);
}, 2000);
