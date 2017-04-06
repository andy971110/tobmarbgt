var TelegramBot = require('node-telegram-bot-api');
var request = require('request');
var CronJob = require('cron').CronJob;
var MongoClient = require('mongodb').MongoClient;
var dbConfig = 'mongodb://dronich:15975300f@ds011321.mlab.com:11321/lentabot';
var token = '373098125:AAEDP31dxWwLxszbFamHh-DJrW_l7zE7Guk';
var bot = new TelegramBot (token, {polling: true});
var m = 0;
var count = null;
var k = null;
var cronn = 0;
var options = {
	parse_mode:'Markdown'
};

const trans = {
	"ru":{
		"save": "*Язык сохранен*\nТеперь бот на русском языке.",
		"notch": "Это сообщение не из канала.",
		"mych": "Мои каналы",
		"close": "Назад",
		"addch":", перешлите мне последнее сообщение из канала, который хотите добавить в новостную ленту.",
		"addch1":"  каналов.",
		"delch":"Вы можете удалить каналы с помощью клавиатуры.",
		"ch":"Вы подписаны на каналы:",
		"ch_":"Канал @",
		"_del":" удалён.",
		"_add":" уже добавлен.",  	
		"noadd":"Вы больше не можете добавить канал в ленту.",
		"yesadd":" успешно добавлен.\nТеперь бот будет пересылать Вам все новые сообщения из этого канала.\n\n",
		"yesadd1":"Вы можете добавить еще ",
		"yesadd2":" каналов.",
		"emp":"Пусто",
		"nousername_":"*ОШИБКА*\nУ канала '",
		"_nousername":"' в настройках не указан @username.",
		"faq":"Помощь",
		"faq1":"*Помощь*\nВ нашем канале Вы сможете следить за последними новостями и обновлениями бота.\n\nВы можете задать все существующие вопросы, нажав на кнопку ниже.",
		"mychan":"Наш канал",
		"quest":"Задать вопрос",
	},
	"en":{
		"save": "*Language saved*\nNow the bot will be in english.",
		"notch": "This message is not from the channel.",
		"mych": "My channels",
		"close": "Close",
		"addch":", send me the latest message of the channel, that you want to add a news feed.",
		"addch1":" channels.",
		"delch":"You can delete channels with the keyboard.",
		"ch":"You are subscribed to the channels:",
		"ch_":"Channel @",
		"_del":" deleted.",
		"_add":" is already added.",
		"noadd":"You can't add a channel to the tape.",
		"yesadd":" added successfully.\nNow the bot will send you all new messages from this channel.\n\n",
		"yesadd1":"You can add ",
		"yesadd2":" channels.",
		"emp":"Empty",
		"nousername_":"*ERROR*\nThe channel '",
		"_nousername":"' in the settings is not specified @username.",
		"faq":"Help",
		"faq1":"*Help*\nIn our channel You can follow the latest news and updates of the bot.\n\nYou can ask all existing questions by clicking on the button below.",
		"mychan":"Our channel",
		"quest":"Ask question",
	}
}

