// ============================================================
// AI BIGG BOSS - ALGORITHM ENGINE
// Each function accepts a seeded RNG and returns:
//   { score: 0-100, steps: number, log: string[], details: object }
// ============================================================

// Simple seeded LCG RNG
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─────────────────────────────────────────────
// TASK 1 – A* Maze Navigation
// ─────────────────────────────────────────────
function runAstar(seed) {
  const rng = makeRng(seed);
  const ROWS = 10, COLS = 10;
  const grid = [];

  // Build maze with ~25% obstacles
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = rng() < 0.25 ? 1 : 0; // 1 = wall
    }
  }
  grid[0][0] = 0;
  grid[ROWS-1][COLS-1] = 0;

  const heuristic = (r, c) => Math.abs(r - (ROWS-1)) + Math.abs(c - (COLS-1));
  const key = (r, c) => `${r},${c}`;

  const open = [{ r: 0, c: 0, g: 0, f: heuristic(0, 0), path: [] }];
  const closed = new Set();
  let explored = 0;
  let winner = null;

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    const k = key(cur.r, cur.c);
    if (closed.has(k)) continue;
    closed.add(k);
    explored++;

    if (cur.r === ROWS - 1 && cur.c === COLS - 1) {
      winner = cur;
      break;
    }

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === 0 && !closed.has(key(nr, nc))) {
        const g = cur.g + 1;
        open.push({ r: nr, c: nc, g, f: g + heuristic(nr, nc), path: [...cur.path, [nr, nc]] });
      }
    }
  }

  const pathLen = winner ? winner.path.length : 0;
  const maxPath = ROWS + COLS - 2;
  // Score: found path = high base, shorter = better
  const score = winner
    ? Math.round(100 - ((pathLen / maxPath) * 30) - ((explored / (ROWS*COLS)) * 20))
    : Math.round(rng() * 30); // failed to find – low score

  const log = [
    `Grid: ${ROWS}×${COLS} with ${Math.round(ROWS*COLS*0.25)} obstacles`,
    winner ? `Path found! Length: ${pathLen} steps` : `No path found (blocked maze)`,
    `Nodes explored: ${explored}`,
    `Score: ${Math.max(10, score)}`
  ];

  return {
    score: Math.max(10, Math.min(100, score)),
    steps: explored,
    log,
    details: { pathLen, explored, found: !!winner, grid }
  };
}

// ─────────────────────────────────────────────
// TASK 2 – Bidirectional BFS (Bridge the Islands)
// ─────────────────────────────────────────────
function runBidirectionalBFS(seed) {
  const rng = makeRng(seed);
  const N = 16; // 16 nodes
  const adj = Array.from({ length: N }, () => []);

  // Build random connected graph
  for (let i = 1; i < N; i++) {
    const parent = Math.floor(rng() * i);
    adj[i].push(parent);
    adj[parent].push(i);
  }
  // Add random extra edges
  const extraEdges = Math.floor(rng() * 8) + 4;
  for (let i = 0; i < extraEdges; i++) {
    const a = Math.floor(rng() * N);
    const b = Math.floor(rng() * N);
    if (a !== b) { adj[a].push(b); adj[b].push(a); }
  }

  const src = 0, dst = N - 1;
  const visitedF = new Map([[src, null]]);
  const visitedB = new Map([[dst, null]]);
  const qF = [src], qB = [dst];
  let meet = -1, steps = 0;

  while (qF.length && qB.length && meet === -1) {
    // Forward
    const sz = qF.length;
    for (let i = 0; i < sz; i++) {
      const u = qF.shift();
      for (const v of adj[u]) {
        if (!visitedF.has(v)) { visitedF.set(v, u); qF.push(v); }
        if (visitedB.has(v)) { meet = v; break; }
      }
      if (meet !== -1) break;
    }
    steps++;
    if (meet !== -1) break;

    // Backward
    const szB = qB.length;
    for (let i = 0; i < szB; i++) {
      const u = qB.shift();
      for (const v of adj[u]) {
        if (!visitedB.has(v)) { visitedB.set(v, u); qB.push(v); }
        if (visitedF.has(v)) { meet = v; break; }
      }
      if (meet !== -1) break;
    }
    steps++;
  }

  const totalVisited = visitedF.size + visitedB.size;
  const score = meet !== -1
    ? Math.round(100 - (totalVisited / N) * 40 - steps * 2)
    : Math.round(rng() * 20 + 10);

  const log = [
    `Network: ${N} nodes, ${adj.reduce((s, a) => s + a.length, 0) / 2} edges`,
    meet !== -1 ? `Meeting point found at node ${meet}` : `No connection found`,
    `BFS steps: ${steps}, Nodes visited: ${totalVisited}`,
    `Score: ${Math.max(10, score)}`
  ];

  return {
    score: Math.max(10, Math.min(100, score)),
    steps,
    log,
    details: { meet, totalVisited, N, adj }
  };
}

