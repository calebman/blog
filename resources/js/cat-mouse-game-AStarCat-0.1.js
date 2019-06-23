class AStarCat {
    constructor(options) {
        // 定义基础行列信息
        this.columns = (options && options.columns) || 16
        this.rows = (options && options.rows) || 8
    }

    /**
     * 获取最优解
     * @param chessboard 棋盘信息
     * @returns {Array} 路径信息 无解时返回空数组
     */
    getShortestWays(chessboard) {
        const catIndex = chessboard.findIndex(item => item.flag === 1)
        const mouseIndex = chessboard.findIndex(item => item.flag === 2)
        return this.search(chessboard, {cur: catIndex, ways: []}, catIndex, mouseIndex)
    }

    /**
     * 搜索路径
     * @param curChessboard 棋盘信息
     * @param curObj 当前行动点对象
     * @param catIndex 猫的初始位置
     * @param mouseIndex 老鼠的初始位置
     * @param open 被考虑的点位
     * @param close 不被考虑的点位
     * @returns {Array} 返回最优路径 无解时返回空数组
     */
    search(curChessboard, curObj, catIndex, mouseIndex, open, close) {
        if (!open) open = []
        if (!close) close = []
        const cur = curObj.cur
        close.push(cur)
        open.splice(open.findIndex(o => o.cur === cur), 1)
        const effectNeighbors = this.getEffectNeighbors(close, cur, curChessboard)
        const nextOpen = effectNeighbors.map(next => {
            const ways = curObj.ways.concat([next])
            return {
                cur: next,
                f: this.computeF(mouseIndex, next, ways, curChessboard),
                ways: ways
            }
        })
        // 如果open与nextOpen有交集，取更小值
        nextOpen.forEach(n => {
            let sameIndex = open.findIndex(o => o.cur === n.cur)
            if (sameIndex > -1) {
                if (n.f < open[sameIndex].f) {
                    open.splice(sameIndex, 1, n)
                }
            } else {
                open.push(n)
            }
        })
        open = open.concat()
        const success = open.find(o => o.cur === mouseIndex)
        if (success) {
            return success.ways
        }
        if (open.length > 0) {
            return this.search(curChessboard, open.sort((a, b) => (a.f - b.f))[0], catIndex, mouseIndex, open.slice(), close.slice())
        }
        return []
    }

    /**
     *
     * @param close 不被考虑的节点
     * @param cur 当前位置
     * @param chessboard 棋盘信息
     * @returns {Array} 下一步可能的走法
     */
    getEffectNeighbors(close, cur, chessboard) {
        let result = []
        const p = this.computeXY(cur)
        const columns = this.columns
        const rows = this.rows
        if (p.x > 0 && this.checkNextPoint(chessboard[cur - 1])) result.push(cur - 1)
        if (p.x < columns - 1 && this.checkNextPoint(chessboard[cur + 1])) result.push(cur + 1)
        if (p.y > 0 && this.checkNextPoint(chessboard[cur - columns])) result.push(cur - columns)
        if (p.y < rows - 1 && this.checkNextPoint(chessboard[cur + columns])) result.push(cur + columns)
        return result.filter(next => !(close && close.includes(next)))
    }

    /**
     * 计算GH的和值
     * @param mouseIndex 老鼠的位置
     * @param curIndex 当前行动点
     * @param ways 当前行动点的历史路径
     * @param chessboard 棋盘信息
     */
    computeF(mouseIndex, curIndex, ways, chessboard) {
        const mouseP = this.computeXY(mouseIndex)
        const curP = this.computeXY(curIndex)
        const g = ways.reduce((a, b) => (chessboard[a].depletePower + chessboard[b].depletePower), 0)
        const h = Math.abs(curP.x - mouseP.x) + Math.abs(curP.y - mouseP.y)
        return g + h
    }

    /**
     * 根据棋盘的相对位置计算棋子的坐标
     * @param index 棋盘相对位置
     * @returns {{x: number, y: number}}
     */
    computeXY(index) {
        const columns = this.columns
        const x = index % columns
        const y = Math.floor(index / columns)
        return {x, y}
    }

    /**
     * 判断下一步点位是否可以移动
     */
    checkNextPoint(point) {
        return point.flag !== 3
    }
}