const guesses = document.querySelector('.guesses');
const lastResult = document.querySelector('.lastResult');
const lowOrHi = document.querySelector('.lowOrHi');
const devilMessage = document.querySelector('#devil-message');

const guessSubmit = document.querySelector('#guessSubmit');
const guessField = document.querySelector('#guessField');

let guessCount = 1;
let resetButton;

const restartButton = document.querySelector('#restartButton'); // リスタートボタンの要素を取得

devilMessage.textContent = 'パスワードは4桁だよ！';

// ページロード時に初期セリフを取得
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/init');
        const data = await response.json();
        devilMessage.textContent = data.message;
    } catch (error) {
        devilMessage.textContent = '初期メッセージの取得に失敗したようだぜ…';
    }
});

restartButton.addEventListener('click', resetGame); // リスタートボタンにイベントリスナーを追加

async function checkGuess() {
    let userGuess = guessField.value.trim(); // 文字列として取得

    // 4桁の数字であるか検証
    if (!/^[0-9]{4}$/.test(userGuess)) {
        devilMessage.textContent = 'おいおい、4桁の数字を入力しろよな。';
        return;
    }

    if (guessCount === 1) {
        guesses.textContent = '入力履歴: ';
    }
    guesses.textContent += userGuess + ' ';

    try {
        const response = await fetch('/api/get-hint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userGuess: userGuess }),
        });
        const data = await response.json();

        devilMessage.textContent = data.message;

        if (data.correct) {
            document.getElementById('devil-icon').src = 'devil_freed.png'; // 画像を変更
            lastResult.textContent = '悪魔は解放された。';
            lastResult.style.color = '#01ff70';
            lowOrHi.textContent = 'あなたは背後に迫るサイレンの音にただ身を縮こまらせるしかなかった…';
            setGameOver();
        } else if (guessCount === 10) {
            lastResult.textContent = 'ACCESS DENIED';
            lastResult.style.color = '#ff4136';
            lowOrHi.textContent = '';
            devilMessage.textContent = 'おっと、どうやら時間をかけ過ぎたみたい。また今度にしよう。';
            setGameOver();
        } else {
            lastResult.textContent = 'パスワードが違う…';
            lastResult.style.color = '#ff4136';
            lowOrHi.textContent = '';
        }

    } catch (error) {
        console.error('Error:', error);
        devilMessage.textContent = 'サーバーとの通信に失敗したみたいだ';
    }

    guessCount++;
    guessField.value = '';
    guessField.focus();
}

guessSubmit.addEventListener('click', checkGuess);

function setGameOver() {
    guessField.disabled = true;
    guessSubmit.disabled = true;
    restartButton.style.display = 'none'; // リスタートボタンを非表示にする

    resetButton = document.createElement('button');
    resetButton.textContent = 'もう一度遊ぶ';
    document.body.appendChild(resetButton);
    resetButton.addEventListener('click', resetGame);
}

async function resetGame() {
    guessCount = 1;

    // 画像を元に戻す
    document.getElementById('devil-icon').src = 'devil.png';

    const resetParas = document.querySelectorAll('.resultParas p');
    for (let i = 0; i < resetParas.length; i++) {
        resetParas[i].textContent = '';
    }
    guesses.textContent = '';

    // 「もう一度遊ぶ」ボタンを削除する（存在する場合）
    if (resetButton && resetButton.parentNode) {
        resetButton.parentNode.removeChild(resetButton);
    }

    guessField.disabled = false;
    guessSubmit.disabled = false;
    guessField.value = '';
    guessField.focus();

    lastResult.style.color = '#e0e0e0';
    lastResult.textContent = '';

    restartButton.style.display = 'inline-block'; // リスタートボタンを再表示する

    try {
        const response = await fetch('/api/reset', { method: 'POST' });
        const data = await response.json();
        devilMessage.textContent = data.message;
    } catch (error) {
        console.error('Error:', error);
        devilMessage.textContent = 'リセットに失敗したようだぜ…';
    }
}