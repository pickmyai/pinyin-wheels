const $ = selector => document.querySelector(selector);
const PILOT_IDS = ['ma1', 'ma2', 'ma3', 'ma4'];
const DB_NAME = 'pinyin-wheels-admin-recordings-v1';
const STORE = 'takes';
const TONE_LABELS = ['第一聲', '第二聲', '第三聲', '第四聲'];
let items = [];
let currentId = 'ma1';
let clips = new Map();
let database;
let recorder;
let stream;
let timer;
let recordingId;
let recordingStarted;
let playback = new Audio();
let playbackUrl;
let comparing = false;
let requestingMicrophone = false;
let audioContext;
let meterFrame;

function status(message, error = false) {
  $('#status').textContent = message;
  $('#status').classList.toggle('error', error);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function databaseRequest(method, value) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, method === 'getAll' ? 'readonly' : 'readwrite');
    const request = method === 'getAll' ? transaction.objectStore(STORE).getAll() : transaction.objectStore(STORE).put(value);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || Error('錄音儲存失敗'));
  });
}

function pilotApproved() { return PILOT_IDS.every(id => clips.get(id)?.approved); }
function allApproved() { return items.every(item => clips.get(item.id)?.approved); }
function currentItem() { return items.find(item => item.id === currentId); }

function makeItemButton(item, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'item-button' + (item.id === currentId ? ' selected' : '');
  button.setAttribute('aria-current', item.id === currentId ? 'true' : 'false');
  const locked = !item.pilot && !pilotApproved();
  button.disabled = locked;
  const clip = clips.get(item.id);
  const fields = [String(index + 1).padStart(2, '0'), item.character, item.pinyin,
    locked ? '先試音' : clip?.approved ? '✓ 可用' : clip ? '待審聽' : '未錄'];
  for (const [position, value] of fields.entries()) {
    const span = document.createElement('span');
    span.textContent = value;
    span.className = ['item-number', 'item-character', 'item-pinyin', 'item-status'][position];
    if (position === 3 && clip?.approved) span.classList.add('approved');
    if (position === 3 && clip && !clip.approved) span.classList.add('recorded');
    button.append(span);
  }
  button.addEventListener('click', () => selectItem(item.id));
  return button;
}

function render() {
  const pilotList = $('#pilot-list');
  const thirdList = $('#third-list');
  pilotList.replaceChildren();
  thirdList.replaceChildren();
  items.filter(item => item.pilot).forEach((item, index) => pilotList.append(makeItemButton(item, index)));
  items.filter(item => item.tone === 3).forEach((item, index) => thirdList.append(makeItemButton(item, index)));
  const approved = items.filter(item => clips.get(item.id)?.approved).length;
  const pilotCount = PILOT_IDS.filter(id => clips.get(id)?.approved).length;
  const thirdCount = items.filter(item => item.tone === 3 && clips.get(item.id)?.approved).length;
  $('#pilot-count').textContent = `${pilotCount} / 4`;
  $('#third-count').textContent = `${thirdCount} / 26`;
  $('#progress-text').textContent = `${approved} / ${items.length} 條已審聽通過`;
  $('#progress-fill').style.width = `${approved / items.length * 100}%`;
  $('#pilot-export').disabled = !pilotApproved();
  $('#full-export').disabled = !allApproved();
  $('#compare-button').disabled = comparing || PILOT_IDS.some(id => !clips.get(id));
  const item = currentItem();
  if (!item) return;
  $('#stage-label').textContent = item.pilot ? '四聲試音' : '第三聲字庫';
  $('#item-position').textContent = `${String(items.indexOf(item) + 1).padStart(2, '0')} / ${items.length}`;
  $('#word-character').textContent = item.character;
  $('#word-pinyin').textContent = item.pinyin;
  $('#word-tone').textContent = TONE_LABELS[item.tone - 1];
  $('#recording-title').textContent = item.tone === 3 ? '聽得到低點，才算第三聲。' : '四個聲調，要一聽就分得出。';
  $('#recording-hint').textContent = item.tone === 3
    ? '請只讀畫面上的一個字，不加「請讀」或例句。自然發音，保留低點與尾段回升。'
    : '請只讀畫面上的一個字。用同一把聲、同一距離錄四聲，方便比較。';
  const clip = clips.get(item.id);
  $('#record-button').disabled = comparing || requestingMicrophone;
  $('#play-button').disabled = !clip || !!recorder || comparing;
  $('#approve-button').disabled = !clip?.listened || !!recorder || comparing;
  $('#approve-button').classList.toggle('approved', !!clip?.approved);
  $('#approve-button').textContent = clip?.approved ? '✓ 已標記可用' : '✓ 標記可用';
  const index = items.indexOf(item);
  $('#previous-button').disabled = index === 0;
  $('#next-button').disabled = index === items.length - 1 || (!pilotApproved() && !items[index + 1]?.pilot);
}

