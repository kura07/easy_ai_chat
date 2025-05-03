/**
 * kライブラリ JSDoc v3.25a
 */

/**
 * @typedef {<R,I>(
 *  iterator: Iterable<I>, operation: (arg:I)=>{success:boolean,result:R,stop?:boolean}, option?: { muteExceptions?: boolean }
 * ) => {
 *  success:boolean, result?:R, retries:R[], exception?:Error
 * }} K_Function_RepeatByIterable
 */
/**
 * @typedef {<R>(
 *  operation: (arg:number)=>{success:boolean,result:R,stop?:boolean}, option?: { maxRetry: number, muteExceptions?: boolean }
 * ) => {
 *  success:boolean, result?:R, retries:R[], exception?:Error
 * }} K_Function_RepeatByCount
 */
/** @typedef {<T>(ary:T[], sort:"ascending"|"descending") => {item:T, count:number}[]} K_Function_CountOccurrences */
/** @typedef {<T>(operation:()=>T, option?:{maxRetry?:number, intervalMsec?:number}) => T} K_Function_TrySeveralTimes */
/** @typedef {<T>(execute:()=>T, fallbackValue:T, option:{onError?:(err:Error)=>void}) => T} K_Function_TryOrDefault */

/**
 * @typedef {object} K_LocalStorage
 * @prop {(sheet:SpreadsheetApp.Sheet)=>void} init
 * @prop {(key:string, value:object)=>void} setItem
 * @prop {(key:string)=>*} getItem
 * @prop {(...keys:string[])=>*[]} getItems
 * @prop {(key:string)=>void} removeItem
 * @prop {()=>void} flush
 */

// ------------------------------
//   General Ai Chat Message
// ------------------------------
/**
 * @typedef {object} K_GeneralAiChatMessage
 * @prop {string|K_GeneralAiChatMessageContent|K_GeneralAiChatMessageContent[]} [user]
 * @prop {string|K_GeneralAiChatMessageContent|K_GeneralAiChatMessageContent[]} [assistant]
 * @prop {string|K_GeneralAiChatMessageContent|K_GeneralAiChatMessageContent[]} [system]
 */
/**
 * @typedef {object} K_GeneralAiChatMessageContent
 * @prop {string} [text]
 * @prop {Blob} [blob]
 * @prop {string} [url]
 */
/** @typedef {"none"|"after_0"|"all"} K_EnumChatAiSystemToUser */
/** @typedef {"Gemini"|"Claude"|"OpenAI"} K_EnumGeneralAiChat */
/** @typedef {K_EnumGeminiModel|K_EnumClaudeModel|K_EnumOpenAiModel} K_EnumGeneralAiChatModel */
/**
 * @typedef {object} K_GeneralAiChatParam
 * @prop {number} [temperature]
 * @prop {number} [maxTokens]
 * @prop {"text"|"json"} [responseFormat]
 * @prop {boolean} [muteExceptions]
 */
/**
 * @typedef {object} K_GeneralAiChatResponse
 * @prop {string} bestChoice
 * @prop {number} responseCode
 * @prop {*} originalResponse
 * @prop {number} [price]
 * @prop {string} selectedModel
 * @prop {Error[]} [errors]
 */
/**
 * @typedef {object} K_GeneralAiChatTokens
 * @prop {number} input
 * @prop {number} output
 */

// ------------------------------
//   Gemini
// ------------------------------
/**
 * @typedef {object} K_GeminiContent
 * @prop {"user"|"model"} [role]
 * @prop {K_GeminiContentPart|K_GeminiContentPart[]} [parts]
 * @prop {string|K_GeminiContentPart|K_GeminiContentPart[]} [user]
 * @prop {string|K_GeminiContentPart|K_GeminiContentPart[]} [model]
 * @prop {string} [system]
 */
/**
 * @typedef {object} K_GeminiComputedContent
 * @prop {"user"|"model"} role
 * @prop {K_GeminiContentPart[]} parts
 */
/**
 * @typedef {object} K_GeminiContentPart
 * @prop {string} [text]
 * @prop {{mimeType:string,data:string}} [inlineData]
 */
