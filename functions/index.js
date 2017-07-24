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
var inventory = player.inventory;

// Utility function to pick random replies
function getRandomReply (array) {
	return (array[Math.floor(Math.random() * (array.length))]);
}
// Gets default help
function getDefaultHelp () {
	return (getRandomReply(bot.say.actions.help.false));
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
		// console.log(JSON.stringify(world.zones[zone.exits[direction].link]));
		// console.log(JSON.stringify(zone.exits[direction].link));
		if (world.zones[zone.exits[direction].link]) {
			zone = world.zones[zone.exits[direction].link];
			return (vsprintf(getRandomReply(bot.say.actions.navigate.true), direction));
		} else {
			return (vsprintf(getRandomReply(bot.say.actions.navigate.false), direction));
		}
	}
	return (vsprintf(getRandomReply(bot.say.actions.navigate.false), direction));
}
// Determines whether or not a direction can be referred to by the given target id,
// if so it uses the exit and and returns the appropriate reply
function goTarget (target) {

	for (let e in zone.exits) {
		if (zone.exits[e] != null) {
			for (let v in zone.exits[e].alt) {
				if (zone.exits[e].alt[v] == target) {
					if (world.zones[zone.exits[e].link] != null) {
						zone = world.zones[zone.exits[e].link];
						return (vsprintf(getRandomReply(bot.say.actions.navigate_o.true), target));
					} else {
						return (vsprintf(getRandomReply(bot.say.actions.navigate_o.false), target));
					}
				}
			}
		}
	}
	return (vsprintf(getRandomReply(bot.say.actions.navigate_o.missing), target));
}
// Returns the text for looking at a target or the player's surroundings
function lookAtTarget (target) {
	let objects = zone.objects;

	for (let o in objects) {
		for (let a in objects[o].alt) {
			if (objects[o].alt[a] == target && objects[o].bsay != null) {
				return (objects[o].bsay);
			}
		}
	}
	let i = inventory.findIndex(i => i.id === target);
	if (i != -1 && inventory[i].bsay != null)
		return (inventory[i].bsay);
	return (getRandomReply(bot.say.actions.look.false));
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
			bsay += 'A ';
		}
		for (let i = 0; i < len; i++) {
			if (objects[i].id != null && objects[i].location != null) {
				if (i == len - 1) {
					bsay += ' and a ';
					end = '.';
				}
				bsay += ' ' + objects[i].id + ' ' + objects[i].location + end;
			}
		}
	}
	return (bsay);
}

function listInventory () {
	let bsay = getRandomReply(bot.say.actions.inventory.true);
	let len = inventory.length;
	let end = ',';
	if (len == 0) {
		return (getRandomReply(bot.say.actions.inventory.false));
	}
	for (let i = 0; i < len; i++) {
		if (inventory[i] != null) {
			if (i == len - 1) {
				bsay += ' and ';
				end = '.';
			}
			bsay += ' a ' + inventory[i].id + end;
		}
	}
	return (bsay);
}

function takeItem (target) {
	let objects = zone.objects;
	let bsay = vsprintf(getRandomReply(bot.say.actions.take.false), target);
	for (let o in objects) {
		if (objects[o].id == target) {
			inventory.push(objects[o]);
			objects.splice(o, 1);
			return (vsprintf(getRandomReply(bot.say.actions.take.true), target));
		}
		for (let a in objects[o].alt) {
			if (objects[o].alt[a] == target) {
				inventory.push(objects[o]);
				objects.splice(o, 1);
				return (vsprintf(getRandomReply(bot.say.actions.take.true), target));
			}
		}
	}
	return (bsay);
}

function dropItem (target) {
	let i = inventory.findIndex(i => i.id === target);
	if (i != -1) {
		zone.objects.push(inventory[i]);
		inventory.splice(i, 1);
		return (vsprintf(getRandomReply(bot.say.actions.drop.true), target));
	}
	return (vsprintf(getRandomReply(bot.say.actions.drop.false), target));
}

