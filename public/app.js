// @ts-check
/**
 * Interface web : envoie le panier à l'API et affiche le ticket de caisse.
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
/** @type {HTMLButtonElement} */
const submitButton = byId('submit');

/**
 * Crée un élément avec un texte et, éventuellement, une classe CSS.
 * @param {string} tag
 * @param {string} text
 * @param {string} [className]
 */
function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** Affiche un seul des trois états du ticket : résultat, invitation ou erreur. */
function show(/** @type {'result' | 'placeholder' | 'error'} */ state) {
  for (const id of ['result', 'placeholder', 'error']) byId(id).hidden = id !== state;
}

/** @param {any} movie Film reconnu par l'API. */
function renderMovie(movie) {
  const item = element('li', movie.title);
  const isSaga = movie.kind === 'saga';
  item.append(
    element('span', isSaga ? `Volet ${movie.episode}` : 'Autre film', `badge ${movie.kind}`),
  );
  return item;
}

/** @param {any} result Réponse de `POST /api/quotes`. */
function renderResult(result) {
  const { saga, otherMovies } = result;
  byId('total').textContent = formatCents(result.totalCents);
  byId('movies').replaceChildren(...result.movies.map(renderMovie));
  byId('details').replaceChildren(
    element('dt', `Saga : ${saga.quantity} DVD, ${saga.distinctEpisodes} volet(s) différent(s)`),
    element('dd', formatCents(saga.subtotalCents)),
    element('dt', `Remise saga (${saga.discountPercent} %)`, 'discount'),
    element('dd', `−${formatCents(saga.discountCents)}`, 'discount'),
    element('dt', `Autres films : ${otherMovies.quantity} DVD`),
    element('dd', formatCents(otherMovies.totalCents)),
    element('dt', 'Total', 'total'),
    element('dd', formatCents(result.totalCents), 'total'),
  );
  show('result');
}

/** @param {string} message */
function renderError(message) {
  byId('error').textContent = message;
  show('error');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  try {
    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cartInput.value }),
    });
    const body = await response.json();
    if (response.ok) {
      renderResult(body);
    } else {
      renderError(`Le panier n'a pas pu être chiffré : ${body.error ?? response.statusText}`);
    }
  } catch {
    renderError('Le serveur est injoignable. Veuillez réessayer.');
  } finally {
    submitButton.disabled = false;
  }
});

for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => {
    const key = /** @type {keyof typeof EXAMPLES} */ (Number(button.getAttribute('data-example')));
    cartInput.value = EXAMPLES[key].join('\n');
    form.requestSubmit();
  });
}

// Chiffre dès l'ouverture le panier pré-rempli : l'utilisateur voit immédiatement un ticket.
form.requestSubmit();