// ─────────────────────────────────────────────
// TASK 3 – DFS Cave Exploration
// ─────────────────────────────────────────────
function runDFS(seed) {
  const rng = makeRng(seed);
  const N = 20;
  const adj = Array.from({ length: N }, () => []);

  for (let i = 1; i < N; i++) {
    const parent = Math.floor(rng() * i);
    adj[i].push(parent);
    adj[parent].push(i);
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.floor(rng() * N), b = Math.floor(rng() * N);
    if (a !== b) { adj[a].push(b); adj[b].push(a); }
  }

  const visited = new Set();
  const order = [];
  let maxDepth = 0;

  function dfs(u, depth) {
    visited.add(u);
    order.push(u);
    maxDepth = Math.max(maxDepth, depth);
    // Shuffle neighbors for random exploration
    const neighbors = [...adj[u]].sort(() => rng() - 0.5);
    for (const v of neighbors) {
      if (!visited.has(v)) dfs(v, depth + 1);
    }
  }
  dfs(0, 0);

  const coverage = visited.size / N;
  const score = Math.round(coverage * 80 + (maxDepth / N) * 20);

  const log = [
    `Cave: ${N} chambers, target coverage: all`,
    `Chambers explored: ${visited.size}/${N} (${Math.round(coverage*100)}%)`,
    `Max depth reached: ${maxDepth}`,
    `Score: ${Math.min(100, score)}`
  ];

  return {
    score: Math.min(100, score),
    steps: visited.size,
    log,
    details: { coverage, maxDepth, order, N }
  };
}

// ─────────────────────────────────────────────
// TASK 4 – Maze Solver (Recursive Backtracking)
// ─────────────────────────────────────────────
function runMazeSolver(seed) {
  const rng = makeRng(seed);
  const ROWS = 9, COLS = 9;
  // Generate perfect maze via recursive backtracking
  const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const walls = Array.from({ length: ROWS }, () => new Array(COLS).fill(0b1111)); // N,E,S,W
  let wrongTurns = 0;

  function carve(r, c) {
    visited[r][c] = true;
    const dirs = [[0,1,1,3],[1,0,2,0],[-1,0,0,2],[0,-1,3,1]]; // [dr,dc,removeWall,oppWall]
    dirs.sort(() => rng() - 0.5);
    for (const [dr, dc, w, ow] of dirs) {
      const nr = r + dr * 2, nc = c + dc * 2;
      const mr = r + dr, mc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
        walls[r][c] &= ~(1 << w);
        walls[nr][nc] &= ~(1 << ow);
        visited[mr][mc] = true;
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);

  // Solve maze with right-hand rule
  let r = 0, c = 0;
  let solveSteps = 0;

  const solveVisited = new Set();
  const stack = [[0, 0]];
  const solveSet = new Set(['0,0']);
  let found = false;

  while (stack.length > 0 && solveSteps < 300) {
    const [cr, cc] = stack[stack.length - 1];
    solveSteps++;
    if (cr === ROWS - 1 && cc === COLS - 1) { found = true; break; }

    const moves = [];
    // N,E,S,W mapped to bits 0,1,2,3
    const checkDirs = [[-1,0,0],[0,1,1],[1,0,2],[0,-1,3]];
    for (const [dr, dc, bit] of checkDirs) {
      const nr = cr+dr, nc = cc+dc;
      if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !(walls[cr][cc] & (1<<bit))) {
        moves.push([nr, nc]);
      }
    }

    const unvisitedMoves = moves.filter(([nr,nc]) => !solveSet.has(`${nr},${nc}`));
    if (unvisitedMoves.length > 0) {
      const [nr, nc] = unvisitedMoves[Math.floor(rng() * unvisitedMoves.length)];
      solveSet.add(`${nr},${nc}`);
      stack.push([nr, nc]);
    } else {
      wrongTurns++;
      stack.pop();
    }
  }

  const optimal = (ROWS - 1) + (COLS - 1);
  const score = found
    ? Math.round(100 - (wrongTurns / optimal) * 40 - (solveSteps / 300) * 20)
    : Math.round(rng() * 25 + 5);

  const log = [
    `Maze: ${ROWS}×${COLS} perfect maze generated`,
    found ? `Maze solved in ${solveSteps} steps!` : `Maze not fully solved`,
    `Wrong turns (backtracks): ${wrongTurns}`,
    `Score: ${Math.max(10, score)}`
  ];

  return {
    score: Math.max(10, Math.min(100, score)),
    steps: solveSteps,
    log,
    details: { found, wrongTurns, solveSteps, ROWS, COLS }
  };
}

