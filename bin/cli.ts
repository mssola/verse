import { scan, Poem, MeterKind, Quantity } from '../src/scansion';
import "process";

let res: Poem;

// Returns a string representing the given meter kind.
function meterKind(kind: MeterKind): string {
    switch (kind) {
        case MeterKind.DactylicHexameter:
            return "Dactylic hexameter";
        case MeterKind.Unknown:
        default:
            return "unknown";
    }
}

process.stdin.on('data', (data) => {
    res = scan(data.toString());

    console.log(`Verse: ${meterKind(res.kind)}\n`);

    res.verses.forEach((v) => {
        let line = v.line;
        let rythm = "";
        let offset = 0;
        let prevend = 0;

        for (let i = 0; i < v.syllables.length; i++) {
            const char = "|";
            const s = v.syllables[i];

            if (i < v.syllables.length - 1) {
                line = line.substring(0, s.end + offset) + char + line.substring(s.end + offset);
            }

            // TODO: generalize
            let pspace = 0;
            let nspace = 0;
            switch (s.end - prevend) {
                case 2:
                    nspace = 1;
                    break;
                case 3:
                    pspace = 1;
                    nspace = 1;
                    break;
                case 4:
                    pspace = 1;
                    nspace = 2;
                    break;
                case 5:
                    pspace = 2;
                    nspace = 2;
                    break;
                case 6:
                    pspace = 3;
                    nspace = 2;
                    break;
            }
            rythm += ' '.repeat(pspace);
            if (s.quantity === Quantity.long) {
                rythm += "-";
            } else {
                rythm += "u";
            }
            rythm += ' '.repeat(nspace + char.length);

            prevend = s.end;
            offset += char.length;
        }

        console.log(line);
        console.log(rythm);
        console.log("")
    });
});
