#!/usr/bin/env node

var natural = require('natural');
var parser = require('./coco-parser.js')
var markov = require('../libs/markov/markov.js');
var NGrams = natural.NGrams;

const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");

console.log("Parsing des credentials...");
var contents = fs.readFileSync("mdp.json");
var passJson = JSON.parse(contents);
console.log("OK !");

console.log("Parsing de markov.json...");
var contents = fs.readFileSync("markov.json");
var markovJson = JSON.parse(contents);
userMarkovs = {};
for(userId in markovJson) {
	userMarkovs[userId] = new markov.MarkovChain(markovJson[userId].nodes);
}
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

var EMPTY = Object.freeze(["", ""]);

function generateForUser(id) {
	if(!(id in userMarkovs)) {
		return null;
	}
	var chain = userMarkovs[id];
	var prefix = EMPTY;
	var text = "";
	var count = 0;
	while(count++ < 150) {
		var previous = suffix;
		var suffix = chain.next(prefix);
		//console.log(suffix);
		if(!suffix || suffix == "") {
			if (count > 10) break; //If we have at least 10 tokens, we stop here
			//New sentence
			if(!previous.match(/\.+|[?!]+/)) text += ".";
			previous = ".";
			prefix = EMPTY;
			continue;
		}
		text += (count>1 && !suffix.match(/\,|\.+|\'/) && previous != "'" ? " " : "") + suffix;
		prefix = [prefix[1], suffix];
	}

	return text;
}

function saveMarkov() {
	console.log("Sauvegarde de markov.json...")
	fs.writeFileSync("markov.json", JSON.stringify(userMarkovs));
	console.log("OK !");
}

client.on('ready', () => {
	console.log('Ready to work!');
	// Save markov chains every hour
  	setInterval(() => saveMarkov(twitterChan), 3600000);
});

client.on('message', message => {

	if(message.author.bot) {
		return;
	}

	//Commandes
	if(message.content.slice(0,2) === "c/") {

		// Put command args in an array
		var args = message.content.split(" ");

		if(args[0] === "c/me") {
			var text = generateForUser(message.author.id);
			if(text) {
				message.channel.send(text);
			} else {
				message.reply("T'as jamais parlé, je ne peux pas t'imiter !");
			}
		} else if (args[0] == "c/like") {
			if(args.length <= 1 || args[1].length <= 1) return;
			var userName = args.slice(1).join(" ");
			var user = client.users.find(u => u.username == userName);
			if(!user) {
				message.reply("Je ne trouve pas l'utilisateur "+userName+" !");
				return;
			}

			var text = generateForUser(user.id);
			if(text) {
				message.channel.send(text);
			} else {
				message.reply("Cet utilisateur ne s'est jamais exprimé, je ne peux pas l'imiter !");
			}

		} else if(args[0] == "c/help") {
			message.reply("COCO EST CONTEEEEENT !\n"
			+"Mes commandes :\n"
				+"**********************************************\n"
				+"c/me  - Je parle comme toi\n"
				+"c/like [utilisateur] - Je parle comme l'utilisateur en paramètre (nom d'utilisateur Discord)\n");
		}	

		return;
	}

	//On ignore les commandes pour l'apprentissage
	if(message.content.split(" ")[0].includes("/")) return;
	
	//On parse le message
	var userId = message.author.id;
	if(!(userId in userMarkovs)) {
		userMarkovs[userId] = new markov.MarkovChain();
	}
	var chain = userMarkovs[userId];
	parser.parseMessage(message, chain);
	
});

client.login(passJson.pass);