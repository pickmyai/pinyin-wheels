/* Curated common characters: one distinct character per syllable, with only valid initial/final/tone combinations. */
const WORDS = [
  {id:'ba1',i:'b',f:'a',t:1,h:'八',m:'數字八',e:'8️⃣'},
  {id:'ba3',i:'b',f:'a',t:3,h:'把',m:'一把雨傘',e:'☂️'},
  {id:'ba4',i:'b',f:'a',t:4,h:'爸',m:'爸爸',e:'👨'},
  {id:'bo1',i:'b',f:'o',t:1,h:'波',m:'水波',e:'🌊'},
  {id:'bi3',i:'b',f:'i',t:3,h:'筆',m:'鉛筆',e:'✏️'},
  {id:'bi4',i:'b',f:'i',t:4,h:'閉',m:'關閉',e:'🚪'},
  {id:'bu3',i:'b',f:'u',t:3,h:'補',m:'修補',e:'🧵'},
  {id:'bu4',i:'b',f:'u',t:4,h:'布',m:'布料',e:'🧣'},
  {id:'pa1',i:'p',f:'a',t:1,h:'趴',m:'趴下',e:'🐈'},
  {id:'pa2',i:'p',f:'a',t:2,h:'爬',m:'爬山',e:'🧗'},
  {id:'pa4',i:'p',f:'a',t:4,h:'怕',m:'害怕',e:'😮'},
  {id:'po1',i:'p',f:'o',t:1,h:'坡',m:'山坡',e:'⛰️'},
  {id:'po2',i:'p',f:'o',t:2,h:'婆',m:'婆婆',e:'👵'},
  {id:'po4',i:'p',f:'o',t:4,h:'破',m:'破了',e:'💥'},
  {id:'pi2',i:'p',f:'i',t:2,h:'皮',m:'皮球',e:'⚽'},
  {id:'pu3',i:'p',f:'u',t:3,h:'普',m:'普通',e:'📚'},
  {id:'ma1',i:'m',f:'a',t:1,h:'媽',m:'媽媽',e:'👩'},
  {id:'ma2',i:'m',f:'a',t:2,h:'麻',m:'芝麻',e:'🌱'},
  {id:'ma3',i:'m',f:'a',t:3,h:'馬',m:'小馬',e:'🐴'},
  {id:'ma4',i:'m',f:'a',t:4,h:'罵',m:'責罵',e:'💬'},
  {id:'mo1',i:'m',f:'o',t:1,h:'摸',m:'觸摸',e:'✋'},
  {id:'mo2',i:'m',f:'o',t:2,h:'魔',m:'魔法',e:'🪄'},
  {id:'mo4',i:'m',f:'o',t:4,h:'墨',m:'墨水',e:'🖋️'},
  {id:'mi2',i:'m',f:'i',t:2,h:'迷',m:'迷路',e:'🧭'},
  {id:'mi3',i:'m',f:'i',t:3,h:'米',m:'米飯',e:'🍚'},
  {id:'mi4',i:'m',f:'i',t:4,h:'蜜',m:'蜂蜜',e:'🍯'},
  {id:'mu3',i:'m',f:'u',t:3,h:'母',m:'母親',e:'👩‍👧'},
  {id:'mu4',i:'m',f:'u',t:4,h:'木',m:'木頭',e:'🪵'},
  {id:'fa1',i:'f',f:'a',t:1,h:'發',m:'出發',e:'🚀'},
  {id:'fa2',i:'f',f:'a',t:2,h:'罰',m:'處罰',e:'📋'},
  {id:'fa3',i:'f',f:'a',t:3,h:'法',m:'方法',e:'🧩'},
  {id:'fu1',i:'f',f:'u',t:1,h:'夫',m:'農夫',e:'🧑‍🌾'},
  {id:'fu2',i:'f',f:'u',t:2,h:'福',m:'福氣',e:'🧧'},
  {id:'fu3',i:'f',f:'u',t:3,h:'斧',m:'斧頭',e:'🪓'},
  {id:'fu4',i:'f',f:'u',t:4,h:'父',m:'父親',e:'👨‍👧'},
  {id:'da1',i:'d',f:'a',t:1,h:'搭',m:'搭車',e:'🚍'},
  {id:'da3',i:'d',f:'a',t:3,h:'打',m:'打球',e:'🏀'},
  {id:'da4',i:'d',f:'a',t:4,h:'大',m:'很大',e:'🐘'},
  {id:'de2',i:'d',f:'e',t:2,h:'德',m:'品德',e:'💛'},
  {id:'di1',i:'d',f:'i',t:1,h:'低',m:'高低',e:'📉'},
  {id:'di2',i:'d',f:'i',t:2,h:'笛',m:'笛子',e:'🎶'},
  {id:'di3',i:'d',f:'i',t:3,h:'底',m:'底部',e:'⬇️'},
  {id:'di4',i:'d',f:'i',t:4,h:'弟',m:'弟弟',e:'👦'},
  {id:'du2',i:'d',f:'u',t:2,h:'讀',m:'閱讀',e:'📖'},
  {id:'du4',i:'d',f:'u',t:4,h:'肚',m:'肚子',e:'🍽️'},
  {id:'ta1',i:'t',f:'a',t:1,h:'他',m:'他們',e:'🧒'},
  {id:'ta3',i:'t',f:'a',t:3,h:'塔',m:'高塔',e:'🗼'},
  {id:'ta4',i:'t',f:'a',t:4,h:'踏',m:'踏步',e:'👣'},
  {id:'te4',i:'t',f:'e',t:4,h:'特',m:'特別',e:'⭐'},
  {id:'ti1',i:'t',f:'i',t:1,h:'梯',m:'梯子',e:'🪜'},
  {id:'ti2',i:'t',f:'i',t:2,h:'題',m:'題目',e:'📝'},
  {id:'ti3',i:'t',f:'i',t:3,h:'體',m:'身體',e:'💪'},
  {id:'ti4',i:'t',f:'i',t:4,h:'替',m:'代替',e:'🔄'},
  {id:'tu1',i:'t',f:'u',t:1,h:'突',m:'突然',e:'⚡'},
  {id:'tu2',i:'t',f:'u',t:2,h:'圖',m:'圖畫',e:'🖼️'},
  {id:'tu3',i:'t',f:'u',t:3,h:'土',m:'泥土',e:'🌱'},
  {id:'tu4',i:'t',f:'u',t:4,h:'兔',m:'兔子',e:'🐰'},
  {id:'na2',i:'n',f:'a',t:2,h:'拿',m:'拿起',e:'🤲'},
  {id:'na3',i:'n',f:'a',t:3,h:'哪',m:'哪一個',e:'❔'},
  {id:'na4',i:'n',f:'a',t:4,h:'那',m:'那邊',e:'👉'},
  {id:'ni2',i:'n',f:'i',t:2,h:'泥',m:'泥巴',e:'🪴'},
  {id:'ni3',i:'n',f:'i',t:3,h:'你',m:'你我',e:'🙂'},
  {id:'ni4',i:'n',f:'i',t:4,h:'逆',m:'逆向',e:'↩️'},
  {id:'nu3',i:'n',f:'u',t:3,h:'努',m:'努力',e:'💪'},
  {id:'nu4',i:'n',f:'u',t:4,h:'怒',m:'憤怒',e:'😠'},
  {id:'nv3',i:'n',f:'ü',t:3,h:'女',m:'女孩',e:'👧'},
  {id:'la1',i:'l',f:'a',t:1,h:'拉',m:'拉手',e:'🤝'},
  {id:'la4',i:'l',f:'a',t:4,h:'辣',m:'辣椒',e:'🌶️'},
  {id:'li2',i:'l',f:'i',t:2,h:'梨',m:'雪梨',e:'🍐'},
  {id:'li3',i:'l',f:'i',t:3,h:'李',m:'李子',e:'🍑'},
  {id:'li4',i:'l',f:'i',t:4,h:'力',m:'力量',e:'💪'},
  {id:'lu2',i:'l',f:'u',t:2,h:'爐',m:'火爐',e:'🔥'},
  {id:'lu4',i:'l',f:'u',t:4,h:'路',m:'道路',e:'🛣️'},
  {id:'lv4',i:'l',f:'ü',t:4,h:'綠',m:'綠色',e:'🟢'},
  {id:'ge1',i:'g',f:'e',t:1,h:'哥',m:'哥哥',e:'👦'},
  {id:'ge2',i:'g',f:'e',t:2,h:'格',m:'方格',e:'🔲'},
  {id:'ge4',i:'g',f:'e',t:4,h:'個',m:'一個',e:'1️⃣'},
  {id:'gu1',i:'g',f:'u',t:1,h:'姑',m:'姑姑',e:'👩'},
  {id:'gu3',i:'g',f:'u',t:3,h:'鼓',m:'打鼓',e:'🥁'},
  {id:'gu4',i:'g',f:'u',t:4,h:'顧',m:'照顧',e:'🤲'},
  {id:'ke1',i:'k',f:'e',t:1,h:'科',m:'科學',e:'🔬'},
  {id:'ke3',i:'k',f:'e',t:3,h:'可',m:'可以',e:'👍'},
  {id:'ke4',i:'k',f:'e',t:4,h:'課',m:'上課',e:'📚'},
  {id:'ku1',i:'k',f:'u',t:1,h:'哭',m:'哭泣',e:'😢'},
  {id:'ku3',i:'k',f:'u',t:3,h:'苦',m:'苦味',e:'🍵'},
  {id:'ku4',i:'k',f:'u',t:4,h:'酷',m:'很酷',e:'😎'},
  {id:'ha1',i:'h',f:'a',t:1,h:'哈',m:'哈哈笑',e:'😄'},
  {id:'he1',i:'h',f:'e',t:1,h:'喝',m:'喝水',e:'🥛'},
  {id:'he2',i:'h',f:'e',t:2,h:'河',m:'小河',e:'🏞️'},
  {id:'he4',i:'h',f:'e',t:4,h:'賀',m:'祝賀',e:'🎉'},
  {id:'hu1',i:'h',f:'u',t:1,h:'呼',m:'呼吸',e:'🌬️'},
  {id:'hu2',i:'h',f:'u',t:2,h:'湖',m:'湖水',e:'🏞️'},
  {id:'hu3',i:'h',f:'u',t:3,h:'虎',m:'老虎',e:'🐯'},
  {id:'hu4',i:'h',f:'u',t:4,h:'戶',m:'住戶',e:'🏠'},
  {id:'ji1',i:'j',f:'i',t:1,h:'雞',m:'小雞',e:'🐥'},
  {id:'ji2',i:'j',f:'i',t:2,h:'急',m:'着急',e:'⏰'},
  {id:'ji3',i:'j',f:'i',t:3,h:'擠',m:'擠在一起',e:'🫂'},
  {id:'ji4',i:'j',f:'i',t:4,h:'記',m:'記住',e:'📝'},
  {id:'qi1',i:'q',f:'i',t:1,h:'七',m:'數字七',e:'7️⃣'},
  {id:'qi2',i:'q',f:'i',t:2,h:'旗',m:'旗子',e:'🚩'},
  {id:'qi3',i:'q',f:'i',t:3,h:'起',m:'起床',e:'🛏️'},
  {id:'qi4',i:'q',f:'i',t:4,h:'氣',m:'空氣',e:'💨'},
  {id:'xi1',i:'x',f:'i',t:1,h:'西',m:'西邊',e:'🌅'},
  {id:'xi2',i:'x',f:'i',t:2,h:'席',m:'座席',e:'💺'},
  {id:'xi3',i:'x',f:'i',t:3,h:'洗',m:'洗手',e:'🧼'},
  {id:'xi4',i:'x',f:'i',t:4,h:'戲',m:'遊戲',e:'🎭'}
];
const VOWELS={a:['ā','á','ǎ','à'],o:['ō','ó','ǒ','ò'],e:['ē','é','ě','è'],i:['ī','í','ǐ','ì'],u:['ū','ú','ǔ','ù'],ü:['ǖ','ǘ','ǚ','ǜ']};
const TONES=['—','／','∨','＼'];
const STAGES=['聲母','韻母','聲調','漢字'];
const PROGRESS_KEY='pinyin-wheels-progress-v2';
const $=selector=>document.querySelector(selector);
const mark=w=>VOWELS[w.f][w.t-1];
const syllable=w=>w.i+mark(w);
function shuffle(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}

