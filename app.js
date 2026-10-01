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
const photoInput = document.querySelector("#playerPhoto");
const photoPreviewWrap = document.querySelector("#photoPreviewWrap");
const photoPreview = document.querySelector("#photoPreview");
const removePhotoBtn = document.querySelector("#removePhoto");
const CLOUDINARY_CLOUD_NAME = "cszeq2is";
const CLOUDINARY_UPLOAD_PRESET = "jsdottignies_joueurs";

team.innerHTML = '<option value="">Choisir une équipe</option>' + TEAMS.map(t => `<option>${t}</option>`).join("");

const clean = v => String(v || "").trim();


photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) {
    photoPreviewWrap.classList.add("hidden");
    photoPreview.removeAttribute("src");
    return;
  }
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    alert("Format non autorisé. Utilise une image JPG, PNG ou WEBP.");
    photoInput.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("La photo dépasse 5 Mo.");
    photoInput.value = "";
    return;
  }
  photoPreview.src = URL.createObjectURL(file);
  photoPreviewWrap.classList.remove("hidden");
});

removePhotoBtn.addEventListener("click", () => {
  photoInput.value = "";
  photoPreview.removeAttribute("src");
  photoPreviewWrap.classList.add("hidden");
});

async function uploadPlayerPhoto(file) {
  if (!file) return { photoUrl: "", photoPublicId: "" };
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!response.ok) {
    const details = await response.text();
    console.error("Cloudinary upload error:", details);
    throw new Error("Impossible d’envoyer la photo.");
  }
  const result = await response.json();
  return {
    photoUrl: result.secure_url || "",
    photoPublicId: result.public_id || ""
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours…";
  status.className = "status";
  status.textContent = "";
  try {
    const { photoUrl, photoPublicId } = await uploadPlayerPhoto(photoInput.files[0] || null);
    await addDoc(collection(db, "players"), {
      team: team.value,
      fullName: clean(document.querySelector("#fullName").value),
      address: clean(document.querySelector("#address").value),
      email: clean(document.querySelector("#email").value).toLowerCase(),
      phone: clean(document.querySelector("#phone").value),
      emergency1: clean(document.querySelector("#emergency1").value),
      emergency2: clean(document.querySelector("#emergency2").value),
      photoUrl,
      photoPublicId,
      certificateGiven: document.querySelector("#certificateGiven").checked,
      contributionStatus: document.querySelector("#contributionStatus").value,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    form.reset();
    photoPreview.removeAttribute("src");
    photoPreviewWrap.classList.add("hidden");
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
