import TelegramBot from "node-telegram-bot-api"
import {pool, getlast, savelast, clearlast, getnumberbot, setnumberbot, savehistory, gameresults, getranks} from './modules/db.js'

import {gameOptions, newgameOptions} from './modules/options.js'
import dotenv from "dotenv"
import fs from "fs"
import fetch  from "node-fetch"
import jsdom  from "jsdom"
dotenv.config()

const bot = new TelegramBot(process.env.TG_TOKEN, {polling: true})

// FUNCTION NEWGAME
const newGame = async (chatid) => {
   // await тут нужен обязательно
   const arrayfordel = await deletemessages(chatid)

   await bot.sendMessage(chatid, `Я загадаю цифру от 0 до 9, а ты ее угадаешь!`)
         .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))  
          
   await setnumberbot(chatid, Math.floor(Math.random() * 10))
       
   await bot.sendMessage(chatid, `Отгадывай!`, gameOptions)
         .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))  
}

// FUNCTION RANKS
const ranks = async (chatid) => {
    const arrayfordel = await deletemessages(chatid)
    
    const ranks = await getranks()  
    
    if (ranks) {
    
         await bot.sendMessage(chatid, `<b>Топ 10 везунчиков:</b>\n`, {parse_mode: 'HTML', disable_web_page_preview : true})
             .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))  
         
         let tab = ''
         ranks.forEach((el) => {
                  // console.log(el)
                   tab = tab + `${el.username}: ${(+el.percent).toFixed(2)}%, ${el.total} попыток\n`
         })
         
         await bot.sendMessage(chatid, tab, {parse_mode: 'HTML', disable_web_page_preview : true})
             .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))           
         
    }  
}
// FUNCTION CLEARALL
const deletemessages = async (chatid) => {

   const arrayfordel = await getlast(chatid) 
   arrayfordel.forEach((el) => el ? bot.deleteMessage(chatid, el) : '')               
   clearlast(chatid)
   
   return []
};

// FUNCTION START
const start = () => {

  bot.setMyCommands([
    {command: '/start', description: 'Запуск бота'},
    {command: '/info',  description: 'Инфо о боте'},    
    {command: '/ranks', description: 'Топ 10 везунчиков'},
    {command: '/game',  description: 'Начать игру!'},    
  ])
  
  // ОБРАБОТКА MESSAGE **********************
  bot.on("message", async msg => {
    const chatid = msg.chat.id
    const first_name = msg.chat.first_name   
    const text = msg.text
    const message_id = msg.message_id
  
    if (text === '/start') {
       const arrayfordel = await deletemessages(chatid)
       await savelast(chatid, arrayfordel, message_id)
       await bot.sendMessage(chatid, `Welcome to chat!`)
           .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))   
       await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/236/544/23654483-432f-4d5e-b490-f9cc2b7fea55/1.webp')
           .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))   
       return
    }
    if (text === '/info') {
       const arrayfordel = await deletemessages(chatid)
       await savelast(chatid, arrayfordel, message_id)  
       bot.sendMessage(chatid, `Добро пожаловать! Испытай удачу и проверь своё везение!`)
           .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))        
       return
    }
    if (text === '/ranks') {
       await savelast(chatid, await getlast(chatid), message_id)    
        ranks(chatid)
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
    
     //console.log(msg)
    
     const dataMsg  = msg.data
     const chatid   = msg.from.id
     const username = msg.from.first_name ? msg.from.first_name : '' + msg.from.last_name ? ' ' + msg.from.last_name : ''
         
     try { 
        
        await bot.answerCallbackQuery(msg.id,  {text: "You pressed " + dataMsg, show_alert: false})
        
        const numberbot = await getnumberbot(chatid)
        
        if ((dataMsg === 'newgame') || (numberbot === undefined)) {
             newGame(chatid)
             return
        }
        
        let arrayfordel = await deletemessages(chatid)   
        
        savehistory (chatid, username, +numberbot, +dataMsg)   
        
        const results = await gameresults(chatid)   
         
        if (+dataMsg !== +numberbot) {
           await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/4a5/d3f/4a5d3ff5-e6bf-4a59-91fe-14007ab378b7/9.webp')
                .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                           
           await bot.sendMessage(chatid, `Ты загадал ${dataMsg} и <b>проиграл</b> \u{1F622}\u{1F622}\u{1F622}\nЯ загадал <b>${numberbot}</b>\nТвой процент успеха - <b>${(results * 100).toFixed(2)}%</b>`,  newgameOptions)
               .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                         
        }
        else {
          await bot.sendSticker(chatid, 'https://tlgrm.ru/_/stickers/071/40c/07140ca4-04b5-3e35-a196-ffb1a13c016c/4.webp')
                .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                                  
          await bot.sendMessage(chatid, `<b>Ты угадал!!! Я тоже загадал ${dataMsg}!</b>\nТвой процент успеха - <b>${(results * 100).toFixed(2)}%</b>`, newgameOptions)
               .then(mesageSent => savelast(chatid, arrayfordel, mesageSent.message_id))                                                              
        }

     }
     catch (err) {console.log(err.message)} 
            
  })
}

// ВЫЗЫВАЕМ START
start()
