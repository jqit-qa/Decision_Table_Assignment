(() => {
  "use strict";
  const printParameters = [
    { id: "paper", label: "用紙サイズ", values: ["A4", "A3", "B5"] },
    { id: "color", label: "カラーモード", values: ["カラー", "グレースケール", "モノクロ2値"] },
    { id: "binding", label: "綴じ方向", values: ["左綴じ", "右綴じ", "上綴じ"] }
  ];
  window.TRAINING_META = { title: "ペアワイズ／直交表トレーニング", storageKey: "pairwise-training-rev1-state-v1", version: 1 };
  window.TRAINING_EXERCISES = [
    {
      id: "practice-1", section: "練習問題 01", navTitle: "全ペアを網羅", title: "帳票印刷設定", goal: "全組み合わせとの違いを理解し、全ての2因子間ペアを含む被覆表を作ります。",
      specs: ["用紙サイズはA4／A3／B5。", "カラーモードはカラー／グレースケール／モノクロ2値。", "綴じ方向は左／右／上。3因子は独立で禁則はない。", "1行が1テストケース。各行では各因子の具体的な水準を1つずつ選ぶ。"],
      steps: [
        { id: "counts", label: "全組み合わせ", type: "numericGroup", prompt: "因子数・全組み合わせ数・理論上の最小行数を求めてください。", fields: [{ id: "factors", label: "因子数", answer: 3 }, { id: "all", label: "全組み合わせ数（3×3×3）", answer: 27 }, { id: "minimum", label: "ペアワイズ表の最小行数", answer: 9 }], explanation: "3水準×3水準の因子ペア9通りが下限です。" },
        { id: "table", label: "ペアワイズ表", type: "pairwise", prompt: "9行以内で全ての2因子間ペアを網羅してください。解答例と違う行順・組み合わせでも採点できます。", hint: "まず用紙サイズ×カラーモードの9通りを各行に1回ずつ置き、綴じ方向をずらして他のペアも網羅します。", parameters: printParameters, constraints: [], initialRows: 9, maxRows: 9, sampleRows: [
          { paper: "A3", color: "カラー", binding: "上綴じ" }, { paper: "A3", color: "グレースケール", binding: "右綴じ" }, { paper: "A3", color: "モノクロ2値", binding: "左綴じ" }, { paper: "A4", color: "カラー", binding: "右綴じ" }, { paper: "A4", color: "グレースケール", binding: "左綴じ" }, { paper: "A4", color: "モノクロ2値", binding: "上綴じ" }, { paper: "B5", color: "カラー", binding: "左綴じ" }, { paper: "B5", color: "グレースケール", binding: "上綴じ" }, { paper: "B5", color: "モノクロ2値", binding: "右綴じ" }
        ], explanation: "3つの因子ペアそれぞれで9通りを全て含めば100%です。" },
        { id: "reduction", label: "削減率", type: "numericGroup", prompt: "27通りを9行に削減したときの削減率を求めてください。", fields: [{ id: "rows", label: "ペアワイズ表の行数", answer: 9 }, { id: "percent", label: "削減率（%・小数第1位）", answer: 66.7, tolerance: 0.05 }], explanation: "1−9÷27=66.7%です。" }
      ]
    },
    {
      id: "practice-2", section: "練習問題 02", navTitle: "禁則を除外", title: "帳票印刷設定（仕様変更）", goal: "仕様上の禁則を除き、実行可能なペアだけを網羅します。",
      specs: ["因子と水準は練習問題01と同じ。", "モノクロ2値は左綴じ専用。モノクロ2値×右綴じ、モノクロ2値×上綴じは禁則。", "禁則で成立しないペアはカバレッジ分母に含めない。"],
      steps: [
        { id: "counts", label: "禁則と分母", type: "numericGroup", prompt: "禁則、実行可能な全組み合わせ、識別すべき2因子間ペアを数えてください。", fields: [{ id: "forbidden", label: "禁則の全組み合わせ数", answer: 6 }, { id: "feasible", label: "実行可能な全組み合わせ数", answer: 21 }, { id: "pairs", label: "識別した実行可能ペア数", answer: 25 }], explanation: "禁則は3用紙×2綴じ=6。ペア数は9+9+7=25です。" },
        { id: "table", label: "ペアワイズ表", type: "pairwise", prompt: "禁則を含めず、11行以内で25個の実行可能ペアを全て網羅してください。", hint: "モノクロ2値は必ず左綴じにし、3種類の用紙と組み合わせます。", parameters: printParameters, constraints: [{ color: "モノクロ2値", binding: "右綴じ" }, { color: "モノクロ2値", binding: "上綴じ" }], initialRows: 11, maxRows: 11, sampleRows: [
          { paper: "A3", color: "モノクロ2値", binding: "左綴じ" }, { paper: "A4", color: "モノクロ2値", binding: "左綴じ" }, { paper: "B5", color: "モノクロ2値", binding: "左綴じ" }, { paper: "A3", color: "カラー", binding: "上綴じ" }, { paper: "A3", color: "カラー", binding: "右綴じ" }, { paper: "A4", color: "カラー", binding: "上綴じ" }, { paper: "A4", color: "グレースケール", binding: "右綴じ" }, { paper: "B5", color: "グレースケール", binding: "上綴じ" }, { paper: "B5", color: "カラー", binding: "右綴じ" }, { paper: "A3", color: "グレースケール", binding: "左綴じ" }, { paper: "A3", color: "カラー", binding: "左綴じ" }
        ], explanation: "禁則を除いた全25ペアを被覆します。行の並びは問いません。" },
        { id: "coverage", label: "カバレッジ", type: "numericGroup", prompt: "全25ペアを網羅した表のカバレッジを求めてください。", fields: [{ id: "covered", label: "網羅ペア数", answer: 25 }, { id: "identified", label: "識別ペア数", answer: 25 }, { id: "percent", label: "カバレッジ（%）", answer: 100 }], explanation: "ペアワイズの分母は実行可能な2因子間ペアの総数です。21通りの全組み合わせ数ではありません。" }
      ]
    },
    {
      id: "production", section: "本番問題", navTitle: "会員登録・決済", title: "ECサイトの会員登録・決済確認", goal: "4因子と複数禁則を持つ仕様で、非一意な最小被覆表を作ります。",
      specs: ["会員種別：個人／法人。支払方法：クレジットカード／銀行振込／代引き。", "配送先地域：国内／海外。クーポン適用：あり／なし。", "代引きは国内配送かつ個人会員だけで利用できる。", "禁則：代引き×海外、代引き×法人。重複する禁則は二重に数えない。"],
      steps: [
        { id: "counts", label: "組み合わせを数える", type: "numericGroup", prompt: "全組み合わせ、禁則、実行可能数、実行可能な2因子間ペア数を求めてください。", fields: [{ id: "all", label: "全組み合わせ数（2×3×2×2）", answer: 24 }, { id: "forbidden", label: "禁則数", answer: 6 }, { id: "feasible", label: "実行可能数", answer: 18 }, { id: "pairs", label: "識別ペア数", answer: 28 }], explanation: "禁則は4+4−2=6。因子ペア別の内訳5+4+4+5+6+4=28です。" },
        { id: "table", label: "ペアワイズ表", type: "pairwise", prompt: "禁則を含めず、7行以内で全28ペアを網羅してください。解答例以外の有効な表も正解になります。", hint: "代引きの行は必ず個人×国内です。クーポンあり／なしも代引きと組み合わせる必要があります。", parameters: [
          { id: "member", label: "会員種別", values: ["個人", "法人"] }, { id: "payment", label: "支払方法", values: ["クレジットカード", "銀行振込", "代引き"] }, { id: "region", label: "配送先地域", values: ["国内", "海外"] }, { id: "coupon", label: "クーポン適用", values: ["あり", "なし"] }
        ], constraints: [{ payment: "代引き", region: "海外" }, { payment: "代引き", member: "法人" }], initialRows: 7, maxRows: 7, sampleRows: [
          { member: "個人", payment: "代引き", region: "国内", coupon: "あり" }, { member: "個人", payment: "代引き", region: "国内", coupon: "なし" }, { member: "個人", payment: "クレジットカード", region: "国内", coupon: "あり" }, { member: "個人", payment: "銀行振込", region: "国内", coupon: "なし" }, { member: "個人", payment: "クレジットカード", region: "海外", coupon: "なし" }, { member: "法人", payment: "クレジットカード", region: "国内", coupon: "なし" }, { member: "法人", payment: "銀行振込", region: "海外", coupon: "あり" }
        ], explanation: "全28ペアを被覆し、禁則を含まない7行なら、行順や具体的な解は問いません。" },
        { id: "coverage", label: "カバレッジ", type: "numericGroup", prompt: "完成した表が全ペアを網羅した場合のカバレッジを求めてください。", fields: [{ id: "covered", label: "網羅ペア数", answer: 28 }, { id: "denominator", label: "分母", answer: 28 }, { id: "percent", label: "カバレッジ（%）", answer: 100 }], explanation: "分母は24（全組み合わせ）でも18（実行可能な全組み合わせ）でもなく、識別したペア28です。" },
        { id: "quiz", label: "理解度チェック", type: "quiz", prompt: "ペアワイズ法の考え方を確認してください。", questions: [
          { id: "q1", text: "被覆表の1行が表すものは？", options: ["1因子だけ", "1つの具体的なテストケース", "無効な組み合わせだけ", "1つの期待結果だけ"], answer: 1, explanation: "各因子から水準を1つずつ選んだ具体的なテストケースです。" },
          { id: "q2", text: "カバレッジの分母に使うものは？", options: ["全組み合わせ数", "実行可能ケース数", "禁則を除いた識別ペア数", "因子数"], answer: 2, explanation: "ペア単位の網羅を測るため、実行可能ペア総数を使います。" },
          { id: "q3", text: "ペアワイズ100%でも保証しないものは？", options: ["各水準の登場", "全ての2因子ペア", "3因子以上の相互作用", "禁則の除外"], answer: 2, explanation: "3因子以上が同時に関係する不具合は保証しません。" },
          { id: "q4", text: "重要な3因子相互作用が疑われる場合の併用候補は？", options: ["デシジョンテーブル", "行を無作為に削る", "カバレッジ分母を減らす", "禁則を無視する"], answer: 0, explanation: "対象の条件と結果をデシジョンテーブルで明示的に確認します。" }
        ] }
      ]
    }
  ];
})();
