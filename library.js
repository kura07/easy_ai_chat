/// <reference path="./jsdoc.js" />
"use strict";

const simpleCrypto = {
  _secretKey: "デフォルト",
  setSecretKey(key) { simpleCrypto._secretKey = key; },
  /** @param {string} text */
  encrypt(text, key = simpleCrypto._secretKey) { return btoa(encodeURIComponent(simpleCrypto._xor(text, key))); },
  /** @param {string} encoded */
  decrypt(encoded, key = simpleCrypto._secretKey) { return typeof encoded === "string" ? simpleCrypto._xor(decodeURIComponent(atob(encoded)), key) : null; },
  /** @param {string} text @param {string} key */
  _xor(text, key) { return text.split("").map((c, i) => String.fromCharCode(c.charCodeAt() ^ key.charCodeAt(i % key.length))).join(""); }
};

const gemini = {
  _apiKey: simpleCrypto.decrypt(localStorage.getItem("gemini-api-key")),

  /** @param {string} key */
  setApiKey(key) {
    gemini._apiKey = simpleCrypto.encrypt(key);
    localStorage.setItem("gemini-api-key", gemini._apiKey);
  },

  /**
 * 汎用的なメッセージからGemini用に変換します。
 * @param {K_GeneralAiChatMessage[]} messages
 * @param {K_EnumChatAiSystemToUser} systemToUser
 * @returns {K_GeminiContent[]}
 */
  async forGemini(messages, systemToUser = "none") {
    /** @param {object} obj @returns {K_Entry} */
    const getSoleEntry = obj => {
      if (obj === null || typeof obj !== "object") throw new Error(`obj (${JSON.stringify(obj).slice(0, 50)})はオブジェクトではありません。`);
      const entries = Object.entries(obj);
      if (entries.length !== 1) throw new Error(`キーが${entries.length}個です。\n${entries.map(a => a[0]).join()}`);
      return { key: entries[0][0], value: entries[0][1] };
    };
    const USER = "user", ASSISTANT = "assistant", MODEL = "model", SYSTEM = "system";
    /** @param {string|K_GeneralAiChatMessageContent} c
     *  @returns {K_GeminiContentPart} */
    const generalToContent = async c => {
      if (typeof c === "string") return c;
      const { key } = getSoleEntry(c);
      if (key === "blob" || key === "url") return await gemini.toPart(c.blob || c.url);
      else if (key === "text") return c.text;
      throw new Error(`不明なgeneralContent: ${JSON.stringify(c)}`);
    };
    return await Promise.all(messages.map(async (m, idx) => {
      const { key: role, value: originalContent } = getSoleEntry(m);
      const content = Array.isArray(originalContent) ? await Promise.all(originalContent.map(c => generalToContent(c))) : await generalToContent(originalContent);
      if (role === USER) return { [USER]: content };
      if (role === ASSISTANT) return { [MODEL]: content };
      if (role === SYSTEM) return { [systemToUser === "none" || (systemToUser === "after_0" && idx === 0) ? SYSTEM : USER]: content };
      throw new Error(`不明なrole(messages[${idx}]): ${role}`);
    }));
  },

  /**
   * URLやBlobデータをGemini用に変換します。
   * @param {string} urlOrBlob
   * @returns {K_GeminiContentPart}
   */
  async toPart(urlOrBlob) {
    const /** @type {Blob}  */ blob = typeof urlOrBlob === "string" ? await (await fetch(urlOrBlob)).blob() : urlOrBlob;
    const mimeType = blob.type;
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.match(/(?<=,).+$/)[0]); // result: data:[mime];base64,...
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { inlineData: { mimeType, data } };
  },

  /**
   * Gemini APIに非同期でfetchします。簡易バージョン。
   * @param {K_GeneralAiChatMessage[]} messages
   * @param {{model:K_EnumGeminiModel, temperature:number}} obj
   * @returns {{responceCode?:number, success?:boolean, error?:boolean, originalResponse?:K_GeminiOriginalResponse, text?:string}}
   */
  async createMessage(messages, { model = "gemini-2.5-flash-preview-04-17", temperature = 1 } = {}) {

    // messagesをgemini用に変換
    const rawContents = await gemini.forGemini(messages);

    // contentsを正規化
    const normalizeParts = parts => (Array.isArray(parts) ? parts : [parts]).map(c => typeof c === "string" ? { text: c } : c);
    const /** @type {K_GeminiContent[]} */ contents = rawContents.map((m, i) => {
      if (checkObjectKeys(m, "model")) return { role: "model", parts: normalizeParts(m.model) };
      if (checkObjectKeys(m, "user")) return { role: "user", parts: normalizeParts(m.user) };
      if (checkObjectKeys(m, "parts,role")) return { role: m.role, parts: normalizeParts(m.parts) };
      throw new Error(`不明なcontentのkeysです。\ncontents[${i}] keys=${Object.keys(m)}`);
    });

    // fetch
    try {
      const body = JSON.stringify({ contents, generationConfig: { temperature } });
      const httpRes = await fetch(`https:/\/generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gemini._apiKey}`, {
        method: "post", body,
      });

      const /** @type {K_GeminiOriginalResponse} */ json = await httpRes.json();
      console.log(httpRes.status, json);
      if (!httpRes.ok) return { responceCode: httpRes.status, error: true, originalResponse: json };

      const text = json.candidates?.[0].content.parts?.[0].text || "";
      return { responceCode: httpRes.status, success: true, originalResponse: json, text };
    }
    catch (err) {
      return { error: true, originalResponse: err.stack };
    }
  }
};

const markdown = {
  _turndownService: (ts => {
    ts.addRule('horizontalRuleDash', { filter: 'hr', replacement: () => '\n\n---\n\n' });
    return ts
  })(new TurndownService()),
  /** Markdown => HTML */
  parse(markdownText) { return marked.parse(markdownText); },
  /** HTML => Markdown */
  turndown(html) { return markdown._turndownService.turndown(html); }
};

/**
 * オブジェクトのキーが配列の文字列と一致しているかどうかを確認します。keysに文字列が渡された場合はカンマ区切りで自動的に配列に変換されます。
 * @param {object} obj
 * @param {string|string[]} keys
 * @returns {boolean}
 */
const checkObjectKeys = function (obj, keys) {
  if (typeof obj !== "object" || obj === null) return false;
  const objKeys = Object.keys(obj).sort();
  const refKeys = (Array.isArray(keys) ? keys : keys.split(",").map(key => key.trim())).slice().sort();
  return objKeys.length === refKeys.length && objKeys.every((key, idx) => key === refKeys[idx]);
}