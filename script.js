const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function register() {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Cadastro realizado com sucesso!");
      showScreen('login');
    })
    .catch(error => alert("Erro: " + error.message));
}

function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      alert("Login realizado!");
      document.getElementById('user-email').textContent = `Bem-vindo(a), ${userCredential.user.email}`;
      showScreen('home');
      loadEvents(userCredential.user.uid);
    })
    .catch(error => alert("Erro: " + error.message));
}

function addEvent() {
  const user = auth.currentUser;
  if (!user) return alert("Você precisa estar logado.");

  const type = document.getElementById("event-type").value;
  const title = document.getElementById("event-title").value;
  const date = document.getElementById("event-date").value;
  const time = document.getElementById("event-time").value;

  if (!title || !date || !time) return alert("Preencha todos os campos!");

  const event = {
    type,
    title,
    date,
    time
  };

  db.ref("users/" + user.uid + "/events").push(event)
    .then(() => {
      alert("Evento adicionado!");
      loadEvents(user.uid);
    });
}

function loadEvents(uid) {
  const todayList = document.getElementById('today-list');
  const historyList = document.getElementById('history-list');
  todayList.innerHTML = "";
  historyList.innerHTML = "";

  db.ref("users/" + uid + "/events").once("value", snapshot => {
    snapshot.forEach(child => {
      const ev = child.val();
      const text = `${ev.date} ${ev.time} - ${ev.title} (${ev.type === "medicamento" ? "Lembrete" : "Compromisso"})`;

      const li = document.createElement('li');
      li.textContent = text;

      todayList.appendChild(li.cloneNode(true));
      historyList.appendChild(li);
    });
  });
}
