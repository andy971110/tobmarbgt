var TelegramBot = require('node-telegram-bot-api');
var request = require('request');
var CronJob = require('cron').CronJob;
var MongoClient = require('mongodb').MongoClient;
var dbConfig = 'mongodb://dronich:15975300f@ds011321.mlab.com:11321/lentabot';
var token = '373098125:AAEDP31dxWwLxszbFamHh-DJrW_l7zE7Guk';
var bot = new TelegramBot (token, {polling: true});
var m = 0;
var i=null;
var j=null;
var count = null;
var k = null;
var cronn = 0;
var options = {
	parse_mode:'Markdown'
};
var job1 = new CronJob ('*/30 * * * * *', function() {
	MongoClient.connect(dbConfig, function(err, db){
		var stats = db.collection("stats");
		var collection = db.collection("users");
		var stat = null;
		stats.find().toArray(function(err, docs) {
			stat = docs[0];
			count = stat.count;
			for(i=0;i<count;i++){		
				(function(i) {
					//console.log('1-'+i);
					for(j=1;j<=10;j++){
						(function(j) {			
							collection.find()
							.toArray(function(err, docs) {
								var user = docs[i];
								var URL = 'https://api.telegram.org/bot373098125:AAEDP31dxWwLxszbFamHh-DJrW_l7zE7Guk/forwardMessage?chat_id='+user.ChatID+'&from_chat_id='+user['uid' + j]+'&message_id='+user['id_m' + j];
								console.log(URL);
								request(URL, function(error, response, body){
									var date = JSON.parse(body);
									chatIdr = date.chat_id;
									id_mr = date.forward_from_message_id;
									uidr = date.forward_from_chat_id;

									if(date.ok === true){
										collection.updateOne({ ChatId: user.ChatId }
											, { $set: { ['id_m' + j]: user['id_m' + j]+1
										} }, function(err, result) {
										});	
										//console.log("Ошибки нет");
									}
									if(date.ok === false){
										if(date.description === 'Bad Request: MESSAGE_ID_INVALID'){
											collection.updateOne({ ChatId: user.ChatId }
												, { $set: { ['id_m' + j]: user['id_m' + j]+1
											} }, function(err, result) {
											});
										}						
									}
									
								});	
							});
						})(j);
					}
				})(i);

			}	
		});	
	});		
});
const trans = {
	"ru":{
		"save": "*Язык сохранен*\nТеперь бот на русском языке.",
		"notch": "Это сообщение не из канала.",
		"mych": "Мои каналы",
		"close": "Назад",
		"addch":", перешлите мне последнее сообщение из канала, который хотите добавить в новостную ленту.",
		"delch":"Вы можете удалить каналы с помощью клавиатуры.",
		"ch":"Вы подписаны на каналы:",
		"ch_":"Канал @",
		"_del":" удалён.",
		"_add":" уже добавлен.",  	
		"noadd":"Вы больше не можете добавить канал в ленту.",
		"yesadd":" успешно добавлен.\nТеперь бот будет пересылать Вам все новые сообщения из этого канала.",
		"emp":"Пусто",
	},
	"en":{
		"save": "*Language saved*\nNow the bot will be in english.",
		"notch": "This message is not from the channel.",
		"mych": "My channels",
		"close": "Close",
		"addch":", send me the latest message of the channel, that you want to add a news feed.",
		"delch":"You can delete channels with the keyboard.",
		"ch":"You are subscribed to the channels:",
		"ch_":"Channel @",
		"_del":" deleted.",
		"_add":" is already added.",
		"noadd":"You can't add a channel to the tape.",
		"yesadd":" added successfully.\nNow the bot will send you all new messages from this channel.",
		"emp":"Empty",
	}
}

bot.on('message', function (msg) {	
	if(cronn<2){
		cronn++;
	}		
	if(cronn==1){
		job1.start();		
	}
	console.log(msg);
	var chatId = msg.chat.id;
	var name = msg.from.first_name;
	var id = msg.from.id;
	var lng = null;
	console.log(cronn);
	MongoClient.connect(dbConfig, function(err, db){
		var coll = db.collection("users");
		coll.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var collection = docs[0];
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
			var lang=collection.language;
			if (msg.text==='\ud83d\udce2 '+trans[lang].mych) {
				viewchannel(chatId, lang);
				return;
			}
			if (msg.text==='\u2b05\ufe0f '+trans[lang].close) {
				start(chatId, name, lang);
				return;
			}
			if(msg.forward_from_chat){
				var id_m = msg.forward_from_message_id+1;
				var uname = msg.forward_from_chat.username;
				var uid = msg.forward_from_chat.id;
				addAccess(chatId, uname, uid, id_m, lang);
			}else if(msg.forward_from){
				bot.sendMessage(chatId, trans[lang].notch);
			}

			if(msg.text =='\u274c @'+collection.uname1 && collection.uname1!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname1: trans[lang].emp,
						uid1: null,
						id_m1: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname1+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname2 && collection.uname2!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname2: trans[lang].emp,
						uid2: null,
						id_m2: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname2+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname3 && collection.uname3!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname3: trans[lang].emp,
						uid3: null,
						id_m3: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname3+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname4 && collection.uname4!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname4: trans[lang].emp,
						uid4: null,
						id_m4: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname4+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname5 && collection.uname5!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname5: trans[lang].emp,
						uid5: null,
						id_m5: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname5+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname6 && collection.uname6!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname6: trans[lang].emp,
						uid6: null,
						id_m6: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname6+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname7 && collection.uname7!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname7: trans[lang].emp,
						uid7: null,
						id_m7: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname7+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}else if(msg.text==='\u274c @'+collection.uname8 && collection.uname8!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname8: trans[lang].emp,
						uid8: null,
						id_m8: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname8+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname9 && collection.uname9!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname9: trans[lang].emp,
						uid9: null,
						id_m9: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname9+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}if(msg.text==='\u274c @'+collection.uname10 && collection.uname10!=trans[lang].emp) {
				coll.updateOne({ ChatID: chatId }
					, { $set: { channelN: collection.channelN+1,
						uname10: trans[lang].emp,
						uid10: null,
						id_m10: null
					} }, function(err, result) {
						bot.sendMessage(chatId, trans[lang].ch_+collection.uname10+trans[lang]._del);
						viewchannel(chatId, lang);
					});				
			}
		});
});
});

