const axios = require('axios');

function initialize() {
  const serverUrl = process.env.SERVER_URL;
  const intervalMs = 5 * 60 * 1000;

  setTimeout(() => {
    pingServer(serverUrl);
  }, 10000);

  setInterval(() => {
    pingServer(serverUrl);
  }, intervalMs);
}

async function pingServer(url) {
  await axios.get(url, {
    timeout: 15000
  });
}

module.exports = { initialize };
