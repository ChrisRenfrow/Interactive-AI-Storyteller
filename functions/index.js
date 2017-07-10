'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const request = require('request');

const HOST_URL = 'https://interactive-fiction-9f0ad.firebaseapp.com/';
const PUBLIC_URL = HOST_URL + 'public/';
const MAPS_URL = PUBLIC_URL + 'maps/';

const SELECTED_MAP_URL = MAPS_URL + 'TEMPLATE.json';
const START_ZONE = 'zone1';

var map = null;
var zone = null;

exports.underwaterAdventure = functions.https.onRequest((request, response) => {
	const app = new App({request, response});
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function welcome_f (app) {
		app.ask(map.meta.welcome);
	}

	function help_f (app) {
		app.ask(zone.ctxHelp);
	}

	function attack_f (app) {
		let target = zone.enemies[app.getArgument('any')];
		if (zone.enemies != null && zone.enemies[target]) {
			app.ask('I hope this works... Attacking ' + target);
		} else {
			app.ask('There are no enemies here. Are you okay?');
		}
	}

	function navigate_f (app) {
		let direction = zone.exits[app.getArgument('Directions')];
		if (direction != '-1' && direction) {
			zone = map.rooms[direction];
			app.ask('Alright, guiding you to the ' + zone.alias);
		} else {
			app.ask('Uh, I don\'t see that here...');
		}
	}

	// function heal_f (app) {
	//
	// }

	function look_f (app) {
		let target = app.getArgument('thing');
		var bsay;
		if (target == null) {
			bsay = zone.bsay;
			console.log('I made it here');
			if (zone.enemies != null) {
				bsay += ' There are enemies nearby! ';
				let e = zone.enemies[target];
				if (e) {
					bsay += e + ', ';
				}
			}
			if (zone.objects != null) {
				bsay += ' There\'s also an object here, ';
				let o = zone.objects[target];
				if (o) {
					bsay += o + ', ';
				}
			}
		} else if (target != null) {
			let t;
			if (zone.enemies != null) {
				t = zone.enemies[target];
				if (t != null) {
					bsay = t.bsay;
				} else {
					bsay = 'I don\'t see that...';
				}
			}
			if (zone.objects != null) {
				t = zone.objects[target];
				if (t != null) {
					bsay = t.bsay;
				} else {
					bsay = 'I don\'t see that...';
				}
			}
		} else if (target.bsay) {
			app.ask(target.bsay);
		} else {
			app.ask('Nope, that isn\'t here.');
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

	// function interact_f (app) {
	// 	let action = map.actions[app.getArgument('any')];
	// 	if (action) {
	// 		app.ask(action);
	// 	} else {
	// 		app.ask('No such thing ' + action + '...');
	// 	}
	// }

	let actionMap = new Map();
	actionMap.set('input.welcome', welcome_f);
	actionMap.set('help', help_f);
	actionMap.set('attack', attack_f);
	actionMap.set('navigate', navigate_f);
	// actionMap.set('heal', heal_f);
	actionMap.set('look', look_f);
	actionMap.set('take', take_f);
	// actionMap.set('interact', interact_f);
	if (zone == null) {
		request({
			url: SELECTED_MAP_URL,
			json: true
		}, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log(body); // Print the json response
			}
			map = JSON.parse(body);
		});
		zone = map.zones[START_ZONE];
	}
	app.handleRequest(actionMap);
});
