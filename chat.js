/// <reference path="./jsdoc.js" />
"use strict";

// 要素を取得しておく
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
  menuSetCloudinaryApiKey = byId("set_cloudinary_api_key");

// テキストエリアのイベント
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


// 送信
const sendGemini = async () => {
  const nextUserText = inputUser.value, nextModelText = inputModel.value;
  inputUser.value = inputModel.value = "";
  appendUserMessage(nextUserText);
  const /** @type {K_GeminiContent[]} */ rawContents = [
    { user: nextUserText },
    ...nextModelText ? [{ model: nextModelText }] : [],
  ];
  const newModelText = await simpleGeminiCreateMessage(rawContents);
  appendModelMessage(nextModelText + newModelText);
};
document.getElementById("send").addEventListener("click", sendGemini);

const appendUserMessage = text => {
  const /** @type {HTMLElement} */ clone = /**@type{HTMLTemplateElement}*/(document.getElementById("template-user")).content.cloneNode(true);
  clone.querySelector("article").innerText = text;
  sectionChat.append(clone);
};
const appendModelMessage = markdownText => {
  const /** @type {HTMLElement} */ clone = /**@type{HTMLTemplateElement}*/(document.getElementById("template-model")).content.cloneNode(true);
  clone.querySelector("article").innerHTML = marked.parse(markdownText);
  sectionChat.append(clone);
};



// 画像ペーストに対応する
const onPasteImage = function (evt) {
  const images = [...evt.clipboardData.items].filter(item => item.type.startsWith("image"));
  if (images.length === 0) return;
};
inputUser.addEventListener("paste", onPasteImage);