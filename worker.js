// ---------- Insert Your Data ---------- //

const BOT_TOKEN = "8166257595:AAGF_SIVXRmXTWeLo88H9f8bIT3HkS_cdlY"; // Insert your bot token.
const BOT_WEBHOOK = "/endpoint"; // Let it be as it is.
const BOT_SECRET = "BOT_SECRET"; // Insert a powerful secret text (only [A-Z, a-z, 0-9, _, -] are allowed).
const BOT_OWNER = 7825674005; // Insert your telegram account id.
const BOT_CHANNEL = -1002313368299; // Insert your telegram channel id which the bot is admin in.
const SIA_NUMBER = 12345; // Insert a random integer number and keep it safe.
const PUBLIC_BOT = false; // Make your bot public (only [true, false] are allowed).
const BOT_NAME = "YourBotName" // Add bot name
const DEVELOPER = "Your Name" //Add bot developer
const UPDATED = "Never" // Bot Update Date
const VERSION = "1.0.0" // Bot Version
const BOT_CHANNEL_LINK = "https://t.me/your_channel_username"

// ---------- Do Not Modify ---------- //

const WHITE_METHODS = ["GET", "POST", "HEAD"];
const HEADERS_FILE = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"};
const HEADERS_ERRR = {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'};
const ERROR_404 = {"ok":false,"error_code":404,"description":"Bad Request: missing /?file= parameter", "credit": "https://github.com/vauth/filestream-cf"};
const ERROR_405 = {"ok":false,"error_code":405,"description":"Bad Request: method not allowed"};
const ERROR_406 = {"ok":false,"error_code":406,"description":"Bad Request: file type invalid"};
const ERROR_407 = {"ok":false,"error_code":407,"description":"Bad Request: file hash invalid by atob"};
const ERROR_408 = {"ok":false,"error_code":408,"description":"Bad Request: mode not in [attachment, inline]"};

// ---------- Event Listener ---------- //

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event))
});

async function handleRequest(event) {
    const url = new URL(event.request.url);
    const file = url.searchParams.get('file');
    const mode = url.searchParams.get('mode') || "attachment";

    if (url.pathname === BOT_WEBHOOK) {return handleWebhook(event)}
    if (url.pathname === '/registerWebhook') {return registerWebhook(event, url, BOT_WEBHOOK, BOT_SECRET)}
    if (url.pathname === '/unregisterWebhook') {return unregisterWebhook(event)}
    if (url.pathname === '/getMe') {return new Response(JSON.stringify(await getMe()), {headers: HEADERS_ERRR, status: 202})}

    if (!file) {return Raise(ERROR_404, 404);}
    if (!["attachment", "inline"].includes(mode)) {return Raise(ERROR_408, 404)}
    if (!WHITE_METHODS.includes(event.request.method)) {return Raise(ERROR_405, 405);}
    try {atob(file)} catch {return Raise(ERROR_407, 404)}

    const file_path = atob(file)
    const channel_id = parseInt(file_path.split('/')[0])/-SIA_NUMBER
    const file_id = parseInt(file_path.split('/')[1])/SIA_NUMBER
    const retrieve = await RetrieveFile(channel_id, file_id);
    if (retrieve.error_code) {return await Raise(retrieve, retrieve.error_code)};

    const rdata = retrieve[0]
    const rname = retrieve[1]
    const rsize = retrieve[2]
    const rtype = retrieve[3]

    return new Response(rdata, {
        status: 200, headers: {
            "Content-Disposition": $mode}; filename=${rname}, // inline;
            "Content-Length": rsize,
            "Content-Type": rtype,
            ...HEADERS_FILE
        }
    });
}

// ---------- Retrieve File ---------- //

