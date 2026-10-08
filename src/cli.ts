/**
 * Interface en ligne de commande : lit un panier sur l'entrée standard
 * et affiche son prix en euros, au format des exemples de l'énoncé.
 *
 *   npm run cli --silent < examples/exemple-5.txt   # affiche 56
 */
import { text } from 'node:stream/consumers';
import { quoteCart } from './domain/pricing.js';
import { toEuros } from './domain/money.js';

const { quote } = quoteCart(await text(process.stdin));
process.stdout.write(`${String(toEuros(quote.total))}\n`);
