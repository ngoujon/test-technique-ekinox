// @ts-check
/**
 * Interface web minimaliste : envoie le panier à l'API et affiche le résultat.
 * Tout le calcul est fait côté serveur ; ce script ne fait que de l'affichage.
 * Le contenu dynamique est inséré via `textContent` (jamais `innerHTML`) pour
 * empêcher toute injection de HTML (XSS) à partir des titres saisis.
 */

/** Exemples de l'énoncé, proposés en un clic. */
const EXAMPLES = {
  1: ['Back to the Future 1', 'Back to the Future 2', 'Back to the Future 3'],
  2: ['Back to the Future 1', 'Back to the Future 3'],
  3: ['Back to the Future 1'],
  4: [
    'Back to the Future 1',
    'Back to the Future 2',
    'Back to the Future 3',
    'Back to the Future 2',
  ],
  5: ['Back to the Future 1', 'Back to the Future 2', 'Back to the Future 3', 'La chèvre'],
};

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

/** @param {number} amountInCents */
const formatCents = (amountInCents) => euroFormatter.format(amountInCents / 100);

/**
 * @template {HTMLElement} T
 * @param {string} id
 * @returns {T}
 */
function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Élément #${id} introuvable`);
  return /** @type {T} */ (element);
}

const form = byId('cart-form');
/** @type {HTMLTextAreaElement} */
const cartInput = byId('cart');
const resultSection = byId('result');
const errorMessage = byId('error');

/**
 * @param {string} tag
 * @param {string} text
 */
function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

/** @param {any} result Réponse de `POST /api/quotes`. */
function renderResult(result) {
  byId('total').textContent = formatCents(result.totalCents);

  byId('movies').replaceChildren(
    ...result.movies.map((/** @type {any} */ movie) => {
      const label = movie.kind === 'saga' ? `saga, volet ${movie.episode}` : 'autre film';
      return element('li', `${movie.title} (${label})`);
    }),
  );

  const { saga, otherMovies } = result;
  byId('details').replaceChildren(
    element(
      'dt',
      `DVD de la saga (${saga.quantity}, dont ${saga.distinctEpisodes} volet(s) différent(s))`,
    ),
    element('dd', formatCents(saga.subtotalCents)),
    element('dt', `Remise saga (${saga.discountPercent} %)`),
    element('dd', `− ${formatCents(saga.discountCents)}`),
    element('dt', `Autres films (${otherMovies.quantity})`),
    element('dd', formatCents(otherMovies.totalCents)),
  );

  errorMessage.hidden = true;
  resultSection.hidden = false;
}

/** @param {string} message */
function renderError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  resultSection.hidden = true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cartInput.value }),
    });
    const body = await response.json();
    if (!response.ok) {
      renderError(`Le panier n'a pas pu être chiffré : ${body.error ?? response.statusText}`);
      return;
    }
    renderResult(body);
  } catch {
    renderError('Le serveur est injoignable. Veuillez réessayer.');
  }
});

for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => {
    const key = /** @type {keyof typeof EXAMPLES} */ (Number(button.getAttribute('data-example')));
    cartInput.value = EXAMPLES[key].join('\n');
    form.requestSubmit();
  });
}
