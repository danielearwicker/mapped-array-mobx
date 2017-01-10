import { Atom, Lambda, autorunAsync } from "mobx";

export class MappedArray<Item, Model, Key extends string | number> {

    private atom: Atom;    
    private monitor: undefined | Lambda;
    private resultCache: Model[] = [];
    private modelCache: { [key: string]: Model } = {};

    constructor(
        private input: () => Item[],
        private getKey: (item: Item) => Key,
        private createModel: (item: Item) => Model,
        debugName?: string) {

        this.atom = new Atom(debugName || "MappedArray", () => this.wake(), () => this.sleep());        
    }

    private wake() {
        
        this.sleep();
        
        this.monitor = autorunAsync(() => {
            const input = this.input();

            const newMap: { [key: string]: Model } = {}
            const newResult: Model[] = [];

            for (const item of input) {
                const key = this.getKey(item);
                const model = this.modelCache[key as string] || 
                    (this.modelCache[key as string] = this.createModel(item));
                
                newMap[key as string] = model;
                newResult.push(model);
            }

            this.resultCache = newResult;
            this.modelCache = newMap;
            this.atom.reportChanged();
        });
    }

    private sleep() {
        
        const monitor = this.monitor;
        this.monitor = undefined;

        if (monitor) {
            monitor();
        }
    }

    get result() {
        this.atom.reportObserved();
        return this.resultCache;        
    }
}