/** @typedef {"gemini-2.0-flash-exp"|"gemini-2.0-flash"|"gemini-2.0-flash-thinking-exp"|"gemini-2.0-pro-exp"|"gemini-2.0-flash-exp-image-generation"|"gemini-2.5-flash-preview-04-17"} K_EnumGeminiModel */
/** @typedef {"OFF"|"BLOCK_NONE"|"BLOCK_LOW_AND_ABOVE"|"BLOCK_MEDIUM_AND_ABOVE"|"BLOCK_ONLY_HIGH"} K_EnumGeminiSafetyThreshold */
/** @typedef {"HARM_CATEGORY_SEXUALLY_EXPLICIT"|"HARM_CATEGORY_HATE_SPEECH"|"HARM_CATEGORY_HARASSMENT"|"HARM_CATEGORY_DANGEROUS_CONTENT"} K_EnumGeminiSafetyCategory */
/** @typedef {"sexuallyExplicit"|"hateSpeech"|"harassment"|"dangerousContent"} K_EnumGeminiSafetyCategoryLowerCamelCase */
/** @typedef {"HARM_PROBABILITY_UNSPECIFIED"|"NEGLIGIBLE"|"LOW"|"MEDIUM"|"HIGH"} K_EnumGeminiSafetyProbability */
/**
 * @typedef {object} K_GeminiParam
 * @prop {K_EnumGeminiModel} [model]
 * @prop {string} [systemInstruction]
 * @prop {number} [temperature]
 * @prop {"text/plain"|"application/json"} [responseMimeType]
 * @prop {number} [maxOutputTokens]
 * @prop {K_EnumGeminiSafetyThreshold} [safetyThreshold]
 * @prop {K_GeminiGenerationConfig} [generationConfig]
 * @prop {K_GeminiTool[]} [tools]
 * @prop {K_GeminiToolConfig} [tool_config]
 * @prop {boolean} [disallowEmptyResponse]
 * @prop {number} [maxRetry]
 * @prop {boolean} [returnsComputedPayload]
 * @prop {boolean} [muteExceptions]
 */
/**
 * @typedef {object} K_GeminiTool
 * @prop {object} [google_search]
 * @prop {K_GeminiFunctionDeclaration[]} [functionDeclarations]
 */
/**
 * @typedef {object} K_GeminiToolConfig
 * @prop {{mode:"AUTO"|"ANY"|"NONE"}} [function_calling_config]
 */
/**
 * @typedef {object} K_GeminiFunctionDeclaration
 * @prop {string} name
 * @prop {string} [description]
 * @prop {K_GeminiFunctionDeclarationParameter} [parameters]
 */
/**
 * @typedef {object} K_GeminiFunctionDeclarationParameter
 * @prop {"string"|"integer"|"boolean"|"number"|"array"|"object"} type
 * @prop {string} [description]
 * @prop {Record<string,K_GeminiFunctionDeclarationParameter>} [properties]
 * @prop {string[]} [required]
 * @prop {boolean} [nullable]
 */
/**
 * @typedef {object} K_GeminiGenerationConfig
 * @prop {number} [temperature]
 * @prop {number} [topP]
 * @prop {number} [topK]
 * @prop {number} [candidateCount]
 * @prop {number} [maxOutputTokens]
 * @prop {number} [presencePenalty]
 * @prop {number} [frequencyPenalty]
 * @prop {string[]} [stopSequences]
 * @prop {("Text"|"Image")[]} [responseModalities]
 * @prop {"application/json"|"text/plain"} [responseMimeType]
 * @prop {object} [responseSchema]
 * @prop {number} [seed]
 * @prop {boolean} [responseLogprobs]
 * @prop {number} [logprobs]
 * @prop {boolean} [audioTimestamp]
 */
/**
 * @typedef {object} K_GeminiComputedPayload
 * @prop {K_GeminiComputedContent[]} contents
 * @prop {{role:"user",parts:{text:string}[]}} systemInstruction
 * @prop {K_GeminiTool[]} tools
 * @prop {{category:K_EnumGeminiSafetyCategory,threshold:K_EnumGeminiSafetyThreshold}[]} safetySettings
 * @prop {K_GeminiGenerationConfig} generationConfig
 *
 */