let progress={spin:0,quiz:0};
try{const saved=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');progress.spin=Math.min(5,Math.max(0,Number(saved.spin)||0));progress.quiz=Math.min(5,Math.max(0,Number(saved.quiz)||0))}catch{}
let currentWord=null,lastWord=null,spinPool=[],spinGeneration=0,spinning=false,spinAnswered=false,readCredited=false;
let quizPool=shuffle(WORDS),quizWords=[],quizIndex=0,phase=0,locked=false,misses=0;
let recorder=null,recordStream=null,recordChunks=[],recordUrl=null,recordTimer=null,recordAudio=null;
let demonstrationAudio=null;
const DEMONSTRATION_AUDIO_PATH='assets/pinyin/audio/azure-v1';

function save(){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress))}catch{}updateProgress()}
function updateProgress(){
  $('#star-count').textContent=`★ ${progress.spin+progress.quiz} 顆星`;
  $('#spin-progress').textContent=`${progress.spin} / 5 次`;
  $('#quiz-progress').textContent=quizWords.length?`第 ${Math.min(quizIndex+1,5)} / 5 題`:'第 1 / 5 題';
}
function setMode(mode){
  stopDemonstration();
  const listening=mode==='listen';
  $('#tab-spin').classList.toggle('active',!listening);$('#tab-spin').setAttribute('aria-selected',String(!listening));
  $('#tab-listen').classList.toggle('active',listening);$('#tab-listen').setAttribute('aria-selected',String(listening));
  $('#spin-panel').classList.toggle('hidden',listening);$('#listen-panel').classList.toggle('hidden',!listening);
  if(listening&&!quizWords.length)startQuiz();
  if(recorder?.state==='recording')stopRecording();
}
$('#tab-spin').addEventListener('click',()=>setMode('spin'));
$('#tab-listen').addEventListener('click',()=>setMode('listen'));
$('#go-listen').addEventListener('click',()=>{setMode('listen');$('#game').scrollIntoView({behavior:'smooth'})});
let resetPending=false,resetTimer=null;
$('#reset-progress').addEventListener('click',()=>{
  if(!resetPending){resetPending=true;$('#reset-progress').textContent='再按一次確認';resetTimer=setTimeout(()=>{resetPending=false;$('#reset-progress').textContent='重設練習'},5000);return}
  clearTimeout(resetTimer);resetPending=false;$('#reset-progress').textContent='重設練習';
  progress={spin:0,quiz:0};save();spinGeneration++;spinning=false;currentWord=null;lastWord=null;spinPool=[];quizWords=[];quizIndex=0;phase=0;
  $('#initial-value').textContent='?';$('#final-value').textContent='?';$('#tone-value').textContent='?';
  $('#spin-result').classList.add('hidden');$('#spin-question').classList.add('hidden');$('#record-panel').classList.add('hidden');$('#spin-button').disabled=false;$('#spin-button').innerHTML='<span aria-hidden="true">↻</span> 轉一轉';
  setMode('spin');
});

