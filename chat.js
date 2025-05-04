/// <reference path="./jsdoc.js" />
"use strict";

const STORAGE_MESSAGES = (session => session ? `messages-${session}` : "messages")(new URLSearchParams(location.search).get("session"));

//------------------------------
// 要素取得
//------------------------------
const byId = id => document.getElementById(id);
const
  sectionChat = byId("chat"),
  templateUser = /** @type {HTMLTemplateElement} */(byId("template-user")),
  templateUserImage = /** @type {HTMLTemplateElement} */(byId("template-user-image")),
  templateModel = /** @type {HTMLTemplateElement} */(byId("template-model")),
  buttonGenerateFromMiddle = /** @type {HTMLButtonElement} */(byId("generate-from-middle"));
const
  inputUser = /** @type {HTMLTextAreaElement} */(byId("input-user")),
  inputModel =  /** @type {HTMLTextAreaElement} */(byId("input-model")),
  buttonGenerate = /** @type {HTMLButtonElement} */(byId("generate")),
  asideErrorMessage = /** @type {HTMLElement} */(byId("error-message"));
const
  menuClearAllLocalStorage = byId("clear_all_local_storage"),
  menuSetGeminiApiKey = byId("set_gemini_api_key"),
  menuSetCloudinaryApiKey = byId("set_cloudinary_api_key"),
  menuCheckLocalStorage = byId("check_local_stotage"),
  menuOverwriteMessages = byId("overwrite_messages"),
  menuDeleteMessages = byId("delete_messages");

//------------------------------
// チャット処理関数たち
//------------------------------
const chat = {
  /**
   * 新しいメッセージを追加して、テキスト生成AIのレスポンスを得ます。
   */
  async addNewMessage() {
    const inputTextUser = inputUser.value, inputTextModel = inputModel.value;
    inputUser.value = inputModel.value = "";
    buttonGenerateFromMiddle.hidden = true;
    chat.appendUserMessage(inputTextUser);
    const articleModelMessage = chat.appendModelMessage(inputTextModel);
    chat.saveChatMessages();
    arrangeInputForm();
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    await chat.fetchMessage(articleModelMessage, inputTextModel);
  },

  /**
   * #generate-from-middleが存在する途中からメッセージを生成します。以前のメッセージは削除されます。
   */
  async regenerageMessage() {
    while (buttonGenerateFromMiddle.nextElementSibling) buttonGenerateFromMiddle.nextElementSibling.remove();
    buttonGenerateFromMiddle.hidden = true;
    const articleModelMessage = sectionChat.lastElementChild.dataset.role === "model" ? sectionChat.lastElementChild : chat.appendModelMessage("");
    const inputTextModel = articleModelMessage.dataset.markdown;
    await chat.fetchMessage(articleModelMessage, inputTextModel);
  },

  /**
   * Gemini APIに送信してメッセージを取得します。
   * @param {HTMLElement} articleModelMessage
   * @param {string} [inputTextModel]
   * @param {number} [tryTimes]
   */
  async fetchMessage(articleModelMessage, inputTextModel = "", tryTimes = 0) {
    sectionChat.querySelectorAll("article").forEach(a => { if (a !== articleModelMessage && a.innerText.trim() === "") a.remove(); });
    articleModelMessage.dataset.status = "loading";
    const res = await gemini.createMessage(chat.getMessagesFromChatSection());
    delete articleModelMessage.dataset.status;
    if (res.error) {
      tryTimes++;
      asideErrorMessage.hidden = false;
      asideErrorMessage.innerText = `[${tryTimes}] ${new Date().toLocaleTimeString()}\n${JSON.stringify(res.originalResponse, null, 2)}`;
      if (tryTimes < 3) return await chat.fetchMessage(articleModelMessage, inputTextModel, tryTimes);
      else alert("3度トライしましたがすべて失敗しました。");
    }
    else {
      chat.updateModelMessage(articleModelMessage, inputTextModel + res.text);
      articleModelMessage.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { autoScroll = true; }, 1000);
      chat.saveChatMessages();
    }
  },

  /**
   * #chat の中身を読み取り、メッセージ配列に変換します。
   * @return {K_GeneralAiChatMessage[]}
   */
  getMessagesFromChatSection() {
    const articles = [...sectionChat.querySelectorAll("article")];
    return articles.flatMap(/** @return {K_GeneralAiChatMessage} */a => {
      if (a.dataset.role === "user") return { user: a.innerText };
      if (a.dataset.role === "user-image") return [...a.querySelectorAll("figure")].map(fig => {
        if (fig.dataset.uploading === "true") return null;
        return fig.querySelector("img").src;
      }).filter(Boolean).map(url => ({ user: { url } }));
      if (a.dataset.role === "model") return { assistant: a.dataset.markdown };
    }).filter(Boolean);
  },

  /**
   * #chat の末尾にユーザーメッセージを追加します。
   * @param {string} text
   */
  appendUserMessage(text) {
    const /** @type {HTMLElement} */ clone = templateUser.content.cloneNode(true), article = clone.querySelector("article");
    article.innerText = text;
    sectionChat.append(clone);
  },

  /**
   * #chat の末尾にユーザー画像メッセージを追加します。
   * @param {string} url
   */
  appendUserImage(url) {
    const clone = templateUserImage.content.cloneNode(true), /** @type {HTMLElement} */figure = clone.querySelector("figure"), image = clone.querySelector("img");
    delete figure.dataset.uploading;
    image.src = url;
    if (sectionChat.lastElementChild.dataset.role === "user-image") sectionChat.lastElementChild.append(figure);
    else sectionChat.append(clone);
  },

  /**
   * #chat の末尾にアシスタントのメッセージを追加します。
   * @param {string} markdownText
   * @return {HTMLElement}
   */
  appendModelMessage(markdownText) {
    const /** @type {HTMLElement} */ clone = templateModel.content.cloneNode(true), article = clone.querySelector("article");
    chat.updateModelMessage(article, markdownText);
    sectionChat.append(clone);
    return article;
  },

  /**
   * 指定された要素（通常は<article class="model">）のメッセージ内容を更新します。
   * @param {HTMLElement} targetElement
   * @param {string} markdownText
   */
  updateModelMessage(targetElement, markdownText) {
    targetElement.innerHTML = markdown.parse(markdownText);
    targetElement.dataset.markdown = markdownText;
  },

  /**
   * #chat の内容を localStorage に保存します。
   */
  saveChatMessages() { localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(chat.getMessagesFromChatSection())); },
};



