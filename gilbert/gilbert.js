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

function increaseScore(userId, genre, points) {
	if(!(genre in scores)) scores[genre] = {};
	if(!(userId in scores[genre])) scores[genre][userId] = 0;

	scores[genre][userId] += points;
	fs.writeFileSync("scores.json", JSON.stringify(scores));
}

function getOrderedScores(scoresObj) {
	var tuples = [];

	for (var key in scoresObj) tuples.push([key, scoresObj[key]]);

	tuples.sort(function(a, b) {
	    a = a[1];
	    b = b[1];

	    return a < b ? -1 : (a > b ? 1 : 0);
	});

	return tuples;
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
	if(total == 0) return null;
	var rand = Math.floor(Math.random()*Math.min(config.tracksTotal, total));
	data = await spotifyApi.searchTracks('genre:'+genre, {limit: 50, offset: rand});
	var tracks = data.body.tracks.items;
	for(var i in tracks) {
		if(tracks[i].preview_url) return tracks[i];
	}
	return tracks[0];
}

async function nextPopular(genre) {
	var retry = true;
	var track = null;
	while(retry) {
		track = await pickRandomPopularTrack(genre);
		retry = track && !track.preview_url;
	}

	if(track) {
		if(currentTrack) {
			chan.send('La réponse était '+currentTrack.artists[0].name+' — '+currentTrack.name);
		}
		currentTrack = track;
		currentGenre = genre;
		playCurrentTrack();
	} else {
		chan.send('Aucun morceau sélectionné. Êtes-vous sûr que le genre "'+genre+'" existe sur Spotify ?');
	}
}

function testAnswer(answer, track) {
	if(quiz.isCorrectAnswer(answer, track.name, 6)) return { answer: track.name, points: 2 };
	for(var i in track.artists) {
		if(quiz.isCorrectAnswer(answer, track.artists[i].name, 6)) return { answer: track.artists[i].name, points: 1 };
	}
	return null;
}

function playCurrentTrack() {
	if(!currentTrack || !currentTrack.preview_url) { chan.send('Aucun morceau n\'a été sélectionné !'); return; }
	if(!voiceConnection) { chan.send('Je ne peux pas jouer le morceau car je ne suis présent dans aucun salon vocal !'); return; }
	if(currentDispatcher) { chan.send('Une lecture est déjà en cours'); return; }
	currentDispatcher = voiceConnection.playArbitraryInput(currentTrack.preview_url, {bitrate: config.bitrate});
	currentDispatcher.on('start', function() {
		setTimeout(() => { if(currentDispatcher) currentDispatcher.end(); currentDispatcher = null; }, config.previewDuration*1000);	
	});
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
var currentGenre;
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

			  voiceConnection.on('error', function(error) {
			  	console.log('######### Voice connection error !');
			  	console.loqg(error);
			  });

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
			var genre = args.length > 1 ? args.slice(1).join(" ") : "rock";
			nextPopular(genre);
		} catch(err) {
			if(err.statusCode == 401) {
				refreshSpotifyToken();
			};
			console.log('Something went wrong!', err);
		}
	} else if (args[0] === 'g/replay') {
		playCurrentTrack();	
	} else if(args[0] === "g/scores") {
		if(args.length > 1) {
			var genre = args.slice(1).join(" ") ;
			if(!(genre in scores)) {
				chan.send("Je ne vois pas de scores dans la catégorie "+genre+" !");
				return;
			}
			var scoresToPrint = getOrderedScores(scores[genre]);
			var str = 'Classement '+genre+' :\n-----------------------';
		} else {
			var scoresToPrint = {};
			for(genre in scores) {
				for(userId in scores[genre]) {
					if(!(userId in scoresToPrint)) scoresToPrint[userId] = 0;
					scoresToPrint[userId] += scores[genre][userId];
				}
			}
			scoresToPrint = getOrderedScores(scoresToPrint);
			var str = 'Classement général :\n-----------------------';
		}
		for(i in scoresToPrint) {
			str += '\n' + chan.guild.members.get(scoresToPrint[i][0]).user.username + " - " + scoresToPrint[i][1];
		}
		chan.send(str);
	} else if(args[0] === "g/help"){
		chan.send('Sous le soleeeeeeil des tropiiiiiques ! Bienvenue dans notre jeu musical !\n'
		+'\nVoici mes commandes :\n-----------------------\n'
		+'g/next [genre] - Sélctionne une musique au hasard et la joue. Vous pouvez préciser un genre spotify ("rock" par défaut)\n'
		+'g/replay - Rejoue la musique sélectionnée\n'
		+'g/scores [genre] - Affiche les scores. Vous pouvez préciser un genre pour afficher les scores de celui-ci'
		+'\n\nEt n\'utilisez pas Shazam, hein ! Je vous vois !');
	} else {
		if(!currentTrack) return;
		var eval = testAnswer(message.content, currentTrack);
		if(eval) {
			if(gilbert) message.react(gilbert);
			if(eval.points == 1) message.reply('Bien joué, l\'artiste était bien '+eval.answer+' ! Un point !');
			else if(eval.points == 2) message.reply('Bien joué, le titre était bien '+eval.answer+' ! Deux points, deux !');
			increaseScore(message.author.id, currentGenre, eval.points);
			if(currentDispatcher) {
				currentDispatcher.end();
				currentDispatcher = null;
			}
			currentTrack = null;
			currentGenre = null;
		}
	}
	
});

client.login(passJson.pass);
