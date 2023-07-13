const { default: puppeteer } = require('puppeteer');
const bot = require('./bot');
const { MENU_URL, GROUP_CHAT_ID } = require('./constant');
const { getDate, getSelectionString } = require('./helper');
const selectionHandle = require('./selection');

const { Mutex } = require('async-mutex');
const mutex = new Mutex();

let tempOrder = [];

async function sendDebt() {
  const message =
    'Mọi người ơi 4h rồi ai còn nợ tiền cơm thì thanh toán nha! \n' +
    '<b>Thông tin thanh toán 💰: </b>\n' +
    '- <b>momo của Chang Lee</b> 056 330 5629\n';
  await bot.telegram.sendMessage(GROUP_CHAT_ID, message, {
    parse_mode: 'HTML',
  });
  
  await bot.telegram.sendPhoto({ source: 'public/img/qr.jpg' });
}

// Hàm gửi menu
async function sendMenu() {
  try {
    // Tạo trình duyệt mới
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    // Tạo trình duyệt mới
    const page = await browser.newPage();

    // Đi đến trang web của nhà hàng
    await page.goto(MENU_URL);
    await page.waitForSelector('div[class^="items_detail-menu"]', {
      timeout: 30000, // thời gian chờ tối đa là 30 giây
      visible: true, // chỉ chờ khi tất cả các ảnh đã hiển thị trên trang
    });

    // Set viewport size to 1920x1080
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluate(() => {
      const element = document.querySelector('.index_div_wraper_search__B_pLd');
      element.parentNode.removeChild(element);
    });

    const elements = await page.$$('.items_detail-menu__TtlTb');
    console.log('Link opened');

    let msg = '\n----------------------------------\n';
    msg += `Nô tì xin gửi menu cơm hôm nay ${getDate()}:`;
    await bot.telegram.sendMessage(GROUP_CHAT_ID, msg);
    for (let i = 0; i < elements.length; i++) {
      const item = elements[i];
      const screenshotBuffer = await item.screenshot();

      // Gửi ảnh cho group chat bằng bot
      const photo = { source: screenshotBuffer };
      await bot.telegram.sendPhoto(GROUP_CHAT_ID, photo);
    }
    // Đóng trình duyệt
    await browser.close();
  } catch (error) {
    throw Error(`Có lỗi khi gửi menu ${error.message}`);
  }
}

// Hàm để lấy tên món từ trang https://menu.sapofnb.vn/
async function getMenuItems() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(MENU_URL);

  await page.waitForSelector('div[class^="items_content__"]');
  const itemElements = await page.$$('div[class^="items_content__"]');

  const menuItems = [];

  for (let i = 0; i < itemElements.length; i++) {
    const nameElement = await itemElements[i].$('div');
    if (nameElement) {
      const name = await nameElement.evaluate((element) =>
        element.textContent.trim()
      );
      menuItems.push(name);
    }
  }

  await browser.close();

  return menuItems;
}

async function createVote() {
  const menuItems = await getMenuItems();

  // Chuyển danh sách lựa chọn thành các nút
  const buttons = menuItems.map((option) => {
    return { text: option, callback_data: option };
  });

  // Chia mảng buttons thành các mảng con có độ dài bằng 2
  const buttonRows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    buttonRows.push(buttons.slice(i, i + 2));
  }

  // Gửi pool vote về group chat
  await bot.telegram.sendMessage(
    GROUP_CHAT_ID,
    'Xin mời bạn click chọn món cho hôm nay!\n',
    {
      reply_markup: {
        inline_keyboard: buttonRows,
      },
    }
  );

  await bot.telegram.sendMessage(
    GROUP_CHAT_ID,
    `Cơm sẽ được chốt và lên đơn vào lúc 10:25, mọi người tranh thủ ạ!\n`
  );
}

