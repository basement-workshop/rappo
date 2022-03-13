let { prefix } = require('../../config.json');

const helpHandler = (message) => {
    message.channel.send("\nHere are the Commands dayo!: (Server Prefix: " + prefix + ") \n\n" + 
        "Play song / Add song to queue: \t " + prefix + "play, " + prefix + "p \n" + 
        "Skip the current song: \t\t " + prefix + "skip\n" + 
        "Connect the bot: \t\t " + prefix + "join, " + prefix + "j\n" + 
        "Disconnect the bot: \t\t " + prefix + "disconnect, " + prefix + "dc, " + prefix + "stop, " + prefix + "leave \n" + 
        "Loop the Queue / Song: \t\t " + prefix + "loop, " + prefix + "repeat \n" + 
        "Show current song: \t\t " + prefix + "nowplaying, " + prefix + "np \n" + 
        "Show entire queue: \t\t " + prefix + "queue, " + prefix + "q, " + prefix + "list \n" + 
        "Remove song from queue: \t " + prefix + "remove [Number in queue], " + prefix + "r [Number in queue] \n" + 
        "Clear the queue: \t\t " + prefix + "clearqueue, " + prefix + "cq \n" + 
        "Shuffle the queue: \t\t " + prefix + "shuffle\n" + 
        "\n\nkekw");
    return;
}

const mentionedHandler = (message) => {
    message.channel.send(`Why don't you try sending ${prefix}help`)
    return
}

module.exports.helpHandler = helpHandler
module.exports.mentionedHandler = mentionedHandler