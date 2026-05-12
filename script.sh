#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ADMIN_DIR="$ROOT_DIR/admin-portal"

print_help() {
  cat <<'EOF'
PawPlan helper script

Usage:
  ./script.sh <command>

Commands:
  help          Show this help message
  install       Install backend and admin portal dependencies
  data          Generate Prisma client and prepare local data files
  seed          Seed demo data
  clear         Reset local demo database and reseed it
  dev           Run backend in development mode
  prod          Build and run backend in production mode
  admin-dev     Run admin portal in development mode
  admin-prod    Build and run admin portal in production mode
  full-dev      Run backend and admin portal together in development mode

Examples:
  ./script.sh install
  ./script.sh clear
  ./script.sh dev
  ./script.sh full-dev
EOF
}

ensure_admin_dir() {
  if [[ ! -d "$ADMIN_DIR" ]]; then
    echo "Admin portal folder not found: $ADMIN_DIR"
    exit 1
  fi
}

install_all() {
  echo "Installing backend dependencies..."
  (cd "$ROOT_DIR" && npm install)

  ensure_admin_dir
  echo "Installing admin portal dependencies..."
  (cd "$ADMIN_DIR" && npm install)
}

prepare_data() {
  echo "Generating Prisma client..."
  (cd "$ROOT_DIR" && npm run prisma:generate)

  if [[ -f "$ROOT_DIR/prisma/dev.db" ]]; then
    echo "Refreshing test database copy..."
    (cd "$ROOT_DIR" && npm run test:setup)
  else
    echo "Local dev database not found yet. Run './script.sh seed' or './script.sh clear' first if needed."
  fi
}

seed_demo() {
  echo "Seeding demo data..."
  (cd "$ROOT_DIR" && npm run seed)
  echo "Refreshing test database copy..."
  (cd "$ROOT_DIR" && npm run test:setup)
}

clear_demo() {
  echo "Resetting local demo database..."
  (cd "$ROOT_DIR" && npm run db:reset:demo)
}

run_backend_dev() {
  echo "Starting backend dev server..."
  cd "$ROOT_DIR"
  npm run dev
}

run_backend_prod() {
  echo "Building backend..."
  (cd "$ROOT_DIR" && npm run build)
  echo "Starting backend production server..."
  cd "$ROOT_DIR"
  npm run start
}

run_admin_dev() {
  ensure_admin_dir
  echo "Starting admin portal dev server..."
  cd "$ADMIN_DIR"
  npm run dev
}

run_admin_prod() {
  ensure_admin_dir
  echo "Building admin portal..."
  (cd "$ADMIN_DIR" && npm run build)
  echo "Starting admin portal production server..."
  cd "$ADMIN_DIR"
  npm run start
}

run_full_dev() {
  ensure_admin_dir
  echo "Starting backend and admin portal in development mode..."
  (
    cd "$ROOT_DIR"
    npm run dev
  ) &
  BACKEND_PID=$!

  (
    cd "$ADMIN_DIR"
    npm run dev
  ) &
  ADMIN_PID=$!

  cleanup() {
    echo
    echo "Stopping development servers..."
    kill "$BACKEND_PID" "$ADMIN_PID" 2>/dev/null || true
  }

  trap cleanup INT TERM EXIT
  wait "$BACKEND_PID" "$ADMIN_PID"
}

COMMAND="${1:-help}"

case "$COMMAND" in
  help|-h|--help)
    print_help
    ;;
  install)
    install_all
    ;;
  data)
    prepare_data
    ;;
  seed)
    seed_demo
    ;;
  clear)
    clear_demo
    ;;
  dev)
    run_backend_dev
    ;;
  prod)
    run_backend_prod
    ;;
  admin-dev)
    run_admin_dev
    ;;
  admin-prod)
    run_admin_prod
    ;;
  full-dev)
    run_full_dev
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo
    print_help
    exit 1
    ;;
esac
