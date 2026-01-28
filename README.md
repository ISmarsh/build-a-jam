# Build-a-Jam

A repository and tool for selecting improv warm-ups and exercises based on tags like "connection", "structure", "heightening", and more.

## About

Build-a-Jam helps improv performers and teachers find the perfect warm-up exercises for their jam sessions. Browse exercises by tags, filter by specific skills you want to practice, and build the ideal warm-up routine.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS** - Styling

## Features

- Browse improv exercises with detailed descriptions
- Filter exercises by tags (connection, structure, heightening, energy, focus, listening)
- Responsive design for mobile and desktop
- Fast development with Vite HMR (Hot Module Replacement)

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ExerciseCard.tsx    # Individual exercise display
│   ├── ExerciseList.tsx    # List of exercises
│   └── TagFilter.tsx       # Tag filtering UI
├── data/
│   └── exercises.ts     # Exercise data
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Learning Resource

This project serves as a learning tool for transitioning from Angular to React. The codebase includes extensive comments comparing Angular patterns to React equivalents.

## Roadmap

- [ ] Add new exercises form
- [ ] Search functionality
- [ ] Favorites/bookmarking
- [ ] Local storage persistence
- [ ] Exercise duration calculator
- [ ] Random exercise selector
- [ ] Categories/collections

## Contributing

This is a personal learning project, but suggestions and ideas are welcome!

## License

MIT
