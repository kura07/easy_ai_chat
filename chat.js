/// <reference path="./jsdoc.js" />
"use strict";

const sectionChat = document.getElementById("chat");
const /** @type {HTMLTextAreaElement} */ inputUser = document.getElementById("input-user"), /** @type {HTMLTextAreaElement} */ inputModel = document.getElementById("input-model");
const /** @type {HTMLButtonElement} */ buttonSend = document.getElementById("send");


// 画像ペーストに対応する
const onPasteImage = function (evt) {
  const images = [...evt.clipboardData.items].filter(item => item.type.startsWith("image"));
  if (images.length === 0) return;
};
inputUser.addEventListener("paste", onPasteImage);


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