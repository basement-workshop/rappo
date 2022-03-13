const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');
const { disconnectHandler } = require('../handler/common')

const play = (queue, message, song, timeoutCounter = 0) => {
    const guild = message.guild
    const serverQueue = queue.get(guild.id);
    if (!song) {
        disconnectHandler(message, queue)
        return;
    }

    try {
        const playingEmbed = new MessageEmbed()
        playingEmbed.setColor('#889A60')
        playingEmbed.setDescription(`Now playing [${song.title}](${song.url}) requested by @${song.username}`)
        serverQueue.textChannel.send(playingEmbed);
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1<<25
            }))
            .on("skip", () => {
                serverQueue.songs.shift()
                console.log(serverQueue)
                play(queue, message, serverQueue.songs[0])
            })
            .on("finish", () => {
                if (serverQueue.loop == null) {
                    serverQueue.songs.shift()
                }
                play(queue, message, serverQueue.songs[0])
            })
            .on("error", error => {
                console.log('error event')
                console.error(error)
            });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    } catch (err) {
        console.log(err)
        const playingEmbed = new MessageEmbed()
        playingEmbed.setColor('#889A60')
        playingEmbed.setDescription(`Unable to play [${song.title}](${song.url}), skipping the track.`)
        serverQueue.textChannel.send(playingEmbed);
    }
}

module.exports.playMusic = play