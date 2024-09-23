

export interface DataRepository<T> {
    data: T[];
    setData(data: T[]): void;
    getData(): T[];
}