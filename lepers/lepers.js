#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();
var opentdb = require('./opentdb.js');
var fs = require("fs");

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

function normalizeAnswer(str) {
	str = str.trim().toLowerCase().replace(/\*/g, '');
	if(str.includes(' ')) {
		var firstWord = str.split(' ')[0];
		if(['le','la','les','un','une','des','en','à','dans','par','pour','vers','au'].includes(firstWord)) {
			str = str.slice(firstWord.length+1);
		}
	}
	if(str.slice(0,2) === 'l\'') {
		str = str.slice(2);
	}
	return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

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

// Compute the edit distance between the two given strings
function getEditDistance(a, b){
  if(a.length == 0) return b.length; 
  if(b.length == 0) return a.length; 

  var matrix = [];

  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

function increaseScore(userId) {
	if(userId in scores) {
		scores[userId]++;
	} else {
		scores[userId] = 1;
	}
	fs.writeFileSync("scores.json", JSON.stringify(scores));
}

client.on('ready', function() {
	console.log('ready to work !');
	welcome();
});

client.on('message', message => {
	
	if(message.author.bot || !message.channel == chan) {
		return;
	}
	
	if(message.content === "l/next") {
		if (!SILENT) chan.send('*dung* Aaaaaah la la, quel dommage ! C\'était "'+curQuestion.correct_answer+'", bien é-vi-dem-ment ! Question suivante.\n\n');
		pickQuestion(function(question) {
			curQuestion = question;
			if(!SILENT) chan.send(formatQuestion(curQuestion));
			//console.log(formatQuestion(curQuestion));
		});
	} else if(message.content === "l/question") {
		if(!SILENT) chan.send(formatQuestion(curQuestion));
	} else if(message.content === "l/indice") {
		var indice = curQuestion.correct_answer.replace(/( |')?([a-zA-Z0-9àÀùÙéÉèÈâÂêÊîÎôÔûÛäÄëËïÏöÖüÜ])/g, function($0, $1, $2) { return $1 ? $1+$2+' ' : '_ ' });
		indice = indice.trim().replace(/\*/g, '');
		indice = curQuestion.correct_answer[0] + indice.slice(1);
		if(!SILENT) chan.send('Un indice pour vous, chez vous : `'+indice+'`');
	} else if(message.content === "l/scores") {
		var str = 'Attention, mesdames et messieurs, ci-dessous le score de nos candidats :\n-----------------------';
		
		for(userId in scores) {
			if(!userId) continue;
			str += '\n' + chan.guild.members.get(userId).user.username + " - " + scores[userId];
		}
		
		str += '\n\nCeux qui n\'apparaissent pas n\'ont aucun point ! (tronul)'
		if(!SILENT) chan.send(str);
	} else if(message.content === "l/help"){
		chan.send('…top ! Je suis un animateur célèbre qui lit des questions à toute vitesse, et vous lisez ce texte avec ma voix ; j\'ai été transformé en bot pour démontrer votre absence de culture, je suis, je suis..?\n'
		+'\nVoici mes commandes :\n-----------------------\n'
		+'l/question - Répète la question en cours\n'
		+'l/indice - Un indice pour vous, chez vous\n'
		+'l/next - Passe à la question suivante\n'
		+'l/scores - Affiche les scores'
		+'\n\nAh qu\'il est beau, qu\'il est beau ce jeu ! Alors on ne triche pas en allant chercher les réponses sur internet. Merci.');
	} else {
		var proposition = normalizeAnswer(message.content);
		if(proposition.includes(curNormalizedAnswer) || getEditDistance(curNormalizedAnswer, proposition) <= curNormalizedAnswer.length / 6) {
			if(lepers) message.react(lepers);
			if(!SILENT) message.reply('Eh oui, bravo, c\'était bien "'+curQuestion.correct_answer+'" ! Question suivante.');
			increaseScore(message.author.id);
			pickQuestion(function(question) {
				curQuestion = question;
				if(!SILENT) chan.send(formatQuestion(curQuestion));
				//console.log(formatQuestion(curQuestion));
			});
		}
	}
	
});

client.login(passJson.pass);
