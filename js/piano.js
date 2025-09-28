const piano = document.getElementById("piano");
let keys = {}, activeNotes = new Set();
let isMouseDown = false;
let mouseNote = null;

const allNotes = Array.from({length:88}, (_, i) => i + 21);
const blackOffsetsInOctave = [1, 3, 6, 8, 10];

const synth = new Tone.Sampler({
  urls: {
    "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
    "A1": "A1.mp3", "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
    "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
    "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
    "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
    "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
    "A6": "A6.mp3", "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
    "A7": "A7.mp3", "C8": "C8.mp3"
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

Tone.loaded().then(() => {
  synth.triggerAttackRelease(["C4", "E4", "G4"], "2n");
});

document.body.addEventListener("mousedown", async () => { 
  await Tone.start(); 
  isMouseDown = true; 
});
document.body.addEventListener("mouseup", () => { 
  isMouseDown = false; 
  if(mouseNote !== null){
    keys[mouseNote]?.classList.remove("active");
    playNoteStop(mouseNote);
    mouseNote = null;
  }
});

function isBlack(midi){ return blackOffsetsInOctave.includes(midi % 12); }

function buildKeyboard(){
  piano.innerHTML = "";
  keys = {};
  const pianoWidth = piano.offsetWidth;

  const numWhiteKeys = allNotes.filter(n => !isBlack(n)).length;
  const whiteKeyWidth = pianoWidth / numWhiteKeys;
  const blackKeyWidth = whiteKeyWidth * 0.6;

  let whiteKeyMap = {};
  let currentWhiteKeyIndex = 0;

  allNotes.forEach(note => {
    if(!isBlack(note)){
      const key = document.createElement("div");
      key.classList.add("key","white");
      key.style.width = whiteKeyWidth + "px";
      key.style.left = (currentWhiteKeyIndex * whiteKeyWidth) + "px";
      piano.appendChild(key);
      keys[note] = key;
      whiteKeyMap[note] = { index: currentWhiteKeyIndex, left: (currentWhiteKeyIndex * whiteKeyWidth) };
      currentWhiteKeyIndex++;
    }
  });

  allNotes.forEach(note => {
    if(isBlack(note)){
      const key = document.createElement("div");
      key.classList.add("key","black");
      key.style.width = blackKeyWidth + "px";

      const noteInOctave = note % 12;
      let leftWhiteNoteMidi;
      if([1,3,6,8,10].includes(noteInOctave)) leftWhiteNoteMidi = note - 1;
      if(leftWhiteNoteMidi && whiteKeyMap[leftWhiteNoteMidi]){
        const whiteKeyLeft = whiteKeyMap[leftWhiteNoteMidi].left;
        key.style.left = (whiteKeyLeft + whiteKeyWidth - (blackKeyWidth / 2)) + "px";
      }

      piano.appendChild(key);
      keys[note] = key;
    }

    Object.values(keys).forEach(key => {
      key.addEventListener("mouseenter", () => {
        key.classList.add("hover");
      });
      key.addEventListener("mouseleave", () => {
        key.classList.remove("hover");
      });
});
    
  });

  piano.addEventListener("mousemove", e => {
    if(!isMouseDown) return;
    const targetKey = e.target.closest(".key");
    if(!targetKey) return;

    const note = parseInt(Object.keys(keys).find(n => keys[n] === targetKey));
    if(note === mouseNote) return;

    if(mouseNote !== null){
      keys[mouseNote]?.classList.remove("active");
      playNoteStop(mouseNote);
    }

    mouseNote = note;
    keys[mouseNote]?.classList.add("active");
    playNoteStart(mouseNote);
  });

  Object.values(keys).forEach(key => {
    key.addEventListener("mousedown", e => {
      const note = parseInt(Object.keys(keys).find(n => keys[n] === key));
      mouseNote = note;
      keys[note].classList.add("active");
      playNoteStart(note);
    });
    key.addEventListener("mouseup", e => {
      const note = parseInt(Object.keys(keys).find(n => keys[n] === key));
      keys[note].classList.remove("active");
      playNoteStop(note);
      mouseNote = null;
    });
  });

  setupKeyboard();
  setupMIDI();
}

function playNoteStart(note, velocity=null){
  const noteName = Tone.Frequency(note,"midi").toNote();
  if(!activeNotes.has(note)){
    activeNotes.add(note);
    let vol = velocity === null ? 0.8 : velocity/127;
    synth.triggerAttack(noteName, undefined, vol);
  }
}

function playNoteStop(note){
  const noteName = Tone.Frequency(note,"midi").toNote();
  synth.triggerRelease(noteName);
  activeNotes.delete(note);
}

const keyMapBase = {
  'a':60,'s':62,'d':64,'f':65,'g':67,'h':69,'j':71,
  'w':61,'e':63,'t':66,'y':68,'u':70,
  'k':72,'l':74,';':76,'\'':77,
  'o':73,'p':75
};
const pressedKeys = {};
let octaveShift = 0;

function setupKeyboard(){
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if(key==='x'){ octaveShift = Math.min(octaveShift+12,36); return; }
    if(key==='z'){ octaveShift = Math.max(octaveShift-12,-36); return; }
    if(keyMapBase[key]!==undefined && !pressedKeys[key]){
      let note = Math.max(21, Math.min(108, keyMapBase[key]+octaveShift));
      pressedKeys[key] = note;
      keys[note]?.classList.add("active");
      playNoteStart(note);
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    const note = pressedKeys[key];
    if(note!==undefined){
      keys[note]?.classList.remove("active");
      playNoteStop(note);
      delete pressedKeys[key];
      e.preventDefault();
    }
  });
}

function setupMIDI(){
  if(navigator.requestMIDIAccess){
    navigator.requestMIDIAccess().then(midi=>{
      for(let input of midi.inputs.values()){
        input.onmidimessage = e=>{
          const [cmd,note,vel] = e.data;
          if(allNotes.includes(note)){
            if(cmd===144 && vel>0){
              keys[note]?.classList.add("active");
              playNoteStart(note,vel);
            } else if(cmd===128 || (cmd===144 && vel===0)){
              keys[note]?.classList.remove("active");
              playNoteStop(note);
            }
          }
        }
      }
    }).catch(err=>{ console.error("MIDI access failed:",err); });
  }
}

window.addEventListener("resize", buildKeyboard);
buildKeyboard();
