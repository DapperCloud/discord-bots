#!/usr/bin/env node
const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");
var Twitter = require('twitter-node-client').Twitter;

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


//Twitter client setup
var twitter = new Twitter(passJson.twitter);


//Bot functions
twitterChan = null;
function welcome(number) {
	twitterChan = client.channels.find(val => val.name === 'twitter' && val.type === 'text');
	if(!twitterChan) {
		client.destroy();
		console.log("ERREUR############# le chan \"twitter\" n'a pas pu être trouvé !");
		throw '';
	}
}

function logTwitterError(err) {
	console.log('ERROR');
	writeObj(err);
}

function linkTweet(data, channel) {
	if(!data || !data.user) {
		console.log("ERREUR############# les données du tweet sont invalides !");
		writeObj(data);
		return;
	} 
	channel.send("https://twitter.com/"+data.user.screen_name+"/status/"+data.id_str);
}

// Connection
client.login(passJson.pass);
client.on('ready', () => {
  console.log('Ready to work!');
  welcome();
});

// Watch messages
client.on('message', message => {

	// Not triggered by bots nor messages outside #twitter channel
	if(message.author.bot || message.channel != twitterChan) {
		return;
	}

	// Put command args in an array and verify syntax
	var args = message.content.split(" ");
	if(args.length == 0) return;
	if(args[0].slice(0,1) != "/") return;

	if (args[0] === "/last") {
		if(args.length <= 1 || args[1].length <= 1) return;
		twitter.getUserTimeline({ screen_name: args[1], count: '1'}, function(err, reponse, body) {
			logTwitterError(err);
		}, function(data) {
			linkTweet(JSON.parse(data)[0], twitterChan);
		});
	}
	
	if (args[0] === "/help") {
		message.reply("Cui cui, je suis là pour vous permettre d'accéder au caca de Twitter directement depuis Discord !\n"
		+"Mes commandes :\n"
		+"**********************************************\n"
		+"/last [nom_twitter] - affiche le dernier tweet de l'utilisateur\n");
	}
});