function stopPlayback() {
  playback.pause();
  playback.onended = null;
  if (playbackUrl) URL.revokeObjectURL(playbackUrl);
  playbackUrl = null;
  playback.removeAttribute('src');
}

function selectItem(id) {
  if (recorder || comparing) return;
  const item = items.find(candidate => candidate.id === id);
  if (!item || (!item.pilot && !pilotApproved())) return;
  stopPlayback();
  currentId = id;
  const clip = clips.get(id);
  status(clip ? clip.levelWarning ||
    `錄音已調整音量${clip.gainDb > 0 ? ` +${clip.gainDb.toFixed(1)} dB` : ''}；請完整重聽。`
    : '請只讀一個字，按開始錄音。');
  render();
}

function mimeType() {
  for (const type of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function startMeter(input) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  audioContext = new Context();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  audioContext.createMediaStreamSource(input).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  const bars = [...document.querySelectorAll('.meter span')];
  function draw() {
    analyser.getByteTimeDomainData(samples);
    bars.forEach((bar, index) => {
      const from = Math.floor(index * samples.length / bars.length);
      const to = Math.floor((index + 1) * samples.length / bars.length);
      let power = 0;
      for (let i = from; i < to; i++) power += ((samples[i] - 128) / 128) ** 2;
      bar.style.height = `${Math.max(5, Math.min(44, Math.sqrt(power / (to - from)) * 175))}px`;
    });
    meterFrame = requestAnimationFrame(draw);
  }
  draw();
}

function stopMeter() {
  if (meterFrame) cancelAnimationFrame(meterFrame);
  meterFrame = null;
  audioContext?.close();
  audioContext = null;
  document.querySelectorAll('.meter span').forEach(bar => { bar.style.height = ''; });
}

function wavBlob(samples, sampleRate, gain) {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const write = (offset, value) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); write(8, 'WAVE');
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i] * gain));
    view.setInt16(44 + i * 2, value < 0 ? value * 32768 : value * 32767, true);
  }
  return new Blob([bytes], { type: 'audio/wav' });
}

async function normalizeRecording(blob) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw Error('瀏覽器不支援自動聲量調整。');
  const context = new Context();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration < .2 || decoded.duration > 12) throw Error('錄音長度不合適，請重錄。');
    const samples = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const input = decoded.getChannelData(channel);
      for (let i = 0; i < samples.length; i++) samples[i] += input[i] / decoded.numberOfChannels;
    }
    let peak = 0;
    const frameSize = Math.max(1, Math.round(decoded.sampleRate * .02));
    const frames = [];
    for (let start = 0; start < samples.length; start += frameSize) {
      let sum = 0;
      const end = Math.min(samples.length, start + frameSize);
      for (let i = start; i < end; i++) {
        const value = samples[i];
        peak = Math.max(peak, Math.abs(value));
        sum += value * value;
      }
      frames.push(Math.sqrt(sum / (end - start)));
    }
    const loudest = Math.max(...frames);
    if (loudest < .004 || peak < .008) throw Error('麥克風收音太細，請靠近麥克風重錄。');
    const active = frames.filter(value => value >= Math.max(.004, loudest * .18)).sort((a, b) => a - b);
    const activeRms = active[Math.floor(active.length / 2)];
    const gain = Math.min(12, .13 / activeRms, .88 / peak);
    const gainDb = Math.round(20 * Math.log10(gain) * 10) / 10;
    const levelWarning = activeRms * gain < .045
      ? '原始收音仍太細；已盡量調整，但請靠近麥克風重新錄製。'
      : peak > .98 ? '原始收音有爆音；請離開麥克風一點並重錄。' : '';
    return { blob: wavBlob(samples, decoded.sampleRate, gain), gainDb,
      durationMs: Math.round(decoded.duration * 1000), levelWarning };
  } finally { await context.close(); }
}

