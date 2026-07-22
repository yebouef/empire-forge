# Empire Forge

A local browser-based civilization creator for Empire Earth and The Art of Conquest. It supports repeated bonus entries, calculates the original game's progressive category costs, imports existing `.civ` files, and exports game-ready `.civ` files.

## Run it

1. Install Node.js 20 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the address shown in the terminal.

For a production build, run `npm run build`.

## Exact cost rule

For a bonus with base cost `B`, when its category already contains `k` selections and the category surcharge is `C`, the next entry costs:

`B + k × C`

If a bonus is repeated without selecting anything else in that category, `n` copies cost:

`nB + C × n(n−1)/2`

Example: three copies of Farming (`B = 9`) in Civ – Economy (`C = 6`) cost `9 + 15 + 21 = 45`.

The implementation and data mirror the algorithm and bonus IDs in [soerface/ee-civ-editor](https://github.com/soerface/ee-civ-editor), whose source is MIT licensed.

## File compatibility

The exporter matches the existing editor's binary structure: a 4-byte name-length field, the civilization name, a 4-byte bonus-count field, and four bytes per bonus entry. Import warns when it encounters a bonus code not present in the included dataset.
