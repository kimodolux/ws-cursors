import WebSocket from "ws"
import http, { IncomingMessage } from "http"
import url from "url"
import { v4 as uuidv4 } from "uuid"
import {Position, UserPositions} from "./types"

const server = http.createServer()
const wsServer = new WebSocket.Server({ server })

const port = 8080
const connections: {[id: string]: WebSocket} = {}
const users: UserPositions = {} 

const handleMessage = async (bytes: Position, uuid: string) => {
  console.log(JSON.parse(bytes.toString()))
  const message = JSON.parse(bytes.toString())
  const user = users[uuid]
  console.log("user: ", user)
  if(message){
    user.state = message
  }
  broadcast()

  console.log(
    `${user.username} updated their updated state: ${JSON.stringify(
      user.state,
    )}`,
  )
}

const handleClose = async (uuid: string) => {
  console.log(`${users[uuid].username} disconnected`)
  delete connections[uuid]
  delete users[uuid]
  broadcast()
}

const broadcast = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid]
    const message = JSON.stringify(users)
    connection.send(message)
  })
}

wsServer.on("connection", async (connection: WebSocket, request: IncomingMessage) => {
  let uudi = ""
  if(request.url){
    let { username } = url.parse(request.url, true).query
    if(Array.isArray(username)) username = username[0]
    if(username){
      console.log(`${username} connected`)
      uudi = uuidv4()
      connections[uudi] = connection
      users[uudi] = {
        username,
        state: {x: 0, y: 0},
      }
    }
    else{
      console.log("No username in url")
    }
  }
  else{
    console.log("No url in request")
  }
  connection.on("message", async (message: Position) => await handleMessage(message, uudi))
  connection.on("close", async () => await handleClose(uudi))
})

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`)
})