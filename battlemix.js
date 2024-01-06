// --- Math Library ---
// The following functions and types represent the numbers and math operations
// we can perform on them in the game.
//
// This is teaching the computer how to do arithmetic on mixed fractions.
//
// The code tries to follow the same process I would use when working these
// problems by hand.

// Euclid's Greatest Common Divisor
function gcd(a, b) {
	while (b != 0) {
		const t = b;
		b = a % b;
		a = t;
	}
	return a;
}

// Least common multiple
function lcm(a, b) {
	return Math.abs(a * b) / gcd(a, b);
}

// Represents a ratio between two integers
class Rational {
	constructor(numerator, denominator) {
		this.numerator = numerator;
		this.denominator = denominator;
	}
	
	// Create a Rational from a mixed fraction ([sign] whole + numerator / denominator).
	static fromMixed(whole, numerator, denominator) {
		const sign = whole < 0 ? -1 : 1;
		whole = Math.abs(whole);
		// It's kinda confusing how to write -1 1/2.
		// The way most people treat it, it's really -(1 + 1/2) or -1 + -1/2.
		// It doesn't really make sense to write a mixed number as -1 1/2 = 1/2.
		// But I can see how the confusion can arise. So either if we're initialized
		// with -whole, -numerator, do nothing, but if we're initialized as
		// -whole, +numerator, treat that as -whole, -numerator.
		if (sign < 0 && numerator > 0) {
			console.warn(`Rational.fromMixed: Interpreting -whole, +numerator as -whole, -numerator: -(${whole} + ${numerator}/${denominator}) instead of (-${whole}) + ${numerator}/${denominator}`);
			numerator = -numerator;
		}
		return new Rational(sign * whole * denominator + numerator, denominator);
	}
		
	// Simplify (reduce) the Rational
	simplified() {
		// Create a copy to hold the result.
		const result = new Rational(this.numerator, this.denominator);
		// Normalize negative denominator
		if (result.denominator < 0) {
			result.numerator = -result.numerator;
			result.denominator = -result.denominator;
		}
		// Simplify the fraction
		const gd = gcd(Math.abs(result.numerator), Math.abs(result.denominator));
		result.numerator /= gd;
		result.denominator /= gd;
		return result;
	}
	
	// Return the components of a mixed fraction representation:
	// [sign] whole + numerator / denominator
	// as an object: {nonnegative, whole, numerator, denominator}
	mixedFraction() {
		let numerator = this.numerator;
		let denominator = this.denominator;
		// Normalize negative denominator
		if (denominator < 0) {
			numerator = -numerator;
			denominator = -denominator;
		}
		let nonnegative = numerator >= 0;
		numerator = Math.abs(numerator);
		let whole = Math.floor(numerator / denominator);
		numerator = numerator % denominator;
		
		return { nonnegative, whole, numerator, denominator };
	}
	
	// Returns true if this is Rational is whole number (no fractional component)
	isIntegral() {
		return (this.numerator % this.denominator) == 0;
	}	
	
	toString() {
		let { nonnegative, whole, numerator, denominator } = this.mixedFraction();
		let str = '';
		// Print the sign if it's negative
		if (!nonnegative)
			str += '-';
		// Print the whole number part only if it's not 0 or if the fraction is 0
		if (whole != 0 || numerator == 0)
			str += whole;
		// Print the fractional part only if it's not 0
		if (numerator != 0) {
			if (whole != 0)
				str += ' ';
			str += `${numerator} / ${denominator}`
		}
		return str;
	}
	
	mathML() {
		let { nonnegative, whole, numerator, denominator } = this.mixedFraction();
		let str = ''
		if (!nonnegative)
			str += '<mo>-</mo>';
		// Print the whole number part only if it's not 0 or the fraction is 0
		if (whole != 0 || numerator == 0)
			str += `<mn>${whole}</mn>`;
		// Print the fractional part only if it's not 0
		if (numerator != 0)
			str += `<mfrac><mn>${numerator}</mn><mn>${denominator}</mn></mfrac>`;
		return str;
	}
	