async function upgradeOlderClips() {
  let upgraded = 0;
  for (const clip of clips.values()) {
    if (clip.normalized) continue;
    try {
      const result = await normalizeRecording(clip.blob);
      clip.sourceBlob = clip.blob;
      clip.sourceMimeType = clip.mimeType;
      clip.blob = result.blob;
      clip.mimeType = 'audio/wav';
      clip.gainDb = result.gainDb;
      clip.levelWarning = result.levelWarning;
      clip.durationMs = result.durationMs;
      clip.normalized = true;
      clip.listened = false;
      clip.approved = false;
      await databaseRequest('put', clip);
      upgraded++;
    } catch { /* Keep the original take if this browser cannot decode it. */ }
  }
  return upgraded;
}

async function beginRecording() {
  if (requestingMicrophone || comparing) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    status('這個瀏覽器不支援錄音；請用最新版 Safari 或 Chrome，並以 HTTPS 開啟。', true);
    return;
  }
  stopPlayback();
  try {
    requestingMicrophone = true;
    render();
    stream = await navigator.mediaDevices.getUserMedia({ audio: {
      echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
    requestingMicrophone = false;
    const selectedMime = mimeType();
    recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
    recordingId = currentId;
    recordingStarted = Date.now();
    const chunks = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = async () => {
      clearTimeout(timer);
      stopMeter();
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      const finished = recorder;
      recorder = null;
      document.body.classList.remove('is-recording');
      $('#record-label').textContent = '重新錄音';
      try {
        const blob = new Blob(chunks, { type: finished.mimeType || chunks[0]?.type || 'audio/webm' });
        if (blob.size < 1000) throw Error('錄音太短或沒有收到聲音，請重試。');
        let processed;
        try { processed = await normalizeRecording(blob); }
        catch (error) { processed = { blob, durationMs: Date.now() - recordingStarted,
          levelWarning: `原音已保存，但${error.message || '音量調整失敗'}；請重聽或重錄。` }; }
        const take = { id: recordingId, blob: processed.blob, sourceBlob: blob,
          mimeType: processed.blob.type, sourceMimeType: blob.type,
          createdAt: new Date().toISOString(), durationMs: processed.durationMs,
          gainDb: processed.gainDb, levelWarning: processed.levelWarning,
          normalized: !!processed.gainDb || processed.gainDb === 0,
          listened: false, approved: false };
        await databaseRequest('put', take);
        clips.set(recordingId, take);
        status(take.levelWarning || `已調整音量${take.gainDb > 0 ? ` +${take.gainDb.toFixed(1)} dB` : ''}，並儲存在本機。請完整重聽。`, !!take.levelWarning);
      } catch (error) { status(error.message || '錄音儲存失敗，請重試。', true); }
      render();
    };
    recorder.onerror = () => status('錄音中斷，請重新錄製。', true);
    recorder.start(250);
    try { startMeter(stream); } catch { stopMeter(); }
    document.body.classList.add('is-recording');
    $('#record-label').textContent = '停止錄音';
    status('錄音中…讀完一個字便按停止。最長 10 秒。');
    timer = setTimeout(() => { if (recorder?.state === 'recording') recorder.stop(); }, 10000);
    render();
  } catch (error) {
    requestingMicrophone = false;
    stopMeter();
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    recorder = null;
    status(error.name === 'NotAllowedError' ? '麥克風權限未開啟；請允許此網站使用麥克風後重試。' : '無法開啟麥克風，請檢查裝置和瀏覽器權限。', true);
    render();
  }
}

async function playClip(id, markListened = true) {
  const clip = clips.get(id);
  if (!clip) return false;
  stopPlayback();
  playbackUrl = URL.createObjectURL(clip.blob);
  playback.src = playbackUrl;
  status(`播放 ${items.find(item => item.id === id)?.pinyin}…`);
  return new Promise(resolve => {
    playback.onended = async () => {
      if (markListened && !clip.listened) {
        clip.listened = true;
        try { await databaseRequest('put', clip); } catch { status('審聽狀態儲存失敗，請重試。', true); resolve(false); return; }
      }
      status('重聽完畢。若讀音清楚而自然，可標記可用。');
      render();
      resolve(true);
    };
    playback.onerror = () => { status('音檔無法播放，請重錄。', true); resolve(false); };
    playback.play().catch(() => { status('瀏覽器未能播放，請再按一次重聽。', true); resolve(false); });
  });
}

function extension(mime) {
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('webm')) return 'webm';
  return 'audio';
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(files) {
  const encoder = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name), data = file.data, crc = crc32(data);
    const local = new Uint8Array(30 + name.length), view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true);
    view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true);
    view.setUint16(26, name.length, true); local.set(name, 30);
    parts.push(local, data);
    const header = new Uint8Array(46 + name.length), c = new DataView(header.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
    c.setUint16(8, 0x800, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true); header.set(name, 46);
    central.push(header); offset += local.length + data.length;
  }
  const centralLength = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22), tail = new DataView(end.buffer);
  tail.setUint32(0, 0x06054b50, true); tail.setUint16(8, files.length, true);
  tail.setUint16(10, files.length, true); tail.setUint32(12, centralLength, true);
  tail.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

