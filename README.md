# 🔬 OpenProposal Platform

A comprehensive research proposal submission and review platform for research funding applications. Built with Next.js 15, TypeScript, and Prisma.

[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]
[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)

## ✨ Key Features

- **Multi-role platform**: PIs, Co-PIs, Program Officers, Reviewers, Administrators
- **Proposal management**: Rich editor, collaboration, version control
- **Budget planning**: Multi-year budgets, category allocation, validation
- **Review system**: Anonymous/open reviews, structured scoring
- **Public transparency**: Open venue pages, public review visibility
- **Security**: Role-based access, GDPR compliance, audit logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/smlab-niser/open-proposal.git
cd open-proposal

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev

# Or use the setup script
npm run setup
```

Visit `http://localhost:3000` and login with:
- **Admin**: admin@example.com / admin123
- **PI**: pi@example.com / pi123

## 📖 Documentation

- [Setup Guide](docs/setup.md) - Complete installation and configuration
- [Deployment Guide](docs/deployment.md) - Production deployment instructions
- [API Documentation](docs/api.md) - REST API reference
- [Security Guide](docs/security.md) - Security features and best practices
- [Email Configuration](docs/email.md) - Email system setup

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Express.js microservices
- **Database**: PostgreSQL/SQLite with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Email**: Nodemailer with SMTP support
- **File Storage**: Local/Cloud storage support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [Issues](https://github.com/smlab-niser/open-proposal/issues) - Bug reports and feature requests
- [Discussions](https://github.com/smlab-niser/open-proposal/discussions) - Community support

## 👥 Development Team 

- **[Subhankar Mishra's Lab](https://www.niser.ac.in/~smishra/)** - NISER ([GitHub](https://github.com/smlab-niser))
- **Lab Project Website**: [NISER SMLab](https://smlab.niser.ac.in)
