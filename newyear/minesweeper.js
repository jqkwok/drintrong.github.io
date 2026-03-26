// 扫雷游戏主逻辑
class Minesweeper {
    constructor() {
        // 游戏配置
        this.config = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 },
            custom: { rows: 16, cols: 16, mines: 40 }
        };

        // 当前游戏状态
        this.currentLevel = 'beginner';
        this.rows = this.config.beginner.rows;
        this.cols = this.config.beginner.cols;
        this.mines = this.config.beginner.mines;
        this.board = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedTime = 0;
        this.revealedCount = 0;
        this.flaggedCount = 0;

        // DOM元素
        this.elements = {
            gameBoard: document.getElementById('gameBoard'),
            mineCount: document.getElementById('mineCount'),
            timer: document.getElementById('timer'),
            flaggedCount: document.getElementById('flaggedCount'),
            revealedCount: document.getElementById('revealedCount'),
            statusMessage: document.querySelector('.status-message span'),
            statusIcon: document.querySelector('.status-message i'),
            newGameBtn: document.getElementById('newGame'),
            changeDifficultyBtn: document.getElementById('changeDifficulty'),
            helpBtn: document.getElementById('helpBtn'),
            difficultySelector: document.getElementById('difficultySelector'),
            customSettings: document.getElementById('customSettings'),
            applyCustomBtn: document.getElementById('applyCustom'),
            difficultyBtns: document.querySelectorAll('.difficulty-btn')
        };

        // 音频元素
        this.sounds = {
            click: document.getElementById('clickSound'),
            flag: document.getElementById('flagSound'),
            mine: document.getElementById('mineSound'),
            win: document.getElementById('winSound')
        };

        // 初始化
        this.init();
    }

    init() {
        this.createBoard();
        this.renderBoard();
        this.updateDisplay();
        this.setupEventListeners();
        this.updateStatus('ready', '点击格子开始游戏！');
    }

    createBoard() {
        // 创建空棋盘
        this.board = [];
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }

    placeMines(firstRow, firstCol) {
        // 确保第一次点击不是地雷
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            // 确保不是第一次点击的格子，也不是地雷
            if ((r !== firstRow || c !== firstCol) && !this.board[r][c].isMine) {
                this.board[r][c].isMine = true;
                minesPlaced++;

                // 更新周围格子的计数
                this.updateNeighborCounts(r, c);
            }
        }
    }

    updateNeighborCounts(row, col) {
        // 更新周围8个格子的地雷计数
        for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++) {
                if (!(r === row && c === col)) {
                    this.board[r][c].neighborMines++;
                }
            }
        }
    }

    renderBoard() {
        // 清空游戏板
        this.elements.gameBoard.innerHTML = '';

        // 设置网格布局
        this.elements.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 35px)`;
        this.elements.gameBoard.style.gridTemplateRows = `repeat(${this.rows}, 35px)`;

        // 创建格子
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                // 添加点击事件
                cell.addEventListener('click', (e) => this.handleCellClick(e, r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(r, c);
                });

                this.elements.gameBoard.appendChild(cell);
            }
        }
    }

    handleCellClick(e, row, col) {
        if (this.gameOver || this.gameWon || this.board[row][col].isFlagged) {
            return;
        }

        // 播放点击音效
        this.playSound('click');

        if (this.firstClick) {
            this.firstClick = false;
            this.startTimer();
            this.placeMines(row, col);
            this.updateStatus('playing', '游戏进行中...');
        }

        this.revealCell(row, col);

        // 检查游戏是否胜利
        this.checkWin();
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.gameWon || this.board[row][col].isRevealed) {
            return;
        }

        const cell = this.board[row][col];
        const cellElement = this.getCellElement(row, col);

        if (!cell.isFlagged && this.flaggedCount < this.mines) {
            // 标记旗帜
            cell.isFlagged = true;
            this.flaggedCount++;
            cellElement.classList.add('flagged');
            this.playSound('flag');
        } else if (cell.isFlagged) {
            // 取消标记
            cell.isFlagged = false;
            this.flaggedCount--;
            cellElement.classList.remove('flagged');
        }

        this.updateDisplay();
    }

    revealCell(row, col) {
        const cell = this.board[row][col];

        if (cell.isRevealed || cell.isFlagged) {
            return;
        }

        cell.isRevealed = true;
        this.revealedCount++;

        const cellElement = this.getCellElement(row, col);
        cellElement.classList.add('revealed');

        if (cell.isMine) {
            // 踩到地雷
            cellElement.classList.add('mine');
            cellElement.innerHTML = '💣';
            this.gameOver = true;
            this.endGame(false);
            this.playSound('mine');
            this.revealAllMines();
            return;
        }

        // 显示数字或空白
        if (cell.neighborMines > 0) {
            cellElement.textContent = cell.neighborMines;
            cellElement.classList.add(`num-${cell.neighborMines}`);
        } else {
            // 如果是空白格子，递归翻开周围的格子
            this.revealNeighbors(row, col);
        }

        this.updateDisplay();
    }

    revealNeighbors(row, col) {
        for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++) {
                if (!(r === row && c === col) && !this.board[r][c].isRevealed) {
                    this.revealCell(r, c);
                }
            }
        }
    }

    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (cell.isMine && !cell.isFlagged) {
                    const cellElement = this.getCellElement(r, c);
                    cellElement.classList.add('revealed', 'mine');
                    cellElement.innerHTML = '💣';
                } else if (!cell.isMine && cell.isFlagged) {
                    // 错误标记的格子
                    const cellElement = this.getCellElement(r, c);
                    cellElement.classList.add('revealed');
                    cellElement.innerHTML = '❌';
                    cellElement.style.color = '#ff4757';
                }
            }
        }
    }

    checkWin() {
        const totalCells = this.rows * this.cols;
        const safeCells = totalCells - this.mines;

        if (this.revealedCount === safeCells) {
            this.gameWon = true;
            this.endGame(true);
            this.playSound('win');
        }
    }

    endGame(isWin) {
        this.stopTimer();

        if (isWin) {
            this.updateStatus('win', '恭喜！你赢了！');
            this.elements.statusIcon.className = 'fas fa-trophy';
            this.elements.statusIcon.style.color = '#ffd700';

            // 标记所有剩余的地雷
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const cell = this.board[r][c];
                    if (cell.isMine && !cell.isFlagged) {
                        cell.isFlagged = true;
                        this.flaggedCount++;
                        const cellElement = this.getCellElement(r, c);
                        cellElement.classList.add('flagged');
                    }
                }
            }
        } else {
            this.updateStatus('lose', '游戏结束！你踩到地雷了！');
            this.elements.statusIcon.className = 'fas fa-skull-crossbones';
            this.elements.statusIcon.style.color = '#ff4757';
        }

        this.updateDisplay();
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.elements.timer.textContent = this.elapsedTime.toString().padStart(3, '0');
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetGame() {
        this.stopTimer();
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.elapsedTime = 0;
        this.revealedCount = 0;
        this.flaggedCount = 0;

        this.createBoard();
        this.renderBoard();
        this.updateDisplay();
        this.updateStatus('ready', '点击格子开始游戏！');

        // 重置状态图标
        this.elements.statusIcon.className = 'fas fa-flag';
        this.elements.statusIcon.style.color = '#2ed573';
    }

    changeDifficulty(level) {
        this.currentLevel = level;

        if (level === 'custom') {
            this.showCustomSettings();
            return;
        }

        const config = this.config[level];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;

        this.resetGame();
        this.hideCustomSettings();
        this.updateDifficultyButtons(level);
    }

    applyCustomSettings() {
        const rows = parseInt(document.getElementById('customRows').value);
        const cols = parseInt(document.getElementById('customCols').value);
        const mines = parseInt(document.getElementById('customMines').value);

        // 验证输入
        if (rows < 5 || rows > 30 || cols < 5 || cols > 30 || mines < 1 || mines > rows * cols - 1) {
            alert('请输入有效的设置！\n行数和列数: 5-30\n地雷数: 1-(行×列-1)');
            return;
        }

        this.rows = rows;
        this.cols = cols;
        this.mines = mines;

        this.config.custom = { rows, cols, mines };
        this.resetGame();
        this.hideCustomSettings();
        this.updateDifficultyButtons('custom');
    }

    showCustomSettings() {
        this.elements.customSettings.style.display = 'block';
        this.elements.difficultySelector.style.marginBottom = '0';
    }

    hideCustomSettings() {
        this.elements.customSettings.style.display = 'none';
        this.elements.difficultySelector.style.marginBottom = '2rem';
    }

    updateDifficultyButtons(activeLevel) {
        this.elements.difficultyBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.level === activeLevel) {
                btn.classList.add('active');
            }
        });
    }

    updateDisplay() {
        this.elements.mineCount.textContent = (this.mines - this.flaggedCount).toString().padStart(3, '0');
        this.elements.flaggedCount.textContent = this.flaggedCount;
        this.elements.revealedCount.textContent = this.revealedCount;

        if (!this.firstClick && !this.gameOver && !this.gameWon) {
            this.elements.timer.textContent = this.elapsedTime.toString().padStart(3, '0');
        }
    }

    updateStatus(type, message) {
        this.elements.statusMessage.textContent = message;
    }

    getCellElement(row, col) {
        return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('音频播放失败:', e));
        }
    }

    setupEventListeners() {
        // 新游戏按钮
        this.elements.newGameBtn.addEventListener('click', () => {
            this.resetGame();
            this.playSound('click');
        });

        // 难度切换按钮
        this.elements.changeDifficultyBtn.addEventListener('click', () => {
            this.elements.difficultySelector.style.display =
                this.elements.difficultySelector.style.display === 'none' ? 'block' : 'none';
            this.playSound('click');
        });

        // 帮助按钮
        this.elements.helpBtn.addEventListener('click', () => {
            alert('扫雷游戏规则：\n\n' +
                '1. 左键点击翻开格子\n' +
                '2. 右键点击标记/取消标记地雷\n' +
                '3. 数字表示周围8个格子中的地雷数量\n' +
                '4. 避开所有地雷即可获胜\n' +
                '5. 标记所有地雷并翻开所有安全格子即获胜');
            this.playSound('click');
        });

        // 难度选择按钮
        this.elements.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.level;
                this.changeDifficulty(level);
                this.playSound('click');
            });
        });

        // 自定义设置应用按钮
        this.elements.applyCustomBtn.addEventListener('click', () => {
            this.applyCustomSettings();
            this.playSound('click');
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    this.resetGame();
                    break;
                case 'F1':
                    e.preventDefault();
                    this.elements.helpBtn.click();
                    break;
                case 'Escape':
                    this.elements.difficultySelector.style.display = 'none';
                    this.hideCustomSettings();
                    break;
            }
        });

        // 响应式调整
        window.addEventListener('resize', () => {
            this.adjustCellSize();
        });
    }

    adjustCellSize() {
        const cellSize = window.innerWidth < 768 ?
            (window.innerWidth < 480 ? 25 : 30) : 35;

        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
        });

        this.elements.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize}px)`;
        this.elements.gameBoard.style.gridTemplateRows = `repeat(${this.rows}, ${cellSize}px)`;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new Minesweeper();
    const twentyFourGame = new TwentyFourGame();

    // 输出欢迎信息
    console.log('%c💣 Windows经典挖地雷游戏已加载！ 💣',
        'color: #70a1ff; font-size: 16px; font-weight: bold;');
    console.log('%c快捷键: 空格键 - 新游戏 | F1 - 帮助 | ESC - 返回',
        'color: #2ed573;');
    console.log('%c🧮 算24点游戏已加载！ 🧮',
        'color: #2ed573; font-size: 16px; font-weight: bold;');
});

