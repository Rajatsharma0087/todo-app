// ===== DOM ELEMENTS =====
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');
const clearAllBtn = document.getElementById('clearAll');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Stats
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const completedTasksEl = document.getElementById('completedTasks');

// Modal
const editModal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const modalClose = document.getElementById('modalClose');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

// ===== STATE =====
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let editingTaskId = null;

// ===== INITIALIZE =====
function init() {
    loadTheme();
    renderTasks();
    updateStats();
}

// ===== THEME =====
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ===== ADD TASK =====
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskText = taskInput.value.trim();
    
    if (taskText === '') return;
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task); // Add to beginning
    saveTasks();
    renderTasks();
    updateStats();
    taskInput.value = '';
    taskInput.focus();
    
    showToast('Task added successfully!');
});

// ===== RENDER TASKS =====
function renderTasks() {
    taskList.innerHTML = '';
    
    const filteredTasks = filterTasks();
    
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    filteredTasks.forEach(task => {
        const taskItem = createTaskElement(task);
        taskList.appendChild(taskItem);
    });
}

// ===== CREATE TASK ELEMENT =====
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);
    
    li.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
            <i class="fas fa-check"></i>
        </div>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
            <button class="task-btn btn-edit" onclick="openEditModal(${task.id})" aria-label="Edit task">
                <i class="fas fa-pen"></i>
            </button>
            <button class="task-btn btn-delete" onclick="deleteTask(${task.id})" aria-label="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return li;
}

// ===== TOGGLE TASK =====
function toggleTask(id) {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    
    saveTasks();
    renderTasks();
    updateStats();
    
    const task = tasks.find(t => t.id === id);
    showToast(task.completed ? 'Task completed! 🎉' : 'Task marked as active');
}

// ===== DELETE TASK =====
function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
    
    showToast('Task deleted', 'error');
}

// ===== EDIT TASK =====
function openEditModal(id) {
    editingTaskId = id;
    const task = tasks.find(t => t.id === id);
    editInput.value = task.text;
    editModal.classList.add('active');
    editInput.focus();
}

function closeEditModal() {
    editModal.classList.remove('active');
    editingTaskId = null;
    editInput.value = '';
}

saveEdit.addEventListener('click', () => {
    const newText = editInput.value.trim();
    
    if (newText === '') {
        alert('Task cannot be empty!');
        return;
    }
    
    tasks = tasks.map(task =>
        task.id === editingTaskId ? { ...task, text: newText } : task
    );
    
    saveTasks();
    renderTasks();
    closeEditModal();
    showToast('Task updated successfully!');
});

modalClose.addEventListener('click', closeEditModal);
cancelEdit.addEventListener('click', closeEditModal);

// Close modal on outside click
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('active')) {
        closeEditModal();
    }
});

// ===== FILTER TASKS =====
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderTasks();
    });
});

function filterTasks() {
    switch(currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// ===== CLEAR TASKS =====
clearCompletedBtn.addEventListener('click', () => {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        showToast('No completed tasks to clear', 'error');
        return;
    }
    
    if (!confirm(`Delete ${completedCount} completed task(s)?`)) return;
    
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    updateStats();
    showToast(`${completedCount} task(s) cleared`);
});

clearAllBtn.addEventListener('click', () => {
    if (tasks.length === 0) {
        showToast('No tasks to clear', 'error');
        return;
    }
    
    if (!confirm('Delete ALL tasks? This cannot be undone!')) return;
    
    tasks = [];
    saveTasks();
    renderTasks();
    updateStats();
    showToast('All tasks cleared', 'error');
});

// ===== UPDATE STATS =====
function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    
    animateNumber(totalTasksEl, total);
    animateNumber(activeTasksEl, active);
    animateNumber(completedTasksEl, completed);
}

function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    const increment = target > current ? 1 : -1;
    const duration = 200;
    const steps = Math.abs(target - current);
    const stepDuration = duration / steps;
    
    let count = current;
    
    const timer = setInterval(() => {
        count += increment;
        element.textContent = count;
        
        if (count === target) {
            clearInterval(timer);
        }
    }, stepDuration);
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.style.background = '#e74c3c';
    } else {
        toast.style.background = '#2ecc71';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== LOCAL STORAGE =====
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        taskInput.focus();
    }
    
    // Ctrl/Cmd + Shift + D to toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        themeToggle.click();
    }
});

// ===== DRAG AND DROP (BONUS) =====
// Uncomment to enable drag and drop reordering
/*
let draggedElement = null;

taskList.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task-item')) {
        draggedElement = e.target;
        e.target.style.opacity = '0.5';
    }
});

taskList.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-item')) {
        e.target.style.opacity = '1';
    }
});

taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
});

taskList.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.target.classList.contains('task-item') && draggedElement !== e.target) {
        const allTasks = Array.from(taskList.children);
        const draggedIndex = allTasks.indexOf(draggedElement);
        const targetIndex = allTasks.indexOf(e.target);
        
        // Reorder tasks array
        const [removed] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, removed);
        
        saveTasks();
        renderTasks();
    }
});
*/

// ===== INITIALIZE APP =====
init();

console.log('🚀 TaskMaster initialized!');
console.log('💡 Keyboard shortcuts:');
console.log('   Ctrl/Cmd + K: Focus on input');
console.log('   Ctrl/Cmd + Shift + D: Toggle dark mode');