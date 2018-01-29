const Discord = require('discord.js');
const client = new Discord.Client();
const stream = require('stream');

var voiceConnection;
var voiceChannel;

client.login('Mzg3NjAyMTQzMjEwNzY2MzM3.DQg2UQ.Q_L2i0xQE8GC69emhyFPaD2Pz48');

client.on('ready', () => {
  console.log('Ready to work!');
});

client.on('message', message => {
	// Voice only works in guilds, if the message does not come from a guild,
	// we ignore it
	if (!message.guild) return;

	if (message.content === '/join') {
		// Only try to join the sender's voice channel if they are in one themselves
		if (message.member.voiceChannel) {
		  message.member.voiceChannel.join()
			.then(connection => { // Connection is an instance of VoiceConnection
			  voiceConnection = connection;
			  voiceChannel = message.member.voiceChannel;
			  message.reply('JE ME SUIS BIEN CONNECTÉ !');
			})
			.catch(console.log);
		} else {
		  message.reply('TU N\'ES DANS AUCUN SERVEUR VOCAL, COMMENT JE PEUX TE REJOINDRE ?! AAAAAAAAAH !');
		}
	}

	if (message.content === '/leave') {
		if (voiceChannel) {
			voiceChannel.leave();
			voiceConnection = null;
			voiceChannel = null;
			message.reply('ALLEZ SALUT !');
		} else {
			message.reply('JE SUIS NULLE PART, COMMENT JE PEUX PARTIR ?! AAAAAAAAAH !');
		}
	}
  
	if (message.content === '/taisezvous') {
		if(!voiceConnection) {
			message.reply('JE SUIS PAS CONNECTÉ À UN SERVEUR VOCAL !');
			return;
		}
		voiceConnection.playFile('./taisez-vous.mp3');
	}
	
	if (message.content === '/nianiania') {
		if(!voiceConnection) {
			message.reply('JE SUIS PAS CONNECTÉ À UN SERVEUR VOCAL !');
			return;
		}
		voiceConnection.playFile('./nianiania.mp3');
	}
	
	if (message.content === '/merde') {
		if(!voiceConnection) {
			message.reply('JE SUIS PAS CONNECTÉ À UN SERVEUR VOCAL !');
			return;
		}
		voiceConnection.playFile('./merde.mp3');
	}
	
	if (message.content.length > 7 && message.content.slice(0, 7) === "/gtrad ") {
		if(!voiceConnection) {
			message.reply('JE SUIS PAS CONNECTÉ À UN SERVEUR VOCAL !');
			return;
		}
		
		var phrase = message.content.slice(7);
		
		var lang = 'fr'
		var firstSpace = phrase.indexOf(' ');
		if(firstSpace != -1 && phrase.slice(0,2) === "l=") {
			lang = phrase.slice(2,firstSpace);
			phrase = phrase.slice(firstSpace);
		}
		console.log(phrase + '(' + lang + ')');
		voiceConnection.playArbitraryInput('http://translate.google.com/translate_tts?ie=UTF-8&q='+encodeURI(phrase)+'&tl='+lang+'&client=tw-ob');
	}
	
	if (message.content === "/help") {
		message.reply("SALUT LES P'TITS POTES ! QUAND JE NE DÉFEND PAS LA FRANCE CONTRE LE GRAND REMPLACEMENT, JE FAIS BOT VOCAL POUR CE CHAN PLEIN DE GROS CONS.\n"
		+"VOILÀ MES COMMANDES :\n"
		+"**********************************************\n"
		+"/taisezvous - QUAND FAUT LEUR DIRE DE BIEN LA FERMER\n"
		+"/nianiania - QUAND ON VOUS A TRAITE DE FASCISTE\n"
		+"/merde - QUAND T'EN AS GROS\n"
		+"/gtrad [l=xx] phrase - PRONONCE UNE PHRASE DE VOTRE CHOIX. ON PEUT PRÉCISER LA LANGUE AVEC L'OPTION l= (CODES LANGUES ICI : https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) \n"
		+"\n"
		+"MAINTENANT TAISEZ-VOUUUUUUUS !");
	}
});