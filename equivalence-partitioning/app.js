(() => {
  "use strict";
  const exercises = window.TRAINING_EXERCISES;
  const meta = window.TRAINING_META;
  const validator = window.TRAINING_VALIDATOR;
  const STORAGE_KEY = meta.storageKey;
  const blank = () => ({ version: meta.version, activeExerciseId: exercises[0].id, activeStep: 0, answers: {}, completed: [] });
  let state = load();
  const $ = (selector) => document.querySelector(selector);
  const el = { nav: $("#exerciseNav"), section: $("#sectionLabel"), title: $("#exerciseTitle"), goal: $("#learningGoal"), specs: $("#specList"), tabs: $("#stepTabs"), area: $("#answerArea"), progress: $("#progressLabel"), save: $("#saveStatus"), reset: $("#resetButton"), check: $("#checkButton"), dialog: $("#resultDialog"), result: $("#resultContent") };
  $("#appTitle").textContent = meta.title; document.title = meta.title;

  function load() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return saved?.version === meta.version ? { ...blank(), ...saved } : blank(); } catch (_) { return blank(); } }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); el.save.textContent = "保存済み"; progress(); }
  function exercise() { return exercises.find((item) => item.id === state.activeExerciseId) || exercises[0]; }
  function step() { return exercise().steps[state.activeStep] || exercise().steps[0]; }
  function answer() { state.answers[exercise().id] ||= {}; state.answers[exercise().id][step().id] ||= { value: "", values: [], fields: {}, rows: [] }; return state.answers[exercise().id][step().id]; }
  function key() { return `${exercise().id}:${step().id}`; }
  function esc(value) { return String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function attrs(value) { return esc(value); }

  function render() {
    const item = exercise(); if (state.activeStep >= item.steps.length) state.activeStep = 0;
    el.section.textContent = item.section; el.title.textContent = item.title; el.goal.textContent = item.goal;
    el.specs.innerHTML = item.specs.map((spec) => `<li>${esc(spec)}</li>`).join("");
    el.nav.innerHTML = exercises.map((entry) => { const done = entry.steps.filter((current) => state.completed.includes(`${entry.id}:${current.id}`)).length; return `<button class="${entry.id === item.id ? "active" : ""}" data-exercise="${attrs(entry.id)}"><strong>${esc(entry.section)}</strong><small>${esc(entry.navTitle)} ／ ${done}/${entry.steps.length}</small></button>`; }).join("");
    el.tabs.innerHTML = item.steps.map((current, index) => `<button class="step-tab" role="tab" aria-selected="${index === state.activeStep}" data-step="${index}">${state.completed.includes(`${item.id}:${current.id}`) ? "✓" : `${index + 1}.`} ${esc(current.label)}</button>`).join("");
    renderAnswer(); progress();
  }

  function renderAnswer() {
    const current = step(); const a = answer(); let control = "";
    if (current.type === "choice" || current.type === "multiChoice") control = options(current, current.type === "choice" ? a.value : a.values, current.type === "multiChoice");
    else if (current.type === "numericGroup") control = `<div class="field-grid">${current.fields.map((field) => `<label class="field"><span>${esc(field.label)}</span><input type="number" step="any" data-field="${attrs(field.id)}" value="${attrs(a.fields[field.id] ?? "")}"></label>`).join("")}</div>`;
    else if (current.type === "caseSet") control = renderCaseSet(current, a);
    else if (current.type === "recordSet") control = renderRecordSet(current, a);
    else if (current.type === "stateTable") control = renderStateTable(current, a);
    else if (current.type === "pairwise") control = renderPairwise(current, a);
    else if (current.type === "quiz") control = renderQuiz(current, a.fields);
    el.area.innerHTML = `<div class="task"><p>${esc(current.prompt)}</p>${current.hint ? `<details><summary>ヒント</summary><p>${esc(current.hint)}</p></details>` : ""}</div>${control}`;
  }

  function options(current, selected, multiple) {
    const values = multiple ? selected.map(Number) : [Number(selected)];
    return `<div class="options">${current.options.map((option, i) => `<label class="option ${values.includes(i) ? "selected" : ""}"><input type="${multiple ? "checkbox" : "radio"}" ${multiple ? "data-multi" : "data-choice"} value="${i}" ${values.includes(i) ? "checked" : ""}><span>${esc(option)}</span></label>`).join("")}</div>`;
  }
  function select(name, choices, value, extra = "") { return `<select ${extra}><option value="">選択</option>${choices.map((choice) => `<option value="${attrs(choice)}" ${choice === value ? "selected" : ""}>${esc(choice)}</option>`).join("")}</select>`; }
  function ensureRows(a, count, factory = () => ({})) { while (a.rows.length < count) a.rows.push(factory()); }
  function renderCaseSet(current, a) { ensureRows(a, current.rowCount, () => ({ input: "", outcome: "" })); return `<div class="table-scroll"><table><thead><tr><th>No.</th><th>${esc(current.inputLabel)}</th><th>${esc(current.outcomeLabel)}</th></tr></thead><tbody>${a.rows.slice(0, current.rowCount).map((row, i) => `<tr><th>${i + 1}</th><td>${select("", current.inputOptions, row.input, `data-row="${i}" data-cell="input"`)}</td><td>${select("", current.outcomeOptions, row.outcome, `data-row="${i}" data-cell="outcome"`)}</td></tr>`).join("")}</tbody></table></div>`; }
  function renderRecordSet(current, a) { ensureRows(a, current.answer.length); return `<div class="table-scroll"><table><thead><tr><th>No.</th>${current.columns.map((column) => `<th>${esc(column.label)}</th>`).join("")}</tr></thead><tbody>${a.rows.slice(0, current.answer.length).map((row, i) => `<tr><th>${i + 1}</th>${current.columns.map((column) => `<td>${select("", column.options, row[column.id], `data-row="${i}" data-cell="${attrs(column.id)}"`)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
  function renderStateTable(current, a) { return `<div class="table-scroll"><table class="state-table"><thead><tr><th>状態＼イベント</th>${current.events.map((event) => `<th>${esc(event.label)}</th>`).join("")}</tr></thead><tbody>${current.states.map((stateItem) => `<tr><th>${esc(stateItem.label)}</th>${current.events.map((event) => { const id = `${stateItem.id}:${event.id}`; const cell = current.cells[id]; return `<td><select data-state-cell="${attrs(id)}"><option value="">選択</option>${cell.options.map((option, i) => `<option value="${i}" ${Number(a.fields[id]) === i ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`; }
  function renderPairwise(current, a) { if (!a.rows.length) ensureRows(a, current.initialRows); return `<div class="table-tools"><span>${a.rows.length}行（目標 ${current.maxRows}行以内）</span><button type="button" class="button secondary" data-add-row>行を追加</button></div><div class="table-scroll"><table><thead><tr><th>No.</th>${current.parameters.map((p) => `<th>${esc(p.label)}</th>`).join("")}<th></th></tr></thead><tbody>${a.rows.map((row, i) => `<tr><th>${i + 1}</th>${current.parameters.map((p) => `<td>${select("", p.values, row[p.id], `data-row="${i}" data-cell="${attrs(p.id)}"`)}</td>`).join("")}<td><button type="button" class="icon-button" data-remove-row="${i}" aria-label="${i + 1}行目を削除">削除</button></td></tr>`).join("")}</tbody></table></div><p class="table-note">行の順序は採点に影響しません。禁則を除く全ての2因子間ペアを含めてください。</p>`; }
  function renderQuiz(current, fields) { return `<div class="quiz">${current.questions.map((q, qi) => `<fieldset><legend>問${qi + 1} ${esc(q.text)}</legend><div class="options">${q.options.map((option, oi) => `<label class="option ${Number(fields[q.id]) === oi ? "selected" : ""}"><input type="radio" name="${attrs(q.id)}" data-quiz="${attrs(q.id)}" value="${oi}" ${Number(fields[q.id]) === oi ? "checked" : ""}><span>${esc(option)}</span></label>`).join("")}</div></fieldset>`).join("")}</div>`; }
  function progress() { const total = exercises.reduce((sum, item) => sum + item.steps.length, 0); el.progress.textContent = `${state.completed.length} / ${total} 完了`; }

  function validate() {
    const current = step(); const a = answer(); let result;
    if (current.type === "choice") result = validator.validateChoice(current, a.value);
    else if (current.type === "multiChoice") result = validator.validateMultiChoice(current, a.values);
    else if (current.type === "numericGroup") result = validator.validateNumericGroup(current, a.fields);
    else if (current.type === "caseSet") result = validator.validateCaseSet(current, a.rows);
    else if (current.type === "recordSet") result = validator.validateRecordSet(current, a.rows);
    else if (current.type === "stateTable") result = validator.validateStateTable(current, a.fields);
    else if (current.type === "pairwise") result = validator.validatePairwise(current, a.rows);
    else result = validator.validateQuiz(current, a.fields);
    state.completed = state.completed.filter((item) => item !== key()); if (result.pass) state.completed.push(key()); save(); showResult(result, current); render();
  }
  function showResult(result, current) { const answers = current.type === "quiz" ? current.questions.map((q, i) => `<div><strong>問${i + 1}：${esc(q.options[q.answer])}</strong><span>${esc(q.explanation)}</span></div>`).join("") : ""; const stats = result.stats ? `<p class="stats">被覆：${result.stats.covered} / ${result.stats.required} ペア</p>` : ""; el.result.innerHTML = `<p class="eyebrow">${result.pass ? "回答完了" : "要確認"}</p><h2>${result.pass ? "正しくできています" : "もう一度確認しましょう"}</h2>${stats}${result.issues.length ? `<ul class="issues">${result.issues.map((issue) => `<li>${esc(issue)}</li>`).join("")}</ul>` : ""}${answers ? `<div class="explanation answer-list">${answers}</div>` : current.explanation ? `<p class="explanation">${esc(current.explanation)}</p>` : ""}`; el.dialog.showModal(); }

  el.nav.addEventListener("click", (event) => { const button = event.target.closest("[data-exercise]"); if (!button) return; state.activeExerciseId = button.dataset.exercise; state.activeStep = 0; save(); render(); });
  el.tabs.addEventListener("click", (event) => { const button = event.target.closest("[data-step]"); if (!button) return; state.activeStep = Number(button.dataset.step); save(); render(); });
  el.area.addEventListener("input", (event) => { const a = answer(); const t = event.target; if (t.matches("[data-choice]")) a.value = t.value; if (t.matches("[data-multi]")) a.values = [...el.area.querySelectorAll("[data-multi]:checked")].map((input) => input.value); if (t.dataset.field) a.fields[t.dataset.field] = t.value; if (t.dataset.quiz) a.fields[t.dataset.quiz] = t.value; if (t.dataset.stateCell) a.fields[t.dataset.stateCell] = t.value; if (t.dataset.row !== undefined) { a.rows[Number(t.dataset.row)] ||= {}; a.rows[Number(t.dataset.row)][t.dataset.cell] = t.value; } save(); if (t.matches("[data-choice], [data-multi], [data-quiz]")) renderAnswer(); });
  el.area.addEventListener("click", (event) => { const a = answer(); if (event.target.closest("[data-add-row]")) { a.rows.push({}); save(); renderAnswer(); } const remove = event.target.closest("[data-remove-row]"); if (remove) { a.rows.splice(Number(remove.dataset.removeRow), 1); save(); renderAnswer(); } });
  el.reset.addEventListener("click", () => { if (!confirm("このステップの入力をリセットしますか？")) return; delete state.answers[exercise().id]?.[step().id]; state.completed = state.completed.filter((item) => item !== key()); save(); render(); });
  el.check.addEventListener("click", validate); render();
})();
