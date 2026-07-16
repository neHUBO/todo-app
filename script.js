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
const auth = firebase.auth();
const database = firebase.database();

const loginBox = document.getElementById('loginBox');
const appBox = document.getElementById('appBox');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const roleGreeting = document.getElementById('roleGreeting');
const managerView = document.getElementById('managerView');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', function() {
    auth.signOut();
});
const employeeView = document.getElementById('employeeView');
const employeeSelect = document.getElementById('employeeSelect');
const managerTaskList = document.getElementById('managerTaskList');

let currentUserId = null;

loginBtn.addEventListener('click', function() {
    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .catch(function(error) {
            loginError.textContent = 'Неверный email или пароль';
        });
});

auth.onAuthStateChanged(function(user) {
    if (user) {
        loginBox.style.display = 'none';
        appBox.style.display = 'block';
        currentUserId = user.uid;

        database.ref('users/' + user.uid).once('value').then(function(snapshot) {
            const userData = snapshot.val();
            if (!userData) {
                roleGreeting.textContent = 'Роль не найдена для этого пользователя';
                return;
            }

            roleGreeting.textContent = 'Здравствуйте, ' + userData.name + ' (' + userData.role + ')';

            if (userData.role === 'manager') {
                managerView.style.display = 'block';
                employeeView.style.display = 'none';
                loadEmployeesList();
                loadManagerTasks();
            } else {
                managerView.style.display = 'none';
                employeeView.style.display = 'block';
                loadEmployeeTasks();
            }
        });
    } else {
        loginBox.style.display = 'block';
        appBox.style.display = 'none';
    }
});

function loadEmployeesList() {
    database.ref('users').once('value').then(function(snapshot) {
        const users = snapshot.val();
        employeeSelect.innerHTML = '';
        for (const uid in users) {
            if (users[uid].role === 'employee') {
                const option = document.createElement('option');
                option.value = uid;
                option.textContent = users[uid].name;
                employeeSelect.appendChild(option);
            }
        }
    });
}

document.getElementById('addBtn').addEventListener('click', function() {
    const text = document.getElementById('taskInput').value.trim();
    const dueDate = document.getElementById('dateInput').value;
    const assignedTo = employeeSelect.value;

    if (text === '' || !assignedTo) {
        return;
    }

    database.ref('tasks').push({
        text: text,
        dueDate: dueDate,
        assignedTo: assignedTo,
        createdBy: currentUserId,
        done: false
    });

    document.getElementById('taskInput').value = '';
    document.getElementById('dateInput').value = '';
});

function loadManagerTasks() {
    database.ref('tasks').on('value', function(snapshot) {
        const tasks = snapshot.val() || {};
        managerTaskList.innerHTML = '';

        database.ref('users').once('value').then(function(usersSnap) {
            const users = usersSnap.val() || {};

            for (const taskId in tasks) {
                const task = tasks[taskId];
                const employeeName = users[task.assignedTo] ? users[task.assignedTo].name : '???';
                const li = document.createElement('li');
                if (task.done) {
                    li.classList.add('done');
                }
                li.textContent = employeeName + ': ' + task.text + (task.dueDate ? ' (до ' + task.dueDate + ')' : '');
                managerTaskList.appendChild(li);
            }
        });
    });
}

function loadEmployeeTasks() {
    database.ref('tasks').on('value', function(snapshot) {
        const allTasks = snapshot.val() || {};
        const taskList = document.getElementById('taskList');
        const counter = document.getElementById('counter');
        taskList.innerHTML = '';

        let total = 0;
        let done = 0;

        for (const taskId in allTasks) {
            const task = allTasks[taskId];
            if (task.assignedTo !== currentUserId) {
                continue;
            }

            total++;
            if (task.done) done++;

            const li = document.createElement('li');
            if (task.done) {
                li.classList.add('done');
            }

            const span = document.createElement('span');
            span.textContent = task.text + (task.dueDate ? ' (до ' + task.dueDate + ')' : '');

            span.addEventListener('click', function() {
                database.ref('tasks/' + taskId + '/done').set(!task.done);
            });

            li.appendChild(span);
            taskList.appendChild(li);
        }

        counter.textContent = 'Выполнено: ' + done + ' из ' + total;
    });
}

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
