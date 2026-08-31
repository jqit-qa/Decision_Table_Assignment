import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = vm.createContext({ window: {} });
for (const filename of ["data.js", "validator.js"]) {
  vm.runInContext(fs.readFileSync(new URL(`../${filename}`, import.meta.url), "utf8"), context, { filename });
}

const exercises = context.window.DT_EXERCISES;
const validator = context.window.DT_VALIDATOR;

assert.equal(exercises.length, 3, "練習2問・本番1問であること");
assert.equal(exercises.map((exercise) => exercise.fullColumns.length).join(","), "8,8,16", "完全表の列数");

function toAnswerColumns(exercise, sourceColumns, total = sourceColumns.length) {
  return Array.from({ length: total }, (_, index) => {
    const source = sourceColumns[index];
    if (!source) return { conditions: Array(exercise.conditions.length).fill(""), actions: Array(exercise.actions.length).fill("") };
    const actions = Array(exercise.actions.length).fill("");
    actions[source.result === "NA" ? 0 : source.result] = source.result === "NA" ? "NA" : "X";
    return { conditions: [...source.conditions], actions };
  });
}

for (const exercise of exercises) {
  const full = toAnswerColumns(exercise, exercise.fullColumns);
  assert.equal(validator.validateFullTable(exercise, full).pass, true, `${exercise.id}: 完全表の正解を受理`);
  full[0].conditions[0] = full[0].conditions[0] === "T" ? "F" : "T";
  assert.equal(validator.validateFullTable(exercise, full).pass, false, `${exercise.id}: 条件誤りを検出`);

  const minimized = toAnswerColumns(exercise, [...exercise.minimizedExample].reverse(), exercise.steps.find((step) => step.type === "minimized").columns);
  assert.equal(validator.validateMinimizedTable(exercise, minimized).pass, true, `${exercise.id}: 最小化表は列順が違っても受理`);
  minimized[0].conditions[0] = "";
  assert.equal(validator.validateMinimizedTable(exercise, minimized).pass, false, `${exercise.id}: 最小化表の未入力を検出`);

  const minimizedStep = exercise.steps.find((step) => step.type === "minimized");
  if (minimizedStep.columns >= exercise.fullColumns.length) {
    const copiedFullTable = toAnswerColumns(exercise, exercise.fullColumns, minimizedStep.columns);
    const copiedResult = validator.validateMinimizedTable(exercise, copiedFullTable);
    assert.equal(copiedResult.pass, false, `${exercise.id}: 全組み合わせ表のコピーを最小化として受理しない`);
    assert.ok(copiedResult.issues.some((issue) => issue.includes(`${exercise.minimizedExample.length}列まで`)), `${exercise.id}: 必要な最小列数を案内`);
  }
}

const conditionCountStep = exercises[0].steps.find((step) => step.id === "count");
assert.equal(conditionCountStep.fields.length, 2, "条件数タブの入力欄は2つだけであること");
assert.ok(conditionCountStep.fields.every((field) => field.answerDisplay), "入力欄ごとの解答表示があること");
assert.ok(!conditionCountStep.fields.some((field) => field.key === "formula"), "掛け算を手入力させないこと");
assert.equal(exercises[0].fullColumns.some((column) => column.result === "NA"), false, "01にはN/Aがないこと");

const action400 = ["", "", "", "X"];
const firstMerge = validator.mergeColumns(
  { conditions: ["T", "T", "T"], actions: action400 },
  { conditions: ["F", "T", "T"], actions: action400 }
);
assert.equal(firstMerge.ok, true, "同じ結果で1条件だけT/Fが違う2列を統合できること");
assert.equal(firstMerge.column.conditions.join(","), "-,T,T", "異なる条件をハイフンへ置換すること");

const secondMerge = validator.mergeColumns(
  firstMerge.column,
  { conditions: ["-", "F", "T"], actions: action400 }
);
assert.equal(secondMerge.ok, true, "ハイフンを含む列も段階的に統合できること");
assert.equal(secondMerge.column.conditions.join(","), "-,-,T", "2段階目の統合結果");

assert.equal(validator.mergeColumns(
  { conditions: ["T", "T", "T"], actions: action400 },
  { conditions: ["F", "F", "T"], actions: action400 }
).ok, false, "2条件が違う列は統合しないこと");

assert.equal(validator.mergeColumns(
  { conditions: ["T", "T", "T"], actions: action400 },
  { conditions: ["F", "T", "T"], actions: ["", "", "X", ""] }
).ok, false, "アクションが異なる列は統合しないこと");

