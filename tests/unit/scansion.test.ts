import { isEncliticDactyl, Quantity } from '../../src/scansion';
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

test("enclitic dactylic hexameter is parsed correctly by isEncliticDactyl", () => {
  const dactyl = [Quantity.long, Quantity.short, Quantity.short];
  const spondee = [Quantity.long, Quantity.long];
  const trochee = [Quantity.long, Quantity.short];

  let pattern = [dactyl, dactyl, dactyl, dactyl, dactyl, spondee].flat();
  expect(isEncliticDactyl(pattern, 6)).toBeTruthy();

  pattern = [dactyl, dactyl, dactyl, dactyl, dactyl, trochee].flat();
  expect(isEncliticDactyl(pattern, 6)).toBeTruthy();

  pattern = [dactyl, dactyl, dactyl, dactyl, trochee].flat();
  expect(isEncliticDactyl(pattern, 6)).toBeFalsy();

  pattern = [dactyl, spondee, dactyl, spondee, dactyl, spondee].flat();
  expect(isEncliticDactyl(pattern, 6)).toBeTruthy();

  pattern = [dactyl, spondee, spondee, spondee, spondee, spondee].flat();
  expect(isEncliticDactyl(pattern, 6)).toBeTruthy();

  pattern = [spondee, spondee, spondee, spondee, spondee].flat();
  expect(isEncliticDactyl(pattern, 6)).toBeFalsy();

  pattern = [dactyl, spondee].flat();
  expect(isEncliticDactyl(pattern, 2)).toBeTruthy();

  pattern = [dactyl, spondee].flat();
  expect(isEncliticDactyl(pattern, 2, 0)).toBeTruthy();

  pattern = [spondee, spondee].flat();
  expect(isEncliticDactyl(pattern, 2, 0)).toBeFalsy();
});
