(() => {
  "use strict";

  const norm = (value) => String(value ?? "").normalize("NFKC").trim();
  const sorted = (values) => [...new Set(values.map(String))].sort();

  function validateChoice(step, value) {
    if (value === "" || value === undefined) return { pass: false, issues: ["1つ選択してください。"] };
    return Number(value) === step.answer ? { pass: true, issues: [] } : { pass: false, issues: ["選択した内容を仕様と照らしてください。"] };
  }

  function validateMultiChoice(step, values = []) {
    const actual = sorted(values.map(Number));
    const expected = sorted(step.answer.map(Number));
    return actual.length === expected.length && actual.every((v, i) => v === expected[i])
      ? { pass: true, issues: [] }
      : { pass: false, issues: ["選択した項目に過不足があります。"] };
  }

  function validateNumericGroup(step, fields = {}) {
    const issues = [];
    step.fields.forEach((field) => {
      if (fields[field.id] === "" || fields[field.id] === undefined) issues.push(`${field.label}を入力してください。`);
      else if (Math.abs(Number(fields[field.id]) - Number(field.answer)) > (field.tolerance || 0)) issues.push(`${field.label}を確認してください。`);
    });
    return { pass: issues.length === 0, issues };
  }

  function validateCaseSet(step, rows = []) {
    const actual = rows.filter((row) => row.input !== "" || row.outcome !== "").map((row) => `${norm(row.input)}\u0000${norm(row.outcome)}`);
    const expected = step.answer.map((row) => `${norm(row.input)}\u0000${norm(row.outcome)}`);
    const missing = expected.filter((item) => !actual.includes(item));
    const extra = actual.filter((item) => !expected.includes(item));
    const issues = [];
    if (actual.length < step.answer.length) issues.push(`テストアイテムを${step.answer.length}件すべて入力してください。`);
    if (missing.length) issues.push(`仕様を満たす値と期待結果の組み合わせが${missing.length}件不足しています。`);
    if (extra.length) issues.push(`値と期待結果が一致しない行が${extra.length}件あります。`);
    if (new Set(actual).size !== actual.length) issues.push("同じテストアイテムが重複しています。");
    return { pass: issues.length === 0, issues };
  }

  function validateRecordSet(step, rows = []) {
    const keys = step.columns.map((column) => column.id);
    const signature = (row) => keys.map((key) => norm(row[key])).join("\u0000");
    const actual = rows.filter((row) => keys.some((key) => norm(row[key]))).map(signature);
    const expected = step.answer.map(signature);
    const missing = expected.filter((item) => !actual.includes(item));
    const extra = actual.filter((item) => !expected.includes(item));
    const issues = [];
    if (missing.length) issues.push(`正しい行が${missing.length}件不足しています。`);
    if (extra.length) issues.push(`内容を見直す行が${extra.length}件あります。`);
    if (new Set(actual).size !== actual.length) issues.push("同じ行が重複しています。");
    return { pass: issues.length === 0 && actual.length === expected.length, issues };
  }

  function validateStateTable(step, fields = {}) {
    const issues = [];
    step.states.forEach((state) => step.events.forEach((event) => {
      const id = `${state.id}:${event.id}`;
      if (fields[id] === undefined || fields[id] === "") issues.push(`${state.label} × ${event.label}を選択してください。`);
      else if (Number(fields[id]) !== step.cells[id].answer) issues.push(`${state.label} × ${event.label}の遷移を確認してください。`);
    }));
    return { pass: issues.length === 0, issues: issues.slice(0, 6).concat(issues.length > 6 ? [`ほか${issues.length - 6}件を確認してください。`] : []) };
  }

  function violates(row, constraints = []) {
    return constraints.some((constraint) => Object.entries(constraint).every(([key, value]) => row[key] === value));
  }

  function requiredPairs(step) {
    const pairs = new Set();
    for (let a = 0; a < step.parameters.length; a += 1) {
      for (let b = a + 1; b < step.parameters.length; b += 1) {
        const pa = step.parameters[a]; const pb = step.parameters[b];
        pa.values.forEach((va) => pb.values.forEach((vb) => {
          const possible = step.parameters
            .filter((_, index) => index !== a && index !== b)
            .reduce((rows, parameter) => rows.flatMap((row) => parameter.values.map((value) => ({ ...row, [parameter.id]: value }))), [{ [pa.id]: va, [pb.id]: vb }])
            .some((row) => !violates(row, step.constraints));
          if (possible) pairs.add(`${pa.id}=${va}|${pb.id}=${vb}`);
        }));
      }
    }
    return pairs;
  }

  function coveredPairs(step, rows) {
    const covered = new Set();
    rows.forEach((row) => {
      for (let a = 0; a < step.parameters.length; a += 1) for (let b = a + 1; b < step.parameters.length; b += 1) {
        const pa = step.parameters[a]; const pb = step.parameters[b];
        covered.add(`${pa.id}=${row[pa.id]}|${pb.id}=${row[pb.id]}`);
      }
    });
    return covered;
  }

  function validatePairwise(step, rows = []) {
    const complete = rows.filter((row) => step.parameters.every((parameter) => row[parameter.id]));
    const issues = [];
    if (complete.length !== rows.length) issues.push("未選択のセルがある行を完成させてください。");
    const forbidden = complete.filter((row) => violates(row, step.constraints));
    if (forbidden.length) issues.push(`禁則を含む行が${forbidden.length}件あります。`);
    const required = requiredPairs(step); const covered = coveredPairs(step, complete);
    const uncovered = [...required].filter((pair) => !covered.has(pair));
    if (uncovered.length) issues.push(`未網羅の2因子間ペアが${uncovered.length}件あります。`);
    if (complete.length > step.maxRows) issues.push(`${step.maxRows}行以内で全ペアを網羅してください。`);
    if (!complete.length) issues.push("テストケースを作成してください。");
    return { pass: issues.length === 0, issues, stats: { covered: required.size - uncovered.length, required: required.size } };
  }

  function validateQuiz(step, fields = {}) {
    const issues = [];
    step.questions.forEach((question, index) => {
      if (fields[question.id] === undefined || fields[question.id] === "") issues.push(`問${index + 1}を選択してください。`);
      else if (Number(fields[question.id]) !== question.answer) issues.push(`問${index + 1}を確認してください。`);
    });
    return { pass: issues.length === 0, issues };
  }

  window.TRAINING_VALIDATOR = { validateChoice, validateMultiChoice, validateNumericGroup, validateCaseSet, validateRecordSet, validateStateTable, validatePairwise, validateQuiz, requiredPairs, coveredPairs };
})();