// ─────────────────────────────────────────────
// TASK 5 – Treasure Hunt (Uniform Cost Search)
// ─────────────────────────────────────────────
function runUCS(seed) {
  const rng = makeRng(seed);
  const ROWS = 8, COLS = 8;
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = Math.floor(rng() * 9) + 1; // cost 1-9
    }
  }

  const goal = [ROWS - 1, COLS - 1];
  const dist = Array.from({ length: ROWS }, () => new Array(COLS).fill(Infinity));
  dist[0][0] = 0;

  // Min-heap via sorted array (ok for small grids)
  const pq = [{ r: 0, c: 0, cost: 0 }];
  let expanded = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => a.cost - b.cost);
    const { r, c, cost } = pq.shift();
    if (r === goal[0] && c === goal[1]) break;
    if (cost > dist[r][c]) continue;
    expanded++;

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = r+dr, nc = c+dc;
      if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
        const nc_ = cost + grid[nr][nc];
        if (nc_ < dist[nr][nc]) {
          dist[nr][nc] = nc_;
          pq.push({ r: nr, c: nc, cost: nc_ });
        }
      }
    }
  }

  const treasureCost = dist[goal[0]][goal[1]];
  const maxCost = ROWS * COLS * 9;
  const found = treasureCost < Infinity;
  const score = found ? Math.round(100 - (treasureCost / maxCost) * 60 - (expanded/(ROWS*COLS))*20) : 10;

  const log = [
    `Weighted grid: ${ROWS}×${COLS}`,
    found ? `Treasure reached! Cost: ${treasureCost}` : `Treasure unreachable`,
    `Nodes expanded: ${expanded}`,
    `Score: ${Math.max(10, score)}`
  ];

  return {
    score: Math.max(10, Math.min(100, score)),
    steps: expanded,
    log,
    details: { treasureCost, expanded, found, grid }
  };
}

