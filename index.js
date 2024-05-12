// KalumaJS for making laser-tag like wands

const { IRReceiver } = require("ir-receiver");
const { BuzzerMusic } = require("buzzer-music");
const { PWM } = require("pwm");

const sounds = {
  ["fire"]: "6bagfedc5bagfedc",
  ["empty"]: "1d1d1d1d1d1d",
  ["reload"]: "4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g4g",
  ["reloadDone"]: "5cdefgab",
  ["hit"]:
    "5e---4e---3e---2e---1e---5e---4e---3e---2e---1e---5e---4e---3e---2e---1e---5e---4e---3e---2e---1e---5e---4e---3e---2e---1e---5e---4e---3e---2e---1e---",
  ["dead"]: "2e2e2e-----2e2e2e---2e2e------bagfedc",
};

var DEBUG = true;

const IR_RX_PIN = 15; // pin for IR receiver
const IR_LED_PULSE_PIN = 16; // pin for IR LED digital pulse output
const IR_LED_PWM_PIN = 17; // pin for IR LED 38KHz carrier
const FIRE_BUTTON_PIN = 12; // pin for button
const RELOAD_BUTTON_PIN = 4; // pin for button
const BUZZER_PIN = 26; // pin for buzzer

const playerId = 0xff;
let playerHealth = 30;
let playerShotsLeft = 20;
let isRecharging = false;
let isFiring = false;
let isHit = false;

const ir = new IRReceiver(IR_RX_PIN);
const pwm = new PWM(IR_LED_PWM_PIN, 38000, 0.5);

pinMode(IR_RX_PIN, INPUT_PULLUP);
pinMode(IR_LED_PWM_PIN, OUTPUT);
pinMode(IR_LED_PULSE_PIN, OUTPUT);
pinMode(FIRE_BUTTON_PIN, INPUT_PULLUP);
pinMode(RELOAD_BUTTON_PIN, INPUT_PULLUP);

// random debug LED
if (DEBUG) {
  pinMode(21, OUTPUT);
  digitalWrite(21, HIGH);
}

// number is 0-255, pulses is an array of 64 length to make a 32 bit number (2 pulses per bit)
// each on pulse is 1000, off is 3000.
function getPulses(numberToEncode) {
  return [
    8254, 4196, 575, 1559, 551, 478, 551, 505, 549, 506, 574, 1539, 545, 505,
    551, 503, 576, 477, 577, 478, 575, 479, 576, 480, 576, 478, 576, 478, 576,
    478, 577, 478, 577, 477, 578, 477, 576, 1534, 576, 478, 576, 478, 577, 477,
    578, 1532, 577, 477, 577, 477, 577, 1533, 575, 479, 577, 478, 577, 477, 577,
  ];
}

function handleIRData(data, bits, pulse) {
  if (DEBUG) {
    console.log("IR signal received.");
    console.log(`- data: ${typeof data} ${data.toString(16)} (${bits} bits)`);
    console.log(`- pulse(${pulse.length}): [${pulse.join(",")}]`);
  }

  if (data.toString(16) != "8800448") {
    // console.log(data.toString(), "8800448");
    console.log("Not my signal");
    return;
  }

  if (isHit) {
    // check if player isbeing already hit or dead, if so do nothing
    console.log("Player is being hit");
    return;
  }

  if (isFiring) {
    console.log("Player is firing");
    return;
  }

  // check if player is dead
  if (playerHealth <= 0) {
    console.log("Player is dead.");
    return;
  }

  // reduce health
  playerHealth -= 1;
  console.log(`Player health: ${playerHealth}`);
  isHit = true;
  playSound("hit");

  // check if player is dead
  if (playerHealth <= 0) {
    console.log("Player is dead.");
    // play dead song
    playSound("dead");
    return;
  }

  // set timer for to set isHit to false
  setTimeout(() => {
    isHit = false;
  }, 1000);
}

// send IR signal
function fire() {
  // cannot fire if dead or recharging or being hit
  if (playerHealth <= 0 || isRecharging || isHit || isFiring) {
    return;
  }

  // if no shots left, play recharge song and return
  if (playerShotsLeft <= 0) {
    playSound("empty");
    return;
  }

  isFiring = true;
  pwm.start();
  let pulses = getPulses(playerId);
  pulseWrite(led_pulse, HIGH, pulses);
  digitalWrite(led_pulse, LOW);
  pwm.stop();
  playSound("fire");

  // reduce shots left
  playerShotsLeft -= 1;

  // set timer for 2 s to set isFiring to false
  setTimeout(() => {
    isFiring = false;
  }, 250);

  if (DEBUG) {
    console.log("Sent IR signal.");
    console.log(`- playerId: ${playerId.toString(16)}`);
    console.log(`- pulse(${pulses.length}): [${pulses.join(",")}]`);
    console.log(`Player shots left: ${playerShotsLeft}`);
  }
}

function reload() {
  // cannot reload if dead or recharging or being hit
  if (playerHealth <= 0 || isRecharging) {
    return;
  }

  isRecharging = true;
  playSound("reload");
  // set timer for 2 s to set isRecharging to false
  setTimeout(() => {
    playerShotsLeft = 20;
    isRecharging = false;
    console.log(`Player shots left: ${playerShotsLeft}`);
    playSound("reloadDone");
    // play reload sound
  }, 500);
}

function playSound(soundId) {
  console.log(`Playing sound: ${soundId}`);
  const rhythm = 8; // 8th note
  const tempo = 1620; // 1620 bpm
  const music = new BuzzerMusic(BUZZER_PIN, rhythm, tempo);
  const score = sounds[soundId];

  if (!score) {
    return;
  }

  music.play(score);
}

// set up button watchers
setWatch(fire, FIRE_BUTTON_PIN, FALLING, 100);
setWatch(reload, RELOAD_BUTTON_PIN, FALLING, 100);
// Received an infrared signal
ir.on("data", handleIRData);
