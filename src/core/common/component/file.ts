import { Component, define } from '../component';

/**
 * A component which represents a file.
 * @class File
 * @extends {Component<string>}
 */
@define('file')
export class File extends Component<string> {

    /** @inheritdoc */
    get type(): string {
        return 'file';
    }
}

export default String;