/**
 * @typedef {object} K_GeminiOriginalResponse
 * @prop {K_GeminiOriginalResponseCandidate[]} candidates
 * @prop {K_GeminiOriginalResponseUsageMetadata} usageMetadata
 * @prop {string} modelVersion
 * @prop {{code:number,message:string,status:string}} [error]
 */
/**
 * @typedef {object} K_GeminiOriginalResponseCandidate
 * @prop {{parts:K_GeminiContentPart[],role:"model"}} content
 * @prop {"STOP"|"MAX_TOKENS"|"SAFETY"} finishReason
 * @prop {{category:K_EnumGeminiSafetyCategory,probability:K_EnumGeminiSafetyProbability}[]} safetyRatings
 * @prop {number} avgLogprobs
 */
/**
 * @typedef {object} K_GeminiOriginalResponseUsageMetadata
 * @prop {number} promptTokenCount
 * @prop {number} candidatesTokenCount
 * @prop {number} totalTokenCount
 * @prop {{modality:"TEXT"|"IMAGE",tokenCount:number}[]} promptTokensDetails
 * @prop {{modality:"TEXT"|"IMAGE",tokenCount:number}[]} candidatesTokensDetails
 */
/**
 * @typedef {object} K_GeminiResponse
 * @prop {number} responseCode
 * @prop {boolean} [error]
 * @prop {boolean} [success]
 * @prop {string[]} [choices]
 * @prop {string} [bestChoice]
 * @prop {K_GeminiOriginalResponse} originalResponse
 * @prop {K_GeneralAiChatTokens} tokens
 * @prop {K_GeminiComputedPayload} computedPayload
 * @prop {{responseCode:number, response:K_GeminiOriginalResponse}[]} retries
 */
/**
 * @typedef {object} K_GeminiProUsage
 * @prop {number} responseCode
 * @prop {K_GeneralAiChatTokens} [tokens]
 * @prop {string} [errorMessage]
 * @prop {number} datetime
 */

// ------------------------------
//   Claude
// ------------------------------
/**
 * @typedef {object} K_ClaudeMessage
 * @prop {string} [role]
 * @prop {string|K_ClaudeMessageContent|K_ClaudeMessageContent[]} [content]
 * @prop {string|K_ClaudeMessageContent|K_ClaudeMessageContent[]} [user]
 * @prop {string|K_ClaudeMessageContent|K_ClaudeMessageContent[]} [assistant]
 * @prop {string} [system]
 */
/** @typedef {"claude-3-haiku-20240307"|"claude-3-5-haiku-latest"|"claude-3-5-sonnet-latest"} K_EnumClaudeModel */
/**
 * @typedef {object} K_ClaudeMessageParam
 * @prop {K_EnumClaudeModel} [model]
 * @prop {string} [system]
 * @prop {number} [max_tokens]
 * @prop {{user_id:string}} [metadata]
 * @prop {string[]|null} [stop_sequences]
 * @prop {number} [temperature]
 * @prop {number} [top_p]
 * @prop {number} [top_k]
 * @prop {string} [anthropicVersion]
 * @prop {number} [max_retry]
 * @prop {boolean} [returnsComputedPayload]
 * @prop {boolean} [muteExceptions]
 */
/**
 * @typedef {object} K_ClaudeMessageContent
 * @prop {"text"|"image"} type
 * @prop {string} [text]
 * @prop {{type:string, media_type:string, data:string}} [source]
 */
/**
 * @typedef {object} K_ClaudeMessageOriginalResponse
 * @prop {{type:"text",text:string}[]} content
 * @prop {string} id
 * @prop {string} model
 * @prop {string} role
 * @prop {string} stop_reason
 * @prop {*} stop_sequence
 * @prop {string} type
 * @prop {{input_tokens:number,output_tokens:number}} usage
 */
