document.addEventListener("DOMContentLoaded", () => {
      // Références aux éléments
      const loginForm = document.querySelector('.login-form');
      const signupForm = document.querySelector('.signup-form');
      const showSignupBtn = document.getElementById('show-signup');
      const showLoginBtn = document.getElementById('show-login');
      
      // Boutons de bascule
      showSignupBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
      });
      
      showLoginBtn.addEventListener('click', () => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
      });
      
      // Gestion connexion
      document.getElementById('login-btn').addEventListener('click', handleLogin);
      
      // Gestion inscription
      document.getElementById('signup-btn').addEventListener('click', handleSignup);
      
      // Fonction de connexion existante
      async function handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const messageEl = document.getElementById('login-message');

        messageEl.style.display = 'none';
        messageEl.className = 'message';

        if (!username || !password) {
            showNotification("Veuillez remplir tous les champs", 'error');
        return;
    }

        const btn = document.getElementById('login-btn');
        btn.textContent = 'Connexion...';
        btn.disabled = true;

        try {
          const response = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'login',
              username, 
              password 
            })
          });

          const result = await response.json();

          if (result.error) {
      showNotification(result.error, 'error');
    } else {
      showNotification(`Bienvenue ${username}!`, 'success');
            sessionStorage.setItem('user_id', result.user_id);
            
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 1500);
          }
        } catch (error) {
      showNotification('Erreur de connexion', 'error');
      console.error('Login error:', error);
    } finally {
          btn.textContent = 'Se connecter';
          btn.disabled = false;
        }
      }
      
      // Nouvelle fonction d'inscription
      async function handleSignup() {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const solde = parseFloat(document.getElementById('signup-solde').value);
    const messageEl = document.getElementById('signup-message');

    messageEl.style.display = 'none';
    messageEl.className = 'message';

    if (!username || !password) {
      showNotification("Veuillez remplir tous les champs", 'error');
      return;
    }
    
    if (isNaN(solde) || solde < 0) {
      showNotification("Solde initial invalide", 'error');
      return;
    }

    const btn = document.getElementById('signup-btn');
    btn.textContent = 'Création...';
    btn.disabled = true;

    try {
      const response = await fetch('api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'signup',
          username, 
          password,
          start_solde: solde
        })
      });

      const result = await response.json();

      if (result.error) {
        showNotification(result.error, 'error');
      } else {
        showNotification(`Compte créé avec succès! Bienvenue ${username}`, 'success');
        sessionStorage.setItem('user_id', result.user_id);
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      }
    } catch (error) {
      showNotification("Erreur lors de la création du compte", 'error');
      console.error('Signup error:', error);
    } finally {
      btn.textContent = 'Créer mon compte';
      btn.disabled = false;
    }
}
      
      // Fonction utilitaire pour afficher les messages
      function showMessage(element, text, type) {
        element.textContent = text;
        element.className = `message ${type}`;
        element.style.display = 'block';
      }
      
      // Gestion de la touche Enter
      document.getElementById('login-username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
      });
      
      document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
      });
      
      document.getElementById('signup-username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSignup();
      });
      
      document.getElementById('signup-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSignup();
      });
      
      document.getElementById('signup-solde').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSignup();
      });
    });

    // Fonction utilitaire pour afficher les notifications animées
function showNotification(text, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = text;
  document.body.appendChild(notification);

  // Animation d'apparition
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Disparaît après 3 secondes
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}