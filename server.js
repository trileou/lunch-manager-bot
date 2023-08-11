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
  createCustomMenu,
  createVoteCustom,
} = require('./src/services');
const cron = require('node-cron');
const bot = require('./src/bot');
// const { GROUP_CHAT_ID } = require('./src/constant');
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

let jobRunning = true;

cron.schedule(
  '00 10 * * 2-5',
  async () => {
    if(!jobRunning) {
      console.log('Job is paused.'); // Công việc đã dừng, không thực hiện gì
      return;
    }
    // Send the menu
    await sendMenu();
    console.log('Menu sent successfully.');

    // Wait 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Create the vote
    await createVote();
    console.log('Vote created successfully.');
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

 // Đặt giờ gửi menu và tạo vote
 cron.schedule(
  '0 16 * * 2-5',
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
    '- <b>momo của chủ quán</b>: 0902504708 - Nguyễn Thị Tuyết Mai\n' +
    '- <b>momo của Chang Lee</b> 056 330 5629\n';
  ctx.reply(message, { parse_mode: 'HTML' });
  ctx.replyWithPhoto({ source: 'public/img/qr.jpg' });
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

// Lệnh để dừng công việc
bot.command('stop', (ctx) => {
  jobRunning = false; // Đặt trạng thái công việc thành dừng
  ctx.reply('Đã ngưng đặt cơm tự động vào lúc 10:00 hôm nay! \n Nếu muốn đặt link shoppeeFood vui lòng gõ /create_menu!');
});



//create menu link
let menuLink = null; // Biến để lưu link menu, khởi đầu là null

// Lệnh để xử lý tạo menu
// bot.command('create_menu', async (ctx) => {
//   const userMessage = ctx.message.text;

//   // Kiểm tra nếu người dùng đã cung cấp liên kết sau lệnh /create_menu
//   if (userMessage.split(' ').length > 1) {
//     menuLink = userMessage.split(' ')[1]; // Lấy liên kết từ thông điệp
//     await createCustomMenu(menuLink);
//     await createVoteCustom(menuLink);
//     // ctx.reply('Menu has been created successfully.');
//   } else {
//     if (!menuLink) {
//       await ctx.reply('Please enter the link for the menu.');
//       menuLink = true; // Đặt trạng thái đang chờ nhập link
//     } else {
//       // Đã có link rồi, thực hiện tạo menu từ menuLink
//       await createCustomMenu(menuLink);
//       await createVoteCustom(menuLink);

//       // ctx.reply('Menu has been created successfully.');
//       menuLink = null; // Đặt lại trạng thái để yêu cầu người dùng nhập link lần sau
//     }
//   }
// });

// // Sự kiện lắng nghe tin nhắn người dùng
// bot.on('text', async (ctx) => {
//   menuLink = ctx.message.text;
//   if(!menuLink || menuLink.length == 0) {
//     ctx.reply("Vui lòng nhập link shopeefood đúng định dạng!");
//     return;
//   }

//   if (menuLink) {
//     // Lưu link mà người dùng đã nhập
//     await createCustomMenu(menuLink);
//     // ctx.reply('Menu has been created successfully.');
//     menuLink = null; // Đặt lại trạng thái để yêu cầu người dùng nhập link lần sau
//   }
// });





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

bot.launch().then(console.log('bot start'));
