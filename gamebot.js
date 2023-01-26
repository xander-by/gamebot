import TelegramBot from "node-telegram-bot-api"
//import db from './modules/db.js'

import {gameOptions, newgameOptions} from './modules/options.js'
import dotenv from "dotenv"
import fs from "fs"
import fetch  from "node-fetch"
import jsdom  from "jsdom"
dotenv.config()

const chats = {}
const lastKeyboards = {}

const bot = new TelegramBot(process.env.TG_TOKEN, {polling: true})

const newGame = async (chatid) => {

   bot.sendMessage(chatid, `Я загадаю цифру от 0 до 9, а ты ее угадаешь!`)
       .then(mesageSent => lastKeyboards[chatid+'_prompt'].push(mesageSent.message_id))
   
   chats[chatid] = Math.floor(Math.random() * 10)
       
   bot.sendMessage(chatid, `Отгадывай!`, gameOptions)
       .then(mesageSent => lastKeyboards[chatid+'_keyboard'].push(mesageSent.message_id))
}

const start = () => {

  bot.setMyCommands([
    {command: '/start', description: 'Start bot'},
    {command: '/info',  description: 'Get info about bot'},
    {command: '/game',  description: 'Start game'},    
  ])
  

  bot.on("message", async msg => {
    const chatid = msg.chat.id
    const first_name = msg.chat.first_name   
    const text = msg.text
    const message_id = msg.message_id
    
    // Если значения еще не  определены, установим в пустой массив
    lastKeyboards[chatid+'_keyboard'] === undefined ? lastKeyboards[chatid+'_keyboard'] = [] : ''
    lastKeyboards[chatid+'_prompt']   === undefined ? lastKeyboards[chatid+'_prompt']   = [] : ''  
    lastKeyboards[chatid+'_result']   === undefined ? lastKeyboards[chatid+'_result']   = [] : '' 

  
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
        newGame(chatid)
        return
    }    
      
    bot.sendMessage(chatid, `Hello ${first_name} ${chatid}! You have sent ${text}`)
    
  })
  
    bot.on('callback_query', async msg => {
    
     const dataMsg = msg.data
     const chatid  = msg.from.id
     
    // Если значения еще не  определены, установим в пустой массив
    lastKeyboards[chatid+'_keyboard'] === undefined ? lastKeyboards[chatid+'_keyboard'] = [] : ''
    lastKeyboards[chatid+'_prompt']   === undefined ? lastKeyboards[chatid+'_prompt']   = [] : ''  
    lastKeyboards[chatid+'_result']   === undefined ? lastKeyboards[chatid+'_result']   = [] : ''      
        
     try { 
        
        await bot.answerCallbackQuery(msg.id,  {text: "You pressed " + dataMsg, show_alert: false})
               
        if (dataMsg === 'newgame') {
            try {  
               
               // удалим старые кнопки и сообщения
               await lastKeyboards[chatid+'_result'].forEach((el) => bot.deleteMessage(chatid, el))
               lastKeyboards[chatid+'_result'] = []
               
            } catch (err) {console.log(err.message)}  
                   
            newGame(chatid)
            return
        }
        
        if (lastKeyboards[chatid+'_prompt'] === undefined || chats[chatid] === undefined) {
             console.log('data was expired...')
             newGame(chatid)
             return
        }         
        
        try {     
          
           // удалим старые кнопки и сообщения 
           await lastKeyboards[chatid+'_keyboard'].forEach((el) => bot.deleteMessage(chatid, el))
           lastKeyboards[chatid+'_keyboard'] = []
           await lastKeyboards[chatid+'_prompt'].forEach((el) => bot.deleteMessage(chatid, el))
           lastKeyboards[chatid+'_prompt'] = []                         
                   
        } catch (err) {console.log(err.message)}        

         
        if (dataMsg.toString() !== chats[chatid].toString()) {
        //https://tlgrm.ru/_/stickers/4a5/d3f/4a5d3ff5-e6bf-4a59-91fe-14007ab378b7/9.webp
           await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/4a5/d3f/4a5d3ff5-e6bf-4a59-91fe-14007ab378b7/9.webp')
              .then(mesageSent => lastKeyboards[chatid+'_result'].push(mesageSent.message_id))          
          
           await bot.sendMessage(chatid, `Ты <b>проиграл</b> \u{1F622}\u{1F622}\u{1F622} Я загадал <b>${chats[chatid]}</b>`,  newgameOptions)
              .then(mesageSent => lastKeyboards[chatid+'_result'].push(mesageSent.message_id)) 
        }
        else {
           // https://tlgrm.ru/_/stickers/071/40c/07140ca4-04b5-3e35-a196-ffb1a13c016c/4.webp
          await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/071/40c/07140ca4-04b5-3e35-a196-ffb1a13c016c/4.webp')
             .then(mesageSent => lastKeyboards[chatid+'_result'].push(mesageSent.message_id))    
             
          await bot.sendMessage(chatid, `<b>Ты угадал!!!</b>`, newgameOptions)
             .then(mesageSent => lastKeyboards[chatid+'_result'].push(mesageSent.message_id))                               
        }

     }
     catch (err) {console.log(err.message)} 
            
  })
}

start()