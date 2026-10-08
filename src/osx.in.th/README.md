# OSX HUB

ร้านค้าและระบบสมาชิกสำหรับ OSX HUB ใช้ **Next.js/React** เป็น Frontend, **PHP 8.3 + Apache** เป็น Backend และ **MySQL** เก็บข้อมูล ระบบพัฒนาในเครื่องรัน Next.js บน Windows และรัน PHP กับ MySQL ด้วย Docker Compose

## โครงสร้างหลัก

| ตำแหน่ง | หน้าที่ |
| --- | --- |
| `app/` | หน้าเว็บ Next.js, API Route และเส้นทางหน้า Store/Admin |
| `components/`, `context/`, `hooks/` | UI ที่ใช้ซ้ำ, สถานะสมาชิก/ภาษา และ React Hooks |
| `locales/` | ข้อความภาษาไทยและอังกฤษ |
| `api/` | PHP API, การเชื่อม MySQL และไฟล์ Lua |
| `public/` | รูปภาพ ไฟล์ดาวน์โหลด และไฟล์ที่เว็บให้บริการ |
| `bot-KeyScript/` | Discord Bot, Express API และระบบคีย์ |
| `legacy-vanilla/` | เว็บชุดเดิมที่ใช้ HTML/CSS/JavaScript |

## เริ่มระบบในเครื่อง

เปิด PowerShell แล้วเริ่ม Docker จากโฟลเดอร์หลัก `Docker-MySQL`:

```powershell
docker compose up -d
```

เปิด Next.js จากโฟลเดอร์ `Docker-MySQL\src\osx.in.th`:

```powershell
npm install
npm run dev
```

ไฟล์ `.env.local` และ `.env.example` ในโฟลเดอร์เว็บตั้ง `PHP_BACKEND_URL` สำหรับ Next.js Proxy ไว้แล้ว การเปลี่ยนค่าต้อง Restart Next.js ส่วน PHP รับ `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` และ `DB_PASS` จาก `docker-compose.yml`

## การเชื่อมต่อ

```text
Browser :3000
  → Next.js Proxy
  → PHP/Apache :8000/osx.in.th/api/
  → MySQL Container mysql:3306/osxhub_db
```

Next.js ส่งคำขอ `/api/...` ไป PHP ยกเว้น API Route ที่ Next.js จัดการเอง เช่นสถานะ Executor และเส้นทางชำระเงิน ส่วน PHP ติดต่อ MySQL ด้วยชื่อ Service `mysql` ภายใน Docker Network

| บริการ | ที่อยู่ |
| --- | --- |
| Frontend | http://localhost:3000 |
| PHP API ผ่าน Frontend | http://localhost:3000/api/scripts.php?action=list |
| PHP API โดยตรง | http://localhost:8000/osx.in.th/api/scripts.php?action=list |
| phpMyAdmin | http://localhost:8080 |
| MySQL จาก Windows | `127.0.0.1:3306` |

## ฐานข้อมูลและข้อมูลใน Docker

Compose ใช้ Volume `mysql_data` เพื่อเก็บข้อมูล MySQL เดิม แอปเชื่อมฐานข้อมูล `osxhub_db`; ค่า `MYSQL_DATABASE` ใช้เฉพาะตอนเริ่ม MySQL ด้วย Volume เปล่า การเปลี่ยนค่านี้ไม่สร้างหรือย้ายฐานข้อมูลใน Volume ที่มีข้อมูลแล้ว

PHP Container ตั้ง `DB_AUTO_MIGRATE=false` เพื่อป้องกันการปรับ Schema และแก้คีย์อัตโนมัติขณะพัฒนา ฐานข้อมูลจึงต้องมีตารางและคอลัมน์ที่แอปต้องใช้ หากต้องเปิด Migration ให้สำรองข้อมูลก่อน แล้วเปลี่ยนค่าตามความเหมาะสม

การเปลี่ยนค่า Environment ของ PHP ให้สร้างเฉพาะ Container PHP ใหม่ โดยคง MySQL Volume เดิม:

```powershell
docker compose up -d --no-deps php-apache
```

หยุดบริการโดยเก็บข้อมูลฐานข้อมูลไว้:

```powershell
docker compose stop
```

หลีกเลี่ยง `docker compose down -v` เพราะคำสั่งนี้ลบ Volume ที่เก็บข้อมูล MySQL ด้วย ค่ารหัสผ่านใน Compose ปัจจุบันเหมาะสำหรับการพัฒนาในเครื่องเท่านั้น อย่านำไปเปิดเป็นฐานข้อมูลสาธารณะ

## คำสั่งที่ใช้บ่อย

```powershell
npm run dev       # เริ่ม Frontend
npm run build     # Build Next.js
npm run start     # เปิด Next.js ที่พอร์ต 3000
npm run lint      # ตรวจโค้ดด้วย ESLint
docker compose ps # ดูสถานะ Container
docker compose logs -f php-apache
docker compose logs -f mysql
```

## หมายเหตุ

- Browser ใช้ Frontend ที่พอร์ต 3000; Session Cookie ส่งผ่าน Proxy ไป PHP
- รูปภาพและไฟล์ดาวน์โหลดมาจาก `public/`; PHP เขียนสลิปลงโฟลเดอร์ Upload ที่ Mount ร่วมกัน
- Discord OAuth และ Cloudflare Turnstile ต้องตั้งค่าโดเมนกับผู้ให้บริการให้ตรงกับการใช้งาน
- Stripe และ Crypto ยังคงขึ้นกับ Environment และ Webhook ตามการตั้งค่าเดิม ระบบนี้ไม่ได้เปิดการรับชำระเงินจริง
- คู่มือรายละเอียดการพัฒนาในเครื่องอยู่ใน [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md)
