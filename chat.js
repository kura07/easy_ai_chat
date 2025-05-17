/// <reference path="./jsdoc.js" />
"use strict";

// JSDoc v0.11
/**
 * @typedef {object} Session
 * @prop {string} id
 * @prop {string} name
 * @prop {Date} timestamp
 * @prop {string} [messages]
 */
/**
 * @typedef {object} SessionList
 * @prop {Session[]} list
 * @prop {Session} latest
 */

const STORAGE_MESSAGES = (session => session ? `messages-${session}` : "messages")(new URLSearchParams(location.search).get("session"));
const STORAGE_URL = "storage_url";
const IS_IPHONE = navigator.userAgent.match(/iPhone/);

//------------------------------
// 要素取得
//------------------------------
const byId = id => document.getElementById(id);
const
	sectionChat = byId("chat"),
	templateUser = /** @type {HTMLTemplateElement} */(byId("template-user")),
	templateUserImage = /** @type {HTMLTemplateElement} */(byId("template-user-image")),
	templateModel = /** @type {HTMLTemplateElement} */(byId("template-model")),
	buttonGenerateFromMiddle = /** @type {HTMLButtonElement} */(byId("generate-from-middle")),
	templateIconUpdaing = /** @type {HTMLTemplateElement} */(byId("template-updating"));
const
	sectionInput = /** @type {HTMLTextAreaElement} */(byId("input")),
	inputUserImage = /** @type {HTMLTextAreaElement} */(byId("input-user-image")),
	inputUser = /** @type {HTMLTextAreaElement} */(byId("input-user")),
	inputModel =  /** @type {HTMLTextAreaElement} */(byId("input-model")),
	buttonGenerate = /** @type {HTMLButtonElement} */(byId("generate")),
	asideEditTool = /** @type {HTMLButtonElement} */(byId("edit-tool"));

