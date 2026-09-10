(function () {
  const data = SYLLABUS_DATA;
  const tabsEl = document.getElementById("tabs");
  const panelsEl = document.getElementById("panels");

  document.getElementById("page-title").textContent = data.meta.title;
  document.getElementById("page-subtitle").textContent = data.meta.subtitle;
  document.title = data.meta.title;

  data.subjects.forEach((subject, index) => {
    tabsEl.appendChild(buildTabButton(subject, index));
    panelsEl.appendChild(buildSubjectPanel(subject, index));
  });

  function buildTabButton(subject, index) {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (index === 0 ? " active" : "");
    btn.dataset.target = subject.id;
    btn.innerHTML = `<span>${subject.icon}</span><span>${subject.name}</span>`;
    btn.style.setProperty("--accent", subject.accent);
    btn.addEventListener("click", () => switchTo(subject.id));
    return btn;
  }

  function switchTo(id) {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.target === id);
      if (b.dataset.target === id) {
        document.documentElement.style.setProperty("--accent", b.style.getPropertyValue("--accent"));
      }
    });
    document.querySelectorAll(".subject-panel").forEach((p) => {
      p.classList.toggle("active", p.id === "panel-" + id);
    });
  }

  function buildSubjectPanel(subject, index) {
    const panel = document.createElement("section");
    panel.className = "subject-panel" + (index === 0 ? " active" : "");
    panel.id = "panel-" + subject.id;
    panel.style.setProperty("--accent", subject.accent);

    panel.innerHTML = `
      <div class="subject-head" style="border-top-color:${subject.accent}">
        <div class="code" style="color:${subject.accent}">${subject.code}</div>
        <h2>${subject.icon} ${subject.name}</h2>
        <div class="unit-title">${subject.unitTitle}</div>
      </div>

      <div class="why-box">
        <div class="why-card problem">
          <div class="label">🚧 The Problem</div>
          <p>${subject.problem}</p>
        </div>
        <div class="why-card solution">
          <div class="label">💡 How This Unit Solves It</div>
          <p>${subject.solution}</p>
        </div>
      </div>

      <div class="section-title">📖 Topics</div>
      <div class="topics"></div>

      <div class="section-title">✍️ Practice Questions (try answering yourself)</div>
      <div class="questions"></div>
    `;

    const topicsWrap = panel.querySelector(".topics");
    const teachingForSubject = (typeof TEACHING !== "undefined" && TEACHING[subject.id]) || [];
    subject.topics.forEach((topic, i) => {
      topicsWrap.appendChild(buildTopic(topic, i, subject.accent, teachingForSubject[i] || {}));
    });

    const questionsWrap = panel.querySelector(".questions");
    subject.questions.forEach((q, i) => {
      questionsWrap.appendChild(buildQuestion(q, i, subject.id));
    });

    return panel;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function buildWorkedHtml(topic) {
    if (!topic.worked) return "";
    return `
      <div class="topic-block worked">
        <span class="tag">🧮 Worked Example</span>
        ${topic.worked}
      </div>
    `;
  }

  function buildTableHtml(topic) {
    if (!topic.table) return "";
    const { headers, rows } = topic.table;
    const headHtml = headers.map((h) => `<th>${h}</th>`).join("");
    const rowsHtml = rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("");
    return `
      <div class="topic-block table-block">
        <span class="tag">📊 Quick Compare</span>
        <div class="table-scroll">
          <table><thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
        </div>
      </div>
    `;
  }

  function buildCodeHtml(topic) {
    if (!topic.code) return "";
    return `
      <div class="topic-block code-block">
        <span class="tag">💻 Code Example</span>
        <pre><code>${escapeHtml(topic.code)}</code></pre>
        ${topic.codeNote ? `<div class="code-note">${topic.codeNote}</div>` : ""}
      </div>
    `;
  }

  function buildTeacherHtml(teaching) {
    if (!teaching.teacher) return "";
    return `
      <div class="teacher-note">
        <span class="teacher-avatar">👩‍🏫</span>
        <p>${teaching.teacher}</p>
      </div>
    `;
  }

  function buildDiagramHtml(teaching) {
    if (!teaching.diagram) return "";
    return `
      <div class="topic-block diagram-block">
        <span class="tag">🖼️ Picture It</span>
        <div class="diagram">${teaching.diagram}</div>
      </div>
    `;
  }

  function buildTopic(topic, i, accent, teaching) {
    const details = document.createElement("details");
    details.className = "topic";
    if (i === 0) details.open = true;
    details.innerHTML = `
      <summary>
        <span>${topic.title}</span>
        <span class="chevron" style="color:${accent}">▶</span>
      </summary>
      <div class="topic-body">
        ${buildTeacherHtml(teaching)}
        <div class="topic-block">
          <span class="tag">📖 In Simple Words</span>
          ${topic.explain}
        </div>
        ${buildDiagramHtml(teaching)}
        <div class="topic-block reallife">
          <span class="tag">🌍 Real-Life Example</span>
          ${topic.realLife}
        </div>
        ${buildTableHtml(topic)}
        ${buildWorkedHtml(topic)}
        ${buildCodeHtml(topic)}
        <div class="topic-block helps">
          <span class="tag">✅ Why It Matters</span>
          ${topic.howItHelps}
        </div>
      </div>
    `;
    return details;
  }

  function buildQuestion(question, i, subjectId) {
    const card = document.createElement("div");
    card.className = "question-card";
    const storeKey = "mca-answer:" + subjectId + ":" + i;

    const hintHtml = question.hint
      ? `<details><summary class="hint-toggle">💡 Need a hint?</summary><div class="hint-text">${question.hint}</div></details>`
      : "";

    card.innerHTML = `
      <div class="q-text"><span class="q-num">Q${i + 1}.</span>${question.q}</div>
      ${hintHtml}
      <textarea placeholder="Type your answer here... (saved automatically on this device)"></textarea>
    `;

    const textarea = card.querySelector("textarea");
    try {
      const saved = localStorage.getItem(storeKey);
      if (saved) textarea.value = saved;
    } catch (e) {
      /* localStorage may be blocked; ignore */
    }
    textarea.addEventListener("input", () => {
      try {
        localStorage.setItem(storeKey, textarea.value);
      } catch (e) {
        /* ignore */
      }
    });

    return card;
  }
})();
