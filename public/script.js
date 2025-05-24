let votes = {
  James: 0,
  MrBean: 0,
  Vaso: 0
};

const clickSoundJames = new Audio("./James Arthur - A Thousand Years (Christina Perri Cover) (mp3cut.net).mp3");
const clickSoundMrBean = new Audio("./Voicy_Oh Thank You Thank You.mp3");
const clickSoundVaso = new Audio("./Ak nie si moja.mp3");

const sounds = {
  James: clickSoundJames,
  MrBean: clickSoundMrBean,
  Vaso: clickSoundVaso
};

let votingEnabled = false;
let votesChart;

function stopAllSounds() {
  Object.values(sounds).forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });
}

function playSound(name) {
  stopAllSounds();
  if (sounds[name]) {
    sounds[name].play().catch(err => console.warn("Chyba prehrávania:", err));
  }
}

function getLeader() {
  const entries = Object.entries(votes);
  const maxVotes = Math.max(...entries.map(([, v]) => v));
  const leaders = entries.filter(([, v]) => v === maxVotes).map(([k]) => k);
  if (maxVotes === 0) return 'Zatiaľ nikto nehlasoval.';
  return leaders.length === 1 ? `Vedie: ${leaders[0]}` : `Remíza medzi: ${leaders.join(', ')}`;
}

function updateWinner() {
  document.getElementById('winner').textContent = getLeader();
}

function updateChart() {
  if (!votesChart) return;
  votesChart.data.datasets[0].data = Object.values(votes);
  votesChart.update();
}

function createChart() {
  const ctx = document.getElementById('votesChart').getContext('2d');
  votesChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(votes),
      datasets: [{
        data: Object.values(votes),
        backgroundColor: ['#007bff', '#ffc107', '#28a745']
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 14 },
          formatter: (value, context) => {
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            return total ? `${((value / total) * 100).toFixed(1)}%` : "0%";
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

window.vote = function(person) {
  if (!votingEnabled || !votes.hasOwnProperty(person)) return;

  votes[person]++;
  document.getElementById(`votes${person}`).textContent = votes[person];
  playSound(person);

  fetch('/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person })
  }).catch(err => console.error("Chyba pri hlasovaní:", err));

  updateWinner();
  updateChart();
};

function addComment() {
  const nameInput = document.getElementById("nameInput");
  const commentInput = document.getElementById("commentInput");
  const name = nameInput.value.trim() || "Anonym";
  const text = commentInput.value.trim();
  if (!text) return;

  const comment = {
    author: name,
    text: text,
    timestamp: new Date().toLocaleString()
  };

  const div = document.createElement("div");
  div.className = "comment";
  div.innerHTML = `<strong>${comment.author}</strong> (${comment.timestamp})<br>${comment.text}`;
  document.getElementById("commentList").prepend(div);

  fetch('/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment)
  }).catch(err => console.error("Chyba pri komentári:", err));

  nameInput.value = "";
  commentInput.value = "";
}

function startCountdown() {
  let time = 60;
  const countdown = document.getElementById("countdown");
  const interval = setInterval(() => {
    if (time <= 0) {
      clearInterval(interval);
      countdown.textContent = "⏰ Hlasovanie ukončené!";
      votingEnabled = false;
      showFireworks();
      return;
    }
     const minutes = Math.floor(time / 60);
    const seconds = time % 60;
      countdown.textContent = `Hlasovanie končí za: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    time--;
  }, 1000);
}

function showFireworks() {
  const duration = 3000;
  const end = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  const interval = setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: { x: Math.random(), y: Math.random() - 0.2 }
    }));
  }, 250);
}

window.addEventListener("DOMContentLoaded", () => {
  fetch('/data')
    .then(res => res.json())
    .then(data => {
      votes = data.votes || votes;
      Object.entries(votes).forEach(([person, count]) => {
        const el = document.getElementById(`votes${person}`);
        if (el) el.textContent = count;
      });

      const list = document.getElementById("commentList");
      list.innerHTML = '';
      (data.comments || []).forEach(comment => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `<strong>${comment.author}</strong> (${comment.timestamp})<br>${comment.text}`;
        list.appendChild(div);
      });

      updateWinner();
      createChart();
      startCountdown();
      votingEnabled = true;
    })
    .catch(err => console.error("Chyba pri načítaní dát:", err));
});
