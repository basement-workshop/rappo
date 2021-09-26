const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config-dev.json');
const ytdl = require('ytdl-core');
const queue = new Map();
const config = {
    is_loop: false
}
const songIndex = {}
const songQueue = {}

const client = new Discord.Client();
client.login(token);

client.once('ready', () => {
  console.log('Ready!');
 });
 client.once('reconnecting', () => {
  console.log('Reconnecting!');
 });
 client.once('disconnect', () => {
  console.log('Disconnect!');
 });


const disconnect = async (guild, message) => {
    let serverQueue = queue.get(guild.id)
    if (!serverQueue) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
        return message.channel.send(
            "You need to be in a voice channel to play music!"
        );
        
        // Creating the contract for our queue
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };
        // Here we try to join the voicechat and save our connection into our object.
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        // Setting the queue using our contract
        queue.set(message.guild.id, queueContruct);
        serverQueue = queue.get(guild.id)
    }
    serverQueue.textChannel.send(`Someone just yeeted me, I shall take my leave.`);
    serverQueue.voiceChannel.leave()
    serverQueue.songs = []
    songIndex[guild.id] = -1
    songQueue[guild.id] = []
    queue.delete(guild.id)
    return
}

function play(guild, song, hasTimeout=false) {
    const serverQueue = queue.get(guild.id);
    // if (!song && hasTimeout == false) {
    //     setTimeout(() => {
    //         play(guild, song, true)
    //         return;
    //     }, 60000)
    //     return;
    // }

    // if (!song && hasTimeout) {
    //     serverQueue.textChannel.send(`No track in queue, imma yeet myself.`);
    //     serverQueue.voiceChannel.leave();
    //     queue.delete(guild.id);
    //     return;
    // }

    if (!song) {
        serverQueue.textChannel.send(`No track in queue, imma yeet myself.`);
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    try {
        serverQueue.textChannel.send(`Start playing: **${song.title}**`);
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1<<25
            }))
            .on("finish", () => {
                songIndex[guild.id]++
                if (config.is_loop == true && songIndex[guild.id] >= songQueue[guild.id].length) {
                    songIndex[guild.id] = 0
                } 
                // else {
                //     disconnect(guild)
                //     return
                // }
                serverQueue.songs.push(songQueue[guild.id][songIndex[guild.id]])
                serverQueue.songs.shift()
                play(guild, serverQueue.songs[0])
            })
            .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    } catch (err) {
        console.log(err)
        serverQueue.textChannel.send(`Unable to play **${song.title}**, skipping the track.`);
    }
}

const connect = async (message) => {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send("You need to be in a voice channel to play music!")
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
      );
    }

    // Creating the contract for our queue
    const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
    };
    // Setting the queue using our contract
    queue.set(message.guild.id, queueContruct);

    try {
        // Here we try to join the voicechat and save our connection into our object.
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        // Calling the play function to start a song
        play(message.guild, queueContruct.songs[0]);
    } catch (err) {
        // Printing the error message if the bot fails to join the voicechat
        console.log(err);
        queue.delete(message.guild.id);
        // return message.channel.send(err);
    }
}

 async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
      );
    }

    try {
        const removedArg = args.shift()
        if (!ytdl.validateURL(args.join(' '))) {
            return message.channel.send("Please insert a valid youtube video's link.")
        }

        const songInfo = await ytdl.getInfo(args[0]);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        };

        if (!serverQueue) {
            // Creating the contract for our queue
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true,
            };
            // Setting the queue using our contract
            queue.set(message.guild.id, queueContruct);
            // Pushing the song to our songs array
            queueContruct.songs.push(song);
            
            try {
                // Here we try to join the voicechat and save our connection into our object.
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                // Calling the play function to start a song
                songQueue[message.guild.id] = []
                songQueue[message.guild.id].push(queueContruct.songs[0])
                songIndex[message.guild.id] = 0
                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                // Printing the error message if the bot fails to join the voicechat
                console.log(err);
                songIndex[message.guild.id] = 1
                songQueue.delete(message.guild.id)
                queue.delete(message.guild.id);
                return message.channel.send(err);
            }
        }else {
            songQueue[message.guild.id].push(song)
            // serverQueue.songs.push(song);
            return message.channel.send(`${song.title} has been added to the queue!`);
        }
    } catch (err) {
        console.log(err)
        if (!serverQueue) {
            return message.channel.send(`Failed to play ${args[0]}, please try another song.`);
        }
        return message.channel.send(`Failed to add ${args[0]} to queue, please try another song.`);
    }
  }

const nowPlaying = (message, serverQueue) => {
    return message.channel.send(`now playing ${serverQueue.songs[songIndex[message.guild.id]].title}.`);
}