async function RetrieveFile(channel_id, message_id) {
    let  fID; let fName; let fType; let fSize; let fLen;
    let data = await editMessage(channel_id, message_id, await UUID());
    if (data.error_code){return data}

    if (data.document){
        fLen = data.document.length - 1
        fID = data.document.file_id;
        fName = data.document.file_name;
        fType = data.document.mime_type;
        fSize = data.document.file_size;
    } else if (data.audio) {
        fLen = data.audio.length - 1
        fID = data.audio.file_id;
        fName = data.audio.file_name;
        fType = data.audio.mime_type;
        fSize = data.audio.file_size;
    } else if (data.video) {
        fLen = data.video.length - 1
        fID = data.video.file_id;
        fName = data.video.file_name;
        fType = data.video.mime_type;
        fSize = data.video.file_size;
    } else if (data.photo) {
        fLen = data.photo.length - 1
        fID = data.photo[fLen].file_id;
        fName = data.photo[fLen].file_unique_id + '.jpg';
        fType = "image/jpg";
        fSize = data.photo[fLen].file_size;
    } else {
        return ERROR_406
    }

    const file = await getFile(fID)
    if (file.error_code){return file}

    return [await fetchFile(file.file_path), fName, fSize, fType];
}

// ---------- Raise Error ---------- //

async function Raise(json_error, status_code) {
    return new Response(JSON.stringify(json_error), { headers: HEADERS_ERRR, status: status_code });
  }

// ---------- UUID Generator ---------- //

async function UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ---------- Telegram Webhook ---------- //
async function handleWebhook(event) {
  if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== BOT_SECRET) {
    return new Response('Unauthorized', { status: 403 })
  }
  const update = await event.request.json()
  event.waitUntil(onUpdate(event, update))
  return new Response('Ok')
}

async function registerWebhook(event, requestUrl, suffix, secret) {
  const webhookUrl = ${requestUrl.protocol}//${requestUrl.hostname}${suffix}
  const response = await fetch(apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))
  return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
}

async function unregisterWebhook(event) {
  const response = await fetch(apiUrl('setWebhook', { url: '' }))
  return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
}

// ---------- Telegram API ---------- //

