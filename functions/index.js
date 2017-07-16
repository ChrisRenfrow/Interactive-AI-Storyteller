'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const vsprintf = require('sprintf-js').vsprintf;

var STORY = './stories/test_story';
var world = require(STORY + '/world.json');
var bot = require(STORY + '/bot.json');
var world_dict = require(STORY + '/dictionary.json');
var zone = world.zones['zone1'];

// Utility function to pick prompts
function getRandomReply (array) {
	return (array[Math.floor(Math.random() * (array.length))]);
}

function getDefaultHelp () {
	return (getRandomReply(bot.dialogue.actions.help.false));
}

function getContextHelp () {
	if (zone.contex_help) {
		return (zone.contex_help);
	} else {
		return (getDefaultHelp());
	}
}

exports.interactiveStory = functions.https.onRequest((request, response) => {
	const app = new App({request, response});
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function welcome_f (app) {
		// app.ask(getRandomReply(bot.dialogue.conversation.welcome));
		app.ask('Hmm?');

	}

	function help_f (app) {
		app.ask(getContextHelp());
	}

	function navigate_f (app) {

		let direction = app.getArgument('Directions');
		let target = app.getArgument('location');

		if (direction != null) {
			if (zone.exits[direction] != null) {
				zone = world.zones[zone.exits[direction].link];
				app.ask(vsprintf(getRandomReply(bot.dialogue.actions.navigate.true), zone.alias));
			}
		} else if (target != null) {
			for (let i = 0; zone.exits[i] != null; i++) {
				if (zone.exits[i].alt[target] != null) {
					zone = world.zones[zone.exits[i].link];
					app.ask('We\'re going toward ' + zone);
				} else {
					app.ask('That\'s not here.');
				}
			}
		} else {
			app.ask('We can\'t go that way...');
		}
	}

	function look_f (app) {
		let target = app.getArgument('thing');
		let bsay = 'There\'s nothing here...';
		if (target == null) {
			bsay = getRandomReply(zone.bsay);
		}
		app.ask(bsay);
	}

	function take_f (app) {
		let target = zone.objects[app.getArgument('any')];
		if (target) {
			app.ask('Alright, I\'ll grab the ' + target.alias + '...');
		} else {
			app.ask('I don\'t see that here...');
		}
	}

	function attack_f (app) {
		let target = zone.entities[app.getArgument('target')];
		app.ask(vsprintf(getRandomReply(bot.dialogue.actions.attack.true),target));
	}

	function listMeta () {
		let meta = world.name + 'Info: ';
		for (let e in world.meta) {
			meta += e[0] + ': ' + e;
		}
		app.say(meta);
	}

	let actionMap = new Map();

	actionMap.set('input.welcome', welcome_f);
	actionMap.set('input.help', help_f);
	actionMap.set('input.navigate', navigate_f);
	actionMap.set('input.look', look_f);
	actionMap.set('input.take', take_f);
	actionMap.set('input.attack', attack_f);

	actionMap.set('debug.meta', listMeta);

	app.handleRequest(actionMap);
});
