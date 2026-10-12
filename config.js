// 上傳功能設定：部署好 Google Apps Script 後，把網址貼到 endpoint，存檔即可生效（不需重新建置）
window.UPLOAD_CONFIG = {
  // Apps Script 網頁應用程式網址，例如 https://script.google.com/macros/s/AKfy..../exec
  // 留空 = 上傳功能顯示「尚未設定」
  endpoint: '',
  // 是否要求參觀者輸入上傳密碼（密碼本身設定在 server/Code.gs 的 UPLOAD_CODE）
  requireCode: false,
  // 單一檔案大小上限（MB），需與 Code.gs 的 MAX_MB 一致；Apps Script 建議不超過 20
  maxMB: 20,
};
