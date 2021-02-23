const socket = io();

const messages = document.querySelector(".chat-messages");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const joinedTemplate = document.querySelector("#joined-template").innerHTML;
const sideBarTemplate = document.querySelector("#sideBar-template").innerHTML;
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message");

//Get room ID from url
const roomId = window.location.pathname.substr(11);

// on message event render message with username, text and creation time
socket.on("message", (message) => {
  const messageHtml = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.message,
    timestamp: message.timestamp,
  });
  messages.insertAdjacentHTML("beforeend", messageHtml);
  autoscroll();
});

// on joined event render message without creation time
socket.on("joined", (message) => {
  const messageHtml = Mustache.render(joinedTemplate, {
    username: message.username,
    message: message.message,
  });
  messages.insertAdjacentHTML("beforeend", messageHtml);
});

// On form submittion emit sendMessage event
if (messageForm) {
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const messageText = e.target.elements.message.value;
    socket.emit("sendMessage", messageText);
  });
}

// Render sidebar with user data
socket.on("activeUsers", (users) => {
  const sideBarHtml = Mustache.render(sideBarTemplate, { users });
  document.querySelector(".chat-sidebar").innerHTML = sideBarHtml;
});

socket.emit("join", roomId, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

const autoscroll = () => {
  // New message element
  const newMessage = messages.lastElementChild;

  // Get height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messages.offsetHeight;

  // Height of messages container
  const containerHeight = messages.scrollHeight;

  // How far have I scrolled ?
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

messageForm.addEventListener("submit", function () {
  messageInput.value = "";
});
