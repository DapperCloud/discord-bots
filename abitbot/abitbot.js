#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");

console.log("Parsing des credentials...");
var contents = fs.readFileSync("mdp.json");
var passJson = JSON.parse(contents);
console.log("OK !");

console.log("Parsing des credentials...");
var contents = fs.readFileSync("mdp.json");
var passJson = JSON.parse(contents);
console.log("OK !");

function writeObj(obj, message) {
  if (!message) { message = obj; }
  var details = "*****************" + "\n" + message + "\n";
  var fieldContents;
  for (var field in obj) {
    fieldContents = obj[field];
    if (typeof(fieldContents) == "function") {
      fieldContents = "(function)";
    }
    details += "  " + field + ": " + fieldContents + "\n";
  }
  console.log(details);
}

require('jsdom/lib/old-api').env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }

    var $ = require("jquery")(window);

    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

	$.support.cors = true;
	$.ajaxSettings.xhr = function() {
		return new XMLHttpRequest();
	};
	
	quotes = [];
	$.ajax({ url: 'https://fr.wikiquote.org/wiki/La_Classe_américaine'
		, success: function(data) { 
			console.log("Chargement ajax depuis wikiquote OK !");
			$(data).find('.citation').each(function(i) {
				quotes.push(this.textContent);
			});
			console.log(quotes.length + " quotes chargées avec succès !");
		}, error: function(xhr, statusText, thrownError) {
			writeObj(xhr);
			console.log(statusText);
			writeObj(thrownError);
		}});
});
	
client.on('ready', () => {
	console.log('Ready to work!');
	abitbol = client.emojis.find("name", "abitbol");
});

client.on('message', message => {
	
	if(message.author.bot) {
		return;
	}
	if(message.content.toLowerCase().includes("la classe")) {
		message.react(abitbol);
		indice = Math.floor(Math.random()*quotes.length);
		message.channel.send(quotes[indice]);
		console.log("quoted !");
	}
});

client.login(passJson.pass);