	// Sum two rationals
	static add(lhs, rhs) {
		// Convert both lhs and rhs fractions to the same base so we can sum them.
		let base = lcm(lhs.denominator, rhs.denominator);
		let lhn = lhs.numerator * (base / lhs.denominator);
		let rhn = rhs.numerator * (base / rhs.denominator);
		
		let result = new Rational(lhn + rhn, base);
		// Simplify to reduce the fraction.
		return result.simplified();
	}
	
	// Subtract two rationals
	static subtract(lhs, rhs) {
		let base = lcm(lhs.denominator, rhs.denominator);
		let lhn = lhs.numerator * (base / lhs.denominator);
		let rhn = rhs.numerator * (base / rhs.denominator);
		
		let result = new Rational(lhn - rhn, base);
		return result.simplified();
	}
	
	lessThan(rhs) {
		let t = Rational.subtract(this, rhs); 
		return t.numerator < 0;
	}
}

class BinaryOperator {
	toString() { throw 'abstract' }
	func() { throw 'abstract' }
	
	mathML() { return `<mo>${this.toString()}</mo>`; }
	apply(lhs, rhs) { return this.func().apply(lhs, rhs); }
}

class AddOperator extends BinaryOperator {
	toString() { return "+" };
	func() { return Rational.add };
}

class SubtractOperator extends BinaryOperator {
	toString() { return "-" };
	func() { return Rational.subtract };
}

class BinaryExpression {
	// lhs: Left hand Rational number
	// operator: Operation on the rationals
	// rhs: Right hand Rational number
	constructor(lhs, operator, rhs) {
		this.lhs = lhs;
		this.operator = operator;
		this.rhs = rhs;
	}
	
	evaluate() {
		return this.operator.apply(null, [this.lhs, this.rhs]);
	}
	
	toString() {
		return `${this.lhs} ${this.operator} ${this.rhs}`;
	}
	
	mathML() {
		return `<math>${this.lhs.mathML()} ${this.operator.mathML()} ${this.rhs.mathML()}</math>`;
	}
}

// Unit tests for the math library.
function testLibrary() {
	function assert(lhs, op, rhs, expected) {
		const fn = op == '+' ? Rational.add : Rational.subtract;
		const result = fn.apply(null, [lhs, rhs]);
		console.assert(result.toString() == expected, `${lhs.toString()} ${op} ${rhs.toString()} should be ${expected}, but got ${result}`);
	}
	// test carries
	assert(new Rational(2, 3), '+', new Rational(2, 3), "1 1 / 3");
	// test borrows
	assert(Rational.fromMixed(9, 5, 8), '-', Rational.fromMixed(1, 2, 3), "7 23 / 24");
	// test negatives
	assert(Rational.fromMixed(0, 0, 1), '-', Rational.fromMixed(6, 1, 2), "-6 1 / 2");
	assert(Rational.fromMixed(0, 0, 1), '+', Rational.fromMixed(-6, -1, 2), "-6 1 / 2");
	
	// test comparisons
	function assertLt(lhs, rhs) {
		const result = lhs.lessThan(rhs);
		console.assert(lhs.lessThan(rhs), `Expected ${lhs.toString()} < ${rhs.toString()}`);
	}
	assertLt(new Rational(4, 1), new Rational(22, 3));
}

testLibrary();

// --- Game Board Generation ---
// The functions below generate the HTML that produces the printable game board.

// Utility to create an HTML element
function h(name) {
	return document.createElement(name);
}

// Represents the options for configuring a game
class GameOptions {
	constructor() {
		this.width = 5;
	}
}

// Random number generator
// Hat tip: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
class Random {
	// Construct a new random generator with an optional seed
	// seed: String (will be randomly generated otherwise).
	constructor(seed = Random.randomSeed()) {
		this.seed = seed;
		const seedHash = Random.cyrb128(seed);
		this.generator = Random.sfc32(...seed);
	}
	
