const $ = id => document.getElementById(id);

const fields = [
  "name", "job", "email", "phone", "location",
  "birth", "salary", "portfolio", "profile",
  "education", "experience", "projects",
  "skills", "languages", "certifications", "references",
  "portfolioPageTitle", "portfolioIntro"
];

let activeStudioMode = "resume"; // "resume" หรือ "portfolio"
let currentPhotoData = "";
let suggestionVariantIndex = 0;
let currentRecommendedSkills = [];
let portfolioItems = [];

let currentTheme = {
  template: "classic",
  accent: "#6c52e8",
  soft: "#f0edff",
  photoShape: "circle",
  photoSize: "125px",
  skillTags: true,
  portfolioCols: "2"
};

function safeText(value, fallback) {
  return (value || "").trim() || fallback;
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getInitials(nameStr) {
  const clean = (nameStr || "").trim();
  if (!clean) return "สจ";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

// ==========================================
// ระบบสลับหน้า रेซูเม่ <-> พอร์ตโฟลิโอ
// ==========================================
function switchStudioMode(mode, scrollToBuilder = false) {
  activeStudioMode = mode === "portfolio" ? "portfolio" : "resume";
  const isPortfolio = activeStudioMode === "portfolio";

  // สลับฟอร์มด้านซ้าย
  $("resumeFormView").hidden = isPortfolio;
  $("portfolioFormView").hidden = !isPortfolio;

  // สลับกระดาษพรีวิวด้านขวา
  $("resumePaper").hidden = isPortfolio;
  $("portfolioPaper").hidden = !isPortfolio;

  // อัปเดตสถานะปุ่มแท็บด้านบนและในหน้าทำงาน
  $("tabResumeMode").classList.toggle("active", !isPortfolio);
  $("tabResumeMode").setAttribute("aria-selected", String(!isPortfolio));
  $("tabPortfolioMode").classList.toggle("active", isPortfolio);
  $("tabPortfolioMode").setAttribute("aria-selected", String(isPortfolio));

  $("navResumeBtn")?.classList.toggle("active", !isPortfolio);
  $("navPortfolioBtn")?.classList.toggle("active", isPortfolio);

  $("previewSwitchResumeBtn").classList.toggle("active", !isPortfolio);
  $("previewSwitchPortfolioBtn").classList.toggle("active", isPortfolio);

  // อัปเดตข้อความหัวพรีวิวและปุ่มดาวน์โหลด
  if (isPortfolio) {
    $("previewStepLabel").textContent = "กำลังแสดง: หน้าพอร์ตโฟลิโอ (แผ่นที่ 2)";
    $("previewHeadingTitle").textContent = "Portfolio Preview";
    $("downloadCurrentBtn").textContent = "↓ พิมพ์เฉพาะหน้าพอร์ตโฟลิโอ (PDF)";
  } else {
    $("previewStepLabel").textContent = "กำลังแสดง: หน้าเรซูเม่ (แผ่นที่ 1)";
    $("previewHeadingTitle").textContent = "Resume Preview";
    $("downloadCurrentBtn").textContent = "↓ พิมพ์เฉพาะหน้าเรซูเม่ (PDF)";
  }

  if (scrollToBuilder) {
    $("builder").scrollIntoView({ behavior: "smooth" });
  }
}

$("tabResumeMode").addEventListener("click", () => switchStudioMode("resume"));
$("tabPortfolioMode").addEventListener("click", () => switchStudioMode("portfolio"));
$("previewSwitchResumeBtn").addEventListener("click", () => switchStudioMode("resume"));
$("previewSwitchPortfolioBtn").addEventListener("click", () => switchStudioMode("portfolio"));

$("navResumeBtn")?.addEventListener("click", e => {
  e.preventDefault();
  switchStudioMode("resume", true);
});
$("navPortfolioBtn")?.addEventListener("click", e => {
  e.preventDefault();
  switchStudioMode("portfolio", true);
});
$("heroGoResumeBtn")?.addEventListener("click", () => switchStudioMode("resume", true));
$("heroGoPortfolioBtn")?.addEventListener("click", () => switchStudioMode("portfolio", true));
$("goToPortfolioFormBtn")?.addEventListener("click", () => {
  switchStudioMode("portfolio", true);
  showToast("🎨 สลับมาที่หน้าสร้างพอร์ตโฟลิโอแล้ว");
});
$("backToResumeFormBtn")?.addEventListener("click", () => {
  switchStudioMode("resume", true);
  showToast("📄 กลับมาที่หน้าสร้างเรซูเม่แล้ว");
});
$("backToResumeEditBtn")?.addEventListener("click", () => {
  switchStudioMode("resume", true);
  $("name").focus();
});

// ==========================================
// เรนเดอร์รูปถ่ายโปรไฟล์ทั้ง 2 หน้า
// ==========================================
function renderPhotoBoxes() {
  const initials = getInitials($("name").value);
  const shape = $("photoShape").value;
  const size = $("photoSize").value || "125px";
  currentTheme.photoShape = shape;
  currentTheme.photoSize = size;

  document.documentElement.style.setProperty("--photo-size", size);

  const boxes = [$("formPhotoPreview"), $("pPhotoBox"), $("portPhotoBox")];
  boxes.forEach(box => {
    if (!box) return;
    box.classList.remove("shape-rounded", "shape-portrait");
    if (shape === "rounded") box.classList.add("shape-rounded");
    else if (shape === "portrait") box.classList.add("shape-portrait");
  });

  $("pPhotoBox").hidden = (shape === "hidden");
  $("portPhotoBox").hidden = (shape === "hidden");

  if (currentPhotoData) {
    $("formPhotoPreview").innerHTML = `<img src="${currentPhotoData}" alt="รูปโปรไฟล์">`;
    $("pPhotoBox").innerHTML = `<img src="${currentPhotoData}" alt="รูปโปรไฟล์">`;
    $("portPhotoBox").innerHTML = `<img src="${currentPhotoData}" alt="รูปโปรไฟล์">`;
    $("removePhotoBtn").hidden = false;
  } else {
    $("formPhotoPreview").innerHTML = `<span id="formPhotoInitials">${initials}</span>`;
    $("pPhotoBox").innerHTML = `<span id="pPhotoInitials">${initials}</span>`;
    $("portPhotoBox").innerHTML = `<span id="portPhotoInitials">${initials}</span>`;
    $("removePhotoBtn").hidden = true;
  }
}

function renderSkills() {
  const raw = $("skills").value.trim();
  const useTags = $("skillTagsToggle").checked;
  currentTheme.skillTags = useTags;
  const container = $("pSkillsContainer");

  if (!raw) {
    container.innerHTML = `<p id="pSkills">ทักษะความสามารถ</p>`;
    return;
  }

  if (useTags) {
    const items = raw.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
    if (items.length > 0) {
      container.innerHTML = `<div class="skill-Badge-list">${items
        .map(item => `<span class="skill-badge">${escapeHtml(item)}</span>`)
        .join("")}</div>`;
      return;
    }
  }
  container.innerHTML = `<p id="pSkills">${escapeHtml(raw)}</p>`;
}

function toggleOptionalSection(sectionId, textId, value) {
  const clean = (value || "").trim();
  const sec = $(sectionId);
  const el = $(textId);
  if (clean) {
    sec.hidden = false;
    el.textContent = clean;
  } else {
    sec.hidden = true;
    el.textContent = "";
  }
}

// ==========================================
// ระบบจัดการพอร์ตโฟลิโอ (Portfolio Studio)
// ==========================================
function createSvgCoverDataUrl(title, tag, color1 = "#6c52e8", color2 = "#2563eb") {
  const safeTitle = escapeHtml((title || "Project").slice(0, 26));
  const safeTag = escapeHtml((tag || "PORTFOLIO").slice(0, 24));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="360" fill="url(#g)"/>
    <circle cx="520" cy="60" r="110" fill="rgba(255,255,255,0.12)"/>
    <circle cx="80" cy="310" r="140" fill="rgba(255,255,255,0.08)"/>
    <rect x="42" y="52" width="516" height="256" rx="16" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)"/>
    <text x="72" y="130" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700" opacity="0.9">${safeTag}</text>
    <text x="72" y="185" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="800">${safeTitle}</text>
    <text x="72" y="255" fill="#ffffff" font-family="sans-serif" font-size="14" opacity="0.85">✦ PORTFOLIO SHOWCASE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function renderPortfolioInputs() {
  const container = $("portfolioInputsContainer");
  if (!container) return;

  if (portfolioItems.length === 0) {
    container.innerHTML = `
      <div class="empty-portfolio-state">
        <h4>ยังไม่มีการ์ดผลงานในหน้าพอร์ตโฟลิโอ</h4>
        <p>กดปุ่ม <b>"+ เพิ่มการ์ดผลงานใหม่"</b> หรือให้ <b>"✦ AI สร้างพอร์ตโฟลิโอตัวอย่าง"</b> ด้านบนได้เลย</p>
      </div>
    `;
    renderPortfolioPreview();
    return;
  }

  container.innerHTML = "";
  portfolioItems.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "portfolio-item-card";
    card.innerHTML = `
      <div class="portfolio-item-head">
        <strong>🎨 ผลงานชิ้นที่ ${idx + 1}</strong>
        <button type="button" class="remove-port-btn" data-idx="${idx}">✕ ลบการ์ดนี้</button>
      </div>
      <div class="two-col">
        <label>ชื่อผลงาน / ชื่อโปรเจกต์
          <input type="text" data-idx="${idx}" data-key="title" value="${escapeHtml(item.title)}" placeholder="เช่น เว็บไซต์ E-Commerce ร้านค้าออนไลน์">
        </label>
        <label>หมวดหมู่ / เครื่องมือที่ใช้ (Tags)
          <input type="text" data-idx="${idx}" data-key="tag" value="${escapeHtml(item.tag)}" placeholder="เช่น HTML/CSS · JavaScript · UI/UX">
        </label>
      </div>
      <label>รายละเอียดผลงาน บทบาทหน้าที่ หรือผลลัพธ์
        <textarea rows="2" data-idx="${idx}" data-key="desc" placeholder="อธิบายจุดเด่นของโปรเจกต์ สิ่งที่ได้พัฒนา หรือผลลัพธ์ของงาน">${escapeHtml(item.desc)}</textarea>
      </label>
      <div class="two-col">
        <label>ลิงก์ดูผลงาน / GitHub / เว็บไซต์จริง
          <input type="text" data-idx="${idx}" data-key="link" value="${escapeHtml(item.link)}" placeholder="เช่น github.com/somchai/project">
        </label>
        <label>รูปภาพหน้าปกผลงาน
          <div class="portfolio-img-row">
            <input type="file" accept="image/*" data-idx="${idx}" class="port-file-input" hidden>
            <button type="button" class="btn btn-soft btn-xs port-upload-btn" data-idx="${idx}">🖼 อัปโหลดรูปผลงาน</button>
            <button type="button" class="btn btn-outline btn-xs port-gen-cover-btn" data-idx="${idx}">✦ สร้างปกกราฟิก</button>
            ${item.image ? `<button type="button" class="btn btn-danger-soft btn-xs port-clear-img-btn" data-idx="${idx}">ลบรูป</button>` : ""}
          </div>
        </label>
      </div>
      ${item.image ? `<img src="${item.image}" class="portfolio-thumb-preview" alt="ตัวอย่างรูปผลงาน">` : ""}
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("input[data-key], textarea[data-key]").forEach(input => {
    input.addEventListener("input", e => {
      const i = Number(e.target.getAttribute("data-idx"));
      const k = e.target.getAttribute("data-key");
      if (portfolioItems[i]) {
        portfolioItems[i][k] = e.target.value;
        renderPortfolioPreview();
      }
    });
  });

  container.querySelectorAll(".remove-port-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-idx"));
      portfolioItems.splice(i, 1);
      renderPortfolioInputs();
      showToast("ลบการ์ดผลงานแล้ว");
    });
  });

  container.querySelectorAll(".port-upload-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = btn.getAttribute("data-idx");
      const fileInput = container.querySelector(`.port-file-input[data-idx="${i}"]`);
      if (fileInput) fileInput.click();
    });
  });

  container.querySelectorAll(".port-gen-cover-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-idx"));
      const item = portfolioItems[i];
      if (!item) return;
      item.image = createSvgCoverDataUrl(
        item.title || `Project #${i + 1}`,
        item.tag || "PORTFOLIO WORK",
        currentTheme.accent,
        "#1e293b"
      );
      renderPortfolioInputs();
      showToast("✦ สร้างปกกราฟิกให้การ์ดผลงานแล้ว");
    });
  });

  container.querySelectorAll(".port-clear-img-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-idx"));
      if (portfolioItems[i]) {
        portfolioItems[i].image = "";
        renderPortfolioInputs();
      }
    });
  });

  container.querySelectorAll(".port-file-input").forEach(fileInput => {
    fileInput.addEventListener("change", e => {
      const i = Number(e.target.getAttribute("data-idx"));
      const file = e.target.files && e.target.files[0];
      if (!file || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 680;
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          portfolioItems[i].image = canvas.toDataURL("image/jpeg", 0.86);
          renderPortfolioInputs();
          showToast("อัปโหลดรูปหน้าปกผลงานเรียบร้อยแล้ว");
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  });

  renderPortfolioPreview();
}

function renderPortfolioPreview() {
  const nameVal = safeText($("name").value, "ชื่อ-นามสกุล");
  const jobVal = safeText($("job").value, "ตำแหน่งที่ต้องการสมัคร");

  $("portName").textContent = nameVal;
  $("portJob").textContent = jobVal;
  $("portSyncNameLabel").textContent = `${nameVal} (${jobVal})`;

  const portContact = [
    $("email").value.trim(),
    $("phone").value.trim(),
    $("portfolio").value.trim() || $("location").value.trim()
  ].filter(Boolean);
  $("portContact").textContent = portContact.length
    ? portContact.join(" · ")
    : "อีเมล · เบอร์โทรศัพท์ · ลิงก์ผลงาน";

  $("pPortfolioHeading").textContent = safeText(
    $("portfolioPageTitle")?.value,
    "PORTFOLIO & SELECTED WORKS"
  );

  const introVal = ($("portfolioIntro")?.value || "").trim();
  $("pPortfolioIntro").textContent =
    introVal ||
    `แฟ้มสะสมผลงานและโปรเจกต์ที่โดดเด่นของ ${nameVal} ในสายงาน ${jobVal}`;

  const cols = $("portfolioGridCols")?.value || "2";
  currentTheme.portfolioCols = cols;
  const grid = $("pPortfolioGrid");
  grid.classList.toggle("cols-1", cols === "1");

  const validItems = portfolioItems.filter(
    item => (item.title && item.title.trim()) || (item.desc && item.desc.trim()) || item.image
  );

  $("portfolioCountBadge").textContent = `${validItems.length} ผลงาน`;

  if (validItems.length === 0) {
    grid.innerHTML = `
      <div class="portfolio-card">
        <div class="portfolio-card-body">
          <span class="portfolio-card-tag">SAMPLE PREVIEW</span>
          <h5>ยังไม่มีรายการผลงานในพอร์ตโฟลิโอ</h5>
          <p>กดปุ่ม "+ เพิ่มการ์ดผลงานใหม่" หรือ "✦ AI สร้างพอร์ตโฟลิโอตัวอย่าง" ในฟอร์มด้านซ้ายเพื่อแสดงการ์ดผลงานของคุณที่นี่</p>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = validItems
    .map(item => `
      <div class="portfolio-card">
        ${item.image ? `<img src="${item.image}" class="portfolio-card-img" alt="${escapeHtml(item.title || 'ผลงาน')}">` : ""}
        <div class="portfolio-card-body">
          ${item.tag ? `<span class="portfolio-card-tag">${escapeHtml(item.tag)}</span>` : ""}
          <h5>${escapeHtml(item.title || "ชื่อผลงาน")}</h5>
          ${item.desc ? `<p>${escapeHtml(item.desc)}</p>` : ""}
          ${item.link ? `<div class="portfolio-card-link">🔗 ${escapeHtml(item.link)}</div>` : ""}
        </div>
      </div>
    `)
    .join("");
}

$("addPortfolioBtn")?.addEventListener("click", () => {
  const nextNum = portfolioItems.length + 1;
  portfolioItems.push({
    title: `ผลงานชิ้นที่ ${nextNum}`,
    tag: "Web / Project",
    desc: "",
    link: "",
    image: createSvgCoverDataUrl(`Project #${nextNum}`, "PORTFOLIO WORK", currentTheme.accent, "#2563eb")
  });
  renderPortfolioInputs();
  showToast("เพิ่มการ์ดผลงานใหม่แล้ว");
});

