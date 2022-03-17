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

import { isVowel, syllabify, Syllable, WordPosition, Flag } from './syllable';

// Poem contains a set of verses and the description of the metric being used.
export interface Poem {
    verses: Array<Verse>,
    kind: string
};

// Verse contains an array of VerseSyllables containing the parsed verse, plus
// the description of the metric being used and the original line.
export interface Verse {
    syllables: Array<VerseSyllable>,
    kind: string,
    line: string
};

// Quantity of the verse syllable.
export enum Quantity {
    short = "short",
    long  = "long"
};

// VerseSyllable is similar to Syllable, but it contains the quantity of the
// syllable and the semantics of this type already assumes that its value will
// only be usable on a verse context (i.e. resyllibification has already been
// applied).
export interface VerseSyllable {
    value: string,
    begin: number,
    end: number,
    quantity: Quantity,
};

// Statistics on rythm for a given verse.
interface RythmStats {
    nlongs: number,
    nshorts: number,
    pattern: Array<Quantity>
};

// Returns true if the given string is made up of a single UTF-8 valid
// alphabetical character.
function isAlpha(c: string): boolean {
    if (/^\w$/.test(c)) {
        return true;
    }

    // The `\w` regexp will fail on valid UTF-8 characters. For now, let's just
    // check for latin characters. In the future we might need to use one of
    // those scary regexps.
    switch (c.toLowerCase()) {
        case 'ā': case 'ē': case 'ī': case 'ō': case 'ū': case 'ȳ':
        case 'ă': case 'ĕ': case 'ĭ': case 'ŏ': case 'ŭ': case 'ў':
            return true;
        default:
            return false;
    }
}

// Return the syllables from the given line. Bear in mind that this is not yet
// assuming that this is a poem and, therefore, the resulting syllables are bare
// ones.
function bareSyllables(line: string): Array<Syllable> {
    let res: Array<Syllable> = [];
    let begin = 0;
    let inWord = false;

    for (let i = 0; i < line.length; i++) {
        let c = line.charAt(i);

        if (isAlpha(c)) {
            if (!inWord) {
                begin = i;
                inWord = true;
            }
        } else if (inWord) {
            inWord = false;
            res = res.concat(syllabify(line.substring(begin, i), begin));
        }
    }

    if (inWord) {
        res = res.concat(syllabify(line.substring(begin, line.length), begin));
    }
    return res;
}

// Modify the understanding of the given syllables by taking into account that
// this is a verse and rules like ellisions and such should apply.
function resyllabify(syllables: Array<Syllable>): Array<Syllable> {
    let prev = syllables[0];

    for (let i = 1; i < syllables.length; i++) {
        let cur = syllables[i];

        // All the "magic" happens with the contact of of words. That is, we
        // only need to check for syllables in an end position followed by
        // another with a start position.
        if (((prev.position & WordPosition.End) === WordPosition.End) &&
            ((cur.position & WordPosition.Start) === WordPosition.Start)) {
            if (isVowel(prev.value, prev.value.length - 2) &&
                ((cur.flags & Flag.StartsWithSneakySemivowel) !== Flag.StartsWithSneakySemivowel) &&
                prev.value[prev.value.length - 1].toLowerCase() === 'm' &&
                isVowel(cur.value, 0)) {
                // Ellision of `<vowel> + m` ending in contact with a word
                // starting with a vowel. The previous syllable is then
                // considered as "dirty" (so it doesn't reflect on the final
                // syllabification).
                syllables[i].value = `${syllables[i - 1].value}_${syllables[i].value}`;
                syllables[i].begin = syllables[i - 1].begin;
                syllables[i - 1].position = WordPosition.Dirty;
                syllables[i].position = WordPosition.Merged;
            } else if (isVowel(cur.value, 0) &&
                ((cur.flags & Flag.StartsWithSneakySemivowel) !== Flag.StartsWithSneakySemivowel) &&
                !isVowel(prev.value, prev.value.length - 1)) {
                // Split of part of a syllable that ends with a consonant in
                // contact with a vowel.
                let c = prev.value[prev.value.length - 1];
                syllables[i - 1].value = syllables[i - 1].value.substring(0, syllables[i - 1].value.length - 1)
                syllables[i].value = `${c}${syllables[i].value}`;
                syllables[i].begin = syllables[i - 1].end - 1;
                syllables[i - 1].end -= 1;
            } else if (isVowel(cur.value, 0) &&
                ((cur.flags & Flag.StartsWithSneakySemivowel) !== Flag.StartsWithSneakySemivowel) &&
                isVowel(prev.value, prev.value.length - 1)) {
                // Ellision of word ending with a vowel in contact with a word
                // starting with a vowel. The previous syllable is then
                // considered as "dirty" (so it doesn't reflect on the final
                // syllabification).
                syllables[i].value = `${syllables[i - 1].value}_${syllables[i].value}`;
                syllables[i].begin = syllables[i - 1].begin;
                syllables[i - 1].position = WordPosition.Dirty;
                syllables[i].position = WordPosition.Merged;
            }
        }

        prev = syllables[i];
    }
    return syllables.filter((s) => s.position !== WordPosition.Dirty);
}

