const sidebar = document.querySelector(".sidebar");
const sidebarClose = document.querySelector("#sidebar-close");
const menu = document.querySelector(".menu-content");
const menuItems = document.querySelectorAll(".submenu-item");
const subMenuTitles = document.querySelectorAll(".submenu .menu-title");
sidebarClose.addEventListener("click", () => sidebar.classList.toggle("close"));
menuItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    menu.classList.add("submenu-active");
    item.classList.add("show-submenu");
    menuItems.forEach((item2, index2) => {
      if (index !== index2) {
        item2.classList.remove("show-submenu");
      }
    });
  });
});
subMenuTitles.forEach((title) => {
  title.addEventListener("click", () => {
    menu.classList.remove("submenu-active");
  });
});


function encrypt() {
    let keyHex = document.getElementById("keyHex").value.trim();
    let plaintextHex = document.getElementById("plaintextHex").value.trim();

    if (!isValidHex(keyHex, 32) || !isValidHex(plaintextHex, 32)) {
        alert("密鑰和明文必須是 32 位 16 進制字符串（128-bit）");
        return;
    }

    let key = CryptoJS.enc.Hex.parse(keyHex);
    let plaintext = CryptoJS.enc.Hex.parse(plaintextHex);
    let encrypted = CryptoJS.AES.encrypt(plaintext, key, {mode: CryptoJS.mode.ECB,padding: CryptoJS.pad.NoPadding });
    document.getElementById("encryptedText0").innerText = encrypted.ciphertext.toString().toUpperCase();
}

function decrypt() {
    let SCKkeyHex = document.getElementById("SCK").value.trim();
    let SecretMaskKey = document.getElementById("SecretMaskKey").value.trim();
    let Vender_ID = document.getElementById("Vender_ID").value.trim();
    let Module_ID = document.getElementById("Module_ID").value.trim();
    let Ek3 = document.getElementById("EK3").value.trim();
    let Ek2 = document.getElementById("EK2").value.trim();
    let Ek1 = document.getElementById("EK1").value.trim();

    if (!isValidHex(SCKkeyHex, 32) || !isValidHex(SecretMaskKey, 32) || !isValidHex(Vender_ID, 32)) {
        alert("密鑰和密文必須是 32 位 16 進制字符串（128-bit）");
        return;
    }
    // for SCKv
    let key0 = CryptoJS.enc.Hex.parse(SCKkeyHex);
    let ciphertext = CryptoJS.enc.Hex.parse(Vender_ID);
    let decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key0, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    document.getElementById("SCKv").innerText = decrypted.toString(CryptoJS.enc.Hex).toUpperCase();
    
    // for Seedv
    let key1 = CryptoJS.enc.Hex.parse(SecretMaskKey);
    let ciphertext1 = CryptoJS.enc.Hex.parse(Vender_ID);
    let decrypted1 = CryptoJS.AES.decrypt({ ciphertext: ciphertext1 }, key1, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    document.getElementById("Seedv").innerText = decrypted1.toString(CryptoJS.enc.Hex).toUpperCase();

    // for Modkv
    let decrypted2 = CryptoJS.AES.decrypt({ ciphertext: decrypted1 }, decrypted, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    
    // 逐位進行 XOR 操作
    let xorResult = [];
    let words1 = decrypted1.words;
    let words2 = decrypted2.words;

    // 假設兩個解密結果的長度相同
    for (let i = 0; i < words1.length; i++) {
        xorResult.push(words1[i] ^ words2[i]);  // 對應位置的 32 位整數進行 XOR 操作
    }

    // 顯示 XOR 結果
    let xorHex = CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.create(xorResult));
    console.log(typeof xorHex);
    document.getElementById("Modkv").innerText = xorHex.toUpperCase();
    
    // for K3
    let ModkvKey = CryptoJS.enc.Hex.parse(xorHex);
    let ciphertext2 = CryptoJS.enc.Hex.parse(Module_ID);
    let decrypted3 = CryptoJS.AES.decrypt({ ciphertext: ciphertext2 }, ModkvKey, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    document.getElementById("K3").innerText = decrypted3.toString(CryptoJS.enc.Hex).toUpperCase();

    // for K2
    let ciphertext3 = CryptoJS.enc.Hex.parse(Ek3);
    let decrypted4 = CryptoJS.AES.decrypt({ ciphertext: ciphertext3 }, decrypted3, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    document.getElementById("K2").innerText = decrypted4.toString(CryptoJS.enc.Hex).toUpperCase();

    // for K1
    let ciphertext4 = CryptoJS.enc.Hex.parse(Ek2);
    let decrypted5 = CryptoJS.AES.decrypt({ ciphertext: ciphertext4 }, decrypted4, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    document.getElementById("K1").innerText = decrypted5.toString(CryptoJS.enc.Hex).toUpperCase();

    // for CW
    let ciphertext5 = CryptoJS.enc.Hex.parse(Ek1);
    let decrypted6 = CryptoJS.AES.decrypt({ ciphertext: ciphertext5 }, decrypted5, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    document.getElementById("CW").innerText = decrypted6.toString(CryptoJS.enc.Hex).toUpperCase();





    
}

function isValidHex(str, length) {
    return /^[0-9A-Fa-f]+$/.test(str) && str.length === length;
}
// XOR 兩個 32 位 16 進制字串
