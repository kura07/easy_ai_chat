/// <reference path="./jsdoc.js" />
"use strict";

const STORAGE_MESSAGES = "messages";

//------------------------------
// 要素取得
//------------------------------
const byId = id => document.getElementById(id);
const
  sectionChat = byId("chat"),
  templateUser = /** @type {HTMLTemplateElement} */(byId("template-user")),
  templateModel = /** @type {HTMLTemplateElement} */(byId("template-model"));
const
  inputUser = /** @type {HTMLTextAreaElement} */(byId("input-user")),
  inputModel =  /** @type {HTMLTextAreaElement} */(byId("input-model")),
  buttonGenerate = /** @type {HTMLButtonElement} */(byId("generate")),
  buttonGenerateFromMiddle = /** @type {HTMLButtonElement} */(byId("generate-from-middle"));
const
  menuClearAllLocalStorage = byId("clear_all_local_storage"),
  menuSetGeminiApiKey = byId("set_gemini_api_key"),
  menuSetCloudinaryApiKey = byId("set_cloudinary_api_key"),
  menuCheckLocalStorage = byId("check_local_stotage"),
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
   */
  async fetchMessage(articleModelMessage, inputTextModel = "") {
    sectionChat.querySelectorAll("article").forEach(a => { if (a !== articleModelMessage && a.innerText.trim() === "") a.remove(); });
    articleModelMessage.dataset.status = "loading";
    const res = await gemini.createMessage(chat.getMessagesFromChatSection());
    delete articleModelMessage.dataset.status;
    if (res.error) { alert(JSON.stringify(res.originalResponse)); }
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
    return articles.map(/** @return {K_GeneralAiChatMessage} */a => {
      if (a.dataset.role === "user") return { user: a.innerText };
      if (a.dataset.role === "model") return { assistant: a.dataset.markdown };
    });
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
  setTimeout(smoothAutoScroll, 1000 / 20);
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

// メニュー
(() => {
  const addListener = /** @param {HTMLElement} elm */(elm, handler) => { elm.addEventListener("click", handler); };
  addListener(menuClearAllLocalStorage, () => { if (confirm("Are you sure?")) localStorage.clear(); });
  addListener(menuSetGeminiApiKey, () => {
    const key = prompt("Input Gemini API key.");
    if (key) gemini.setApiKey(key);
  })
  addListener(menuCheckLocalStorage, () => {
    alert(Object.entries(localStorage).map(([key, value], idx) => {
      const dispValue = JSON.stringify(value).length > 20 ? JSON.stringify(value).slice(0, 20) + "..." : JSON.stringify(value);
      return `[${idx}] ${JSON.stringify(key)}: ${dispValue}`;
    }).join("\n"));
  });
  addListener(menuDeleteMessages, () => {
    if (!confirm("Are you sure?")) return;
    localStorage.removeItem(STORAGE_MESSAGES);
    location.reload();
  });
})();

// 画像ペーストに対応する
const onPasteImage = function (evt) {
  const images = [...evt.clipboardData.items].filter(item => item.type.startsWith("image"));
  if (images.length === 0) return;
};
inputUser.addEventListener("paste", onPasteImage);

//------------------------------
// 初期表示
//------------------------------
((/** @type {K_GeneralAiChatMessage[]} */messages) => {
  if (!messages) return;
  messages.forEach(m => {
    if (m.user) chat.appendUserMessage(m.user);
    if (m.assistant) chat.appendModelMessage(m.assistant);
  });
})(JSON.parse(localStorage.getItem(STORAGE_MESSAGES)));
