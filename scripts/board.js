import View from './view.js'


const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
    }
}

export default class Board extends View {
    constructor() {
        super()

        this.board = Array.from({ length: 81 }, _ => 0)
        this.solution = [...this.board]

        this.activeTile = null
        this.solutions = 0

        this.visualAlgorithm = false
        this.validatedInput = false
        this.guidedInput = false
        this.lvl = 30

        this.working = false
        this.animationIteration = 0

        this.html = fetch('/pages/board.html').then(response => response.text())
    }

    async getHtml() {
        return await this.html
    }

    async configure() {
        document.querySelectorAll('#board li').forEach((li, i) => {
            li.addEventListener('click', () => {
                if (this.activeTile === li) {
                    this.activeTile.className = 'tile'
                    this.activeTile = null
                    return
                }
                if (this.activeTile !== null)
                    this.activeTile.className = 'tile'
                this.activeTile = li
                this.activeTile.className = 'tile selected'

                document.getElementById('num').focus()
            })
            li.id = i

            let x = (i % 9),
                y = Math.floor(i / 9)

            if (x + y === 9) {
                const d1 = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)), 
                      d2 = Math.sqrt(Math.pow(9 - x, 2) + Math.pow(9 - y, 2))
                li.style.animation = `enter ${500 + Math.abs(d1 - d2) * 100}ms ease-in-out ${Math.min(d1, d2) * 100}ms`
            } else {
                li.style.animation = `enter 500ms ease-in-out ${Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) * 100}ms, 
                                      enter 500ms ease-in-out ${Math.sqrt(Math.pow(9 - x, 2) + Math.pow(9 - y, 2)) * 100}ms`
            }
        })
        document.querySelectorAll('#board li')[40].addEventListener('animationiteration', () => {
            this.animationIteration += 1
        })

        document.addEventListener('keydown', async e => {
            if (this.activeTile === null)
                return

            e.preventDefault()

            if (/[1-9]/.test(e.key)) {
                const i = Number.parseInt(this.activeTile.id), n = Number.parseInt(e.key)

                this.activeTile.innerText = e.key
                this.board[i] = n

                if (this.validatedInput) {
                    if (this.solution.every(n => n === 0))
                        return
                    this.activeTile.style.animation = 'unset'
                    this.activeTile.offsetHeight
                    if (this.solution[i] === n) {  // correct
                        this.activeTile.style.animation = 'right 800ms ease-in-out'
                        console.log('very right')
                    }
                    else {  // wrong
                        this.activeTile.style.animation = 'wrong 800ms ease-in-out infinite'
                        console.log('very wrong')
                    }
                }

                else if (this.guidedInput) {
                    this.activeTile.style.animation = 'unset'
                    this.activeTile.offsetHeight
                    if ((await this.validValues(i)).indexOf(n) < 0) {  // the input is invalid
                        this.activeTile.style.animation = 'wrong 400ms ease-in-out'
                        console.log('wrong')
                    } else {  // the input is valid
                        this.activeTile.style.animation = 'right 400ms ease-in-out'
                        console.log('right')
                    }
                }

                return
            }

            else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.activeTile.innerText = ''
                this.activeTile.style.animation = 'unset'
                this.activeTile.offsetHeight
                this.board[Number.parseInt(this.activeTile.id)] = 0
                return
            }

            else if (e.key === 'Escape') {
                this.activeTile.className = 'tile'
                this.activeTile = null
                return
            }

            let diff = (() => {
                switch (e.key) {
                    case 'Tab':
                    case 'ArrowRight':
                    case 'd':
                        return 1
                    case ' ':
                    case 'ArrowDown':
                    case 's':
                        return 9
                    case 'ArrowLeft':
                    case 'a':
                        return -1
                    case 'ArrowUp':
                    case 'w':
                        return -9
                    default:
                        return 0
                }
            })()

            if (!diff)
                return

            if (e.shiftKey && (e.key === ' ' || e.key === 'Tab'))
                diff = -diff

            const ul = Array.from(document.querySelectorAll('#board li'))
            this.activeTile.className = 'tile'
            this.activeTile = ul[(((Number.parseInt(this.activeTile.id) + diff) % ul.length) + ul.length) % ul.length]
            this.activeTile.className = 'tile selected'
        })

        Array.from(document.getElementsByClassName('control')).forEach(btn => {
            if (btn.id === 'gen') {
                btn.addEventListener('click', () => this.generate())
            } else if (btn.id === 'sol') {
                btn.addEventListener('click', () => this.solve())
            } else if (btn.id === 'clr') {
                btn.addEventListener('click', () => this.clearBoard())
            }
        })

        document.getElementById('valg').checked = this.visualAlgorithm
        document.getElementById('vali').checked = this.validatedInput
        document.getElementById('help').checked = this.guidedInput

        document.getElementById('valg').addEventListener('click', e => {
            this.visualAlgorithm = e.target.checked
            if (this.visualAlgorithm) {
                this.updateBoard()
            } else {
                this.updateBoard('')
            }
        })

        document.getElementById('vali').addEventListener('click', e => {
            this.validatedInput = e.target.checked
        })

        document.getElementById('help').addEventListener('click', e => {
            this.guidedInput = e.target.checked
        })

        const updateSlider = () => {
            document.getElementById('lvl').value = this.lvl
            document.getElementById('lvltxt').innerText = `${this.lvl > 36 ? 'Easy' :
                this.lvl > 32 ? 'Medium' :
                    this.lvl > 28 ? 'Hard' :
                        'Evil'
                } (${this.lvl} Digits)`
        }
        updateSlider()
        document.getElementById('lvl').addEventListener('input', e => {
            this.lvl = e.target.value
            updateSlider()
        })

        await this.updateBoard()
    }

    async loading(starting) {
        if (starting)
            this.animationIteration = 0
        document.querySelectorAll('#board li').forEach((li, i) => {
            if (starting) {
                let x = (i % 9) - 4,
                    y = (i / 9) - 4

                li.style.animation = 'unset'
                li.offsetHeight
                li.style.animation = `loading 800ms ease-in-out ${Math.sqrt(x * x + y * y) * 100}ms infinite`

            } else {
                li.style.animationIterationCount = this.animationIteration + 1
            }
        })
    }

    async updateBoard(val) {
        document.querySelectorAll('#board li').forEach((li, i) => {
            li.innerText = val || (this.board[i] === 0 ? '' : this.board[i])
        })
    }

    async updateTile(index, value) {
        document.getElementById(index).innerText = value
        // await new Promise(r => setTimeout(r, 1))
    }

    async validValues(pos, random) {
        // generate possible results [1-9]
        let result = Array.from({ length: 9 }, (_, i) => i + 1)

        // if (random)
        //     shuffle(result)

        let x = pos % 9,
            y = Math.floor(pos / 9)

        // check to row for valid values
        this.board.slice((y * 9), (y + 1) * 9).forEach((n, i) => {
            if (pos !== 9 * y + i) {
                const index = result.indexOf(n)
                if (index >= 0) {
                    result.splice(index, 1)
                }
            }
        })

        // check the colum for valid values
        for (let i = x % 9; i < this.board.length; i += 9) {
            if (pos !== i) {
                const index = result.indexOf(this.board[i])
                if (index >= 0) {
                    result.splice(index, 1)
                }
            }
        }

        // check box around x, y
        x = (Math.floor(x / 3)) * 3
        y = (Math.floor(y / 3)) * 3
        for (let i = y; i < y + 3; i++) {
            this.board.slice(9 * i + x, 9 * i + x + 3).forEach((n, j) => {
                if (pos !== 9 * i + x + j) {
                    const index = result.indexOf(n)
                    if (index >= 0) {
                        result.splice(index, 1)
                    }
                }
            })
        }

        if (random)
            shuffle(result)

        return result
    }

    async validBoard() {
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] !== 0) {
                if ((await this.validValues(i)).indexOf(this.board[i]) < 0)
                    return false
            }
        }
        return true
    }

    async fillBoard(generating = false, counting = false, max = 100) {
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === 0) {
                for (const n of await this.validValues(i, generating)) {
                    if (counting && this.solution[i] === n)
                        continue

                    this.board[i] = n
                    // if (!counting && this.visualAlgorithm)
                    if (this.visualAlgorithm)
                        await this.updateTile(i, n)
                    if (await this.fillBoard(generating, counting, max))
                        return true
                }
                await new Promise(r => setTimeout(r, 2))

                this.board[i] = 0
                return false
            }
        }

        if (!counting)
            return true
        this.solutions += 1
        return this.solutions >= max  // keep looking for solutions if not at limit
    }

    async countValues() {
        let count = 0
        for (const n of this.board) {
            if (n != 0)
                count += 1
        }
        return count
    }

    async countExtraSolutions(max) {
        const cpy = [...this.board]
        this.solutions = 0
        await this.fillBoard(false, true, max)
        this.board = cpy
        return this.solutions
    }

    async setRemainingNumsOld(count) {
        let constants = []
        while (await this.countValues() > count) {
            let positions = []  // all positions with a value
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] != 0 && constants.indexOf(i) < 0)
                    positions.push(i)
            }
            if (positions.length === 0) return

            shuffle(positions)

            for (const i of positions.slice(0, 5)) {  // only try 5 at a time
                const cpy = [...this.board]
                this.board[i] = 0

                if (this.visualAlgorithm) {
                    await this.updateTile(i, '')
                }

                if (await this.countExtraSolutions(1) > 0) {  // there are 2 or more solutions -> invalid board -> redo
                    this.board = cpy
                    constants.push(i)

                    if (this.visualAlgorithm) {
                        await this.updateTile(i, this.board[i])
                    }

                } else {
                    this.board = cpy
                    this.board[i] = 0
                }

                await new Promise(r => setTimeout(r, 2))
                if (await this.countValues() <= count) return
            }
        }
    }

    async setRemainingNums(count) {
        let positions = this.board.map((val, i) => {
            if (val != 0)
                return i
        })
        // let positions = Array.from({length: this.board.length}, (_, i) => i)

        shuffle(positions)
        positions = positions.slice(0, this.board.length - count)

        let values = positions.map(p => this.board[p])
        positions.forEach(p => this.board[p] = 0)

        if (this.visualAlgorithm)
            await this.updateBoard()

        for (let i = 0; await this.countExtraSolutions(1) > 0; i++) {
            this.board[positions[i]] = values[i]

            if (this.visualAlgorithm) {
                await this.updateTile(positions[i], values[i])
            }
            await new Promise(r => setTimeout(r, 2))

            console.log(positions[i], values[i])
        }
    }

    async solve() {
        if (this.working)
            return
        if (!await this.validBoard()) {
            console.log('invalid')
            return
        }
        this.working = true
        this.loading(true)
        await this.fillBoard()
        this.updateBoard()
        this.loading(false)
        this.working = false

    }

    async generate() {
        if (this.working)
            return
        if (!await this.validBoard()) {
            console.log('invalid')
            return
        }
        this.working = true
        this.loading(true)
        await this.fillBoard(true)
        this.solution = [...this.board]
        await this.setRemainingNums(this.lvl)
        this.updateBoard()
        this.working = false
        this.loading(false)
    }

    async clearBoard() {
        if (this.working)
            return
        this.working = true
        this.board = Array.from({ length: 81 }, _ => 0)
        this.solution = [...this.board]
        await this.updateBoard()
        this.working = false
    }
}
