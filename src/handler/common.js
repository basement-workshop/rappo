const { MessageEmbed } = require('discord.js')

const disconnect = async (message, queue) => {
    let serverQueue = queue.get(message.guild.id)
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
    queue.delete(message.guild.id)
    return
}

const connect = async (message, queue) => {
    const serverQueue = queue.get(message.guild.id)
    if (serverQueue) {
        return
    }

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
        // play(message.guild, queueContruct.songs[0]);
    } catch (err) {
        // Printing the error message if the bot fails to join the voicechat
        console.log(err);
        queue.delete(message.guild.id);
        const embededMessage = new MessageEmbed()
        embededMessage.setColor('#889A60')
        embededMessage.setDescription(`Unknown error, failed to join voice chat.`)
        return message.channel.send(embededMessage)
    }
}

module.exports.disconnectHandler = disconnect
module.exports.connectHandler = connect