function flashStars(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const layer=document.createElement('div');layer.className='confetti';
  for(let n=0;n<25;n++){const bit=document.createElement('i');bit.style.left=`${Math.random()*100}%`;bit.style.background=['#f78366','#62c7c1','#f7c65e','#9bd3a0'][n%4];bit.style.animationDelay=`${Math.random()*.4}s`;layer.append(bit)}
  document.body.append(layer);setTimeout(()=>layer.remove(),2200);
}
function spin(){
  if(spinning)return;
  stopDemonstration();
  if(recorder?.state==='recording')stopRecording();
  if(!spinPool.length)spinPool=shuffle(WORDS.filter(w=>w!==lastWord));
  currentWord=spinPool.pop();lastWord=currentWord;spinning=true;spinAnswered=false;readCredited=false;
  const generation=++spinGeneration;
  $('#spin-button').disabled=true;$('#spin-result').classList.add('hidden');$('#spin-question').classList.add('hidden');$('#record-panel').classList.add('hidden');
  for(const node of document.querySelectorAll('.wheel-disc')){node.classList.remove('spinning');void node.offsetWidth;node.classList.add('spinning')}
  setTimeout(()=>{
    if(generation!==spinGeneration)return;
    for(const node of document.querySelectorAll('.wheel-disc'))node.classList.remove('spinning');
    $('#initial-value').textContent=currentWord.i;$('#final-value').textContent=currentWord.f;$('#tone-value').textContent=TONES[currentWord.t-1];
    $('#result-initial').textContent=currentWord.i;$('#result-final').textContent=mark(currentWord);$('#result-pinyin').textContent=syllable(currentWord);
    $('#result-hanzi').textContent=currentWord.h;$('#result-meaning').textContent=currentWord.m;$('#result-emoji').textContent=currentWord.e;
    $('#result-emoji').classList.add('hidden');$('#result-word').classList.add('hidden');
    $('#spin-result').classList.remove('hidden');showSpinQuestion(currentWord);$('#record-status').textContent='';
    $('#play-recording').disabled=true;$('#read-done').disabled=false;$('#read-done').textContent=progress.spin<5?'我讀好了 ★':'我讀好了';if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl=null}
    spinning=false;$('#spin-button').innerHTML='請先完成拼讀';
  },1100);
}
$('#spin-button').addEventListener('click',spin);
function characterOptions(word){
  const others=shuffle(WORDS.filter(w=>w.h!==word.h));
  const similarity=other=>Number(other.i===word.i)*2+Number(other.f===word.f);
  others.sort((a,b)=>similarity(b)-similarity(a));
  return shuffle([word,...others.slice(0,3)]);
}
function showSpinQuestion(word){
  $('#spin-options').innerHTML=characterOptions(word).map(w=>`<button class="choice" type="button" data-answer="${w.h}" aria-label="選擇 ${w.h}">${w.h}</button>`).join('');
  $('#spin-feedback').textContent='請選出與拼音相符的漢字。';
  $('#spin-feedback').classList.remove('try');
  $('#spin-question').classList.remove('hidden');
  for(const button of document.querySelectorAll('#spin-options .choice'))button.onclick=()=>answerSpin(button);
}
function answerSpin(button){
  if(spinAnswered||!currentWord)return;
  if(button.dataset.answer!==currentWord.h){
    button.classList.remove('wrong');void button.offsetWidth;button.classList.add('wrong');
    $('#spin-feedback').classList.add('try');$('#spin-feedback').textContent='再看看拼音，並聆聽示範讀音。';return;
  }
  spinAnswered=true;button.classList.add('correct');$('#spin-feedback').classList.remove('try');$('#spin-feedback').textContent='回答正確！請朗讀這個字。';
  const generation=spinGeneration;
  setTimeout(()=>{
    if(generation!==spinGeneration)return;
    $('#spin-question').classList.add('hidden');$('#result-emoji').classList.remove('hidden');$('#result-word').classList.remove('hidden');
    $('#record-panel').classList.remove('hidden');
  },400);
}
$('#read-done').addEventListener('click',()=>{
  if(readCredited||!currentWord||!spinAnswered)return;
  readCredited=true;$('#read-done').disabled=true;$('#read-done').textContent='朗讀完成 ✓';
  $('#record-status').textContent='做得好！你可以轉動下一個拼音。';
  $('#spin-button').disabled=false;$('#spin-button').innerHTML='<span aria-hidden="true">↻</span> 再轉一次';
  if(progress.spin<5){progress.spin++;save();flashStars()}
});

