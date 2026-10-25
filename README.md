# semantic-release-yaml

[**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to change yaml files.

| Step      | Description                         |
| --------- | ----------------------------------- |
| `prepare` | edit yaml during prepare the phase. |

## Install

```bash
$ npm install semantic-release-yaml -D
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  // We specify the branches, on which semantic-release should run.
  // This will be used in a later step, when we use the current
  // branch name as variables in the configuration.
  "branches": ["main", "next"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/npm",
    [
      "semantic-release-yaml",
      {
        // A list of files to edit.
        "commands": [
          {
            // The current working directory is the root of the project.
            "cwd": "./",
            // The file to edit
            "file": "./Chart.yaml",
            // The field in the file to edit.
            "selector": "version",
            // The value to set the field to.
            "value": "${nextRelease.version}"
          },
          {
            "cwd": "./",
            // A dynamic file name.
            "file": "./${branch.name}.yaml",
            "selector": "name",
            "value": "${nextRelease.version}"
          }
        ]
      }
    ],
    [
      "@semantic-release/git",
      {
        // Make sure Chart.yaml is pushed to the remote repository
        "assets": [
          "package.json",
          "Chart.yaml",
          // Also include main.yaml and next.yaml. These are the possible
          // outcomes of the second command: the dynamic file name.
          "./main.yaml",
          "./next.yaml"
        ]
      }
    ]
  ]
}
```

## Options

Each command in `commands` takes the following options:

| Option     | Required | Description                                                                                           |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `cwd`      | no       | The directory `file` is resolved against. Defaults to the directory semantic-release runs in.         |
| `file`     | yes      | The YAML file to edit.                                                                                |
| `selector` | yes      | The field to set, or an array of fields. See [Lodash `set`](#lodash-set) and [Wildcards](#wildcards). |
| `value`    | yes      | The value to set the field to.                                                                        |

## Lodash `template`

- Lodash `template`: https://lodash.com/docs/4.17.15#template

Each variable (`cwd`, `file`, `selector`, `value`) in a command is evaluated via lodash's `template` function.

```json
{
  ...
  "value": "${nextRelease.version}"
}
```

### Available variables

You can use all variables available in the [semantic-release context](https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin)

## Lodash `set`

- Lodash `set`: https://lodash.com/docs/4.17.15#set

Next to this; selector is used by lodash's `set` function to set the value of the field.

This means you can write the following command:

```json
{
  ...
  "selector": "meta.version",
  "value": "${nextRelease.version}"
}
```

which could result in the following:

```yaml
meta:
  version: 1.0.0
```

## Wildcards

A `*` in the selector matches every item of a list, or every key of a map. Both `modules[*].version` and `modules.*.version` are supported.

Given the following file:

```yaml
modules:
  - name: moduleABC
    properties:
      VERSION:
  - name: moduleXYZ
    properties:
      VERSION:
```

the selector `modules[*].properties.VERSION` sets `VERSION` in every module:

```json
{
  ...
  "selector": "modules[*].properties.VERSION",
  "value": "${nextRelease.version}"
}
```

Unlike a selector without a wildcard, a selector with a wildcard never adds items to a list or creates missing parents: a module without `properties` is skipped. Only the last key may be added, when its parent map already exists. If a selector matches nothing, a warning is logged and the file is left as is.

## Multiple selectors

To set several fields to the same value, pass an array of selectors:

```json
{
  ...
  "selector": ["version", "appVersion"],
  "value": "${nextRelease.version}"
}
```

## Yaml comments

Yaml comments will be preserved.
