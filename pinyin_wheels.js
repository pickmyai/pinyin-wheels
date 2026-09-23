/* Each entry is an attested, everyday syllable. The wheels choose complete entries so they never make impossible combinations. */
const WORDS = [
  {id:'ba1',i:'b',f:'a',t:1,h:'八',m:'數字八',e:'8️⃣'},
  {id:'ba4',i:'b',f:'a',t:4,h:'爸',m:'爸爸',e:'👨'},
  {id:'bo1',i:'b',f:'o',t:1,h:'波',m:'水波',e:'🌊'},
  {id:'po1',i:'p',f:'o',t:1,h:'坡',m:'山坡',e:'⛰️'},
  {id:'po4',i:'p',f:'o',t:4,h:'破',m:'破了',e:'💥'},
  {id:'ma1',i:'m',f:'a',t:1,h:'媽',m:'媽媽',e:'👩'},
  {id:'ma3',i:'m',f:'a',t:3,h:'馬',m:'小馬',e:'🐴'},
  {id:'mi3',i:'m',f:'i',t:3,h:'米',m:'米飯',e:'🍚'},
  {id:'mo2',i:'m',f:'o',t:2,h:'魔',m:'魔法',e:'🪄'},
  {id:'fu2',i:'f',f:'u',t:2,h:'福',m:'福氣',e:'🧧'},
  {id:'fu4',i:'f',f:'u',t:4,h:'父',m:'父親',e:'👨‍👧'},
  {id:'da4',i:'d',f:'a',t:4,h:'大',m:'很大',e:'🐘'},
  {id:'di1',i:'d',f:'i',t:1,h:'低',m:'高低',e:'📉'},
  {id:'tu4',i:'t',f:'u',t:4,h:'兔',m:'兔子',e:'🐰'},
  {id:'na4',i:'n',f:'a',t:4,h:'那',m:'那邊',e:'👉'},
  {id:'nv3',i:'n',f:'ü',t:3,h:'女',m:'女孩',e:'👧'},
  {id:'lu4',i:'l',f:'u',t:4,h:'路',m:'道路',e:'🛣️'},
  {id:'ge1',i:'g',f:'e',t:1,h:'哥',m:'哥哥',e:'👦'},
  {id:'ke3',i:'k',f:'e',t:3,h:'可',m:'可以',e:'👍'},
  {id:'he2',i:'h',f:'e',t:2,h:'河',m:'小河',e:'🏞️'},
  {id:'ji1',i:'j',f:'i',t:1,h:'雞',m:'小雞',e:'🐥'},
  {id:'qi1',i:'q',f:'i',t:1,h:'七',m:'數字七',e:'7️⃣'},
  {id:'xi1',i:'x',f:'i',t:1,h:'西',m:'西邊',e:'🌅'}
];
const VOWELS={a:['ā','á','ǎ','à'],o:['ō','ó','ǒ','ò'],e:['ē','é','ě','è'],i:['ī','í','ǐ','ì'],u:['ū','ú','ǔ','ù'],ü:['ǖ','ǘ','ǚ','ǜ']};
const TONES=['—','／','∨','＼'];
const STAGES=['聲母','韻母','聲調','漢字'];
const PROGRESS_KEY='pinyin-wheels-progress-v2';
const $=selector=>document.querySelector(selector);
const mark=w=>VOWELS[w.f][w.t-1];
const syllable=w=>w.i+mark(w);
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const pick=a=>a[Math.floor(Math.random()*a.length)];