bot.on('message', function (msg) {	
	var chatId = msg.chat.id;
	var name = msg.from.first_name;
	var id = msg.from.id;
	var lng = null;
	if(cronn<2){
		cronn++;
	}		
	if(cronn==0){
		job1.start();		
	}
	console.log(msg);
	console.log(cronn);
	MongoClient.connect(dbConfig, function(err, db){
		var coll = db.collection("users");
		coll.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var collection = docs[0];
			var stats = db.collection("stats");
			var stat = null;
			stats.find({name: 'cron'}).toArray(function(err, docs) {
				var stat = docs[0];

				if(msg.text==="/start"){
					language(chatId, name);	    	
					return;
				}		
				if(msg.text=="Русский \ud83c\uddf7\ud83c\uddfa"){
					lng='ru';
					lang='ru';					
					bot.sendMessage(chatId, trans.ru.save, options);
					getAccess(chatId, name, lng, lang);
					return;
				}
				if(msg.text=="English \ud83c\uddfa\ud83c\uddf8"){
					lng='en';
					lang='en';
					bot.sendMessage(chatId, trans.en.save, options);
					getAccess(chatId, name, lng, lang);
					return;
				}
				if(msg.text=="Статистика 2017"){					
					bot.sendMessage(chatId, "*Статистика*\nКол-во пользователей: *"+stat.count+"*\nРусский: *"+stat.language_ru+"*\nАнглийский: *"+stat.language_en+"*\nДобавлено каналов: *"+stat.channel_count+"*", options);
					return;
				}	
				var lang=collection.language;	
				var options1 = {
					parse_mode:'Markdown',
					reply_markup: JSON.stringify({
						one_time_keyboard: true,
						resize_keyboard:true,
						inline_keyboard: [
						[{
							text: '\ud83d\udce2 '+ trans[lang].mychan,
							url: 'https://t.me/telelenta'
						}],
						[{
							text: '\u270f\ufe0f '+ trans[lang].quest,
							url: 'https://t.me/tlenta'
						}],
						]
					})
				}		
				if (msg.text==='\ud83d\udcac '+trans[lang].faq) {
					bot.sendMessage(chatId, trans[lang].faq1, options1);
					return;
				}				
				if (msg.text==='\ud83d\udce2 '+trans[lang].mych) {
					viewchannel(chatId, lang);
					return;
				}
				if (msg.text==='\u2b05\ufe0f '+trans[lang].close) {
					start(chatId, name, lang);
					return;
				}
				if(msg.forward_from_chat){
					if(msg.forward_from_chat.username!=undefined){				
						var id_m = msg.forward_from_message_id+1;
						var uname = msg.forward_from_chat.username;
						var uid = msg.forward_from_chat.id;
						var nameu = msg.forward_from_chat.title;
						addAccess(chatId, uname, uid, id_m, lang, nameu);
					}else if(msg.forward_from_chat.username==undefined){
						bot.sendMessage(chatId, trans[lang].nousername_+msg.forward_from_chat.title+trans[lang]._nousername, options);
					}
				}else if(msg.forward_from){
					bot.sendMessage(chatId, trans[lang].notch);
				}

				if(msg.text =='\u274c '+collection.name1 && collection.uname1!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name1: trans[lang].emp,
							uname1: trans[lang].emp,
							uid1: null,
							id_m1: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname1+trans[lang]._del);
							viewchannel(chatId, lang);
						});	
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});			
				}if(msg.text==='\u274c '+collection.name2 && collection.uname2!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name2: trans[lang].emp,
							uname2: trans[lang].emp,
							uid2: null,
							id_m2: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname2+trans[lang]._del);
							viewchannel(chatId, lang);
						});		
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});			
				}if(msg.text==='\u274c '+collection.name3 && collection.uname3!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name3: trans[lang].emp,
							uname3: trans[lang].emp,
							uid3: null,
							id_m3: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname3+trans[lang]._del);
							viewchannel(chatId, lang);
						});		
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});			
				}if(msg.text==='\u274c '+collection.name4 && collection.uname4!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name4: trans[lang].emp,
							uname4: trans[lang].emp,
							uid4: null,
							id_m4: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname4+trans[lang]._del);
							viewchannel(chatId, lang);
						});		
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});			
				}if(msg.text==='\u274c '+collection.name5 && collection.uname5!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name5: trans[lang].emp,
							uname5: trans[lang].emp,
							uid5: null,
							id_m5: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname5+trans[lang]._del);
							viewchannel(chatId, lang);
						});
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});					
				}if(msg.text==='\u274c '+collection.name6 && collection.uname6!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name6: trans[lang].emp,
							uname6: trans[lang].emp,
							uid6: null,
							id_m6: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname6+trans[lang]._del);
							viewchannel(chatId, lang);
						});		
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});			
				}if(msg.text==='\u274c '+collection.name7 && collection.uname7!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name7: trans[lang].emp,
							uname7: trans[lang].emp,
							uid7: null,
							id_m7: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname7+trans[lang]._del);
							viewchannel(chatId, lang);
						});			
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});		
				}else if(msg.text==='\u274c '+collection.name8 && collection.uname8!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name8: trans[lang].emp,
							uname8: trans[lang].emp,
							uid8: null,
							id_m8: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname8+trans[lang]._del);
							viewchannel(chatId, lang);
						});		
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});			
				}if(msg.text==='\u274c '+collection.name9 && collection.uname9!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name9: trans[lang].emp,
							uname9: trans[lang].emp,
							uid9: null,
							id_m9: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname9+trans[lang]._del);
							viewchannel(chatId, lang);
						});			
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});		
				}if(msg.text==='\u274c '+collection.name10 && collection.uname10!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name10: trans[lang].emp,
							uname10: trans[lang].emp,
							uid10: null,
							id_m10: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname10+trans[lang]._del);
							viewchannel(chatId, lang);
						});	
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});				
				}if(msg.text==='\u274c '+collection.name11 && collection.uname11!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name11: trans[lang].emp,
							uname11: trans[lang].emp,
							uid11: null,
							id_m11: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname11+trans[lang]._del);
							viewchannel(chatId, lang);
						});				
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});	
				}if(msg.text==='\u274c '+collection.name12 && collection.uname12!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name12: trans[lang].emp,
							uname12: trans[lang].emp,
							uid12: null,
							id_m12: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname12+trans[lang]._del);
							viewchannel(chatId, lang);
						});		
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});			
				}if(msg.text==='\u274c '+collection.name13 && collection.uname13!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name13: trans[lang].emp,
							uname13: trans[lang].emp,
							uid13: null,
							id_m13: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname13+trans[lang]._del);
							viewchannel(chatId, lang);
						});			
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});		
				}if(msg.text==='\u274c '+collection.name14 && collection.uname14!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name14: trans[lang].emp,
							uname14: trans[lang].emp,
							uid14: null,
							id_m14: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname14+trans[lang]._del);
							viewchannel(chatId, lang);
						});			
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});		
				}if(msg.text==='\u274c '+collection.name15 && collection.uname15!=trans[lang].emp) {
					coll.updateOne({ ChatID: chatId }
						, { $set: { channelN: collection.channelN-1,
							name15: trans[lang].emp,
							uname15: trans[lang].emp,
							uid15: null,
							id_m15: null
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+collection.uname15+trans[lang]._del);
							viewchannel(chatId, lang);
						});	
					stats.updateOne({ name: 'cron' }
						, { $set: {
							channel_count: stat.channel_count-1
						} }, function(err, result) {
						});				
				}
			});
});
});
});

