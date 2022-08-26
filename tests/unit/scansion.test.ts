import { Quantity } from '../../src/scansion';
import { testSyllableQuantity } from './helpers';

// Adonic pattern, used in some tests.
const adonic = [Quantity.long, Quantity.short, Quantity.short,
                Quantity.long, Quantity.long];

test("don't assume always long quantity on ellisions", () => {
  const pattern = [Quantity.long, Quantity.long, Quantity.short, Quantity.short, Quantity.long];

  testSyllableQuantity("nūdāsse alicui", pattern);
});

test("don't consider sneaky semivowel as long syllable always", () => {
  const tests = ['iuvat', 'ualet'];
  const ary = [Quantity.short, Quantity.long];

  for (const t of tests) {
    testSyllableQuantity(t, ary);
  }
})

test("ellision on consonant with word starting with 'h'", () => {
  testSyllableQuantity("lambit Hydaspēs", adonic);
});

test("double ellision works", () => {
  testSyllableQuantity("corpore in ūnō", adonic);
});
