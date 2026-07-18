import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration (Replace with your actual keys if needed)
const firebaseConfig = {
    apiKey: "AIzaSyByjQ_YdFEYBaCobQInw1z2iOuQmeu6PRg",
    authDomain: "undangan-ce94b.firebaseapp.com",
    projectId: "undangan-ce94b",
    storageBucket: "undangan-ce94b.firebasestorage.app",
    messagingSenderId: "71234850771",
    appId: "1:71234850771:web:fe232b1d1dbdfed6d82926",
    measurementId: "G-ZGBZLZB3W5"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const wishesRef = collection(db, "wishes");

// Dynamic guest name parsing from URL parameters (e.g., ?to=Nama+Tamu)
const params = new URLSearchParams(window.location.search);
const guest = params.get('to');
const guestName = document.getElementById('guestName');
if (guest && guestName) {
    guestName.innerText = decodeURIComponent(guest.replace(/\+/g, ' '));
}

const music = document.getElementById('music');
const musicBtn = document.getElementById('musicBtn');

// Open invitation handler
window.openInvitation = function () {
    document.body.classList.remove('lock');
    const cover = document.getElementById('cover');
    if (cover) {
        cover.classList.add('hide');
        setTimeout(() => {
            cover.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1100);
    }

    // Auto play background music
    if (music) {
        music.play()
            .then(() => {
                musicBtn.classList.add('playing');
            })
            .catch((err) => {
                console.log("Auto-play blocked by browser. User interaction required.");
            });
    }
};

// Toggle Music control
window.toggleMusic = function () {
    if (!music) return;
    if (music.paused) {
        music.play()
            .then(() => {
                musicBtn.classList.add('playing');
                showToast("Musik dimainkan", "info");
            })
            .catch((err) => console.log(err));
    } else {
        music.pause();
        musicBtn.classList.remove('playing');
        showToast("Musik dijeda", "info");
    }
};

// Wedding Countdown Timer
const targetDate = new Date('2026-09-02T09:00:00+07:00').getTime();

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function updateCountdown() {
    const diff = targetDate - Date.now();
    if (diff <= 0) {
        ['days', 'hours', 'minutes', 'seconds'].forEach(id => setText(id, 0));
        return;
    }
    setText('days', Math.floor(diff / (1000 * 60 * 60 * 24)));
    setText('hours', Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    setText('minutes', Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
    setText('seconds', Math.floor((diff % (1000 * 60)) / 1000));
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Custom Toast Notification Function
window.showToast = function (message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);

    // Trigger transition reflow
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 3000);
};

// Client-side Debounce & Anti-Spam protection on wish submissions
window.addWish = async function () {
    const nameEl = document.getElementById('name');
    const messageEl = document.getElementById('message');
    const attendanceEl = document.getElementById('attendance');
    const submitBtn = document.getElementById('submitWishBtn');

    const name = nameEl ? nameEl.value.trim() : '';
    const message = messageEl ? messageEl.value.trim() : '';
    const attendance = attendanceEl ? attendanceEl.value : 'Konfirmasi Kehadiran';

    if (!name || !message) {
        showToast("Nama dan ucapan wajib diisi!");
        return;
    }

    if (attendance === "Konfirmasi Kehadiran") {
        showToast("Pilihlah salah satu konfirmasi kehadiran!");
        return;
    }

    // Check anti-spam throttle in LocalStorage (10 seconds debounce)
    const lastSubmit = localStorage.getItem('last_wish_submission');
    const now = Date.now();
    if (lastSubmit && (now - parseInt(lastSubmit) < 10000)) {
        const waitSec = Math.ceil((10000 - (now - parseInt(lastSubmit))) / 1000);
        showToast(`Silakan tunggu ${waitSec} detik lagi sebelum mengirim ucapan.`);
        return;
    }

    // Disable button during processing
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
    }

    try {
        await addDoc(wishesRef, {
            name,
            message,
            attendance,
            created: serverTimestamp()
        });

        // Set last submission time in localStorage
        localStorage.setItem('last_wish_submission', Date.now().toString());

        showToast("Ucapan restu Anda berhasil dikirim!");
        if (nameEl) nameEl.value = '';
        if (messageEl) messageEl.value = '';
        if (attendanceEl) attendanceEl.selectedIndex = 0;
    } catch (error) {
        console.error(error);
        showToast("Gagal mengirim ucapan. Silakan periksa koneksi Anda.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-regular fa-paper-plane" style="margin-right: 6px;"></i> Kirim Ucapan';
        }
    }
};

// Realtime snapshots for guest wishes
const wishesContainer = document.getElementById('wishes');

onSnapshot(query(wishesRef, orderBy('created', 'desc')), (snapshot) => {
    if (wishesContainer) wishesContainer.innerHTML = '';

    let hadir = 0;
    let tidakHadir = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.attendance === 'Hadir') hadir++;
        if (data.attendance === 'Tidak Hadir') tidakHadir++;

        const div = document.createElement('div');
        div.className = 'wish';

        const isHadir = data.attendance === 'Hadir';
        const badgeClass = isHadir ? 'hadir' : 'tidak-hadir';
        const badgeText = data.attendance || 'Konfirmasi Kehadiran';

        div.innerHTML = `
          <div class="wish-header">
            <span class="wish-name"><i class="fa-solid fa-user-tag" style="margin-right:6px; color:var(--gold);"></i> ${escapeHtml(data.name || '')}</span>
            <span class="wish-badge ${badgeClass}"><i class="fa-regular ${isHadir ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${escapeHtml(badgeText)}</span>
          </div>
          <div class="wish-message">${escapeHtml(data.message || '')}</div>
        `;
        if (wishesContainer) wishesContainer.appendChild(div);
    });

    setText('commentCount', snapshot.size + ' Comments');
    setText('hadirCount', hadir);
    setText('tidakHadirCount', tidakHadir);
}, (error) => {
    console.error(error);
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Helper functions for copying text details to clipboard
window.copyText = function (id) {
    const el = document.getElementById(id);
    if (!el) return;

    navigator.clipboard.writeText(el.innerText)
        .then(() => {
            showToast("Nomor rekening berhasil disalin!");
        })
        .catch(err => {
            console.error("Gagal menyalin text: ", err);
        });
};

window.copyAddress = function () {
    const addressText = "Jl. Brawijaya Gg. Muara 25 Rt.04/Rw.02 Kelurahan Muarareja, Kecamatan Tegal Barat, Kota Tegal (Kode Pos: 52114)";
    navigator.clipboard.writeText(addressText)
        .then(() => {
            showToast("Alamat pengiriman berhasil disalin!");
        })
        .catch(err => {
            console.error("Gagal menyalin alamat: ", err);
        });
};

// Scroll reveal transitions and Bottom Navigation active state mapping
const reveals = document.querySelectorAll('.reveal');
const navLinks = document.querySelectorAll('.bottom-nav a');
const toTopBtn = document.getElementById('toTopBtn');

function revealOnScroll() {
    const scrollPos = window.scrollY;

    // Show/hide scroll-to-top button
    if (scrollPos > 300) {
        toTopBtn.classList.add('show');
    } else {
        toTopBtn.classList.remove('show');
    }

    // Check section visibility for animations
    reveals.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 80) {
            el.classList.add('active');
        }
    });

    // Map current scroll position to update active class on bottom nav links
    let currentSectionId = "home";
    document.querySelectorAll('section[id]').forEach((sec) => {
        const secTop = sec.offsetTop - 120;
        const secHeight = sec.offsetHeight;
        if (scrollPos >= secTop && scrollPos < secTop + secHeight) {
            currentSectionId = sec.getAttribute('id');
        }
    });

    navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);
revealOnScroll();