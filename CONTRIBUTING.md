# Contributing to Soundry Download

Thank you for your interest in contributing to Soundry Download! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- Node.js 20+
- Python 3.12+
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Soundry.Download.git
   cd Soundry.Download
   ```

3. Set up the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   ```

4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

## Making Changes

### Code Style

#### Frontend (Angular/TypeScript)
- Follow the Angular style guide
- Use TypeScript strict mode
- Use SCSS for styling
- Keep components small and focused
- Use PrimeNG components for consistency

#### Backend (Python/Flask)
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Keep functions small and focused
- Add docstrings to all public functions
- Handle errors gracefully

### Commit Messages
- Use clear and descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Keep the first line under 72 characters
- Add more details in the body if needed

Example:
```
Add support for Apple Music downloads

- Integrate Apple Music API
- Add authentication flow
- Update UI with Apple Music option
```

## Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
python -m pytest
```

### Building
```bash
# Frontend
cd frontend
npm run build

# Backend (check syntax)
cd backend
python -m py_compile app.py
```

## Pull Request Process

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub:
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all tests pass

5. Wait for review and address any feedback

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Any unprofessional conduct

## Questions?

If you have questions or need help, please:
- Open an issue with the "question" label
- Reach out to the maintainers

## License

By contributing to Soundry Download, you agree that your contributions will be licensed under the same license as the project.
