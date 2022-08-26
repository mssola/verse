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

import { charIsVowel, isVowel, syllabify, Syllable, WordPosition, Flag } from './syllable';

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
    line: string,
    stats: RythmStats
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

// Returns true if the two given syllables represent a word boundary. That is,
// the position on `prev` is stating that it's the end of the word, and the
// position on `cur` is stating that it's at the start of a word. This function
// assumes that the caller is passing these two syllables as consecutives.
function inWordBoundaries(prev: Syllable, cur: Syllable): boolean {
    return ((prev.position & WordPosition.End) === WordPosition.End) &&
            ((cur.position & WordPosition.Start) === WordPosition.Start)
}

// Returns true if the given syllable starts in a way that suggests that ellision can occur.
function isEllidable(syllable: Syllable): boolean {
    const ch = syllable.value.charAt(0);

    return charIsVowel(ch) || ch.toLowerCase() === 'h';
}

// Returns true if the given syllable starts with a "sneaky semivowel".
function startsWithSneaky(syllable: Syllable): boolean {
    return (syllable.flags & Flag.StartsWithSneakySemivowel) === Flag.StartsWithSneakySemivowel;
}

// Modify the understanding of the given syllables by taking into account that
// this is a verse and rules like ellisions and such should apply.
function resyllabify(syllables: Array<Syllable>): Array<Syllable> {
    let prev = syllables[0];

    for (let i = 1; i < syllables.length; i++) {
        const cur = syllables[i];

        // All the "magic" happens with the contact of words. That is, we only
        // need to check for syllables in an end position followed by another
        // with a start position that can be ellided (that is, which starts with
        // "h" or with a vowel which is not "sneaky").
        if (inWordBoundaries(prev, cur) && !startsWithSneaky(cur) && isEllidable(cur)) {
            const ult = prev.value.charAt(prev.value.length - 1);

            // There are two main cases for resyllabification whenever the
            // current syllable allows it:
            //   1. Ellision: the previous syllable ends with a vowel or with a
            //      vowel followed by 'm'. In this case, both syllables are to
            //      be merged.
            //   2. Splitting: the previous syllable ends with a consonant, and
            //      thus it should naturally be moved into the next syllable.
            if (charIsVowel(ult) || (isVowel(prev.value, prev.value.length - 2) && ult.toLowerCase() === 'm')) {
                syllables[i].value = `${ult}_${syllables[i].value}`;
                syllables[i].begin = syllables[i - 1].begin;
                syllables[i - 1].position = WordPosition.Dirty;
                syllables[i].position |= WordPosition.Merged;
            } else if (!charIsVowel(ult)) {
                syllables[i - 1].value = syllables[i - 1].value.substring(0, syllables[i - 1].value.length - 1)
                syllables[i].value = `${ult}${syllables[i].value}`;
                syllables[i].begin = syllables[i - 1].end - 1;
                syllables[i - 1].end -= 1;
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

                // 'u' is not to considered if it's part of a 'qu-' or 'gu-'
                // cluster.
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

// Returns true if the given `pattern` follows an enclitic `n` dactylic pattern
// (i.e. when 'n' -> 6, then we are looking for an enclitic 'hexameter'
// dactylic), The `forbidContraction` parameter contains a 0-based index
// pointing to the position where contraction with a spondee is forbidden. If
// all positions can be contrated, then `-1` should be passed (default value).
export function isEncliticDactyl(pattern: Array<Quantity>, n: number, forbidContraction = -1): boolean {
    let i = 0;
    let s = 0;

    // This loop only checks for full dactyls and it will stop at the enclitic
    // foot.
    while (i < pattern.length && n !== 1) {
        // Regardless of the foot, it always starts with long.
        if (pattern[i] !== Quantity.long) {
            return false;
        }

        // At this point, it's either followed by a single long syllable, or two
        // short ones.
        if (pattern[i + 1] === Quantity.long) {
            // If this foot was actually forbidden to be contracted, return
            // false now.
            if (forbidContraction === s) {
                return false;
            }
            i += 2;
        } else if (pattern[i + 1] === Quantity.short && pattern[i + 2] === Quantity.short) {
            i += 3;
        } else {
            return false;
        }

        n--;
        s++;
    }

    // Check that there is only two syllables left, and that the first one is
    // long (the second one is anceps).
    return (i + 2 === pattern.length) && pattern[i] === Quantity.long;
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
        if (isEncliticDactyl(stats.pattern, 6)) {
            return MeterKind.DactylicHexameter;
        }
        return MeterKind.Unknown;
    }

    return MeterKind.Unknown;
}

// Given an array of syllables, return a `Verse` object with the rythm already
// annotated.
function markRythm(syllables: Array<Syllable>): Verse {
    const res: Verse = {
        syllables: [],
        kind: MeterKind.Unknown,
        line: "",
        stats: { nshorts: 0, nlongs: 0, pattern: [] }
    };

    for (const syllable of syllables) {
        let quantity: Quantity;

        if (!isVowel(syllable.value, syllable.value.length - 1)) {
            quantity = Quantity.long;
            res.stats.nlongs += 1;
        } else if (longVowel(syllable)) {
            quantity = Quantity.long;
            res.stats.nlongs += 1;
        } else {
            quantity = Quantity.short;
            res.stats.nshorts += 1;
        }
        res.stats.pattern.push(quantity);

        res.syllables.push({
            value: syllable.value,
            begin: syllable.begin,
            end: syllable.end,
            quantity: quantity
        });
    }
    res.kind = figureOutRythm(res.stats);

    return res;
}

// Returns true if the given verse can be coerced into the given meter. That is,
// it returns true if the given verse can be considered whatever is passed in
// `meter` if we take a broad/relaxed definition.
//
// NOTE: for now this implementation is empty, which means that the algorithm
// should be robust and relaxed enough to not leave known meters as unknown.
// Nonetheless, this is left here just in case there are some special cases to
// be treated in the future.
function canCoerceInto(verse: Verse, meter: MeterKind): boolean {
    verse;
    meter;

    return false;
}

// Returns true if the given poems seems to be a poem in dactylic hexameters..
// This method assumes that only known rythms are contained into the `rythms`
// array, an unknown/undecided verses are indexed into the `unknowns` array.
function isDactylicHexameter(verses: Array<Verse>, rythms: Array<MeterKind>, unknowns: Array<number>): boolean {
    // Basic check: a poem in dactylic hexameters only contains this meter.
    if (rythms.length !== 1 || rythms[0] !== MeterKind.DactylicHexameter) {
        return false;
    }

    // If there are unknowns, then we have to double check if we can coerce them
    // all into dactylic hexameter.
    for (let i = 0; i < unknowns.length; i++) {
        if (!canCoerceInto(verses[unknowns[i]], MeterKind.DactylicHexameter)) {
            return false;
        }
    }
    return true;
}

// Returns true if the given poems seems to be an elegiac couplet. This method
// assumes that only known rythms are contained into the `rythms` array, an
// unknown/undecided verses are indexed into the `unknowns` array.
function isElegiacCouplet(verses: Array<Verse>, rythms: Array<MeterKind>, unknowns: Array<number>): boolean {
    if (verses.length % 2 !== 0 || rythms.length !== 2) {
        return false;
    }
    if (!rythms.includes(MeterKind.DactylicHexameter) ||
        !rythms.includes(MeterKind.DactylicPentameter)) {
        return false;
    }

    for (let i = 0; i < verses.length - 2; i += 2) {
        if (verses[i].kind !== MeterKind.DactylicHexameter ||
            (unknowns.includes(i) && !canCoerceInto(verses[i], MeterKind.DactylicHexameter))) {
            return false;
        }
        if (verses[i + 1].kind !== MeterKind.DactylicPentameter ||
            (unknowns.includes(i + 1) && !canCoerceInto(verses[i + 1], MeterKind.DactylicPentameter))) {
            return false;
        }
    }
    return true;
}

// Given an array of verses, it analyzes them so to return a proper `Poem`
// object. This method also requires the`foundRythms` argument, which is an
// array of the different verse kinds that have been found for this poem.
function analyze(verses: Array<Verse>, foundRythms: Array<MeterKind>, unknowns: Array<number>): Poem {
    let kind = MeterKind.Unknown;
    const kinds: Array<MeterKind> = [];
    const knownRythms = foundRythms.filter((r) => r !== MeterKind.Unknown);

    if (knownRythms.length === 1) {
        if (isDactylicHexameter(verses, knownRythms, unknowns)) {
            kinds.push(MeterKind.DactylicHexameter);
        }
    } else if (knownRythms.length === 2) {
        if (isElegiacCouplet(verses, knownRythms, unknowns)) {
            kinds.push(MeterKind.ElegiacCouplet);
        }
    }

    // For now we will only call for a known kind if there is only one
    // candidate. In the future, if there are multiple candidates we might want
    // to do some heuristics of some sorts. But for now let's play it safe.
    if (kinds.length == 1) {
        kind = kinds[0];
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
    const unknowns: Array<number> = [];
    const foundRythms: Array<MeterKind> = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.replace(/\s+/g, '') === '') {
            continue;
        }

        let syllables = bareSyllables(line);
        syllables = resyllabify(syllables);

        const rythm = markRythm(syllables);
        rythm.line = trimmedLine(line);
        res.push(rythm);

        if (rythm.kind === MeterKind.Unknown) {
            unknowns.push(i)
        }
        if (!foundRythms.includes(rythm.kind)) {
            foundRythms.push(rythm.kind);
        }
    }

    return analyze(res, foundRythms, unknowns);
}
