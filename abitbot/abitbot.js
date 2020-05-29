#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");

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

console.log("Parsing des credentials...");
var contents = fs.readFileSync("mdp.json");
var passJson = JSON.parse(contents);
console.log("OK !");

console.log("Parsing des quotes.json");
var contents = fs.readFileSync("quotes.json");
var quotes = JSON.parse(contents);
console.log("OK !");

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
