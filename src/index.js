const Discord = require('discord.js');
const { messageHandler } = require('./handler/message');
const { token } = require('../config.json');

const client = new Discord.Client();

client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});
client.on('message', messageHandler);
client.login(token);