//------------------------------
// チャット処理関数たち
//------------------------------
const chat = {

	_sessionId: null,
	_sessionName: null,
	storageUrl: localStorage.getItem(STORAGE_URL),

	/**
	 * チャット画面を初期化します。
	 * @param {string} sessionId 
	 * @param {string} sessionName 
	 * @param {K_GeneralAiChatMessage[]} messages 
	 */
	init(sessionId, sessionName, messages = []) {
		this._sessionId = sessionId;
		this._sessionName = sessionName;
		messages.forEach(m => {
			if (m.user && typeof m.user === "string") this.appendUserMessage(m.user);
			if (m.user?.url) this.appendUserImage(m.user.url);
			if (m.assistant) this.appendModelMessage(m.assistant);
		});

		// targetが過去メッセージのarticle要素かどうか
		const isPastMessage = (/**@type{HTMLElement}*/target) => target.tagName === "ARTICLE" && sectionChat.contains(target);

		document.addEventListener("input", evt => {
			const /** @type {HTMLElement} */ target = evt.target;
			if (target === inputUser || target === inputModel) this.arrangeInputForm();
			else if (isPastMessage(target)) target.dataset.changed = "true";
		});

		document.addEventListener("focusin", evt => {
			const /** @type {HTMLElement} */ target = evt.target;
			if (isPastMessage(target)) {
				buttonGenerateFromMiddle.hidden = false;
				target.insertAdjacentElement("afterend", buttonGenerateFromMiddle);
			}
		});

		// チャット
		buttonGenerate.addEventListener("click", () => { this.addNewMessage(); });
		document.addEventListener("keydown", evt => {
			const /** @type {HTMLElement} */ target = evt.target;
			if (target === inputUser || target === inputModel) {
				if (evt.key === "Enter" && evt.ctrlKey) {
					evt.preventDefault();
					this.addNewMessage();
					this.arrangeInputForm();
				}
			}
			if (isPastMessage(target)) {
				if (evt.key === "Enter" && evt.ctrlKey) {
					evt.preventDefault();
					this.regenerageMessage();
				}
			}
		});
		buttonGenerateFromMiddle.addEventListener("click", () => { this.regenerageMessage(); });

		// 画像・ペースト
		document.addEventListener("paste", async evt => {
			evt.preventDefault();
			const editableRoot = /** @type {HTMLElement} */(evt.target).closest('[contenteditable="true"], textarea');
			if (!editableRoot) return;
			const image = [...evt.clipboardData.items].filter(item => item.type.startsWith("image"))?.[0];

			// 画像貼り付け
			if (image && (editableRoot === inputUser || editableRoot.tagName === "ARTICLE" && sectionChat.contains(editableRoot) && editableRoot.dataset.role === "user")) {

				// alert([...evt.clipboardData.items].map(item => `${item.kind}:${item.type}`).join("\n"));

				// URL情報もあるならそれを参照する
				const url = null && await (async () => {
					const htmlItem = [...evt.clipboardData.items].filter(item => item.type === "text/html")?.[0];
					if (!htmlItem) return null;
					const html = await new Promise(res => htmlItem.getAsString(res));
					const url = new DOMParser().parseFromString(html, "text/html").querySelector("img")?.src;
					return url || null;
				})();

				if (url) this.attachImage(editableRoot, { url });
				else this.attachImage(editableRoot, { blob: image.getAsFile() });
				if (sectionChat.contains(editableRoot)) chat.saveChatMessages();
			}
			else {
				const text = evt.clipboardData.getData("text/plain");
				if (text) document.execCommand("insertText", false, text);
			}
		});

		document.body.addEventListener("click", evt => {
			const /** @type {HTMLElement} */ target = evt.target;
			if (target.classList.contains("button-delete-image")) {
				const article = target.closest("article");
				target.closest("figure").remove();
				if (sectionChat.contains(article) && article.childElementCount === 0) article.remove();
			}
		});

		// テキストが編集されたときにメッセージ内容を保存するイベントリスナ
		if (!IS_IPHONE) sectionChat.addEventListener("focusout", evt => {
			const /** @type {HTMLElement} */ target = evt.target;
			if (target.tagName === "ARTICLE" && target.dataset.changed === "true") {
				delete target.dataset.changed;
				if (target.dataset.role === "model") chat.updateModelMessage(target, markdown.turndown(target.innerHTML));
				chat.saveChatMessages();
			}
		});
		else window.addEventListener("k-keyboardclose", () => {
			const targets = [...sectionChat.querySelectorAll("article")].filter(a => a.dataset.changed === "true");
			targets.forEach(target => {
				delete target.dataset.changed;
				if (target.dataset.role === "model") chat.updateModelMessage(target, markdown.turndown(target.innerHTML));
			});
			if (targets.length > 0) chat.saveChatMessages();
		});
	},

	/**
	 * 画像を貼り付ける。
	 * @param {HTMLElement} target - 通常はinputUserあるいは<article role="user">
	 * @param {{blob?:Blob, url?:string}} obj
	 */
	async attachImage(target, { blob, url }) {
		const clone = templateUserImage.content.cloneNode(true), /** @type {HTMLElement} */elmFigure = clone.querySelector("figure"), elmAnchor = clone.querySelector("a"), elmImage = clone.querySelector("img");
		if (target === inputUser) inputUserImage.append(elmFigure);
		else if (target.previousElementSibling?.dataset.role === "user-image") target.previousElementSibling.append(elmFigure);
		else target.insertAdjacentElement("beforebegin", clone.querySelector("article"));

		if (url) {
			elmImage.src = elmAnchor.href = url;
			delete elmFigure.dataset.uploading;
		}
		else if (blob) {
			elmImage.src = elmAnchor.href = URL.createObjectURL(blob);
			const res = await cloudinary.upload(blob, { folder: "easy_ai_chat" });
			delete elmFigure.dataset.uploading;
			elmImage.src = elmAnchor.href = res.url;
		}
	},

	/**
	 * 新しいメッセージを追加して、テキスト生成AIのレスポンスを得ます。
	 */
	async addNewMessage() {
		const inputTextUser = inputUser.value, inputTextModel = inputModel.value;
		inputUser.value = inputModel.value = "";
		buttonGenerateFromMiddle.hidden = true;
		inputUserImage.querySelectorAll("figure").forEach(figure => {
			if (figure.dataset.uploading === "true") return;
			const url = figure.querySelector("img").src;
			figure.remove();
			this.appendUserImage(url);

		})
		this.appendUserMessage(inputTextUser);
		const articleModelMessage = this.appendModelMessage(inputTextModel);
		this.saveChatMessages();
		this.arrangeInputForm();
		window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
		await this.fetchMessage(articleModelMessage, inputTextModel);
	},

	/**
	 * #generate-from-middleが存在する途中からメッセージを生成します。以前のメッセージは削除されます。
	 */
	async regenerageMessage() {
		while (buttonGenerateFromMiddle.nextElementSibling) buttonGenerateFromMiddle.nextElementSibling.remove();
		buttonGenerateFromMiddle.hidden = true;
		const articleModelMessage = sectionChat.lastElementChild.dataset.role === "model" ? sectionChat.lastElementChild : this.appendModelMessage("");
		const inputTextModel = articleModelMessage.dataset.markdown;
		await this.fetchMessage(articleModelMessage, inputTextModel);
	},

	/**
	 * Gemini APIに送信してメッセージを取得します。
	 * @param {HTMLElement} articleModelMessage
	 * @param {string} [inputTextModel]
	 * @param {number} [tryTimes]
	 */
	async fetchMessage(articleModelMessage, inputTextModel = "", tryTimes = 0) {
		sectionChat.querySelectorAll("article").forEach(a => { if (a !== articleModelMessage && a.innerText.trim() === "") a.remove(); });
		articleModelMessage.dataset.loading = "true";
		const res = await gemini.createMessage(this.getMessagesFromChatSection().slice(-200));
		delete articleModelMessage.dataset.loading;
		if (res.error) {
			tryTimes++;
			error.show(`[${tryTimes}] ${new Date().toLocaleTimeString()}\n${JSON.stringify(res.originalResponse, null, 2)}`);
			if (tryTimes < 3) return await this.fetchMessage(articleModelMessage, inputTextModel, tryTimes);
			else alert("3度トライしましたがすべて失敗しました。");
		}
		else {
			this.updateModelMessage(articleModelMessage, inputTextModel + res.text);
			articleModelMessage.scrollIntoView({ behavior: "smooth", block: "start" });
			setTimeout(() => { autoscroll.start(); }, 1000);
			this.saveChatMessages();
		}
	},

	/**
	 * #chat の中身を読み取り、メッセージ配列に変換します。
	 * @return {K_GeneralAiChatMessage[]}
	 */
	getMessagesFromChatSection() {
		const articles = [...sectionChat.querySelectorAll("article")].slice(-150);
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
		const clone = templateUserImage.content.cloneNode(true), /** @type {HTMLElement} */figure = clone.querySelector("figure"),
			a = clone.querySelector("a"), image = clone.querySelector("img");
		delete figure.dataset.uploading;
		a.href = image.src = url;
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
		this.updateModelMessage(article, markdownText);
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
	async saveChatMessages() {
		const clone = templateIconUpdaing.content.cloneNode(true), figure = clone.querySelector("figure");
		templateIconUpdaing.parentElement.append(clone);
		const httpRes = await fetch(this.storageUrl, { method: "post", body: JSON.stringify({ action: "update", sessionId: this._sessionId, timestamp: Date.now(), newMessages: this.getMessagesFromChatSection(), newSessionName: this._sessionName }) });
		if (!httpRes.ok) error.show(await httpRes.text());
		figure.remove();
	},

	/**
	 * inputのフォームを整えます。<textarea>の高さを調節し、送信ボタンの有効/無効を切り替えます。
	 */
	arrangeInputForm() {
		const resize = /** @param {HTMLTextAreaElement} elm */ elm => { elm.style.height = "auto"; elm.style.height = `${elm.scrollHeight}px`; };
		buttonGenerate.disabled = inputUser.value === "";
		resize(inputUser);
		resize(inputModel);
	},
};


//------------------------------
// エラーメッセージ
//------------------------------
const error = {
	_elm: /** @type {HTMLElement} */ (byId("error-message")),
	init() {
		this._elm.addEventListener("click", () => { this.hide(); });
	},
	show(message) {
		this._elm.hidden = false;
		this._elm.innerText = message;
	},
	hide() {
		this._elm.hidden = true;
	}
};
error.init();

//------------------------------
// オートスクロール
//------------------------------
const autoscroll = {
	_button: byId("autoscroll"),
	_isEnabled: false,
	_scrollStep() { window.scrollBy(0, 1); },
	_interval: 1000 / 30,
	_intervalId: null,

	start() {
		if (this._isEnabled) return;
		this._isEnabled = true;
		this._button.hidden = true;
		this._intervalId = setInterval(this._scrollStep, this._interval);
	},
	stop() {
		if (!this._isEnabled) return;
		this._isEnabled = false;
		this._button.hidden = false;
		clearInterval(this._intervalId);
	},
};
window.addEventListener("wheel", () => { autoscroll.stop(); });
window.addEventListener("touchstart", () => { autoscroll.stop(); });
window.addEventListener("keydown", () => { autoscroll.stop(); });
window.addEventListener("mousedown", () => { autoscroll.stop(); });
autoscroll._button.addEventListener("click", () => { autoscroll.start(); });


//------------------------------
// オートスクロール
//------------------------------
(() => {
	const
		menuClearAllLocalStorage = byId("clear_all_local_storage"),
		menuSetGeminiApiKey = byId("set_gemini_api_key"),
		menuSetCloudinaryApiKey = byId("set_cloudinary_api_key"),
		menuSetStorageUrl = byId("set_storage_url"),
		menuCheckLocalStorage = byId("check_local_stotage"),
		menuOverwriteMessages = byId("overwrite_messages"),
		menuDeleteMessages = byId("delete_messages");
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
	addListener(menuSetStorageUrl, () => {
		const url = prompt("Input url.")
		if (url) {
			localStorage.setItem(STORAGE_URL, url);
			chat.storageUrl = url;
		}
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
// 画像一覧
//------------------------------
document.querySelector("#image-list-menu details").addEventListener("toggle", evt => {
	if (evt.target.open) {
		document.querySelectorAll("#image-list :not(template)").forEach(elm => { elm.remove(); });
		const imageList = byId("image-list"), /** @type {HTMLTemplateElement} */ template = byId("template-image-list-image");
		const imageUrlList = [...new Set([...sectionChat.querySelectorAll("figure img")].map(img => img.src))];
		imageUrlList.forEach(url => {
			const clone = template.content.cloneNode(true);
			clone.querySelector("a").href = url;
			clone.querySelector("img").src = url;
			clone.querySelector(".button-use-image").dataset.imageUrl = url;
			imageList.append(clone);
		});
	}
});
byId("image-list").addEventListener("click", evt => {
	const /** @type {HTMLButtonElement} */ target = evt.target;
	if (target.classList.contains("button-use-image")) chat.attachImage(inputUser, { url: target.dataset.imageUrl });
});


//------------------------------
// セッションリスト表示
//------------------------------
const session = {
	_elmWrapper: byId("session-list-wrapper"),
  /** @type {Session[]} */ _list: null,
  /** @type {Session} */_latest: null,

	async showList() {
		const /** @type {HTMLTemplateElement} */ templateSession = byId("template-session");

		// クリックイベントを設定
		this._elmWrapper.addEventListener("click", async evt => {
			const /** @type {HTMLButtonElement} */ target = evt.target;
			if (target.tagName !== "BUTTON") return;
			const sessionId = /**@type{HTMLLIElement}*/(target.closest("[data-session-id]")).dataset.sessionId;
			if (target.classList.contains("session-name")) this.select(sessionId);
			else if (target.classList.contains("session-rename")) this.rename(sessionId);
			else if (target.classList.contains("session-delete")) this.delete(sessionId);
		});

		this._elmWrapper.dataset.loading = "true";
    /** @type {SessionList} */ ({ list: this._list, latest: this._latest }
			= await (await fetch(`${chat.storageUrl}?${new URLSearchParams({ action: "list" })}`)).json());
		this._elmWrapper.dataset.loading = "false";

		for (const session of this._list) {
			const clone = templateSession.content.cloneNode(true), /** @type {HTMLLIElement} */ li = clone.querySelector("li"), /** @type {HTMLButtonElement} */ buttonName = clone.querySelector(".session-name"), spanTimestamp = clone.querySelector(".timestamp");
			li.dataset.sessionId = session.id;
			buttonName.innerText = session.name;
			const time = new Date(session.timestamp);
			spanTimestamp.innerText = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${String(time.getMinutes()).padStart(2, "0")}`;
			templateSession.parentElement.append(clone);
		}
	},

	getSessionAndLiElement(sessionId) {
		const session = this._list.find(s => s.id === sessionId);
		const li = [...this._elmWrapper.querySelectorAll("li")].find(li => li.dataset.sessionId === sessionId);
		return { session, li };
	},

	async select(sessionId) {
		this._elmWrapper.hidden = true;
		sectionInput.hidden = false;
		if (sessionId === "_new") chat.init(`session_${Date.now()}`, "no title");
		else {
			const { session } = this.getSessionAndLiElement(sessionId);
			sectionChat.dataset.loading = "true";
			const messages = sessionId === this._latest.id ? this._latest.messages
				: await (await fetch(`${chat.storageUrl}?${new URLSearchParams({ action: "get_messages", sessionId })}`)).json();
			chat.init(sessionId, session.name, messages);
			sectionChat.dataset.loading = "false";
			window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
		}
	},

	async rename(sessionId) {
		const { session, li } = this.getSessionAndLiElement(sessionId);
		const newSessionName = prompt("新しい名前を決めてください。", session.name);
		if (newSessionName && newSessionName !== session.name) {
			await fetch(chat.storageUrl, { method: "post", body: JSON.stringify({ action: "update", sessionId, timestamp: Date.now(), newSessionName }) });
			li.querySelector(".session-name").innerText = newSessionName;
			session.name = newSessionName;
		}
	},

	async delete(sessionId) {
		const { session, li } = this.getSessionAndLiElement(sessionId);
		if (confirm(`Are you sure to delete "${session.name}"?`)) {
			li.remove();
			fetch(chat.storageUrl, { method: "post", body: JSON.stringify({ action: "delete", sessionId }) });
		}
	},
};

//------------------------------
// iPhoneの仮想キーボード対策
//------------------------------
const inputAdjuster = {
	_frameId: null,
	_isEnabled: false,

	init() {
		visualViewport.addEventListener("resize", evt => {
			const isKeyboardOpen = visualViewport.height < 400;
			sectionInput.hidden = isKeyboardOpen && sectionChat.contains(document.activeElement);
			if (this._isEnabled === isKeyboardOpen) return;
			this._isEnabled = isKeyboardOpen;
			if (isKeyboardOpen) window.dispatchEvent(new Event("k-keyboardopen"));
			else window.dispatchEvent(new Event("k-keyboardclose"));
		});
		window.addEventListener("k-keyboardopen", () => { this.startAdjust(); });
		window.addEventListener("k-keyboardclose", () => { this.stopAdjust(); });
	},

	startAdjust() {
		if (this._frameId !== null) return;
		sectionInput.classList.add("for-iphone");
		const setInputPos = () => {
			const visualHeight = visualViewport.height;
			const inputHeight = sectionInput.getBoundingClientRect().height;
			// const keyboardHeight = window.innerHeight - visualViewport.height;
			sectionInput.style.top = `${scrollY + visualHeight - inputHeight}px`;
			this._frameId = requestAnimationFrame(setInputPos);
		};
		setInputPos();
	},

	stopAdjust() {
		if (this._frameId === null) return;
		sectionInput.classList.remove("for-iphone");
		cancelAnimationFrame(this._frameId);
		this._frameId = null;
	},
};
if (IS_IPHONE) inputAdjuster.init();

session.showList();
// session.select("_new")