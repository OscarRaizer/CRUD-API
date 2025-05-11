import { createServer, IncomingMessage, ServerResponse } from "http";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import * as dotenv from "dotenv";

dotenv.config();
const PORT = process.env.APP_PORT;

interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

let users: User[] = [
  { id: uuidv4(), username: "John", age: 30, hobbies: ["reading", "gaming"] },
  { id: uuidv4(), username: "Jane", age: 25, hobbies: ["traveling"] },
];

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const { method, url } = req;
  const usersEndpoint = "/api/users";

  console.log(`Incoming request: ${method} ${url}`);

  try {
    if (!url?.startsWith(usersEndpoint)) {
      sendResponse(res, 404, { message: "Endpoint not found" });
      return;
    }

    const pathParts = url.split("/").filter((part) => part);
    const userId = pathParts[2];

    // GET /api/users - get all users
    if (method === "GET" && url === usersEndpoint) {
      sendResponse(res, 200, users);
      return;
    }

    // GET /api/users/{userId} - get user by id
    if (method === "GET" && pathParts.includes(userId)) {
      if (!uuidValidate(userId)) {
        sendResponse(res, 400, { message: "Invalid user ID" });
        return;
      }

      const user = users.find((u) => u.id === userId);
      if (user) {
        sendResponse(res, 200, user);
      } else {
        sendResponse(res, 404, { message: "User not found" });
      }
      return;
    }

    sendResponse(res, 404, { message: "Endpoint not found" });
  } catch (error) {
    console.error("Error processing request:", error);
    sendResponse(res, 500, { message: "Internal server error" });
  }
});

function sendResponse(res: ServerResponse, statusCode: number, data?: object) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(data ? JSON.stringify(data) : undefined);
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
