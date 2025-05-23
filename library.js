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

const cloudinary = {
  _cloudName: localStorage.getItem("cloudinary-cloud-name"),
  _apiKey: localStorage.getItem("cloudinary-api-key"),
  _apiSecret: simpleCrypto.decrypt(localStorage.getItem("cloudinary-api-secret")),
  init(cloudName, apiKey, apiSecret) {
    cloudinary._cloudName = cloudName;
    cloudinary._apiKey = apiKey;
    cloudinary._apiSecret = simpleCrypto.encrypt(apiSecret);
    localStorage.setItem("cloudinary-cloud-name", cloudName);
    localStorage.setItem("cloudinary-api-key", apiKey);
    localStorage.setItem("cloudinary-api-secret", cloudinary._apiSecret);
  },
  /**
   * cloudinaryを使用して画像をアップロードします。
   * https://cloudinary.com/documentation/image_upload_api_reference#upload
   * @param {Blob} blob
   * @param {K_CloudinaryUploadParameters} additionalParameters
   * @param {K_EnumCloudinaryResourceType} resourceType
   * @returns {Promise<K_CloudinaryUploadResponse>}
   */
  async upload(blob, additionalParameters = null, resourceType = "image") {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("timestamp", (Date.now() / 1000 | 0).toString());
    formData.append("api_key", cloudinary._apiKey);
    for (const key in additionalParameters) formData.append(key, additionalParameters[key]);
    formData.append("signature", cloudinary._createSha1hashSignature( // see https://cloudinary.com/documentation/authentication_signatures
      [...formData.keys()].filter(key => !["file", "cloud_name", "resource_type", "api_key"].includes(key)).sort().map(key => `${key}=${formData.get(key)}`).join("&") + cloudinary._apiSecret
    ))
    const httpres = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary._cloudName}/${resourceType}/upload`, { method: "post", body: formData });
    if (httpres.status !== 200) throw new Error(`cloudinaryのアップロードでエラーがおきました。\n${httpres.status}`);
    const /** @type {K_CloudinaryImageUploadOriginalResponse} */ resObj = await httpres.json();
    return { url: resObj.secure_url, version: resObj.version, publicId: resObj.public_id, format: resObj.format, originalResponse: resObj };
  },
  /**
 * Sha1の署名を作成します。
 * @param {string} msg
 * @param {object} [options]
 * @returns {string}
 */
  _createSha1hashSignature(msg, options) {
    const defaults = { msgFormat: 'string', outFormat: 'hex' };
    const opt = Object.assign(defaults, options);

    switch (opt.msgFormat) {
      default: // default is to convert string to UTF-8, as SHA only deals with byte-streams
      case 'string': msg = utf8Encode(msg); break;
      case 'hex-bytes': msg = hexBytesToString(msg); break; // mostly for running tests
    }

    // constants [§4.2.1]
    const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

    // initial hash value [§5.3.1]
    const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

    // PREPROCESSING [§6.1.1]

    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    const l = msg.length / 4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
    const N = Math.ceil(l / 16);  // number of 16-integer-blocks required to hold 'l' ints
    const M = new Array(N);

    for (let i = 0; i < N; i++) {
      M[i] = new Array(16);
      for (let j = 0; j < 16; j++) {  // encode 4 chars per integer, big-endian encoding
        M[i][j] = (msg.charCodeAt(i * 64 + j * 4 + 0) << 24) | (msg.charCodeAt(i * 64 + j * 4 + 1) << 16)
          | (msg.charCodeAt(i * 64 + j * 4 + 2) << 8) | (msg.charCodeAt(i * 64 + j * 4 + 3) << 0);
      } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N - 1][14] = ((msg.length - 1) * 8) / Math.pow(2, 32); M[N - 1][14] = Math.floor(M[N - 1][14]);
    M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

    // HASH COMPUTATION [§6.1.2]

    for (let i = 0; i < N; i++) {
      const W = new Array(80);

      // 1 - prepare message schedule 'W'
      for (let t = 0; t < 16; t++) W[t] = M[i][t];
      for (let t = 16; t < 80; t++) W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);

      // 2 - initialise five working variables a, b, c, d, e with previous hash value
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4];

      // 3 - main loop (use JavaScript '>>> 0' to emulate UInt32 variables)
      for (let t = 0; t < 80; t++) {
        const s = Math.floor(t / 20); // seq for blocks of 'f' functions and 'K' constants
        const T = (ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t]) >>> 0;
        e = d;
        d = c;
        c = ROTL(b, 30) >>> 0;
        b = a;
        a = T;
      }

      // 4 - compute the new intermediate hash value (note 'addition modulo 2^32' – JavaScript
      // '>>> 0' coerces to unsigned UInt32 which achieves modulo 2^32 addition)
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
    }

    // convert H0..H4 to hex strings (with leading zeros)
    for (let h = 0; h < H.length; h++) H[h] = ('00000000' + H[h].toString(16)).slice(-8);

    // concatenate H0..H4, with separator if required
    const separator = opt.outFormat == 'hex-w' ? ' ' : '';

    return H.join(separator);

    function utf8Encode(str) {
      try {
        return new TextEncoder().encode(str, 'utf-8').reduce((prev, curr) => prev + String.fromCharCode(curr), '');
      } catch (e) { // no TextEncoder available?
        return unescape(encodeURIComponent(str)); // monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
      }
    }

    function hexBytesToString(hexStr) { // convert string of hex numbers to a string of chars (eg '616263' -> 'abc').
      const str = hexStr.replace(' ', ''); // allow space-separated groups
      return str == '' ? '' : str.match(/.{2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
    }

    function f(s, x, y, z) {
      switch (s) {
        case 0: return (x & y) ^ (~x & z);          // Ch()
        case 1: return x ^ y ^ z;                // Parity()
        case 2: return (x & y) ^ (x & z) ^ (y & z); // Maj()
        case 3: return x ^ y ^ z;                // Parity()
      }
    }

    function ROTL(x, n) {
      return (x << n) | (x >>> (32 - n));
    }
  }
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
 * @returns {Promise<K_GeminiContent[]>}
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
     *  @returns {Promise<K_GeminiContentPart>} */
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
   * @returns {Promise<K_GeminiContentPart>}
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
   * @returns {Promise<{responceCode?:number, success?:boolean, error?:boolean, originalResponse?:K_GeminiOriginalResponse, text?:string}>}
   */
  async createMessage(messages, { model = "gemini-2.5-flash-preview-05-20", temperature = 1 } = {}) {

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