function addAccess(chatId, uname, uid, id_m, lang, nameu){
	MongoClient.connect(dbConfig, function(err, db){
		var stats = db.collection("stats");
		var collection = db.collection("users");
		var flag = null;
		
		collection.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var user = docs[0];
			if(user.channelN!=15){
				if(user.uid15==null){
					flag=10;
				}
				if(user.uid14==null){
					flag=10;
				}
				if(user.uid13==null){
					flag=10;
				}
				if(user.uid12==null){
					flag=10;
				}
				if(user.uid11==null){
					flag=10;
				}
				if(user.uid10==null){
					flag=10;
				}
				if(user.uid9==null){
					flag=9;
				}	
				if(user.uid8==null){
					flag=8;
				}
				if(user.uid7==null){
					flag=7;
				}	
				if(user.uid6==null){
					flag=6;
				}	
				if(user.uid5==null){
					flag=5;
				}
				if(user.uid4==null){
					flag=4;
				}
				if(user.uid3==null){
					flag=3;
				}
				if(user.uid2==null){
					flag=2;
				}
				if(user.uid1==null){
					flag=1;
				}if(user.uid15==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid14==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid13==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid12==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid11==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid10==uid){					
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid9==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid8==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid7==uid){				
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid6==uid){					
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid5==uid){					
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid4==uid){					
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid3==uid){	
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid2==uid){					
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(user.uid1==uid){							
					bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang]._add);
				}else if(flag!=null){					
					collection.updateOne({ ChatID: chatId }
						, { $set: { channelN: user.channelN+1,
							['name' + flag]: nameu,
							['uname' + flag]: uname,
							['uid' + flag]: uid,
							['id_m' + flag]: id_m
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang].yesadd);
						});	
					stats.find({name: 'cron'}).toArray(function(err, docs) {
						var stat = docs[0];
						stats.updateOne({ name: 'cron' }
							, { $set: {
								channel_count: stat.channel_count+1
							} }, function(err, result) {
							});				
					});
				}
			}else{
				bot.sendMessage(chatId, trans[lang].noadd);
			}
			//console.log(err);
		});
	});
	return;
}

