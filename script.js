const MAX_ATTEMPTS = 10;

async function getRandomWord() {
  const res = await fetch('https://random-word-api.herokuapp.com/word?number=1');
  const data = await res.json();
  return data[0];
}

async function getDefinition(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const entry = data[0];
    const meaning = entry.meanings[0];
    return {
      partOfSpeech: meaning.partOfSpeech,
      definition: meaning.definitions[0].definition
    };
  } catch {
    return null;
  }
}

async function loadWord(attempt = 0) {
  document.getElementById('word').textContent = 'Loading...';
  document.getElementById('pos').textContent = '';
  document.getElementById('definition').textContent = '';

  if (attempt >= MAX_ATTEMPTS) {
    document.getElementById('word').textContent = 'Error';
    document.getElementById('definition').textContent = 'Could not find a valid word.';
    return;
  }

  try {
    const word = await getRandomWord();
    const def = await getDefinition(word);

    if (!def) {
      loadWord(attempt + 1);
      return;
    }

    document.getElementById('word').textContent = word;
    document.getElementById('pos').textContent = def.partOfSpeech;
    document.getElementById('definition').textContent = def.definition;
  } catch {
    loadWord(attempt + 1);
  }
}

document.getElementById('new-word').addEventListener('click', () => loadWord(0));

loadWord(0); // Load first word on page load