const queueList = (message, serverQueue) => {
    return message.channel.send(`queue:\n${songQueue[message.guild.id].map((value, index) => `${index}. ${value.title} ${ songIndex[message.guild.id] == index ? '(now playing)' : '' }`).join('\n')}`);
}

const skip = (message, serverQueue) => {
    if (!message.member.voice.channel) return message.channel.send("You have to be in a voice channel to stop the music!");
    if (!serverQueue) return message.channel.send("There is no song that I could skip!");

    songIndex[message.guild.id]++

    if (serverQueue.songs.length <= 1) {
        if (songIndex[message.guild.id] >= songQueue[message.guild.id].length && config.is_loop == true) {
            songIndex[message.guild.id] = 0
            console.log(songQueue[message.guild.id])
            console.log(songQueue[message.guild.id][songIndex[message.guild.id]])
            serverQueue.songs.push(songQueue[message.guild.id][songIndex[message.guild.id]])
        }
    }
    
    serverQueue.songs.shift()
    play(message.guild, serverQueue.songs[0]);
}

const removeQueue = (message, serverQueue) => {
    if (!message.member.voice.channel) return message.channel.send("You have to be in a voice channel to remove the music!");
    const args = message.content.split(" ");
    if (+args[1] == songIndex[message.guild.id]) return message.channel.send("Unable to remove a playing music, please use skip command");
    if (+args[1] > songQueue[message.guild.id].length) return message.channel.send("Music not found, please check again using queue command");

    songQueue[message.guild.id].splice(+args[1], 1)
    return message.channel.send("The selected music has been deleted");
}

 client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);
    // queue / list, done
    // nowplaying / np, done
    // remove song index, done
    // repeat / loop, done
    if (message.content.startsWith(`${prefix}play`) || message.content.startsWith(`${prefix}p`)) {
        // message.channel.send("play command!");
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`) || message.content.startsWith(`${prefix}s`)) {
        skip(message, serverQueue);
        return;
    // } else if (message.content.startsWith(`${prefix}join`) || message.content.startsWith(`${prefix}j`)) {
    //     connect(message)
    //     // stop(message, serverQueue);
    //     return;
    } else if (message.content.startsWith(`${prefix}disconnect`) || message.content.startsWith(`${prefix}dc` || message.content.startsWith(`${prefix}stop`) || message.content.startsWith(`${prefix}leave`))) {
        disconnect(message.guild, message)
        // stop(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}loop`) || message.content.startsWith(`${prefix}repeat`)) {
        // message.channel.send("play command!");
        config.is_loop = !config.is_loop
        if (config.is_loop == true) {
            message.channel.send("Looping has been enabled");
        } else {
            message.channel.send("Looping has been disabled");
        }
        return;
    } else if (message.content.startsWith(`${prefix}nowplaying`) || message.content.startsWith(`${prefix}np`)) {
        nowPlaying(message, serverQueue)
        return; 
    } else if (message.content.startsWith(`${prefix}queue`) || message.content.startsWith(`${prefix}list`) || message.content.startsWith(`${prefix}q`)) {
        queueList(message, serverQueue)
        return; 
    } else if (message.content.startsWith(`${prefix}remove`) || message.content.startsWith(`${prefix}rm`)) {
        removeQueue(message, serverQueue)
        return; 
    } else if (message.content.startsWith(`${prefix}Help`) || message.content.startsWith(`${prefix}Help`) || message.content.startsWith(`${prefix}h`)) 
	{
        message.channel.send("\nHere are the Commands dayo!: (Server Prefix: " + prefix + ") \n\n" + 
        				   "Play song / Add song to queue: \t " + prefix + "play, " + prefix + "p \n" + 
        				   "Skip the current song: \t\t " + prefix + "skip, " + prefix + "s \n" + 
        				   "Disconnect the bot: \t\t " + prefix + "disconnect, " + prefix + "dc, " + prefix + "stop, " + prefix + "leave \n" + 
        				   "Loop the Queue / Song: \t\t " + prefix + "loop, " + prefix + "repeat \n" + 
        				   "Show current song: \t\t " + prefix + "nowplaying, " + prefix + "np \n" + 
        				   "Show entire queue: \t\t " + prefix + "queue, " + prefix + "q, " + prefix + "list \n" + 
        				   "Remove song from queue: \t " + prefix + "remove [Number in queue], " + prefix + "r [Number in queue] \n" + 
        				   "Clear the queue: \t\t " + prefix + "clearqueue, " + prefix + "cq \n" + 
        				   "Shuffle the queue: \t\t " + prefix + "shuffle, " + prefix + "s \n" + 
        				   "\n\nkekw");
        return;
    } else {
        message.channel.send("You need to enter a valid command!");
    }
})