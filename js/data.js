// ============================
// KANA DATA DEFINITIONS
// ============================

// Row key "n_" used for the standalone "n" kana to avoid conflict with the "n" row
var ITEMS = (function() {
  const ROWS = {
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
    n_: ["n"]
  };
  const HIRA = {
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
    n_: ["ん"]
  };
  const KATA = {
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
    n_: ["ン"]
  };
  const order = ["a","k","s","t","n","h","m","y","r","w","n_"];
  const out = [];
  for (const row of order) {
    const roma = ROWS[row], hira = HIRA[row], kata = KATA[row];
    for (let i = 0; i < roma.length; i++) {
      if (!roma[i]) continue;
      out.push({ romaji: roma[i], hira: hira[i], kata: kata[i] });
    }
  }
  return out;
})(); // 46 base kana
