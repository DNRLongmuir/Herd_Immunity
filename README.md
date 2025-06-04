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

## 🚀 Quick Start (For Everyone)

1. Open this link in your browser: [Herd Immunity Simulator](https://bolt.new)
2. Click the "Run" button
3. Start experimenting!

### Basic Usage

1. **Grid Setup**: Choose your grid size (4×4, 5×5, or 6×6)
2. **States**: Click the colored buttons to select different states:
   - Gray (S) = Susceptible
   - Light Blue (V) = Vaccinated
   - Red (I) = Infected
   - Blue (M) = Immune
   - Yellow (F) = Infection Failed

3. **Infection Mode**: 
   - Click the "Infection Mode" button
   - Click an infected cell (red)
   - Click another cell to attempt infection
   - Confirm if the infection was successful

4. **Vaccination**: 
   - Click "Vaccination Efficacy"
   - Enter the efficacy percentage
   - Watch how vaccination affects infection spread

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