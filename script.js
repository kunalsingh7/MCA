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

  /* ---------------- helpers ---------------- */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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
    const deep = (typeof DEEP !== "undefined" && DEEP[subject.id]) || {};
    const teaching = (typeof TEACHING !== "undefined" && TEACHING[subject.id]) || [];

    const panel = document.createElement("section");
    panel.className = "subject-panel" + (index === 0 ? " active" : "");
    panel.id = "panel-" + subject.id;
    panel.style.setProperty("--accent", subject.accent);

    panel.innerHTML = `
      <div class="subject-head" style="border-top-color:${subject.accent}">
        <div class="code" style="color:${subject.accent}">${subject.code}</div>
        <h2>${subject.icon} ${subject.name}</h2>
        <div class="unit-title">${subject.unitTitle}</div>
        <div class="progress-wrap">
          <div class="progress-bar"><span class="progress-fill" style="background:${subject.accent}"></span></div>
          <span class="progress-text"></span>
        </div>
      </div>

      ${buildObjectivesHtml(deep)}

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
    subject.topics.forEach((topic, i) => {
      topicsWrap.appendChild(
        buildTopic(topic, i, subject, (deep.topics || [])[i] || {}, teaching[i] || {})
      );
    });

    const quizWrap = panel.querySelector(".quiz");
    quizWrap.appendChild(buildQuiz(deep.quiz || [], subject));

    const questionsWrap = panel.querySelector(".questions");
    subject.questions.forEach((q, i) => {
      questionsWrap.appendChild(buildExamQuestion(q, i, subject.id));
    });

    updateProgress(panel, subject);
    return panel;
  }

  function buildObjectivesHtml(deep) {
    if (!deep.objectives || !deep.objectives.length) return "";
    const items = deep.objectives.map((o) => `<li>${o}</li>`).join("");
    return `
      <div class="section-title"><span class="step-num">1</span> What you will learn</div>
      <div class="objectives">
        <p class="objectives-intro">By the end of this unit, you should be able to:</p>
        <ul>${items}</ul>
      </div>
    `;
  }

  /* ---------------- topic ---------------- */

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

  function buildSubtopicsHtml(deepTopic) {
    if (!deepTopic.subtopics || !deepTopic.subtopics.length) return "";
    const items = deepTopic.subtopics
      .map(
        (s, i) => `
        <div class="subtopic">
          <div class="subtopic-head"><span class="subtopic-num">${i + 1}</span>${s.title}</div>
          <p>${s.text}</p>
        </div>`
      )
      .join("");
    return `
      <div class="topic-block subtopics-block">
        <span class="tag">🔍 Let's Break It Down</span>
        ${items}
      </div>
    `;
  }

  function buildMistakeHtml(deepTopic) {
    if (!deepTopic.mistake) return "";
    return `
      <div class="topic-block mistake">
        <span class="tag">⚠️ Common Mistake — Don't Do This</span>
        ${deepTopic.mistake}
      </div>
    `;
  }

  function buildKeywordHtml(deepTopic) {
    if (!deepTopic.keyword) return "";
    return `
      <div class="topic-block keyword">
        <span class="tag">📌 Write This In The Exam</span>
        ${deepTopic.keyword}
      </div>
    `;
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
    const rowsHtml = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
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

  function buildTopic(topic, i, subject, deepTopic, teaching) {
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
        ${buildTeacherHtml(teaching)}
        <div class="topic-block">
          <span class="tag">📖 In Simple Words</span>
          ${topic.explain}
        </div>
        ${buildDiagramHtml(teaching)}
        ${buildSubtopicsHtml(deepTopic)}
        <div class="topic-block reallife">
          <span class="tag">🌍 Real-Life Example</span>
          ${topic.realLife}
        </div>
        ${buildTableHtml(topic)}
        ${buildWorkedHtml(topic)}
        ${buildCodeHtml(topic)}
        ${buildMistakeHtml(deepTopic)}
        ${buildKeywordHtml(deepTopic)}
        <div class="topic-block helps">
          <span class="tag">✅ Why It Matters</span>
          ${topic.howItHelps}
        </div>
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
      wrap.innerHTML = `<p class="quiz-empty">Quiz coming soon for this subject.</p>`;
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
          if (!isRight) {
            optsEl.children[question.answer].classList.add("correct");
          }
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
