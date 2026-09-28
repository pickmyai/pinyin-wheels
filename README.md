# 拼音轉轉樂

給小學生玩的普通話拼音網頁遊戲，收錄 106 個單字及相應的示範讀音。轉動聲母、韻母和聲調轉盤後，先從四個漢字中選出正確答案，再跟讀或錄音回放。聽音解碼關卡依次選擇聲母、無聲調符號的韻母、聲調和漢字。卡通插畫與示範讀音位於 `assets/pinyin/`。

直接開啟 `index.html` 即可試玩。麥克風錄音需透過 HTTPS 或 localhost 並獲得瀏覽器授權；錄音只在學生裝置播放，不會上傳。

## 部署

純靜態網站，無需建置步驟。Vercel Framework Preset 選 `Other`，Root Directory 保留 `./`。

## 預先生成 Azure 示範讀音

兩個遊戲模式均使用預生成 MP3，不在學生裝置即時合成，也不會退回瀏覽器 TTS。第一、二、四聲播放 `assets/pinyin/audio/azure-v1/<拼音ID>.mp3`；第三聲播放 `assets/pinyin/audio/third-tone-v2/<拼音ID>.mp3`。原始音檔使用 Azure 普通話女聲 `zh-CN-XiaoxiaoNeural`、語速 `-25%`；SSML 明確指定每個音節及聲調，例如 `ba 3`（把）、`nv 3`（女），避免多音字由文字自動猜音。

Azure 的單字第三聲尾段回升較弱。第三聲示範檔保留原 Azure 發音，以 Praat 的重疊相加方式延長有聲段並調整基頻，做出清晰的降後升轉折。這是**孤立音節的教學示範**，不是連讀語流中的聲調變化。Microsoft 的 [SSML 文件](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#adjust-prosody) 指出 `contour` 對單字及短句不起作用，所以在離線生成階段處理音檔。

新增字庫項目後，用 Python 3 與 `ffprobe` 預先補齊音檔：

```sh
# 憑證從環境變數讀取；也可傳 --env-file /path/to/local.env。
# 只使用 AZURE_TTS_KEY 與 AZURE_TTS_URL，不會寫入音檔清單或網站。
python3 scripts/generate_azure_audio.py
python3 scripts/generate_azure_audio.py --check
# 第三聲在 Azure 原檔生成／核對後處理；僅開發機需要此套件。
python3 -m pip install -r scripts/requirements-third-tone.txt
python3 scripts/improve_third_tones.py
python3 scripts/improve_third_tones.py --check
```

`AZURE_TTS_URL` 是所屬 Azure region 的 `https://<region>.tts.speech.microsoft.com/cognitiveservices/v1`。
生成器會跳過 SSML 和檔案雜湊均未變更的音檔；`--check` 完全離線核對字庫覆蓋、SHA-256、MP3 格式和長度。第三聲檢查另外核對原檔、輸出檔雜湊、音量和基頻降後升。`manifest.json` 記錄生成設定和音檔雜湊，沒有憑證。修改字庫或重新生成 Azure 第三聲原檔後，必須再跑第三聲處理與檢查。

SSML 拼音標記依據 [Microsoft Speech phonetic alphabets](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#zh-cn)。音檔載入失敗時，遊戲顯示重試提示，不會換用另一個語音引擎。
