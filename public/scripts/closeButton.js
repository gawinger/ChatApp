const closeButton = document.querySelector(".flash-close");
const flashAlert = document.querySelector(".flash-alert");

// close button for flash alerts
if (closeButton) {
  closeButton.addEventListener("click", () => {
    flashAlert.style.display = "none";
  });
}
