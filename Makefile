# ElysiaJS-DI Library Makefile
# Development commands for the library

.PHONY: help install build test clean dev link lint release

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(CYAN)ElysiaJS-DI Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# ============================================
# Development
# ============================================

install: ## Install dependencies
	@echo "$(CYAN)Installing dependencies...$(NC)"
	bun install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

build: ## Build the library
	@echo "$(CYAN)Building library...$(NC)"
	bun run build
	@echo "$(GREEN)✓ Library built$(NC)"

dev: build link ## Build and link for local development
	@echo "$(GREEN)✓ Ready for local development$(NC)"
	@echo "$(YELLOW)In your project run: bun link @igorcesarcode/elysiajs-di$(NC)"

link: ## Link package globally for local development
	@echo "$(CYAN)Linking library...$(NC)"
	bun link
	@echo "$(GREEN)✓ Library linked globally$(NC)"

# ============================================
# Testing
# ============================================

test: ## Run tests
	@echo "$(CYAN)Running tests...$(NC)"
	bun test

test-watch: ## Run tests in watch mode
	bun test --watch

test-coverage: ## Run tests with coverage
	bun test --coverage

# ============================================
# Code Quality
# ============================================

lint: ## Type check the library
	@echo "$(CYAN)Type checking...$(NC)"
	bun run lint
	@echo "$(GREEN)✓ Type check passed$(NC)"

# ============================================
# Build & Release
# ============================================

clean: ## Clean build artifacts
	@echo "$(CYAN)Cleaning build artifacts...$(NC)"
	rm -rf dist
	@echo "$(GREEN)✓ Clean complete$(NC)"

release: test build ## Run tests, build and publish to npm
	@echo "$(CYAN)Publishing to npm...$(NC)"
	@echo "$(YELLOW)Make sure you have run 'npm login' first$(NC)"
	npm publish --access public
	@echo "$(GREEN)✓ Published to npm$(NC)"

# ============================================
# Utility
# ============================================

outdated: ## Check for outdated dependencies
	@echo "$(CYAN)Checking dependencies...$(NC)"
	bun outdated || true
