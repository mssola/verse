/* This file is part of verse.
 *
 * verse is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * verse is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with verse.  If not, see <https://www.gnu.org/licenses/>.
 */

// Specifies the word position for a given syllable.
export enum WordPosition {
    // Nothing special (i.e. it's in the middle of the word).
    None,

    // Start of the word.
    Start = 1 << 1,

    // End of the word.
    End = 1 << 2,

    // It has a dirty state and most probably needs to be skipped. This is used
    // when discarding a syllable for whatever reason (e.g. ellision on word
    // contact).
    Dirty = 1 << 3,

    // It's the result of merging two syllables together (e.g. ellision on word
    // contact).
    Merged = 1 << 4,
};

// Flags that might be assigned to a syllable for special quirks.
export enum Flag {
    // Nothing special.
    None,

    // Even though the syllable appears to start with a vowel, it's in fact a
    // semivowel and it should be treated as such.
    StartsWithSneakySemivowel = 1 << 1,
};

// Syllable contains a value which is the string that represents the syllable,
// and a number range of indices pointing at the beginning and the end of the
// syllable. Moreover, it also contains information on its word position and
// flags.
export interface Syllable {
    value: string,
    begin: number,
    end: number,
    position: WordPosition,
    flags: Flag
};

// Returns true if the given word contains a vowel at the given index, false
// otherwise.
export function isVowel(word: string, index: number, acceptSemivowel = false): boolean {
    switch (word.charAt(index).toLowerCase()) {
        case 'a': case 'ā': case 'ă':
        case 'e': case 'ē': case 'ĕ':
        case 'i': case 'ī': case 'ĭ':
        case 'o': case 'ō': case 'ŏ':
        case 'u': case 'ū': case 'ŭ':
        case 'y': case 'ȳ': case 'ў':
            return true;
        case 'j': case 'v':
            return acceptSemivowel;
        default:
            return false
    }
}

// Returns true if the given word contains a vowel belonging to a diphthong that
// was previously opened by another one (e.g. for 'aestās', this function will
// only return true if the index is 1). This function will also consider the
// special case of "qu-" and "gu" clusters, where the index is pointing to a
// vowel after "qu" and "gu".
function isDiphthong(word: string, index: number): boolean {
    let c = word.charAt(index).toLowerCase();

    switch (word.charAt(index - 1).toLowerCase()) {
        case 'a': case 'ă':
            return c === 'e' || c === 'u';
        case 'e': case 'ĕ':
            return c === 'i' || c === 'u';
        case 'o': case 'ŏ':
            return c === 'e';
        case 'u': case 'ŭ':
            // If the previous one was a 'u', take into account that it might be
            // a "qu-" or "gu-" cluster. Thus, we will account them as a
            // diphthong. Otherwise, we account for the regular 'ui' diphthong.
            let bf = word.charAt(index - 2).toLowerCase();
            if (bf === 'q' || bf == 'g') {
                return isVowel(word, index);
            }
            return c === 'i' || c === 'ĭ';
        default:
            return false;
    }
}

// Returns true of there is at least one vowel ahead of the given index.
function vowelAhead(word: string, index: number): boolean {
    for (let i = index; i < word.length; i++) {
        if (isVowel(word, i)) {
            return true;
        }
    }
    return false;
}

// Returns true if the given consonant is followed by a liquid consonant (i.e.
// 'l' or 'r'), forming a valid atomic cluster.
function liquidConsonant(word: string, index: number): boolean {
    let next = word.charAt(index + 1).toLowerCase();

    if (next === '' || (next !== 'l' && next !== 'r')) {
        return false;
    }

    switch (word.charAt(index).toLowerCase()) {
        case 'b': case 'c': case 'd':
        case 'f': case 'g': case 'k':
        case 'p': case 't': case 'z':
            return true;
        default:
            return false;
    }
}

// Returns a number that points to the position of the word that does not
// include a valid prefix. Thus, if the word does not contain a "troublesome"
// prefix, it will just return 0.
function prefixIndex(word: string): number {
    let prefixes = [
        'ab', 'abs', 'ad', 'con', 'dis', 'in', 'ob',
        'per', 'post', 'red', 'sub', 'trans'
    ]

    for (let prefix of prefixes) {
        if (word.toLowerCase().startsWith(prefix)) {
            return prefix.length;
        }
    }
    return 0;
}