//------------------------------
// オートスクロール
//------------------------------
let autoScroll = false;
const smoothAutoScroll = () => {
  if (autoScroll) window.scrollBy(0, 1);
  setTimeout(smoothAutoScroll, 1000 / 30);
};
const stopAutoScroll = () => { autoScroll = false; };
window.addEventListener('wheel', stopAutoScroll);
window.addEventListener('touchstart', stopAutoScroll);
window.addEventListener('keydown', stopAutoScroll);
smoothAutoScroll();


//------------------------------
// イベントリスナ定義
//------------------------------
// input
const arrangeInputForm = () => {
  const resize = /** @param {HTMLTextAreaElement} elm */ elm => { elm.style.height = "auto"; elm.style.height = `${elm.scrollHeight}px`; };
  buttonGenerate.disabled = inputUser.value === "";
  resize(inputUser);
  resize(inputModel);
};
(() => {
  document.addEventListener("input", evt => {
    const /** @type {HTMLElement} */ target = evt.target;
    if (target === inputUser || target === inputModel) arrangeInputForm();
    else if (target.tagName === "ARTICLE" && sectionChat.contains(target)) target.dataset.changed = "true";
  });
})();
// focusin
document.addEventListener("focusin", evt => {
  const /** @type {HTMLElement} */ target = evt.target;
  if (target.tagName === "ARTICLE" && sectionChat.contains(target)) {
    buttonGenerateFromMiddle.hidden = false;
    target.insertAdjacentElement("afterend", buttonGenerateFromMiddle);
  }
});
// focusout
document.addEventListener("focusout", evt => {
  const /** @type {HTMLElement} */ target = evt.target;
  if (target.tagName === "ARTICLE" && sectionChat.contains(target) && target.dataset.changed === "true") {
    delete target.dataset.changed;
    if (target.dataset.role === "model") chat.updateModelMessage(target, markdown.turndown(target.innerHTML));
    chat.saveChatMessages();
  }
});

