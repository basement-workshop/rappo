let { prefix, app_id } = require('../../config.json');
const { helpHandler, mentionedHandler } = require('./help')
const { executeHandler, skipHandler, loopHandler, shuffleHandler, nowPlayingHandler, queueListHandler, clearQueueHandler, removeQueueHandler } = require('./music')
const { disconnectHandler, connectHandler } = require('./common')
const queue = new Map()

const commands = [
    {
        prefix: 'join',
        handler: (message, queue) => connectHandler(message, queue)
    },
    {
        prefix: 'j',
        handler: (message, queue) => connectHandler(message, queue)
    },
    {
        prefix: 'p',
        handler: (message, queue) => executeHandler(message, queue)
    },
    {
        prefix: 'play',
        handler: (message, queue) => executeHandler(message, queue)
    },
    {
        prefix: 'skip',
        handler: (message, queue) => skipHandler(message, queue)
    },
    {
        prefix: 'stop',
        handler: (message, queue) => disconnectHandler(message, queue)
    },
    {
        prefix: 'disconnect',
        handler: (message, queue) => disconnectHandler(message, queue)
    },
    {
        prefix: 'dc',
        handler: (message, queue) => disconnectHandler(message, queue)
    },
    {
        prefix: 'leave',
        handler: (message, queue) => disconnectHandler(message, queue)
    },
    {
        prefix: 'loop',
        handler: (message, queue) => loopHandler(message, queue)
    },
    {
        prefix: 'repeat',
        handler: (message, queue) => loopHandler(message, queue)
    },
    {
        prefix: 'shuffle',
        handler: (message, queue) => shuffleHandler(message, queue)
    },
    {
        prefix: 'nowplaying',
        handler: (message, queue) => nowPlayingHandler(message, queue)
    },
    {
        prefix: 'np',
        handler: (message, queue) => nowPlayingHandler(message, queue)
    },
    {
        prefix: 'queue',
        handler: (message, queue) => queueListHandler(message, queue)
    },
    {
        prefix: 'list',
        handler: (message, queue) => queueListHandler(message, queue)
    },
    {
        prefix: 'q',
        handler: (message, queue) => queueListHandler(message, queue)
    },
    {
        prefix: 'clearqueue',
        handler: (message, queue) => clearQueueHandler(message, queue)
    },
    {
        prefix: 'clear',
        handler: (message, queue) => clearQueueHandler(message, queue)
    },
    {
        prefix: 'cq',
        handler: (message, queue) => clearQueueHandler(message, queue)
    },
    {
        prefix: 'remove',
        handler: (message, queue) => removeQueueHandler(message, queue)
    },
    {
        prefix: 'r',
        handler: (message, queue) => removeQueueHandler(message, queue)
    },
    {
        prefix: 'h',
        handler: (message) => helpHandler(message)
    },
    {
        prefix: 'help',
        handler: (message) => helpHandler(message)
    },
]

const messageHandler = async (message) => {
    // ignore bot messages
    if (message.author.bot) return
    // is someone mentioning me?
    if (message.mentions.users.get(app_id)) {
        mentionedHandler(message)
        return
    }
    // ignore messages without same prefix
    if (!message.content.startsWith(prefix)) return

    const userMessage = message.content
    const keyCommand = userMessage.replace(prefix, '').split(' ')[0]
    for (const command of commands) {
        if (keyCommand == command.prefix) {
            command.handler(message, queue)
            return
        }
    }
}

module.exports.messageHandler = messageHandler