const checkboxes = document.querySelectorAll("input[type=checkbox]");
let checkedNum = 0;

// check how many checkboxes are checked
checkboxes.forEach((box) => {
  box.addEventListener("change", (e) => {
    if (e.target.checked) {
      // limit number of checked checboxes to 4
      if (checkedNum === 4) {
        return (e.target.checked = false);
      }
      checkedNum++;
    } else {
      checkedNum--;
    }
  });
});
