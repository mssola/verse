import { syllabify, WordPosition } from '../../src/syllable';

// This file tests the `syllabify` function with a table. Hence the `Table` type
// and the `words` array.

interface Table {
  value: string,
  expected: Array<string>,
}

// Returns the given string without tremas.
function stripTrema(c: string): string {
  // NOTE: the implementation on this is rather dumb and it is certaintly not
  // the most efficient solution, but for the strings we will deal here, it's
  // good enough.
  return c
    .replace(/ä/gi, 'a')
    .replace(/ë/gi, 'e')
    .replace(/ï/gi, 'i')
    .replace(/ö/gi, 'o')
    .replace(/ü/gi, 'u')
}

const words: Array<Table> = [
  { value: 'amīcus', expected: ['a', 'mī', 'cus'] },
  { value: 'moenia', expected: ['moe', 'ni', 'a'] },
  { value: 'est', expected: ['est'] },
  { value: 'arma', expected: ['ar', 'ma'] },
  { value: 'ARMA', expected: ['AR', 'MA'] },
  { value: 'VIRVMQVE', expected: ['VI', 'RVM', 'QVE'] },
  { value: 'puella', expected: ['pu', 'el', 'la'] },
  { value: 'conderet', expected: ['con', 'de', 'ret'] },
  { value: 'causās', expected: ['cau', 'sās'] },
  { value: 'descenderet', expected: ['des', 'cen', 'de', 'ret'] },
  { value: 'dextra', expected: ['dex', 'tra'] },
  { value: 'captus', expected: ['cap', 'tus'] },
  { value: 'villa', expected: ['vil', 'la'] },
  { value: 'stāre', expected: ['stā', 're'] },
  { value: 'spuere', expected: ['spu', 'e', 're'] },
  { value: 'dīxit', expected: ['dī', 'xit'] },
  { value: 'sanguis', expected: ['san', 'guis'] },
  { value: 'alacris', expected: ['a', 'la', 'cris'] },
  { value: 'abeō', expected: ['a', 'be', 'ō'] },
  { value: 'peragō', expected: ['pe', 'ra', 'gō'] },
  { value: 'iam', expected: ['iam'] },
  { value: 'iaciō', expected: ['ia', 'ci', 'ō'] },
  { value: 'uēnī', expected: ['uē', 'nī'] },
  { value: 'pluuiālibus', expected: ['plu', 'ui', 'ā', 'li', 'bus'] },
  { value: 'quaerō', expected: ['quae', 'rō'] },
  { value: 'quoque', expected: ['quo', 'que'] },
  { value: 'āēr', expected: ['ā', 'ēr'] },
  { value: 'īnstruō', expected: ['īns', 'tru', 'ō'] },
  { value: 'aciē', expected: ['a', 'ci', 'ē'] },
  { value: 'monē', expected: ['mo', 'nē'] },
  { value: 'fīlius', expected: ['fī', 'li', 'us'] },
  { value: 'injūria', expected: ['in', 'jū', 'ri', 'a'] },
  { value: 'mittō', expected: ['mit', 'tō'] },
  { value: 'tollō', expected: ['tol', 'lō'] },
  { value: 'discernō', expected: ['dis', 'cer', 'nō'] },
  { value: 'duplex', expected: ['du', 'plex'] },
  { value: 'dīstō', expected: ['dīs', 'tō'] },
  { value: 'qvoqve', expected: ['qvo', 'qve'] },
  { value: 'Lāvīnjaque', expected: ['Lā', 'vī', 'nja', 'que'] },
  { value: 'oblīvīscor', expected: ['o', 'blī', 'vīs', 'cor'] },
  { value: 'obscūrus', expected: ['obs', 'cū', 'rus'] },
  { value: 'iūnctārum', expected: ['iūnc', 'tā', 'rum'] },
  { value: 'Cytherēa', expected: ['Cy', 'the', 'rē', 'a'] },
  { value: 'huic', expected: ['huic'] },
  { value: 'huius', expected: ['hu', 'ius'] },
  { value: 'cui', expected: ['cui'] },
  { value: 'alicui', expected: ['a', 'li', 'cui'] },
  { value: 'cuius', expected: ['cu', 'ius'] },
  { value: 'quī', expected: ['quī'] },
  { value: 'quīs', expected: ['quīs'] },
  { value: 'quibus', expected: ['qui', 'bus'] },
  { value: 'dēposuitque', expected: ['dē', 'po', 'su', 'it', 'que'] },
  { value: 'meüs', expected: ['me', 'us'] },
  { value: 'cuiquam', expected: ['cui', 'quam'] },
  { value: 'cuiusquam', expected: ['cu', 'ius', 'quam'] },
  { value: 'solvit', expected: ['sol', 'vit'] },

  // NOTE: this is actually ambiguous (another example being 'suādeō').
  // Sometimes authors have it in two syllables, other times in three. This is
  // something to be done.
  { value: 'suāuis', expected: ['su', 'ā', 'uis'] },
];

// Let's have one test per word. This might be a bit ugly, but at least we can
// tell when a change makes several tests to fail (otherwise it would stop at
// the first failure).
words.forEach((word) => {
  test(`properly syllabifies '${word.value}'`, () => {
    const res = syllabify(word.value);

    for (let i = 0; i < word.expected.length; i++) {
      // Test that the value is actually what we expect
      expect(res[i].value).toStrictEqual(word.expected[i]);

      // Test that the begin/end couple match the value.
      const val = stripTrema(word.value);
      expect(val.substring(res[i].begin, res[i].end)).toStrictEqual(word.expected[i]);

      // Make sure that the position is set accordingly.
      if (i === 0) {
        expect(res[i].position & WordPosition.Start).toStrictEqual(WordPosition.Start);
      } else if (i === (word.expected.length - 1)) {
        expect(res[i].position & WordPosition.End).toStrictEqual(WordPosition.End);
      } else {
        expect(res[i].position & WordPosition.None).toStrictEqual(WordPosition.None);
      }
    }
  });
});
