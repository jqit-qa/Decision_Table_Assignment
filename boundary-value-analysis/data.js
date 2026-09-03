(() => {
  "use strict";
  window.TRAINING_META = { title: "境界値分析トレーニング", storageKey: "bva-training-rev1-state-v1", version: 1 };
  window.TRAINING_EXERCISES = [
    {
      id: "practice-1", section: "練習問題 01", navTitle: "2値BVA", title: "会員ランク判定システム", goal: "順序性のあるパーティションから内部境界を見つけ、2値BVAのアイテムを作ります。",
      specs: ["年間購読金額は整数。10,000円未満はブロンズ、10,000円以上30,000円未満はシルバー、30,000円以上はゴールド。", "更新期限日は2026-09-30。この日までの更新は継続、2026-10-01以降は失効後の再登録。", "2値BVAでは各境界について、境界値と隣接パーティションの最も近い値を確認する。"],
      steps: [
        { id: "counts", label: "境界を数える", type: "numericGroup", prompt: "仕様からパーティション数と内部境界数を求めてください。", fields: [{ id: "partitions", label: "年間購読金額のパーティション数", answer: 3 }, { id: "amountEdges", label: "金額の内部境界数", answer: 2 }, { id: "dateEdges", label: "日付の内部境界数", answer: 1 }], explanation: "3つの金額区分を隔てる内部境界は2箇所、日付の内部境界は1箇所です。" },
        { id: "amount", label: "金額の2値BVA", type: "caseSet", prompt: "年間購読金額について、2値BVAの4アイテムを完成させてください。行の順序は問いません。", inputLabel: "年間購読金額", outcomeLabel: "会員ランク", rowCount: 4, inputOptions: ["9,998円", "9,999円", "10,000円", "10,001円", "29,998円", "29,999円", "30,000円", "30,001円"], outcomeOptions: ["ブロンズ会員", "シルバー会員", "ゴールド会員"], answer: [{ input: "9,999円", outcome: "ブロンズ会員" }, { input: "10,000円", outcome: "シルバー会員" }, { input: "29,999円", outcome: "シルバー会員" }, { input: "30,000円", outcome: "ゴールド会員" }], explanation: "整数の単位は1円です。境界をまたぐ最も近い2値を選びます。" },
        { id: "date", label: "日付の2値BVA", type: "caseSet", prompt: "更新期限日について、2値BVAの2アイテムを完成させてください。", inputLabel: "更新日", outcomeLabel: "会員の状態", rowCount: 2, inputOptions: ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"], outcomeOptions: ["継続", "失効後の再登録"], answer: [{ input: "2026-09-30", outcome: "継続" }, { input: "2026-10-01", outcome: "失効後の再登録" }], explanation: "仕様が日単位なので、隣接値も1日単位で選びます。" }
      ]
    },
    {
      id: "practice-2", section: "練習問題 02", navTitle: "3値BVA", title: "会員満足度スコア", goal: "境界の両側を調べる3値BVAと、2値BVAとの差を確認します。",
      specs: ["会員満足度は5点満点、小数第1位単位。", "3.0未満は要フォロー、3.0以上4.0未満は様子見、4.0以上は優良会員。", "3値BVAでは境界値と、その両側の隣接値を確認する。"],
      steps: [
        { id: "score", label: "3値BVA表", type: "caseSet", prompt: "2つの内部境界について、3値BVAの6アイテムを完成させてください。", inputLabel: "満足度スコア", outcomeLabel: "フォロー区分", rowCount: 6, inputOptions: ["2.8", "2.9", "3.0", "3.1", "3.8", "3.9", "4.0", "4.1"], outcomeOptions: ["要フォロー", "様子見", "優良会員"], answer: [{ input: "2.8", outcome: "要フォロー" }, { input: "2.9", outcome: "要フォロー" }, { input: "3.0", outcome: "様子見" }, { input: "3.8", outcome: "様子見" }, { input: "3.9", outcome: "様子見" }, { input: "4.0", outcome: "優良会員" }], explanation: "この教材の定義では、境界2箇所×3アイテムで6件です。" },
        { id: "three-only", label: "2値との差", type: "multiChoice", prompt: "上の6アイテムのうち、3値BVAだけが追加する値を選んでください。", options: ["2.8", "2.9", "3.0", "3.8", "3.9", "4.0"], answer: [0, 3], explanation: "境界の内側（同じパーティション側）に追加される2.8と3.8が3値BVA特有のアイテムです。" },
        { id: "coverage", label: "カバレッジ", type: "numericGroup", prompt: "6アイテムをすべて実施した場合のカバレッジを求めてください。", fields: [{ id: "numerator", label: "実施したアイテム数（分子）", answer: 6 }, { id: "denominator", label: "識別したアイテム総数（分母）", answer: 6 }, { id: "percent", label: "カバレッジ（%）", answer: 100 }], explanation: "分母は、識別した境界値と隣接値の合計数です。" }
      ]
    },
    {
      id: "production", section: "本番問題", navTitle: "通信量アラート", title: "モバイルデータ通信量アラート", goal: "割合から境界を計算し、新しい題材でも3値BVAを設計します。",
      specs: ["契約容量は10.0GB。当月使用量は小数第1位単位。", "80%未満は通常、80%以上100%未満は警告、100%以上は利用停止。", "通知方式はプッシュ通知／メール。未選択はエラー。"],
      steps: [
        { id: "thresholds", label: "境界を計算", type: "numericGroup", prompt: "契約容量に割合を掛け、2つの境界をGBで求めてください。", fields: [{ id: "warning", label: "警告ライン（GB）", answer: 8 }, { id: "stop", label: "利用停止ライン（GB）", answer: 10 }], explanation: "10.0×80%=8.0GB、10.0×100%=10.0GBです。" },
        { id: "usage", label: "3値BVA表", type: "caseSet", prompt: "当月データ使用量について、3値BVAの6アイテムを完成させてください。", inputLabel: "使用量", outcomeLabel: "通知区分", rowCount: 6, inputOptions: ["7.8GB", "7.9GB", "8.0GB", "8.1GB", "9.8GB", "9.9GB", "10.0GB", "10.1GB"], outcomeOptions: ["通常", "警告", "利用停止"], answer: [{ input: "7.8GB", outcome: "通常" }, { input: "7.9GB", outcome: "通常" }, { input: "8.0GB", outcome: "警告" }, { input: "9.8GB", outcome: "警告" }, { input: "9.9GB", outcome: "警告" }, { input: "10.0GB", outcome: "利用停止" }], explanation: "内部境界の両側を0.1GB単位で確認します。" },
        { id: "quiz", label: "理解度チェック", type: "quiz", prompt: "境界値分析の考え方を確認してください。", questions: [
          { id: "q1", text: "通知方式が境界値分析の対象にならない主な理由は？", options: ["選択肢が2つしかない", "値に順序性がない", "無効値がある", "文字列だから"], answer: 1, explanation: "BVAは順序性のあるパーティションに適用します。" },
          { id: "q2", text: "3値BVAの分母に使うものは？", options: ["仕様行数", "全入力値", "識別した境界値と隣接値の総数", "有効パーティション数"], answer: 2, explanation: "この課題では境界2箇所×3アイテムの6を分母にします。" },
          { id: "q3", text: "2値か3値かを実務で決めるときの適切な行動は？", options: ["担当者が独断で決める", "常に3値にする", "リーダーとリスク・工数を相談し理由を記録する", "常に2値にする"], answer: 2, explanation: "対象範囲と残存リスクを合意し、判断理由を残します。" },
          { id: "q4", text: "しきい値をまたぐ状態変化も重要な場合、併用候補は？", options: ["状態遷移テスト", "レビューだけ", "ランダムテストだけ", "静的解析だけ"], answer: 0, explanation: "時系列の状態変化は状態遷移テストで補います。" }
        ] }
      ]
    }
  ];
})();