let progress={spin:0,quiz:0};
try{const saved=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');progress.spin=Math.min(5,Math.max(0,Number(saved.spin)||0));progress.quiz=Math.min(5,Math.max(0,Number(saved.quiz)||0))}catch{}
let currentWord=null,lastWord=null,spinning=false,readCredited=false,quizWords=[],quizIndex=0,phase=0,locked=false,misses=0;
let recorder=null,recordStream=null,recordChunks=[],recordUrl=null,recordTimer=null,recordAudio=null;

function save(){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress))}catch{}updateProgress()}
function updateProgress(){
  $('#star-count').textContent=`★ ${progress.spin+progress.quiz} 顆星`;
  $('#spin-progress').textContent=`${progress.spin} / 5 次`;
  $('#quiz-progress').textContent=quizWords.length?`第 ${Math.min(quizIndex+1,5)} / 5 題`:'第 1 / 5 題';
}
function setMode(mode){
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
  progress={spin:0,quiz:0};save();currentWord=null;lastWord=null;quizWords=[];quizIndex=0;phase=0;
  $('#initial-value').textContent='?';$('#final-value').textContent='?';$('#tone-value').textContent='?';
  $('#spin-result').classList.add('hidden');$('#record-panel').classList.add('hidden');$('#spin-button').innerHTML='<span aria-hidden="true">↻</span> 轉一轉';
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
  if(recorder?.state==='recording')stopRecording();
  const candidates=WORDS.filter(w=>w!==lastWord);
  currentWord=pick(candidates);lastWord=currentWord;spinning=true;readCredited=false;
  $('#spin-button').disabled=true;$('#spin-result').classList.add('hidden');$('#record-panel').classList.add('hidden');
  for(const node of document.querySelectorAll('.wheel-disc')){node.classList.remove('spinning');void node.offsetWidth;node.classList.add('spinning')}
  setTimeout(()=>{
    for(const node of document.querySelectorAll('.wheel-disc'))node.classList.remove('spinning');
    $('#initial-value').textContent=currentWord.i;$('#final-value').textContent=currentWord.f;$('#tone-value').textContent=TONES[currentWord.t-1];
    $('#result-initial').textContent=currentWord.i;$('#result-final').textContent=mark(currentWord);$('#result-pinyin').textContent=syllable(currentWord);
    $('#result-hanzi').textContent=currentWord.h;$('#result-meaning').textContent=currentWord.m;$('#result-emoji').textContent=currentWord.e;
    $('#spin-result').classList.remove('hidden');$('#record-panel').classList.remove('hidden');$('#record-status').textContent='';
    $('#play-recording').disabled=true;$('#read-done').disabled=false;$('#read-done').textContent='我讀好了 ★';if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl=null}
    spinning=false;$('#spin-button').disabled=false;$('#spin-button').innerHTML='<span aria-hidden="true">↻</span> 再轉一次';
  },1100);
}
$('#spin-button').addEventListener('click',spin);
$('#read-done').addEventListener('click',()=>{
  if(readCredited||!currentWord)return;
  readCredited=true;$('#read-done').disabled=true;$('#read-done').textContent='讀好啦 ✓';
  $('#record-status').textContent='叻！想再試就轉下一個聲音。';
  if(progress.spin<5){progress.spin++;save();flashStars()}
});

function playWord(word){
  if(!word)return;
  if('speechSynthesis'in window)speechSynthesis.cancel();
  const sound=new Audio(`assets/pinyin/audio/${word.id}.m4a`);
  sound.onerror=()=>{if(!('speechSynthesis'in window)){alert('這個瀏覽器暫時無法播放示範聲音。');return}const u=new SpeechSynthesisUtterance(word.h);u.lang='zh-CN';u.rate=.72;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang.toLowerCase()==='zh-cn')||null;speechSynthesis.speak(u)};
  sound.play().catch(()=>sound.onerror());
}
$('#speak-spin').addEventListener('click',()=>playWord(currentWord));

async function startRecording(){
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){$('#record-status').textContent='這個瀏覽器未能錄音；你仍可以聽示範讀音同玩第二關。';return}
  try{
    recordStream=await navigator.mediaDevices.getUserMedia({audio:true});
    recordChunks=[];recorder=new MediaRecorder(recordStream);
    recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};
    recorder.onstop=()=>{
      clearTimeout(recordTimer);recordStream?.getTracks().forEach(t=>t.stop());recordStream=null;
      if(recordUrl)URL.revokeObjectURL(recordUrl);
      recordUrl=URL.createObjectURL(new Blob(recordChunks,{type:recorder.mimeType||'audio/webm'}));
      $('#play-recording').disabled=false;$('#record-status').textContent='錄好啦！按「播放自己讀音」聽一聽。';
      $('#record-button').textContent='🎙️ 重新錄音';$('#record-button').classList.remove('recording');
    };
    recorder.start();$('#record-button').textContent='■ 停止錄音';$('#record-button').classList.add('recording');$('#record-status').textContent='錄音中…請讀出上面的拼音。最多錄 8 秒。';
    recordTimer=setTimeout(stopRecording,8000);
  }catch{$('#record-status').textContent='未取得咪高風權限。你仍可以繼續玩；如要錄音，請容許瀏覽器使用咪高風。'}
}
function stopRecording(){if(recorder?.state==='recording')recorder.stop()}
$('#record-button').addEventListener('click',()=>recorder?.state==='recording'?stopRecording():startRecording());
$('#play-recording').addEventListener('click',()=>{if(!recordUrl)return;recordAudio?.pause();recordAudio=new Audio(recordUrl);recordAudio.play()});

