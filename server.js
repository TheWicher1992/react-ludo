const http = require('http')

const PORT = 8080
const fs = require('fs')
const WebSocket = require('ws')
const currentState = [[['blue', 'blue', 'blue', 'blue'], [], [], [], [], [], [], [], [], [], [], [], [], [], ['red', 'red', 'red', 'red']], [[], [], [], [], [], [], [], [], [], [], [], [], [], []
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


currentState[0][6].push('yellow')
currentState[7][3].push('blue')
currentState[7][6].push('blue')
currentState[7][6].push('blue')
currentState[7][6].push('blue')


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
    'blue': 3,
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

for (let index = 0; index < 10; index++) {
    console.log(getTurn())
}

const send = (ws, action) => {
    ws.send(JSON.stringify(action))
}

const sendNewBoardState = (ws) => {
    const action = {
        type: 'newboard',
        board: currentState
    }
    send(ws, action)
}

const sendCurrentBoardState = (ws) => {
    const action = {
        type: 'updateboard',
        board: currentState
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
        players.forEach(player => {
            sendNewBoardState(player)
        })
    }
    if (action === 'dice') {
        diceState = 3//dice()
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
                            console.log('n')
                            moveable = false
                        }
                    }
                } else if (action.color === 'green' && moveable) {
                    if (row === 7) {
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
                    const removeIndex = currentState[row][col].indexOf(action.color)
                    currentState[row][col].splice(removeIndex, 1)
                    const updatedCoords = step(action.color, row, col, iskilled(row, col) ? 1 : diceState)
                    console.log(updatedCoords)

                    let cell = currentState[updatedCoords[0]][updatedCoords[1]]
                    if (cell.length !== 0 && !cell.includes(action.color) && !isSafeSpot(updatedCoords[0], updatedCoords[1])) {
                        const totalSprites = cell.length
                        const color = cell[0]
                        const sprites = [...cell]

                        cell.splice(0, totalSprites)
                        console.log('cond', color, sprites)
                        switch (color) {
                            case "blue":
                                currentState[0][0].push(...sprites)
                                break;
                            case "red":
                                currentState[0][14].push(...sprites)
                                break;
                            case "yellow":
                                currentState[14][0].push(...sprites)
                                break;
                            case "green":
                                currentState[14][14].push(...sprites)
                                break;
                            default:
                                break;
                        }


                    }



                    currentState[updatedCoords[0]][updatedCoords[1]].push(action.color)
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
})
