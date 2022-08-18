<p align="center">
  <a href="https://github.com/mssola/verse/actions?query=workflow%3ACI" title="CI status for the main branch"><img src="https://github.com/mssola/verse/workflows/CI/badge.svg" alt="Build Status for main branch" /></a>
  <a href="http://www.gnu.org/licenses/lgpl-3.0.txt" rel="nofollow"><img alt="License LGPL 3+" src="https://img.shields.io/badge/license-LGPL_3-blue.svg" style="max-width:100%;"></a>
</p>

---

`verse` is a small library that allows you to syllabify and scan phrases and
poems in latin. This is done mainly through the `syllable.syllabify` and the
`scansion.scan` functions (check the documentation on these functions in order
to understand how to use them).

You can check the `./bin/cli.ts` file for some usage. You can actually run this
script with `yarn run bin` which, coupled with one of the examples from the
`examples` directory, will give you an output such as this:

``` txt
Verse: Dactylic hexameter

Ar|ma| vi|rum|que| ca|nō|, Trō|iae| quī| prī|mu|s a|b ō|rīs
-  u   u   -   u   u  -    -    -   -    -   u   u   -   -

Ī|ta|li|am|, fā|tō| pro|fu|gus|, Lā|vī|nja|que| vē|nit
- u  u  -   -   -   u   u   -   -   -   u   u   -   -

lī|to|ra|, mul|tum il|le et| ter|rīs| iac|tā|tu|s e|t al|tō
-  u  u    -      -     -    -    -   -   -  u   u   -   -

vī| su|pe|rum| sae|vae| me|mo|rem| Iū|nō|ni|s o|b ī|ram;
-   u  u   -   -    -   u  u   -   -  -  u   u   -   -

mul|ta| quo|que et| bel|lō| pas|sus|, dum| con|de|re|t ur|bem,
 -  u   u      -    -   -   -    -    -    -   u  u   -    -

in|fer|ret|que| de|ōs| La|ti|ō|, ge|nu|s un|de| La|tī|num,
-   -   -   u   u  -   u  u  -  u   u   -   u   u  -   -

Al|bā|nī|que| pa|trē|s, at|que al|tae| moe|ni|a| Rō|mae.
-  -  -   u   u   -    -      -    -   -   u  u  -   -
```

Notice some things from the above example:

1. Macrons are being used: this is because, even though it can scan latin verse,
   this library does *not* understand the full complexity of latin. That is, you
   need to let the functions know which vowels are short/long because it will
   not be able to know this on its own (except for stuff like diphthongs, of
   course).
2. Semivowels that are written with `u` or `i` are recognized, but you really
   need to write them with `v` or `j` whenever there might be a case which needs
   to be treated differently. In the above example, take a look at `Lāvīnjaque`
   (instead of `Lāvīniaque`). This is because Virgil forced the `i` in `nia` to
   be a semivowel to make the metric fit.

This library is still **under development**. Thus, bugs are to be expected, APIs
might change, function might come and go, etc.

## Contributing

Take a look at the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## [Changelog](https://pbs.twimg.com/media/DJDYCcLXcAA_eIo?format=jpg&name=small)

Read the [CHANGELOG.md](./CHANGELOG.md) file.

## License

```txt
Copyright (C) 2022 Miquel Sabaté Solà <mikisabate@gmail.com>

verse is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

verse is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with verse.  If not, see <https://www.gnu.org/licenses/>.
```