$("portfolioGridCols")?.addEventListener("change", renderPortfolioPreview);

// AI Resume Score
function updateAiScore() {
  let score = 0;
  const tips = [];

  if ($("name").value.trim() && $("job").value.trim()) score += 18;
  else tips.push("ระบุชื่อ-นามสกุลและตำแหน่งที่ต้องการสมัคร");

  if ($("email").value.trim() && $("phone").value.trim()) score += 12;
  else tips.push("เพิ่มอีเมลและเบอร์โทรศัพท์ให้ครบถ้วน");

  if (currentPhotoData) score += 12;
  else tips.push("อัปโหลดรูปโปรไฟล์เพื่อเพิ่มความน่าเชื่อถือ (+12%)");

  const profileLen = $("profile").value.trim().length;
  if (profileLen >= 60) score += 16;
  else if (profileLen > 0) {
    score += 8;
    tips.push("ขยายข้อความแนะนำตัวให้อ่านน่าสนใจขึ้น หรือกดปุ่ม ✦ AI ช่วยเขียนแนะนำตัว");
  } else {
    tips.push("กดปุ่ม ✦ AI ช่วยเขียนแนะนำตัว เพื่อสร้างจุดเด่น");
  }

  if ($("education").value.trim().length >= 15) score += 12;
  else tips.push("ระบุวุฒิการศึกษาและสถานศึกษา");

  if ($("experience").value.trim().length >= 30) score += 14;
  else tips.push("กดปุ่ม ✦ AI ช่วยร่างประสบการณ์ เพื่อเพิ่มรายละเอียดงาน");

  const skillCount = $("skills").value.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean).length;
  if (skillCount >= 4) score += 10;
  else tips.push("กด ✦ AI แนะนำทักษะ เพื่อเพิ่มทักษะสำคัญอย่างน้อย 4 รายการ");

  if ($("projects").value.trim() || $("languages").value.trim() || portfolioItems.length > 0) score += 6;
  else tips.push("เพิ่มโครงงาน ทักษะภาษา หรือการ์ดพอร์ตโฟลิโอเพื่อให้สมบูรณ์ 100%");

  score = Math.min(100, score);
  $("aiScoreValue").textContent = `${score}%`;
  $("aiScoreBar").style.width = `${Math.max(8, score)}%`;

  if (score >= 95) {
    $("aiScoreTip").textContent = "🌟 ยอดเยี่ยม! ข้อมูลของคุณครบถ้วนสมบูรณ์ สามารถสลับไปทำหน้าพอร์ตโฟลิโอหรือพิมพ์ PDF ได้เลย";
  } else {
    $("aiScoreTip").textContent = `💡 คำแนะนำ AI: ${tips[0]}`;
  }
}

