# 部署到 GitHub Pages ＋ 開啟檔案上傳

GitHub Pages 只能放靜態網頁，沒辦法自己接收檔案，所以上傳功能用 **Google Apps Script** 當收件伺服器，
參觀者上傳的檔案會存到**你自己的 Google Drive**。兩邊都免費。

---

## 第一部分：架設收件伺服器（Google Apps Script）

1. 打開 <https://script.google.com>，用你的 Google 帳號登入，按「新專案」。
2. 把編輯器裡原本的程式全部刪掉，貼上 `server/Code.gs` 的內容，按儲存。
3. 視需要修改檔案最上方的設定：
   - `UPLOAD_CODE`：上傳密碼。留空代表任何人都能上傳；建議設定一組，只告訴需要上傳的人。
   - `MAX_MB`：單檔上限，預設 20 MB（Apps Script 不適合更大的檔案）。
   - `DAILY_LIMIT`：每天最多收幾個檔案，預設 200，避免被灌爆。
   - `FOLDER_ID`：想指定存放的 Drive 資料夾就填它的 ID；留空會自動建立「hex-crypto-lab 上傳」。
4. 上方函式選單選 `setup`，按「執行」。第一次會跳出授權視窗，允許存取 Google Drive。
   （若出現「Google 尚未驗證這個應用程式」，點「進階」→「前往（不安全）」，因為這是你自己的程式。）
5. 右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」：
   - 執行身分：**我**
   - 誰可以存取：**所有人**
6. 按「部署」，複製「網頁應用程式網址」（結尾是 `/exec`）。

> 之後若修改 Code.gs，要到「部署」→「管理部署作業」→ 編輯 → 版本選「新版本」再部署，網址不變。

## 第二部分：設定網頁

打開 `config.js`：

```js
window.UPLOAD_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/你的網址/exec',
  requireCode: true,   // Code.gs 有設定 UPLOAD_CODE 就改成 true
  maxMB: 20,           // 與 Code.gs 的 MAX_MB 相同
};
```

只改 `config.js` 不需要重新建置網頁。

## 第三部分：放上 GitHub Pages

需要上傳到 GitHub 的檔案：

```
index.html
config.js
.nojekyll
assets/keyladder/（三張圖）
```

（`src/`、`test/`、`server/`、`build.py` 也可以一起放，方便日後維護；不會影響網站。）

### 方式 A：放進你原本的 mtk29073.github.io

1. 打開 GitHub 上的 `mtk29073.github.io` repository。
2. 想讓首頁直接就是測試台：把上面的檔案放在 repository 根目錄（會取代原本的 index.html，原本的頁面可先改名保存）。
   想保留原首頁：建立一個資料夾，例如 `crypto/`，把檔案放進去，網址會是 `https://mtk29073.github.io/crypto/`。
3. 網頁上可直接「Add file」→「Upload files」拖曳上傳，然後「Commit changes」。

### 方式 B：新建一個 repository

1. GitHub 右上角「＋」→「New repository」，名稱例如 `hex-crypto-lab`，設為 Public，建立。
2. 「Add file」→「Upload files」，把上面的檔案拖進去，Commit。
3. 「Settings」→「Pages」→ Source 選「Deploy from a branch」，Branch 選 `main`、資料夾 `/ (root)`，Save。
4. 約一分鐘後網址會是 `https://你的帳號.github.io/hex-crypto-lab/`。

## 檢查

1. 打開網站 →「上傳檔案」分頁，說明文字不再顯示「尚未設定」。
2. 上傳一個小檔案，看到「已送達 ✓」。
3. 到 Google Drive 的「hex-crypto-lab 上傳」資料夾，檔名前面會加上上傳時間；
   檔案的「說明」欄位記錄上傳者、說明和 SHA-256。

## 注意事項

- `config.js` 裡的網址是公開的，任何人看原始碼都拿得到；請用 `UPLOAD_CODE` 和 `DAILY_LIMIT` 控制。
- 上傳的檔案存在你的 Drive，會佔用你的 Google 空間（免費 15 GB）。
- 參觀者上傳的檔案可能含惡意內容，下載後開啟前請先掃毒。
- Apps Script 每次請求約 6 分鐘、單次資料約 50 MB 為上限，所以單檔建議 ≤ 20 MB。

---

## 雲端同步（多台電腦共用 Script、待辦、財務紀錄、我獨自升級等）

同步和上傳用的是同一份 `server/Code.gs`，部署一次兩個功能都能用。

1. 照上面「第一部分」部署 Apps Script（執行身分「我」、存取權「所有人」），拿到 `/exec` 網址。
   已經部署過舊版的話，貼上新版 Code.gs 後到「管理部署作業」→ 編輯 → 版本選「新版本」。
2. 第一台電腦：打開網站 → 作者訊息 → 開發選項（輸入密碼）→「雲端同步」貼上網址 → 按「建立同步」，
   畫面會顯示一串 `hexsync1:` 開頭的**同步碼**。
3. 其他電腦：同樣打開開發選項，把同步碼貼到「加入同步」。雲端資料會取代那台電腦原本的資料。
4. 之後修改任何資料 2 秒後自動上傳；每分鐘、以及切回網頁時自動下載最新版本。

安全性：
- 資料在瀏覽器裡用同步碼裡的 256-bit 金鑰（AES-GCM）加密後才上傳，Drive 上的
  `hex-crypto-lab 同步/hexlab-sync.json` 只有密文；Apps Script 只保存通行碼的雜湊。
- 同步碼等同鑰匙，請像密碼一樣保管，不要貼到公開地方。網址和同步碼都不在 GitHub 上。
- 重設同步：Apps Script「專案設定 → 指令碼屬性」刪除 `syncTokenHash`，再到 Drive 刪除同步資料檔，
  然後在第一台電腦按「解除這台電腦的同步」後重新建立。
- 兩台電腦在同一分鐘內修改同一項（例如同時改待辦清單），以較晚存檔的為準。