async function getMe() {
  const response = await fetch(apiUrl('getMe'))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function sendMessage(chat_id, reply_id, text, reply_markup=[]) {
  const response = await fetch(apiUrl('sendMessage', {chat_id: chat_id, reply_to_message_id: reply_id, parse_mode: 'markdown', text, reply_markup: JSON.stringify({inline_keyboard: reply_markup})}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function sendDocument(chat_id, file_id) {
  const response = await fetch(apiUrl('sendDocument', {chat_id: chat_id, document: file_id}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function sendPhoto(chat_id, file_id) {
  const response = await fetch(apiUrl('sendPhoto', {chat_id: chat_id, photo: file_id}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function editMessage(channel_id, message_id, caption_text) {
    const response = await fetch(apiUrl('editMessageCaption', {chat_id: channel_id, message_id: message_id, caption: caption_text}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
}

async function answerInlineArticle(query_id, title, description, text, reply_markup=[], id='1') {
  const data = [{type: 'article', id: id, title: title, thumbnail_url: "https://i.ibb.co/5s8hhND/dac5fa134448.png", description: description, input_message_content: {message_text: text, parse_mode: 'markdown'}, reply_markup: {inline_keyboard: reply_markup}}];
  const response = await fetch(await this.apiUrl('answerInlineQuery', {inline_query_id: query_id, results: JSON.stringify(data), cache_time: 1}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function answerInlineDocument(query_id, title, file_id, mime_type, reply_markup=[], id='1') {
  const data = [{type: 'document', id: id, title: title, document_file_id: file_id, mime_type: mime_type, description: mime_type, reply_markup: {inline_keyboard: reply_markup}}];
  const response = await fetch(await this.apiUrl('answerInlineQuery', {inline_query_id: query_id, results: JSON.stringify(data), cache_time: 1}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function getFile(file_id) {
    const response = await fetch(apiUrl('getFile', {file_id: file_id}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
}

async function fetchFile(file_path) {
    const file = await fetch(https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path});
    return await file.arrayBuffer()
}

function apiUrl (methodName, params = null) {
    let query = ''
    if (params) {query = '?' + new URLSearchParams(params).toString()}
    return https://api.telegram.org/bot${BOT_TOKEN}/${methodName}${query}
}

// ---------- Update Listener ---------- //

async function onUpdate(event, update) {
  if (update.inline_query) {await onInline(event, update.inline_query)}
  if ('message' in update) {await onMessage(event, update.message)}
}

// ---------- Inline Listener ---------- //

async function onInline(event, inline) {
  let  fID; let fName; let fType; let fSize; let fLen;

  if (!PUBLIC_BOT && inline.from.id != BOT_OWNER) {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return await answerInlineArticle(inline.id, "Access forbidden", "Deploy your own filestream-cf.", "*❌ Access forbidden.*\n📡 Deploy your own [filestream-cf](https://github.com/vauth/filestream-cf) bot.", buttons)
  }

  try {atob(inline.query)} catch {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return await answerInlineArticle(inline.id, "Error", ERROR_407.description, ERROR_407.description, buttons)
  }

  const file_path = atob(inline.query)
  const channel_id = parseInt(file_path.split('/')[0])/-SIA_NUMBER
  const message_id = parseInt(file_path.split('/')[1])/SIA_NUMBER
  const data = await editMessage(channel_id, message_id, await UUID());

  if (data.error_code){
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return await answerInlineArticle(inline.id, "Error", data.description, data.description, buttons)
  }

  if (data.document){
    fLen = data.document.length - 1
    fID = data.document.file_id;
    fName = data.document.file_name;
    fType = data.document.mime_type;
    fSize = data.document.file_size;
  } else if (data.audio) {
    fLen = data.audio.length - 1
    fID = data.audio.file_id;
    fName = data.audio.file_name;
    fType = data.audio.mime_type;
    fSize = data.audio.file_size;
  } else if (data.video) {
    fLen = data.video.length - 1
    fID = data.video.file_id;
    fName = data.video.file_name;
    fType = data.video.mime_type;
    fSize = data.video.file_size;
  } else if (data.photo) {
    fLen = data.photo.length - 1
    fID = data.photo[fLen].file_id;
    fName = data.photo[fLen].file_unique_id + '.jpg';
    fType = "image/jpg";
    fSize = data.photo[fLen].file_size;
  } else {
    return ERROR_406
  }

  const buttons = [[{ text: "Send Again", switch_inline_query_current_chat: inline.query }]];
  return await answerInlineDocument(inline.id, fName, fID, fType, buttons)
}

// ---------- Message Listener ---------- //

async function onMessage(event, message) {
  let fID; let fName; let fSave; let fType;
  let url = new URL(event.request.url);
  let bot = await getMe()

    if (message.via_bot && message.via_bot.username == (await getMe()).username) {
        return
    }

    if (message.chat.id.toString().includes("-100")) {
        return
    }
    if (message.text === "/ping") {
       const startTime = Date.now();
       await sendMessage(message.chat.id, message.message_id, "Pinging...");
       const endTime = Date.now();
       const ping = endTime - startTime;
    
    const ping_text = `🤖 Bot Name: ${BOT_NAME}\n✅ Bot Status: Running\n📶 Ping: ${ping} ms`

      return sendMessage(message.chat.id, message.message_id, ping_text)
    }

    if (message.text === "/info") {
      const user = message.from;
      const restrictions = user.is_bot
    ? null
    : await fetch(this.apiUrl('getChatMember', {
            chat_id: message.chat.id,
            user_id: user.id
          })).then(response => response.json()).then(data => data.result.is_member == true )
      const isScam = user.is_bot
    ? null
    : await fetch(this.apiUrl('getChatMember', {
            chat_id: message.chat.id,
            user_id: user.id
          })).then(response => response.json()).then(data => data.result.status == "restricted" && data.result.is_member == true )

         const premium = user.is_premium === true ? "True" : "False"
         
         const info_text = `🔍 Your Info on \n━━━━━━━━━━━━━━\n👤 First Name: ${user.first_name || "N/A"} ${user.last_name || ""}\n🆔 ID: ${user.id}\n📛 Username: @${user.username || "N/A"}\n🔗 Profile Link: t.me/${user.username || user.id}\n🔒 TG Restrictions: ${restrictions == true ? "True" : "False" }\n🚨 TG Scamtag: ${isScam == true ? "True" : "False" }\n🌟 TG Premium: ${premium}`
      return sendMessage(message.chat.id, message.message_id, info_text)
    }


  if (message.text === "/about") {
  
     const about_text = `╔════❰ about ❱═❍\n║╭━━━━━━━━━━━━━━━➣\n║┣⪼🤖ᴍʏ ɴᴀᴍᴇ  : ${BOT_NAME}\n║┣⪼👦ᴅᴇᴠᴇʟᴏᴘᴇʀ: ${DEVELOPER}\n║┣⪼❣️ᴜᴘᴅᴀᴛᴇ   : ${UPDATED}\n║┣⪼🗣️ʟᴀɴɢᴜᴀɢᴇ : JS 💻\n║┣⪼🧠ʜᴏsᴛᴇᴅ   : ᴄʟᴏᴜᴅғʟᴀʀᴇ⚡\n║┣⪼📚ᴜᴘᴅᴀᴛᴇᴅ  : ${UPDATED}\n║┣⪼🗒️ᴠᴇʀsɪᴏɴ  : v${VERSION}\n║╰━━━━━━━━━━━━━━━➣\n╚══════════════════❍`

        const buttons = [[{text: "Channel", url: BOT_CHANNEL_LINK}]]
      return sendMessage(message.chat.id, message.message_id, about_text, buttons)
    }



  if (message.text && message.text.startsWith("/start ")) {
    const file = message.text.split("/start ")[1]
    try {atob(file)} catch {return await sendMessage(message.chat.id, message.message_id, ERROR_407.description)}

    const file_path = atob(file)
    const channel_id = parseInt(file_path.split('/')[0])/-SIA_NUMBER
    const message_id = parseInt(file_path.split('/')[1])/SIA_NUMBER
    const data = await editMessage(channel_id, message_id, await UUID());

    if (data.document) {
      fID = data.document.file_id;
      return await sendDocument(message.chat.id, fID)
    } else if (data.audio) {
      fID = data.audio.file_id;
      return await sendDocument(message.chat.id, fID)
    } else if (data.video) {
      fID = data.video.file_id;
      return await sendDocument(message.chat.id, fID)
    } else if (data.photo) {
      fID = data.photo[data.photo.length - 1].file_id;
      return await sendPhoto(message.chat.id, fID)
    } else {
      return sendMessage(message.chat.id, message.message_id, "Bad Request: File not found")
    }
  }

  if (!PUBLIC_BOT && message.chat.id != BOT_OWNER) {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return sendMessage(message.chat.id, message.message_id, "*❌ Access forbidden.*\n📡 Deploy your own [filestream-cf](https://github.com/vauth/filestream-cf) bot.", buttons)
  }

  if (message.document){
    fID = message.document.file_id;
    fName = message.document.file_name;
    fType = message.document.mime_type.split("/")[0]
    fSave = await sendDocument(BOT_CHANNEL, fID)
  } else if (message.audio) {
    fID = message.audio.file_id;
    fName = message.audio.file_name;
    fType = message.audio.mime_type.split("/")[0]
    fSave = await sendDocument(BOT_CHANNEL, fID)
  } else if (message.video) {
    fID = message.video.file_id;
    fName = message.video.file_name;
    fType = message.video.mime_type.split("/")[0]
    fSave = await sendDocument(BOT_CHANNEL, fID)
  } else if (message.photo) {
    fID = message.photo[message.photo.length - 1].file_id;
    fName = message.photo[message.photo.length - 1].file_unique_id + '.jpg';
    fType = "image/jpg".split("/")[0];
    fSave = await sendPhoto(BOT_CHANNEL, fID)
  } else {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return sendMessage(message.chat.id, message.message_id, "Send me any file/video/gif/audio *(t<=4GB, e<=20MB)*.", buttons)
  }

  if (fSave.error_code) {return sendMessage(message.chat.id, message.message_id, fSave.description)}

  const final_hash = (btoa(fSave.chat.id*-SIA_NUMBER + "/" + fSave.message_id*SIA_NUMBER)).replace(/=/g, "")
  const final_link = ${url.origin}/?file=${final_hash}
  const final_stre = ${url.origin}/?file=${final_hash}&mode=inline
  const final_tele = https://t.me/${bot.username}/?start=${final_hash}

  const buttons = [
    [{ text: "Telegram Link", url: final_tele }, { text: "Inline Link", switch_inline_query_current_chat: final_hash }],
    [{ text: "Stream Link", url: final_stre }, { text: "Download Link", url: final_link }]
  ];

  let final_text = *🗂 File Name:* \${fName}\\n*⚙️ File Hash:* \${final_hash}\``
  return sendMessage(message.chat.id, message.message_id, final_text, buttons)
}