// ─────────────────────────────────────────────
// TASK 6 – Hill Climbing (Mountain Climber)
// ─────────────────────────────────────────────
function runHillClimbing(seed) {
  const rng = makeRng(seed);
  const N = 50;
  // Fitness landscape: multi-modal sinusoidal
  const fitness = x => Math.sin(x * 0.3) * 40 + Math.sin(x * 0.7) * 30 + Math.cos(x * 0.15) * 20 + 60;

  let current = Math.floor(rng() * N);
  let currentFit = fitness(current);
  const history = [{ x: current, f: currentFit }];
  let steps = 0;
  let localMaxHits = 0;

  while (steps < 100) {
    steps++;
    const neighbors = [];
    if (current > 0) neighbors.push(current - 1);
    if (current < N - 1) neighbors.push(current + 1);

    const best = neighbors.reduce((b, n) => fitness(n) > fitness(b) ? n : b, neighbors[0]);
    const bestFit = fitness(best);

    if (bestFit > currentFit) {
      current = best;
      currentFit = bestFit;
      history.push({ x: current, f: currentFit });
    } else {
      localMaxHits++;
      // Random restart
      if (localMaxHits <= 3) {
        current = Math.floor(rng() * N);
        currentFit = fitness(current);
      } else {
        break;
      }
    }
  }

  const globalMax = Math.max(...Array.from({ length: N }, (_, i) => fitness(i)));
  const ratio = currentFit / globalMax;
  const score = Math.round(ratio * 90 + (1 - steps/100) * 10);

  const log = [
    `Landscape: ${N} positions, multi-modal fitness`,
    `Peak fitness reached: ${currentFit.toFixed(2)} / ${globalMax.toFixed(2)}`,
    `Steps taken: ${steps}, Restarts: ${localMaxHits}`,
    `Score: ${Math.min(100, score)}`
  ];

  return {
    score: Math.min(100, Math.max(10, score)),
    steps,
    log,
    details: { currentFit, globalMax, history, N }
  };
}

// ─────────────────────────────────────────────
// TASK 7 – Minimax Strategy Battle (Tic-Tac-Toe)
// ─────────────────────────────────────────────
function runMinimax(seed) {
  const rng = makeRng(seed);

  function checkWinner(board) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) {
      if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
    }
    return board.includes(null) ? null : 'draw';
  }

  function minimax(board, isMax, depth, alpha, beta) {
    const winner = checkWinner(board);
    if (winner === 'X') return 10 - depth;
    if (winner === 'O') return depth - 10;
    if (winner === 'draw') return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'X';
          best = Math.max(best, minimax(board, false, depth+1, alpha, beta));
          board[i] = null;
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = 'O';
          best = Math.min(best, minimax(board, true, depth+1, alpha, beta));
          board[i] = null;
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    }
  }

  const board = new Array(9).fill(null);
  let moves = 0;
  let result = '';
  const skillLevel = rng(); // 0=bad, 1=perfect AI

  // Simulate game: X = contestant AI (minimax), O = random opponent
  while (!checkWinner(board)) {
    // X move (AI)
    const emptyCells = board.map((v,i)=>v===null?i:-1).filter(i=>i>=0);
    if (emptyCells.length === 0) break;

    let xMove;
    if (skillLevel > 0.4) {
      // Minimax move
      let best = -Infinity, bestIdx = emptyCells[0];
      for (const idx of emptyCells) {
        board[idx] = 'X';
        const val = minimax(board, false, 0, -Infinity, Infinity);
        board[idx] = null;
        if (val > best) { best = val; bestIdx = idx; }
      }
      xMove = bestIdx;
    } else {
      xMove = emptyCells[Math.floor(rng() * emptyCells.length)];
    }
    board[xMove] = 'X';
    moves++;
    if (checkWinner(board)) break;

    // O move (random)
    const emptyCells2 = board.map((v,i)=>v===null?i:-1).filter(i=>i>=0);
    if (emptyCells2.length === 0) break;
    const oMove = emptyCells2[Math.floor(rng() * emptyCells2.length)];
    board[oMove] = 'O';
    moves++;
  }

  result = checkWinner(board);
  const score = result === 'X' ? Math.round(85 + rng() * 15)
    : result === 'draw' ? Math.round(50 + rng() * 20)
    : Math.round(10 + rng() * 30);

  const log = [
    `Strategy Battle: 3×3 Tic-Tac-Toe vs Random Opponent`,
    `AI skill level: ${(skillLevel * 100).toFixed(0)}%`,
    `Result: ${result === 'X' ? '🏆 Victory!' : result === 'draw' ? '🤝 Draw' : '❌ Defeat'}`,
    `Score: ${score}`
  ];

  return {
    score: Math.min(100, score),
    steps: moves,
    log,
    details: { result, moves, board, skillLevel }
  };
}

