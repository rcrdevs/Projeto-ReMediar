// Verifica se o Firebase est� carregado corretamente
if (typeof firebase === 'undefined') {
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h1>Erro: Firebase n�o carregado.</h1><p>Recarregue a p�gina ou verifique sua conex�o.</p></div>';
  throw new Error('Firebase n�o foi carregado corretamente');
}

// Configura��o do Firebase
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

// Inicializa��o do Firebase
let auth, db;
try {
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebaseApp.auth();
  db = firebaseApp.database();
  console.log("Firebase inicializado com sucesso!");
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h1>Erro de conex�o</h1><p>N�o foi poss�vel conectar ao servidor. Tente novamente mais tarde.</p></div>';
}

// Atualiza a interface com o status de login
function updateUI(user) {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginStatus = document.getElementById('login-status');
  const mainNav = document.getElementById('main-nav');

  if (user) {
      // Usu�rio logado
      loginBtn.style.display = 'none';
      registerBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'inline-block';
      loginStatus.textContent = `Logado como: ${user.email}`;
      mainNav.style.display = 'block';
  } else {
      // Usu�rio n�o logado
      loginBtn.style.display = 'inline-block';
      registerBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      loginStatus.textContent = '';
      mainNav.style.display = 'none';
      showScreen('login'); // For�a a tela de login
  }
}

// Monitora o estado de autentica��o
auth.onAuthStateChanged(user => {
  if (user) {
      console.log("Usu�rio logado:", user.email);
      document.getElementById('user-email').textContent = `Bem-vindo(a), ${user.email}`;
      loadEvents(user.uid);
      showScreen('home');
      updateUI(user);
  } else {
      console.log("Nenhum usu�rio logado");
      updateUI(null);
  }
});

// Alterna entre as telas (com prote��o para p�ginas restritas)
function showScreen(id) {
  const user = auth.currentUser;
  const restrictedScreens = ['home', 'schedule', 'history'];
  
  // Bloqueia acesso a telas restritas se n�o estiver logado
  if (restrictedScreens.includes(id) && !user) {
      alert("Voc� precisa estar logado para acessar esta p�gina");
      return;
  }

  document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
  
  // Limpa mensagens de erro ao trocar de tela
  document.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
  });
}

// Fun��o de logout
function logout() {
  auth.signOut().then(() => {
      console.log("Usu�rio deslogado");
      updateUI(null);
  }).catch(error => {
      console.error("Erro ao fazer logout:", error);
      alert("Erro ao sair: " + error.message);
  });
}

// Cadastro de usu�rio
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
      .then((userCredential) => {
          console.log("Usu�rio cadastrado:", userCredential.user);
          showScreen('login');
          document.getElementById('register-email').value = '';
          document.getElementById('register-password').value = '';
      })
      .catch(error => {
          console.error("Erro no cadastro:", error);
          let errorMessage = "Erro ao cadastrar: ";
          switch (error.code) {
              case 'auth/email-already-in-use':
                  errorMessage += "Este e-mail j� est� em uso.";
                  break;
              case 'auth/invalid-email':
                  errorMessage += "E-mail inv�lido.";
                  break;
              case 'auth/weak-password':
                  errorMessage += "Senha muito fraca.";
                  break;
              default:
                  errorMessage += error.message;
          }
          errorElement.textContent = errorMessage;
      });
}

// Login de usu�rio
function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errorElement = document.getElementById('login-error');

  if (!email || !password) {
      errorElement.textContent = "Por favor, preencha todos os campos.";
      return;
  }

  auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {
          console.log("Login realizado:", userCredential.user.email);
          document.getElementById('login-email').value = '';
          document.getElementById('login-password').value = '';
          showScreen('home');
      })
      .catch(error => {
          console.error("Erro no login:", error);
          let errorMessage = "Erro ao fazer login: ";
          switch (error.code) {
              case 'auth/user-not-found':
                  errorMessage += "Usu�rio n�o encontrado.";
                  break;
              case 'auth/wrong-password':
                  errorMessage += "Senha incorreta.";
                  break;
              case 'auth/invalid-email':
                  errorMessage += "E-mail inv�lido.";
                  break;
              default:
                  errorMessage += error.message;
          }
          errorElement.textContent = errorMessage;
      });
}

// Adiciona um evento ao banco
function addEvent() {
  const user = auth.currentUser;
  const errorElement = document.getElementById('event-error');
  
  if (!user) {
      errorElement.textContent = "Voc� precisa estar logado para adicionar eventos.";
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
          console.log("Evento salvo:", event);
          document.getElementById("event-title").value = "";
          document.getElementById("event-date").value = "";
          document.getElementById("event-time").value = "";
          errorElement.textContent = "";
          loadEvents(user.uid);
      })
      .catch(error => {
          console.error("Erro ao salvar evento:", error);
          errorElement.textContent = "Erro ao salvar o evento: " + error.message;
      });
}

// Carrega os eventos salvos do banco
function loadEvents(uid) {
  const todayList = document.getElementById('today-list');
  const historyList = document.getElementById('history-list');
  todayList.innerHTML = "";
  historyList.innerHTML = "";

  db.ref(`users/${uid}/events`).once("value")
      .then(snapshot => {
          if (!snapshot.exists()) {
              todayList.innerHTML = "<li>Nenhum evento agendado para hoje.</li>";
              historyList.innerHTML = "<li>Nenhum evento no hist�rico.</li>";
              return;
          }

          const today = new Date().toISOString().split('T')[0];
          let hasTodayEvents = false;
          let hasHistoryEvents = false;

          snapshot.forEach(child => {
              const ev = child.val();
              const text = `${ev.date} ${ev.time} - ${ev.title} (${ev.type === "medicamento" ? "Lembrete" : "Compromisso"})`;

              const li = document.createElement('li');
              li.textContent = text;

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
              historyList.innerHTML = "<li>Nenhum evento no hist�rico.</li>";
          }
      })
      .catch(error => {
          console.error("Erro ao carregar eventos:", error);
          todayList.innerHTML = "<li>Erro ao carregar eventos.</li>";
          historyList.innerHTML = "<li>Erro ao carregar hist�rico.</li>";
      });
}

// Inicializa a aplica��o mostrando a tela correta
function initApp() {
  const user = auth.currentUser;
  if (!user) {
      showScreen('login');
  }
}

// Inicia a aplica��o quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);