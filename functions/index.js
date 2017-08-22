'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const axios = require('axios');
const vsprintf = require('sprintf-js').vsprintf;

const story = './stories/test_story';
const world = require(story + '/world.json');
const bot = require(story + '/bot.json');
const player = require(story + '/player.json');
const worldDict = require(story + '/dictionary.json');

let zone = world.zones[player.current];
let inventory = player.inventory;

/** Utility function to pick random replies
 * @function
 * @param {array} array - Array of potential replies
 * @return {string} The randomly selected reply
 */
function getRandomReply(array) {
  return (array[Math.floor(Math.random() * (array.length))]);
}

/** Gets the default help reply
 * @function
 * @return {string} The randomly selected help reply
 */
function getDefaultHelp() {
  return (getRandomReply(bot.say.actions.help.false));
}

/** Gets contextual reply if it exists
 * @function
 * @return {string} The randomly selected contextual reply or a fallback help \
 *  reply
 */
function getContextHelp() {
  if (zone.contex_help != null) {
    return (getRandomReply(zone.contex_help));
  } else {
    return (getDefaultHelp());
  }
}

/** Attempts to update the player's location for a given direction
 * @function
 * @param {string} direction - Any utterance of forward, back, left or right
 * @return {string} The randomly selected feedback for action success or failure
 */
function goDirection(direction) {
  let navigate = bot.say.actions.navigate;

  if (zone.exits[direction] != null) {
    if (world.zones[zone.exits[direction].link]) {
      zone = world.zones[zone.exits[direction].link];
      return (vsprintf(getRandomReply(navigate.true), direction));
    } else {
      return (vsprintf(getRandomReply(navigate.false), direction));
    }
  }
  return (vsprintf(getRandomReply(navigate.false), direction));
}

/** Attempts to update the player's location for a given target
 * @function
 * @param {string} target - The desired target, example: 'rusted gate'
 * @return {string} The randomly selected feedback for action success or failure
 */
function goTarget(target) {
  let navigateO = bot.say.actions.navigate_o;

  for (let e in zone.exits) {
    if (zone.exits[e] != null) {
      for (let v in zone.exits[e].alt) {
        if (zone.exits[e].alt[v] == target) {
          if (world.zones[zone.exits[e].link] != null) {
            zone = world.zones[zone.exits[e].link];
            return (vsprintf(getRandomReply(navigateO.true), target));
          } else {
            return (vsprintf(getRandomReply(navigateO.false), target));
          }
        }
      }
    }
  }
  return (vsprintf(getRandomReply(bot.say.actions.navigate_o.missing), target));
}

/** Returns information on the given target
 * @function
 * @param {string} target - The target, example: 'glowing button'
 * @return {string} The randomly selected descriptive text of the target or \
 * if the item exists
 */
function lookAtTarget(target) {
  let objects = zone.objects;

  for (let o = 0; o < objects.length; o++) {
    if (objects[o]) {
      for (let a = 0; a < objects[o].alt.length; a++) {
        if (objects[o].alt[a] == target && objects[o].bsay != null) {
          return (objects[o].bsay);
        }
      }
    }
  }
  let i = inventory.findIndex((i) => i.id === target);
  if (i != -1 && inventory[i].bsay != null) {
    return (inventory[i].bsay);
  }
  return (getRandomReply(bot.say.actions.look.false));
}

/** Returns description of surroundings including objects
 * @function
 * @return {string} The descriptive text of the current room
 */