	// Internal helper, returns Simple Fast Counter PRNG
	static sfc32(a, b, c, d) {
		return function() {
		  a |= 0; b |= 0; c |= 0; d |= 0; 
		  var t = (a + b | 0) + d | 0;
		  d = d + 1 | 0;
		  a = b ^ b >>> 9;
		  b = c + (c << 3) | 0;
		  c = (c << 21 | c >>> 11);
		  c = c + t | 0;
		  return (t >>> 0) / 4294967296;
		}
	}
	
	// Internal helper, returns 128 bit hash of a string, suitable for seeding PRNG.
	static cyrb128(str) {
		let h1 = 1779033703, h2 = 3144134277,
			h3 = 1013904242, h4 = 2773480762;
		for (let i = 0, k; i < str.length; i++) {
			k = str.charCodeAt(i);
			h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
			h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
			h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
			h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
		}
		h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
		h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
		h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
		h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
		h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
		return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
	}
	
	// Generate a random seed using JavaScript's built in Math.random.
	static randomSeed() {
		// alphanumerics without confusable letters / numbers
		let alpha = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
		function randrange(min, max) {
		  min = Math.ceil(min);
		  max = Math.floor(max);
		  return Math.floor(Math.random() * (max - min) + min);
		}
		let seed = '';
		for (let i = 0; i < 5; i++) {
			seed += alpha[randrange(0, alpha.length)];
		}
		return seed;
	}
	
	// Return a float in range 0 (inclusive) to 1 (exclusive)
	random() {
		return this.generator();
	}
	
	// Return an int in range min (inclusive) to max (exclusive)
	randrange(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(this.random() * (max - min) + min);
	}
}

// return a random number between min (inclusive) and max (exclusive)


// Convert an operator named like '+' or '-' to its BinaryOperator class.
function makeop(opname) {
	switch (opname) {
		case '+': return new AddOperator();
		case '-': return new SubtractOperator();
		default: throw `Unknown operator ${opname}`;
	}
}

// Represents the state of an entire game, meaning questions for each player.
// The answers are not stored directly, but are computed based on the questions.
class Game {
	// Construct a new game with random problems.
	// Options: {
	//   width = 5 : width of game board
	//   height = 5 : height of game board
	//	 mixedDenominators = false : whether problems can have mixed denominators in the fractional part.
	//   maxDenominator = 12 : largest fraction denominator
	//	 maxWhole = 9 : largest whole number component
	//	 operators = ['+', '-'] : Set of allowed arithmetic operators
	//	 seed = str : Random number generator seed.
	// }
	constructor(options) {		
		// Parse game options
		this.width = options?.width || 5;
		this.height = options?.height || 5;
		
		this.mixedDenominators = options?.mixedDenominators || false;
		this.maxDenominator = options?.maxDenominator || 12;
		this.maxWhole = options?.maxWhole || 9;
		this.operators = options?.operators || ['+', '-'];
		this.seed = options?.seed || Random.randomSeed();
		this.random = new Random(this.seed);
		
		// 3D array: player.row.column.
		this.questions = []

		for (let player = 0; player < 2; player++) {
			this.questions.push([]); // rows
			for (let row = 0; row < this.height; row++) {
				this.questions[player].push([]);
				for (let col = 0; col < this.width; col++) {
					this.questions[player][row][col] = this.genquestion();
				}
			}
		}
	}
	
