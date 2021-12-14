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
    [
      "semantic-release-yaml",
      {
        "commands": [
          {
            "cwd": "./",
            "phase": "prepare",
            "file": "./Chart.yaml",
            "selector": "version",
            "value": "${nextRelease.version}"
          }
        ]
      }
    ],
    "@semantic-release/git"
  ]
}
```
