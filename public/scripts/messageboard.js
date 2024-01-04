const loginButton = document.getElementById('toggle-login-button');
const loginForm = document.getElementById('login-form');

function toggleForm() {
  loginButton.style.display = 'none';
  loginForm.style.display = 'flex';
}

loginButton.addEventListener('click', toggleForm);
