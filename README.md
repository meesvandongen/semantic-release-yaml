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
            // Currently only supports "prepare" phase.
            "phase": "prepare",
            // The file to edit
            "file": "./Chart.yaml",
            // The field in the file to edit.
            "selector": "version",
            // The value to set the field to.
            "value": "${nextRelease.version}"
          }
        ]
      }
    ],
    [
      "@semantic-release/git",
      {
        // Make sure Chart.yaml is pushed to the remote repository
        "assets": ["package.json", "Chart.yaml"]
      }
    ]
  ]
}
```

## Lodash `template`

- Lodash `template`: https://lodash.com/docs/4.17.15#template

Each variable (`cwd`, `phase`, `file`, `selector`, `value`) in a command is evaluated via lodash's `template` function.

```json
{
  ...
  "value": "${nextRelease.version}"
}
```

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
version:
  value: "1.0.0"
```

## Yaml comments

Yaml comments will be preserved.
