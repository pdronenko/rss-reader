install:
	npm install

start:
	npx babel-node -- src/bin/test.js

test:
	npm test

publish:
	npm publish --dry-run

lint:
	npx eslint .
