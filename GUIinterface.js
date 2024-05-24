let board;
let gState;
const HumanPlayer = 0;
const PC = 1;
let PlayerNow = 0;
let counter = 2;
var DepthLevel ;
let openList = null;
let closedList = [];
var variable;


let level = prompt("What difficulty level you want? (Easy - Medium - Hard)");
switch(level){ 
	case "Easy":
		DepthLevel = 1;
		break;
	case "Medium":
		DepthLevel = 3;
		break;
	case "Hard":
		DepthLevel = 5;
		break;
	default:
		alert("Invalid option");

}

function instantiateGame() {

	let canvas = document.getElementById('canvas');
	canvas.addEventListener('click', function (e) { boardInteraction(e); });
	variable = canvas.getContext('2d');

	board = new NormalBoard({x: canvas.width, y: canvas.height});
	startNewGame();

}

function boardInteraction(e) {

	var rect = e.target.getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;

	for (let i = 0; i < board.holePositions.length; i++){

		let pos = board.holePositions[i];
		let d_x = x - pos.x;
		let d_y = y - pos.y;

		if (Math.sqrt(d_x * d_x + d_y * d_y) < board.holeSize) {
			selectHole(i);
			return;
		}
	}
}

function startNewGame() {

	gState = board.startState(counter);
	PlayerNow = 0;

	createBoardState();

}

function selectHole(place) {
	let whoSelect = GameBoard.playerForBall(gState[place]);

	if(whoSelect == PlayerNow) {
		openList = place;
		closedList = board.getPossibleGoals(gState, openList);

	} else if  (openList == place) {
		openList = null;
		closedList = [];
	} else {

		let GoalPlace = closedList.indexOf(place);
		if (GoalPlace != -1) {
			GameBoard.moveBall(gState, openList, place);
			ballMoved();

			openList = null;
			closedList = [];
		}
	}
	createBoardState();
}

function ballMoved() {
	setTimeout(function () {
	createBoardState();
		if (board.AllBallsInGoal(gState, PlayerNow)) {

			let message = (PlayerNow == PC) ? 'You lost! :(' : ' You won!';
			message += '\n\nDo you want to play again?';
			if (confirm(message)){
				startNewGame();
			}

		} else {
			nextPlayer();
		}

	}, 100);
}


function ballPath(x, y, size) {

	variable.beginPath();
	let radius = (size) ? size : board.holeSize;
	variable.arc(x, y, radius, 0, Math.PI * 2.0, false);
	variable.closePath();
}

function createBoardState() {
	variable.clearRect(0, 0, canvas.width, canvas.height);
	variable.strokeStyle = "#999";
	variable.lineWidth = 45;
	let noEdge = -1 ;
	for (let i = 0; i < board.graph.length; i++) {
		let pos0 = board.holePositions[i];
		let Edges =  board.graph[i];
		for (let k = 0; k < Edges.length; ++k) {
			if (Edges[k] == noEdge) {
				continue;
			}
			let pos1 = board.holePositions[Edges[k]];
			variable.beginPath();
			variable.moveTo(pos0.x, pos0.y);
			variable.lineTo(pos1.x, pos1.y);
			variable.closePath();
			variable.stroke();
		}
	}

	for (let i = 0; i < board.holePositions.length; i++){

		let pt = board.holePositions[i]
		let x = pt.x;
		let y = pt.y;
		let state = gState[i];
		if (state == 0) {
			ballPath(x, y);
			variable.fillStyle = "#c6b7ba";
			variable.fill();

		}
		else {
			let p = GameBoard.playerForBall(state);
			variable.fillStyle = playerColor(p);
			ballPath(x, y);
			variable.fill();

		}
		if (closedList.includes(i)) {
			ballPath(x, y);
			variable.lineWidth = 5;
			variable.strokeStyle = "#FFFFFF";
			variable.stroke();
		}
		if (i == openList) {
			ballPath(x, y);
			variable.lineWidth = 5;
			variable.strokeStyle = "#FFFF99";
			variable.stroke();
		}

	}

}


function ExecutePCmove() {

	let s = new Date().getTime();
	let treeTip = constructStateTree(gState, board, DepthLevel);
	let move = treeTip.bestMove;
	GameBoard.moveBall(gState, move.src, move.dest);
	ballMoved();

}
function nextPlayer() {
	PlayerNow = (PlayerNow + 1) % counter;
	if (PlayerNow == PC) {
		setTimeout(function() {
			ExecutePCmove();
		}, 100);
	}
	createBoardState();
}

function playerColor(playerPosition) {
let c = ['#00FF00','#F8786D'];
	return c[playerPosition];

}

instantiateGame();