async function checkUpdateOrder(ctx, userInfo, selection) {
  const { userId, userName } = userInfo;
  // Kiểm tra xem user đã tồn tại trong mảng chưa
  const selectionArr = selectionHandle.getSelections();
  const userIndex = selectionArr.findIndex((item) => item.userId === userId);

  const messageGroup = `<b>${userName}</b> đã đặt món '<b>${selection}</b>`;
  const buttons = [
    { text: 'Thêm món', callback_data: 'add_order' },
  ];

  if (userIndex != -1) {
    let extraMsg = `bạn muốn thêm 1 '<b>${selection}</b>' nữa không ?`;
    // Nếu user đã tồn tại, tạo nút "Đổi món" và "Thêm món" và gửi cho user

    const isDishExist = selectionArr.some(
      (select) => select.selection == selection
    );
    if (!isDishExist) {
      extraMsg = `bạn muốn đổi sang '<b>${selection}</b>' hay là thêm món?`;
      buttons.unshift({ text: 'Đổi món', callback_data: 'change_order' });
    }

    const message = `Bạn đã đặt món '<b>${getSelectionString(
      selectionArr
    )}</b>', ${extraMsg}`;

    const replyMarkup = {
      inline_keyboard: [buttons],
    }; // Khai báo định dạng message

    await ctx.telegram.sendMessage(userId, message, {
      reply_markup: replyMarkup,
      parse_mode: 'HTML',
    });

    tempOrder.push({ userId, selection });
  } else {
    // Nếu user chưa tồn tại, lưu thông tin user và lựa chọn vào mảng
    selectionHandle.addSelection(userInfo, selection);
    const removeOrderButton = [{ text: 'Đặt lại', callback_data: 'remove_order' }];
    const message = `Bạn đã đặt món '<b>${selection}</b>',`;
    await ctx.telegram.sendMessage(userId, message, {
      parse_mode: 'HTML',
    });

    // send button     
    const replyMarkup = {
      inline_keyboard: [removeOrderButton],
    }; // Khai báo định dạng message

    await ctx.telegram.sendMessage(userId, message, {
      reply_markup: replyMarkup,
      parse_mode: 'HTML',
    });
  }

  await ctx.telegram.sendMessage(GROUP_CHAT_ID, messageGroup, {
    parse_mode: 'HTML',
  });
}

async function processOrder() {
  const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  // Load the page and wait for all network requests to finish
  await page.goto(MENU_URL, { waitUntil: 'networkidle2' });

  // Wait for the last div element with class prefix "items_content__"
  await page.waitForSelector('div[class^="items_content__"]:last-child');

  const selections = selectionHandle.getSelections();

  const searchResultSelectors = [];

  for (const order of selections) {
    const divs = await page.$$('div[class^="items_content__"]');
    for (const div of divs) {
      const divContent = await div.$eval('div', (d) => d.textContent.trim());
      if (divContent === order.selection) {
        let isFind = false;
        let parent = await div.evaluateHandle((node) => node.parentElement);
        while (parent && !isFind) {
          const button = await parent.$('button');
          if (button) {
            // const buttonHTML = await button.evaluate((node) => node.outerHTML);
            // console.log('buttonHTML :', buttonHTML);
            searchResultSelectors.push(button);
            isFind = true;
          }
          parent = await parent.evaluateHandle((node) => node.parentElement);
        }
      }
    }
  }

  await Promise.all(
    searchResultSelectors.map(async (button) => {
      const buttonElement = await button.asElement();
      //   const isButtonEnabled = await page.evaluate((buttonElement) => {
      //     return (
      //       !buttonElement.disabled &&
      //       (buttonElement.offsetWidth > 0 ||
      //         buttonElement.offsetHeight > 0 ||
      //         buttonElement.getClientRects().length > 0)
      //     );
      //   }, buttonElement);

      //   if (isButtonEnabled) {
      await mutex.runExclusive(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await buttonElement.click();
      });
      //   }
    })
  );
}

