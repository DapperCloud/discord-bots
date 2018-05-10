#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");
var quiz = require("../libs/quiz/quiz.js");

var SpotifyWebApi = require('spotify-web-api-node');

gilbert = null;

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

console.log("Parsing de config.json…");
contents = fs.readFileSync("config.json");
var config = JSON.parse(contents);
config.tracksTotal = Math.min(config.tracksTotal, 9950);
console.log("OK !");

console.log("Parsing de scores.json…");
contents = fs.readFileSync("scores.json");
var scores = JSON.parse(contents);
console.log("OK !");

var spotifyApi = new SpotifyWebApi({
  clientId: passJson.spotify.clientId,
  clientSecret: passJson.spotify.clientSecret,
  redirectUri: passJson.spotify.redirectUri
});

spotifyApi.setRefreshToken(passJson.spotify.refreshToken);


var chan = null; 

function welcome(number) {
	gilbert = client.emojis.find("name", "gilbert");
	chan = client.channels.find(val => val.name === 'gilbert' && val.type === 'text');
	if(!chan) {
		client.destroy();
		console.log("ERREUR############# le chan \"gilbert\" n'a pas pu être trouvé !");
		throw '';
	}
}

function increaseScore(userId, points) {
	if(userId in scores) {
		scores[userId] += points;
	} else {
		scores[userId] = points;
	}
	fs.writeFileSync("scores.json", JSON.stringify(scores));
}

function refreshSpotifyToken() {
	spotifyApi.refreshAccessToken().then(
		function(data) {
			console.log('The access token has been refreshed!');
			console.log('The token expires in ' + data.body['expires_in']);
			console.log('The access token is ' + data.body['access_token']);

			// Set the access token on the API object to use it in later calls
			spotifyApi.setAccessToken(data.body['access_token']);
		},
		function(err) {
			console.log('Could not refresh access token', err);
		}
	);
}

async function pickRandomPopularTrack(genre) {
	var data = await spotifyApi.searchTracks('genre:'+genre, {limit: 1});
	var total = data.body.tracks.total;
	var rand = Math.floor(Math.random()*Math.min(config.tracksTotal, total));
	var data = await spotifyApi.searchTracks('genre:'+genre, {limit: 50, offset: rand});
	var tracks = data.body.tracks.items;
	for(var i in tracks) {
		if(tracks[i].preview_url) return tracks[i];
	}
	return null;
}

async function nextPopular() {
	currentTrack = await pickRandomPopularTrack('rock');
	playCurrentTrack();
}

function testAnswer(answer, track) {
	if(quiz.isCorrectAnswer(answer, track.name, 6)) return { answer: track.name, points: 2 };
	for(var i in track.artists) {
		if(quiz.isCorrectAnswer(answer, track.artists[i].name, 6)) return { answer: track.artists[i].name, points: 1 };
	}
	return null;
}

function playCurrentTrack() {
	if(!currentTrack) { chan.send('Aucun morceau n\'a été sélectionné !'); return; }
	if(!voiceConnection) { chan.send('Je ne peux pas jouer le morceau car je ne suis présent dans aucun salon vocal !'); return; }
	if(currentDispatcher) { chan.send('Une lecture est déjà en cours'); return; }
	currentDispatcher = voiceConnection.playArbitraryInput(currentTrack.preview_url, {bitrate: 96000});
	setTimeout(() => { if(currentDispatcher) currentDispatcher.end(); currentDispatcher = null; }, config.previewDuration*1000);	
}

client.on('ready', function() {
	console.log('ready to work !');
	welcome();
	refreshSpotifyToken();
	setInterval(() => refreshSpotifyToken, 1800*1000); //Refresh every 30 minutes
	chan.send("Hein, j'suis où ? C'est quoi cette musique que j'entends ? Euh, b-… bonjour ?");
});

client.on('error', function() {
	console.log('cleaning after error !');
	if(currentDispatcher) currentDispatcher.end();
	if(voiceChannel) voiceChannel.leave();
	voiceConnection = null;
	voiceChannel = null;
	currentTrack = null;
	currentDispatcher = null;
});

var voiceConnection;
var voiceChannel;
var currentTrack;
var currentDispatcher;

client.on('message', message => {
	
	if(message.author.bot || !message.channel == chan) {
		return;
	}

	// Put command args in an array and verify syntax
	var args = message.content.split(" ");
	if(args.length == 0) return;

	if (args[0] === 'g/join') {
		// Only try to join the sender's voice channel if they are in one themselves
		if (message.member.voiceChannel) {
		  message.member.voiceChannel.join()
			.then(connection => { // Connection is an instance of VoiceConnection
			  voiceConnection = connection;
			  voiceChannel = message.member.voiceChannel;
			  message.reply('Connecté !');
			})
			.catch(console.log);
		} else {
		  message.reply("Vous n'êtes connectés à aucun serveur vocal !");
		}
	}
	else if (args[0] === 'g/leave') {
		if (voiceChannel) {
			voiceChannel.leave();
			voiceConnection = null;
			voiceChannel = null;
			message.reply('Déconnecté !');
		} else {
			message.reply('Je ne suis actuellement sur aucun serveur vocal.');
		}
	}	
	else if (args[0] === 'g/next') {
		try {
			if(currentDispatcher) {
				chan.send('Attendez que la leture soit terminée avant de nexter, bande de sauvages');
				return;
			}
			nextPopular();
		} catch(err) {
			if(err.statusCode == 401) {
				refreshSpotifyToken();
			};
			console.log('Something went wrong!', err);
		}
	} else if (args[0] === 'g/replay') {
		playCurrentTrack();	
	} else if(args[0] === "g/scores") {
		var str = 'Attention, mesdames et messieurs, ci-dessous le score de nos candidats :\n-----------------------';
		
		for(userId in scores) {
			if(!userId) continue;
			str += '\n' + chan.guild.members.get(userId).user.username + " - " + scores[userId];
		}
		
		str += '\n\nCeux qui n\'apparaissent pas n\'ont aucun point ! (tronul)'
		chan.send(str);
	} else if(args[0] === "g/help"){
		chan.send('Sous le soleeeeeeil des tropiiiiiques ! Bienvenue dans notre jeu musical !\n'
		+'\nVoici mes commandes :\n-----------------------\n'
		+'g/next - Sélctionne une musique au hasard et la joue\n'
		+'g/replay - Rejoue la musique sélectionnée\n'
		+'g/scores - Affiche les scores'
		+'\n\nEt n\'utilisez pas Shazam, hein ! Je vous vois !');
	} else {
		if(!currentTrack) return;
		var eval = testAnswer(message.content, currentTrack);
		if(eval) {
			if(gilbert) message.react(gilbert);
			if(eval.points == 1) message.reply('Bien joué, l\'artiste était bien '+eval.answer+' ! Un point !');
			else if(eval.points == 2) message.reply('Bien joué, le titre était bien '+eval.answer+' ! Deux points, deux !');
			increaseScore(message.author.id, eval.points);
			if(currentDispatcher) {
				currentDispatcher.end();
				currentDispatcher = null;
			}
			currentTrack = null;
		}
	}
	
});

client.login(passJson.pass);
