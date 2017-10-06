import { DirectoryContent } from '../content/directory';
import { FileAsset } from './file';
import { AssetGroup } from './group';
import { Asset } from '../asset';

/**
 * A directory asset contains directory information, such as path and a list of its direct members.
 * @see {DirectoryContent} for more information.
 *
 * @export
 * @abstract
 * @class FileAsset
 * @implements {Asset}
 */
export class DirectoryAsset extends AssetGroup<DirectoryAsset | FileAsset> {

  /** @inheritdoc */
  get type(): string {
    return 'directory';
  }

  /** @inheritdoc */
  content: DirectoryContent;

}