#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log('Ready to work!');
  jojo = client.emojis.find("name", "jojo");
});

function trigger(mot) {
	if (['gros', 'grosse', 'énorme', 'long', 'longue', 'dur', 'rigide', 'gigantesque', 'colossal', 
		'grand', 'titanesque', 'massif', 'massive', 'lourd', 'imposant', 'monumental', ].includes(mot)) {
		return 'bite';
	} else if(['mouillé', 'humide', 'chaud', 'excité', 'gluant', 'défoncé', 
		'défoncer', 'sucer', 'poncé', 'poncer', 'bonne', 'canon', 'serré'].includes(mot)) {
		return 'amie';
	}
	return '';
}

function repondre(message, typeReponse, mot) {
	if(typeReponse === 'bite') {
		message.reply(mot+', un peu comme ma bite');
	} else if(typeReponse === 'amie') {
		message.reply(mot+' ? Ça me rappelle une amie que j\'ai bien connue');
	}
	message.react(jojo);
	console.log('Je leur ai bien dit !');
}

client.on('message', message => {
	
	if(message.author.bot) {
		return;
	}
	
	phrase = message.content.replace(/\!|,|\.|\?|;|\:/g,' ');
	phrase = phrase.trim();
	derniersMots = phrase.split(' ').slice(-8);
	for(var i=0; i<derniersMots.length; i++) {
		var motAtester = derniersMots[i];
		var motNormalise = motAtester;
		typeReponse = trigger(motNormalise);
		if(typeReponse != '') {
		  repondre(message, typeReponse, motAtester);
		  return;
		}

		if(motNormalise.slice(-1) === 's') {
		  motNormalise = motNormalise.slice(0, motNormalise.length - 1);
		  typeReponse = trigger(motNormalise);
		  if(typeReponse != '') {
			  repondre(message, typeReponse, motAtester);
			  return;
		  }
		}

		if(motNormalise.slice(-1)[0] === 'e') {
		  motNormalise = motNormalise.slice(0, motNormalise.length - 1);
		  typeReponse = trigger(motNormalise);
		  if(typeReponse != '') {
			  repondre(message, typeReponse, motAtester);
			  return;
		  }
		}
	}

	if(phrase.includes('frein')){
	  message.reply("On parle pas de frein, rien que d'y repenser j'en ai la bite de travers. Merci d'avance.");
	  console.log("Aïe !");
	  return;
	}

	if(phrase.includes('arcade')){
	  message.reply("On parle pas d'arcade, rien que d'y repenser ça me casse la tête. Merci d'avance.");
	  console.log("Aïe !");
	  return;
	}
});

client.login('Mzg3MzA1OTU4OTMxNjkzNTc4.DQc1jw.wdQ7myRSFKbH9As_qUGOncfylcE');
