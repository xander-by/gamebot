import TelegramBot from "node-telegram-bot-api"
import {pool, getlast, savelast, clearlast} from './modules/db.js'

import {gameOptions, newgameOptions} from './modules/options.js'
import dotenv from "dotenv"
import fs from "fs"
import fetch  from "node-fetch"
import jsdom  from "jsdom"
dotenv.config()

const chats = {}
const bot = new TelegramBot(process.env.TG_TOKEN, {polling: true})

// FUNCTION NEWGAME
const newGame = async (chatid) => {
   const arrayfordel = []
   await deletemessages(chatid)

   bot.sendMessage(chatid, `Я загадаю цифру от 0 до 9, а ты ее угадаешь!`)
         .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))  
          
   chats[chatid] = Math.floor(Math.random() * 10)
       
   bot.sendMessage(chatid, `Отгадывай!`, gameOptions)
         .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))  
}

// FUNCTION CLEARALL
const deletemessages = async (chatid) => {

   const arrayfordel = await getlast(chatid) 
   await arrayfordel.forEach((el) => el ? bot.deleteMessage(chatid, el) : '')               
   await clearlast(chatid)
};

// FUNCTION START
const start = () => {

  bot.setMyCommands([
    {command: '/start', description: 'Start bot'},
    {command: '/info',  description: 'Get info about bot'},
    {command: '/game',  description: 'Start game'},    
  ])
  
  // ОБРАБОТКА MESSAGE **********************
  bot.on("message", async msg => {
    const chatid = msg.chat.id
    const first_name = msg.chat.first_name   
    const text = msg.text
    const message_id = msg.message_id
  
    if (text === '/start') {
       await bot.sendMessage(chatid, `Welcome to chat!`)
       await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/d06/e20/d06e2057-5c13-324d-b94f-9b5a0e64f2da/4.webp')
       return
    }
    if (text === '/info') {
       await bot.sendMessage(chatid, `You are ${first_name} ${chatid}!`)
       return
    }
    if (text === '/game') {
        await savelast(chatid, await getlast(chatid), message_id)
        newGame(chatid)
        return
    }    
      
    bot.sendMessage(chatid, `Hello ${first_name} ${chatid}! You have sent ${text}`)
    
  })

  // ОБРАБОТКА callback_query **********************  
   bot.on('callback_query', async msg => {
    
     const dataMsg = msg.data
     const chatid  = msg.from.id
         
     try { 
        
        await bot.answerCallbackQuery(msg.id,  {text: "You pressed " + dataMsg, show_alert: false})
        
        if ((dataMsg === 'newgame') || (chats[chatid] === undefined)) {
             newGame(chatid)
             return
        }
        
        await deletemessages(chatid) 
        let arrayfordel = []            
         
        if (dataMsg.toString() !== chats[chatid].toString()) {
           await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/4a5/d3f/4a5d3ff5-e6bf-4a59-91fe-14007ab378b7/9.webp')
                .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                           
           await bot.sendMessage(chatid, `Ты <b>проиграл</b> \u{1F622}\u{1F622}\u{1F622} Я загадал <b>${chats[chatid]}</b>`,  newgameOptions)
               .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                         
        }
        else {
          await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/071/40c/07140ca4-04b5-3e35-a196-ffb1a13c016c/4.webp')
                .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                                  
          await bot.sendMessage(chatid, `<b>Ты угадал!!!</b>`, newgameOptions)
               .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                                                              
        }

     }
     catch (err) {console.log(err.message)} 
            
  })
}

// ВЫЗЫВАЕМ START
start()