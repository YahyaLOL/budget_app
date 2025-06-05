document.getElementById('login-btn').addEventListener('click', handleLogin);

async function handleLogin() {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const messageEl = document.getElementById('message');

  // Réinitialiser le message
  messageEl.style.display = 'none';
  messageEl.className = 'message';

  if (!username || !password) {
    showMessage("Veuillez entrer le nom d'utilisateur et le mot de passe", 'error');
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Connexion...';
  btn.disabled = true;

  try {
    const response = await fetch('api/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (result.error) {
      showMessage(result.error, 'error');
    } else {
      showMessage(`Bienvenue ${username}! Votre solde actuel est ${result.solde.toFixed(2)} €`, 'success');

      // ✅ Stocker l'ID utilisateur pour l'utiliser dans dashboard.html
      sessionStorage.setItem('user_id', result.user_id);

      usernameInput.value = '';
      passwordInput.value = '';
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    }
  } catch (error) {
    showMessage('Erreur de connexion. Veuillez réessayer.', 'error');
    console.error('Login error:', error);
  } finally {
    btn.textContent = 'Se connecter';
    btn.disabled = false;
  }
}

function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
}

// Entrée clavier "Enter"
document.getElementById('username').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});

// Afficher le message de bienvenue si l'utilisateur est déjà connecté
document.addEventListener('DOMContentLoaded', () => {
  const messageEl = document.getElementById('message');
  const username = localStorage.getItem('username');
  if (username) {
    messageEl.textContent = `Bienvenue ${username}!`;
    messageEl.className = 'message success';
    messageEl.style.display = 'block';
  }
});
