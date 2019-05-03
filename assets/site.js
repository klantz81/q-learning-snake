var g = {
	button:null,

	canvas:null, ctx:null,

	dx:32, dy:32,
	w:12, h:12,
	width:null, height:null,

	t:-1, dt:0, elapsed:0,

	snake:[],
	food:null,
	direction:[1,0],
	next_direction:[1,0],

	frame_duration: 100,

	init: function() {
		g.button = document.getElementById('button');

		g.canvas = document.getElementById('canvas');
		g.ctx = g.canvas.getContext('2d');

		g.width = (g.w+1)*g.dx;
		g.height = (g.h+1)*g.dy;

		g.canvas.style.width = g.width+'px';
		g.canvas.style.height = g.height+'px';

		g.canvas.width = g.width;
		g.canvas.height = g.height;

		/*
		document.onkeydown = function(e) {	// user controls
			if (e.code == 'ArrowLeft' && g.direction[0] != 1)
				g.next_direction = [-1,0];
			else if (e.code == 'ArrowDown' && g.direction[1] != -1)
				g.next_direction = [0,1];
			else if (e.code == 'ArrowUp' && g.direction[1] != 1)
				g.next_direction = [0,-1];
			else if (e.code == 'ArrowRight' && g.direction[0] != -1)
				g.next_direction = [1,0];
		};
		*/

		g.button.onclick = function(e) {
			e.preventDefault();
			e.stopPropagation();

			g.frame_duration == 1 ? g.slow() : g.fast();
		};

		g.fast();
		g.reset();
		window.requestAnimationFrame(g.step);
	},

	fast: function() {
		g.button.innerHTML = 'Learning...';
		g.frame_duration = 1;
		q.learn();
	},

	slow: function() {
		g.button.innerHTML = 'Playing...';
		g.frame_duration = 100;
		q.play();
	},

	reset: function() {
		g.t = -1;
		g.elapsed = 0;
		g.snake = [[parseInt(g.w/2), parseInt(g.h/2)]];
		g.addFood();

		q.reset();
	},

	step: function(timestamp) {
		g.dt = g.t < 0 ? 0 : (timestamp - g.t);
		g.t = timestamp;

		g.render();

		window.requestAnimationFrame(g.step);
	},

	addFood: function() {
		do {
			g.food = [Math.round(Math.random()*g.w), Math.round(Math.random()*g.h)];
			for (var j = 0; j < g.snake.length; j++)
				if (g.food[0] == g.snake[j][0] && g.food[1] == g.snake[j][1]) {
					g.food = null;
					break;
				}
		} while (g.food == null);
	},

	clear: function() {
		g.ctx.clearRect(0, 0, g.width, g.height);
	},

	rect: function(x, y, w, h, c) {
		g.ctx.fillStyle = c;
		g.ctx.fillRect(x, y, w, h);
	},

	render: function() {
		g.elapsed += g.dt;
		if (g.elapsed >= g.frame_duration) {
			g.elapsed -= g.frame_duration;

			g.clear();


			var s0 = q.getState();
			var action = q.getAction(s0);

			g.direction = q.parseAction(action);
			//g.direction = g.next_direction;



			var l = [g.snake[0][0]+g.direction[0], g.snake[0][1]+g.direction[1]];

			var eaten = false;
			var alive = true;

			if (l[0] == g.food[0] && l[1] == g.food[1]) {	// check if food has been eaten
				eaten = true;
				g.addFood();
			} else {
				g.snake.pop();

				if (l[0] < 0 || l[0] > g.w || l[1] < 0 || l[1] > g.h)	// hit a wall
					alive = false;

				for (var j = 3; j < g.snake.length; j++)
					if (l[0] == g.snake[j][0] && l[1] == g.snake[j][1])	// hit snake body
						alive = false;

			}

			g.snake.splice(0, 0, l);



			var s1 = q.getState();
			var reward = eaten ? 1 : !alive ? -1 : 0;

			q.update(s0, action, s1, reward);



			if (!alive)
				g.reset();

			for (var j = 0; j < g.snake.length; j++)
				g.rect(g.snake[j][0]*g.dx,g.snake[j][1]*g.dy, g.dx-2, g.dy-2, '#77f');

			g.rect(g.food[0]*g.dx, g.food[1]*g.dy, g.dx-2, g.dy-2, '#7ff');

		}
	}
};

