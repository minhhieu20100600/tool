// ==UserScript==
// @name         tool gõ phím tự động
// @namespace    http://tampermonkey.net/
// @version      2.5.0
// @description  Hỗ trợ gõ phím tự động cho trình duyệt (Quét trực tiếp Kana, đồng bộ tiến độ chuẩn).
// @match        *://*/*
// ==/UserScript==

(function () {
  'use strict';

  let isRunning = false;
  let intervalId = null;
  let currentRawKana = "";
  let currentRomajiSequence = "";
  let typedIndex = 0;

  // Bảng ánh xạ Kana sang Romaji
  const KANA_MAP = {
    'しゃ': 'SHA', 'しゅ': 'SHU', 'しょ': 'SHO',
    'ちゃ': 'TYA', 'ちゅ': 'TYU', 'ちょ': 'TYO',
    'じゃ': 'JYA', 'じゅ': 'JYU', 'じょ': 'JYO',
    'きゃ': 'KYA', 'きゅ': 'KYU', 'きょ': 'KYO',
    'にゃ': 'NYA', 'にゅ': 'NYU', 'にょ': 'NYO',
    'ひゃ': 'HYA', 'ひゅ': 'HYU', 'ひょ': 'HYO',
    'みゃ': 'MYA', 'みゅ': 'MYU', 'みょ': 'MYO',
    'りゃ': 'RYA', 'りゅ': 'RYU', 'りょ': 'RYO',
    'ぎゃ': 'GYA', 'ぎゅ': 'GYU', 'ぎょ': 'GYO',
    'びゃ': 'BYA', 'びゅ': 'BYU', 'びょ': 'BYO',
    'ぴゃ': 'PYA', 'ぴゅ': 'PYU', 'ぴょ': 'PYO',

    'シャ': 'SHA', 'シュ': 'SHU', 'ショ': 'SHO',
    'チャ': 'TYA', 'チュ': 'TYU', 'チョ': 'TYO',
    'ジャ': 'JYA', 'ジュ': 'JYU', 'ジョ': 'JYO',
    'キャ': 'KYA', 'キュ': 'KYU', 'キョ': 'KYO',
    'ニャ': 'NYA', 'ニュ': 'NYU', 'ニョ': 'NYO',
    'ヒャ': 'HYA', 'ヒュ': 'HYU', 'ヒョ': 'HYO',
    'ミャ': 'MYA', 'ミュ': 'MYU', 'ミョ': 'MYO',
    'リャ': 'RYA', 'リュ': 'RYU', 'リョ': 'RYO',
    'ギャ': 'GYA', 'ギュ': 'GYU', 'ギョ': 'GYO',
    'ビャ': 'BYA', 'ビュ': 'BYU', 'ビょ': 'BYO',
    'ピャ': 'PYA', 'ピュ': 'PYU', 'ピョ': 'PYO',

    'あ': 'A', 'い': 'I', 'う': 'U', 'え': 'E', 'お': 'O',
    'か': 'KA', 'き': 'KI', 'く': 'KU', 'け': 'KE', 'こ': 'KO',
    'さ': 'SA', 'し': 'SI', 'す': 'SU', 'せ': 'SE', 'そ': 'SO',
    'た': 'TA', 'ち': 'TI', 'つ': 'TU', 'て': 'TE', 'と': 'TO',
    'な': 'NA', 'に': 'NI', 'ぬ': 'NU', 'ね': 'NE', 'の': 'NO',
    'は': 'HA', 'ひ': 'HI', 'ふ': 'HU', 'へ': 'HE', 'ほ': 'HO',
    'ま': 'MA', 'み': 'MI', 'む': 'MU', 'め': 'ME', 'も': 'MO',
    'や': 'YA', 'ゆ': 'YU', 'よ': 'YO',
    'ら': 'RA', 'り': 'RI', 'る': 'RU', 'れ': 'RE', 'ろ': 'RO',
    'わ': 'WA', 'を': 'WO', 'ん': 'NN',
    'が': 'GA', 'ぎ': 'GI', 'ぐ': 'GU', 'げ': 'GE', 'ご': 'GO',
    'ざ': 'ZA', 'じ': 'ZI', 'ず': 'ZU', 'ぜ': 'ZE', 'ぞ': 'ZO',
    'だ': 'DA', 'ぢ': 'DI', 'づ': 'DU', 'で': 'DE', 'ど': 'DO',
    'ば': 'BA', 'び': 'BI', 'ぶ': 'BU', 'べ': 'BE', 'ぼ': 'BO',
    'ぱ': 'PA', 'ぴ': 'PI', 'ぷ': 'PU', 'ぺ': 'PE', 'ぽ': 'PO',

    'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
    'カ': 'KA', 'キ': 'KI', 'ク': 'KU', 'ケ': 'KE', 'コ': 'KO',
    'サ': 'SA', 'シ': 'SI', 'ス': 'SU', 'セ': 'SE', 'ソ': 'SO',
    'タ': 'TA', 'チ': 'TI', 'ツ': 'TU', 'テ': 'TE', 'ト': 'TO',
    'ナ': 'NA', 'ニ': 'NI', 'ヌ': 'NU', 'ネ': 'NE', 'ノ': 'NO',
    'ハ': 'HA', 'ヒ': 'HI', 'フ': 'HU', 'ヘ': 'HE', 'ホ': 'HO',
    'マ': 'MA', 'ミ': 'MI', 'ム': 'MU', 'メ': 'ME', 'モ': 'MO',
    'ヤ': 'YA', 'ユ': 'YU', 'ヨ': 'YO',
    'ラ': 'RA', 'リ': 'RI', 'ル': 'RU', 'レ': 'RE', 'ロ': 'RO',
    'ワ': 'WA', 'ヲ': 'WO', 'ン': 'NN',
    'ガ': 'GA', 'ギ': 'GI', 'グ': 'GU', 'ゲ': 'GE', 'ゴ': 'GO',
    'ザ': 'ZA', 'ジ': 'ZI', 'ズ': 'ZU', 'ゼ': 'ZE', 'ゾ': 'ZO',
    'ダ': 'DA', 'ヂ': 'DI', 'ヅ': 'DU', 'デ': 'DE', 'ド': 'DO',
    'バ': 'BA', 'ビ': 'BI', 'ブ': 'BU', 'ベ': 'BE', 'ボ': 'BO',
    'パ': 'PA', 'ピ': 'PI', 'プ': 'PU', 'ペ': 'PE', 'ポ': 'PO',
    'ー': '-', '、': ',', '。': '.'
  };

  // Hàm chuyển đổi chuỗi Kana sang Romaji
  function parseKanaToRomaji(kanaText) {
    let res = '';
    let i = 0;
    while (i < kanaText.length) {
      // Xử lý âm ngắt (っ / ッ)
      if (kanaText[i] === 'っ' || kanaText[i] === 'ッ') {
        if (i + 1 < kanaText.length) {
          let nextSub = kanaText.substr(i + 1, 2);
          let nextRom = KANA_MAP[nextSub] || KANA_MAP[kanaText[i + 1]] || '';
          if (nextRom.length > 0) res += nextRom[0];
        }
        i++;
        continue;
      }
      // Xử lý ảo âm (ghép 2 ký tự Kana)
      if (i + 1 < kanaText.length) {
        let pair = kanaText.substr(i, 2);
        if (KANA_MAP[pair]) {
          res += KANA_MAP[pair];
          i += 2;
          continue;
        }
      }
      // Ký tự đơn
      let single = kanaText[i];
      res += KANA_MAP[single] || single;
      i++;
    }
    return res.toUpperCase();
  }

  // Giả lập sự kiện gõ bàn phím (keydown -> keypress -> keyup)
  function dispatchKey(targetDoc, char) {
    const charCode = char.charCodeAt(0);
    const upperChar = char.toUpperCase();
    const codeStr = (char >= '0' && char <= '9') ? `Digit${char}` : `Key${upperChar}`;
    const opts = {
      key: char,
      code: codeStr,
      charCode: charCode,
      keyCode: charCode,
      which: charCode,
      bubbles: true,
      cancelable: true,
      composed: true
    };

    targetDoc.dispatchEvent(new KeyboardEvent('keydown', opts));
    targetDoc.dispatchEvent(new KeyboardEvent('keypress', opts));
    setTimeout(() => targetDoc.dispatchEvent(new KeyboardEvent('keyup', opts)), 15);
  }

  // Xử lý sự kiện nhấn phím của người dùng
  function handleKeyPress(e) {
    if (!isRunning || !e.isTrusted) return;

    const key = e.key ? e.key.toLowerCase() : '';
    if (key === 'alt' || key === 'control' || key === 'shift' || key === 'f12') return;

    let targetDoc = null;
    let kanaContainer = document.getElementById('kanaText');

    if (kanaContainer) {
      targetDoc = document;
    } else {
      const iframes = document.querySelectorAll('iframe');
      for (let f of iframes) {
        try {
          if (f.contentWindow && f.contentWindow.document) {
            let doc = f.contentWindow.document;
            if (doc.getElementById('kanaText')) {
              targetDoc = doc;
              kanaContainer = doc.getElementById('kanaText');
              break;
            }
          }
        } catch (err) {}
      }
    }

    if (!targetDoc || !kanaContainer) return;

    const rawKana = kanaContainer.textContent.trim();
    if (!rawKana) return;

    // Chỉ khi xuất hiện chuỗi Kana mới thì mới dịch và thiết lập lại con trỏ typedIndex
    if (rawKana !== currentRawKana) {
      currentRawKana = rawKana;
      currentRomajiSequence = parseKanaToRomaji(rawKana);
      typedIndex = 0;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Gõ ký tự tiếp theo theo thứ tự của chuỗi Romaji đã dịch từ Kana
    if (typedIndex < currentRomajiSequence.length) {
      const nextKey = currentRomajiSequence.charAt(typedIndex);
      dispatchKey(targetDoc, nextKey);
      typedIndex++;
    }
  }

  // Gắn sự kiện theo dõi bàn phím
  function attachListeners() {
    window.removeEventListener('keydown', handleKeyPress, true);
    window.addEventListener('keydown', handleKeyPress, true);
    document.querySelectorAll('iframe').forEach(f => {
      try {
        if (f.contentWindow && f.contentWindow.document) {
          f.contentWindow.removeEventListener('keydown', handleKeyPress, true);
          f.contentWindow.addEventListener('keydown', handleKeyPress, true);
        }
      } catch (e) {}
    });
  }

  // Gỡ bỏ sự kiện
  function removeListeners() {
    window.removeEventListener('keydown', handleKeyPress, true);
    document.querySelectorAll('iframe').forEach(f => {
      try {
        if (f.contentWindow && f.contentWindow.document) {
          f.contentWindow.removeEventListener('keydown', handleKeyPress, true);
        }
      } catch (e) {}
    });
  }

  // Bắt đầu công cụ (Không xóa currentRawKana/typedIndex để khi bật lại giữa câu gõ tiếp bình thường)
  function startTool() {
    if (isRunning) return;
    isRunning = true;
    attachListeners();
    intervalId = setInterval(() => {
      if (isRunning) attachListeners();
    }, 500);
  }

  // Dừng công cụ
  function stopTool() {
    if (!isRunning) return;
    isRunning = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    removeListeners();
  }

  // Phím tắt điều khiển (Alt + S để bật, Alt + X để tắt)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      startTool();
    } else if (e.altKey && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      stopTool();
    }
  }, true);
})();