/**
 * @typedef {object} K_ClaudeMessageResponse
 * @prop {number} responseCode
 * @prop {boolean} [error]
 * @prop {boolean} [success]
 * @prop {string} [choice]
 * @prop {string} [bestChoice]
 * @prop {K_ClaudeMessageOriginalResponse} originalResponse
 * @prop {number} price
 * @prop {K_GeneralAiChatTokens} tokens
 * @prop {{model:string, messages:{role:string,content:Array}[], system:string, max_tokens:number, metadata:*, stop_sequences:string[]|null, temperature:number, top_p:number, top_k:number}} computedPayload
 * @prop {{responseCode:number, response:K_ClaudeMessageOriginalResponse}[]} retries
 */

// ------------------------------
//   OpenAI
// ------------------------------
/**
 * @typedef {object} K_OpenAiMessage
 * @prop {"system"|"user"|"assistant"} [role]
 * @prop {string|K_OpenAiMessageContent|K_OpenAiMessageContent[]} [content]
 * @prop {string|K_OpenAiMessageContent|K_OpenAiMessageContent[]} [user]
 * @prop {string} [assistant]
 * @prop {string} [system]
 * @prop {string} [name]
 */
/**
 * @typedef {object} K_OpenAiMessageContent
 * @prop {"text"|"image_url"} type
 * @prop {string} [text]
 * @prop {{url:string,detail:K_EnumOpenAiImageDetail}} [image_url]
 */
/** @typedef {"gpt-4o"|"gpt-4o-mini"|"o1-preview"|"o1-mini"} K_EnumOpenAiModel */
/** @typedef {"high"|"low"|"auto"} K_EnumOpenAiImageDetail */
/**
 * @typedef {object} K_OpenAiParam
 * @prop {K_EnumOpenAiModel} [model]
 * @prop {number} [temperature]
 * @prop {number} [top_p]
 * @prop {number} [n]
 * @prop {number} [max_tokens]
 * @prop {string|string[]|null} [stop]
 * @prop {number} [presence_penalty]
 * @prop {number} [frequency_penalty]
 * @prop {object|null} [logit_bias]
 * @prop {string} [user]
 * @prop {"json_object"|"text"} [response_format]
 * @prop {number} [max_retry]
 * @prop {boolean} [returnsComputedPayload]
 * @prop {boolean} [muteExceptions]
 */
/**
 * @typedef {object} K_OpenAiConvertParam
 * @prop {boolean} imageToUser
 * @prop {boolean} convertUrlToBlob
 * @prop {K_EnumOpenAiImageDetail} imageDetail
 */
/**
 * @typedef {object} K_OpenAiResponse
 * @prop {number} responseCode
 * @prop {boolean} [error]
 * @prop {boolean} [success]
 * @prop {string} [bestChoice]
 * @prop {string[]} [choices]
 * @prop {number} [price]
 * @prop {{input:number, output:number}} [tokens]
 * @prop {K_OpenAiOriginalResponse} originalResponse
 * @prop {K_OpenAiComputedPayload} computedPayload
 * @prop {{responseCode:number, response:{error:object}}[]} retries
 */
/**
 * @typedef {object} K_OpenAiComputedPayload
 * @prop {string} model
 * @prop {K_OpenAiComputedMessage[]} messages
 * @prop {number} temperature
 * @prop {number} top_p
 * @prop {number} n
 * @prop {number} max_tokens
 * @prop {string|Array|[]} stop
 * @prop {number} presence_penalty
 * @prop {number} frequency_penalty
 * @prop {object|null} [logit_bias]
 * @prop {string} [user]
 */
/**
 * @typedef {object} K_OpenAiComputedMessage
 * @prop {"system"|"user"|"assistant"} role
 * @prop {string|K_OpenAiMessageContent[]} content
 * @prop {string} [name]
 */
/**
 * @typedef {object} K_OpenAiOriginalResponse
 * @prop {{index:number,message:{role:string, content:string}, finish_reason:string}[]} choices
 * @prop {number} created
 * @prop {string} id
 * @prop {string} model
 * @prop {string} object
 * @prop {{completion_tokens:number, prompt_tokens:number, total_tokens:number}} usage
 * @prop {{message:string,type:string,param:string,code:string}} [error]
 */
