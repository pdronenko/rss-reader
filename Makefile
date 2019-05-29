install: install-deps

develop:
	npx webpack-dev-server

install-deps:
	npm install

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test:
	npm test

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
