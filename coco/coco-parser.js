
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
	var message = text.split("\n").filter(line =>
			line && line.match(/[a-zA-Z]/) //Skip empty lines and lines without letters
			&& !line.match(/^\![a-z]+$/));//Skip old lepers commands
	if(!message || message.length == 0) return;
	message = message
		.map(line => line.trim())
		.join(" ") //We join the sentences with spaces
		.replace(/ +/, " "); //Remove multi spaces

	if(!message || !message.match(/[a-zA-Z0-9]/)) return; //skip messages without letters and digits

	var tokens = discordTokenizerFr.tokenize(message);
	//console.log("tokens: "+tokens);
	var trigrams = NGrams.ngrams(tokens, 3, "");
	trigrams = trigrams.filter(t => t.length == 3);
	for(var i=0; i < trigrams.length; i++) {
		chain.addTransition(trigrams[i].slice(0,2).map(str => str.toLowerCase().trim()), trigrams[i][2].trim());
	}
}