
var natural = require('natural');
var tokenizer = require('./DiscordTokenizerFr.js');
var markov = require('../libs/markov/markov.js');

var NGrams = natural.NGrams;

var discordTokenizerFr = new tokenizer.DiscordTokenizerFr();

module.exports.removeLinks = function(str) {
	return str.replace(/https?\:\/\/[^ ]*/g,"").replace(/www\.[^ ]*/g,"");
}

module.exports.parseMessage = function(message, chain) {
	var text = module.exports.removeLinks(message.content);
	var lines = text.split("\n");
	//console.log("Phrase: "+message.content);
	for(lineCount in lines) {
		var line = lines[lineCount];
		if(!line || !line.match(/[a-zA-Z]/)) continue; //Skip empty lines and lines without letters
		if(line.match(/^\![a-z]+$/)) continue; //Skip old lepers commands

		var tokens = discordTokenizerFr.tokenize(line);
		//console.log("tokens: "+tokens);
		var trigrams = NGrams.ngrams(tokens, 3, "");
		trigrams = trigrams.filter(t => t.length == 3);
		for(var i=0; i < trigrams.length; i++) {
			chain.addTransition(trigrams[i].slice(0,2), trigrams[i][2]);
		}
	}
}