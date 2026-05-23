const templates = {
  variables: `// 変数: 値に名前をつける
const learner = "あなた";
let points = 10;

points = points + 5;

console.log(learner + "のポイント: " + points);`,
  condition: `// 条件分岐: 条件で結果を変える
const score = 82;

if (score >= 80) {
  console.log("クリア! 次のステージへ");
} else {
  console.log("もう一度チャレンジ");
}`,
  function: `// 関数: 処理をまとめて再利用する
function greet(name, level) {
  return name + "さんはレベル" + level + "です";
}

console.log(greet("Sora", 3));
console.log(greet("Mika", 5));`
};

const stageLabels = {
  intro: "入門",
  branch: "条件",
  function: "関数",
  data: "データ",
  dom: "DOM",
  mini: "制作"
};

const challenges = [
  {
    id: "greeting",
    stage: "intro",
    title: "あいさつを表示する",
    summary: "console.logを使って、指定された文章を出力します。",
    goal: "console.logを使って「こんにちは、Code Atelier」と表示してください。",
    starter: `// 問題1: あいさつを表示する
// 下の行を書き換えて、指定された文章を表示しましょう。

console.log("ここを書き換える");`,
    expected: ["こんにちは、Code Atelier"],
    checks: [{ pattern: /console\.log\s*\(/, message: "console.logを使って表示しましょう。" }],
    hints: [
      "console.logの丸かっこの中に、表示したい文字を入れます。",
      "文字はダブルクォートで囲みます。",
      '答えの形は console.log("こんにちは、Code Atelier"); です。'
    ],
    explanation: "console.logは、プログラムの結果を画面の出力欄に表示する命令です。文字列はクォートで囲みます。"
  },
  {
    id: "profile",
    stage: "intro",
    title: "変数でプロフィール",
    summary: "変数に入れた名前とレベルをつなげて表示します。",
    goal: "nameとlevelを使って「Rinのレベル: 3」と表示してください。",
    starter: `// 問題2: 変数でプロフィール
const name = "Rin";
const level = 3;

console.log(name);`,
    expected: ["Rinのレベル: 3"],
    checks: [
      { pattern: /\bname\b/, message: "name変数を使って文章を作りましょう。" },
      { pattern: /\blevel\b/, message: "level変数も使って表示しましょう。" }
    ],
    hints: [
      "文字と変数は + でつなげられます。",
      "「のレベル: 」という文字を間に入れます。",
      'console.log(name + "のレベル: " + level); と書けます。'
    ],
    explanation: "変数を使うと、値が変わっても同じ形の文章を作れます。文字列と数値は + で連結できます。"
  },
  {
    id: "add",
    stage: "intro",
    title: "合計を計算する",
    summary: "2つの数値を足して、合計を表示します。",
    goal: "priceとtaxを足して、1200と表示してください。",
    starter: `// 問題3: 合計を計算する
const price = 1000;
const tax = 200;

console.log(price);`,
    expected: ["1200"],
    checks: [{ pattern: /\+/, message: "+ を使って足し算しましょう。" }],
    hints: [
      "足し算には + を使います。",
      "priceとtaxを足すと1200になります。",
      "console.log(price + tax); と書きます。"
    ],
    explanation: "数値同士に + を使うと足し算になります。変数に入った数値も、そのまま計算に使えます。"
  },
  {
    id: "double",
    stage: "intro",
    title: "数を2倍にする",
    summary: "変数の値を使って、計算した結果を表示します。",
    goal: "numberの値を使って、14と表示してください。",
    starter: `// 問題4: 数を2倍にする
const number = 7;

console.log(number);`,
    expected: ["14"],
    checks: [{ pattern: /\*/, message: "* を使ってかけ算しましょう。" }],
    hints: [
      "2倍は、元の数に2をかける計算です。",
      "JavaScriptでは、かけ算に * を使います。",
      "console.log(number * 2); と書くと、14が表示されます。"
    ],
    explanation: "* はかけ算の演算子です。number * 2 のように書くと、変数の値を2倍にできます。"
  },
  {
    id: "string",
    stage: "intro",
    title: "文字列を組み立てる",
    summary: "複数の文字列をつなげて、1つのメッセージにします。",
    goal: "firstとsecondを使って「JavaScript入門」と表示してください。",
    starter: `// 問題5: 文字列を組み立てる
const first = "JavaScript";
const second = "入門";

console.log(first);`,
    expected: ["JavaScript入門"],
    checks: [{ pattern: /\bfirst\b[\s\S]*\+[\s\S]*\bsecond\b|\bsecond\b[\s\S]*\+[\s\S]*\bfirst\b/, message: "firstとsecondを + でつなげましょう。" }],
    hints: [
      "文字列同士も + でつなげられます。",
      "firstのあとにsecondをつなげます。",
      "console.log(first + second); がゴールです。"
    ],
    explanation: "+ は数値では足し算、文字列では連結として働きます。値の種類によって意味が少し変わります。"
  },
  {
    id: "pass",
    stage: "branch",
    title: "合格判定を作る",
    summary: "if文で点数を判定し、条件に合うメッセージを表示します。",
    goal: "scoreが70以上なら「合格」と表示してください。",
    starter: `// 問題6: 合格判定を作る
const score = 72;

if (score >= 80) {
  console.log("合格");
} else {
  console.log("もう少し");
}`,
    expected: ["合格"],
    checks: [
      { pattern: /\bif\s*\(/, message: "if文を使って判定しましょう。" },
      { pattern: />=\s*70/, message: "合格ラインは70以上です。" }
    ],
    hints: [
      "条件の数字を、問題文の合格ラインに合わせます。",
      "70以上は score >= 70 と書けます。",
      "if (score >= 70) に直すと、scoreが72なので合格になります。"
    ],
    explanation: "if文は条件がtrueのときだけ中の処理を実行します。比較演算子 >= は「以上」を表します。"
  },
  {
    id: "discount",
    stage: "branch",
    title: "会員ランクを判定する",
    summary: "条件分岐で表示するメッセージを変えます。",
    goal: "rankがgoldなら「10%OFF」と表示してください。",
    starter: `// 問題7: 会員ランクを判定する
const rank = "gold";

if (rank === "silver") {
  console.log("10%OFF");
} else {
  console.log("通常価格");
}`,
    expected: ["10%OFF"],
    checks: [
      { pattern: /===/, message: "=== を使って文字列を比較しましょう。" },
      { pattern: /"gold"|'gold'/, message: "goldランクを判定しましょう。" }
    ],
    hints: [
      "rankの中身はgoldです。",
      "文字列を比べるときは === を使えます。",
      'if (rank === "gold") に直してみましょう。'
    ],
    explanation: "=== は左右の値が同じかを調べます。文字列を比較するときもよく使います。"
  },
  {
    id: "function",
    stage: "function",
    title: "関数であいさつ",
    summary: "処理を関数にまとめ、値を渡して結果を作ります。",
    goal: "greet関数を使って「Akiさん、こんにちは」と表示してください。",
    starter: `// 問題8: 関数であいさつ
function greet(name) {
  return name;
}

console.log(greet("Aki"));`,
    expected: ["Akiさん、こんにちは"],
    checks: [
      { pattern: /function\s+greet\s*\(/, message: "greet関数を定義して使いましょう。" },
      { pattern: /return/, message: "returnで結果を返しましょう。" }
    ],
    hints: [
      "returnする文字列を、あいさつ文にします。",
      "name + \"さん、こんにちは\" のようにつなげます。",
      'return name + "さん、こんにちは"; と書けます。'
    ],
    explanation: "関数は入力を受け取り、処理した結果を返せます。returnは関数の外へ値を返すキーワードです。"
  },
  {
    id: "array",
    stage: "data",
    title: "配列から取り出す",
    summary: "配列の中から、指定された要素を表示します。",
    goal: "itemsの2番目の値である「ノート」と表示してください。",
    starter: `// 問題9: 配列から取り出す
const items = ["ペン", "ノート", "消しゴム"];

console.log(items[0]);`,
    expected: ["ノート"],
    checks: [{ pattern: /items\s*\[\s*1\s*\]/, message: "配列の2番目はインデックス1です。" }],
    hints: [
      "配列は0番目から数えます。",
      "2番目の値は items[1] です。",
      "console.log(items[1]); と書きます。"
    ],
    explanation: "配列の番号は0から始まります。1番目は[0]、2番目は[1]で取り出します。"
  },
  {
    id: "loop",
    stage: "data",
    title: "ループで順番に表示",
    summary: "配列の中身をfor文で1つずつ表示します。",
    goal: "fruitsの中身を、りんご、バナナ、みかんの順に表示してください。",
    starter: `// 問題10: ループで順番に表示
const fruits = ["りんご", "バナナ", "みかん"];

console.log(fruits[0]);`,
    expected: ["りんご", "バナナ", "みかん"],
    checks: [{ pattern: /\bfor\s*\(/, message: "for文を使って繰り返しましょう。" }],
    hints: [
      "同じ形の処理を繰り返すときはfor文が便利です。",
      "iを0から始めて、fruits.lengthより小さい間繰り返します。",
      "for (let i = 0; i < fruits.length; i++) { console.log(fruits[i]); } と書けます。"
    ],
    explanation: "for文は決まった回数の繰り返しに向いています。配列の長さだけ回すと、中身を順番に扱えます。"
  },
  {
    id: "sum-loop",
    stage: "data",
    title: "配列の合計を出す",
    summary: "ループで数値を足し合わせ、合計を表示します。",
    goal: "scoresの合計である60を表示してください。",
    starter: `// 問題11: 配列の合計を出す
const scores = [10, 20, 30];
let total = 0;

console.log(total);`,
    expected: ["60"],
    checks: [
      { pattern: /\bfor\s*\(/, message: "for文を使ってscoresを順番に処理しましょう。" },
      { pattern: /total\s*=\s*total\s*\+|total\s*\+=/, message: "totalに値を足し込んでいきましょう。" }
    ],
    hints: [
      "合計用の変数totalに、配列の中身を1つずつ足します。",
      "scores[i]で、i番目の点数を取り出せます。",
      "for文の中で total += scores[i]; と書けます。"
    ],
    explanation: "合計を作るときは、最初に0を用意して、ループの中で少しずつ足していく形が定番です。"
  },
  {
    id: "object-name",
    stage: "data",
    title: "オブジェクトの値を読む",
    summary: "名前付きのデータから、必要な値を取り出します。",
    goal: "userのnameとroleを使って「Naoはmentorです」と表示してください。",
    starter: `// 問題12: オブジェクトの値を読む
const user = {
  name: "Nao",
  role: "mentor"
};

console.log(user.name);`,
    expected: ["Naoはmentorです"],
    checks: [
      { pattern: /user\.name/, message: "user.nameを使って名前を取り出しましょう。" },
      { pattern: /user\.role/, message: "user.roleを使って役割を取り出しましょう。" }
    ],
    hints: [
      "オブジェクトの値は ドット記法 で取り出せます。",
      "user.name と user.role を文字列でつなげます。",
      'console.log(user.name + "は" + user.role + "です"); と書けます。'
    ],
    explanation: "オブジェクトは、関連するデータを名前付きでまとめられます。user.nameのようにキー名で値を取り出します。"
  },
  {
    id: "object-update",
    stage: "data",
    title: "オブジェクトを更新する",
    summary: "オブジェクトのプロパティを書き換えて表示します。",
    goal: "player.levelを1増やして、4と表示してください。",
    starter: `// 問題13: オブジェクトを更新する
const player = {
  name: "Kai",
  level: 3
};

console.log(player.level);`,
    expected: ["4"],
    checks: [
      { pattern: /player\.level\s*=\s*player\.level\s*\+|player\.level\s*\+=|player\.level\+\+/, message: "player.levelを更新してから表示しましょう。" }
    ],
    hints: [
      "プロパティも変数のように更新できます。",
      "player.level = player.level + 1; と書けます。",
      "更新したあとに console.log(player.level); で表示します。"
    ],
    explanation: "オブジェクトの中の値も、代入によって変更できます。ゲームのレベルやHP更新のような処理でよく使います。"
  },
  {
    id: "method",
    stage: "function",
    title: "関数で税込価格",
    summary: "数値を受け取り、計算結果を返す関数を作ります。",
    goal: "addTax関数を使って、1100と表示してください。",
    starter: `// 問題14: 関数で税込価格
function addTax(price) {
  return price;
}

console.log(addTax(1000));`,
    expected: ["1100"],
    checks: [
      { pattern: /function\s+addTax\s*\(/, message: "addTax関数を定義しましょう。" },
      { pattern: /return[\s\S]*\*|return[\s\S]*\+/, message: "returnで計算結果を返しましょう。" }
    ],
    hints: [
      "1000の10%は100です。",
      "price * 1.1 で税込価格を計算できます。",
      "return price * 1.1; と書けます。"
    ],
    explanation: "関数に計算をまとめると、同じルールをいろいろな値に使い回せます。"
  },
  {
    id: "array-map",
    stage: "function",
    title: "配列を変換する",
    summary: "mapを使って、配列の各値を別の値に変換します。",
    goal: "numbersを2倍にして「2,4,6」と表示してください。",
    starter: `// 問題15: 配列を変換する
const numbers = [1, 2, 3];

const doubled = numbers;
console.log(doubled.join(","));`,
    expected: ["2,4,6"],
    checks: [
      { pattern: /\.map\s*\(/, message: "mapを使って配列を変換しましょう。" },
      { pattern: /\*\s*2/, message: "それぞれの数を2倍にしましょう。" }
    ],
    hints: [
      "mapは配列の各要素を変換して、新しい配列を作ります。",
      "n => n * 2 のような関数を渡せます。",
      "const doubled = numbers.map((n) => n * 2); と書けます。"
    ],
    explanation: "mapは元の配列をもとに、新しい配列を作るメソッドです。データ加工でとてもよく使います。"
  },
  {
    id: "dom-text",
    stage: "dom",
    title: "DOMの文字を考える",
    summary: "画面の要素に入れる文字列を作ります。",
    goal: "message変数を使って「画面に表示: Welcome」と表示してください。",
    starter: `// 問題16: DOMの文字を考える
const message = "Welcome";

// 実際のWebでは、ここで要素のtextContentに入れます。
console.log(message);`,
    expected: ["画面に表示: Welcome"],
    checks: [
      { pattern: /message/, message: "message変数を使って表示文を作りましょう。" }
    ],
    hints: [
      "画面に入れる文字を、まずはconsole.logで確認します。",
      "固定の文字とmessageを + でつなげます。",
      'console.log("画面に表示: " + message); と書けます。'
    ],
    explanation: "DOM操作では、最終的にtextContentなどへ文字を入れます。まず表示したい文字を正しく作れることが大事です。"
  },
  {
    id: "dom-html",
    stage: "dom",
    title: "HTML文字列を作る",
    summary: "データから小さなHTML部品を組み立てます。",
    goal: "titleを使って「<li>JavaScript</li>」と表示してください。",
    starter: `// 問題17: HTML文字列を作る
const title = "JavaScript";

console.log(title);`,
    expected: ["<li>JavaScript</li>"],
    checks: [
      { pattern: /<li>/, message: "<li>タグを文字列に入れましょう。" },
      { pattern: /<\/li>/, message: "</li>タグで閉じましょう。" }
    ],
    hints: [
      "HTMLも文字列として組み立てられます。",
      "タグの間にtitleを入れます。",
      'console.log("<li>" + title + "</li>"); と書けます。'
    ],
    explanation: "Webアプリでは、データからHTMLの部品を作る場面があります。文字列連結はその基本形です。"
  },
  {
    id: "event-count",
    stage: "dom",
    title: "クリック回数を増やす",
    summary: "イベントで行う処理を、関数として作ります。",
    goal: "click関数を2回呼び出して、2と表示してください。",
    starter: `// 問題18: クリック回数を増やす
let count = 0;

function click() {
  // ここでcountを増やします
}

click();
click();
console.log(count);`,
    expected: ["2"],
    checks: [
      { pattern: /function\s+click\s*\(/, message: "click関数の中に処理を書きましょう。" },
      { pattern: /count\s*=\s*count\s*\+|count\s*\+=|count\+\+/, message: "clickのたびにcountを増やしましょう。" }
    ],
    hints: [
      "クリックされたら、回数を1増やすイメージです。",
      "関数の中に count += 1; と書けます。",
      "clickを2回呼ぶので、countは2になります。"
    ],
    explanation: "イベント処理では、クリックされたときに実行する関数を用意します。状態を変える処理の基本です。"
  },
  {
    id: "mini-fortune",
    stage: "mini",
    title: "おみくじを作る",
    summary: "配列から決まった結果を取り出すミニ制作です。",
    goal: "fortunesの3番目を使って「今日の運勢: 大吉」と表示してください。",
    starter: `// 問題19: おみくじを作る
const fortunes = ["小吉", "中吉", "大吉"];

console.log(fortunes[0]);`,
    expected: ["今日の運勢: 大吉"],
    checks: [
      { pattern: /fortunes\s*\[\s*2\s*\]/, message: "3番目の値はfortunes[2]です。" }
    ],
    hints: [
      "配列は0から数えるので、3番目は2です。",
      "fortunes[2] が 大吉 です。",
      'console.log("今日の運勢: " + fortunes[2]); と書けます。'
    ],
    explanation: "おみくじやランダム表示のようなミニアプリでは、候補を配列で持つと扱いやすくなります。"
  },
  {
    id: "mini-quiz",
    stage: "mini",
    title: "クイズ判定を作る",
    summary: "答えが合っているかを判定するミニ制作です。",
    goal: "answerがJavaScriptなら「正解」と表示してください。",
    starter: `// 問題20: クイズ判定を作る
const answer = "JavaScript";

if (answer === "HTML") {
  console.log("正解");
} else {
  console.log("不正解");
}`,
    expected: ["正解"],
    checks: [
      { pattern: /\bif\s*\(/, message: "if文で答えを判定しましょう。" },
      { pattern: /"JavaScript"|'JavaScript'/, message: "正解の文字列はJavaScriptです。" }
    ],
    hints: [
      "answerの中身はJavaScriptです。",
      "比較する文字列をJavaScriptにします。",
      'if (answer === "JavaScript") に直しましょう。'
    ],
    explanation: "クイズアプリでは、ユーザーの答えと正解を比較して、表示する結果を切り替えます。条件分岐の実用例です。"
  }
];

const editor = document.querySelector("#codeEditor");
const output = document.querySelector("#output");
const runButton = document.querySelector("#runButton");
const checkButton = document.querySelector("#checkButton");
const resetButton = document.querySelector("#resetButton");
const clearButton = document.querySelector("#clearButton");
const hintButton = document.querySelector("#hintButton");
const nextButton = document.querySelector("#nextButton");
const completedCount = document.querySelector("#completedCount");
const solvedCount = document.querySelector("#solvedCount");
const activeChallengeTitle = document.querySelector("#activeChallengeTitle");
const activeChallengeMeta = document.querySelector("#activeChallengeMeta");
const activeChallengeGoal = document.querySelector("#activeChallengeGoal");
const hintBox = document.querySelector("#hintBox");
const judgeStatus = document.querySelector("#judgeStatus");
const judgeMessage = document.querySelector("#judgeMessage");
const explanationBox = document.querySelector("#explanationBox");
const challengeGrid = document.querySelector("#challengeGrid");
const templateButtons = document.querySelectorAll("[data-template]");
const stageButtons = document.querySelectorAll("[data-stage]");
const questChecks = document.querySelectorAll("[data-quest]");

let currentTemplate = "variables";
let currentChallenge = challenges[0].id;
let currentStage = "all";
let currentMode = "challenge";
let hintIndex = 0;
let lastRunLines = [];
let solvedChallenges = new Set();
let completedQuests = new Set();

function getChallenge(challengeId) {
  return challenges.find((challenge) => challenge.id === challengeId);
}

function getChallengeNumber(challengeId) {
  return challenges.findIndex((challenge) => challenge.id === challengeId) + 1;
}

function renderChallenges() {
  challengeGrid.innerHTML = challenges.map((challenge, index) => `
    <article class="challenge-card" data-challenge="${challenge.id}" data-stage-name="${challenge.stage}">
      <span class="challenge-level">${String(index + 1).padStart(2, "0")} / ${stageLabels[challenge.stage]}</span>
      <h3>${challenge.title}</h3>
      <p>${challenge.summary}</p>
      <button class="ghost-button" type="button">この問題を解く</button>
    </article>
  `).join("");
  updateSolvedDisplay();
  applyStageFilter();
}

function setTemplate(templateName) {
  currentTemplate = templateName;
  currentMode = "template";
  editor.value = templates[templateName];
  activeChallengeTitle.textContent = "コード実行ラボ";
  activeChallengeMeta.textContent = "自由練習";
  activeChallengeGoal.textContent = "テンプレートを自由に編集して、実行結果を確認できます。";
  resetJudge("自由練習");
  hideHint();
  hideExplanation();

  templateButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.template === templateName);
  });

  document.querySelectorAll("[data-challenge]").forEach((card) => {
    card.classList.remove("active");
  });
}

function setChallenge(challengeName, options = { scroll: true }) {
  currentChallenge = challengeName;
  currentMode = "challenge";
  hintIndex = 0;

  const challenge = getChallenge(challengeName);
  const number = getChallengeNumber(challengeName);
  editor.value = challenge.starter;
  activeChallengeTitle.textContent = challenge.title;
  activeChallengeMeta.textContent = `${String(number).padStart(2, "0")} / ${stageLabels[challenge.stage]}`;
  activeChallengeGoal.textContent = challenge.goal;
  resetJudge(solvedChallenges.has(challengeName) ? "クリア済み" : "未判定");
  hideHint();
  hideExplanation();

  templateButtons.forEach((button) => {
    button.classList.remove("active");
  });

  document.querySelectorAll("[data-challenge]").forEach((card) => {
    card.classList.toggle("active", card.dataset.challenge === challengeName);
  });

  if (options.scroll) {
    document.querySelector("#playground").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setStage(stageName) {
  currentStage = stageName;
  stageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.stage === stageName);
  });
  applyStageFilter();
}

function applyStageFilter() {
  document.querySelectorAll("[data-challenge]").forEach((card) => {
    const isVisible = currentStage === "all" || card.dataset.stageName === currentStage;
    card.hidden = !isVisible;
  });
}

function print(message) {
  const text = typeof message === "string" ? message : JSON.stringify(message, null, 2);
  lastRunLines.push(text);
  output.textContent += `${text}\n`;
}

function runCode() {
  output.textContent = "";
  lastRunLines = [];

  const originalConsoleLog = console.log;
  console.log = (...values) => {
    print(values.map((value) => String(value)).join(" "));
  };

  try {
    const code = editor.value;
    const execute = new Function(code);
    execute();

    if (!output.textContent.trim()) {
      output.textContent = "実行できました。console.logを書くと結果が見えます。";
    }
  } catch (error) {
    output.textContent = `エラー: ${error.message}`;
    lastRunLines = [`エラー: ${error.message}`];
  } finally {
    console.log = originalConsoleLog;
  }

  return [...lastRunLines];
}

function checkAnswer() {
  if (currentMode !== "challenge") {
    judgeMessage.textContent = "自由練習中です。問題カードを選ぶと自動判定できます。";
    updateStatus("自由練習", "");
    hideExplanation();
    return;
  }

  const challenge = getChallenge(currentChallenge);
  const code = editor.value;
  const missingCheck = challenge.checks.find((check) => !check.pattern.test(code));

  if (missingCheck) {
    runCode();
    updateStatus("もう一歩", "fail");
    judgeMessage.textContent = missingCheck.message;
    hideExplanation();
    return;
  }

  const lines = runCode().map((line) => line.trim()).filter(Boolean);
  const passed = challenge.expected.length === lines.length && challenge.expected.every((line, index) => line === lines[index]);

  if (passed) {
    solvedChallenges.add(currentChallenge);
    saveSolvedChallenges();
    updateQuestAchievements(challenge, code);
    updateSolvedDisplay();
    updateStatus("クリア", "pass");
    judgeMessage.textContent = "正解です。期待どおりの出力になりました。";
    explanationBox.hidden = false;
    explanationBox.textContent = challenge.explanation;
    return;
  }

  updateStatus("もう一歩", "fail");
  judgeMessage.textContent = `期待する出力は「${challenge.expected.join(" / ")}」です。実行結果を見直してみましょう。`;
  hideExplanation();
}

function showNextHint() {
  if (currentMode !== "challenge") {
    hintBox.hidden = false;
    hintBox.textContent = "問題カードを選ぶと、その問題に合わせたヒントが表示されます。";
    return;
  }

  const hints = getChallenge(currentChallenge).hints;
  hintBox.hidden = false;
  hintBox.textContent = hints[Math.min(hintIndex, hints.length - 1)];
  hintIndex += 1;
}

function goToNextChallenge() {
  const currentIndex = challenges.findIndex((challenge) => challenge.id === currentChallenge);
  const nextChallenge = challenges[(currentIndex + 1) % challenges.length];
  setStage("all");
  setChallenge(nextChallenge.id);
}

function hideHint() {
  hintBox.hidden = true;
  hintBox.textContent = "";
}

function hideExplanation() {
  explanationBox.hidden = true;
  explanationBox.textContent = "";
}

function resetJudge(label) {
  judgeMessage.textContent = "実行後に判定すると、結果がここに表示されます。";
  updateStatus(label, solvedChallenges.has(currentChallenge) && currentMode === "challenge" ? "pass" : "");
}

function updateStatus(text, state) {
  judgeStatus.textContent = text;
  judgeStatus.classList.toggle("pass", state === "pass");
  judgeStatus.classList.toggle("fail", state === "fail");
}

function updateSolvedDisplay() {
  solvedCount.textContent = `${solvedChallenges.size}/${challenges.length}`;
  document.querySelectorAll("[data-challenge]").forEach((card) => {
    card.classList.toggle("solved", solvedChallenges.has(card.dataset.challenge));
  });
}

function updateQuestAchievements(challenge, code) {
  if (/console\.log\s*\(/.test(code)) {
    completedQuests.add("console");
  }

  completedQuests.add(challenge.stage);

  if (solvedChallenges.size >= 5) {
    completedQuests.add("five");
  }

  if (solvedChallenges.size >= 10) {
    completedQuests.add("ten");
  }

  saveCompletedQuests();
  updateQuestDisplay();
}

function saveSolvedChallenges() {
  localStorage.setItem("codeAtelierSolvedChallenges", JSON.stringify([...solvedChallenges]));
}

function restoreSolvedChallenges() {
  const saved = localStorage.getItem("codeAtelierSolvedChallenges");
  if (!saved) return;

  try {
    const knownIds = new Set(challenges.map((challenge) => challenge.id));
    solvedChallenges = new Set(JSON.parse(saved).filter((id) => knownIds.has(id)));
  } catch {
    localStorage.removeItem("codeAtelierSolvedChallenges");
  }
}

function updateQuestDisplay() {
  questChecks.forEach((check) => {
    const isCompleted = completedQuests.has(check.dataset.quest);
    check.checked = isCompleted;
    check.closest(".quest-item").classList.toggle("completed", isCompleted);
  });

  completedCount.textContent = `${completedQuests.size}/${questChecks.length}`;
}

function saveCompletedQuests() {
  localStorage.setItem("codeAtelierCompletedQuests", JSON.stringify([...completedQuests]));
}

function rebuildQuestAchievementsFromSolved() {
  if (solvedChallenges.size === 0) return;

  completedQuests.add("console");
  solvedChallenges.forEach((challengeId) => {
    const challenge = getChallenge(challengeId);
    if (challenge) {
      completedQuests.add(challenge.stage);
    }
  });

  if (solvedChallenges.size >= 5) {
    completedQuests.add("five");
  }

  if (solvedChallenges.size >= 10) {
    completedQuests.add("ten");
  }
}

function restoreCompletedQuests() {
  const saved = localStorage.getItem("codeAtelierCompletedQuests");
  if (!saved) return;

  try {
    const knownIds = new Set([...questChecks].map((check) => check.dataset.quest));
    completedQuests = new Set(JSON.parse(saved).filter((id) => knownIds.has(id)));
  } catch {
    localStorage.removeItem("codeAtelierCompletedQuests");
  }
}

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTemplate(button.dataset.template);
    document.querySelector("#playground").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

stageButtons.forEach((button) => {
  button.addEventListener("click", () => setStage(button.dataset.stage));
});

challengeGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-challenge]");
  if (!card) return;
  setChallenge(card.dataset.challenge);
});

runButton.addEventListener("click", runCode);
checkButton.addEventListener("click", checkAnswer);
resetButton.addEventListener("click", () => {
  if (currentMode === "challenge") {
    setChallenge(currentChallenge);
  } else {
    setTemplate(currentTemplate);
  }
});
clearButton.addEventListener("click", () => {
  output.textContent = "ここに実行結果が表示されます。";
  lastRunLines = [];
});
hintButton.addEventListener("click", showNextHint);
nextButton.addEventListener("click", goToNextChallenge);

restoreSolvedChallenges();
restoreCompletedQuests();
rebuildQuestAchievementsFromSolved();
renderChallenges();
setChallenge(currentChallenge, { scroll: false });
updateQuestDisplay();
