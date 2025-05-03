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
  async addNewMessageAndGetResponse() {
    const nextUserText = inputUser.value, nextModelText = inputModel.value;
    inputUser.value = inputModel.value = "";
    chat.appendUserMessage(nextUserText);
    const elmModelResponse = chat.appendModelMessage(nextModelText);
    elmModelResponse.dataset.status = "loading";

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
    article.innerHTML = markdown.parse(markdownText);
    article.dataset.markdown = markdownText;
    sectionChat.append(clone);
    return article;
  },

  /**
   * #chat の内容を localStorage に保存します。
   */
  saveChatMessages() { localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(chat.getMessagesFromChatSection())); },
};

//------------------------------
// イベントリスナ定義
//------------------------------
// input
(() => {
  const resize = /** @param {HTMLTextAreaElement} elm */ elm => { elm.style.height = "auto"; elm.style.height = `${elm.scrollHeight}px`; };
  document.addEventListener("input", evt => {
    const /** @type {HTMLElement} */ target = evt.target;
    if (target === inputUser) {
      buttonGenerate.disabled = inputUser.value === "";
      resize(inputUser);
    }
    else if (target === inputModel) resize(inputModel);
    else if (target.tagName === "ARTICLE" && sectionChat.contains(target)) target.dataset.changed = "true";
  });
})();
// focusin
document.addEventListener("focusin", evt => {
  const /** @type {HTMLElement} */ target = evt.target;
  if (target.tagName === "ARTICLE" && sectionChat.contains(target)) {
  }
});
// focusout
document.addEventListener("focusout", evt => {
  const /** @type {HTMLElement} */ target = evt.target;
  if (target.tagName === "ARTICLE" && sectionChat.contains(target) && target.dataset.changed === "true") {
    delete target.dataset.changed;
    if (target.dataset.role === "model") target.dataset.markdown = markdown.turndown(target.innerHTML);
    chat.saveChatMessages();
  }
});

// チャット
buttonGenerate.addEventListener("click", chat.addNewMessageAndGetResponse);
[inputUser, inputModel].forEach(elm => {
  elm.addEventListener("keydown", evt => {
    if (evt.key === "Enter" && evt.ctrlKey) {
      evt.preventDefault();
      chat.addNewMessageAndGetResponse();
      inputUser.dispatchEvent(new Event("input"));
    }
  });
});
buttonGenerateFromMiddle.addEventListener("click", () => alert());

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
