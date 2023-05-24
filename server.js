const { errorHandler, checkRequestLimit } = require('./src/middleware');
const {
  sendMenu,
  createVote,
  processOrder,
  getOrder,
  handleCallBack,
  sendDebt,
  getCart,
  resetData,
} = require('./src/services');
const cron = require('node-cron');
const bot = require('./src/bot');
const { GROUP_CHAT_ID } = require('./src/constant');
const telegrafGetChatMembers = require('telegraf-getchatmembers');
// Middleware kiểm tra số lượng request
bot.use(errorHandler);
bot.use(telegrafGetChatMembers);
// test

// async function run() {
//   // Send the menu
//   await sendMenu();
//   console.log('Menu sent successfully.');

//   // Wait 10 seconds
//   await new Promise((resolve) => setTimeout(resolve, 10000));

//   // Create the vote
//   await createVote();
//   console.log('Vote created successfully.');
//   await new Promise((resolve) => setTimeout(resolve, 15000));

//   // Create the order
//   await getOrder();
//   console.log('Order created successfully.');
// }

// run();

cron.schedule(
  '30 9 * * 2-5',
  async () => {
    // Send the menu
    await sendMenu();
    console.log('Menu sent successfully.');

    // Wait 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Create the vote
    await createVote();
    console.log('Vote created successfully.');

    // Đặt giờ gửi menu và tạo vote
    cron.schedule(
      '0 16 * * *',
      async () => {
        // Send the menu
        await sendDebt();
        console.log('send debt successfully.');
      },
      {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh', // Đặt múi giờ cho cron
      }
    );

    cron.schedule(
      '0 18 * * *',
      async () => {
        // Tạo nút hỏi người dùng có muốn đặt món không
        await resetData();
        console.log('reset successfully.');
      },
      {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh', // Đặt múi giờ cho cron
      }
    );
  },
  {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh', // Đặt múi giờ cho cron
  }
);

bot.command('list', (ctx) => {
  const message =
    '<b>Danh sách các lệnh</b>\n' +
    '/menu: lấy menu của quán hôm nay\n' +
    '/vote: tạo vote thủ công để đặt món\n' +
    '/check: check thông tin các món user đã đặt\n' +
    '/cart: check thông tin các món đã đặt\n' +
    '/order: tạo đơn hàng (tính năng chưa ổn định)\n' +
    '/info: thông tin của quán, thông tin chuyển khoản...';

  ctx.reply(message, { parse_mode: 'HTML' });
});

bot.command('info', (ctx) => {
  const message =
    '<b>Thông tin thanh toán 💰: </b>\n' +
    '- <b>momo của người bán</b>: 0902504708 - Nguyễn Thị Tuyết Mai\n' +
    '- <b>momo của Anh Minh:</b> 0935268122\n';
  ctx.reply(message, { parse_mode: 'HTML' });
});

// Lắng nghe sự kiện khi user chọn một lựa chọn
bot.on('callback_query', async (ctx) => {
  await handleCallBack(ctx);
});

// Lấy danh sách món ăn và gửi pool vote cho group chat
bot.command('vote', async (ctx) => {
  await createVote(ctx);
});

bot.command('order', async () => {
  await processOrder();
});

bot.command('check', async () => {
  await getOrder();
});

bot.command('cart', async () => {
  await getCart();
});

// Xử lý lệnh /menu
bot.command('menu', async (ctx) => {
  await sendMenu(ctx);
});

// bot.command('sendall', async (ctx) => {
//     const chatId = GROUP_CHAT_ID;
//     const membersCount = await ctx.telegram.getChatMembersCount(chatId);
//     for (let i = 0; i < membersCount; i++) {
//       const member = telegrafGetChatMembers.check(ctx.chat.id)  //[Members]
//       const memberId = member.user.id;
//       const message = 'Hello, world!'; // Thay bằng nội dung tin nhắn của bạn
//       await ctx.telegram.sendMessage(memberId, message);
//     }

//     ctx.reply('Message sent to all members in the group!');
//   });

bot.launch();
