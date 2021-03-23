const ludoSocket = new WebSocket("wss://react-ludo-heuec.ondigitalocean.app/:9000");

const { useState, Fragment } = React;

const Ludo = () => {
  const [board, setBoard] = React.useState([]);
  const [dice, setDice] = React.useState(0);
  const [color, setColor] = React.useState(``);
  const [turn, setTurn] = React.useState("");
  const [serverMsg, setServerMsg] = useState("");
  const [end, setEnd] = useState(false);
  ludoSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    //
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
    if (message.type === "serverMessage") {
      setServerMsg(message.value);
      setTimeout(() => {
        setServerMsg("");
      }, 3000);
    }
  };

  const onClick = (col, coords) => {
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
      {turn === "" && serverMsg === "" && "Waiting for players to join"}
      {turn !== "" && `${turn}'s turn`}
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
                    onClick={() => {
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
