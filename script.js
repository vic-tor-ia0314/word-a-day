// Reject definitions that indicate inflected / non-lemma forms
function isBadDefinition(def) {
  const badPatterns = [
    /^plural of /i,
    /^past tense of /i,
    /^past participle of /i,
    /^present participle of /i,
    /^inflection of /i,
    /^alternative form of /i,
    /^alternative spelling of /i,
    /^misspelling of /i,
    /^form of /i
  ];

  return badPatterns.some(pattern => pattern.test(def));
}

async function fetchRandomWord() {
  // 1. Get random Wiktionary page
  const randomRes = await fetch(
    "https://en.wiktionary.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*"
  );
  const randomData = await randomRes.json();
  const word = randomData.query.random[0].title;

  // 2. Fetch wikitext
  const pageRes = await fetch(
    `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(
      word
    )}&prop=wikitext&format=json&origin=*`
  );
  const pageData = await pageRes.json();
  const text = pageData.parse?.wikitext["*"];
  if (!text) throw new Error("No wikitext");

  // 3. Split into language sections
  const sections = text.split(/^==([^=]+)==$/m).slice(1);
  const validEntries = [];

  for (let i = 0; i < sections.length; i += 2) {
    const language = sections[i].trim();
    const content = sections[i + 1];

    // Get all definitions in this language section
    const definitionMatches = [...content.matchAll(/^#\s+([^\n]+)/gm)];
    if (definitionMatches.length === 0) continue;

    // Filter out inflected-form definitions
    const goodDefinitions = definitionMatches
      .map(m => m[1].trim())
      .filter(def => !isBadDefinition(def));

    if (goodDefinitions.length === 0) continue;

    const pronunciationMatch = content.match(/\/[^\/]+\//);
    const etymologyMatch = content.match(
      /===Etymology===([\s\S]*?)(?===|$)/
    );

    validEntries.push({
      word,
      language,
      meaning: goodDefinitions[0], // first real definition
      pronunciation: pronunciationMatch ? pronunciationMatch[0] : "",
      etymology: etymologyMatch
        ? etymologyMatch[1].trim().slice(0, 300) + "…"
        : ""
    });
  }

  // 4. Retry if nothing usable found
  if (validEntries.length === 0) {
    return fetchRandomWord();
  }

  return validEntries[Math.floor(Math.random() * validEntries.length)];
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