var q = {
	actions: ["left","forward","right"],
	learning_rate:0.1,
	discount_factor_0:0.99999,
	discount_factor:0.99999,
	table: {},
	learning: false,

	play: function() {
		q.learning = false;
	},

	learn: function() {
		q.learning = true;
	},

	reset: function() {
		q.discount_factor = q.discount_factor_0;
	},

	getAction: function(state) {
		if (q.learning && Math.random() < 0.3)
			return q.actions[Math.floor(Math.random() * 30000) % 3];

		var k1 = state + q.actions[0];
		var k2 = state + q.actions[1];
		var k3 = state + q.actions[2];

		var q1 = typeof(q.table[k1]) == "undefined" ? 0 : q.table[k1];
		var q2 = typeof(q.table[k2]) == "undefined" ? 0 : q.table[k2];
		var q3 = typeof(q.table[k3]) == "undefined" ? 0 : q.table[k3];

		if (q1 > q2 && q1 > q3)
			return q.actions[0];
		else if (q2 > q3)
			return q.actions[1];
		else
			return q.actions[2];
	},

	parseAction: function(a) {
		if (a == "forward") {
			return g.direction;
		} else if (a == "left") {
			if (g.direction[0] > 0)
				return [ 0,-1];
			else if (g.direction[0] < 0)
				return [ 0, 1];
			else if (g.direction[1] > 0)
				return [ 1, 0];
			else
				return [-1, 0]
		} else if (a == "right") {
			if (g.direction[0] > 0)
				return [ 0, 1];
			else if (g.direction[0] < 0)
				return [ 0,-1];
			else if (g.direction[1] > 0)
				return [-1, 0];
			else
				return [ 1, 0]
		}
	},

	getState: function() {
		var left = false, down = false, up = false, right = false;

		for (var j = 3; j < g.snake.length; j++) {	// impossible to hit part 0, 1, or 2
			if (g.snake[0][0] == g.snake[j][0] + 1 && g.snake[0][1] == g.snake[j][1])
				left = true;
			if (g.snake[0][0] == g.snake[j][0] && g.snake[0][1] == g.snake[j][1] - 1)
				down = true;
			if (g.snake[0][0] == g.snake[j][0] && g.snake[0][1] == g.snake[j][1] + 1)
				up = true;
			if (g.snake[0][0] == g.snake[j][0] - 1 && g.snake[0][1] == g.snake[j][1])
				right = true;
		}

		var state = [
			g.direction[0]+","+g.direction[1],

			g.snake[0][0] ==   0,	// wall directly left
			g.snake[0][1] == g.h,	// below
			g.snake[0][1] ==   0,	// above
			g.snake[0][0] == g.w,	// right

			left,
			down,
			up,
			right,

			g.food[0]  < g.snake[0][0],	// food left
			g.food[1]  > g.snake[0][1],	// food below
			g.food[1]  < g.snake[0][1],	// food above
			g.food[0]  > g.snake[0][0],	// food right

			""
		];

		return state.join(":");
	},

	update: function(state, action, new_state, reward) {
		if (!q.learning)
			return;

		var k0 = state + action;
		var q0 = typeof(q.table[k0]) == "undefined" ? 0 : q.table[k0];

		var k1 = new_state + q.actions[0];
		var k2 = new_state + q.actions[1];
		var k3 = new_state + q.actions[2];

		var q1 = typeof(q.table[k1]) == "undefined" ? 0 : q.table[k1];
		var q2 = typeof(q.table[k2]) == "undefined" ? 0 : q.table[k2];
		var q3 = typeof(q.table[k3]) == "undefined" ? 0 : q.table[k3];

		var q_max = Math.max(q1, q2, q3);

		var qn = (1 - q.learning_rate) * q0 + q.learning_rate * (reward + q.discount_factor * q_max);

		q.discount_factor *= q.discount_factor_0;

		q.table[k0] = qn;
	}
};
