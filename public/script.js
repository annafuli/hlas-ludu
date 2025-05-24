// Premenné pre počítanie hlasov a zvuky
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
    sounds[name].currentTime = 0;
    sounds[name].play().catch(e => console.warn("Nepodarilo sa prehrať zvuk:", e));
  }
}

function getLeader() {
  const entries = Object.entries(votes);
  const maxVotes = Math.max(...entries.map(([, v]) => v));
  const leaders = entries.filter(([, v]) => v === maxVotes).map(([k]) => k);
  if (maxVotes === 0) return 'Zatiaľ nikto nehlasoval.';
  return leaders.length === 1 ? `Vedie: ${leaders[0]}` : `Je to remíza medzi: ${leaders.join(', ')}`;
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
        label: 'Počet hlasov',
        data: Object.values(votes),
        backgroundColor: ['#007bff', '#ffc107', '#28a745'],
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 16 },
          formatter: (value, context) => {
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
            return `${percent}%`;
          }
        },
        legend: { position: 'top' }
      }
    },
    plugins: [ChartDataLabels]
  });
}

window.vote = function(person) {
  console.log("Hlasujem za:", person);

  if (!votingEnabled || !votes.hasOwnProperty(person)) {
    console.warn("Hlasovanie zakázané alebo neplatný kandidát.");
    return;
  }

  votes[person]++;

  fetch('/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person })
  }).then(res => res.json())
    .then(data => {
      console.log("Odozva servera:", data);
    })
    .catch(err => {
      console.error("Chyba pri posielaní hlasu:", err);
    });

  document.getElementById(`votes${person}`).textContent = votes[person];
  playSound(person);

  const imgEl = document.querySelector(`img[alt='${person}']`);
  if (imgEl) {
    imgEl.classList.remove('animate');
    void imgEl.offsetWidth;
    imgEl.classList.add('animate');
    imgEl.classList.add("flash");
    setTimeout(() => imgEl.classList.remove("flash"), 100);
  }

  updateWinner();
  updateChart();
}

function addComment() {
  const nameInput = document.getElementById("nameInput");
  const commentInput = document.getElementById("commentInput");
  const name = nameInput.value.trim();
  const commentText = commentInput.value.trim();
  if (commentText === "") return;

  const now = new Date();
  const comment = {
    text: commentText,
    author: name || "Anonym",
    timestamp: now.toLocaleString()
  };

  const commentDiv = document.createElement("div");
  commentDiv.className = "comment";
  commentDiv.innerHTML = `<strong>${comment.author}</strong> (${comment.timestamp})<br>${comment.text}`;
  document.getElementById("commentList").prepend(commentDiv);

  fetch('/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment)
  });

  nameInput.value = "";
  commentInput.value = "";
}

function startCountdown() {
  let remainingTime = 10;
  const countdownElement = document.getElementById("countdown");

  const countdownInterval = setInterval(() => {
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      votingEnabled = false;
      countdownElement.textContent = "⏰ Hlasovanie je ukončené!";
      countdownElement.style.color = "gray";
      countdownElement.classList.remove("pulse", "danger", "warning");
      document.querySelectorAll(".vote-button").forEach(btn => btn.disabled = true);
      showFireworks();
    } else {
      countdownElement.textContent = `Hlasovanie končí za: 0:${remainingTime < 10 ? '0' : ''}${remainingTime}`;
      
      // Animácia farby
      if (remainingTime <= 3) {
        countdownElement.classList.add("danger");
        countdownElement.classList.add("shake");
      } else if (remainingTime <= 6) {
        countdownElement.classList.add("warning");
      }

      countdownElement.classList.add("pulse");

      // Vymaž triedy na ďalší krok
      setTimeout(() => {
        countdownElement.classList.remove("pulse", "shake");
      }, 500);

      remainingTime--;
    }
  }, 1000);
}

window.addEventListener("DOMContentLoaded", () => {
  fetch('/data')
    .then(res => res.json())
    .then(data => {
      votes = data.votes || { James: 0, MrBean: 0, Vaso: 0 };
      const comments = data.comments || [];

      for (const person in votes) {
        const el = document.getElementById(`votes${person}`);
        if (el) el.textContent = votes[person];
      }

      const commentList = document.getElementById("commentList");
      commentList.innerHTML = '';
      comments.forEach(comment => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `<strong>${comment.author}</strong> (${comment.timestamp})<br>${comment.text}`;
        commentList.appendChild(div);
      });

      updateWinner();
      createChart();
      startCountdown();

      votingEnabled = true;
    })
    
    .catch(err => {
      console.error("❌ Chyba pri načítaní dát zo servera:", err);
    });
});

function showFireworks() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: { x: Math.random(), y: Math.random() - 0.2 }
    }));
  }, 250);
}

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://spegolgmrhgmlqizxkmj.supabase.co'
const supabaseKey = 'tvoj_anon_key_sem' // nájdeš ho v Supabase > Project Settings > API
const supabase = createClient(supabaseUrl, supabaseKey)

const input = document.getElementById('commentInput')
const button = document.getElementById('submitComment')
const list = document.getElementById('commentList')

async function addComment(text) {
  const { error } = await supabase
    .from('comments')
    .insert([{ text }])
  if (error) console.error('Chyba pri ukladaní komentára:', error)
}

async function getComments() {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Chyba pri načítaní komentárov:', error)
    return []
  }
  return data
}
async function refreshComments() {
  const comments = await getComments()
  list.innerHTML = ''
  comments.forEach(c => {
    const li = document.createElement('li')
    li.textContent = c.text
    list.appendChild(li)
  })
}

button.addEventListener('click', async () => {
  const text = input.value.trim()
  if (text) {
    await addComment(text)
    input.value = ''
    refreshComments()
  }
})

refreshComments()
