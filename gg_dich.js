// ==UserScript==
// @name         Auto-Typer Toggle (Alt+S / Alt+X)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động gõ phím chuẩn khi gõ bất kỳ phím nào. Bật bằng Alt+S, Tắt bằng Alt+X.
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    let isRunning = false;
    let intervalId = null;

    const KANA_MAP = {
        'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'si','しゅ':'su','しょ':'so',
        'ちゃ':'ti','ちゅ':'tu','ちょ':'to','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
        'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
        'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
        'じゃ':'zi','じゅ':'zu','じょ':'zo','びゃ':'bya','びゅ':'byu','びょ':'byo',
        'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
        'キャ':'kya','キュ':'kyu','キョ':'kyo','シャ':'si','シュ':'su','ショ':'so',
        'チャ':'ti','チュ':'tu','チョ':'to','ニャ':'nya','ニュ':'nyu','ニョ':'nyo',
        'ヒャ':'hya','ヒュ':'hyu','ヒョ':'hyo','ミャ':'mya','ミュ':'myu','ミョ':'myo',
        'リャ':'rya','リュ':'ryu','リョ':'ryo','ギャ':'gya','ギュ':'gyu','ギョ':'gyo',
        'ジャ':'zi','ジュ':'zu','ジョ':'zo','ビャ':'bya','ビュ':'byu','ビョ':'byo',
        'ピャ':'pya','ピュ':'pyu','ピョ':'pyo',
        'あ':'a','い':'i','う':'u','え':'e','お':'o',
        'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
        'さ':'sa','し':'si','す':'su','せ':'se','そ':'so',
        'た':'ta','ち':'ti','つ':'tu','て':'te','と':'to',
        'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
        'は':'ha','ひ':'hi','ふ':'hu','へ':'he','ほ':'ho',
        'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
        'や':'ya','ゆ':'yu','よ':'yo',
        'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
        'わ':'wa','を':'wo','ん':'nn',
        'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
        'ざ':'za','じ':'zi','ず':'zu','ぜ':'ze','ぞ':'zo',
        'だ':'da','ぢ':'di','づ':'du','で':'de','ど':'do',
        'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
        'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
        'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o',
        'カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
        'サ':'sa','シ':'si','ス':'su','セ':'se','ソ':'so',
        'タ':'ta','チ':'ti','ツ':'tu','テ':'te','ト':'to',
        'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no',
        'ハ':'ha','ヒ':'hi','フ':'hu','ヘ':'he','ホ':'ho',
        'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo',
        'ヤ':'ya','ユ':'yu','ヨ':'yo',
        'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro',
        'ワ':'wa','ヲ':'wo','ン':'nn',
        'ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go',
        'ザ':'za','ジ':'zi','ズ':'zu','ゼ':'ze','ゾ':'zo',
        'ダ':'da','ヂ':'di','ヅ':'du','デ':'de','ド':'do',
        'バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo',
        'パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po',
        'ー':'-'
    };

    function parseKanaToRomaji(kanaText) {
        let res = '';
        let i = 0;
        while (i < kanaText.length) {
            if (kanaText[i] === 'っ' || kanaText[i] === 'ッ') {
                if (i + 1 < kanaText.length) {
                    let nextSub = kanaText.substr(i + 1, 2);
                    let nextRom = KANA_MAP[nextSub] || KANA_MAP[kanaText[i + 1]] || '';
                    if (nextRom.length > 0) res += nextRom[0];
                }
                i++;
                continue;
            }
            if (i + 1 < kanaText.length) {
                let pair = kanaText.substr(i, 2);
                if (KANA_MAP[pair]) {
                    res += KANA_MAP[pair];
                    i += 2;
                    continue;
                }
            }
            let single = kanaText[i];
            res += KANA_MAP[single] || single;
            i++;
        }
        return res.toUpperCase();
    }

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
        setTimeout(() => {
            targetDoc.dispatchEvent(new KeyboardEvent('keyup', opts));
        }, 15);
    }

    function handleKeyPress(e) {
        if (!isRunning || !e.isTrusted) return;

        const key = e.key ? e.key.toLowerCase() : '';
        if (key === 'alt' || key === 'control' || key === 'shift' || key === 'f12') return;

        let targetDoc = null;
        let sentenceContainer = document.getElementById('sentenceText');
        let kanaContainer = document.getElementById('kanaText');

        if (sentenceContainer || kanaContainer) {
            targetDoc = document;
        } else {
            const iframes = document.querySelectorAll('iframe');
            for (let f of iframes) {
                try {
                    if (f.contentWindow && f.contentWindow.document) {
                        let doc = f.contentWindow.document;
                        if (doc.getElementById('sentenceText') || doc.getElementById('kanaText')) {
                            targetDoc = doc;
                            sentenceContainer = doc.getElementById('sentenceText');
                            kanaContainer = doc.getElementById('kanaText');
                            break;
                        }
                    }
                } catch(err) {}
            }
        }

        if (!targetDoc || (!sentenceContainer && !kanaContainer)) return;

        let fullText = "";
        if (sentenceContainer && sentenceContainer.textContent.trim().length > 0) {
            fullText = sentenceContainer.textContent.trim().toUpperCase();
        } else if (kanaContainer) {
            fullText = parseKanaToRomaji(kanaContainer.textContent.trim());
        }

        if (!fullText || fullText.length === 0) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        let enteredText = "";
        if (sentenceContainer) {
            const enteredSpans = sentenceContainer.querySelectorAll('span.entered');
            enteredSpans.forEach(span => enteredText += span.textContent);
        }

        if (enteredText.length < fullText.length) {
            const nextCorrectChar = fullText.charAt(enteredText.length);
            dispatchKey(targetDoc, nextCorrectChar);
        }
    }

    function attachListeners() {
        window.removeEventListener('keydown', handleKeyPress, true);
        window.addEventListener('keydown', handleKeyPress, true);

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(f => {
            try {
                if (f.contentWindow && f.contentWindow.document) {
                    f.contentWindow.removeEventListener('keydown', handleKeyPress, true);
                    f.contentWindow.addEventListener('keydown', handleKeyPress, true);
                }
            } catch(e) {}
        });
    }

    function removeListeners() {
        window.removeEventListener('keydown', handleKeyPress, true);
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(f => {
            try {
                if (f.contentWindow && f.contentWindow.document) {
                    f.contentWindow.removeEventListener('keydown', handleKeyPress, true);
                }
            } catch(e) {}
        });
    }

    function startTool() {
        if (isRunning) return;
        isRunning = true;
        attachListeners();

        intervalId = setInterval(() => {
            if (isRunning) attachListeners();
        }, 500);

        console.log("%c⚡ [AUTO-TYPER] ĐÃ BẬT (ALT + S)", "color: #00ff00; font-weight: bold; font-size: 14px;");
    }

    function stopTool() {
        if (!isRunning) return;
        isRunning = false;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        removeListeners();
        console.log("%c🛑 [AUTO-TYPER] ĐÃ TẮT (ALT + X)", "color: #ff0000; font-weight: bold; font-size: 14px;");
    }

    // Lắng nghe phím tắt Alt+S (Bật) và Alt+X (Tắt)
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