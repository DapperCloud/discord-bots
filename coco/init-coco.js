//Se connecte au serveur et va lire tous les messages dans tous les channels.
//Crée les chaînes de Markov correspondantes et les sérialise.

var natural = require('natural');
var NGrams = natural.NGrams;

sentenceTokenizer = new natural.SentenceTokenizer();
wordTokenizer = new natural.AggressiveTokenizerFr();

var sentences = sentenceTokenizer.tokenize("ceci est un test.");
console.log(sentences);