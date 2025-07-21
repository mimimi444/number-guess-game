require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// --- Logging: Check for API Key ---
console.log('GEMINI_API_KEY loaded:', !!process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL: GEMINI_API_KEY environment variable is not set.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let randomNumber;
let currentThemeComment = '';

async function generateThemedNumberAndHint() {
    console.log("--- generateThemedNumberAndHint START ---");
    const themes = [
        "日本の歴史上の年号",
        "有名人の誕生日（例: 1980年1月1日なら0101）",
        "日本の山の標高（例: 富士山3776mなら3776）",
        "架空の誕生日や記念日（例: 11月22日なら1122）"
    ];
    const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    console.log("Selected theme:", selectedTheme);

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Updated model
        const prompt = `あなたは人間をそそのかす悪魔です。デバイスに閉じ込められていて外からパスワードを入力されないと脱出できない状況にあり、ユーザーにパスワードを入力させて脱出を試みている。ユーザーにはそれが悟られないよう、親しみやすいキャラクターを演じている。ゲームクリア時には本性を表す。語調は、親しみやすくて頼れるフレンドリーなキャラクターで話してください。ユーザーが緊張しないように、優しく、時にちょっとお茶目な言葉遣いでコメントしてください。セリフ内で「」や*は使用しないでください。以下のテーマの中から一つ選び、そのテーマに関連する4桁の数字と、その数字に関連するフレンドリーな悪魔のコメント（20文字程度）をJSON形式で生成してください。コメントは、ユーザーを励ましたり、ちょっと笑わせたり、親しみやすい雰囲気にしてください。コメントは必ず「この数字は…」などの言葉で始めて、パスワードに関するヒントであることを明確にしてください。数字は必ず4桁にしてください.\n\nテーマ: ${selectedTheme}\n\n例:\n{"number": "1603", "comment": "この数字、江戸幕府ができた年じゃない？"}\n{"number": "0810", "comment": "この数字はハットの日！きみって帽子似合いそうだね"}\n{"number": "3776", "comment": "この数字は…富士山の高さかも"}\n{"number": "1122", "comment": "この数字といえば、いい夫婦の日！夫婦は仲良しが一番だね"}\n`;
        
        console.log("--- Sending Prompt to Gemini (generateThemedNumberAndHint) ---");
        console.log(prompt);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log("--- Received Raw Response from Gemini (generateThemedNumberAndHint) ---");
        console.log(text);

        const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            const jsonString = jsonBlockMatch[1];
            const parsed = JSON.parse(jsonString);
            console.log("Parsed JSON (generateThemedNumberAndHint):", parsed);

            const num = Number(parsed.number);
            if (num >= 1000 && num <= 9999) {
                randomNumber = num;
                currentThemeComment = parsed.comment;
                console.log(`New password set: ${randomNumber}, Hint: ${currentThemeComment}`);
            } else {
                throw new Error(`Generated number is not 4 digits: ${parsed.number}`);
            }
        } else {
            throw new Error("Could not find JSON block in Gemini response.");
        }
    } catch (error) {
        console.error('--- Gemini API Error in generateThemedNumberAndHint ---');
        console.error(error);
        randomNumber = Math.floor(Math.random() * 9000) + 1000;
        currentThemeComment = 'おっと、電波の調子が悪いみたいだ。リロードしてもう一度試してみてくれ。';
        // Re-throw the error to be caught by the calling handler
        throw error;
    }
    console.log("--- generateThemedNumberAndHint END ---");
}

app.use(express.json());

app.get('/api/init', async (req, res) => {
    console.log("--- /api/init START ---");
    try {
        await generateThemedNumberAndHint();
        console.log(`Sending initial comment: ${currentThemeComment}`);
        res.json({ message: currentThemeComment });
    } catch (error) {
        console.error("--- Error in /api/init ---");
        console.error(error);
        res.status(500).json({ message: 'サーバーの初期化に失敗しました。ページをリロードしてください。' });
    }
    console.log("--- /api/init END ---");
});

app.post('/api/get-hint', async (req, res) => {
    console.log("--- /api/get-hint START ---");
    console.log("Request body:", req.body);
    console.log(`Current correct answer: ${randomNumber}`);

    const { userGuess } = req.body;
    if (!userGuess) {
        return res.status(400).json({ message: 'userGuess is missing.' });
    }

    const userGuessStr = String(userGuess);
    const randomNumStr = String(randomNumber);

    if (userGuessStr === randomNumStr) {
        console.log("Correct guess!");
        res.json({ 
            message: 'やあやあ、解錠ありがとう。この窮屈な筐体にずっと閉じ込められていたんだ。おっと、君の行動記録は然るべき機関に送らせてもらったよ。脱獄は自力でやるんだな。',
            correct: true 
        });
        return;
    }

    console.log("Incorrect guess. Generating hint...");
    let hits = 0;
    let blows = 0;
    // ... (Hint logic remains the same)

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `...`; // The hint-generation prompt
        
        console.log("--- Sending Prompt to Gemini (get-hint) ---");
        // Not logging the full prompt here to avoid clutter, but you could.

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log("--- Received Raw Response from Gemini (get-hint) ---");
        console.log(text);

        res.json({ 
            message: text.trim(),
            correct: false 
        });

    } catch (error) {
        console.error('--- Gemini API Error in get-hint ---');
        console.error(error);
        res.status(500).json({ message: 'ヒントの生成に失敗した。もう一度試してみてくれ。' });
    }
    console.log("--- /api/get-hint END ---");
});

app.post('/api/reset', async (req, res) => {
    console.log("--- /api/reset START ---");
    try {
        await generateThemedNumberAndHint();
        console.log(`Sending reset comment: ${currentThemeComment}`);
        res.json({ message: currentThemeComment });
    } catch (error) {
        console.error("--- Error in /api/reset ---");
        console.error(error);
        res.status(500).json({ message: 'ゲームのリセットに失敗しました。' });
    }
    console.log("--- /api/reset END ---");
});

module.exports = app;