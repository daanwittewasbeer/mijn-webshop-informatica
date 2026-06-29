import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

const $ = (id) => document.getElementById(id);

/* =========================
   AUTH STATE
========================= */
onAuthStateChanged(auth, async (user) => {
  if (user) {

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    let name = "User";

    if (docSnap.exists()) {
      name = docSnap.data().name;
    }

    const nameEl = document.getElementById("user-name");
    const emailEl = document.getElementById("user-email");

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = user.email;

    $("success-card")?.classList.remove("hidden");
    $("reg-card")?.classList.add("hidden");
    $("login-card")?.classList.add("hidden");

  } else {
    showReg();
  }
});

/* =========================
   UI
========================= */
function showReg() {
  $("reg-card")?.classList.remove("hidden");
  $("login-card")?.classList.add("hidden");
  $("success-card")?.classList.add("hidden");
}

function showLogin() {
  $("reg-card")?.classList.add("hidden");
  $("login-card")?.classList.remove("hidden");
  $("success-card")?.classList.add("hidden");
}

/* =========================
   REGISTER
========================= */
async function register() {
  const email = $("reg-email")?.value;
  const pass = $("reg-pass")?.value;
  const pass2 = $("reg-pass2")?.value;

  if (!email || !pass || !pass2) return alert("Vul alles in");
  if (pass !== pass2) return alert("Wachtwoorden komen niet overeen");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

    // naam = email (want je hebt geen input)
    const name = email.split("@")[0];

    await setDoc(doc(db, "users", userCredential.user.uid), {
      name,
      email
    });

  } catch (err) {
    alert(err.message);
  }
}

/* =========================
   LOGIN
========================= */
async function login() {
  const email = $("login-email")?.value;
  const pass = $("login-pass")?.value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    alert("Login fout: " + err.message);
  }
}

/* =========================
   LOGOUT
========================= */
async function logout() {
  await signOut(auth);
}

/* =========================
   PASSWORD STRENGTH
========================= */
function checkStrength() {
  const val = $("reg-pass")?.value || "";
  const el = $("strength");
  if (!el) return;

  let score = 0;

  if (val.length > 5) score++;
  if (val.length > 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = ["Zwak 🔴","Oké 🟡","Goed 🟢","Sterk 💪","Heel sterk 🔥"];
  el.textContent = val ? levels[score] : "";
}

/* =========================
   CART
========================= */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("kamervliegers_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("kamervliegers_cart", JSON.stringify(cart));
}

/* =========================
   TOEVOEGEN AAN WINKELWAGEN
   — de daadwerkelijke toevoeging gebeurt pas zodra
     het vliegtuigje is geland (zie flyToCart-callback)
========================= */
function addToCart(name, price, image, buttonEl) {
  // Pakt specifiek de winkelwagen-knop, niet de eerste .cart-button
  // (dat zou anders het inlog/profiel-knopje kunnen zijn)
  const cartBtn = document.querySelector('a[href="winkelmand.html"]');

  function voegEchtToe() {
    const cart = getCart();
    const item = cart.find(i => i.name === name);

    if (item) item.qty++;
    else cart.push({ name, price, image, qty: 1 });

    saveCart(cart);

    const countEl = $("cart-count");
    if (countEl) countEl.textContent = cart.reduce((s, i) => s + i.qty, 0);
  }

  if (buttonEl && cartBtn) {
    flyToCart(buttonEl, cartBtn, () => {
      voegEchtToe();
      explodeAt(cartBtn);
      cartBtn.classList.add("pop");
      setTimeout(() => cartBtn.classList.remove("pop"), 300);
    });
  } else {
    // Geen animatie mogelijk (knop niet gevonden) — voeg gewoon meteen toe
    voegEchtToe();
  }
}

/* =========================
   VLIEGTUIGJE-ANIMATIE
   — landt precies gecentreerd op de winkelwagen-knop
   — roept onLanded() pas aan ná de volledige vlucht
========================= */
function flyToCart(startEl, cartEl, onLanded) {
  const dot = document.createElement("img");
  dot.src = "img_webshop/winkelwagen-animatie.png";
  dot.className = "flying-dot";
  dot.style.position = "fixed";
  document.body.appendChild(dot);

  const dotRect = dot.getBoundingClientRect();
  const s = startEl.getBoundingClientRect();
  const e = cartEl.getBoundingClientRect();

  const startX = s.left + s.width / 2 - dotRect.width / 2;
  const startY = s.top + s.height / 2 - dotRect.height / 2;
  const endX = e.left + e.width / 2 - dotRect.width / 2;
  const endY = e.top + e.height / 2 - dotRect.height / 2;

  dot.style.left = startX + "px";
  dot.style.top = startY + "px";

  requestAnimationFrame(() => {
    dot.style.transition = "all 3s ease-in-out";
    dot.style.left = endX + "px";
    dot.style.top = endY + "px";
  });

  setTimeout(() => {
    dot.remove();
    if (onLanded) onLanded();
  }, 3000);
}

/* =========================
   EXPLOSION
========================= */
function explodeAt(el) {
  const r = el.getBoundingClientRect();

  const exp = document.createElement("div");
  exp.className = "explosion";
  exp.style.left = (r.left + r.width / 2) + "px";
  exp.style.top = (r.top + r.height / 2) + "px";

  document.body.appendChild(exp);

  setTimeout(() => exp.remove(), 600);
}

/* =========================
   EXPORTS
========================= */
window.register = register;
window.login = login;
window.logout = logout;
window.showLogin = showLogin;
window.showReg = showReg;
window.checkStrength = checkStrength;
window.addToCart = addToCart;

/* =========================
   PROFIELFOTO IN LOGIN-KNOP
========================= */
window.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login-button");
    if (!loginButton) return; // staat niet op elke pagina, dus veilig afbreken

    const currentEmail = localStorage.getItem("currentUser");
    if (!currentEmail) return;

    let avatar = null;

    try {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        avatar = users[currentEmail] ? users[currentEmail].avatar : null;
    } catch {
        avatar = null;
    }

    const naam = localStorage.getItem("currentName") || currentEmail.split("@")[0];

    loginButton.innerHTML = "";
    loginButton.style.display = "inline-flex";
    loginButton.style.alignItems = "center";

    if (avatar) {
        const img = document.createElement("img");
        img.src = avatar;
        img.alt = "Profielfoto";
        img.style.width = "26px";
        img.style.height = "26px";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.marginRight = "8px";
        img.style.border = "1px solid rgba(255,255,255,0.7)";
        img.style.flexShrink = "0";

        loginButton.appendChild(img);
        loginButton.appendChild(document.createTextNode(naam));
    } else {
        loginButton.textContent = "👤 " + naam;
    }

    loginButton.href = "registreren2.html";
});