function updatePreview() {
  $("pName").textContent = safeText($("name").value, "ชื่อ-นามสกุล");
  $("pJob").textContent = safeText($("job").value, "ตำแหน่งที่ต้องการสมัคร");

  const contact = [
    $("email").value.trim(),
    $("phone").value.trim(),
    $("location").value.trim()
  ].filter(Boolean);
  $("pContact").textContent = contact.length
    ? contact.join(" · ")
    : "อีเมล · เบอร์โทรศัพท์ · ที่อยู่";

  const extraMeta = [
    $("birth").value.trim(),
    $("salary").value.trim(),
    $("portfolio").value.trim()
  ].filter(Boolean);
  if (extraMeta.length) {
    $("pExtraMeta").hidden = false;
    $("pExtraMeta").textContent = extraMeta.join("  |  ");
  } else {
    $("pExtraMeta").hidden = true;
    $("pExtraMeta").textContent = "";
  }

  $("pProfile").textContent = safeText(
    $("profile").value,
    "เพิ่มข้อความแนะนำตัวเพื่อแสดงจุดเด่นของคุณ"
  );
  $("pEducation").textContent = safeText(
    $("education").value,
    "ประวัติการศึกษาของคุณ"
  );
  $("pExperience").textContent = safeText(
    $("experience").value,
    "ประสบการณ์ทำงาน ฝึกงาน หรือกิจกรรม"
  );

  toggleOptionalSection("secProjects", "pProjects", $("projects").value);
  toggleOptionalSection("secLanguages", "pLanguages", $("languages").value);
  toggleOptionalSection("secCertifications", "pCertifications", $("certifications").value);
  toggleOptionalSection("secReferences", "pReferences", $("references").value);

  renderSkills();
  renderPhotoBoxes();
  renderPortfolioPreview();
  updateAiScore();
}

fields.forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("input", updatePreview);
});

$("photoShape").addEventListener("change", updatePreview);
$("photoSize").addEventListener("change", updatePreview);
$("skillTagsToggle").addEventListener("change", updatePreview);

// อัปโหลดรูปโปรไฟล์
$("uploadPhotoBtn").addEventListener("click", () => $("photoInput").click());

