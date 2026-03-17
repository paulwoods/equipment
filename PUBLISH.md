# Publishing

## 1. Update the Version

Update the version number in two places:

**`package.json`**

```json
{
  "version": "0.2.1"
}
```

**`publish.sh`** — update both tag lines to match the new version:

```sh
docker tag equipment-management paulwoods/equipment-management:0.2.1
docker push paulwoods/equipment-management:0.2.1
```

Use [semantic versioning](https://semver.org): `MAJOR.MINOR.PATCH`

- `PATCH` — bug fixes
- `MINOR` — new features, backwards compatible
- `MAJOR` — breaking changes

## 2. Commit the Version Bump

```bash
git add package.json publish.sh
git commit -m "chore(release): bump version to <version>"
```

## 3. Run the Publish Script

Make sure you are logged in to Docker Hub first:

```bash
docker login
```

Then run the publish script:

```bash
bash publish.sh
```

This will:

1. Build the Docker image
2. Tag it with the new version and `latest`
3. Push both tags to Docker Hub
