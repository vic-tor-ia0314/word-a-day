async function fetchRandomWord() {
  // Get a random Wiktionary page
  const randomRes = await fetch(
    "https://en.wiktionary.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*"
  );
  const randomData = await randomRes.json();
  const word = randomData.query.random[0].title;

  // Fetch its wikitext
  const pageRes = await fetch(
    `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(
      word
    )}&prop=wikitext&format=json&origin=*`
  );
  const pageData = await pageRes.json();
  const text = pageData.parse?.wikitext["*"];

  if (!text) throw new Error("No content");

  // Split into language sections
  const sections = text.split(/^==([^=]+)==$/m).slice(1);
  const entries = [];

  for (let i = 0; i < sections.length; i += 2) {
    const language = sections[i].trim();
    const content = sections[i + 1];

    const meaningMatch = content.match(/^#\s+([^\n]+)/m);
    if (!meaningMatch) continue;

    const pronunciationMatch = content.match(/\/[^\/]+\//);
    const etymologyMatch = content.match(
      /===Etymology===([\s\S]*?)(?===|$)/
    );

    entries.push({
      word,
      language,
      meaning: meaningMatch[1],
      pronunciation: pronunciationMatch ? pronunciationMatch[0] : "",
      etymology: etymologyMatch
        ? etymologyMatch[1].trim().slice(0, 300) + "…"
        : ""
    });
  }

  if (entries.length === 0) {
    return fetchRandomWord(); // retry
  }

  return entries[Math.floor(Math.random() * entries.length)];
}

function displayWord(data) {
  document.getElementById("language").textContent = data.language;
  document.getElementById("word").textContent = data.word;
  document.getElementById("pronunciation").textContent = data.pronunciation;
  document.getElementById("meaning").textContent = data.meaning;
  document.getElementById("etymology").textContent = data.etymology;
}

async function loadWord() {
  try {
    document.getElementById("word").textContent = "Loading…";
    document.getElementById("meaning").textContent = "";

    const data = await fetchRandomWord();
    displayWord(data);
  } catch (err) {
    document.getElementById("meaning").textContent =
      "Could not load a word. Try again.";
    console.error(err);
  }
}

document.getElementById("new-word").addEventListener("click", loadWord);

loadWord();
