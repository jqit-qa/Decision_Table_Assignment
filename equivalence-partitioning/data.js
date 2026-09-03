(() => {
  "use strict";
  const validity = ["有効", "無効"];
  window.TRAINING_META = { title: "同値分割法トレーニング", storageKey: "equivalence-partitioning-rev1-state-v1", version: 1 };
  window.TRAINING_EXERCISES = [
    {
      id: "practice-1", section: "練習問題 01", navTitle: "1項目を分割", title: "経費精算の申請金額", goal: "仕様から漏れなく重複なくパーティションを作り、区間の内側から代表値を選びます。",
      specs: ["申請金額は1円以上100,000円以下。範囲外はエラー。", "1〜10,000円は上長承認不要、10,001〜100,000円は上長承認必要。", "代表値には端の値ではなく、パーティション内部の典型値を使う。"],
      steps: [
        { id: "partitions", label: "パーティション表", type: "recordSet", prompt: "4つのパーティションについて、範囲・有効性・代表値を対応づけてください。行の順序は問いません。", columns: [
          { id: "range", label: "範囲", options: ["0円以下", "1〜10,000円（承認不要）", "10,001〜100,000円（承認必要）", "100,001円以上"] },
          { id: "validity", label: "区分", options: validity },
          { id: "representative", label: "代表値", options: ["0円", "1円", "5,000円", "10,000円", "10,001円", "50,000円", "100,000円", "150,000円"] }
        ], answer: [
          { range: "0円以下", validity: "無効", representative: "0円" }, { range: "1〜10,000円（承認不要）", validity: "有効", representative: "5,000円" }, { range: "10,001〜100,000円（承認必要）", validity: "有効", representative: "50,000円" }, { range: "100,001円以上", validity: "無効", representative: "150,000円" }
        ], explanation: "無効範囲も含めて入力領域全体を覆います。有効区間の代表値は境界から離して選びます。" },
        { id: "continuity", label: "漏れ・重複", type: "choice", prompt: "作成した金額パーティションの確認として正しいものを選んでください。", options: ["0と1、10,000と10,001、100,000と100,001が連続し、隙間も重なりもない", "10,000円は2つの区間に重複する", "0円以下はテスト対象外なので漏れてよい", "100,001円以上は有効である"], answer: 0, explanation: "整数1円単位の隣り合う端が連続しています。" }
      ]
    },
    {
      id: "practice-2", section: "練習問題 02", navTitle: "イーチチョイス", title: "複数項目の経費申請", goal: "各パーティションを最低1回通し、無効値を分離したテストケースを作ります。",
      specs: ["申請金額の4パーティションに加え、費目は交通費／会議費／消耗品費、領収書はあり／なし。", "イーチチョイスでは識別した各パーティションを少なくとも1回使う。", "無効値は1テストケースに1つだけ入れ、他の項目は有効値にする。"],
      steps: [
        { id: "counts", label: "個数を数える", type: "numericGroup", prompt: "識別したパーティション総数と、全組み合わせ数を求めてください。", fields: [{ id: "partitions", label: "パーティション総数", answer: 9 }, { id: "all", label: "全組み合わせ数（4×3×2）", answer: 24 }], explanation: "項目をまたいだパーティション数は4+3+2=9、全組み合わせは4×3×2=24です。" },
        { id: "cases", label: "テストケース", type: "recordSet", prompt: "イーチチョイス100%となる5件のテストケースを完成させてください。", columns: [
          { id: "amount", label: "申請金額", options: ["0円", "5,000円", "50,000円", "150,000円"] }, { id: "category", label: "費目", options: ["交通費", "会議費", "消耗品費"] }, { id: "receipt", label: "領収書", options: ["あり", "なし"] }, { id: "result", label: "期待", options: ["有効", "無効"] }
        ], answer: [
          { amount: "5,000円", category: "交通費", receipt: "あり", result: "有効" }, { amount: "50,000円", category: "会議費", receipt: "なし", result: "有効" }, { amount: "50,000円", category: "消耗品費", receipt: "なし", result: "有効" }, { amount: "0円", category: "交通費", receipt: "あり", result: "無効" }, { amount: "150,000円", category: "交通費", receipt: "あり", result: "無効" }
        ], explanation: "費目と領収書の全パーティションを有効ケースへまとめ、2つの金額無効区分は別々のケースにします。" },
        { id: "coverage", label: "カバレッジ", type: "numericGroup", prompt: "全パーティションを通した場合と、有効パーティションだけの場合のカバレッジを求めてください。", fields: [{ id: "numerator", label: "全件実施時の分子", answer: 9 }, { id: "denominator", label: "分母（無効も含む）", answer: 9 }, { id: "allPercent", label: "全件実施時（%）", answer: 100 }, { id: "validPercent", label: "有効だけ実施時（%・小数第1位）", answer: 77.8, tolerance: 0.05 }], explanation: "有効は7個なので7÷9=77.8%。無効パーティションも分母に含めます。" }
      ]
    },
    {
      id: "production", section: "本番問題", navTitle: "配送料金", title: "配送料金シミュレータ", goal: "新しい仕様からパーティションを識別し、代表値とイーチチョイスケースを設計します。",
      specs: ["重量は0.1〜25.0kg（0.1kg単位）。0.1〜2.0kgは小型、2.1〜10.0kgは中型、10.1〜25.0kgは大型。範囲外はエラー。", "配送先地域は本州／北海道・九州／沖縄・離島。", "配送オプションは通常／速達／時間指定。"],
      steps: [
        { id: "partitions", label: "パーティション表", type: "recordSet", prompt: "11パーティションの項目・区分・有効性・代表値を完成させてください。", columns: [
          { id: "field", label: "項目", options: ["重量", "配送先地域", "配送オプション"] },
          { id: "partition", label: "パーティション", options: ["0.1kg未満", "0.1〜2.0kg（小型）", "2.1〜10.0kg（中型）", "10.1〜25.0kg（大型）", "25.0kg超", "本州", "北海道・九州", "沖縄・離島", "通常", "速達", "時間指定"] },
          { id: "validity", label: "区分", options: validity },
          { id: "representative", label: "代表値", options: ["0.0kg", "1.0kg", "5.0kg", "15.0kg", "30.0kg", "本州", "北海道・九州", "沖縄・離島", "通常", "速達", "時間指定"] }
        ], answer: [
          { field: "重量", partition: "0.1kg未満", validity: "無効", representative: "0.0kg" }, { field: "重量", partition: "0.1〜2.0kg（小型）", validity: "有効", representative: "1.0kg" }, { field: "重量", partition: "2.1〜10.0kg（中型）", validity: "有効", representative: "5.0kg" }, { field: "重量", partition: "10.1〜25.0kg（大型）", validity: "有効", representative: "15.0kg" }, { field: "重量", partition: "25.0kg超", validity: "無効", representative: "30.0kg" },
          { field: "配送先地域", partition: "本州", validity: "有効", representative: "本州" }, { field: "配送先地域", partition: "北海道・九州", validity: "有効", representative: "北海道・九州" }, { field: "配送先地域", partition: "沖縄・離島", validity: "有効", representative: "沖縄・離島" },
          { field: "配送オプション", partition: "通常", validity: "有効", representative: "通常" }, { field: "配送オプション", partition: "速達", validity: "有効", representative: "速達" }, { field: "配送オプション", partition: "時間指定", validity: "有効", representative: "時間指定" }
        ], explanation: "重量5、地域3、オプション3で合計11パーティションです。" },
        { id: "counts", label: "組み合わせ数", type: "numericGroup", prompt: "パーティション総数と全組み合わせ数を求めてください。", fields: [{ id: "partitions", label: "パーティション総数", answer: 11 }, { id: "all", label: "全組み合わせ数（5×3×3）", answer: 45 }], explanation: "合計は11、全組み合わせは45通りです。" },
        { id: "cases", label: "テストケース", type: "recordSet", prompt: "イーチチョイス100%となる5件を完成させてください。", columns: [
          { id: "weight", label: "重量", options: ["0.0kg", "1.0kg", "5.0kg", "15.0kg", "30.0kg"] }, { id: "region", label: "地域", options: ["本州", "北海道・九州", "沖縄・離島"] }, { id: "option", label: "オプション", options: ["通常", "速達", "時間指定"] }, { id: "result", label: "期待", options: ["有効", "無効"] }
        ], answer: [
          { weight: "1.0kg", region: "本州", option: "通常", result: "有効" }, { weight: "5.0kg", region: "北海道・九州", option: "速達", result: "有効" }, { weight: "15.0kg", region: "沖縄・離島", option: "時間指定", result: "有効" }, { weight: "0.0kg", region: "本州", option: "通常", result: "無効" }, { weight: "30.0kg", region: "本州", option: "通常", result: "無効" }
        ], explanation: "有効値を効率よく組み合わせ、重量の上下2つの無効区分は別ケースにします。" },
        { id: "quiz", label: "理解度チェック", type: "quiz", prompt: "同値分割法の考え方を確認してください。", questions: [
          { id: "q1", text: "代表値を区間の端から離して選ぶ理由は？", options: ["入力しやすいから", "パーティション内部の典型的な振る舞いを確認するため", "境界値分析を同時に完了するため", "無効値にするため"], answer: 1, explanation: "境界の確認は境界値分析の役割です。" },
          { id: "q2", text: "無効値を1ケースに1つだけ入れる理由は？", options: ["ケース数を増やすため", "欠陥のマスキングを避けるため", "全組み合わせにするため", "有効カバレッジを下げるため"], answer: 1, explanation: "複数のエラーがあると、先に出たエラーが別の入力チェック不具合を隠すことがあります。" },
          { id: "q3", text: "イーチチョイスのカバレッジ分母は？", options: ["有効パーティションだけ", "全組み合わせ数", "識別した全パーティション（無効を含む）", "テストケース数"], answer: 2, explanation: "識別した有効・無効パーティションの総数が分母です。" },
          { id: "q4", text: "10.1kgだけ区分がずれる実装を見つける併用技法は？", options: ["境界値分析", "状態遷移テストだけ", "ペアワイズだけ", "ユースケーステストだけ"], answer: 0, explanation: "境界の直前・境界・直後を境界値分析で確認します。" }
        ] }
      ]
    }
  ];
})();
