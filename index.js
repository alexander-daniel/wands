// KalumaJS for making laser-tag like wands

const {IRReceiver} = require('ir-receiver');

var memory = [255,255,255,255,255];  // to store received IR signal
var recv = 15;      // pin for IR receiver
var led_pulse = 16; // pin for IR LED digital pulse
var led_pwm = 17;   // pin for IR LED 38KHz carrier
var btn = 12;       // pin for button

pinMode(recv, INPUT_PULLUP);
pinMode(led_pwm, OUTPUT);
pinMode(led_pulse, OUTPUT);
pinMode(btn, INPUT_PULLUP);

// receive IR signal and save to memory
var ir = new IRReceiver(recv);
ir.on('data', (data, bits, pulse) => {
  console.log('IR signal received.');
  console.log(`- data: ${data.toString(16)} (${bits} bits)`);
  console.log(`- pulse(${pulse.length}): [${pulse.join(',')}]`);
  memory = pulse;
});

// send IR signal stored in memory
function send() {
  analogWrite(led_pwm, 0.5, 38000); // 38KHz
  pulseWrite(led_pulse, HIGH, memory);
  digitalWrite(led_pulse, LOW);
  console.log('Sent IR signal.');
}

// send signal when button pressed
setWatch(send, btn, FALLING, 10);