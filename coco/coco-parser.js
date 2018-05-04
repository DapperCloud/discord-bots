
var natural = require('natural');
var markov = require('../libs/markov/markov.js');


var NGrams = natural.NGrams;

sentenceTokenizer = new natural.SentenceTokenizer();
wordTokenizer = new natural.AggressiveTokenizerFr();


module.exports.removeLinks = function(str) {
	return str.replace(/https?\:\/\/[^ ]*/g,"").replace(/www\.[^ ]*/g,"");
}

module.exports.parseMessage = function(message, chain) {
	var text = module.exports.removeLinks(message.content);
	var lines = text.split("\n");
	for(lineCount in lines) {
		var line = lines[lineCount];
		if(!line || !line.match(/[a-zA-Z]/)) continue; //Skip empty lines and lines without letters
		var sentences = sentenceTokenizer.tokenize(line+".");
		for(numSentence in sentences) {
			var sentence = sentences[numSentence];
			var words = wordTokenizer.tokenize(sentence);
				var trigrams = NGrams.ngrams(words, 3, "");
				trigrams = trigrams.filter(t => t.length == 3);
				for(var i=0; i < trigrams.length; i++) {
					chain.addTransition(trigrams[i].slice(0,2), trigrams[i][2]);
				}
		}
	}
}