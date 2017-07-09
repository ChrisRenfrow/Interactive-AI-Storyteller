'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

const map = {
	'name': 'Spirtual Experience',
	'meta': {
		'author': 'Chris Renfrow',
		'email': 'mail@chrisrenfrow.me',
		'tagline': 'You wakex up in a world of darkness with a spirit as your guide. Will you make it out of the labyrinth?',
		'welcome': 'Oh, you finally decided to wake up huh? I bet you\'re a bit confused... I\'m Ava, and you are blind and deaf. Oh! But don\'t worry, it\'s temporary, well... it could be if we can stop that scaley heathen in time. Any questions?'
	},
	'rooms': {
		'room1': {
			'alias': 'forest',
			'bsay': 'We\'re in the middle of a forest. There\'s a clearing directly ahead of us and the mountains are to the left.',
			'ctxHelp': 'I\'ll guide you wherever you\'d like to go and try my best to keep you out of harm\'s way. I will be your eyes and ears.',
			'actions': null,
			'exits': {
				'forward': 'room2',
				'right': '-1',
				'back': '-1',
				'left': 'mountains'
			},
			'objects': {
				'shard': {
					'alias': 'pulsing metallic shard',
					'bsay': 'It\'s humming with a strange energy, I\'m not sure what to make of it but it seems like it might be important. Why not pick it up?',
					'actions': ['take', 'examine']
				}
			},
			'enemies': null
		},
		'room2': {
			'alias': 'clearing',
			'bsay': 'Oh, the sky is so beautiful! You should really see- oh, um, nevermind. There\'s an impassable steep hill in front of you past the clearing. There\'s a stone structure to the right and more mountains to the left. The forest is behind us.',
			'ctxHelp': 'That stone structure looks important but I feel something pulling me toward the mountains...',
			'actions': null,
			'exits': {
				'forward': '-1',
				'right': 'room4',
				'back': 'room1',
				'left': 'room3'
			},
			'objects': {
				'burnt patches': {
					'alias': 'burnt patches in the grass',
					'bsay': 'The grass is burned in random spots leading toward the stone structure, some spots are still smoldering...',
					'actions': ['examine']
				}
			},
			'enemies': null
		},
		'room3': {
			'alias': 'mountains',
			'bsay': 'We\'re at the foot of the mountain range. The mountains are so tall! The forest is to the left and the clearing is to the right and behind us.',
			'ctxHelp': 'Maybe I can break that crystal out of the rock... Just ask me to grab it for you and I\'ll give it my best shot.',
			'actions': null,
			'exits': {
				'forward': '-1',
				'right': 'room2',
				'back': 'room2',
				'left': 'room1'
			},
			'objects': {
				'crystal': {
            	    'alias': 'crystal in the rock',
            	    'bsay': 'There\'s a crystal embedded in the rock... Maybe I could break it out...',
            	    'actions': ['take', 'examine']
				}
			},
			'enemies': null
		},
		'room4': {
			'alias': 'stone structure',
			'description': 'These structures are ancient... To the left is the steep hill, the forest is to the right and the clearing is behind us. I think I sense- Oh! There\'s an enemy here!',
			'contextualHelp': 'I don\'t think we should approach him until we\'ve explored more...',
			'actions': null,
			'exits': {
				'forward': '-1',
				'right': 'room1',
				'back': 'room2',
				'left': '-1'
			},
			'objects': null,
			'enemies': {
          	'creature': {
            	'alias': 'reptilian creature leaning against a stone pillar',
            	'bsay': 'It\'s the reptilian creature that cursed you! I can taste the greed seeping from them. It tastes bad.',
					'actions': ['attack','examine']
				}
			}
		}
	}
};

var current = map.rooms['room1'];

exports.underwaterAdventure = functions.https.onRequest((request, response) => {
	const app = new App({request, response});
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	function welcome_f (app) {
		app.ask(map.meta.welcome);
	}

	function help_f (app) {
		app.ask(current.ctxHelp);
	}

	function attack_f (app) {
		let target = current.enemies[app.getArgument('any')];
		if (current.enemies != null && current.enemies[target]) {
			app.ask('I hope this works... Attacking ' + target);
		} else {
			app.ask('There are no enemies here. Are you okay?');
		}
	}

	function navigate_f (app) {
		let direction = current.exits[app.getArgument('Directions')];
		if (direction != '-1' && direction) {
			current = map.rooms[direction];
			app.ask('Alright, guiding you to the ' + current.alias);
		} else {
			app.ask('Uh, I don\'t see that here...');
		}
	}

	// function heal_f (app) {
	//
	// }

	function look_f (app) {
		let target = app.getArgument('any');
		var bsay;
		if (target == null) {
			bsay = current.bsay;
			console.log('I made it here');
			if (current.enemies != null) {
				bsay += ' There are enemies nearby! ';
			    for (var e in current.enemies) {
    				bsay += e.alias + ', ';
				}
			}
			if (current.objects != null) {
    			bsay += 'There\'s also an object here, ';
    			for (var o in current.objects) {
				    bsay += o.alias + ', ';
				}
			}
		} else if (target != null) {
			let t;
			if (current.enemies != null) {
				t = current.enemies[target];
			    if (t != null) {
					bsay = t.bsay;
				} else {
					bsay = 'I don\'t see that...';
				}
			}
			if (current.objects != null) {
    			t = current.objects[target];
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
		let target = current.objects[app.getArgument('any')];
		if (target) {
			app.ask('Alright, I\'ll grab the ' + target[0] + '...');
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

	app.handleRequest(actionMap);
});
