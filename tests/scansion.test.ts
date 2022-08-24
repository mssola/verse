import { Quantity, scan } from '../src/scansion';

test("don't assume always long quantity on ellisions", () => {
  const syllables = scan("nūdāsse alicui").verses[0].syllables;
  const ary = [Quantity.long, Quantity.long, Quantity.short, Quantity.short, Quantity.long];

  expect(syllables.length).toStrictEqual(ary.length);

  for (let i = 0; i < syllables.length; i++) {
    expect(syllables[i].quantity).toStrictEqual(ary[i]);
  }
});

test("don't consider sneaky semivowel as long syllable always", () => {
  const tests = ['iuvat', 'ualet'];
  const ary = [Quantity.short, Quantity.long];

  for (const t of tests) {
    const syllables = scan(t).verses[0].syllables;

    expect(syllables.length).toStrictEqual(ary.length);

    for (let i = 0; i < syllables.length; i++) {
      expect(syllables[i].quantity).toStrictEqual(ary[i]);
    }
  }
})