// ─────────────────────────────────────────────
// TASK 8 – Genetic Algorithm Evolution Race
// ─────────────────────────────────────────────
function runGeneticAlgorithm(seed) {
  const rng = makeRng(seed);
  const TARGET = 'BIGGBOSS';
  const GENES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const POP = 20, GENS = 50, MUTATION = 0.1;
  const L = TARGET.length;

  const randomGene = () => GENES[Math.floor(rng() * GENES.length)];
  const randomChromosome = () => Array.from({ length: L }, randomGene).join('');
  const fitness = chr => chr.split('').filter((c,i) => c === TARGET[i]).length / L;

  let population = Array.from({ length: POP }, randomChromosome);
  let bestFitness = 0;
  let bestChromosome = population[0];
  let generations = 0;

  for (let gen = 0; gen < GENS; gen++) {
    generations++;
    // Evaluate
    const evaluated = population.map(chr => ({ chr, fit: fitness(chr) }));
    evaluated.sort((a, b) => b.fit - a.fit);
    bestFitness = evaluated[0].fit;
    bestChromosome = evaluated[0].chr;
    if (bestFitness === 1) break;

    // Select top 50%
    const survivors = evaluated.slice(0, POP / 2).map(e => e.chr);

    // Crossover + mutate
    const newPop = [...survivors];
    while (newPop.length < POP) {
      const p1 = survivors[Math.floor(rng() * survivors.length)];
      const p2 = survivors[Math.floor(rng() * survivors.length)];
      const crossPt = Math.floor(rng() * L);
      let child = p1.slice(0, crossPt) + p2.slice(crossPt);
      // Mutation
      child = child.split('').map(c => rng() < MUTATION ? randomGene() : c).join('');
      newPop.push(child);
    }
    population = newPop;
  }

  const score = Math.round(bestFitness * 80 + (1 - generations/GENS) * 20);

  const log = [
    `Target: "${TARGET}" | Population: ${POP} | Generations: ${GENS}`,
    `Best evolved: "${bestChromosome}" (fitness: ${(bestFitness*100).toFixed(0)}%)`,
    `Converged in: ${generations} generations`,
    `Score: ${Math.min(100, score)}`
  ];

  return {
    score: Math.min(100, Math.max(10, score)),
    steps: generations,
    log,
    details: { bestFitness, bestChromosome, generations, TARGET }
  };
}

