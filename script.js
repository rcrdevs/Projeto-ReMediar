// Configuração e Inicialização do Firebase
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

// Verifica se o Firebase está carregado
if (typeof firebase === 'undefined') {
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h1>Erro: Firebase não carregado.</h1><p>Recarregue a página ou verifique sua conexão.</p></div>';
  throw new Error('Firebase não foi carregado corretamente');
}

// Inicializa o Firebase
let auth, db;
try {
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebaseApp.auth();
  db = firebaseApp.database();
  console.log("Firebase inicializado com sucesso!");
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h1>Erro de conexão</h1><p>Não foi possível conectar ao servidor.</p></div>';
}

// Variáveis globais
let currentEditId = null;

// Função para atualizar a interface
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
    showScreen('home');
  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    loginStatus.textContent = '';
    mainNav.style.display = 'none';
    showScreen('login');
  }
}

// Monitora estado de autenticação
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Usuário logado:", user.email);
    document.getElementById('user-email').textContent = `Bem-vindo(a), ${user.email}`;
    loadEvents(user.uid);
    updateUI(user);
  } else {
    console.log("Nenhum usuário logado");
    updateUI(null);
  }
});

// Funções de navegação
function showScreen(id) {
  const user = auth.currentUser;
  const restrictedScreens = ['home', 'schedule', 'history'];
  
  if (restrictedScreens.includes(id) && !user) {
    alert("Você precisa estar logado para acessar esta página");
    return;
  }

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
  
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
  });
}

// Funções de autenticação
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
      showScreen('login');
      document.getElementById('register-email').value = '';
      document.getElementById('register-password').value = '';
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

function logout() {
  auth.signOut().catch(error => {
    alert("Erro ao sair: " + error.message);
  });
}

// Funções de agendamento
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

// Funções de edição/exclusão
function openEditModal(eventId, eventData) {
  currentEditId = eventId;
  document.getElementById('edit-type').value = eventData.type;
  document.getElementById('edit-title').value = eventData.title;
  document.getElementById('edit-date').value = eventData.date;
  document.getElementById('edit-time').value = eventData.time;
  document.getElementById('edit-error').textContent = '';
  document.getElementById('edit-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('edit-modal').style.display = 'none';
  currentEditId = null;
}

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
    })
    .catch(error => {
      errorElement.textContent = "Erro ao atualizar: " + error.message;
    });
}

function deleteEvent(eventId) {
  if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
  
  const user = auth.currentUser;
  if (!user) return;

  db.ref(`users/${user.uid}/events/${eventId}`).remove()
    .catch(error => {
      alert("Erro ao excluir: " + error.message);
    });
}

// Carrega eventos
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

      if (!hasTodayEvents) todayList.innerHTML = "<li>Nenhum evento hoje.</li>";
      if (!hasHistoryEvents) historyList.innerHTML = "<li>Nenhum histórico.</li>";
    })
    .catch(error => {
      todayList.innerHTML = "<li>Erro ao carregar.</li>";
      historyList.innerHTML = "<li>Erro ao carregar.</li>";
    });
}

// Fecha modal ao clicar fora
window.onclick = function(event) {
  if (event.target == document.getElementById('edit-modal')) {
    closeModal();
  }
};

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
  if (!auth.currentUser) {
    showScreen('login');
  }
});
