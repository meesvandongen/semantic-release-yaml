export type CommandPhase = "prepare";

export interface Command {
  /**
   * Current working directory.
   */
  cwd: string;
  /**
   * The phase in which the command should be executed.
   */
  phase: CommandPhase;
  /**
   * The YAML file on which the command should be executed.
   */
  file: string;
  /**
   * The subpath leading to the field which should get a new value (evaluated with https://lodash.com/docs/4.17.15#set).
   */
  selector: string;
  /**
   * The template for the next value to be inserted in the YAML file.
   */
  template: string;
}

export interface Configuration {
  /**
   * A list of commands to run
   */
  commands: Array<Command>;
}
