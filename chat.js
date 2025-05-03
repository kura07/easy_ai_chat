/// <reference path="./jsdoc.js" />
"use strict";

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
  buttonSend = /** @type {HTMLButtonElement} */(byId("send"));
const
  menuClearAllLocalStorage = byId("clear_all_local_storage"),
  menuSetGeminiApiKey = byId("set_gemini_api_key"),
  menuSetCloudinaryApiKey = byId("set_cloudinary_api_key"),
  menuCheckLocalStorage = byId("check_local_stotage");

//------------------------------
// チャット処理関数たち
//------------------------------
const sendGemini = async () => {
  const nextUserText = inputUser.value, nextModelText = inputModel.value;
  inputUser.value = inputModel.value = "";
  appendUserMessage(nextUserText);
  const /** @type {K_GeminiContent[]} */ rawContents = [
    { user: nextUserText },
    ...nextModelText ? [{ model: nextModelText }] : [],
  ];
  const newModelText = await Gemini.createMessage(rawContents);
  appendModelMessage(nextModelText + newModelText);
};
const appendUserMessage = text => {
  const /** @type {HTMLElement} */ clone = templateUser.content.cloneNode(true), article = clone.querySelector("article");
  article.innerText = text;
  sectionChat.append(clone);
};
const appendModelMessage = markdownText => {
  const /** @type {HTMLElement} */ clone = templateModel.content.cloneNode(true), article = clone.querySelector("article");
  article.innerHTML = MarkDown.parse(markdownText);
  article.dataset.markdown = markdownText;
  sectionChat.append(clone);
};
const saveChatMessages = () => {
  const articles = [...sectionChat.querySelectorAll("article")];
  const messages = articles.map(/** @return {K_GeneralAiChatMessage} */a => {
    if (a.dataset.role === "user") return { user: a.innerText };
    if (a.dataset.role === "model") return { assistant: a.dataset.markdown };
  });
  localStorage.setItem("messages", JSON.stringify(messages));
};

//------------------------------
// イベントリスナ定義
//------------------------------
// チャット
document.getElementById("send").addEventListener("click", sendGemini);
(() => {
  const resize = /** @this {HTMLTextAreaElement} */ function () {
    this.style.height = "auto";
    this.style.height = `${this.scrollHeight}px`;
  };
  inputUser.addEventListener("input", resize);
  inputModel.addEventListener("input", resize);
})();
inputUser.addEventListener("input", () => { buttonSend.disabled = inputUser.value === ""; });
[inputUser, inputModel].forEach(elm => {
  elm.addEventListener("keydown", evt => {
    if (evt.key === "Enter" && evt.ctrlKey) {
      evt.preventDefault();
      sendGemini();
      inputUser.dispatchEvent(new Event("input"));
    }
  });
});
// メニュー
menuClearAllLocalStorage.addEventListener("click", () => { if (confirm("Are you sure?")) localStorage.clear(); });
menuSetGeminiApiKey.addEventListener("click", () => {
  const key = prompt("Input Gemini API key.");
  if (key) gemini.setApiKey(key);
});
menuSetCloudinaryApiKey.addEventListener("click", () => {

});
menuCheckLocalStorage.addEventListener("click", () => {
  alert(Object.entries(localStorage).map(([key, value], idx) => {
    const dispValue = JSON.stringify(value).length > 20 ? JSON.stringify(value).slice(0, 20) + "..." : JSON.stringify(value);
    return `[${idx}] ${JSON.stringify(key)}: ${dispValue}`;
  }).join("\n"));
});
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
    if (m.user) appendUserMessage(m.user);
    if (m.assistant) appendModelMessage(m.assistant);
  });
})(JSON.parse(localStorage.getItem("messages")));
