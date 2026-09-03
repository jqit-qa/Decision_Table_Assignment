(() => {
  "use strict";
  const cell = (correct, wrong = "→同じ状態／何もしない") => ({ options: ["— 無効遷移", correct, wrong], answer: 1 });
  const invalid = (wrong = "→同じ状態／何もしない") => ({ options: ["— 無効遷移", wrong], answer: 0 });
  window.TRAINING_META = { title: "状態遷移テスト トレーニング", storageKey: "state-transition-training-rev1-state-v1", version: 1 };
  window.TRAINING_EXERCISES = [
    {
      id: "practice-1", section: "練習問題 01", navTitle: "状態表の基本", title: "自動販売機", goal: "状態とイベントを洗い出し、状態表の各セルに遷移とアクションを対応づけます。",
      specs: ["商品価格は一律150円。状態は待機中・投入中・選択可能。", "待機中で硬貨投入すると投入中へ。投入中では合計150円未満なら留まり、150円以上なら選択可能へ。", "投入中の商品選択は無効。取消は待機中へ戻り返金する。", "選択可能では追加投入できる。商品選択または取消で待機中へ戻る。待機中の商品選択・取消は無効。"],
      steps: [
        { id: "counts", label: "状態表の大きさ", type: "numericGroup", prompt: "状態数・イベント数・状態表のセル数を求めてください。", fields: [{ id: "states", label: "状態数", answer: 3 }, { id: "events", label: "イベント数", answer: 3 }, { id: "cells", label: "セル数", answer: 9 }], explanation: "3状態×3イベントで9セルです。" },
        { id: "table", label: "状態表", type: "stateTable", prompt: "各状態とイベントの組み合わせを選んで状態表を完成させてください。反応しない組み合わせは無効遷移です。", states: [{ id: "wait", label: "待機中" }, { id: "pay", label: "投入中" }, { id: "ready", label: "選択可能" }], events: [{ id: "coin", label: "硬貨投入" }, { id: "select", label: "商品選択" }, { id: "cancel", label: "取消" }], cells: {
          "wait:coin": cell("→投入中／投入金額に加算", "→選択可能／投入金額に加算"), "wait:select": invalid("→待機中／商品排出"), "wait:cancel": invalid("→待機中／返金"),
          "pay:coin": cell("[合計<150]→投入中、[合計≥150]→選択可能／加算", "→選択可能／常に遷移"), "pay:select": invalid("→待機中／商品排出"), "pay:cancel": cell("→待機中／投入金額を返却", "→投入中／返却"),
          "ready:coin": cell("→選択可能／投入金額に加算", "→投入中／投入金額に加算"), "ready:select": cell("→待機中／商品排出・おつり返却", "→選択可能／商品排出"), "ready:cancel": cell("→待機中／投入金額を全額返却", "→投入中／全額返却")
        }, explanation: "ガード条件で枝分かれする遷移は、同じセルに両方の枝を含めます。" },
        { id: "path", label: "テストパス", type: "choice", prompt: "硬貨投入開始から商品受け取りまでを正しく表すテストパスを選んでください。", options: ["待機中→硬貨100円→投入中→硬貨100円→選択可能→商品選択→待機中", "待機中→商品選択→選択可能→硬貨投入→待機中", "投入中→取消→選択可能→商品選択→待機中", "待機中→硬貨投入→排出中→商品選択→待機中"], answer: 0, explanation: "合計が150円以上になって選択可能へ移り、商品選択で排出・返金後に待機中へ戻ります。" }
      ]
    },
    {
      id: "practice-2", section: "練習問題 02", navTitle: "無効遷移とガード", title: "排出中を追加した自動販売機", goal: "仕様変更を状態表へ反映し、無効遷移とカバレッジアイテムを数えます。",
      specs: ["練習問題01に排出中を追加する。選択可能で商品選択すると排出中へ移る。", "排出中で排出完了すると、おつりを返却して待機中へ戻る。", "排出中は硬貨投入・商品選択・取消を受け付けない。", "待機中・投入中・選択可能では排出完了イベントは発生しない。"],
      steps: [
        { id: "table", label: "状態表", type: "stateTable", prompt: "4状態×4イベントの状態表を完成させてください。", states: [{ id: "wait", label: "待機中" }, { id: "pay", label: "投入中" }, { id: "ready", label: "選択可能" }, { id: "eject", label: "排出中" }], events: [{ id: "coin", label: "硬貨投入" }, { id: "select", label: "商品選択" }, { id: "cancel", label: "取消" }, { id: "done", label: "排出完了" }], cells: {
          "wait:coin": cell("→投入中／投入金額に加算"), "wait:select": invalid(), "wait:cancel": invalid(), "wait:done": invalid("→待機中／おつり返却"),
          "pay:coin": cell("[合計<150]→投入中、[合計≥150]→選択可能／加算"), "pay:select": invalid(), "pay:cancel": cell("→待機中／投入金額を返却"), "pay:done": invalid(),
          "ready:coin": cell("→選択可能／投入金額に加算"), "ready:select": cell("→排出中／商品排出を開始"), "ready:cancel": cell("→待機中／投入金額を全額返却"), "ready:done": invalid(),
          "eject:coin": invalid(), "eject:select": invalid(), "eject:cancel": invalid(), "eject:done": cell("→待機中／おつりを返却")
        }, explanation: "有効なセルは7個ですが、硬貨投入のガード分岐を枝ごとに数えると有効遷移は8個です。" },
        { id: "coverage-items", label: "分母を数える", type: "numericGroup", prompt: "3種類のカバレッジについて分母を求めてください。ガードの枝は別の有効遷移として数えます。", fields: [{ id: "states", label: "全状態カバレッジの分母", answer: 4 }, { id: "valid", label: "有効遷移カバレッジの分母", answer: 8 }, { id: "all", label: "全遷移カバレッジの分母", answer: 17 }], explanation: "全状態4、有効遷移8、無効遷移9なので全遷移は17です。" },
        { id: "valid-coverage", label: "有効遷移カバレッジ", type: "numericGroup", prompt: "8つの有効遷移をすべて1回以上通した場合のカバレッジを求めてください。", fields: [{ id: "numerator", label: "通した異なる有効遷移", answer: 8 }, { id: "denominator", label: "識別した有効遷移", answer: 8 }, { id: "percent", label: "カバレッジ（%）", answer: 100 }], explanation: "同じ遷移を何度通っても、異なるカバレッジアイテムは1つとして数えます。" }
      ]
    },
    {
      id: "production", section: "本番問題", navTitle: "アカウントロック", title: "ログイン試行・アカウントロック", goal: "複数のガードと復帰経路を持つ状態機械を分析します。",
      specs: ["状態は未ログイン・ログイン済み・一時ロック・恒久ロック。イベントは試行成功・試行失敗・ログアウト・管理者操作・ロック時間経過。", "未ログインで成功するとログイン済み。失敗は加算後3回未満なら留まり、3回かつ累積ロック2回未満なら一時ロック、累積ロック2回なら恒久ロック。", "ログイン済みのログアウト／管理者操作は未ログインへ。一時ロックは管理者操作または5分経過で未ログインへ。", "恒久ロックからは管理者操作だけで復帰する。定めのない組み合わせは無効。"],
      steps: [
        { id: "counts", label: "状態表の大きさ", type: "numericGroup", prompt: "状態表と遷移の数を求めてください。", fields: [{ id: "states", label: "状態数", answer: 4 }, { id: "events", label: "イベント数", answer: 5 }, { id: "cells", label: "セル数", answer: 20 }], explanation: "4状態×5イベントで20セルです。" },
        { id: "table", label: "状態表", type: "stateTable", prompt: "すべての状態・イベントを仕様に対応づけてください。", states: [{ id: "out", label: "未ログイン" }, { id: "in", label: "ログイン済み" }, { id: "temp", label: "一時ロック" }, { id: "perm", label: "恒久ロック" }], events: [{ id: "ok", label: "試行成功" }, { id: "ng", label: "試行失敗" }, { id: "logout", label: "ログアウト" }, { id: "admin", label: "管理者操作" }, { id: "time", label: "ロック時間経過" }], cells: {
          "out:ok": cell("→ログイン済み／失敗回数を0にリセット"), "out:ng": cell("[加算後<3]→未ログイン、[=3かつ累積<2]→一時ロック、[=3かつ累積=2]→恒久ロック"), "out:logout": invalid(), "out:admin": invalid(), "out:time": invalid(),
          "in:ok": invalid(), "in:ng": invalid(), "in:logout": cell("→未ログイン／セッション破棄"), "in:admin": cell("→未ログイン／セッション破棄"), "in:time": invalid(),
          "temp:ok": invalid(), "temp:ng": invalid(), "temp:logout": invalid(), "temp:admin": cell("→未ログイン／失敗・累積ロック回数をリセット"), "temp:time": cell("→未ログイン／失敗回数をリセット"),
          "perm:ok": invalid(), "perm:ng": invalid(), "perm:logout": invalid(), "perm:admin": cell("→未ログイン／失敗・累積ロック回数をリセット"), "perm:time": invalid()
        }, explanation: "未ログイン×試行失敗の1セルには3本のガード付き遷移があります。" },
        { id: "coverage", label: "パスのカバレッジ", type: "numericGroup", prompt: "『失敗×3→一時ロック→時間経過→未ログイン』だけを実施した場合の有効遷移カバレッジを求めてください。", fields: [{ id: "numerator", label: "通した異なる有効遷移", answer: 3 }, { id: "denominator", label: "識別した有効遷移", answer: 9 }, { id: "percent", label: "カバレッジ（%・小数第1位）", answer: 33.3, tolerance: 0.05 }], explanation: "1・2回目の失敗は同じ枝なので、異なる遷移としては1つです。3÷9=33.3%です。" },
        { id: "quiz", label: "理解度チェック", type: "quiz", prompt: "状態遷移テストの考え方を確認してください。", questions: [
          { id: "q1", text: "ガードで3つに枝分かれするセルの有効遷移数は？", options: ["1", "2", "3", "状態数と同じ"], answer: 2, explanation: "セルではなく、ガードで分かれた枝をカバレッジアイテムとして数えます。" },
          { id: "q2", text: "有効遷移100%でも見逃し得るものは？", options: ["状態名の誤字だけ", "遷移をまたぐ累積値のリセット漏れ", "有効遷移そのもの", "すべての無効操作"], answer: 1, explanation: "0スイッチカバレッジは遷移の連続関係や持ち越し値を保証しません。" },
          { id: "q3", text: "『2回はセーフ、3回でロック』のしきい値確認に併用する技法は？", options: ["境界値分析", "ペアワイズだけ", "探索的テストだけ", "静的レビューだけ"], answer: 0, explanation: "回数の境界は境界値分析で補います。" },
          { id: "q4", text: "削減範囲を決める適切な方法は？", options: ["担当者が独断で省略", "無効遷移をすべて省略", "リーダーと相談し、理由と残存リスクを記録", "状態が多ければ全て省略"], answer: 2, explanation: "リスクと工数を相談し、判断を記録します。" }
        ] }
      ]
    }
  ];
})();