assert.equal(exercises[1].steps.map((step) => step.id).join(","), "full,min,coverage", "02はN/A・検算の独立タブを持たないこと");
const practiceCoverage = exercises[1].steps.find((step) => step.type === "coverageChoice");
assert.equal(validator.validateCoverageChoice(practiceCoverage, 6).pass, true, "練習2の正しい分母を受理");
assert.equal(validator.validateCoverageChoice(practiceCoverage, 5).pass, false, "最小化後の列数を分母にしないこと");
assert.equal(validator.validateCoverageChoice(practiceCoverage, 8).pass, false, "N/Aを含む全組み合わせ数を分母にしないこと");

const production = exercises[2];
assert.equal(production.steps.map((step) => step.id).join(","), "full,min,coverage,quiz", "本番問題を練習問題と同じ流れにすること");
assert.ok(!production.steps.some((step) => ["na", "count", "ticket", "reflection"].includes(step.id)), "本番問題に重い記述式タブを残さないこと");
const productionCoverage = production.steps.find((step) => step.type === "coverageChoice");
assert.equal(validator.validateCoverageChoice(productionCoverage, 12).pass, true, "本番問題の正しい分母を受理");
assert.equal(validator.validateCoverageChoice(productionCoverage, 16).pass, false, "本番問題でN/Aを含む全組み合わせ数を分母にしないこと");
assert.equal(validator.validateCoverageChoice(productionCoverage, 6).pass, false, "本番問題で最小化後の列数を分母にしないこと");

const quiz = production.steps.find((step) => step.type === "quiz");
assert.equal(quiz.questions.length, 4, "理解度チェックは4問あること");
assert.ok(quiz.questions.every((question) => question.options.length === 4), "各問が4択であること");
const correctQuizAnswers = Object.fromEntries(quiz.questions.map((question) => [question.id, String(question.answer)]));
assert.equal(validator.validateQuiz(quiz, correctQuizAnswers).pass, true, "理解度チェックの正答を受理");
assert.equal(validator.validateQuiz(quiz, { ...correctQuizAnswers, q1: "0" }).pass, false, "理解度チェックの誤答を検出");
assert.equal(validator.validateQuiz(quiz, {}).pass, false, "理解度チェックの未回答を検出");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const asset of ["favicon.svg", "styles.css", "data.js", "validator.js", "app.js"]) {
  assert.ok(html.includes(asset), `${asset} がHTMLから読み込まれること`);
  assert.ok(fs.existsSync(new URL(`../${asset}`, import.meta.url)), `${asset} が存在すること`);
}

const specificationPosition = html.indexOf('id="specification"');
const assignmentPosition = html.indexOf('id="assignment"');
assert.ok(specificationPosition > -1 && assignmentPosition > specificationPosition, "仕様が問題・解答より先に表示されること");
assert.ok(!html.includes("組み合わせを、"), "不要なキャッチコピーが削除されていること");

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
assert.ok(appSource.includes("210 + columns.length * 56"), "列数に応じて表幅を計算すること");
assert.ok(appSource.includes("表は左右にスクロールできます"), "横長表にスクロール案内があること");
assert.match(cssSource, /\.table-cell\s*\{[^}]*min-width:\s*0;/s, "T/F入力がセル幅を超えないこと");
assert.ok(appSource.includes('data-min-action="copy"'), "全組み合わせ表のコピー操作があること");
assert.ok(appSource.includes('data-min-action="add"'), "列追加操作があること");
assert.ok(appSource.includes('data-min-action="merge"'), "選択した2列の統合操作があること");
assert.ok(appSource.includes("data-select-column"), "統合対象の列選択操作があること");
assert.ok(appSource.includes("data-delete-column"), "列削除操作があること");
assert.ok(appSource.includes("actionWithNA"), "N/Aが必要な問題だけ選択できること");
assert.ok(appSource.includes("decision-table-lab-rev3-state-v5"), "本番の新しいタブ構造に古い保存状態を持ち込まないこと");
assert.ok(appSource.includes("coverageChoice"), "選択式カバレッジ画面を扱うこと");
assert.ok(appSource.includes("renderQuiz"), "4択の理解度チェック画面を扱うこと");
assert.ok(!/Georgia|Yu Mincho/.test(cssSource), "明朝・セリフ体を使用しないこと");
assert.ok(cssSource.includes('--font-sans: -apple-system'), "OS標準のゴシック体スタックを使用すること");
assert.ok(!/PRACTICE|FINAL ASSIGNMENT|STEP COMPLETE|CHECK AGAIN|QUESTION/.test(`${html}\n${appSource}\n${fs.readFileSync(new URL("../data.js", import.meta.url), "utf8")}`), "主要な英字ラベルを日本語化すること");

console.log("Validation passed: 3 exercises, semantic table grading, coverage quiz, and assets.");
