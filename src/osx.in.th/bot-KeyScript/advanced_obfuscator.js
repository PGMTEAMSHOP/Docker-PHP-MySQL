const fs = require('fs');
const path = require('path');

/**
 * OSX HUB - GG GHOST STYLE (Final Version)
 * Aesthetic: Scary Glitch Headers, Dense Obfuscation, Anonymous Wrappers
 */

const SCARY_HEADER = [
    'OSX ENCRYPTION VERSION I',
    'MAKE BY : OSX TEAM',
    'This script is encrypted using OSX Encryption. | discord.gg/TmTcfuUZYV'
];

function generateKeyExpression(targetKey) {
    const part1 = Math.floor(Math.random() * 500) + 100;
    const part2 = part1 - targetKey;
    const fakePart = Math.floor(Math.random() * 100);
    // สร้างสมการที่มีตัวเลขหลอกปนอยู่ด้วย เช่น (350 - 178 + 5 - 5)
    return `(${part1} - ${part2} + ${fakePart} - ${fakePart})`;
}

function generateRandomHex(len) {
    let result = '';
    const hex = '0123456789abcdef';
    for (let i = 0; i < len; i++) {
        result += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return '_0x' + result;
}

function obfuscate(code) {
    console.log("👻 Generating GG Ghost Script...");

    // 1. Minify
    code = code.replace(/--\[\[[\s\S]*?\]\]/g, '');
    code = code.replace(/--.*$/gm, '');
    code = code.replace(/\s+/g, ' ').trim();

    // 2. Encryption
    const key = Math.floor(Math.random() * 255) + 1;
    let encrypted = '';
    for (let i = 0; i < code.length; i++) {
        encrypted += '\\' + (code.charCodeAt(i) ^ key).toString(10).padStart(3, '0');
    }

    // 3. Glitch aesthetic
    const glitch = SCARY_HEADER.map(h => `-- [[ 🛡 ${h} ]] --`).join('\n');
    const randomVar1 = generateRandomHex(4);
    const randomVar2 = generateRandomHex(4);
    const randomVar3 = generateRandomHex(4);

    // สร้างตัวแปรหลอก (Fake Keys)
    const fake1 = generateRandomHex(4);
    const fake2 = generateRandomHex(4);
    const fake3 = generateRandomHex(4);
    const fakeVal1 = Math.floor(Math.random() * 255);
    const fakeVal2 = Math.floor(Math.random() * 255);

    const keyExpr = generateKeyExpression(key);

    const protectedCode = `${glitch}\nreturn(function(${fake1},${randomVar1},${fake2})local ${randomVar2}="${encrypted}"local ${fake3}=${fakeVal1} local ${randomVar3}=""for i=1,#${randomVar2} do ${randomVar3}=${randomVar3}..string.char(bit32.bxor(string.byte(${randomVar2},i),${randomVar1}))end return loadstring(${randomVar3})()end)(${fakeVal2},${keyExpr},${fakeVal1})`;

    return protectedCode;
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Usage: node advanced_obfuscator.js <input.lua> [output.lua]");
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = args[1] ? path.resolve(args[1]) : inputPath.replace('.lua', '_ghost.lua');

if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
}

try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const result = obfuscate(content);
    fs.writeFileSync(outputPath, result);
    console.log(`✅ GG Ghost Mode Active! Saved to: ${path.basename(outputPath)}`);
} catch (e) {
    console.error(`❌ Error: ${e.message}`);
}

module.exports = { obfuscate };
