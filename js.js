const toggleButton = document.getElementById('dark-mode-toggle');
const body = document.body;

toggleButton.addEventListener('click', () => {
  body.classList.toggle('dark-mode');

  // Guarda la preferencia del usuario
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
});

// Aplica el tema guardado al cargar la página
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-mode');
}
