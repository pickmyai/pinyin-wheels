# 拼音轉轉樂

給小學生玩的普通話拼音網頁遊戲，收錄 106 個單字及相應的示範讀音。轉動聲母、韻母和聲調轉盤後，先從四個漢字中選出正確答案，再跟讀或錄音回放。聽音解碼關卡依次選擇聲母、無聲調符號的韻母、聲調和漢字。卡通插畫與示範讀音位於 `assets/pinyin/`。

直接開啟 `index.html` 即可試玩。麥克風錄音需透過 HTTPS 或 localhost 並獲得瀏覽器授權；錄音只在學生裝置播放，不會上傳。

## 部署

純靜態網站，無需建置步驟。Vercel Framework Preset 選 `Other`，Root Directory 保留 `./`。

## 預先生成 Azure 示範讀音

兩個遊戲模式均播放 `assets/pinyin/audio/azure-v1/<拼音ID>.mp3`，不在學生裝置即時合成，也不會退回瀏覽器 TTS。音檔使用 Azure 普通話女聲 `zh-CN-XiaoxiaoNeural`、語速 `-25%`；SSML 明確指定每個音節及聲調，例如 `ba 3`（把）、`nv 3`（女），避免多音字由文字自動猜音。音檔未經額外降速或變調。

新增字庫項目後，用 Python 3 與 `ffprobe` 預先補齊音檔：

```sh
# 憑證從環境變數讀取；也可傳 --env-file /path/to/local.env。
# 只使用 AZURE_TTS_KEY 與 AZURE_TTS_URL，不會寫入音檔清單或網站。
python3 scripts/generate_azure_audio.py
python3 scripts/generate_azure_audio.py --check
```

`AZURE_TTS_URL` 是所屬 Azure region 的 `https://<region>.tts.speech.microsoft.com/cognitiveservices/v1`。
生成器會跳過 SSML 和檔案雜湊均未變更的音檔；`--check` 完全離線核對字庫覆蓋、SHA-256、MP3 格式和長度。`manifest.json` 記錄聲線、指定讀音、生成時間和音檔雜湊，沒有憑證。

SSML 拼音標記依據 [Microsoft Speech phonetic alphabets](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#zh-cn)。音檔載入失敗時，遊戲顯示重試提示，不會換用另一個語音引擎。
