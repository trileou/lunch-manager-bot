const limitRequests = (maxRequests, perMilliseconds, extraTime) => {
  let requests = [];
  let processing = false;
  return (ctx, next) => {
    const now = Date.now();
    requests = requests.filter((time) => time > now - perMilliseconds);
    if (requests.length < maxRequests && !processing) {
      requests.push(now);
      processing = true;
      next().then(() => {
        processing = false;
      });
    } else {
      const timeToWait = extraTime;
      ctx.reply(`Bạn thao tác quá nhanh, vui lòng đợi ${timeToWait} giây`);
    }
  };
};

const checkRequestLimit = limitRequests(10, 60 * 1000, 10);



// error handler 
// Định nghĩa middleware để bắt lỗi
const errorHandler = (ctx, next) => {
  return next().catch((error) => {
    console.error('Error:', error)
    // Gửi cảnh báo cho người dùng
    ctx.reply(`Không thực hiện được yêu cầu, lỗi: ${error.message}`)
  })
}

module.exports = { checkRequestLimit, errorHandler };
