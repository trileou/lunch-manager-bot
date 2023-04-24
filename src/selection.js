// selection.js

let selections = [];

function addSelection(userInfo, selection) {
    selections.push({ ...userInfo, selection });
}

function getUserSelections(userId) {
  return selections.filter(select => select.userId == userId);
}

function getSelections() {
  return selections || [];
}

function resetSelections() {
  selections = [];
}

function updateSelection(userInfo, selection) {
  const userIndex = selections.findIndex((item) => item.userId === userInfo.userId);
  if (userIndex !== -1) {
    selections[userIndex].selection = selection;
  } else {
    console.log('User not found');
  }
}

module.exports = {
  addSelection,
  getSelections,
  resetSelections,
  updateSelection,
  getUserSelections,
};
