export interface Datasource {
    query: (sql: string, params?: any[]) => Promise<any>
    run: (sql: string, params?: any[]) => Promise<void>
}
