FROM php:8.3-apache

# อัปเดตแพ็กเกจ (ถ้าต้องการลงอะไรเพิ่มในอนาคต)
RUN apt-get update

# ติดตั้ง PHP extensions สำหรับเชื่อมต่อ MySQL แบบ mysqli และ pdo
RUN docker-php-ext-install mysqli pdo pdo_mysql && docker-php-ext-enable mysqli pdo_mysql

# เปิดใช้งาน mod_rewrite ของ Apache (สำหรับทำ Clean URL / Routing)
RUN a2enmod rewrite