# Herd Immunity Simulator

An interactive visualization tool for understanding how diseases spread through populations and how vaccination affects transmission dynamics.

![Simulator Screenshot](https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)

## Features

- Interactive grid-based population simulation
- Multiple population states (Susceptible, Infected, Immune, etc.)
- Vaccination efficacy modeling
- Real-time infection tracking
- Visual infection path tracking with arrows
- Time series data visualization
- Export capabilities for data analysis

## 📋 Detailed Usage Guide

### Getting Started

1. **Session Setup**: When you first open the simulator, you'll be prompted to enter a session name (e.g., "Spring 2025 Workshop")
2. **Grid Layout**: The simulator displays a numbered grid where each cell represents an individual in the population
3. **Color Coding**: Each cell is color-coded based on its state:
   - **Gray (S)**: Susceptible - can be infected
   - **Light Blue (V)**: Vaccinated Safe - protected from infection
   - **Blue (F)**: Vaccinated Failed - vaccination didn't work
   - **Red (I)**: Infected - can spread disease to neighbors
   - **Green (R)**: Immune/Recovered - cannot be infected again
   - **Yellow (F)**: Infection Attempt Failed (SI model only)

### Grid Setup and Controls

#### Grid Size Buttons
- **Reset to 4×4**: Creates a 4×4 grid (16 individuals)
- **Reset to 5×5**: Creates a 5×5 grid (25 individuals) - default
- **Reset to 6×6**: Creates a 6×6 grid (36 individuals)

#### State Palette (Colored Buttons)
Click these buttons to select a state, then click grid cells to change their state:
- **S (Gray)**: Set cells to Susceptible
- **V (Light Blue)**: Set cells to Vaccinated Safe
- **F (Blue)**: Set cells to Vaccinated Failed
- **I (Red)**: Set cells to Infected
- **R (Green)**: Set cells to Immune/Recovered

#### Model Type Selector
- **SIR Model**: Susceptible → Infected → Recovered (classic epidemiology)
  - Failed infections lead to immunity (recovered state)
- **SI Model**: Susceptible → Infected (simpler model)
  - Failed infections can be marked as "Infection Attempt Failed"

### Simulation Modes

#### Manual Setup Mode (Default)
1. **Select a state** from the colored palette buttons
2. **Click grid cells** to change them to that state
3. **Set up your scenario** (e.g., place some vaccinated individuals, set patient zero)

#### Infection Mode
1. **Click "Infection Mode"** button (turns red when active)
2. **Click an infected cell (red)** to select it as the infection source
3. **Click a neighboring cell** to attempt infection
4. **Confirm success/failure** in the popup dialog
5. **Watch the arrows** show infection paths

**Infection Rules:**
- Can only infect orthogonal neighbors (up, down, left, right)
- Cannot infect Vaccinated Safe individuals (unless Vaccination Efficacy is active)
- Cannot infect already Immune individuals
- Each attempt creates an arrow showing the infection path

#### Vaccination Efficacy Mode
1. **Click "Vaccination Efficacy"** button
2. **Enter efficacy label** (e.g., "75%") in the popup
3. **Now infections can target** Vaccinated Safe individuals
4. **Successful infections** change Vaccinated Safe → Vaccinated Failed
5. **The efficacy label** appears next to the button when active

#### Seed Infection
- **Purpose**: Randomly introduce infection into the population
- **Click "Seed Infection"** button
- **3 attempts maximum** per game
- **Weighted selection**: Higher chance for non-vaccinated individuals
- **Game ends** if all 3 attempts hit vaccinated individuals

#### Auto-Play Mode
1. **Click "Auto-Play"** to start automated simulation
2. **Automatic infection attempts** from all infected individuals
3. **1-second delays** between attempts for visualization
4. **50% success rate** for each infection attempt
5. **Stops automatically** when no more infections are possible
6. **Click "Stop Auto-Play"** to halt early

### Data Analysis Tools

#### Time Series Chart
- **Click "Show Time Series"** to display population trends over time
- **X-axis**: Time steps (only when states actually change)
- **Y-axis**: Count of individuals in each state
- **Multiple lines** show how each population changes over time

#### Export Functions
- **Export JSON**: Download complete game data for analysis
- **Save Image**: Download PNG snapshot of current grid state

#### Other Controls
- **Undo**: Reverse the last infection event
- **New Session**: Start fresh with a new session name

### Educational Scenarios

#### Scenario 1: Basic Epidemic Spread
1. Reset to 5×5 grid
2. Use state palette to set one cell to Infected (red)
3. Enable Infection Mode
4. Manually spread infection to see transmission patterns
5. Show Time Series to analyze epidemic curve

#### Scenario 2: Vaccination Impact
1. Reset grid and set up some Vaccinated Safe individuals
2. Seed infection in the population
3. Use Auto-Play to see how vaccination affects spread
4. Compare with unvaccinated scenario

#### Scenario 3: Herd Immunity Threshold
1. Gradually increase vaccination coverage
2. Use Seed Infection to test if epidemics can establish
3. Find the vaccination threshold that prevents spread

#### Scenario 4: Vaccine Efficacy
1. Set up vaccinated population
2. Enable Vaccination Efficacy (e.g., "75%")
3. Test how imperfect vaccines affect transmission

### Tips for Classroom Use

- **Grid numbers** make it easy to reference specific individuals
- **Visual arrows** clearly show transmission paths
- **Color coding** makes population states immediately obvious
- **Time series** helps students understand epidemic dynamics
- **Export functions** allow for detailed analysis and homework assignments
- **Session names** help organize different class activities

### Troubleshooting

- **Controls disabled?** Auto-Play mode disables manual controls - stop Auto-Play first
- **Can't change model type?** Model type is locked during Infection Mode - exit Infection Mode first
- **Seed button disabled?** You can only seed once per game, or you've used all 3 attempts
- **Time series not updating?** Time series only updates when cell states actually change

## 💻 Developer Installation

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/herd-immunity.git
   ```

2. Navigate to the project directory:
   ```bash
   cd herd-immunity
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser

### Project Structure

```
src/
├── components/
│   ├── Grid.tsx              # Main simulation grid
│   ├── InfectionArrows.tsx   # Infection path visualization
│   ├── StatePalette.tsx      # State selection buttons
│   └── TimeSeriesChart.tsx   # Population trends chart
├── types.ts                  # TypeScript definitions
├── utils/
│   └── colorMapping.ts       # State color definitions
└── App.tsx                   # Main application component
```

## 📊 Data Export

The simulator supports exporting:
- Complete game state as JSON
- Time series data for analysis
- Grid snapshots as images

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- Charting powered by Recharts
- Styling with Tailwind CSS
