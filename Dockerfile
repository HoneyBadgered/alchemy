FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy only package metadata first for cached dependency install
# Installing dependencies at the repo root ensures npm workspaces are resolved correctly
# and all workspace-level devDependencies (like typescript) are installed.
# Building from a package subdirectory without installing at root commonly leads
# to missing devDependencies, which causes the tsc command to either error or print
# help text and exit non-zero.
#
# Copying package.json files first provides better Docker layer caching for
# dependency installation in CI - the npm ci layer will be cached as long as
# package.json files don't change.
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/

# Ensure devDependencies are installed for build (typescript lives in devDeps)
# Use --include=dev to force dev deps even if NODE_ENV=production is present in build environment
# Use --ignore-scripts to avoid running prepare hooks during install (source files not yet copied)
RUN npm ci --include=dev --ignore-scripts

# Copy remaining files
COPY . .

# Build only the workspace package to avoid building all packages
RUN npm -w @alchemy/core run build
