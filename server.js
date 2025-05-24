const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const votesFile = path.join(__dirname, 'votes.json');
const commentsFile = path.join(__dirname, 'comments.json');

// 📤 Odoslanie dát
app.get('/data', (req, res) => {
  const votes = fs.existsSync(votesFile)
    ? JSON.parse(fs.readFileSync(votesFile, 'utf-8'))
    : { James: 0, MrBean: 0, Vaso: 0 };

  const comments = fs.existsSync(commentsFile)
    ? JSON.parse(fs.readFileSync(commentsFile, 'utf-8'))
    : [];

  res.json({ votes, comments });
});

// 🗳️ Uloženie hlasu
app.post('/vote', (req, res) => {
  const { person } = req.body;

  const currentVotes = fs.existsSync(votesFile)
    ? JSON.parse(fs.readFileSync(votesFile, 'utf-8'))
    : { James: 0, MrBean: 0, Vaso: 0 };

  if (!person || !currentVotes.hasOwnProperty(person)) {
    return res.status(400).json({ error: 'Neplatný kandidát' });
  }

  currentVotes[person]++;
  fs.writeFileSync(votesFile, JSON.stringify(currentVotes, null, 2));
  res.json({ success: true });
});

// 💬 Komentáre
app.post('/comment', (req, res) => {
  const comment = req.body;

  const comments = fs.existsSync(commentsFile)
    ? JSON.parse(fs.readFileSync(commentsFile, 'utf-8'))
    : [];

  comments.unshift(comment); // pridaj na začiatok
  fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Server beží na http://localhost:${PORT}`);
});