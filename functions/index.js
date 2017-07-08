'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

var hp = 100;

exports.underwaterAdventure = functions.https.onRequest((request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

// Make a silly name
//  function makeName (app) {
//    let number = app.getArgument(NUMBER_ARGUMENT);
//    let color = app.getArgument(COLOR_ARGUMENT);
//    app.tell('Alright, your silly name is ' +
//      color + ' ' + number +
//      '! I hope you like it. See you next time.');
//  }


  function status_f (app) {
	app.tell('Your status is axcellent!!! You have '+hp+'hp');
}

  function attack_f (app) {
	hp=hp-10;
	app.tell('something blah blah');
}

  let actionMap = new Map();
  actionMap.set('status', status_f);
  actionMap.set('attack', attack_f);

  app.handleRequest(actionMap);
});
