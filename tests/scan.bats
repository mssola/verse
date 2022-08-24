#!/usr/bin/env bats

# Compares the output from the bin/cli.ts script and the expected output.
assert-example() {
    DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." >/dev/null 2>&1 && pwd )"

    output="$(cat "$DIR/examples/$1.txt" | yarn -s run bin)"
    expected="$(cat $DIR/tests/testdata/$1-expected.txt)"

    if [ ! "$output" == "$expected" ]; then
        diff <(echo "$output") <(echo "$expected")
    fi
    [ "$output" = "$expected" ]
}

##
# Test suite proper.

@test "aeneis-i" {
    assert-example "aeneis-i"
}

@test "sulpicia-i" {
    assert-example "sulpicia-i"
}