/**
 * @typedef {object} K_OpenAiModeration
 * @prop {boolean} flagged
 * @prop {{sexual, hate, harassment, 'self-harm', 'sexual/minors', 'hate/threatening', 'violence/graphic', 'self-harm/intent', 'self-harm/instructions', 'harassment/threatening', violence}} categories
 * @prop {{sexual, hate, harassment, 'self-harm', 'sexual/minors', 'hate/threatening', 'violence/graphic', 'self-harm/intent', 'self-harm/instructions', 'harassment/threatening', violence}} category_scores
 */

// ------------------------------
//   NovelAI
// ------------------------------
/**
 * @typedef {object} K_NaiImageParam
 * @prop {string} [negative_prompt]
 * @prop {number} [width]
 * @prop {number} [height]
 * @prop {number} [steps]
 * @prop {number} [scale]
 * @prop {number} [seed]
 * @prop {K_EnumNaiSampler} [sampler]
 * @prop {number|null} [skip_cfg_above_sigma]
 * @prop {boolean} [dynamic_thresholding]
 * @prop {boolean} [sm]
 * @prop {boolean} [sm_dyn]
 * @prop {number} [cfg_rescale]
 * @prop {string} [noise_schedule]
 * @prop {string[]} [reference_image_multiple]
 * @prop {number[]} [reference_information_extracted_multiple]
 * @prop {number[]} [reference_strength_multiple]
 * @prop {string} [image]
 * @prop {string} [mask]
 * @prop {boolean} [add_original_image]
 * @prop {"generate"|"infill"} [action]
 * @prop {K_EnumNaiModel} [model]
 * @prop {boolean} [returnsComputedPayload]
 * @prop {number} [maxRetry]
 * 以下、V4
 * @prop {K_NaiCharacterPrompt[]} [characterPrompts]
 * @prop {boolean} [use_coords]
 */
/** @typedef {"k_euler"|"k_euler_ancestral"|"k_dpmpp_2s_ancestral"|"k_dpmpp_2m_sde"} K_EnumNaiSampler */
/** @typedef {"nai-diffusion-3"|"nai-diffusion-3-inpainting"|"nai-diffusion-4-curated-preview"} K_EnumNaiModel */
/**
 * @typedef {object} K_NaiCharacterPrompt
 * @prop {string} prompt
 * @prop {string} uc
 * @prop {{x:number,y:number}} center
 */
/**
 * @typedef {object} K_NaiV4Prompt
 * @prop {K_NaiV4Caption} caption
 * @prop {boolean} use_coords
 * @prop {boolean} use_order
 */
/**
 * @typedef {object} K_NaiV4NegativePrompt
 * @prop {K_NaiV4Caption} caption
 */
/**
 * @typedef {object} K_NaiV4Caption
 * @prop {string} base_caption
 * @prop {K_NaiV4CharCaption[]} char_captions
 */
/**
 * @typedef {object} K_NaiV4CharCaption
 * @prop {string} char_caption
 * @prop {{x:number,y:number}[]} centers
 */
/**
 * @typedef {object} K_NaiImageResponse
 * @prop {Blob} [blob]
 * @prop {K_NaiComputedPayload} computedPayload
 * @prop {{responseCode:number, response:string}} [error]
 * @prop {{responseCode:number, response:string}[]} [retries]
 */
/**
 * @typedef {object} K_NaiComputedPayload
 * @prop {string} [negative_prompt]
 * @prop {number} [width]
 * @prop {number} [height]
 * @prop {number} [steps]
 * @prop {number} [scale]
 * @prop {number} [seed]
 * @prop {K_EnumNaiSampler} [sampler]
 * @prop {number|null} [skip_cfg_above_sigma]
 * @prop {boolean} [dynamic_thresholding]
 * @prop {boolean} [sm]
 * @prop {boolean} [sm_dyn]
 * @prop {number} [cfg_rescale]
 * @prop {string} [noise_schedule]
 * @prop {string[]} [reference_image_multiple]
 * @prop {number[]} [reference_information_extracted_multiple]
 * @prop {number[]} [reference_strength_multiple]
 * @prop {string} [image]
 * @prop {string} [mask]
 * @prop {boolean} [add_original_image]
 * 以下、V4
 * @prop {K_NaiCharacterPrompt[]} [characterPrompts]
 * @prop {boolean} [use_coords]
 * @prop {{caption:K_NaiV4Prompt}} [v4_prompt]
 * @prop {{caption:K_NaiV4Caption}} [v4_negative_prompt]
 */
