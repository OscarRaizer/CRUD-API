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

    // POST /api/users
    if (method === "POST" && url === usersEndpoint) {
      const parseBody = (req: IncomingMessage): Promise<any> => {
        return new Promise((resolve, reject) => {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error("Invalid JSON"));
            }
          });
        });
      };

      const validateUserBody = (body: any): body is Omit<User, "id"> => {
        return Boolean(
          body?.username &&
            typeof body.username === "string" &&
            typeof body?.age === "number" &&
            Array.isArray(body?.hobbies) &&
            body.hobbies.every((h: any) => typeof h === "string"),
        );
      };

      parseBody(req)
        .then((body) => {
          if (!validateUserBody(body)) {
            sendResponse(res, 400, { message: "Missing or invalid fields" });
            return;
          }

          const newUser: User = {
            id: uuidv4(),
            ...body,
          };

          users.push(newUser);
          sendResponse(res, 201, newUser);
        })
        .catch((error) => {
          sendResponse(res, 400, {
            message:
              error.message === "Invalid JSON"
                ? "Invalid JSON format"
                : "Invalid request body",
          });
        });

      return;
    }

    // DELETE /api/users/{userId}
    if (method === "DELETE" && pathParts.length === 3) {
      const userId = pathParts[2];

      // check uid valid
      if (!uuidValidate(userId)) {
        sendResponse(res, 400, { message: "Invalid user ID" });
        return;
      }

      // does uid exists
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        sendResponse(res, 404, { message: "User not found" });
        return;
      }

      // delete
      users.splice(userIndex, 1);
      sendResponse(res, 204);
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
