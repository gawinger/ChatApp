const createMessage = (username, message) => {
  return {
    username,
    message,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

module.exports = { createMessage };
