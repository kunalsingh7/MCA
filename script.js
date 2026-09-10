(function () {
  const tabsEl = document.getElementById("tabs");
  const panelsEl = document.getElementById("panels");

  document.getElementById("page-title").textContent = PAGE.title;
  document.getElementById("page-subtitle").textContent = PAGE.subtitle;
  document.title = PAGE.title;

  const subjects = PAGE.order.map((id) => SUBJECTS[id]).filter(Boolean);

  subjects.forEach((subject, index) => {
    tabsEl.appendChild(buildTabButton(subject, index));
    panelsEl.appendChild(buildSubjectPanel(subject, index));
  });

  /* ---------------- helpers ---------------- */

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* storage may be blocked — ignore */
    }
  }

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /* ---------------- tabs ---------------- */

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- subject panel ---------------- */

  function buildSubjectPanel(subject, index) {
    const panel = document.createElement("section");
    panel.className = "subject-panel" + (index === 0 ? " active" : "");
    panel.id = "panel-" + subject.id;
    panel.style.setProperty("--accent", subject.accent);

    panel.innerHTML = `
      <div class="subject-head" style="border-top-color:${subject.accent}">
        <div class="code" style="color:${subject.accent}">${subject.code}</div>
        <h2>${subject.icon} ${subject.name}</h2>
        <div class="unit-title">${subject.unit}</div>
        <div class="progress-wrap">
          <div class="progress-bar"><span class="progress-fill" style="background:${subject.accent}"></span></div>
          <span class="progress-text"></span>
        </div>
      </div>

      <div class="section-title"><span class="step-num">1</span> What you will learn</div>
      <div class="objectives">
        <p class="objectives-intro">By the end of this unit, you should be able to:</p>
        <ul>${(subject.objectives || []).map((o) => `<li>${o}</li>`).join("")}</ul>
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

      <div class="section-title"><span class="step-num">2</span> Learn the topics</div>
      <div class="topics"></div>

      <div class="section-title"><span class="step-num">3</span> Test yourself — quick quiz</div>
      <div class="quiz"></div>

      <div class="section-title"><span class="step-num">4</span> Exam practice — write your own answers</div>
      <div class="questions"></div>
    `;

    const topicsWrap = panel.querySelector(".topics");
    subject.topics.forEach((topic, i) => topicsWrap.appendChild(buildTopic(topic, i, subject)));

    panel.querySelector(".quiz").appendChild(buildQuiz(subject.quiz || [], subject));

    const questionsWrap = panel.querySelector(".questions");
    (subject.examQuestions || []).forEach((q, i) => {
      questionsWrap.appendChild(buildExamQuestion(q, i, subject.id));
    });

    updateProgress(panel, subject);
    return panel;
  }

  /* ---------------- topic blocks ---------------- */

  function block(cls, tag, body) {
    return `<div class="topic-block ${cls}"><span class="tag">${tag}</span>${body}</div>`;
  }

  function buildTeacher(t) {
    if (!t.teacher) return "";
    return `<div class="teacher-note"><span class="teacher-avatar">👩‍🏫</span><p>${t.teacher}</p></div>`;
  }

  function buildDiagram(t) {
    const svg = t.diagram && typeof DIAGRAMS !== "undefined" ? DIAGRAMS[t.diagram] : null;
    if (!svg) return "";
    return block("diagram-block", "🖼️ Picture It", `<div class="diagram">${svg}</div>`);
  }

  function buildKeyPoints(t) {
    if (!t.keyPoints || !t.keyPoints.length) return "";
    const items = t.keyPoints.map((p) => `<li>${p}</li>`).join("");
    return block("keypoints", "🔑 Key Points", `<ul>${items}</ul>`);
  }

  function buildSubtopics(t) {
    if (!t.subtopics || !t.subtopics.length) return "";
    const items = t.subtopics
      .map(
        (s, i) =>
          `<div class="subtopic">
             <div class="subtopic-head"><span class="subtopic-num">${i + 1}</span>${s.title}</div>
             <p>${s.text}</p>
           </div>`
      )
      .join("");
    return block("subtopics-block", "🔍 Let's Break It Down", items);
  }

  function buildTable(t) {
    if (!t.table) return "";
    const head = t.table.headers.map((h) => `<th>${h}</th>`).join("");
    const rows = t.table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
    return block(
      "table-block",
      "📊 Quick Compare",
      `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
    );
  }

  function buildCode(t) {
    if (!t.code) return "";
    const note = t.codeNote ? `<div class="code-note">${t.codeNote}</div>` : "";
    return block("code-block", "💻 Code Example", `<pre><code>${escapeHtml(t.code)}</code></pre>${note}`);
  }

  function buildTopic(topic, i, subject) {
    const details = document.createElement("details");
    details.className = "topic";
    if (i === 0) details.open = true;

    const doneKey = "mca-done:" + subject.id + ":" + i;
    const isDone = read(doneKey) === "1";

    details.innerHTML = `
      <summary>
        <span class="topic-title">
          <span class="topic-index">${i + 1}</span>
          <span>${topic.title}</span>
          <span class="done-badge" ${isDone ? "" : "hidden"}>✓</span>
        </span>
        <span class="chevron" style="color:${subject.accent}">▶</span>
      </summary>
      <div class="topic-body">
        ${buildTeacher(topic)}
        ${block("", "📖 In Simple Words", topic.explain)}
        ${buildDiagram(topic)}
        ${buildKeyPoints(topic)}
        ${buildSubtopics(topic)}
        ${block("reallife", "🌍 Real-Life Example", topic.realLife)}
        ${buildTable(topic)}
        ${topic.worked ? block("worked", "🧮 Worked Example", topic.worked) : ""}
        ${buildCode(topic)}
        ${topic.mistake ? block("mistake", "⚠️ Common Mistake — Don't Do This", topic.mistake) : ""}
        ${topic.examAnswer ? block("exam-answer", "📝 Exam-Ready Answer — write this", topic.examAnswer) : ""}
        ${topic.remember ? block("remember", "🧠 Remember This", topic.remember) : ""}
        ${topic.why ? block("helps", "✅ Why It Matters", topic.why) : ""}
        ${topic.practice ? `<div class="practice-box"><span class="tag">✍️ Try It Yourself</span>${topic.practice}</div>` : ""}
        <label class="done-check">
          <input type="checkbox" ${isDone ? "checked" : ""}/>
          <span>I understood this topic</span>
        </label>
      </div>
    `;

    const checkbox = details.querySelector(".done-check input");
    const badge = details.querySelector(".done-badge");
    checkbox.addEventListener("change", () => {
      store(doneKey, checkbox.checked ? "1" : "0");
      badge.hidden = !checkbox.checked;
      updateProgress(details.closest(".subject-panel"), subject);
    });

    return details;
  }

  function updateProgress(panel, subject) {
    if (!panel) return;
    const total = subject.topics.length;
    let done = 0;
    for (let i = 0; i < total; i++) {
      if (read("mca-done:" + subject.id + ":" + i) === "1") done++;
    }
    const pct = total ? Math.round((done / total) * 100) : 0;
    panel.querySelector(".progress-fill").style.width = pct + "%";
    panel.querySelector(".progress-text").textContent =
      done === total ? `All ${total} topics done! 🎉` : `${done} of ${total} topics done`;
  }

  /* ---------------- quiz ---------------- */

  function buildQuiz(questions, subject) {
    const wrap = document.createElement("div");
    wrap.className = "quiz-card";

    if (!questions.length) {
      wrap.innerHTML = `<p class="quiz-intro">Quiz coming soon for this subject.</p>`;
      return wrap;
    }

    const state = { answered: 0, correct: 0, total: questions.length };

    const intro = document.createElement("p");
    intro.className = "quiz-intro";
    intro.innerHTML = `Pick an answer and I'll tell you straight away if it's right — and <em>why</em>. No marks, no pressure. 😊`;
    wrap.appendChild(intro);

    const scoreEl = document.createElement("div");
    scoreEl.className = "quiz-score";
    scoreEl.textContent = `Score: 0 / ${state.total}`;
    wrap.appendChild(scoreEl);

    questions.forEach((question, qi) => {
      const qEl = document.createElement("div");
      qEl.className = "quiz-q";
      qEl.innerHTML = `<div class="quiz-q-text"><span class="q-num">Q${qi + 1}.</span>${question.q}</div>`;

      const optsEl = document.createElement("div");
      optsEl.className = "quiz-options";

      const feedback = document.createElement("div");
      feedback.className = "quiz-feedback";
      feedback.hidden = true;

      question.options.forEach((optText, oi) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-option";
        btn.innerHTML = `<span class="opt-letter">${"ABCD"[oi]}</span><span>${optText}</span>`;
        btn.addEventListener("click", () => {
          if (qEl.classList.contains("answered")) return;
          qEl.classList.add("answered");

          const isRight = oi === question.answer;
          btn.classList.add(isRight ? "correct" : "wrong");
          if (!isRight) optsEl.children[question.answer].classList.add("correct");
          [...optsEl.children].forEach((b) => (b.disabled = true));

          feedback.hidden = false;
          feedback.className = "quiz-feedback " + (isRight ? "good" : "bad");
          feedback.innerHTML =
            (isRight
              ? `<strong>✅ Correct!</strong> `
              : `<strong>❌ Not quite.</strong> The right answer is <strong>${"ABCD"[question.answer]}</strong>. `) +
            question.why;

          state.answered++;
          if (isRight) state.correct++;
          scoreEl.textContent = `Score: ${state.correct} / ${state.total}`;

          if (state.answered === state.total) {
            scoreEl.classList.add("final");
            const pct = (state.correct / state.total) * 100;
            const msg =
              pct === 100
                ? "Perfect score! You really know this unit. 🌟"
                : pct >= 60
                ? "Good work! Read the topics you missed once more. 👍"
                : "Don't worry — go through the topics again, then retry. You'll get it. 💪";
            scoreEl.textContent = `Final score: ${state.correct} / ${state.total} — ${msg}`;
          }
        });
        optsEl.appendChild(btn);
      });

      qEl.appendChild(optsEl);
      qEl.appendChild(feedback);
      wrap.appendChild(qEl);
    });

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "quiz-retry";
    retry.textContent = "↻ Try the quiz again";
    retry.addEventListener("click", () => {
      const fresh = buildQuiz(questions, subject);
      wrap.replaceWith(fresh);
      fresh.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    wrap.appendChild(retry);

    return wrap;
  }

  /* ---------------- exam practice ---------------- */

  function buildExamQuestion(question, i, subjectId) {
    const card = document.createElement("div");
    card.className = "question-card";
    const storeKey = "mca-answer:" + subjectId + ":" + i;

    const hintHtml = question.hint
      ? `<details><summary class="hint-toggle">💡 Need a hint?</summary><div class="hint-text">${question.hint}</div></details>`
      : "";

    card.innerHTML = `
      <div class="q-text"><span class="q-num">Q${i + 1}.</span>${question.q}</div>
      ${hintHtml}
      <textarea placeholder="Write your answer here in your own words… (saved automatically on this device)"></textarea>
    `;

    const textarea = card.querySelector("textarea");
    const saved = read(storeKey);
    if (saved) textarea.value = saved;
    textarea.addEventListener("input", () => store(storeKey, textarea.value));

    return card;
  }
})();
