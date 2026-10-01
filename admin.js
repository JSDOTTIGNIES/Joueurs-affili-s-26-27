import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";
import { TEAMS } from "./teams.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = s => document.querySelector(s);
const loginCard = $("#loginCard");
const adminPanel = $("#adminPanel");
const tbody = $("#playersBody");
const teamFilter = $("#teamFilter");
const search = $("#search");
const counter = $("#counter");
const dialog = $("#editDialog");
let players = [];
let unsub = null;

const teamOptions = TEAMS.map(t => `<option>${t}</option>`).join("");
teamFilter.innerHTML += teamOptions;
$("#editTeam").innerHTML = teamOptions;

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#loginStatus").className = "status";
  $("#loginStatus").textContent = "";

  const code = $("#adminCode").value.trim();

  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, code);
    $("#adminCode").value = "";
  } catch (err) {
    console.error("Erreur connexion admin :", err);
    $("#loginStatus").className = "status error";
    $("#loginStatus").textContent = "Code administrateur incorrect.";
  }
});
$("#logoutBtn").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  const ok = !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  loginCard.classList.toggle("hidden", ok);
  adminPanel.classList.toggle("hidden", !ok);

  if (!ok) {
    if (unsub) unsub();
    players = [];
    render();
    if (user) signOut(auth);
    return;
  }

  const q = query(collection(db, "players"), orderBy("createdAt", "desc"));
  unsub = onSnapshot(q, snap => {
    players = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    render();
  }, err => {
    console.error(err);
    alert("Impossible de charger les joueurs. Vérifie les règles Firestore.");
  });
});

function esc(v=""){
  return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function fmtDate(ts){
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString("fr-BE");
}
function paymentLabel(v){
  return v === "paid_total" ? '<span class="badge ok">Totale</span>'
       : v === "paid_partial" ? '<span class="badge warn">Partielle</span>'
       : '<span class="badge">Non réglée</span>';
}
function certLabel(p){
  return p.certificateGiven
    ? '<span class="badge ok">Remis au coach</span>'
    : '<span class="badge warn">Non remis</span>';
}

function photoCell(p){
  if (!p.photoUrl) return '<span class="muted">—</span>';
  return `<a href="${esc(p.photoUrl)}" target="_blank" rel="noopener">
    <img class="admin-player-photo" src="${esc(p.photoUrl)}" alt="Photo joueur">
  </a>`;
}

function getFiltered(){
  const tf = teamFilter.value;
  const s = search.value.trim().toLowerCase();
  return players.filter(p =>
    (!tf || p.team === tf) &&
    (!s || [p.fullName,p.email,p.phone].some(v => String(v||"").toLowerCase().includes(s)))
  );
}
function render(){
  const list = getFiltered();
  counter.textContent = `${list.length} fiche(s) affichée(s) sur ${players.length}`;
  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${photoCell(p)}</td>
      <td>${esc(p.team)}</td>
      <td><strong>${esc(p.fullName)}</strong></td>
      <td>${esc(p.address)}</td>
      <td>${esc(p.email)}</td>
      <td>${esc(p.phone)}</td>
      <td>${esc(p.emergency1)}</td>
      <td>${esc(p.emergency2)}</td>
      <td>${certLabel(p)}</td>
      <td>${paymentLabel(p.contributionStatus)}</td>
      <td>${esc(fmtDate(p.createdAt))}</td>
      <td>
        <div class="actions">
          <button class="mini edit" data-id="${p.id}">Modifier</button>
          <button class="mini danger delete" data-id="${p.id}">Supprimer</button>
        </div>
      </td>
    </tr>`).join("");

  tbody.querySelectorAll(".edit").forEach(b => b.addEventListener("click", () => openEdit(b.dataset.id)));
  tbody.querySelectorAll(".delete").forEach(b => b.addEventListener("click", () => removePlayer(b.dataset.id)));
}
teamFilter.addEventListener("change", render);
search.addEventListener("input", render);

function openEdit(id){
  const p = players.find(x => x.id === id);
  if (!p) return;
  $("#editId").value = p.id;
  $("#editTeam").value = p.team || "";
  $("#editFullName").value = p.fullName || "";
  $("#editAddress").value = p.address || "";
  $("#editEmail").value = p.email || "";
  $("#editPhone").value = p.phone || "";
  $("#editEmergency1").value = p.emergency1 || "";
  $("#editEmergency2").value = p.emergency2 || "";
  $("#editCertificateGiven").checked = !!p.certificateGiven;
  $("#paidPartial").checked = p.contributionStatus === "paid_partial";
  $("#paidTotal").checked = p.contributionStatus === "paid_total";
  $("#editStatus").textContent = "";
  dialog.showModal();
}
$("#cancelEdit").addEventListener("click", () => dialog.close());
$("#paidPartial").addEventListener("change", e => { if (e.target.checked) $("#paidTotal").checked = false; });
$("#paidTotal").addEventListener("change", e => { if (e.target.checked) $("#paidPartial").checked = false; });

$("#editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("#editId").value;
  const contributionStatus = $("#paidTotal").checked ? "paid_total"
      : $("#paidPartial").checked ? "paid_partial" : "unpaid";
  try {
    await updateDoc(doc(db, "players", id), {
      team: $("#editTeam").value,
      fullName: $("#editFullName").value.trim(),
      address: $("#editAddress").value.trim(),
      email: $("#editEmail").value.trim().toLowerCase(),
      phone: $("#editPhone").value.trim(),
      emergency1: $("#editEmergency1").value.trim(),
      emergency2: $("#editEmergency2").value.trim(),
      certificateGiven: $("#editCertificateGiven").checked,
      contributionStatus,
      updatedAt: serverTimestamp()
    });
    dialog.close();
  } catch (err) {
    console.error(err);
    $("#editStatus").className = "status error";
    $("#editStatus").textContent = "Impossible d’enregistrer les modifications.";
  }
});

async function removePlayer(id){
  const p = players.find(x => x.id === id);
  if (!confirm(`Supprimer définitivement la fiche de ${p?.fullName || "ce joueur"} ?`)) return;
  try { await deleteDoc(doc(db, "players", id)); }
  catch(err){ console.error(err); alert("Suppression impossible."); }
}

$("#exportBtn").addEventListener("click", () => {
  const list = getFiltered();
  const rows = list.map(p => ({
    "Photo": p.photoUrl || "",
    "Équipe": p.team || "",
    "Nom et prénom": p.fullName || "",
    "Adresse": p.address || "",
    "E-mail": p.email || "",
    "Téléphone": p.phone || "",
    "Téléphone urgence 1": p.emergency1 || "",
    "Téléphone urgence 2": p.emergency2 || "",
    "Certificat médical": p.certificateGiven ? "Remis au coach" : "Non remis",
    "Cotisation": p.contributionStatus === "paid_total" ? "Totale"
                  : p.contributionStatus === "paid_partial" ? "Partielle" : "Non réglée",
    "Date réception": fmtDate(p.createdAt)
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Joueurs");
  XLSX.writeFile(wb, `JS_Dottignies_joueurs_${new Date().toISOString().slice(0,10)}.xlsx`);
});
