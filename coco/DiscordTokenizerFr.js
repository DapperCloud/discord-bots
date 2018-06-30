// A regexp tokenizer, for french characters words and emotes (:p, :D, :), x), :emote:...)

var natural = require('natural'),
	util = require("util");

var DiscordTokenizerFr = function() {
    this._pattern = new RegExp(/(\^\^|(\:|x)\-?[\\\(\)\/\|pPoODxX3]|\<\@\![0-9]+\>|\<\a?:[a-zA-Z]+\:[0-9]+\>|['a-zA-Z0-9äâàéèëêïîöôùüûœæçÄÂÀÉÈËÊÏÎÖÔÙÜŒÆÇ\-+_]+|( *\. *)+|( *\, *)+|( *[!?] *)+|( *\" *)+)/g);
    natural.RegexpTokenizer.call(this,{gaps: false});
};

DiscordTokenizerFr.prototype.tokenize = function(s) {
	var matchs = natural.RegexpTokenizer.prototype.tokenize.call(this, s);
	return matchs.map(token => token.replace(/(\.|\,|\'|\")+/, "$1"));
}

util.inherits(DiscordTokenizerFr, natural.RegexpTokenizer);
exports.DiscordTokenizerFr = DiscordTokenizerFr;