function audioStatus(message=''){
  $('#audio-status').textContent=message;
  $('#audio-status').classList.toggle('hidden',!message);
}
function stopDemonstration(){
  if(demonstrationAudio){demonstrationAudio.pause();demonstrationAudio=null}
  audioStatus();
}
function playWord(word){
  if(!word)return;
  stopDemonstration();recordAudio?.pause();
  const sound=new Audio(`${DEMONSTRATION_AUDIO_PATH}/${word.id}.mp3`);
  demonstrationAudio=sound;
  sound.preload='auto';
  const failed=()=>{
    if(demonstrationAudio!==sound)return;
    audioStatus('讀音暫時無法載入，請檢查網絡後再次按下播放。');
  };
  sound.onerror=failed;
  sound.onended=()=>{if(demonstrationAudio===sound)audioStatus()};
  sound.play().catch(error=>{
    if(demonstrationAudio!==sound)return;
    if(error.name==='NotAllowedError')audioStatus('請再次按下播放讀音。');
    else failed();
  });
}
$('#speak-spin').addEventListener('click',()=>playWord(currentWord));

async function startRecording(){
  stopDemonstration();recordAudio?.pause();
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){$('#record-status').textContent='這個瀏覽器未能錄音；你仍可以聆聽示範讀音並繼續遊戲。';return}
  try{
    recordStream=await navigator.mediaDevices.getUserMedia({audio:true});
    recordChunks=[];recorder=new MediaRecorder(recordStream);
    recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};
    recorder.onstop=()=>{
      clearTimeout(recordTimer);recordStream?.getTracks().forEach(t=>t.stop());recordStream=null;
      if(recordUrl)URL.revokeObjectURL(recordUrl);
      recordUrl=URL.createObjectURL(new Blob(recordChunks,{type:recorder.mimeType||'audio/webm'}));
      $('#play-recording').disabled=false;$('#record-status').textContent='錄音完成！請播放並聆聽自己的讀音。';
      $('#record-button').textContent='🎙️ 重新錄音';$('#record-button').classList.remove('recording');
    };
    recorder.start();$('#record-button').textContent='■ 停止錄音';$('#record-button').classList.add('recording');$('#record-status').textContent='錄音中…請讀出上面的拼音。最多錄 8 秒。';
    recordTimer=setTimeout(stopRecording,8000);
  }catch{$('#record-status').textContent='未取得麥克風權限。你仍可以繼續遊戲；如要錄音，請允許瀏覽器使用麥克風。'}
}
function stopRecording(){if(recorder?.state==='recording')recorder.stop()}
$('#record-button').addEventListener('click',()=>recorder?.state==='recording'?stopRecording():startRecording());
$('#play-recording').addEventListener('click',()=>{if(!recordUrl)return;stopDemonstration();recordAudio?.pause();recordAudio=new Audio(recordUrl);recordAudio.play()});

