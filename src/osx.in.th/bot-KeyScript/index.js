require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, WebhookClient } = require('discord.js');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { createKey, verifyKey: sqVerifyKey, banUser: sqBanUser, getUserActiveKey, resetHWID, getUserData } = require('./database');
const mysqlDb = require('./mysql_db');

const BAN_WEBHOOK_URL = 'https://discord.com/api/webhooks/1502299159636607077/BlthtguetrSlFLxZRa6AjaCZZga10U0PHkqh2u5DWXzi_BzwhQyZNvAC5gMlrK3lfiz6';
const banWebhookClient = new WebhookClient({ url: BAN_WEBHOOK_URL });

async function sendBanWebhook(userId, key, hwid1, hwid2, reason) {
    try {
        const embed = new EmbedBuilder()
            .setTitle('<a:warning:1491117576644722859> เเจ้งเตือนการถูกเเบนจากระบบเเชร์คีย์!')
            .setDescription(`<a:Sparkles:1485842021095702598> **คุณ : ** <@${userId}> **ถูกเเบนจากระบบกดคีย์เนื่องจากละเมิดข้อกำหนด!**\n\n** คีย์ที่พบการเเเชร์ ⤵︎**\n\`\`\`\n${key || 'N/A'}\n\`\`\`\n** หมายเลข HWID เครื่องเเรกที่ใช้งาน ⤵︎**\n\`\`\`\n${hwid1 || 'N/A'}\n\`\`\`\n** หมายเลข HWID เครื่องสองที่ใช้งาน ⤵︎**\n\`\`\`\n${hwid2 || 'N/A'}\n\`\`\`\n** รายละเอียดการเเบน ⤵︎**\n\`\`\`\n${reason || 'ไม่ได้ระบุ'}\n\`\`\`\n**<:emojigg_Ban:1491230899914801164> หากโดนเเบนจากการสลับเครื่องโดยไม่ได้ตั้งใจสามารถติดต่อเเอดมินให้ปลดเเบนได้ฟรี เเต่หากโดนเเบนจากการเเชร์คีย์ต้องจ่าย 99 บาทเพื่อปลด!**`)
            .setColor(16711680)
            .setFooter({
                text: '© 2026 Osx Hub. All rights reserved.',
                iconURL: 'https://images-ext-1.discordapp.net/external/h1eCRwitXe3Ug4yX6RRkiTYQKoTOizDhxnh8xo0Ko6g/https/i.postimg.cc/59SJZPXV/logo1.png?format=webp&quality=lossless'
            })
            .setImage('https://media.discordapp.net/attachments/1485621966575501312/1502303798545350706/standard_2.gif?ex=69ff38f1&is=69fde771&hm=204101140d8394b58b85f926553e06d49140ba74e6cefeef491ea04bec2b9302&=');

        await banWebhookClient.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error('Error sending ban webhook:', error);
    }
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// app.use('/scripts', express.static(path.join(__dirname, 'scripts'))); // ปิดการเข้าถึงตรงๆ เพื่อความปลอดภัย

// --- API Endpoints ---
app.get('/verify', async (req, res) => {
    const { key, hwid, scriptName } = req.query;

    if (!key || !hwid) {
        return res.status(400).json({ success: false, message: 'Missing key or hwid' });
    }

    try {
        const result = await mysqlDb.verifyKey(key, hwid, scriptName);
        
        if (result.is_automatic_ban) {
            sendBanWebhook(result.discord_id, result.key_string, result.hwid1, result.hwid2, result.reason);
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/loader', (req, res) => {
    // ส่งไฟล์ loader.lua ทันทีเพื่อให้ตัวรันดึงข้อมูลได้ง่ายขึ้น
    res.sendFile(path.join(__dirname, 'scripts', 'loader.lua'));
});

// --- Secure Script Serving ---
app.get('/api/get-script', async (req, res) => {
    const { key, hwid, scriptName } = req.query;

    if (!key || !hwid || !scriptName) {
        return res.status(400).send("Access Denied: Missing parameters");
    }

    try {
        // ตรวจสอบความถูกต้องของ Key และ HWID (ผ่าน mysql_db.js)
        const auth = await mysqlDb.verifyKey(key, hwid, scriptName);
        if (!auth.success) {
            return res.status(401).send("Access Denied: " + auth.message);
        }

        // ป้องกัน Path Traversal
        const safeScriptName = path.basename(scriptName);
        const scriptPath = path.join(__dirname, 'scripts', safeScriptName);

        if (fs.existsSync(scriptPath)) {
            const content = fs.readFileSync(scriptPath, 'utf8');
            res.send(content);
        } else {
            res.status(404).send("Script Not Found");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log(`API is running on port ${port}`);
});

// --- Discord Bot ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('genkey')
        .setDescription('สร้าง Key ใหม่ (แอดมินเท่านั้น)')
        .addIntegerOption(option =>
            option.setName('hours')
                .setDescription('จำนวนชั่วโมงที่คีย์จะหมดอายุ (ค่าเริ่มต้น 12)')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('mykey')
        .setDescription('ดูข้อมูล Key ของคุณ')
        .addStringOption(option =>
            option.setName('key')
                .setDescription('กรอก Key ที่ต้องการตรวจสอบ')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('setup-panel')
        .setDescription('ตั้งค่า Panel สำหรับรับ Key (แอดมินเท่านั้น)'),
    new SlashCommandBuilder()
        .setName('obfuscate')
        .setDescription('เข้ารหัสสคริปต์ฟรีด้วย OSX ENCRYPTION VERSION I (อัพเดตเมื่อ 26-03-2569)')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('ไฟล์ .lua ที่ต้องการพรางโค้ด')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('allkeys')
        .setDescription('ดูจำนวนผู้ใช้งานและรายชื่อ Key ทั้งหมด (แอดมินเท่านั้น)'),
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('แบนผู้ใช้งาน (แอดมินเท่านั้น)')
        .addUserOption(option => option.setName('user').setDescription('ผู้ที่ต้องการแบน').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('เหตุผลในการแบน').setRequired(true)),
    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('ปลดแบนผู้ใช้งาน (แอดมินเท่านั้น)')
        .addUserOption(option => option.setName('user').setDescription('ผู้ที่ต้องการปลดแบน').setRequired(true)),
    new SlashCommandBuilder()
        .setName('checkvip')
        .setDescription('เช็คยศ VIP และสิทธิ์ของคุณ')
        .addUserOption(option => option.setName('user').setDescription('เลือกผู้ใช้ที่ต้องการเช็ค (เว้นว่างไว้เพื่อเช็คของตัวเอง)').setRequired(false)),
    new SlashCommandBuilder()
        .setName('removeallkey')
        .setDescription('ลบคีย์ทั้งหมดที่กำลังใช้งานอยู่ (ยกเว้นผู้ที่ถูกแบน) - แอดมินเท่านั้น'),
    new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('ดูรายชื่อผู้ใช้งานที่ถูกแบนทั้งหมด (แอดมินเท่านั้น)'),
    new SlashCommandBuilder()
        .setName('unbanall')
        .setDescription('ปลดแบนผู้ใช้งานทั้งหมดในระบบ (แอดมินเท่านั้น)')
].map(command => command.toJSON());

// สิทธิ์ VIP และระยะเวลา (วินาที) หรือชั่วโมง
// เปลี่ยน ID เหล่านี้เป็น ID จริงจาก Discord ของคุณ
const VIP_CONFIG = {
    VIP1_ROLE_ID: '1487485753624625313', // แทนที่ด้วย ID จริง
    VIP2_ROLE_ID: '1491112063223726221', // แทนที่ด้วย ID จริง
    VIP3_ROLE_ID: '1491112244833157251', // แทนที่ด้วย ID จริง
    DURATIONS: {
        DEFAULT: 12,      // 12 ชม
        VIP1: 24 * 7,     // 7 วัน
        VIP2: 24 * 15,    // 15 วัน
        VIP3: 24 * 365 * 99 // ถาวร (99 ปี)
    }
};

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} Is Ready!`);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Global commands
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully reloaded GLOBAL application (/) commands.');

        // Guild-specific commands (for instant update in the first server the bot is in)
        const guilds = await client.guilds.fetch();
        for (const guild of guilds.values()) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id),
                { body: commands },
            );
            console.log(`Successfully reloaded commands for Guild: ${guild.id}`);
        }
    } catch (error) {
        console.error('Error refreshing commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'genkey') {
            // Check for Administrator permission
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
            }

            const hours = interaction.options.getInteger('hours') || 12;
            try {
                const { createKey } = require('./database');
                const { keyString, expiresAt } = await createKey(null, hours);
                await interaction.reply({
                    content: `✅ สร้าง Key สำเร็จ!\n**Key:** \`${keyString}\`\n**วันหมดอายุ:** ${new Date(expiresAt).toLocaleString('th-TH')}\n**ระยะเวลา:** ${hours} ชั่วโมง`,
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการสร้าง Key', ephemeral: true });
            }
        }

        if (interaction.commandName === 'setup-panel') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
            }

            const channelId = process.env.PANEL_CHANNEL_ID;
            const channel = await client.channels.fetch(channelId);

            if (!channel) {
                return await interaction.reply({ content: '❌ ไม่พบช่องที่ระบุใน .env', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('[✧] : 𝗢𝗦𝗫 𝗛𝗨𝗕 𝗣𝗔𝗡𝗘𝗟 | ระบบจัดการข้อมูลผู้ใช้งาน!')
                .setDescription('```ansi\n\u001b[1;2m\u001b[1;33mสิทธิพิเศษสำหรับ VIP ของ OSX HUB!\u001b[0m\u001b[0m\n\u001b[2;33m♔\u001b[0m \u001b[2;35mรับการอัพเดตสคริปต์เเละเข้าทดสอบใช้งานก่อนใคร\u001b[0m\n\u001b[2;33m\u001b[2;33m♔\u001b[0m\u001b[2;33m\u001b[0m \u001b[2;35mรับคีย์สำหรับสมาชิก VIP ไม่ต้องกด KEY ใหม่ทุกวัน\u001b[0m\n\u001b[2;33m♔\u001b[0m \u001b[2;35mมีช่องทางพิเศษสำหรับติดต่อเเอดมินหากมีเรื่องเร่งด่วน\u001b[0m\n\u001b[2;33m♔\u001b[0m \u001b[2;35mรับเครื่องมือทำโปร Roblox ฟรีอัพเดตตลอดไม่ต้องไปหาเอง\u001b[0m\n\u001b[2;33m♔\u001b[0m \u001b[2;35mมีทริกการทำโปรเเแบบฉบับเร่งด่วนไม่ งง เข้าใจง่าย\u001b[0m\n\n```\n```ansi\n\u001b[1;2m\u001b[1;31mระบบ OSX PANEL มีไว้ทำมัย?\u001b[0m\u001b[0m\n\u001b[2;32m↪︎ สำหรับกดรับ KEY ฟรีสำหรับใช้งานสคริปต์ของเรา\n↪︎ สำหรับยืนยันตัวตนผู้ใช้งานเเละป้องกันการเเจกสคริปต์\n↪︎ เพื่อการจัดการที่ง่ายต่อเเอดมิน\n↪︎ เพื่อตรวจสอบยอดการใช้งานสคริปต์\u001b[0m\n```\n```ansi\n\u001b[1;2m\u001b[1;31mวิธีรับคีย์สำหรับใช้งานสคริปต์ในค่ายของเรา?\u001b[0m\u001b[0m\n\u001b[2;32m1. กดปุ่ม สร้างคีย์ \n2. รอรับ KEY เเล้วนำไปใส่สคริปต์ตอนรัน\n3. พร้อมใช้งาน Enjoy ได้ทันที\u001b[0m\n```')
                .setColor(59901)
                .setFooter({
                    text: '© 2026 Osx Hub. All rights reserved.',
                    iconURL: 'https://media.discordapp.net/attachments/1340515849219604520/1485223492516446318/ChatGPT_Image_22_.._2569_01_29_45.png?ex=69c115aa&is=69bfc42a&hm=65e0eb7a1d66da386960e00c6532a5e3b53d9ec577939c6fc8a6662e29c672ba&=&format=webp&quality=lossless&width=978&height=978'
                })
                .setImage('https://media.discordapp.net/attachments/1340515849219604520/1483580155770437682/standard.gif?ex=69c109f0&is=69bfb870&hm=aae526a492b3d64231b186e32ee4124aec4fe06560511ee7c19f5c1050bd2b2e&=');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('get_key')
                        .setLabel('สร้างคีย์')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🔑'),
                    new ButtonBuilder()
                        .setCustomId('admin_manage')
                        .setLabel('จัดการคีย์')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🛠️'),
                    new ButtonBuilder()
                        .setCustomId('check_vip_status')
                        .setLabel('ดูสถานะสมาชิก')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('💎'),
                    new ButtonBuilder()
                        .setCustomId('reset_hwid')
                        .setLabel('รีเซ็ต HWID')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔄'),
                    new ButtonBuilder()
                        .setLabel('DISCORD OSX HUB')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.gg/BXM5WEkD3J')
                );

            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: '✅ ตั้งค่า Panel เรียบร้อยแล้วในช่องที่ระบุ!', ephemeral: true });
        }

        if (interaction.commandName === 'mykey') {
            const keyString = interaction.options.getString('key');

            try {
                const info = await require('./database').getKeyInfo(keyString);

                if (!info) {
                    return await interaction.reply({ content: '❌ ไม่พบข้อมูล Key นี้ในระบบ', ephemeral: true });
                }

                const status = info.is_active ? '🟢 ใช้งานได้' : '🔴 ปิดใช้งาน';
                const hwidStatus = info.hwid ? `\`${info.hwid}\`` : 'ยังไม่ได้เชื่อมต่อ';

                await interaction.reply({
                    content: `ℹ️ **ข้อมูล Key:**\n**Key:** \`${info.key_string}\`\n**สถานะ:** ${status}\n**หมดอายุ:** ${new Date(info.expires_at).toLocaleDateString()}\n**HWID:** ${hwidStatus}`,
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการดึงข้อมูล', ephemeral: true });
            }
        } else if (interaction.commandName === 'obfuscate') {
            // Check for Administrator permission
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
            }

            const attachment = interaction.options.getAttachment('file');
            if (!attachment.name.endsWith('.lua')) {
                return await interaction.reply({ content: '❌ กรุณาอัปโหลดไฟล์นามสกุล .lua เท่านั้น', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const { obfuscate } = require('./advanced_obfuscator');
                const axios = require('axios'); // ต้องมี axios ในโปรเจกต์

                const response = await axios.get(attachment.url);
                const originalCode = response.data;

                const protectedCode = obfuscate(originalCode);

                const tempFileName = `protected_${attachment.name}`;
                const tempPath = path.join(__dirname, 'scripts', tempFileName);

                fs.writeFileSync(tempPath, protectedCode);

                await interaction.editReply({
                    content: `✅ **พรางโค้ดสำเร็จ!**\nไฟล์: \`${attachment.name}\`\nประเภท: \`OSX Ghost Style v2\``,
                    files: [tempPath]
                });

                // ลบไฟล์ชั่วคราวหลังจากส่ง (รอ 5 วินาทีเพื่อให้แน่ใจว่าส่งเสร็จ)
                setTimeout(() => {
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                }, 5000);

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในกระบวนการพรางโค้ด' });
            }
        } else if (interaction.commandName === 'allkeys') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
            }

            try {
                const { getAllKeys } = require('./database');
                const allKeysRaw = await getAllKeys();

                // คัดกรองเอาเฉพาะคีย์ที่ยังใช้งานได้และยังไม่หมดอายุ
                const activeKeys = allKeysRaw.filter(k => k.is_active === 1 && new Date(k.expires_at) > new Date());
                const totalActive = activeKeys.length;
                const totalUsers = activeKeys.filter(k => k.hwid !== null).length;

                if (totalActive === 0) {
                    return await interaction.reply({ content: '❌ ไม่มีคีย์ที่กำลังใช้งานได้อยู่ในส่วนของระบบ', ephemeral: true });
                }

                const summaryStr = `- จำนวน Key ที่ยังใช้งานได้: **${totalActive}**\n- จำนวนผู้ใช้งาน (ผูก HWID แล้ว): **${totalUsers}**`;

                let keyListStr = activeKeys.map((k, index) => {
                    const owner = k.discord_id ? `<@${k.discord_id}>` : '*แอดมินสร้าง*';
                    const hwidStatus = k.hwid ? '✅ ผูกแล้ว' : '❌ ยังไม่ผูก';
                    const expireDate = new Date(k.expires_at).toLocaleString('th-TH');
                    return `**${index + 1}.** \`${k.key_string}\`\n👤 เจ้าของ: ${owner} | 💻 HWID: ${hwidStatus}\n⏳ หมดอายุ: ${expireDate}\n`;
                }).join('\n');

                if (keyListStr.length > 3800) {
                    const tempFilePath = path.join(__dirname, 'active_keys.txt');
                    const fileContent = `สถิติ:\n- จำนวน Key ที่ยังใช้งานได้: ${totalActive}\n- จำนวนผู้ใช้งาน (ผูก HWID แล้ว): ${totalUsers}\n\nรายชื่อ Key:\n${activeKeys.map((k, index) => {
                        const ownerInfo = k.discord_id ? k.discord_id : 'Admin Generated';
                        return `${index + 1}. Key: ${k.key_string} | Owner Discord ID: ${ownerInfo} | HWID: ${k.hwid ? 'Linked (' + k.hwid + ')' : 'Not Linked'} | Expires: ${new Date(k.expires_at).toLocaleString('th-TH')}`;
                    }).join('\n')}`;

                    fs.writeFileSync(tempFilePath, fileContent);

                    await interaction.reply({
                        content: `📊 **ข้อมูลสถานะระบบ**\n${summaryStr}\n\n*เนื่องจากรายชื่อ Key มีความยาวมาก ไฟล์ข้อมูลได้ถูกแนบมาด้านล่างนี้:*`,
                        ephemeral: true,
                        files: [tempFilePath]
                    });

                    setTimeout(() => {
                        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                    }, 5000);
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('📊 ข้อมูลจำนวนผู้ใช้งานและ Key ทั้งหมด')
                        .setColor(0x00FF00)
                        .setDescription(`${summaryStr}\n\n**รายชื่อ Key:**\n${keyListStr}`);

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการดึงข้อมูล', ephemeral: true });
            }
        } else if (interaction.commandName === 'ban') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ เฉพาะแอดมินเท่านั้นที่สามารถใช้งานคำสั่งนี้ได้', ephemeral: true });
            }

            const target = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');

            const { banUser, getUserActiveKey } = require('./database');
            
            // Try to get their active key before banning to show in webhook
            const activeKey = await getUserActiveKey(target.id);
            const keyString = activeKey ? activeKey.key_string : "N/A (Admin Manual Ban)";
            const hwid1 = activeKey ? activeKey.hwid : "N/A";

            const success = banUser(target.id, reason);

            if (success) {
                // Send notification to webhook
                sendBanWebhook(target.id, keyString, hwid1, "N/A", reason);

                const embed = new EmbedBuilder()
                    .setTitle('🚫 แบนผู้ใช้สำเร็จ')
                    .setDescription(`ผู้ใช้ <@${target.id}> ถูกจำกัดการเข้าถึงระบบ\n**เหตุผล:** ${reason}`)
                    .setColor(0xFF0000)
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการแบนผู้ใช้', ephemeral: true });
            }
        } else if (interaction.commandName === 'unban') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ เฉพาะแอดมินเท่านั้นที่สามารถใช้งานคำสั่งนี้ได้', ephemeral: true });
            }

            const target = interaction.options.getUser('user');
            const { unbanUser } = require('./database');
            const success = unbanUser(target.id);

            if (success) {
                const embed = new EmbedBuilder()
                    .setTitle('✅ ปลดแบนสำเร็จ')
                    .setDescription(`ผู้ใช้ <@${target.id}> สามารถกลับมาใช้งานระบบได้ตามปกติ`)
                    .setColor(0x00FF00)
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการปลดแบน', ephemeral: true });
            }
        } else if (interaction.commandName === 'checkvip') {
            const target = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(target.id);
            const { getUserActiveKey } = require('./database');

            let vipLevel = "Standard (ทั่วไป)";
            let durationStr = "12 ชม.";

            if (member.roles.cache.has(VIP_CONFIG.VIP3_ROLE_ID)) {
                const role = member.guild.roles.cache.get(VIP_CONFIG.VIP3_ROLE_ID);
                vipLevel = role ? role.name : "VIP 3";
                durationStr = "ถาวร";
            } else if (member.roles.cache.has(VIP_CONFIG.VIP2_ROLE_ID)) {
                const role = member.guild.roles.cache.get(VIP_CONFIG.VIP2_ROLE_ID);
                vipLevel = role ? role.name : "VIP 2";
                durationStr = "15 วัน";
            } else if (member.roles.cache.has(VIP_CONFIG.VIP1_ROLE_ID)) {
                const role = member.guild.roles.cache.get(VIP_CONFIG.VIP1_ROLE_ID);
                vipLevel = role ? role.name : "VIP 1";
                durationStr = "7 วัน";
            }

            const activeKey = await getUserActiveKey(target.id);
            const keyDisplay = activeKey ? activeKey.key_string : "ไม่มีคีย์ที่กำลังใช้งาน";
            let hwidDisplay = "ยังไม่พบข้อมูลการรันสคริปต์";
            if (activeKey && activeKey.hwid && activeKey.hwid !== "Unknown") {
                hwidDisplay = activeKey.hwid;
            }

            const embed = new EmbedBuilder()
                .setTitle('<a:VipGif:1491096566331736115> **ข้อมูลการเป็นสมาชิกของคุณ!**')
                .setDescription(`** ชื่อผู้ใช้งาน ⤵︎**\n\`\`\`\n${target.username}\n\`\`\`\n**ระดับยศของท่าน ⤵︎**\n\`\`\`\n${vipLevel}\n\`\`\`\n**สิทธิ์การขยายระยะเวลาคีย์ที่ได้รับ ⤵︎**\n\`\`\`\nทุกครั้งเมื่อกดคีย์จะได้รับคีย์ ${durationStr}\n\`\`\`\n** คีย์ที่กำลังใช้งานอยู่ ⤵︎**\n\`\`\`\n${keyDisplay}\n\`\`\`\n** เลข HWID ของเครื่องที่ใช้งานคีย์อยู่ ⤵︎**\n\`\`\`\n${hwidDisplay}\n\`\`\`\n<a:warning:1491117576644722859> **หากคีย์ของท่านมีปัญหาหรือมีข้อสงสัยโปรดติดต่อเเอดมิน!**`)
                .setColor(41983)
                .setThumbnail('https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless')
                .setFooter({
                    text: '© 2026 Osx Hub. All rights reserved.',
                    iconURL: 'https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless'
                });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (interaction.commandName === 'removeallkey') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
            }

            try {
                const { removeAllKeysExceptBanned } = require('./database');
                const result = await removeAllKeysExceptBanned();

                await interaction.reply({
                    content: `🛒 **ระบบทำการล้างคีย์ทั้งหมดเรียบร้อยแล้ว!**\n- จำนวนคีย์ที่ถูกลบ: \`${result.changes}\` คีย์\n- *หมายเหตุ: คีย์ของผู้ที่ถูกแบนยังคงอยู่ในระบบเพื่อเป็นหลักฐาน*`,
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการลบคีย์ทั้งหมด', ephemeral: true });
            }
        } else if (interaction.commandName === 'banlist') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
            }

            try {
                const { getBannedUsers } = require('./database');
                const bannedUsers = await getBannedUsers();

                if (bannedUsers.length === 0) {
                    return await interaction.reply({ content: '✅ ไม่พบรายชื่อผู้ที่ถูกแบนในขณะนี้', ephemeral: true });
                }

                let listStr = bannedUsers.map((u, index) => {
                    return `**${index + 1}.** <@${u.discord_id}> (${u.discord_id})\n**เหตุผล:** ${u.ban_reason || 'ไม่ระบุ'}`;
                }).join('\n\n');

                if (listStr.length > 4000) {
                    const tempFilePath = path.join(__dirname, 'ban_list.txt');
                    const fileContent = bannedUsers.map((u, index) => {
                        return `${index + 1}. Discord ID: ${u.discord_id} | Reason: ${u.ban_reason || 'N/A'}`;
                    }).join('\n');
                    
                    fs.writeFileSync(tempFilePath, fileContent);
                    await interaction.reply({
                        content: `🚫 **รายชื่อผู้ที่ถูกแบนทั้งหมด (${bannedUsers.length} คน)**\n*ข้อมูลยาวเกินไป ไฟล์ถูกแนบด้านล่าง:*`,
                        ephemeral: true,
                        files: [tempFilePath]
                    });
                    setTimeout(() => fs.unlinkSync(tempFilePath), 5000);
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle(`🚫 รายชื่อผู้ที่ถูกแบนทั้งหมด (${bannedUsers.length} คน)`)
                        .setColor(0xFF0000)
                        .setDescription(listStr)
                        .setTimestamp();
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลรายชื่อแบน', ephemeral: true });
            }
        } else if (interaction.commandName === 'unbanall') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
            }

            try {
                const { unbanAllUsers } = require('./database');
                const result = await unbanAllUsers();

                if (result.success) {
                    await interaction.reply({
                        content: `✅ **ปลดแบนผู้ใช้งานทั้งหมดเรียบร้อยแล้ว!**\n- จำนวนผู้ที่ถูกปลดแบน: \`${result.changes}\` คน`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ content: `❌ เกิดข้อผิดพลาด: ${result.error}`, ephemeral: true });
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการปลดแบนทั้งหมด', ephemeral: true });
            }
        }
    }

    // Handle Button Interactions
    if (interaction.isButton()) {
        if (interaction.customId === 'get_key') {
            try {
                const { getUserActiveKey, createKey, isUserBanned } = require('./database');
                const discordId = interaction.user.id;

                // Check for ban
                const banStatus = isUserBanned(discordId);
                if (banStatus.banned) {
                    // ลอจิกสำหรับดึงข้อมูล HWID 1 เเละ 2 จากเหตุผลที่เก็บไว้ (ถ้ามี)
                    let hwid1 = "ไม่พบบันทึก", hwid2 = "ไม่พบบันทึก", offendingKey = "ไม่พบบันทึก";
                    const reason = banStatus.reason || "ไม่ได้ระบุ";

                    if (reason.includes("First HWID:")) {
                        const match = reason.match(/First HWID: (.*?), Second HWID: (.*?)\)/);
                        if (match) {
                            hwid1 = match[1];
                            hwid2 = match[2];
                        }
                    }

                    // ดึงคีย์ล่าสุดของผู้ใช้มาเพื่อเเสดงผล
                    const { getAllKeys } = require('./database');
                    const allKeys = await getAllKeys();
                    const userKey = allKeys.find(k => k.discord_id === discordId);
                    if (userKey) offendingKey = userKey.key_string;

                    const embed = new EmbedBuilder()
                        .setTitle('<:emojigg_Ban:1491230899914801164> **คุณถูกเเบนจากระบบจึงไม่สามารถใช้งานได้!**')
                        .setDescription(`** ชื่อผู้ใช้งาน ⤵︎**\n\`\`\`\n${interaction.user.username}\n\`\`\`\n**เหตุผลที่ถูกเเบน ⤵︎**\n\`\`\`\n${reason}\n\`\`\`\n** คีย์ที่มีการใช้งานผิดปกติ ⤵︎**\n\`\`\`\n${offendingKey}\n\`\`\`\n** เลข HWID ของเครื่องที่ใช้งานคนเเรก ⤵︎**\n\`\`\`\n${hwid1}\n\`\`\`\n** เลข HWID ของเครื่องที่ใช้งานคนที่สอง ⤵︎**\n\`\`\`\n${hwid2}\n\`\`\`\n<a:warning:1491117576644722859> **หากคีย์ของท่านมีปัญหาหรือมีข้อสงสัยโปรดติดต่อเเอดมิน!**`)
                        .setColor(16711680)
                        .setThumbnail('https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless')
                        .setFooter({
                            text: '© 2026 Osx Hub. All rights reserved.',
                            iconURL: 'https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless'
                        });

                    return await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                // Check if user already has an active key
                const activeKey = await getUserActiveKey(discordId);

                if (activeKey) {
                    const expiresAt = new Date(activeKey.expires_at);
                    const now = new Date();
                    const diffMs = expiresAt - now;

                    const hours = Math.floor(diffMs / 3600000);
                    const minutes = Math.floor((diffMs % 3600000) / 60000);
                    const seconds = Math.floor((diffMs % 60000) / 1000);

                    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                    // DM the key to the user
                    interaction.user.send(activeKey.key_string).catch(() => {
                        console.log(`Could not send DM to ${interaction.user.tag}`);
                    });

                    const embed = new EmbedBuilder()
                        .setTitle('<a:LoveKey:1491214136401727541> **คุณมีคีย์อยู่เเล้วไม่จำเป็นต้องสร้างใหม่ครับ!**')
                        .setDescription(`** สามารถคัดลอกคีย์นี้ไปใช้งานได้เลย ⤵︎**\n\`\`\`\n${activeKey.key_string}\n\`\`\`\nเวลาที่เหลือของคีย์ ⤵︎\n\`\`\`\n${timeStr}\n\`\`\`\n<a:warning:1491117576644722859> **หากคีย์ของท่านหมดอายุสามารถกลับมารับใหม่ได้ฟรีตลอด!**`)
                        .setColor(41983)
                        .setThumbnail('https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless')
                        .setFooter({
                            text: '© 2026 Osx Hub. All rights reserved.',
                            iconURL: 'https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless'
                        });

                    return await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                // Determine duration based on roles
                let durationHours = VIP_CONFIG.DURATIONS.DEFAULT;
                let vipNote = "12 ชม.";

                if (interaction.member.roles.cache.has(VIP_CONFIG.VIP3_ROLE_ID)) {
                    durationHours = VIP_CONFIG.DURATIONS.VIP3;
                    vipNote = "ถาวร (VIP 3)";
                } else if (interaction.member.roles.cache.has(VIP_CONFIG.VIP2_ROLE_ID)) {
                    durationHours = VIP_CONFIG.DURATIONS.VIP2;
                    vipNote = "15 วัน (VIP 2)";
                } else if (interaction.member.roles.cache.has(VIP_CONFIG.VIP1_ROLE_ID)) {
                    durationHours = VIP_CONFIG.DURATIONS.VIP1;
                    vipNote = "7 วัน (VIP 1)";
                }

                // Create key
                const { keyString, expiresAt } = await createKey(discordId, durationHours);

                // DM the key to the user
                interaction.user.send(keyString).catch(() => {
                    console.log(`Could not send DM to ${interaction.user.tag}`);
                });

                const embed = new EmbedBuilder()
                    .setTitle('<a:LoveKey:1491214136401727541> **ระบบทำการสร้างคีย์ใช้งานสคริปต์สำเร็จ!**')
                    .setDescription(`** สามารถคัดลอกคีย์นี้ไปใช้งานได้เลย ⤵︎**\n\`\`\`\n${keyString}\n\`\`\`\nสามารถใช้งานคีย์นี้ได้ถึงวันที่ ⤵︎\n\`\`\`\n${new Date(expiresAt).toLocaleString('th-TH')}\n\`\`\`\n<a:warning:1491117576644722859> **หากคีย์ของท่านหมดอายุสามารถกลับมารับใหม่ได้ฟรีตลอด!**`)
                    .setColor(1376000)
                    .setThumbnail('https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless')
                    .setFooter({
                        text: '© 2026 Osx Hub. All rights reserved.',
                        iconURL: 'https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless'
                    });

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ ไม่สามารถสร้าง Key ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง', ephemeral: true });
            }
        }
        if (interaction.customId === 'check_vip_status') {
            try {
                const target = interaction.user;
                const member = await interaction.guild.members.fetch(target.id);
                const { getUserActiveKey } = require('./database');

                let vipLevel = "Standard (ทั่วไป)";
                let durationStr = "12 ชม.";

                if (member.roles.cache.has(VIP_CONFIG.VIP3_ROLE_ID)) {
                    const role = member.guild.roles.cache.get(VIP_CONFIG.VIP3_ROLE_ID);
                    vipLevel = role ? role.name : "VIP 3";
                    durationStr = "ถาวร";
                } else if (member.roles.cache.has(VIP_CONFIG.VIP2_ROLE_ID)) {
                    const role = member.guild.roles.cache.get(VIP_CONFIG.VIP2_ROLE_ID);
                    vipLevel = role ? role.name : "VIP 2";
                    durationStr = "15 วัน";
                } else if (member.roles.cache.has(VIP_CONFIG.VIP1_ROLE_ID)) {
                    const role = member.guild.roles.cache.get(VIP_CONFIG.VIP1_ROLE_ID);
                    vipLevel = role ? role.name : "VIP 1";
                    durationStr = "7 วัน";
                }

                const activeKey = await getUserActiveKey(target.id);
                const keyDisplay = activeKey ? activeKey.key_string : "ไม่มีคีย์ที่กำลังใช้งาน";

                if (activeKey) {
                    // DM the key to the user
                    interaction.user.send(activeKey.key_string).catch(() => {
                        console.log(`Could not send DM to ${interaction.user.tag}`);
                    });
                }

                let hwidDisplay = "ยังไม่พบข้อมูลการรันสคริปต์";
                if (activeKey && activeKey.hwid && activeKey.hwid !== "Unknown") {
                    hwidDisplay = activeKey.hwid;
                }

                const embed = new EmbedBuilder()
                    .setTitle('<a:VipGif:1491096566331736115> **ข้อมูลการเป็นสมาชิกของคุณ!**')
                    .setDescription(`** ชื่อผู้ใช้งาน ⤵︎**\n\`\`\`\n${target.username}\n\`\`\`\n**ระดับยศของท่าน ⤵︎**\n\`\`\`\n${vipLevel}\n\`\`\`\n**สิทธิ์การขยายระยะเวลาคีย์ที่ได้รับ ⤵︎**\n\`\`\`\nทุกครั้งเมื่อกดคีย์จะได้รับคีย์ ${durationStr}\n\`\`\`\n** คีย์ที่กำลังใช้งานอยู่ ⤵︎**\n\`\`\`\n${keyDisplay}\n\`\`\`\n** เลข HWID ของเครื่องที่ใช้งานคีย์อยู่ ⤵︎**\n\`\`\`\n${hwidDisplay}\n\`\`\`\n<a:warning:1491117576644722859> **หากคีย์ของท่านมีปัญหาหรือมีข้อสงสัยโปรดติดต่อเเอดมิน!**`)
                    .setColor(41983)
                    .setThumbnail('https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless')
                    .setFooter({
                        text: '© 2026 Osx Hub. All rights reserved.',
                        iconURL: 'https://media.discordapp.net/attachments/1485621966575501312/1488393678757167287/logo512v1.png?ex=69d68162&is=69d52fe2&hm=9f95daada47fac78f768a50a1a01f451d9ec37cee154756288daddacd543abef&=&format=webp&quality=lossless'
                    });

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการเช็คระดับ VIP', ephemeral: true });
            }
        }
        if (interaction.customId === 'reset_hwid') {
            try {
                const { isUserBanned, getUserActiveKey, getUserData, resetHWID } = require('./database');
                const discordId = interaction.user.id;

                // Check for ban
                const banStatus = isUserBanned(discordId);
                if (banStatus.banned) {
                    return await interaction.reply({ content: '❌ คุณถูกแบนจากระบบ ไม่สามารถรีเซ็ต HWID ได้', ephemeral: true });
                }

                // Check for active key
                const activeKey = await getUserActiveKey(discordId);
                if (!activeKey) {
                    return await interaction.reply({ content: '❌ คุณยังไม่มีคีย์ที่กำลังใช้งานอยู่', ephemeral: true });
                }

                if (!activeKey.hwid) {
                    return await interaction.reply({ content: '❌ คีย์ของคุณยังไม่ได้ผูกกับ HWID ใดๆ', ephemeral: true });
                }

                // Check VIP status for cooldown
                const member = await interaction.guild.members.fetch(discordId);
                const isVip = member.roles.cache.has(VIP_CONFIG.VIP1_ROLE_ID) || 
                              member.roles.cache.has(VIP_CONFIG.VIP2_ROLE_ID) || 
                              member.roles.cache.has(VIP_CONFIG.VIP3_ROLE_ID);
                
                const cooldownMs = isVip ? 30 * 60 * 1000 : 60 * 60 * 1000; // 30 mins for VIP, 1 hour for others
                const cooldownLabel = isVip ? "30 นาที (VIP)" : "1 ชั่วโมง";

                const userData = await getUserData(discordId);
                if (userData && userData.last_hwid_reset) {
                    const lastReset = new Date(userData.last_hwid_reset);
                    const now = new Date();
                    const diff = now - lastReset;

                    if (diff < cooldownMs) {
                        const remainingMs = cooldownMs - diff;
                        const remainingMins = Math.ceil(remainingMs / 60000);
                        return await interaction.reply({ 
                            content: `⏳ **คุณกำลังติดคูลดาวน์!**\nกรุณารออีก **${remainingMins} นาที** จึงจะสามารถรีเซ็ต HWID ได้อีกครั้ง\n(คูลดาวน์ของคุณคือ ${cooldownLabel})`, 
                            ephemeral: true 
                        });
                    }
                }

                // Perform reset
                const result = await resetHWID(discordId);
                if (result.success) {
                    const embed = new EmbedBuilder()
                        .setTitle('✅ รีเซ็ต HWID สำเร็จ!')
                        .setDescription(`ระบบได้ทำการรีเซ็ต HWID สำหรับคีย์ \`${activeKey.key_string}\` เรียบร้อยแล้ว\n\n**หมายเหตุ:**\n- คุณสามารถนำคีย์ไปใช้กับเครื่องใหม่ได้ทันที\n- คูลดาวน์ครั้งต่อไป: ${cooldownLabel}`)
                        .setColor(0x00FF00)
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
                }

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการรีเซ็ต HWID', ephemeral: true });
            }
        }
        if (interaction.customId === 'admin_manage') {
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({ content: '❌ เฉพาะแอดมินเท่านั้นที่สามารถใช้งานส่วนนี้ได้', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('manage_key_modal')
                .setTitle('ระบบจัดการคีย์ (Admin Only)');

            const keyInput = new TextInputBuilder()
                .setCustomId('key_to_delete')
                .setLabel("กรอก Key ที่ต้องการลบ (Revoke)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('ตัวอย่าง: ABC123XYZ...')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(keyInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }
    }

    // Handle Modal Submissions
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'manage_key_modal') {
            const keyString = interaction.fields.getTextInputValue('key_to_delete');

            try {
                const { deleteKey, getKeyInfo } = require('./database');

                const keyInfo = await getKeyInfo(keyString);
                if (!keyInfo) {
                    return await interaction.reply({ content: `❌ ไม่พบ Key \`${keyString}\` ในระบบ`, ephemeral: true });
                }

                await deleteKey(keyString);
                await interaction.reply({
                    content: `✅ ลบ Key \`${keyString}\` ออกจากระบบเรียบร้อยแล้ว!\n*(HWID และโควต้า 12 ชม. ของเจ้าของเดิมถูกรีเซ็ต)*`,
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการลบ Key', ephemeral: true });
            }
        }
    }
});

// Start the bot only if token is provided
if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'your_token_here') {
    client.login(process.env.DISCORD_TOKEN);
} else {
    console.log('DISCORD_TOKEN ยังไม่ได้ตั้งค่า กรุณาเช็คในไฟล์ .env');
}
