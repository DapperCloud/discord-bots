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
	console.log('ERROR: '+err);
}

function getLastTweet(data) {
	if(!checkData(data)) {
		return null;
	}
	if(data.statuses.length == 0) return null;

	//Find the last tweet that was not a reply
	for(var i=0; i<data.statuses.length; i++) {
		if(!data.statuses[i].in_reply_to_status_id_str) return data.statuses[i];
	}

	//If they're all replies, return the last one
	return data.statuses[0];
}

function getNewTweets(data, since_id) {
	if(!checkData(data)) {
		return null;
	}

	//Find the tweets that were not replies
	var tweets = [];
	for(var i=0; i<data.statuses.length; i++) {
		if(!data.statuses[i].in_reply_to_status_id_str) tweets.push(data.statuses[i]);
	}

	return tweets;
}

function checkData(data) {
	if(!data || !data.statuses) {
		console.log("ERREUR############# les données du tweet sont invalides !");
		console.log(data);
		return false;
	}

	return true;
}

function linkTweet(tweet, channel) {
	channel.send("https://twitter.com/"+tweet.user.screen_name+"/status/"+tweet.id_str);
}

function follow(screen_name, channel) {
	if(screen_name in followedUsers) {
		channel.send(screen_name+" est déjà suivi !");
		return;
	}
	// On va chercher le dernier tweet pour le stocker (et vérifier au passage que l'utilisateur existe)
	twitter.getSearch({ q: 'from:' + screen_name + ' -filter:retweets', count: '100'}, function(err, reponse, body) {
		logTwitterError(err);
		channel.send("Une erreur est survenue. Êtes-vous sûr que ce nom d'utilisateur existe..?");
	}, function(data) {
		var tweet = getLastTweet(JSON.parse(data));
		if(!tweet) {
			channel.send("Une erreur est survenue dans la lecture du dernier tweet. L'utilisateur n'a pas été suivi.");
			return;
		}
		var realScreenName = tweet.user.screen_name;
		followedUsers[realScreenName] = tweet.id_str;
		fs.writeFileSync("followed.json", JSON.stringify(followedUsers));
		channel.send("L'utilisateur "+realScreenName+" est maintenant suivi !");
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

function checkForNewTweets(channel) {
	console.log("Checking for new tweets...");
	for(user in followedUsers) {
		twitter.getSearch({ q: 'from:' + user + ' -filter:retweets', since_id: followedUsers[user]}, function(err, reponse, body) {
			logTwitterError(err);
		}, function(data) {
			var newTweets = getNewTweets(JSON.parse(data));
			if(!newTweets || newTweets.length == 0) return;

			for(var i in newTweets) {
				linkTweet(newTweets[i], twitterChan);
			}
			followedUsers[newTweets[0].user.screen_name] = newTweets[0].id_str;
			fs.writeFileSync("followed.json", JSON.stringify(followedUsers));
		});
	}
}

// Connection
client.login(passJson.pass);
client.on('ready', () => {
  console.log('Ready to work!');
  welcome();
  // Poll for new tweets
  setInterval(() => checkForNewTweets(twitterChan), 60000);
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
		twitter.getSearch({ q: 'from:' + args[1] + ' -filter:retweets', count: '100'}, function(err, reponse, body) {
			logTwitterError(err);
			twitterChan.send("Une erreur est survenue. Êtes-vous sûr que ce nom d'utilisateur existe..?");
		}, function(data) {
			var tweet = getLastTweet(JSON.parse(data));
			if(!tweet) {
				twitterChan.send("Une erreur est survenue. Êtes-vous sûr que ce nom d'utilisateur existe..?");
				return;
			} 
			linkTweet(tweet, twitterChan);
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
		+"t/follow [nom_twitter] - suivre un utilisateur (affichera ses tweets dans ce salon)\n"
		+"t/unfollow [nom_twitter] - ne plus suivre un utilisateur\n"
		+"t/list - liste les utilisateurs suivis");
	}
});