function startQuiz(){
  quizWords=shuffle(WORDS).slice(0,5);quizIndex=0;phase=0;misses=0;renderQuiz();
}
function currentQuizWord(){return quizWords[quizIndex]}
function alternatives(correct,pool){return shuffle([correct,...shuffle([...new Set(pool)].filter(v=>v!==correct)).slice(0,3)])}
function optionsFor(word){
  if(phase===0)return alternatives(word.i,WORDS.map(w=>w.i));
  if(phase===1)return alternatives(mark(word),Object.keys(VOWELS).map(v=>VOWELS[v][word.t-1]));
  if(phase===2)return shuffle(TONES);
  const wrong=shuffle(WORDS.filter(w=>w.h!==word.h&&w.id!==word.id)).slice(0,3).map(w=>w.h);
  return shuffle([word.h,...wrong]);
}
function correctFor(word){return phase===0?word.i:phase===1?mark(word):phase===2?TONES[word.t-1]:word.h}
function renderQuiz(){
  updateProgress();
  if(quizIndex>=5){$('#quiz-body').innerHTML=`<div class="quiz-final"><div class="complete-icon" aria-hidden="true">🏆</div><h4>解碼成功！</h4><p>你完成咗 5 個聲音任務。狐狸博士送你一枚拼音徽章！</p><button id="quiz-again" class="primary-button" type="button">再玩 5 題 ↻</button></div>`;$('#quiz-again').onclick=startQuiz;flashStars();return}
  const word=currentQuizWord();const steps=STAGES.map((s,n)=>`<span class="quiz-step ${n<phase?'done':n===phase?'current':''}">${n<phase?'✓ ':''}${s}</span>`).join('');
  const question=['第一個聲音係邊個聲母？','你聽到邊個帶調韻母？','呢個聲音係第幾聲？','最後，呢個聲音係邊個字？'][phase];
  $('#quiz-body').innerHTML=`<div class="quiz-prompt"><span class="quiz-mascot" aria-hidden="true">🦊</span><div><h4>神奇聲音來了！</h4><p>先按喇叭，細心聽一次。</p></div><button id="quiz-play" class="quiz-play" type="button">🔊 播放聲音</button></div><div class="quiz-step-row">${steps}</div><h4 class="quiz-question">${question}</h4><div class="choice-grid">${optionsFor(word).map(o=>`<button class="choice" type="button" data-answer="${o}" aria-label="選擇 ${o}">${o}</button>`).join('')}</div><div id="quiz-feedback" class="feedback-line" role="status" aria-live="polite">答錯都可以再試，慢慢聽。</div>`;
  $('#quiz-play').onclick=()=>playWord(word);
  for(const button of document.querySelectorAll('.choice'))button.onclick=()=>choose(button);
}
function choose(button){
  if(locked)return;
  const right=correctFor(currentQuizWord());const value=button.dataset.answer;
  if(value!==right){misses++;button.classList.remove('wrong');void button.offsetWidth;button.classList.add('wrong');$('#quiz-feedback').classList.add('try');$('#quiz-feedback').textContent=misses<2?'再聽一遍，慢慢想！':`提示：正確答案開頭係「${right[0]}」。`;return}
  locked=true;button.classList.add('correct');$('#quiz-feedback').classList.remove('try');$('#quiz-feedback').textContent='答啱啦！★';
  setTimeout(()=>{phase++;misses=0;locked=false;if(phase<4)renderQuiz();else completeQuizWord()},550);
}
function completeQuizWord(){
  const word=currentQuizWord();
  if(progress.quiz<5){progress.quiz++;save()}
  $('#quiz-body').innerHTML=`<div class="quiz-complete"><span class="complete-icon" aria-hidden="true">${word.e}</span><p>你成功拼出這個聲音！</p><div><span class="big-pinyin">${syllable(word)}</span><span class="big-hanzi">${word.h}</span></div><p>${word.m}</p><button id="complete-listen" class="sound-button" type="button">🔊 再聽一次</button><br><button id="next-quiz" class="primary-button quiz-next" type="button">${quizIndex===4?'完成挑戰':'下一個聲音 →'}</button></div>`;
  $('#complete-listen').onclick=()=>playWord(word);
  $('#next-quiz').onclick=()=>{quizIndex++;phase=0;renderQuiz()};
  flashStars();
}
updateProgress();
