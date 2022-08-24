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

// MeterKind contains the description for a given verse or poem based on the
// meter.
export enum MeterKind {
    Unknown,
    DactylicHexameter,
    DactylicPentameter,
    ElegiacCouplet,
}

// Poem contains a set of verses and the description of the metric being used.
export interface Poem {
    verses: Array<Verse>,
    kind: MeterKind
}

// Verse contains an array of VerseSyllables containing the parsed verse, plus
// the description of the metric being used and the original line.
export interface Verse {
    syllables: Array<VerseSyllable>,
    kind: MeterKind,
    line: string
}

// Quantity of the verse syllable.
export enum Quantity {
    short,
    long
}

// VerseSyllable is similar to Syllable, but it contains the quantity of the
// syllable and the semantics of this type already assumes that its value will
// only be usable on a verse context (i.e. resyllibification has already been
// applied).
export interface VerseSyllable {
    value: string,
    begin: number,
    end: number,
    quantity: Quantity,
}

// Statistics on rythm for a given verse.
interface RythmStats {
    nlongs: number,
    nshorts: number,
    pattern: Array<Quantity>
}

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
        case 'ä': case 'ë': case 'ï': case 'ö': case 'ü': case 'ÿ':
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
        const c = line.charAt(i);

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
        const cur = syllables[i];

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
                const c = prev.value[prev.value.length - 1];
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
function longVowel(syllable: Syllable) {
    let sum = 0;
    let prev: string;
    const str = syllable.value;

    for (let i = 0; i < str.length; i++) {
        switch (str.charAt(i).toLowerCase()) {
            case 'i':
                // If this 'i' is at the very beginning of the syllable and we
                // know that this syllable starts with a "sneaky semivowel",
                // then we can skip this as a consonant. Otherwise fall through.
                if (i == 0 && (syllable.flags & Flag.StartsWithSneakySemivowel) == Flag.StartsWithSneakySemivowel) {
                    break;
                }
            // eslint-disable-next-line no-fallthrough
            case 'a': case 'e':
            case 'o': case 'y':
                sum += 1;
                break;
            case 'u':
                // Same as for the 'i' case: if this 'u' is clearly a "sneaky
                // semivowel", just skip it.
                if (i == 0 && (syllable.flags & Flag.StartsWithSneakySemivowel) == Flag.StartsWithSneakySemivowel) {
                    break;
                }

                prev = str.charAt(i - 1).toLowerCase();
                if ((prev == "q" || prev == "g") && isVowel(str, i + 1)) {
                    break
                }
                sum += 1;
                break;
            case 'ā': case 'ē': case 'ī':
            case 'ō': case 'ū': case 'ȳ':
                sum += 2;
                break
            case '_':
                // Special character which simply means that an ellision is at
                // place. In this case, just reset the `sum` variable and assume
                // the quantity from whatever comes next.
                sum = 0;
                break
        }
    }
    return sum > 1;
}

// Returns true if the quantity pattern matches a given string representing the
// pattern.
function meterEndsWith(pattern: Array<Quantity>, given: string): boolean {
    if (given.length > pattern.length) {
        return false;
    }

    const ary = pattern.slice(pattern.length - given.length, pattern.length);
    for (let i = 0; i < given.length; i++) {
        const c = given.charAt(i);
        if (c === '-') {
            if (ary[i] !== Quantity.long) {
                return false;
            }
        } else if (c === 'u') {
            if (ary[i] !== Quantity.short) {
                return false;
            }
        }
    }
    return true;
}

// Given some rythmic statistics, return a string describing the verse at hand.
function figureOutRythm(stats: RythmStats): MeterKind {
    // NOTE: the algorithm is still too strict/naive.

    const sum = stats.nlongs + stats.nshorts;

    if (sum >= 12 && sum <= 14) {
        if (meterEndsWith(stats.pattern, "--uu-uu-")) {
            return MeterKind.DactylicPentameter;
        }
    }
    if (sum >= 13) {
        if (meterEndsWith(stats.pattern, "-uu-x")) {
            return MeterKind.DactylicHexameter;
        }
        return MeterKind.Unknown;
    }

    return MeterKind.Unknown;
}

// Given an array of syllables, return a `Verse` object with the rythm already
// annotated.
function markRythm(syllables: Array<Syllable>): Verse {
    const res: Verse = { syllables: [], kind: MeterKind.Unknown, line: "" };
    const stats: RythmStats = { nshorts: 0, nlongs: 0, pattern: [] }

    for (const syllable of syllables) {
        let quantity: Quantity;

        if (!isVowel(syllable.value, syllable.value.length - 1)) {
            quantity = Quantity.long;
            stats.nlongs += 1;
        } else if (longVowel(syllable)) {
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

// Returns true if the given poems seems to be an elegiac couplet. The arguments
// are the same as for the `analyze` method.
function isElegiacCouplet(verses: Array<Verse>, foundRythms: Array<MeterKind>): boolean {
    if (verses.length % 2 !== 0) {
        return false;
    }
    if (!foundRythms.includes(MeterKind.DactylicHexameter) ||
        !foundRythms.includes(MeterKind.DactylicPentameter)) {
        return false;
    }

    for (let i = 0; i < verses.length - 2; i += 2) {
        if (verses[i].kind !== MeterKind.DactylicHexameter ||
            verses[i + 1].kind !== MeterKind.DactylicPentameter) {
            return false;
        }
    }
    return true;
}

// Given an array of verses, it analyzes them so to return a proper `Poem`
// object. This method also requires the`foundRythms` argument, which is an
// array of the different verse kinds that have been found for this poem.
function analyze(verses: Array<Verse>, foundRythms: Array<MeterKind>): Poem {
    let kind = MeterKind.Unknown;

    if (foundRythms.length === 1) {
        kind = foundRythms[0];
    } else if (foundRythms.length === 2) {
        if (isElegiacCouplet(verses, foundRythms)) {
            kind = MeterKind.ElegiacCouplet;
        }
    }

    return { verses: verses, kind: kind };
}

// Returns the given line without unwanted characters such as tremas.
function trimmedLine(line: string): string {
    // NOTE: doing this is quite naive, but I have found it not to be too
    // expensive. Whenever that is the case, we should rething how this is
    // handled.
    return line
        .replace(/ä/gi, 'a')
        .replace(/ë/gi, 'e')
        .replace(/ï/gi, 'i')
        .replace(/ö/gi, 'o')
        .replace(/ü/gi, 'u');
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
    const lines = text.split(/[\n//]+/)
    const res: Array<Verse> = [];
    const foundRythms: Array<MeterKind> = [];

    for (const line of lines) {
        if (line.replace(/\s+/g, '') === '') {
            continue;
        }

        let syllables = bareSyllables(line);
        syllables = resyllabify(syllables);

        const rythm = markRythm(syllables);
        rythm.line = trimmedLine(line);
        res.push(rythm);

        if (!foundRythms.includes(rythm.kind)) {
            foundRythms.push(rythm.kind);
        }
    }

    return analyze(res, foundRythms);
}
