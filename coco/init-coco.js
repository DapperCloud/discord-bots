//Se connecte au serveur et va lire tous les messages dans tous les channels.
//Crée les chaînes de Markov correspondantes et les sérialise.

//var async = require('async');

var natural = require('natural');
var markov = require('../libs/markov/markov.js');
var parser = require('./coco-parser.js');

const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");

console.log("Parsing des credentials...");
var contents = fs.readFileSync("mdp.json");
var passJson = JSON.parse(contents);
console.log("OK !");

userMarkovs = {};

async function parseChannels(channels) {
	try {
		for(i in channels) {
			var chan = channels[i];
			console.log('####### Parsing #'+chan.name+' messages...');
			var messagesLeft = true;
			var oldestMessageId = null;
			while(messagesLeft) {
				var messages = await chan.fetchMessages({limit: 100, before: oldestMessageId});
				console.log(messages.size + ' messages to parse !');
				var humanMessages = messages.filterArray(function(msg) { return !msg.author.bot && msg.content.length >= 2; });
				humanMessages.forEach(function(item, index, array) {
					prepareAndParseMessage(item);
				});
				oldestMessageId = messages.lastKey();
				messagesLeft = messages.size == 100;
			}
			console.log('####### channel parsed !');
		}

		console.log('####### ALL CHANNELS PARSED ! #######');

		console.log('Serializing data into markov.json...');
		fs.writeFileSync("markov.json", JSON.stringify(userMarkovs));
		console.log('OK !');

		console.log('Shutting down gracefully...');
		client.destroy();
		
	} catch (err) {
		console.error("##########ERROR " + err);
		client.destroy();
	}
}

function prepareAndParseMessage(message) {
	if(message.content.split(" ")[0].includes("/")) return; //don't parse commands

	//Select user's chain
	var userId = message.author.id;
	if(!(userId in userMarkovs)) {
		userMarkovs[userId] = new markov.MarkovChain();
	}
	var chain = userMarkovs[userId];

	//Parse the message
	parser.parseMessage(message, chain);
}

client.on('ready', () => {
	console.log('Ready to work!');
	var channels = client.channels.findAll("type", "text");
	parseChannels(channels);
});

client.login(passJson.pass);