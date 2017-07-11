'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

var world = require('./avas_story.json');
var zone = world.zones['zone1'];

exports.underwaterAdventure = functions.https.onRequest((request, response) => {
	const app = new App({request, response});
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function welcome_f (app) {
		app.ask(world.bot_details.welcome);
	}

	function help_f (app) {
		app.ask(zone.ctxHelp);
	}

	function navigate_f (app) {

		let direction = app.getArgument('Directions');
		let target = app.getArgument('location');

		if (direction != null) {
			if (zone.exits[direction] != null) {
				zone = world.zones[zone.exits[direction].link];
				app.ask('We\'re going toward ' + zone.alias);
			} else {
				app.ask('That\'s not there.');
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
			app.ask('Get gud');
			//			app.ask('We can\'t go that way...');
		}
	}

	function look_f (app) {
		let target = app.getArgument('thing');
		let bsay = 'There\'s nothing here...';
		console.log(JSON.stringify(zone));
		if (target == null) {
			bsay = zone.bsay;
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

	let actionMap = new Map();

	actionMap.set('input.welcome', welcome_f);
	actionMap.set('help', help_f);
	actionMap.set('navigate', navigate_f);
	actionMap.set('look', look_f);
	actionMap.set('take', take_f);

	app.handleRequest(actionMap);
});
