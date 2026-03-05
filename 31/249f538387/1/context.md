# Session Context

## User Prompts

### Prompt 1

i am locally developing the `rudel` cli. and for testing I would like to link the `rudel` command rather to the build version in this repository instead of the published globally via npm installed version, what is the easiest way to do this?

### Prompt 2

okay execute those commands and then verify via `which bun`

### Prompt 3

how about you uninstall the global rudel version via npm and then we check if the link works

### Prompt 4

i just update dthe verison in @package.json but when calling `rudel --version` i still get the old version? is maybe the `--version` command not reading from packagae.json?

### Prompt 5

can we make the  @src/app.ts rather load the package.json so those are always aligned?