function attackTarget (target) {
	return (vsprintf(getRandomReply(bot.say.actions.attack.true), target));
}

function inquireTopicOrItem (topic) {
	if (world_dict.dict[topic] != null) {
		return(getRandomReply(world_dict.dict[topic].desc));
	} else {
		// Could all be condensed if I change the way I handle no such object
		let objects = zone.objects;

		for (let o in objects) {
			for (let a in objects[o].alt) {
				if (objects[o].alt[a] == topic && objects[o].bsay != null) {
					return (objects[o].bsay);
				}
			}
		}
		let i = inventory.findIndex(i => i.id === topic);
		if (i != -1 && inventory[i].bsay != null)
			return (inventory[i].bsay);
	}
	return (vsprintf(getRandomReply(bot.say.actions.inquire.false), topic));
}

//===========================================================================//
//
//===========================================================================//

exports.interactiveStory = functions.https.onRequest((request, response) => {
	const app = new App({request, response});
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function welcome_f (app) {
		app.ask(getRandomReply(bot.say.small_talk.welcome));
	}

	function help_f (app) {
		app.ask(getContextHelp());
	}

	function navigate_f (app) {
		let direction = app.getArgument('Directions');
		let target = app.getArgument('location');
		let bsay;
		if (direction != null) {
			bsay = goDirection(direction.toLowerCase());
		} else if (target != null) {
			bsay = goTarget(target.toLowerCase());
		} else {
			bsay = getRandomReply(bot.say.actions.navigate.missing);
		}
		app.ask(bsay);
	}

	function look_f (app) {
		let target = app.getArgument('thing');
		let bsay;
		if (target != null) {
			bsay = lookAtTarget(target.toLowerCase());
		} else if (zone != null) {
			bsay = lookAround();
		} else {
			bsay = getRandomReply(bot.say.actions.look.missing);
		}
		app.ask(bsay);
	}

	function inventory_f (app) {
		app.ask(listInventory());
	}

	function take_f (app) {
		let target = app.getArgument('target');

		if (target != null) {
			app.ask(takeItem(target.toLowerCase()));
		} else {
			app.ask(getRandomReply(bot.say.actions.take.missing));
		}
	}

	function drop_f (app) {
		let target = app.getArgument('target');

		if (target != null) {
			app.ask(dropItem(target.toLowerCase()));
		} else {
			app.ask(getRandomReply(bot.say.actions.drop.missing));
		}
	}

	function attack_f (app) {
		let target = app.getArgument('target');
		if (target != null) {
			app.ask(attackTarget(target.toLowerCase()));
		} else {
			app.ask(getRandomReply(bot.say.actions.attack.missing));
		}
	}

	function inquire_f (app) {
		let target = app.getArgument('topic');

		if (target != null) {
			app.ask(inquireTopicOrItem(target.toLowerCase()));
		} else {
			app.ask(getRandomReply(bot.say.actions.inquire.missing));
		}
	}

	function unknown_f (app) {
		app.ask(getRandomReply(bot.say.small_talk.unknown));
	}

	function listMeta () {
		let meta = 'Title:' + world.name + '\n Info: ';
		for (let e in world.meta) {
			meta += e + ': ' + world.meta[e] + '\n ';
		}
		app.tell(meta);
	}

	let actionMap = new Map();

	actionMap.set('input.welcome', welcome_f);
	actionMap.set('input.help', help_f);
	actionMap.set('input.navigate', navigate_f);
	actionMap.set('input.look', look_f);
	actionMap.set('input.take', take_f);
	actionMap.set('input.drop', drop_f);
	actionMap.set('input.inventory', inventory_f);
	actionMap.set('input.attack', attack_f);
	actionMap.set('input.inquire', inquire_f);
	actionMap.set('input.unknown', unknown_f);
	actionMap.set('debug.meta', listMeta);

	app.handleRequest(actionMap);
});
