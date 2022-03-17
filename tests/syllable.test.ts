import { syllabify } from '../src/syllable';

// This file tests the `syllabify` function with a table. Hence the `Table` type
// and the `words` array.

interface Table {
  value: string,
  expected: Array<string>,
};

const words: Array<Table> = [
  { value: 'amīcus', expected: ['a', 'mī', 'cus'] },
  { value: 'moenia', expected: ['moe', 'ni', 'a'] },
  { value: 'est', expected: ['est'] },
  { value: 'arma', expected: ['ar', 'ma'] },
  { value: 'ARMA', expected: ['AR', 'MA'] },
  //{ value: 'VIRVMQVE', expected: ['VI', 'RVM', 'QVE'] }, // TODO
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
  { value: 'abest', expected: ['ab', 'est'] },
  { value: 'peragō', expected: ['per', 'a', 'gō'] },
  { value: 'iam', expected: ['iam'] },
  { value: 'iaciō', expected: ['ia', 'ci', 'ō'] },
  { value: 'uēnī', expected: ['uē', 'nī'] },
  { value: 'pluuiālibus', expected: ['plu', 'ui', 'ā', 'li', 'bus'] },
  { value: 'quaerō', expected: ['quae', 'rō'] },
  { value: 'quoque', expected: ['quo', 'que'] },
  { value: 'āēr', expected: ['ā', 'ēr'] },
  { value: 'īnstruō', expected: ['īn', 'stru', 'ō'] },
  { value: 'aciē', expected: ['a', 'ci', 'ē'] },
  { value: 'monē', expected: ['mo', 'nē'] },
  { value: 'fīlius', expected: ['fī', 'li', 'us'] },
  { value: 'iniūria', expected: ['in', 'iū', 'ri', 'a'] },
  { value: 'mittō', expected: ['mit', 'tō'] },
  { value: 'tollō', expected: ['tol', 'lō'] },
  { value: 'discernō', expected: ['dis', 'cer', 'nō'] },
  { value: 'duplex', expected: ['du', 'plex'] },
  { value: 'dīstō', expected: ['dīs', 'tō'] },

  // TODO: test 'ob' and 'ab', which are both prefixes and whole words.
  // TODO: test explicit semivowel markings such as "Lā|vī|nja|que"
  // TODO: 'iūnctārum' should be 'iūnc|tā|rum'

  // TODO: this is actually ambiguous (another example being 'suādeō').
  // Sometimes authors have it in two syllables, other times in three. This is
  // something to be done.
  { value: 'suāuis', expected: ['su', 'ā', 'uis'] },
];

// Let's have one test per word. This might be a bit ugly, but at least we can
// tell when a change makes several tests to fail (otherwise it would stop at
// the first failure).
words.forEach((word) => {
  test(`properly syllabifies '${word.value}'`, () => {
    let res = syllabify(word.value);

    for (let i = 0; i < word.expected.length; i++) {
      expect(res[i].value).toStrictEqual(word.expected[i]);
      expect(word.value.substring(res[i].begin, res[i].end)).toStrictEqual(word.expected[i]);
    }
  });
});

// TODO: test also for position and other fields.
// TODO: test offset.
