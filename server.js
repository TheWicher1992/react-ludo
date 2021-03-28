const http = require('http')

const PORT = 8000
const fs = require('fs')
const WebSocket = require('ws')
const initialboard = [[['blue', 'blue', 'blue', 'blue'], [], [], [], [], [], [], [], [], [], [], [], [], [], ['red', 'red', 'red', 'red']], [[], [], [], [], [], [], [], [], [], [], [], [], [], []
    , []], [[], [], [], [], [], [], [], [], [], [], [], [], [], [], []], [[], [], [], [], [], []
    , [], [], [], [], [], [], [], [], []], [[], [], [], [], [], [], [], [], [], [], [], [], [], [
    ], []], [[], [], [], [], [], [], [], [], [], [], [], [], [], [], []], [[], [], [], [], [], [
    ], [], [], [], [], [], [], [], [], []], [[], [], [], [], [], [], [], [], [], [], [], [], [],
    [], []], [[], [], [], [], [], [], [], [], [], [], [], [], [], [], []], [[], [], [], [], [],
    [], [], [], [], [], [], [], [], [], []], [[], [], [], [], [], [], [], [], [], [], [], [], []
    , [], []], [[], [], [], [], [], [], [], [], [], [], [], [], [], [], []], [[], [], [], [], []
    , [], [], [], [], [], [], [], [], [], []], [[], [], [], [], [], [], [], [], [], [], [], [], [
    ], [], []], [['yellow', 'yellow', 'yellow', 'yellow'], [], [], [], [], [], [], [], [
    ], [], [], [], [], [], ['green', 'green', 'green', 'green']]]

let boardState = JSON.parse(JSON.stringify(initialboard))

//currentState[7][0].push('green')


const readFile = (fileName) =>
    new Promise((resolve, reject) => {
        fs.readFile(fileName, (readErr, fileContents) => {
            if (readErr) {
                reject(readErr)
            } else {
                resolve(fileContents)
            }
        })
    })


