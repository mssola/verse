# Contributing
## Tests

This project is managed with [yarn](https://yarnpkg.com/). Thus, you need to
install it first and then you can grab the dependencies by performing:

```sh
$ yarn
```

After that, you can run tests like so:

```sh
$ yarn test
```

Finally, this project also provides the `./bin/cli.ts` script which will allow
you to test the main functions with whatever you throw at it. Thus, you can take
any of the examples from `examples` directory and check whether everything is
running as it should. For example:

```sh
$ cat examples/aeneis-i.txt | yarn run bin
```

This script is not just used for checking out examples, but it's also used for
end-to-end testing. That is, we rely on
[BATS](https://github.com/bats-core/bats-core), which for
[tests/scan.bats](./tests/e2e/scan.bats) it simply calls this script and
compares its output with expectations on [tests/testdata](./tests/testdata). In
order to run these tests, just install
[BATS](https://github.com/bats-core/bats-core) and run it like so:

```sh
$ bats --verbose-run tests/scan.bats
```

We also provide a `Makefile` to make things simpler, and you can run:

```sh
$ make       # Run everything
$ make lint  # Run linter
$ make unit  # Run unit tests
$ make e2e   # Run end to end tests
```

## Issue reporting

I'm using Github in order to host the code. Thus, in order to report issues you
can do it on its [issue tracker](https://github.com/mssola/verse/issues). A
couple of notes on reports:

- Check that the issue has not already been reported or fixed in the `main`
  branch.
- Try to be concise and precise in your description of the problem.
- Provide a step by step guide on how to reproduce this problem.
- Provide the version you are using (git commit SHA).

## Pull requests

- Write a [good commit message](https://chris.beams.io/posts/git-commit/).
- Run the tests.
- Update the [changelog](./CHANGELOG.md) file (if relevant).
- Open a pull request with _only_ one subject and a clear title and description.
  Refrain from submitting pull requests with tons of different unrelated
  commits.