// 24点游戏逻辑
class TwentyFourGame {
    constructor() {
        // 游戏状态
        this.cards = [];
        this.selectedCards = [];
        this.expression = '';
        this.score = 0;
        this.round = 1;
        this.timeLeft = 60;
        this.timerInterval = null;
        this.hasWon = false;

        // DOM元素
        this.elements = {
            cardsContainer: document.getElementById('cardsContainer'),
            expressionDisplay: document.getElementById('expressionDisplay'),
            scoreDisplay: document.getElementById('score'),
            roundDisplay: document.getElementById('round'),
            countdownDisplay: document.getElementById('countdown'),
            historyList: document.getElementById('historyList'),
            statusMessage: document.querySelector('#twentyfourStatus .status-message span'),
            statusIcon: document.querySelector('#twentyfourStatus .status-message i')
        };

        // 音频元素
        this.sounds = {
            card: document.getElementById('cardSound'),
            correct: document.getElementById('correctSound'),
            wrong: document.getElementById('wrongSound')
        };

        this.init();
    }

    init() {
        // Tab 切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;

                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`${tab}-content`).classList.add('active');

                if (tab === 'twentyfour') {
                    this.startGame();
                } else {
                    this.stopTimer();
                }
            });
        });

        // 重新发牌按钮
        document.getElementById('newGame24').addEventListener('click', () => {
            this.newRound();
        });

        // 提示按钮
        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        // 运算符按钮
        document.querySelectorAll('.op-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const op = btn.dataset.op;
                this.addToExpression(op);
            });
        });

        // 清空按钮
        document.getElementById('clearExpr').addEventListener('click', () => {
            this.clearExpression();
        });

        // 提交按钮
        document.getElementById('submitExpr').addEventListener('click', () => {
            this.submitAnswer();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            const activeTab = document.querySelector('.tab-content.active').id;
            if (activeTab !== 'twentyfour-content') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.newRound();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.submitAnswer();
                    break;
                case 'Escape':
                    this.clearExpression();
                    break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    if (this.selectedCards.length < 4) {
                        this.addToExpression(e.key);
                    }
                    break;
                case '+':
                case '-':
                    this.addToExpression(e.key);
                    break;
                case '*':
                    this.addToExpression('×');
                    break;
                case '/':
                    this.addToExpression('÷');
                    break;
                case '(':
                case ')':
                    this.addToExpression(e.key);
                    break;
                case 'Backspace':
                    this.clearExpression();
                    break;
            }
        });
    }

    startGame() {
        this.newRound();
    }

    newRound() {
        this.stopTimer();
        this.cards = this.generateCards();
        this.selectedCards = [];
        this.expression = '';
        this.hasWon = false;
        this.timeLeft = 60;

        this.renderCards();
        this.clearExpression();
        this.updateStatus('点击上方扑克牌开始计算', 'fa-cards');
        this.startTimer();
    }

    generateCards() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        const cards = [];
        const usedIndices = new Set();

        while (cards.length < 4) {
            const suitIndex = Math.floor(Math.random() * suits.length);
            const valueIndex = Math.floor(Math.random() * values.length);
            const key = `${suitIndex}-${valueIndex}`;

            if (!usedIndices.has(key)) {
                usedIndices.add(key);
                cards.push({
                    suit: suits[suitIndex],
                    value: values[valueIndex],
                    numericValue: this.getNumericValue(values[valueIndex]),
                    isRed: suits[suitIndex] === '♥' || suits[suitIndex] === '♦'
                });
            }
        }

        return cards;
    }

    getNumericValue(value) {
        if (value === 'A') return 1;
        if (value === 'J') return 11;
        if (value === 'Q') return 12;
        if (value === 'K') return 13;
        return parseInt(value);
    }

    renderCards() {
        this.elements.cardsContainer.innerHTML = '';

        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = `playing-card ${card.isRed ? 'red' : 'black'}`;
            cardEl.dataset.index = index;

            cardEl.innerHTML = `
                <span class="suit top">${card.suit}</span>
                <span class="value">${card.value}</span>
                <span class="suit bottom">${card.suit}</span>
            `;

            cardEl.addEventListener('click', () => {
                this.selectCard(index);
            });

            this.elements.cardsContainer.appendChild(cardEl);
        });
    }

    selectCard(index) {
        if (this.hasWon) return;

        const cardEl = this.elements.cardsContainer.children[index];
        const cardValue = this.cards[index].numericValue;

        const existingIndex = this.selectedCards.findIndex(c => c.index === index);

        if (existingIndex !== -1) {
            // 取消选择
            this.selectedCards.splice(existingIndex, 1);
            cardEl.classList.remove('selected');
            this.expression = this.expression.replace(new RegExp(`${cardValue}$`), '');
        } else {
            if (this.selectedCards.length < 4) {
                this.selectedCards.push({ index, value: cardValue });
                cardEl.classList.add('selected');
                this.expression += cardValue;
            }
        }

        this.updateExpressionDisplay();
    }

    addToExpression(symbol) {
        if (this.hasWon) return;

        // 将符号转换为可显示的形式
        const displaySymbol = symbol === '*' ? '×' :
                             symbol === '/' ? '÷' : symbol;

        this.expression += displaySymbol;
        this.updateExpressionDisplay();
        this.playSound('card');
    }

    clearExpression() {
        if (this.hasWon) return;

        // 重新根据选中的牌构建表达式
        this.expression = this.selectedCards.map(c => c.value).join('');
        this.updateExpressionDisplay();
    }

    updateExpressionDisplay() {
        this.elements.expressionDisplay.textContent = this.expression || '点击上方扑克牌开始计算';
    }

    submitAnswer() {
        if (this.hasWon || !this.expression) return;

        try {
            // 转换表达式
            let expr = this.expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/');

            // 计算结果
            const result = eval(expr);

            // 添加到历史记录
            this.addHistory(`${this.expression} = ${result}`,
                Math.abs(result - 24) < 0.001);

            if (Math.abs(result - 24) < 0.001) {
                this.handleWin();
            } else {
                this.handleFail();
            }
        } catch (e) {
            this.addHistory(`无效表达式: ${this.expression}`, false);
            this.handleFail();
        }
    }

    handleWin() {
        this.hasWon = true;
        this.score += this.timeLeft; // 剩余时间作为奖励
        this.stopTimer();
        this.playSound('correct');

        this.elements.scoreDisplay.textContent = this.score;
        this.updateStatus('恭喜！算出了24点！', 'fa-check-circle');

        this.showResult(true);
    }

    handleFail() {
        this.playSound('wrong');
        this.updateStatus('答案不正确，再试试吧！', 'fa-times-circle');
    }

    addHistory(text, isSuccess) {
        const item = document.createElement('div');
        item.className = `history-item ${isSuccess ? 'success' : 'error'}`;
        item.textContent = text;

        this.elements.historyList.insertBefore(item, this.elements.historyList.firstChild);

        // 限制历史记录数量
        while (this.elements.historyList.children.length > 20) {
            this.elements.historyList.removeChild(this.elements.historyList.lastChild);
        }
    }

    updateStatus(message, icon) {
        this.elements.statusMessage.textContent = message;
        this.elements.statusIcon.className = `fas ${icon}`;
    }

    startTimer() {
        this.elements.countdownDisplay.textContent = this.timeLeft;

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.elements.countdownDisplay.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    handleTimeout() {
        this.stopTimer();
        this.hasWon = true;
        this.playSound('wrong');

        this.updateStatus('时间到！挑战失败！', 'fa-times-circle');

        // 显示正确答案
        const solution = this.findSolution();
        if (solution) {
            this.showHint(solution);
        }

        setTimeout(() => {
            this.showResult(false);
        }, 2000);
    }

    findSolution() {
        const nums = this.cards.map(c => c.numericValue);
        const operators = ['+', '-', '*', '/'];

        // 尝试所有可能的排列
        const permutations = this.getPermutations(nums);

        for (const perm of permutations) {
            // 尝试所有运算符组合
            for (const op1 of operators) {
                for (const op2 of operators) {
                    for (const op3 of operators) {
                        // ((a op1 b) op2 c) op3 d
                        let expr1 = `(${perm[0]}${op1}${perm[1]})${op2}${perm[2]}${op3}${perm[3]}`;
                        try {
                            if (Math.abs(eval(expr1) - 24) < 0.001) {
                                return expr1.replace(/\*/g, '×').replace(/\//g, '÷');
                            }
                        } catch (e) {}

                        // (a op1 (b op2 c)) op3 d
                        let expr2 = `(${perm[0]}${op1}(${perm[2]}${op2}${perm[3]}))${op3}${perm[3]}`;
                        try {
                            if (Math.abs(eval(expr2) - 24) < 0.001) {
                                return expr2.replace(/\*/g, '×').replace(/\//g, '÷');
                            }
                        } catch (e) {}

                        // a op1 ((b op2 c) op3 d)
                        let expr3 = `${perm[0]}${op1}((${perm[1]}${op2}${perm[2]})${op3}${perm[3]})`;
                        try {
                            if (Math.abs(eval(expr3) - 24) < 0.001) {
                                return expr3.replace(/\*/g, '×').replace(/\//g, '÷');
                            }
                        } catch (e) {}

                        // a op1 (b op2 (c op3 d))
                        let expr4 = `${perm[0]}${op1}(${perm[1]}${op2}(${perm[2]}${op3}${perm[3]}))`;
                        try {
                            if (Math.abs(eval(expr4) - 24) < 0.001) {
                                return expr4.replace(/\*/g, '×').replace(/\//g, '÷');
                            }
                        } catch (e) {}

                        // (a op1 b) op2 (c op3 d)
                        let expr5 = `(${perm[0]}${op1}${perm[1]})${op2}(${perm[2]}${op3}${perm[3]})`;
                        try {
                            if (Math.abs(eval(expr5) - 24) < 0.001) {
                                return expr5.replace(/\*/g, '×').replace(/\//g, '÷');
                            }
                        } catch (e) {}
                    }
                }
            }
        }

        return null;
    }

    getPermutations(arr) {
        if (arr.length <= 1) return [arr];

        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
            const remainingPerms = this.getPermutations(remaining);

            for (const perm of remainingPerms) {
                result.push([current].concat(perm));
            }
        }

        return result;
    }

    showHint(solution = null) {
        if (!solution) {
            solution = this.findSolution();
        }

        if (!solution) {
            alert('这副牌无解！点击重新发牌试试。');
            return;
        }

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'hintOverlay';

        // 创建提示弹窗
        const popup = document.createElement('div');
        popup.className = 'hint-popup';
        popup.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> 提示</h3>
            <p>${solution}</p>
            <button class="close-hint">知道了</button>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        popup.querySelector('.close-hint').addEventListener('click', () => {
            overlay.remove();
            popup.remove();
        });

        overlay.addEventListener('click', () => {
            overlay.remove();
            popup.remove();
        });
    }

    showResult(success) {
        // 移除旧的弹窗
        const existingOverlay = document.querySelector('.overlay');
        const existingPopup = document.querySelector('.result-popup');
        if (existingOverlay) existingOverlay.remove();
        if (existingPopup) existingPopup.remove();

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        // 创建结果弹窗
        const popup = document.createElement('div');
        popup.className = `result-popup ${success ? 'success' : 'fail'}`;

        if (success) {
            popup.innerHTML = `
                <h2><i class="fas fa-trophy"></i> 答对了！</h2>
                <p>得分: +${this.timeLeft} 分</p>
                <button id="nextRound">下一轮</button>
            `;
        } else {
            popup.innerHTML = `
                <h2><i class="fas fa-sad-tear"></i> 时间到！</h2>
                <p>再接再厉！</p>
                <button id="nextRound">再试一次</button>
            `;
        }

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        document.getElementById('nextRound').addEventListener('click', () => {
            overlay.remove();
            popup.remove();
            this.round++;
            this.elements.roundDisplay.textContent = this.round;
            this.newRound();
        });
    }

    playSound(type) {
        const sound = this.sounds[type];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
}