// Returns true of the given syllable results in a long vowel. That is, it
// either contains an explicit long vowel or a diphthong.
function longVowel(str: string) {
    let sum = 0;

    for (let i = 0; i < str.length; i++) {
        switch (str.charAt(i).toLowerCase()) {
            case 'a': case 'e': case 'i':
            case 'o': case 'y':
                sum += 1;
                break;
            case 'u':
                let prev = str.charAt(i - 1).toLowerCase();
                if ((prev == "q" || prev == "g") && isVowel(str, i + 1)) {
                    break
                }
                sum += 1;
                break;
            case 'ā': case 'ē': case 'ī':
            case 'ō': case 'ū': case 'ȳ':
                sum += 2;
                break
        }
    }
    return sum > 1;
}

// Given some rythmic statistics, return a string describing the verse at hand.
function figureOutRythm(stats: RythmStats): string {
    if ((stats.nlongs + stats.nshorts) >= 13) {
        // TODO
        return "Dactylic hexameter";
    }

    return "unknown";
}

// Given an array of syllables, return a `Verse` object with the rythm already
// annotated.
function markRythm(syllables: Array<Syllable>): Verse {
    let res: Verse = { syllables: [], kind: "", line: "" };
    let stats: RythmStats = { nshorts: 0, nlongs: 0, pattern: [] }

    for (let syllable of syllables) {
        let quantity: Quantity;

        if (!isVowel(syllable.value, syllable.value.length - 1)) {
            quantity = Quantity.long;
            stats.nlongs += 1;
        } else if (longVowel(syllable.value)) {
            quantity = Quantity.long;
            stats.nlongs += 1;
        } else {
            quantity = Quantity.short;
            stats.nshorts += 1;
        }
        stats.pattern.push(quantity);

        res.syllables.push({
            value: syllable.value,
            begin: syllable.begin,
            end: syllable.end,
            quantity: quantity
        });
    }
    res.kind = figureOutRythm(stats);

    return res;
}

// Given an array of verses, it analyzes them so to return a proper `Poem`
// object.
function analyze(verses: Array<Verse>): Poem {
    // TODO
    let kind = "unknown";
    if (verses.length > 0) {
        kind = verses[0].kind;
    }

    return { verses: verses, kind: kind };
}

// Given a blob of text, return a full Poem structure that contains the
// syllabification of the different verses, plus rythm annotations and an
// analysis of the given poem.
//
// This method is, therefore, assuming that we are dealing with a poem, and so
// prose texts and scattered phrases will give bad results.
export function scan(text: string): Poem {
    // First of all, split the given text by lines. A line separator might be
    // '\n' or special sequences such as "//".
    let lines = text.split(/[\n\/\/]+/)
    let res: Array<Verse> = [];

    for (let line of lines) {
        if (line.replace(/\s+/g, '') === '') {
            continue;
        }

        let syllables = bareSyllables(line);
        syllables = resyllabify(syllables);

        let rythm = markRythm(syllables);
        rythm.line = line;
        res.push(rythm);
    }

    return analyze(res);
}