$("photoInput").addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file || !file.type.startsWith("image/")) {
    showToast("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 480;
      let w = img.width;
      let h = img.height;
      if (w > h && w > maxSize) {
        h = Math.round((h * maxSize) / w);
        w = maxSize;
      } else if (h >= w && h > maxSize) {
        w = Math.round((w * maxSize) / h);
        h = maxSize;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      currentPhotoData = canvas.toDataURL("image/jpeg", 0.88);
      if ($("photoShape").value === "hidden") $("photoShape").value = "circle";
      updatePreview();
      showToast("อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว");
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

$("removePhotoBtn").addEventListener("click", () => {
  currentPhotoData = "";
  $("photoInput").value = "";
  updatePreview();
  showToast("ลบรูปโปรไฟล์แล้ว");
});

// สลับเทมเพลตทั้งแผ่นเรซูเม่และแผ่นพอร์ตโฟลิโอ
function applyTemplateStyle(val) {
  currentTheme.template = val;
  $("templateSelect").value = val;
  document.querySelectorAll("#templateTabs .tpl-card-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tpl") === val);
  });
  [$("resumePaper"), $("portfolioPaper")].forEach(paper => {
    if (!paper) return;
    paper.classList.remove("tpl-classic", "tpl-banner", "tpl-split", "tpl-sidebar", "tpl-minimal", "tpl-creative");
    if (val !== "classic") paper.classList.add(`tpl-${val}`);
  });
}

$("templateSelect").addEventListener("change", e => applyTemplateStyle(e.target.value));

document.querySelectorAll("#templateTabs .tpl-card-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    applyTemplateStyle(btn.getAttribute("data-tpl"));
    showToast(`เปลี่ยนเป็นเทมเพลต ${btn.textContent} แล้ว`);
  });
});

document.querySelectorAll("#colorPicker .color-dot").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#colorPicker .color-dot").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const accent = btn.getAttribute("data-color");
    const soft = btn.getAttribute("data-soft");
    currentTheme.accent = accent;
    currentTheme.soft = soft;
    document.documentElement.style.setProperty("--resume-accent", accent);
    document.documentElement.style.setProperty("--resume-accent-soft", soft);
  });
});

// ข้อมูลคลังความรู้ AI ตามสายงาน
function detectRoleCategory(jobStr) {
  const role = (jobStr || "").toLowerCase();
  if (/web|frontend|backend|fullstack|developer|โปรแกรม|ไอที|คอมพิวเตอร์|เทคโนโลยี|software|data|ai|it|network/.test(role)) return "tech";
  if (/กราฟิก|ออกแบบ|design|ux|ui|แอดมิน|content|คอนเทนต์|สื่อ|ตัดต่อ|ครีเอทีฟ|วิดีโอ/.test(role)) return "creative";
  if (/บัญชี|การเงิน|ธุรการ|admin|เอกสาร|ประสานงาน|บุคคล|hr|จัดซื้อ/.test(role)) return "admin";
  if (/ขาย|การตลาด|marketing|บริการ|ลูกค้า|ประชาสัมพันธ์|sale|telesale|ที่ปรึกษา/.test(role)) return "marketing";
  if (/วิศว|ช่าง|เทคนิค|โรงงาน|ผลิต|โลจิสติกส์|คลัง|ความปลอดภัย|จป/.test(role)) return "engineering";
  return "general";
}

function getSuggestion(job, skills, education, experience, projects, tone, variantIdx = 0) {
  const cleanJob = job.trim() || "ผู้สมัครงาน";
  const cat = detectRoleCategory(cleanJob);

  if (tone === "english") {
    const engIntros = [
      `Detail-oriented and motivated ${cleanJob} with a strong foundation in modern workflows and problem-solving.`,
      `Results-driven ${cleanJob} passionate about delivering high-quality work and continuous improvement.`,
      `Proactive ${cleanJob} adept at collaborating across teams and applying technical and analytical skills to achieve organizational goals.`
    ];
    const base = engIntros[variantIdx % engIntros.length];
    const sk = skills.trim() ? ` Proficient in ${skills.trim()}.` : "";
    const ed = education.trim() ? ` Educational background in ${education.split("\n")[0].trim()}.` : "";
    return `${base}${ed}${sk} Ready to contribute effectively and grow with the organization.`;
  }

  const roleIntros = {
    tech: [
      "มีความเชี่ยวชาญและความสนใจด้านเทคโนโลยีสารสนเทศและการพัฒนาระบบ สามารถประยุกต์ใช้ทักษะดิจิทัลและการคิดวิเคราะห์เชิงตรรกะเพื่อแก้ปัญหาได้อย่างเป็นระบบ",
      "มุ่งมั่นในการพัฒนาซอฟต์แวร์และนวัตกรรมดิจิทัลที่ใช้งานง่าย มีประสิทธิภาพสูง พร้อมเรียนรู้เฟรมเวิร์กและเทคโนโลยีสมัยใหม่อย่างต่อเนื่อง",
      "มีทักษะในการออกแบบและพัฒนาระบบงานไอที สามารถทำงานร่วมกับทีมพัฒนาและแปลงความต้องการของผู้ใช้ให้เป็นระบบที่ใช้งานได้จริง"
    ],
    creative: [
      "มีความคิดสร้างสรรค์และทักษะด้านการออกแบบสื่อดิจิทัล สามารถถ่ายทอดอัตลักษณ์ของแบรนด์และเรื่องราวออกมาเป็นชิ้นงานที่ดึงดูดสายตาและตรงกลุ่มเป้าหมาย",
      "หลงใหลในการออกแบบประสบการณ์ผู้ใช้และการผลิตคอนเทนต์สร้างสรรค์ ผสมผสานความสวยงามเข้ากับการใช้งานจริงได้อย่างลงตัว",
      "มีทักษะในการสื่อสารด้วยภาพและงานครีเอทีฟ พร้อมเปิดรับเทรนด์การออกแบบใหม่ ๆ เพื่อสร้างสรรค์ผลงานที่สร้างผลลัพธ์จริงให้องค์กร"
    ],
    admin: [
      "มีความละเอียดรอบคอบในการบริหารจัดการงานเอกสาร ข้อมูล และระบบงานภายใน สามารถวางแผนจัดลำดับความสำคัญและประสานงานได้อย่างราบรื่น",
      "มีทักษะด้านการจัดการสำนักงานและการประสานงานระหว่างแผนก มุ่งเน้นความถูกต้อง รวดเร็ว และตรวจสอบได้ของข้อมูล",
      "มีความรับผิดชอบสูงในการสนับสนุนงานบริหารและงานธุรการ สามารถใช้โปรแกรมสำนักงานและเครื่องมือดิจิทัลเพื่อเพิ่มประสิทธิภาพการทำงาน"
    ],
    marketing: [
      "มีทักษะการสื่อสารเชิงกลยุทธ์และการสร้างความสัมพันธ์ที่ดีกับลูกค้า มุ่งเน้นการวิเคราะห์ความต้องการของตลาดเพื่อสร้างยอดขายและความประทับใจ",
      "มีความคิดริเริ่มด้านการตลาดและการสื่อสารการขาย สามารถวางแผนแคมเปญและนำเสนอคุณค่าของสินค้าและบริการได้อย่างน่าสนใจ",
      "มีใจรักงานบริการและการดูแลลูกค้า พร้อมแก้ไขปัญหาเฉพาะหน้าด้วยทัศนคติเชิงบวกเพื่อสร้างประสบการณ์ที่ดีที่สุดให้แก่ลูกค้า"
    ],
    engineering: [
      "มีทักษะด้านการปฏิบัติงานเชิงเทคนิคและการควบคุมกระบวนการทำงาน คำนึงถึงมาตรฐานวิศวกรรม ความปลอดภัย และประสิทธิภาพสูงสุด",
      "สามารถวิเคราะห์แก้ไขปัญหาหน้างานและวางแผนการบำรุงรักษาหรือการผลิตได้อย่างเป็นระบบ พร้อมทำงานร่วมกับทีมช่างและวิศวกรได้อย่างเข้มแข็ง",
      "มีความมุ่งมั่นในการพัฒนากระบวนการทำงานและควบคุมคุณภาพผลงานให้ได้ตามมาตรฐานที่องค์กรกำหนด"
    ],
    general: [
      "มีความมุ่งมั่นตั้งใจในการทำงาน พร้อมเรียนรู้กระบวนการทำงานใหม่ ๆ และปรับตัวเข้ากับวัฒนธรรมองค์กรได้อย่างรวดเร็ว",
      "มีทักษะในการวางแผนการทำงานและการทำงานร่วมกับผู้อื่น มุ่งเน้นการสร้างผลงานที่มีคุณภาพและเติบโตไปพร้อมกับองค์กร",
      "มีความรับผิดชอบและกระตือรือร้นในการพัฒนาตนเอง พร้อมนำความรู้และทักษะที่มีมาสร้างประโยชน์สูงสุดให้แก่ทีม"
    ]
  };

  const list = roleIntros[cat] || roleIntros.general;
  let intro = list[variantIdx % list.length];

  if (tone === "modern") intro = `ผู้สมัครตำแหน่ง ${cleanJob} ที่มุ่งเน้นผลลัพธ์และการทำงานยุคใหม่ ` + intro;
  else if (tone === "freshgrad") intro = `บัณฑิตจบใหม่ไฟแรงในสายงาน ${cleanJob} ` + intro;
  else intro = `ผู้สมัครในสายงาน ${cleanJob} ที่${intro}`;

  const educationText = education.trim() ? ` มีพื้นฐานการศึกษาด้าน ${education.split("\n")[0].replace(/^[•\-]\s*/, "").trim()}.` : "";
  const skillText = skills.trim() ? ` เชี่ยวชาญทักษะสำคัญ อาทิ ${skills.trim()}.` : "";
  const projText = projects.trim() ? ` มีผลงานที่โดดเด่น ได้แก่ ${projects.split("\n")[0].replace(/^[•\-]\s*/, "").trim()}.` : "";
  const experienceText = experience.trim()
    ? " พร้อมนำประสบการณ์จากการปฏิบัติงานจริงมาต่อยอดและสร้างคุณค่าให้แก่องค์กรได้ทันที"
    : " พร้อมนำความรู้และทักษะจากการฝึกฝนมาประยุกต์ใช้ในการปฏิบัติงานจริงอย่างเต็มศักยภาพ";

  return intro + educationText + skillText + projText + experienceText;
}

