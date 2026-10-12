/**
 * 0x 加密測試台：接收參觀者上傳的檔案，存到你的 Google Drive。
 * 部署方式見 DEPLOY.md。
 */
const FOLDER_ID = '';        // 指定 Drive 資料夾 ID；留空會自動建立「hex-crypto-lab 上傳」資料夾
const UPLOAD_CODE = '';      // 上傳密碼；留空表示不檢查（config.js 的 requireCode 也要對應設定）
const MAX_MB = 20;           // 單檔上限（MB）
const DAILY_LIMIT = 200;     // 每日最多收幾個檔案，防止被灌爆；0 = 不限制

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (UPLOAD_CODE && d.code !== UPLOAD_CODE) return out({ ok: false, error: '上傳密碼錯誤' });
    if (DAILY_LIMIT && !takeQuota()) return out({ ok: false, error: '今日上傳數量已達上限，請明天再試' });

    const bytes = Utilities.base64Decode(String(d.data || ''));
    if (!bytes.length) return out({ ok: false, error: '檔案是空的' });
    if (bytes.length > MAX_MB * 1024 * 1024) return out({ ok: false, error: `檔案超過 ${MAX_MB} MB 上限` });

    // 伺服器端重算 SHA-256，確認傳輸過程沒有損壞
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
      .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
    if (d.sha256 && d.sha256 !== digest) return out({ ok: false, error: '檔案在傳輸中損壞（SHA-256 不符），請重新上傳' });

    const safe = String(d.name || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120);
    const stamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd-HHmmss');
    const blob = Utilities.newBlob(bytes, String(d.type || 'application/octet-stream'), `${stamp}_${safe}`);
    const file = getFolder().createFile(blob);
    file.setDescription([
      d.uploader ? `上傳者：${String(d.uploader).slice(0, 100)}` : '',
      d.note ? `說明：${String(d.note).slice(0, 400)}` : '',
      `SHA-256：${digest}`,
    ].filter(Boolean).join('\n'));
    return out({ ok: true, name: file.getName(), size: bytes.length, sha256: digest });
  } catch (err) {
    return out({ ok: false, error: '伺服器錯誤：' + err });
  }
}

function doGet() { return out({ ok: true, service: 'hex-crypto-lab upload', maxMB: MAX_MB }); }

function getFolder() {
  if (FOLDER_ID) return DriveApp.getFolderById(FOLDER_ID);
  const it = DriveApp.getFoldersByName('hex-crypto-lab 上傳');
  return it.hasNext() ? it.next() : DriveApp.createFolder('hex-crypto-lab 上傳');
}

function takeQuota() {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const p = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd');
    const n = p.getProperty('day') === today ? Number(p.getProperty('count') || 0) : 0;
    if (n >= DAILY_LIMIT) return false;
    p.setProperties({ day: today, count: String(n + 1) });
    return true;
  } finally { lock.releaseLock(); }
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// 在編輯器裡手動執行一次，用來授權 Drive 權限並確認資料夾
function setup() { Logger.log('上傳資料夾：' + getFolder().getUrl()); }
