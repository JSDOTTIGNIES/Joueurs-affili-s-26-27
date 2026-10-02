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
const delegateInput = document.querySelector("#isDelegate");
const medicalBox = document.querySelector("#medicalBox");
const contributionBox = document.querySelector("#contributionBox");
const certificateGivenInput = document.querySelector("#certificateGiven");
const contributionStatusInput = document.querySelector("#contributionStatus");
const photoInput = document.querySelector("#playerPhoto");
const photoPreviewWrap = document.querySelector("#photoPreviewWrap");
const photoPreview = document.querySelector("#photoPreview");
const removePhotoBtn = document.querySelector("#removePhoto");
const certificateInput = document.querySelector("#certificateFile");
const certificatePreviewWrap = document.querySelector("#certificatePreviewWrap");
const certificatePreview = document.querySelector("#certificatePreview");
const certificatePdfPreview = document.querySelector("#certificatePdfPreview");
const removeCertificateBtn = document.querySelector("#removeCertificate");

const CLOUDINARY_CLOUD_NAME = "cszeq2is";
const CLOUDINARY_UPLOAD_PRESET = "jsdottignies_joueurs";

team.innerHTML = '<option value="">Choisir une équipe</option>' + TEAMS.map(t => `<option>${t}</option>`).join("");

const clean = v => String(v || "").trim();




function updateDelegateState() {
  const isDelegate = !!delegateInput?.checked;

  if (certificateGivenInput) certificateGivenInput.disabled = isDelegate;
  if (certificateInput) certificateInput.disabled = isDelegate;
  if (contributionStatusInput) contributionStatusInput.disabled = isDelegate;

  if (medicalBox) medicalBox.classList.toggle("disabled-section", isDelegate);
  if (contributionBox) contributionBox.classList.toggle("disabled-section", isDelegate);

  if (isDelegate) {
    if (certificateGivenInput) certificateGivenInput.checked = false;
    if (certificateInput) certificateInput.value = "";
    if (certificatePreview) certificatePreview.removeAttribute("src");
    if (certificatePreview) certificatePreview.classList.add("hidden");
    if (certificatePdfPreview) certificatePdfPreview.classList.add("hidden");
    if (certificatePreviewWrap) certificatePreviewWrap.classList.add("hidden");
    if (contributionStatusInput) contributionStatusInput.value = "unpaid";
  }
}

if (delegateInput) {
  delegateInput.addEventListener("change", updateDelegateState);
  updateDelegateState();
}

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


certificateInput.addEventListener("change", () => {
  const file = certificateInput.files[0];
  certificatePreview.classList.add("hidden");
  certificatePdfPreview.classList.add("hidden");
  certificatePreview.removeAttribute("src");

  if (!file) {
    certificatePreviewWrap.classList.add("hidden");
    return;
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    alert("Format non autorisé. Utilise JPG, PNG, WEBP ou PDF.");
    certificateInput.value = "";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("Le certificat dépasse 10 Mo.");
    certificateInput.value = "";
    return;
  }

  certificatePreviewWrap.classList.remove("hidden");

  if (file.type === "application/pdf") {
    certificatePdfPreview.textContent = `PDF sélectionné : ${file.name}`;
    certificatePdfPreview.classList.remove("hidden");
  } else {
    certificatePreview.src = URL.createObjectURL(file);
    certificatePreview.classList.remove("hidden");
  }
});

removeCertificateBtn.addEventListener("click", () => {
  certificateInput.value = "";
  certificatePreview.removeAttribute("src");
  certificatePreview.classList.add("hidden");
  certificatePdfPreview.classList.add("hidden");
  certificatePreviewWrap.classList.add("hidden");
});

async function uploadCertificate(file) {
  if (!file) return {
    certificateFileUrl: "",
    certificatePublicId: "",
    certificateResourceType: "",
    certificateOriginalName: ""
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  // Important: PDFs are also uploaded through the "image" endpoint.
  // Cloudinary supports PDFs as image assets and delivers them more reliably
  // than raw assets for this use case.
  const resourceType = "image";

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("Cloudinary certificate upload error:", details);
    throw new Error("Impossible d’envoyer le certificat.");
  }

  const result = await response.json();

  return {
    certificateFileUrl: result.secure_url || "",
    certificatePublicId: result.public_id || "",
    certificateResourceType: resourceType,
    certificateOriginalName: file.name || ""
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours…";
  status.className = "status";
  status.textContent = "";
  try {
    const isDelegate = delegateInput.checked;
    const certificateGiven = isDelegate ? false : certificateGivenInput.checked;
    const selectedCertificate = isDelegate ? null : (certificateInput.files[0] || null);

    if (!isDelegate && !certificateGiven && !selectedCertificate) {
      throw new Error("Merci de cocher « Certificat médical remis au coach » ou de joindre le certificat médical.");
    }

    const { photoUrl, photoPublicId } = await uploadPlayerPhoto(photoInput.files[0] || null);
    let certificateFileUrl = "";
    let certificatePublicId = "";
    let certificateResourceType = "";
    let certificateOriginalName = "";

    if (!isDelegate) {
      ({
        certificateFileUrl,
        certificatePublicId,
        certificateResourceType,
        certificateOriginalName
      } = await uploadCertificate(selectedCertificate));
    }

    await addDoc(collection(db, "players"), {
      team: team.value,
      fullName: clean(document.querySelector("#fullName").value),
      address: clean(document.querySelector("#address").value),
      postalCode: clean(document.querySelector("#postalCode").value),
      city: clean(document.querySelector("#city").value),
      email: clean(document.querySelector("#email").value).toLowerCase(),
      phone: clean(document.querySelector("#phone").value),
      emergency1: clean(document.querySelector("#emergency1").value),
      emergency2: clean(document.querySelector("#emergency2").value),
      photoUrl,
      photoPublicId,
      certificateFileUrl,
      certificatePublicId,
      certificateResourceType,
      certificateOriginalName,
      certificateGiven,
      isDelegate,
      contributionStatus: isDelegate ? "" : (document.querySelector("#contributionStatus")?.value || "unpaid"),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    form.reset();
    updateDelegateState();
    updateDelegateState();
    photoPreview.removeAttribute("src");
    photoPreviewWrap.classList.add("hidden");
    certificatePreview.removeAttribute("src");
    certificatePreview.classList.add("hidden");
    certificatePdfPreview.classList.add("hidden");
    certificatePreviewWrap.classList.add("hidden");
    status.className = "status success";
    status.textContent = "Merci, les informations ont bien été envoyées.";
  } catch (err) {
    console.error(err);
    status.className = "status error";
    status.textContent = err?.message || "Une erreur est survenue lors de l’envoi.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer mes informations";
  }
});