async function exportClips(kind) {
  const selected = kind === 'pilot' ? PILOT_IDS.map(id => items.find(item => item.id === id)) : items;
  if (!selected.every(item => clips.get(item.id)?.approved)) return;
  const files = [], metadata = [];
  status('正在整理錄音與校驗檔案…');
  for (const item of selected) {
    const clip = clips.get(item.id);
    const data = new Uint8Array(await clip.blob.arrayBuffer());
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const name = `audio/${item.id}.${extension(clip.mimeType)}`;
    files.push({ name, data });
    metadata.push({ id: item.id, character: item.character, pinyin: item.pinyin,
      file: name, mime_type: clip.mimeType, bytes: data.length, sha256: hash,
      duration_ms: clip.durationMs, recorded_at: clip.createdAt,
      normalization_db: clip.gainDb ?? null, level_warning: clip.levelWarning || null });
  }
  files.unshift({ name: 'manifest.json', data: new TextEncoder().encode(JSON.stringify({
    schema: 1, project: 'pinyin-wheels', kind, exported_at: new Date().toISOString(), clips: metadata
  }, null, 2)) });
  const objectUrl = URL.createObjectURL(zip(files));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `pinyin-wheels-${kind}-recordings-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.append(link);
  link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  status(`已匯出 ${selected.length} 條錄音；請把 ZIP 交給網站維護者審聽與匯入。`);
}

async function init() {
  try {
    if (!window.indexedDB) throw Error('此瀏覽器不支援本機儲存，請改用最新版 Safari 或 Chrome。');
    const response = await fetch('./recording-items.json');
    if (!response.ok) throw Error('錄音字庫無法載入。');
    const catalogue = await response.json();
    items = [...PILOT_IDS.map(id => catalogue.find(item => item.id === id)),
      ...catalogue.filter(item => !item.pilot)];
    if (items.length !== 29 || items.some(item => !item)) throw Error('錄音字庫不完整。');
    database = await openDatabase();
    clips = new Map((await databaseRequest('getAll')).map(clip => [clip.id, clip]));
    const upgraded = await upgradeOlderClips();
    render();
    status(upgraded ? `已調整 ${upgraded} 條舊錄音的聲量；請重新重聽並標記可用。`
      : '先錄四聲試音。按開始錄音，讀完一個字便停止。');
  } catch (error) {
    status(error.message || '錄音室無法啟動。', true);
    $('#record-button').disabled = true;
  }
}

$('#record-button').addEventListener('click', () => {
  if (recorder?.state === 'recording') recorder.stop();
  else if (!recorder) beginRecording();
});
$('#play-button').addEventListener('click', () => playClip(currentId));
$('#compare-button').addEventListener('click', async () => {
  if (comparing || PILOT_IDS.some(id => !clips.get(id))) return;
  comparing = true; render();
  for (const id of PILOT_IDS) {
    currentId = id; render();
    if (!await playClip(id)) break;
  }
  comparing = false; render();
});
$('#approve-button').addEventListener('click', async () => {
  const clip = clips.get(currentId);
  if (!clip?.listened) return;
  clip.approved = !clip.approved;
  try {
    await databaseRequest('put', clip);
    status(clip.approved ? '已標記可用。可繼續下一條。' : '已取消可用標記。');
    render();
  } catch { clip.approved = !clip.approved; status('標記儲存失敗，請重試。', true); }
});
$('#previous-button').addEventListener('click', () => selectItem(items[items.findIndex(item => item.id === currentId) - 1]?.id));
$('#next-button').addEventListener('click', () => selectItem(items[items.findIndex(item => item.id === currentId) + 1]?.id));
$('#pilot-export').addEventListener('click', () => exportClips('pilot').catch(() => status('匯出失敗，請重試。', true)));
$('#full-export').addEventListener('click', () => exportClips('complete').catch(() => status('匯出失敗，請重試。', true)));
window.addEventListener('pagehide', () => { if (recorder?.state === 'recording') recorder.stop(); stopMeter(); stream?.getTracks().forEach(track => track.stop()); stopPlayback(); });
init();
