// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXC8XI_Q8jM5MrTpboorCMqti5Yn-B7gI",
  authDomain: "projeto-remediar.firebaseapp.com",
  databaseURL: "https://projeto-remediar-default-rtdb.firebaseio.com",
  projectId: "projeto-remediar",
  storageBucket: "projeto-remediar.appspot.com",
  messagingSenderId: "624372151070",
  appId: "1:624372151070:web:cfb199116b5d2c7dfb8f0f",
  measurementId: "G-3D989EEEQ1"
};

// Inicialização do Firebase
let auth, db;
try {
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebaseApp.auth();
  db = firebaseApp.database();
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
  alert("Erro ao conectar com o servidor");
}

// Variável para controle da edição
let currentEditId = null;

// Função para mostrar telas
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

// Atualiza a interface conforme o estado de login
function updateUI(user) {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginStatus = document.getElementById('login-status');
  const mainNav = document.getElementById('main-nav');

  if (user) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'inline-block';
    loginStatus.textContent = `Logado como: ${user.email}`;
    mainNav.style.display = 'block';
  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    loginStatus.textContent = '';
    mainNav.style.display = 'none';
    showScreen('login');
  }
}

// Monitora o estado de autenticação
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Usuário logado:", user.email);
    document.getElementById('user-email').textContent = `Bem-vindo(a), ${user.email}`;
    loadEvents(user.uid);
    showScreen('home');
  }
  updateUI(user);
});

// Configuração dos event listeners
function setupEventListeners() {
  // Navegação
  document.getElementById('login-btn').addEventListener('click', () => showScreen('login'));
  document.getElementById('register-btn').addEventListener('click', () => showScreen('register'));
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('home-btn').addEventListener('click', () => showScreen('home'));
  document.getElementById('schedule-btn').addEventListener('click', () => showScreen('schedule'));
  document.getElementById('history-btn').addEventListener('click', () => showScreen('history'));

  // Autenticação
  document.getElementById('login-submit').addEventListener('click', login);
  document.getElementById('register-submit').addEventListener('click', register);

  // Agendamentos
  document.getElementById('add-event-btn').addEventListener('click', addEvent);

  // Modal de edição
  document.getElementById('save-edit-btn').addEventListener('click', saveEdit);
  document.getElementById('cancel-edit-btn').addEventListener('click', closeModal);

  // Fecha modal ao clicar fora
  window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('edit-modal')) {
      closeModal();
    }
  });
}

// Função de login
function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errorElement = document.getElementById('login-error');

  if (!email || !password) {
    errorElement.textContent = "Por favor, preencha todos os campos.";
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
    })
    .catch(error => {
      let errorMessage = "Erro ao fazer login: ";
      switch (error.code) {
        case 'auth/user-not-found': errorMessage += "Usuário não encontrado."; break;
        case 'auth/wrong-password': errorMessage += "Senha incorreta."; break;
        case 'auth/invalid-email': errorMessage += "E-mail inválido."; break;
        default: errorMessage += error.message;
      }
      errorElement.textContent = errorMessage;
    });
}

// Função de cadastro
function register() {
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const errorElement = document.getElementById('register-error');

  if (!email || !password) {
    errorElement.textContent = "Por favor, preencha todos os campos.";
    return;
  }

  if (password.length < 6) {
    errorElement.textContent = "A senha deve ter pelo menos 6 caracteres.";
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('register-email').value = '';
      document.getElementById('register-password').value = '';
      showScreen('login');
    })
    .catch(error => {
      let errorMessage = "Erro ao cadastrar: ";
      switch (error.code) {
        case 'auth/email-already-in-use': errorMessage += "E-mail já em uso."; break;
        case 'auth/invalid-email': errorMessage += "E-mail inválido."; break;
        case 'auth/weak-password': errorMessage += "Senha muito fraca."; break;
        default: errorMessage += error.message;
      }
      errorElement.textContent = errorMessage;
    });
}

// Função de logout
function logout() {
  auth.signOut().catch(error => {
    alert("Erro ao sair: " + error.message);
  });
}