	// internal utility to generate a new question
	genquestion() {
		const randrange = this.random.randrange.bind(this.random);
		
		let lhs, rhs, op;
		do {
			const lhd = randrange(1, this.maxDenominator + 1);
			const rhd = this.mixedDenominators ? randrange(1, this.maxDenominator + 1) : lhd;
			const lhn = randrange(0, lhd);
			const rhn = randrange(0, rhd);
			const lhw = randrange(0, this.maxWhole + 1);
			const rhw = randrange(0, this.maxWhole + 1);
		
			lhs = Rational.fromMixed(lhw, lhn, lhd);
			rhs = Rational.fromMixed(rhw, rhn, rhd);
		
			if (this.mixedDenominators) {
				lhs = lhs.simplified();
				rhs = rhs.simplified();
			}
		
			op = this.operators[randrange(0, this.operators.length)];
		
			if (op == '-' && lhs.lessThan(rhs)) {
				// avoid negative results
				let tmp = lhs;
				lhs = rhs;
				rhs = tmp;
			}
		// respin if both numbers are non-mixed fractions or if either number is exactly zero
		} while (lhs.isIntegral() && rhs.isIntegral() || lhs.numerator == 0 || rhs.numerator == 0)
				
		return new BinaryExpression(lhs, makeop(op), rhs);
	}
	
	// output html to the page
	writeHTML() {
		for (let player = 0; player < 2; player++) {
			// Get the seed HTML element and fill it in with the random number generator
			// seed. This way if the pages for each player get mixed up, the seed can
			// be used to group them back together.
			const seed = document.getElementById(`p${player+1}.seed`);
			seed.innerText = this.random.seed;
		
			// Get the HTML element containing the top half of this player's page.
			// This is where the player will place their battleships and where
			// the answers for the opposing player will be.
			const ocean = document.getElementById(`p${player+1}.ocean`);
			
			// Clear the ocean
			ocean.innerHTML = '';
			
			// Write the answers
			const answers = this.questions[(player + 1) % 2];
			ocean.append(this.makeTable(answers.map(row => row.map(cell => cell.evaluate()))))
			
			// Get the HTML element containing the bottom half of this player's page.
			// This is where the player will choose which cells to target in their
			// opponents ocean, and it contains the problems they must solve in order
			// to fire on their opponent.
			const radar = document.getElementById(`p${player+1}.radar`);
			
			// Clear the radar
			radar.innerHTML = '';
			
			// Write the questions
			const questions = this.questions[player];
			radar.append(this.makeTable(questions));
		}
	}
	
	// internal utility to generate a table of questions or answers
	// grid - a 2D [width][height] array of either BinaryExpressions (questions) or Rationals (answers)
	makeTable(grid) {
		const table = h('table');
		
		// write a header row of letters
		let header = h('tr');
		table.append(header);
		header.append(h('td')); // empty cell for upper left corner
		const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // nobody is gonna play a board bigger than 26, cmon.
		for (let col = 0; col < this.width; col++) {
			let th = h('th');
			th.innerText = alpha[col];
			header.append(th);
		}
		
		// write each row and column
		for (let row = 0; row < this.height; row++) {
			let tr = h('tr');
			table.append(tr);
			let th = h('th');
			th.innerText = `${row+1}`;
			tr.append(th);
			for (let col = 0; col < this.width; col++) {
				let td = h('td');
				td.innerHTML = `<math>${grid[row][col].mathML()}</math>`;
				tr.append(td);
			}
		}
		
		return table;
	}
}

function makeGame() {
	const add = document.getElementById('addition').checked;
	const sub = document.getElementById('subtraction').checked;
	
	const ops = [];
	if (add) ops.push('+')
	if (sub) ops.push('-')
	if (ops.length == 0) ops.push('+')
	
	const size = parseInt(document.getElementById('size').value);
	
	const options = {
		mixedDenominators: document.getElementById('mixedDenominators').checked,
		maxDenominator: parseInt(document.getElementById('maxDenominator').value),
		operators: ops,
		width: size,
		height: size
	};
	const game = new Game(options);
	game.writeHTML();
}

makeGame();

const inputs = Array.from(document.getElementsByTagName('input'));
inputs.forEach(input => {
	input.addEventListener('change', makeGame);
});
