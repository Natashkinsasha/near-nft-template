

export class Counter{
    private value: number = 0;

    current(): number {
        return this.value;
    }

    increment(): void {
        this.value += 1;
    }

    decrement(): void {
        if(this.value > 0){
            this.value -= 1;
        }
        throw new Error('Counter: decrement overflow');
    }

    reset(): void {
        this.value = 0;
    }
}