function generateAiProfile(incrementVariant) {
  const job = $("job").value.trim() || "ผู้เชี่ยวชาญ";
  if (incrementVariant) suggestionVariantIndex++;
  const tone = $("assistTone").value;
  const suggestion = getSuggestion(
    job,
    $("skills").value,
    $("education").value,
    $("experience").value,
    $("projects").value,
    tone,
    suggestionVariantIndex
  );
  $("suggestion").hidden = false;
  $("suggestion").textContent = suggestion;
  $("profile").value = suggestion;
  updatePreview();
}

$("suggestBtn").addEventListener("click", () => {
  if (!$("job").value.trim()) {
    showToast("กรุณากรอกตำแหน่งที่ต้องการสมัครก่อนใช้ AI");
    $("job").focus();
    return;
  }
  generateAiProfile(false);
  showToast("✦ AI เขียนข้อความแนะนำตัวเรียบร้อยแล้ว");
});

$("shuffleSuggestBtn").addEventListener("click", () => {
  if (!$("job").value.trim()) {
    showToast("กรุณากรอกตำแหน่งที่ต้องการสมัครก่อน");
    $("job").focus();
    return;
  }
  generateAiProfile(true);
  showToast("↻ AI เปลี่ยนสำนวนแนะนำตัวใหม่แล้ว");
});

$("aiExpBtn").addEventListener("click", () => {
  const job = $("job").value.trim() || "เจ้าหน้าที่ปฏิบัติการ";
  const cat = detectRoleCategory(job);
  const templates = {
    tech: `• นักศึกษาฝึกงาน / ผู้พัฒนาด้าน ${job}\n  - พัฒนาและปรับปรุงระบบงานให้รองรับการใช้งานทุกอุปกรณ์อย่างมีประสิทธิภาพ\n  - ร่วมวิเคราะห์ความต้องการของผู้ใช้ ทดสอบระบบ (Testing) และแก้ไขข้อผิดพลาด (Bug Fixing)\n  - ประสานงานร่วมกับทีมด้วยระบบ Git และจัดทำเอกสารคู่มือการใช้งาน`,
    creative: `• นักออกแบบและสร้างสรรค์สื่อ (${job})\n  - ออกแบบสื่อกราฟิกและคอนเทนต์ดิจิทัลสำหรับช่องทางโซเชียลมีเดียและเว็บไซต์\n  - วางแนวคิด (Concept) และปรับปรุง UX/UI ให้ใช้งานง่ายและสอดคล้องกับภาพลักษณ์องค์กร\n  - ประสานงานกับทีมการตลาดเพื่อส่งมอบงานตรงตามกำหนดเวลา`,
    admin: `• เจ้าหน้าที่ประสานงานและบริหารงานเอกสาร (${job})\n  - จัดทำ ตรวจสอบ และจัดเก็บเอกสารสำคัญของหน่วยงานอย่างเป็นระบบและแม่นยำ\n  - บันทึกและสรุปข้อมูลด้วยโปรแกรม Microsoft Excel / Google Sheets เพื่อเสนอผู้บริหาร\n  - ประสานงานระหว่างแผนกและอำนวยความสะดวกให้แก่ผู้มาติดต่อ`,
    marketing: `• เจ้าหน้าที่การตลาดและดูแลลูกค้า (${job})\n  - วิเคราะห์กลุ่มเป้าหมายและร่วมวางแผนแคมเปญประชาสัมพันธ์สินค้าและบริการ\n  - ให้คำแนะนำ ตอบข้อซักถาม และดูแลแก้ไขปัญหาให้แก่ลูกค้าด้วยความรวดเร็ว\n  - สรุปยอดขายและรวบรวมข้อเสนอแนะของลูกค้าเพื่อนำมาพัฒนาการบริการ`,
    engineering: `• เจ้าหน้าที่เทคนิคและวิศวกรรม (${job})\n  - ตรวจสอบและควบคุมกระบวนการทำงานให้เป็นไปตามมาตรฐานความปลอดภัยและคุณภาพ\n  - วิเคราะห์สาเหตุของปัญหาหน้างานและดำเนินการแก้ไขปรับปรุงอย่างเป็นระบบ\n  - จัดทำรายงานสรุปผลการปฏิบัติงานและแผนการบำรุงรักษาประจำสัปดาห์`,
    general: `• ผู้ปฏิบัติงาน / นักศึกษาฝึกงาน ตำแหน่ง ${job}\n  - รับผิดชอบงานตามที่ได้รับมอบหมายด้วยความละเอียดรอบคอบและตรงต่อเวลา\n  - ประสานงานและทำงานร่วมกับทีมเพื่อให้งานบรรลุเป้าหมายของหน่วยงาน\n  - รวบรวมข้อมูลและสรุปผลการดำเนินงานเพื่อนำไปพัฒนาปรับปรุงกระบวนการทำงาน`
  };
  $("experience").value = templates[cat] || templates.general;
  updatePreview();
  showToast("✦ AI ร่างรายละเอียดประสบการณ์ทำงานให้แล้ว");
});