// ─────────────────────────────────────────────
// TASK REGISTRY
// ─────────────────────────────────────────────
const TASKS = [
  {
    id: 1,
    name: 'Escape the Labyrinth',
    algorithm: 'A* Search',
    icon: '🌀',
    description: 'Navigate a random 10×10 maze from start to exit using the A* algorithm.',
    longDescription: `Each contestant is placed at the entrance of a randomly generated 10×10 maze filled with obstacles. Using the A* Search algorithm — which combines the actual path cost with a heuristic estimate of remaining distance — contestants must find the shortest route to the exit.\n\n🔑 Scoring: Finding the path earns a high base score. Shorter paths and fewer nodes explored means a higher score. Failing to find a path gives a very low score.`,
    color: '#7c3aed',
    image: 'images/task1.png',
    run: runAstar
  },
  {
    id: 2,
    name: 'Bridge the Islands',
    algorithm: 'Bidirectional BFS',
    icon: '🌉',
    description: 'Connect two distant nodes in a random network using Bidirectional BFS.',
    longDescription: `Contestants face a randomly wired network of 16 nodes. Their mission: connect Node 0 (the source island) to Node 15 (the destination island) as efficiently as possible.\n\nBidirectional BFS launches two simultaneous search waves — one from each end — and scores highest when they meet in the middle quickly with minimal nodes visited.\n\n🔑 Scoring: Faster meeting point + fewer total visits = higher score.`,
    color: '#0891b2',
    image: 'images/task2.png',
    run: runBidirectionalBFS
  },
  {
    id: 3,
    name: 'Cave Expedition',
    algorithm: 'Depth-First Search',
    icon: '🦇',
    description: 'Explore a 20-chamber cave system using DFS. More coverage = more points.',
    longDescription: `Deep underground lies a 20-chamber cave network with twisting, branching passages. Contestants must explore as many chambers as possible using Depth-First Search — diving as deep as possible before backtracking.\n\nThe cave graph is randomly generated each run with extra cross-passages to make exploration unpredictable.\n\n🔑 Scoring: 80% weight on coverage (chambers explored), 20% weight on max depth reached.`,
    color: '#b45309',
    image: 'images/task3.png',
    run: runDFS
  },
  {
    id: 4,
    name: 'Maze Master',
    algorithm: 'Maze Solver',
    icon: '🏛️',
    description: 'Solve a 9×9 perfect maze using recursive backtracking. Fewer wrong turns = higher score.',
    longDescription: `A guaranteed-solvable 9×9 perfect maze is carved using recursive backtracking. Contestants then attempt to navigate from corner to corner using a stack-based solver.\n\nEvery dead end discovered requires backtracking, which counts as a "wrong turn" penalty. The contestant who finds the exit with the fewest wrong turns wins this task.\n\n🔑 Scoring: Based on wrong turns taken vs optimal path length, and total steps to solve.`,
    color: '#059669',
    image: 'images/task4.png',
    run: runMazeSolver
  },
  {
    id: 5,
    name: 'Treasure Hunt',
    algorithm: 'Uniform Cost Search',
    icon: '💎',
    description: 'Find the lowest-cost path to hidden treasure on a weighted 8×8 grid using UCS.',
    longDescription: `A treasure chest is hidden at the far corner of an 8×8 grid. Every cell has a randomly assigned terrain cost (1–9). Contestants use Uniform Cost Search to find the guaranteed cheapest possible route — always expanding the lowest-cumulative-cost frontier node.\n\nUnlike A*, UCS has no heuristic — it relies purely on actual accumulated cost.\n\n🔑 Scoring: Lower total path cost = higher score. Fewer node expansions is a bonus.`,
    color: '#d97706',
    image: 'images/task5.png',
    run: runUCS
  },
  {
    id: 6,
    name: 'Mountain Climber',
    algorithm: 'Hill Climbing',
    icon: '⛰️',
    description: 'Maximize fitness on a rugged landscape using Hill Climbing with random restarts.',
    longDescription: `Contestants face a multi-modal sinusoidal fitness landscape with many peaks and valleys. Starting from a random position, they must climb to the highest fitness point using Hill Climbing — always moving to the neighbor with higher fitness.\n\nWhen stuck at a local maximum, contestants can restart up to 3 times. The challenge: find the global peak, not just a local one.\n\n🔑 Scoring: Ratio of fitness achieved vs global maximum. Faster convergence = bonus points.`,
    color: '#dc2626',
    image: 'images/task6.png',
    run: runHillClimbing
  },
  {
    id: 7,
    name: 'Strategy Showdown',
    algorithm: 'Minimax (α-β)',
    icon: '♟️',
    description: 'Win at Tic-Tac-Toe against a random opponent using the Minimax algorithm.',
    longDescription: `It's war on the 3×3 board. Each contestant plays as X against a random O opponent. Contestants with higher skill deploy the full Minimax algorithm with Alpha-Beta pruning to calculate the optimal move at every turn.\n\nMinMax guarantees the best possible outcome by anticipating all opponent responses. Alpha-Beta pruning cuts unnecessary branches, making the search lightning-fast.\n\n🔑 Scoring: Win = 85–100 pts, Draw = 50–70 pts, Loss = 10–40 pts.`,
    color: '#7c3aed',
    image: 'images/task7.png',
    run: runMinimax
  },
  {
    id: 8,
    name: 'Evolution Race',
    algorithm: 'Genetic Algorithm',
    icon: '🧬',
    description: 'Evolve the string "BIGGBOSS" through mutation and crossover. Highest fitness wins.',
    longDescription: `The final and most epic task: evolution itself. A population of 20 random 8-letter chromosome strings must evolve toward the target string "BIGGBOSS" through natural selection.\n\nEach generation: the fittest 50% survive, reproduce via crossover (mixing parent genes), and undergo random mutations. Over up to 50 generations, contestants race to achieve maximum fitness.\n\n🔑 Scoring: Final fitness = % characters matching target. Faster convergence earns bonus points.`,
    color: '#be185d',
    image: 'images/task8.png',
    run: runGeneticAlgorithm
  }
];
