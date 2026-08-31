(() => {
  "use strict";

  const STORAGE_KEY = "decision-table-lab-rev3-state-v5";
  const exercises = window.DT_EXERCISES;
  const validator = window.DT_VALIDATOR;
  const cellCycles = {
    fullCondition: ["", "T", "F"],
    minimizedCondition: ["", "T", "F", "-"],
    action: ["", "X"],
    actionWithNA: ["", "X", "NA"]
  };

  const defaultState = { version: 5, activeExerciseId: exercises[0].id, activeStep: 0, answers: {}, completed: [] };
  let state = loadState();

  const elements = {
    courseNav: document.querySelector("#courseNav"),
    sectionNumber: document.querySelector("#sectionNumber"),
    exerciseTitle: document.querySelector("#exerciseTitle"),
    assignmentTitle: document.querySelector("#assignmentTitle"),
    assignmentJumpLabel: document.querySelector("#assignmentJumpLabel"),
    difficulty: document.querySelector("#difficulty"),
    learningGoal: document.querySelector("#learningGoal"),
    specList: document.querySelector("#specList"),
    naLegend: document.querySelector("#naLegend"),
    stepTabs: document.querySelector("#stepTabs"),
    answerArea: document.querySelector("#answerArea"),
    helpButton: document.querySelector("#helpButton"),
    helpDialog: document.querySelector("#helpDialog"),
    resetButton: document.querySelector("#resetButton"),
    checkButton: document.querySelector("#checkButton"),
    resultDialog: document.querySelector("#resultDialog"),
    resultContent: document.querySelector("#resultContent"),
    saveStatus: document.querySelector("#saveStatus"),
    progressRing: document.querySelector("#progressRing"),
    progressPercent: document.querySelector("#progressPercent"),
    progressLabel: document.querySelector("#progressLabel")
  };

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || parsed.version !== 5 || !exercises.some((exercise) => exercise.id === parsed.activeExerciseId)) return structuredClone(defaultState);
      return { ...structuredClone(defaultState), ...parsed };
    } catch (_) {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    elements.saveStatus.textContent = "保存中…";
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.setTimeout(() => { elements.saveStatus.textContent = "保存済み"; }, 180);
    } catch (_) {
      elements.saveStatus.textContent = "保存できません";
    }
    updateProgress();
  }

  function activeExercise() {
    return exercises.find((exercise) => exercise.id === state.activeExerciseId) || exercises[0];
  }

  function activeStep() {
    return activeExercise().steps[state.activeStep] || activeExercise().steps[0];
  }

  function answerKey(exercise = activeExercise(), step = activeStep()) {
    return `${exercise.id}:${step.id}`;
  }

  function blankColumn(exercise) {
    return {
      conditions: Array(exercise.conditions.length).fill(""),
      actions: Array(exercise.actions.length).fill("")
    };
  }

  function getAnswer(exercise = activeExercise(), step = activeStep()) {
    state.answers[exercise.id] ||= {};
    const answers = state.answers[exercise.id];
    if (!answers[step.id]) {
      if (["table", "minimized"].includes(step.type)) {
        const initialColumnCount = step.type === "minimized" ? 1 : step.columns;
        answers[step.id] = {
          columns: Array.from({ length: initialColumnCount }, () => blankColumn(exercise)),
          fields: {},
          selectedColumns: []
        };
      } else {
        answers[step.id] = { fields: {}, counts: {} };
      }
    }
    return answers[step.id];
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
  }

  function renderNavigation() {
    elements.courseNav.innerHTML = exercises.map((exercise) => {
      const exerciseSteps = exercise.steps.map((step) => `${exercise.id}:${step.id}`);
      const completeCount = exerciseSteps.filter((key) => state.completed.includes(key)).length;
      const isComplete = completeCount === exercise.steps.length;
      return `
        <button class="course-button ${exercise.id === state.activeExerciseId ? "active" : ""}" type="button" data-exercise="${exercise.id}">
          <span class="course-index">${exercise.number}</span>
          <span><strong>${exercise.navTitle}</strong><small>${completeCount} / ${exercise.steps.length} ステップ</small></span>
          <span class="course-state ${isComplete ? "complete" : ""}" aria-label="${isComplete ? "完了" : "未完了"}"></span>
        </button>`;
    }).join("");
  }

  function renderExercise() {
    const exercise = activeExercise();
    if (state.activeStep >= exercise.steps.length) state.activeStep = 0;
    const step = activeStep();
    elements.sectionNumber.textContent = exercise.section;
    elements.exerciseTitle.textContent = exercise.title;
    const assignmentLabel = exercise.id === "production" ? "本番問題" : "練習問題";
    elements.assignmentTitle.textContent = assignmentLabel;
    elements.assignmentJumpLabel.textContent = assignmentLabel;
    elements.difficulty.textContent = exercise.difficulty;
    elements.learningGoal.textContent = exercise.goal;
    elements.specList.innerHTML = exercise.specs.map((spec) => `<li>${escapeHtml(spec)}</li>`).join("");
    elements.naLegend.hidden = !exercise.fullColumns.some((column) => column.result === "NA");
    elements.stepTabs.innerHTML = exercise.steps.map((item, index) => {
      const complete = state.completed.includes(`${exercise.id}:${item.id}`);
      return `<button class="step-tab ${complete ? "complete" : ""}" type="button" role="tab" aria-selected="${index === state.activeStep}" data-step="${index}">${complete ? "✓" : index + 1 + "."} ${item.label}</button>`;
    }).join("");
    renderAnswerArea(step, exercise);
    renderNavigation();
    updateProgress();
  }

  function renderAnswerArea(step, exercise) {
    const answer = getAnswer(exercise, step);
    const introduction = `<div class="task-intro"><span class="task-label">設問 ${state.activeStep + 1}</span><p>${escapeHtml(step.prompt)}</p></div>`;
    if (step.type === "formula" || step.type === "writing") {
      const formulaGuide = step.type === "formula" ? renderFormulaGuide(answer.fields) : "";
      elements.answerArea.innerHTML = introduction + renderFields(step.fields, answer.fields) + formulaGuide;
    } else if (step.type === "table" || step.type === "minimized") {
      const preface = step.preface ? `<div class="inline-fields">${renderFields(step.preface.fields, answer.fields)}</div>` : "";
      const minimizedGuide = step.type === "minimized" ? renderMinimizedGuide(exercise) : "";
      const minimizedControls = step.type === "minimized" ? renderMinimizedControls(exercise, step, answer.columns) : "";
      elements.answerArea.innerHTML = introduction + preface + minimizedGuide + renderDecisionTable(exercise, step, answer.columns, answer.selectedColumns || []) + minimizedControls;
    } else if (step.type === "ruleCount") {
      elements.answerArea.innerHTML = introduction + renderRuleCount(exercise, answer);
    } else if (step.type === "coverage") {
      elements.answerArea.innerHTML = introduction + renderCoverage(step, answer.fields);
    } else if (step.type === "coverageChoice") {
      elements.answerArea.innerHTML = introduction + renderCoverageChoice(step, answer.fields);
    } else if (step.type === "quiz") {
      elements.answerArea.innerHTML = introduction + renderQuiz(step, answer.fields);
    } else if (step.type === "reflection") {
      elements.answerArea.innerHTML = introduction + renderCoverage(step.coverage, answer.fields, "coverage-") + renderFields(step.fields, answer.fields);
    }
  }

  function renderFields(fields, values) {
    return `<div class="form-grid">${fields.map((field) => {
      const value = escapeHtml(values[field.key] ?? "");
      const common = `data-field="${field.key}" placeholder="${escapeHtml(field.placeholder || "")}"`;
      return `<label class="form-field ${field.multiline ? "wide" : ""}"><span>${escapeHtml(field.label)}</span>${
        field.multiline
          ? `<textarea rows="5" ${common}>${value}</textarea>`
          : `<input type="text" inputmode="${field.inputMode || "text"}" value="${value}" ${common} />`
      }</label>`;
    }).join("")}</div>`;
  }

  function renderFormulaGuide(values) {
    const conditionCount = Number(values.conditions);
    const isUsableCount = Number.isInteger(conditionCount) && conditionCount > 0 && conditionCount <= 10;
    const expression = isUsableCount
      ? `${Array(conditionCount).fill("2").join(" × ")} ＝ ${2 ** conditionCount}`
      : "条件の数を入力すると、掛け算を自動表示します";
    return `<div class="formula-guide"><span>組み合わせ数の計算</span><strong id="formulaExpression">${expression}</strong><p>各条件には T / F の2通りがあります。</p></div>`;
  }

  function renderDecisionTable(exercise, step, columns, selectedColumns = []) {
    const isMinimized = step.type === "minimized";
    const header = columns.map((_, index) => {
      const isSelected = selectedColumns.includes(index);
      return `<th scope="col" class="${isSelected ? "column-is-selected" : ""}"><span>${index + 1}</span>${isMinimized ? `
        <button class="column-select ${isSelected ? "selected" : ""}" type="button" data-select-column="${index}" aria-pressed="${isSelected}" aria-label="列${index + 1}を統合対象として選択">${isSelected ? "✓" : "○"}</button>
        <button class="column-delete" type="button" data-delete-column="${index}" aria-label="列${index + 1}を削除">×</button>` : ""}</th>`;
    }).join("");
    const columnSizes = `<colgroup><col class="label-column" />${columns.map(() => '<col class="data-column" />').join("")}</colgroup>`;
    const conditionRows = exercise.conditions.map((label, rowIndex) => `
      <tr><th scope="row"><small>条件</small>${escapeHtml(label)}</th>${columns.map((column, columnIndex) => renderCell(column.conditions[rowIndex], "condition", rowIndex, columnIndex, isMinimized)).join("")}</tr>`).join("");
    const actionRows = exercise.actions.map((label, rowIndex) => `
      <tr class="action-row"><th scope="row"><small>アクション</small>${escapeHtml(label)}</th>${columns.map((column, columnIndex) => renderCell(column.actions[rowIndex], "action", rowIndex, columnIndex, isMinimized)).join("")}</tr>`).join("");
    const scrollHint = columns.length > 8 ? " ／ 表は左右にスクロールできます" : "";
    const actionHint = exercise.fullColumns.some((column) => column.result === "NA") ? "X → N/A" : "X";
    return `<div class="table-help"><span>セルをクリックして入力を切り替えます</span><span>${isMinimized ? "T → F → −" : "T → F"} ／ ${actionHint}${scrollHint}</span></div>
      <div class="decision-table-wrap" role="region" aria-label="デシジョンテーブル（横スクロール可能）" tabindex="0"><table class="decision-table" style="--table-min-width:${210 + columns.length * 56}px;--table-mobile-min-width:${150 + columns.length * 52}px">${columnSizes}<thead><tr><th scope="col">項目</th>${header}</tr></thead><tbody>${conditionRows}${actionRows}</tbody></table></div>`;
  }

  function renderMinimizedGuide(exercise) {
    const hasNA = exercise.fullColumns.some((column) => column.result === "NA");
    return `<div class="minimized-guide">
      <strong>最小化の進め方</strong>
      <ol>
        <li>「全組み合わせからコピー」で、前のタブの表を持ってきます。</li>
        <li>同じアクションで、条件が1つだけT/Fで違う2列を「○」で選びます。</li>
        <li>「選択した2列をまとめる」を押すと、違う条件が「−」になり1列へまとまります。</li>
      </ol>
      <div class="merge-example"><code>A=T / B=T → X</code><b>＋</b><code>A=F / B=T → X</code><b>＝</b><code>A=− / B=T → X</code></div>
      <p>${hasNA ? "N/Aは、実行不可能な組み合わせをまとめるときに使います。" : "この問題に実行不可能な組み合わせはないため、N/Aは使いません。"}</p>
    </div>`;
  }

  function renderMinimizedControls(exercise, step, columns) {
    const canCopy = state.completed.includes(`${exercise.id}:full`);
    const answer = getAnswer(exercise, step);
    const selectedCount = (answer.selectedColumns || []).length;
    return `<div class="column-controls">
      <button class="button button-ghost" type="button" data-min-action="copy" ${canCopy ? "" : "disabled"}>全組み合わせからコピー</button>
      <button class="button button-merge" type="button" data-min-action="merge" ${selectedCount === 2 ? "" : "disabled"}>選択した2列をまとめる</button>
      <button class="button button-ghost" type="button" data-min-action="add" ${columns.length >= step.columns ? "disabled" : ""}>＋ 列を追加</button>
      <span>${selectedCount}列選択中 ／ 現在${columns.length}列</span>
      ${canCopy ? "" : "<small>先に「全組み合わせ」で正解するとコピーできます。</small>"}
      ${answer.mergeMessage ? `<small class="merge-message" role="alert">${escapeHtml(answer.mergeMessage)}</small>` : ""}
    </div>`;
  }

  function renderCell(value, kind, row, column, isMinimized) {
    const label = value === "NA" ? "N/A" : value || "・";
    const className = value === "-" ? "dash" : value === "NA" ? "na" : value === "T" ? "true" : value === "F" ? "false" : value === "X" ? "selected" : "empty";
    const rowLabel = kind === "condition" ? activeExercise().conditions[row] : activeExercise().actions[row];
    return `<td><button class="table-cell ${className}" type="button" aria-label="列${column + 1} ${escapeHtml(rowLabel)}：${label}" data-cell-kind="${kind}" data-row="${row}" data-column="${column}" data-minimized="${isMinimized}">${label}</button></td>`;
  }

  function minimizedAnswer(exercise) {
    return state.answers[exercise.id]?.min;
  }

  function usedMinimizedColumns(exercise) {
    const answer = minimizedAnswer(exercise);
    if (!answer) return [];
    return answer.columns.map((column, index) => ({ ...column, index })).filter((column) => column.conditions.some(Boolean) || column.actions.some(Boolean));
  }

  function renderRuleCount(exercise, answer) {
    const columns = usedMinimizedColumns(exercise);
    if (!columns.length) return `<div class="empty-note"><strong>先に最小化表を作成してください</strong><p>入力した「−」の数を使って検算します。</p><button class="button button-ghost" type="button" data-go-step="min">最小化へ移動</button></div>`;
    const cards = columns.map((column) => {
      const dashCount = column.conditions.filter((value) => value === "-").length;
      return `<label class="count-card"><span>列 ${column.index + 1}</span><strong>「−」 ${dashCount}個</strong><span>2<sup>${dashCount}</sup> ＝</span><input type="number" min="1" data-count="${column.index}" value="${escapeHtml(answer.counts[column.index] ?? "")}" aria-label="列${column.index + 1}のルールカウント" /></label>`;
    }).join("");
    const total = Object.values(answer.counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
    return `<div class="count-grid">${cards}</div><div class="count-total"><span>入力した合計</span><strong>${total}</strong><span>2<sup>${exercise.conditions.length}</sup> ＝ ${2 ** exercise.conditions.length} と一致するか確認</span></div>`;
  }

  function renderCoverage(config, values, prefix = "") {
    return `<div class="coverage-card">
      <div class="coverage-formula">
        <label><span>実施する列</span><input type="number" min="0" data-field="${prefix}numerator" value="${escapeHtml(values[`${prefix}numerator`] ?? "")}" /></label><b>÷</b>
        <label><span>実行可能列</span><input type="number" min="1" data-field="${prefix}denominator" value="${escapeHtml(values[`${prefix}denominator`] ?? "")}" /></label><b>＝</b>
        <label><span>カバレッジ</span><span class="percent-input"><input type="number" min="0" max="100" step="0.1" data-field="${prefix}percent" value="${escapeHtml(values[`${prefix}percent`] ?? "")}" />%</span></label>
      </div>
      <label class="form-field wide"><span>分母をその値にする理由</span><textarea rows="4" data-field="${prefix}reason" placeholder="最小化との関係も含めて説明">${escapeHtml(values[`${prefix}reason`] ?? "")}</textarea></label>
    </div>`;
  }

  function renderCoverageChoice(step, values) {
    const selected = Number(values.denominator) || 0;
    const calculatedPercent = selected ? Math.round((step.numerator / selected) * 1000) / 10 : null;
    return `<div class="coverage-breakdown">
      <div class="coverage-equation"><span><small>全組み合わせ</small><strong>${step.total}</strong></span><b>−</b><span><small>N/A</small><strong>${step.naBefore}</strong></span><b>＝</b><span class="emphasis"><small>実行可能</small><strong>${step.feasible}</strong></span></div>
      <div class="coverage-equation"><span><small>最小化後</small><strong>${step.minimized}</strong></span><b>−</b><span><small>N/A</small><strong>${step.naAfter}</strong></span><b>＝</b><span class="emphasis"><small>実施する列</small><strong>${step.numerator}</strong></span></div>
    </div>
    <fieldset class="coverage-options"><legend>カバレッジの分母はどれですか？</legend>${step.options.map((option) => `
      <label class="coverage-option ${selected === option.value ? "selected" : ""}"><input type="radio" name="coverage-denominator" data-field="denominator" value="${option.value}" ${selected === option.value ? "checked" : ""} /><span><strong>${option.value}：${escapeHtml(option.label)}</strong><small>${escapeHtml(option.note)}</small></span></label>
    `).join("")}</fieldset>
    <div class="coverage-result ${selected ? "visible" : ""}"><span>選んだ分母で計算</span><strong>${selected ? `${step.numerator} ÷ ${selected} ＝ ${calculatedPercent}%` : "分母を選ぶと式を表示します"}</strong></div>`;
  }

  function renderQuiz(step, values) {
    return `<div class="quiz-list">${step.questions.map((question, questionIndex) => {
      const selected = Number(values[question.id]);
      return `<fieldset class="quiz-question"><legend><span>問${questionIndex + 1}</span>${escapeHtml(question.text)}</legend><div class="quiz-options">${question.options.map((option, optionIndex) => `
        <label class="quiz-option ${selected === optionIndex ? "selected" : ""}"><input type="radio" name="${question.id}" data-field="${question.id}" value="${optionIndex}" ${selected === optionIndex ? "checked" : ""} /><span>${escapeHtml(option)}</span></label>
      `).join("")}</div></fieldset>`;
    }).join("")}</div>`;
  }

  function handleCellClick(button) {
    const answer = getAnswer();
    const column = answer.columns[Number(button.dataset.column)];
    const row = Number(button.dataset.row);
    const kind = button.dataset.cellKind;
    const values = kind === "condition" ? column.conditions : column.actions;
    const cycle = kind === "condition"
      ? (button.dataset.minimized === "true" ? cellCycles.minimizedCondition : cellCycles.fullCondition)
      : (activeExercise().fullColumns.some((column) => column.result === "NA") ? cellCycles.actionWithNA : cellCycles.action);
    values[row] = cycle[(cycle.indexOf(values[row]) + 1) % cycle.length];
    if (activeStep().type === "minimized") invalidateMinimizedProgress(activeExercise());
    saveState();
    renderAnswerArea(activeStep(), activeExercise());
  }

  function invalidateMinimizedProgress(exercise) {
    state.completed = state.completed.filter((key) => ![`${exercise.id}:min`, `${exercise.id}:count`, `${exercise.id}:coverage`, `${exercise.id}:reflection`, `${exercise.id}:quiz`].includes(key));
    if (state.answers[exercise.id]) delete state.answers[exercise.id].count;
  }

  function handleMinimizedAction(action, columnIndex) {
    const exercise = activeExercise();
    const step = activeStep();
    const answer = getAnswer();
    if (step.type !== "minimized") return;

    if (action === "copy") {
      if (!state.completed.includes(`${exercise.id}:full`)) return;
      const hasInput = answer.columns.some((column) => column.conditions.some(Boolean) || column.actions.some(Boolean));
      if (hasInput && !window.confirm("現在の最小化表を、全組み合わせ表で置き換えますか？")) return;
      answer.columns = structuredClone(state.answers[exercise.id].full.columns);
      answer.selectedColumns = [];
      answer.mergeMessage = "コピーしました。まとめたい2列の○を押してください。";
    } else if (action === "add") {
      if (answer.columns.length >= step.columns) return;
      answer.columns.push(blankColumn(exercise));
      answer.mergeMessage = "";
    } else if (action === "select") {
      answer.selectedColumns ||= [];
      if (answer.selectedColumns.includes(columnIndex)) {
        answer.selectedColumns = answer.selectedColumns.filter((index) => index !== columnIndex);
      } else {
        answer.selectedColumns = [...answer.selectedColumns.slice(-1), columnIndex];
      }
      answer.mergeMessage = "";
    } else if (action === "merge") {
      if ((answer.selectedColumns || []).length !== 2) return;
      const [firstIndex, secondIndex] = [...answer.selectedColumns].sort((a, b) => a - b);
      const mergeResult = validator.mergeColumns(answer.columns[firstIndex], answer.columns[secondIndex]);
      if (!mergeResult.ok) {
        answer.mergeMessage = mergeResult.error;
        saveState();
        renderAnswerArea(step, exercise);
        return;
      }
      answer.columns[firstIndex] = mergeResult.column;
      answer.columns.splice(secondIndex, 1);
      answer.selectedColumns = [];
      answer.mergeMessage = `2列をまとめました。条件「${exercise.conditions[mergeResult.differenceIndex]}」を「−」にしています。`;
    } else if (action === "delete") {
      if (answer.columns.length === 1) {
        answer.columns[0] = blankColumn(exercise);
      } else {
        answer.columns.splice(columnIndex, 1);
      }
      answer.selectedColumns = [];
      answer.mergeMessage = "";
    }

    invalidateMinimizedProgress(exercise);
    saveState();
    renderAnswerArea(step, exercise);
  }

  function validateCurrentStep() {
    const exercise = activeExercise();
    const step = activeStep();
    const answer = getAnswer();
    let result;
    if (step.type === "table") {
      result = validator.validateFullTable(exercise, answer.columns);
      if (step.preface) {
        const prefaceResult = validator.validateFields(step.preface.fields, answer.fields);
        result = { pass: result.pass && prefaceResult.pass, issues: [...prefaceResult.issues, ...result.issues] };
      }
    } else if (step.type === "minimized") {
      result = validator.validateMinimizedTable(exercise, answer.columns);
    } else if (step.type === "formula" || step.type === "writing") {
      result = validator.validateFields(step.fields, answer.fields);
    } else if (step.type === "coverage") {
      result = validator.validateCoverage(step, answer.fields);
    } else if (step.type === "coverageChoice") {
      result = validator.validateCoverageChoice(step, answer.fields.denominator);
    } else if (step.type === "quiz") {
      result = validator.validateQuiz(step, answer.fields);
    } else if (step.type === "ruleCount") {
      const columns = usedMinimizedColumns(exercise);
      const issues = [];
      if (!columns.length) issues.push("先に最小化表を入力してください。");
      columns.forEach((column) => {
        const expected = 2 ** column.conditions.filter((value) => value === "-").length;
        if (Number(answer.counts[column.index]) !== expected) issues.push(`列${column.index + 1}のルールカウントを確認してください。`);
      });
      const total = columns.reduce((sum, column) => sum + (Number(answer.counts[column.index]) || 0), 0);
      if (total !== 2 ** exercise.conditions.length) issues.push(`合計を${2 ** exercise.conditions.length}にしてください。`);
      result = { pass: issues.length === 0, issues };
    } else if (step.type === "reflection") {
      const coverageValues = {
        numerator: answer.fields["coverage-numerator"], denominator: answer.fields["coverage-denominator"],
        percent: answer.fields["coverage-percent"], reason: answer.fields["coverage-reason"]
      };
      const coverageResult = validator.validateCoverage(step.coverage, coverageValues);
      const writingResult = validator.validateFields(step.fields, answer.fields);
      result = { pass: coverageResult.pass && writingResult.pass, issues: [...coverageResult.issues, ...writingResult.issues] };
    }
    showResult(result, step, exercise);
  }

  function showResult(result, step, exercise) {
    const key = answerKey(exercise, step);
    if (result.pass && !state.completed.includes(key)) state.completed.push(key);
    if (!result.pass) state.completed = state.completed.filter((item) => item !== key);
    saveState();
    const reference = step.reference || (step.type === "minimized" ? "列順が異なっても、元の全組み合わせを漏れなく重複なく覆い、結果が一致していれば正解です。" : "");
    const fieldAnswers = (step.fields || []).filter((field) => field.answerDisplay).map((field) => `
      <div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.answerDisplay)}</dd></div>
    `).join("");
    const quizAnswers = step.type === "quiz" ? step.questions.map((question, index) => `
      <div><dt>問${index + 1}</dt><dd><strong>${escapeHtml(question.options[question.answer])}</strong><p>${escapeHtml(question.explanation)}</p></dd></div>
    `).join("") : "";
    const answerBlock = quizAnswers
      ? `<div class="reference-answer"><strong>理解度チェックの解答</strong><dl class="quiz-answer-list">${quizAnswers}</dl></div>`
      : fieldAnswers
      ? `<div class="reference-answer"><strong>入力欄ごとの解答</strong><dl class="answer-list">${fieldAnswers}</dl></div>`
      : (reference ? `<div class="reference-answer"><strong>解答例・解説</strong><p>${escapeHtml(reference)}</p></div>` : "");
    elements.resultContent.innerHTML = `
      <div class="result-icon ${result.pass ? "pass" : "retry"}">${result.pass ? "✓" : "!"}</div>
      <p class="eyebrow">${result.pass ? "回答完了" : "要確認"}</p>
      <h2>${result.pass ? "正しくできています" : "もう一度確認しましょう"}</h2>
      ${result.issues.length ? `<ul class="issue-list">${result.issues.slice(0, 8).map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>` : ""}
      ${answerBlock}
      ${result.pass && exercise.explanations ? `<p class="result-tip">${escapeHtml(exercise.explanations[Math.min(state.activeStep, exercise.explanations.length - 1)])}</p>` : ""}`;
    elements.resultDialog.showModal();
    renderExercise();
  }

  function updateProgress() {
    const allKeys = exercises.flatMap((exercise) => exercise.steps.map((step) => `${exercise.id}:${step.id}`));
    const completed = allKeys.filter((key) => state.completed.includes(key)).length;
    const percent = Math.round((completed / allKeys.length) * 100);
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressRing.style.setProperty("--progress", `${percent * 3.6}deg`);
    elements.progressLabel.textContent = percent === 100 ? "全課題完了" : completed ? `${completed} / ${allKeys.length} 完了` : "未着手";
  }

  elements.courseNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-exercise]");
    if (!button) return;
    state.activeExerciseId = button.dataset.exercise;
    state.activeStep = 0;
    saveState();
    renderExercise();
    document.querySelector("#specification").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.stepTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step]");
    if (!button) return;
    state.activeStep = Number(button.dataset.step);
    saveState();
    renderExercise();
  });

  elements.answerArea.addEventListener("click", (event) => {
    const selectColumn = event.target.closest("[data-select-column]");
    if (selectColumn) {
      handleMinimizedAction("select", Number(selectColumn.dataset.selectColumn));
      return;
    }
    const deleteColumn = event.target.closest("[data-delete-column]");
    if (deleteColumn) {
      handleMinimizedAction("delete", Number(deleteColumn.dataset.deleteColumn));
      return;
    }
    const minimizedAction = event.target.closest("[data-min-action]");
    if (minimizedAction) {
      handleMinimizedAction(minimizedAction.dataset.minAction);
      return;
    }
    const cell = event.target.closest("[data-cell-kind]");
    if (cell) handleCellClick(cell);
    const jump = event.target.closest("[data-go-step]");
    if (jump) {
      state.activeStep = activeExercise().steps.findIndex((step) => step.id === jump.dataset.goStep);
      saveState();
      renderExercise();
    }
  });

  elements.answerArea.addEventListener("input", (event) => {
    const field = event.target.dataset.field;
    const count = event.target.dataset.count;
    const answer = getAnswer();
    if (field) answer.fields[field] = event.target.value;
    if (count !== undefined) answer.counts[count] = event.target.value;
    saveState();
    if (field === "conditions" && activeStep().type === "formula") {
      const nextGuide = document.createElement("div");
      nextGuide.innerHTML = renderFormulaGuide(answer.fields);
      const expression = elements.answerArea.querySelector("#formulaExpression");
      const nextExpression = nextGuide.querySelector("#formulaExpression");
      if (expression && nextExpression) expression.textContent = nextExpression.textContent;
    }
    if (field === "denominator" && activeStep().type === "coverageChoice") {
      renderAnswerArea(activeStep(), activeExercise());
    }
    if (field && activeStep().type === "quiz") {
      renderAnswerArea(activeStep(), activeExercise());
    }
    if (count !== undefined) {
      const total = Object.values(answer.counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
      const totalElement = elements.answerArea.querySelector(".count-total strong");
      if (totalElement) totalElement.textContent = total;
    }
  });

  elements.resetButton.addEventListener("click", () => {
    if (!window.confirm("このステップの入力内容をリセットしますか？")) return;
    const exercise = activeExercise();
    const step = activeStep();
    delete state.answers[exercise.id]?.[step.id];
    state.completed = state.completed.filter((key) => key !== answerKey(exercise, step));
    saveState();
    renderExercise();
  });

  elements.checkButton.addEventListener("click", validateCurrentStep);
  elements.helpButton.addEventListener("click", () => elements.helpDialog.showModal());
  renderExercise();
})();
