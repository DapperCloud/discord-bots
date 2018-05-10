#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();
var opentdb = require('./opentdb.js');
var fs = require("fs");

var quiz = require("../libs/quiz/quiz.js");

SILENT = false;
mode = 'libre';
lepers = null;

curQuestion = null;

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

console.log("Parsing de questions.json...");
var contents = fs.readFileSync("questions.json");
var questions = JSON.parse(contents);
console.log("OK !");

console.log("Parsing de scores.json…");
contents = fs.readFileSync("scores.json");
var scores = JSON.parse(contents);
console.log("OK !");

var apiQuestionsNumber = 0;
var initCount = 0;

var chan = null; 

function welcome(number) {
	if(number) apiQuestionsNumber = number;
	if(++initCount == 2) {
		lepers = client.emojis.find("name", "lepers");
		chan = client.channels.find(val => val.name === 'lepers' && val.type === 'text');
		if(!chan) {
			client.destroy();
			console.log("ERREUR############# le chan \"lepers\" n'a pas pu être trouvé !");
			throw '';
		}
		pickQuestion(function(question) {
			curQuestion = question;
			if(!SILENT) {
			  chan.send('Bonjour et bienvenue dans cette nouvelle édition de Question Pour Un Cham-pion ! Nous avons 1840 questions dans la langue de Molière, et '+ apiQuestionsNumber +' dans celle de Shakespeare.');
			  chan.send('Sans plus attendre, place au jeu !\n'+formatQuestion(curQuestion));
			}
		});
	}
}

opentdb.init(welcome);

function pickQuestion(callback) {
	var rand = Math.random();
	if(rand < (1840 / (1840 + apiQuestionsNumber))) {
		var catIndex = Math.floor(Math.random()*questions.categories.length)
		var curCat = questions.categories[catIndex]
		var questIndex = Math.floor(Math.random()*curCat.questions.length)
		var curQuest = curCat.questions[questIndex]
		curQuest.category = curCat.category;
		curNormalizedAnswer = normalizeAnswer(curQuest.correct_answer);
		console.log('local !');
		callback(curQuest);
	} else {
		console.log('api !');
		opentdb.nextQuestion(function(question) {
			curNormalizedAnswer = normalizeAnswer(question.correct_answer);
			callback(question);
		});
	}
}

function formatQuestion(question) {
	return question.category + '\n-----------------\n' + question.question;
}

function increaseScore(userId) {
	if(userId in scores) {
		scores[userId]++;
	} else {
		scores[userId] = 1;
	}
	fs.writeFileSync("scores.json", JSON.stringify(scores));
}

function getOrderedScores(scoresObj) {
	var tuples = [];

	for (var key in scoresObj) tuples.push([key, scoresObj[key]]);

	tuples.sort(function(a, b) {
	    a = a[1];
	    b = b[1];

	    return a > b ? -1 : (a < b ? 1 : 0);
	});

	return tuples;
}

client.on('ready', function() {
	console.log('ready to work !');
	welcome();
});

var voiceConnection;
var voiceChannel;
var currentTrack;

client.on('message', message => {
	
	if(message.author.bot || !message.channel == chan) {
		return;
	}
	if(message.content === "l/question") {
		chan.send(formatQuestion(curQuestion));
	} else if(message.content === "l/next") {
		chan.send('*dung* Aaaaaah la la, quel dommage ! C\'était "'+curQuestion.correct_answer+'", bien é-vi-dem-ment ! Question suivante.\n\n');
		pickQuestion(function(question) {
			curQuestion = question;
			chan.send(formatQuestion(curQuestion));
			//console.log(formatQuestion(curQuestion));
		});
	} else if(message.content === "l/indice") {
		var indice = curQuestion.correct_answer.replace(/( |')?([a-zA-Z0-9àÀùÙéÉèÈâÂêÊîÎôÔûÛäÄëËïÏöÖüÜ])/g, function($0, $1, $2) { return $1 ? $1+$2+' ' : '_ ' });
		indice = indice.trim().replace(/\*/g, '');
		indice = curQuestion.correct_answer[0] + indice.slice(1);
		chan.send('Un indice pour vous, chez vous : `'+indice+'`');
	} else if(message.content === "l/scores") {
		var str = 'Attention, mesdames et messieurs, ci-dessous le score de nos candidats :\n-----------------------';
		
		var orderedScores = getOrderedScores(scores);

		for(i in orderedScores) {
			str += '\n' + chan.guild.members.get(orderedScores[i][0]).user.username + " - " + orderedScores[i][1];
		}
		
		str += '\n\nCeux qui n\'apparaissent pas n\'ont aucun point ! (tronul)'
		chan.send(str);
	} else if(message.content === "l/help"){
		chan.send('…top ! Je suis un animateur célèbre qui lit des questions à toute vitesse, et vous lisez ce texte avec ma voix ; j\'ai été transformé en bot pour démontrer votre absence de culture, je suis, je suis..?\n'
		+'\nVoici mes commandes :\n-----------------------\n'
		+'l/question - Répète la question en cours\n'
		+'l/indice - Un indice pour vous, chez vous\n'
		+'l/next - Passe à la question suivante\n'
		+'l/scores - Affiche les scores'
		+'\n\nAh qu\'il est beau, qu\'il est beau ce jeu ! Alors on ne triche pas en allant chercher les réponses sur internet. Merci.');
	} else {
		if(quiz.isCorrectAnswer(message.content, curQuestion.correct_answer, 6)) {
			if(lepers) message.react(lepers);
			message.reply('Eh oui, bravo, c\'était bien "'+curQuestion.correct_answer+'" ! Question suivante.');
			increaseScore(message.author.id);
			pickQuestion(function(question) {
				curQuestion = question;
				chan.send(formatQuestion(curQuestion));
				//console.log(formatQuestion(curQuestion));
			});
		}
	}
	
});

client.login(passJson.pass);
