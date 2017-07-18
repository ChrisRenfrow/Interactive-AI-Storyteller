'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const vsprintf = require('sprintf-js').vsprintf;

var STORY = './stories/test_story';
var world = require(STORY + '/world.json');
var bot = require(STORY + '/bot.json');
var player = require(STORY + '/player.json');
var world_dict = require(STORY + '/dictionary.json');
var zone = world.zones[player.current];

// Utility function to pick random replies
function getRandomReply (array) {
	return (array[Math.floor(Math.random() * (array.length))]);
}
// Gets default help
function getDefaultHelp () {
	return (getRandomReply(bot.dialogue.actions.help.false));
}
// Gets contextual help
function getContextHelp () {
	if (zone.contex_help != null) {
		return (getRandomReply(zone.contex_help));
	} else {
		return (getDefaultHelp());
	}
}
// Attempts to use specified exit and returns the appropriate reply
function goDirection (direction) {
	if (zone.exits[direction] != null) {
		zone = world.zones[zone.exits[direction].link];
		console.log(world.zones[zone.exits[e].link]);
		return (vsprintf(getRandomReply(bot.dialogue.actions.navigate.true), direction));
	} else {
		return (vsprintf(getRandomReply(bot.dialogue.actions.navigate.false), direction));
	}
}
// Determines whether or not a direction can be referred to by the given target id,
// if so it uses the exit and and returns the appropriate reply
function goTarget (target) {
	for (let e in zone.exits) {
		if (zone.exits[e] != null) {
			for (let v in zone.exits[e].alt) {
				if (zone.exits[e].alt[v] == target) {
					console.log(world.zones[zone.exits[e].link]);
					if (world.zones[zone.exits[e].link] == null) {
						return ('Something went wrong! Bad link perhaps?');
					} else {
						zone = world.zones[zone.exits[e].link];
						return (vsprintf(getRandomReply(bot.dialogue.actions.navigate_o.true), zone.alias));
					}
				}
			}
		}
	}
	return (vsprintf(getRandomReply(bot.dialogue.actions.navigate_o.false), target));
}
// Returns the text for looking at a target or the player's surroundings
function lookAtTarget (target) {
	let objects = zone.objects;
	let inventory = player.inventory;
	for (let o in objects) {
		for (let a in objects[o].alt) {
			if (objects[o].alt[a] == target && objects[o].bsay != null) {
				return (objects[o].bsay);
			}
		}
	}
	for (let i in inventory) {
		if (inventory[i].id == target && inventory[i].bsay != null) {
			return (inventory[i].bsay);
		}
	}
	return (getRandomReply(bot.dialogue.actions.look.false));
}

function lookAround () {
	let objects = zone.objects;
	let len;
	let end = ',';
	let bsay;

	if (zone.bsay != null) {
		bsay = getRandomReply(zone.bsay) + ' ';
	}
	if (zone.objects != null) {
		len = zone.objects.length;
		if (len > 1) {
			bsay += 'There are also some objects here. Looks like ';
		} else {
			bsay += 'There\'s an object here, ';
		}
		for (let i = 0; i < len; i++) {
			if (objects[i].bsay != null) {
				if (i == len - 1) {
					bsay += ' and ';
					end = '.';
				}
				bsay += ' ' + objects[i].id + end;
			}
		}
	}
	return (bsay);
}

function listInventory () {
	let bsay = getRandomReply(bot.dialogue.actions.inventory.true);
	let len = player.inventory.length;
	let end = ',';
	if (len == 0) {
		return (getRandomReply(bot.dialogue.actions.inventory.false));
	}
	for (let i = 0; i < len; i++) {
		if (player.inventory[i] != null) {
			if (i == len - 1) {
				bsay += ' and ';
				end = '.';
			}
			bsay += ' a ' + player.inventory[i].id + end;
		}
	}
	return (bsay);
}

exports.interactiveStory = functions.https.onRequest((request, response) => {
	const app = new App({request, response});
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function welcome_f (app) {
		app.ask(getRandomReply(bot.dialogue.conversation.welcome));
	}

	function help_f (app) {
		app.ask(getContextHelp());
	}

	function navigate_f (app) {
		let direction = app.getArgument('Directions').toLowerCase();
		let target = app.getArgument('location').toLowerCase();
		let bsay;
		if (direction != null) {
			bsay = goDirection(direction);
		} else if (target != null) {
			bsay = goTarget(target);
		} else {
			bsay = getRandomReply(bot.dialogue.actions.navigate.missing);
		}
		app.ask(bsay);
	}

	function look_f (app) {
		let target = app.getArgument('thing').toLowerCase();
		let bsay;
		if (target != null) {
			bsay = lookAtTarget(target);
		} else if (zone != null) {
			bsay = lookAround();
		} else {
			bsay = getRandomReply(bot.dialogue.actions.look.missing);
		}
		app.ask(bsay);
	}

	function inventory_f (app) {
		app.ask(listInventory());
	}

	function take_f (app) {
		let target = app.getArgument('any').toLowerCase();
		if (target) {
			app.ask('Alright, I\'ll grab the ' + target.alias + '...');
		} else {
			app.ask('I don\'t see that here...');
		}
	}

	function attack_f (app) {
		let target = app.getArgument('target').toLowerCase();
		app.ask(vsprintf(getRandomReply(bot.dialogue.actions.attack.true),target));
	}

	function listMeta () {
		let meta = world.name + 'Info: ';
		for (let e in world.meta) {
			meta += e[0] + ': ' + e + ' ';
		}
		app.tell(meta);
	}

	let actionMap = new Map();

	actionMap.set('input.welcome', welcome_f);
	actionMap.set('input.help', help_f);
	actionMap.set('input.navigate', navigate_f);
	actionMap.set('input.look', look_f);
	actionMap.set('input.take', take_f);
	actionMap.set('input.inventory', inventory_f);
	actionMap.set('input.attack', attack_f);
	actionMap.set('debug.meta', listMeta);

	app.handleRequest(actionMap);
});
