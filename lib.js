var http = require('http');
var fs = require("fs");

function exists(path, onTrue, onFalse) {
  fs.stat(path, function(err, data) {
    if (err) {
      onFalse();
    }
    else {
      onTrue();
    } 
  });
}

function wikiFetch(path, onComplete) {
  var cache_name = "cache/" + path.replace(/\//g, "_");
  exists(cache_name, function() {
    fs.readFile(cache_name, 'utf-8', function(_, data) {onComplete(data)});
  }, function() {
    base_fetch(path, function(data) {
      fs.writeFile(cache_name, data);
      onComplete(data);
    })
  });
}

function base_fetch(path, onComplete) {
  var options = {
    host: 'leagueoflegends.wikia.com',
    port: 80,
    path: path
  }
  var buffer = [];
  http.get(options, function(response) {
    response.on('data', function(d) {
      buffer.push(d);
    });
    response.on('end', function() {
      onComplete(buffer.join(""));
    });
  });
}

function writeToTsvFile(path, fields, items) {
  var rows = [];
  rows.push(fields.map(encodeCell).join("\t"));
  items.forEach(function(item) {
    var row = [];
    fields.forEach(function(field) {
      row.push(encodeCell(item[field] || ""));
    });
    rows.push(row.join("\t"));
  });
  fs.writeFileSync(path, rows.join("\n"));
}

function encodeCell(str) {
  return '"' + str.replace(/"/g, '""')+'"';
}

function htmlEntityExpansion(str) {
  return str.replace(/&#39;/g, "'").replace(/&gt;/g, ">").replace(/&minus;/g, "-").replace(/&nbsp;/g, " ").replace(/&ndash;/g, "–").replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&#32;/g, " ");
}

exports.htmlEntityExpansion = htmlEntityExpansion;
exports.wikiFetch = wikiFetch;
exports.writeToTsvFile = writeToTsvFile;