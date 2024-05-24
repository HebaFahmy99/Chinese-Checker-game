
let  branchFactor= 0;
let counterForNodes = 0;
let turns = 0;
function TreeUsingAlphaAndBeta(node, board, depth, maxDepth, alphaVal, betaVal, MaxAction){
	if (board.AllBallsInGoal(node.state, PC)) {
		const positiveScore = 5000;
		let temp = positiveScore / (maxDepth - depth);
		return temp;
	}

	if (depth == 0) {
		return stateEstimate(node.state, board);
	}

	branchFactor++;

	if(MaxAction) {

		var val = Number.NEGATIVE_INFINITY;
		let player = PC;
		let ball = GameBoard.ballForPlayer(player);

		for(let i = 0; i < node.state.length; i++){
			if(node.state[i] == ball){
				for (let goal of board.getPossibleGoals(node.state, i)) {

					let moveEND = {src: i, dest: goal};
					let goalIndex = board.HolePositionIndex(player);
					let earnedDistance = board.holeSpace(i, goalIndex) - board.holeSpace(goal, goalIndex);
					if (earnedDistance < -0.5 * board.jumpLength) {
						continue;
					}
					let newState = node.state.slice();
					GameBoard.moveBall(newState, i, goal);

					let childNode = {
						state: newState,
						child: undefined,
						score: undefined,
						bestMove: undefined
					};

					counterForNodes++;

					let newVal = TreeUsingAlphaAndBeta(childNode, board, depth - 1, maxDepth, alphaVal, betaVal, false);
					if (newVal > val) {
						val = newVal;
						node.bestMove = moveEND;
						node.child = childNode;
						node.score = val;
					}
					alphaVal = Math.max(alphaVal, val);

					if(alphaVal >= betaVal){
						return val; 
					}
				}
			}
		}

		return node.score;

	} else {
		let val = Number.POSITIVE_INFINITY;
		let player = HumanPlayer;
		let ball = GameBoard.ballForPlayer(player);

		for(let i = 0; i < node.state.length; i++){
			if(node.state[i] == ball){
				for (let goal of board.getPossibleGoals(node.state, i)) {
					let moveEND = {src: i, dest: goal};
					let goalIndex = board.HolePositionIndex(player);
					let earnedDistance = board.holeSpace(i, goalIndex) - board.holeSpace(goal, goalIndex);
					if (earnedDistance < -0.5 * board.jumpLength) {
						continue;
					}
					let newState = node.state.slice();
					GameBoard.moveBall(newState, i, goal);

					let childNode = {
						state: newState,
						child: undefined,
						score: undefined,
						bestMove: undefined
					};

					counterForNodes++;

					let newVal = TreeUsingAlphaAndBeta(childNode, board, depth - 1, maxDepth, alphaVal, betaVal, true);
					if (newVal < val) {
						val = newVal;
						node.bestMove = moveEND;
						node.child = childNode;
						node.score = newVal;
					}
					betaVal = Math.min(val, betaVal);

					if(alphaVal >= betaVal){
						return val;
					}
				}
			}
		}

		return node.score;
	}

}

function reassign(current, board, depth) {

	let maximize = (depth % 2) == 0;

	let optimalS = (maximize) ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
	let optimalM = undefined;

	if (current.children.length == 0) {

		current.score = stateEstimate(current.state, board);

	} else {

		if (depth > 0) {
			optimalS = stateEstimate(current.state, board);
		}

		for (var i = 0; i < current.children.length; i++) {
			let child = current.children[i];
			reassign(child, board, depth + 1)
			if (child.score > optimalS && maximize ) {
				optimalM = current.moves[i];
				optimalS = child.score;
				
			}
			if (child.score < optimalS && !maximize ) {
				optimalM = current.moves[i];
				optimalS = child.score;
				
			}
		}
		current.bestMove = optimalM;
		current.score = optimalS;
		
	}

}

function putScoresToStates(origin, board) {
	reassign(origin, board, 0);
}

function makeTreeStates(origin, board, maxDepth) {
	origin.moves = [];
	origin.children = [];
	origin.score = undefined;
	let queue = new FifoQueue();
	queue.push({node: origin, depth: 0});

	while (queue.length() != 0) {
		let current = queue.pop();

		if (current.depth >= maxDepth) {
			continue;
		}
		if (board.AllBallsInGoal(current.node.state, PC)) {
			continue;
		}
		branchFactor++;
		let player = (current.depth + 1) % 2;
		let ball = GameBoard.ballForPlayer(player);

		for(let i = 0; i < current.node.state.length; i++){
			if(current.node.state[i] == ball){
				for (let goal of board.getPossibleGoals(current.node.state, i)) {
					current.node.moves.push({src: i, dest: goal});
					let newState = current.node.state.slice();
					GameBoard.moveBall(newState, i, goal);

					let childN = {
						state : newState,
						children : [],
						moves : [],
						score : undefined,
						bestMove : undefined
					};
					current.node.children.push(childN);
					counterForNodes++;
					queue.push({
						node: childN,
						depth: current.depth + 1
					});

				}
			}
		}

	}

	return origin;

}
function constructStateTree(gState, board, maxDepth){
	turns++;
	let origin = {
		state : gState,
		score: undefined,
		child: undefined,
		bestMove: undefined
	}

	let flagAlphaAndBeta = true;

	if (flagAlphaAndBeta) {

		let alphaVal = Number.NEGATIVE_INFINITY;
		let betaVal = Number.POSITIVE_INFINITY;
		let highScore = TreeUsingAlphaAndBeta(origin, board, maxDepth, maxDepth, alphaVal, betaVal, true);
		return origin;

	} else {

		let t = makeTreeStates(origin, board, maxDepth);
		putScoresToStates(origin, board);
		return t;

	}

}

function stateEstimate(gState, board) {

	let distances = [0.0, 0.0];

	for (let i = 0; i < gState.length; i++) {

		let ball = gState[i];
		let player = GameBoard.playerForBall(ball);

		if (player != HumanPlayer && player != PC) {
			continue;
		}

		let loc = board.holePositions[i];
		let GoalPlace = board.HolePositionIndex(player);
		let targetLoc = board.holePositions[GoalPlace];
		let dx = loc.x - targetLoc.x;
		let dy = loc.y - targetLoc.y;
		distances[player] += Math.sqrt(dx * dx + dy * dy);

	}
	let score = distances[HumanPlayer] - distances[PC];

	return score;
}