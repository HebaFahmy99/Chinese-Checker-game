class GameBoard {
	constructor(canvasSize, jump, holeSize) {

		this.canvasSize = canvasSize;
		this.jumpLength = jump;
		this.holeSize = holeSize;

		this.holePositions = this.getHolePosition(jump);
		this.graph = this.makeGraph(this.holePositions, jump);

	}
	static moveBall(gState, src, dst) {
		let ball = gState[src];
		gState[src] = 0;
		gState[dst] = ball;}
	static ballForPlayer(p) {return p + 1;}
	static playerForBall(x) {return x - 1;}

	AllBallsInGoal(gState, p) {
		for (let holeNumber of this.HolesOfGoal(p)) {
			if (gState[holeNumber] != GameBoard.ballForPlayer(p)) {
				return false;
			}
		}

		return true;
	}
	holeSpace(m, n) {

		let vertix0 = this.holePositions[m];
		let vertix1 = this.holePositions[n];

		let d_x = vertix0.x - vertix1.x;
		let d_y = vertix0.y - vertix1.y;

		return Math.sqrt(d_x * d_x + d_y * d_y);

	}
	startState(counter) {
		let state = new Uint8Array(this.holePositions.length).fill(0);
		for (let p = 0; p < counter; p++) {
			for (let i of this.initialHole(p)) {
				state[i] = GameBoard.ballForPlayer(p);
			}
		}
		return state;
	}

	getPossibleGoals(gState, root) {

		let goalT = [];

		if ( gState[root] == 0 || root == null) {
			return;
		}

		this.addHole(root, gState, goalT);
		let nextStates = this.graph[root];
		for (var x = 0; x < nextStates.length; x++) {

			let nextSt = nextStates[x];
			let nextHole = gState[nextSt];
			if (!goalT.includes(nextSt) && nextHole == 0 ) {
				goalT.push(nextSt);
			}

		}

		return goalT;
	}

	addHole(ref, gState, goalT) {

		let nextStates = this.graph[ref];
		for (var x = 0; x < nextStates.length; x++) {

			let nextSt = nextStates[x];
			let nextHole = gState[nextSt];

			if (nextHole > 0) {
				let b = this.graph[nextSt][x];
				if (gState[b] == 0) {

					if (!goalT.includes(b)) {
						goalT.push(b);
						this.addHole(b, gState, goalT);
					}
				}
			}

		}

	}
	makeGraph(positions2, jump) {

		let graph = [];

		for (let i = 0; i < positions2.length; ++i) {

			let ix = [-1, -1, -1, -1, -1, -1];
			let pos0 = positions2[i];

			for (let k = 0; k < positions2.length; ++k) {

				let pos1 = positions2[k];
				let d_x = pos1.x - pos0.x;
				let d_y = pos1.y - pos0.y;
				if (Math.abs(Math.sqrt(d_x * d_x + d_y * d_y) - jump) <= 0.1) {
					const deg30 = Math.PI / 6.0;
					let angle = (Math.atan2(d_y, d_x) + Math.PI + deg30);
					let deter = Math.floor(angle / (2.0 * Math.PI) * 6);
					let slot = (deter == 6) ? 0 : deter;

					ix[slot] = k;

				}
			}

			graph.push(ix);

		}

		return graph;

	}

}

class NormalBoard extends GameBoard {
	constructor(canvasSize) {
		const holeHeight = 16;
		let min_s = Math.min(canvasSize.x, canvasSize.y);
		let jump = min_s / holeHeight;
		let holeSize = 0.85 * 0.5 * jump;

		super(canvasSize, jump, holeSize);

	}
		Triangle(jump) {
		let positions = [];
		let ptr = {x: 0, y:0};
		let rowL = 13;

		let sum_x = 0;
		let sum_y= 0;

		while (rowL > 0){
			for (let i = 0; i < rowL; i++) {
				positions.push({x: ptr.x, y: ptr.y});
				sum_x += ptr.x;
				sum_y += ptr.y;
				ptr.x += jump;
			}
			ptr.x -= rowL * jump;
			ptr.x += jump/2;
			ptr.y += Math.sqrt(3 / 4) * jump;
			rowL -= 1;
		}

		let avg_x = sum_x / positions.length;
		let avg_y = sum_y / positions.length;

		for (let i = 0; i < positions.length; i++){
			positions[i].x -= avg_x;
			positions[i].y -= avg_y;
		}

		return positions;
	}
	initialHole(p) {

		const s = [[81, 82, 83, 84, 85, 86, 87, 88, 89, 90],[120, 119, 118, 117, 116, 115, 114, 113, 112, 111],];
		const StartPC = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],[77, 82, 83, 78, 85, 86, 87, 88, 89, 90]];
		return s[p];
	}
	HolesOfGoal(p) {

		const goals = [
			[120, 119, 118, 117, 116, 115, 114, 113, 112, 111],[81, 82, 83, 84, 85, 86, 87, 88, 89, 90]]

		return goals[p];

	}

	HolePositionIndex(p) {

		const goalT = [120, 90];

		return goalT[p];

	}

	getHolePosition(jump) {
		let ui = this.Triangle(jump);
		let emptyTriangle = [];
		for (let pos of ui) {
			emptyTriangle.push({
				x: pos.x * Math.cos(Math.PI) - pos.y * Math.sin(Math.PI),
				y: pos.y * Math.cos(Math.PI) + pos.x * Math.sin(Math.PI)
			});
		}
		const Threshold = 0.5;

		let positions2 = ui;
		for (let pos of emptyTriangle) {
			if (this.addpos(pos, positions2, Threshold)) {
				positions2.push(pos);
			}
		}
		for (let i = 0; i < positions2.length; ++i) {
			positions2[i].x += 0.5 * this.canvasSize.x;
			positions2[i].y += 0.5 * this.canvasSize.y;
		}

		return positions2;
	}

	addpos(pos, board, thresh){
		for (let i = 0; i < board.length; i++){
			let dx = pos.x - board[i].x;
			let dy = pos.y - board[i].y;
			if (Math.sqrt(dx * dx + dy * dy) < thresh) {
				return false;
			}
		}
		return true;
	}



}