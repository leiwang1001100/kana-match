// ============================
// KANA DATA DEFINITIONS
// ============================
var ROWS = {
  a:  ["a","i","u","e","o"],
  k:  ["ka","ki","ku","ke","ko"],
  s:  ["sa","shi","su","se","so"],
  t:  ["ta","chi","tsu","te","to"],
  n:  ["na","ni","nu","ne","no"],
  h:  ["ha","hi","fu","he","ho"],
  m:  ["ma","mi","mu","me","mo"],
  y:  ["ya",null,"yu",null,"yo"],
  r:  ["ra","ri","ru","re","ro"],
  w:  ["wa",null,null,null,"wo"],
  nn: ["n"]
};

var HIRA = {
  a:  ["あ","い","う","え","お"],
  k:  ["か","き","く","け","こ"],
  s:  ["さ","し","す","せ","そ"],
  t:  ["た","ち","つ","て","と"],
  n:  ["な","に","ぬ","ね","の"],
  h:  ["は","ひ","ふ","へ","ほ"],
  m:  ["ま","み","む","め","も"],
  y:  ["や",null,"ゆ",null,"よ"],
  r:  ["ら","り","る","れ","ろ"],
  w:  ["わ",null,null,null,"を"],
  nn: ["ん"]
};

var KATA = {
  a:  ["ア","イ","ウ","エ","オ"],
  k:  ["カ","キ","ク","ケ","コ"],
  s:  ["サ","シ","ス","セ","ソ"],
  t:  ["タ","チ","ツ","テ","ト"],
  n:  ["ナ","ニ","ヌ","ネ","ノ"],
  h:  ["ハ","ヒ","フ","ヘ","ホ"],
  m:  ["マ","ミ","ム","メ","モ"],
  y:  ["ヤ",null,"ユ",null,"ヨ"],
  r:  ["ラ","リ","ル","レ","ロ"],
  w:  ["ワ",null,null,null,"ヲ"],
  nn: ["ン"]
};

function buildItems() {
  const out = [];
  const order = ["a","k","s","t","n","h","m","y","r","w","nn"];
  for (const row of order) {
    const roma = ROWS[row], hira = HIRA[row], kata = KATA[row];
    for (let i = 0; i < roma.length; i++) {
      const r = roma[i];
      if (!r) continue;
      out.push({ romaji: r, hira: (hira || [])[i], kata: (kata || [])[i] });
    }
  }
  return out;
}

var ITEMS = buildItems(); // 46 base kana