const sendPromisify = (ws, data) =>
    new Promise((resolve, reject) => {
        ws.send(JSON.stringify(data), (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })


const server = http.createServer(async (req, res) => {
    console.log(req.url)
    if (req.url === '/') {
        res.end(await readFile('client.html'))
    }
    if (req.url === '/ludo.css') {
        res.end(await readFile('ludo.css'))
    }
    if (req.url === '/myjs') {
        res.end(await readFile('client.js'))
    }
    if (req.url === '/center.png') {
        res.end(await readFile('center.png'))
    }
    if (req.url === '/dice_sound.mp3') {
        res.end(await readFile('dice_sound.mp3'))
    }
})

server.listen(PORT)


const step = (color, ox, oy, steps) => {
    const transform = ([ox, oy]) => (
        {
            'blue': [+ox, +oy], 'green': [-
                ox, -oy], 'red': [-oy, +ox], 'yellow': [+oy, -ox]
        }[color])
    const path = [
        '-7,-7', '-1,-6', '-1,-5', '-1,-4', '-1,-3', '-1,-2', '-2,-1', '-3,-1', '-4,-1', '-5,-1',
        '-6,-1', '-7,-1', '-7,0', '-7,1', '-6,1', '-5,1', '-4,1', '-3,1', '-2,1', '-1,2', '-1,3', '-1,4', '-1,5', '-1,6', '-1,7', '0,7', '1,7', '1,6', '1,5', '1,4', '1,3', '1,2', '2,1', '3,1', '4,1', '5,1', '6,1', '7,1', '7,0', '7,-1', '6,-1', '5,-1', '4,-1', '3,-1', '2,-1', '1,-2', '1,-3', '1,-4', '1,-5', '1,-6', '1,-7', '0,-7', '0,-6', '0,-5', '0,-4', '0,-3', '0,-2', '0,-1']
    const [x, y] =
        transform(transform(transform(path[path.indexOf(transform([ox - 7, oy -
            7]).join(',')) + steps].split(','))))
    return [x + 7, y + 7]
}

const playerColors = {
    1: 'blue',
    2: 'red',
    3: 'green',
    4: 'yellow'
}

const safeSpots = ['6,1', '2,6', '6,12', '8,2', '8,13', '13,6', '12,8', '1,8']
const winningSpots = [
    '7,6',
    '7,8',
    '6,7',
    '8,7'
]
let wins = {
    'blue': 0,
    'red': 0,
    'yellow': 0,
    'green': 0
}
let playerColorMap = new WeakMap()
let playerCount = 0
let players = []
let socketMap = []
let diceState;
let currentPlayer = -1
let end = false

const dice = () => (Math.floor(Math.random() * 6) + 1)
const iskilled = (ox, oy) => (ox - 7) * (ox - 7) + (oy - 7) * (oy - 7) == 98

const resetGameState = () => {
    boardState = JSON.parse(JSON.stringify(initialboard))
    playerColorMap = new WeakMap()
    playerCount = 0
    players = []
    diceState = 0
    currentPlayer = -1
    end = false
    wins = {
        'blue': 0,
        'red': 0,
        'yellow': 0,
        'green': 0
    }
}

const getTurn = () => {
    currentPlayer = ((currentPlayer + 1) % 4)
    return currentPlayer + 1
}
const isSafeSpot = (row, col) => {
    return safeSpots.includes(`${row},${col}`)
}

const getCurrentPlayer = () => {
    return playerColors[currentPlayer + 1]
}

const send = (ws, action) => {
    ws.send(JSON.stringify(action))
}

const sendNewBoardState = (ws) => {
    const action = {
        type: 'newboard',
        board: initialboard
    }
    send(ws, action)
}

const sendCurrentBoardState = (ws) => {
    const action = {
        type: 'updateboard',
        board: boardState
    }
    send(ws, action)
}
const sendDiceState = (ws) => {
    //diceStateMap[ws] = dice()
    //diceStateMap.set(ws, dice())
    const action = {
        type: 'dice',
        value: diceState
    }
    send(ws, action)
}

const sendNextTurn = (player, turn) => {
    const action = {
        type: 'turn',
        turn: playerColors[turn]
    }

    send(player, action)
}

const sendAll = (action) => {
    if (action === 'newboard') {
        console.log(initialboard)
        players.forEach(player => {
            sendNewBoardState(player)
        })
    }
    if (action === 'dice') {
        diceState = dice()
        players.forEach(player => {
            sendDiceState(player)
        })
    }
    if (action === 'currboard') {
        players.forEach(player => {
            sendCurrentBoardState(player)
        })
    }
    if (action === 'turn') {
        const turn = getTurn()
        players.forEach(player => {
            sendNextTurn(player, turn)
        })
    }
    if (action === 'reset') {
        players.forEach(player => {
            send(player, {
                type: 'reset'
            })
        })
    }
}

const sendWinMesage = (winner) => {
    const action = {
        type: 'winner',
        color: winner
    }
    players.forEach(player => {
        send(player, action)
    })
}

const wss = new WebSocket.Server({ port: 9000 })

const printDiceState = () => {
    players.forEach(player => console.log(playerColorMap.get(player)))
}

const handler = (ws) => {
    ws.on('message', (data) => {
        const action = JSON.parse(data)
        console.log(action)
        //printDiceState()
        if (action.type == 'click') {
            const row = action.coords.row
            const col = action.coords.col
            let moveable = true
            console.log(action.color, playerColorMap.get(ws))
            if (action.color === playerColorMap.get(ws) && playerColorMap.get(ws) === getCurrentPlayer()) {
                if (iskilled(row, col) && diceState !== 6) moveable = false
                if (action.color === 'blue' && moveable) {
                    if (row === 7) {
                        const diff = 6 - col
                        if (diff < diceState) {
                            moveable = false
                        }
                    }
                } else if (action.color === 'green' && moveable) {
                    if (row === 7 && col > 8) {
                        const diff = col - 8
                        if (diff < diceState) {
                            moveable = false
                        }
                    }
                }
                else if (action.color === 'red' && moveable) {
                    if (col === 7) {
                        const diff = 6 - row
                        if (diff < diceState) {
                            moveable = false
                        }
                    }
                }
                else if (action.color === 'yellow' && moveable) {
                    if (col === 7 && row > 8) {
                        const diff = row - 8
                        if (diff < diceState) {
                            moveable = false
                        }
                    }
                }
                if (moveable) {
                    console.log('moveable')
                    const removeIndex = boardState[row][col].indexOf(action.color)
                    boardState[row][col].splice(removeIndex, 1)
                    const updatedCoords = step(action.color, row, col, iskilled(row, col) ? 1 : diceState)
                    console.log(updatedCoords)

                    let cell = boardState[updatedCoords[0]][updatedCoords[1]]
                    if (cell.length !== 0 && !cell.includes(action.color) && !isSafeSpot(updatedCoords[0], updatedCoords[1])) {
                        const totalSprites = cell.length
                        const color = cell[0]
                        const sprites = [...cell]

                        cell.splice(0, totalSprites)
                        console.log('cond', color, sprites)
                        switch (color) {
                            case "blue":
                                boardState[0][0].push(...sprites)
                                break;
                            case "red":
                                boardState[0][14].push(...sprites)
                                break;
                            case "yellow":
                                boardState[14][0].push(...sprites)
                                break;
                            case "green":
                                boardState[14][14].push(...sprites)
                                break;
                            default:
                                break;
                        }


                    }



                    boardState[updatedCoords[0]][updatedCoords[1]].push(action.color)
                    if (winningSpots.includes(`${updatedCoords[0]},${updatedCoords[1]}`)) {
                        wins[action.color]++
                        console.log(wins)

                    }
                    if (wins[action.color] === 4) {
                        //wins

                        end = true
                        sendWinMesage(action.color)
                        sendAll('currboard')

                    }

                }
                if (!end) {
                    sendAll('currboard')
                    sendAll('dice')
                    sendAll('turn')
                }
            }
            else if (playerColorMap.get(ws) !== getCurrentPlayer()) {
                send(ws, {
                    type: 'serverMessage',
                    value: "NOT YOUR TURN"
                })
            }
        }


    })
}




wss.on('connection', (ws) => {
    playerCount++

    const initMsg = {
        type: 'setColor',
        color: playerColors[playerCount]
    }

    playerColorMap.set(ws, playerColors[playerCount])


    send(ws, initMsg)
    players.push(ws)

    if (playerCount === 4) {
        printDiceState()
        console.log(players[0] === players[1] === players[2] === players[3])
        console.log('start')
        sendAll('newboard')
        sendAll('dice')
        currentPlayer = -1
        sendAll('turn')
        players.forEach(player => handler(player))
    }

    ws.on('close', () => {
        players.splice(players.indexOf(ws), 1)
        // playerColorMap.delete(ws)
        // playerCount--
        // boardState = [...initialboard]

        players.forEach(async (player) => {
            await sendPromisify(player, {
                type: 'reset'
            })
        })
        resetGameState()
        // sendAll('reset')

        console.log('DISCONNECTED')
    })


})