// チャット
buttonGenerate.addEventListener("click", chat.addNewMessage);
document.addEventListener("keydown", evt => {
  const /** @type {HTMLElement} */ target = evt.target;
  if (target === inputUser || target === inputModel) {
    if (evt.key === "Enter" && evt.ctrlKey) {
      evt.preventDefault();
      chat.addNewMessage();
      arrangeInputForm();
    }
  }
  if (target.tagName === "ARTICLE" && sectionChat.contains(target)) {
    if (evt.key === "Enter" && evt.ctrlKey) {
      evt.preventDefault();
      chat.regenerageMessage();
    }
  }
});
buttonGenerateFromMiddle.addEventListener("click", evt => { chat.regenerageMessage(); });
asideErrorMessage.addEventListener("click", () => { asideErrorMessage.hidden = true; });

// 画像・ペースト
document.addEventListener("paste", async evt => {
  evt.preventDefault();

  const editableRoot = /** @type {HTMLElement} */(evt.target).closest('[contenteditable="true"], textarea');
  if (!editableRoot) return;
  if (editableRoot === inputUser || editableRoot.tagName === "ARTICLE" && sectionChat.contains(editableRoot) && editableRoot.dataset.role === "user") {
    const images = [...evt.clipboardData.items].filter(item => item.type.startsWith("image"));
    if (images.length) for (const image of images) {
      const blob = image.getAsFile();
      const clone = templateUserImage.content.cloneNode(true), /** @type {HTMLElement} */elmFigure = clone.querySelector("figure"), elmImage = clone.querySelector("img");
      elmImage.src = URL.createObjectURL(blob);
      if (editableRoot.previousElementSibling?.dataset.role === "user-image") editableRoot.previousElementSibling.append(elmFigure);
      else editableRoot.insertAdjacentElement("beforebegin", clone.querySelector("article"));

      const res = await cloudinary.upload(blob, { folder: "easy_ai_chat" });
      delete elmFigure.dataset.uploading;
      elmImage.src = res.url;
      if (sectionChat.contains(editableRoot)) chat.saveChatMessages();
      return;
    }
  }

  const text = evt.clipboardData.getData("text/plain");
  if (text) document.execCommand("insertText", false, text);
});
document.body.addEventListener("click", evt => {
  const /** @type {HTMLElement} */ target = evt.target;
  if (target.classList.contains("button-delete-image")) {
    const article = target.closest("article");
    target.closest("figure").remove();
    if (sectionChat.contains(article) && article.childElementCount === 0) article.remove();
  }
});

// メニュー
(() => {
  const addListener = /** @param {HTMLElement} elm */(elm, handler) => { elm.addEventListener("click", handler); };
  addListener(menuClearAllLocalStorage, () => { if (confirm("Are you sure?")) localStorage.clear(); });
  addListener(menuSetGeminiApiKey, () => {
    const key = prompt("Input Gemini API key.");
    if (key) gemini.setApiKey(key);
  });
  addListener(menuSetCloudinaryApiKey, () => {
    const cloudName = prompt("Input Cloudinary Cloud Name.");
    if (!cloudName) return;
    const apiKey = prompt("Input Cloudinary API key.");
    if (!apiKey) return;
    const apiSecret = prompt("Input Cloudinary API secret.");
    if (!apiSecret) return;
    cloudinary.init(cloudName, apiKey, apiSecret);
  });
  addListener(menuCheckLocalStorage, () => {
    alert(Object.entries(localStorage).map(([key, value], idx) => {
      const dispValue = JSON.stringify(value).length > 20 ? JSON.stringify(value).slice(0, 20) + "..." : JSON.stringify(value);
      return `[${idx}] ${JSON.stringify(key)}: ${dispValue}`;
    }).join("\n"));
  });
  addListener(menuOverwriteMessages, () => {
    const messagesText = prompt("new messages? (JSON)");
    try { JSON.parse(messagesText); }
    catch { alert("invalid JSON"); }
    localStorage.setItem(STORAGE_MESSAGES, messagesText);
    location.reload();
  });
  addListener(menuDeleteMessages, () => {
    if (!confirm("Are you sure?")) return;
    localStorage.removeItem(STORAGE_MESSAGES);
    location.reload();
  });
})();

//------------------------------
// 初期表示
//------------------------------
((/** @type {K_GeneralAiChatMessage[]} */messages) => {
  if (!messages) return;
  messages.forEach(m => {
    if (m.user && typeof m.user === "string") chat.appendUserMessage(m.user);
    if (m.user?.url) chat.appendUserImage(m.user.url);
    if (m.assistant) chat.appendModelMessage(m.assistant);
  });
})(JSON.parse(localStorage.getItem(STORAGE_MESSAGES)));
