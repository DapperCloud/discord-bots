var natural = require('natural');
var markov = require('../libs/markov/markov.js');
var NGrams = natural.NGrams;

const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require("fs");

console.log("Parsing des credentials...");
var contents = fs.readFileSync("mdp.json");
var passJson = JSON.parse(contents);
console.log("OK !");

client.on('ready', () => {
  console.log('Ready to work!');
});

var EMPTY = Object.freeze(["", "", ""]);

userMarkovs = [];

sentenceTokenizer = new natural.SentenceTokenizer();
wordTokenizer = new natural.AggressiveTokenizerFr();

client.on('message', message => {
	
	if(message.author.bot) {
		return;
	}

	//Sélectionne la chaine de l'utilisateur
	var userId = message.author.id;
	if(!(userId in userMarkovs)) {
		userMarkovs[userId] = new markov.MarkovChain();
	}
	var chain = userMarkovs[userId];

	if(message.content.length < 2) return;

	//Commandes
	if(message.content.slice(0,2) === "c/") {
		var current = chain.next(EMPTY);
		var text = "";
		text += current.join(" ");
		console.log(current);
		var count = 0;
		while(count++ < 250) {
			current = chain.next(current);
			console.log(current);
			if(current == EMPTY) break;
			text += " " + current[2];
		}
		message.channel.send(text);

		return;
	}

	//On ignore les commandes pour l'apprentissage
	if(message.content.split(" ")[0].includes("/")) return;
	

	//Apprentissage d'un nouvea message
	var text = markov.removeLinks(message.content);
	console.log(text);
	var sentences = sentenceTokenizer.tokenize(text+".");
	console.log(sentences);
	for(numSentence in sentences) {
		var sentence = sentences[numSentence];
		console.log(sentence);
		var words = wordTokenizer.tokenize(sentence);
			var trigrams = NGrams.ngrams(words, 3, "");
			trigrams = trigrams.filter(t => t.length == 3);
			console.log(trigrams);
			chain.addTransition(EMPTY, trigrams[0]);
			if(trigrams.length > 1) {
				for(var i=0; i < trigrams.length-1; i++) {
					chain.addTransition(trigrams[i], trigrams[i+1]);
				}
			}
			chain.addTransition(trigrams[trigrams.length-1], EMPTY);
	}
	console.log(chain.toString());
});

client.login(passJson.pass);