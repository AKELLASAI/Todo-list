const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const count = document.getElementById("count");
const clearDone = document.getElementById("clear-done");
const filterButtons = document.querySelectorAll(".filter");
const deleteAll = document.getElementById("delete-all");
const confirmBox = document.getElementById("confirm-delete");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

const STORAGE_KEY = "todos";
const FILTER_KEY = "todos-filter";

// Load saved tasks safely — bad or missing data never breaks the page.
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter(t => t && typeof t.text === "string" && t.text.trim())
      .map(t => ({ id: String(t.id ?? newId()), text: t.text, done: !!t.done }));
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage blocked (e.g. private mode) — the list still works for this visit.
  }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

let todos = load();
let filter = "all";
try {
  const saved = localStorage.getItem(FILTER_KEY);
  if (["all", "active", "done"].includes(saved)) filter = saved;
} catch {}

const emptyMessages = {
  all: "Nothing here yet — add your first task!",
  active: "No active tasks. Nice work!",
  done: "No completed tasks yet.",
};

function render() {
  list.innerHTML = "";

  filterButtons.forEach(b => b.classList.toggle("active", b.dataset.filter === filter));

  const visible = todos.filter(t =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = emptyMessages[filter];
    list.appendChild(li);
  }

  visible.forEach(todo => {
    const li = document.createElement("li");
    if (todo.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `Mark "${todo.text}" as done`);
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      save();
      render();
    });

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.text;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "✕";
    del.title = "Delete";
    del.setAttribute("aria-label", `Delete "${todo.text}"`);
    del.addEventListener("click", () => {
      todos = todos.filter(t => t.id !== todo.id);
      save();
      render();
    });

    li.append(checkbox, text, del);
    list.appendChild(li);
  });

  const left = todos.filter(t => !t.done).length;
  count.textContent = `${left} task${left === 1 ? "" : "s"} left`;
  const confirming = !confirmBox.hidden;
  clearDone.hidden = confirming || !todos.some(t => t.done);
  deleteAll.hidden = confirming || todos.length === 0;
  if (todos.length === 0) confirmBox.hidden = true;
}

function showConfirm(show) {
  confirmBox.hidden = !show;
  render();
  (show ? confirmNo : deleteAll).focus();
}

deleteAll.addEventListener("click", () => showConfirm(true));
confirmNo.addEventListener("click", () => showConfirm(false));
confirmYes.addEventListener("click", () => {
  todos = [];
  confirmBox.hidden = true;
  save();
  render();
  input.focus();
});

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.value = "";
    input.focus();
    return;
  }
  todos.push({ id: newId(), text, done: false });
  input.value = "";
  input.focus();
  // Show the new task even if the "Done" filter was selected.
  if (filter === "done") {
    filter = "all";
    try { localStorage.setItem(FILTER_KEY, filter); } catch {}
  }
  save();
  render();
});

clearDone.addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  save();
  render();
});

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    try { localStorage.setItem(FILTER_KEY, filter); } catch {}
    render();
  });
});

render();
