const { Telegraf } = require('telegraf');
const { TOKEN } = require('./constant');

const bot = new Telegraf(TOKEN);

module.exports = bot;