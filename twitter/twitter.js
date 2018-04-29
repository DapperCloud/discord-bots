#!/usr/bin/env node
const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");
var Twitter = require('twitter-node-client').Twitter;

console.log("Parsing des credentials...");
var contents = fs.readFileSync("mdp.json");
var passJson = JSON.parse(contents);
console.log("OK !");

console.log("Parsing des comptes suivis...");
var contents = fs.readFileSync("followed.json");
var followedUsers = JSON.parse(contents);
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

function follow(screen_name, channel) {
	if(screen_name in followedUsers) {
		channel.send(screen_name+" est déjà suivi !");
		return;
	}
	// On va chercher le dernier tweet pour le stocker (et vérifier au passage que l'utilisateur existe)
	twitter.getUserTimeline({ screen_name: screen_name, count: '1'}, function(err, reponse, body) {
		logTwitterError(err);
		channel.send("Une erreur est survenue. Êtes-vous sûr que ce nom d'utilisateur existe..?");
	}, function(data) {
		var tweet = JSON.parse(data)[0];
		followedUsers[screen_name] = tweet.id_str;
		console.log(followedUsers);
		fs.writeFileSync("followed.json", JSON.stringify(followedUsers));
		channel.send("L'utilisateur "+screen_name+" est maintenant suivi !");
	});
}

function unfollow(screen_name, channel) {
	if(!(screen_name in followedUsers)) {
		channel.send(screen_name+" n'est pas suivi !");
		return;
	}
	delete followedUsers[screen_name];
	fs.writeFileSync("followed.json", JSON.stringify(followedUsers));
	channel.send(screen_name+" n'est maintenant plus suivi !");
}

function listFollowed(channel) {
	if(Object.keys(followedUsers).length == 0) {
		channel.send("Aucun utilisateur n'est suivi !");
		return;
	}
	var message = "Voici la liste des utilisateurs actuellement suivis :"
	for(user in followedUsers) {
		message += "\n\t- **"+user+"**";
	}
	channel.send(message);
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
	if(args[0].slice(0,2) != "t/") return;

	if (args[0] === "t/last") {
		if(args.length <= 1 || args[1].length <= 1) return;
		twitter.getUserTimeline({ screen_name: args[1], count: '1'}, function(err, reponse, body) {
			logTwitterError(err);
		}, function(data) {
			linkTweet(JSON.parse(data)[0], twitterChan);
		});
	}

	if (args[0] === "t/follow") {
		if(args.length <= 1 || args[1].length <= 1) return;
		follow(args[1], twitterChan);
	}

	if (args[0] === "t/unfollow") {
		if(args.length <= 1 || args[1].length <= 1) return;
		unfollow(args[1], twitterChan);
	}

	if (args[0] === "t/list") {
		listFollowed(twitterChan);
	}
	
	if (args[0] === "t/help") {
		message.reply("Cui cui, je suis là pour vous permettre d'accéder au caca de Twitter directement depuis Discord !\n"
		+"Mes commandes :\n"
		+"**********************************************\n"
		+"t/last [nom_twitter] - affiche le dernier tweet de l'utilisateur\n"
		+"t/follow [nom_twitter] - suivre un utilisateur\n"
		+"t/unfollow [nom_twitter] - ne plus suivre un utilisateur");
	}
});

