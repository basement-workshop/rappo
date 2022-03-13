const { MessageEmbed } = require('discord.js')
const ytdl = require('ytdl-core')
const { playMusic } = require('../lib/music');
const { disconnectHandler } = require('./common');

const execute = async (message, queue) => {
    const serverQueue = queue.get(message.guild.id);
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`You need to be in a voice channel to play music!`)
        return message.channel.send(embededMessage)
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`I need the permissions to join and speak in your voice channel!`)
        return message.channel.send(embededMessage)
    }

    try {
        const removedArg = args.shift()
        let videoUrl = args[0]
        const songs = []
        if (!ytdl.validateURL(args.join(' '))) {
            if (args.length > 1) {
                // search
                const searchResults = await ytsr(args.join(' '))
                if (searchResults.items.length <= 0) {
                    const embededMessage = new MessageEmbed()
                    embededMessage.setColor('#889A60')
                    embededMessage.setDescription(`Video not found.`)
                    return message.channel.send(embededMessage)
                }

                videoUrl = searchResults.items[0]["url"]
            } else {
                // playlist
                const playlist = await ytpl(args[0])
                playlist.items.forEach(item => {
                    songs.push({
                        title: item.title,
                        url: item.shortUrl,
                        username: message.author.username
                    })
                })
            }
        }

        if (songs.length <= 0) {
            const songInfo = await ytdl.getInfo(videoUrl);
            songs[0] = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                username: message.author.username
            };
        }

        if (!serverQueue) {
            // Creating the contract for our queue
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true,
                loop: null
            };
            // Setting the queue using our contract
            queue.set(message.guild.id, queueContruct);
            // Pushing the song to our songs array
            queueContruct.songs = songs;
            
            try {
                // Here we try to join the voicechat and save our connection into our object.
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                playMusic(queue, message, queueContruct.songs[0]);
            } catch (err) {
                // Printing the error message if the bot fails to join the voicechat
                console.log(err);
                queue.delete(message.guild.id);
                return message.channel.send(err);
            }
        }else {
            if (serverQueue.songs.length > 0) {
                serverQueue.songs = serverQueue.songs.concat(songs)
                const embededMessage = new MessageEmbed()
                embededMessage.setColor('#889A60')
                embededMessage.setDescription(`[${songs[0].title}](${songs[0].url}) has been added to the queue!`)
                return message.channel.send(embededMessage);
            } else {
                serverQueue.songs = serverQueue.songs.concat(songs)
                playMusic(queue, message, serverQueue.songs[0])
                return
            }
        }
    } catch (err) {
        console.log(err)
        if (!serverQueue) {
            const embededMessage = new MessageEmbed()
            embededMessage.setColor('#889A60')
            embededMessage.setDescription(`Failed to play ${args.join(" ")}, please try another song.`)
            return message.channel.send(embededMessage);
        }
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`Failed to add ${args.join(" ")} to queue, please try another song.`)
        return message.channel.send(embededMessage);
    }
}

const skip = async (message, queue) => {
    const serverQueue = queue.get(message.guild.id);
    if (!message.member.voice.channel) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`You have to be in a voice channel to stop the music!`)
        return message.channel.send(embededMessage);
    }
    if (!serverQueue) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`There is no song that I could skip!`)
        return message.channel.send(embededMessage)
    }

    serverQueue.songs.shift()
    playMusic(queue, message, serverQueue.songs[0])
    return
}

const loop = (message, queue) => {
    const serverQueue = queue.get(message.guild.id)
    if (!message.member.voice.channel) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`You have to be in a voice channel to remove the music!`)
        return message.channel.send(embededMessage)
    }

    if (serverQueue.loop == 'song') {
        serverQueue.loop = null
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`Loop for current song has been deactivated`)
        return message.channel.send(embededMessage)
    } else if (serverQueue.loop == null) {
        serverQueue.loop = 'song'
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`Loop for current song has been activated`)
        return message.channel.send(embededMessage)
    }
}

const shuffle = (message, queue) => {
    const embededMessage = new MessageEmbed()
    embededMessage.setColor('#889A60')
    embededMessage.setDescription(`This command is still under development, gomen dayo`)
    return message.channel.send(embededMessage)
}

const nowPlaying = (message, queue) => {
    const serverQueue = queue.get(message.guild.id)
    if (!serverQueue) {
        connect(message, serverQueue)
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`There is no track playing right now.`)
        return message.channel.send(embededMessage)
    }

    if (serverQueue.songs.length > 1) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`Now playing [${serverQueue.songs[0].title}](${serverQueue.songs[0].url}).`)
        return message.channel.send(embededMessage)
    } else {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`There is no track playing right now.`)
        return message.channel.send(embededMessage)
    }
}

const queueList = (message, queue) => {
    try {
        const serverQueue = queue.get(message.guild.id)
        if (!serverQueue) {
            connect(message, serverQueue)
            const embededMessage = new MessageEmbed()
            embededMessage.setColor('#889A60')
            embededMessage.setDescription(`There is no track in queue.`)
            return message.channel.send(embededMessage)
        }
        
        if (serverQueue.songs.length > 1) {
            const embededMessage = new MessageEmbed()
            embededMessage.setColor('#889A60')
            embededMessage.setDescription(`Queue:`)
            const songs = serverQueue.songs.slice(0,5)

            songs.forEach((value, index) => {
                embededMessage.addField(`${index}. [${value.title}](${value.url})`, `added by ${value.username}`)
            })
            if (serverQueue.songs.length > 5) {
                embededMessage.addField(`Songs in queue`, `and other ${+serverQueue.songs.length - 5} songs`)
            }
            return message.channel.send(embededMessage)
        } else {
            const embededMessage = new MessageEmbed()
            embededMessage.setColor('#889A60')
            embededMessage.setDescription(`There is no track in queue.`)
            return message.channel.send(embededMessage)
        }
    } catch (err) {
        console.log(err)
    }
}

const clearQueue = (message, queue) => {
    const serverQueue = queue.get(message.guild.id)
    serverQueue.songs = []
    queue.set(message.guild.id, serverQueue)
    const embededMessage = new MessageEmbed()
    embededMessage.setColor('#889A60')
    embededMessage.setDescription(`Queue has been cleared out.`)
    message.channel.send(embededMessage);
    disconnectHandler(message, queue)
    return
}

const removeQueue = (message, queue) => {
    const serverQueue = queue.get(message.guild.id)
    if (!message.member.voice.channel) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`You have to be in a voice channel to remove the music!`)
        return message.channel.send(embededMessage)
    }
    const args = message.content.split(" ");
    if (!serverQueue.songs[+args[1]]) {
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`Unable to remove music: music with index of ${args[1]} is not found.`)
        return message.channel.send(embededMessage)
    }
    
    serverQueue.songs.splice(+args[1], 1)
    const embededMessage = new MessageEmbed()
    embededMessage.setColor('#889A60')
    embededMessage.setDescription(`The selected music has been deleted`)
    return message.channel.send(embededMessage)
}

module.exports.executeHandler = execute
module.exports.skipHandler = skip
module.exports.loopHandler = loop
module.exports.shuffleHandler = shuffle
module.exports.nowPlayingHandler = nowPlaying
module.exports.queueListHandler = queueList
module.exports.clearQueueHandler = clearQueue
module.exports.removeQueueHandler = removeQueue