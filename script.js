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
   CART + ANIMATIES
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

function addToCart(name, price, image, buttonEl) {
  const cart = getCart();

  const item = cart.find(i => i.name === name);
  if (item) item.qty++;
  else cart.push({ name, price, image, qty: 1 });

  saveCart(cart);

  const countEl = $("cart-count");
  if (countEl) countEl.textContent = cart.reduce((s,i)=>s+i.qty,0);

  const cartBtn = document.querySelector(".cart-button");

  if (buttonEl && cartBtn) {
    flyToCart(buttonEl, cartBtn);

    setTimeout(() => {
      explodeAt(cartBtn);
    }, 3000);
  }
}

function flyToCart(startEl, cartEl) {
  const dot = document.createElement("img");
  dot.src = "img_webshop/winkelwagen-animatie.png";
  dot.className = "flying-dot";
  document.body.appendChild(dot);

  const s = startEl.getBoundingClientRect();
  const e = cartEl.getBoundingClientRect();

  dot.style.position = "fixed";
  dot.style.left = s.left + "px";
  dot.style.top = s.top + "px";

  requestAnimationFrame(() => {
    dot.style.transition = "all 3s ease-in-out";
    dot.style.left = e.left + "px";
    dot.style.top = e.top + "px";
  });

  setTimeout(() => dot.remove(), 3000);
}

/* =========================
   EXPLOSION
========================= */
function explodeAt(el) {
  const r = el.getBoundingClientRect();

  const exp = document.createElement("div");
  exp.className = "explosion";
  exp.style.left = r.left + "px";
  exp.style.top = r.top + "px";

  document.body.appendChild(exp);

  setTimeout(() => exp.remove(), 3000);
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

    if (avatar) {
        loginButton.innerHTML = `<img src="${avatar}" alt="Profielfoto" class="login-avatar">${naam}`;
    } else {
        loginButton.innerHTML = `👤 ${naam}`;
    }

    loginButton.href = "registreren2.html";
});