$("aiProjBtn").addEventListener("click", () => {
  const job = $("job").value.trim() || "พัฒนาระบบงาน";
  const cat = detectRoleCategory(job);
  const projMap = {
    tech: `• โครงงานพัฒนาเว็บแอปพลิเคชันสำหรับสายงาน ${job}\n  - ออกแบบหน้าจอและพัฒนาระบบที่ช่วยให้ผู้ใช้งานจัดการข้อมูลได้สะดวกรวดเร็วขึ้น\n• ผลงานการสร้างพอร์ตโฟลิโอออนไลน์และระบบจัดการฐานข้อมูลเบื้องต้น`,
    creative: `• โครงงานออกแบบอัตลักษณ์แบรนด์และสื่อประชาสัมพันธ์ดิจิทัล (Brand & Social Media Kit)\n  - ออกแบบชุดสื่อกราฟิกและต้นแบบ UI ที่ช่วยเพิ่มการมีส่วนร่วมของผู้ชม`,
    admin: `• โครงงานพัฒนาระบบจัดเก็บเอกสารและฐานข้อมูลอิเล็กทรอนิกส์ภายในหน่วยงาน\n  - ลดขั้นตอนการค้นหาเอกสารและเพิ่มความแม่นยำในการตรวจสอบข้อมูล`,
    marketing: `• โครงงานวางแผนกลยุทธ์การตลาดดิจิทัลและสร้างคอนเทนต์โปรโมตผลิตภัณฑ์\n  - วิเคราะห์พฤติกรรมผู้บริโภคและนำเสนอแผนการเพิ่มยอดการเข้าถึงกลุ่มเป้าหมาย`,
    engineering: `• โครงงานปรับปรุงประสิทธิภาพกระบวนการทำงานและลดการสูญเสียในสายการผลิต\n  - ประยุกต์ใช้หลักการตรวจสอบคุณภาพและมาตรฐานความปลอดภัยในการทำงาน`,
    general: `• โครงงานพัฒนาทักษะวิชาชีพด้าน ${job}\n  - บูรณาการความรู้จากการศึกษาและการทำงานเป็นทีมจนสำเร็จตามเป้าหมายที่วางไว้`
  };
  $("projects").value = projMap[cat] || projMap.general;
  updatePreview();
  showToast("✦ AI ร่างตัวอย่างโครงงานให้แล้ว");
});

// AI สร้างการ์ดพอร์ตโฟลิโอตัวอย่าง
function generateAiPortfolioItems() {
  const job = $("job").value.trim() || "Frontend Developer";
  const cat = detectRoleCategory(job);

  const catalog = {
    tech: [
      {
        title: "Smart E-Commerce Web Platform",
        tag: "React · Node.js · Responsive UI",
        desc: "พัฒนาเว็บแอปพลิเคชันร้านค้าออนไลน์ครบวงจร รองรับระบบตะกร้าสินค้า แดชบอร์ดจัดการสต็อก และการแสดงผลทุกขนาดหน้าจอ",
        link: "github.com/somchai-dev/smart-commerce",
        image: createSvgCoverDataUrl("Smart E-Commerce", "WEB APPLICATION", "#6c52e8", "#2563eb")
      },
      {
        title: "AI Resume & Portfolio Studio",
        tag: "HTML5 · CSS3 · JavaScript",
        desc: "ออกแบบและพัฒนาเว็บสร้างเรซูเม่และพอร์ตโฟลิโออัจฉริยะ รองรับการพรีวิวเรียลไทม์และการพิมพ์เอกสาร PDF มาตรฐาน A4",
        link: "somchai-portfolio.example.com",
        image: createSvgCoverDataUrl("AI Resume Studio", "FRONTEND PROJECT", "#0d9488", "#2563eb")
      },
      {
        title: "Online Meeting Room Booking System",
        tag: "SQL Database · UX/UI · Web App",
        desc: "ระบบจองห้องประชุมและตรวจสอบตารางเวลาออนไลน์ของหน่วยงาน ช่วยลดความซ้ำซ้อนและเช็กสถานะห้องว่างได้ทันที",
        link: "github.com/somchai-dev/room-booking",
        image: createSvgCoverDataUrl("Room Booking App", "DATABASE SYSTEM", "#334155", "#6c52e8")
      },
      {
        title: "IoT Smart Sensor Dashboard",
        tag: "Arduino · IoT · Real-time Chart",
        desc: "หน้าเว็บแดชบอร์ดแสดงผลค่าเซนเซอร์และแจ้งเตือนสถานะอุปกรณ์แบบเรียลไทม์ผ่านเครือข่ายไร้สาย",
        link: "github.com/somchai-dev/iot-dashboard",
        image: createSvgCoverDataUrl("IoT Dashboard", "SMART TECH PROJECT", "#b45309", "#0d9488")
      }
    ],
    creative: [
      {
        title: "Brand Identity & UI Design System",
        tag: "Figma · Illustrator · UI/UX",
        desc: "ออกแบบอัตลักษณ์แบรนด์ โลโก้ และชุด Design System สำหรับแอปพลิเคชันไลฟ์สไตล์ เน้นความทันสมัยและใช้งานง่าย",
        link: "behance.net/somchai-design",
        image: createSvgCoverDataUrl("Brand & UI System", "UX/UI & BRANDING", "#be123c", "#6c52e8")
      },
      {
        title: "Digital PR & Infographic Series",
        tag: "Canva Pro · Photoshop · Content",
        desc: "ออกแบบชุดอินโฟกราฟิกและสื่อประชาสัมพันธ์ดิจิทัล ย่อยข้อมูลเข้าใจง่ายและเพิ่มยอด Engagement กว่า 45%",
        link: "dribbble.com/somchai",
        image: createSvgCoverDataUrl("Infographic Kit", "DIGITAL CONTENT", "#b45309", "#be123c")
      }
    ],
    default: [
      {
        title: `โครงการพัฒนาระบบงานด้าน ${job}`,
        tag: "Project Management · Digital Tools",
        desc: "วางแผนและจัดทำระบบสรุปข้อมูลการทำงานแบบดิจิทัล ช่วยลดขั้นตอนการทำงานและเพิ่มความแม่นยำของข้อมูล",
        link: "portfolio.example.com/project-1",
        image: createSvgCoverDataUrl("Workflow Project", "KEY ACHIEVEMENT", "#334155", "#6c52e8")
      },
      {
        title: "ผลงานการประสานงานและนำเสนอโครงการ",
        tag: "Presentation · Team Collaboration",
        desc: "รวบรวมข้อมูล วิเคราะห์ผลลัพธ์ และจัดทำสื่อนำเสนอผู้บริหารจนได้รับอนุมัติดำเนินโครงการสำเร็จ",
        link: "portfolio.example.com/project-2",
        image: createSvgCoverDataUrl("Executive Report", "CASE STUDY", "#0d9488", "#334155")
      }
    ]
  };

  portfolioItems = (catalog[cat] || catalog.default).map(item => ({ ...item }));
  if (!$("portfolioIntro").value.trim()) {
    $("portfolioIntro").value = "รวบรวมผลงานการออกแบบ พัฒนาระบบ และโปรเจกต์สำคัญที่ผ่านการลงมือปฏิบัติจริง";
  }
  renderPortfolioInputs();
  updatePreview();
}

$("aiPortfolioBtn")?.addEventListener("click", () => {
  generateAiPortfolioItems();
  showToast("✦ AI สร้างการ์ดผลงานพอร์ตโฟลิโอให้เรียบร้อยแล้ว");
});

