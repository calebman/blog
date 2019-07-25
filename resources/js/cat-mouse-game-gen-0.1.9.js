/**
 * 游戏构建程序 将游戏构建至画布中
 */
function GameGenerator() {
    // 配置信息
    const defaultOptions = {
        columns: 16,
        rows: 8,
        delay: 800,
        complexRoad: false
    }
    // 存储游戏进程信息
    this.process = {}

    /**
     * 棋盘元素点
     */
    class Point {
        constructor(i, ctx) {
            this.i = i
            this.ctx = ctx
        }

        /**
         * 获取当前元素在棋盘的位置
         * @returns {number}
         */
        getCurIndex() {
            return this.i
        }

        /**
         * 绘制元素
         */
        draw() {
            return this.drawImage(this.i)
        }

        /**
         * 清空元素
         */
        clear() {
            this.clearImage(this.i)
        }

        /**
         * 绘制元素图片
         * @param i 点位信息
         * @returns {Promise<>} 执行结果
         */
        drawImage(i) {
            if (!this.selectImgSrc) {
                if (Array.isArray(this.imgSrc)) {
                    this.selectImgSrc = this.imgSrc[Math.round(Math.random() * (this.imgSrc.length - 1))]
                } else {
                    this.selectImgSrc = this.imgSrc
                }
            }
            return new Promise((resolve) => {
                if (this.imgSrc) {
                    const p = this.computeXY(i)
                    const pointSize = this.ctx.pointSize
                    const canvasCtx = this.ctx.canvasCtx
                    let img = new Image()
                    img.src = this.selectImgSrc
                    img.onload = () => {
                        canvasCtx.drawImage(img, p.x * pointSize, p.y * pointSize, pointSize, pointSize)
                        resolve()
                    }
                }
            })
        }

        /**
         * 清空绘制元素
         * @param i 点位信息
         */
        clearImage(i) {
            const p = this.computeXY(i)
            const pointSize = this.ctx.pointSize
            const canvasCtx = this.ctx.canvasCtx
            canvasCtx.clearRect(p.x * pointSize, p.y * pointSize, pointSize, pointSize)
        }

        /**
         * 根据棋盘的相对位置计算棋子的坐标
         * @param index 棋盘相对位置
         * @returns {{x: number, y: number}}
         */
        computeXY(index) {
            const columns = this.ctx.options.columns
            const x = index % columns
            const y = Math.floor(index / columns)
            return {x, y}
        }

        /**
         * 获取棋子的标志位
         */
        getFlag() {
            return 0
        }
    }

    /**
     * 道路对象
     */
    class Road extends Point {
        constructor(i, cxt) {
            super(i, cxt)
        }

        /**
         * 走过此路需要消耗的体力
         * @returns {number}
         */
        getDepletePower() {
            return 1
        }
    }

    /**
     * 普通道路
     */
    class NormalRoad extends Road {
        constructor(i, cxt) {
            super(i, cxt)

        }

        getDepletePower() {
            return 1
        }
    }

    /**
     * 草地
     */
    class Grassland extends Road {
        constructor(i, cxt) {
            super(i, cxt)
            this.imgSrc = [
                'https://resources.chenjianhui.site/grassland-1.png',
                'https://resources.chenjianhui.site/grassland-2.png'
            ]
        }

        getDepletePower() {
            return 2
        }
    }

    /**
     * 溪流水路
     */
    class Waterway extends Road {
        constructor(i, cxt) {
            super(i, cxt)
            this.imgSrc = 'https://resources.chenjianhui.site/waterway-2.svg'
        }

        getDepletePower() {
            return 3
        }
    }


    /**
     * 动物 带有移动功能
     * 还原踩过的路也是这个类的职责
     */
    class Animal extends Point {
        constructor(i, cxt) {
            super(i, cxt)
            this.history = {
                i: this.i,
                p: new NormalRoad(this.i, cxt)
            }
        }

        draw() {
            return new Promise(resolve => {
                let chessboard = this.ctx.chessboard
                this.canMovePoints = this.genCanMovePoints()
                return this.drawImage(this.i).then(() => {
                    // 还原路的功能
                    chessboard[this.history.i] = this.history.p
                    this.history = {
                        i: this.i,
                        p: chessboard[this.i]
                    }
                    chessboard[this.i] = this
                    resolve()
                })
            })

        }

        /**
         * 移动棋子
         * @param targetI 目标位置
         */
        move(targetI) {
            return new Promise(resolve => {
                if (targetI === null || targetI === undefined) {
                    resolve()
                } else {
                    if (this.canMovePoints.includes(targetI)) {
                        if (this.history) {
                            // 擦除
                            this.clearImage(this.history.i)
                            // 还原道路
                            if (this.history.p instanceof Road) {
                                this.history.p.draw()
                            }
                        }
                        this.i = targetI
                        this.draw().then(() => resolve())
                    } else {
                        console.warn(`${targetI}不是一个合法的可移动点位，只能向自己的上下左右以及无障碍物处移动`)
                        resolve()
                    }
                }

            })
        }

        /**
         * 获取可移动点位集合
         */
        getCanMovePoints() {
            return this.canMovePoints
        }

        /**
         * 生成可移动点位集合
         */
        genCanMovePoints() {
            const i = this.getCurIndex()
            const p = this.computeXY(i)
            const chessboard = this.ctx.chessboard
            const columns = this.ctx.options.columns
            const rows = this.ctx.options.rows
            let result = []
            if (p.x > 0 && this.checkMovePoint(chessboard[i - 1])) result.push(i - 1)
            if (p.x < columns - 1 && this.checkMovePoint(chessboard[i + 1])) result.push(i + 1)
            if (p.y > 0 && this.checkMovePoint(chessboard[i - columns])) result.push(i - columns)
            if (p.y < rows - 1 && this.checkMovePoint(chessboard[i + columns])) result.push(i + columns)
            return result
        }
    }


    /**
     * 障碍物
     */
    class Obstacle extends Point {
        constructor(i, cxt) {
            super(i, cxt)
            this.imgSrc = [
                'https://resources.chenjianhui.site/mountain-1.png',
                'https://resources.chenjianhui.site/mountain-2.svg',
                'https://resources.chenjianhui.site/tree-1.png'
            ]
        }

        getFlag() {
            return 3
        }
    }

    /**
     * 猫
     */
    class Cat extends Animal {
        constructor(i, cxt) {
            super(i, cxt)
            this.imgSrc = 'https://resources.chenjianhui.site/cat-1.svg'
            // 消耗体力
            this.strength = 0
        }

        getFlag() {
            return 1
        }

        /**
         * 判断下一步点位是否可以移动
         */
        checkMovePoint(point) {
            return !(point instanceof Obstacle)
        }

        /**
         * 统计信息
         */
        statistics() {
            if (this.history.p instanceof Road) {
                this.strength = this.strength + this.history.p.getDepletePower()
            }
        }

        /**
         * 获取消耗的体力值
         * @returns {number}
         */
        getStrength() {
            return this.strength
        }
    }

    /**
     * 鼠
     */
    class Mouse extends Animal {
        constructor(i, cxt) {
            super(i, cxt)
            this.imgSrc = 'https://resources.chenjianhui.site/mouse-1.svg'
        }

        getFlag() {
            return 2
        }

        /**
         * 判断下一步点位是否可以移动
         */
        checkMovePoint(point) {
            return !((point instanceof Obstacle) || point instanceof Cat)
        }
    }

    /**
     * 游戏进程
     */
    class GameProcess {
        constructor(canvasId, catHandler, mouseHandler, options) {
            if (gameGen.process[canvasId]) {
                // 终止上一个游戏进程
                console.log(`destory game with canvas id is ${canvasId}`)
                gameGen.process[canvasId].destory()
            }
            gameGen.process[canvasId] = this

            /**
             * 猫行动函数
             */
            this.catHandler = catHandler
            /**
             * 老鼠行动函数
             */
            this.mouseHandler = mouseHandler
            /**
             * 像素级别
             * @type {number}
             */
            this.ratio = 2
            /**
             * 画布节点
             * @type {HTMLElement}
             */
            this.gamePlaceEle = document.getElementById(canvasId)
            /**
             * 配置信息
             */
            this.options = Object.assign({}, defaultOptions, options)
            /**
             * 棋盘布局
             */
            this.chessboard = []
            /**
             * 障碍物数量
             */
            this.obstacleCount = this.options.columns * this.options.rows * 0.2
            /**
             * 像素点大小
             */
            this.pixel = Math.min(64, this.gamePlaceEle.parentNode.offsetWidth / this.options.columns)
            /**
             * 元素绘制大小
             */
            this.pointSize = this.pixel * this.ratio
            /**
             * 画布对象 用于绘制棋盘元素
             */
            this.canvasCtx = this.gamePlaceEle.getContext('2d')
            /**
             * 游戏结束标志
             * @type {boolean}
             */
            this.end = false
            /**
             * 游戏中的猫
             * @type {Cat}
             */
            this.cat = null
            /**
             * 游戏中的鼠
             * @type {Mouse}
             */
            this.mouse = null
            /**
             * 游戏进传ID
             * @type {Number}
             */
            this.runnerId = null
            /**
             * 统计信息
             * @type {Number}
             */
            this.round = 0
        }

        /**
         * 初始化棋盘大小
         */
        initPlace() {
            let gamePlaceEle = this.gamePlaceEle
            const pixel = this.pixel
            const columns = this.options.columns
            const rows = this.options.rows
            const ratio = this.ratio
            // 初始化画布
            gamePlaceEle.style.width = `${pixel * columns}px`
            gamePlaceEle.style.height = `${pixel * rows}px`
            gamePlaceEle.style.margin = '10px auto'
            gamePlaceEle.style.backgroundImage = `url('https://resources.chenjianhui.site/2019-06-20-game-background.png')`
            gamePlaceEle.width = pixel * columns * ratio
            gamePlaceEle.height = pixel * rows * ratio
            // 初始化棋盘
            this.chessboard = Array(columns * rows).fill(0)
        }

        /**
         * 初始化棋盘点位元素
         */
        initPoints() {
            /**
             * 获取随即障碍物点位列表
             */
            const randomObstacles = () => {
                let results = []
                const obstacleCount = this.obstacleCount
                const chessboard = this.chessboard
                const chessboardSize = this.chessboard.length
                const columns = this.options.columns
                for (let i = 0; i < obstacleCount; i++) {
                    while (true) {
                        let randomIndex = 1 + Math.round(Math.random() * (chessboardSize - 2))
                        if (chessboard[randomIndex] === 0 &&
                            ![1, columns, chessboardSize - 2, chessboardSize - columns - 1, chessboardSize - columns, chessboardSize - columns + 1].concat(results).includes(randomIndex)) {
                            results.push(randomIndex)
                            break
                        }
                    }
                }
                return results
            }

            /**
             * 获取随机类型的路
             */
            const randomRoad = i => {
                const chessboardSize = this.chessboard.length
                const columns = this.options.columns
                if (this.options.complexRoad && i !== chessboardSize - columns && i !== chessboardSize - columns + 1) {
                    const randomVal = Math.round(Math.random() * 100)
                    if (randomVal < 20) {
                        return new Waterway(i, this)
                    }
                    if (randomVal > 90) {
                        return new Grassland(i, this)
                    }
                }
                return new NormalRoad(i, this)
            }


            let chessboard = this.chessboard
            const chessboardSize = this.chessboard.length
            // 初始化猫
            const cat = new Cat(0, this)
            chessboard[cat.getCurIndex()] = cat
            this.cat = cat
            // 初始化鼠
            const mouse = new Mouse(chessboardSize - 1, this)
            chessboard[mouse.getCurIndex()] = mouse
            this.mouse = mouse
            // 初始化障碍
            randomObstacles().forEach(i => {
                chessboard[i] = new Obstacle(i, this)
            })
            // 初始化路
            chessboard.forEach((p, i) => (p === 0 && (chessboard[i] = randomRoad(i))))
            // 绘制
            chessboard.forEach(p => p && p.draw())
        }

        /**
         * 开始游戏
         */
        startGame() {
            const catHandler = this.catHandler
            const mouseHandler = this.mouseHandler
            if (catHandler || mouseHandler) {
                this.runnerId = setTimeout(() => gameHandler(), this.options.delay)
                const gameHandler = () => {
                    if(this.end) {
                        return
                    }
                    ++this.round
                    const cat = this.cat
                    const mouse = this.mouse
                    const chessboard = this.chessboard
                    let catProcess, mouseProcess = Promise.resolve()
                    // 猫的移动逻辑
                    if (catHandler && typeof catHandler === 'function') {
                        const catCanMovePoints = cat.getCanMovePoints()
                        const catPointIndex = catHandler(this.transformChessboard(chessboard), cat.getCurIndex(), catCanMovePoints)
                        catProcess = new Promise(resolve => {
                            cat.move(catPointIndex).then(() => {
                                cat.statistics()
                                this.refreshStatisticsInfo()
                                resolve()
                            })
                        })
                    }
                    // 老鼠的移动逻辑
                    if (mouseHandler && typeof mouseHandler === 'function') {
                        const mouseCanMovePoints = mouse.getCanMovePoints()
                        const mousePointIndex = catHandler(this.transformChessboard(chessboard), mouse.getCurIndex(), mouseCanMovePoints)
                        mouseProcess = mouse.move(mousePointIndex)
                    }
                    // 胜利判定
                    if (this.victoryJudg()) {
                        this.end = true
                        clearTimeout(this.runnerId)
                    }
                    Promise.all([catProcess, mouseProcess]).then(() => {
                        this.runnerId = setTimeout(() => gameHandler(), this.options.delay)
                    })
                }
            }

        }

        /**
         * 更新统计信息
         */
        refreshStatisticsInfo() {
            const canvasCtx = this.canvasCtx
            const columns = this.options.columns
            const rows = this.options.rows
            const pointSize = this.pointSize
            const round = this.round
            const strength = this.cat.getStrength()
            const roundText = `回合消耗：${round}`
            const strengthText = `体力消耗：${strength}`
            canvasCtx.font = '28px Georgia'
            canvasCtx.fillStyle = 'red'
            this.chessboard[this.chessboard.length - columns].draw()
            this.chessboard[this.chessboard.length - columns + 1].draw()
            canvasCtx.clearRect(0, (rows - 1) * pointSize, pointSize * 2, pointSize)
            canvasCtx.fillText(roundText, 10, (rows - 1) * pointSize + pointSize * 0.6)
            canvasCtx.fillText(strengthText, 10, (rows - 1) * pointSize + pointSize * 0.9)
        }

        /**
         * 胜利判定 没有老鼠即胜利
         */
        victoryJudg() {
            return !this.chessboard.includes(this.mouse)
        }

        /**
         * 将棋盘转换为数字信息
         * @param chessboard 棋盘
         */
        transformChessboard() {
            return this.chessboard.map(p => ({
                flag: (p instanceof Point) ? p.getFlag() : null,
                depletePower: (p instanceof Road) ? p.getDepletePower() : null
            }))
        }

        /**
         * 销毁进程
         */
        destory() {
            let gamePlaceEle = this.gamePlaceEle
            const canvasCtx = this.canvasCtx
            clearTimeout(this.runnerId)
            canvasCtx.clearRect(0, 0, gamePlaceEle.width, gamePlaceEle.height)
        }
    }

    /**
     * 初始化游戏程序
     */
    this.initGame = function (canvasId, catHandler, mouseHandler, options) {
        const gameProcess = new GameProcess(canvasId, catHandler, mouseHandler, options)
        gameProcess.initPlace()
        gameProcess.initPoints()
        gameProcess.startGame()
        gameProcess.refreshStatisticsInfo()
        return gameProcess
    }
}

// 初始化游戏构建程序
window.gameGen = new GameGenerator()