// Hàm để gửi tin nhắn dạng table
async function sendSelectionsTable(chatId, selections, isCart = false) {
  // Nếu không có dữ liệu selections
  if (selections.length === 0) {
    await ctx.reply('Hiện tại chưa có đơn hàng nào được đặt.');
    return;
  }

  // Khai báo header và định dạng bảng
  let message = `<b>Danh sách đặt món của bạn ngày ${getDate()}:</b>\n\n`;
  if (isCart) {
    message += '\n';
    selections = selections.sort();
    for (const item of selections) {
      message += `${item.selection}\n`;
    }
  } else {
    message += '<code>| Tên             | Món đặt                      \n';
    message += '|-----------------|------------------------------\n';
    for (const item of selections) {
      message += `| ${(item.userName || '').padEnd(
        16
      )}| ${item.selection.padEnd(29)}\n`;
    }
    message += '</code>';
  }

  // Gửi tin nhắn dạng table cho người dùng
  await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

function processUpdateOrder(userInfo, selection, orderName) {
  tempOrder = [];
  // Lưu thông tin lựa chọn mới của user vào mảng
  if (selection === 'change_order') {
    selectionHandle.updateSelection(userInfo, orderName);
  } else if (selection === 'add_order') {
    selectionHandle.addSelection(userInfo, orderName);
  } else if (selection === 'remove_order') {
    selectionHandle.removeUserSelections(userInfo.userId);
  }

  // gửi lại tin nhắn update cho user
  const userSelection = selectionHandle.getUserSelections(userInfo.userId);
  if (userSelection && userSelection.length > 0) {
    sendSelectionsTable(userInfo.userId, userSelection);
  }
}

async function getOrder() {
  const selectionArr = selectionHandle.getSelections();
  if (selectionArr && selectionArr.length > 0) {
    sendSelectionsTable(GROUP_CHAT_ID, selectionArr);

    // const buttons = [
    //   { text: 'Có', callback_data: 'process_order' },
    //   { text: 'Tôi sẽ đặt thủ công', callback_data: 'wait_order' },
    // ];
    // const replyMarkup = {
    //   inline_keyboard: [buttons],
    // };
    // const message = `Vui lòng kiểm tra danh sách món ăn, nếu muốn lên đơn hãy nhấn 'Có', Nếu muốn hẹn giờ hãy nhấn '<b>Tôi sẽ đặt sau</b>'`;

    // await bot.telegram.sendMessage(GROUP_CHAT_ID, message, {
    //   reply_markup: replyMarkup,
    //   parse_mode: 'HTML',
    // });
  } else {
    const message = `Hình như các chủ nhân chưa đặt món nào , vui lòng gõ /vote và đặt lại`;

    await bot.telegram.sendMessage(GROUP_CHAT_ID, message, {});
  }
}

async function getCart() {
  const selectionArr = selectionHandle.getSelections();
  if (selectionArr && selectionArr.length > 0) {
    sendSelectionsTable(GROUP_CHAT_ID, selectionArr, true);
  } else {
    const message = `Hình như các chủ nhân chưa đặt món nào , vui lòng gõ /vote và đặt lại`;

    await bot.telegram.sendMessage(GROUP_CHAT_ID, message, {});
  }
}

// CALLBACK
async function handleCallBack(ctx) {
  const userId = ctx.update.callback_query.from.id;
  const userName = ctx.update.callback_query.from.username; // Lấy tên user
  const userInfo = { userId, userName };
  const selection = ctx.update.callback_query.data; // Lấy lựa chọn
  switch (selection) {
    case 'change_order':
    case 'add_order':
    case 'remove_order': {
      const tmpOrderFind = tempOrder.find((order) => order.userId == userId);
      const orderName = tmpOrderFind.selection || '';
      if (tmpOrderFind) {
        processUpdateOrder(userInfo, selection, orderName);
      }
      break;
    }
    case 'process_order':
      await processOrder();
      break;
    case 'wait_order':
      const message =
        'Bạn có thể dùng lệnh /order để lên đơn hàng bất kì lúc nào!\n';
      await bot.telegram.sendMessage(GROUP_CHAT_ID, message, {});
      break;
    default: {
      await checkUpdateOrder(ctx, userInfo, selection);
      break;
    }
  }
}

async function resetData() {
  tempOrder = [];
  selectionHandle.resetSelections();
}

module.exports = {
  sendMenu,
  getMenuItems,
  createVote,
  getOrder,
  processOrder,
  processUpdateOrder,
  checkUpdateOrder,
  handleCallBack,
  sendDebt,
  getCart,
  resetData,
};