function lookAround() {
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

/** Returns names of objects in inventory
 * @function
 * @return {string} Formatted string of items
 */
function listInventory() {
  let inv = bot.say.actions.inventory;
  let bsay = getRandomReply(inv.true);
  let len = inventory.length;
  let end = ',';

  if (len == 0) {
    return (getRandomReply(inv.false));
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

/** Attempts to add target object to player's inventory
 * @function
 * @param {string} target - Desired object
 * @return {string} Formatted response from action
 */
function takeItem(target) {
  let objects = zone.objects;
  let take = bot.say.actions.take;
  let bsay = vsprintf(getRandomReply(take.false), target);

  for (let o in objects) {
    if (objects[o].id == target) {
      inventory.push(objects[o]);
      objects.splice(o, 1);
      return (vsprintf(getRandomReply(take.true), target));
    }
    for (let a in objects[o].alt) {
      if (objects[o].alt[a] == target) {
        inventory.push(objects[o]);
        objects.splice(o, 1);
        return (vsprintf(getRandomReply(take.true), target));
      }
    }
  }
  return (bsay);
}

/** Attempts to drop target from inventory
 * @function
 * @param {string} target - Object to be dropped
 * @return {string} Formatted response from action
 */
function dropItem(target) {
  let drop = bot.say.actions.drop;
  let i = inventory.findIndex((i) => i.id === target);
  if (i != -1) {
    zone.objects.push(inventory[i]);
    inventory.splice(i, 1);
    return (vsprintf(getRandomReply(drop.true), target));
  }
  return (vsprintf(getRandomReply(drop.false), target));
}

/** Attacks target
 * @function
 * @todo Currently only returns success as attacking has not been implemented
 * @param {string} target - Entity to be attacked
 * @return {string} Formatted response from action
 */
function attackTarget(target) {
  return (vsprintf(getRandomReply(bot.say.actions.attack.true), target));
}

/** Given a target, returns the dictionary response or the item's descriptive \
 * text
 * @function
 * @param {string} topic - The item or topic requested
 * @return {string} Formatted descriptive text
 */
function inquireTopicOrItem(topic) {
  if (worldDict.dict[topic] != null) {
    return (getRandomReply(worldDict.dict[topic].desc));
  } else {
    // Could all be condensed if I change the way I handle no such object
    let objects = zone.objects;

    for (let o = 0; o < objects.length; o++) {
      for (let a = 0; a < objects[o].alt.length; a++) {
        if (objects[o].alt[a] == topic && objects[o].bsay != null) {
          return (objects[o].bsay);
        }
      }
    }
    let i = inventory.findIndex((i) => i.id === topic);
    if (i != -1 && inventory[i].bsay != null) {
      return (inventory[i].bsay);
    }
  }
  return (vsprintf(getRandomReply(bot.say.actions.inquire.false), topic));
}

// ===========================================================================//
//  App Logic
// ===========================================================================//

exports.interactiveStory = functions.https.onRequest((request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  /**
   * @ignore
   * @param {object} app - The app
   */
  function welcome(app) {
    app.ask(getRandomReply(bot.say.small_talk.welcome));
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function help(app) {
    app.ask(getContextHelp());
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function navigate(app) {
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

  /**
   * @ignore
   * @param {object} app - The app
   */
  function look(app) {
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

  /**
   * @ignore
   * @param {object} app - The app
   */
  function inventory(app) {
    app.ask(listInventory());
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function take(app) {
    let target = app.getArgument('target');

    if (target != null) {
      app.ask(takeItem(target.toLowerCase()));
    } else {
      app.ask(getRandomReply(bot.say.actions.take.missing));
    }
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function drop(app) {
    let target = app.getArgument('target');

    if (target != null) {
      app.ask(dropItem(target.toLowerCase()));
    } else {
      app.ask(getRandomReply(bot.say.actions.drop.missing));
    }
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function attack(app) {
    let target = app.getArgument('target');
    if (target != null) {
      app.ask(attackTarget(target.toLowerCase()));
    } else {
      app.ask(getRandomReply(bot.say.actions.attack.missing));
    }
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function inquire(app) {
    let target = app.getArgument('topic');

    if (target != null) {
      app.ask(inquireTopicOrItem(target.toLowerCase()));
    } else {
      app.ask(getRandomReply(bot.say.actions.inquire.missing));
    }
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function unknown(app) {
    axios({
      method: 'get',
      url: 'http://35.197.76.78/s2s?ask=' + encodeURI(app.getRawInput()),
      responseType: 'json',
    })
    .then(function(response) {
      // console.log('STATUS:' + response.status + '\nDATA:\n' + response.data);
      app.ask(response.data);
    })
    .catch(function(err) {
      // console.log(err.message);
      app.ask(getRandomReply(bot.dialogue.actions.help.false));
    });
  }

  /**
   * @ignore
   * @param {object} app - The app
   */
  function listMeta() {
    let meta = 'Title:' + world.name + '\n Info: ';
    for (let e = 0; e < world.meta.length; e++) {
      meta += e + ': ' + world.meta[e] + '\n ';
    }
    app.tell(meta);
  }

  let actionMap = new Map();

  actionMap.set('input.welcome', welcome);
  actionMap.set('input.help', help);
  actionMap.set('input.navigate', navigate);
  actionMap.set('input.look', look);
  actionMap.set('input.take', take);
  actionMap.set('input.drop', drop);
  actionMap.set('input.inventory', inventory);
  actionMap.set('input.attack', attack);
  actionMap.set('input.inquire', inquire);
  actionMap.set('input.unknown', unknown);
  actionMap.set('debug.meta', listMeta);

  app.handleRequest(actionMap);
});
