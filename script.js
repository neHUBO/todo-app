const firebaseConfig = {
    apiKey: "AIzaSyCRmrtvOg9uUNoB3ZACFNMLTH_unpDUP5k",
    authDomain: "nehubo.firebaseapp.com",
    databaseURL: "https://nehubo-default-rtdb.firebaseio.com",
    projectId: "nehubo",
    storageBucket: "nehubo.firebasestorage.app",
    messagingSenderId: "337424269841",
    appId: "1:337424269841:web:53272b90ed1a5e9acbe7b0"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const tasksRef = database.ref('tasks');

const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput');
const categorySelect = document.getElementById('categorySelect');
const filterSelect = document.getElementById('filterSelect');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const counter = document.getElementById('counter');

let tasks = [];

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

filterSelect.addEventListener('change', renderTasks);

tasksRef.on('value', function(snapshot) {
    const data = snapshot.val();
    tasks = data ? Object.values(data) : [];
    renderTasks();
});

function addTask() {
    const text = taskInput.value.trim();
    const category = categorySelect.value;
    const dueDate = dateInput.value;

    if (text === '') {
        return;
    }

    tasks.push({ text: text, category: category, dueDate: dueDate, done: false });
    taskInput.value = '';
    dateInput.value = '';

    saveTasks();
}

function saveTasks() {
    tasksRef.set(tasks);
}

function renderTasks() {
    taskList.innerHTML = '';

    const filter = filterSelect.value;
    const today = new Date().toISOString().split('T')[0];

    tasks.forEach(function(task, index) {
        if (filter !== 'Все' && task.category !== filter) {
            return;
        }

        const li = document.createElement('li');
        if (task.done) {
            li.classList.add('done');
        }

        const span = document.createElement('span');
        span.textContent = task.text;

        span.addEventListener('click', function() {
            tasks[index].done = !tasks[index].done;
            saveTasks();
        });

        const tag = document.createElement('span');
        tag.textContent = task.category;
        tag.className = 'category-tag';

        const dateTag = document.createElement('span');
        dateTag.className = 'date-tag';
        if (task.dueDate) {
            dateTag.textContent = 'до ' + task.dueDate;
            if (task.dueDate < today && !task.done) {
                dateTag.classList.add('overdue');
            }
        }

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Изменить';
        editBtn.className = 'edit-btn';

        editBtn.addEventListener('click', function() {
            startEdit(li, task, index);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.className = 'delete-btn';

        deleteBtn.addEventListener('click', function() {
            tasks.splice(index, 1);
            saveTasks();
        });

        li.appendChild(span);
        li.appendChild(tag);
        li.appendChild(dateTag);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });

    updateCounter();
}

function startEdit(li, task, index) {
    li.innerHTML = '';

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = task.text;
    editInput.className = 'edit-input';

    const editDate = document.createElement('input');
    editDate.type = 'date';
    editDate.value = task.dueDate || '';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Сохранить';
    saveBtn.className = 'save-btn';
    saveBtn.addEventListener('click', function() {
        const newText = editInput.value.trim();
        if (newText !== '') {
            tasks[index].text = newText;
        }
        tasks[index].dueDate = editDate.value;
        saveTasks();
    });

    editInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });

    li.appendChild(editInput);
    li.appendChild(editDate);
    li.appendChild(saveBtn);
    editInput.focus();
}

function updateCounter() {
    const total = tasks.length;
    const done = tasks.filter(function(t) { return t.done; }).length;
    counter.textContent = 'Выполнено: ' + done + ' из ' + total;
}

const exportBtn = document.getElementById('exportBtn');

exportBtn.addEventListener('click', function() {
    const data = tasks.map(function(task) {
        return {
            'Задача': task.text,
            'Категория': task.category,
            'Срок': task.dueDate || '—',
            'Статус': task.done ? 'Выполнено' : 'Не выполнено'
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Задачи');
    XLSX.writeFile(workbook, 'мои_задачи.xlsx');
});

const themeBtn = document.getElementById('themeBtn');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeBtn.textContent = '☀️ Светлая тема';
}

themeBtn.addEventListener('click', function() {
    document.body.classList.toggle('dark');

    if (document.body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        themeBtn.textContent = '☀️ Светлая тема';
    } else {
        localStorage.setItem('theme', 'light');
        themeBtn.textContent = '🌙 Тёмная тема';
    }
});
