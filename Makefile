##
# Nothing too fancy, just a couple of shortcuts.

BATS := $(shell command -v bats 2> /dev/null)
YARN := $(shell command -v yarn 2> /dev/null)

all: deps lint unit e2e

unit: deps
	@$(YARN) test

e2e: deps
ifndef BATS
	$(error "bats is not available!")
endif
	@$(BATS) tests/e2e/scan.bats

lint: deps
	@$(YARN) eslint .

deps:
ifndef YARN
	$(error "yarn is not available!")
endif
	@$(YARN)

clean:
	@rm -rf node_modules
