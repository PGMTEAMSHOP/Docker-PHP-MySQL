# 🐳 Docker PHP + MySQL + phpMyAdmin

สภาพแวดล้อมสำหรับพัฒนา PHP ด้วย Docker ประกอบด้วย Apache, MySQL และ phpMyAdmin พร้อมใช้งานในไม่กี่คำสั่ง

---

## 📦 Stack

| Service      | Image                  | Port        |
|--------------|------------------------|-------------|
| PHP + Apache | `php:8.3-apache`       | `8000`      |
| MySQL        | `mysql:latest`         | `3306`      |
| phpMyAdmin   | `phpmyadmin`           | `8080`      |

---

## 🗂️ โครงสร้างโปรเจกต์

```
Docker-PHP-MySQL/
├── dockerfile            # Custom PHP 8.3 + Apache image
├── docker-compose.yml    # กำหนด services ทั้งหมด
├── src/                  # ไฟล์ PHP ของคุณ (mount เข้า container)
│   └── index.php         # ไฟล์เริ่มต้น
└── README.md
```

> 📁 วางไฟล์ PHP ทั้งหมดไว้ในโฟลเดอร์ `src/`

---

## ⚙️ การตั้งค่า (Configuration)

### PHP + Apache (`dockerfile`)
- Base image: **PHP 8.3 Apache**
- ติดตั้ง PHP extensions: `mysqli`, `pdo`, `pdo_mysql`
- เปิดใช้งาน Apache `mod_rewrite` สำหรับ Clean URL / Routing

### MySQL (`docker-compose.yml`)
| Variable              | Value           |
|-----------------------|-----------------|
| `MYSQL_ROOT_PASSWORD` | `root`          |
| `MYSQL_DATABASE`      | `my_project_db` |

### phpMyAdmin
| Variable       | Value  |
|----------------|--------|
| `PMA_HOST`     | `db`   |
| `PMA_USER`     | `root` |
| `PMA_PASSWORD` | `root` |

---

## 🚀 คำสั่งใช้งาน

### เริ่มต้น (Start)

```bash
# Build image และเริ่มต้น containers ทั้งหมด
docker-compose up --build

# เริ่มต้นแบบ background (detached mode)
docker-compose up --build -d
```

### หยุด (Stop)

```bash
# หยุด containers (ข้อมูลยังคงอยู่)
docker-compose stop

# หยุดและลบ containers
docker-compose down

# หยุด ลบ containers และลบ volumes (ข้อมูล DB จะหายด้วย)
docker-compose down -v
```

### ดู Logs

```bash
# ดู logs ทุก service
docker-compose logs

# ดู logs แบบ real-time
docker-compose logs -f

# ดู logs เฉพาะ service
docker-compose logs -f php-apache
docker-compose logs -f db
docker-compose logs -f phpmyadmin
```

### เข้าไปใน Container (Shell)

```bash
# เข้า shell ใน PHP container
docker exec -it php_apache bash

# เข้า MySQL shell
docker exec -it mysql mysql -u root -p
```

### Build ใหม่

```bash
# Build image ใหม่โดยไม่ใช้ cache
docker-compose build --no-cache

# Restart เฉพาะ service
docker-compose restart php-apache
```

---

## 🌐 URLs

| Service      | URL                                     |
|--------------|-----------------------------------------|
| PHP App      | http://localhost:8000                   |
| phpMyAdmin   | http://localhost:8080                   |

---

## 🗄️ เชื่อมต่อ MySQL จาก PHP

```php
<?php
$host = 'db';                 // ชื่อ service ใน docker-compose
$dbname = 'my_project_db';
$username = 'root';
$password = 'root';

// PDO
$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);

// MySQLi
$conn = new mysqli($host, $username, $password, $dbname);
?>
```

> ⚠️ ใช้ `db` เป็น hostname เพราะ PHP container เชื่อมต่อผ่าน Docker network ภายใน ไม่ใช่ `localhost`

---

## 🛠️ คำสั่ง Docker ที่มีประโยชน์

```bash
# ดู containers ที่กำลังทำงาน
docker ps

# ดู images ทั้งหมด
docker images

# ลบ image ที่ไม่ใช้
docker image prune

# ลบทุกอย่างที่ไม่ใช้ (containers, images, volumes, networks)
docker system prune -a
```

---
