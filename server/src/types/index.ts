export type User = {
    username: string,
    state: Position
}

export type Position = {
    x: number,
    y: number
}

export type UserPositions = {[id: string]: User}