function startQuiz(){
  if(quizPool.length<5)quizPool=shuffle(WORDS.filter(w=>!quizWords.includes(w)));
  quizWords=quizPool.splice(0,5);quizIndex=0;phase=0;misses=0;renderQuiz();
}
function currentQuizWord(){return quizWords[quizIndex]}
function alternatives(correct,pool){return shuffle([correct,...shuffle([...new Set(pool)].filter(v=>v!==correct)).slice(0,3)])}
function optionsFor(word){
  if(phase===0)return alternatives(word.i,WORDS.map(w=>w.i));
  if(phase===1)return alternatives(word.f,Object.keys(VOWELS));
  if(phase===2)return shuffle(TONES);
  return characterOptions(word).map(w=>w.h);
}
function correctFor(word){return phase===0?word.i:phase===1?word.f:phase===2?TONES[word.t-1]:word.h}
function renderQuiz(){
  stopDemonstration();
  updateProgress();
  if(quizIndex>=5){$('#quiz-body').innerHTML=`<div class="quiz-final"><div class="complete-icon" aria-hidden="true">🏆</div><h4>解碼成功！</h4><p>你完成了 5 個聽音任務，獲得一枚拼音徽章！</p><button id="quiz-again" class="primary-button" type="button">再挑戰 5 題 ↻</button></div>`;$('#quiz-again').onclick=startQuiz;flashStars();return}
  const word=currentQuizWord();const steps=STAGES.map((s,n)=>`<span class="quiz-step ${n<phase?'done':n===phase?'current':''}">${n<phase?'✓ ':''}${s}</span>`).join('');
  const question=['這個音節的聲母是甚麼？','這個音節的韻母是甚麼？','這個音節是第幾聲？','最後，這個音節對應哪個漢字？'][phase];
  $('#quiz-body').innerHTML=`<div class="quiz-prompt"><span class="quiz-mascot" aria-hidden="true">🦊</span><div><h4>聽音任務開始！</h4><p>請按喇叭，仔細聆聽。</p></div><button id="quiz-play" class="quiz-play" type="button">🔊 播放讀音</button></div><div class="quiz-step-row">${steps}</div><h4 class="quiz-question">${question}</h4><div class="choice-grid">${optionsFor(word).map(o=>`<button class="choice" type="button" data-answer="${o}" aria-label="選擇 ${o}">${o}</button>`).join('')}</div><div id="quiz-feedback" class="feedback-line" role="status" aria-live="polite">如果選錯，可以再次聆聽並重試。</div>`;
  $('#quiz-play').onclick=()=>playWord(word);
  for(const button of document.querySelectorAll('.choice'))button.onclick=()=>choose(button);
}
function choose(button){
  if(locked)return;
  const right=correctFor(currentQuizWord());const value=button.dataset.answer;
  if(value!==right){misses++;button.classList.remove('wrong');void button.offsetWidth;button.classList.add('wrong');$('#quiz-feedback').classList.add('try');$('#quiz-feedback').textContent=misses<2?'請再聆聽一次，仔細思考。':`提示：正確選項是「${right}」。請聆聽後再選擇。`;return}
  locked=true;button.classList.add('correct');$('#quiz-feedback').classList.remove('try');$('#quiz-feedback').textContent='回答正確！★';
  setTimeout(()=>{phase++;misses=0;locked=false;if(phase<4)renderQuiz();else completeQuizWord()},550);
}
function completeQuizWord(){
  stopDemonstration();
  const word=currentQuizWord();
  if(progress.quiz<5){progress.quiz++;save()}
  $('#quiz-body').innerHTML=`<div class="quiz-complete"><span class="complete-icon" aria-hidden="true">${word.e}</span><p>你成功拼出這個聲音！</p><div><span class="big-pinyin">${syllable(word)}</span><span class="big-hanzi">${word.h}</span></div><p>${word.m}</p><button id="complete-listen" class="sound-button" type="button">🔊 再聽一次</button><br><button id="next-quiz" class="primary-button quiz-next" type="button">${quizIndex===4?'完成挑戰':'下一個聲音 →'}</button></div>`;
  $('#complete-listen').onclick=()=>playWord(word);
  $('#next-quiz').onclick=()=>{quizIndex++;phase=0;renderQuiz()};
  flashStars();
}
updateProgress();