function language(chatId){
	bot.sendMessage(chatId, "Выберите язык\n\nSelect the language", {
		reply_markup: JSON.stringify({
			one_time_keyboard: true,
			resize_keyboard:true,
			keyboard: [
			['Русский \ud83c\uddf7\ud83c\uddfa'],
			['English \ud83c\uddfa\ud83c\uddf8']
			]
		})
	});
}

function getAccess(chatId, name, lng, lang) {
	var users=1;
	var user = {ChatID: chatId, 
		name: name,
		language: lng,
		channelId: null,
		channelN: 0,
		name1: trans[lang].emp,
		uname1: trans[lang].emp,
		uid1: null,
		id_m1: null,
		name2: trans[lang].emp,
		uname2: trans[lang].emp,
		uid2: null,
		id_m2: null,
		name3: trans[lang].emp,
		uname3: trans[lang].emp,
		uid3: null,
		id_m3: null,
		name4: trans[lang].emp,
		uname4: trans[lang].emp,
		uid4: null,
		id_m4: null,
		name5: trans[lang].emp,
		uname5: trans[lang].emp,
		uid5: null,
		id_m5: null,
		name6: trans[lang].emp,
		uname6: trans[lang].emp,
		uid6: null,
		id_m6: null,
		name7: trans[lang].emp,
		uname7: trans[lang].emp,
		uid7: null,
		id_m7: null,
		name8: trans[lang].emp,
		uname8: trans[lang].emp,
		uid8: null,
		id_m8: null,
		name9: trans[lang].emp,
		uname9: trans[lang].emp,
		uid9: null,
		id_m9: null,
		name10: trans[lang].emp,
		uname10: trans[lang].emp,
		uid10: null,
		id_m10: null,
		name11: trans[lang].emp,
		uname11: trans[lang].emp,
		uid11: null,
		id_m11: null,
		name12: trans[lang].emp,
		uname12: trans[lang].emp,
		uid12: null,
		id_m12: null,
		name13: trans[lang].emp,
		uname13: trans[lang].emp,
		uid13: null,
		id_m13: null,
		name14: trans[lang].emp,
		uname14: trans[lang].emp,
		uid14: null,
		id_m14: null,
		name15: trans[lang].emp,
		uname15: trans[lang].emp,
		uid15: null,
		id_m15: null,
		pay: 0
	};
	MongoClient.connect(dbConfig, function(err, db){
		var stats = db.collection("stats");
		var stat = null;
		stats.find({name: 'cron'}).toArray(function(err, docs) {
			stat = docs[0];
		});
		var collection = db.collection("users");
		collection.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var users=docs[0];
			//console.log(err);

    // Создание документа в БД  
    if(users==undefined){
    	stats.updateOne({ name: 'cron' }
    		, { $set: { count: stat.count+1,
    			['language_' + lng]: stat['language_' + lng]+1
    		} }, function(err, result) {
    			console.log("Человек добавлен");
    		});
    	collection.insertOne(user, function(err, result){	         
    		if(err){ 
    			return console.log(err);
    		}
    		//bot.sendMessage(chatId, name+", теперь перешлите мне сообщения из каналов, которые хотите добавить в новостную ленту.");
    		console.log(result.ops);
    		db.close();
    	});
    }else{
    	//bot.sendMessage(chatId, name+", теперь перешлите мне сообщения из каналов, которые хотите добавить в новостную ленту.");
    	return;
    } 
}); 	
	});
	start(chatId, name, lang);
}

