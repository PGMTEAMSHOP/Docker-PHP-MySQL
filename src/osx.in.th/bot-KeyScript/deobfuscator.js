const fs = require('fs');
const path = require('path');

/**
 * OSX HUB - ONE CLICK DEOBFUSCATOR
 * ใช้สำหรับกู้คืนโค้ดจากไฟล์ที่ผ่านการพรางด้วย advanced_obfuscator.js (ทุกเวอร์ชัน)
 */

function deobfuscate(encryptedContent) {
    console.log("🔍 Analyzing Protection...");

    // 1. ดึง Key จากท้ายไฟล์ (ชุดตัวเลขในวงเล็บสุดท้าย)
    const keyMatch = encryptedContent.match(/\)\((\d+)\)$/);
    if (!keyMatch) {
        throw new Error("หา Key ไม่เจอ! ไฟล์นี้อาจไม่ได้แปลงด้วย advanced_obfuscator");
    }
    const key = parseInt(keyMatch[1]);
    console.log(`🔑 Found XOR Key: ${key}`);

    // 2. ดึงข้อมูลที่เข้ารหัส (ก้อน \ddd ทั้งหมด)
    const dataMatch = encryptedContent.match(/local _[0-9xaf]+="((?:\\(?:\d{3}))+)"/);
    if (!dataMatch) {
         // ลองหาแบบดั้งเดิม (ถ้าใช้ตัวแปรเก่า)
         const oldDataMatch = encryptedContent.match(/local _D="((?:\\(?:\d{3}))+)"/) || encryptedContent.match(/local t={((?:"(?:\\(?:\d{3}))+",?)+)}/);
         if (!oldDataMatch) throw new Error("ไม่พบข้อมูลสคริปต์ที่เข้ารหัส");
    }

    // สกัดเอาเฉพาะก้อน \ddd ออกมา
    const rawData = dataMatch ? dataMatch[1] : "";
    
    // แปลง \ddd กลับเป็น Byte แล้ว XOR คืนค่า
    let originalCode = "";
    const bytes = rawData.split('\\').filter(x => x.length > 0);
    
    for (let b of bytes) {
        const charCode = parseInt(b);
        originalCode += String.fromCharCode(charCode ^ key);
    }

    return originalCode;
}

// CLI Logic
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("\n🔓 OSX ONE-CLICK DEOBFUSCATOR 🔓");
    console.log("Usage: node deobfuscator.js <protected_file.lua> [output.lua]\n");
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = args[1] ? path.resolve(args[1]) : inputPath.replace('.lua', '_recovered.lua');

try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const recovered = deobfuscate(content);
    fs.writeFileSync(outputPath, recovered);
    console.log(`\n✨ Success! Original code recovered to: ${path.basename(outputPath)}`);
} catch (e) {
    console.error(`\n❌ Error: ${e.message}`);
}
