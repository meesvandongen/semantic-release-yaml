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
            // The field in the file to edit. Evaluated via lodash's `set` function.
            "selector": "version",
            // The value to set the field to. Evaluated via lodash's `template` function.
            "template": "${nextRelease.version}"
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

More info about:

- Lodash `set`: https://lodash.com/docs/4.17.15#set
- Lodash `template`: https://lodash.com/docs/4.17.15#template
