import { Quantity, scan } from '../../src/scansion';

// Returns a string representing the given quantity.
function quantity(q: Quantity): string {
  switch(q) {
    case Quantity.long:
      return `long (${Quantity.long})`;
    case Quantity.short:
      return `short (${Quantity.short})`;
    default:
      return "unknown";
  }
}

// Scan the given `verse` and expect a pattern of `quantities` out of it.
export function testSyllableQuantity(verse: string, quantities: Array<Quantity>) {
  const syllables = scan(verse).verses[0].syllables;

  if (syllables.length !== quantities.length) {
    console.log(syllables)
    console.log(`Expecting ${quantities.length} syllables, got ${syllables.length}`);
  }
  expect(syllables.length).toStrictEqual(quantities.length);

  for (let i = 0; i < syllables.length; i++) {
    if (syllables[i].quantity !== quantities[i]) {
      const got = quantity(syllables[i].quantity);
      const expecting = quantity(quantities[i]);

      console.log(syllables)
      console.log(`[${i + 1}/${syllables.length}] Expecting: ${expecting} -- Got ${got}`)
    }
    expect(syllables[i].quantity).toStrictEqual(quantities[i]);
  }
}
