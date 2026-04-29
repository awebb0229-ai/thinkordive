# thinkordive

A full-stack stock trading simulation platform where users can buy and sell stocks in a realistic market environment.

## Features

- **Customer Portal**: Buy/sell stocks, manage portfolio, and track transactions
- **Admin Dashboard**: Create stocks, manage market hours, and manage users
- **Real-time Price Engine**: Dynamic stock price fluctuations
- **Market Simulation**: Simulated market hours and holidays
- **User Authentication**: Secure login and registration

## Tech Stack

- **Frontend**: Tanstack Start, React, TypeScript, Tailwind CSS, Shadcn w/ Base UI, and SSR support
- **Backend**: Drizzle ORM and Better Auth
- **Database**: Cloudflare D1
- **DevOps & Tooling**: Bun, Docker/Podman, Docker Compose, Biome, Nix, EditorConfig, and Wrangler
- **Deployment**: Cloudflare Workers + D1 Binding

## Project Structure

This is a Tanstack Start project with the following structure:

```
src
├── components      # Components
│   └── ui          # Individual ui components
├── hooks
├── lib
├── middleware
├── routes
│   ├── api         # API routes
│   │   └── auth    # Auth routes
│   ├── index.tsx
│   ├── login.tsx
│   └── signup.tsx
└── server          # Database, schemas, and server functions
```

## Getting Started

### Prerequisites

**Option 1: Using Nix + direnv (Recommended)**
- [Nix](https://nixos.org/) with flakes enabled
- [direnv](https://direnv.net/)

**Option 2: Manual Setup**
- [Bun](https://bun.com/) (latest)

### Installation

1. Set up the development environment

    **Option A: Using Nix + direnv (Recommended)**

    If you have direnv installed, allow the `.envrc` file to automatically load the Nix environment:
    ```sh
    direnv allow
    ```
    This will automatically install Bun, Process Compose, and other deps into your dev shell whenever you're in the project directory.
    It will unload when you exit and restore your path and env vars.

    **Option B: Using Nix without direnv**

    ```sh
    nix develop
    ```
    You'll need to run this command each time you want to load the dev shell.

    **Option C: Manual Installation** - Install the required tools manually as listed in [Prerequisites](#prerequisites)

2. Install dependencies:
    ```sh
    bun install
    ```

3. Set up environment variables:

    Create a `.dev.vars` file in the root directory and add the following environment variables.
    ```
    BETTER_AUTH_URL=http://localhost:5173
    BETTER_AUTH_SECRET=
    ```

    Generate a Better Auth secret and add it to your `.dev.vars`:
    ```sh
    openssl rand -base64 32
    ```
4. Run database migrations:
    ```sh
    bun run db:migrate:dev
    ```

### Running the Application

```sh
bun run dev
```

## Development

### Code Quality

This project uses Biome for linting and formatting. Run checks with:
```sh
bun run check
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

`Thinkorswim` is licensed under the MIT License. See [LICENSE](LICENSE) for full details.