/**
 * @typedef {object} K_NaiCompletionParam
 * @prop {number} [temperature]
 * @prop {number} [max_length]
 * @prop {number} [min_length]
 * @prop {number} [top_k]
 * @prop {number} [top_p]
 * @prop {number} [tail_free_sampling]
 * @prop {number} [repetition_penalty]
 * @prop {number} [repetition_penalty_range]
 * @prop {number} [repetition_penalty_slope]
 * @prop {number} [repetition_penalty_frequency]
 * @prop {number} [repetition_penalty_presence]
 * @prop {number} [cfg_scale]
 * @prop {string} [cfg_uc]
 * @prop {string} [phrase_rep_pen]
 * @prop {number[][]} [bad_words_ids]
 * @prop {number[][]} [stop_sequences]
 * @prop {boolean} [generate_until_sentence]
 * @prop {boolean} [use_cache]
 * @prop {boolean} [use_string]
 * @prop {boolean} [return_full_text]
 * @prop {string} [prefix]
 * @prop {{sequence:number[],bias:number,ensure_sequence_finish:boolean,generate_once:boolean}[]} [logit_bias_exp]
 * @prop {number} [num_logprobs]
 * @prop {number[]} [order]
 */

// ------------------------------
//   Runway
// ------------------------------
/** @typedef {"portrait"|"landscape"} K_EnumRunwayOrientation */
/**
 * @typedef {object} K_RunwayParam
 * @prop {"2024-09-13"} [version]
 * @prop {"gen3a_turbo"} [model]
 * @prop {number} [seed]
 * @prop {number} [duration]
 * @prop {boolean} [async]
 * @prop {number} [timeoutSec]
 */
/**
 * @typedef {object} K_RunwayOriginalResponse
 * @prop {string} id
 * @prop {"RUNNING"|"SUCCEEDED"|"FAILED"|"PENDING"|"CANCELLED"} status
 * @prop {string} createdAt
 * @prop {string} [failure]
 * @prop {string} [failureCode]
 * @prop {string[]} [output]
 * @prop {number} [progress]
 */
/**
 * @typedef {object} K_RunwayResponse
 * @prop {boolean} [error]
 * @prop {boolean} [inProgress]
 * @prop {boolean} [success]
 * @prop {string} [id]
 * @prop {string} output
 * @prop {K_RunwayOriginalResponse} [originalResponse]
 * @prop {string} [originalContentText]
 * @prop {{promptImage:string, model:string, seed:number, promptText:string, duration:number, ratio:string}} computedPayload
 */

// ------------------------------
//   Transloadit
// ------------------------------
/**
 * @typedef {object} K_TransloaditParam
 * @prop {object} [additionalPayload]
 * @prop {boolean} [async]
 * @prop {number} [timeoutSec]
 * @prop {number} [maxRetry]
 * @prop {string} [notify_url]
 */
/**
 * @typedef {object} K_TransloaditResponse
 * @prop {string} ok
 * @prop {*} [error]
 * @prop {string} [message]
 * @prop {string} assembly_id
 * @prop {string} assembly_url
 * @prop {string} assembly_ssl_url
 * @prop {string} companion_url
 * @prop {string} websocket_url
 * @prop {string} tus_url
 * @prop {number} bytes_received
 * @prop {number} bytes_expected
 * @prop {string} bytes_usage
 * @prop {*} client_agent
 * @prop {*} client_ip
 * @prop {*} client_referer
 * @prop {string} start_date
 * @prop {number} upload_duration
 * @prop {number} execution_duration
 * @prop {object} fields
 * @prop {Array} uploads
 * @prop {object} results
 */