// Adiciona um novo evento
function addEvent() {
  const user = auth.currentUser;
  const errorElement = document.getElementById('event-error');
  
  if (!user) {
    errorElement.textContent = "Você precisa estar logado.";
    showScreen('login');
    return;
  }

  const type = document.getElementById("event-type").value;
  const title = document.getElementById("event-title").value.trim();
  const date = document.getElementById("event-date").value;
  const time = document.getElementById("event-time").value;

  if (!title || !date || !time) {
    errorElement.textContent = "Por favor, preencha todos os campos.";
    return;
  }

  const event = { type, title, date, time };

  db.ref(`users/${user.uid}/events`).push(event)
    .then(() => {
      document.getElementById("event-title").value = "";
      document.getElementById("event-date").value = "";
      document.getElementById("event-time").value = "";
      errorElement.textContent = "";
    })
    .catch(error => {
      errorElement.textContent = "Erro ao salvar: " + error.message;
    });
}

// Abre o modal de edição
function openEditModal(eventId, eventData) {
  currentEditId = eventId;
  document.getElementById('edit-type').value = eventData.type;
  document.getElementById('edit-title').value = eventData.title;
  document.getElementById('edit-date').value = eventData.date;
  document.getElementById('edit-time').value = eventData.time;
  document.getElementById('edit-error').textContent = '';
  document.getElementById('edit-modal').style.display = 'block';
}

// Fecha o modal
function closeModal() {
  document.getElementById('edit-modal').style.display = 'none';
  currentEditId = null;
}

// Salva as edições
function saveEdit() {
  const user = auth.currentUser;
  if (!user || !currentEditId) return;

  const type = document.getElementById("edit-type").value;
  const title = document.getElementById("edit-title").value.trim();
  const date = document.getElementById("edit-date").value;
  const time = document.getElementById("edit-time").value;
  const errorElement = document.getElementById('edit-error');

  if (!title || !date || !time) {
    errorElement.textContent = "Por favor, preencha todos os campos.";
    return;
  }

  const updatedEvent = { type, title, date, time };

  db.ref(`users/${user.uid}/events/${currentEditId}`).update(updatedEvent)
    .then(() => {
      closeModal();
      loadEvents(user.uid);
    })
    .catch(error => {
      errorElement.textContent = "Erro ao atualizar: " + error.message;
    });
}

// Exclui um evento
function deleteEvent(eventId) {
  if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
  
  const user = auth.currentUser;
  if (!user) return;

  db.ref(`users/${user.uid}/events/${eventId}`).remove()
    .then(() => {
      loadEvents(user.uid);
    })
    .catch(error => {
      alert("Erro ao excluir: " + error.message);
    });
}

// Carrega os eventos
function loadEvents(uid) {
  const todayList = document.getElementById('today-list');
  const historyList = document.getElementById('history-list');
  todayList.innerHTML = "";
  historyList.innerHTML = "";

  db.ref(`users/${uid}/events`).once("value")
    .then(snapshot => {
      if (!snapshot.exists()) {
        todayList.innerHTML = "<li>Nenhum evento agendado para hoje.</li>";
        historyList.innerHTML = "<li>Nenhum evento no histórico.</li>";
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let hasTodayEvents = false;
      let hasHistoryEvents = false;

      snapshot.forEach(child => {
        const ev = child.val();
        const eventId = child.key;
        const text = `${ev.date} ${ev.time} - ${ev.title} (${ev.type === "medicamento" ? "Lembrete" : "Compromisso"})`;

        const li = document.createElement('li');
        li.className = 'event-item';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'event-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Editar';
        editBtn.onclick = () => openEditModal(eventId, ev);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Excluir';
        deleteBtn.onclick = () => deleteEvent(eventId);
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        li.appendChild(textSpan);
        li.appendChild(actionsDiv);

        historyList.appendChild(li.cloneNode(true));
        hasHistoryEvents = true;

        if (ev.date === today) {
          todayList.appendChild(li);
          hasTodayEvents = true;
        }
      });

      if (!hasTodayEvents) {
        todayList.innerHTML = "<li>Nenhum evento agendado para hoje.</li>";
      }
      if (!hasHistoryEvents) {
        historyList.innerHTML = "<li>Nenhum evento no histórico.</li>";
      }
    })
    .catch(error => {
      console.error("Erro ao carregar eventos:", error);
      todayList.innerHTML = "<li>Erro ao carregar eventos.</li>";
      historyList.innerHTML = "<li>Erro ao carregar histórico.</li>";
    });
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  if (!auth.currentUser) {
    showScreen('login');
  }
});