// AI แนะนำทักษะ
const skillCatalog = {
  tech: ["HTML5 / CSS3", "JavaScript (ES6+)", "React / Vue", "Responsive Design", "Git / GitHub", "SQL / Database", "RESTful API", "UI/UX เบื้องต้น", "การแก้ปัญหาเชิงระบบ", "การทำงานเป็นทีม"],
  creative: ["Adobe Photoshop", "Adobe Illustrator", "Figma (UI/UX)", "Canva Pro", "การตัดต่อวิดีโอ", "Creative Thinking", "Typography & Layout", "การออกแบบสื่อโซเชียล", "การเล่าเรื่อง (Storytelling)", "การบริหารเวลา"],
  admin: ["Microsoft Excel (Pivot/VLOOKUP)", "Microsoft Word / PowerPoint", "Google Workspace", "การจัดการเอกสารและสารบรรณ", "การประสานงานองค์กร", "ความละเอียดรอบคอบ", "การพิมพ์สัมผัสไทย-อังกฤษ", "การจัดทำรายงานสรุป"],
  marketing: ["Digital Marketing", "Content Marketing", "Social Media Management", "การสื่อสารและการเจรจาต่อรอง", "การวิเคราะห์ความต้องการลูกค้า", "CRM & Customer Service", "การนำเสนอขาย (Presentation)", "Canva / สื่อโฆษณา"],
  engineering: ["การควบคุมคุณภาพ (QC/QA)", "มาตรฐานความปลอดภัย (Safety)", "การอ่านแบบวิศวกรรม / AutoCAD", "การวางแผนและแก้ไขปัญหาหน้างาน", "การบำรุงรักษาเชิงป้องกัน (PM)", "Microsoft Excel", "การทำงานภายใต้ความกดดัน"],
  general: ["Microsoft Office", "Google Workspace", "Canva", "การสื่อสารและประสานงาน", "การทำงานเป็นทีม", "การคิดวิเคราะห์และแก้ปัญหา", "การบริหารเวลา", "ความคล่องตัวและการเรียนรู้เร็ว"]
};

function renderAiSkillRecommendations() {
  const job = $("job").value.trim();
  const cat = detectRoleCategory(job);
  currentRecommendedSkills = skillCatalog[cat] || skillCatalog.general;
  const chipsBox = $("aiSkillChips");
  chipsBox.innerHTML = currentRecommendedSkills
    .map(sk => `<button type="button" class="ai-skill-chip" data-skill="${escapeHtml(sk)}">+ ${escapeHtml(sk)}</button>`)
    .join("");
  $("aiSkillDrawer").hidden = false;

  chipsBox.querySelectorAll(".ai-skill-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const sk = btn.getAttribute("data-skill");
      const current = $("skills").value.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
      if (!current.includes(sk)) {
        current.push(sk);
        $("skills").value = current.join(", ");
        updatePreview();
        showToast(`เพิ่มทักษะ "${sk}" แล้ว`);
      } else {
        showToast(`มีทักษะ "${sk}" อยู่ในรายการแล้ว`);
      }
    });
  });
}

$("aiSkillBtn").addEventListener("click", () => {
  renderAiSkillRecommendations();
  showToast("✦ AI วิเคราะห์และแนะนำทักษะที่เหมาะกับสายงานแล้ว");
});

$("addAllAiSkillsBtn").addEventListener("click", () => {
  const current = $("skills").value.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
  currentRecommendedSkills.forEach(sk => {
    if (!current.includes(sk)) current.push(sk);
  });
  $("skills").value = current.join(", ");
  updatePreview();
  showToast("✦ เพิ่มทักษะแนะนำทั้งหมดลงในเรซูเม่แล้ว");
});

$("aiAutoPolishBtn").addEventListener("click", () => {
  if (!$("job").value.trim()) $("job").value = "Frontend Web Developer";
  if (!$("name").value.trim()) $("name").value = "สมชาย ใจดี";
  if (!$("email").value.trim()) $("email").value = "somchai.dev@example.com";
  if (!$("phone").value.trim()) $("phone").value = "089-123-4567";
  if (!$("skills").value.trim()) {
    const cat = detectRoleCategory($("job").value);
    $("skills").value = (skillCatalog[cat] || skillCatalog.general).slice(0, 7).join(", ");
  }
  if (!$("experience").value.trim()) $("aiExpBtn").click();
  if (!$("projects").value.trim()) $("aiProjBtn").click();
  if (!$("education").value.trim()) {
    $("education").value = "• ปริญญาตรี วิทยาศาสตรบัณฑิต\n  มหาวิทยาลัยราชภัฏ (2565 – 2569) | เกรดเฉลี่ยสะสม 3.50";
  }
  if (!$("languages").value.trim()) {
    $("languages").value = "• ภาษาไทย: เจ้าของภาษา (ดีมาก)\n• ภาษาอังกฤษ: สื่อสารและอ่านเอกสารเทคนิคได้";
  }
  if (portfolioItems.length === 0) generateAiPortfolioItems();
  generateAiProfile(false);
  updatePreview();
  showToast("✦ AI เติมเต็มข้อมูลทั้งเรซูเม่และพอร์ตโฟลิโอให้ครบแล้ว!");
});

// กรอกข้อมูลตัวอย่างทั้ง 2 หน้า
function fillSampleData() {
  const sample = {
    name: "สมชาย ใจดี",
    job: "Frontend Web Developer",
    email: "somchai.dev@example.com",
    phone: "089-123-4567",
    location: "อ.เมือง จ.เลย",
    birth: "อายุ 22 ปี",
    salary: "Full-time / ตามโครงสร้างบริษัท",
    portfolio: "github.com/somchai-dev | somchai-portfolio.example.com",
    profile: "ผู้สมัครในสายงาน Frontend Web Developer ที่มีความเชี่ยวชาญและความสนใจด้านเทคโนโลยีสารสนเทศและการพัฒนาระบบ สามารถประยุกต์ใช้ทักษะดิจิทัลและการคิดวิเคราะห์เชิงตรรกะเพื่อแก้ปัญหาได้อย่างเป็นระบบ มีพื้นฐานการศึกษาด้าน ปริญญาตรี วิทยาศาสตรบัณฑิต (วิทยาการคอมพิวเตอร์). เชี่ยวชาญทักษะสำคัญ อาทิ HTML5, CSS3, JavaScript (ES6+), React, Responsive Design, Git / GitHub, Figma. พร้อมนำประสบการณ์จากการปฏิบัติงานจริงมาต่อยอดและสร้างคุณค่าให้แก่องค์กรได้ทันที",
    education: "• ปริญญาตรี วิทยาศาสตรบัณฑิต (วิทยาการคอมพิวเตอร์)\n  มหาวิทยาลัยราชภัฏเลย (2565 – 2569) | เกรดเฉลี่ยสะสม 3.58",
    experience: "• นักศึกษาฝึกงานแผนกพัฒนาระบบเว็บ (Frontend Intern)\n  บริษัท ดิจิทัลโซลูชัน จำกัด (มี.ค. 2568 – มิ.ย. 2568)\n  - ร่วมพัฒนาและปรับปรุงหน้าเว็บไซต์ด้วย HTML5, CSS3 และ JavaScript\n  - ทดสอบการแสดงผลแบบ Responsive บนมือถือและแท็บเล็ต\n  - ทำงานร่วมกับทีม UX/UI เพื่อปรับปรุงประสบการณ์ผู้ใช้งาน",
    projects: "• โครงงาน Smart Resume & Portfolio AI: เว็บแอปพลิเคชันสร้างเรซูเม่และพอร์ตโฟลิโอพร้อม AI ผู้ช่วย\n• ระบบจองห้องประชุมออนไลน์ของคณะวิทยาศาสตร์",
    skills: "HTML5, CSS3, JavaScript (ES6+), React, Responsive Design, Git / GitHub, Figma, Canva, การทำงานเป็นทีม",
    languages: "• ภาษาไทย: เจ้าของภาษา (ฟัง-พูด-อ่าน-เขียน ดีมาก)\n• ภาษาอังกฤษ: ระดับดี (อ่านเอกสารทางเทคนิคและสื่อสารเบื้องต้นได้)",
    certifications: "• ใบรับรอง Responsive Web Design (freeCodeCamp)\n• ผ่านการอบรมพัฒนาทักษะดิจิทัล IC3 Digital Literacy",
    references: "ผศ.ดร.วิชาญ นักพัฒนา (อาจารย์ที่ปรึกษาโครงงาน) โทร. 081-999-8888",
    portfolioPageTitle: "PORTFOLIO & SELECTED WORKS",
    portfolioIntro: "รวบรวมผลงานการออกแบบเว็บไซต์ พัฒนาแอปพลิเคชัน และโครงงานสำคัญที่ผ่านการลงมือปฏิบัติจริง"
  };

  fields.forEach(id => {
    if ($(id) && sample[id] !== undefined) $(id).value = sample[id];
  });
  generateAiPortfolioItems();
  updatePreview();
  showToast("✨ กรอกข้อมูลตัวอย่างทั้งหน้าเรซูเม่และหน้าพอร์ตโฟลิโอแล้ว");
}

