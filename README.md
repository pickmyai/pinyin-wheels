# 拼音轉轉樂

給小學生玩的普通話拼音網頁遊戲，收錄 106 個單字及相應的示範讀音。轉動聲母、韻母和聲調轉盤後，先從四個漢字中選出正確答案，再跟讀或錄音回放。聽音解碼關卡依次選擇聲母、無聲調符號的韻母、聲調和漢字。卡通插畫與示範讀音位於 `assets/pinyin/`。

直接開啟 `index.html` 即可試玩。麥克風錄音需透過 HTTPS 或 localhost 並獲得瀏覽器授權；錄音只在學生裝置播放，不會上傳。

## 部署

純靜態網站，無需建置步驟。Vercel Framework Preset 選 `Other`，Root Directory 保留 `./`。

## 預先生成 Azure 示範讀音

兩個遊戲模式均使用預生成 MP3，不在學生裝置即時合成，也不會退回瀏覽器 TTS。第一、二、四聲播放 `assets/pinyin/audio/azure-v1/<拼音ID>.mp3`；第三聲播放 `assets/pinyin/audio/third-tone-v2/<拼音ID>.mp3`。原始音檔使用 Azure 普通話女聲 `zh-CN-XiaoxiaoNeural`、語速 `-25%`；SSML 明確指定每個音節及聲調，例如 `ba 3`（把）、`nv 3`（女），避免多音字由文字自動猜音。

Azure 的單字第三聲尾段回升較弱。現有第三聲檔以 Praat 重疊相加延長有聲段並調整基頻；雖然量得出降後升，用戶實際聽感仍像第一／二聲，**未通過教學讀音驗收**。這個版本只暫時保留，下一步改用普通話母語者的孤立字錄音。Microsoft 的 [SSML 文件](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#adjust-prosody) 指出 `contour` 對單字及短句不起作用，所以不再繼續靠 Azure 單字 SSML 修此問題。

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

## 管理錄音頁

`/admin/recordings.html` 是給普通話錄音者使用的瀏覽器工具。先錄「媽／麻／馬／罵」四聲，完整重聽每條並標記可用；四條通過後解鎖其餘 25 個第三聲字。頁面可重錄、連續重聽四聲、查看進度，並匯出試音或完整 ZIP（含原始音檔及 SHA-256 清單）。

錄音儲存在該裝置的 IndexedDB，**不會傳到伺服器，也不會自動進入遊戲**。本頁沒有登入機制，知道網址的人都能開啟工具，但只會看到自己瀏覽器內的錄音。請用固定裝置與一般瀏覽模式，及時匯出 ZIP 備份；錄音者把試音 ZIP 交給負責教學審聽的人，確認第三聲自然後才錄完整字庫。最終音檔須另行審聽、轉檔、部署及在正式站讀回，不能以「已匯出」當上線證據。

本機試用時，在 repo 根目錄執行 `python3 -m http.server 8765`，再開啟 `http://localhost:8765/admin/recordings.html`。麥克風功能需要 HTTPS 或 localhost。`admin/recording-items.json` 與遊戲字庫同步；新增／移除第三聲字時一併更新。
