let ludoSocket = new WebSocket("ws://localhost:9000");
let diceSound = new Audio('dice_sound.mp3')



const { useState, Fragment } = React;

const Ludo = () => {
  const [board, setBoard] = useState([]);
  const [dice, setDice] = useState(0);
  const [color, setColor] = useState(``);
  const [turn, setTurn] = useState("");
  const [serverMsg, setServerMsg] = useState("");
  const [end, setEnd] = useState(false);

  const resetState = () => {
    ludoSocket = new WebSocket("ws://localhost:9000");
    setBoard([])
    setDice(0)
    setTurn('')
    setServerMsg('')
    setEnd(false)
  }



  ludoSocket.onmessage = (event) => {

    const message = JSON.parse(event.data);

    console.log(message);

    //actions
    if (message.type === "winner") {
      setServerMsg(`${message.color} wins`);
      setTurn("");
      setEnd(true);
      //ludoSocket.close();
    }
    if (message.type == "setColor") {
      setColor(message.color);
    }
    if (message.type === "newboard" || message.type === "updateboard") {
      console.log(message.board.length);
      setBoard(message.board);
    }
    if (message.type === "dice") {
      setDice(message.value);
    }
    if (message.type === "turn") {
      setTurn(message.turn);
    }
    if (message.type === 'reset') {
      resetState()
    }
    if (message.type === "serverMessage") {
      setServerMsg(message.value);
      setTimeout(() => {
        setServerMsg("");
      }, 3000);
    }
  };

  const onClick = (col, coords) => {
    diceSound.play()
    console.log(col, coords);
    const action = {
      type: "click",
      color: col,
      coords,
    };
    if (color === action.color && !end) {
      ludoSocket.send(JSON.stringify(action));
    }
  };
  let serverMessage = (
    <div className="text_box">
      {board.length == 0 && "Waiting for players to join"}
      {turn !== "" && `${turn}'s turn`}
      <br />
      {serverMsg}
    </div>
  );

  return (
    <Fragment>
      <div>
        {board.map((row, rowIndex) => (
          <div key={rowIndex}>
            {row.map((col, colIndex) => (
              <div
                key={`${colIndex}${rowIndex}`}
                className={`cell${rowIndex}${colIndex}`}
              >
                {col.map((sprite, cellIndex) => (
                  <div
                    onClick={(e) => {
                      console.log(e.target)
                      onClick(sprite, { row: rowIndex, col: colIndex });
                    }}
                    key={`${colIndex}${cellIndex}`}
                    className={sprite}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        ))}
        <div className="dice">{dice}</div>
        <div className={`color ${color}`}></div>
        {serverMessage}
      </div>
    </Fragment>
  );
};

const App = () => {
  return <Ludo />;
};

ReactDOM.render(<App />, document.querySelector("#root"));