function editAccess(chatId){
	//Поиск в документе
	if(opp == 3){
		collection.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var user = docs[0];

			console.log(err);

		});
	}

    //Обновление в документе БД
    if(opp == 1){
    	collection.updateOne({ ChatID: chatId }
    		, { $set: { uname1: uname,
    			uid1: uid,
    			id_m1: id_m
    		} }, function(err, result) {
    			console.log("Успешно обновлено");
    			console.log(err);
    		});  
    } 
}

function start(chatId, name, lang) {	
	MongoClient.connect(dbConfig, function(err, db){
		var collection = db.collection("users");
		collection.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var users=docs[0];
			bot.sendMessage(chatId, name+trans[lang].addch, {
				parse_mode:'Markdown',
				reply_markup: JSON.stringify({
					one_time_keyboard: true,
					resize_keyboard:true,
					keyboard: [
					['\ud83d\udce2 '+trans[lang].mych],
					['\ud83d\udcac '+trans[lang].faq]]
				})
			});
		});
	});
}

function viewchannel(chatId, lang){
	MongoClient.connect(dbConfig, function(err, db){
		var collection = db.collection("users");
		collection.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var user = docs[0];
			URL = 'https://t.me/'
			bot.sendMessage(chatId, trans[lang].ch, {
				reply_markup: JSON.stringify({
					one_time_keyboard: true,
					resize_keyboard:true,
					inline_keyboard: [
					[{
						text: user.name1,
						url: 'https://t.me/'+user.uname1
					}],
					[{
						text: user.name2,
						url: 'https://t.me/'+user.uname2
					}],
					[{
						text: user.name3,
						url: 'https://t.me/'+user.uname3
					}],
					[{
						text: user.name4,
						url: 'https://t.me/'+user.uname4
					}],
					[{
						text: user.name5,
						url: 'https://t.me/'+user.uname5
					}],
					[{
						text: user.name6,
						url: 'https://t.me/'+user.uname6
					}],
					[{
						text: user.name7,
						url: 'https://t.me/'+user.uname7
					}],
					[{
						text: user.name8,
						url: 'https://t.me/'+user.uname8
					}],
					[{
						text: user.name9,
						url: 'https://t.me/'+user.uname9
					}],
					[{
						text: user.name10,
						url: 'https://t.me/'+user.uname10
					}],		
					[{
						text: user.name11,
						url: 'https://t.me/'+user.uname11
					}],	
					[{
						text: user.name12,
						url: 'https://t.me/'+user.uname12
					}],	
					[{
						text: user.name13,
						url: 'https://t.me/'+user.uname13
					}],	
					[{
						text: user.name14,
						url: 'https://t.me/'+user.uname14
					}],	
					[{
						text: user.name15,
						url: 'https://t.me/'+user.uname15
					}],				
					]
				})
			});
			var keyboard = {
				reply_markup: JSON.stringify({
					//one_time_keyboard: true,
					resize_keyboard:true,
					keyboard: [
					['\u274c '+user.name1],
					['\u274c '+user.name2],
					['\u274c '+user.name3],
					['\u274c '+user.name4],
					['\u274c '+user.name5],
					['\u274c '+user.name6],
					['\u274c '+user.name7],
					['\u274c '+user.name8],
					['\u274c '+user.name9],
					['\u274c '+user.name10],
					['\u274c '+user.name11],
					['\u274c '+user.name12],
					['\u274c '+user.name13],
					['\u274c '+user.name14],
					['\u274c '+user.name15],
					['\u2b05\ufe0f '+trans[lang].close]]
				})
			};
			bot.sendMessage(chatId, trans[lang].delch, keyboard);
		});
	});
}