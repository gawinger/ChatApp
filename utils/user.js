const users = [];

// Add new user to users array
module.exports.addUser = (username, room) => {
  const user = { username, room };
  // check if user is already in chatroom, if so dont add duplicate to user array
  const alreadyChatting = users.findIndex((u) => u.username === username);
  if (alreadyChatting === -1) {
    users.push(user);
  }
  return user;
};

module.exports.getUsersInRoom = (room) => {
  const activeUsers = users.filter((user) => user.room === room);
  return activeUsers;
};

module.exports.removeUser = (username, room) => {
  const removedUser = users.findIndex((user) => user.room === room && user.username === username);
  if (removedUser !== -1) {
    return users.splice(removedUser, 1);
  }
};
