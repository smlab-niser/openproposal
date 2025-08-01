# Contributing to OpenProposal

Thank you for your interest in contributing to OpenProposal! This guide will help you get started.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/open-proposal.git`
3. **Install** dependencies: `npm install`
4. **Set up** environment: `cp .env.example .env.local`
5. **Initialize** database: `npx prisma migrate dev && npx prisma db seed`
6. **Start** development: `npm run dev`

## 🔧 Development Workflow

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test your changes: `npm run build && npm run lint`
4. Commit with clear messages: `git commit -m "feat: add new feature"`
5. Push to your fork: `git push origin feature/your-feature`
6. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Use Prettier for formatting (automatic on save)
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)

### Testing

- Test all new features manually
- Ensure existing functionality isn't broken
- Include edge cases in your testing

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code builds without errors (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] All existing features work
- [ ] New features are tested
- [ ] Documentation is updated if needed

### PR Description

Include:
- Clear description of changes
- Screenshots for UI changes
- Link to related issues
- Breaking changes (if any)

## 🐛 Bug Reports

Use the issue template and include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error messages
- Environment details (OS, browser, Node.js version)

## 💡 Feature Requests

When suggesting features:
- Explain the use case
- Describe the expected behavior
- Consider alternative solutions
- Check if similar features exist

## 🏗️ Project Structure

```
src/
├── app/               # Next.js App Router pages
├── components/        # Reusable UI components
├── lib/              # Utility functions
└── types/            # TypeScript type definitions
```

## 📝 Commit Guidelines

Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/config changes

## 🤝 Community

- Be respectful and constructive
- Help others learn and grow
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- Ask questions in [Discussions](https://github.com/smlab-niser/open-proposal/discussions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
