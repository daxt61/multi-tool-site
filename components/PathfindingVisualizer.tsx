import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, RotateCcw, MousePointer2, BrickWall, Target, Flag, Settings2, Info, FastForward, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- Constants ---
const ROWS = 20;
const COLS = Math.floor(window.innerWidth > 1024 ? 40 : window.innerWidth > 768 ? 30 : 20);

type NodeType = 'empty' | 'wall' | 'start' | 'target' | 'visited' | 'path';
type Algorithm = 'dijkstra' | 'astar' | 'bfs' | 'dfs';

interface Node {
  row: number;
  col: number;
  type: NodeType;
  distance: number;
  heuristic: number;
  isVisited: boolean;
  previousNode: Node | null;
}

// --- Helper Functions ---
const createInitialGrid = (startPos: { r: number, c: number }, targetPos: { r: number, c: number }): Node[][] => {
  const grid: Node[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Node[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        row: r,
        col: c,
        type: (r === startPos.r && c === startPos.c) ? 'start' : (r === targetPos.r && c === targetPos.c) ? 'target' : 'empty',
        distance: Infinity,
        heuristic: Infinity,
        isVisited: false,
        previousNode: null,
      });
    }
    grid.push(row);
  }
  return grid;
};

export function PathfindingVisualizer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [startPos, setStartPos] = useState(initialData?.startPos || { r: 5, c: 5 });
  const [targetPos, setTargetPos] = useState(initialData?.targetPos || { r: ROWS - 6, c: COLS - 6 });
  const [grid, setGrid] = useState<Node[][]>(() => createInitialGrid(startPos, targetPos));
  const [algorithm, setAlgorithm] = useState<Algorithm>(initialData?.algorithm || 'dijkstra');
  const [speed, setSpeed] = useState(initialData?.speed || 10);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [interactionMode, setInteractionType] = useState<'wall' | 'moveStart' | 'moveTarget'>('wall');

  const gridRef = useRef<Node[][]>(grid);
  const isVisualizingRef = useRef(false);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    isVisualizingRef.current = isVisualizing;
  }, [isVisualizing]);

  useEffect(() => {
    onStateChange?.({ startPos, targetPos, algorithm, speed });
  }, [startPos, targetPos, algorithm, speed, onStateChange]);

  // --- Algorithms Logic ---

  const getNeighbors = (node: Node, currentGrid: Node[][]) => {
    const neighbors: Node[] = [];
    const { row, col } = node;
    if (row > 0) neighbors.push(currentGrid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(currentGrid[row + 1][col]);
    if (col > 0) neighbors.push(currentGrid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(currentGrid[row][col + 1]);
    return neighbors.filter(neighbor => neighbor.type !== 'wall');
  };

  const getDistance = (nodeA: Node, nodeB: Node) => {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
  };

  const dijkstra = (currentGrid: Node[][]) => {
    const visitedNodesInOrder: Node[] = [];
    const startNode = currentGrid[startPos.r][startPos.c];
    const targetNode = currentGrid[targetPos.r][targetPos.c];
    startNode.distance = 0;
    const unvisitedNodes = currentGrid.flat();

    while (unvisitedNodes.length) {
      unvisitedNodes.sort((a, b) => a.distance - b.distance);
      const closestNode = unvisitedNodes.shift();

      if (!closestNode || closestNode.distance === Infinity) return visitedNodesInOrder;

      closestNode.isVisited = true;
      visitedNodesInOrder.push(closestNode);

      if (closestNode === targetNode) return visitedNodesInOrder;

      const neighbors = getNeighbors(closestNode, currentGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
          const newDistance = closestNode.distance + 1;
          if (newDistance < neighbor.distance) {
            neighbor.distance = newDistance;
            neighbor.previousNode = closestNode;
          }
        }
      }
    }
    return visitedNodesInOrder;
  };

  const astar = (currentGrid: Node[][]) => {
    const visitedNodesInOrder: Node[] = [];
    const startNode = currentGrid[startPos.r][startPos.c];
    const targetNode = currentGrid[targetPos.r][targetPos.c];
    startNode.distance = 0;
    startNode.heuristic = getDistance(startNode, targetNode);
    const unvisitedNodes = [startNode];

    while (unvisitedNodes.length) {
      unvisitedNodes.sort((a, b) => (a.distance + a.heuristic) - (b.distance + b.heuristic));
      const currentNode = unvisitedNodes.shift();

      if (!currentNode || currentNode.distance === Infinity) return visitedNodesInOrder;

      currentNode.isVisited = true;
      visitedNodesInOrder.push(currentNode);

      if (currentNode === targetNode) return visitedNodesInOrder;

      const neighbors = getNeighbors(currentNode, currentGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
          const tentativeDistance = currentNode.distance + 1;
          if (tentativeDistance < neighbor.distance) {
            neighbor.previousNode = currentNode;
            neighbor.distance = tentativeDistance;
            neighbor.heuristic = getDistance(neighbor, targetNode);
            if (!unvisitedNodes.includes(neighbor)) {
              unvisitedNodes.push(neighbor);
            }
          }
        }
      }
    }
    return visitedNodesInOrder;
  };

  const bfs = (currentGrid: Node[][]) => {
    const visitedNodesInOrder: Node[] = [];
    const startNode = currentGrid[startPos.r][startPos.c];
    const targetNode = currentGrid[targetPos.r][targetPos.c];
    const queue = [startNode];
    startNode.isVisited = true;

    while (queue.length) {
      const currentNode = queue.shift()!;
      visitedNodesInOrder.push(currentNode);

      if (currentNode === targetNode) return visitedNodesInOrder;

      const neighbors = getNeighbors(currentNode, currentGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
          neighbor.isVisited = true;
          neighbor.previousNode = currentNode;
          queue.push(neighbor);
        }
      }
    }
    return visitedNodesInOrder;
  };

  const dfs = (currentGrid: Node[][]) => {
    const visitedNodesInOrder: Node[] = [];
    const startNode = currentGrid[startPos.r][startPos.c];
    const targetNode = currentGrid[targetPos.r][targetPos.c];
    const stack = [startNode];

    while (stack.length) {
      const currentNode = stack.pop()!;
      if (currentNode.isVisited) continue;

      currentNode.isVisited = true;
      visitedNodesInOrder.push(currentNode);

      if (currentNode === targetNode) return visitedNodesInOrder;

      const neighbors = getNeighbors(currentNode, currentGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
          neighbor.previousNode = currentNode;
          stack.push(neighbor);
        }
      }
    }
    return visitedNodesInOrder;
  };

  const getPath = (targetNode: Node) => {
    const path: Node[] = [];
    let currentNode: Node | null = targetNode;
    while (currentNode !== null) {
      path.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }
    return path;
  };

  // --- Animation ---

  const animate = async (visitedNodesInOrder: Node[], path: Node[]) => {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        for (let j = 0; j < path.length; j++) {
          const node = path[j];
          if (node.type !== 'start' && node.type !== 'target') {
            updateNode(node.row, node.col, { type: 'path' });
          }
          await new Promise(r => setTimeout(r, 50));
        }
        setIsVisualizing(false);
        return;
      }
      const node = visitedNodesInOrder[i];
      if (node.type !== 'start' && node.type !== 'target') {
        updateNode(node.row, node.col, { type: 'visited' });
      }
      await new Promise(r => setTimeout(r, speed));
    }
  };

  const visualize = () => {
    if (isVisualizing) return;
    setIsVisualizing(true);
    clearPath();
    const currentGrid = grid.map(row => row.map(node => ({ ...node, distance: Infinity, heuristic: Infinity, isVisited: false, previousNode: null })));
    setGrid(currentGrid);

    let visitedNodesInOrder: Node[] = [];
    switch (algorithm) {
      case 'dijkstra': visitedNodesInOrder = dijkstra(currentGrid); break;
      case 'astar': visitedNodesInOrder = astar(currentGrid); break;
      case 'bfs': visitedNodesInOrder = bfs(currentGrid); break;
      case 'dfs': visitedNodesInOrder = dfs(currentGrid); break;
    }

    const targetNode = currentGrid[targetPos.r][targetPos.c];
    const path = getPath(targetNode);
    animate(visitedNodesInOrder, path);
  };

  // --- Interaction ---

  const updateNode = (row: number, col: number, props: Partial<Node>) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[row] = [...newGrid[row]];
      newGrid[row][col] = { ...newGrid[row][col], ...props };
      return newGrid;
    });
  };

  const handleMouseDown = (row: number, col: number) => {
    if (isVisualizing) return;
    setMouseIsPressed(true);
    const node = grid[row][col];
    if (node.type === 'start') {
      setInteractionType('moveStart');
    } else if (node.type === 'target') {
      setInteractionType('moveTarget');
    } else {
      setInteractionType('wall');
      toggleWall(row, col);
    }
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!mouseIsPressed || isVisualizing) return;
    if (interactionMode === 'moveStart') {
      if (grid[row][col].type !== 'target' && grid[row][col].type !== 'wall') {
        updateNode(startPos.r, startPos.c, { type: 'empty' });
        setStartPos({ r: row, c: col });
        updateNode(row, col, { type: 'start' });
      }
    } else if (interactionMode === 'moveTarget') {
      if (grid[row][col].type !== 'start' && grid[row][col].type !== 'wall') {
        updateNode(targetPos.r, targetPos.c, { type: 'empty' });
        setTargetPos({ r: row, c: col });
        updateNode(row, col, { type: 'target' });
      }
    } else if (interactionMode === 'wall') {
      toggleWall(row, col);
    }
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
  };

  const toggleWall = (row: number, col: number) => {
    const node = grid[row][col];
    if (node.type === 'empty') {
      updateNode(row, col, { type: 'wall' });
    } else if (node.type === 'wall') {
      updateNode(row, col, { type: 'empty' });
    }
  };

  const clearGrid = () => {
    if (isVisualizing) return;
    setGrid(createInitialGrid(startPos, targetPos));
  };

  const clearPath = () => {
    if (isVisualizing) return;
    setGrid(prev => prev.map(row => row.map(node => {
      if (node.type === 'visited' || node.type === 'path') {
        return { ...node, type: 'empty', distance: Infinity, heuristic: Infinity, isVisited: false, previousNode: null };
      }
      return { ...node, distance: Infinity, heuristic: Infinity, isVisited: false, previousNode: null };
    })));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="algo-select" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('sorting.algorithm')}</label>
              <select
                id="algo-select"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                disabled={isVisualizing}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white disabled:opacity-50"
              >
                <option value="astar">A* Search</option>
                <option value="dijkstra">Dijkstra's Algorithm</option>
                <option value="bfs">Breadth-First Search</option>
                <option value="dfs">Depth-First Search</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                 <label htmlFor="speed-range" className="text-[10px] font-bold text-slate-400 uppercase">{t('sorting.speed')}</label>
                 <span className="text-[10px] font-bold text-indigo-500">{speed}ms</span>
              </div>
              <input
                id="speed-range"
                type="range"
                min="1"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                disabled={isVisualizing}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
              />
            </div>

            <div className="pt-4 space-y-2">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <div className="w-4 h-4 bg-indigo-500 rounded-sm" /> Start Node (Drag to move)
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <div className="w-4 h-4 bg-rose-500 rounded-sm" /> Target Node (Drag to move)
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <BrickWall className="w-4 h-4 text-slate-400" /> Wall (Click/Drag to draw)
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
           <div className="flex flex-wrap gap-3">
              <button
                onClick={visualize}
                disabled={isVisualizing}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" /> Visualize Path
              </button>
              <button
                onClick={clearPath}
                disabled={isVisualizing}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Clear Path
              </button>
              <button
                onClick={clearGrid}
                disabled={isVisualizing}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" /> Reset Grid
              </button>
           </div>

           <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
                 {algorithm === 'dijkstra' && "Dijkstra's Algorithm is weighted and guarantees the shortest path."}
                 {algorithm === 'astar' && "A* Search uses heuristics to find the shortest path much faster than Dijkstra's."}
                 {algorithm === 'bfs' && "Breadth-First Search is unweighted and guarantees the shortest path."}
                 {algorithm === 'dfs' && "Depth-First Search is unweighted and does not guarantee the shortest path."}
              </p>
           </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar select-none">
        <div
          className="grid gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mx-auto"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(1.5rem, 1fr))`,
            width: 'fit-content'
          }}
        >
          {grid.map((row, r) =>
            row.map((node, c) => (
              <div
                key={`${r}-${c}`}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                className={`w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300 ${
                  node.type === 'start' ? 'bg-indigo-500 scale-90 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]' :
                  node.type === 'target' ? 'bg-rose-500 scale-90 rounded-sm shadow-[0_0_10px_rgba(244,63,94,0.8)]' :
                  node.type === 'wall' ? 'bg-slate-700 dark:bg-slate-400' :
                  node.type === 'visited' ? 'bg-indigo-100 dark:bg-indigo-900/20 scale-95 border-none' :
                  node.type === 'path' ? 'bg-amber-400 dark:bg-amber-500 scale-100 border-none animate-bounce' :
                  'bg-white dark:bg-slate-900'
                }`}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> User Guide
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Drag the <span className="text-indigo-500 font-bold">Blue Circle</span> to change start point and the <span className="text-rose-500 font-bold">Red Square</span> to change target. Click or drag on empty squares to draw <span className="font-bold">Walls</span>.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FastForward className="w-4 h-4 text-indigo-500" /> Algorithms
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Shortest path algorithms like <span className="font-bold">A*</span> and <span className="font-bold">Dijkstra</span> explore the grid efficiently to find the best route while avoiding obstacles.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-indigo-500" /> Interactive
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            All processing is done client-side. Experiment with different wall patterns and see how different algorithms adapt their search strategies.
          </p>
        </div>
      </div>
    </div>
  );
}
