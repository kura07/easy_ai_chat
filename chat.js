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
// 処理関数たち
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
  const /** @type {HTMLElement} */ clone = /**@type{HTMLTemplateElement}*/(document.getElementById("template-user")).content.cloneNode(true);
  clone.querySelector("article").innerText = text;
  sectionChat.append(clone);
};
const appendModelMessage = markdownText => {
  const /** @type {HTMLElement} */ clone = /**@type{HTMLTemplateElement}*/(document.getElementById("template-model")).content.cloneNode(true);
  clone.querySelector("article").innerHTML = marked.parse(markdownText);
  sectionChat.append(clone);
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