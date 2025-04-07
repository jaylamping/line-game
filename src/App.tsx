import { useState, useEffect } from 'react';
import './App.css';

// Game constants
const GRID_SIZE = 6;
const MIN_NUMBER = 1;
const MAX_NUMBER = 4;
const MIN_LINE_LENGTH = 2;
const MAX_LINE_LENGTH = 6;

// Score constants
const SCORE_MULTIPLIERS = {
  2: 10,
  3: 30,
  4: 60,
  5: 100,
  6: 150,
};

type Tile = {
  id: string;
  value: number;
  selected: boolean;
};

type Position = {
  row: number;
  col: number;
};

function App() {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [targetSum, setTargetSum] = useState<number>(0);
  const [selectedTiles, setSelectedTiles] = useState<Position[]>([]);
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Initialize the game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newGrid = generateGrid();
    setGrid(newGrid);
    generateTargetSum();
    setSelectedTiles([]);
    setCurrentSum(0);
    setScore(0);
    setGameOver(false);
  };

  const generateGrid = (): Tile[][] => {
    const newGrid: Tile[][] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const newRow: Tile[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        newRow.push({
          id: `${row}-${col}-${Math.random()}`, // Unique ID for each tile
          value:
            Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) +
            MIN_NUMBER,
          selected: false,
        });
      }
      newGrid.push(newRow);
    }
    return newGrid;
  };

  const generateTargetSum = () => {
    // Generate a target sum that's achievable with the current grid
    // For simplicity, we'll use a random number between MIN_LINE_LENGTH*MIN_NUMBER and MAX_LINE_LENGTH*MAX_NUMBER
    const minPossibleSum = MIN_LINE_LENGTH * MIN_NUMBER;
    const maxPossibleSum = MAX_LINE_LENGTH * MAX_NUMBER;
    const newTargetSum =
      Math.floor(Math.random() * (maxPossibleSum - minPossibleSum + 1)) +
      minPossibleSum;
    setTargetSum(newTargetSum);

    // In a more advanced implementation, we would analyze the current grid to ensure
    // the target sum is achievable with the current state of the board
  };

  const handleTileMouseDown = (row: number, col: number) => {
    if (gameOver) return;

    const newGrid = [...grid];
    const tile = newGrid[row][col];

    // Start a new selection
    setIsDragging(true);
    setSelectedTiles([{ row, col }]);
    setCurrentSum(tile.value);

    // Mark the tile as selected
    tile.selected = true;
    setGrid(newGrid);
  };

  const handleTileMouseEnter = (row: number, col: number) => {
    if (!isDragging || gameOver) return;

    // Check if the tile is adjacent to the last selected tile
    const lastTile = selectedTiles[selectedTiles.length - 1];
    const isAdjacent =
      (row === lastTile.row && Math.abs(col - lastTile.col) === 1) ||
      (col === lastTile.col && Math.abs(row - lastTile.row) === 1);

    // Check if the line is straight (all same row or all same column)
    const isInSameRow = selectedTiles.every((tile) => tile.row === row);
    const isInSameCol = selectedTiles.every((tile) => tile.col === col);
    const isStraightLine = isInSameRow || isInSameCol;

    // Check if the tile is already selected
    const isTileAlreadySelected = selectedTiles.some(
      (tile) => tile.row === row && tile.col === col
    );

    // Only proceed if the tile is adjacent, in a straight line, not already selected, and selection is within limits
    if (
      isAdjacent &&
      isStraightLine &&
      !isTileAlreadySelected &&
      selectedTiles.length < MAX_LINE_LENGTH
    ) {
      const newGrid = [...grid];
      const tile = newGrid[row][col];

      // Add the tile to selected tiles
      setSelectedTiles([...selectedTiles, { row, col }]);
      setCurrentSum(currentSum + tile.value);

      // Mark the tile as selected
      tile.selected = true;
      setGrid(newGrid);
    }
  };

  const handleTileMouseUp = () => {
    if (!isDragging || gameOver) return;
    setIsDragging(false);

    // Check if the line is valid (meets length requirements and sums to target)
    const isValidLength =
      selectedTiles.length >= MIN_LINE_LENGTH &&
      selectedTiles.length <= MAX_LINE_LENGTH;
    const isValidSum = currentSum === targetSum;

    if (isValidLength && isValidSum) {
      // Handle successful line
      handleSuccessfulLine();
    } else {
      // Reset selection if invalid
      resetSelection();
    }
  };

  const handleSuccessfulLine = () => {
    // Calculate score
    const lineLength = selectedTiles.length;
    const lineScore =
      SCORE_MULTIPLIERS[lineLength as keyof typeof SCORE_MULTIPLIERS] || 0;
    setScore(score + lineScore);

    // Remove selected tiles and apply gravity
    const newGrid = [...grid];

    // Mark selected tiles for removal by setting them to null
    selectedTiles.forEach(({ row, col }) => {
      newGrid[row][col] = null as unknown as Tile;
    });

    // Apply gravity - move tiles down to fill empty spaces
    for (let col = 0; col < GRID_SIZE; col++) {
      const columnTiles = [];

      // Collect all non-null tiles in this column
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col] !== null) {
          columnTiles.push(newGrid[row][col]);
        }
      }

      // Fill in empty spaces with new tiles
      while (columnTiles.length < GRID_SIZE) {
        columnTiles.push({
          id: `new-${Math.random()}`,
          value:
            Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) +
            MIN_NUMBER,
          selected: false,
        });
      }

      // Update the column in the grid (from bottom to top)
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        newGrid[row][col] = columnTiles[GRID_SIZE - 1 - row];
      }
    }

    setGrid(newGrid);
    setSelectedTiles([]);
    setCurrentSum(0);

    // Generate a new target sum
    generateTargetSum();

    // Check if game is over (no valid moves left)
    checkGameOver(newGrid);
  };

  const checkGameOver = (grid: Tile[][]) => {
    // Check if there are any valid moves left
    // This is a simplified implementation that checks if there are any adjacent tiles
    // that could possibly form a valid line

    // Check horizontal lines
    for (let row = 0; row < GRID_SIZE; row++) {
      for (
        let startCol = 0;
        startCol <= GRID_SIZE - MIN_LINE_LENGTH;
        startCol++
      ) {
        for (
          let length = MIN_LINE_LENGTH;
          length <= Math.min(MAX_LINE_LENGTH, GRID_SIZE - startCol);
          length++
        ) {
          let sum = 0;
          for (let offset = 0; offset < length; offset++) {
            sum += grid[row][startCol + offset].value;
          }

          // If we found a sum that could match a target, there's at least one possible move
          if (
            sum >= MIN_LINE_LENGTH * MIN_NUMBER &&
            sum <= MAX_LINE_LENGTH * MAX_NUMBER
          ) {
            return; // Game is not over
          }
        }
      }
    }

    // Check vertical lines
    for (let col = 0; col < GRID_SIZE; col++) {
      for (
        let startRow = 0;
        startRow <= GRID_SIZE - MIN_LINE_LENGTH;
        startRow++
      ) {
        for (
          let length = MIN_LINE_LENGTH;
          length <= Math.min(MAX_LINE_LENGTH, GRID_SIZE - startRow);
          length++
        ) {
          let sum = 0;
          for (let offset = 0; offset < length; offset++) {
            sum += grid[startRow + offset][col].value;
          }

          // If we found a sum that could match a target, there's at least one possible move
          if (
            sum >= MIN_LINE_LENGTH * MIN_NUMBER &&
            sum <= MAX_LINE_LENGTH * MAX_NUMBER
          ) {
            return; // Game is not over
          }
        }
      }
    }

    // If we get here, no valid moves were found
    setGameOver(true);
  };

  const resetSelection = () => {
    const newGrid = [...grid];

    // Unmark all selected tiles
    selectedTiles.forEach(({ row, col }) => {
      newGrid[row][col].selected = false;
    });

    setGrid(newGrid);
    setSelectedTiles([]);
    setCurrentSum(0);
  };

  return (
    <div className='game-container'>
      <div className='game-header'>
        <h1>Line Game</h1>
        <div className='game-stats'>
          <div className='target-sum'>Target: {targetSum}</div>
          <div className='current-sum'>Current: {currentSum}</div>
          <div className='score'>Score: {score}</div>
        </div>
      </div>

      <div
        className='game-grid'
        onMouseLeave={resetSelection}
        onMouseUp={handleTileMouseUp}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className='grid-row'>
            {row.map((tile, colIndex) => (
              <div
                key={tile?.id || `${rowIndex}-${colIndex}`}
                className={`grid-tile ${tile?.selected ? 'selected' : ''}`}
                onMouseDown={() => handleTileMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleTileMouseEnter(rowIndex, colIndex)}
              >
                {tile?.value}
              </div>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className='game-over'>
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <button onClick={initializeGame}>Play Again</button>
        </div>
      )}

      <div className='game-controls'>
        <button onClick={initializeGame}>New Game</button>
      </div>
    </div>
  );
}

export default App;
