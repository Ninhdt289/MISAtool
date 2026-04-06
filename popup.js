// popup.js
document.getElementById('auth').addEventListener('click', () => {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (token) {
      alert('Authorized successfully!');
    } else {
      alert('Authorization failed.');
    }
  });
});