$("sampleBtn").addEventListener("click", fillSampleData);
$("fillSampleTopBtn").addEventListener("click", () => {
  fillSampleData();
  $("builder").scrollIntoView({ behavior: "smooth" });
});

// บันทึกและโหลดข้อมูลจาก LocalStorage
function collectPayload() {
  const data = Object.fromEntries(fields.map(id => [id, $(id) ? $(id).value : ""]));
  return {
    fields: data,
    photo: currentPhotoData,
    portfolioItems: portfolioItems,
    theme: {
      template: $("templateSelect").value,
      accent: currentTheme.accent,
      soft: currentTheme.soft,
      photoShape: $("photoShape").value,
      photoSize: $("photoSize").value,
      skillTags: $("skillTagsToggle").checked,
      portfolioCols: $("portfolioGridCols")?.value || "2"
    }
  };
}

function applyPayload(payload) {
  if (!payload) return;
  const fieldData = payload.fields || payload;
  fields.forEach(id => {
    if ($(id) && typeof fieldData[id] === "string") $(id).value = fieldData[id];
  });

  if (typeof payload.photo === "string") currentPhotoData = payload.photo;

  if (Array.isArray(payload.portfolioItems)) {
    portfolioItems = payload.portfolioItems;
  }

  if (payload.theme) {
    if (payload.theme.template) applyTemplateStyle(payload.theme.template);
    if (payload.theme.photoShape) $("photoShape").value = payload.theme.photoShape;
    if (payload.theme.photoSize) $("photoSize").value = payload.theme.photoSize;
    if (typeof payload.theme.skillTags === "boolean") $("skillTagsToggle").checked = payload.theme.skillTags;
    if (payload.theme.portfolioCols && $("portfolioGridCols")) {
      $("portfolioGridCols").value = payload.theme.portfolioCols;
    }
    if (payload.theme.accent) {
      currentTheme.accent = payload.theme.accent;
      currentTheme.soft = payload.theme.soft || "#f0edff";
      document.documentElement.style.setProperty("--resume-accent", currentTheme.accent);
      document.documentElement.style.setProperty("--resume-accent-soft", currentTheme.soft);
      document.querySelectorAll("#colorPicker .color-dot").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-color") === currentTheme.accent);
      });
    }
  }
  renderPortfolioInputs();
  updatePreview();
}

$("saveBtn").addEventListener("click", () => {
  if (!$("name").value.trim() || !$("job").value.trim() || !$("email").value.trim()) {
    showToast("กรุณากรอกชื่อ ตำแหน่งงาน และอีเมลในหน้าเรซูเม่ให้ครบก่อนบันทึก");
    return;
  }
  try {
    localStorage.setItem("smartResumeDraft", JSON.stringify(collectPayload()));
    showToast("💾 บันทึกข้อมูลทั้งเรซูเม่และพอร์ตโฟลิโอไว้ในเครื่องแล้ว");
  } catch (e) {
    showToast("ไม่สามารถบันทึกในเบราว์เซอร์ได้ (ขนาดรูปภาพอาจใหญ่เกินไป)");
  }
});

function loadSaved() {
  try {
    const raw = localStorage.getItem("smartResumeDraft");
    if (raw) {
      applyPayload(JSON.parse(raw));
      return;
    }
  } catch (e) {
    console.warn("อ่านข้อมูลที่บันทึกไว้ไม่สำเร็จ", e);
  }
  renderPortfolioInputs();
  updatePreview();
}

// ส่งออกและนำเข้าไฟล์ JSON
$("exportJsonBtn").addEventListener("click", () => {
  const payload = collectPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = ($("name").value.trim() || "smart-studio").replace(/\s+/g, "-");
  a.href = url;
  a.download = `${safeName}-resume-portfolio.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("ดาวน์โหลดไฟล์ข้อมูล .json แล้ว");
});

$("importJsonBtn").addEventListener("click", () => $("importJsonInput").click());

$("importJsonInput").addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      applyPayload(parsed);
      showToast("นำเข้าข้อมูลเรซูเม่และพอร์ตโฟลิโอเรียบร้อยแล้ว");
    } catch (err) {
      showToast("ไฟล์ JSON ไม่ถูกต้อง");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// พิมพ์เฉพาะหน้าปัจจุบัน หรือ พิมพ์ทั้ง 2 หน้าคู่กัน
$("downloadCurrentBtn").addEventListener("click", () => {
  if (!$("name").value.trim() || !$("job").value.trim()) {
    showToast("กรุณากรอกชื่อและตำแหน่งงานก่อนดาวน์โหลด PDF");
    return;
  }
  document.body.classList.remove("print-both");
  updatePreview();
  window.print();
});

$("downloadBothBtn").addEventListener("click", () => {
  if (!$("name").value.trim() || !$("job").value.trim()) {
    showToast("กรุณากรอกชื่อและตำแหน่งงานก่อนดาวน์โหลด PDF");
    return;
  }
  if (portfolioItems.length === 0) {
    generateAiPortfolioItems();
  }
  updatePreview();
  document.body.classList.add("print-both");
  window.print();
  setTimeout(() => document.body.classList.remove("print-both"), 500);
});

$("resumeForm").addEventListener("reset", () => {
  setTimeout(() => {
    currentPhotoData = "";
    portfolioItems = [];
    $("photoInput").value = "";
    $("suggestion").hidden = true;
    $("aiSkillDrawer").hidden = true;
    renderPortfolioInputs();
    updatePreview();
    showToast("ล้างข้อมูลทั้งหมดแล้ว");
  }, 0);
});

$("accountBtn").addEventListener("click", () => $("accountDialog").showModal());
$("closeDialogBtn").addEventListener("click", () => $("accountDialog").close());

let toastTimer;
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

loadSaved();