This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

The application uses the following environment variables:

- `EQUIPMENT_DATA_DIR`: The directory where the equipment data is stored. Defaults to `data` if not specified.

## Docker

You can run the application using Docker.

### Use Docker Compose

The easiest way to run the application is using Docker Compose:

```bash
docker compose up -d
```

This will build the image (if not already built) and start the container with the `data` directory mounted as a volume.

### Build the image manually

```bash
docker build -t equipment-management .
```

### Publish to Docker Hub

To publish the image to Docker Hub, you first need to log in, then tag it with your username and push it:

```bash
# Log in to Docker Hub
docker login

# Tag the image (replace 'yourusername' with your actual Docker Hub username)
docker tag equipment-management yourusername/equipment-management:latest
docker tag equipment-management yourusername/equipment-management:1.0.0

# Push the image
docker push yourusername/equipment-management:latest
docker push yourusername/equipment-management:1.0.0
```

### Run the container

To persist data, you should mount a volume for the data directory:

```bash
docker run -p 3000:3000 -v $(pwd)/data:/app/data equipment-management
```

If you use a different directory via `EQUIPMENT_DATA_DIR`:

```bash
docker run -p 3000:3000 -e EQUIPMENT_DATA_DIR=mydata -v $(pwd)/mydata:/app/mydata equipment-management
```

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
