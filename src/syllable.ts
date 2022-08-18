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

// TODO: in some places we already know the character. I bet we can overload this function!
//
// Returns true if the given word contains a vowel at the given index, false
// otherwise.
export function isVowel(word: string, index: number, acceptSemivowel = false): boolean {
    switch (word.charAt(index).toLowerCase()) {
        case 'a': case 'ā': case 'ă': case 'ä':
        case 'e': case 'ē': case 'ĕ': case 'ë':
        case 'i': case 'ī': case 'ĭ': case 'ï':
        case 'o': case 'ō': case 'ŏ': case 'ö':
        case 'u': case 'ū': case 'ŭ': case 'ü':
        case 'y': case 'ȳ': case 'ў': case 'ÿ':
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
            // NOTE: there are plenty of cases were 'eu' is actually not a
            // diphthong, such as in morpheme borders (e.g. 'meus' being ['me',
            // 'us']). That being said, it's hard to figure this out from a
            // library that doesn't (and shouldn't) have knowledge of Latin
            // syntax. Thus, this is expected to be pointed out by the caller
            // (e.g. "meüs"). Notice that this is a bit different with the 'ui'
            // diphthong as explained below.
            return c === 'i' || c === 'u';
        case 'o': case 'ŏ':
            return c === 'e';
        case 'v': case 'u': case 'ŭ':
            // If the previous one was a 'u', take into account that it might be
            // a "qu-" or "gu-" cluster. Thus, we will account them as a
            // diphthong.
            let bf = word.charAt(index - 2).toLowerCase();
            if (bf === 'q' || bf == 'g') {
                return isVowel(word, index);
            }

            // NOTE: the "ui" diphthong is actually really rare (only found in
            // 5-6 words plus derivatives). Happily for us, the general
            // algorithm would already consider these cases correctly even if we
            // return false here, and we only need to check on corner cases,
            // which is a bit of a pain, but easy enough.
            return false;
        default:
            return false;
    }
}

// Returns true if there is at least one vowel ahead of the given index.
function vowelAhead(word: string, index: number): boolean {
    for (let i = index; i < word.length; i++) {
        if (isVowel(word, i)) {
            return true;
        }
    }
    return false;
}

