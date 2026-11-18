# mtk29073.github.io

- 首頁 `index.html`：**0x 加密測試台**（AES ECB/CBC/CTR/GCM/CMAC、RSA、ECC/ECDH、ECDSA、Hash、HMAC、Key Ladder、檔案上傳），輸入輸出皆為 16 進位，運算全在瀏覽器本機完成。
- 左側選單「機場晃晃」：日本機場（羽田 T3、成田 T1／T2、中部 T1、新千歲國際線）出境後免稅店的 3D 地圖，點店家或登機門畫出步行路線；「去搭新幹線」是從機場到新幹線車站的轉乘地圖。
- 左側選單「日本交通」「日本天氣」：`japan/` 底下的獨立頁面（`rail.html` 全國鐵道網、`metro.html` 東京地下鐵、`weather.html` 日本天氣，資料檔在 `japan/lib/`），以 iframe 嵌入，第一次打開才載入。
- 左側選單「CASI 英文」：`casi/casi.html` + `casi/data.js`，CASI（加拿大單板教練協會）考試英文句子：單板專用 11 類（術語、教學流程、口令、動作分析、安全、纜車、雪況、裝備、學員管理、考官互動、跟同學聊單板）＋通用口說 17 類，共 1575 句，可搜尋、朗讀、收藏、練習；要加句子只要編輯 `casi/data.js`（格式 `'English|中文'`）。
- `old.html`：原本的首頁（Coding note 選單），`KeyLadder/key_ladder1.html` 為原本的 Key Ladder 計算器。
- `config.js`：上傳功能設定，填入 Google Apps Script 網址即可啟用。
- `server/Code.gs`：上傳功能的 Google Apps Script 程式，部署步驟見 `DEPLOY.md`。

原始碼（src、測試、建置腳本）保存在本機的 hex-crypto-lab 專案資料夾。
