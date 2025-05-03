/// <reference path="./jsdoc.js" />
"use strict";

const GEMINI_API_KEY = "gemini_api_key";

/**
 * Gemini APIに非同期でfetchします。簡易バージョン。
 * @param {K_GeminiContent[]} rawContents
 * @param {{model:K_EnumGeminiModel, temperature:number}} obj
 */
async function simpleGeminiCreateMessage(rawContents, { model = "gemini-2.5-flash-preview-04-17", temperature = 1 } = {}) {

  // { user: "~~~" } → { role:"user", content: "~~~" } などに変換します。
  // さらにpartsを配列形式に変換し、中身の文字列を{type:"text",text:"~~~"}に変換します。
  const normalizeParts = parts => (Array.isArray(parts) ? parts : [parts]).map(c => typeof c === "string" ? { text: c } : c);
  const /** @type {K_GeminiContent[]} */ contents = rawContents.map((m, i) => {
    if (checkObjectKeys(m, "model")) return { role: "model", parts: normalizeParts(m.model) };
    if (checkObjectKeys(m, "user")) return { role: "user", parts: normalizeParts(m.user) };
    if (checkObjectKeys(m, "parts,role")) return { role: m.role, parts: normalizeParts(m.parts) };
    throw new Error(`不明なcontentのkeysです。\ncontents[${i}] keys=${Object.keys(m)}`);
  });

  const body = JSON.stringify({
    contents,
    generationConfig: { temperature },
  });

  const httpRes = await fetch(`https:/\/generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${SimpleCrypto.load(GEMINI_API_KEY)}`, {
    method: "post", body,
  });

  const /** @type {K_GeminiOriginalResponse} */ json = await httpRes.json();
  console.log(json);
  return json.candidates[0].content.parts[0].text;

}

const SimpleCrypto = {
  _secretKey: "デフォルト",

  /** @type {(key:string)=>void} */
  setSecretKey(key) { this._secretKey = key; },

  /** @type {(text:string, key:string)=>string} */
  encrypt(text, key = this._secretKey) { return btoa(encodeURIComponent(this._xor(text, key))); },

  /** @type {(encoded:string, key:string)=>string} */
  decrypt(encoded, key = this._secretKey) { return this._xor(decodeURIComponent(atob(encoded)), key); },

  /** @type {(text:string, key:string)=>string} */
  _xor(text, key) { return text.split("").map((c, i) => String.fromCharCode(c.charCodeAt() ^ key.charCodeAt(i % key.length))).join(""); },
};


/**
 * オブジェクトのキーが配列の文字列と一致しているかどうかを確認します。keysに文字列が渡された場合はカンマ区切りで自動的に配列に変換されます。
 * @param {object} obj
 * @param {string|string[]} keys
 * @returns {boolean}
 */
function checkObjectKeys(obj, keys) {
  if (typeof obj !== "object" || obj === null) return false;
  const objKeys = Object.keys(obj).sort();
  const refKeys = (Array.isArray(keys) ? keys : keys.split(",").map(key => key.trim())).slice().sort();
  return objKeys.length === refKeys.length && objKeys.every((key, idx) => key === refKeys[idx]);
}

// marked.parse(mdText);
const turndownService = new TurndownService();
turndownService.addRule('horizontalRuleDash', { filter: 'hr', replacement: () => '\n\n---\n\n' });
// turndownService.turndown(html);