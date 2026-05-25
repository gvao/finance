export interface Datasource {
    unitOfWork: <T = unknown>(middleware: (datasource: Datasource) => Promise<T>) => Promise<T>
    query: (sql: string, params?: any[]) => Promise<any>
    run: (sql: string, params?: any[]) => Promise<void>
}
