# Explore Consolidated Math Olympiad Results

A high-performance web application providing a consolidated view of international math olympiad results across multiple competitions.

**Live site:** https://moresults.org/

## About

This project aggregates and displays results from major international mathematical olympiads including IMO, EGMO, APMO, RMM, MEMO, BMO, and PAMO. It provides:

- **Contestant profiles** - View individual participation history and rankings
- **Competition results** - Browse results by olympiad and year
- **Country statistics** - Analyze country performance over time
- **Country comparison** - Compare two countries side-by-side
- **Hall of Fame** - Top performers across all competitions

All data is mirrored from official olympiad websites.

> **Note:** There is a private `moresults-data` repo that contains the data preparation code. If you need access, please contact us.

## Prerequisites

- Node.js 22+
- Yarn 1.x

## Getting Started

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

The app will be available at `http://localhost:3001`.

## Scripts

| Command                              | Description              |
| ------------------------------------ | ------------------------ |
| `yarn dev`                           | Start development server |
| `yarn build`                         | Build for production     |
| `yarn lint`                          | Run ESLint               |
| `yarn workspace @moresults/web test` | Run tests                |

## Project Structure

```
apps/web/
├── src/
│   ├── components/    # Reusable UI components
│   ├── constants/     # Route definitions and filter options
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── schemas/       # Data type definitions
│   └── utils/         # Utility functions
└── public/
    └── data/          # Olympiad data
```

## Contributing

Contributions are welcome! If you find a bug, have a suggestion, or want to add a feature:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

- For questions, bug reports, or data issues: [GitHub Issues](https://github.com/matholympiadresults/moresults-web/issues)
- For sensitive data concerns: math.olympiad.results@gmail.com

## License

MIT
