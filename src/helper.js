const { format } = require('date-fns');

function getDate(formatStr = 'dd-MM') {
  return format(new Date(), formatStr);
}

function getSelectionString(selectionArr) {
  // Lưu danh sách các món đã đặt vào mảng uniqueSelections
  let uniqueSelections = [];
  for (let i = 0; i < selectionArr.length; i++) {
    let selection = selectionArr[i].selection;
    if (!uniqueSelections.includes(selection)) {
      uniqueSelections.push(selection);
    }
  }

  // Tạo chuỗi danh sách các món đã đặt
  let selectionString = '';
  for (let i = 0; i < uniqueSelections.length; i++) {
    let count = 0;
    for (let j = 0; j < selectionArr.length; j++) {
      if (selectionArr[j].selection === uniqueSelections[i]) {
        count++;
      }
    }
    if (i > 0) {
      selectionString += ', ';
    }
    if (count > 1) {
      selectionString += uniqueSelections[i] + ' (x' + count + ')';
    } else {
      selectionString += uniqueSelections[i];
    }
  }

  return selectionString;
}

module.exports = { getDate,getSelectionString };
