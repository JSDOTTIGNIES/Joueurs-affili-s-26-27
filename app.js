import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { TEAMS } from "./teams.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const team = document.querySelector("#team");
const form = document.querySelector("#playerForm");
const status = document.querySelector("#status");
const submitBtn = document.querySelector("#submitBtn");

team.innerHTML = '<option value="">Choisir une équipe</option>' + TEAMS.map(t => `<option>${t}</option>`).join("");

const clean = v => String(v || "").trim();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours…";
  status.className = "status";
  status.textContent = "";
  try {
    await addDoc(collection(db, "players"), {
      team: team.value,
      fullName: clean(document.querySelector("#fullName").value),
      address: clean(document.querySelector("#address").value),
      email: clean(document.querySelector("#email").value).toLowerCase(),
      phone: clean(document.querySelector("#phone").value),
      emergency1: clean(document.querySelector("#emergency1").value),
      emergency2: clean(document.querySelector("#emergency2").value),
      certificateGiven: document.querySelector("#certificateGiven").checked,
      contributionStatus: document.querySelector("#contributionStatus").value,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    form.reset();
    status.className = "status success";
    status.textContent = "Merci, les informations ont bien été envoyées.";
  } catch (err) {
    console.error(err);
    status.className = "status error";
    status.textContent = "Une erreur est survenue lors de l’envoi.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer mes informations";
  }
});
