/* =========================================
   ส่วนระบบการทำงานของเว็บ Kalima Massage
   - ระบบเปลี่ยนภาษา (TH / EN)
   - แถบเมนู (Navbar) เปลี่ยนสีเวลาเลื่อนจอ
   - เมนูสำหรับมือถือ (ขีดสามขีด)
   - แอนิเมชันค่อยๆ โชว์เนื้อหา (Scroll reveal)
   - ระบบฟอร์มจองคิวส่งข้อมูลไป Google Sheet
   ========================================= */

const API_URL = "https://script.google.com/macros/s/AKfycbzlvotBbpnJwP4JikacQ3Stu1_rqGwVVAQHDZDX-Z6J507IHGFs0lChruX_c3FkT-z30A/exec";

/* ── ระบบเปลี่ยนภาษา ── */
let currentLang = "th";

function setLang(lang) {
    currentLang = lang;
    
    // เปลี่ยนตัวหนังสือทั่วไปบนหน้าเว็บ
    document.querySelectorAll("[data-th][data-en]").forEach(el => {
        if (el.tagName === "A" && el.querySelector("span[data-th]")) return;
        el.textContent = el.dataset[lang];
    });

    // เปลี่ยนคำในส่วนตัวเลือก Dropdown ของฟอร์ม
    document.querySelectorAll("select option[data-th][data-en]").forEach(opt => {
        opt.textContent = opt.dataset[lang];
    });

    // เปลี่ยนคำบนปุ่มสลับภาษา
    document.querySelector(".lang-current").textContent = lang === "th" ? "EN" : "TH";

    // สลับภาษาของข้อความตัวอย่างที่พิมพ์จางๆ (Placeholder)
    const namePh = lang === "th" ? "สมชาย ใจดี" : "John Smith";
    const phonePh = lang === "th" ? "08X-XXX-XXXX" : "08X-XXX-XXXX";
    const notePh = lang === "th"
        ? "เช่น แพ้น้ำมัน, ต้องการนวดหนัก/เบา..."
        : "e.g. allergic to oils, prefer firm/soft pressure...";

    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const noteInput = document.getElementById("note");
    if (nameInput) nameInput.placeholder = namePh;
    if (phoneInput) phoneInput.placeholder = phonePh;
    if (noteInput) noteInput.placeholder = notePh;
}

document.getElementById("langToggle").addEventListener("click", () => {
    setLang(currentLang === "th" ? "en" : "th");
});

/* ── เอฟเฟกต์แถบเมนูด้านบน ── */
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 60);
});

/* ── ระบบเมนูมือถือ ── */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
});

// กดเลือกเมนูใดเมนูหนึ่ง แล้วให้หน้าต่างเมนูปิดลงอัตโนมัติ
mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => mobileMenu.classList.remove("open"));
});

/* ── ปิดหน้าต่างเมนูมือถือเมื่อลูกค้าจิ้มโดนที่อื่น ── */
document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target)) mobileMenu.classList.remove("open");
});

/* ── แอนิเมชันให้เนื้อหาโผล่ขึ้นมาตอนเลื่อนจอ ── */
const revealEls = document.querySelectorAll(
    ".service-card, .review-card, .booking-info, .booking-form-wrap, .strip-item, .section-header"
);

revealEls.forEach(el => el.classList.add("reveal"));

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add("visible"), i * 80);
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);

revealEls.forEach(el => observer.observe(el));

/* ── ระบบฟอร์มจองคิว ── */
const form = document.getElementById("bookingForm");
const successMsg = document.getElementById("successMsg");
const submitBtn = document.getElementById("submitBtn");

// บังคับให้ลูกค้าเลือกวันที่ตั้งแต่วันนี้เป็นต้นไปเท่านั้น
const dateInput = document.getElementById("date");
if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.setAttribute("min", today);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // เช็คว่ากรอกข้อมูลช่องที่มีเครื่องหมายดอกจันครบหรือยัง
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // เปลี่ยนปุ่มเป็นบอกสถานะกำลังโหลด
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector(".btn-text");
    btnText.textContent = currentLang === "th" ? "กำลังส่ง..." : "Sending...";

    const formData = new FormData(form);
    const raw = Object.fromEntries(formData.entries());

    // จับคู่ข้อมูลที่จะลอยเข้าไปในชีต ให้ตรงกับหัวคอลัมน์พอดิบพอดี
    const data = {
        name:    raw.name,
        phone:   raw.phone,
        service: raw.service,
        date:    raw.date,
        time:    raw.time,
        persons: raw.persons,
        note:    raw.note,
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",             
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        // ซ่อนฟอร์มและโชว์หน้าต่างทำรายการจองสำเร็จ
        form.hidden = true;
        successMsg.hidden = false;

    } catch (err) {
        console.error("Booking error:", err);
        const msg = currentLang === "th"
            ? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
            : "Something went wrong. Please try again.";
        alert(msg);
    } finally {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        btnText.textContent = currentLang === "th" ? "ส่งการจอง" : "Send Booking";
    }
});

/* ── ปุ่มกดย้อนกลับไปจองคิวอันใหม่ ── */
document.getElementById("newBookingBtn").addEventListener("click", () => {
    form.reset();
    form.hidden = false;
    successMsg.hidden = true;
});

/* ── ระบบกดปุ่มจองรวดเร็วจากการ์ดด้านบน ── */
document.querySelectorAll(".btn-card").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const card = btn.closest(".service-card");
        const serviceName = card.querySelector("h3").dataset.th || card.querySelector("h3").textContent.trim();
        const serviceSelect = document.getElementById("service");

        // ให้ดึงชื่อบริการมาใส่ในช่อง Dropdown ด้วยอัตโนมัติ
        for (const opt of serviceSelect.options) {
            if (opt.value.includes(serviceName)) {
                serviceSelect.value = opt.value;
                break;
            }
        }

        // เลื่อนจอบรื้ดเดียวลงมาที่ตำแหน่งฟอร์ม
        document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
    });
});