// Returns true if the current index is pointing to a consonant that has to go
// into the next syllable.
function consonantNextSyllable(word: string, index: number): boolean {
    if (isVowel(word, index, true)) {
        return false;
    }

    let c = word.charAt(index).toLowerCase();
    let next = word.charAt(index + 1).toLowerCase();

    // In some marginal cases, the "qu-"/"gu-" clusters are not detected in
    // advanced (e.g. "qvoqve"). We can handle this now.
    if ((c === 'q' || c === 'g') && (next === 'u' || next === 'ŭ' || next === 'v')) {
        return true;
    }

    // TODO: make isVowel accept also `nextNext` instead of doing this stupid test.
    //
    // Look ahead: if the next one is a vowel and next to it there is the coda,
    // then the current consonant is most surely an opening consonant and not
    // the closing one of the previous. This case is usually handled in the
    // general algorithm, but it has escaped from words such as "VIRVMQVE".
    let nextNext = word.charAt(index + 2);
    if (nextNext === '') {
        return false;
    }
    if (isVowel(word, index + 1, true) && !isVowel(word, index + 2, true)) {
        return true;
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

// Returns true if this is a 'th-' cluster.
function isTh(word: string, index: number): boolean {
    let next = word.charAt(index + 1).toLowerCase();

    return word.charAt(index).toLowerCase() === 't' && next === 'h';
}

// Returns true if this is a "special nj-" consonant cluster. This is best
// explained with the famous "nia" syllable from "Laviniaque" in Vergil's
// Aeneid, where the semivowel "i" is in fact glued to the "n" consonant.
//
// NOTE: this might be not needed in the future since this is a very specific
// case. Maybe we should tell users to provide this information.
function specialNjCluster(word: string, index: number): boolean {
    if (word.charAt(index).toLowerCase() !== 'n') {
        return false;
    }

    let next = word.charAt(index + 1).toLowerCase();
    if (next !== 'i' && next !== 'ĭ' && next !== 'j') {
        return false;
    }

    return isVowel(word, index + 2);
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

// Returns true of the syllable at point is supposed to have a long coda (i.e.
// it has a coda which involves naturally more consonants than expected at first
// glance).
function longCoda(word: string, index: number): boolean {
    // NOTE: the implementation for this is pretty weak, as it only handled on
    // very specific case. This will be generalized whenever I face new
    // clusters.

    let current = word.charAt(index).toLowerCase();
    if (current !== 'b' && current !== 'n') {
        return false;
    }

    return !isVowel(word, index + 1) && !isVowel(word, index + 2);
}

// Returns a number that points to the position of the word that does not
// include a valid prefix. Thus, if the word does not contain a "troublesome"
// prefix, it will just return 0.
function prefixIndex(word: string): number {
    // NOTE: for now this is the only prefix that has to be explicitely handled.
    // The others are rightly handled from the general code.
    let prefixes = ['in'];

    for (let prefix of prefixes) {
        if (word.toLowerCase().startsWith(prefix)) {
            return prefix.length;
        }
    }
    return 0;
}

// Returns the given character without a possible trema.
function stripTrema(c: string): string {
    switch (c) {
        case 'Ä':
            return 'A';
        case 'ä':
            return 'a';
        case 'Ë':
            return 'E';
        case 'ë':
            return 'e';
        case 'Ï':
            return 'I';
        case 'ï':
            return 'i';
        case 'Ö':
            return 'O';
        case 'ö':
            return 'o';
        case 'Ü':
            return 'U';
        case 'ü':
            return 'u';
        default:
            return c;
    }
}

// Returns true if the remaining syllable is to be merged with the last parsed
// syllable or not. Note that this is to be used at the end stage of parsing a
// word.
function mergeEnd(remaining: string, ary: Array<Syllable>): boolean {
    if (ary.length == 0) {
        return false;
    }

    let last = ary[ary.length - 1].value.toLowerCase();
    remaining  = remaining.toLowerCase();

    return (remaining === 'i' && last === 'cu') ||
        (remaining === 'ic' && last === 'hu')
}

// Returns an array of syllables with the first two elements merged if needed.
// This just happens in some expectional cases, so most of the time this
// function will simply return the same array from the given argument.
function mergeHead(ary: Array<Syllable>): Array<Syllable> {
    if (ary.length < 2) {
        return ary;
    }

    let first = ary[0].value.toLowerCase();
    let second = ary[1].value.toLowerCase();

    if (first === 'cu' && second === 'i') {
        ary[1].value = ary[0].value + ary[1].value;
        ary[1].begin = ary[0].begin;
        return ary.slice(1, ary.length);
    }
    return ary;
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
                    // This is just an extra vowel, and it might even be from a
                    // vowel with a trema (and thus it skipped the diphthong
                    // check). Let's strip this now so it's shown as expected.
                    c = stripTrema(c);

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

                // TODO: notice that some if statements have the same body,
                // maybe put a fat conditional?
                //
                // When a vowel was seen and now we have a consonant, the
                // tendency would be to just call for another syllable, but we
                // have to be extra careful.
                if (isVowel(word, i + 1) || consonantNextSyllable(word, i) || specialNjCluster(word, i)) {
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
                } else if (liquidConsonant(word, i) || isTh(word, i)) {
                    // If this is part of a liquid cluster (e.g. "cr") or is a
                    // syllable starting with a 'th-' cluster, then we have to
                    // discard the current character, since it will belong to
                    // the next syllable altogether.
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
                    // current syllable, and call for a new syllable. Sometimes,
                    // for special long codas, we have to also eat up yet
                    // another consonant (e.g. 'obs' inside of 'obscūrus'). This
                    // cases are also handled here.
                    syllable += c;
                    if (longCoda(word, i)) {
                        syllable += word.charAt(i + 1);
                        i += 1;
                    }

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
        } else if (c.toLowerCase() == 'v' && !isVowel(word, i + 1, true)) {
            // This is a special case from the previous one. That is 'v' should
            // only be considered as a full vowel (and not a "sneaky semivowel")
            // if the next character is actually a consonant. That is, the
            // string is using 'v' everywhere instead of using 'u'.
            vowel = true;
        }

        syllable += c;
    }

    // If there is some remaining characters in the `syllable` variable, then we
    // usually have to call for a new syllable. In some cases these remaining
    // characters are to be merged with the latest syllable that we already
    // have. In either case, we evaluate this here.
    if (syllable !== '') {
        if (mergeEnd(syllable, res)) {
            res[res.length - 1].value += syllable;
            res[res.length - 1].end += syllable.length;
        } else {
            res.push({
                value: syllable,
                begin: begin + offset,
                end: word.length + offset,
                position: WordPosition.End,
                flags: flag,
            });
        }
    }

    // Finally, in some very special cases we still need to merge two syllables
    // from the beginning of the word.
    res = mergeHead(res);

    // Set the `Start` and `End` positions now.
    res[0].position = WordPosition.Start;
    res[res.length - 1].position |= WordPosition.End;

    return res;
}
