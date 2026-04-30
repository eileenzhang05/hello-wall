const grid = document.querySelector("#cards-grid");
const allowedThemes = [
  "halloween",
  "christmas",
  "summer",
  "y2k",
  "birthday",
  "spring",
  "ocean",
  "starlight"
];

function renderEmptyState(message) {
  const emptyCard = document.createElement("article");
  emptyCard.className = "card card--empty";
  emptyCard.innerHTML = `
    <p class="card-kicker">Hello Wall</p>
    <h2>Start the wall</h2>
    <p>${message}</p>
  `;
  grid.appendChild(emptyCard);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validateCard(card, fileName) {
  if (!card || typeof card !== "object") {
    throw new Error(`${fileName} is not a valid JSON object.`);
  }

  if (typeof card.title !== "string" || card.title.trim() === "") {
    throw new Error(`${fileName} is missing a valid "title".`);
  }

  if (typeof card.text !== "string" || card.text.trim() === "") {
    throw new Error(`${fileName} is missing a valid "text".`);
  }

  if (!allowedThemes.includes(card.theme)) {
    throw new Error(
      `${fileName} has an invalid theme. Use one of: ${allowedThemes.join(", ")}.`
    );
  }
}

function renderCards(cards) {
  if (cards.length === 0) {
    renderEmptyState(
      'Add a JSON file inside <code>cards/</code>, list it in <code>cards/index.json</code>, and reload this page.'
    );
    return;
  }

  for (const card of cards) {
    const article = document.createElement("article");
    article.className = `card theme-${card.theme}`;
    article.innerHTML = `
      <div class="card-scene" aria-hidden="true">
        <span class="corner-icon corner-icon--top"></span>
        <span class="corner-icon corner-icon--bottom"></span>
      </div>
      <div class="card-body">
        <p class="card-kicker">${escapeHtml(card.theme)}</p>
        <h2>${escapeHtml(card.title)}</h2>
        <p>${escapeHtml(card.text)}</p>
        <footer>${escapeHtml(card.fileName)}</footer>
      </div>
    `;
    grid.appendChild(article);
  }
}

async function loadCards() {
  const manifestResponse = await fetch("./cards/index.json", { cache: "no-store" });
  if (!manifestResponse.ok) {
    throw new Error("Could not load cards/index.json.");
  }

  const manifest = await manifestResponse.json();
  if (!Array.isArray(manifest)) {
    throw new Error("cards/index.json must be a JSON array of filenames.");
  }

  const cards = await Promise.all(
    manifest.map(async (fileName) => {
      if (typeof fileName !== "string" || !fileName.endsWith(".json")) {
        throw new Error("cards/index.json can only contain .json filenames.");
      }

      const response = await fetch(`./cards/${encodeURIComponent(fileName)}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Could not load card file: ${fileName}.`);
      }

      const card = await response.json();
      validateCard(card, fileName);

      return {
        ...card,
        title: card.title.trim(),
        text: card.text.trim(),
        fileName
      };
    })
  );

  renderCards(cards);
}

loadCards().catch((error) => {
  renderEmptyState(
    `${escapeHtml(error.message)} If you opened this page directly from your filesystem, use a simple static server or GitHub Pages so <code>fetch()</code> can load the card files.`
  );
});
