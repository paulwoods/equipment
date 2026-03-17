This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

The application uses the following environment variables:

- `APP_DATA_DIR`: The directory where the equipment data is stored. Defaults to `data` if not specified.
- `APP_USERNAME`: The username required for authentication.
- `APP_PASSWORD`: The password required for authentication.
- `APP_SMTP_USER`: Gmail address (e.g., your-email@gmail.com).
- `APP_SMTP_PASS`: Google App Password (not your regular Gmail password).
- `APP_SMTP_FROM`: Sender email address (default: "Equipment Management" <noreply@example.com>).
- `NEXT_PUBLIC_APP_URL`: The public URL of the application (e.g., `http://localhost:3000`). Used to generate links in
  emails.

*Note: `APP_SMTP_HOST`, `APP_SMTP_PORT`, and `APP_SMTP_SECURE` are no longer used as the application is configured to
use the Gmail service directly.*

### Getting a Google App Password

A Google App Password is required for `APP_SMTP_PASS`. Do **not** use your regular Gmail password.

1. Go to your [Google Account](https://myaccount.google.com) and sign in.
2. Enable **2-Step Verification** if not already enabled (required for App Passwords):
    - Navigate to **Security** → **2-Step Verification** and follow the prompts.
3. Once 2-Step Verification is enabled, go to **Security** → **App passwords**.
    - You can also navigate directly to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Under **App name**, enter a name (e.g., `Equipment Management`).
5. Click **Create**.
6. Copy the 16-character password shown — this is your `APP_SMTP_PASS` value.

> **Note:** App passwords are only shown once. Store it securely.

## Docker

You can run the application using Docker.

### Use Docker Compose

The easiest way to run the application is using Docker Compose:

```bash
docker compose up -d
```

This will build the image (if not already built) and start the container with the `data` directory mounted as a volume.

Here is an example `docker-compose.yaml` file:

```yaml
services:
  equipment-management:
    image: paulwoods/equipment-management:latest
    ports:
      -
      - "80:3000"
    environment:
      - APP_DATA_DIR=data
    volumes:
      - ./data:/app/data
    restart: always
```

### Build the image manually

```bash
docker build -t equipment-management .
```

### Publish to Docker Hub

To publish the image to Docker Hub, you first need to log in, then tag it with your username and push it:

```bash
# Log in to Docker Hub
docker login

# Tag the image (replace 'paulwoods' with your actual Docker Hub username)
docker tag equipment-management paulwoods/equipment-management:latest
docker tag equipment-management paulwoods/equipment-management:0.2.0

# Push the image
docker push paulwoods/equipment-management:latest
docker push paulwoods/equipment-management:0.2.0
```

### Run the container

To persist data, you should mount a volume for the data directory:

```bash
docker run -p 3000:3000 -v $(pwd)/data:/app/data equipment-management
```

If you use a different directory via `APP_DATA_DIR`:

```bash
docker run -p 3000:3000 -e APP_DATA_DIR=mydata -v $(pwd)/mydata:/app/mydata equipment-management
```

## CI/CD with Jenkins

A `Jenkinsfile` is provided in the root of the repository to automate the build and deployment process.

### Prerequisites

1.  **Jenkins** with the following plugins:
    *   Docker Pipeline
    *   Pipeline: Stage View
    *   Pipeline: Basic Steps
2.  **Credentials**: Create a `Username with password` credential in Jenkins with the ID `docker-hub-credentials` containing your Docker Hub username and password.

### Pipeline Stages

1.  **Extract Version**: Reads the version from `package.json`.
2.  **Build & Test**: Installs dependencies and runs type checking and build.
3.  **Docker Build**: Builds the Docker image and tags it with `latest` and the version number.
4.  **Docker Push**: Logs into Docker Hub and pushes the tags.

Note: You should update the `DOCKER_HUB_USER` variable in the `Jenkinsfile` to your actual Docker Hub username.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
