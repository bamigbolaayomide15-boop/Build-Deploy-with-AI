// Todo List Application
class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
    this.currentFilter = "all";

    // DOM Elements
    this.taskInput = document.getElementById("taskInput");
    this.addTaskBtn = document.getElementById("addTaskBtn");
    this.taskList = document.getElementById("taskList");
    this.clearCompletedBtn = document.getElementById("clearCompletedBtn");
    this.filterButtons = document.querySelectorAll(".filter-btn");
    this.darkModeToggle = document.getElementById("darkModeToggle");
    this.totalTasksEl = document.getElementById("totalTasks");
    this.remainingTasksEl = document.getElementById("remainingTasks");

    this.init();
  }

  init() {
    // Load tasks and set up event listeners
    this.loadTasks();
    this.setupEventListeners();
    this.updateStats();

    // Check for dark mode preference
    if (localStorage.getItem("darkMode") === "enabled") {
      document.body.classList.add("dark-mode");
      this.updateDarkModeIcon();
    }
  }

  setupEventListeners() {
    // Add task button
    this.addTaskBtn.addEventListener("click", () => this.addTask());

    // Add task on Enter key
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addTask();
      }
    });

    // Clear completed tasks
    this.clearCompletedBtn.addEventListener("click", () =>
      this.clearCompletedTasks()
    );

    // Filter buttons
    this.filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const filter = e.target.dataset.filter;
        this.setFilter(filter);
      });
    });

    // Dark mode toggle
    this.darkModeToggle.addEventListener("click", () => this.toggleDarkMode());

    // Keyboard shortcut for delete
    document.addEventListener("keydown", (e) => {
      if (e.key === "Delete") {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains("delete-btn")) {
          const taskId = parseInt(
            focusedElement.closest(".task-item").dataset.id
          );
          this.deleteTask(taskId);
        }
      }
    });
  }

  addTask() {
    const taskText = this.taskInput.value.trim();

    if (taskText === "") {
      this.showNotification("Please enter a task!", "warning");
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();

    // Clear input and focus
    this.taskInput.value = "";
    this.taskInput.focus();

    this.showNotification("Task added successfully!", "success");
  }

  toggleTaskCompletion(taskId) {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex !== -1) {
      this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();

    this.showNotification("Task deleted!", "info");
  }

  clearCompletedTasks() {
    const completedCount = this.tasks.filter((task) => task.completed).length;

    if (completedCount === 0) {
      this.showNotification("No completed tasks to clear!", "info");
      return;
    }

    if (
      confirm(
        `Are you sure you want to clear ${completedCount} completed task${
          completedCount > 1 ? "s" : ""
        }?`
      )
    ) {
      this.tasks = this.tasks.filter((task) => !task.completed);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();

      this.showNotification(
        `Cleared ${completedCount} completed task${
          completedCount > 1 ? "s" : ""
        }!`,
        "success"
      );
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;

    // Update active filter button
    this.filterButtons.forEach((btn) => {
      if (btn.dataset.filter === filter) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    this.renderTasks();
  }

  renderTasks() {
    this.taskList.innerHTML = "";

    // Filter tasks based on current filter
    let filteredTasks = this.tasks;

    if (this.currentFilter === "active") {
      filteredTasks = this.tasks.filter((task) => !task.completed);
    } else if (this.currentFilter === "completed") {
      filteredTasks = this.tasks.filter((task) => task.completed);
    }

    if (filteredTasks.length === 0) {
      const emptyState = document.createElement("li");
      emptyState.className = "empty-state";

      let message = "";
      if (this.currentFilter === "all") {
        message = "No tasks yet. Add your first task above!";
      } else if (this.currentFilter === "active") {
        message = "No active tasks. All tasks are completed!";
      } else {
        message = "No completed tasks yet.";
      }

      emptyState.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>${message}</p>
                </div>
            `;

      this.taskList.appendChild(emptyState);
      return;
    }

    // Render filtered tasks
    filteredTasks.forEach((task) => {
      const taskItem = document.createElement("li");
      taskItem.className = "task-item";
      taskItem.dataset.id = task.id;

      taskItem.innerHTML = `
                <div class="task-checkbox ${task.completed ? "checked" : ""}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ""}
                </div>
                <div class="task-content ${task.completed ? "completed" : ""}">
                    ${this.escapeHtml(task.text)}
                </div>
                <div class="task-actions">
                    <button class="delete-btn" title="Delete task" aria-label="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      // Add event listeners to the task item
      const checkbox = taskItem.querySelector(".task-checkbox");
      const deleteBtn = taskItem.querySelector(".delete-btn");

      checkbox.addEventListener("click", () =>
        this.toggleTaskCompletion(task.id)
      );
      deleteBtn.addEventListener("click", () => this.deleteTask(task.id));

      // Make the entire task clickable
      taskItem.addEventListener("click", (e) => {
        if (
          !e.target.closest(".delete-btn") &&
          !e.target.closest(".task-checkbox")
        ) {
          this.toggleTaskCompletion(task.id);
        }
      });

      this.taskList.appendChild(taskItem);
    });
  }

  loadTasks() {
    this.renderTasks();
  }

  saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(this.tasks));
  }

  updateStats() {
    const totalTasks = this.tasks.length;
    const remainingTasks = this.tasks.filter((task) => !task.completed).length;

    this.totalTasksEl.textContent = totalTasks;
    this.remainingTasksEl.textContent = remainingTasks;
  }

  toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    this.updateDarkModeIcon();

    // Save preference to localStorage
    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("darkMode", "enabled");
    } else {
      localStorage.setItem("darkMode", "disabled");
    }
  }

  updateDarkModeIcon() {
    const icon = this.darkModeToggle.querySelector("i");
    if (document.body.classList.contains("dark-mode")) {
      icon.className = "fas fa-sun";
    } else {
      icon.className = "fas fa-moon";
    }
  }

  showNotification(message, type = "info") {
    // Remove any existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <span>${message}</span>
        `;

    // Add styles for notification
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background-color: ${
              type === "success"
                ? "var(--success-color)"
                : type === "warning"
                ? "var(--warning-color)"
                : type === "danger"
                ? "var(--danger-color)"
                : "var(--primary-color)"
            };
            color: white;
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

    // Add animation keyframes
    if (!document.querySelector("#notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideInRight 0.3s ease reverse";
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the Todo App when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TodoApp();
});
