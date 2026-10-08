'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header section with back button */}
      <div className="flex items-center gap-4">
        <Link
          href="/store"
          className="flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-800 transition-all active:scale-95"
        >
          <i className="fa-solid fa-arrow-left"></i> ย้อนกลับหน้าร้านค้า
        </Link>
        <span className="text-sm font-semibold text-slate-500">
          ข้อตกลงและเงื่อนไขการใช้บริการ
        </span>
      </div>

      {/* Main glassmorphism container */}
      <section className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-6">
        {/* Glow decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="border-b border-slate-800/80 pb-5">
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            ข้อตกลงการใช้บริการและข้อจำกัดความรับผิดชอบทางกฎหมาย (Terms of Service)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-2">
            มีผลบังคับใช้ทันทีเมื่อทำธุรกรรมหรือเข้าสู่ระบบ · อัปเดตล่าสุด 13/07/2026
          </p>
        </div>

        <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
          <p className="text-slate-400 text-xs sm:text-sm">
            ข้อตกลงฉบับนี้จัดทำขึ้นระหว่าง <span className="text-cyan-400 font-extrabold">OSX HUB</span> (ต่อไปนี้เรียกว่า "ผู้ให้บริการ") กับผู้สมัครสมาชิกและผู้ใช้บริการระบบสคริปต์ (ต่อไปนี้เรียกว่า "ผู้ใช้บริการ") เพื่อกำหนดเงื่อนไขการใช้งาน ความรับผิดชอบ และการยกเว้นการรับผิดชอบทางกฎหมาย การเข้าถึง สมัครสมาชิก หรือใช้งานเว็บไซต์นี้ ถือว่าผู้ใช้บริการยอมรับข้อตกลงนี้โดยไม่มีเงื่อนไขใด ๆ ทั้งสิ้น
          </p>

          {/* Section 1 */}
          <div className="space-y-3 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-cyan-500 text-base sm:text-lg"><i className="fa-solid fa-user-shield"></i></span>
              1. นโยบายการตรวจสอบสิทธิ์และการระงับสิทธิ์ใช้งาน (HWID & Account Protection)
            </h3>
            <div className="space-y-2 text-slate-400 text-xs sm:text-sm pl-2">
              <p>
                <span className="font-bold text-slate-300">1.1</span> คีย์สิทธิ์รันสคริปต์ประจำบัญชี (<span className="text-cyan-400 font-bold">Account Key</span>) ถือเป็นทรัพย์สินส่วนบุคคลของผู้ให้บริการที่มอบสิทธิ์ให้ผู้ใช้บริการใช้งานคนเดียวเท่านั้น ห้ามเปิดเผย แจกจ่าย นำไปปล่อยเช่าต่อ หรือจำหน่ายสิทธิ์ต่อในทุกรูปแบบ
              </p>
              <p>
                <span className="font-bold text-slate-300">1.2</span> ระบบตรวจจับการแชร์คีย์ (<span className="text-cyan-500 font-bold">HWID Lock</span>) จะบันทึกและตรวจสอบรหัสทางกายภาพของอุปกรณ์คอมพิวเตอร์ที่เข้าใช้งาน หากตรวจพบการเปลี่ยนอุปกรณ์ใช้งานสลับไปมาผิดปกติ หรือใช้งานพร้อมกันในเวลาเดียวกัน ระบบจะตัดสินว่ามีพฤติกรรมละเมิดสิทธิ์ และจะ <span className="text-rose-400 font-bold">ระงับบัญชีผู้ใช้งานถาวรทันที</span>
              </p>
              <p>
                <span className="font-bold text-slate-300">1.3</span> ผู้ให้บริการขอสงวนสิทธิ์ขาดในการพิจารณาตรวจสอบการระงับสิทธิ์ โดยคำตัดสินของทีมงานถือเป็นที่สิ้นสุด ผู้ใช้บริการตกลงว่าจะไม่เรียกร้องสิทธิ์ขอคืนเงิน ค่าชดเชย หรือสิทธิ์การเข้าถึงใด ๆ หลังถูกระงับสิทธิ์การใช้งานอันเนื่องมาจากการแชร์คีย์
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-rose-500 text-base sm:text-lg"><i className="fa-solid fa-triangle-exclamation"></i></span>
              2. ข้อตกลงปฏิเสธความรับผิดชอบต่อบัญชีเกมของผู้ใช้งาน (Disclaimer of Liability)
            </h3>
            <div className="space-y-2 text-slate-400 text-xs sm:text-sm pl-2">
              <p>
                <span className="font-bold text-slate-300">2.1</span> การเปิดใช้งานโปรแกรมช่วยเล่น โปรแกรมดัดแปลง หรือระบบสคริปต์ ซอฟต์แวร์ หรือบริการคอมพิวเตอร์ภายใต้ OSX HUB เป็นพฤติกรรมที่มีความเสี่ยงต่อการละเมิดเงื่อนไขของเกมหลัก (<span className="text-slate-100 font-bold">Roblox</span>) และอาจถูกตรวจจับได้ในอนาคต
              </p>
              <p>
                <span className="font-bold text-slate-300">2.2</span> <span className="text-rose-400 font-black">ผู้ให้บริการขอปฏิเสธความรับผิดชอบและความรับผิดทางแพ่งหรือทางอาญาใด ๆ ทั้งสิ้น</span> ในกรณีที่บัญชีเกมของผู้ใช้บริการโดนลงโทษ โดนแบน (Ban), ลบข้อมูลความคืบหน้า (Reset Data), สูญหายของเหรียญหรือไอเทมในเกม, หรือถูกดำเนินคดีใด ๆ จากบริษัทผู้พัฒนาเกมอันเนื่องมาจากการใช้ระบบสคริปต์ ซอฟต์แวร์ หรือบริการคอมพิวเตอร์ภายใต้ OSX HUB
              </p>
              <p>
                <span className="font-bold text-slate-300">2.3</span> ผู้ให้บริการไม่รับประกันว่าซอฟต์แวร์จะปลอดจากการตรวจจับ (Undetected) ตลอดเวลา ผู้ใช้บริการยอมรับความเสี่ยงนี้ด้วยตัวเองตั้งแต่เริ่มติดตั้งใช้งาน
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-amber-500 text-base sm:text-lg"><i className="fa-solid fa-ban"></i></span>
              3. นโยบายการเติมเงิน และการปฏิเสธการคืนเงินโดยสิ้นเชิง (Strict No-Refund & Payment Terms)
            </h3>
            <div className="space-y-2 text-slate-400 text-xs sm:text-sm pl-2">
              <p>
                <span className="font-bold text-slate-300">3.1</span> การชำระเงินเพื่อซื้อสินค้า เครดิต หรือสิทธิ์การใช้งานในระบบ ถือเป็นการสั่งซื้อสินค้าประเภทดิจิทัลคอนเทนต์ (Digital Content) ที่เสร็จสมบูรณ์ทันทีเมื่อผู้ใช้บริการทำการโอนเงินเข้าสู่ระบบ <span className="text-rose-400 font-black">จะไม่มีการคืนเงินจริง คืนยอดเงินในเว็บ หรือเปลี่ยนสินค้าทดแทนในทุกกรณีโดยไม่มีข้อยกเว้น (No Refunds Under Any Circumstance)</span>
              </p>
              <p>
                <span className="font-bold text-slate-300">3.2</span> ผู้ใช้บริการขอรับรองว่าตนเองมีอายุบรรลุนิติภาวะตามกฎหมาย หรือได้รับการยินยอมจากผู้ปกครองแล้วก่อนทำรายการชำระเงินทุกครั้ง และเงินที่นำมาชำระเป็นเงินของผู้ใช้บริการเองโดยชอบด้วยกฎหมาย หากเกิดกรณีผู้เยาว์ขโมยเงิน แอบอ้างนำบัญชีผู้อื่นมาใช้ หรือผู้ใช้บริการโอนเงินผิดพลาด ให้ถือเป็นความประมาทเลินเล่อและความรับผิดชอบของผู้ใช้บริการ/ผู้ปกครองแต่เพียงผู้เดียว <span className="text-rose-400 font-bold">ทางระบบขอสงวนสิทธิ์ปฏิเสธการคืนเงินสดทุกกรณี</span> (ยอดเงินที่โอนเข้ามาจะถูกเปลี่ยนเป็นเครดิตตามระบบเท่านั้น)
              </p>
              <p>
                <span className="font-bold text-slate-300">3.3</span> เนื่องจากระบบมีการตรวจสอบรายการด้วยเจ้าหน้าที่ (Manual Approve) ผู้ใช้บริการมีหน้าที่ตรวจสอบยอดเงินและโอนให้ถูกต้อง หากโอนเงินเข้ามาแล้วแต่ไม่ทำรายการส่งสลิปภายในเวลาที่กำหนด ถือว่าผู้ใช้บริการยอมรับเงื่อนไขและสละสิทธิ์ในการเรียกร้องเงินคืนทุกกรณี
              </p>
              <p>
                <span className="font-bold text-slate-300">3.4</span> กรณีระบบป้องกันไวรัส (Antivirus) หรือระบบปฏิบัติการของผู้ใช้บริการ (เช่น Windows Defender) ทำการบล็อก ป้องกัน หรือลบการทำงานของไฟล์ซอฟต์แวร์ ผู้ใช้บริการต้องเป็นผู้จัดการอนุญาตหรือแก้ไขด้วยตนเอง และไม่สามารถนำมาเป็นเหตุผลในการขอเงินคืนได้
              </p>
              <p>
                <span className="font-bold text-slate-300">3.5</span> กรณีเกิดการอัปเดตของตัวเกมหลักที่ทำให้ระบบรันไม่ได้ชั่วคราว หรือระบบปิดปรับปรุงเพื่ออัปเดตซอฟต์แวร์ให้ปลอดภัย (<span className="text-amber-400 font-bold">Updating Status</span>) ผู้ใช้บริการยอมรับว่าเหตุการณ์ดังกล่าวเป็นวิสัยปกติของบริการประเภทนี้ และตกลงจะไม่ยกมาเป็นเหตุผลขอเงินคืน
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-red-500 text-base sm:text-lg"><i className="fa-solid fa-shield-virus"></i></span>
              4. กฎข้อบังคับการเข้าแกะ รื้อถอน ทำลายระบบ การอายัดชำระเงิน และการใช้ช่องโหว่ (Abuse, Security & Exploitation Policy)
            </h3>
            <div className="space-y-2 text-slate-400 text-xs sm:text-sm pl-2">
              <p>
                <span className="font-bold text-slate-300">4.1</span> ห้ามผู้ใช้บริการกระทำการดักจับ API ดึงซอร์สโค้ด ดัดแปลง แก้ไข รื้อถอนระบบ (Decompile / Reverse Engineering) หรือทำการส่งคำขอสแปมโจมตีเซิร์ฟเวอร์ (DDoS) เพื่อทำให้เว็บไซต์หรือระบบคอมพิวเตอร์ขัดข้องเด็ดขาด
              </p>
              <p>
                <span className="font-bold text-slate-300">4.2</span> หากพบช่องโหว่ของระบบ (Bug/Exploit) ผู้ใช้บริการต้องแจ้งทีมงานทันที ห้ามมิให้แสวงหาผลประโยชน์จากช่องโหว่ดังกล่าว
              </p>
              <p>
                <span className="font-bold text-slate-300">4.3</span> หากตรวจพบการเจาะระบบ ละเมิดลิขสิทธิ์ การแสวงหาผลประโยชน์จากข้อผิดพลาดของระบบ หรือกรณีผู้ใช้บริการทำการแจ้งปฏิเสธการชำระเงิน (Chargeback) แจ้งความอายัดบัญชีธนาคารของผู้ให้บริการโดยเจตนาทุจริต <span className="text-rose-400 font-bold">ผู้ให้บริการจะทำการระงับบัญชี (Ban ID) ถาวร, แบล็กลิสต์อุปกรณ์ (HWID Blacklist) และยึดยอดเงินสะสมทั้งหมดทันที พร้อมขอสงวนสิทธิ์ดำเนินคดีตามพระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ และกฎหมายแพ่งเพื่อเรียกร้องค่าเสียหายอย่างถึงที่สุด</span>
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-emerald-400 text-base sm:text-lg"><i className="fa-solid fa-comments"></i></span>
              5. ข้อกำหนดเกี่ยวกับพฤติกรรมและการขอรับบริการ (Behavior, Community & Support Policy)
            </h3>
            <div className="space-y-2 text-slate-400 text-xs sm:text-sm pl-2">
              <p>
                <span className="font-bold text-slate-300">5.1</span> ผู้ใช้บริการต้องปฏิบัติตนด้วยความสุภาพต่อผู้ให้บริการและทีมงานสนับสนุน (Support) ห้ามมิให้ด่าทอ ใช้คำหยาบคาย ข่มขู่ หรือสร้างความวุ่นวายในช่องทางการให้บริการ (เช่น Discord, Fanpage)
              </p>
              <p>
                <span className="font-bold text-slate-300">5.2</span> หากผู้ใช้บริการมีพฤติกรรมสแปมตั๋วแจ้งปัญหา (Ticket Spam) หรือมีพฤติกรรมไม่เหมาะสม ทางผู้ให้บริการขอสงวนสิทธิ์ในการระงับการให้บริการสนับสนุน (Support Ban) หรือระงับบัญชีใช้งาน (Account Ban) โดยไม่ต้องแจ้งให้ทราบล่วงหน้า และไม่คืนเงินทุกกรณี
              </p>
              <p>
                <span className="font-bold text-slate-300">5.3</span> กรณีระบบปิดปรับปรุงชั่วคราว การพิจารณาชดเชยเวลาใช้งานให้ถือเป็นดุลยพินิจและน้ำใจของผู้ให้บริการเท่านั้น ไม่สามารถนำมาเรียกร้องเป็นสิทธิ์ตามกฎหมายได้
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-orange-400 text-base sm:text-lg"><i className="fa-solid fa-power-off"></i></span>
              6. การยุติการให้บริการและการแอบอ้างสิทธิ์ (Termination & Impersonation Policy)
            </h3>
            <div className="space-y-2 text-slate-400 text-xs sm:text-sm pl-2">
              <p>
                <span className="font-bold text-slate-300">6.1</span> ผู้ให้บริการขอสงวนสิทธิ์ในการยุติ ปิดตัว หรือยกเลิกการให้บริการระบบ OSX HUB ไม่ว่าทั้งหมดหรือบางส่วนได้ตลอดเวลา ด้วยเหตุผลทางด้านเทคโนโลยี กฎหมาย หรือการตัดสินใจทางธุรกิจของผู้ให้บริการ โดยผู้ให้บริการไม่ต้องรับผิดชอบต่อความเสียหายใด ๆ และผู้ใช้บริการตกลงว่าจะไม่เรียกร้องค่าชดเชยหรือขอคืนเงินใด ๆ ทั้งสิ้น
              </p>
              <p>
                <span className="font-bold text-slate-300">6.2</span> การซื้อขายสิทธิ์หรือรับบริการที่ถูกต้องจะต้องทำผ่านช่องทางทางการของ OSX HUB เท่านั้น ทางระบบไม่รับผิดชอบต่อความเสียหายจากการซื้อขายผ่านบุคคลภายนอก และหากตรวจพบการแอบอ้างเป็นทีมงาน จะดำเนินคดีและแบนบัญชีถาวรทันที
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-3 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-purple-500 text-base sm:text-lg"><i className="fa-solid fa-file-signature"></i></span>
              7. สิทธิ์ในการปรับปรุงและเปลี่ยนแปลงเงื่อนไข (Right to Modify Terms)
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm pl-2">
              ผู้ให้บริการขอสงวนสิทธิ์ในการแก้ไข เพิ่มเติม หรือเปลี่ยนแปลงข้อตกลงการใช้บริการนี้ได้ตลอดเวลาโดยไม่ต้องแจ้งให้ทราบล่วงหน้า การที่ผู้ใช้บริการยังคงเข้าสู่ระบบ หรือใช้บริการระบบอย่างต่อเนื่องหลังจากมีการเปลี่ยนแปลงข้อกำหนด ถือว่าผู้ใช้บริการได้ยอมรับและตกลงที่จะปฏิบัติตามข้อตกลงที่แก้ไขใหม่นั้นโดยสมบูรณ์
            </p>
          </div>

          {/* Section 8 - Privacy Notice */}
          <div className="space-y-2 bg-[#090d16]/60 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-indigo-500 text-base sm:text-lg"><i className="fa-solid fa-user-tag"></i></span>
              8. นโยบายคุ้มครองข้อมูลส่วนบุคคลและการเข้าสู่ระบบด้วย Discord (Discord Login Privacy Consent)
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm pl-2">
              การเข้าสู่ระบบผ่านทาง Discord ถือเป็นการยินยอมให้ผู้ให้บริการเข้าถึงข้อมูลสาธารณะ (เช่น Discord ID, Username, Avatar) และอีเมลตามที่ระบบกำหนดเพื่อใช้ในการยืนยันและระบุตัวตนในการใช้งาน ทั้งนี้ ผู้ให้บริการจะจัดเก็บข้อมูลเหล่านี้อย่างเป็นความลับ ปลอดภัย และไม่มีการนำข้อมูลดังกล่าวไปเผยแพร่หรือจำหน่ายให้แก่บุคคลภายนอกโดยไม่ได้รับอนุญาต
            </p>
          </div>

          <div className="text-center pt-6 text-xs text-slate-500 border-t border-slate-800/60 font-bold">
            © 2026 OSX HUB. สงวนลิขสิทธิ์ความปลอดภัยสูงสุดโดยผู้ให้บริการระบบ
          </div>
        </div>
      </section>
    </div>
  );
}