function addAccess(chatId, uname, uid, id_m, lang){
	MongoClient.connect(dbConfig, function(err, db){
		
		var collection = db.collection("users");
		var flag = null;
		
		collection.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var user = docs[0];
			if(user.channelN!=0){
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
				}
				if(user.uid10==uid){					
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
						, { $set: { channelN: user.channelN-1,
							['uname' + flag]: uname,
							['uid' + flag]: uid,
							['id_m' + flag]: id_m
						} }, function(err, result) {
							bot.sendMessage(chatId, trans[lang].ch_+uname+trans[lang].yesadd);
							//console.log("Успешно обновлено");
							//console.log(err);
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
		channelN: 10,
		uname1: trans[lang].emp,
		uid1: null,
		id_m1: null,
		uname2: trans[lang].emp,
		uid2: null,
		id_m2: null,
		uname3: trans[lang].emp,
		uid3: null,
		id_m3: null,
		uname4: trans[lang].emp,
		uid4: null,
		id_m4: null,
		uname5: trans[lang].emp,
		uid5: null,
		id_m5: null,
		uname6: trans[lang].emp,
		uid6: null,
		id_m6: null,
		uname7: trans[lang].emp,
		uid7: null,
		id_m7: null,
		uname8: trans[lang].emp,
		uid8: null,
		id_m8: null,
		uname9: trans[lang].emp,
		uid9: null,
		id_m9: null,
		uname10: trans[lang].emp,
		uid10: null,
		id_m10: null,
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
    		, { $set: { count: stat.count+1
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
	//bot.sendMessage(chatId, name+", теперь перешлите мне сообщения из каналов, которые хотите добавить в новостную ленту.");

	bot.sendMessage(chatId, name+trans[lang].addch, {
		reply_markup: JSON.stringify({
			one_time_keyboard: true,
			resize_keyboard:true,
			keyboard: [
			['\ud83d\udce2 '+trans[lang].mych]]
		})
	});
}

function viewchannel(chatId, lang){
	MongoClient.connect(dbConfig, function(err, db){
		var collection = db.collection("users");
		collection.find({ChatID: chatId})
		.toArray(function(err, docs) {
			var user = docs[0];
			var url = 'https://t.me/'
			bot.sendMessage(chatId, trans[lang].ch, {
				reply_markup: JSON.stringify({
					one_time_keyboard: true,
					resize_keyboard:true,
					inline_keyboard: [
					[{
						text: '@'+user.uname1,
						url: 'https://t.me/'+user.uname1
					}],
					[{
						text: '@'+user.uname2,
						url: 'https://t.me/'+user.uname2
					}],
					[{
						text: '@'+user.uname3,
						url: 'https://t.me/'+user.uname3
					}],
					[{
						text: '@'+user.uname4,
						url: 'https://t.me/'+user.uname4
					}],
					[{
						text: '@'+user.uname5,
						url: 'https://t.me/'+user.uname5
					}],
					[{
						text: '@'+user.uname6,
						url: 'https://t.me/'+user.uname6
					}],
					[{
						text: '@'+user.uname7,
						url: 'https://t.me/'+user.uname7
					}],
					[{
						text: '@'+user.uname8,
						url: 'https://t.me/'+user.uname8
					}],
					[{
						text: '@'+user.uname9,
						url: 'https://t.me/'+user.uname9
					}],
					[{
						text: '@'+user.uname10,
						url: 'https://t.me/'+user.uname10
					}],
					
					]
				})
			});
			var keyboard = {
				reply_markup: JSON.stringify({
					//one_time_keyboard: true,
					resize_keyboard:true,
					keyboard: [
					['\u274c @'+user.uname1],
					['\u274c @'+user.uname2],
					['\u274c @'+user.uname3],
					['\u274c @'+user.uname4],
					['\u274c @'+user.uname5],
					['\u274c @'+user.uname6],
					['\u274c @'+user.uname7],
					['\u274c @'+user.uname8],
					['\u274c @'+user.uname9],
					['\u274c @'+user.uname10],
					['\u2b05\ufe0f '+trans[lang].close]]
				})
			};
			bot.sendMessage(chatId, trans[lang].delch, keyboard);
		});
	});
}