/**
 * @typedef {object} K_TransloaditUploadResponse
 * @prop {string} originalUrl
 * @prop {string} [convertedUrl]
 */

// ------------------------------
//   Cloudinary
// ------------------------------
/**
 * @typedef {object} K_CloudinaryUploadResponse
 * @prop {string} url
 * @prop {number} version
 * @prop {string} publicId
 * @prop {string} format
 * @prop {K_CloudinaryImageUploadOriginalResponse} originalResponse
 */
/**
 * @typedef {object} K_CloudinaryImageUploadOriginalResponse
 * @prop {string} asset_id
 * @prop {string} public_id
 * @prop {number} version
 * @prop {string} version_id
 * @prop {string} signature
 * @prop {number} width
 * @prop {number} height
 * @prop {string} format
 * @prop {string} resource_type
 * @prop {string} created_at
 * @prop {Array} tags
 * @prop {number} bytes
 * @prop {string} type
 * @prop {string} etag
 * @prop {boolean} placeholder
 * @prop {string} url
 * @prop {string} secure_url
 * @prop {string} folder
 * @prop {string} access_mode
 */
/**
 * @typedef {object} K_CloudinaryUploadParameters
 * @prop {string} [folder]
 */
/**
 * @typedef {"image"|"video"} K_EnumCloudinaryResourceType
 */
// /**
//  * @typedef {object} K_CloudinaryCreateUrlParam
//  * @prop {number} [version]
//  * @prop {string} [extension]
//  * @prop {string} [transformations]
//  */

// ------------------------------
//   LINE App
// ------------------------------
/**
 * @typedef {object} LINEWebhookEventObject
 * @prop {string} type
 * @prop {number} timestamp
 * @prop {{type:string,userId:string}} [source]
 * @prop {string} webhookEventId
 * @prop {string} replyToken
 * @prop {{id:string,type:string,text:string,quoteToken:string,quotedMessageId:string,keywords:string[]}} [message]
 * @prop {{data:string,params:object}} [postback]
 */
/**
 * @typedef {object} K_LINESenderParam
 * @prop {string} name
 * @prop {string} iconUrl
 */
/**
 * @typedef {object} K_LINEMessage
 * @prop {"text"|"sticker"|"image"|"video"} type
 * @prop {string} [quoteToken]
 * @prop {{items:K_LINEQuickReplyItem[]}} [quickReply]
 * @prop {{name:string,iconUrl:string}} [sender]
 * -- type: text --
 * @prop {string} [text]
 * @prop {{index:number,productId:string,emojiId:string}[]} [emojis]
 * -- type: sticker --
 * @prop {string} [packageId]
 * @prop {string} [stickerId]
 * -- type: image/video --
 * @prop {string} [originalContentUrl]
 * @prop {string} [previewImageUrl]
 */
/**
 * @typedef {object} K_LINEQuickReplyItem
 * @prop {"action"} type
 * @prop {string} [imageUrl]
 * @prop {{type:"action",label:string,data:string}} action
 */
/**
 * @typedef {object} K_LINESentMessage
 * @prop {string} id
 * @prop {string} quoteToken
 */

// ------------------------------
//   Google Apps Script
// ------------------------------
/**
 * @typedef {object} EventObjectWebApp
 * @prop {string} queryString
 * @prop {object} parameter
 * @prop {object} parameters
 * @prop {string} [pathInfo]
 * @prop {""} contextPath
 * @prop {number} contentLength
 * @prop {{length:number, type:string, contents:string, name:"postData"}} [postData]
 */
/**
 * @typedef {object} EventObjectOnEdit
 * @prop {"NONE"|"CUSTOM_FUNCTION"|"LIMITED"|"FULL"} authMode
 * @prop {string} oldValue
 * @prop {SpreadsheetApp.Range} range
 * @prop {SpreadsheetApp.Spreadsheet} source
 * @prop {string} triggerUid
 * @prop {string} value
 */
