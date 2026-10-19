/**
 * mtk29073.github.io 後端（Google Apps Script）：
 *   1. 雲端同步：保存瀏覽器加密後的資料（只有密文），讓多台電腦同步
 *   2. 參觀者上傳檔案：存到你的 Google Drive
 * 部署方式見 DEPLOY.md。
 */
const FOLDER_ID = '';        // 指定 Drive 資料夾 ID；留空會自動建立「hex-crypto-lab 上傳」資料夾
const UPLOAD_CODE = '';      // 上傳密碼；留空表示不檢查（config.js 的 requireCode 也要對應設定）
const MAX_MB = 20;           // 單檔上限（MB）
const DAILY_LIMIT = 200;     // 每日最多收幾個檔案，防止被灌爆；0 = 不限制

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (String(d.action || '').indexOf('sync-') === 0) return out(sync(d));
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

function doGet() { return out({ ok: true, service: 'mtk29073 backend', sync: true, maxMB: MAX_MB }); }

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
function setup() { Logger.log('上傳資料夾：' + getFolder().getUrl()); Logger.log('同步資料檔：' + syncFile().getUrl()); }

// ===================== 雲端同步 =====================
// 網頁送來的 token 是由同步碼算出的通行碼；這裡只保存它的 SHA-256，第一個呼叫 sync-init 的同步碼會綁定這個專案。
// 要重設：到「專案設定 → 指令碼屬性」刪除 syncTokenHash（雲端資料檔可另外在 Drive 刪除）。
const SYNC_MAX_MB = 20;
function sha256hex(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8).map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}
function syncFile() {
  const name = 'hexlab-sync.json';
  const folders = DriveApp.getFoldersByName('hex-crypto-lab 同步');
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('hex-crypto-lab 同步');
  const it = folder.getFilesByName(name);
  return it.hasNext() ? it.next() : folder.createFile(name, JSON.stringify({ rev: 0, blob: null }), 'application/json');
}
function sync(d) {
  const p = PropertiesService.getScriptProperties();
  const token = String(d.token || '');
  if (!/^[0-9a-f]{64}$/.test(token)) return { ok: false, error: '同步通行碼格式錯誤' };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const saved = p.getProperty('syncTokenHash'), h = sha256hex(token);
    if (d.action === 'sync-init') {
      if (!saved) { p.setProperty('syncTokenHash', h); return { ok: true, claimed: true }; }
      return { ok: true, claimed: saved === h };
    }
    if (!saved || saved !== h) return { ok: false, error: '同步碼不正確或尚未建立同步' };
    const f = syncFile();
    const cur = JSON.parse(f.getBlob().getDataAsString() || '{"rev":0}');
    if (d.action === 'sync-get') return { ok: true, rev: cur.rev || 0, blob: cur.blob || null, updated: cur.updated || null };
    if (d.action === 'sync-put') {
      if (Number(d.baseRev || 0) !== Number(cur.rev || 0)) return { ok: false, conflict: true, rev: cur.rev };
      const body = JSON.stringify({ rev: (cur.rev || 0) + 1, updated: new Date().toISOString(), blob: d.blob });
      if (body.length > SYNC_MAX_MB * 1024 * 1024) return { ok: false, error: '同步資料超過上限' };
      f.setContent(body);
      return { ok: true, rev: (cur.rev || 0) + 1 };
    }
    return { ok: false, error: '未知的同步動作' };
  } finally { lock.releaseLock(); }
}
