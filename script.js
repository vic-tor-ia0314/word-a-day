const MAX_ATTEMPTS = 10;

async function getRandomWord() {
  const res = await fetch(
    'https://random-word-api.herokuapp.com/word?number=1'
  );
  const data = await res.json();
  return data[0];
}

async function getDefinition(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    const data = await res.json();

    if (!Array.isArray(data)) return null;

    const entry = data[0];

    return {
      phonetic:
        entry.phonetic ||
        entry.phonetics?.[0]?.text ||
        '',
      origin: entry.origin || '',
      meanings: entry.meanings || []
    };
  } catch {
    return null;
  }
}

async function loadWord(attempt = 0) {
  document.getElementById('word').textContent = 'Loading...';
  document.getElementById('phonetic').textContent = '';
  document.getElementById('origin').textContent = '';
  document.getElementById('definitions').innerHTML = '';

  if (attempt >= MAX_ATTEMPTS) {
    document.getElementById('word').textContent = 'Error';
    document.getElementById('definitions').textContent =
      'Could not find a valid word.';
    return;
  }

  try {
    const word = await getRandomWord();
    const def = await getDefinition(word);

    if (!def || def.meanings.length === 0) {
      loadWord(attempt + 1);
      return;
    }

    document.getElementById('word').textContent = word;
    document.getElementById('phonetic').textContent =
      def.phonetic || '—';
    document.getElementById('origin').textContent =
      def.origin || 'Unknown. (Most words will not have a recorded etymology/origin.)';

    const definitionsDiv = document.getElementById('definitions');

    def.meanings.forEach(meaning => {
      const box = document.createElement('div');
      box.className = 'definition-box';

      const title = document.createElement('h3');
      title.textContent = meaning.partOfSpeech;
      box.appendChild(title);

      const list = document.createElement('ul');

      meaning.definitions.forEach(d => {
        const item = document.createElement('li');
        item.innerHTML = `
          ${d.definition}
          ${d.example ? `<em>“${d.example}”</em>` : ''}
        `;
        list.appendChild(item);
      });

      box.appendChild(list);
      definitionsDiv.appendChild(box);
    });
  } catch {
    loadWord(attempt + 1);
  }
}

document
  .getElementById('new-word')
  .addEventListener('click', () => loadWord(0));

loadWord(0);