/**
 * @typedef {object} EventObjectTimeDriven
 * @prop {"NONE"|"CUSTOM_FUNCTION"|"LIMITED"|"FULL"} authMode
 * @prop {number} day-of-month
 * @prop {number} day-of-week
 * @prop {number} hour
 * @prop {number} minute
 * @prop {number} month
 * @prop {number} second
 * @prop {string} timezone
 * @prop {string} triggerUid
 * @prop {number} week-of-year
 * @prop {number} year
 */

// ------------------------------
//   Stable Diffusion And Dreambooth API
// ------------------------------
// /**
//  * @typedef {object} K_SDParam
//  * @prop {string} [model_id]
//  * @prop {string} [negative_prompt]
//  * @prop {number} [width]
//  * @prop {number} [height]
//  * @prop {number} [samples]
//  * @prop {number} [num_inference_steps]
//  * @prop {string} [safety_checker]
//  * @prop {string} [enhance_prompt]
//  * @prop {string} [upscale]
//  * @prop {number} [seed]
//  * @prop {number} [guidance_scale]
//  * @prop {string} [webhook]
//  * @prop {string} [track_id]
//  * @prop {boolean} [async] - 非同期処理を行うかどうかです。falseで同期処理なら、すぐにstatus: successが返ればURLを返しますが、status: processingが返ればtimeoutSecまで待ちます。
//  * @prop {number} [timeoutSec] - 同期処理を行う場合の最大待ち秒数です。
//  */
// /**
//  * @typedef {object} K_SuperResParam
//  * @prop {number} [scale]
//  * @prop {boolean} [face_enhance]
//  * @prop {string} [webhook]
//  * @prop {boolean} [async] - 非同期処理を行うかどうかです。falseで同期処理なら、すぐにstatus: successが返ればURLを返しますが、status: processingが返ればtimeoutSecまで待ちます。
//  * @prop {number} [timeoutSec] - 同期処理を行う場合の最大待ち秒数です。
//  */
// /**
//  * @typedef {object} K_SDResponse
//  * @prop {boolean} [success]
//  * @prop {boolean} [processing]
//  * @prop {boolean} [error]
//  * @prop {string} [url]
//  * @prop {string[]} [urls]
//  * @prop {object} response
//  */

// ------------------------------
//   Others
// ------------------------------
// /**
//  * @typedef {object} K_ImageValuation
//  * @prop {string} url
//  * @prop {object} words
//  * @prop {number} sumScore
//  * @prop {number} point
//  * @prop {number} count
//  * @prop {number} matchCount
//  * @prop {string} bit
//  * @prop {string} __scriptText
//  * @prop {string} __jsonText
//  * @prop {Array} __rawList
//  * @prop {K_GoogleLensImageCandidate[]} __unmatchedList
//  * @prop {K_GoogleLensImageCandidate[]} __ignoredList
//  * @prop {K_GoogleLensImageCandidate[]} __availableList
//  */
// /**
//  * @typedef {object} K_GoogleLensImageCandidate
//  * @prop {string} src
//  * @prop {string} host
//  * @prop {string} alt
//  * @prop {string} href
//  * @prop {number} index
//  */
/**
 * @typedef {object} K_Entry
 * @prop {string} key
 * @prop {*} value
 */
/**
 * @typedef {object} K_FormattedUsage
 * @prop {string} id
 * @prop {object} data
 * @prop {number} datetime
 */
/**
 * @typedef {object} K_Usage
 * @prop {number} max
 * @prop {number} usage
 */
/**
 * @typedef {object} K_RasyRichTextBuilder
 * @prop {function(string,K_EasyTextStyle):K_RasyRichTextBuilder} addText
 * @prop {function(...string|({text:string}&K_EasyTextStyle)):K_RasyRichTextBuilder} addTexts
 * @prop {function(string[],...({text:string}&K_EasyTextStyle)):K_RasyRichTextBuilder} addTextTag
 * @prop {function():SpreadsheetApp.RichTextValue} build
 */
/**
 * @typedef {object} K_EasyTextStyle
 * @prop {string} [color]
 * @prop {boolean} [bold]
 * @prop {boolean} [italic]
 * @prop {boolean} [underline]
 * @prop {number} [size]
 */