class BFSCat {
    constructor(options) {
        // 定义基础行列信息
        this.columns = (options && options.columns) || 16
        this.rows = (options && options.rows) || 8
    }

    /**
     * 获取最短路径
     * @param chessboard 棋盘信息
     * @param catIndex 猫的位置
     * @returns {Array} 路径信息 无解时返回空数组
     */
    getShortestWays(chessboard, catIndex) {
        return this.search(chessboard, [{cur: catIndex, ways: []}])
    }

    /**
     * 根据当前棋盘局势搜索出一条最短路径
     * @param curChessboard 当前棋盘局势
     * @param curs 猫的当前位置
     * @param history 历史走过的路径
     * @returns {Array} 返回最短路径 无解时返回空数组
     */
    search(curChessboard, curs, history) {
        if (!history) history = []
        let nexts = []
        for (let i in curs) {
            const curObj = curs[i];
            const cur = curObj.cur
            const ways = curObj.ways
            const effectNeighbors = this.getEffectNeighbors(history, cur, curChessboard)
            for (let j in effectNeighbors) {
                const next = effectNeighbors[j]
                if (curChessboard[next].flag === 2) {
                    // 抓到老鼠 缓存路径
                    return ways.slice().concat([cur, next])
                }
            }
            history = history.concat(effectNeighbors)
            nexts = nexts.concat(effectNeighbors.map(next => ({
                cur: next,
                ways: ways.slice().concat([cur])
            })))
        }
        if (nexts.length === 0) {
            return []
        }
        return this.search(curChessboard, nexts, history)
    }

    /**
     *
     * @param history 历史走过的路径 防止走回头路
     * @param cur 当前位置
     * @param chessboard 棋盘信息
     * @returns {Array} 下一步可能的走法
     */
    getEffectNeighbors(history, cur, chessboard) {
        let result = []
        const p = this.computeXY(cur)
        const columns = this.columns
        const rows = this.rows
        if (p.x > 0 && this.checkNextPoint(chessboard[cur - 1])) result.push(cur - 1)
        if (p.x < columns - 1 && this.checkNextPoint(chessboard[cur + 1])) result.push(cur + 1)
        if (p.y > 0 && this.checkNextPoint(chessboard[cur - columns])) result.push(cur - columns)
        if (p.y < rows - 1 && this.checkNextPoint(chessboard[cur + columns])) result.push(cur + columns)
        return result.filter(next => !(history && history.includes(next)))
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