// Returns true if the vowel pointed by the given index belongs to a syllable
// starting with a semivowel that was written with "i" or "u" instead of "j" or
// "v". In order to determine this, it's also needed to pass `current`, which
// contains the current parsed syllable.
function sneakySemivowel(word: string, current: string, index: number): boolean {
    current = current.toLowerCase();

    // In order for this to be a semivowel, the current syllable must start with
    // "i" or "u", otherwise it's either already handled somewhere else, or it's
    // not a semivowel.
    if (current !== 'i' && current !== 'u') {
        return false;
    }
    return isVowel(word, index);
}

// Returns the given word as an array of syllables. You can optionally pass an
// offset that will be added to the range for each syllable.
export function syllabify(word: string, offset = 0): Array<Syllable> {
    let vowel = false;
    let syllable = '';
    let res: Array<Syllable> = [];
    let begin: number;
    let flag = Flag.None;

    // Some latin prefixes cannot be splitted and they count as an atomic
    // syllable. Take this into account now, so the main loop doesn't have to
    // care about this.
    let index = prefixIndex(word);
    if (index > 0) {
        res.push({
            value: word.substring(0, index),
            begin: offset,
            end: index + offset,
            position: WordPosition.None,
            flags: flag,
        });
    }
    begin = index;

    for (let i = index; i < word.length; i++) {
        let c = word.charAt(i);

        // The main algorithm is: have we already seen a vowel? If not, then we
        // just swallow everything until we find one. Once that happens, then
        // the parsing fun begins.
        if (vowel) {
            if (isVowel(word, i)) {
                let sneaky = sneakySemivowel(word, syllable, i);
                if (sneaky) {
                    flag = Flag.StartsWithSneakySemivowel;
                }

                // If it's a vowel after another vowel was seen, this might not
                // be another syllable yet if it's a diphthong or a "sneaky"
                // semivowel (semivowel written with 'i' or 'u' instead of 'j'
                // or 'v').
                if (!isDiphthong(word, i) && !sneaky) {
                    res.push({
                        value: syllable,
                        begin: begin + offset,
                        end: i + offset,
                        position: WordPosition.None,
                        flags: flag,
                    });
                    begin = i;
                    syllable = '';
                    flag = Flag.None;
                }
            } else {
                vowel = false;

                // When a vowel was seen and now we have a consonant, the
                // tendency would be to just call for another syllable, but we
                // have to be extra careful.
                if (isVowel(word, i + 1, true)) {
                    // If the next character is actually a vowel, then we really
                    // know that a new syllable is ahead.
                    //
                    // Note that here we allowed explicit semivowels (i.e.
                    // 'j' and 'v') to be considered as vowels. This is to help
                    // with explicit markings in poetry such as `Lā|vī|nja|que`.
                    res.push({
                        value: syllable,
                        begin: begin + offset,
                        end: i + offset,
                        position: WordPosition.None,
                        flags: flag,
                    });
                    begin = i;
                    syllable = '';
                    flag = Flag.None;
                } else if (liquidConsonant(word, i)) {
                    // If this is part of a liquid cluster (e.g. "cr"), then we
                    // have to discard the current character, since it will
                    // belong to the next syllable altogether.
                    res.push({
                        value: syllable,
                        begin: begin + offset,
                        end: i + offset,
                        position: WordPosition.None,
                        flags: flag,
                    });
                    begin = i;
                    syllable = '';
                    flag = Flag.None;
                } else if (vowelAhead(word, i + 1)) {
                    // If the next one is also a consonant but there is at least
                    // a vowel to be parsed (and it's not part of a funny
                    // consonant cluster as we have previously checked), then we
                    // know that we have to eat this consonant as part of the
                    // current syllable, and call for a new syllable.
                    syllable += c;
                    res.push({
                        value: syllable,
                        begin: begin + offset,
                        end: i + 1 + offset,
                        position: WordPosition.None,
                        flags: flag,
                    });
                    begin = i + 1;
                    syllable = '';
                    flag = Flag.None;
                    continue;
                }
            }
        } else if (isVowel(word, i)) {
            vowel = true;
        }
        syllable += c;
    }

    // Push whatever is left as a new syllable.
    if (syllable !== '') {
        res.push({
            value: syllable,
            begin: begin + offset,
            end: word.length + offset,
            position: WordPosition.End,
            flags: flag,
        });
    }

    // Set the first syllable as the start of the word. Moreover, for
    // monosyllables this needs to be a union between a `Start` and an `End`
    // value.
    if (res.length > 1) {
        res[0].position = WordPosition.Start;
    } else {
        res[0].position = WordPosition.Start | WordPosition.End;
    }
    return res;
}
