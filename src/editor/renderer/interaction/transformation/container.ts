import Sprite from '../../../../core/renderer/graphics/sprite';
import AbstractShape from '../../../../core/renderer/graphics/shape/abstract';
import Observer from '../../../../core/renderer/graphics/observer';

import * as _ from 'underscore';

export class Container extends Observer<PIXI.Container> {

    id: string = 'none';

    constructor() {
        super(new PIXI.Container());
    }

    get selection(): (Sprite | AbstractShape)[] {
        var arr = [];
        this._target.children.forEach(child => {
            if (child instanceof Sprite || child instanceof AbstractShape)
                arr.push(child);
        });
        return arr;
    }
}

export default Container;